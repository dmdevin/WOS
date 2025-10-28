// src/middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // This function is now only called if the user is authenticated.
  // Its only job is to redirect already-logged-in users away from auth pages.
  function middleware(req) {
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.startsWith('/register');

    if (isAuthPage) {
      // User is already authenticated, redirect them to their main dashboard.
      return NextResponse.redirect(new URL('/workshops', req.url));
    }
  },
  {
    callbacks: {
      // This is the core of the protection logic.
      // `withAuth` will only run the middleware if this returns true.
      // If it returns false, `withAuth` will automatically redirect the
      // unauthenticated user to the login page you define below.
      authorized: ({ token }) => !!token,
    },
    // Tell next-auth where your login page is. This is used for the automatic redirect.
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  // This matcher defines which routes are protected and require authentication.
  // We are explicitly protecting the /workshops and /patterns routes.
  // The login and register pages are NOT in this list, so they remain public.
  matcher: ['/workshops/:path*', '/patterns/:path*'],
};