# Backend Services

## Architecture

This backend uses a **two-server architecture**:

```
┌─────────────────────────────────────────────────────┐
│  Frontend (localhost:3000)                          │
└────────────┬─────────────────────┬──────────────────┘
             │                     │
             │                     │
    ┌────────▼────────┐   ┌────────▼────────┐
    │  RAG Server     │   │  File Server    │
    │  Port: 9000     │   │  Port: 9001     │
    │  (Pathway)      │   │  (Flask)        │
    └────────┬────────┘   └────────┬────────┘
             │                     │
             │                     │
             └─────────┬───────────┘
                       │
                  ┌────▼─────┐
                  │data_room/│
                  └──────────┘
```

## Server Responsibilities

### 1. Pathway RAG Server (`pathway_rag_server.py`)
**Port:** 9000  
**Technology:** Pathway framework + DeepSeek LLM

**Endpoints:**
- `POST /v1/pw_ai_answer` - Ask questions (RAG)
- `POST /v1/retrieve` - Vector similarity search
- `POST /v1/statistics` - System statistics
- `POST /v1/pw_list_documents` - List indexed documents
- `POST /v1/pw_ai_summary` - Summarize text

**Features:**
- ✅ Real-time document indexing (streaming mode)
- ✅ Vector embeddings (sentence-transformers)
- ✅ LLM integration (DeepSeek via OpenRouter)
- ✅ Automatic CORS handling
- ✅ Persistent cache for faster restarts

### 2. File Management Server (`file_management_server.py`)
**Port:** 9001  
**Technology:** Flask + Flask-CORS

**Endpoints:**
- `POST /v1/upload` - Upload files (base64)
- `POST /v1/delete` - Delete files
- `GET  /v1/files` - List files with metadata
- `GET  /health` - Health check

**Features:**
- ✅ File upload/delete operations
- ✅ File metadata (size, modified date, type)
- ✅ CORS enabled
- ✅ Base64 encoding for file transfer

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` file in root:
```bash
PATHWAY_LICENSE_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
LLM_MODEL=deepseek/deepseek-chat-v3.1
```

### 3. Start Servers

**Option A: Both at once (recommended)**
```bash
bash start_all_servers.sh
```

**Option B: Individual terminals**
```bash
# Terminal 1
python -m backend.services.pathway_rag_server

# Terminal 2
python -m backend.services.file_management_server
```

### 4. Verify
```bash
# Check RAG server
curl http://207.244.225.17:9000/v1/statistics -X POST

# Check file server
curl http://207.244.225.17:9001/health
```

## File Processing Flow

1. **Upload** → File sent to Flask server (port 9001) as base64
2. **Save** → File saved to `data_room/` directory
3. **Detection** → Pathway server detects new file (streaming mode)
4. **Parse** → UnstructuredParser extracts text
5. **Split** → Text split into chunks (1000 tokens each)
6. **Embed** → Chunks embedded using sentence-transformers
7. **Index** → Vectors stored in searchable index
8. **Query** → Frontend can now query the document

**Timeline:** Upload to searchable in ~30 seconds

## Supported File Types

- PDF (`.pdf`)
- Text (`.txt`)
- Word (`.doc`, `.docx`)
- Markdown (`.md`)
- CSV (`.csv`)
- Excel (`.xls`, `.xlsx`)

## Monitoring

### View Logs
```bash
# RAG server logs
tail -f logs/rag_server.log

# File server logs
tail -f logs/file_server.log
```

### Check Processes
```bash
ps aux | grep pathway_rag_server
ps aux | grep file_management_server
```

### Stop Servers
```bash
pkill -f pathway_rag_server
pkill -f file_management_server
```

## Configuration Files

- `backend/core/config.py` - Central configuration
- `.env` - API keys and secrets
- `requirements.txt` - Python dependencies

## Troubleshooting

### CORS Errors
Both servers have CORS enabled. If issues persist:
1. Verify frontend uses correct port (9001 for all requests)
2. Check browser console for specific CORS errors
3. Ensure both servers are running

### Files Not Indexing
1. Check file uploaded to `data_room/`
2. Wait ~30 seconds for indexing
3. Check RAG server logs for errors
4. Verify file type is supported

### LLM Errors
1. Verify `OPENROUTER_API_KEY` in `.env`
2. Check model name is correct
3. Ensure sufficient API credits

## Development

### Adding New Endpoints

**RAG Server (Pathway):**
- Modify `pathway_rag_server.py`
- Use `serve_endpoint()` helper
- Must use Pathway UDFs

**File Server (Flask):**
- Modify `file_management_server.py`
- Standard Flask route decorator
- Regular Python functions

### Testing
```bash
# Test file upload
curl -X POST http://207.244.225.17:9001/v1/upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.txt", "content": "SGVsbG8gV29ybGQ="}'

# Test RAG query
curl -X POST http://207.244.225.17:9000/v1/pw_ai_answer \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the documents?"}'
```

## API Documentation

See [../API_ENDPOINTS.md](../API_ENDPOINTS.md) for complete API reference with frontend examples.
