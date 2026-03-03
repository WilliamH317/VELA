"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";
import Link from "next/link";

// ============================================================================
// RELATED CARGO — compact sidebar for document detail pages
// ============================================================================

interface RelatedCargoProps {
  documentId: Id<"documents">;
}

export function RelatedCargo({ documentId }: RelatedCargoProps) {
  const { isAuthenticated } = useConvexAuth();

  const connections = useQuery(
    api.laminar.queries.getDocumentConnections,
    isAuthenticated ? { documentId } : "skip",
  );

  // Loading state — wave animation
  if (connections === undefined) {
    return (
      <Card className="border-[#1B3D5C]/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#1B3D5C] flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#00BCD4]" />
            Related Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <div className="h-1 w-32 bg-[#1B3D5C]/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-[#00BCD4] mt-2">
              Navigating connections...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Null = auth failure or doc not found
  if (connections === null) return null;

  // Empty state
  if (connections.length === 0) {
    return (
      <Card className="border-[#1B3D5C]/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#1B3D5C] flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#00BCD4]" />
            Related Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#1B3D5C]/40 text-center py-4">
            This cargo hasn&apos;t been charted yet — visit{" "}
            <Link
              href="/connections"
              className="text-[#00BCD4] hover:underline"
            >
              Connections
            </Link>{" "}
            to discover relationships
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#1B3D5C]/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#1B3D5C] flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#00BCD4]" />
          Related Cargo
          <Badge
            variant="outline"
            className="text-[10px] border-[#1B3D5C]/10 text-[#1B3D5C]/40 ml-auto"
          >
            {connections.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.slice(0, 5).map((conn) => (
          <div key={String(conn.documentId)} className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/documents/${String(conn.documentId)}`}
                className="text-xs font-medium text-[#1B3D5C] hover:text-[#00BCD4] transition-colors line-clamp-1 flex-1"
              >
                {conn.title}
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {conn.isBridge && (
                  <span className="text-[10px]" title="Bridge document">
                    🌉
                  </span>
                )}
                {/* Signal icons — compact */}
                {conn.signals.contentSimilarity > 0 && (
                  <span className="text-[10px] opacity-60" title="Content">
                    📐
                  </span>
                )}
                {conn.signals.structuralLink > 0 && (
                  <span className="text-[10px] opacity-60" title="Cluster">
                    🏝️
                  </span>
                )}
                {conn.signals.coAccessStrength > 0 && (
                  <span className="text-[10px] opacity-60" title="Co-access">
                    🌊
                  </span>
                )}
                {conn.signals.temporalProximity > 0 && (
                  <span className="text-[10px] opacity-60" title="Temporal">
                    ⏱️
                  </span>
                )}
              </div>
            </div>
            {/* Weight bar */}
            <div className="h-1 w-full bg-[#1B3D5C]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] rounded-full transition-all"
                style={{ width: `${Math.max(conn.weight * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
