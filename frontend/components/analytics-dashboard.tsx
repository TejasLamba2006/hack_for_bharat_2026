'use client';

import { AnalyticsEvent, DocumentFile } from '@/lib/types';
import { BarChart3, Upload, Search, Trash2, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  events: AnalyticsEvent[];
  documents: DocumentFile[];
}

export function AnalyticsDashboard({ events, documents }: AnalyticsDashboardProps) {
  const uploadCount = events.filter(e => e.type === 'upload').length;
  const searchCount = events.filter(e => e.type === 'search').length;
  const deleteCount = events.filter(e => e.type === 'delete').length;

  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
  const avgSize = documents.length > 0 ? totalSize / documents.length : 0;

  // Activity over time
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }).reverse();

  const activityByDay = last7Days.map(timestamp => ({
    date: new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
    count: events.filter(e => {
      const eventDate = new Date(e.timestamp);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === timestamp;
    }).length,
  }));

  // Event breakdown
  const eventsByType = {
    upload: events.filter(e => e.type === 'upload'),
    search: events.filter(e => e.type === 'search'),
    delete: events.filter(e => e.type === 'delete'),
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Uploads</p>
              <p className="text-3xl font-bold text-foreground mt-1">{uploadCount}</p>
            </div>
            <Upload className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Searches</p>
              <p className="text-3xl font-bold text-foreground mt-1">{searchCount}</p>
            </div>
            <Search className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {documents.length}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Size</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {(avgSize / 1024).toFixed(1)}KB
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Activity (Last 7 Days)</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {activityByDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-border rounded-t flex items-end justify-center h-full">
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{
                    height: `${Math.max(20, (day.count / Math.max(...activityByDay.map(d => d.count), 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Events</h3>
        <div className="space-y-3">
          {events.slice(-10).reverse().map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                {event.type === 'upload' && (
                  <Upload className="w-4 h-4 text-blue-500" />
                )}
                {event.type === 'search' && (
                  <Search className="w-4 h-4 text-green-500" />
                )}
                {event.type === 'delete' && (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {event.type === 'upload' && `Uploaded: ${event.details.fileName}`}
                    {event.type === 'search' && `Searched: "${event.details.query}"`}
                    {event.type === 'delete' && `Deleted: ${event.details.documentName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {event.type === 'search' && (
                <span className="text-xs text-muted-foreground">
                  {event.details.resultCount} results
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
