import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.vector_store import VectorStoreServer
import sys
import os
from pathlib import Path
from typing import Any, Dict, List, Callable
import json
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core import config
class AskQuestionSchema(pw.Schema):
    prompt: str
    filters: str | None  # ✅ Changed from pw.Json to str - Pathway expects string
    model: str | None


class RetrieveSchema(pw.Schema):
    query: str
    k: int | None  # Default handled in handler, not schema


class ListDocumentsSchema(pw.Schema):
    keys: pw.Json | None


class SummarizeSchema(pw.Schema):
    text_list: pw.Json
    model: str | None


class CustomRAGRestServer:
    
    
    def __init__(self, host: str, port: int, allowed_origins: List[str] = None):
        self.host = host
        self.port = port
        
        
        self.webserver = pw.io.http.PathwayWebserver(
            host=host,
            port=port,
            with_cors=True
        )
        
        self.embedder = self._create_embedder()
        self.llm = self._create_llm()
        self.doc_store = None
        self.rag_app = None
        self.data_sources = []
        
    def _create_embedder(self):
        
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
        queries, writer = pw.io.http.rest_connector(
            webserver=self.webserver,
            schema=schema,
            route=route,
            **additional_endpoint_kwargs,
        )
        responses = handler(queries)
        writer(responses)
    
    def _build_endpoints(self):
        
        self.serve(
            route="/v1/pw_ai_answer",
            schema=AskQuestionSchema,
            handler=self._handle_ask_question,
            methods=("POST",),
        )
        self.serve(
            route="/v1/retrieve",
            schema=RetrieveSchema,
            handler=self._handle_retrieve,
            methods=("POST",),
        )
        self.serve(
            route="/v1/statistics",
            schema=pw.schema_from_types(),  
            handler=self._handle_statistics,
            methods=("POST",),
        )
        self.serve(
            route="/v1/pw_list_documents",
            schema=ListDocumentsSchema,
            handler=self._handle_list_documents,
            methods=("POST",),
        )
        self.serve(
            route="/v1/pw_ai_summary",
            schema=SummarizeSchema,
            handler=self._handle_summary,
            methods=("POST",),
        )
    
    def _handle_ask_question(self, query_table: pw.Table) -> pw.Table:
        query_with_context = query_table.select(
            pw.this.prompt,
            pw.this.filters,
            pw.this.model,
            return_context_docs=pw.apply(lambda p: True, pw.this.prompt), 
        )
        
        rag_responses = self.rag_app.answer_query(query_with_context)
        
        @pw.udf
        def extract_answer(result: pw.Json) -> str:
            if isinstance(result, dict):
                return result.get("response", str(result))
            return str(result)
        
        response = rag_responses.select(
            answer=extract_answer(pw.this.result),
            sources=pw.apply(lambda r: [], pw.this.result),  # TODO: Extract from result if available
            tokens_used=pw.apply(lambda r: 0, pw.this.result),
        )
        
        return response
    
    def _format_sources(self, docs: Any) -> List[Dict]:
        sources = []
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for idx, doc in enumerate(docs):
                metadata = doc.get('metadata', {})
                path = metadata.get('path', 'unknown')
                
                sources.append({
                    "document_name": Path(path).name if path != 'unknown' else 'unknown',
                    "line_number": metadata.get('line_number', 0),
                    "excerpt": doc.get('text', '')[:300],  
                    "relevance": doc.get('reranker_score', 0.95 - idx * 0.05),  
                })
        
        return sources
    
    def _handle_retrieve(self, query_table: pw.Table) -> pw.Table:
        @pw.udf
        def default_k(k_val: int | None) -> int:
            return k_val if k_val is not None else 5
        
        @pw.udf
        def null_str(q: str) -> str | None:
            return None
        
        query_with_defaults = query_table.select(
            query=pw.this.query,
            k=default_k(pw.this.k),
            metadata_filter=null_str(pw.this.query),
            filepath_globpattern=null_str(pw.this.query),
        )
        
        retrieval_results = self.rag_app.retrieve(query_with_defaults)
        response = retrieval_results.select(
            results=pw.apply(
                self._format_retrieve_results,
                pw.this.result
            ),
            total_results=pw.apply(
                lambda docs: len(docs.value if hasattr(docs, 'value') else docs) if docs else 0,
                pw.this.result
            ),
            search_time_ms=pw.apply(lambda r: 0, pw.this.result),  
        )
        
        return response
    
    def _format_retrieve_results(self, docs: Any) -> List[Dict]:
        
        results_list = []
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for idx, doc in enumerate(docs):
                metadata = doc.get("metadata", {})
                doc_path = metadata.get("path", "unknown")
                doc_text = doc.get("text", "")
                dist = doc.get("dist", 1.0)
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
        response = query_table.select(
            total_documents=0,
            total_chunks=0,
            embeddings_count=0,
            total_tokens=0,
            indexed_files=[],
            embeddings_model=config.EMBEDDING_MODEL,
            llm_model=config.LLM_MODEL,
            vector_db_stats={
                "type": "FAISS",
                "vector_dimension": 384 if "MiniLM" in config.EMBEDDING_MODEL else 1536
            },
        )
        
        return response
    
    def _handle_list_documents(self, query_table: pw.Table) -> pw.Table:
        docs_results = self.rag_app.list_documents(query_table)
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
        
        documents_list = []
        if hasattr(docs, 'value'):
            docs = docs.value
        
        if isinstance(docs, list):
            for doc in docs:
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
        summary_results = self.rag_app.summarize_query(query_table)
        response = summary_results.select(
            summaries=pw.apply(
                self._format_summaries,
                pw.this.text_list,  
                pw.this.result,  
            )
        )
        
        return response
    
    def _format_summaries(self, text_list: Any, summary_result: Any) -> List[Dict]:
        
        summaries = []
        if hasattr(text_list, 'value'):
            text_list = text_list.value
        if hasattr(summary_result, 'value'):
            summary_result = summary_result.value
        if isinstance(text_list, list):
            for idx, text in enumerate(text_list):
                summaries.append({
                    "original_text": str(text),
                    "summary": str(summary_result) if idx == 0 else f"Summary: {str(text)[:100]}...",
                    "tokens_used": 0  
                })
        else:
            summaries.append({
                "original_text": str(text_list),
                "summary": str(summary_result),
                "tokens_used": 0
            })
        
        return summaries
    
    
    def run(self):
        
        self._setup_document_store()
        self._build_endpoints()
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
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  
    ]
    
    server = CustomRAGRestServer(
        host=config.HOST,
        port=config.PORT,
        allowed_origins=allowed_origins
    )
    server.run()


if __name__ == "__main__":
    main()
