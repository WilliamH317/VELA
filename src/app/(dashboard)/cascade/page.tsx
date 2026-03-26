"use client";

import { useState } from "react";
import { useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Waves, ArrowRight, ArrowLeft } from "lucide-react";
import type { Id } from "convex/_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

interface CascadeResult {
  runId: Id<"cascadeRuns">;
  totalAffected: number;
  maxDepthReached: number;
  forwardCount: number;
  reverseCount: number;
  elapsedMs: number;
}

// ============================================================================
// LOADING STATE — wave animation (never spinner)
// ============================================================================

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-16">
      <div className="h-1 w-64 bg-[#1B3D5C]/20 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse rounded-full" />
      </div>
      <p className="text-sm text-[#00BCD4] mt-4">{message}</p>
    </div>
  );
}

// ============================================================================
// IMPACT ROW
// ============================================================================

function ImpactRow({
  title,
  impactScore,
  depth,
  direction,
  confidenceLow,
  confidenceHigh,
}: {
  title: string;
  impactScore: number;
  depth: number;
  direction: string;
  confidenceLow?: number;
  confidenceHigh?: number;
}) {
  const pct = Math.round(impactScore * 100);
  const hasCI = confidenceLow !== undefined && confidenceHigh !== undefined;
  const ciLow = hasCI ? Math.round(confidenceLow! * 100) : 0;
  const ciHigh = hasCI ? Math.round(confidenceHigh! * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#1B3D5C]/[0.02] hover:bg-[#1B3D5C]/[0.05] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1B3D5C] truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className="text-[10px] border-[#00BCD4]/30 text-[#00BCD4]"
          >
            {direction === "forward" ? (
              <><ArrowRight className="h-3 w-3 mr-1" />Forward</>
            ) : (
              <><ArrowLeft className="h-3 w-3 mr-1" />Reverse</>
            )}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] border-[#1B3D5C]/20 text-[#1B3D5C]/60"
          >
            Depth {depth}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1B3D5C] tabular-nums">
            {pct}%
          </p>
          {hasCI && (
            <p className="text-[10px] text-[#1B3D5C]/40 tabular-nums">
              CI: {ciLow}%–{ciHigh}%
            </p>
          )}
        </div>
        <div className="h-2 w-20 bg-[#1B3D5C]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] rounded-full transition-all"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CascadePage() {
  const { isAuthenticated } = useConvexAuth();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CascadeResult | null>(null);

  const documents = useQuery(
    api.documents.list,
    isAuthenticated ? {} : "skip",
  );

  const cascadeImpacts = useQuery(
    api.laminar.queries.getCascadeImpacts,
    result ? { runId: result.runId } : "skip",
  );

  const runCascade = useAction(api.laminar.cascade.runCascade);

  const isLoading = documents === undefined;
  const readyDocs = documents?.filter((d) => d.status === "ready") ?? [];

  const handleRun = async () => {
    if (!selectedDocId || isRunning) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await runCascade({
        sourceDocId: selectedDocId as Id<"documents">,
        direction: "both",
      });
      setResult(res);
    } catch (err) {
      console.error("[CASCADE] Run failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  // Separate forward and reverse impacts
  const forwardImpacts = cascadeImpacts?.filter((i) => i.direction === "forward") ?? [];
  const reverseImpacts = cascadeImpacts?.filter((i) => i.direction === "reverse") ?? [];

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <LoadingState message="Navigating your knowledge sea..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B3D5C] flex items-center gap-2">
          <Zap className="h-6 w-6 text-[#00BCD4]" />
          CASCADE — Butterfly Effect
        </h1>
        <p className="text-sm text-[#1B3D5C]/60 mt-1">
          Predict how changes in one document ripple through your knowledge
        </p>
      </div>

      {/* Document Selector + Run Button */}
      <Card className="border-[#1B3D5C]/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1B3D5C]">
            Select source document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {readyDocs.length === 0 ? (
            <div className="text-center py-8">
              <Waves className="h-12 w-12 text-[#1B3D5C]/20 mx-auto mb-3" />
              <p className="text-sm text-[#1B3D5C]/50">
                Still waters — upload documents to chart CASCADE impacts
              </p>
            </div>
          ) : (
            <>
              <select
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-[#1B3D5C]/20 bg-white px-4 py-2.5 text-sm text-[#1B3D5C] focus:border-[#00BCD4] focus:ring-1 focus:ring-[#00BCD4] outline-none"
              >
                <option value="">Choose a document...</option>
                {readyDocs.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.title}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleRun}
                disabled={!selectedDocId || isRunning}
                className="w-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white hover:shadow-md hover:shadow-[#00BCD4]/20 transition-all disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <Waves className="h-4 w-4 mr-2 animate-pulse" />
                    Charting cascade...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run CASCADE Prediction
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Running state */}
      {isRunning && (
        <LoadingState message="Charting the butterfly effect across your knowledge..." />
      )}

      {/* Results */}
      {result && !isRunning && (
        <div className="space-y-6">
          {/* Summary banner */}
          <Card className="border-[#00BCD4]/30 bg-[#00BCD4]/5">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold text-[#1B3D5C]">
                  CASCADE complete
                </span>
                <span className="text-[#1B3D5C]/60">
                  {result.totalAffected} document{result.totalAffected !== 1 ? "s" : ""} in your wake
                </span>
                <span className="text-[#1B3D5C]/40 text-xs">
                  {result.forwardCount} forward · {result.reverseCount} reverse · depth {result.maxDepthReached} · {result.elapsedMs}ms
                </span>
              </div>
            </CardContent>
          </Card>

          {/* No impacts */}
          {cascadeImpacts && cascadeImpacts.length === 0 && (
            <Card className="border-[#1B3D5C]/10">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Zap className="h-10 w-10 text-[#1B3D5C]/20 mb-3" />
                <p className="text-sm text-[#1B3D5C]/50">
                  No cascade detected — this document stands alone
                </p>
              </CardContent>
            </Card>
          )}

          {/* Forward impacts */}
          {forwardImpacts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-[#00BCD4]" />
                Forward Impact — What changes downstream
              </h2>
              <Card className="border-[#1B3D5C]/10">
                <CardContent className="py-2 space-y-1">
                  {forwardImpacts.map((impact) => (
                    <ImpactRow
                      key={`fwd-${String(impact.documentId)}`}
                      title={impact.title}
                      impactScore={impact.impactScore}
                      depth={impact.depth}
                      direction={impact.direction}
                      confidenceLow={impact.confidenceLow ?? undefined}
                      confidenceHigh={impact.confidenceHigh ?? undefined}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reverse impacts */}
          {reverseImpacts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3 flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 text-[#00BCD4]" />
                Reverse Impact — What this depends on
              </h2>
              <Card className="border-[#1B3D5C]/10">
                <CardContent className="py-2 space-y-1">
                  {reverseImpacts.map((impact) => (
                    <ImpactRow
                      key={`rev-${String(impact.documentId)}`}
                      title={impact.title}
                      impactScore={impact.impactScore}
                      depth={impact.depth}
                      direction={impact.direction}
                      confidenceLow={impact.confidenceLow ?? undefined}
                      confidenceHigh={impact.confidenceHigh ?? undefined}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading impacts */}
          {cascadeImpacts === undefined && (
            <LoadingState message="Charting impact details..." />
          )}
        </div>
      )}
    </div>
  );
}
