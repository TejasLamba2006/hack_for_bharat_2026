"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { SourceCitation } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "highlight.js/styles/github-dark.css";

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
  activeCitation,
}: MessageWithCitationsProps) {
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
  const renderWithCitations = (text: string): React.ReactNode => {
    if (!sources || sources.length === 0) {
      return text;
    }

    const parts: (string | React.ReactElement)[] = [];
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
        const isActive = activeCitation === citationNum;
        parts.push(
          <TooltipProvider key={`citation-${match.index}-${citationNum}`}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCitationClick?.(citationNum)}
                  className={`citation-badge ${isActive ? "bg-primary text-primary-foreground scale-110" : ""}`}
                  aria-label={`View source ${citationNum}`}
                >
                  {citationNum}
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-md p-4 bg-card border border-border shadow-xl"
                side="top"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-foreground truncate flex-1">
                      📄 {source.documentName}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
                      {(source.relevance * 100).toFixed(0)}%
                    </div>
                  </div>
                  {source.lineNumber > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      📍{" "}
                      {source.lineNumber > 100
                        ? `Chunk ${source.lineNumber}`
                        : `Page ${source.lineNumber}`}
                    </div>
                  )}
                  <div className="text-xs leading-relaxed mt-2 text-muted-foreground border-l-2 border-primary/30 pl-3 py-1">
                    <span className="italic">"{source.excerpt}"</span>
                  </div>
                  <div className="text-xs text-primary font-medium mt-3 pt-2 border-t border-border flex items-center gap-1">
                    👆 Click to view full context
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>,
        );
      }
      // If no source exists, skip the citation marker entirely (don't render orphaned citations)

      lastIndex = citationRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Helper to process children recursively
  const processChildren = (children: any): any => {
    if (typeof children === "string") {
      return renderWithCitations(children);
    }
    if (Array.isArray(children)) {
      return children.map((child, idx) => {
        if (typeof child === "string") {
          return (
            <React.Fragment key={`text-${idx}`}>
              {renderWithCitations(child)}
            </React.Fragment>
          );
        }
        return child;
      });
    }
    return children;
  };

  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom styling for markdown elements
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{processChildren(children)}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
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
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">
              {processChildren(children)}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {processChildren(children)}
            </ol>
          ),
          li: ({ children }) => <li>{processChildren(children)}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-2">
              {processChildren(children)}
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
              {processChildren(children)}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
