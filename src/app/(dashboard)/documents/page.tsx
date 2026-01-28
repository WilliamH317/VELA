// app/(dashboard)/documents/page.tsx - Day 11 Updated with Status Badges
"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Ship, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
  const router = useRouter();
  
  // Real-time query - automatically updates when documents change
  const documents = useQuery(api.documents.list);
  
  // Handle undefined (loading) state
  const isLoading = documents === undefined;
  const documentList = documents ?? [];

  // Get status badge configuration
  const getStatusBadge = (status: "processing" | "ready" | "error") => {
    switch (status) {
      case "processing":
        return {
          label: "Processing",
          icon: Loader2,
          className: "bg-yellow-100 text-yellow-800 border-yellow-300",
          iconClassName: "animate-spin",
        };
      case "ready":
        return {
          label: "Ready",
          icon: CheckCircle2,
          className: "bg-green-100 text-green-800 border-green-300",
          iconClassName: "",
        };
      case "error":
        return {
          label: "Error",
          icon: AlertCircle,
          className: "bg-red-100 text-red-800 border-red-300",
          iconClassName: "",
        };
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8 text-[#00BCD4]" />
            <div>
              <h1 className="text-3xl font-bold text-[#1B3D5C]">
                Your Knowledge Library
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate to answers in seconds, not hours
              </p>
            </div>
          </div>
          
          {/* Upload Button */}
          <Link href="/documents/new">
            <Button className="bg-[#1B3D5C] hover:bg-[#00BCD4] text-white">
              <Upload className="h-4 w-4 mr-2" />
              Bring to PORT
            </Button>
          </Link>
        </div>

        {/* Document Count */}
        {!isLoading && documentList.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {documentList.length} {documentList.length === 1 ? "document" : "documents"} in your knowledge base
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          {/* Wave animation */}
          <div className="relative h-20 w-64 mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <Ship className="h-10 w-10 text-[#00BCD4] animate-bounce" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1B3D5C] via-[#00BCD4] to-[#1B3D5C] animate-pulse rounded-full" />
          </div>
          <p className="text-sm text-[#00BCD4] font-medium">
            Navigating your knowledge sea...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documentList.length === 0 && (
        <Card className="p-12 text-center border-[#1B3D5C]/20">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Ship className="h-20 w-20 text-[#00BCD4]" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1B3D5C] rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-3">
            Still waters - ready for your first voyage
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your knowledge base is empty. Upload documents to start building your searchable library and save hours every week.
          </p>
          
          <Link href="/documents/new">
            <Button className="bg-[#1B3D5C] hover:bg-[#00BCD4] text-white" size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Bring Your First Document to PORT
            </Button>
          </Link>
          
          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="p-4 bg-gradient-to-br from-[#1B3D5C]/5 to-[#00BCD4]/5 rounded-lg border border-[#1B3D5C]/10">
              <div className="text-2xl font-bold text-[#00BCD4] mb-1">⚡</div>
              <div className="text-xs text-muted-foreground">Instant search</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#1B3D5C]/5 to-[#00BCD4]/5 rounded-lg border border-[#1B3D5C]/10">
              <div className="text-2xl font-bold text-[#00BCD4] mb-1">🤖</div>
              <div className="text-xs text-muted-foreground">AI-powered answers</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#1B3D5C]/5 to-[#00BCD4]/5 rounded-lg border border-[#1B3D5C]/10">
              <div className="text-2xl font-bold text-[#00BCD4] mb-1">⏰</div>
              <div className="text-xs text-muted-foreground">8 hours saved/week</div>
            </div>
          </div>
        </Card>
      )}

      {/* Document List */}
      {!isLoading && documentList.length > 0 && (
        <div className="space-y-4">
          {documentList.map((doc) => {
            const statusConfig = getStatusBadge(doc.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={doc._id} 
                className="p-5 border-[#1B3D5C]/20 hover:border-[#00BCD4]/50 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Document Icon & Content */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <FileText className="h-10 w-10 text-[#00BCD4] flex-shrink-0 mt-1" />
                    
                    <div className="flex-1 min-w-0">
                      {/* Title & Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#1B3D5C] text-lg truncate">
                          {doc.title}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={`${statusConfig.className} flex items-center gap-1 flex-shrink-0`}
                        >
                          <StatusIcon className={`h-3 w-3 ${statusConfig.iconClassName}`} />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      {/* Content Preview */}
                      {doc.status === "ready" && doc.contentPreview && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {doc.contentPreview}
                        </p>
                      )}
                      
                      {/* Processing Message */}
                      {doc.status === "processing" && (
                        <p className="text-sm text-yellow-700 mb-3 italic">
                          ⚙️ Extracting text content... This usually takes 5-10 seconds
                        </p>
                      )}
                      
                      {/* Error Message */}
                      {doc.status === "error" && (
                        <p className="text-sm text-red-700 mb-3">
                          ⛈️ {doc.errorMessage || "Processing failed - please try uploading again"}
                        </p>
                      )}
                      
                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.type.toUpperCase()}
                        </span>
                        
                        {doc.fileSize && doc.fileSize > 0 && (
                          <span>
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                        
                        <span>
                          {formatDate(doc.createdAt)}
                        </span>
                        
                        {doc.source.platform && (
                          <span className="capitalize">
                            {doc.source.platform.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {doc.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-[#00BCD4]/10 text-[#00BCD4] border-[#00BCD4]/20 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {doc.status === "ready" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#1B3D5C] text-[#1B3D5C] hover:bg-[#1B3D5C] hover:text-white"
                        onClick={() => {
                          // TODO: Navigate to document view (Day 12+)
                          console.log("View document:", doc._id);
                        }}
                      >
                        View
                      </Button>
                    )}
                    
                    {doc.status === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => router.push("/documents/new")}
                      >
                        Re-upload
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Real-time Status Info */}
      {!isLoading && documentList.some(d => d.status === "processing") && (
        <Card className="mt-6 p-4 border-[#00BCD4]/30 bg-[#00BCD4]/5">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-[#00BCD4] animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#1B3D5C] font-medium mb-1">
                🌊 Processing in progress
              </p>
              <p className="text-xs text-muted-foreground">
                Watch documents update automatically - no refresh needed! 
                Text files complete instantly, PDFs take 5-10 seconds.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}