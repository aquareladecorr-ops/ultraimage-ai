"""Offline smoke tests for the worker's upload/complete and fail paths."""
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

_temp = tempfile.TemporaryDirectory(prefix="ultraimage-worker-test-")
os.environ["LOCALAPPDATA"] = _temp.name
worker_dir = Path(_temp.name) / "RetratoLocal" / "worker"
worker_dir.mkdir(parents=True)
(worker_dir / "config.json").write_text(
    json.dumps({"siteUrl": "https://ultraimageai.com", "workerId": "test-worker"}),
    encoding="utf-8",
)
os.environ["LOCAL_WORKER_TOKEN"] = "test-token-" + "x" * 32
spec = importlib.util.spec_from_file_location("worker", Path(__file__).with_name("agente.py"))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class WorkerSmokeTest(unittest.TestCase):
    def setUp(self):
        self.calls = []
        def fake_request(method, url, **kwargs):
            self.calls.append((method, url, kwargs))
            return SimpleNamespace(ok=True, status_code=200, iter_content=lambda _size: [b"private-photo"])
        worker.request_retry = fake_request
        worker.process = lambda _job, _content: (b"encoded-jpeg", (800, 1200), 1234)

    def test_success_downloads_uploads_and_completes(self):
        worker.handle({
            "jobId": "job-1", "claimToken": "claim-token-" + "a" * 24,
            "inputUrl": "https://storage.example/input?sig=private",
            "resultUploadUrl": "https://storage.example/upload?sig=private",
            "resultKey": "users/user-1/result/1.jpg", "maxDimension": 4000,
        })
        self.assertEqual([call[0] for call in self.calls], ["GET", "PUT", "POST"])
        self.assertEqual(self.calls[1][2]["data"], b"encoded-jpeg")
        completion = self.calls[2][2]["json"]
        self.assertEqual(completion["width"], 800)
        self.assertEqual(completion["height"], 1200)

    def test_processing_error_is_reported_without_internal_details(self):
        def fail(_job, _content):
            raise RuntimeError("C:\\private\\path\\sensitive.log")
        worker.process = fail
        worker.handle({
            "jobId": "job-2", "claimToken": "claim-token-" + "b" * 24,
            "inputUrl": "https://storage.example/input?sig=private",
            "resultUploadUrl": "https://storage.example/upload?sig=private",
            "resultKey": "users/user-1/result/2.jpg", "maxDimension": 4000,
        })
        failure = self.calls[-1][2]["json"]
        self.assertEqual(failure["code"], "LOCAL_WORKER_FAILED")
        self.assertNotIn("sensitive.log", failure["message"])


if __name__ == "__main__":
    unittest.main()
