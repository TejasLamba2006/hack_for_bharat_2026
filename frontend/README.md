# Document Chat Interface

Web frontend for asking questions about documents using RAG. Upload files, ask questions, get answers with citations. Connected to the Pathway backend for everything.

## What you get

- Upload PDFs, TXT, MD, DOCX (10MB max)
- Chat interface for Q&A
- Citations show which doc and line number
- Loading animations
- Search with relevance scoring
- Analytics dashboard
- Everything in browser localStorage
- Works on mobile

## Pages

### Home (/)

Upload docs with drag-and-drop. See recent uploads and stats. Demo data button for testing.

### Chat (/chat)

Ask about your documents. Answers come with expandable citations showing line numbers and relevance. Typing indicators included.

### Admin (/admin)

Two tabs:

- Analytics: Charts, logs, usage for the past week
- Documents: Manage docs, view metadata, bulk delete

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS v4
- Browser localStorage
- Lucide icons
- Token search
- Client-side

## Setup

```bash
cd frontend

npm install
# or
pnpm install

npm run dev
# or
pnpm dev
```

Go to <http://localhost:3000>.

## Using it

### Upload

1. Open home page
2. Drag and drop or click to browse
3. PDF, TXT, MD, DOCX only (10MB max)
4. File shows up in chat immediately

### Chat

1. Go to chat page
2. Ask something like "What's this about?" or "Explain X"
3. Get an answer with citations
4. Click citations to see:
   - Source file
   - Line number
   - Original text
   - Relevance (0-100%)

### Manage

1. Admin dashboard
2. Documents tab lists everything
3. Delete one or clear all
4. Analytics shows last 7 days

## Demo

Click "Load Demo Data" at the bottom of home to populate with samples.

## Files

```
├── app/
│   ├── layout.tsx        # Root
│   ├── page.tsx          # Home/upload
│   ├── globals.css       # Styles
│   ├── chat/
│   │   └── page.tsx      # Chat UI
│   └── admin/
│       └── page.tsx      # Dashboard
├── components/
│   ├── upload-form.tsx   # Upload
│   ├── document-list.tsx # Doc display
│   ├── chat-message.tsx  # Messages
│   ├── analytics-dashboard.tsx
│   └── demo-loader.tsx
├── lib/
│   ├── types.ts          # Types
│   ├── storage.ts        # localStorage
│   └── search.ts         # Search
└── public/
```

## Storage

localStorage holds:

- Documents (content, metadata, timestamps)
- Analytics (logs, search history)

Persists until you clear browser cache. Most browsers give 5-10MB.

## Components

### UploadForm

Drag-and-drop with validation and status.

### DocumentList

Shows docs with metadata and delete.

### ChatMessage

Messages with animations, citations, line numbers, relevance. Loading dots included.

### AnalyticsDashboard

Stats, charts, logs including chat.

## Search

Token matching:

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
