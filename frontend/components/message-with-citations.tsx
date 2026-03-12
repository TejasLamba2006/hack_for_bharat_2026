'use client';

import React from 'react';
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
  onCitationClick?: (citationNum: number) => void;
  activeCitation?: number | null;
}

export function MessageWithCitations({ 
  content, 
  sources, 
  onCitationClick,
  activeCitation 
}: MessageWithCitationsProps) {

  // Split a string on [n] citation markers and return mixed text/badge array
  const renderWithCitations = (text: string): React.ReactNode => {
    if (!sources || sources.length === 0) return text;

    const citationRegex = /\[(\d+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const citationNum = parseInt(match[1]);
      const source = sources[citationNum - 1];

      if (source) {
        const isActive = activeCitation === citationNum;
        parts.push(
          <TooltipProvider key={`citation-${match.index}-${citationNum}`}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCitationClick?.(citationNum)}
                  className={`citation-badge ${isActive ? 'bg-primary! text-primary-foreground! scale-110' : ''}`}
                  aria-label={`View source ${citationNum}`}
                >
                  {citationNum}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-3 bg-card border border-border shadow-lg" side="top">
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-foreground">{source.documentName}</div>
                  <div className="text-xs text-muted-foreground">
                    Page {source.pageNumber ?? source.lineNumber} • {(source.relevance * 100).toFixed(0)}% relevant
                  </div>
                  <div className="text-xs italic mt-2 line-clamp-3 text-muted-foreground">
                    "{source.excerpt}"
                  </div>
                  <div className="text-xs text-primary font-medium mt-2">
                    Click to view in document
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Recursively walk React children, replacing text nodes that contain [n] markers
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return renderWithCitations(child);
      }
      if (React.isValidElement(child) && child.props.children) {
        return React.cloneElement(child as React.ReactElement<any>, {
          children: processChildren(child.props.children),
        });
      }
      return child;
    });
  };

  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{processChildren(children)}</p>
          ),
          li: ({ children }) => (
            <li>{processChildren(children)}</li>
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
