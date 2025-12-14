// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Token sudah valid melalui withAuth
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Proteksi routes
export const config = {
  matcher: [
    "/",
    "/suppliers/:path*",
    "/categories/:path*",
    "/products/:path*",
    "/customers/:path*",
    "/sales/:path*",
    "/payments/:path*",
    "/kegiatan/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};