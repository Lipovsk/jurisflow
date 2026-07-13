[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$BackupPath,
    [string]$Database = 'jurisflow',
    [string]$Username = 'postgres',
    [Alias('Host')]
    [string]$DbHost = 'localhost',
    [ValidateRange(1, 65535)]
    [int]$Port = 5432,
    [string]$DocumentosPath,
    [switch]$CleanDatabase,
    [switch]$ConfirmRestore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-ZipDestination {
    param(
        [Parameter(Mandatory)][string]$ZipPath,
        [Parameter(Mandatory)][string]$DestinationPath
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $destinationPrefix = [System.IO.Path]::GetFullPath($DestinationPath).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    ) + [System.IO.Path]::DirectorySeparatorChar
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        foreach ($entry in $archive.Entries) {
            $entryDestination = [System.IO.Path]::GetFullPath((Join-Path $destinationPrefix $entry.FullName))
            if (-not $entryDestination.StartsWith($destinationPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "O ZIP contem um caminho inseguro e nao sera restaurado: $($entry.FullName)"
            }
        }
    } finally {
        $archive.Dispose()
    }
}

if ([string]::IsNullOrWhiteSpace($DocumentosPath)) {
    $DocumentosPath = if (-not [string]::IsNullOrWhiteSpace($env:JURISFLOW_DOCUMENTOS_STORAGE_PATH)) {
        $env:JURISFLOW_DOCUMENTOS_STORAGE_PATH
    } else {
        Join-Path $HOME '.jurisflow\documentos'
    }
}

if (-not (Test-Path -LiteralPath $BackupPath -PathType Container)) {
    throw "A pasta de backup nao existe: $BackupPath"
}

$backupPathFull = (Resolve-Path -LiteralPath $BackupPath).Path
$documentosPathFull = [System.IO.Path]::GetFullPath($DocumentosPath)
$databaseDirectory = Join-Path $backupPathFull 'database'
$documentosZipPath = Join-Path $backupPathFull 'documentos\documentos.zip'
$dumpFiles = @(Get-ChildItem -LiteralPath $databaseDirectory -Filter '*.dump' -File -ErrorAction SilentlyContinue)

if ($dumpFiles.Count -ne 1) {
    throw "Era esperado exatamente um arquivo .dump em '$databaseDirectory', mas foram encontrados $($dumpFiles.Count)."
}

$dumpPath = $dumpFiles[0].FullName
$pgRestore = Get-Command 'pg_restore' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $pgRestore) {
    throw 'pg_restore nao foi encontrado. Instale as ferramentas cliente do PostgreSQL e adicione a pasta bin ao PATH.'
}

$restoreArguments = @(
    '--exit-on-error',
    '--no-password',
    '--no-owner',
    '--no-privileges',
    "--host=$DbHost",
    "--port=$Port",
    "--username=$Username",
    "--dbname=$Database"
)
if ($CleanDatabase) {
    $restoreArguments += @('--clean', '--if-exists')
}
$restoreArguments += $dumpPath

$commandPreview = @($pgRestore.Source) + $restoreArguments | ForEach-Object {
    if ($_ -match '\s') { '"{0}"' -f ($_ -replace '"', '\"') } else { $_ }
}

Write-Host 'Arquivos validados:'
Write-Host "  Banco: $dumpPath"
if (Test-Path -LiteralPath $documentosZipPath -PathType Leaf) {
    Test-ZipDestination -ZipPath $documentosZipPath -DestinationPath $documentosPathFull
    Write-Host "  Documentos: $documentosZipPath"
} else {
    Write-Warning "O backup nao contem documentos.zip; somente o banco sera restaurado."
}
Write-Host "  Destino dos documentos: $documentosPathFull"
Write-Host "Comando do banco: $($commandPreview -join ' ')"

if ($CleanDatabase) {
    Write-Warning 'CleanDatabase esta ativo: objetos existentes no banco de destino poderao ser removidos antes da restauracao.'
} else {
    Write-Warning 'CleanDatabase nao esta ativo. A restauracao nao apagara o banco, mas pode falhar se ja existirem objetos conflitantes.'
}
Write-Warning 'Arquivos com o mesmo nome no destino de documentos poderao ser sobrescritos; outros arquivos nao serao apagados.'

if (-not $ConfirmRestore) {
    Write-Host 'Validacao concluida sem alterar dados. Revise os caminhos e execute novamente com -ConfirmRestore para habilitar a confirmacao interativa.'
    exit 0
}

$confirmation = Read-Host "Digite RESTAURAR para confirmar a restauracao do banco '$Database' e dos documentos"
if ($confirmation -cne 'RESTAURAR') {
    throw 'Restauracao cancelada: confirmacao explicita nao recebida.'
}

Write-Host "Restaurando o banco '$Database'..."
& $pgRestore.Source @restoreArguments
if ($LASTEXITCODE -ne 0) {
    throw "pg_restore terminou com codigo $LASTEXITCODE. Os documentos nao foram restaurados."
}

if (Test-Path -LiteralPath $documentosZipPath -PathType Leaf) {
    New-Item -ItemType Directory -Path $documentosPathFull -Force | Out-Null
    Write-Host "Restaurando documentos em '$documentosPathFull'..."
    Expand-Archive -LiteralPath $documentosZipPath -DestinationPath $documentosPathFull -Force
}

Write-Host 'Restauracao concluida. Valide o login, os registros e a abertura dos documentos antes de liberar o ambiente.'
