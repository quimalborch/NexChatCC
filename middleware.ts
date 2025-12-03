import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Si es en producción y está accediendo a /crud, redirigir a home
  if (process.env.NODE_ENV === 'production' && request.nextUrl.pathname.startsWith('/crud')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/crud/:path*'],
};
