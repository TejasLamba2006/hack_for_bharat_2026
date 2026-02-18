# Hack For Green Bharat 2026 - RAG Pipeline

Real-time Document Q&A system using Pathway's integrated RAG pipeline with live document monitoring.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` file:

```env
OPENROUTER_API_KEY=sk-or-v1-...
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1
DATA_DIR=./data_room
PORT=8000
EMBEDDER_TYPE=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=1000
TOP_K=5
```

### 3. Add Documents

Place your documents in `data_room/`:

- PDF, DOCX, TXT, CSV, Excel, Images
- Files are monitored in real-time

### 4. Start RAG Service

```bash
# Linux/WSL
bash start.sh

# Windows
start.bat

# Or directly
python3 -m backend.services.integrated_rag
```

Service starts on `http://localhost:8000`

## 📡 API Endpoints

**⚠️ Important: All endpoints use POST method (including statistics)**

See [`api_endpoints.yml`](api_endpoints.yml) for complete endpoint documentation.

### Ask Question (RAG)

```bash
curl -X POST http://localhost:8000/v1/pw_ai_answer \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is Pathway?"}'
```

### Search Documents

```bash
curl -X POST http://localhost:8000/v1/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "Pathway framework", "k": 5}'
```

### Statistics (POST, not GET)

```bash
curl -X POST http://localhost:8000/v1/statistics \
  -H "Content-Type: application/json" \
  -d '{}'
```

### List Documents

```bash
curl -X POST http://localhost:8000/v1/pw_list_documents \
  -H "Content-Type: application/json" \
  -d '{"keys": ["path"]}'
```

### Summarize Text

```bash
curl -X POST http://localhost:8000/v1/pw_ai_summary \
  -H "Content-Type: application/json" \
  -d '{"text_list": ["Text to summarize..."]}'
```

**All Available Endpoints:**

- `POST /v1/pw_ai_answer` - Ask questions with LLM
- `POST /v1/retrieve` - Search documents
- `POST /v1/statistics` - Get index stats
- `POST /v1/pw_list_documents` - List indexed files
- `POST /v1/pw_ai_summary` - Summarize text
- `POST /v2/answer` - Ask questions (v2 API)
- `POST /v2/list_documents` - List files (v2 API)
- `POST /v2/summarize` - Summarize text (v2 API)

## 🏗️ Architecture

**Single Service Design:**

- Pathway VectorStoreServer (document indexing)
- BaseRAGQuestionAnswerer (LLM integration)
- Token-based chunking
- Filesystem persistence
- Real-time document monitoring

**Tech Stack:**

- Framework: Pathway
- LLM: DeepSeek v3.1 (via OpenRouter)
- Embedder: sentence-transformers/all-MiniLM-L6-v2 (local)
- Vector DB: FAISS (built-in)

## 📁 Project Structure

```
hack_for_bharat_2026/
├── backend/
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   └── __init__.py
│   └── services/
│       ├── integrated_rag.py  # Main RAG service
│       └── __init__.py
├── data_room/                 # Your documents here
├── Cache/                     # Persistence cache
├── .env                       # Environment config
├── requirements.txt
├── start.sh                   # Linux/WSL startup
└── start.bat                  # Windows startup
```

## ⚙️ Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key | Required |
| `LLM_MODEL` | LLM model name | `deepseek/deepseek-chat-v3.1` |
| `LLM_API_BASE` | API endpoint | `https://openrouter.ai/api/v1` |
| `DATA_DIR` | Documents directory | `./data_room` |
| `PORT` | Service port | `8000` |
| `EMBEDDER_TYPE` | Embedder type | `sentence-transformers` |
| `EMBEDDING_MODEL` | Embedding model | `all-MiniLM-L6-v2` |
| `CHUNK_SIZE` | Token chunk size | `1000` |
| `TOP_K` | Search results | `5` |

## 🔧 Development

**View logs:**

```bash
# Service logs appear in console
# Cache stored in ./Cache/
```

**Add more documents:**

- Simply drop files into `data_room/`
- Real-time monitoring automatically indexes new files

**Clean cache:**

```bash
rm -rf Cache/
```

## 📚 Resources

- [Pathway Documentation](https://pathway.com/developers)
- [DeepSeek Model](https://openrouter.ai/models/deepseek/deepseek-chat-v3.1)
- [OpenRouter API](https://openrouter.ai/docs)

## 🏆 Hackathon: Hack For Green Bharat 2026

Real-time RAG system for environmental documentation and Q&A.
