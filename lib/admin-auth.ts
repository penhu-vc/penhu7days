import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'penhu_admin_session';

export function getAdminToken(): string {
  return (process.env.ADMIN_TOKEN || '').trim();
}

export function isAdminSessionValue(value: string | undefined): boolean {
  const token = getAdminToken();
  return Boolean(token) && value === token;
}

export function isAuthorizedAdminRequest(request: NextRequest): boolean {
  return isAdminSessionValue(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export function unauthorizedJson() {
  return NextResponse.json(
    { ok: false, error: 'UNAUTHORIZED' },
    { status: 401 }
  );
}
