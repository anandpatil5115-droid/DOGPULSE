@echo off
echo Starting DocAI Application...

:: Start Backend
start "DocAI Backend" cmd /c "cd backend && .\mvnw.cmd spring-boot:run"

:: Start Frontend
start "DocAI Frontend" cmd /c "cd frontend && npm run dev"

echo ==========================================
echo Servers are booting up in separate windows.
echo Open http://localhost:5173 in your browser.
echo ==========================================
pause
