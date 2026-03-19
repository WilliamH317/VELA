// app/(marketing)/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sailboat } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b border-[#1B3D5C]/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sailboat className="h-8 w-8 text-[#00BCD4]" />
            <span className="text-xl font-bold text-[#1B3D5C] dark:text-white">
              VELA
            </span>
          </div>
          
          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button 
                variant="ghost" 
                className="text-[#1B3D5C] hover:bg-[#1B3D5C]/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-[#00BCD4] text-[#1B3D5C] hover:bg-[#00ACC1]">
                Set Sail
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <h1
              className="text-5xl font-bold leading-tight text-[#1B3D5C] dark:text-white md:text-6xl"
              style={{ color: "#1B3D5C" }}
            >
              Navigate Your Knowledge
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Stop searching through scattered documents. VELA uses chaos theory
              to turn your client briefs, SOWs, and meeting notes into instant answers.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-[#00BCD4] text-[#1B3D5C] hover:bg-[#00ACC1] text-lg">
                  Begin Your Voyage
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-[#1B3D5C] text-[#1B3D5C] hover:bg-[#1B3D5C] hover:text-white text-lg"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#1B3D5C]/10 bg-gray-50 dark:bg-gray-900 py-24">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-center text-3xl font-bold text-[#1B3D5C] dark:text-white mb-12">
              Built for Teams Who Can&#39;t Afford to Lose Knowledge
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00BCD4]">
                  <Sailboat className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#1B3D5C] dark:text-white">
                  Intelligent Navigation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Client projects self-organize — no folders or tags needed
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00BCD4]">
                  <Sailboat className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#1B3D5C] dark:text-white">
                  Instant Answers
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Ask questions, get cited answers from your client docs
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00BCD4]">
                  <Sailboat className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#1B3D5C] dark:text-white">
                  Time Saved
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Stop wasting billable hours searching across Drive, Slack, and email
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1B3D5C]/10 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 VELA. Navigate Your Knowledge.
        </div>
      </footer>
    </div>
  );
}