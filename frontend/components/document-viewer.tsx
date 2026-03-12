'use client';

import { useState, useEffect, useRef } from 'react';
import { SourceCitation } from '@/lib/types';
import { FileText, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentViewerProps {
  sources: SourceCitation[];
  activeCitation: number | null;
  onClose?: () => void;
}

export function DocumentViewer({ sources, activeCitation, onClose }: DocumentViewerProps) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const highlightRef = useRef<HTMLSpanElement>(null);

  // Update current source when active citation changes
  useEffect(() => {
    if (activeCitation !== null && activeCitation > 0 && activeCitation <= sources.length) {
      setCurrentSourceIndex(activeCitation - 1);
    }
  }, [activeCitation, sources.length]);

  // Scroll to highlighted text when active citation changes
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSourceIndex, activeCitation]);

  const currentSource = sources[currentSourceIndex];

  if (!sources.length || !currentSource) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card text-muted-foreground p-8">
        <div className="p-4 bg-secondary rounded-full mb-4">
          <FileText className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Document Selected</h3>
        <p className="text-sm text-center max-w-xs">
          Ask a question and click on a citation to view the source document here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Document Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-1.5 bg-primary rounded">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {currentSource.documentName}
            </h3>
            <p className="text-xs text-muted-foreground">
              Page {currentSource.lineNumber} • {(currentSource.relevance * 100).toFixed(0)}% relevant
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-accent transition-colors ml-2"
              title="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Source Navigation */}
      {sources.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
          <button
            onClick={() => setCurrentSourceIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSourceIndex === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs font-medium text-foreground">
            Source {currentSourceIndex + 1} of {sources.length}
          </span>
          <button
            onClick={() => setCurrentSourceIndex(prev => Math.min(sources.length - 1, prev + 1))}
            disabled={currentSourceIndex === sources.length - 1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Paper-like container */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-border p-8 mx-auto max-w-2xl"
            style={{ minHeight: '400px' }}
          >
            {/* Citation Number Badge */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <span className="citation-badge text-sm px-2 py-1">
                {currentSourceIndex + 1}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Referenced in answer
              </span>
            </div>

            {/* Document Excerpt with Highlight */}
            <div 
              className="font-serif leading-relaxed text-foreground"
              style={{ fontSize: `${fontSize}px` }}
            >
              <span 
                ref={highlightRef}
                className={activeCitation === currentSourceIndex + 1 ? 'highlight-glow' : ''}
              >
                {currentSource.excerpt}
              </span>
            </div>

            {/* Document Metadata */}
            <div className="mt-8 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Document:</span>
                  <p className="mt-1">{currentSource.documentName}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Location:</span>
                  <p className="mt-1">Page {currentSource.lineNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
