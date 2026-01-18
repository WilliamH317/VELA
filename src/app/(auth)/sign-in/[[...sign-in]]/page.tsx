// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1B3D5C] to-[#00BCD4] p-4">
      <div className="w-full max-w-md">
        <SignIn 
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
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"        // ✅ Added: Force redirect after sign-in
          fallbackRedirectUrl="/dashboard"     // ✅ Added: Fallback if forceRedirectUrl fails
        />
      </div>
    </div>
  );
}