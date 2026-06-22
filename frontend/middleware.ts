import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// MAINTENANCE MODE — set to true to redirect all pages to /maintenance
const MAINTENANCE = true;

export function middleware(request: NextRequest) {
  if (!MAINTENANCE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.png' ||
    pathname === '/ritty-logo.png' ||
    pathname === '/noise.svg' ||
    pathname === '/maintenance'
  ) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|ritty-logo.png|noise.svg).*)'],
};
