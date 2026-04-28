import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, ADMIN_ALLOWED_ROLES } from '@/lib/admin-auth';

const MEMBER_BASE = 'https://member.penhu.xyz';
const CLIENT_ID = process.env.PENHU_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.PENHU_OAUTH_CLIENT_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const storedState = req.cookies.get('admin_oauth_state')?.value;
  const next = req.cookies.get('admin_oauth_next')?.value || '/p7com';

  if (error || !code || !state || state !== storedState) {
    return NextResponse.redirect(`${siteUrl}/admin-login?error=oauth`);
  }

  try {
    const tokenRes = await fetch(`${MEMBER_BASE}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${siteUrl}/api/auth/admin-oauth/callback`,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json() as { access_token: string };

    const userRes = await fetch(`${MEMBER_BASE}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) throw new Error(`userinfo failed: ${userRes.status}`);

    const user = await userRes.json() as {
      sub: number;
      name: string;
      shortCode: string;
      email?: string;
      role: string;
    };

    if (!ADMIN_ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.redirect(`${siteUrl}/admin-login?error=forbidden`);
    }

    const session = Buffer.from(JSON.stringify({
      id: user.sub,
      name: user.name,
      shortCode: user.shortCode,
      role: user.role,
    })).toString('base64');

    const res = NextResponse.redirect(`${siteUrl}${next}`);
    res.cookies.set(ADMIN_SESSION_COOKIE, session, {
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });
    res.cookies.delete('admin_oauth_state');
    res.cookies.delete('admin_oauth_next');
    return res;

  } catch (err) {
    console.error('Admin OAuth callback error:', err);
    return NextResponse.redirect(`${siteUrl}/admin-login?error=oauth`);
  }
}
