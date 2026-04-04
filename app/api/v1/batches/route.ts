import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function isAuthorized(req: NextRequest): boolean {
  const token = (process.env.API_TOKEN || process.env.ADMIN_TOKEN || '').trim();
  if (!token) return false;
  const header = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '') || '';
  return header === token;
}

async function loadBatches(variant: string) {
  const file = path.join(process.cwd(), 'data', `batches-${variant}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const [starter, prov2] = await Promise.all([
    loadBatches('starter'),
    loadBatches('prov2'),
  ]);

  return NextResponse.json({ ok: true, starter, prov2 });
}
