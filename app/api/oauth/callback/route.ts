import { NextRequest, NextResponse } from 'next/server';

const MEMBER_BASE = 'https://member.penhu.xyz';
const CLIENT_ID = process.env.PENHU_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.PENHU_OAUTH_CLIENT_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://penhu.xyz';
  const storedState = req.cookies.get('oauth_state')?.value;
  const returnTo = req.cookies.get('oauth_return')?.value || '/#signup';

  if (error || !code || !state || state !== storedState) {
    return NextResponse.redirect(`${siteUrl}/?oauth_error=1#signup`);
  }

  try {
    // 換 access token
    const tokenRes = await fetch(`${MEMBER_BASE}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${siteUrl}/api/oauth/callback`,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`token exchange failed: ${tokenRes.status}`);
    }

    const { access_token } = await tokenRes.json() as { access_token: string };

    // 取使用者資料
    const userRes = await fetch(`${MEMBER_BASE}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      throw new Error(`userinfo failed: ${userRes.status}`);
    }

    const user = await userRes.json() as {
      sub: number;
      name: string;
      shortCode: string;
      email: string;
      role: string;
    };

    const session = Buffer.from(JSON.stringify({
      id: user.sub,
      name: user.name,
      shortCode: user.shortCode,
      email: user.email,
      role: user.role,
      accessToken: access_token,
    })).toString('base64');

    const res = NextResponse.redirect(`${siteUrl}${returnTo}`);
    res.cookies.set('penhu_oauth_user', session, {
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });
    res.cookies.delete('oauth_state');
    res.cookies.delete('oauth_return');
    return res;

  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${siteUrl}/?oauth_error=1#signup`);
  }
}
