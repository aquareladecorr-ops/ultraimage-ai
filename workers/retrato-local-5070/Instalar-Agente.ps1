$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'RetratoLocal\worker'
$engineRoot = Join-Path $env:LOCALAPPDATA 'RetratoLocal'
$runtimeFile = Join-Path $engineRoot 'runtime.json'
if (-not (Test-Path -LiteralPath $runtimeFile)) {
  throw 'Retrato Local não está instalado. Instale e abra o motor local primeiro.'
}
$runtime = Get-Content -LiteralPath $runtimeFile -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $runtime.python) -or -not (Test-Path -LiteralPath $runtime.cli)) {
  throw 'Não encontrei o Python e o motor SeedVR2 da instalação Retrato Local.'
}
$siteUrl = (Read-Host 'Endereço do site (ex.: https://ultraimageai.com)').Trim().TrimEnd('/')
if ($siteUrl -notmatch '^https://') { throw 'Informe o endereço HTTPS do site.' }
$secureToken = Read-Host -Prompt 'Cole o token LOCAL_WORKER_TOKEN configurado na Vercel' -AsSecureString
if ($secureToken.Length -lt 32) { throw 'O token precisa ter no mínimo 32 caracteres.' }
$tokenEncrypted = ConvertFrom-SecureString $secureToken
$workerId = "$env:COMPUTERNAME-$([guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'agente.py') -Destination (Join-Path $installDir 'agente.py') -Force
$config = [ordered]@{ siteUrl = $siteUrl; workerId = $workerId; tokenEncrypted = $tokenEncrypted }
$config | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $installDir 'config.json') -Encoding UTF8
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Iniciar-Agente.ps1') -Destination (Join-Path $installDir 'Iniciar-Agente.ps1') -Force
Write-Host "Agente instalado para $siteUrl." -ForegroundColor Green
Write-Host "Pasta: $installDir"
Write-Host 'Agora execute Iniciar-Agente.ps1. O token fica criptografado pelo Windows para este usuário.'
