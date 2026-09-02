param(
    [string]$OutputDir = (Join-Path $PSScriptRoot "..\backups"),
    [string]$LocalDbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }),
    [string]$LocalDbPort = $(if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }),
    [string]$LocalDbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "knmp" }),
    [string]$LocalDbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "secretpassword" }),
    [string]$LocalDbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "knmp_db" }),
    [string]$DockerContainer = "knmp_postgres"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = Join-Path $OutputDir "knmp_local_${timestamp}.dump"
$metaFile = Join-Path $OutputDir "knmp_local_${timestamp}.metadata.txt"

if (Require-Command "pg_dump") {
    Write-Host "Exporting local database with pg_dump..."
    $previousPassword = $env:PGPASSWORD
    $env:PGPASSWORD = $LocalDbPassword
    try {
        pg_dump `
            --host $LocalDbHost `
            --port $LocalDbPort `
            --username $LocalDbUser `
            --dbname $LocalDbName `
            --format custom `
            --no-owner `
            --no-privileges `
            --file $dumpFile
    }
    finally {
        $env:PGPASSWORD = $previousPassword
    }
}
else {
    if (-not (Require-Command "docker")) {
        throw "pg_dump and docker are not available. Install PostgreSQL client tools or Docker first."
    }

    $containerExists = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $DockerContainer }
    if (-not $containerExists) {
        throw "pg_dump is not available and Docker container '$DockerContainer' is not running."
    }

    Write-Host "pg_dump not found on host. Exporting local database from Docker container '$DockerContainer'..."
    $containerDump = "/tmp/knmp_local_${timestamp}.dump"
    docker exec $DockerContainer pg_dump `
        --username $LocalDbUser `
        --dbname $LocalDbName `
        --format custom `
        --no-owner `
        --no-privileges `
        --file $containerDump
    docker cp "${DockerContainer}:${containerDump}" $dumpFile
    docker exec $DockerContainer rm -f $containerDump | Out-Null
}

@"
Generated At : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Source Host  : $LocalDbHost
Source Port  : $LocalDbPort
Source User  : $LocalDbUser
Source DB    : $LocalDbName
Dump File    : $dumpFile
Restore Tool : pg_restore --clean --if-exists --no-owner --no-privileges
"@ | Set-Content -Path $metaFile -Encoding UTF8

Write-Host ""
Write-Host "Local database export completed:"
Write-Host "  Dump     : $dumpFile"
Write-Host "  Metadata : $metaFile"
