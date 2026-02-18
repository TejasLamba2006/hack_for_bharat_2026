#!/bin/bash

if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    exit 1
fi

if [ -d .venv-wsl ]; then
    source .venv-wsl/bin/activate
fi

pip install -r requirements.txt

python3 -m backend.services.integrated_rag
