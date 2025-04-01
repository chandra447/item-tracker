import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './src/lib/pocketbase';

// Define protected and public paths
const PROTECTED_PATHS = ['/dashboard', '/items', '/profile'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if user is authenticated via cookie
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
    const isAuthenticated = !!authCookie?.value;

    console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`);

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && AUTH_PATHS.some(path => pathname.startsWith(path))) {
        console.log('[Middleware] Authenticated user trying to access auth page, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect unauthenticated users away from protected pages
    if (!isAuthenticated && PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
        console.log('[Middleware] Unauthenticated user trying to access protected page, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// Configure which paths should trigger the middleware
export const config = {
    matcher: [
        // Match all routes except for static files, api routes, and _next
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}; 