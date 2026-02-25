# Frontend for Document Upload + AI Search System - v0.dev Prompt

Create a modern, unique web interface for "Hack For Green Bharat 2026" - a **DOCUMENT UPLOAD AND SEARCH SYSTEM** where users can:

1. **Upload their own documents** (PDF, DOC, CSV, TXT)
2. **Documents get automatically indexed** by the AI backend
3. **Ask questions about the uploaded documents** and get AI-generated answers with sources

**THIS IS NOT A QUIZ APP** - This is a personal knowledge base / document search system powered by RAG (Retrieval Augmented Generation).

Think: **"Google Drive meets ChatGPT"** - users upload files, then ask questions and get answers from those files.

## � What This System Does (Example Use Cases)

**Example 1: Environmental Reports**

- User uploads "Climate_Report_2025.pdf"
- User asks: "What are the top 3 carbon emission sources mentioned?"
- AI searches the PDF, finds relevant sections, and answers

**Example 2: Research Papers**

- User uploads 5 research papers about renewable energy
- User asks: "Compare the efficiency of solar vs wind energy"
- AI searches all 5 papers and provides a comparative answer with citations

**Example 3: Government Documents**

- User uploads policy documents
- User asks: "What are the penalties for illegal logging?"
- AI extracts relevant sections and provides the answer

**THIS IS NOT:**

- ❌ A quiz app with pre-defined questions
- ❌ A chatbot with general knowledge
- ❌ A system with pre-indexed content

**THIS IS:**

- ✅ A personal knowledge base builder
- ✅ A document search system powered by AI
- ✅ A RAG (Retrieval Augmented Generation) system where users bring their own documents

## �🎨 Design Vision

**Theme: "Living Documentation"**

- Think Dropbox + Notion meets modern AI search
- Use earthy, vibrant colors: deep forest green (#0F4C3A), sage (#87A96B), earth brown (#8B4513), sky blue (#4A90E2)
- Organic shapes, flowing animations, nature-inspired gradients
- Modern glassmorphism effects with environmental imagery backdrop
- Font Awesome icons throughout (use `@fortawesome/react-fontawesome`)

**NOT like:** ChatGPT, Claude, generic chat UIs with gray bubbles, OR quiz apps
**LIKE:** Notion, Linear, Arc browser, Dropbox Paper - clean, fast, delightful

## 🏗️ Core Features

### 1. **Hero Section** (Landing View)

- Large nature-themed hero with subtle particle effects (leaves floating?)
- Tagline: "Upload Documents. Ask Questions. Get Instant AI Answers."
- Quick stats cards: Documents Indexed, Total Chunks, Response Time
- Two prominent CTAs:
  - **Upload Documents** button (drag & drop or click) with `fa-upload` icon
  - **Search your documents** bar that pulses with a green glow
- Font Awesome icons: `fa-file-upload`, `fa-search`, `fa-database`, `fa-chart-line`

### 2. **Main Search Interface**

**User Workflow:**

1. User uploads documents (PDF/DOC/CSV/TXT)
2. Backend automatically indexes the documents
3. User asks questions in natural language
4. AI searches the uploaded documents and provides answers with source citations
5. User can see which documents/sections were used for the answer

- **Split Layout:**
  - Left: Search/Upload panel (60%) - NOT a traditional chat UI
  - Right: Context panel (40%) - shows uploaded documents, stats, sources
- **Top Section:** Document upload zone with drag & drop (prominent)
  - Show upload progress with animated plant growing
  - List recently uploaded files
- **Middle Section:** Command-palette style search bar (Cmd+K aesthetic)
- Real-time typing indicator with custom animation (growing plant, not dots)
- Display search results as **cards** not chat bubbles
- Each result card shows:
  - Answer text with syntax highlighting for key terms
  - Source document badge with file icon (which file the answer came from)
  - Confidence score as a subtle progress bar
  - "View Context" button to expand source chunks from the document

### 3. **Document Explorer** (Sidebar/Drawer)

**Purpose:** Show all uploaded documents and allow management

- List all indexed documents (that the USER uploaded) with:
  - File type icons (PDF, DOC, CSV, TXT) from Font Awesome
  - File name and size
  - Last updated timestamp / upload date
  - Chunk count (how many pieces the document was split into)
  - Search within specific document feature
- Filterable by file type, date, size
- **Upload new documents area** at top (drag & drop zone with `fa-cloud-upload` icon)
- Delete/reprocess options for each document
- Empty state: "No documents uploaded yet. Drag files here to get started!"

### 4. **Advanced Features Panel**

- Tabs for: Search | Documents | Analytics | Settings
- **Search Tab:**
  - Main Q&A interface
  - Recent queries history (not visible by default, slide-in panel)
  - Suggested questions based on indexed documents
- **Documents Tab:**
  - Grid view of all documents with preview cards
  - Document metadata (chunks, size, type)
  - Delete/reprocess options
- **Analytics Tab:**
  - Chart showing search trends (use recharts or similar)
  - Most queried topics wordcloud
  - Document coverage heatmap
- **Settings Tab:**
  - Top-K slider (visual, with leaf icons as markers)
  - Model selection (if available)
  - API status indicator

### 5. **Micro-interactions**

- Smooth page transitions (use framer-motion)
- Hover effects on cards (lift, subtle shadow, color shift)
- Loading states: organic animations (growing vine, spreading roots)
- Success states: subtle green pulse, checkmark with leaf icon
- Empty states: beautiful illustrations, not boring text

## 🔌 API Integration

**Base URL:** `http://localhost:8000`

**IMPORTANT:** This system works with **user-uploaded documents**. Users upload files, the backend indexes them, then users can search/ask questions about their own documents.

**Endpoints to implement:**

```typescript
// STEP 1: Upload documents (user uploads their own files)
// Note: Actual upload endpoint may need to be added to backend
// For now, assume files are uploaded via /upload or monitored folder

// STEP 2: Check if documents are indexed
POST /v1/statistics
Body: {}
Response: { file_count: number, total_chunks: number, index_status: string }

// STEP 3: List uploaded documents
POST /v1/pw_list_documents
Body: { keys?: string[] }
Response: { documents: [{ path: string }] }

// STEP 4: Ask questions about uploaded documents
POST /v1/pw_ai_answer
Body: { prompt: string, filters?: string, model?: string }
Response: { response: string }
// This searches the UPLOADED documents and returns AI-generated answer

// ALTERNATIVE: Search/retrieve specific chunks from documents
POST /v1/retrieve
Body: { query: string, k?: number }
Response: [{ text: string, path: string, score: number }]
// Returns matching chunks from uploaded documents

// Summarize documents
POST /v1/pw_ai_summary
Body: { text_list: string[], model?: string }
Response: { summary: string }
```

**Upload Flow (Frontend):**

1. User drags/drops or selects files
2. Frontend uploads to backend (need to determine upload endpoint)
3. Show upload progress
4. Backend processes and indexes documents
5. Update statistics and document list
6. User can now search their uploaded documents

## 🎯 Specific Requirements

### Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Font Awesome icons (`@fortawesome/react-fontawesome`)
- Framer Motion for animations
- Zustand or Jotai for state management
- React Query for API calls

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Header: Logo | Nav | Stats | Settings          │
├───────────────────────┬─────────────────────────┤
│                       │                         │
│   Search Panel        │    Context Sidebar      │
│                       │                         │
│   [Command Bar]       │    📊 Statistics        │
│                       │    📁 Sources           │
│   [Results Cards]     │    🔍 Filters          │
│                       │    ⚙️  Settings         │
│   [Suggested Qs]      │                         │
│                       │                         │
└───────────────────────┴─────────────────────────┘
```

### Color Palette

- Primary: `#0F4C3A` (Forest Green)
- Secondary: `#87A96B` (Sage)
- Accent: `#4A90E2` (Sky Blue)
- Warning: `#F59E0B` (Amber)
- Background: `#FAFAF9` (Warm White)
- Dark Mode: `#0A0E0D` with green accents

### Typography

- Headings: Inter or Manrope (bold, clean)
- Body: Inter or System UI
- Code: JetBrains Mono or Fira Code
- Use varying font weights for hierarchy

### Unique Design Elements

1. **Search Bar:** Make it look like a seed growing into a search - icon morphs on focus
2. **Results Cards:** Each has a subtle leaf pattern watermark based on document type
3. **Loading State:** Animated growing tree/vine, not spinner
4. **Background:** Subtle animated gradient mesh with green/blue tones
5. **Buttons:** Rounded with subtle shadows, hover lifts them
6. **Icons:** Use duotone Font Awesome icons where possible
7. **Empty State:** Illustration of documents uploading with "No documents yet? Upload your first file to start asking questions!"

### Animations (Framer Motion)

- Page transitions: Fade + slight scale
- Card entrance: Stagger animation (cards appear one by one)
- Search results: Slide up from bottom
- Sidebar: Slide from right
- Modals: Scale from center with backdrop blur

### Accessibility

- Keyboard navigation (Tab, Enter, Esc)
- ARIA labels on all interactive elements
- Focus indicators (custom green ring)
- Color contrast ratio > 4.5:1
- Screen reader friendly

## 📱 Responsive Design

- Desktop: Split layout (as shown)
- Tablet: Sidebar becomes drawer, triggered by button
- Mobile: Stack vertically, floating action button for search

## 🎁 Extra Nice-to-Haves

1. **Dark mode toggle** with smooth transition
2. **Export results** as PDF/Markdown
3. **Share query** - generate shareable link
4. **Keyboard shortcuts** overlay (press `?` to show)
5. **Search history** with quick reload
6. **Document preview** modal with syntax highlighting
7. **Real-time updates** using WebSocket (if backend supports)
8. **Voice search** (optional)

## 🚫 What to AVOID

- ❌ Gray chat bubbles (boring!)
- ❌ Typical chatbot UI with left/right messages
- ❌ Generic loading spinners
- ❌ Blue hyperlinks
- ❌ Default button styles
- ❌ Boring forms
- ❌ Corporate/enterprise look
- ❌ Too much white space (make it lively!)

## ✅ What to INCLUDE

- ✅ Organic, flowing shapes
- ✅ Vibrant green color palette
- ✅ Font Awesome duotone/solid icons
- ✅ Smooth animations everywhere
- ✅ Card-based layouts
- ✅ Glassmorphism effects
- ✅ Nature-inspired illustrations
- ✅ Delightful micro-interactions
- ✅ Modern, premium feel

## 📦 Component Structure

Create these reusable components:

1. **SearchBar.tsx** - Main search input with command palette style
2. **ResultCard.tsx** - Display Q&A results with sources
3. **DocumentCard.tsx** - Show document metadata
4. **StatCard.tsx** - Display statistics
5. **ContextPanel.tsx** - Right sidebar with sources
6. **DocumentExplorer.tsx** - Document list/grid view
7. **AnalyticsDashboard.tsx** - Charts and insights
8. **UploadZone.tsx** - Drag & drop file upload
9. **LoadingAnimation.tsx** - Custom loading state
10. **EmptyState.tsx** - Beautiful empty states

## 🎬 User Flow Example

**Complete Workflow:**

1. **Landing:** User lands on hero page → sees upload zone prominently, stats showing "0 documents indexed"
2. **Upload:** User drags PDF file onto upload zone → file uploads, progress bar shows growing plant animation
3. **Indexing:** Backend processes document → stats update to "1 document, 45 chunks indexed"
4. **Search:** User clicks search bar → animates to full command palette
5. **Query:** Types question: "What is the main topic of this document?" → sees real-time suggestions
6. **Submit:** Presses Enter → loading animation (growing plant)
7. **Results:** Answer card appears with:
   - AI-generated answer text
   - Source badge showing "document.pdf, page 3"
   - Confidence score: 92%
   - "View Context" button
8. **Context:** Clicks "View Context" → sidebar expands showing actual text chunk from the PDF that was used
9. **Explore:** User clicks document icon in sidebar → opens document metadata/preview
10. **Upload More:** User uploads another document → repeats workflow

**Key Point:** The entire system revolves around **user's own documents**, not pre-indexed content.

## 🌟 The "Wow" Factor

Make the interface feel **alive**:

- Subtle parallax on scroll
- Icons that react to cursor proximity
- Search bar that "breathes" when idle
- Background gradient that shifts based on time of day
- Confetti/particle effect on successful query
- Sound effects (optional, toggleable)

---

**Goal:** Create something that makes users say "Wow, this is beautiful!" not "Oh, another chatbot."

Build this with Next.js 14, TypeScript, Tailwind, shadcn/ui, Font Awesome, and Framer Motion. Make it fast, accessible, and delightful. Focus on the experience, not just functionality.

Good luck! 🌱✨
