import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteVariant } from "@/lib/site-variant";

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isApiRequest = pathname.startsWith("/api/");
  const role = req.auth?.user?.role;
  const userSite = req.auth?.user?.siteType;
  const isCorrectSite =
    role === "teacher"
      ? siteVariant === "math"
      : role === "student"
        ? userSite === siteVariant
        : false;
  const homePath = role === "student" ? "/student" : "/";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLoginPage && isCorrectSite) {
    return NextResponse.redirect(new URL(homePath, req.nextUrl));
  }
  if (isLoggedIn && !isLoginPage && !isCorrectSite && !isApiRequest) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (!isApiRequest && role === "student" && pathname !== "/student") {
    return NextResponse.redirect(new URL("/student", req.nextUrl));
  }
  if (!isApiRequest && role === "teacher" && pathname === "/student") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon-math.svg|favicon-languages.svg|icon.svg).*)",
  ],
};
