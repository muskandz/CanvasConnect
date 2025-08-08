@echo off
echo Stopping test processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
del /q quick-test.test.js 2>nul
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cleanup complete
pause
