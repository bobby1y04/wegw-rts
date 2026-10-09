#!/bin/sh
set -eu

if [ "$#" -eq 0 ] || [ "$1" = "app" ]; then
  : "${DATABASE_URL:?DATABASE_URL muss gesetzt sein}"
  : "${OLLAMA_BASE_URL:?OLLAMA_BASE_URL muss gesetzt sein}"
  : "${OLLAMA_MODEL:?OLLAMA_MODEL muss gesetzt sein}"
  set -- node server.js
fi

exec "$@"
