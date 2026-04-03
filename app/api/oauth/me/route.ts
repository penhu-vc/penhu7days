import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('penhu_oauth_user')?.value;
  if (!session) {
    return NextResponse.json({ user: null });
  }
  try {
    const user = JSON.parse(Buffer.from(session, 'base64').toString());
    // 不回傳 accessToken 給前端
    const { accessToken: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('penhu_oauth_user');
  return res;
}
