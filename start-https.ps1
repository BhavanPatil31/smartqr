# PowerShell script to start SmartQR with HTTPS
Write-Host "🔒 Starting SmartQR with HTTPS..." -ForegroundColor Green
Write-Host ""

# Check if certificates exist
$certPath = "certs\localhost.pem"
$keyPath = "certs\localhost-key.pem"

if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
    Write-Host "❌ SSL certificates not found!" -ForegroundColor Red
    Write-Host "📋 Setting up HTTPS for the first time..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try to setup HTTPS
    try {
        npm run setup:https
        if ($LASTEXITCODE -ne 0) {
            throw "Setup failed"
        }
    }
    catch {
        Write-Host ""
        Write-Host "❌ HTTPS setup failed. Here are your options:" -ForegroundColor Red
        Write-Host ""
        Write-Host "Option 1: Install mkcert manually" -ForegroundColor Cyan
        Write-Host "  - Install Chocolatey: https://chocolatey.org/install"
        Write-Host "  - Run: choco install mkcert"
        Write-Host "  - Then run this script again"
        Write-Host ""
        Write-Host "Option 2: Use ngrok tunnel (instant HTTPS)" -ForegroundColor Cyan
        Write-Host "  - Run: npm run dev (in one terminal)"
        Write-Host "  - Run: npm run dev:tunnel (in another terminal)"
        Write-Host ""
        Write-Host "Option 3: Use Cloudflare tunnel" -ForegroundColor Cyan
        Write-Host "  - Run: npm run dev (in one terminal)"
        Write-Host "  - Run: npm run dev:cloudflare (in another terminal)"
        Write-Host ""
        
        $choice = Read-Host "Would you like to try ngrok tunnel now? (y/n)"
        if ($choice -eq "y" -or $choice -eq "Y") {
            Write-Host "🌐 Starting development server and ngrok tunnel..." -ForegroundColor Green
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
            Start-Sleep -Seconds 3
            npm run dev:tunnel
        }
        return
    }
}

Write-Host "✅ Starting HTTPS server..." -ForegroundColor Green
Write-Host "🌐 Your app will be available at: https://localhost:3000" -ForegroundColor Cyan
Write-Host "📱 For mobile testing, use your computer's IP address" -ForegroundColor Yellow
Write-Host ""

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object -First 1).IPAddress
if ($localIP) {
    Write-Host "📱 Mobile URL: https://$localIP:3000" -ForegroundColor Magenta
    Write-Host "   (Accept the security warning on mobile - it's safe for local development)" -ForegroundColor Gray
}

Write-Host ""
npm run dev:https
