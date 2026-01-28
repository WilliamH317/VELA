// components/upload-zone.tsx - Day 11 Upload Component
"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api"; // ✅ Fixed: removed @/ alias
import { Upload, FileText, FileCode, X, Ship } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// File type configuration
const ACCEPTED_FILE_TYPES = {
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/pdf": [".pdf"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadZoneProps {
  onUploadComplete?: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createFromFile = useMutation(api.documents.createFromFile);

  // Get file type for Convex
  const getFileType = (mimeType: string): "pdf" | "text" | "markdown" => {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "text/markdown") return "markdown";
    return "text";
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") return FileText;
    if (mimeType === "text/markdown") return FileCode;
    return FileText;
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `⚓ File too large! Maximum cargo size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check file type
    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!acceptedTypes.includes(file.type)) {
      return "🚫 File type not accepted. Please upload PDF, TXT, or MD files";
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get upload URL (10% progress)
      setProgress(10);
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to storage (10% → 60%)
      setProgress(30);
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("⛈️ Stormy seas prevented upload - please try again");
      }

      const { storageId } = await uploadResponse.json();
      setProgress(60);

      // Step 3: Create document record (60% → 90%)
      await createFromFile({
        fileId: storageId,
        title: selectedFile.name,
        type: getFileType(selectedFile.type),
      });
      setProgress(90);

      // Step 4: Complete (90% → 100%)
      setProgress(100);

      // Success!
      setTimeout(() => {
        setSelectedFile(null);
        setIsUploading(false);
        setProgress(0);
        if (onUploadComplete) onUploadComplete();
      }, 500);

    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "⛈️ Stormy seas prevented docking - please try again"
      );
      setIsUploading(false);
      setProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // File input handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Card className="p-6 border-[#1B3D5C]/20">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200
          ${isDragging 
            ? "border-[#00BCD4] bg-[#00BCD4]/5" 
            : "border-[#1B3D5C]/30 hover:border-[#00BCD4]/50"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {!selectedFile ? (
          // Empty state - ready to upload
          <div className="space-y-4">
            <div className="flex justify-center">
              <Ship className="h-12 w-12 text-[#00BCD4]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1B3D5C]">
                Bring Knowledge to PORT
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop your cargo, or click to browse
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>📄 PDF</span>
              <span>•</span>
              <span>📝 TXT</span>
              <span>•</span>
              <span>📋 MD</span>
              <span>•</span>
              <span>Max 10MB</span>
            </div>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.txt,.md"
                onChange={handleFileInputChange}
                disabled={isUploading}
              />
              <label htmlFor="file-upload">
                <Button
                  className="bg-[#1B3D5C] hover:bg-[#00BCD4] text-white"
                  disabled={isUploading}
                  asChild
                >
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
          </div>
        ) : (
          // File selected - ready to dock
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {(() => {
                  const Icon = getFileIcon(selectedFile.type);
                  return <Icon className="h-10 w-10 text-[#00BCD4] flex-shrink-0 mt-1" />;
                })()}
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-[#1B3D5C] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-[#1B3D5C] hover:text-[#00BCD4] flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!isUploading ? (
              <Button
                onClick={handleUpload}
                className="w-full bg-[#1B3D5C] hover:bg-[#00BCD4] text-white"
              >
                <Ship className="h-4 w-4 mr-2" />
                Dock at PORT
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Wave Animation */}
                <div className="relative h-16 bg-[#1B3D5C]/5 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ship className="h-8 w-8 text-[#00BCD4] animate-bounce" />
                  </div>
                  {/* Animated waves */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4]"
                    style={{
                      width: `${progress}%`,
                      transition: "width 0.3s ease-out",
                    }}
                  />
                </div>

                {/* Progress Text */}
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1B3D5C]">
                    {progress < 30 && "🚢 Preparing to dock..."}
                    {progress >= 30 && progress < 60 && "⚓ Docking in progress..."}
                    {progress >= 60 && progress < 90 && "📦 Securing cargo..."}
                    {progress >= 90 && "✅ Docked successfully!"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress}% complete
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </Card>
  );
}