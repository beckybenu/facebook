@echo off
chcp 65001 >nul
title Connecteur SwissPaints

REM ============================================================
REM   A MODIFIER UNE SEULE FOIS (les 2 lignes ci-dessous)
REM ============================================================

REM 1) Chemin du WD (la ou sont tes fichiers).
REM    Exemples :  \\WDMYCLOUD\Public   ou   W:\   ou   \\WDMYCLOUD\NomDuPartage
set WD_ROOT=\\WDMYCLOUD\Public

REM 2) Jeton secret : invente une longue chaine SANS espaces.
REM    Tu colleras EXACTEMENT la meme dans l'application.
set CONNECTOR_TOKEN=CHANGE-MOI-par-une-longue-chaine-secrete-2024

REM (ne pas toucher)
set PORT=8787
REM ============================================================

cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERREUR] Node.js n'est pas installe.
  echo Installe-le depuis https://nodejs.org (version LTS), puis relance ce fichier.
  echo.
  pause
  exit /b
)

if not exist node_modules (
  echo Installation des composants ^(une seule fois, patiente 1-2 min^)...
  call npm install
)

echo.
echo ============================================================
echo   Connecteur DEMARRE. Laisse cette fenetre OUVERTE.
echo   Dossier WD : %WD_ROOT%
echo   (Ferme la fenetre pour arreter le connecteur.)
echo ============================================================
echo.
node src/server.js
pause
