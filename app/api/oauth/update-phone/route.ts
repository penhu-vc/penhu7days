import { NextRequest, NextResponse } from 'next/server';

const MEMBER_BASE = 'https://member.penhu.xyz';

// PATCH /api/oauth/update-phone
// body: { memberId: number, phone: string }
// 不需要 OAuth session，用 API Key 更新 penhu 會員電話
export async function PATCH(req: NextRequest) {
  const apiKey = process.env.MEMBER_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'MEMBER_API_KEY_NOT_SET' }, { status: 500 });
  }

  let body: { memberId?: number; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const { memberId, phone } = body;
  if (!memberId || !phone) {
    return NextResponse.json({ ok: false, error: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const res = await fetch(`${MEMBER_BASE}/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      console.error('update-phone error:', res.status, await res.text());
      return NextResponse.json({ ok: false, error: 'UPDATE_FAILED' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('update-phone exception:', err);
    return NextResponse.json({ ok: false, error: 'NETWORK_ERROR' }, { status: 502 });
  }
}
