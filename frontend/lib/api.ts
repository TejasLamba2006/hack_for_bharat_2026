/**
 * API client for Flask Proxy Server
 * All requests go through the proxy on port 9001 (no CORS issues!)
 * Proxy forwards RAG requests to Pathway server on port 9000
 */

import type { DocumentFile } from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://207.244.225.17:9001"
).replace(/\/$/, "");

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
  context_docs?: ContextDocument[];
  sources?: ContextDocument[]; // Pathway may use 'sources' instead
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
export function convertToDocumentFiles(
  response: ListFilesResponse,
): DocumentFile[] {
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
        return_context_docs: true,
        filters: filters,
        model: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ask question: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Backend unavailable:", error);
    throw new Error(
      "Backend service is currently unavailable. Please try again later.",
    );
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

    if (!response.ok) {
      throw new Error(`Failed to retrieve documents: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Backend unavailable:", error);
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

    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Return empty response when backend is unavailable
    console.warn("Backend unavailable, returning empty document list:", error);
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
      message:
        "Backend service is currently unavailable. Please try again later.",
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
      message:
        "Backend service is currently unavailable. Please try again later.",
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

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Return empty response when backend is unavailable
    console.warn("Backend unavailable, returning empty file list:", error);
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
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
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
