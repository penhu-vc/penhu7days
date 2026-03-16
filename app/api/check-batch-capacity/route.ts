import { NextRequest, NextResponse } from 'next/server';

// https://api-v1.penhu.xyz/api/ticket/check?event=123&key=1234
const TICKET_API_BASE = (process.env.TICKET_API_BASE || 'https://api-v1.penhu.xyz/api/ticket/check').trim();
const TICKET_API_EVENT = (process.env.TICKET_API_EVENT || '123').trim();
const TICKET_API_KEY = (process.env.TICKET_API_KEY || '1234').trim();

export async function POST(req: NextRequest) {
  const { batchId } = await req.json().catch(() => ({}));
  void batchId; // reserved for future per-batch event mapping

  const url = `${TICKET_API_BASE}?event=${encodeURIComponent(TICKET_API_EVENT)}&key=${encodeURIComponent(TICKET_API_KEY)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      // Remote returned error — fallback to available
      return NextResponse.json({ available: true });
    }

    const data = await res.json().catch(() => null);
    // API returns { status: "available" } or { status: "full" }
    const available = data?.status !== 'full';
    return NextResponse.json({ available });
  } catch {
    // Timeout or network error — fallback to available
    return NextResponse.json({ available: true });
  }
}
