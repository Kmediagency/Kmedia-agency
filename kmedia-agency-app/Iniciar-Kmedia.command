#!/bin/bash
cd "$(dirname "$0")"
echo -en "\033]0;Kmedia Agency\007"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "No se encontró Node.js instalado en esta computadora."
  echo ""
  echo "1. Ve a https://nodejs.org"
  echo "2. Descarga e instala la versión \"LTS\" (recomendada)"
  echo "3. Vuelve a hacer doble clic en Iniciar-Kmedia.command"
  echo ""
  read -p "Presiona Enter para cerrar..."
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo ""
  echo "Falta el archivo .env.local con las credenciales de Supabase."
  echo ""
  echo "1. Copia el archivo .env.example y renombra la copia a .env.local"
  echo "2. Ábrelo y completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   con los datos de tu proyecto de Supabase"
  echo "3. Vuelve a hacer doble clic en Iniciar-Kmedia.command"
  echo ""
  read -p "Presiona Enter para cerrar..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Instalando la aplicación por primera vez, esto puede tardar unos minutos..."
  echo "No cierres esta ventana."
  npm install || { echo ""; echo "Ocurrió un error instalando las dependencias."; read -p "Presiona Enter para cerrar..."; exit 1; }
fi

if [ ! -d ".next" ]; then
  echo "Preparando la aplicación por primera vez, esto puede tardar unos minutos..."
  npm run build || { echo ""; echo "Ocurrió un error preparando la aplicación."; read -p "Presiona Enter para cerrar..."; exit 1; }
fi

echo ""
echo "Kmedia Agency está iniciando..."
echo "Se abrirá el navegador automáticamente en unos segundos."
echo ""
echo "IMPORTANTE: no cierres esta ventana mientras uses la aplicación."
echo "Para salir, cierra esta ventana o presiona Ctrl+C."
echo ""

(sleep 3 && open http://localhost:3000) &
npm start
