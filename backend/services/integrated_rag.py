"""
Main RAG service using Pathway framework.

Monitors a document folder, indexes files in real-time, and provides a REST API
for question-answering. Uses Pathway's VectorStoreServer for document indexing
and BaseRAGQuestionAnswerer for LLM-based Q&A.

Components:
- File monitor (watches data_room/ for changes)
- Document parser (extracts text from PDFs, Word, images, etc.)
- Text splitter (breaks documents into chunks)
- Embedder (converts text to vectors)
- Vector store (FAISS-based search)
- LLM integration (generates answers)
- REST API server (exposes endpoints)
"""

import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.vector_store import VectorStoreServer
from pathway.xpacks.llm.servers import QASummaryRestServer
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core import config


def create_embedder():
    """Create the text embedding model (local or API-based)."""
    if config.EMBEDDER_TYPE == "sentence-transformers":
        # Local embedder: free, runs on your machine, uses RAM
        return embedders.SentenceTransformerEmbedder(model=config.EMBEDDING_MODEL)
    
    elif config.EMBEDDER_TYPE == "openai":
        # API embedder: costs money, no local compute
        return embedders.OpenAIEmbedder(
            api_key=config.OPENAI_API_KEY,
            model=config.EMBEDDING_MODEL or "text-embedding-3-small"
        )
    
    else:
        raise ValueError(
            f"Unsupported embedder: {config.EMBEDDER_TYPE}. "
            f"Use 'sentence-transformers' or 'openai'"
        )


def create_llm():
    """Create the LLM for generating answers."""
    # Pick the right API key based on endpoint
    if config.LLM_API_BASE and "openrouter" in config.LLM_API_BASE.lower():
        api_key = config.OPENROUTER_API_KEY
    else:
        api_key = config.OPENAI_API_KEY
    
    llm_kwargs = {
        "model": config.LLM_MODEL,
        "api_key": api_key,
        "temperature": 0.1,  # Low = more deterministic
        "max_tokens": 1000,
    }
    
    if config.LLM_API_BASE:
        llm_kwargs["base_url"] = config.LLM_API_BASE
    
    return llms.OpenAIChat(**llm_kwargs)


def run_rag_pipeline():
    """Start the RAG service."""
    embedder = create_embedder()
    chat = create_llm()
    
    # Monitor document folder
    data_sources = []
    data_sources.append(
        pw.io.fs.read(
            path=str(config.DATA_DIR),
            format="binary",
            mode="streaming",  # Watch for file changes
            with_metadata=True,
        )
    )
    
    # Set up document indexing pipeline
    # Parser → Splitter → Embedder → Vector store
    doc_store = VectorStoreServer(
        *data_sources,
        embedder=embedder,
        splitter=splitters.TokenCountSplitter(
            max_tokens=config.CHUNK_SIZE,
            encoding_name="cl100k_base"  # OpenAI tokenizer
        ),
        parser=parsers.UnstructuredParser(),  # Handles PDF, DOCX, images, etc.
    )
    
    # RAG question answerer
    # Retrieves relevant chunks, sends to LLM with prompt
    rag_app = BaseRAGQuestionAnswerer(
        llm=chat,
        indexer=doc_store,
        search_topk=config.TOP_K,
        prompt_template=(
            "Use the context below to answer the question.\n\n"
            "Context:\n{context}\n\n"
            "Question: {query}\n\n"
            "Answer based only on the provided context. "
            "If the context doesn't have enough information, say so."
        )
    )
    
    # REST API server
    server = QASummaryRestServer(
        host=config.HOST,
        port=config.PORT,
        rag_question_answerer=rag_app,
    )
    
    # Start with caching enabled (faster restarts)
    server.run(
        with_cache=True,
        cache_backend=pw.persistence.Backend.filesystem(str(config.CACHE_DIR)),
    )


if __name__ == "__main__":
    print("=" * 70)
    print("Pathway RAG Service")
    print("=" * 70)
    print(f"\nMonitoring: {config.DATA_DIR}")
    print(f"Endpoint: http://{config.HOST}:{config.PORT}")
    print(f"Embedder: {config.EMBEDDER_TYPE} ({config.EMBEDDING_MODEL})")
    print(f"LLM: {config.LLM_MODEL}")
    
    print(f"\nAPI Endpoints:")
    print(f"  POST /v1/pw_ai_answer      - Ask question (RAG)")
    print(f"  POST /v1/retrieve          - Search documents")
    print(f"  POST /v1/statistics        - System stats")
    print(f"  POST /v1/pw_list_documents - List files")
    print(f"  POST /v1/pw_ai_summary     - Summarize text")
    print(f"  POST /v2/answer            - Ask (v2 API)")
    print(f"  POST /v2/list_documents    - List (v2 API)")
    print(f"  POST /v2/summarize         - Summarize (v2 API)")
    
    print("\n" + "=" * 70)
    print("Starting RAG pipeline (may take 30-60 seconds)...")
    print(f"  • Loading {config.EMBEDDING_MODEL}")
    print(f"  • Scanning {config.DATA_DIR}")
    print("  • Building vector index")
    print("  • Starting API server")
    print("=" * 70 + "\n")
    
    run_rag_pipeline()
