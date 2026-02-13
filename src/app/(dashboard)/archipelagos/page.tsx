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
import { Compass, MapPin, Anchor, Ship } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "convex/_generated/dataModel";

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ArchipelagosPage() {
  const { isAuthenticated } = useConvexAuth();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [isCharting, setIsCharting] = useState(false);

  // Real-time queries — skip when not authenticated
  const clusterData = useQuery(
    api.laminar.queries.listClusters,
    isAuthenticated ? {} : "skip",
  );
  const clusteringStatus = useQuery(
    api.laminar.queries.getClusteringStatus,
    isAuthenticated ? {} : "skip",
  );
  const clusterMembers = useQuery(
    api.laminar.queries.getClusterMembers,
    isAuthenticated && expandedCluster
      ? { clusterId: expandedCluster as Id<"clusters"> }
      : "skip",
  );

  const runClustering = useAction(api.laminar.engine.run);

  // Derived state
  const isRunning = isCharting || clusteringStatus?.status === "running";
  const isLoading =
    clusterData === undefined && clusteringStatus === undefined;
  const hasData = clusterData && clusterData.clusters.length > 0;

  const handleRechart = async () => {
    if (isRunning) return;
    setIsCharting(true);
    try {
      await runClustering({});
    } catch (e) {
      console.error("[ARCHIPELAGOS] Clustering failed:", e);
    } finally {
      setIsCharting(false);
    }
  };

  const toggleCluster = (clusterId: string) => {
    setExpandedCluster((prev) => (prev === clusterId ? null : clusterId));
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell>
        <WaveLoader />
      </PageShell>
    );
  }

  // ── Failed with no prior data ──────────────────────────────────────
  if (clusteringStatus?.status === "failed" && !hasData) {
    return (
      <PageShell>
        <PageHeader onRechart={handleRechart} isRunning={false} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Anchor
            className="h-16 w-16 mb-4 opacity-40"
            style={{ color: "#1B3D5C" }}
          />
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "#1B3D5C" }}
          >
            Stormy seas
          </h2>
          <p className="text-muted-foreground max-w-md">
            {clusteringStatus.error ||
              "We\u2019ll try charting again soon"}
          </p>
        </div>
      </PageShell>
    );
  }

  // ── Running with no prior data ─────────────────────────────────────
  if (isRunning && !hasData) {
    return (
      <PageShell>
        <PageHeader onRechart={handleRechart} isRunning />
        <WaveLoader />
      </PageShell>
    );
  }

  // ── Empty — no clusters and not failed ─────────────────────────────
  if (!hasData) {
    return (
      <PageShell>
        <PageHeader onRechart={handleRechart} isRunning={false} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Ship
            className="h-16 w-16 mb-4 opacity-30"
            style={{ color: "#1B3D5C" }}
          />
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "#1B3D5C" }}
          >
            Still waters
          </h2>
          <p className="text-muted-foreground max-w-md">
            Upload documents through PORT to discover ARCHIPELAGOS
          </p>
          <Button asChild className="mt-6" style={tealButtonStyle}>
            <a href="/upload">Navigate to PORT</a>
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── Data — clusters ready ──────────────────────────────────────────
  const { run, clusters } = clusterData;

  return (
    <PageShell>
      <PageHeader onRechart={handleRechart} isRunning={isRunning} />

      {/* Status bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-5 py-3"
        style={{ borderColor: "rgba(27, 61, 92, 0.15)" }}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {run.completedAt && (
            <span>
              Last charted:{" "}
              {new Date(run.completedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <span>{run.documentCount} documents</span>
          <span>{run.clusterCount} archipelagos</span>
        </div>
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4" style={{ color: "#00BCD4" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "#1B3D5C" }}
          >
            Navigation Confidence:{" "}
            {run.silhouetteScore !== undefined
              ? `${Math.round(Math.max(0, run.silhouetteScore) * 100)}%`
              : "\u2014"}
          </span>
        </div>
      </div>

      {/* Re-charting notice */}
      {isRunning && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: "rgba(0, 188, 212, 0.07)" }}
        >
          <WaveBar />
          <p
            className="text-sm text-center mt-2"
            style={{ color: "#1B3D5C" }}
          >
            Re-charting knowledge seas...
          </p>
        </div>
      )}

      {/* Cluster grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusters.map((cluster) => {
          const isExpanded = expandedCluster === cluster._id;
          return (
            <Card
              key={cluster._id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                isExpanded
                  ? "md:col-span-2 lg:col-span-3"
                  : "hover:shadow-md",
              )}
              style={{
                borderColor: isExpanded
                  ? "#00BCD4"
                  : "rgba(27, 61, 92, 0.15)",
              }}
              onClick={() => toggleCluster(cluster._id)}
            >
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className="text-base font-bold"
                      style={{ color: "#1B3D5C" }}
                    >
                      <MapPin
                        className="inline-block h-4 w-4 mr-1.5 -mt-0.5"
                        style={{
                          color: cluster.color || "#00BCD4",
                        }}
                      />
                      {cluster.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {cluster.documentCount} document
                      {cluster.documentCount !== 1 ? "s" : ""} in this
                      archipelago
                    </CardDescription>
                  </div>
                  {cluster.color && (
                    <div
                      className="h-3 w-3 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: cluster.color }}
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Keyword pills */}
                <div className="flex flex-wrap gap-1.5">
                  {cluster.topKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="outline"
                      className="text-xs font-normal"
                      style={{
                        color: "#00BCD4",
                        borderColor: "rgba(0, 188, 212, 0.4)",
                        backgroundColor: "rgba(0, 188, 212, 0.06)",
                      }}
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>

                {/* Coherence bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Coherence</span>
                    <span>
                      {Math.round(cluster.coherenceScore * 100)}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{
                      backgroundColor: "rgba(27, 61, 92, 0.1)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(Math.max(0, cluster.coherenceScore) * 100)}%`,
                        backgroundColor: "#00BCD4",
                      }}
                    />
                  </div>
                </div>

                {/* Expanded member list */}
                {isExpanded && (
                  <MemberList
                    members={clusterMembers?.members ?? null}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

// ============================================================================
// SHARED STYLES
// ============================================================================

const tealButtonStyle: React.CSSProperties = {
  backgroundColor: "#00BCD4",
  color: "white",
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Wrapper that provides the container and wave CSS keyframes. */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes archipelago-wave {
          0%   { left: -33%; opacity: 0.4; }
          50%  { opacity: 1; }
          100% { left: 100%; opacity: 0.4; }
        }
      `}</style>
      <div className="container mx-auto max-w-6xl p-6 space-y-8">
        {children}
      </div>
    </>
  );
}

function PageHeader({
  onRechart,
  isRunning,
}: {
  onRechart: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "#1B3D5C" }}
        >
          <Compass className="h-7 w-7" style={{ color: "#00BCD4" }} />
          Your ARCHIPELAGOS
        </h1>
        <p className="text-muted-foreground mt-1">
          Knowledge islands discovered by LAMINAR
        </p>
      </div>
      <Button
        onClick={onRechart}
        disabled={isRunning}
        className="shrink-0"
        style={isRunning ? undefined : tealButtonStyle}
      >
        {isRunning ? (
          <>
            <Ship className="h-4 w-4 animate-pulse" />
            Charting...
          </>
        ) : (
          <>
            <Compass className="h-4 w-4" />
            Re-chart ARCHIPELAGOS
          </>
        )}
      </Button>
    </div>
  );
}

/** Animated wave bar — uses the archipelago-wave keyframe from PageShell. */
function WaveBar() {
  return (
    <div
      className="relative h-1.5 w-full rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(27, 61, 92, 0.1)" }}
    >
      <div
        className="absolute inset-y-0 w-1/3 rounded-full"
        style={{
          backgroundColor: "#00BCD4",
          animation: "archipelago-wave 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Full-page loading state with wave animation. */
function WaveLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Compass
        className="h-12 w-12 mb-6 animate-pulse"
        style={{ color: "#00BCD4" }}
      />
      <div className="w-64 mb-4">
        <WaveBar />
      </div>
      <p className="text-sm" style={{ color: "#1B3D5C" }}>
        Charting knowledge seas...
      </p>
    </div>
  );
}

/** Document list inside an expanded cluster card. */
function MemberList({
  members,
}: {
  members: Array<{
    document: {
      _id: Id<"documents">;
      title: string;
      type: string;
      contentPreview: string;
      tags: string[];
      status: string;
      createdAt: number;
    };
    probability: number;
    isPrimary: boolean;
    isAmbiguous: boolean;
  }> | null;
}) {
  // Still loading
  if (!members) {
    return (
      <div
        className="pt-4 border-t"
        style={{ borderColor: "rgba(27, 61, 92, 0.1)" }}
      >
        <div className="w-48 mx-auto">
          <WaveBar />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div
        className="pt-4 border-t text-sm text-muted-foreground"
        style={{ borderColor: "rgba(27, 61, 92, 0.1)" }}
      >
        No documents in this archipelago
      </div>
    );
  }

  return (
    <div
      className="pt-4 border-t space-y-2"
      style={{ borderColor: "rgba(27, 61, 92, 0.1)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Documents in this archipelago
      </p>
      {members.map((member) => (
        <div
          key={member.document._id}
          className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
          style={{ backgroundColor: "rgba(27, 61, 92, 0.03)" }}
        >
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "#1B3D5C" }}
            >
              {member.document.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground uppercase">
                {member.document.type}
              </span>
              {member.isPrimary && (
                <Badge
                  variant="outline"
                  className="text-[10px] leading-none px-1.5 py-0"
                  style={{
                    color: "#00BCD4",
                    borderColor: "rgba(0, 188, 212, 0.4)",
                  }}
                >
                  primary
                </Badge>
              )}
              {member.isAmbiguous && (
                <Badge
                  variant="outline"
                  className="text-[10px] leading-none px-1.5 py-0"
                  style={{
                    color: "#1B3D5C",
                    borderColor: "rgba(27, 61, 92, 0.3)",
                  }}
                >
                  bridge
                </Badge>
              )}
            </div>
          </div>

          {/* Probability bar + percentage */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="h-1.5 w-16 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(27, 61, 92, 0.1)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(member.probability * 100)}%`,
                  backgroundColor: "#00BCD4",
                }}
              />
            </div>
            <span className="text-xs tabular-nums w-8 text-right text-muted-foreground">
              {Math.round(member.probability * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
