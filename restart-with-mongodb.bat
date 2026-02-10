@echo off
echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting server with MongoDB connection...
node start-with-mongodb.js
