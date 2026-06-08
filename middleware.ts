import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_SHOP_DOMAIN ?? "ddotsshop.com";

function hasSession(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("authjs.session-token") ??
      req.cookies.get("__Secure-authjs.session-token"),
  );
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  const host = (req.headers.get("host") ?? "").replace(/:\d+$/, "");

  // Auth gate for dashboard + admin panel (cookie presence only — full role check in
  // server components / admin layout).
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin-panel")) &&
    !hasSession(req)
  ) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  // Subdomain routing (production hosts only; localhost uses direct paths).
  const baseHost = ROOT_DOMAIN.replace(/:\d+$/, "");
  const isLocal = host === "localhost" || host.endsWith(".localhost") || host === baseHost;
  if (!isLocal && host.endsWith(baseHost)) {
    const sub = host.slice(0, -(baseHost.length + 1)); // strip ".ddotsshop.com"
    if (sub && sub !== "www") {
      if (sub === "app") {
        if (pathname === "/") {
          return NextResponse.rewrite(new URL("/dashboard", req.url));
        }
      } else {
        // shop storefront subdomain
        if (!pathname.startsWith("/shop/") && !pathname.startsWith("/api")) {
          return NextResponse.rewrite(new URL(`/shop/${sub}${pathname}`, req.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
