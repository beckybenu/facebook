@echo off
chcp 65001 >nul
title Acces HTTPS (Cloudflare Tunnel) - SwissPaints

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERREUR] cloudflared n'est pas installe.
  echo Installe-le en ouvrant "PowerShell" et en tapant :
  echo     winget install --id Cloudflare.cloudflared
  echo puis relance ce fichier.
  echo.
  pause
  exit /b
)

echo.
echo ============================================================
echo   Ouverture d'un acces HTTPS vers le connecteur (port 8787).
echo   Laisse cette fenetre OUVERTE.
echo.
echo   Repere la ligne du type :
echo       https://xxxx-xxxx.trycloudflare.com
echo   -> c'est l'ADRESSE a coller dans l'application.
echo ============================================================
echo.
cloudflared tunnel --url http://localhost:8787
pause
