Write-Host "Starting Grilli Restaurant Admin Panel System..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start both the User Server (port 4000) and Admin Server (port 4001)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""

# Start User Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run start" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Admin Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run admin" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "User Website: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:4001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Admin Credentials: admin / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
