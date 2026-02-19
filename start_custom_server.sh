#!/bin/bash

# Start Custom Pathway REST Server
# Implements frontend-compatible endpoints

set -e

echo "======================================"
echo "Starting Custom Pathway REST Server"
echo "======================================"

# Activate virtual environment if it exists
if [ -d ".venv-wsl" ]; then
    source .venv-wsl/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env file with your configuration."
    exit 1
fi

# Run the custom server
python3 -m backend.services.custom_rest_server
