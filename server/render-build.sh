#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Building Frontend ---"
# If you want to build frontend on the same service (optional)
# cd ../client && npm install && npm run build && cd ../server

echo "--- Installing Node Dependencies ---"
npm install

echo "--- Installing Python Dependencies ---"
# Ensure pip, setuptools, and wheel are up to date
python3 -m pip install --upgrade pip setuptools wheel

# Install requirements from the python directory
python3 -m pip install -r ../python/requirements.txt

echo "--- Build Complete ---"
