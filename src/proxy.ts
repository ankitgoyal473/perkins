// NOTE: Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`
// (functionality is identical — only the file/export name changed). See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// and .../upgrading/version-16.md ("middleware to proxy"). The task brief's
// `middleware.ts` is implemented here as `src/proxy.ts` to match the
// installed Next.js version instead of using the deprecated convention.
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/employees", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
