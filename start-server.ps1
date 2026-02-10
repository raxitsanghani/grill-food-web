# Grilli Restaurant Server Startup Script
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "⏳ Waiting for processes to stop..." -ForegroundColor Yellow
Start-Sleep 3

Write-Host "🔍 Checking port 5000..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr :5000
if ($portCheck) {
    Write-Host "⚠️  Port 5000 still in use, killing processes..." -ForegroundColor Red
    $processes = netstat -ano | findstr :5000 | ForEach-Object { ($_ -split '\s+')[4] } | Sort-Object -Unique
    foreach ($pid in $processes) {
        if ($pid -and $pid -ne "0") {
            try {
                taskkill /PID $pid /F
                Write-Host "✅ Killed process $pid" -ForegroundColor Green
            } catch {
                Write-Host "❌ Could not kill process $pid" -ForegroundColor Red
            }
        }
    }
    Start-Sleep 2
}

Write-Host "🚀 Starting server on port 5000..." -ForegroundColor Green
npm run dev
