#!/usr/bin/env bash
# Render start command for the single-service Vayu deployment.
# Render sets $PORT automatically - gunicorn must bind to it.
set -o errexit

cd backend
exec gunicorn config.wsgi:application --bind 0.0.0.0:"$PORT"
