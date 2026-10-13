#!/usr/bin/env python3
"""Worker outbound-only for UltraImage AI; photo inference stays on this PC."""
import io
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests
from PIL import Image, ImageOps

BASE = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "RetratoLocal"
WORKER_DIR = BASE / "worker"
CONFIG = json.loads((WORKER_DIR / "config.json").read_text(encoding="utf-8"))
SITE = CONFIG["siteUrl"].rstrip("/")
TOKEN = os.environ.get("LOCAL_WORKER_TOKEN", "")
WORKER_ID = CONFIG["workerId"]
MODEL = "seedvr2_ema_7b_sharp_fp8_e4m3fn_mixed_block35_fp16.safetensors"
MAX_INPUT_PIXELS = 1_200_000
MAX_UPLOAD_BYTES = 49 * 1024 * 1024
SESSION = requests.Session()
SESSION.headers.update({"Authorization": "Bearer " + TOKEN, "User-Agent": "UltraImage-Local-Worker/1.0"})


def log(message):
    print(time.strftime("[%H:%M:%S]"), message, flush=True)


def request_retry(method, url, **kwargs):
    last = None
    for attempt in range(6):
        try:
            response = requests.request(method, url, timeout=(20, 180), **kwargs)
            if response.status_code >= 500 or response.status_code in (408, 429):
                last = RuntimeError("serviço temporariamente indisponível (HTTP %s)" % response.status_code)
                time.sleep(min(2 ** attempt, 30))
                continue
            return response
        except requests.RequestException as exc:
            last = exc
            time.sleep(min(2 ** attempt, 30))
    raise RuntimeError("não foi possível comunicar com o serviço: %s" % last)


def engine_paths():
    runtime = json.loads((BASE / "runtime.json").read_text(encoding="utf-8"))
    python, cli, models = Path(runtime["python"]), Path(runtime["cli"]), Path(runtime["models"])
    if not python.is_file() or not cli.is_file():
        raise RuntimeError("O motor Retrato Local não foi instalado. Instale-o neste PC e tente novamente.")
    if not (models / MODEL).is_file():
        comfy_models = Path(r"C:\ComfyUI\models\SEEDVR2")
        if (comfy_models / MODEL).is_file():
            models = comfy_models
    if not (models / MODEL).is_file():
        raise RuntimeError("O modelo SeedVR2 7B Sharp ainda não está disponível. Abra Retrato Local e conclua o primeiro processamento.")
    return python, cli, models


def process(job, input_bytes):
    python, cli, models = engine_paths()
    with Image.open(io.BytesIO(input_bytes)) as opened:
        source = ImageOps.exif_transpose(opened).convert("RGB")
    if source.width * source.height > MAX_INPUT_PIXELS:
        raise RuntimeError("Foto acima do limite local de 1,2 megapixel.")
    if job.get("originalWidth") and job.get("originalHeight"):
        if (source.width, source.height) != (job["originalWidth"], job["originalHeight"]):
            log("Dimensões lidas diferem dos metadados; usando as dimensões reais da foto.")
    max_dimension = int(job["maxDimension"])
    scale = min(4.0, max_dimension / max(source.size))
    target = (max(1, round(source.width * scale)), max(1, round(source.height * scale)))
    if max(target) > 12000:
        raise RuntimeError("A saída ultrapassa 12.000 pixels no lado maior.")

    with tempfile.TemporaryDirectory(prefix="ultraimage-local-") as directory:
        temp = Path(directory)
        input_path, output_path, log_path = temp / "input.png", temp / "result.png", temp / "engine.log"
        source.save(input_path, format="PNG")
        command = [
            str(python), "-u", "-X", "utf8", str(cli), str(input_path), "--output", str(output_path),
            "--model_dir", str(models), "--dit_model", MODEL,
            "--resolution", str(min(target)), "--max_resolution", str(min(2648, max(target))),
            "--batch_size", "1", "--seed", "1337", "--input_noise_scale", "0",
            "--latent_noise_scale", "0", "--color_correction", "wavelet",
            "--dit_offload_device", "cpu", "--vae_offload_device", "cpu",
            "--tensor_offload_device", "cpu", "--blocks_to_swap", "12",
            "--vae_encode_tiled", "--vae_encode_tile_size", "512",
            "--vae_decode_tiled", "--vae_decode_tile_size", "512", "--attention_mode", "sdpa",
        ]
        # Release cached memory from the optional local Clarity UI if it is open.
        try:
            requests.post("http://127.0.0.1:8190/free", json={"unload_models": True, "free_memory": True}, timeout=5)
        except requests.RequestException:
            pass
        started = time.monotonic()
        log("Processando %s com SeedVR2 7B Sharp, ruído zero." % job["jobId"])
        with log_path.open("wb") as output:
            completed = subprocess.run(command, cwd=str(cli.parent), stdout=output, stderr=subprocess.STDOUT)
        if completed.returncode != 0 or not output_path.is_file():
            detail = log_path.read_text(encoding="utf-8", errors="replace")[-1200:]
            raise RuntimeError("SeedVR2 não concluiu o processamento. " + detail)
        with Image.open(output_path) as generated:
            result = generated.convert("RGB")
        if result.size != target:
            result = result.resize(target, Image.Resampling.LANCZOS)

        encoded = None
        for quality in (95, 92, 88, 85, 80, 75):
            buffer = io.BytesIO()
            result.save(buffer, format="JPEG", quality=quality, optimize=True, subsampling=0)
            encoded = buffer.getvalue()
            if len(encoded) <= MAX_UPLOAD_BYTES:
                break
        if encoded is None or len(encoded) > MAX_UPLOAD_BYTES:
            raise RuntimeError("O resultado excedeu o limite de armazenamento de 49 MB.")
        return encoded, result.size, int((time.monotonic() - started) * 1000)


def fail_job(job_id, claim_token, error):
    message = str(error).replace("\r", " ").replace("\n", " ")[:450]
    try:
        response = request_retry("POST", SITE + "/api/worker/fail", json={
            "jobId": job_id, "claimToken": claim_token,
            "code": "LOCAL_WORKER_FAILED", "message": message,
        }, headers={"Authorization": "Bearer " + TOKEN})
        if not response.ok:
            log("Não foi possível registrar a falha (HTTP %s); a reserva será recuperada após expirar a tarefa." % response.status_code)
    except Exception as exc:
        log("Falha de conexão ao registrar o erro; a tarefa poderá ser retomada automaticamente: %s" % exc)


def handle(job):
    job_id, claim = job["jobId"], job["claimToken"]
    try:
        response = request_retry("GET", job["inputUrl"], stream=True)
        if not response.ok:
            raise RuntimeError("Não foi possível baixar a foto original (HTTP %s)." % response.status_code)
        content = bytearray()
        for chunk in response.iter_content(1024 * 1024):
            content.extend(chunk)
            if len(content) > 50 * 1024 * 1024:
                raise RuntimeError("A foto original excede o limite de 50 MB.")
        started = time.monotonic()
        result, dimensions, elapsed_ms = process(job, bytes(content))
        response = request_retry("PUT", job["resultUploadUrl"], data=result,
                                 headers={"Content-Type": "image/jpeg", "x-upsert": "true"})
        if not response.ok:
            raise RuntimeError("Não foi possível enviar o resultado ao armazenamento (HTTP %s)." % response.status_code)
        body = {
            "jobId": job_id, "claimToken": claim, "resultKey": job["resultKey"],
            "width": dimensions[0], "height": dimensions[1],
            "processingTimeMs": max(elapsed_ms, int((time.monotonic() - started) * 1000)),
        }
        last_error = None
        for attempt in range(8):
            try:
                response = request_retry("POST", SITE + "/api/worker/complete", json=body,
                                         headers={"Authorization": "Bearer " + TOKEN})
                if response.ok:
                    log("Concluído %s — %sx%s." % (job_id, dimensions[0], dimensions[1]))
                    return
                last_error = RuntimeError("finalização recusada (HTTP %s)" % response.status_code)
                if response.status_code not in (409, 429) and response.status_code < 500:
                    break
            except Exception as exc:
                last_error = exc
            time.sleep(min(2 ** attempt, 60))
        raise RuntimeError("O arquivo foi enviado, mas o site não confirmou a conclusão: %s" % last_error)
    except Exception as exc:
        log("Falha em %s: %s" % (job_id, exc))
        # Keep internal paths and model logs in the local console only.
        fail_job(job_id, claim, "O processamento local não foi concluído. Confira a janela do agente neste PC.")


def main():
    if len(TOKEN) < 32:
        raise SystemExit("Token local não foi carregado. Execute Iniciar-Agente.ps1.")
    log("Agente ativo para %s. As fotos são processadas neste computador." % SITE)
    wait = 5
    while True:
        try:
            response = SESSION.post(SITE + "/api/worker/claim", json={"workerId": WORKER_ID}, timeout=(15, 45))
            if response.status_code == 204:
                wait = 8
                time.sleep(wait)
                continue
            if response.status_code >= 500:
                raise RuntimeError("fila indisponível (HTTP %s)" % response.status_code)
            response.raise_for_status()
            job = response.json()
            wait = 5
            handle(job)
        except KeyboardInterrupt:
            log("Agente encerrado pelo usuário.")
            return
        except Exception as exc:
            log("Conexão/fila: %s. Tentando novamente em %ss." % (exc, wait))
            time.sleep(wait)
            wait = min(wait * 2, 60)


if __name__ == "__main__":
    main()
