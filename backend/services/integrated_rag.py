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
    if config.EMBEDDER_TYPE == "sentence-transformers":
        return embedders.SentenceTransformerEmbedder(model=config.EMBEDDING_MODEL)
    elif config.EMBEDDER_TYPE == "openai":
        return embedders.OpenAIEmbedder(
            api_key=config.OPENAI_API_KEY,
            model=config.EMBEDDING_MODEL or "text-embedding-3-small"
        )
    else:
        raise ValueError(f"Unsupported embedder: {config.EMBEDDER_TYPE}")


def create_llm():
    if config.LLM_API_BASE and "openrouter" in config.LLM_API_BASE.lower():
        api_key = config.OPENROUTER_API_KEY
    else:
        api_key = config.OPENAI_API_KEY
    
    llm_kwargs = {
        "model": config.LLM_MODEL,
        "api_key": api_key,
        "temperature": 0.1,
        "max_tokens": 1000,
    }
    
    if config.LLM_API_BASE:
        llm_kwargs["base_url"] = config.LLM_API_BASE
    
    return llms.OpenAIChat(**llm_kwargs)


def run_rag_pipeline():
    embedder = create_embedder()
    chat = create_llm()
    
    data_sources = []
    data_sources.append(
        pw.io.fs.read(
            path=str(config.DATA_DIR),
            format="binary",
            mode="streaming",
            with_metadata=True,
        )
    )
    
    doc_store = VectorStoreServer(
        *data_sources,
        embedder=embedder,
        splitter=splitters.TokenCountSplitter(
            max_tokens=config.CHUNK_SIZE,
            encoding_name="cl100k_base"
        ),
        parser=parsers.UnstructuredParser(),
    )
    
    rag_app = BaseRAGQuestionAnswerer(
        llm=chat,
        indexer=doc_store,
        search_topk=config.TOP_K,
        prompt_template=(
            "Use the context below to answer the question.\n\n"
            "Context:\n{context}\n\n"
            "Question: {query}\n\n"
            "Answer concisely based only on the provided context. "
            "If the context doesn't contain enough information, say so."
        )
    )
    
    server = QASummaryRestServer(
        host=config.HOST,
        port=config.PORT,
        rag_question_answerer=rag_app,
    )
    
    server.run(
        with_cache=True,
        cache_backend=pw.persistence.Backend.filesystem(str(config.CACHE_DIR)),
    )


if __name__ == "__main__":
    print("=" * 70)
    print("🚀 Pathway RAG Service (Full REST API)")
    print("=" * 70)
    print(f"\n📁 Data: {config.DATA_DIR}")
    print(f"🌐 Endpoint: http://{config.HOST}:{config.PORT}")
    print(f"📊 Embedder: {config.EMBEDDER_TYPE}")
    print(f"🤖 LLM: {config.LLM_MODEL}")
    print(f"\n📡 Available Endpoints:")
    print(f"   POST /v1/pw_ai_answer      - Ask question (RAG)")
    print(f"   POST /v1/retrieve          - Search documents")
    print(f"   POST /v1/statistics        - Index statistics")
    print(f"   POST /v1/pw_list_documents - List all files")
    print(f"   POST /v1/pw_ai_summary     - Summarize text")
    print(f"   POST /v2/answer            - Ask question (v2)")
    print(f"   POST /v2/list_documents    - List files (v2)")
    print(f"   POST /v2/summarize         - Summarize (v2)")
    print("\n" + "=" * 70)
    print("⏳ Starting RAG pipeline (this may take 30-60 seconds)...")
    print("   • Loading embedding model ({})...".format(config.EMBEDDING_MODEL))
    print("   • Scanning documents in data_room/...")
    print("   • Building vector index...")
    print("=" * 70 + "\n")
    
    run_rag_pipeline()
