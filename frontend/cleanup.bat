@echo off
echo Cleaning up temporary test files...
if exist "quick-test.test.js" del /f "quick-test.test.js"
if exist "restart-tests.bat" del /f "restart-tests.bat"  
if exist "test-debug.js" del /f "test-debug.js"
if exist "quick-test.txt" del /f "quick-test.txt"
echo Cleanup complete!
echo Running clean tests...
npm test
