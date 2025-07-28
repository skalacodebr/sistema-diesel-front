import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path matches the pattern /{slug}/dashboard
  if (path.match(/\/[^/]+\/dashboard/)) {
    // Get the token from the cookies
    const token = request.cookies.get("sistema_diesel_token")?.value

    // If there's no token, redirect to the login page
    if (!token) {
      console.log("No token found in middleware, redirecting to login")
      const slug = path.split("/")[1]
      return NextResponse.redirect(new URL(`/${slug}/login`, request.url))
    }

    console.log("Token found in middleware, allowing access to dashboard")
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
