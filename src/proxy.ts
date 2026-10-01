import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isApiRequest = pathname.startsWith("/api/");
  const role = req.auth?.user?.role;
  const homePath = role === "student" ? "/student" : "/";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(homePath, req.nextUrl));
  }
  if (!isApiRequest && role === "student" && pathname !== "/student") {
    return NextResponse.redirect(new URL("/student", req.nextUrl));
  }
  if (!isApiRequest && role === "teacher" && pathname === "/student") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
