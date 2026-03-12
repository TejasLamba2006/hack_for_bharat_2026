export interface DocumentFile {
  id: string;
  name: string;
  content: string;
  uploadedAt: number;
  size: number;
  type: string;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  excerpt: string;
  relevance: number;
  matchedText: string;
}

export interface SourceCitation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  lineNumber: number;
  excerpt: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: SourceCitation[];
  isLoading?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  type: 'upload' | 'search' | 'delete' | 'chat';
  timestamp: number;
  details: Record<string, any>;
}
