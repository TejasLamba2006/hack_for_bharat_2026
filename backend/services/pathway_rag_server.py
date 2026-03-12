import pathway as pw
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer
from pathway.xpacks.llm.vector_store import VectorStoreServer
from pathway.xpacks.llm.servers import QASummaryRestServer
import sys
import os
import base64
import datetime
from pathlib import Path
from typing import Callable

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

if PATHWAY_LICENSE_KEY:
    pw.set_license_key(PATHWAY_LICENSE_KEY)

# Schemas for custom endpoints
class UploadFileSchema(pw.Schema):
    filename: str
    content: str  # base64 encoded file content
    
class DeleteFileSchema(pw.Schema):
    filename: str

def serve_endpoint(
    webserver: pw.io.http.PathwayWebserver,
    route: str,
    schema: type[pw.Schema],
    handler: Callable[[pw.Table], pw.Table],
    **kwargs
):
    """Helper to register custom REST endpoints"""
    queries, writer = pw.io.http.rest_connector(
        webserver=webserver,
        schema=schema,
        route=route,
        **kwargs
    )
    responses = handler(queries)
    writer(responses)


def handle_upload_file(query_table: pw.Table) -> pw.Table:
    """Handle file upload requests"""
    @pw.udf
    def save_file(filename: str, content: str) -> pw.Json:
        try:
            # Ensure data_room directory exists
            os.makedirs(DATA_DIRECTORY, exist_ok=True)
            
            # Decode base64 content
            file_data = base64.b64decode(content)
            
            # Save file to data_room
            file_path = os.path.join(DATA_DIRECTORY, filename)
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            return {
                "success": True,
                "message": f"File '{filename}' uploaded successfully",
                "path": file_path,
                "size": len(file_data),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to upload file: {str(e)}"
            }
    
    response = query_table.select(
        result=save_file(pw.this.filename, pw.this.content)
    )
    return response


def handle_delete_file(query_table: pw.Table) -> pw.Table:
    """Handle file deletion requests"""
    @pw.udf
    def delete_file(filename: str) -> pw.Json:
        try:
            file_path = os.path.join(DATA_DIRECTORY, filename)
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "message": f"File '{filename}' not found"
                }
            
            os.remove(file_path)
            
            return {
                "success": True,
                "message": f"File '{filename}' deleted successfully",
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to delete file: {str(e)}"
            }
    
    response = query_table.select(
        result=delete_file(pw.this.filename)
    )
    return response


def handle_list_files(query_table: pw.Table) -> pw.Table:
    """List all files in data_room with metadata"""
    @pw.udf
    def list_files(_: str) -> pw.Json:
        try:
            files = []
            
            if not os.path.exists(DATA_DIRECTORY):
                return {"files": [], "total_count": 0}
            
            for filename in os.listdir(DATA_DIRECTORY):
                file_path = os.path.join(DATA_DIRECTORY, filename)
                
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    files.append({
                        "filename": filename,
                        "path": file_path,
                        "size": stat.st_size,
                        "size_mb": round(stat.st_size / (1024 * 1024), 2),
                        "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "extension": os.path.splitext(filename)[1]
                    })
            
            # Sort by modification time (newest first)
            files.sort(key=lambda x: x["modified"], reverse=True)
            
            return {
                "files": files,
                "total_count": len(files),
                "directory": DATA_DIRECTORY,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "error": str(e),
                "files": [],
                "total_count": 0
            }
    
    response = query_table.select(
        result=list_files(query_table.id)
    )
    return response


def main():
    print("=" * 70)
    print("🚀 Pathway Enhanced RAG Server")
    print("=" * 70)
    
    # Setup components
    embedder = embedders.SentenceTransformerEmbedder(
        model=EMBEDDING_MODEL,
        call_kwargs={"show_progress_bar": False}
    )
    
    llm_chat = llms.OpenAIChat(
        model=LLM_MODEL,
        api_key=OPENROUTER_API_KEY,
        base_url=LLM_API_BASE,
        temperature=0.7,
        max_tokens=1000,
        retry_strategy=pw.udfs.ExponentialBackoffRetryStrategy(max_retries=3)
    )
    
    parser = parsers.UnstructuredParser()
    
    text_splitter = splitters.TokenCountSplitter(
        max_tokens=CHUNK_SIZE,
        encoding_name="cl100k_base" 
    )
    
    print(f"📂 Monitoring directory: {DATA_DIRECTORY}")
    data_source = pw.io.fs.read(
        DATA_DIRECTORY,
        format="binary",
        mode="streaming",
        with_metadata=True
    )
    
    doc_store = VectorStoreServer(
        data_source,
        embedder=embedder,
        splitter=text_splitter,
        parser=parser
    )

    rag_app = BaseRAGQuestionAnswerer(
        llm=llm_chat,
        indexer=doc_store,
        search_topk=TOP_K,
        prompt_template=(
            "You are a document Q&A assistant that answers questions based ONLY on the provided document context. Follow these rules strictly:\n\n"
            "### Response Guidelines:\n\n"
            "1. **Greeting Handling**: If the user sends a greeting (hi, hello, hey, etc.) or non-question, respond conversationally WITHOUT citing documents. Example: \"Hello! I'm here to help you with questions about your uploaded documents. What would you like to know?\"\n\n"
            "2. **Citation Accuracy**:\n"
            "   - ONLY cite sources when directly quoting or paraphrasing specific information from the document\n"
            "   - Each citation [n] must correspond to a specific, verifiable passage in the source\n"
            "   - Do NOT add citations to general statements or your own analysis\n"
            "   - Place citations immediately after the specific claim they support, not at the end of paragraphs\n\n"
            "3. **Relevance Filtering**:\n"
            "   - Only include sources with relevance score > 70%\n"
            "   - Prioritize sources that directly answer the user's question\n"
            "   - If no relevant sources exist for a question, say \"I couldn't find specific information about that in your documents\"\n\n"
            "4. **Citation Format**:\n"
            "   - Return citations with exact page numbers and line ranges\n"
            "   - Include the exact quoted text (not paraphrased) in the excerpt field\n"
            "   - Limit excerpts to 1-2 sentences that directly support the citation\n\n"
            "5. **Response Structure**:\n"
            "   - Lead with a direct answer to the question\n"
            "   - Support with specific citations only where needed\n"
            "   - Keep responses concise and focused\n\n"
            "### Source Citation Schema:\n"
            "{\n"
            "  \"documentName\": \"exact filename\",\n"
            "  \"pageNumber\": <actual page number, 1-indexed>,\n"
            "  \"lineNumber\": <line or paragraph reference>,\n"
            "  \"excerpt\": \"<exact verbatim quote from document>\",\n"
            "  \"relevance\": <0.0-1.0 based on semantic similarity to query>\n"
            "}\n\n"
            "Context:\n{context}\n\n"
            "Question: {query}\n"
        )
    )
    
    # Use QASummaryRestServer - it handles all RAG endpoints automatically
    rag_server = QASummaryRestServer(
        host=SERVER_HOST,
        port=SERVER_PORT,
        rag_question_answerer=rag_app
    )
        
    rag_server.run(
        with_cache=True,
        cache_backend=pw.persistence.Backend.filesystem("./Cache")
    )

if __name__ == "__main__":
    main()
