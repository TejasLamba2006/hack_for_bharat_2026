# FAQ - Frequently Asked Questions

## General Questions

### What is this system for?

This is a document question-answering system built for handling environmental reports, compliance documents, research papers, and policy documents. You upload documents, ask questions, and get answers with citations showing where the information came from.

### How is this different from ChatGPT or Claude?

Generic chatbots don't know about your specific documents. This system indexes your documents and retrieves relevant information before answering, so responses are based on your actual files rather than the LLM's training data. Plus, you get citations showing which documents the answer came from.

### Do I need to know Python or programming to use this?

Not for basic usage. The startup scripts handle most setup. You just need to:

1. Install Python
2. Get an OpenRouter API key  
3. Run `start.sh` or `start.bat`
4. Add documents to the `data_room` folder

### Is this free to use?

The software is free and open source. However, you'll need an OpenRouter API key for the LLM, which costs about $0.14 per million tokens with DeepSeek v3.1. In practice, this means $1-3 for 1000 questions. The embedding model runs locally and is completely free.

## Technical Questions

### What file formats are supported?

- PDF documents
- Microsoft Word (DOCX)
- Microsoft Excel (XLSX)
- Plain text (TXT)
- CSV files
- Markdown (MD)
- Images with text (requires OCR setup)

### How long does it take to index documents?

- Small documents (1-20 pages): 2-5 seconds
- Medium documents (20-50 pages): 5-15 seconds
- Large documents (100+ pages): 30-60 seconds

First startup takes longer (30-60 seconds) to load the embedding model.

### Can I use this completely offline?

Almost. The embedding model (sentence-transformers) runs locally, and vector search is local. However, you need internet access for LLM API calls to OpenRouter. If you need fully offline, you could integrate with a local LLM like Ollama (not currently implemented).

### How much RAM do I need?

Minimum 2GB, but 4GB is recommended. The system uses:

- ~1GB for base Python and Pathway
- ~500MB for the sentence-transformers model
- Additional memory scales with document quantity and chunk size

### What models can I use?

The system uses two separate models:

**Embedding model** (local):

- `sentence-transformers/all-MiniLM-L6-v2` (default, fast, 384 dim)
- `sentence-transformers/all-mpnet-base-v2` (better quality, slower)
- Any SentenceTransformers model
- OpenAI embeddings (costs extra)

**LLM** (via OpenRouter):

- `deepseek/deepseek-chat-v3.1` (default, $0.14/M tokens)
- `openai/gpt-4o-mini` ($0.15/M tokens)
- `anthropic/claude-3-5-sonnet` ($3/M tokens, better quality)
- Any model supported by OpenRouter

### Can I use my own LLM?

Yes. The system uses LiteLLM under the hood, so you can point it at:

- Local models via Ollama
- Azure OpenAI
- AWS Bedrock
- Google Vertex AI
- Any OpenAI-compatible API

Just change `LLM_API_BASE` in your `.env` file.

### How are my documents stored?

Documents are stored as files in the `data_room` directory. The system:

1. Reads the files
2. Extracts text
3. Splits text into chunks
4. Generates embeddings
5. Stores embeddings in `Cache/` directory

The original documents are never modified. Embeddings are cached locally for fast restarts.

### Is my data secure?

**Locally:** Yes, everything runs on your machine. Documents and embeddings never leave your system.

**API calls:** When you ask a question, relevant chunks are sent to the LLM API (OpenRouter). If you're handling sensitive data, consider:

- Using a self-hosted LLM instead
- Running on a private network
- Checking OpenRouter's privacy policy

The system doesn't currently include authentication, so add that before exposing it to the internet.

## Usage Questions

### How do I add documents?

Just copy files to the `data_room` folder:

```bash
cp my-document.pdf data_room/
```

The system watches the folder and indexes new files automatically within seconds.

### Can I organize documents in subfolders?

Yes! The system scans `data_room` recursively. You can organize files however you want:

```
data_room/
  ├── compliance/
  │   └── report-2024.pdf
  ├── research/
  │   └── study-water-quality.pdf
  └── regulations/
      └── epa-standards.docx
```

### How do I delete or update documents?

**Delete:** Remove the file from `data_room/`. The index updates automatically.

**Update:** Replace the file. The system detects the change and re-indexes it.

You can also use the API endpoints:

- `POST /v1/delete` - Remove files
- `POST /v1/upload` - Add files

### What makes a good question?

**Good questions:**

- "What are the water quality standards mentioned in the reports?"
- "List the environmental concerns identified in section 3"
- "Compare the findings from the 2023 and 2024 studies"

**Less effective questions:**

- "Tell me about water" (too vague)
- "Is this good or bad?" (requires context not in documents)
- Questions about information not in your documents

### Why are some answers wrong or incomplete?

Common reasons:

- Information isn't in your documents
- Relevant chunks weren't retrieved (try different phrasing)
- TOP_K is too low (increase to retrieve more chunks)
- CHUNK_SIZE is too small (context split across chunks)
- OCR failed on scanned PDFs (try improving document quality)

### Can I search across languages?

The default embedding model (all-MiniLM-L6-v2) is English-only. For multilingual support, switch to:

- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- `sentence-transformers/distiluse-base-multilingual-cased-v2`

Update `EMBEDDING_MODEL` in `.env` and delete the cache to re-embed documents.

## Performance Questions

### How can I make it faster?

**Indexing speed:**

- Use a faster CPU
- Use smaller embedding models
- Reduce CHUNK_SIZE

**Query speed:**

- Reduce TOP_K (fewer chunks to LLM)
- Use faster LLM (GPT-4o-mini, DeepSeek)
- Use faster embedding model

**Memory usage:**

- Use smaller embedding models
- Reduce CHUNK_SIZE
- Process fewer documents at once

### How can I improve answer quality?

1. **Better chunking:** Increase CHUNK_SIZE for more context
2. **More retrieval:** Increase TOP_K to send more chunks to LLM
3. **Better LLM:** Use Claude or GPT-4 instead of DeepSeek
4. **Better embeddings:** Use `all-mpnet-base-v2` or OpenAI embeddings
5. **Better questions:** Be specific and reference document names
6. **Better documents:** Clean, well-formatted docs work better than scanned PDFs

### Why is the first query slow?

The embedding model loads on first startup (takes 20-30 seconds). After that, it stays in memory and subsequent queries are fast.

If every query is slow, check:

- Your internet connection (for LLM API calls)
- OpenRouter API status
- Whether you're hitting rate limits

### How many documents can it handle?

**Tested:**

- 100 documents (~5000 pages): Works well
- 1000 documents (~50,000 pages): Slower indexing but queries still fast

**Limits:**

- RAM is the main constraint
- FAISS index grows with document count
- Cache directory size increases with documents

For very large collections (10,000+ documents), consider chunking by topic into separate instances.

## Deployment Questions

### Can I deploy this to production?

Yes, but add authentication first. The current version has no access control. See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete production setup guide.

### What about Docker?

Docker support is planned. For now, you can create your own Dockerfile using the startup scripts as a guide.

### Can multiple users use it simultaneously?

The backend handles concurrent requests, but there's no user authentication or per-user document isolation. For multi-user deployments, you'd need to add:

- User authentication
- Document access control
- Per-user data directories
- Rate limiting per user

### How do I back up my data?

Back up two things:

1. `data_room/` - Your original documents
2. `Cache/` - Generated embeddings (optional, can be regenerated)

```bash
tar -czf backup.tar.gz data_room/ Cache/
```

## Troubleshooting

### "Module not found" errors

You forgot to activate the virtual environment or install dependencies:

```bash
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Port already in use

Something else is running on port 9000. Either:

- Kill that process
- Change PORT in `.env`

### Out of memory

Your documents are too large or too many. Try:

- Reducing CHUNK_SIZE
- Processing fewer documents
- Upgrading RAM
- Using a smaller embedding model

### API key errors

- Check your OpenRouter API key is correct
- Verify you have credits at <https://openrouter.ai>
- Make sure `.env` file is in the project root

### Slow or hanging

- Check if first embedding model download is in progress
- Verify internet connection for LLM API calls
- Check OpenRouter API status
- Monitor RAM usage with `htop` or Task Manager

## Contributing

### How can I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for details. We welcome:

- Bug reports
- Feature requests
- Documentation improvements
- Code contributions
- Use case examples

### I found a security issue

Please report security issues privately. See [SECURITY.md](SECURITY.md) for contact information.

## More Questions?

- Check the [README](README.md) for setup instructions
- Review [API_ENDPOINTS.md](API_ENDPOINTS.md) for API documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Open an issue on GitHub if your question isn't answered here
