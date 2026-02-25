# Document Q&A System

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Hack For Green Bharat 2026](https://img.shields.io/badge/Hackathon-Hack%20For%20Green%20Bharat%202026-brightgreen.svg)](https://github.com/TejasLamba2006/hack_for_bharat_2026)

> Drop your documents in a folder, ask questions, get answers with citations. Built for handling environmental reports, compliance documents, and research papers where accuracy matters.

## What This Does

Point the system at a folder full of documents - PDFs, Word files, spreadsheets, whatever - and ask questions about them. You'll get answers pulled straight from your docs, with citations showing which file and page each piece came from.

The file watching is automatic. New document gets added? It gets indexed without restarting anything. Edit a file? Same deal.

## Why We Built This

Working with environmental compliance documents is a pain. You've got reports spread across dozens of PDFs, regulations in Word docs, survey data in spreadsheets. Finding specific information means opening file after file, searching, reading, cross-referencing.

We wanted something that could handle all of it at once. Ask "What are the water quality standards mentioned across all these reports?" and get an answer with sources. That's what this does.

## Quick Start

**Prerequisites:** Python 3.9 or later, Node.js 18+ (for the frontend)

```bash
# Clone the repo
git clone https://github.com/TejasLamba2006/hack_for_bharat_2026.git
cd hack_for_bharat_2026

# Install Python dependencies
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
# Edit .env and add your OpenRouter API key

# Set up the frontend (optional)
cd frontend
pnpm install
cd ..

# Start the system
bash start.sh  # Linux/Mac
# OR
start.bat  # Windows
```

The backend runs on `http://localhost:9000` and the frontend on `http://localhost:3000`.

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Required: Get a free key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

# Model selection (DeepSeek v3.1 costs about $0.14 per million tokens)
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1

# Document storage
DATA_DIR=./data_room

# Embedding configuration
EMBEDDER_TYPE=sentence-transformers  # Runs locally, no API costs
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Processing settings
CHUNK_SIZE=1000
TOP_K=5
```

The sentence-transformers embedder runs on your machine and doesn't call any APIs. It uses some RAM (about 500MB), but there's no per-query cost. If you want to use OpenAI embeddings instead, set `EMBEDDER_TYPE=openai` and add your OpenAI key.

## Adding Documents

```bash
mkdir -p data_room
cp ~/Documents/environmental-impact-2024.pdf data_room/
cp ~/Documents/compliance-report.docx data_room/
```

Supported formats: PDF, DOCX, XLSX, TXT, CSV, MD. If you have OCR set up, images work too.

The system watches the folder. When you add or change files, they get indexed automatically - usually takes a few seconds depending on file size.

## API Usage

All endpoints use POST requests due to how Pathway handles requests.

### Ask a Question

```bash
curl -X POST http://localhost:9000/v1/pw_ai_answer \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the main environmental concerns mentioned?"}'
```

Response:

```json
{
  "answer": "The main environmental concerns are water contamination from agricultural runoff, air quality degradation due to industrial emissions, and habitat loss in wetland areas.",
  "sources": [
    {"path": "data_room/env-report-2024.pdf", "chunk_id": 3, "relevance": 0.89},
    {"path": "data_room/compliance-audit.docx", "chunk_id": 12, "relevance": 0.82}
  ]
}
```

### Vector Search Only

Get relevant chunks without the LLM:

```bash
curl -X POST http://localhost:9000/v1/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "water quality", "k": 5}'
```

### List Indexed Documents

```bash
curl -X POST http://localhost:9000/v1/pw_list_documents \
  -H "Content-Type: application/json" \
  -d '{"keys": ["path", "modified_at"]}'
```

### Other Endpoints

- `POST /v1/pw_ai_summary` - Summarize provided text
- `POST /v1/upload` - Upload files through the API
- `POST /v1/delete` - Remove files
- `POST /v1/files` - List all files
- `GET /health` - Health check

Full API documentation: [API_ENDPOINTS.md](API_ENDPOINTS.md)

## Architecture

Single server setup using Pathway's BaseRAGQuestionAnswerer:

```
┌──────────────┐
│ Next.js UI   │ (port 3000)
└──────┬───────┘
       │ HTTP
       ▼
┌─────────────────────────────┐
│ Pathway RAG Server          │ (port 9000)
│ • Document indexing         │
│ • Vector search (FAISS)     │
│ • LLM question answering    │
│ • Real-time file watching   │
└─────────────────────────────┘
       ▼
┌─────────────────────────────┐
│ data_room/                  │
│ (Your documents)            │
└─────────────────────────────┘
```

Technical stack:

- **Pathway** - Real-time data processing and file watching
- **FAISS** - Vector similarity search
- **SentenceTransformers** - Local embedding generation
- **DeepSeek v3.1** - LLM for answer generation (via OpenRouter)
- **Next.js** - Frontend UI
- **Rust** - Pathway compiles Python to Rust for performance

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Project Structure

```
hack_for_bharat_2026/
├── backend/
│   ├── core/
│   │   ├── config.py                 # Configuration loader
│   │   └── __init__.py
│   └── services/
│       ├── pathway_rag_server.py     # Main RAG server
│       ├── file_management_server.py # File upload/delete
│       └── README.md
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── chat/                     # Chat interface
│   │   ├── search/                   # Search interface
│   │   └── admin/                    # Admin dashboard
│   ├── components/                   # React components
│   └── lib/                          # Utilities
├── .github/
│   ├── workflows/                    # CI/CD pipelines
│   └── ISSUE_TEMPLATE/               # Issue templates
├── data_room/                        # Your documents go here
├── Cache/                            # Auto-generated embeddings cache
├── .env.example                      # Configuration template
├── requirements.txt                  # Python dependencies
├── CONTRIBUTING.md                   # Contribution guidelines
├── CODE_OF_CONDUCT.md                # Community guidelines
├── SECURITY.md                       # Security policy
└── README.md                         # This file
```

## Use Cases

**Environmental Compliance**  
Track regulations across multiple documents. Ask "What are the emission limits for industrial facilities?" and get answers with citations from relevant reports.

**Research Paper Analysis**  
Upload academic papers and ask comparative questions. "How do different studies approach biodiversity measurement?" pulls insights from multiple sources.

**Policy Documentation**  
Government agencies can query policy documents, impact assessments, and public comments without manual searching.

**Corporate Reporting**  
Cross-reference sustainability reports, audit documents, and compliance filings. The citations help trace claims back to source documents.

## Screenshots

> **Note:** Add screenshots here once deployed:
>
> - Landing page with upload interface
> - Chat interface showing question answering with citations
> - Admin dashboard with document management
> - Search results with highlighted snippets

## Deployment

### Docker (Recommended)

```bash
# Coming soon - Docker setup in progress
```

### Manual Deployment

1. Clone the repo on your server
2. Set up environment variables in `.env`
3. Install dependencies: `pip install -r requirements.txt`
4. Run with `python -m backend.services.pathway_rag_server`
5. Use a reverse proxy (nginx, Caddy) for HTTPS
6. Set up systemd or supervisor for auto-restart

**Security Note:** The current version doesn't include authentication. Add auth before exposing this to the internet. See [SECURITY.md](SECURITY.md) for best practices.

## Performance Notes

**First startup:** Takes 30-60 seconds to load the embedding model and index existing documents. After that, the model stays in memory.

**New documents:** Small PDFs (10-20 pages) index in a few seconds. Large documents (100+ pages) might take 30-60 seconds.

**Query speed:** Vector search is fast (under 100ms). LLM response time depends on the model - DeepSeek v3.1 typically responds in 2-5 seconds.

**Memory usage:** Base system uses about 1GB RAM. The sentence-transformers model adds another 500MB. Documents aren't kept in memory - only their embeddings.

## Cost Breakdown

**Embeddings:** $0 (runs locally with sentence-transformers)

**LLM queries:** ~$0.14 per million tokens with DeepSeek v3.1. In practice:

- Simple question: $0.0001-0.0003
- Complex multi-document question: $0.001-0.003
- 1000 questions/month: ~$1-3

Compare to GPT-4o which costs $2.50 per million input tokens.

## Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code improvements.

- **Found a bug?** Open an issue with details and reproduction steps
- **Have an idea?** Check existing issues first, then create a feature request
- **Want to contribute code?** Fork the repo, make your changes, and submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Roadmap

- [ ] Multi-user authentication and authorization
- [ ] Document comparison view
- [ ] Export answers to PDF/Word with citations
- [ ] Support for more embedding models (Ollama, local LLMs)
- [ ] Batch document upload via UI
- [ ] Advanced search filters (by date, document type, etc.)
- [ ] RESTful file management API
- [ ] Docker deployment setup
- [ ] Kubernetes manifests

## Known Issues

- Large Excel files (>100MB) can be slow to process
- PDF tables sometimes extract poorly - try converting to CSV first
- The system doesn't handle password-protected documents yet
- CORS is wide open - configure properly for production

## Troubleshooting

**"Module not found" errors**  
Make sure you've activated your virtual environment and run `pip install -r requirements.txt`.

**Embedding model download fails**  
First run downloads the model from HuggingFace. If that fails, check your internet connection or try a different mirror.

**Out of memory errors**  
Processing very large documents can use a lot of RAM. Try reducing `CHUNK_SIZE` in `.env` or upgrading your RAM.

**LLM not responding**  
Check your OpenRouter API key. Make sure you have credits available at <https://openrouter.ai>.

**Port already in use**  

```bash
# Linux/Mac
lsof -i :9000
kill -9 <PID>

# Windows
netstat -ano | findstr :9000
taskkill /PID <PID> /F
```

**Clear cache and restart**  

```bash
rm -rf Cache/
python -m backend.services.pathway_rag_server
```

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | Python 3.11+ | Pathway and most ML libraries are Python-based |
| Data Processing | Pathway | Real-time file watching and streaming ETL |
| Vector Search | FAISS | Fast similarity search, works offline |
| Embeddings | SentenceTransformers | Free, runs locally, decent quality |
| LLM | DeepSeek v3.1 | Cheap ($0.14/M tokens), good quality |
| Frontend | Next.js 15 | React with server-side rendering |
| UI Components | shadcn/ui | Clean, accessible components |
| Styling | Tailwind CSS | Utility-first CSS framework |

## License

MIT License - see [LICENSE](LICENSE) for details.

Built for Hack For Green Bharat 2026 by [@TejasLamba2006](https://github.com/TejasLamba2006).

## Acknowledgments

- [Pathway](https://pathway.com/) for the real-time data processing framework
- [Sentence Transformers](https://www.sbert.net/) for the embedding models
- [OpenRouter](https://openrouter.ai/) for LLM access
- The environmental compliance teams who need better document tools

---

**Questions? Issues?** Open an issue on GitHub or check the [documentation](API_ENDPOINTS.md).
