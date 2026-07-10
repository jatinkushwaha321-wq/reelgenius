import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

  // Redirect to login if accessing a protected route without a session
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }
});

// Configure matcher to run middleware on all dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
