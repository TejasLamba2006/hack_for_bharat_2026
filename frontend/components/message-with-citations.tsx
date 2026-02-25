'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { SourceCitation } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import 'highlight.js/styles/github-dark.css';

interface MessageWithCitationsProps {
  content: string;
  sources?: SourceCitation[];
}

export function MessageWithCitations({ content, sources }: MessageWithCitationsProps) {
  // Process content to replace citations with interactive elements
  const processedContent = useMemo(() => {
    if (!sources || sources.length === 0) {
      return content;
    }

    // Replace [1], [2], etc. with special markers we can process
    let processed = content;
    const citationRegex = /\[(\d+)\]/g;
    
    // We'll use a custom component for citations in markdown
    return processed;
  }, [content, sources]);

  // Custom renderer for text that includes citation tooltips
  const renderWithCitations = (text: string) => {
    if (!sources || sources.length === 0) {
      return text;
    }

    const parts = [];
    const citationRegex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add citation with tooltip
      const citationNum = parseInt(match[1]);
      const source = sources[citationNum - 1];

      if (source) {
        parts.push(
          <TooltipProvider key={`citation-${match.index}`}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-primary-foreground bg-primary rounded-full cursor-help hover:bg-primary/90 transition-colors mx-0.5">
                  {citationNum}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-3" side="top">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{source.documentName}</div>
                  <div className="text-xs text-muted-foreground">
                    Page {source.lineNumber} • {(source.relevance * 100).toFixed(0)}% relevant
                  </div>
                  <div className="text-xs italic mt-2 line-clamp-3">
                    "{source.excerpt}"
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      // If no source exists, skip the citation marker entirely (don't render orphaned citations)

      lastIndex = citationRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom styling for markdown elements
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">
              {typeof children === 'string' ? renderWithCitations(children) : children}
            </p>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-accent px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-accent p-4 rounded-lg overflow-x-auto my-2">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 bg-accent font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">
              {children}
            </td>
          ),
          // Handle text nodes with citations
          text: ({ value }) => <>{renderWithCitations(value)}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
