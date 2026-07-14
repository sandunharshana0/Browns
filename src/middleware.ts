import { auth } from "@/lib/auth"

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    return Response.redirect(new URL("/login", req.nextUrl.origin))
  }
  if (req.auth && req.nextUrl.pathname === "/login") {
    return Response.redirect(new URL("/admin/fleet", req.nextUrl.origin))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
