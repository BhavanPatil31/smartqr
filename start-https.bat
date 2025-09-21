@echo off
echo 🔒 Starting SmartQR with HTTPS...
echo.

REM Check if certificates exist
if not exist "certs\localhost.pem" (
    echo ❌ SSL certificates not found!
    echo 📋 Setting up HTTPS for the first time...
    echo.
    call npm run setup:https
    if errorlevel 1 (
        echo.
        echo ❌ HTTPS setup failed. Using tunnel instead...
        echo 🌐 Starting ngrok tunnel...
        start cmd /k "npm run dev"
        timeout /t 3 /nobreak >nul
        npm run dev:tunnel
        pause
        exit /b
    )
)

echo ✅ Starting HTTPS server...
npm run dev:https
pause
