import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import type { BatchConfig } from '../../batches/route';
import { isAuthorizedAdminRequest, unauthorizedJson } from '@/lib/admin-auth';

// Server-side proxy — browser never sees ADMIN_CONFIG_KEY

const CONFIG_PATHS: Record<string, string> = {
  starter: path.join(process.cwd(), 'data', 'batches-starter.json'),
  prov2:   path.join(process.cwd(), 'data', 'batches-prov2.json'),
};

export async function PUT(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return unauthorizedJson();
  }

  try {
    const variant = req.nextUrl.searchParams.get('variant') === 'prov2' ? 'prov2' : 'starter';
    const configPath = CONFIG_PATHS[variant];
    const body = (await req.json()) as BatchConfig;

    if (!Array.isArray(body.batches)) {
      return NextResponse.json({ ok: false, message: 'batches must be array' }, { status: 400 });
    }
    for (const b of body.batches) {
      if (typeof b.id !== 'string' || !/^batch-[0-9]+$/.test(b.id)) {
        return NextResponse.json({ ok: false, message: `invalid id: ${b.id}` }, { status: 400 });
      }
    }

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('save-batches failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
