// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/documents(.*)',
  '/search(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Only run middleware on routes that actually need auth — skip marketing homepage entirely
  matcher: [
    '/dashboard/:path*',
    '/documents/:path*',
    '/search/:path*',
    '/settings/:path*',
    '/sign-in/:path*',
    '/sign-up/:path*',
    '/archipelagos/:path*',
    '/connections/:path*',
    '/lighthouse/:path*',
    '/upload/:path*',
    '/test-center/:path*',
    '/cascade/:path*',
    '/wisdom/:path*',
    '/(api|trpc)(.*)',
  ],
};
