import { NextRequest, NextResponse } from 'next/server';

const MEMBER_BASE = 'https://member.penhu.xyz';

// GET /api/oauth/member-lookup?okxUid=XXX
// 用 OKX UID 反查 penhu 會員資料，不需要 OAuth session
export async function GET(req: NextRequest) {
  const okxUid = req.nextUrl.searchParams.get('okxUid')?.trim();
  if (!okxUid) {
    return NextResponse.json({ ok: false, error: 'MISSING_UID' }, { status: 400 });
  }

  const apiKey = process.env.MEMBER_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'MEMBER_API_KEY_NOT_SET' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${MEMBER_BASE}/api/members?limit=1000`,
      { headers: { 'X-API-Key': apiKey }, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'LOOKUP_FAILED' }, { status: 502 });
    }

    const data = await res.json() as { data?: Record<string, unknown>[] } | Record<string, unknown>[];
    const members: Record<string, unknown>[] = Array.isArray(data) ? data : (data as { data?: Record<string, unknown>[] }).data ?? [];

    const member = members.find(m => String(m.okxUid ?? '') === okxUid);
    if (!member) {
      return NextResponse.json({ ok: true, found: false });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      member,
    });
  } catch (err) {
    console.error('member-lookup exception:', err);
    return NextResponse.json({ ok: false, error: 'NETWORK_ERROR' }, { status: 502 });
  }
}
