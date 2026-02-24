"""
Simplified RAG Server using Pathway's Built-in REST Server
Based on successful implementations from Pathway hackathon projects
"""

import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.document_store import DocumentStore
from pathway.stdlib.indexing import UsearchKnnFactory, USearchMetricKind
import sys
import os
from pathlib import Path

# Set Pathway license
pw.set_license_key("5319C6-6E8E91-36D096-DB7B21-328173-V3")

sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core import config


class SimpleRAGServer:
    """
    Simplified RAG server using Pathway's built-in REST endpoints
    No custom UDFs - relies on Pathway's internal serialization
    """
    
    def __init__(self, host: str = "0.0.0.0", port: int = 9000):
        self.host = host
        self.port = port
        self.rag_app = None
        
    def _create_embedder(self):
        """Create sentence transformers embedder"""
        return embedders.SentenceTransformerEmbedder(
            model=config.EMBEDDING_MODEL,
            call_kwargs={"show_progress_bar": False}
        )
    
    def _create_llm(self):
        """Create LLM instance using OpenRouter"""
        return llms.LiteLLMChat(
            model=config.LLM_MODEL,
            api_key=config.OPENROUTER_API_KEY,
            api_base=config.LLM_API_BASE,
            temperature=0.1,
            max_tokens=1000,
        )
    
    def _setup_document_store(self):
        """Setup document store with file sources"""
        # Create file source
        folder_source = pw.io.fs.read(
            path=config.DATA_DIR,
            format="binary",
            with_metadata=True,
            mode="streaming"
        )
        
        sources = [folder_source]
        
        # Create parser and splitter
        parser = parsers.ParseUnstructured()
        text_splitter = splitters.TokenCountSplitter(max_tokens=400)
        
        # Create embedder and index
        embedder = self._create_embedder()
        index_factory = UsearchKnnFactory(
            reserved_space=10000,
            embedder=embedder,
            metric=USearchMetricKind.COS
        )
        
        # Create document store
        doc_store = DocumentStore(
            docs=sources,
            splitter=text_splitter,
            parser=parser,
            retriever_factory=index_factory
        )
        
        return doc_store
    
    def run(self):
        """Run the RAG server using Pathway's built-in REST endpoints"""
        print("=" * 60)
        print("🚀 Starting Simple RAG Server")
        print("=" * 60)
        print(f"📡 Host: {self.host}:{self.port}")
        print(f"🤖 LLM: {config.LLM_MODEL}")
        print(f"🔍 Embedder: {config.EMBEDDING_MODEL}")
        print(f"📁 Data Directory: {config.DATA_DIR}")
        print("=" * 60)
        
        # Setup components
        print("📊 Setting up document store...")
        doc_store = self._setup_document_store()
        
        print("🧠 Initializing LLM...")
        llm = self._create_llm()
        
        print("🏗️  Building RAG application...")
        self.rag_app = BaseRAGQuestionAnswerer(
            llm=llm,
            indexer=doc_store
        )
        
        # Build and run server using Pathway's built-in method
        print(f"🌐 Starting REST server on http://{self.host}:{self.port}")
        print("\n💡 Available Endpoints:")
        print("   POST /v1/pw_ai_answer      - Ask questions")
        print("   POST /v1/retrieve          - Semantic search")
        print("   POST /v1/pw_list_documents - List documents")
        print("   POST /v1/statistics        - Get stats")
        print("=" * 60)
        
        # Use Pathway's built-in server with CORS enabled
        self.rag_app.build_server(host=self.host, port=self.port, with_cors=True)
        
        # Run with caching
        self.rag_app.run_server(
            with_cache=True,
            terminate_on_error=False,
            cache_backend=pw.persistence.Backend.filesystem(config.CACHE_DIR)
        )


def main():
    """Entry point"""
    server = SimpleRAGServer(
        host=config.HOST,
        port=config.PORT
    )
    server.run()


if __name__ == "__main__":
    main()
