import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAuthPage = req.nextUrl.pathname === '/login';
    const isAuth = !!req.nextauth.token;

    // ถ้าล็อกอินแล้วและพยายามเข้าหน้า login
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // อนุญาตให้เข้าถึงหน้า login ได้เสมอ
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        // หน้าอื่นๆ ต้องมี token
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/login',
    '/devices'
  ]
};