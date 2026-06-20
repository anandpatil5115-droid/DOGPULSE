import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface UploadResponse {
  filename: string;
  pages: number;
  chunks: number;
  message: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  response?: UploadResponse;
  error?: string;
}

interface DocumentUploadProps {
  sessionId: string;
  onDocumentIndexed: (name: string, chunks: number) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ sessionId, onDocumentIndexed }) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUpload = useCallback((id: string, update: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...update } : u));
  }, []);

  const uploadFile = useCallback(async (uploadItem: UploadItem) => {
    const { id, file } = uploadItem;
    updateUpload(id, { status: 'uploading', progress: 0 });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    try {
      const response = await axios.post<UploadResponse>('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            updateUpload(id, { progress: percent });
          }
        },
      });

      const data = response.data;
      updateUpload(id, {
        status: 'success',
        progress: 100,
        response: data,
      });

      const chunks = data.chunks || 0;
      onDocumentIndexed(file.name, chunks);
    } catch (error: unknown) {
      let errorMsg = 'Upload failed. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (axios.isAxiosError(error) && error.response?.status === 413) {
        errorMsg = 'File too large. Maximum size is 50MB.';
      } else if (axios.isAxiosError(error) && !error.response) {
        errorMsg = 'Cannot connect to the server. Please check if the backend is running.';
      }
      updateUpload(id, { status: 'error', error: errorMsg });
    }
  }, [sessionId, updateUpload, onDocumentIndexed]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) return;

    const newUploads: UploadItem[] = pdfFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading each file
    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-syn-surface overflow-y-auto relative">
      {/* Subtle background radial light */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(20, 110, 241, 0.05) 0%, transparent 75%)`,
        }}
      />

      <div className="relative z-10 max-w-4xl w-full mx-auto px-8 py-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-syn-onSurface font-geist tracking-tight mb-1.5">
            Upload Documents
          </h2>
          <p className="text-sm text-syn-onSurfaceVariant">
            Add PDF files (manuals, reports, research papers) to your workspace. Once uploaded, you can search and chat with them instantly.
          </p>
        </div>

        {/* Dropzone Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-syn-surfaceContainerLowest border border-syn-outlineVariant/50 rounded-soft-lg p-10 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-syn-elevation
            ${isDragging 
              ? 'border-syn-primary bg-syn-primaryContainer/5 scale-[0.99] ring-2 ring-syn-primary/20' 
              : 'hover:border-syn-primary/40'
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            multiple
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-syn-primaryContainer/20 flex items-center justify-center mb-5 text-syn-primary">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-semibold text-syn-onSurface mb-1.5 font-geist">
            Drag & drop PDF files here
          </h3>
          <p className="text-xs text-syn-onSurfaceVariant/80 mb-6">
            Supported file type: PDF (up to 50MB per file)
          </p>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="px-5 py-2.5 bg-syn-primary text-white font-medium text-sm rounded-soft-sm shadow-syn-elevation hover:bg-syn-surfaceTint active:scale-[0.98] transition-all duration-200"
          >
            Browse files
          </button>
        </div>

        {/* Upload Status Area */}
        {uploads.length > 0 && (
          <div className="mt-8 flex-1 flex flex-col min-h-[300px]">
            <h4 className="text-xs font-bold text-syn-outline uppercase tracking-wider font-mono mb-3">
              Upload Activity ({uploads.length})
            </h4>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="bg-syn-surfaceContainerLow border border-syn-outlineVariant/30 rounded-soft-md p-4 flex items-center gap-4 transition-all duration-200 animate-fadeIn"
                >
                  {/* File Icon */}
                  <div className="w-10 h-10 rounded-soft-sm bg-syn-primaryContainer/20 flex items-center justify-center text-syn-primary flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Details and Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <p className="text-sm font-semibold text-syn-onSurface truncate">
                        {upload.file.name}
                      </p>
                      <span className="text-[10px] text-syn-onSurfaceVariant font-mono flex-shrink-0">
                        {formatFileSize(upload.file.size)}
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    {upload.status === 'uploading' && (
                      <div className="w-full bg-syn-surfaceContainerHigh rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-syn-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Status Message */}
                    {upload.status === 'success' && upload.response && (
                      <p className="text-xs text-syn-primary font-medium flex items-center gap-1 font-mono">
                        Successfully parsed: {upload.response.pages} pages, {upload.response.chunks} chunks indexed.
                      </p>
                    )}

                    {upload.status === 'error' && (
                      <p className="text-xs text-syn-error font-medium">
                        {upload.error || 'Upload failed'}
                      </p>
                    )}

                    {upload.status === 'pending' && (
                      <p className="text-xs text-syn-outline">
                        Queued for index pipeline...
                      </p>
                    )}
                  </div>

                  {/* Action/Indicator Icon */}
                  <div className="flex-shrink-0">
                    {upload.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-syn-primary animate-spin" />
                    )}
                    {upload.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-syn-primary" />
                    )}
                    {upload.status === 'error' && (
                      <XCircle className="w-5 h-5 text-syn-error" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
