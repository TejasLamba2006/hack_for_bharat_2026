# Flask Proxy Server API

## Architecture

**Single Entry Point - No CORS Issues!** 🎉

The Flask server on port 9001 acts as a **proxy/bridge**:

```
Frontend (3000) → Flask Proxy (9001) → Pathway RAG (9000)
                       ↓
                  data_room/
```

**All requests go to ONE server:** `http://207.244.225.17:9001`

## Benefits

✅ **No CORS errors** - Single origin for frontend  
✅ **Simplified frontend** - One base URL for everything  
✅ **File management** - Direct file upload/delete  
✅ **RAG queries** - Auto-forwarded to Pathway  

## Base URL

```
http://207.244.225.17:9001
```

**Use this URL for ALL endpoints (RAG + File Management)**

---

## RAG Endpoints (Proxied to Pathway)

### 1. Ask Questions (RAG with LLM)

**Endpoint:** `POST http://207.244.225.17:9001/v1/pw_ai_answer`

**Request:**

```json
{
  "query": "What is the main topic of the documents?"
}
```

**Response:**

```json
{
  "result": "Based on the documents, the main topic is...",
  "sources": [
    {
      "path": "data_room/sample.pdf",
      "relevance": 0.95
    }
  ]
}
```

**Frontend Example:**

```typescript
const askQuestion = async (query: string) => {
  const response = await fetch('http://207.244.225.17:9001/v1/pw_ai_answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return await response.json();
};
```

---

### 2. Vector Search (Without LLM)

**Endpoint:** `POST http://207.244.225.17:9001/v1/retrieve`

**Request:**

```json
{
  "query": "environmental impact",
  "k": 5
}
```

**Response:**

```json
{
  "results": [
    {
      "text": "Retrieved text chunk...",
      "metadata": {...}
    }
  ]
}
```

---

## File Management Endpoints (Direct)

### 3. Upload File

**Endpoint:** `POST http://207.244.225.17:9001/v1/upload`

**Request:**

```json
{
  "filename": "report.pdf",
  "content": "base64_encoded_file_content_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "File 'report.pdf' uploaded successfully",
  "path": "data_room/report.pdf",
  "size": 12345,
  "timestamp": "2026-02-24T10:30:00"
}
```

**Frontend Example:**

```typescript
const uploadFile = async (file: File) => {
  // Convert file to base64
  const reader = new FileReader();
  const base64Content = await new Promise<string>((resolve) => {
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:*/*;base64, prefix
      resolve(base64.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const response = await fetch('http://207.244.225.17:9001/v1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      content: base64Content
    })
  });
  
  return await response.json();
};
```

---

### 4. Delete File

**Endpoint:** `POST http://207.244.225.17:9001/v1/delete`

**Request:**

```json
{
  "filename": "report.pdf"
}
```

**Response:**

```json
{
  "success": true,
  "message": "File 'report.pdf' deleted successfully",
  "timestamp": "2026-02-24T10:35:00"
}
```

**Frontend Example:**

```typescript
const deleteFile = async (filename: string) => {
  const response = await fetch('http://207.244.225.17:9001/v1/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename })
  });
  return await response.json();
};
```

---

### 5. List Files with Metadata

**Endpoint:** `GET http://207.244.225.17:9001/v1/files` or `POST http://207.244.225.17:9001/v1/files`

**Request:**

```json
{}
```

**Response:**

```json
{
  "files": [
    {
      "filename": "report.pdf",
      "path": "data_room/report.pdf",
      "size": 12345,
      "size_mb": 0.01,
      "modified": "2026-02-24T10:30:00",
      "extension": ".pdf"
    }
  ],
  "total_count": 1,
  "directory": "data_room",
  "timestamp": "2026-02-24T10:40:00"
}
```

**Frontend Example:**

```typescript
const listFiles = async () => {
  const response = await fetch('http://207.244.225.17:9001/v1/files', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
};
```

---

## RAG Server Endpoints (Port 9000)

### 6. List Indexed Documents

**Endpoint:** `POST http://207.244.225.17:9001/v1/pw_list_documents`

**Request:**

```json
{
  "keys": ["path", "modified_at"]
}
```

**Response:**

```json
{
  "documents": [
    {
      "path": "data_room/sample.pdf",
      "modified_at": "2026-02-24T10:00:00"
    }
  ]
}
```

---

## Complete Frontend Integration Example

```typescript
// lib/api.ts
const API_BASE = 'http://207.244.225.17:9001';  // Single URL for everything!

export const api = {
  // RAG Question Answering (Proxied to Pathway)
  askQuestion: async (query: string) => {
    const res = await fetch(`${API_BASE}/v1/pw_ai_answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return await res.json();
  },

  // File Management (Direct)
  uploadFile: async (file: File) => {
    const base64 = await fileToBase64(file);
    const res = await fetch(`${API_BASE}/v1/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        content: base64
      })
    });
    return await res.json();
  },

  deleteFile: async (filename: string) => {
    const res = await fetch(`${API_BASE}/v1/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    return await res.json();
  },

  listFiles: async () => {
    const res = await fetch(`${API_BASE}/v1/files`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  // Search (Proxied to Pathway)
  search: async (query: string, k = 5) => {
    const res = await fetch(`${API_BASE}/v1/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k })
    });
    return await res.json();
  }
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:*/*;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

---

## Component Example: File Upload

```tsx
// components/FileUploader.tsx
import { useState } from 'react';
import { api } from '@/lib/api';

export function FileUploader() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert('Upload failed: ' + error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        accept=".pdf,.txt,.doc,.docx"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

---

## Component Example: File Manager

```tsx
// components/FileManager.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface FileInfo {
  filename: string;
  size_mb: number;
  modified: string;
}

export function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await api.listFiles();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    
    try {
      const result = await api.deleteFile(filename);
      if (result.success) {
        alert('✅ File deleted');
        loadFiles(); // Refresh list
      }
    } catch (error) {
      alert('❌ Delete failed: ' + error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  if (loading) return <p>Loading files...</p>;

  return (
    <div>
      <h2>Files ({files.length})</h2>
      <ul>
        {files.map(file => (
          <li key={file.filename}>
            <span>{file.filename} ({file.size_mb} MB)</span>
            <button onClick={() => handleDelete(file.filename)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Starting the Servers

### Start Both Servers

```bash
# Terminal 1: Start Pathway RAG Server
python -m backend.services.pathway_rag_server

# Terminal 2: Start Flask Proxy Server
python -m backend.services.file_management_server
```

Or use the startup script:

```bash
bash start_all_servers.sh
```

### Install Dependencies

```bash
pip install -r requirements.txt
# Installs: pathway, flask, flask-cors, requests, python-dotenv
```

---

## Architecture Notes

### Proxy Pattern Benefits

1. **No CORS Errors**: Frontend only talks to Flask (9001), same origin
2. **Single URL**: All requests go to `http://207.244.225.17:9001`
3. **Simplified Frontend**: One base URL for everything
4. **Backend Isolation**: Pathway server (9000) not exposed directly

### Request Flow

```
┌─────────────┐
│  Frontend   │
│  Port 3000  │
└──────┬──────┘
       │ All requests to port 9001
       │ (No CORS issues!)
       ▼
┌─────────────────────────────┐
│  Flask Proxy Server         │
│  Port 9001                  │
│  ┌──────────┬──────────┐   │
│  │ Direct   │ Proxied  │   │
│  │ Handlers │ to 9000  │   │
│  └──────────┴──────────┘   │
└───────┬──────────────┬──────┘
        │              │
   Files stored   Forwarded to
        │              │
        ▼              ▼
   ┌─────────┐  ┌──────────────┐
   │data_room│  │ Pathway RAG  │
   │         │  │ Port 9000    │
   └─────────┘  │ (Internal)   │
        ▲        └──────────────┘
        │                │
        └────────────────┘
        Auto-indexed (30s)
```

### Endpoint Routing

**Direct Handling (Flask):**

- `/v1/upload` - Saves files to `data_room/`
- `/v1/delete` - Removes files from `data_room/`
- `/v1/files` - Lists files with metadata
- `/health` - Health check

**Proxied to Pathway (Port 9000):**

- `/v1/pw_ai_answer` - RAG question answering
- `/v1/retrieve` - Vector search
- `/v1/pw_list_documents` - List indexed documents
- `/v1/pw_ai_summary` - Text summarization

---

## Notes

1. **File Upload**: Files are sent as base64-encoded strings
2. **CORS**: Flask handles CORS, proxies requests to Pathway
3. **Streaming**: Pathway's file watcher automatically indexes new files
4. **Real-time**: Uploaded files indexed within ~30 seconds
5. **Single Origin**: Frontend uses ONE URL (9001), no CORS issues
6. **Timeouts**: RAG requests have 60s timeout, search 30s
