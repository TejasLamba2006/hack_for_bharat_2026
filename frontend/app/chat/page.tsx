'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentFile, ChatMessage as ChatMessageType, SourceCitation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { search } from '@/lib/search';
import { ChatMessage } from '@/components/chat-message';
import { FileText, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const docs = storage.getDocuments();
    setDocuments(docs);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractLineNumbers = (content: string, excerpt: string): number => {
    const lines = content.split('\n');
    let currentPos = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(excerpt.slice(0, 50))) {
        return i + 1;
      }
      currentPos += lines[i].length + 1;
    }
    return 1;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || documents.length === 0) return;

    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessageType = {
      id: `msg-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // Simulate API call delay for animation
    setTimeout(() => {
      // Search documents for relevant content
      const searchResults = search.performSearch(input, documents);

      // Extract sources from search results
      const sources: SourceCitation[] = searchResults.slice(0, 3).map((result) => {
        const doc = documents.find((d) => d.id === result.documentId);
        return {
          documentId: result.documentId,
          documentName: result.documentName,
          lineNumber: extractLineNumbers(doc?.content || '', result.excerpt),
          excerpt: result.excerpt,
          relevance: result.relevance,
        };
      });

      // Generate assistant response based on search results
      const generateResponse = () => {
        if (searchResults.length === 0) {
          return "I couldn't find any relevant information in your documents to answer that question. Try uploading more documents or asking a different question.";
        }

        const topResults = searchResults.slice(0, 3);
        const responseTexts = [
          `Based on the documents, ${topResults[0].excerpt.slice(0, 100)}...`,
          `According to the search results, ${topResults[0].documentName} mentions that ${topResults[0].matchedText.slice(0, 80)}...`,
          `The documents indicate that ${topResults[0].excerpt.slice(0, 120)}...`,
          `From my analysis of the documents, I found that ${topResults[0].matchedText}. This is referenced in ${topResults[0].documentName}.`,
        ];

        return responseTexts[Math.floor(Math.random() * responseTexts.length)];
      };

      const assistantMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: generateResponse(),
        timestamp: Date.now(),
        sources: sources,
      };

      setMessages((prev) => {
        // Remove loading message and add assistant message
        const filtered = prev.filter((msg) => !msg.isLoading);
        return [...filtered, assistantMessage];
      });

      setIsLoading(false);

      // Log analytics
      storage.logAnalytics({
        type: 'chat',
        timestamp: Date.now(),
        details: {
          query: input,
          resultCount: searchResults.length,
          sourceCount: sources.length,
        },
      });
    }, 1500); // Simulated thinking time
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">DocSearch</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            >
              Upload
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Chat
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <div className="p-4 bg-accent/20 rounded-full mb-4">
                <FileText className="w-12 h-12 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Chat with Your Documents
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Ask questions about your uploaded documents. The AI will search through them and provide answers with source citations.
              </p>
              {documents.length === 0 && (
                <p className="text-sm text-destructive">
                  No documents uploaded. Please{' '}
                  <Link href="/" className="underline font-medium hover:text-destructive/80">
                    upload documents first.
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              placeholder={documents.length === 0 ? "Upload documents first..." : "Ask a question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={documents.length === 0 || isLoading}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={documents.length === 0 || isLoading || !input.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Thinking</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            {documents.length} document{documents.length !== 1 ? 's' : ''} available for search
          </p>
        </div>
      </div>
    </main>
  );
}
