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
  return NextResponse.json({
    ok: true,
    authenticated: isAuthorizedAdminRequest(request),
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
