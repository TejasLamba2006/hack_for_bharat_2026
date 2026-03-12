"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType, SourceCitation } from "@/lib/types";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";
import { ChatMessage } from "@/components/chat-message";
import { DocumentViewer } from "@/components/document-viewer";
import { 
  FileText, 
  Send, 
  Loader2, 
  AlertCircle, 
  Upload, 
  MessageCircle,
  PanelLeftClose,
  PanelLeft,
  Settings
} from "lucide-react";
import Link from "next/link";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [currentSources, setCurrentSources] = useState<SourceCitation[]>([]);
  const [showDocumentPanel, setShowDocumentPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check backend health
    api.checkHealth().then((healthy) => {
      setBackendAvailable(healthy);
      if (!healthy) {
        setError(
          "Backend server is not available. Please start the Pathway server.",
        );
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update current sources when messages change
  useEffect(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.sources);
    if (lastAssistantMessage?.sources) {
      setCurrentSources(lastAssistantMessage.sources);
    }
  }, [messages]);

  const handleCitationClick = (citationNum: number) => {
    setActiveCitation(citationNum);
    if (!showDocumentPanel) {
      setShowDocumentPanel(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !backendAvailable) return;

    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);
    setActiveCitation(null);

    // Add loading message
    const loadingMessage: ChatMessageType = {
      id: `msg-loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call backend API for AI answer
      const response = await api.askQuestion(currentInput);

      // Check if response has the expected structure
      if (!response?.response) {
        throw new Error("Invalid response from backend");
      }

      // Backend now returns raw RAG result with optional context_docs
      const ragResult = response.response;
      const contextDocs = response.context_docs || [];
      let answerText = "";
      const sources: SourceCitation[] = [];

      // Extract answer from the result
      answerText = String(ragResult);

      // Parse citations from the answer and map to context documents
      // Citations are in format [1], [2], etc.
      const citationRegex = /\[(\d+)\]/g;
      const citationMatches = [...answerText.matchAll(citationRegex)];
      
      // Create sources from context documents with citation mapping
      if (contextDocs.length > 0) {
        contextDocs.forEach((doc, idx) => {
          const citationNumber = idx + 1;
          // Check if this citation is actually used in the answer
          const isUsed = citationMatches.some(match => parseInt(match[1]) === citationNumber);
          
          // Only include sources that are actually cited in the answer
          if (isUsed) {
            // Extract meaningful excerpt (first 200 chars)
            const excerpt = doc.text.substring(0, 200) + (doc.text.length > 200 ? '...' : '');
            
            sources.push({
              documentId: `doc-${citationNumber}`,
              documentName: doc.metadata?.path || `Document ${citationNumber}`,
              lineNumber: doc.metadata?.page || 0,
              excerpt: excerpt,
              relevance: 1 - (idx * 0.1), // Decreasing relevance score
            });
          }
        });
      }

      const assistantMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: answerText,
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => {
        // Remove loading message and add assistant message
        const filtered = prev.filter((msg) => !msg.isLoading);
        return [...filtered, assistantMessage];
      });

      // Update current sources for the document viewer
      if (sources.length > 0) {
        setCurrentSources(sources);
      }

      // Log analytics
      storage.logAnalytics({
        type: "chat",
        timestamp: Date.now(),
        details: {
          query: currentInput,
          resultCount: sources.length,
          sourceCount: sources.length,
        },
      });
    } catch (err) {
      console.error("Error asking question:", err);

      // Show error message
      const errorMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error while processing your question. Please make sure the backend server is running. Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading);
        return [...filtered, errorMessage];
      });

      setError(
        "Failed to get response from backend. Please check if the server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-sidebar text-sidebar-foreground sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sidebar-accent rounded-lg">
              <FileText className="w-5 h-5 text-sidebar-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DocSearch</h1>
              <p className="text-xs text-sidebar-foreground/70">Document Q&A with Smart Citations</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            <button
              onClick={() => setShowDocumentPanel(!showDocumentPanel)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium ml-2"
              title={showDocumentPanel ? "Hide document panel" : "Show document panel"}
            >
              {showDocumentPanel ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Document Viewer Panel */}
          {showDocumentPanel && (
            <>
              <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
                <DocumentViewer 
                  sources={currentSources}
                  activeCitation={activeCitation}
                  onClose={() => setShowDocumentPanel(false)}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Chat Panel */}
          <ResizablePanel defaultSize={showDocumentPanel ? 60 : 100} minSize={40}>
            <div className="flex flex-col h-full">
              {/* Messages Area */}
              <ScrollArea className="flex-1">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {/* Backend Error Alert */}
                  {error && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">{error}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Make sure the Pathway server is running on port{" "}
                          {process.env.NEXT_PUBLIC_API_BASE_URL?.split(":").pop()}
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                      <div className="p-4 bg-citation-bg rounded-full mb-4">
                        <FileText className="w-12 h-12 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Chat with Your Documents
                      </h2>
                      <p className="text-muted-foreground max-w-md mb-4 leading-relaxed">
                        Ask questions about your indexed documents. The AI will search
                        through them using RAG and provide answers with <span className="citation-badge mx-1">1</span> smart citations.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click on any citation to view the source document.
                      </p>
                      {!backendAvailable && (
                        <p className="text-sm text-destructive mt-4 font-medium">
                          Backend server is not available. Please start the Pathway server.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((message) => (
                        <ChatMessage 
                          key={message.id} 
                          message={message}
                          onCitationClick={handleCitationClick}
                          activeCitation={activeCitation}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-border bg-card p-4">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      placeholder={
                        !backendAvailable
                          ? "Backend server not available..."
                          : "Ask a question about your documents..."
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={!backendAvailable || isLoading}
                      className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!backendAvailable || isLoading || !input.trim()}
                      className="px-5 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
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
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {backendAvailable ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                          Connected to backend server
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-destructive">
                          <span className="w-2 h-2 bg-destructive rounded-full"></span>
                          Backend server not available
                        </span>
                      )}
                    </p>
                    {currentSources.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {currentSources.length} source{currentSources.length !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}
