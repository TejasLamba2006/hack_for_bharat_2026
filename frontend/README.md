# DocSearch - Document Chat Interface

A Next.js frontend for asking questions about documents using RAG (Retrieval-Augmented Generation). Upload files, ask questions, get AI-powered answers with source citations. **Now fully integrated with the Pathway REST backend!**

> **🎉 Integration Complete!** The frontend is now fully connected to the Pathway backend for RAG chat, semantic search, and real-time statistics. See [INTEGRATION.md](./INTEGRATION.md) for details.

## Features

- Upload PDF, TXT, MD, and DOCX files (max 10MB)
- Chat interface for document Q&A
- Source citations show which document and line number
- Animated UI with loading states
- Token-based search with relevance scoring
- Analytics dashboard tracks uploads and activity
- Everything stored in browser localStorage
- Responsive design

## Pages

### Home (/)

Upload documents via drag-and-drop or file picker. See recently uploaded files and basic stats. Includes a demo data loader for testing.

### Chat (/chat)

Ask questions about your documents. Responses include expandable source citations with line numbers and relevance scores. Typing indicators and animations included.

### Admin (/admin)

Two tabs:

- Analytics: Activity charts, event logs, usage stats for the past 7 days
- Documents: Manage all documents, view metadata, bulk delete

## Tech stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS v4
- Browser localStorage
- Lucide React icons
- Token-based search algorithm
- Client-side rendering

## Installation

```bash
cd docsearch

npm install
# or
pnpm install
# or
yarn install

npm run dev
# or
pnpm dev
# or
yarn dev
```

Open <http://localhost:3000> in your browser.

## Usage

### Upload documents

1. Go to the upload page (home)
2. Drag and drop a file or click to browse
3. Supported: PDF, TXT, MD, DOCX (max 10MB)
4. File is instantly available in chat

### Chat with documents

1. Go to the chat page
2. Ask a question (e.g., "What is this about?", "Explain X")
3. View the answer with source citations
4. Click citations to see:
   - Source document name
   - Line number
   - Original excerpt
   - Relevance score (0-100%)

### Manage documents

1. Go to admin dashboard
2. Documents tab shows all uploads
3. Delete individual files or clear all
4. Analytics tab shows activity over the past 7 days

## Demo data

Click "Load Demo Data" in the bottom-right of the home page to populate the system with sample documents and analytics for testing.

## File structure

```
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/upload page
│   ├── globals.css          # Global styles
│   ├── chat/
│   │   └── page.tsx         # Chat interface
│   └── admin/
│       └── page.tsx         # Admin dashboard
├── components/
│   ├── upload-form.tsx      # File upload
│   ├── document-list.tsx    # Document display
│   ├── chat-message.tsx     # Chat messages
│   ├── analytics-dashboard.tsx # Analytics
│   └── demo-loader.tsx      # Demo data
├── lib/
│   ├── types.ts             # TypeScript types
│   ├── storage.ts           # localStorage wrapper
│   └── search.ts            # Search algorithm
├── BACKEND_ENDPOINTS.md     # Backend API docs
└── public/                  # Static files
```

## Storage

Everything is stored in browser localStorage:

- Documents (content, metadata, timestamps)
- Analytics (event logs, search history)
- Data persists until browser cache is cleared

Max storage is typically 5-10MB depending on browser.

## Components

### UploadForm

Handles file uploads with drag-and-drop, validation, and status feedback.

### DocumentList

Shows uploaded documents with metadata and delete buttons.

### ChatMessage

Renders chat messages with fade-in animations, source citations, line numbers, and relevance scores. Includes a loading indicator with animated dots.

### AnalyticsDashboard

Shows usage stats, activity charts, and event logs including chat interactions.

## Search algorithm

Token-based matching:

- Documents are split into tokens
- Matches ranked by term frequency
- Results include relevance score (0-1)
- Context extraction shows excerpts near matches
- Line numbers calculated for precise references

This is not true semantic search (requires embeddings from a backend). It's keyword matching with scoring.

## Current implementation

This is a client-side demo using localStorage. The chat interface is designed to integrate with a RAG backend. See `BACKEND_ENDPOINTS.md` for the backend API spec, including:

- `POST /v1/pw_ai_answer` - Get AI answers with sources
- `POST /v1/retrieve` - Search documents
- `POST /v1/statistics` - System stats
- And 5 more endpoints

## Limitations

Client-side demo only. No real backend yet.

- All processing in browser
- localStorage size limits (~5-10MB)
- Template-based responses (not a real LLM)
- Keyword search (not semantic)
- Max 10MB per file
- No persistence if cache is cleared

## Next steps

To connect to the backend:

1. Start the backend service (see main README)
2. Update API calls in the frontend to point to `http://localhost:8000`
3. Replace mock search with real backend calls
4. Add streaming response support
5. Implement proper error handling

Future features:

- Real LLM integration with streaming
- Semantic search with embeddings
- OCR for scanned files
- User authentication
- Export and sharing
- WebSocket for live updates

## Browser support

Chrome/Edge 90+, Firefox 88+, Safari 14+. Any modern browser with localStorage.

## License

MIT License - free to use and modify.
