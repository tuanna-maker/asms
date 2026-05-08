#!/bin/sh
set -e

echo "Starting backend..."
exec node dist/main.js
