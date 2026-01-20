// components/user-setup.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect } from "react";

export function UserSetup() {
  const { user, isLoaded } = useUser();
  const convex = useConvex();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const createUser = async () => {
      try {
        await convex.mutation(api.users.create, {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: user.fullName || "",
          imageUrl: user.imageUrl,
        });
      } catch (error) {
        console.log("User might already exist");
      }
    };

    createUser();
  }, [user, isLoaded, convex]);

  return null;
}