"use client";

import { useState, useRef } from "react";
import { DocumentFile } from "@/lib/types";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";
import { Cloud, AlertCircle, CheckCircle, X } from "lucide-react";

interface UploadFormProps {
  onUploadSuccess?: (doc: DocumentFile) => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    // if (file.size > 10 * 1024 * 1024) {
    //   setUploadStatus('error');
    //   setErrorMessage('File size exceeds 10MB limit');
    //   return;
    // }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus("error");
      setErrorMessage("Only PDF, TXT, MD, and DOCX files are supported");
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      // Upload to Flask proxy server (which saves to data_room/)
      const uploadResponse = await api.uploadFile(file.name, file);

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || uploadResponse.message);
      }

      // Also save to local storage for offline access
      const text = await file.text();
      const doc: DocumentFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: text,
        uploadedAt: Date.now(),
        size: file.size,
        type: file.type,
      };

      storage.saveDocument(doc);
      storage.logAnalytics({
        type: "upload",
        timestamp: Date.now(),
        details: { fileName: file.name, size: file.size },
      });

      setUploadStatus("success");
      setUploadedFileName(file.name);
      onUploadSuccess?.(doc);

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadedFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload file to server. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: fileInputRef.current } as any);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          accept=".pdf,.txt,.md,.docx"
        />

        {uploadStatus === "idle" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <Cloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {isUploading ? "Uploading..." : "Drop your documents here"}
            </h3>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, TXT, MD, DOCX (Max 10MB)
            </p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="flex items-center justify-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-green-600">Upload successful</p>
              <p className="text-sm text-muted-foreground">
                {uploadedFileName}
              </p>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="text-left">
              <p className="font-semibold text-red-600">Upload failed</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
