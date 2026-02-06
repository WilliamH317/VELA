"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Compass, FileText, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time search - skip if query empty
  const results = useQuery(
    api.documents.search,
    searchQuery.trim().length > 0 
      ? { query: searchQuery }
      : "skip"
  );
  
  const isLoading = results === undefined;
  const documents = results ?? [];
  
  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* COMPASS Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-10 w-10 text-[#00BCD4]" />
          <h1 className="text-4xl font-bold text-[#1B3D5C]">
            COMPASS
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Navigate your knowledge in seconds, not hours
        </p>
      </div>
      
      {/* Search Input */}
      <div className="relative mb-8 mx-auto" style={{ maxWidth: '576px' }}>
        <Compass className="absolute left-4 top-4 h-5 w-5 text-[#00BCD4]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="What does your COMPASS seek?"
          className="h-14 text-lg border-2 border-[#1B3D5C]/20 focus:border-[#00BCD4] focus:ring-[#00BCD4] transition-colors"
          style={{ paddingLeft: '4rem' }}
          autoFocus
        />
      </div>
      
      {/* Results Section */}
      {isLoading && searchQuery.trim().length > 0 ? (
        <NavigatingLoader />
      ) : searchQuery.trim().length === 0 ? (
        <EmptySearch />
      ) : documents.length === 0 ? (
        <NoResults query={searchQuery} />
      ) : (
        <SearchResults documents={documents} query={searchQuery} />
      )}
    </div>
  );
}

// Nautical loading state with wave animation
function NavigatingLoader() {
  return (
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
        Navigating your knowledge sea...
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
  );
}

// Empty state - ready to search
function EmptySearch() {
  return (
    <div className="text-center py-16 space-y-4">
      <Compass className="h-16 w-16 text-[#1B3D5C]/30 mx-auto" />
      <div>
        <p className="text-lg text-[#1B3D5C] font-medium">
          Set your COMPASS to begin
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Search across all your documents instantly
        </p>
      </div>
      
      {/* Quick tips */}
      <div className="max-w-md mx-auto mt-8 text-left">
        <p className="text-xs font-semibold text-[#1B3D5C] mb-3">
          Navigation Tips:
        </p>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4]">•</span>
            <span>Search by title, content, or tags</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4]">•</span>
            <span>Results appear instantly as you type</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4]">•</span>
            <span>Click any result to view full document</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// No results found - encouraging message
function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="text-4xl">🌊</div>
      <div>
        <p className="text-lg text-[#1B3D5C] font-medium">
          Still waters on this voyage
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          No documents found for "{query}"
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try different search terms or upload more documents
        </p>
      </div>
      
      {/* Suggestions */}
      <div className="max-w-sm mx-auto mt-8">
        <p className="text-xs font-semibold text-[#1B3D5C] mb-2">
          Try searching for:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="cursor-pointer hover:bg-[#00BCD4]/10">
            document keywords
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-[#00BCD4]/10">
            project names
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-[#00BCD4]/10">
            topics
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Search results with highlighting
function SearchResults({ 
  documents, 
  query 
}: { 
  documents: any[]; 
  query: string;
}) {
  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-[#00BCD4]">
            {documents.length}
          </span> {documents.length === 1 ? "result" : "results"}
        </p>
        <p className="text-xs text-muted-foreground">
          Instant navigation • No waiting
        </p>
      </div>
      
      {/* Result cards */}
      {documents.map((doc) => (
        <SearchResultCard 
          key={doc._id} 
          document={doc} 
          query={query}
        />
      ))}
    </div>
  );
}

// Individual result card with highlighting
function SearchResultCard({ 
  document, 
  query 
}: { 
  document: any;
  query: string;
}) {
  // Extract snippet with context around match
  const snippet = extractSnippet(document.contentPlain, query);
  
  return (
    <Link href={`/documents/${document._id}`}>
      <Card className="p-5 border-[#1B3D5C]/20 hover:border-[#00BCD4] hover:shadow-lg transition-all cursor-pointer group">
        <div className="space-y-3">
          {/* Title with icon */}
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-[#00BCD4] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1B3D5C] group-hover:text-[#00BCD4] transition-colors line-clamp-1">
                {highlightText(document.title, query)}
              </h3>
            </div>
          </div>
          
          {/* Content snippet with highlighting */}
          <p className="text-sm text-muted-foreground line-clamp-2 pl-8">
            {highlightText(snippet, query)}
          </p>
          
          {/* Metadata row */}
          <div className="flex items-center gap-3 pl-8 flex-wrap">
            <Badge 
              variant="outline" 
              className="text-xs border-[#00BCD4]/30 text-[#00BCD4]"
            >
              {document.type}
            </Badge>
            
            {document.tags && document.tags.length > 0 && (
              <div className="flex gap-2">
                {document.tags.slice(0, 3).map((tag: string) => (
                  <Badge 
                    key={tag}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{document.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {/* Safe metadata access with optional chaining */}
            {document.metadata?.uploadedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Calendar className="h-3 w-3" />
                {formatDate(document.metadata.uploadedAt)}
              </div>
            )}
            
            {/* Fallback if no metadata */}
            {!document.metadata?.uploadedAt && document._creationTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Calendar className="h-3 w-3" />
                {formatDate(document._creationTime)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Utility: Extract snippet with context around match
function extractSnippet(content: string, query: string, contextLength = 200): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Find first occurrence of query
  const matchIndex = lowerContent.indexOf(lowerQuery);
  
  if (matchIndex === -1) {
    // Query not found in content, return beginning
    return content.slice(0, contextLength) + 
           (content.length > contextLength ? "..." : "");
  }
  
  // Calculate snippet boundaries with context
  const beforeContext = 80;
  const afterContext = 120;
  
  const start = Math.max(0, matchIndex - beforeContext);
  const end = Math.min(
    content.length, 
    matchIndex + query.length + afterContext
  );
  
  let snippet = content.slice(start, end);
  
  // Add ellipsis for truncation
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  
  return snippet;
}

// Utility: Highlight matching text in results
function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  
  // Split text by query matches (case-insensitive)
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark 
            key={index}
            className="bg-[#00BCD4]/20 text-[#1B3D5C] font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

// Utility: Escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Utility: Format timestamp to friendly date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Recent dates
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  // Older dates - format based on year
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric'
  };
  
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  
  return date.toLocaleDateString('en-US', options);
}