import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Home, FileText, Upload, Search, Lightbulb } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
              
              {/* Navigation Links */}
              <div className="hidden md:flex gap-1">
                {/* Dashboard/HELM */}
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span>HELM</span>
                </Link>

                {/* Documents */}
                <Link
                  href="/documents"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </Link>

                {/* Upload/PORT */}
                <Link
                  href="/upload"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>PORT</span>
                </Link>

                {/* Search/COMPASS */}
                <Link
                  href="/search"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>COMPASS</span>
                </Link>

                {/* 🆕 LIGHTHOUSE - Featured with Gradient */}
                <Link
                  href="/lighthouse"
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white hover:shadow-md hover:shadow-[#00BCD4]/20 transition-all flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>LIGHTHOUSE</span>
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

          {/* Mobile Navigation (appears on smaller screens) */}
          <div className="md:hidden pb-3 flex gap-1 overflow-x-auto">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Home className="h-3 w-3" />
              <span>HELM</span>
            </Link>

            <Link
              href="/documents"
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="h-3 w-3" />
              <span>Documents</span>
            </Link>

            <Link
              href="/upload"
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Upload className="h-3 w-3" />
              <span>PORT</span>
            </Link>

            <Link
              href="/search"
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-[#1B3D5C] hover:bg-[#1B3D5C]/5 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="h-3 w-3" />
              <span>COMPASS</span>
            </Link>

            <Link
              href="/lighthouse"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lightbulb className="h-3 w-3" />
              <span>LIGHTHOUSE</span>
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
          FOOTER (Optional)
          ======================================== */}
      <footer className="border-t border-[#1B3D5C]/10 bg-white/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1B3D5C]">VELA</span>
              <span>•</span>
              <span>Navigate Your Knowledge</span>
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
  );
}