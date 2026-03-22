"use client";

import { useRouter } from "next/navigation";

interface LaminarPreviewProps {
  clusterCount: number;
  channelCount: number;
  previewLabels: string[];
  documentCount: number;
  documentLimit: number;
  onUpgrade?: () => void;
}

/**
 * Frosted-glass LAMINAR preview for free-tier users.
 *
 * Shows REAL computed cluster names with cosmetic blur —
 * NOT placeholder text. The blur proves intelligence is working;
 * it just requires a key to see clearly.
 */
export default function LaminarPreview({
  clusterCount,
  channelCount,
  previewLabels,
  documentCount,
  documentLimit,
  onUpgrade,
}: LaminarPreviewProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("/upgrade");
    }
  };

  return (
    <div className="relative rounded-xl border border-[#1B3D5C]/10 overflow-hidden bg-white min-h-[280px]">
      {/* Header stripe — same as LaminarSummaryWidget */}
      <div className="bg-[#1B3D5C] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">
            LAMINAR Intelligence
          </h3>
          <p className="text-white/70 text-xs mt-0.5">
            Your knowledge is self-organizing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#00BCD4]/20 text-[#00BCD4] text-xs font-medium px-2.5 py-1 rounded-full">
            {clusterCount} archipelago{clusterCount !== 1 ? "s" : ""}
          </span>
          <span className="bg-[#00BCD4]/20 text-[#00BCD4] text-xs font-medium px-2.5 py-1 rounded-full">
            {channelCount} connection{channelCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Blurred preview content */}
      <div className="p-6 space-y-4">
        {/* Real cluster labels — blurred */}
        {previewLabels.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Discovered knowledge islands:
            </p>
            <div className="flex flex-wrap gap-2">
              {previewLabels.map((label, i) => (
                <span
                  key={i}
                  className="inline-block bg-[#00BCD4]/10 text-[#00BCD4] px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ filter: "blur(4px)" }}
                >
                  {label}
                </span>
              ))}
              {clusterCount > previewLabels.length && (
                <span className="inline-block bg-[#1B3D5C]/5 text-[#1B3D5C]/40 px-3 py-1.5 rounded-full text-sm">
                  +{clusterCount - previewLabels.length} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Frosted-glass upgrade overlay */}
        <div className="relative rounded-lg border border-[#00BCD4]/20 bg-gradient-to-b from-white to-[#1B3D5C]/[0.03] p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-8 w-8 text-[#00BCD4]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h4 className="text-base font-semibold text-[#1B3D5C] mb-2">
            Your knowledge is self-organizing
          </h4>
          <p className="text-sm text-[#1B3D5C]/60 max-w-md mx-auto mb-5">
            Upgrade to navigate your ARCHIPELAGOS, explore CHARTS, and
            predict CASCADE impacts.
          </p>
          <button
            onClick={handleUpgrade}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white rounded-xl px-6 py-3 text-sm font-medium hover:shadow-lg hover:shadow-[#00BCD4]/20 transition-all"
          >
            Unlock LAMINAR Intelligence
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>

        {/* Document count footer */}
        <p className="text-xs text-center text-[#1B3D5C]/40">
          {documentCount} / {documentLimit} documents on free tier
          {documentCount >= documentLimit - 2 && documentCount < documentLimit && (
            <span className="text-[#F4B860]">
              {" "}
              — Your cargo hold is nearly full
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
