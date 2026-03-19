"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import LoadingWave from "@/components/loading-wave";
import Link from "next/link";

export default function LaminarSummaryWidget() {
  const clusteringStatus = useQuery(api.laminar.queries.getClusteringStatus);
  const clusterData = useQuery(api.laminar.queries.listClusters);

  // Loading state
  if (clusteringStatus === undefined || clusterData === undefined) {
    return <LoadingWave message="Charting your ARCHIPELAGOS..." />;
  }

  // Empty / not completed state
  if (
    !clusteringStatus ||
    clusteringStatus.status !== "completed" ||
    !clusterData ||
    clusterData.clusters.length === 0
  ) {
    return (
      <div className="rounded-xl border border-[#1B3D5C]/10 bg-white p-6">
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            Still waters — upload documents through PORT to discover
            ARCHIPELAGOS
          </p>
          <Link
            href="/documents/new"
            className="inline-block mt-4 bg-[#00BCD4] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#00ACC1] transition-colors"
          >
            Upload via PORT
          </Link>
        </div>
      </div>
    );
  }

  // Stability badge
  const daysSince = Math.floor(
    (Date.now() - clusteringStatus.startedAt) / 86400000
  );
  const stabilityBadge =
    daysSince === 0
      ? {
          bg: "bg-[#00BCD4]/12",
          text: "text-[#00BCD4]",
          label: "Updated today",
        }
      : daysSince <= 6
        ? {
            bg: "bg-slate-100",
            text: "text-slate-500",
            label: `Stable for ${daysSince} day${daysSince === 1 ? "" : "s"}`,
          }
        : {
            bg: "bg-amber-50",
            text: "text-amber-700",
            label: "Chart aging",
          };

  const topClusters = clusterData.clusters
    .sort((a, b) => b.documentCount - a.documentCount)
    .slice(0, 3);

  // Collect top keywords from top cluster for trust indicator
  const trustKeywords =
    topClusters[0]?.topKeywords.slice(0, 3) ?? [];

  return (
    <div className="rounded-xl border border-[#1B3D5C]/10 overflow-hidden bg-white">
      {/* Header stripe */}
      <div className="bg-[#1B3D5C] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">ARCHIPELAGOS</h3>
          <p className="text-white/70 text-xs mt-0.5">
            {clusterData.clusters.length} knowledge island
            {clusterData.clusters.length === 1 ? "" : "s"} discovered
          </p>
        </div>
        <span
          className={`${stabilityBadge.bg} ${stabilityBadge.text} text-xs font-medium px-2.5 py-1 rounded-full`}
        >
          {stabilityBadge.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Trust indicator */}
        {trustKeywords.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Grouped by keyword overlap:
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {trustKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-block bg-[#00BCD4]/10 text-[#00BCD4] px-2 py-0.5 rounded-full text-xs mr-1"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mini cluster grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {topClusters.map((cluster) => (
            <div
              key={cluster._id}
              className="bg-slate-50 rounded-lg p-3 space-y-1"
            >
              <p className="text-sm font-medium text-[#1B3D5C] truncate">
                {cluster.name}
              </p>
              <p className="text-xs text-slate-500">
                {cluster.documentCount} doc
                {cluster.documentCount === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>

        {/* Link to full view */}
        <Link
          href="/archipelagos"
          className="block text-center text-xs text-[#00BCD4] hover:underline"
        >
          Explore all ARCHIPELAGOS →
        </Link>
      </div>
    </div>
  );
}
