Write-Host "Stopping all Node.js processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Cleaning build directory..."
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
}

Write-Host "Cleaning problematic files..."
if (Test-Path "quick-test.test.js") {
    Remove-Item -Force "quick-test.test.js"
}

if (Test-Path "test-debug.js") {
    Remove-Item -Force "test-debug.js"
}

if (Test-Path "cleanup.bat") {
    Remove-Item -Force "cleanup.bat"
}

if (Test-Path "fix-build.bat") {
    Remove-Item -Force "fix-build.bat"
}

Write-Host "Searching for files with # character..."
Get-ChildItem -Name "*#*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Found file with # character: $_"
    Remove-Item -Force $_
}

Write-Host "Clearing npm cache..."
npm cache clean --force

Write-Host "Attempting build..."
npm run build
