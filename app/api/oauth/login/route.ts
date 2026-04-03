import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MEMBER_BASE = 'https://member.penhu.xyz';
const CLIENT_ID = process.env.PENHU_OAUTH_CLIENT_ID!;

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(16).toString('hex');
  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/#signup';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://penhu.xyz'}/api/oauth/callback`,
    scope: 'profile email',
    state,
  });

  const res = NextResponse.redirect(`${MEMBER_BASE}/oauth/authorize?${params}`);
  res.cookies.set('oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' });
  res.cookies.set('oauth_return', returnTo, { httpOnly: true, maxAge: 600, path: '/' });
  return res;
}
