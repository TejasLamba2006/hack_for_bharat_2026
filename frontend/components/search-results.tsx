'use client';

import { SearchResult } from '@/lib/types';
import { FileText, BarChart3 } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isSearching?: boolean;
}

export function SearchResults({ results, query, isSearching }: SearchResultsProps) {
  if (!query.trim()) {
    return null;
  }

  if (isSearching) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No results found for "{query}"</p>
        <p className="text-sm text-muted-foreground mt-2">Try different search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {results.map((result, index) => (
        <div
          key={`${result.documentId}-${index}`}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-text-balance">
                {result.documentName}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {result.excerpt}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-border rounded-full h-1.5">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (result.relevance / 100) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round((result.relevance / 100) * 100)}% match
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
