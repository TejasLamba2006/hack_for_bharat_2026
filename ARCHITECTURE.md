# Unified RAG Architecture

This project uses **Pathway's BaseRAGQuestionAnswerer** for a complete RAG pipeline in a single server.

## Architecture Overview

```
┌─────────────────┐
│  Next.js Frontend  │  (port 3000)
│  localhost:3000    │
└────────┬──────────┘
         │ HTTP Requests
         ▼
┌──────────────────────────────────┐
│ Pathway Unified RAG Server       │  (port 9000)
│ - Document indexing              │
│ - Vector search                  │
│ - LLM question answering         │
│ - All endpoints in one server    │
│                                  │
│ Endpoints:                       │
│ - /v1/pw_ai_answer              │  ← LLM + RAG
│ - /v1/retrieve                   │  ← Vector search
│ - /v1/statistics                 │  ← Server stats
│ - /v1/pw_list_documents          │  ← List docs
│ - /v1/pw_ai_summary              │  ← Summarization
└──────────────────────────────────┘
```

## Single Server Architecture

### Pathway Unified RAG Server (Port 9000)
- **Purpose**: Complete RAG pipeline - indexing, search, and LLM chat
- **Technology**: Pathway + BaseRAGQuestionAnswerer
- **Components**:
  - **VectorStoreServer**: Document indexing and vector search
  - **BaseRAGQuestionAnswerer**: LLM-powered question answering
  - **OpenAIChat**: LiteLLM integration for multiple providers
- **Endpoints**:
  - `POST /v1/pw_ai_answer` - Answer questions using RAG (LLM + retrieval)
  - `POST /v1/retrieve` - Vector similarity search only
  - `POST /v1/statistics` - Server statistics
  - `POST /v1/pw_list_documents` - List indexed documents
  - `POST /v1/pw_ai_summary` - Summarize documents
- **Features**:
  - Automatic CORS handling
  - Real-time document monitoring
  - Persistent embedding cache
  - Source attribution
  - Retry logic for LLM calls

## Why Single Server?

1. **Simplicity**:
   - One server to start and manage
   - No inter-server communication overhead
   - Easier deployment and monitoring

2. **Pathway's Built-in Integration**:
   - `BaseRAGQuestionAnswerer` combines vector search + LLM
   - Avoids complex custom UDF patterns that caused crashes
   - Uses Pathway's proven REST server implementation

3. **Performance**:
   - No network latency between components
   - Shared memory for vector store and LLM
   - Single cache for all operations

4. **Maintainability**:
   - All RAG logic in one file
   - Consistent error handling
   - Easier to debug and test

## Running the System

### Simple Startup

**Windows:**
```bash
start_rag_system.bat
```

**Linux/WSL:**
```bash
chmod +x start_rag_system.sh
./start_rag_system.sh
```

### Manual Startup

**Backend:**
```bash
python -m backend.services.pathway_rag_server
```

**Frontend (separate terminal):**
```bash
cd frontend
pnpm dev
```

## Configuration

### Backend (.env)
```bash
# Unified Pathway server port
HOST=0.0.0.0
PORT=9000

# Pathway License Key
PATHWAY_LICENSE_KEY=your_key_here

# LLM Configuration (OpenRouter)
OPENROUTER_API_KEY=your_key_here
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1

# Embeddings (local, no API key needed)
EMBEDDER_TYPE=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Document Processing
CHUNK_SIZE=1000
TOP_K=5
```

### Frontend (.env.local)
```bash
# Connect to unified Pathway server (port 9000)
NEXT_PUBLIC_API_BASE_URL=http://207.244.225.17:9000
```

## RAG Flow

1. User asks question in Next.js frontend
2. Frontend sends `POST /v1/pw_ai_answer` to Pathway server (port 9000)
3. Pathway server (`BaseRAGQuestionAnswerer`):
   - Uses `VectorStoreServer` to find relevant document chunks
   - Builds RAG prompt with retrieved context
   - Calls `OpenAIChat` (LiteLLM) which routes to OpenRouter/DeepSeek
   - Returns answer + sources in single response
4. Frontend displays answer with source attribution

**Key Benefits**:
- All processing in one server - no inter-service latency
- Pathway handles retry logic and error recovery
- Automatic source tracking and attribution
- Consistent API across different LLM providers
- Built-in caching for faster responses

## Troubleshooting

**Server not starting:**
- Check if port 9000 is available
- Verify Pathway license key in `.env`
- Check `data_room/` directory exists
- Ensure all dependencies installed: `pip install -r requirements.txt`

**LLM not responding:**
- Check `OPENROUTER_API_KEY` is valid in `.env`
- Verify `LLM_API_BASE` is correct
- Check network connectivity to OpenRouter
- Look for error messages in server console

**Frontend getting 404 errors:**
- Verify `.env.local` points to port 9000 (not 5000)
- Check Pathway server is running
- Verify CORS is enabled (automatic with Pathway)

**Documents not being indexed:**
- Check `data_room/` directory has files
- Verify file formats are supported (PDF, DOCX, TXT, HTML)
- Wait 30-60 seconds for initial indexing
- Check `POST /v1/statistics` endpoint for index status

**Slow responses:**
- First query is slower (loading models)
- Embeddings are cached after first use
- Try smaller `CHUNK_SIZE` if documents are large
- Reduce `TOP_K` if retrieving too many chunks

## Dependencies

Install with:
```bash
pip install -r requirements.txt
```

Key packages:
- `pathway[all]` - Streaming data engine with RAG components
- `python-dotenv` - Environment variable management

**Note**: Flask and flask-cors are no longer needed with the unified Pathway server.

## File Structure

```
backend/
├── core/
│   └── config.py              # Configuration loader
├── services/
│   ├── pathway_rag_server.py  # Unified RAG server (USE THIS)
│   ├── integrated_rag.py      # Alternative implementation
│   ├── vector_store_server.py # Legacy: vector search only
│   └── llm_chat_server.py     # Legacy: Flask wrapper (deprecated)
```

**Recommended**: Use `pathway_rag_server.py` for the complete RAG pipeline in one server.
