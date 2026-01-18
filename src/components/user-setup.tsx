// components/user-setup.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export function UserSetup() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (currentUser === undefined) return;
    if (currentUser !== null) return;

    const setupUser = async () => {
      try {
        await createUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name: user.fullName ?? user.firstName ?? "Anonymous",
          imageUrl: user.imageUrl,
        });
      } catch (error) {
        console.error("Failed to create user:", error);
      }
    };

    setupUser();
  }, [isLoaded, user, currentUser, createUser]);

  return null;
}