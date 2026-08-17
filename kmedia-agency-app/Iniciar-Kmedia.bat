@echo off
setlocal
title Kmedia Agency
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Node.js instalado en esta computadora.
  echo.
  echo 1. Ve a https://nodejs.org
  echo 2. Descarga e instala la version "LTS" (recomendada)
  echo 3. Vuelve a hacer doble clic en Iniciar-Kmedia.bat
  echo.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo.
  echo Falta el archivo .env.local con las credenciales de Supabase.
  echo.
  echo 1. Copia el archivo .env.example y renombra la copia a .env.local
  echo 2. Abrelo y completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
  echo    con los datos de tu proyecto de Supabase
  echo 3. Vuelve a hacer doble clic en Iniciar-Kmedia.bat
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando la aplicacion por primera vez, esto puede tardar unos minutos...
  echo No cierres esta ventana.
  call npm install
  if errorlevel 1 (
    echo.
    echo Ocurrio un error instalando las dependencias. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
)

if not exist ".next" (
  echo Preparando la aplicacion por primera vez, esto puede tardar unos minutos...
  call npm run build
  if errorlevel 1 (
    echo.
    echo Ocurrio un error preparando la aplicacion. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
)

echo.
echo Kmedia Agency esta iniciando...
echo Se abrira el navegador automaticamente en unos segundos.
echo.
echo IMPORTANTE: no cierres esta ventana mientras uses la aplicacion.
echo Para salir, cierra esta ventana o presiona Ctrl+C.
echo.

start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm start
