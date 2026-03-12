'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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
  onCitationClick?: (citationNum: number) => void;
  activeCitation?: number | null;
}

// Pre-process: replace [n] with a markdown link that encodes the citation number.
// e.g. [1] → [__cite_1__](#cite-1)
// This survives ReactMarkdown's rendering pipeline unchanged and lets us
// intercept it via the custom `a` component renderer.
function preprocessCitations(text: string, sources: SourceCitation[]): string {
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    const idx = parseInt(num) - 1;
    if (idx >= 0 && idx < sources.length) {
      return `[__cite_${num}__](#cite-${num})`;
    }
    return match;
  });
}

export function MessageWithCitations({ 
  content, 
  sources, 
  onCitationClick,
  activeCitation 
}: MessageWithCitationsProps) {

  const processedContent = useMemo(() => {
    if (!sources || sources.length === 0) return content;
    return preprocessCitations(content, sources);
  }, [content, sources]);

  const CitationBadge = ({ num }: { num: number }) => {
    const source = sources?.[num - 1];
    if (!source) return null;
    const isActive = activeCitation === num;

    return (
      <TooltipProvider>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onCitationClick?.(num)}
              className={`citation-badge ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}`}
              aria-label={`View source ${num}`}
            >
              {num}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3 bg-card border border-border shadow-lg" side="top">
            <div className="space-y-1.5">
              <p className="font-semibold text-sm text-foreground leading-tight">{source.documentName}</p>
              <p className="text-xs text-muted-foreground">
                Page {source.pageNumber} &mdash; {(source.relevance * 100).toFixed(0)}% relevant
              </p>
              <p className="text-xs italic text-muted-foreground line-clamp-3 border-t border-border pt-1.5 mt-1">
                &ldquo;{source.excerpt}&rdquo;
              </p>
              <p className="text-xs text-primary font-medium">Click to view in document</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Intercept links that are citation placeholders
          a: ({ href, children }) => {
            const citationMatch = href?.match(/^#cite-(\d+)$/);
            if (citationMatch) {
              return <CitationBadge num={parseInt(citationMatch[1])} />;
            }
            return (
              <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          code: ({ className, children }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-accent px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-accent p-4 rounded-lg overflow-x-auto my-2">{children}</pre>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-2">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 bg-accent font-semibold text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
