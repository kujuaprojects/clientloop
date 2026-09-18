import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      if (idx > -1 && decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) {
        return NextResponse.next();
      }
    } catch {}
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ClientLoop"' },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/campaigns/:path*"],
};
