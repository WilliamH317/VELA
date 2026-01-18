"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function TestConvexPage() {
  const [title, setTitle] = useState("");
  
  // Real-time query - updates automatically!
  const documents = useQuery(api.documents.list);
  
  // Mutation for creating documents
  const createDocument = useMutation(api.documents.create);
  
  // Handle form submission
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    try {
      await createDocument({
        title,
        content: `Test content for ${title}`,
        vertical: "musician",
        type: "text",
      });
      
      setTitle("");  // Clear input
      alert("Document created!");
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };
  
  // Handle loading state
  if (documents === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00BCD4]" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-[#1B3D5C]">
        Convex Test Page
      </h1>
      <p className="text-muted-foreground mb-8">
        Testing real-time database connection (remove after Day 7)
      </p>
      
      {/* Create Form */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Test Document</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title..."
            className="border-[#1B3D5C] focus:ring-[#00BCD4]"
          />
          <Button 
            type="submit"
            className="bg-[#1B3D5C] hover:bg-[#00BCD4]"
          >
            Create Document
          </Button>
        </form>
      </Card>
      
      {/* Document List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Your Documents ({documents.length})
        </h2>
        
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No documents yet. Create one above! (You'll see error until Day 8 authentication)
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc._id} className="p-4">
                <h3 className="font-semibold text-[#1B3D5C]">
                  {doc.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(doc.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}