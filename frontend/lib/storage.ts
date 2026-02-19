import { DocumentFile, AnalyticsEvent } from './types';

const DOCUMENTS_KEY = 'documents';
const ANALYTICS_KEY = 'analytics';

export const storage = {
  // Document operations
  getDocuments: (): DocumentFile[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DOCUMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDocument: (doc: DocumentFile): void => {
    if (typeof window === 'undefined') return;
    const docs = storage.getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  },

  deleteDocument: (id: string): void => {
    if (typeof window === 'undefined') return;
    const docs = storage.getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
  },

  getDocument: (id: string): DocumentFile | undefined => {
    return storage.getDocuments().find(d => d.id === id);
  },

  // Analytics operations
  logAnalytics: (event: Omit<AnalyticsEvent, 'id'>): void => {
    if (typeof window === 'undefined') return;
    const events = storage.getAnalytics();
    const newEvent: AnalyticsEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
    };
    events.push(newEvent);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  },

  getAnalytics: (): AnalyticsEvent[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  },

  clearAnalytics: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ANALYTICS_KEY);
  },
};
