"use client";

import { useState } from "react";
import { useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Anchor,
  GitBranch,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Signal count quality label */
function SignalQuality({ count }: { count: number }) {
  if (count >= 4)
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-[#00BCD4]/40 text-[#00BCD4]"
      >
        Full chart ✦✦✦✦
      </Badge>
    );
  if (count >= 3)
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-[#00BCD4]/30 text-[#00BCD4]/80"
      >
        Strong chart ✦✦✦
      </Badge>
    );
  if (count >= 2)
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-[#1B3D5C]/20 text-[#1B3D5C]/60"
      >
        Partial chart ✦✦
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-[#1B3D5C]/10 text-[#1B3D5C]/40"
    >
      Single reading ✦
    </Badge>
  );
}

/** Weight bar — teal-to-navy gradient proportional to weight */
function WeightBar({ weight }: { weight: number }) {
  return (
    <div className="h-1.5 w-full bg-[#1B3D5C]/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] rounded-full transition-all"
        style={{ width: `${Math.max(weight * 100, 4)}%` }}
      />
    </div>
  );
}

// ============================================================================
// LOADING STATE — wave animation (NEVER spinner)
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
// MAIN PAGE
// ============================================================================

export default function ConnectionsPage() {
  const { isAuthenticated } = useConvexAuth();
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<{
    edgesCreated: number;
    avgWeight: number;
    documentCount: number;
    bridgeDocumentCount: number;
    signalAvailability: Record<string, boolean>;
  } | null>(null);

  // Real-time queries
  const summary = useQuery(
    api.laminar.queries.getGraphSummary,
    isAuthenticated ? {} : "skip",
  );
  const bridges = useQuery(
    api.laminar.queries.getBridgeDocuments,
    isAuthenticated ? {} : "skip",
  );
  const attractors = useQuery(
    api.laminar.queries.getAttractorStates,
    isAuthenticated ? {} : "skip",
  );

  const buildGraph = useAction(api.laminar.graph.buildKnowledgeGraph);

  const isLoading = summary === undefined;
  const hasData = summary !== null && summary !== undefined && summary.edgeCount > 0;

  const handleBuild = async () => {
    setIsBuilding(true);
    setBuildResult(null);
    try {
      const result = await buildGraph();
      setBuildResult(result);
    } catch (err) {
      console.error("Graph build failed:", err);
    } finally {
      setIsBuilding(false);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Navigating your knowledge sea..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* ═══════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3D5C] flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-[#00BCD4]" />
            CHARTS — Knowledge Connections
          </h1>
          {hasData && summary ? (
            <p className="text-sm text-[#1B3D5C]/60 mt-1">
              {summary.edgeCount} connections discovered across{" "}
              {summary.documentCount} documents
            </p>
          ) : (
            <p className="text-sm text-[#1B3D5C]/60 mt-1">
              Discover how your cargo connects across ARCHIPELAGOS
            </p>
          )}
        </div>

        <Button
          onClick={handleBuild}
          disabled={isBuilding}
          className={cn(
            "bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white",
            "hover:shadow-md hover:shadow-[#00BCD4]/20 transition-all",
            "disabled:opacity-60",
          )}
        >
          {isBuilding ? (
            <>
              <Waves className="h-4 w-4 mr-2 animate-pulse" />
              Charting connections...
            </>
          ) : (
            <>
              <GitBranch className="h-4 w-4 mr-2" />
              Chart Connections
            </>
          )}
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════
          BUILDING STATE
          ═══════════════════════════════════════════════ */}
      {isBuilding && (
        <LoadingState message="Charting knowledge connections across your cargo..." />
      )}

      {/* ═══════════════════════════════════════════════
          BUILD RESULT TOAST
          ═══════════════════════════════════════════════ */}
      {buildResult && !isBuilding && (
        <Card className="border-[#00BCD4]/30 bg-[#00BCD4]/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-sm text-[#1B3D5C] font-medium">
                Smooth sailing! {buildResult.edgesCreated} connections charted
                across {buildResult.documentCount} documents.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#1B3D5C]/60">
                <span>Signals used:</span>
                {buildResult.signalAvailability.contentSimilarity && (
                  <span title="Content">📐</span>
                )}
                {buildResult.signalAvailability.structuralLink && (
                  <span title="Clusters">🏝️</span>
                )}
                {buildResult.signalAvailability.coAccessStrength && (
                  <span title="Co-access">🌊</span>
                )}
                {buildResult.signalAvailability.temporalProximity && (
                  <span title="Temporal">⏱️</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════
          EMPTY STATE
          ═══════════════════════════════════════════════ */}
      {!hasData && !isBuilding && (
        <Card className="border-[#1B3D5C]/10">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <GitBranch className="h-12 w-12 text-[#1B3D5C]/20 mb-4" />
            <h3 className="text-lg font-medium text-[#1B3D5C]/80 mb-2">
              Still waters
            </h3>
            <p className="text-sm text-[#1B3D5C]/50 max-w-md">
              Your knowledge connections will emerge as you upload cargo and
              explore your ARCHIPELAGOS. Chart connections above to discover
              how your documents relate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════
          BRIDGE DOCUMENTS
          ═══════════════════════════════════════════════ */}
      {hasData && bridges && Array.isArray(bridges) && bridges.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3 flex items-center gap-2">
            <span>🌉</span> Bridge Documents
          </h2>
          <p className="text-xs text-[#1B3D5C]/50 mb-4">
            These documents span multiple ARCHIPELAGOS — connecting otherwise
            separate knowledge islands.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bridges.map((doc) => (
              <Card
                key={String(doc._id)}
                className="border-[#00BCD4]/20 hover:border-[#00BCD4]/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-[#1B3D5C] line-clamp-2">
                      <Link
                        href={`/documents/${String(doc._id)}`}
                        className="hover:text-[#00BCD4] transition-colors"
                      >
                        {doc.title}
                      </Link>
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[#00BCD4]/30 text-[#00BCD4] shrink-0"
                    >
                      🌉 Bridge
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {doc.topMemberships.map(
                      (
                        m: { clusterId: string; probability: number },
                        i: number,
                      ) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-[#1B3D5C]/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] rounded-full"
                              style={{
                                width: `${Math.max(m.probability * 100, 4)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#1B3D5C]/50 w-10 text-right">
                            {(m.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          ATTRACTOR STATES
          ═══════════════════════════════════════════════ */}
      {hasData && attractors && Array.isArray(attractors) && attractors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3 flex items-center gap-2">
            <Anchor className="h-5 w-5 text-[#00BCD4]" />
            Attractor States
          </h2>
          <p className="text-xs text-[#1B3D5C]/50 mb-4">
            Knowledge centers that your other documents gravitate toward —
            the anchors of your knowledge sea.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attractors.map((attractor) => (
              <Card
                key={attractor.documentId}
                className="border-[#1B3D5C]/10 hover:border-[#1B3D5C]/20 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-[#1B3D5C] line-clamp-2">
                      <Link
                        href={`/documents/${attractor.documentId}`}
                        className="hover:text-[#00BCD4] transition-colors"
                      >
                        {attractor.title}
                      </Link>
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        attractor.classification === "strong"
                          ? "border-[#00BCD4] text-[#00BCD4]"
                          : attractor.classification === "emerging"
                            ? "border-[#00BCD4]/50 text-[#00BCD4]/70"
                            : "border-[#1B3D5C]/20 text-[#1B3D5C]/40",
                      )}
                    >
                      {attractor.classification === "strong"
                        ? "⚓ Knowledge Center"
                        : attractor.classification === "emerging"
                          ? "🧭 Emerging"
                          : "Peripheral"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {attractor.connectionCount} connections · weight{" "}
                    {attractor.totalWeight.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <WeightBar
                    weight={
                      attractors.length > 0
                        ? attractor.totalWeight /
                          (attractors[0]?.totalWeight || 1)
                        : 0
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          SIGNAL LEGEND
          ═══════════════════════════════════════════════ */}
      {hasData && (
        <Card className="border-[#1B3D5C]/5 bg-[#1B3D5C]/[0.02]">
          <CardContent className="py-4">
            <h3 className="text-xs font-semibold text-[#1B3D5C]/70 mb-2 uppercase tracking-wider">
              Connection Signals
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#1B3D5C]/60">
              <span>📐 Content similarity</span>
              <span>🏝️ Shared ARCHIPELAGO</span>
              <span>🌊 Co-accessed together</span>
              <span>⏱️ Temporal alignment</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <SignalQuality count={4} />
              <SignalQuality count={3} />
              <SignalQuality count={2} />
              <SignalQuality count={1} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
