// HELM Design Decisions — Will's answers before Prompt C
//
// Q1: Highest-value first-load insight:
// Cluster count + top cluster name + stability badge (LaminarSummaryWidget)
//
// Q2: Trust indicator format:
// "Grouped by keyword overlap: X, Y, Z" as inline chips
//
// Q3: Empty state when < 3 docs:
// Show widget with still-waters prompt + PORT CTA

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import LoadingWave from "@/components/loading-wave";
import LaminarSummaryWidget from "@/components/laminar-summary-widget";
import Link from "next/link";

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function DashboardPage() {
  const documents = useQuery(api.documents.list);
  const clusteringStatus = useQuery(api.laminar.queries.getClusteringStatus);
  const graphSummary = useQuery(api.laminar.queries.getGraphSummary);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Zone A — Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1B3D5C] dark:text-white">
          HELM
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your knowledge command center
        </p>
      </div>

      {/* Zone B — 4-Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* CARGO HOLD */}
        <div
          className="bg-slate-50 rounded-xl p-6"
          style={{ backgroundColor: "rgb(248 250 252)", borderRadius: "12px", padding: "24px" }}
        >
          {documents === undefined ? (
            <>
              <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mt-2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-[#1B3D5C]">
                {documents.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                Cargo Hold
              </div>
            </>
          )}
        </div>

        {/* ARCHIPELAGOS */}
        <div
          className="bg-slate-50 rounded-xl p-6"
          style={{ backgroundColor: "rgb(248 250 252)", borderRadius: "12px", padding: "24px" }}
        >
          {clusteringStatus === undefined ? (
            <>
              <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mt-2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-[#1B3D5C]">
                {clusteringStatus?.clusterCount ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                Archipelagos
              </div>
            </>
          )}
        </div>

        {/* LAST CHART */}
        <div
          className="bg-slate-50 rounded-xl p-6"
          style={{ backgroundColor: "rgb(248 250 252)", borderRadius: "12px", padding: "24px" }}
        >
          {clusteringStatus === undefined ? (
            <>
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mt-2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-[#1B3D5C]">
                {clusteringStatus?.startedAt
                  ? formatTimeAgo(clusteringStatus.startedAt)
                  : "—"}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                Last Chart
              </div>
            </>
          )}
        </div>

        {/* CONNECTIONS */}
        <div
          className="bg-slate-50 rounded-xl p-6"
          style={{ backgroundColor: "rgb(248 250 252)", borderRadius: "12px", padding: "24px" }}
        >
          {graphSummary === undefined ? (
            <>
              <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mt-2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-[#1B3D5C]">
                {graphSummary?.edgeCount ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                Connections
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone C — LAMINAR Widget */}
      <LaminarSummaryWidget />

      {/* Zone D — Recent CARGO */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1B3D5C]">
            Recent CARGO
          </h2>
          <Link
            href="/documents"
            className="text-sm text-[#00BCD4] hover:underline"
          >
            View all →
          </Link>
        </div>
        {documents === undefined ? (
          <LoadingWave message="Navigating your knowledge sea..." />
        ) : documents.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">
              Still waters — ready for your first voyage
            </p>
            <Link
              href="/documents/new"
              className="inline-block mt-4 bg-[#00BCD4] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#00ACC1] transition-colors"
            >
              Upload via PORT
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map((doc) => (
              <Link
                key={doc._id}
                href={`/documents/${doc._id}`}
                className="block bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1B3D5C] truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {(() => {
                        const preview = (doc.contentPlain ?? "")
                          .replace(/#{1,6}\s/g, "")
                          .replace(/[|\\[\]`*_~]/g, "")
                          .replace(/-{2,}/g, " ")
                          .replace(/\s+/g, " ")
                          .trim()
                          .slice(0, 80);
                        return preview.length > 0
                          ? (doc.contentPlain ?? "").trim().length > 80
                            ? preview + "..."
                            : preview
                          : "";
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-[10px] bg-[#1B3D5C]/5 text-[#1B3D5C] px-2 py-0.5 rounded">
                      {doc.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTimeAgo(doc.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Zone E — Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 pb-8">
        <Link
          href="/documents/new"
          className="bg-[#1B3D5C] text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#00BCD4] transition-colors duration-150 text-center"
        >
          Upload via PORT
        </Link>
        <Link
          href="/search"
          className="bg-[#1B3D5C] text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#00BCD4] transition-colors duration-150 text-center"
        >
          Search COMPASS
        </Link>
        <Link
          href="/lighthouse"
          className="bg-[#1B3D5C] text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#00BCD4] transition-colors duration-150 text-center"
        >
          Ask LIGHTHOUSE
        </Link>
      </div>
    </div>
  );
}
