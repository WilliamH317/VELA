"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackNavProps {
  href: string;
  label: string;
}

export function BackNav({ href, label }: BackNavProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-[#1B3D5C] hover:text-[#00BCD4] transition-colors group mb-4"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}