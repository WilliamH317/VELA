// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1B3D5C] to-[#00BCD4] p-4">
      <div className="w-full max-w-md">
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-[#00BCD4] hover:bg-[#00ACC1] text-white font-semibold",
              card: "shadow-2xl",
              headerTitle: "text-[#1B3D5C]",
              headerSubtitle: "text-gray-600",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"        // ✅ Added: Force redirect after sign-up
          fallbackRedirectUrl="/dashboard"     // ✅ Added: Fallback if forceRedirectUrl fails
        />
      </div>
    </div>
  );
}