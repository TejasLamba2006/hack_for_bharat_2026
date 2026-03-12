'use client';

import { ChatMessage as ChatMessageType } from '@/lib/types';
import { FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { MessageWithCitations } from './message-with-citations';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citationNum: number) => void;
  activeCitation?: number | null;
}

export function ChatMessage({ message, onCitationClick, activeCitation }: ChatMessageProps) {
  const [expandedSources, setExpandedSources] = useState(false);

  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-accent-foreground'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold">U</span>
        ) : (
          <span className="text-xs font-bold">AI</span>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 max-w-2xl ${isUser ? 'text-right' : ''}`}>
        {message.isLoading ? (
          <div
            className={`inline-block px-6 py-4 rounded-2xl border border-border ${
              isUser ? 'bg-primary text-primary-foreground' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-100" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-200" />
              </div>
              <span className="text-sm ml-2">Thinking...</span>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`inline-block px-6 py-4 rounded-2xl border border-border ${
                isUser
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-card rounded-tl-none'
              }`}
            >
              {isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                <MessageWithCitations 
                  content={message.content} 
                  sources={message.sources}
                  onCitationClick={onCitationClick}
                  activeCitation={activeCitation}
                />
              )}
            </div>

            {/* Source Citations */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 text-left">
                <button
                  onClick={() => setExpandedSources(!expandedSources)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">
                    {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedSources ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSources && (
                  <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="pl-6 border-l-2 border-border py-2 text-xs"
                      >
                        <div className="font-semibold text-foreground">
                          {source.documentName}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          Line {source.lineNumber} • Relevance: {(source.relevance * 100).toFixed(0)}%
                        </div>
                        <div className="text-muted-foreground mt-2 italic line-clamp-2">
                          {source.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
