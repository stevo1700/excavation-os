import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything under /dashboard requires an authenticated session. Unauthenticated
// visitors are redirected to /sign-in (configured on ClerkProvider).
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Public routes that must never require auth — notably the client portal, which
// is shared with external clients via a random token.
const isPublicRoute = createRouteMatcher(["/portal(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
