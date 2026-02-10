# PowerShell script to restart server with MongoDB
Write-Host "Stopping any running Node.js processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting server with MongoDB connection..."
node start-with-mongodb.js
