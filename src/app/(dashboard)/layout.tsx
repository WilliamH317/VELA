import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Home, FileText, Upload, Search, Lightbulb, MapPin, GitBranch } from "lucide-react";
import { Providers } from "@/components/providers";
import { UserSetup } from "@/components/user-setup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <UserSetup />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* ========================================
          NAVIGATION BAR
          ======================================== */}
      <nav className="border-b border-[#1B3D5C]/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo + Navigation Links */}
            <div className="flex items-center gap-8">
              {/* VELA Logo */}
              <Link
                href="/dashboard"
                className="text-xl font-bold text-[#1B3D5C] hover:text-[#00BCD4] transition-colors"
              >
                VELA
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span>HELM</span>
                </Link>

                <Link
                  href="/documents"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>DOCUMENTS</span>
                </Link>

                <Link
                  href="/upload"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>PORT</span>
                </Link>

                <Link
                  href="/search"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>COMPASS</span>
                </Link>

                <Link
                  href="/lighthouse"
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white hover:shadow-md hover:shadow-[#00BCD4]/20 transition-all flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>LIGHTHOUSE</span>
                </Link>

                <Link
                  href="/archipelagos"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>ARCHIPELAGOS</span>
                </Link>

                <Link
                  href="/connections"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>CHARTS</span>
                </Link>
              </div>
            </div>

            {/* Right Side: User Button */}
            <div className="flex items-center gap-4">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-2 flex justify-around">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">HELM</span>
            </Link>
            <Link href="/documents" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium">DOCS</span>
            </Link>
            <Link href="/upload" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-[10px] font-medium">PORT</span>
            </Link>
            <Link href="/search" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-medium">COMPASS</span>
            </Link>
            <Link href="/lighthouse" className="flex flex-col items-center gap-1 px-2 py-1 text-[#00BCD4] transition-colors">
              <Lightbulb className="h-5 w-5" />
              <span className="text-[10px] font-medium">LIGHT</span>
            </Link>
            <Link href="/archipelagos" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <MapPin className="h-5 w-5" />
              <span className="text-[10px] font-medium">ISLANDS</span>
            </Link>
            <Link href="/connections" className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-[#1B3D5C] transition-colors">
              <GitBranch className="h-5 w-5" />
              <span className="text-[10px] font-medium">CHARTS</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================================
          MAIN CONTENT AREA
          ======================================== */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="border-t border-[#1B3D5C]/10 bg-white/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
            </div>
            <div className="flex items-center gap-4">
              <span>© 2026 VELA</span>
              <span>•</span>
              <span className="text-[#00BCD4]">Smooth sailing for your knowledge</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </Providers>
  );
}