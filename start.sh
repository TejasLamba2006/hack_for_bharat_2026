#!/bin/bash

# Document Q&A System - Startup Script
# This script starts both the backend RAG server and the frontend UI

set -e  # Exit on error

echo "========================================="
echo "Document Q&A System"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it and add your API keys."
    echo ""
    read -p "Press Enter once you've configured .env..."
fi

# Check for uv
echo "Checking for uv..."
if ! command -v uv >/dev/null 2>&1; then
    echo "uv not found. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi
echo "✅ uv is ready"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    uv venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
    . venv/bin/activate
else
    echo "❌ Error: Virtual environment activation script not found."
    exit 1
fi
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing Python dependencies..."
uv pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create data directory if it doesn't exist
mkdir -p data_room
echo "✅ data_room directory ready"
echo ""

# Start backend server
echo "========================================="
echo "Starting Pathway RAG Server..."
echo "========================================="
echo ""
echo "Backend will run on http://localhost:9000"
echo ""
echo "📁 Place your documents in: ./data_room/"
echo "📊 API endpoints available at: /v1/pw_ai_answer, /v1/retrieve, etc."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python -m backend.services.pathway_rag_server
