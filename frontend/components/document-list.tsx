'use client';

import { DocumentFile } from '@/lib/types';
import { storage } from '@/lib/storage';
import { Trash2, FileText, Calendar, HardDrive } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DocumentListProps {
  documents: DocumentFile[];
  onDelete?: (id: string) => void;
  refreshTrigger?: number;
}

export function DocumentList({ documents, onDelete, refreshTrigger }: DocumentListProps) {
  const [docs, setDocs] = useState<DocumentFile[]>(documents);

  useEffect(() => {
    setDocs(documents);
  }, [documents, refreshTrigger]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      storage.deleteDocument(id);
      storage.logAnalytics({
        type: 'delete',
        timestamp: Date.now(),
        details: { documentName: name },
      });
      setDocs(docs.filter(d => d.id !== id));
      onDelete?.(id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (docs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-start gap-4 flex-1">
            <FileText className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{doc.name}</h4>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(doc.uploadedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  {formatFileSize(doc.size)}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDelete(doc.id, doc.name)}
            className="ml-4 p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors flex-shrink-0"
            title="Delete document"
            aria-label={`Delete ${doc.name}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
