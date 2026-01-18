// app/(dashboard)/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

/**
 * Protected Dashboard Page (Server Component)
 * 
 * This page is protected by:
 * 1. Middleware (redirects unauthenticated users)
 * 2. Server-side auth check (defense in depth)
 */

export default async function DashboardPage() {
  // Double-check authentication (defense in depth)
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Header with user profile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3D5C] dark:text-white">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome to VELA - your knowledge navigation system
          </p>
        </div>
        
        {/* Clerk user button (profile menu) */}
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-12 h-12",
            },
          }}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#1B3D5C]/20 hover:border-[#00BCD4] transition-colors">
          <CardHeader>
            <CardTitle className="text-[#1B3D5C] dark:text-white">
              Upload Documents
            </CardTitle>
            <CardDescription>
              Add PDFs, text files, or markdown to your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#00BCD4] hover:bg-[#00ACC1]">
              Upload
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#1B3D5C]/20 hover:border-[#00BCD4] transition-colors">
          <CardHeader>
            <CardTitle className="text-[#1B3D5C] dark:text-white">
              Search Knowledge
            </CardTitle>
            <CardDescription>
              Find answers instantly across all your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-[#1B3D5C] text-[#1B3D5C] hover:bg-[#1B3D5C] hover:text-white"
            >
              Search
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#1B3D5C]/20 hover:border-[#00BCD4] transition-colors">
          <CardHeader>
            <CardTitle className="text-[#1B3D5C] dark:text-white">
              Ask AI
            </CardTitle>
            <CardDescription>
              Get answers powered by chaos theory intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white"
            >
              Ask
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats (placeholder for now) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl text-[#1B3D5C] dark:text-white">
              0
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Queries</CardDescription>
            <CardTitle className="text-3xl text-[#00BCD4]">
              0
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Patterns Found</CardDescription>
            <CardTitle className="text-3xl text-[#1B3D5C] dark:text-white">
              0
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Time Saved</CardDescription>
            <CardTitle className="text-3xl text-[#00BCD4]">
              0h
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}