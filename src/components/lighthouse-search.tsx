"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Send, 
  Loader2, 
  FileText, 
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "convex/_generated/dataModel";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Source {
  id: Id<"documents">;
  title: string;
  type: string;
}

interface LighthouseResponse {
  answer: string;
  sources: Source[];
  metadata: {
    tokensUsed: number;
    responseTimeMs: number;
    model: string;
    documentsSearched: number;
  };
}

type Mode = "manual" | "auto";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LighthouseSearch() {
  // ========================================
  // State Management
  // ========================================
  const [mode, setMode] = useState<Mode>("auto");
  const [question, setQuestion] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Id<"documents">[]>([]);
  const [response, setResponse] = useState<LighthouseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // Convex Hooks
  // ========================================
  const { isAuthenticated } = useConvexAuth();

  const documents = useQuery(
    api.documents.list,
    isAuthenticated ? {} : "skip"
  );
  const askQuestion = useAction(api.ai.askQuestion);
  const generateAnswer = useAction(api.ai.generateAnswer);

  // ========================================
  // Auto-select documents in manual mode
  // ========================================
  useEffect(() => {
    if (mode === "manual" && documents && documents.length > 0 && selectedDocs.length === 0) {
      // Auto-select first 5 documents for convenience
      setSelectedDocs(documents.slice(0, Math.min(5, documents.length)).map(d => d._id));
    }
  }, [documents, mode, selectedDocs.length]);

  // ========================================
  // Handle form submission
  // ========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuestion = question.trim();
    
    // Validation
    if (!trimmedQuestion) {
      setError("🧭 Your COMPASS needs direction - please ask a question");
      return;
    }

    if (mode === "manual" && selectedDocs.length === 0) {
      setError("📚 Please select at least one document to search");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      let result: LighthouseResponse;

      if (mode === "manual") {
        // APPROACH 1: Manual document selection
        result = await askQuestion({
          query: trimmedQuestion,
          documentIds: selectedDocs,
          maxTokens: 2048,
        });
      } else {
        // APPROACH 2: Automatic search
        result = await generateAnswer({
          query: trimmedQuestion,
          maxSources: 5,
          maxTokens: 2048,
        });
      }

      setResponse(result);
    } catch (err) {
      console.error("LIGHTHOUSE error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to generate answer. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // Toggle document selection
  // ========================================
  const toggleDocument = (docId: Id<"documents">) => {
    setSelectedDocs(prev => 
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // ========================================
  // Select/Deselect all documents
  // ========================================
  const selectAllDocuments = () => {
    if (documents) {
      setSelectedDocs(documents.map(d => d._id));
    }
  };

  const deselectAllDocuments = () => {
    setSelectedDocs([]);
  };

  // ========================================
  // Handle mode change
  // ========================================
  const handleModeChange = (newMode: string) => {
    setMode(newMode as Mode);
    setResponse(null);
    setError(null);
  };

  // ========================================
  // Example questions
  // ========================================
  const exampleQuestions = [
    "What did the client say about deliverables in the last brief?",
    "Summarize our SOW terms for the Acme project",
    "What action items came out of last week's team meeting?",
  ];

  const handleExampleQuestion = (exampleQ: string) => {
    setQuestion(exampleQ);
    setResponse(null);
    setError(null);
  };

  // ========================================
  // Render Component
  // ========================================
  return (
    <div className="space-y-6">
      {/* ========================================
          HEADER SECTION
          ======================================== */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1B3D5C] to-[#00BCD4] mb-4">
          <Lightbulb className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#1B3D5C] mb-2">
          The LIGHTHOUSE
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ask natural questions. Get instant answers from your knowledge base.
          The LIGHTHOUSE illuminates insights in seconds, not hours.
        </p>
      </div>

      {/* ========================================
          MODE SELECTOR (Manual vs Auto)
          ======================================== */}
      <Card className="p-4 border-[#1B3D5C]/20">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto" className="data-[state=active]:bg-[#00BCD4] data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              Smart Search
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-[#1B3D5C] data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Select Documents
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 px-1">
            <TabsContent value="auto" className="mt-0">
              <p className="text-sm text-muted-foreground">
                ✨ <strong>Smart Search Mode:</strong> Just ask your question and the LIGHTHOUSE 
                automatically finds the 5 most relevant documents to answer it.
              </p>
            </TabsContent>
            <TabsContent value="manual" className="mt-0">
              <p className="text-sm text-muted-foreground">
                🎯 <strong>Manual Mode:</strong> You choose which documents to search. 
                Great for focused queries when you know which sources are relevant.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* ========================================
          QUESTION INPUT FORM
          ======================================== */}
      <Card className="p-6 border-[#1B3D5C]/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Input */}
          <div>
            <label className="text-sm font-medium text-[#1B3D5C] mb-2 block">
              Your Question
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What does your LIGHTHOUSE seek? (e.g., 'How do I mix vocals?' or 'What equipment do I need?')"
              className="min-h-[120px] resize-none border-[#1B3D5C]/20 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
              disabled={isLoading}
              maxLength={1000}
            />
            {/* Counter + Example Questions */}
            <div className="flex items-start justify-between gap-4">
              {/* Example Questions (left side) */}
              {!response && !isLoading && question.length === 0 ? (
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Try these examples:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {exampleQuestions.map((exampleQ, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExampleQuestion(exampleQ)}
                        className="text-xs border-[#00BCD4]/30 text-[#00BCD4] hover:bg-[#00BCD4]/10"
                      >
                        {exampleQ}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              
              {/* Character counter (right side) */}
              <span className="text-xs text-muted-foreground pt-1 flex-shrink-0">
                {question.length}/1000
              </span>
            </div>
          </div>

          {/* Manual Mode: Document Selection */}
          {mode === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1B3D5C]">
                  Select Documents ({selectedDocs.length} selected)
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllDocuments}
                    className="text-xs text-[#00BCD4] hover:text-[#00BCD4] hover:bg-[#00BCD4]/10"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllDocuments}
                    className="text-xs text-muted-foreground hover:text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {documents && documents.length > 0 ? (
                <div className="grid gap-2 max-h-64 overflow-y-auto border border-[#1B3D5C]/10 rounded-lg p-3">
                  {documents.map((doc) => (
                    <label
                      key={doc._id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedDocs.includes(doc._id)
                          ? "border-[#00BCD4] bg-[#00BCD4]/5"
                          : "border-[#1B3D5C]/20 hover:bg-[#1B3D5C]/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc._id)}
                        onChange={() => toggleDocument(doc._id)}
                        className="rounded border-[#1B3D5C]/30 text-[#00BCD4] focus:ring-[#00BCD4]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1B3D5C] truncate">
                            {doc.title}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs border-[#00BCD4]/30 text-[#00BCD4]"
                          >
                            {doc.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {selectedDocs.includes(doc._id) && (
                        <CheckCircle2 className="h-4 w-4 text-[#00BCD4] flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center border-[#1B3D5C]/10">
                  <FileText className="h-12 w-12 text-[#00BCD4]/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No documents yet. Upload some documents first to start asking questions!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-[#00BCD4]/30 text-[#00BCD4]"
                    onClick={() => window.location.href = "/dashboard/upload"}
                  >
                    Go to PORT (Upload)
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {mode === "auto" 
                ? "✨ Will automatically find relevant documents"
                : `🎯 Will search ${selectedDocs.length} selected document${selectedDocs.length !== 1 ? 's' : ''}`
              }
            </div>
            <Button
              type="submit"
              disabled={
                isLoading || 
                !question.trim() || 
                (mode === "manual" && selectedDocs.length === 0)
              }
              className="bg-[#1B3D5C] hover:bg-[#00BCD4] text-white transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Illuminating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ask LIGHTHOUSE
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ========================================
          LOADING STATE
          ======================================== */}
      {isLoading && (
        <Card className="p-8 border-[#00BCD4]/30">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Lighthouse beam animation */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1B3D5C] to-[#00BCD4] animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lightbulb className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[#00BCD4] font-medium mb-1">
                The LIGHTHOUSE beam is searching...
              </p>
              <p className="text-sm text-muted-foreground">
                {mode === "auto" 
                  ? "Finding relevant documents and generating answer"
                  : `Analyzing ${selectedDocs.length} document${selectedDocs.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================
          ERROR STATE
          ======================================== */}
      {error && !isLoading && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Navigating through fog
              </h3>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================
          ANSWER DISPLAY
          ======================================== */}
      {response && !isLoading && (
        <div className="space-y-6">
          {/* Main Answer Card */}
          <Card className="p-6 border-[#00BCD4]/30 bg-gradient-to-br from-white to-[#00BCD4]/5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B3D5C] to-[#00BCD4] flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#1B3D5C] flex items-center gap-2">
                    <span>The LIGHTHOUSE has illuminated your answer</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {mode === "auto" && (
                      <Badge className="bg-[#00BCD4]/10 text-[#00BCD4] border-[#00BCD4]/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Smart Search
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-[#1B3D5C]/20 text-muted-foreground">
                      {response.sources.length} source{response.sources.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {response.answer}
                  </p>
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 border-t border-[#1B3D5C]/10 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {response.metadata.responseTimeMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {response.metadata.tokensUsed.toLocaleString()} tokens
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {response.metadata.documentsSearched} document{response.metadata.documentsSearched !== 1 ? 's' : ''} searched
                  </span>
                  <span className="text-[#00BCD4]">
                    {response.metadata.model}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Source Documents */}
          {response.sources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#1B3D5C] mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00BCD4]" />
                Follow the CURRENTS (Source Documents)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {response.sources.map((source) => (
                  <Card
                    key={source.id}
                    className="p-4 border-[#1B3D5C]/20 hover:border-[#00BCD4] hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => {
                      window.location.href = `/dashboard/documents/${source.id}`;
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-[#1B3D5C] group-hover:text-[#00BCD4] transition-colors">
                        {source.title}
                      </h4>
                      <Badge className="bg-[#00BCD4]/10 text-[#00BCD4] text-xs">
                        {source.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to view full document
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* New Question Button */}
          <Card className="p-4 border-[#1B3D5C]/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Want to ask another question?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuestion("");
                  setResponse(null);
                  setError(null);
                }}
                className="border-[#00BCD4]/30 text-[#00BCD4] hover:bg-[#00BCD4]/10"
              >
                Ask Another Question
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================
          EMPTY STATE (No response yet)
          ======================================== */}
      {!response && !isLoading && !error && (
        <Card className="p-12 border-[#1B3D5C]/10 text-center">
          <Lightbulb className="h-16 w-16 text-[#00BCD4]/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#1B3D5C] mb-2">
            Ready to illuminate your knowledge
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {mode === "auto" 
              ? "Ask any question and the LIGHTHOUSE will automatically search your entire knowledge base."
              : "Select documents above and ask a question. The LIGHTHOUSE will search only those documents."
            }
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>💡 Tip:</span>
            <span>
              {mode === "auto"
                ? "Smart Search is best for exploring your knowledge base"
                : "Manual mode is perfect when you know which documents matter"
              }
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}