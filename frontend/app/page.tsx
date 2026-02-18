'use client';

import { useState, useEffect } from 'react';
import { DocumentFile } from '@/lib/types';
import { storage } from '@/lib/storage';
import { UploadForm } from '@/components/upload-form';
import { DocumentList } from '@/components/document-list';
import { DemoLoader } from '@/components/demo-loader';
import { Upload, FileText, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const docs = storage.getDocuments();
    setDocuments(docs);
  }, []);

  const handleUploadSuccess = (doc: DocumentFile) => {
    setDocuments(prev => [...prev, doc]);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-background">
      <DemoLoader
        onLoadComplete={() => {
          const docs = storage.getDocuments();
          setDocuments(docs);
        }}
      />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            >
              Admin
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
                Upload your documents and make them searchable with AI-powered search.
              </p>
            </div>
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Stats Section */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-accent/5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {documents.length}
                  </p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {(
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
