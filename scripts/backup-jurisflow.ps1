[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [string]$Database = 'jurisflow',
    [string]$Username = 'postgres',
    [Alias('Host')]
    [string]$DbHost = 'localhost',
    [ValidateRange(1, 65535)]
    [int]$Port = 5432,
    [string]$BackupRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'backups'),
    [string]$DocumentosPath,
    [switch]$AllowMissingDocumentos
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Manifest {
    param(
        [Parameter(Mandatory)]$Content,
        [Parameter(Mandatory)][string]$Path
    )

    $json = $Content | ConvertTo-Json -Depth 6
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $json, $utf8NoBom)
}

if ([string]::IsNullOrWhiteSpace($DocumentosPath)) {
    $DocumentosPath = if (-not [string]::IsNullOrWhiteSpace($env:JURISFLOW_DOCUMENTOS_STORAGE_PATH)) {
        $env:JURISFLOW_DOCUMENTOS_STORAGE_PATH
    } else {
        Join-Path $HOME '.jurisflow\documentos'
    }
}

$backupRootFull = [System.IO.Path]::GetFullPath($BackupRoot)
$documentosPathFull = [System.IO.Path]::GetFullPath($DocumentosPath)
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backupPath = Join-Path $backupRootFull $timestamp
$databaseDirectory = Join-Path $backupPath 'database'
$documentosDirectory = Join-Path $backupPath 'documentos'
$dumpPath = Join-Path $databaseDirectory "$Database.dump"
$documentosZipPath = Join-Path $documentosDirectory 'documentos.zip'
$manifestPath = Join-Path $backupPath 'manifest.json'

$documentosPathPrefix = $documentosPathFull.TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar
) + [System.IO.Path]::DirectorySeparatorChar
if ($backupPath.Equals($documentosPathFull, [System.StringComparison]::OrdinalIgnoreCase) -or
    $backupPath.StartsWith($documentosPathPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'BackupRoot nao pode criar o backup dentro da pasta de documentos, pois isso causaria inclusao recursiva.'
}

if (Test-Path -LiteralPath $backupPath) {
    throw "A pasta de backup com este timestamp ja existe: $backupPath. Aguarde um segundo e tente novamente."
}
New-Item -ItemType Directory -Path $databaseDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $documentosDirectory -Force | Out-Null

$manifest = [ordered]@{
    dataHora = (Get-Date).ToString('o')
    banco = $Database
    host = $DbHost
    porta = $Port
    usuario = $Username
    caminhoBackup = $backupPath
    caminhoDocumentos = $documentosPathFull
    etapas = [ordered]@{
        banco = [ordered]@{ status = 'pendente'; arquivo = $dumpPath; mensagem = $null }
        documentos = [ordered]@{ status = 'pendente'; arquivo = $documentosZipPath; mensagem = $null }
    }
}
Write-Manifest -Content $manifest -Path $manifestPath

$pgDump = Get-Command 'pg_dump' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $pgDump) {
    $manifest.etapas.banco.status = 'falha'
    $manifest.etapas.banco.mensagem = 'pg_dump nao foi encontrado no PATH.'
    $manifest.etapas.documentos.status = 'nao_executado'
    $manifest.etapas.documentos.mensagem = 'Etapa nao executada porque pg_dump nao esta disponivel.'
    Write-Manifest -Content $manifest -Path $manifestPath
    throw "pg_dump nao foi encontrado. Instale as ferramentas cliente do PostgreSQL e adicione a pasta bin ao PATH. Use PGPASSWORD ou .pgpass para autenticar; a senha nunca deve ser passada como argumento. Manifesto: $manifestPath"
}

try {
    Write-Host "Gerando backup do banco '$Database' em '$dumpPath'..."
    $dumpArguments = @(
        '--format=custom',
        '--no-password',
        "--host=$DbHost",
        "--port=$Port",
        "--username=$Username",
        "--file=$dumpPath",
        $Database
    )
    & $pgDump.Source @dumpArguments
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump terminou com codigo $LASTEXITCODE."
    }
    $manifest.etapas.banco.status = 'sucesso'
    $manifest.etapas.banco.mensagem = 'Backup PostgreSQL criado no formato custom.'
    Write-Manifest -Content $manifest -Path $manifestPath
} catch {
    $manifest.etapas.banco.status = 'falha'
    $manifest.etapas.banco.mensagem = $_.Exception.Message
    $manifest.etapas.documentos.status = 'nao_executado'
    $manifest.etapas.documentos.mensagem = 'Etapa nao executada devido a falha no backup do banco.'
    Write-Manifest -Content $manifest -Path $manifestPath
    throw "Falha ao executar pg_dump. Confira conexao, usuario e PGPASSWORD/.pgpass. A senha nao foi registrada. Detalhe: $($_.Exception.Message) Manifesto: $manifestPath"
}

if (-not (Test-Path -LiteralPath $documentosPathFull -PathType Container)) {
    $mensagem = "A pasta de documentos nao existe: $documentosPathFull"
    if ($AllowMissingDocumentos) {
        $manifest.etapas.documentos.status = 'aviso'
        $manifest.etapas.documentos.arquivo = $null
        $manifest.etapas.documentos.mensagem = "$mensagem. Backup concluido sem documentos por solicitacao explicita."
        Write-Manifest -Content $manifest -Path $manifestPath
        Write-Warning $manifest.etapas.documentos.mensagem
        Write-Host "Backup concluido em: $backupPath"
        exit 0
    }

    $manifest.etapas.documentos.status = 'falha'
    $manifest.etapas.documentos.arquivo = $null
    $manifest.etapas.documentos.mensagem = "$mensagem. Use -AllowMissingDocumentos somente se o sistema ainda nao possuir documentos."
    Write-Manifest -Content $manifest -Path $manifestPath
    throw "$($manifest.etapas.documentos.mensagem) O backup do banco foi preservado em: $dumpPath"
}

try {
    Write-Host "Compactando documentos de '$documentosPathFull' em '$documentosZipPath'..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $documentosPathFull,
        $documentosZipPath,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )
    $manifest.etapas.documentos.status = 'sucesso'
    $manifest.etapas.documentos.mensagem = 'Pasta de documentos compactada.'
    Write-Manifest -Content $manifest -Path $manifestPath
} catch {
    $manifest.etapas.documentos.status = 'falha'
    $manifest.etapas.documentos.mensagem = $_.Exception.Message
    Write-Manifest -Content $manifest -Path $manifestPath
    throw "O banco foi salvo, mas houve falha ao compactar os documentos: $($_.Exception.Message) Manifesto: $manifestPath"
}

Write-Host "Backup concluido com sucesso em: $backupPath"
Write-Host "Manifesto: $manifestPath"
