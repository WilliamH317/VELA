"use client";

interface LoadingWaveProps {
  message?: string;
  width?: string;
}

export default function LoadingWave({
  message = "Navigating your knowledge sea...",
  width = "w-64",
}: LoadingWaveProps) {
  return (
    <div className="flex flex-col items-center py-8">
      <div
        className={`h-1 ${width} bg-[#1B3D5C]/20 rounded-full overflow-hidden`}
      >
        <div className="h-full bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] animate-pulse" />
      </div>
      <p className="text-sm text-[#00BCD4] mt-4">{message}</p>
    </div>
  );
}
