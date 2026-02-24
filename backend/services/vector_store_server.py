"""
Pathway VectorStoreServer - Simple document indexing with REST API
Based on fintech-rag reference implementation pattern
"""

import pathway as pw
from pathway.xpacks.llm import embedders, parsers
from pathway.xpacks.llm.vector_store import VectorStoreServer
import os
import sys
from pathlib import Path

# Import config
sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core.config import (
    PATHWAY_LICENSE_KEY,
    EMBEDDING_MODEL,
    DATA_DIRECTORY,
    PATHWAY_PERSISTENCE_CONFIG,
    SERVER_HOST,
    SERVER_PORT
)

# Set Pathway license key
if PATHWAY_LICENSE_KEY:
    pw.set_license_key(PATHWAY_LICENSE_KEY)

def main():
    """
    Initialize and run VectorStoreServer for document indexing.
    
    VectorStoreServer automatically exposes REST endpoints:
    - POST /v1/retrieve - Vector similarity search
    - GET /v1/statistics - Server statistics
    - GET /v1/inputs - List indexed documents
    
    Features:
    - Automatic CORS handling
    - Real-time document indexing from filesystem
    - Persistent cache for embeddings
    - Support for PDF, TXT, DOCX, HTML files
    """
    
    print(f"📂 Indexing documents from: {DATA_DIRECTORY}")
    print(f"🔧 Using embedder: {EMBEDDING_MODEL}")
    print(f"💾 Cache directory: ./Cache")
    
    # Create VectorStoreServer
    pipeline = VectorStoreServer(
        data_source,
        embedder=embedder,
        splitter=None,  # Use default text splitter
        parser=parser
    )
    
    print(f"\n🚀 Starting VectorStoreServer at http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"\n📡 Available endpoints:")
    print(f"   POST http://{SERVER_HOST}:{SERVER_PORT}/v1/retrieve")
    print(f"   GET  http://{SERVER_HOST}:{SERVER_PORT}/v1/statistics")
    print(f"   GET  http://{SERVER_HOST}:{SERVER_PORT}/v1/inputs")
    print(f"\n✅ CORS enabled for all origins")
    print(f"⏳ Waiting for requests...\n")
    
    # Run server with default filesystem cache
    pipeline.run_server(
        host=SERVER_HOST,
        port=SERVER_PORT,
        with_cache=True,
        **PATHWAY_PERSISTENCE_CONFIG
    )

if __name__ == "__main__":
    main()
