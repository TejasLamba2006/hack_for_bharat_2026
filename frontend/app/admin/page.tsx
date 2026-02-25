"use client";

import { useState, useEffect } from "react";
import { DocumentFile, AnalyticsEvent } from "@/lib/types";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DocumentList } from "@/components/document-list";
import {
  FileText,
  BarChart3,
  Trash2,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "documents">(
    "analytics",
  );
  const [backendDocs, setBackendDocs] = useState<any[]>([]);
  const [backendFiles, setBackendFiles] = useState<any[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evts = storage.getAnalytics();
    setEvents(evts);

    // Load documents from API and check backend health
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // Load documents from API
    try {
      const filesResponse = await api.listFiles();
      const docs = api.convertToDocumentFiles(filesResponse);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents from API:", err);
      // Fallback to localStorage
      const docs = storage.getDocuments();
      setDocuments(docs);
    }

    // Check backend health and load stats
    await loadBackendData();
  };

  const loadBackendData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check backend availability
      const healthy = await api.checkHealth();
      setBackendAvailable(healthy);

      if (!healthy) {
        setError(
          "Backend server is not available. Please start the Pathway server.",
        );
        return;
      }

      // Load documents list from Pathway (indexed)
      const docsResponse = await api.listDocuments();
      setBackendDocs(docsResponse.documents || []);

      // Load files list from Flask (data_room/)
      const filesResponse = await api.listFiles();
      setBackendFiles(filesResponse.files || []);
    } catch (err) {
      console.error("Failed to load backend data:", err);
      setError("Failed to fetch data from backend server.");
      setBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAnalytics = () => {
    if (confirm("Clear all analytics data? This action cannot be undone.")) {
      storage.clearAnalytics();
      setEvents([]);
    }
  };

  const handleDeleteAllDocuments = async () => {
    if (confirm("Delete all documents? This action cannot be undone.")) {
      try {
        // Delete from backend
        for (const file of backendFiles) {
          await api.deleteFile(file.filename);
        }
        // Delete from local storage
        documents.forEach((doc) => storage.deleteDocument(doc.id));
        setDocuments([]);
        // Reload backend data
        await loadBackendData();
      } catch (err) {
        console.error("Failed to delete documents:", err);
        setError("Failed to delete some documents from backend.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage your documents and view analytics from the RAG system.
            </p>
          </div>
          <button
            onClick={loadBackendData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Backend Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the Flask proxy server is running on port 9001
              </p>
            </div>
          </div>
        )}

        {/* Backend Files Overview */}
        {backendFiles.length > 0 && (
          <div className="mb-8 bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">
              Backend Files (data_room/)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Files:</span>
                <span className="ml-2 font-medium text-foreground">
                  {backendFiles.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Size:</span>
                <span className="ml-2 font-medium text-foreground">
                  {backendFiles
                    .reduce((sum, f) => sum + f.size_mb, 0)
                    .toFixed(2)}{" "}
                  MB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Backend Status:</span>
                <span
                  className={`ml-2 font-medium ${
                    backendAvailable ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {backendAvailable ? "Connected" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Backend Documents Overview */}
        {backendDocs.length > 0 && (
          <div className="mb-8 bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">
              Indexed Documents (Pathway)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Indexed Count:</span>
                <span className="ml-2 font-medium text-foreground">
                  {backendDocs.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Chunks:</span>
                <span className="ml-2 font-medium text-foreground">
                  {backendDocs.reduce((sum, d) => sum + (d.chunks || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "documents"
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Documents
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <AnalyticsDashboard events={events} documents={documents} />
            <div className="mt-8 p-4 bg-accent/5 border border-border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Clear Analytics</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Remove all stored analytics events
                </p>
              </div>
              <button
                onClick={handleClearAnalytics}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
              >
                Clear Data
              </button>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div>
            {/* Backend Documents */}
            {backendDocs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Indexed Documents (Backend)
                </h3>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-accent/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Path
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Chunks
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {backendDocs.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-accent/5">
                          <td className="px-4 py-3 text-sm text-foreground">
                            {doc.path}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {(doc.size / 1024).toFixed(1)} KB
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {doc.chunks}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Backend Files (data_room/) */}
            {backendFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Files in data_room/ ({backendFiles.length})
                </h3>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-accent/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Filename
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Modified
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {backendFiles.map((file, idx) => (
                        <tr key={idx} className="hover:bg-accent/5">
                          <td className="px-4 py-3 text-sm text-foreground">
                            {file.filename}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {file.size_mb.toFixed(2)} MB
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(file.modified).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {file.extension}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${file.filename}?`)) {
                                  try {
                                    await api.deleteFile(file.filename);
                                    await loadBackendData();
                                  } catch (err) {
                                    console.error("Delete failed:", err);
                                    setError(
                                      `Failed to delete ${file.filename}`,
                                    );
                                  }
                                }
                              }}
                              className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Local Documents */}
            <div className="mb-6 p-4 bg-accent/5 border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                Local Documents: {documents.length}
              </h3>
              <p className="text-sm text-muted-foreground">
                Total Size:{" "}
                {(
                  documents.reduce((sum, doc) => sum + doc.size, 0) /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </p>
            </div>

            <DocumentList documents={documents} />

            {documents.length > 0 && (
              <div className="mt-8 p-4 bg-accent/5 border border-border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Delete All Documents
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will permanently remove all documents from the system
                  </p>
                </div>
                <button
                  onClick={handleDeleteAllDocuments}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
