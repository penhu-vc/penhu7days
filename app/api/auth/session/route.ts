import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminToken,
  isAuthorizedAdminRequest,
} from '@/lib/admin-auth';

const COOKIE_MAX_AGE = 60 * 60 * 12;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function GET(request: NextRequest) {
  const tokenParam = request.nextUrl.searchParams.get('token')?.trim() || '';
  const adminToken = getAdminToken();
  if (tokenParam && adminToken && tokenParam === adminToken) {
    const redirectTo = request.nextUrl.searchParams.get('next') || '/p7com';
    const base = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    const res = NextResponse.redirect(new URL(redirectTo, base));
    res.cookies.set(ADMIN_SESSION_COOKIE, adminToken, cookieOptions());
    return res;
  }
  const authenticated = isAuthorizedAdminRequest(request);
  return NextResponse.json({
    ok: true,
    authenticated,
    // 已登入才把 token 給前端（方便 API 文件顯示）
    token: authenticated ? getAdminToken() : null,
  });
}

export async function POST(request: NextRequest) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null) as { token?: string } | null;
  const submittedToken = body?.token?.trim() || '';
  console.log('[session] submitted:', JSON.stringify(submittedToken), 'expected:', JSON.stringify(adminToken), 'match:', submittedToken === adminToken);
  if (!submittedToken || submittedToken !== adminToken) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, adminToken, cookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...cookieOptions(),
    maxAge: 0,
  });
  return response;
}
