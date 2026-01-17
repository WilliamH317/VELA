import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Zap, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Sailboat icon placeholder - replace with actual logo */}
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <span className="font-bold text-xl">ELA</span>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-block rounded-full border bg-muted px-4 py-1.5 text-sm">
            ChatGPT for company knowledge
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Navigate Your{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Knowledge
            </span>
          </h1>
          
          <p className="mb-10 text-xl text-muted-foreground sm:text-2xl">
            Stop searching. Start creating. Find answers instantly from scattered documents
            and conversations—no folders needed.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-lg h-12 px-8 bg-primary hover:bg-primary/90">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-12 px-8">
              Watch Demo
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Free forever. No credit card required. 2 minutes to set up.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24 border-t">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Built for teams who think, not file
            </h2>
            <p className="text-xl text-muted-foreground">
              Chaos theory powers intelligent organization—patterns emerge naturally
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1: AI Search */}
            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">AI-Powered Search</CardTitle>
                <CardDescription className="text-base">
                  Ask questions in plain English. Get instant answers from all your documents
                  and conversations.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2: Pattern Detection */}
            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Chaos Theory Patterns</CardTitle>
                <CardDescription className="text-base">
                  Auto-detect workflows, relationships, and hidden connections across
                  scattered knowledge.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3: Instant Answers */}
            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">3-Second Answers</CardTitle>
                <CardDescription className="text-base">
                  Find what you need before you finish typing. Save hours per week on
                  information retrieval.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 border-t">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to reclaim your time?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join teams who've eliminated hours of daily searching
          </p>
          <Button size="lg" className="text-lg h-12 px-8 bg-primary hover:bg-primary/90">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 VELA. Navigate Your Knowledge.</p>
        </div>
      </footer>
    </div>
  );
}