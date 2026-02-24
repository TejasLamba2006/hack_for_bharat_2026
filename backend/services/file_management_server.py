"""
Flask Proxy Server - Acts as a bridge between frontend and Pathway RAG server
Handles CORS and forwards all RAG requests to Pathway server on port 9000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger, swag_from
import os
import base64
import datetime
from pathlib import Path
import sys
import requests

sys.path.append(str(Path(__file__).parent.parent.parent))
from backend.core.config import DATA_DIRECTORY, SERVER_HOST, SERVER_PORT

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Hack For Bharat 2026 - RAG API",
        "description": "Flask Proxy Server for Pathway RAG with file management capabilities",
        "version": "1.0.0",
        "contact": {
            "name": "API Support",
            "url": "https://github.com/TejasLamba2006/hack_for_bharat_2026"
        }
    },
    "host": "207.244.225.17:9001",
    "basePath": "/",
    "schemes": ["http"],
    "tags": [
        {
            "name": "File Management",
            "description": "Upload, delete, and list files"
        },
        {
            "name": "RAG (Proxied)",
            "description": "Question answering and document retrieval (proxied to Pathway)"
        },
        {
            "name": "System",
            "description": "Health checks and system information"
        }
    ]
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# This server's port
PROXY_PORT = 9001

# Pathway RAG server URL (internal)
# Use localhost/127.0.0.1 for client connections, not 0.0.0.0
PATHWAY_SERVER = "http://127.0.0.1:9000"


@app.route('/v1/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    """Upload a file to data_room
    ---
    tags:
      - File Management
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - filename
            - content
          properties:
            filename:
              type: string
              example: "document.pdf"
              description: Name of the file to upload
            content:
              type: string
              example: "SGVsbG8gV29ybGQ="
              description: Base64 encoded file content
    responses:
      200:
        description: File uploaded successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "File 'document.pdf' uploaded successfully"
            path:
              type: string
              example: "data_room/document.pdf"
            size:
              type: integer
              example: 12345
            size_mb:
              type: number
              example: 0.01
            timestamp:
              type: string
              example: "2026-02-24T10:30:00"
            note:
              type: string
              example: "File will be auto-indexed by Pathway within ~30 seconds"
      400:
        description: Missing filename or content
      500:
        description: Upload failed
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        filename = data.get('filename')
        content = data.get('content')  # base64 encoded
        
        if not filename or not content:
            return jsonify({
                "success": False,
                "message": "Missing  filename or content"
            }), 400
        
        # Ensure data_room directory exists
        os.makedirs(DATA_DIRECTORY, exist_ok=True)
        
        # Decode base64 content
        file_data = base64.b64decode(content)
        
        # Save file to data_room
        file_path = os.path.join(DATA_DIRECTORY, filename)
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return jsonify({
            "success": True,
            "message": f"File '{filename}' uploaded successfully",
            "path": file_path,
            "size": len(file_data),
            "size_mb": round(len(file_data) / (1024 * 1024), 2),
            "timestamp": datetime.datetime.now().isoformat(),
            "note": "File will be auto-indexed by Pathway within ~30 seconds"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to upload file: {str(e)}"
        }), 500


@app.route('/v1/delete', methods=['POST', 'OPTIONS'])
def delete_file():
    """Delete a file from data_room
    ---
    tags:
      - File Management
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - filename
          properties:
            filename:
              type: string
              example: "document.pdf"
              description: Name of the file to delete
    responses:
      200:
        description: File deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
            timestamp:
              type: string
            note:
              type: string
      404:
        description: File not found
      400:
        description: Missing filename
      500:
        description: Delete failed
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({
                "success": False,
                "message": "Missing filename"
            }), 400
        
        file_path = os.path.join(DATA_DIRECTORY, filename)
        
        if not os.path.exists(file_path):
            return jsonify({
                "success": False,
                "message": f"File '{filename}' not found"
            }), 404
        
        os.remove(file_path)
        
        return jsonify({
            "success": True,
            "message": f"File '{filename}' deleted successfully",
            "timestamp": datetime.datetime.now().isoformat(),
            "note": "Pathway will update index automatically"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to delete file: {str(e)}"
        }), 500


@app.route('/v1/files', methods=['GET', 'POST', 'OPTIONS'])
def list_files():
    """List all files in data_room with metadata
    ---
    tags:
      - File Management
    responses:
      200:
        description: List of files with metadata
        schema:
          type: object
          properties:
            files:
              type: array
              items:
                type: object
                properties:
                  filename:
                    type: string
                  path:
                    type: string
                  size:
                    type: integer
                  size_mb:
                    type: number
                  modified:
                    type: string
                  extension:
                    type: string
                  type:
                    type: string
            total_count:
              type: integer
            directory:
              type: string
            timestamp:
              type: string
      500:
        description: Error listing files
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        files = []
        
        if not os.path.exists(DATA_DIRECTORY):
            return jsonify({
                "files": [],
                "total_count": 0,
                "directory": DATA_DIRECTORY
            })
        
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
                    "extension": os.path.splitext(filename)[1],
                    "type": _get_file_type(os.path.splitext(filename)[1])
                })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return jsonify({
            "files": files,
            "total_count": len(files),
            "directory": DATA_DIRECTORY,
            "timestamp": datetime.datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "files": [],
            "total_count": 0
        }), 500


def _get_file_type(extension):
    """Get human-readable file type from extension"""
    ext_map = {
        '.pdf': 'PDF Document',
        '.txt': 'Text File',
        '.doc': 'Word Document',
        '.docx': 'Word Document',
        '.csv': 'CSV File',
        '.xlsx': 'Excel Spreadsheet',
        '.xls': 'Excel Spreadsheet',
        '.md': 'Markdown File',
    }
    return ext_map.get(extension.lower(), 'Unknown')


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint
    ---
    tags:
      - System
    responses:
      200:
        description: Server is healthy
        schema:
          type: object
          properties:
            status:
              type: string
              example: "healthy"
            service:
              type: string
              example: "Proxy Server (Flask → Pathway)"
            data_directory:
              type: string
            pathway_server:
              type: string
            timestamp:
              type: string
    """
    return jsonify({
        "status": "healthy",
        "service": "Proxy Server (Flask → Pathway)",
        "data_directory": DATA_DIRECTORY,
        "pathway_server": PATHWAY_SERVER,
        "timestamp": datetime.datetime.now().isoformat()
    })


# ==============================================================================
# PROXY ENDPOINTS - Forward requests to Pathway RAG server
# ==============================================================================

@app.route('/v1/pw_ai_answer', methods=['POST', 'OPTIONS'])
def proxy_ai_answer():
    """Ask questions using RAG (Retrieval Augmented Generation)
    ---
    tags:
      - RAG (Proxied)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - query
          properties:
            query:
              type: string
              example: "What is the main topic of the documents?"
              description: The question to ask
    responses:
      200:
        description: AI-generated answer with sources
        schema:
          type: object
          properties:
            result:
              type: string
              description: The generated answer
            sources:
              type: array
              items:
                type: object
      503:
        description: Failed to connect to Pathway server
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Forward request to Pathway server
        response = requests.post(
            f"{PATHWAY_SERVER}/v1/pw_ai_answer",
            json=request.json,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        # Return the text response directly, let Flask handle it
        return response.text, response.status_code, {'Content-Type': 'application/json'}
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to connect to Pathway RAG server"
        }), 503


@app.route('/v1/retrieve', methods=['POST', 'OPTIONS'])
def proxy_retrieve():
    """Vector similarity search without LLM
    ---
    tags:
      - RAG (Proxied)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - query
          properties:
            query:
              type: string
              example: "environmental impact"
              description: Search query
            k:
              type: integer
              example: 5
              description: Number of results to return
    responses:
      200:
        description: List of relevant document chunks
      503:
        description: Failed to connect to Pathway server
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        response = requests.post(
            f"{PATHWAY_SERVER}/v1/retrieve",
            json=request.json,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        return response.text, response.status_code, {'Content-Type': 'application/json'}
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to connect to Pathway RAG server"
        }), 503


# Note: /v1/statistics endpoint removed - not available in QASummaryRestServer

@app.route('/v1/pw_list_documents', methods=['POST', 'OPTIONS'])
def proxy_list_documents():
    """List all indexed documents in the RAG system
    ---
    tags:
      - RAG (Proxied)
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            keys:
              type: array
              items:
                type: string
              example: ["path", "modified_at"]
    responses:
      200:
        description: List of indexed documents
      503:
        description: Failed to connect to Pathway server
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        response = requests.post(
            f"{PATHWAY_SERVER}/v1/pw_list_documents",
            json=request.json if request.json else {},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        return response.text, response.status_code, {'Content-Type': 'application/json'}
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to connect to Pathway RAG server"
        }), 503


@app.route('/v1/pw_ai_summary', methods=['POST', 'OPTIONS'])
def proxy_summary():
    """Summarize text using AI
    ---
    tags:
      - RAG (Proxied)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            text_list:
              type: array
              items:
                type: string
              example: ["Long text to summarize..."]
    responses:
      200:
        description: Summaries generated
      503:
        description: Failed to connect to Pathway server
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        response = requests.post(
            f"{PATHWAY_SERVER}/v1/pw_ai_summary",
            json=request.json,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        return response.text, response.status_code, {'Content-Type': 'application/json'}
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to connect to Pathway RAG server"
        }), 503


if __name__ == "__main__":
    print("=" * 70)
    print("🌉 Flask Proxy Server (Frontend ← Flask → Pathway)")
    print("=" * 70)
    print(f"🌐 Public URL: http://207.244.225.17:{PROXY_PORT}")
    print(f"🔗 Proxying to: {PATHWAY_SERVER}")
    print(f"📂 Data Directory: {DATA_DIRECTORY}")
    print("🔒 CORS: Enabled (No CORS errors!)")
    print("\n📡 Available Endpoints:")
    print("   POST /v1/pw_ai_answer      - Ask questions (proxied)")
    print("   POST /v1/retrieve          - Vector search (proxied)")
    print("   POST /v1/pw_list_documents - List docs (proxied)")
    print("   POST /v1/pw_ai_summary     - Summarize (proxied)")
    print("   POST /v1/upload            - Upload file (direct)")
    print("   POST /v1/delete            - Delete file (direct)")
    print("   GET  /v1/files             - List files (direct)")
    print("   GET  /health               - Health check")
    print("   GET  /docs                 - Swagger UI")
    print("\n💡 Frontend Integration:")
    print("   • Point ALL requests to http://207.244.225.17:9001")
    print("   • No CORS issues - single origin!")
    print("   • RAG requests auto-forwarded to Pathway")
    print("=" * 70)
    print()
    
    app.run(
        host=SERVER_HOST,
        port=PROXY_PORT,
        debug=False
    )
