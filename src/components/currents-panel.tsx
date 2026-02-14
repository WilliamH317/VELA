"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Timer,
  FileText,
  Waves,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// CURRENTS PANEL — Document-level temporal intelligence
// ============================================================================

interface CurrentsPanelProps {
  documentId: Id<"documents">;
}

export function CurrentsPanel({ documentId }: CurrentsPanelProps) {
  const trajectory = useQuery(
    api.laminar.queries.getDocumentTrajectory,
    { documentId },
  );
  const related = useQuery(
    api.laminar.queries.getRelatedDocuments,
    { documentId },
  );

  // Not yet analyzed — no temporal data exists
  if (trajectory === null && related === null) {
    return null; // Hide panel entirely until CURRENTS has been run
  }

  // Loading state
  if (trajectory === undefined || related === undefined) {
    return (
      <Card
        className="border"
        style={{ borderColor: "rgba(27, 61, 92, 0.15)" }}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "#1B3D5C" }}
          >
            <Waves className="h-4 w-4" style={{ color: "#00BCD4" }} />
            CURRENTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div
              className="h-2 w-3/4 rounded"
              style={{ backgroundColor: "rgba(27, 61, 92, 0.08)" }}
            />
            <div
              className="h-2 w-1/2 rounded"
              style={{ backgroundColor: "rgba(27, 61, 92, 0.06)" }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border"
      style={{ borderColor: "rgba(27, 61, 92, 0.15)" }}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: "#1B3D5C" }}
        >
          <Waves className="h-4 w-4" style={{ color: "#00BCD4" }} />
          CURRENTS
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Trajectory Section ─────────────────────────────────── */}
        {trajectory && (
          <div className="space-y-3">
            {/* Trend badge + access rate */}
            <div className="flex items-center justify-between">
              <TrendBadge trend={trajectory.trend} />
              <span className="text-xs text-muted-foreground">
                {trajectory.totalAccesses} total access
                {trajectory.totalAccesses !== 1 ? "es" : ""}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <StatBlock
                label="Access rate"
                value={`${trajectory.accessRate.toFixed(2)}/day`}
              />
              <StatBlock
                label="Predicted relevance"
                value={`${Math.round(trajectory.predictedRelevance * 100)}%`}
              />
            </div>

            {/* Periodicity */}
            {trajectory.periodicity !== undefined &&
              trajectory.periodicity !== null && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-md"
                  style={{ backgroundColor: "rgba(0, 188, 212, 0.06)" }}
                >
                  <Timer className="h-3 w-3" style={{ color: "#00BCD4" }} />
                  <span style={{ color: "#1B3D5C" }}>
                    ~{Math.round(trajectory.periodicity)}-day rhythm detected
                  </span>
                </div>
              )}

            {/* Relevance bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Predicted relevance (7-day)</span>
                <span>
                  {Math.round(trajectory.predictedRelevance * 100)}%
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(27, 61, 92, 0.1)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(trajectory.predictedRelevance * 100)}%`,
                    background:
                      "linear-gradient(to right, #1B3D5C, #00BCD4)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Related Documents Section ──────────────────────────── */}
        {related && related.length > 0 && (
          <div className="space-y-2">
            <p
              className="text-xs font-medium"
              style={{ color: "#1B3D5C" }}
            >
              Navigated together
            </p>
            <div className="space-y-1.5">
              {related.slice(0, 5).map((doc) => (
                <Link
                  key={doc.documentId}
                  href={`/documents/${doc.documentId}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors hover:bg-[rgba(0,188,212,0.06)] group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "#00BCD4" }}
                      />
                      <span
                        className="text-sm truncate group-hover:underline"
                        style={{ color: "#1B3D5C" }}
                      >
                        {doc.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.trend && (
                        <TrendIcon trend={doc.trend} />
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(doc.strength * 100)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────── */}
        {!trajectory && (!related || related.length === 0) && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Run CURRENTS analysis to see temporal patterns
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TrendBadge({
  trend,
}: {
  trend: "rising" | "stable" | "declining" | "periodic";
}) {
  const config = {
    rising: {
      icon: TrendingUp,
      label: "Rising",
      bg: "rgba(0, 188, 212, 0.1)",
      color: "#00897B",
      border: "rgba(0, 137, 123, 0.3)",
    },
    stable: {
      icon: Minus,
      label: "Stable",
      bg: "rgba(27, 61, 92, 0.06)",
      color: "#1B3D5C",
      border: "rgba(27, 61, 92, 0.2)",
    },
    declining: {
      icon: TrendingDown,
      label: "Declining",
      bg: "rgba(244, 67, 54, 0.06)",
      color: "#C62828",
      border: "rgba(198, 40, 40, 0.2)",
    },
    periodic: {
      icon: Timer,
      label: "Periodic",
      bg: "rgba(0, 188, 212, 0.08)",
      color: "#00BCD4",
      border: "rgba(0, 188, 212, 0.3)",
    },
  };

  const { icon: Icon, label, bg, color, border } = config[trend];

  return (
    <Badge
      variant="outline"
      className="text-xs font-medium gap-1"
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function TrendIcon({
  trend,
}: {
  trend: "rising" | "stable" | "declining" | "periodic";
}) {
  switch (trend) {
    case "rising":
      return (
        <TrendingUp className="h-3 w-3" style={{ color: "#00897B" }} />
      );
    case "declining":
      return (
        <TrendingDown className="h-3 w-3" style={{ color: "#C62828" }} />
      );
    case "periodic":
      return (
        <Timer className="h-3 w-3" style={{ color: "#00BCD4" }} />
      );
    default:
      return null;
  }
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ backgroundColor: "rgba(27, 61, 92, 0.03)" }}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className="text-sm font-semibold mt-0.5"
        style={{ color: "#1B3D5C" }}
      >
        {value}
      </p>
    </div>
  );
}