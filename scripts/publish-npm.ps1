# One-shot npm publish. Token: $DSH_HOME/secrets/npm-token.txt or NPM_TOKEN.
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent
$node = Join-Path $env:DSH_NODE_DIR 'node.exe'
$npmCli = Join-Path $env:DSH_NODE_DIR 'node_modules\npm\bin\npm-cli.js'
$token = $env:NPM_TOKEN
if (-not $token) { $token = (Get-Content (Join-Path $env:DSH_HOME 'secrets\npm-token.txt') -Raw).Trim() }
if (-not $token) { throw 'npm token missing' }
$npmrc = Join-Path $root '.npmrc'
try {
  Set-Content -Path $npmrc -Value ("//registry.npmjs.org/:_authToken=" + $token) -Encoding ascii
  & $node $npmCli publish --ignore-scripts --cache (Join-Path $root '.npm-cache') 2>&1
  if ($LASTEXITCODE -ne 0) { throw "npm publish failed (exit $LASTEXITCODE)" }
} finally {
  Remove-Item -Force $npmrc -ErrorAction SilentlyContinue
}
