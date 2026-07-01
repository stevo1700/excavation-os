import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Everything under /dashboard requires an authenticated session. Unauthenticated
// visitors are redirected to /sign-in (configured on ClerkProvider).
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Public routes that must never require auth — notably the client portal, which
// is shared with external clients via a random token.
const isPublicRoute = createRouteMatcher(["/portal(.*)"]);

// API resources that expose write endpoints. Their GET handlers stay public;
// mutating methods (below) require an authenticated session. /api/schedule and
// /api/kpis are read-only and intentionally absent, so they stay fully public.
const isWritableApiResource = createRouteMatcher([
  "/api/jobs(.*)",
  "/api/equipment(.*)",
  "/api/crew(.*)",
  "/api/catalog(.*)",
  "/api/integrations(.*)",
]);

// Read-only HTTP methods that never require auth.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  // Gate writes (POST/PATCH/PUT/DELETE) to the API resources on auth, returning
  // a JSON 401 rather than redirecting to a sign-in page (these are API calls).
  if (isWritableApiResource(req) && !SAFE_METHODS.has(req.method)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
