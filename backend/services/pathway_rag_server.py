"""
Unified Pathway RAG Server
Combines document indexing, vector search, and LLM chat in a single server
Uses Pathway's BaseRAGQuestionAnswerer for complete RAG pipeline
"""

import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.vector_store import VectorStoreServer
from pathway.xpacks.llm.servers import QASummaryRestServer
import sys
from pathlib import Path

# Import config
sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core.config import (
    PATHWAY_LICENSE_KEY,
    EMBEDDING_MODEL,
    DATA_DIRECTORY,
    SERVER_HOST,
    SERVER_PORT,
    OPENROUTER_API_KEY,
    LLM_MODEL,
    LLM_API_BASE,
    TOP_K,
    CHUNK_SIZE
)

# Set Pathway license key
if PATHWAY_LICENSE_KEY:
    pw.set_license_key(PATHWAY_LICENSE_KEY)

def main():
    """
    Initialize and run unified RAG server.
    
    Automatically exposes REST endpoints:
    - POST /v1/pw_ai_answer - Answer questions using RAG (LLM + retrieval)
    - POST /v1/retrieve - Vector similarity search only
    - POST /v1/statistics - Server statistics
    - POST /v1/pw_list_documents - List indexed documents
    - POST /v1/pw_ai_summary - Summarize documents
    
    Features:
    - Automatic CORS handling
    - Real-time document indexing from filesystem
    - Persistent cache for embeddings
    - LLM-powered question answering
    - Source attribution
    """
    
    print("=" * 70)
    print("🚀 Pathway Unified RAG Server")
    print("=" * 70)
    
    # Configure embedder (sentence-transformers - runs locally)
    print(f"\n📦 Loading embedder: {EMBEDDING_MODEL}")
    embedder = embedders.SentenceTransformerEmbedder(
        model=EMBEDDING_MODEL,
        call_kwargs={"show_progress_bar": False}
    )
    
    # Configure LLM (OpenRouter via Pathway's OpenAIChat)
    print(f"🤖 Configuring LLM: {LLM_MODEL}")
    llm_chat = llms.OpenAIChat(
        model=LLM_MODEL,
        api_key=OPENROUTER_API_KEY,
        base_url=LLM_API_BASE,
        temperature=0.7,
        max_tokens=1000,
        retry_strategy=pw.udfs.ExponentialBackoffRetryStrategy(max_retries=3)
    )
    
    # Configure parser for multiple document types
    parser = parsers.UnstructuredParser()
    
    # Configure text splitter
    text_splitter = splitters.TokenCountSplitter(
        max_tokens=CHUNK_SIZE,
        encoding_name="cl100k_base"  # OpenAI tokenizer
    )
    
    # Configure filesystem data source
    print(f"📂 Monitoring directory: {DATA_DIRECTORY}")
    data_source = pw.io.fs.read(
        DATA_DIRECTORY,
        format="binary",
        mode="streaming",
        with_metadata=True
    )
    
    # Create document indexing pipeline
    print(f"🔧 Building vector store...")
    doc_store = VectorStoreServer(
        data_source,
        embedder=embedder,
        splitter=text_splitter,
        parser=parser
    )
    
    # Create RAG question answerer (combines vector search + LLM)
    print(f"🧠 Initializing RAG pipeline...")
    rag_app = BaseRAGQuestionAnswerer(
        llm=llm_chat,
        indexer=doc_store,
        search_topk=TOP_K,
        prompt_template=(
            "Use the context below to answer the question.\n\n"
            "Context:\n{context}\n\n"
            "Question: {query}\n\n"
            "Answer based only on the provided context. "
            "If the context doesn't have enough information, say so clearly."
        )
    )
    
    print(f"\n🌐 Starting server at http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"\n📡 Available endpoints:")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/pw_ai_answer")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/retrieve")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/statistics")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/pw_list_documents")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/pw_ai_summary")
    print(f"\n✅ CORS enabled for all origins")
    print(f"💾 Cache enabled at ./Cache")
    print(f"\n" + "=" * 70)
    print("⏳ Indexing documents and starting API server...")
    print("   This may take 30-60 seconds on first run")
    print("=" * 70 + "\n")
    
    # Build and run the server
    # This creates a REST server with all RAG endpoints
    rag_server =  QASummaryRestServer(
        host=SERVER_HOST,
        port=SERVER_PORT,
        rag_question_answerer=rag_app
    )
    
    # Run with persistent cache
    rag_server.run(
        with_cache=True,
        cache_backend=pw.persistence.Backend.filesystem("./Cache")
    )

if __name__ == "__main__":
    main()
