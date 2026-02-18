import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(os.getenv("DATA_DIR", "./data_room"))
DATA_DIR.mkdir(exist_ok=True)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
VECTOR_SEARCH_PORT = PORT + 1

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

EMBEDDER_TYPE = os.getenv("EMBEDDER_TYPE", "sentence-transformers")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_API_BASE = os.getenv("LLM_API_BASE", "")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 1000))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))

TOP_K = int(os.getenv("TOP_K", 5))
SEARCH_TYPE = os.getenv("SEARCH_TYPE", "hybrid")

CACHE_DIR = Path("./Cache")
CACHE_DIR.mkdir(exist_ok=True)

PATHWAY_LICENSE_KEY = os.getenv("PATHWAY_LICENSE_KEY", "")
if PATHWAY_LICENSE_KEY:
    os.environ["PATHWAY_LICENSE_KEY"] = PATHWAY_LICENSE_KEY
