'use client';

import { useState, useEffect } from 'react';
import { DocumentFile, AnalyticsEvent } from '@/lib/types';
import { storage } from '@/lib/storage';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { DocumentList } from '@/components/document-list';
import { FileText, BarChart3, Trash2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'documents'>('analytics');

  useEffect(() => {
    const docs = storage.getDocuments();
    const evts = storage.getAnalytics();
    setDocuments(docs);
    setEvents(evts);
  }, []);

  const handleClearAnalytics = () => {
    if (confirm('Clear all analytics data? This action cannot be undone.')) {
      storage.clearAnalytics();
      setEvents([]);
    }
  };

  const handleDeleteAllDocuments = () => {
    if (confirm('Delete all documents? This action cannot be undone.')) {
      documents.forEach(doc => storage.deleteDocument(doc.id));
      setDocuments([]);
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage your documents and view analytics.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Documents
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
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
        {activeTab === 'documents' && (
          <div>
            <div className="mb-6 p-4 bg-accent/5 border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                Total Documents: {documents.length}
              </h3>
              <p className="text-sm text-muted-foreground">
                Total Size:{' '}
                {(
                  documents.reduce((sum, doc) => sum + doc.size, 0) /
                  1024 /
                  1024
                ).toFixed(2)}{' '}
                MB
              </p>
            </div>

            <DocumentList documents={documents} />

            {documents.length > 0 && (
              <div className="mt-8 p-4 bg-accent/5 border border-border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Delete All Documents</p>
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
