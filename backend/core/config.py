"""
Configuration loader for the RAG system.

Loads environment variables from .env and sets defaults for:
- Document storage paths
- API keys (OpenRouter, OpenAI, etc.)
- Embedding configuration
- LLM settings
- Processing parameters
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Data and cache directories
DATA_DIR = Path(os.getenv("DATA_DIR", "./data_room"))
DATA_DIR.mkdir(exist_ok=True)

CACHE_DIR = Path("./Cache")
CACHE_DIR.mkdir(exist_ok=True)

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")  # Use 0.0.0.0 for external access, 127.0.0.1 for local only
PORT = int(os.getenv("PORT", 8000))
VECTOR_SEARCH_PORT = PORT + 1

# API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Embedding configuration
# sentence-transformers runs locally (free, uses RAM)
# openai uses API (costs money, faster for large batches)
EMBEDDER_TYPE = os.getenv("EMBEDDER_TYPE", "sentence-transformers")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# LLM configuration
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_API_BASE = os.getenv("LLM_API_BASE", "")  # Optional: for OpenRouter or local models

# Document processing
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 1000))  # Max tokens per chunk
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))  # Overlap between chunks

# Retrieval configuration
TOP_K = int(os.getenv("TOP_K", 5))  # Number of chunks to retrieve
SEARCH_TYPE = os.getenv("SEARCH_TYPE", "hybrid")

# Pathway license (optional, for enterprise features)
PATHWAY_LICENSE_KEY = os.getenv("PATHWAY_LICENSE_KEY", "")
if PATHWAY_LICENSE_KEY:
    os.environ["PATHWAY_LICENSE_KEY"] = PATHWAY_LICENSE_KEY

# Pathway server configuration (backwards compatibility)
SERVER_HOST = HOST
SERVER_PORT = PORT
DATA_DIRECTORY = str(DATA_DIR)

# Pathway persistence and caching
PATHWAY_PERSISTENCE_CONFIG = {
    "persistence_mode": "persisting",  # or "speedrun" mode for no persistence
}

CACHE_STRATEGY_CONFIG = {
    "cache_folder": str(CACHE_DIR),
    "max_retries": 6,
    "retry_count": 6
}

