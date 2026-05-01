import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;

  // Fail-closed: kein Secret → 503
  if (!secret) {
    return new NextResponse("Admin nicht konfiguriert. ADMIN_SECRET setzen.", { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "basic" || !encoded) {
    return basicAuthChallenge();
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const colonIndex = decoded.indexOf(":");
  const username = decoded.slice(0, colonIndex);
  const password = decoded.slice(colonIndex + 1);

  if (username !== "admin" || password !== secret) {
    return basicAuthChallenge();
  }

  return NextResponse.next();
}

function basicAuthChallenge(): NextResponse {
  return new NextResponse("Anmeldung erforderlich.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="WSP Admin"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
