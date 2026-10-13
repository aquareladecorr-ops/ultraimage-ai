$ErrorActionPreference = 'Stop'
$base = Join-Path $env:LOCALAPPDATA 'RetratoLocal'
$worker = Join-Path $base 'worker'
$config = Get-Content -LiteralPath (Join-Path $worker 'config.json') -Raw | ConvertFrom-Json
$encrypted = ConvertTo-SecureString $config.tokenEncrypted
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($encrypted)
try { $env:LOCAL_WORKER_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
$runtime = Get-Content -LiteralPath (Join-Path $base 'runtime.json') -Raw | ConvertFrom-Json
& $runtime.python (Join-Path $worker 'agente.py')
Remove-Item Env:LOCAL_WORKER_TOKEN -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) { Write-Host "Agente encerrou com código $LASTEXITCODE." -ForegroundColor Red; Read-Host 'Pressione Enter para fechar' }
