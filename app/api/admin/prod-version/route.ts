import { NextRequest, NextResponse } from 'next/server';
import type { AppVersion } from '../../version/route';
import { isAuthorizedAdminRequest, unauthorizedJson } from '@/lib/admin-auth';

const PROD_URL = 'https://penhu.xyz';

export type ProdVersionResponse =
  | { ok: true; local: AppVersion; prod: AppVersion | null }
  | { ok: false; error: string };

// Server-side proxy — key never reaches the browser
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return unauthorizedJson();
  }

  const adminKey = (process.env.ADMIN_CONFIG_KEY || '').trim();
  if (!adminKey) {
    return NextResponse.json({ ok: false, error: 'ADMIN_CONFIG_KEY not set' }, { status: 503 });
  }

  // Fetch local version (same process)
  const { execSync } = await import('child_process');
  const { readFileSync } = await import('fs');
  const path = await import('path');

  const getHash = () => {
    try { return execSync('git rev-parse --short HEAD', { cwd: process.cwd() }).toString().trim(); }
    catch { return 'unknown'; }
  };
  const getDate = () => {
    try { return execSync('git log -1 --format=%cI HEAD', { cwd: process.cwd() }).toString().trim(); }
    catch { return ''; }
  };
  const getVersion = () => {
    try {
      const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      return pkg.version ?? '0.0.0';
    } catch { return '0.0.0'; }
  };

  const local: AppVersion = {
    version: getVersion(),
    gitHash: getHash(),
    gitDate: getDate(),
    startedAt: '',
  };

  // Fetch production version
  let prod: AppVersion | null = null;
  try {
    const res = await fetch(`${PROD_URL}/api/version?key=${encodeURIComponent(adminKey)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) prod = await res.json();
  } catch {
    // prod unreachable — still return local
  }

  return NextResponse.json({ ok: true, local, prod } satisfies ProdVersionResponse);
}
