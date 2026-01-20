// app/(dashboard)/layout.tsx
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Compass } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-[#1B3D5C]/20 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-[#1B3D5C] hover:text-[#00BCD4] transition-colors"
            >
              <Compass className="h-6 w-6" />
              <span className="text-xl font-bold">VELA</span>
            </Link>
            
            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/documents"
                className="text-sm font-medium text-[#1B3D5C] hover:text-[#00BCD4] transition-colors"
              >
                Documents
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium text-[#1B3D5C] hover:text-[#00BCD4] transition-colors"
              >
                Search
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}