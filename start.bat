@echo off
REM Document Q&A System - Startup Script (Windows)
REM This script starts the backend RAG server

echo =========================================
echo Document Q&A System
echo =========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Warning: .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Created .env file. Please edit it and add your API keys.
    echo.
    pause
)

REM Check Python
echo Checking Python installation...
python --version
if errorlevel 1 (
    echo Python not found! Please install Python 3.9 or later.
    pause
    exit /b 1
)
echo Python found
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Virtual environment activated
echo.

REM Install dependencies
echo Installing Python dependencies...
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo Dependencies installed
echo.

REM Create data directory
if not exist data_room mkdir data_room
echo data_room directory ready
echo.

REM Start backend server
echo =========================================
echo Starting Pathway RAG Server...
echo =========================================
echo.
echo Backend will run on http://localhost:9000
echo.
echo Place your documents in: .\data_room\
echo API endpoints available at: /v1/pw_ai_answer, /v1/retrieve, etc.
echo.
echo Press Ctrl+C to stop the server
echo.

python -m backend.services.pathway_rag_server
