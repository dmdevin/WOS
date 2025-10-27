// This middleware protects routes that require authentication.

import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.startsWith('/register');

    if (isAuthPage) {
      if (isAuth) {
        // Redirect authenticated users from login/register to their workshops
        return NextResponse.redirect(new URL('/workshops', req.url));
      }
      return null;
    }

    if (!isAuth) {
      // Redirect unauthenticated users trying to access protected routes
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for a bug in next-auth.
        // It forces the middleware to run on every page.
        return true;
      },
    },
  }
);

export const config = {
  // Match all routes except for API, static files, and image optimization folders.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};