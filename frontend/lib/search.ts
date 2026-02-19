import { DocumentFile, SearchResult } from './types';

export const search = {
  // Simple semantic search using token overlap and proximity
  performSearch: (query: string, documents: DocumentFile[]): SearchResult[] => {
    if (!query.trim()) return [];

    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    documents.forEach(doc => {
      const docContent = doc.content.toLowerCase();
      const docLines = doc.content.split('\n');

      // Calculate relevance score based on term frequency and proximity
      let relevanceScore = 0;
      const matchedTexts = new Set<string>();

      queryTerms.forEach(term => {
        const termCount = (docContent.match(new RegExp(term, 'g')) || []).length;
        relevanceScore += termCount * 10;

        // Find context around matches
        docLines.forEach(line => {
          if (line.toLowerCase().includes(term)) {
            matchedTexts.add(line.trim());
          }
        });
      });

      if (relevanceScore > 0) {
        // Create excerpt from matched content
        const matchArray = Array.from(matchedTexts);
        const excerpt = matchArray.slice(0, 2).join(' ... ');

        results.push({
          documentId: doc.id,
          documentName: doc.name,
          excerpt: excerpt.substring(0, 150) + (excerpt.length > 150 ? '...' : ''),
          relevance: relevanceScore,
          matchedText: matchArray[0] || '',
        });
      }
    });

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  },

  // Extract keywords from text for AI-like suggestions
  extractKeywords: (text: string): string[] => {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 10);
  },
};
