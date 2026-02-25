# Hack For Green Bharat 2026 - Document Q&A System

A real-time document question-answering system built for the Hack For Green Bharat 2026 hackathon. Drop documents into a folder, ask questions about them in plain English, get answers with source citations.

## What this does

Upload PDFs, Word docs, text files, spreadsheets, or images with text. Ask questions like "What is this document about?" or "Explain section 3" and get answers pulled directly from your documents, with references to where the answer came from.

The system watches the document folder and automatically indexes new files as you add them. No manual rebuild needed.

## Installation

Requires Python 3.9 or newer.

```bash
pip install -r requirements.txt
```

This installs:
- `pathway` - The framework that handles document monitoring and real-time indexing
- `sentence-transformers` - Creates embeddings locally without API calls
- `openai` - For talking to LLM APIs
- `python-dotenv` - Loads environment variables from .env

## Configuration

Create a `.env` file in the project root:

```env
# Required: Get your API key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Which AI model to use
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1

# Where your documents live
DATA_DIR=./data_room

# Server port
PORT=8000

# Embedding configuration
EMBEDDER_TYPE=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Processing settings
CHUNK_SIZE=1000
TOP_K=5
```

Notes on embeddings: `sentence-transformers` runs on your machine for free but uses RAM. Switch to `EMBEDDER_TYPE=openai` if you want cloud-based embeddings (requires OpenAI API key, costs money).

DeepSeek v3.1 costs $0.14 per million tokens through OpenRouter, which is cheap. You can use other models by changing `LLM_MODEL`.

## Add documents

Put files in the `data_room/` folder:

```bash
mkdir -p data_room
cp ~/Documents/my-research.pdf data_room/
```

Supported formats: PDF, DOCX, XLSX, TXT, CSV, MD, and images (with OCR).

## Start the service

Linux/Mac/WSL:
```bash
bash start.sh
```

Windows:
```bash
start.bat
```

Or directly:
```bash
python3 -m backend.services.integrated_rag
```

First startup takes 10-60 seconds while it loads the embedding model and scans documents. Subsequent starts are faster if you have the cache.

The service runs on `http://localhost:8000` and stays running until you stop it.

## API usage

All endpoints use POST requests (this is a Pathway framework design decision, even for reads).

### Ask a question

```bash
curl -X POST http://localhost:8000/v1/pw_ai_answer \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the main topics in these documents?"}'
```

Response:
```json
{
  "answer": "The documents cover...",
  "sources": [
    {"path": "data_room/file.pdf", "chunk_id": 3}
  ]
}
```

### Search without LLM

Retrieve relevant chunks without generating an answer:

```bash
curl -X POST http://localhost:8000/v1/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "climate change", "k": 5}'
```

### List documents

```bash
curl -X POST http://localhost:8000/v1/pw_list_documents \
  -H "Content-Type: application/json" \
  -d '{"keys": ["path", "modified_at"]}'
```

### Summarize text

```bash
curl -X POST http://localhost:8000/v1/pw_ai_summary \
  -H "Content-Type: application/json" \
  -d '{"text_list": ["Text to summarize..."]}'
```

## Available endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/pw_ai_answer` | POST | Ask a question, get an AI answer |
| `/v1/retrieve` | POST | Search for relevant chunks |
| `/v1/pw_list_documents` | POST | List indexed files |
| `/v1/pw_ai_summary` | POST | Summarize text |
| `/v1/upload` | POST | Upload files to data_room |
| `/v1/delete` | POST | Delete files from data_room |
| `/v1/files` | GET | List files in data_room |
| `/health` | GET | Health check |
Documents in folder → File monitor detects changes
                   → Parser extracts text (PDFs, Word, etc.)
                   → Splitter breaks text into ~1000 token chunks
                   → Embedder converts chunks to vectors
                   → Vector store indexes them (FAISS)
                   → REST API serves queries
                   → RAG retrieves relevant chunks
                   → LLM generates answer
```

Tech stack:
- Pathway framework for real-time processing
- FAISS for vector search
- SentenceTransformers for local embeddings
- DeepSeek v3.1 LLM via OpenRouter
- Rust engine under the hood (Pathway compiles Python to Rust for performance)

## Project structure

```
hack_for_bharat_2026/
├── backend/
│   ├── core/
│   │   └── config.py              # Configuration
│   └── services/
│       └── integrated_rag.py      # Main service
├── frontend/                       # Web UI (Next.js)
├── data_room/                      # Put documents here
├── Cache/                          # Auto-generated
├── .env                            # Your config
├── requirements.txt
├── start.sh
└── start.bat
```

## Configuration variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key | - | Yes |
| `LLM_MODEL` | LLM model name | `deepseek/deepseek-chat-v3.1` | No |
| `LLM_API_BASE` | API endpoint | `https://openrouter.ai/api/v1` | No |
| `DATA_DIR` | Document directory | `./data_room` | No |
| `PORT` | API port | `8000` | No |
| `EMBEDDER_TYPE` | `sentence-transformers` or `openai` | `sentence-transformers` | No |
| `EMBEDDING_MODEL` | Model name | `all-MiniLM-L6-v2` | No |
| `CHUNK_SIZE` | Tokens per chunk | `1000` | No |
| `TOP_K` | Results to retrieve | `5` | No |

## Troubleshooting

### Module not found

```bash
cd hack_for_bharat_2026
pip install -r requirements.txt
```

### Port already in use

```bash
# Linux/Mac
lsof -i :8000

# Windows
netstat -ano | findstr :8000

# Use different port
export PORT=8001  # Linux/Mac
set PORT=8001     # Windows
```

### Slow embeddings

Use a smaller model:
```bash
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

Or switch to cloud embeddings:
```bash
EMBEDDER_TYPE=openai
OPENAI_API_KEY=your-key
```

### Out of memory

Reduce chunk size:
```bash
CHUNK_SIZE=500
```

### Clear cache

```bash
rm -rf Cache/
```

## Performance notes

Chunk size affects results. Bigger chunks give more context but take longer to process and cost more tokens. Smaller chunks process faster but might miss context across chunk boundaries.

TOP_K is how many chunks get sent to the LLM. More chunks can improve accuracy but cost more tokens and slow down responses. The default of 5 works for most cases.

The cache saves processed embeddings. First run is slow, but restarts are fast if you keep the cache. Only delete it if you change the embedding model or chunk size.

## Documentation

- [Pathway Documentation](https://pathway.com/developers)
- [DeepSeek Model Info](https://openrouter.ai/models/deepseek/deepseek-chat-v3.1)
- [OpenRouter API](https://openrouter.ai/docs)

Other files in this repo:
- `API_EXAMPLES.md` - More API examples
- `INTEGRATION.md` - Integration guide
- `frontend/README.md` - Web UI docs
- `PATHWAY_RESEARCH.md` - Deep dive on Pathway framework

## About

Built for Hack For Green Bharat 2026. Use cases include analyzing research papers, reviewing policy documents, summarizing environmental reports, and searching educational materials.

The real-time indexing makes this practical for live document repositories. Add a file to the folder and it's immediately searchable without restarting anything.

## License

Open source, available for educational and research use.
