// app/(dashboard)/documents/new/page.tsx - Day 11 Upload Page
"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload-zone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Ship, Search, Lightbulb } from "lucide-react";

export default function NewDocumentPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    // Redirect back to documents list after successful upload
    router.push("/documents");
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/documents")}
          className="text-[#1B3D5C] hover:text-[#00BCD4] mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Library
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Ship className="h-8 w-8 text-[#00BCD4]" />
          <h1 className="text-3xl font-bold text-[#1B3D5C]">
            Bring Knowledge to PORT
          </h1>
        </div>
        <p className="text-muted-foreground">
          Upload documents to your knowledge base for instant AI-powered search
        </p>
      </div>

      {/* Upload Component */}
      <div className="mb-8">
        <UploadZone onUploadComplete={handleUploadComplete} />
      </div>

      {/* What Happens Next Section */}
      <Card className="p-6 border-[#1B3D5C]/20 bg-gradient-to-br from-[#1B3D5C]/5 to-[#00BCD4]/5">
        <h2 className="text-xl font-semibold text-[#1B3D5C] mb-4">
          ⚓ What Happens Next
        </h2>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1B3D5C] text-white flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-medium text-[#1B3D5C] mb-1">
                📦 Your cargo is secured
              </h3>
              <p className="text-sm text-muted-foreground">
                The document is safely stored in your knowledge base
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1B3D5C] text-white flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-medium text-[#1B3D5C] mb-1">
                ⚙️ Processing in the background
              </h3>
              <p className="text-sm text-muted-foreground">
                We extract text content to make it searchable (instant for .txt/.md, quick for PDFs)
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00BCD4] text-white flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-medium text-[#1B3D5C] mb-1">
                ✅ Ready to navigate
              </h3>
              <p className="text-sm text-muted-foreground">
                Your document appears in the library with a "Ready" badge - search it instantly!
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Note */}
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-[#00BCD4]/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-[#00BCD4] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[#1B3D5C] font-medium mb-1">
                🌊 Real-time updates
              </p>
              <p className="text-xs text-muted-foreground">
                Watch your document status change automatically - no refresh needed! 
                The processing badge will update to "Ready" when extraction completes.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="mt-6 p-6 border-[#1B3D5C]/20">
        <h2 className="text-lg font-semibold text-[#1B3D5C] mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-[#00BCD4]" />
          Quick Tips for Smooth Sailing
        </h2>
        
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4] font-bold">•</span>
            <span>
              <strong className="text-[#1B3D5C]">Supported formats:</strong> PDF, TXT, and MD files up to 10MB
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4] font-bold">•</span>
            <span>
              <strong className="text-[#1B3D5C]">Text files are instant:</strong> .txt and .md files process immediately
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4] font-bold">•</span>
            <span>
              <strong className="text-[#1B3D5C]">PDFs take a moment:</strong> We extract text from PDFs - this takes 5-10 seconds
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4] font-bold">•</span>
            <span>
              <strong className="text-[#1B3D5C]">Multiple uploads:</strong> Upload one file at a time for best results
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00BCD4] font-bold">•</span>
            <span>
              <strong className="text-[#1B3D5C]">Stay on this page:</strong> You can navigate away - processing continues in the background
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}