@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Connecteur SwissPaints

REM ============================================================
REM   A MODIFIER UNE SEULE FOIS (les 2 lignes ci-dessous)
REM ============================================================

REM 1) Chemin du WD (la ou sont tes fichiers).
REM    Exemples :  \\WDMYCLOUD\Public   ou   W:\   ou   \\WDMYCLOUD\NomDuPartage
set "WD_ROOT=\\WDMYCLOUD\Public"

REM 2) Jeton secret : invente une longue chaine SANS espaces.
REM    Tu colleras EXACTEMENT la meme dans l'application.
set "CONNECTOR_TOKEN=CHANGE-MOI-par-une-longue-chaine-secrete-2024"

REM (ne pas toucher)
set "PORT=8787"
REM ============================================================

cd /d "%~dp0.."
set "LOG=%~dp0connecteur-log.txt"
echo. > "%LOG%"

echo ============================================================
echo   Connecteur SwissPaints - demarrage
echo ============================================================
echo.
echo (Un fichier "connecteur-log.txt" est cree a cote de ce
echo  fichier. En cas de probleme, envoie-le moi.)
echo.

REM --- 0) Verifs de reglage ---------------------------------
if "%CONNECTOR_TOKEN%"=="CHANGE-MOI-par-une-longue-chaine-secrete-2024" (
  echo [A FAIRE] Tu n'as pas encore change le JETON secret.
  echo           Clic droit sur ce fichier -^> Modifier, remplace la
  echo           ligne CONNECTOR_TOKEN par ta propre phrase secrete.
  echo [A FAIRE] Jeton non change >> "%LOG%"
  echo.
  pause
  exit /b
)

REM --- 1) Node.js installe ? --------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe.
  echo          Va sur https://nodejs.org , telecharge la version LTS,
  echo          installe-la, puis FERME et relance ce fichier.
  echo [ERREUR] node introuvable >> "%LOG%"
  echo.
  pause
  exit /b
)
for /f "delims=" %%v in ('node -v') do set "NODEV=%%v"
echo [OK] Node.js %NODEV%
echo [OK] Node.js %NODEV% >> "%LOG%"

REM --- 2) Le dossier WD est-il accessible ? -----------------
if not exist "%WD_ROOT%\" (
  echo [ERREUR] Le dossier WD n'est pas accessible :
  echo          %WD_ROOT%
  echo.
  echo   Verifie que :
  echo    - le PC est bien connecte au reseau du WD,
  echo    - le chemin est correct ^(Explorateur -^> Reseau -^> WDMYCLOUD^),
  echo    - tu as bien garde les deux barres obliques \\ au debut.
  echo   Astuce : ouvre l'Explorateur, va dans le dossier, clique dans la
  echo   barre d'adresse et recopie EXACTEMENT ce qui est affiche.
  echo [ERREUR] WD_ROOT inaccessible : %WD_ROOT% >> "%LOG%"
  echo.
  pause
  exit /b
)
echo [OK] Dossier WD accessible : %WD_ROOT%
echo [OK] WD_ROOT ok : %WD_ROOT% >> "%LOG%"

REM --- 3) Composants installes ? ----------------------------
if not exist node_modules (
  echo.
  echo Installation des composants ^(une seule fois, patiente 1-2 min^)...
  echo [..] npm install >> "%LOG%"
  call npm install >> "%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERREUR] L'installation des composants a echoue.
    echo          Verifie ta connexion Internet, puis relance ce fichier.
    echo          Details dans connecteur-log.txt
    echo [ERREUR] npm install a echoue >> "%LOG%"
    echo.
    pause
    exit /b
  )
  echo [OK] Composants installes.
  echo [OK] npm install fait >> "%LOG%"
)

REM --- 4) Demarrage -----------------------------------------
echo.
echo ============================================================
echo   Connecteur DEMARRE. Laisse cette fenetre OUVERTE.
echo   Dossier WD : %WD_ROOT%
echo   Test sur ce PC : http://localhost:%PORT%/api/health
echo   (Ferme la fenetre pour arreter le connecteur.)
echo ============================================================
echo.
echo [..] node src/server.js >> "%LOG%"
node src/server.js
echo.
echo [!] Le connecteur s'est arrete. Regarde le message ci-dessus.
echo [!] node s'est arrete (code %errorlevel%) >> "%LOG%"
pause
