@echo off
echo Cleaning build artifacts and temp files...

REM Stop any running processes
taskkill /f /im node.exe 2>nul

REM Clean npm cache and build artifacts
if exist "dist" rmdir /s /q "dist"
if exist ".vite" rmdir /s /q ".vite"
if exist "node_modules/.cache" rmdir /s /q "node_modules/.cache"

REM Remove problematic test files
if exist "quick-test.test.js" del /f "quick-test.test.js"
if exist "test-debug.js" del /f "test-debug.js"
if exist "restart-tests.bat" del /f "restart-tests.bat"
if exist "quick-test.txt" del /f "quick-test.txt"

REM Remove any files with # in the name
for /f "delims=" %%i in ('dir /b *#* 2^>nul') do (
    echo Removing file with # character: %%i
    del /f "%%i"
)

REM Clear npm cache
npm cache clean --force

echo Cleanup complete!
echo Attempting build...
npm run build
