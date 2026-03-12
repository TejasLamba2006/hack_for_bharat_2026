"use client";

import { useState, useEffect } from "react";
import { DocumentFile } from "@/lib/types";
import { storage } from "@/lib/storage";
import { UploadForm } from "@/components/upload-form";
import { DocumentList } from "@/components/document-list";
import { Upload, FileText, MessageCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Home() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [backendFiles, setBackendFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const filesResponse = await api.listFiles();
      const docs = api.convertToDocumentFiles(filesResponse);
      setDocuments(docs);
      setBackendFiles(filesResponse.files || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
      // Fallback to localStorage
      const docs = storage.getDocuments();
      setDocuments(docs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (doc: DocumentFile) => {
    setRefreshTrigger((prev) => prev + 1);
    // Refresh documents after upload
    loadDocuments();
  };

  const handleDelete = () => {
    setRefreshTrigger((prev) => prev + 1);
    // Refresh documents after delete
    loadDocuments();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* <DemoLoader
        onLoadComplete={() => {
          const docs = storage.getDocuments();
          setDocuments(docs);
        }}
      /> */}
      {/* Header */}
      <header className="border-b border-border bg-sidebar text-sidebar-foreground sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Upload Documents
              </h2>
              <p className="text-muted-foreground">
                Upload your documents and make them searchable with AI-powered
                search.
              </p>
            </div>
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Stats Section */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Quick Stats</h3>
                <button
                  onClick={loadDocuments}
                  disabled={isLoading}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  title="Refresh stats"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-accent/5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Total Documents
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {documents.length}
                  </p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {backendFiles.length > 0
                      ? backendFiles
                          .reduce((sum, f) => sum + f.size_mb, 0)
                          .toFixed(2)
                      : (
                          documents.reduce((sum, doc) => sum + doc.size, 0) /
                          1024 /
                          1024
                        ).toFixed(2)}
                    MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Your Documents
          </h3>
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </main>
  );
}
