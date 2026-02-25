# Document Q&A System

Built for Hack For Green Bharat 2026. You drop documents in a folder, ask questions about them, and get answers with citations showing where the information came from.

## What it does

Upload PDFs, Word docs, spreadsheets, text files - basically anything with text in it. Ask "What's in section 3?" or "Summarize this report" and you'll get an answer pulled from your documents. Each answer shows which file and page it came from.

New files get indexed automatically when you add them to the watch folder. No need to restart anything.

## Setup

You need Python 3.9 or later.

```bash
pip install -r requirements.txt
```

This grabs:

- `pathway` - Watches files and handles the indexing
- `sentence-transformers` - Runs embeddings on your machine (no API costs)
- `openai` - Talks to LLMs
- `python-dotenv` - Loads your config from .env

## Configuration

Make a `.env` file:

```env
# Get your key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Which model to use
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1

# Where to look for documents
DATA_DIR=./data_room

# Server port
PORT=8000

# Embedding setup
EMBEDDER_TYPE=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# How big to chunk documents
CHUNK_SIZE=1000
TOP_K=5
```

Note: `sentence-transformers` runs locally and doesn't cost anything, but it'll use some RAM. If you want cloud embeddings instead, switch to `EMBEDDER_TYPE=openai` (needs an OpenAI key, costs money).

DeepSeek v3.1 runs about $0.14 per million tokens on OpenRouter. Pretty cheap. You can swap in other models by changing `LLM_MODEL`.

## Adding documents

Just toss files into `data_room/`:

```bash
mkdir -p data_room
cp ~/Documents/whatever.pdf data_room/
```

Works with: PDF, DOCX, XLSX, TXT, CSV, MD, and images if you have OCR set up.

## Running it

On Linux/Mac/WSL:

```bash
bash start.sh
```

Windows:

```bash
start.bat
```

Or run directly:

```bash
python3 -m backend.services.integrated_rag
```

First time takes a minute while it loads the embedding model and scans your documents. After that it's faster thanks to caching.

Runs on `http://localhost:8000` and keeps going until you kill it.

## Using the API

Everything uses POST requests (Pathway framework quirk - even the read operations).

### Ask something

```bash
curl -X POST http://localhost:8000/v1/pw_ai_answer \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are these documents about?"}'
```

Gets you:

```json
{
  "answer": "The documents cover...",
  "sources": [
    {"path": "data_room/file.pdf", "chunk_id": 3}
  ]
}
```

### Search without the LLM

Just get relevant chunks:

```bash
curl -X POST http://localhost:8000/v1/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "climate change", "k": 5}'
```

### See what's indexed

```bash
curl -X POST http://localhost:8000/v1/pw_list_documents \
  -H "Content-Type: application/json" \
  -d '{"keys": ["path", "modified_at"]}'
```

### Summarize stuff

```bash
curl -X POST http://localhost:8000/v1/pw_ai_summary \
  -H "Content-Type: application/json" \
  -d '{"text_list": ["Text to summarize..."]}'
```

## What's available

| Endpoint | What it does |
|----------|---------|
| `/v1/pw_ai_answer` | Ask questions, get AI answers |
| `/v1/retrieve` | Find relevant chunks |
| `/v1/pw_list_documents` | See what's indexed |
| `/v1/pw_ai_summary` | Summarize text |
| `/v1/upload` | Add files |
| `/v1/delete` | Remove files |
| `/v1/files` | List files |
| `/health` | Check if it's running |

## How it works

```
Files in folder → Pathway spots changes
               → Parser reads PDFs, Word docs, etc.
               → Text split into ~1000 token chunks
               → Chunks converted to vectors
               → FAISS indexes them
               → API serves requests
               → Search finds relevant chunks
               → LLM writes an answer
```

Stack:

- Pathway for the file watching and real-time updates
- FAISS for vector search
- SentenceTransformers for local embeddings
- DeepSeek v3.1 through OpenRouter
- Rust engine (Pathway compiles Python to Rust)

## Files

```
hack_for_bharat_2026/
├── backend/
│   ├── core/
│   │   └── config.py         # Settings
│   └── services/
│       └── integrated_rag.py # Main code
├── frontend/                  # Web UI (Next.js)
├── data_room/                 # Documents go here
├── Cache/                     # Generated
├── .env                       # Your config
├── requirements.txt
├── start.sh
└── start.bat
```

## Settings

| Variable | What it's for | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | OpenRouter key | - | Yes |
| `LLM_MODEL` | Which LLM | `deepseek/deepseek-chat-v3.1` | No |
| `LLM_API_BASE` | API URL | `https://openrouter.ai/api/v1` | No |
| `DATA_DIR` | Document folder | `./data_room` | No |
| `PORT` | Server port | `8000` | No |
| `EMBEDDER_TYPE` | `sentence-transformers` or `openai` | `sentence-transformers` | No |
| `EMBEDDING_MODEL` | Model name | `all-MiniLM-L6-v2` | No |
| `CHUNK_SIZE` | Tokens per chunk | `1000` | No |
| `TOP_K` | How many results | `5` | No |

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
