import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'penhu_admin_session';
export const ADMIN_ALLOWED_ROLES = ['admin', 'analyst'];

export type AdminSession = {
  id: number;
  name: string;
  shortCode: string;
  role: string;
};

export function parseAdminSession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  try {
    const data = JSON.parse(Buffer.from(value, 'base64').toString('utf8')) as AdminSession;
    if (data && ADMIN_ALLOWED_ROLES.includes(data.role)) {
      return data;
    }
  } catch {}
  return null;
}

export function isAdminSessionValue(value: string | undefined): boolean {
  return parseAdminSession(value) !== null;
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
