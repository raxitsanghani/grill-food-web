@echo off
echo Starting Grilli Restaurant Servers...
echo.

echo Starting User Server (Port 4000)...
start "User Server" cmd /k "npm run start"

echo Starting Admin Server (Port 4001)...
start "Admin Server" cmd /k "npm run admin"

echo.
echo Both servers are starting...
echo User Panel: http://localhost:4000
echo Admin Panel: http://localhost:4001
echo.
echo Press any key to close this window...
pause > nul
