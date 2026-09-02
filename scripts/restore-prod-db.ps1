param(
    [string]$DumpFile = "",
    [string]$BackupDir = (Join-Path $PSScriptRoot "..\backups"),
    [switch]$UseDockerClient,
    [switch]$SkipProductionBackup
)

$ErrorActionPreference = "Stop"

function Require-Env {
    param([string]$Name)
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Missing required environment variable: $Name"
    }
    return $value
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

$prodHost = Require-Env "PROD_DB_HOST"
$prodUser = Require-Env "PROD_DB_USER"
$prodPassword = Require-Env "PROD_DB_PASSWORD"
$prodName = Require-Env "PROD_DB_NAME"
$prodPort = if ($env:PROD_DB_PORT) { $env:PROD_DB_PORT } else { "5432" }
$confirm = Require-Env "CONFIRM_PROD_WIPE"

if ($confirm -ne "YES_DELETE_PRODUCTION_DATA") {
    throw "Refusing to continue. Set CONFIRM_PROD_WIPE=YES_DELETE_PRODUCTION_DATA to confirm production wipe."
}

if ($prodHost -match "^(localhost|127\.0\.0\.1|::1)$") {
    throw "PROD_DB_HOST points to a local address. Refusing to treat local database as production."
}

if ([string]::IsNullOrWhiteSpace($DumpFile)) {
    $latestDump = Get-ChildItem -Path $BackupDir -Filter "knmp_local_*.dump" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $latestDump) {
        throw "DumpFile is empty and no knmp_local_*.dump file was found in $BackupDir"
    }
    $DumpFile = $latestDump.FullName
}

$resolvedDump = Resolve-Path $DumpFile
$dumpDir = Split-Path $resolvedDump -Parent
$dumpName = Split-Path $resolvedDump -Leaf
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$prodBackupFile = Join-Path $BackupDir "prod_backup_before_restore_${timestamp}.dump"

Write-Host "Production target:"
Write-Host "  Host : $prodHost"
Write-Host "  Port : $prodPort"
Write-Host "  DB   : $prodName"
Write-Host "  User : $prodUser"
Write-Host "  Dump : $resolvedDump"
Write-Host ""

if ($UseDockerClient) {
    Require-Command "docker"
    $dumpMount = "type=bind,source=$dumpDir,target=/backup"
    $backupMount = "type=bind,source=$((Resolve-Path $BackupDir).Path),target=/prod-backup"

    if (-not $SkipProductionBackup) {
        Write-Host "Creating production safety backup..."
        docker run --rm `
            --mount $backupMount `
            -e "PGPASSWORD=$prodPassword" `
            postgres:16-alpine `
            pg_dump --host $prodHost --port $prodPort --username $prodUser --dbname $prodName `
            --format custom --no-owner --no-privileges `
            --file "/prod-backup/$(Split-Path $prodBackupFile -Leaf)"
    }

    Write-Host "Terminating active production DB sessions..."
    docker run --rm `
        -e "PGPASSWORD=$prodPassword" `
        postgres:16-alpine `
        psql --host $prodHost --port $prodPort --username $prodUser --dbname $prodName `
        --command "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();"

    Write-Host "Restoring local dump into production. This will drop and recreate dumped objects..."
    docker run --rm `
        --mount $dumpMount `
        -e "PGPASSWORD=$prodPassword" `
        postgres:16-alpine `
        pg_restore --host $prodHost --port $prodPort --username $prodUser --dbname $prodName `
        --clean --if-exists --no-owner --no-privileges --single-transaction --exit-on-error `
        "/backup/$dumpName"
}
else {
    Require-Command "pg_dump"
    Require-Command "pg_restore"
    Require-Command "psql"

    $previousPassword = $env:PGPASSWORD
    $env:PGPASSWORD = $prodPassword
    try {
        if (-not $SkipProductionBackup) {
            Write-Host "Creating production safety backup..."
            pg_dump `
                --host $prodHost `
                --port $prodPort `
                --username $prodUser `
                --dbname $prodName `
                --format custom `
                --no-owner `
                --no-privileges `
                --file $prodBackupFile
        }

        Write-Host "Terminating active production DB sessions..."
        psql `
            --host $prodHost `
            --port $prodPort `
            --username $prodUser `
            --dbname $prodName `
            --command "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();"

        Write-Host "Restoring local dump into production. This will drop and recreate dumped objects..."
        pg_restore `
            --host $prodHost `
            --port $prodPort `
            --username $prodUser `
            --dbname $prodName `
            --clean `
            --if-exists `
            --no-owner `
            --no-privileges `
            --single-transaction `
            --exit-on-error `
            $resolvedDump
    }
    finally {
        $env:PGPASSWORD = $previousPassword
    }
}

Write-Host ""
Write-Host "Production restore completed."
if (-not $SkipProductionBackup) {
    Write-Host "Safety backup: $prodBackupFile"
}
