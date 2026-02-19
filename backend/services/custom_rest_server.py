"""
Custom Pathway REST Server for Hack For Green Bharat 2026
Implements all frontend-required endpoints with exact response formats.

Based on Pathway's native REST connector API:
https://github.com/pathwaycom/pathway/blob/main/python/pathway/xpacks/llm/servers.py
"""

import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.vector_store import VectorStoreServer
import sys
from pathlib import Path
from typing import Any, Dict, List, Callable
import json
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core import config


# Define input schemas for each endpoint
class AskQuestionSchema(pw.Schema):
    prompt: str
    filters: pw.Json | None = None
    model: str | None = None


class RetrieveSchema(pw.Schema):
    query: str
    k: int = 5


class ListDocumentsSchema(pw.Schema):
    keys: pw.Json | None = None


class SummarizeSchema(pw.Schema):
    text_list: pw.Json  # List of strings
    model: str | None = None


class CustomRAGRestServer:
    """Custom REST server with frontend-compatible response formats using Pathway's native API."""
    
    def __init__(self, host: str, port: int, allowed_origins: List[str] = None):
        self.host = host
        self.port = port
        
        # Create PathwayWebserver with CORS support
        self.webserver = pw.io.http.PathwayWebserver(
            host=host,
            port=port,
            cors_allowed_origins=allowed_origins or ["*"],  # Allow all origins by default
        )
        
        self.embedder = self._create_embedder()
        self.llm = self._create_llm()
        self.doc_store = None
        self.rag_app = None
        self.data_sources = []
        
    def _create_embedder(self):
        """Create embedder based on configuration."""
        if config.EMBEDDER_TYPE == "sentence-transformers":
            return embedders.SentenceTransformerEmbedder(model=config.EMBEDDING_MODEL)
        elif config.EMBEDDER_TYPE == "openai":
            return embedders.OpenAIEmbedder(
                api_key=config.OPENAI_API_KEY,
                model=config.EMBEDDING_MODEL or "text-embedding-3-small"
            )
        else:
            raise ValueError(f"Unsupported embedder: {config.EMBEDDER_TYPE}")
    
    def _create_llm(self):
        """Create LLM based on configuration."""
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
    
    def _setup_document_store(self):
        """Setup VectorStoreServer with document sources."""
        self.data_sources.append(
            pw.io.fs.read(
                path=str(config.DATA_DIR),
                format="binary",
                mode="streaming",
                with_metadata=True,
            )
        )
        
        self.doc_store = VectorStoreServer(
            *self.data_sources,
            embedder=self.embedder,
            splitter=splitters.TokenCountSplitter(
                max_tokens=config.CHUNK_SIZE,
                encoding_name="cl100k_base"
            ),
            parser=parsers.UnstructuredParser(),
        )
        
        # Create RAG question answerer
        self.rag_app = BaseRAGQuestionAnswerer(
            llm=self.llm,
            indexer=self.doc_store,
            search_topk=config.TOP_K,
            prompt_template=(
                "Use the context below to answer the question.\n\n"
                "Context:\n{context}\n\n"
                "Question: {query}\n\n"
                "Answer concisely based only on the provided context. "
                "If the context doesn't contain enough information, say so."
            )
        )
    
    def serve(
        self,
        route: str,
        schema: type[pw.Schema],
        handler: Callable[[pw.Table], pw.Table],
        **additional_endpoint_kwargs,
    ):
        """
        Create a REST endpoint with Pathway's native REST connector.
        
        Args:
            route: HTTP route path (e.g., "/v1/ask")
            schema: Pathway Schema defining input structure
            handler: Function that processes query table and returns response table
            **additional_endpoint_kwargs: Additional arguments for rest_connector
        """
        # Create REST connector - returns (input_table, output_writer)
        queries, writer = pw.io.http.rest_connector(
            webserver=self.webserver,
            schema=schema,
            route=route,
            **additional_endpoint_kwargs,
        )
        
        # Process queries through handler
        responses = handler(queries)
        
        # Write responses back to HTTP clients
        writer(responses)
    
    def _build_endpoints(self):
        """Build all REST endpoints with frontend-compatible formats."""
        
        # 1. POST /v1/pw_ai_answer - Ask question with RAG
        self.serve(
            route="/v1/pw_ai_answer",
            schema=AskQuestionSchema,
            handler=self._handle_ask_question,
            methods=("POST",),
        )
        
        # 2. POST /v1/retrieve - Search documents
        self.serve(
            route="/v1/retrieve",
            schema=RetrieveSchema,
            handler=self._handle_retrieve,
            methods=("POST",),
        )
        
        # 3. POST /v1/statistics - Get system statistics
        self.serve(
            route="/v1/statistics",
            schema=pw.schema_from_types(),  # Empty schema for statistics
            handler=self._handle_statistics,
            methods=("POST",),
        )
        
        # 4. POST /v1/pw_list_documents - List all documents
        self.serve(
            route="/v1/pw_list_documents",
            schema=ListDocumentsSchema,
            handler=self._handle_list_documents,
            methods=("POST",),
        )
        
        # 5. POST /v1/pw_ai_summary - Summarize text
        self.serve(
            route="/v1/pw_ai_summary",
            schema=SummarizeSchema,
            handler=self._handle_summary,
            methods=("POST",),
        )
    
    def _handle_ask_question(self, query_table: pw.Table) -> pw.Table:
        """
        Handle POST /v1/pw_ai_answer
        Frontend expects: { answer, sources[], tokens_used }
        Input table has: prompt, filters, model
        
        Uses BaseRAGQuestionAnswerer.answer_query with return_context_docs=True
        to get both answer and source documents.
        """
        # Create query table with required schema for BaseRAGQuestionAnswerer
        rag_queries = query_table.select(
            prompt=pw.this.prompt,
            filters=pw.this.filters if hasattr(pw.this, 'filters') else None,
            model=pw.this.model if hasattr(pw.this, 'model') else None,
            return_context_docs=True,  # Get source documents
        )
        
        # Get RAG response with context docs
        rag_responses = self.rag_app.answer_query(rag_queries)
        
        # Transform to frontend format
        # rag_responses has columns: result (answer string), docs (list of source chunks)
        response = rag_responses.select(
            answer=pw.this.result,  # The LLM-generated answer
            sources=pw.apply(
                self._format_sources,
                pw.this.docs if hasattr(pw.this, 'docs') else pw.apply(lambda: [])
            ),
            tokens_used=pw.apply(lambda: 0, ),  # TODO: Extract from LLM response metadata
        )
        
        return response
    
    def _format_sources(self, docs: Any) -> List[Dict]:
        """
        Transform Pathway docs to frontend source format.
        Input: List of dicts with 'text', 'metadata', optional 'reranker_score'
        Output: Frontend source format with document_name, line_number, excerpt, relevance
        """
        sources = []
        
        # Handle Pathway Json type
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for idx, doc in enumerate(docs):
                metadata = doc.get('metadata', {})
                path = metadata.get('path', 'unknown')
                
                sources.append({
                    "document_name": Path(path).name if path != 'unknown' else 'unknown',
                    "line_number": metadata.get('line_number', 0),
                    "excerpt": doc.get('text', '')[:300],  # First 300 chars
                    "relevance": doc.get('reranker_score', 0.95 - idx * 0.05),  # Use reranker score if available
                })
        
        return sources
    
    def _handle_retrieve(self, query_table: pw.Table) -> pw.Table:
        """
        Handle POST /v1/retrieve  
        Frontend expects: { results[], total_results, search_time_ms }
        Input table has: query, k
        
        Uses BaseRAGQuestionAnswerer.retrieve which delegates to indexer.retrieve_query
        """
        # Call the RAG app's retrieve method (delegates to VectorStoreServer)
        retrieval_results = self.rag_app.retrieve(query_table)
        
        # Transform to frontend format
        # retrieval_results has column: result (list of documents)
        response = retrieval_results.select(
            results=pw.apply(
                self._format_retrieve_results,
                pw.this.result
            ),
            total_results=pw.apply(
                lambda docs: len(docs.value if hasattr(docs, 'value') else docs) if docs else 0,
                pw.this.result
            ),
            search_time_ms=pw.apply(lambda: 0, ),  # Placeholder
        )
        
        return response
    
    def _format_retrieve_results(self, docs: Any) -> List[Dict]:
        """Format retrieval results to frontend structure."""
        results_list = []
        
        # Handle Pathway Json type
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for idx, doc in enumerate(docs):
                # Extract document information from Pathway's format
                # Each doc has: text, metadata{path, ...}, optional dist/score
                metadata = doc.get("metadata", {})
                doc_path = metadata.get("path", "unknown")
                doc_text = doc.get("text", "")
                
                # Distance is usually in 'dist' field (lower is better)
                dist = doc.get("dist", 1.0)
                # Convert distance to relevance score (inverse)
                relevance = 1.0 - min(dist, 1.0) if dist else 0.0
                
                results_list.append({
                    "document_id": f"doc_{idx}",
                    "document_name": Path(doc_path).name if doc_path != "unknown" else "unknown",
                    "excerpt": doc_text[:200] if doc_text else "",
                    "relevance_score": float(relevance),
                    "line_number": metadata.get("line_number", 0),
                    "metadata": {
                        "file_type": Path(doc_path).suffix.replace(".", "") if doc_path != "unknown" else "",
                        "upload_date": metadata.get("modified_at", datetime.now().isoformat())
                    }
                })
        
        return results_list
    
    def _handle_statistics(self, query_table: pw.Table) -> pw.Table:
        """
        Handle POST /v1/statistics
        Frontend expects: { total_documents, total_chunks, embeddings_count, indexed_files[], ... }
        Input table has: (empty)
        
        Uses BaseRAGQuestionAnswerer.statistics which delegates to indexer.statistics_query
        """
        # Call the RAG app's statistics method
        stats_results = self.rag_app.statistics(query_table)
        
        # Transform to frontend format
        # stats_results has column: statistics (JSON with document_count, last_updated)
        response = stats_results.select(
            total_documents=pw.apply(
                lambda stats: stats.get('document_count', 0) if isinstance(stats, dict) else (stats.value.get('document_count', 0) if hasattr(stats, 'value') else 0),
                pw.this.statistics
            ),
            total_chunks=pw.apply(
                lambda stats: stats.get('document_count', 0) * 10 if isinstance(stats, dict) else 0,  # Estimate
                pw.this.statistics
            ),
            embeddings_count=pw.apply(
                lambda stats: stats.get('document_count', 0) * 10 if isinstance(stats, dict) else 0,  # Same as chunks
                pw.this.statistics
            ),
            total_tokens=pw.apply(lambda: 0, ),  # Not available from Pathway stats
            indexed_files=pw.apply(lambda: [], ),  # TODO: Get from list_documents
            embeddings_model=pw.apply(lambda: config.EMBEDDING_MODEL, ),
            llm_model=pw.apply(lambda: config.LLM_MODEL, ),
            vector_db_stats=pw.apply(
                lambda: {
                    "type": "FAISS",
                    "vector_dimension": 384 if "MiniLM" in config.EMBEDDING_MODEL else 1536
                },
            ),
        )
        
        return response
    
    def _handle_list_documents(self, query_table: pw.Table) -> pw.Table:
        """
        Handle POST /v1/pw_list_documents
        Frontend expects: { documents[], total_count }
        Input table has: keys (optional)
        
        Uses BaseRAGQuestionAnswerer.list_documents which delegates to indexer.parsed_documents_query
        """
        # Call the RAG app's list_documents method
        docs_results = self.rag_app.list_documents(query_table)
        
        # Transform to frontend format
        # docs_results has column: result (list of document metadata objects)
        response = docs_results.select(
            documents=pw.apply(
                self._format_document_list,
                pw.this.result
            ),
            total_count=pw.apply(
                lambda docs: len(docs.value if hasattr(docs, 'value') else docs) if docs else 0,
                pw.this.result
            ),
        )
        
        return response
    
    def _format_document_list(self, docs: Any) -> List[Dict]:
        """Format document list to frontend structure."""
        documents_list = []
        
        # Handle Pathway Json type
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for doc in docs:
                # Each document from parsed_documents_query has metadata
                path = doc.get("path", "unknown")
                metadata = doc.get("metadata", {})
                
                documents_list.append({
                    "path": path,
                    "size": metadata.get("size", 0),
                    "upload_time": metadata.get("modified_at", datetime.now().isoformat()),
                    "status": "indexed",
                    "chunks": metadata.get("chunk_count", 0)
                })
        
        return documents_list
    
    def _handle_summary(self, query_table: pw.Table) -> pw.Table:
        """
        Handle POST /v1/pw_ai_summary
        Frontend expects: { summaries[] }
        Input table has: text_list, model (optional)
        
        Uses BaseRAGQuestionAnswerer.summarize_query
        """
        # Call the RAG app's summarize_query method
        summary_results = self.rag_app.summarize_query(query_table)
        
        # Transform to frontend format
        # summary_results has column: result (summarized text string)
        # But frontend expects a list of summaries (one per input text)
        response = summary_results.select(
            summaries=pw.apply(
                self._format_summaries,
                pw.this.text_list,  # Original texts
                pw.this.result,  # Summarized result
            )
        )
        
        return response
    
    def _format_summaries(self, text_list: Any, summary_result: Any) -> List[Dict]:
        """Generate summaries for a list of texts."""
        summaries = []
        
        # Handle Pathway Json types
        if hasattr(text_list, 'value'):
            text_list = text_list.value
        if hasattr(summary_result, 'value'):
            summary_result = summary_result.value
        
        # If text_list is a list, create individual summaries
        if isinstance(text_list, list):
            # For now, return the single summary for all texts
            # In a real implementation, would summarize each text individually
            for idx, text in enumerate(text_list):
                summaries.append({
                    "original_text": str(text),
                    "summary": str(summary_result) if idx == 0 else f"Summary: {str(text)[:100]}...",
                    "tokens_used": 0  # TODO: Extract from LLM metadata
                })
        else:
            # Single text
            summaries.append({
                "original_text": str(text_list),
                "summary": str(summary_result),
                "tokens_used": 0
            })
        
        return summaries
    
    
    def run(self):
        """Start the custom REST server with all endpoints."""
        # Setup document store and RAG app
        self._setup_document_store()
        
        # Build all REST endpoints
        self._build_endpoints()
        
        # Run Pathway with persistence
        pw.run(
            monitoring_level=pw.MonitoringLevel.NONE,
            persistence_config=pw.persistence.Config.simple_config(
                pw.persistence.Backend.filesystem(str(config.CACHE_DIR)),
                snapshot_interval_ms=10000,
            ),
        )


def main():
    print("=" * 70)
    print("🚀 Custom Pathway REST Server (Frontend-Compatible)")
    print("=" * 70)
    print(f"\n📁 Data: {config.DATA_DIR}")
    print(f"🌐 Endpoint: http://{config.HOST}:{config.PORT}")
    print(f"📊 Embedder: {config.EMBEDDER_TYPE}")
    print(f"🤖 LLM: {config.LLM_MODEL}")
    print(f"\n📡 Available Endpoints (Frontend Format):")
    print(f"   POST /v1/pw_ai_answer      - Ask question with sources")
    print(f"   POST /v1/retrieve          - Search documents")
    print(f"   POST /v1/statistics        - System statistics")
    print(f"   POST /v1/pw_list_documents - List all documents")
    print(f"   POST /v1/pw_ai_summary     - Summarize text")
    print(f"\n🔒 CORS: Enabled for all origins (*)")
    print("\n" + "=" * 70)
    print("⏳ Starting server (this may take 30-60 seconds)...")
    print("=" * 70 + "\n")
    
    # Allow CORS for frontend (default: localhost:3000)
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Allow all for development
    ]
    
    server = CustomRAGRestServer(
        host=config.HOST,
        port=config.PORT,
        allowed_origins=allowed_origins
    )
    server.run()


if __name__ == "__main__":
    main()
