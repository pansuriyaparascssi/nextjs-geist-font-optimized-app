import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/'];
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const user = getUserFromRequest(request);

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  const roleRoutes = {
    'Release Manager': ['/release-manager'],
    'Release Approver': ['/release-approver'],
    'IT Person': ['/it-person']
  };

  // Check if user has access to the requested route
  const userRole = user.role as keyof typeof roleRoutes;
  const allowedRoutes = roleRoutes[userRole] || [];
  
  const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));

  if (!hasAccess && !pathname.startsWith('/api/')) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'Release Manager':
        return NextResponse.redirect(new URL('/release-manager/dashboard', request.url));
      case 'Release Approver':
        return NextResponse.redirect(new URL('/release-approver', request.url));
      case 'IT Person':
        return NextResponse.redirect(new URL('/it-person', request.url));
      default:
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
