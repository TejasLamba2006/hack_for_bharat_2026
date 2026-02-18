'use client';

import { useState, useEffect, useMemo } from 'react';
import { DocumentFile, SearchResult } from '@/lib/types';
import { storage } from '@/lib/storage';
import { search } from '@/lib/search';
import { SearchResults } from '@/components/search-results';
import { FileText, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const docs = storage.getDocuments();
    setDocuments(docs);

    // Load search history
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    setIsSearching(true);
    const res = search.performSearch(query, documents);
    setIsSearching(false);
    return res;
  }, [query, documents]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSearchSubmit = () => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      storage.logAnalytics({
        type: 'search',
        timestamp: Date.now(),
        details: { query, resultCount: results.length },
      });
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const keywords = useMemo(() => {
    return Array.from(
      new Set(
        documents.flatMap(doc => search.extractKeywords(doc.content))
      )
    ).slice(0, 10);
  }, [documents]);

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
              href="/search"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <SearchIcon className="w-4 h-4" />
              Search
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Search Your Documents
          </h2>
          <p className="text-muted-foreground">
            Find information across all your uploaded documents instantly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={query}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Results */}
          <div className="lg:col-span-3">
            <SearchResults
              results={results}
              query={query}
              isSearching={isSearching}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {searchHistory.slice(0, 5).map((hist, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(hist)}
                      className="block w-full text-left px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors truncate"
                    >
                      {hist}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">
                  Popular Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(keyword)}
                      className="px-3 py-1 text-xs bg-accent/20 text-foreground rounded-full hover:bg-accent/40 transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                Database Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents:</span>
                  <span className="font-medium text-foreground">
                    {documents.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Size:</span>
                  <span className="font-medium text-foreground">
                    {(
                      documents.reduce((sum, doc) => sum + doc.size, 0) /
                      1024 /
                      1024
                    ).toFixed(2)}
                    MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
