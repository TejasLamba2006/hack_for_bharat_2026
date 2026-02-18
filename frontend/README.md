# DocSearch - AI-Powered Document Chat Interface

A modern document management system with an interactive AI chat interface for asking questions about your documents. Built with Next.js, React, and Tailwind CSS. Get answers directly from your documents with full source citations.

## Features

- **📁 Document Upload**: Upload PDF, TXT, MD, and DOCX files up to 10MB
- **💬 AI Chat Interface**: Ask natural questions about your documents and get answers
- **📍 Source Citations**: Every answer includes document references with line numbers
- **✨ Animated UI**: Smooth animations with thinking indicators and loading states
- **🔍 Smart Search**: Token-based semantic search with relevance scoring
- **📊 Analytics Dashboard**: Track uploads, chats, and document management activities
- **💾 Local Storage**: All data stored securely in the browser using localStorage
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Pages

### Home Page (`/`)
- Upload new documents via drag-and-drop or file picker
- View recently uploaded documents
- Quick statistics on document count and total size
- Automatic file validation and error handling
- Load demo data for testing

### Chat Page (`/chat`)
- Interactive chat interface for asking questions about documents
- AI-generated responses based on document content
- Expandable source citations with line numbers and relevance scores
- Animated chat bubbles with loading indicators
- Real-time search and matching
- Document count indicator

### Admin Dashboard (`/admin`)
- **Analytics Tab**: View activity charts, event logs, and usage statistics
- **Documents Tab**: Manage all documents with detailed metadata
- Bulk operations support (delete all documents)
- 7-day activity tracking with chat events
- Event breakdown by type (upload, chat, delete)

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Storage**: Browser localStorage API
- **Icons**: Lucide React
- **Search**: Token-based semantic search with relevance scoring
- **Animations**: Tailwind CSS animations with smooth transitions
- **Chat**: Real-time message updates with source tracking

## Getting Started

### Installation

```bash
# Clone or download the project
cd docsearch

# Install dependencies
npm install
# or
pnpm install
# or
yarn install

# Start development server
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Uploading Documents

1. Navigate to the **Upload** page (home)
2. Drag and drop a file or click to browse
3. Supported formats: PDF, TXT, MD, DOCX
4. Maximum file size: 10MB
5. Your document will be instantly available for chat

### Chatting with Documents

1. Go to the **Chat** page
2. Ask any question about your documents (e.g., "What is this about?", "Tell me about X", "How does Y work?")
3. The AI searches your documents and generates an answer
4. Click on source citations to see:
   - Which document the answer came from
   - The exact line number in the document
   - The original excerpt
   - Relevance score (0-100%)
5. Ask follow-up questions to explore content further

### Managing Documents

1. Navigate to the **Admin** dashboard
2. Use the **Documents** tab to view all uploads
3. Delete individual documents or clear all at once
4. View detailed file information (size, upload date)

### Viewing Analytics

1. Go to the **Admin** dashboard
2. Review the **Analytics** tab for:
   - Total uploads, chats, and operations count
   - 7-day activity chart
   - Recent event logs (including chat interactions)
   - Database statistics

## Demo Data

A demo loader button is available in the bottom-right corner of the home page. Click "Load Demo Data" to populate the system with sample documents and analytics for testing.

## File Structure

```
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home/upload page
│   ├── globals.css          # Global styles and animations
│   ├── chat/
│   │   └── page.tsx         # Chat interface page
│   └── admin/
│       └── page.tsx         # Admin dashboard
├── components/
│   ├── upload-form.tsx      # File upload component
│   ├── document-list.tsx    # Document list display
│   ├── chat-message.tsx     # Animated chat message with sources
│   ├── analytics-dashboard.tsx # Analytics visualization
│   └── demo-loader.tsx      # Demo data loader
├── lib/
│   ├── types.ts             # TypeScript interfaces (includes chat types)
│   ├── storage.ts           # localStorage wrapper
│   └── search.ts            # Search algorithm with source tracking
├── BACKEND_ENDPOINTS.md     # Backend API documentation
└── public/                  # Static assets
```

## Data Storage

All data is stored locally in the browser using the `localStorage` API:

- **Documents**: Stored with full content, metadata, and timestamps
- **Analytics**: Event logs tracking uploads, searches, and deletions
- **Search History**: Recent search queries for quick access

**Note**: Data persists until manually cleared or browser cache is emptied.

## Key Components

### UploadForm
Handles file uploads with validation, drag-and-drop support, and status feedback.

### DocumentList
Displays uploaded documents with metadata and delete functionality.

### ChatMessage
Renders animated chat messages with:
- Smooth fade-in animations
- User and assistant message styling
- Expandable source citations
- Line numbers and relevance scores
- Loading indicator with animated dots

### AnalyticsDashboard
Visualizes usage statistics, activity trends, and recent events including chat interactions.

## Search Algorithm

The search implementation uses:
- **Token-based matching**: Documents are matched based on term frequency
- **Relevance scoring**: Results ranked by match quality (0-1 scale)
- **Context extraction**: Shows document excerpts near matches
- **Keyword extraction**: Suggests relevant search terms
- **Source tracking**: Records line numbers and exact excerpts for citations
- **Line number calculation**: Maps matches back to document lines for precise references

## Current Implementation

**Client-Side Demo**: This version includes a fully functional client-side demo with localStorage persistence for testing and demonstration purposes.

**Backend Ready**: The chat interface is designed to seamlessly integrate with a RAG (Retrieval Augmented Generation) backend. See `BACKEND_ENDPOINTS.md` for complete backend API documentation including:
- `POST /v1/pw_ai_answer` - Get AI answers with source citations
- `POST /v1/retrieve` - Search documents
- `POST /v1/statistics` - System statistics
- And 5 more endpoints for complete RAG functionality

## Limitations (Client-Side Demo)

- **Client-side only**: All processing happens in the browser
- **Storage limit**: Limited by browser localStorage (~5-10MB)
- **No real AI**: Uses template-based responses (requires backend for real LLM)
- **Token-based search**: Not true semantic search (requires backend embeddings)
- **File size**: Maximum 10MB per document
- **No persistence**: Data is lost when cache is cleared

## Future Enhancements

- Real backend RAG integration with streaming responses
- Advanced LLM integration (GPT-4, Claude, Deepseek, etc.)
- True semantic search with embeddings
- Full-text search capabilities
- Document OCR for scanned files
- Collaborative features and user accounts
- Advanced filtering and sorting
- Export and sharing options
- Real-time document updates with WebSockets
- User authentication and multi-user support

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with localStorage support

## License

MIT License - Free to use and modify

## Support

For issues, feature requests, or questions, please refer to the documentation or contact support.

---

Built with ❤️ using Next.js and Tailwind CSS
