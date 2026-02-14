// src/lib/use-session-id.ts
"use client";

import { useRef } from "react";

export function useSessionId(): string {
  const sessionRef = useRef<string>(
    `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
  return sessionRef.current;
}