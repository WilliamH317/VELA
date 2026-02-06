"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { BackNav } from "@/components/back-nav";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  // Fetch document by ID
  const document = useQuery(api.documents.getById, { 
    id: id as Id<"documents"> 
  });
  
  // Loading state
  if (document === undefined) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <BackNav href="/documents" label="Back to Knowledge Library" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-64 h-2 bg-[#1B3D5C]/10 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4]"
              style={{ 
                width: "60%",
                animation: "wave 1.5s ease-in-out infinite"
              }}
            />
          </div>
          <p className="text-sm text-[#00BCD4] mt-4 font-medium">
            Navigating to your document...
          </p>
          <style jsx>{`
            @keyframes wave {
              0%, 100% { 
                transform: translateX(-100%);
                opacity: 0.5;
              }
              50% { 
                transform: translateX(100%);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }
  
  // Document not found or no access
  if (!document) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center py-16 space-y-4">
          <div className="text-4xl">🌊</div>
          <div>
            <p className="text-lg text-[#1B3D5C] font-medium">
              Document not found
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This document may have been removed or you don't have access
            </p>
          </div>
          <Link 
            href="/search"
            className="inline-flex items-center gap-2 text-sm text-[#00BCD4] hover:text-[#1B3D5C] mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to COMPASS
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Back button */}
      <BackNav href="/documents" label="Back to Knowledge Library" />
      
      {/* Document Card */}
      <Card className="p-8 border-[#1B3D5C]/20">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <FileText className="h-8 w-8 text-[#00BCD4] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-[#1B3D5C] mb-3">
              {document.title}
            </h1>
            
            {/* Metadata */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge 
                variant="outline" 
                className="border-[#00BCD4]/30 text-[#00BCD4]"
              >
                {document.type}
              </Badge>
              
              {document.tags && document.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {document.tags.map((tag: string) => (
                    <Badge 
                      key={tag}
                      variant="secondary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Calendar className="h-4 w-4" />
                {formatDate(document._creationTime)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-[#1B3D5C]/10 mb-6" />
        
        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap text-[#1B3D5C]/90 leading-relaxed">
            {document.content}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Utility: Format timestamp to friendly date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}