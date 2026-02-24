"""
Flask server for LLM-powered chat using Pathway VectorStoreServer
Uses Pathway's LiteLLM integration for cleaner LLM calls
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import sys
from pathlib import Path

# Import Pathway LLM
from pathway.xpacks.llm import llms

# Import config
sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core.config import (
    OPENROUTER_API_KEY,
    LLM_MODEL,
    LLM_API_BASE,
    TOP_K,
    SERVER_HOST,
    SERVER_PORT
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Vector store server URL (adjust if running on different port)
VECTOR_STORE_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"

# Initialize Pathway's LLM Chat (OpenAIChat with LiteLLM support)
# Works with OpenRouter by setting api_key and base_url
llm_chat = llms.OpenAIChat(
    model=LLM_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url=LLM_API_BASE,
    temperature=0.7,
    max_tokens=1000
)

def retrieve_documents(query: str, k: int = TOP_K):
    """Retrieve relevant documents from VectorStoreServer"""
    try:
        response = requests.post(
            f"{VECTOR_STORE_URL}/v1/retrieve",
            json={"query": query, "k": k}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error retrieving documents: {e}")
        return None

def call_llm(prompt: str):
    """Call LLM using Pathway's OpenAIChat (LiteLLM compatible)"""
    try:
        # Pathway's OpenAIChat can be called directly
        # It uses LiteLLM under the hood when base_url is set
        response = llm_chat(
            [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that answers questions based on provided context. If you cannot answer based on the context, say so."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
        )
        return response
    except Exception as e:
        print(f"Error calling LLM: {e}")
        import traceback
        traceback.print_exc()
        return f"Error generating answer: {str(e)}"

@app.route("/v1/pw_ai_answer", methods=["POST", "OPTIONS"])
def pw_ai_answer():
    """Answer questions using RAG (Retrieve + LLM)"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        data = request.json
        query = data.get("query", "")
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        # 1. Retrieve relevant documents
        print(f"🔍 Query: {query}")
        retrieval_result = retrieve_documents(query)
        
        if not retrieval_result:
            return jsonify({
                "result": "Sorry, I couldn't retrieve relevant documents.",
                "sources": []
            })
        
        # Extract chunks and metadata
        chunks = retrieval_result.get("chunks", [])
        if not chunks:
            return jsonify({
                "result": "No relevant information found in the knowledge base.",
                "sources": []
            })
        
        # 2. Build context from retrieved chunks
        context = "\n\n".join([
            f"[Document {i+1}] {chunk.get('text', '')}"
            for i, chunk in enumerate(chunks[:TOP_K])
        ])
        
        # 3. Create RAG prompt
        rag_prompt = f"""Based on the following context, answer the user's question.

Context:
{context}

Question: {query}

Answer:"""
        
        # 4. Call LLM
        print(f"🤖 Calling LLM ({LLM_MODEL})...")
        answer = call_llm(rag_prompt)
        
        # 5. Extract sources
        sources = [
            {
                "path": chunk.get("metadata", {}).get("path", "Unknown"),
                "score": chunk.get("score", 0.0)
            }
            for chunk in chunks[:TOP_K]
        ]
        
        return jsonify({
            "result": answer,
            "sources": sources
        })
        
    except Exception as e:
        print(f"❌ Error in pw_ai_answer: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/v1/retrieve", methods=["POST", "OPTIONS"])
def retrieve():
    """Proxy to VectorStoreServer retrieve endpoint"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        # Forward request to VectorStoreServer
        response = requests.post(
            f"{VECTOR_STORE_URL}/v1/retrieve",
            json=request.json
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/v1/statistics", methods=["POST", "GET", "OPTIONS"])
def statistics():
    """Proxy to VectorStoreServer statistics endpoint"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        response = requests.get(f"{VECTOR_STORE_URL}/v1/statistics")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/v1/pw_list_documents", methods=["POST", "OPTIONS"])
def list_documents():
    """Proxy to VectorStoreServer inputs endpoint"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        response = requests.get(f"{VECTOR_STORE_URL}/v1/inputs")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    print(f"🚀 Starting LLM Chat Server on http://{SERVER_HOST}:5000")
    print(f"📡 Vector Store at: {VECTOR_STORE_URL}")
    print(f"🤖 Using LLM: {LLM_MODEL}")
    print(f"✅ CORS enabled\n")
    
    app.run(host=SERVER_HOST, port=5000, debug=True)
