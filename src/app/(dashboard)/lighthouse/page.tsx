import { LighthouseSearch } from "@/components/lighthouse-search";

export const metadata = {
  title: "LIGHTHOUSE - AI Q&A | VELA",
  description: "Ask questions and get instant answers from your knowledge base",
};

export default function LighthousePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <LighthouseSearch />
    </div>
  );
}