#!/usr/bin/env bash
# Render build script for the single-service Vayu deployment.
#
# This builds the React frontend first, then installs the Django backend's
# dependencies and prepares it - all as ONE Render Web Service (no separate
# static site / second service needed). Render Dashboard settings:
#   Root Directory : (leave blank - repo root)
#   Build Command  : ./build.sh
#   Start Command  : ./start.sh
set -o errexit

echo "----- Building frontend (React + Vite) -----"
cd frontend
npm ci
npm run build
cd ..

echo "----- Installing backend dependencies (Django) -----"
cd backend
pip install -r requirements.txt

echo "----- Collecting Django static files -----"
python manage.py collectstatic --no-input

echo "----- Running database migrations -----"
python manage.py migrate

cd ..
echo "----- Build complete -----"
