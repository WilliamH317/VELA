// app/(dashboard)/documents/page.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Compass, Plus, FileText, Loader2 } from "lucide-react";

export default function DocumentsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Real-time documents query
  const documents = useQuery(
    api.documents.list,
    userLoaded && user ? {} : "skip"
  );
  const createDocument = useMutation(api.documents.create);
  
  
const handleCreate = async () => {
  if (!title || !content) return;
  
  setIsCreating(true);
  try {
    await createDocument({ 
      title, 
      content,
      vertical: "musician",
      type: "text",
    });
    setTitle("");
    setContent("");
  } catch (error) {
    // 🔧 IMPROVED: Show the actual error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to create document. Please try again.";
    
    alert(errorMessage); // This will now show: "A document with identical content already exists: 'Test Document'"
  } finally {
    setIsCreating(false);
  }
};
  
  // Handle loading state
  if (!userLoaded) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00BCD4]" />
        </div>
      </div>
    );
  }
  
  const isLoading = documents === undefined;
  const documentList = documents ?? [];
  
  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#1B3D5C]/20 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-8 w-8 text-[#00BCD4]" />
          <h1 className="text-3xl font-bold text-[#1B3D5C]">
            Your Knowledge Library
          </h1>
        </div>
        <p className="text-muted-foreground">
          Navigate to answers in seconds, not hours
        </p>
      </div>
      
      {/* Create Document Form */}
      <Card className="border-[#1B3D5C]/20">
        <CardHeader>
          <CardTitle className="text-[#1B3D5C] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add to Your Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-[#1B3D5C]/20 focus:border-[#00BCD4]"
          />
          <Textarea
            placeholder="Document content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="border-[#1B3D5C]/20 focus:border-[#00BCD4]"
          />
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !content.trim() || isCreating}
            className="bg-[#1B3D5C] hover:bg-[#00BCD4] text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Document List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1B3D5C]">
          Your Documents ({isLoading ? "..." : documentList.length})
        </h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-1 w-64 bg-[#1B3D5C]/20 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse"
                style={{ width: "75%" }}
              />
            </div>
            <p className="text-sm text-[#00BCD4] animate-pulse">
              Navigating your knowledge sea...
            </p>
          </div>
        ) : documentList.length === 0 ? (
          <Card className="p-12 text-center border-[#1B3D5C]/20 border-dashed">
            <FileText className="h-12 w-12 text-[#1B3D5C]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B3D5C] mb-2">
              No Documents Yet
            </h3>
            <p className="text-muted-foreground">
              Create your first document to begin your voyage
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {documentList.map((doc) => (
              <Card 
                key={doc._id}
                className="p-4 border-[#1B3D5C]/20 hover:border-[#00BCD4] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1B3D5C] mb-1">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {doc.contentPlain}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-[#00BCD4]/10 text-[#00BCD4] px-2 py-1 rounded">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-[#00BCD4]/10 text-[#00BCD4] px-2 py-1 rounded">
                        {doc.type}
                      </span>
                    </div>
                  </div>
                  <FileText className="h-5 w-5 text-[#1B3D5C]/30 ml-4" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}