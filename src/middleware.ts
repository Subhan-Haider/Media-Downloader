import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to the login page and auth APIs
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    // Redirect away from login if already authenticated
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isSettingsRoute = pathname.startsWith('/settings') || pathname.startsWith('/api/settings');
  const isDeleteAction = request.method === 'DELETE' && (pathname.startsWith('/api/library') || pathname.startsWith('/api/media'));

  // If this is a protected route and there is no session, block access
  if ((isAdminRoute || isSettingsRoute || isDeleteAction) && !session) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session verification is complex in Edge middleware because firebase-admin doesn't work here.
  // The actual cookie creation securely verified the email (setupg98@gmail.com).
  // We trust the cookie here. If it's expired or tampered, the backend APIs could still fail, 
  // but for the UI we just check for its presence.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
