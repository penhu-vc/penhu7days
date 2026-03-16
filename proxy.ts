import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isAdminSessionValue } from '@/lib/admin-auth';

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/debug')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (pathname.startsWith('/p7com')) {
    const cookieValue = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminSessionValue(cookieValue)) {
      const loginUrl = new URL('/admin-login', req.url);
      const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      loginUrl.searchParams.set('next', next);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/debug/:path*', '/p7com/:path*'],
};
