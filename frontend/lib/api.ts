/**
 * API client for Flask Proxy Server
 * All requests go through Next.js API routes to avoid CORS/mixed content issues
 * The API routes proxy to the backend server
 */

import type { DocumentFile } from "./types";

// Use local API proxy to avoid CORS and mixed content issues
// The proxy route forwards requests to the actual backend
const API_BASE_URL = "/api/proxy";

export interface AskQuestionRequest {
  prompt: string;
  filters?: string | null;
  model?: string | null;
}

export interface ContextDocument {
  text: string;
  metadata?: {
    path?: string;
    page?: number;
    [key: string]: any;
  };
}

export interface AskQuestionResponse {
  response: string;
  sources?: Source[];
}

export interface Source {
  documentName: string;
  pageNumber: number;
  lineNumber: string;
  excerpt: string;
  relevance: number;
}

export interface RetrieveRequest {
  query: string;
  k?: number;
}

export interface RetrieveResponse {
  results: Array<{
    document_id: string;
    document_name: string;
    excerpt: string;
    relevance_score: number;
    line_number: number;
    metadata: {
      file_type: string;
      upload_date: string;
    };
  }>;
  total_results: number;
  search_time_ms: number;
}

// Note: Statistics endpoint removed - not available in QASummaryRestServer

export interface ListDocumentsRequest {
  filter_keys?: Record<string, any> | null;
}

export interface ListDocumentsResponse {
  documents: Array<{
    path: string;
    size: number;
    upload_time: string;
    status: string;
    chunks: number;
  }>;
  total_count: number;
}

export interface SummarizeRequest {
  text_list: string[];
  model?: string | null;
}

export interface SummarizeResponse {
  summary: string; // Pathway returns plain string, not wrapped in result object
}

// File Management Interfaces
export interface UploadFileRequest {
  filename: string;
  content: string; // base64 encoded
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  path?: string;
  size?: number;
  size_mb?: number;
  timestamp?: string;
  error?: string;
  note?: string;
}

export interface DeleteFileRequest {
  filename: string;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
  note?: string;
}

export interface ListFilesResponse {
  files: Array<{
    filename: string;
    path: string;
    size: number;
    size_mb: number;
    modified: string;
    extension: string;
    type?: string;
  }>;
  total_count: number;
  directory: string;
  timestamp: string;
}

/**
 * Convert API file response to DocumentFile format
 */
export function convertToDocumentFiles(response: ListFilesResponse): DocumentFile[] {
  return response.files.map((file) => ({
    id: file.filename,
    name: file.filename,
    content: "", // Content not available from list endpoint
    uploadedAt: new Date(file.modified).getTime(),
    size: file.size,
    type: file.extension || file.type || "unknown",
  }));
}

/**
 * Ask a question and get AI-generated answer with sources
 */
export async function askQuestion(
  prompt: string,
  filters?: string | null,
  model?: string | null,
): Promise<AskQuestionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/pw_ai_answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle various backend errors with user-friendly messages
      if (data.error === "Backend unavailable" || data.message?.includes("Pathway")) {
        throw new Error("The AI service is currently starting up or unavailable. Please try again in a moment.");
      }
      throw new Error(data.message || "Failed to process your question. Please try again.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes("AI service") || 
      error.message.includes("Failed to process")
    )) {
      throw error;
    }
    throw new Error("The AI service is currently unavailable. Please try again in a moment.");
  }
}

/**
 * Retrieve relevant documents using vector search
 */
export async function retrieve(
  query: string,
  k: number = 5,
): Promise<RetrieveResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        k,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        results: [],
        total_results: 0,
        search_time_ms: 0,
      };
    }

    return data;
  } catch {
    return {
      results: [],
      total_results: 0,
      search_time_ms: 0,
    };
  }
}

/**
 * List all indexed documents
 */
export async function listDocuments(
  filter_keys?: Record<string, any> | null,
): Promise<ListDocumentsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/pw_list_documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter_keys: filter_keys || null,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      // Return empty response when backend is unavailable
      return {
        documents: [],
        total_count: 0,
      };
    }

    return data;
  } catch {
    // Return empty response when backend is unavailable
    return {
      documents: [],
      total_count: 0,
    };
  }
}

/**
 * Summarize text content (disabled - causes Pathway engine crash)
 * TODO: Re-enable when Pathway fixes JSON array handling
 */
export async function summarize(
  text_list: string[],
  model?: string | null,
): Promise<SummarizeResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/pw_ai_summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text_list,
      model: model || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to summarize text: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload a file to the backend data_room
 */
export async function uploadFile(
  filename: string,
  file: File,
): Promise<UploadFileResponse> {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );

    const response = await fetch(`${API_BASE_URL}/v1/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        content: base64,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Backend unavailable:", error);
    return {
      success: false,
      message: "Backend service is currently unavailable. Please try again later.",
      error: "Network error",
    };
  }
}

/**
 * Delete a file from the backend data_room
 */
export async function deleteFile(
  filename: string,
): Promise<DeleteFileResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Backend unavailable:", error);
    return {
      success: false,
      message: "Backend service is currently unavailable. Please try again later.",
      error: "Network error",
    };
  }
}

/**
 * List all files in the backend data_room
 */
export async function listFiles(): Promise<ListFilesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/files`, {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        files: [],
        total_count: 0,
        directory: "",
        timestamp: new Date().toISOString(),
      };
    }

    return data;
  } catch {
    return {
      files: [],
      total_count: 0,
      directory: "",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check if backend API is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    // Use local API health endpoint which proxies to backend
    const response = await fetch("/api/health", {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      return data.status === "connected";
    }
    return false;
  } catch {
    // Silently return false when backend is unavailable
    return false;
  }
}

export const api = {
  askQuestion,
  retrieve,
  listDocuments,
  summarize,
  uploadFile,
  deleteFile,
  listFiles,
  checkHealth,
  convertToDocumentFiles,
};
