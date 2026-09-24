#!/bin/sh
set -e

echo "Aguardando o banco de dados..."
python manage.py wait_for_db

echo "Aplicando migrations..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  echo "Populando dados de demonstração..."
  python manage.py seed_demo
fi

echo "Iniciando gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
