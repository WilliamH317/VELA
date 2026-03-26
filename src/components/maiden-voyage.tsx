"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// ============================================================================
// STEP DATA — exact strings from Captain's copy spec
// ============================================================================

const STEPS = [
  {
    title: "Welcome Aboard, Captain",
    body: "VELA navigates your knowledge so you can stop searching and start discovering. Let us show you how.",
    cta: "Begin Maiden Voyage",
    action: null,
  },
  {
    title: "Upload Your First Document",
    body: "Drag and drop a client brief, meeting notes, or any document through PORT. PDF, Markdown, and text files all welcome.",
    cta: "Go to PORT",
    action: "/documents/new",
  },
  {
    title: "Search with COMPASS",
    body: "COMPASS searches across all your documents in real time. Try searching for a keyword from your document.",
    cta: "Open COMPASS",
    action: "/search",
  },
  {
    title: "Ask LIGHTHOUSE",
    body: "LIGHTHOUSE answers questions about your documents using AI, with citations showing exactly where it found the answer.",
    cta: "Ask a Question",
    action: "/search",
  },
  {
    title: "Your ARCHIPELAGOS Await",
    body: "Upload 3 or more documents and LAMINAR will automatically discover the knowledge islands within them — no folders needed.",
    cta: "Explore ARCHIPELAGOS",
    action: "/archipelagos",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MaidenVoyage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const step = STEPS[currentStep]!;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleComplete = async () => {
    await completeOnboarding();
    // Convex real-time will update isOnboardingComplete → parent unmounts this
  };

  const handleCTA = async () => {
    if (isLastStep) {
      // Final step: navigate + complete
      if (step.action) {
        router.push(step.action);
      }
      await handleComplete();
    } else {
      // Navigate if action exists, then advance
      if (step.action) {
        router.push(step.action);
      }
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-8">
        {/* Close button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Skip onboarding"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i <= currentStep
                  ? "bg-[#1B3D5C]"
                  : "border-2 border-[#00BCD4] bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Step number */}
        <div className="text-[#00BCD4] text-4xl font-bold">
          0{currentStep + 1}
        </div>

        {/* Title */}
        <h2 className="text-[#1B3D5C] text-xl font-bold mt-2">
          {step.title}
        </h2>

        {/* Body */}
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">
          {step.body}
        </p>

        {/* CTA button */}
        <button
          onClick={handleCTA}
          className="w-full bg-[#1B3D5C] hover:bg-[#1B3D5C]/90 text-white rounded-lg py-3 mt-6 text-sm font-medium transition-colors"
        >
          {step.cta}
        </button>

        {/* Skip link — visible on steps 1–3 only */}
        {currentStep >= 1 && currentStep <= 3 && (
          <button
            onClick={handleComplete}
            className="block w-full text-right text-gray-400 text-sm mt-3 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
