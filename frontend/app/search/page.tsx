"use client";

import { useState, useEffect, useMemo } from "react";
import { DocumentFile, SearchResult } from "@/lib/types";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";
import { SearchResults } from "@/components/search-results";
import { Search as SearchIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { BrandIdentity } from "@/components/brand-identity";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    loadDocuments();

    // Load search history
    const history = localStorage.getItem("searchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }

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

  const loadDocuments = async () => {
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
  };

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setError(null);
      const startTime = Date.now();

      try {
        const response = await api.retrieve(query, 10);
        const endTime = Date.now();
        setSearchTime(endTime - startTime);

        // Convert backend response to SearchResult format
        const searchResults: SearchResult[] = (response.results || []).map(
          (result) => ({
            documentId: result.document_id,
            documentName: result.document_name,
            excerpt: result.excerpt,
            relevance: result.relevance_score * 100, // Convert to 0-100 scale
            matchedText: result.excerpt,
          }),
        );

        setResults(searchResults);
      } catch (err) {
        console.error("Search error:", err);
        setError(
          "Failed to search documents. Please check if the backend server is running.",
        );
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSearchSubmit = () => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));

      storage.logAnalytics({
        type: "search",
        timestamp: Date.now(),
        details: { query, resultCount: results.length },
      });
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const keywords = useMemo(() => {
    // Simple keyword extraction from documents if available
    if (documents.length === 0) return [];

    const words = new Set<string>();
    documents.slice(0, 5).forEach((doc) => {
      const docWords = doc.content
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4);
      docWords.slice(0, 20).forEach((w) => words.add(w));
    });

    return Array.from(words).slice(0, 10);
  }, [documents]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar text-sidebar-foreground sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <BrandIdentity />
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              Upload
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors text-sm font-medium"
            >
              <SearchIcon className="w-4 h-4" />
              Search
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
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
            Find information across all your indexed documents using semantic
            search.
          </p>
        </div>

        {/* Backend Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the Pathway server is running on port
                {process.env.NEXT_PUBLIC_API_BASE_URL?.split(":").pop()}
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                !backendAvailable
                  ? "Backend server not available..."
                  : "Search documents..."
              }
              value={query}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              disabled={!backendAvailable}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Search Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Results:</span>
                  <span className="font-medium text-foreground">
                    {results.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search Time:</span>
                  <span className="font-medium text-foreground">
                    {searchTime}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium ${backendAvailable ? "text-green-600" : "text-destructive"}`}
                  >
                    {backendAvailable ? "Connected" : "Offline"}
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
