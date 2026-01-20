// app/layout.tsx
import "./globals.css";
import { Providers } from "@/components/providers";
import { UserSetup } from "@/components/user-setup";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <UserSetup />
          {children}
        </Providers>
      </body>
    </html>
  );
}