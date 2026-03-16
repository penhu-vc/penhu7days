import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

export type AppVersion = {
  version: string;   // package.json version
  gitHash: string;   // short git commit hash
  gitDate: string;   // ISO date of last commit
  startedAt: string; // server start time (ISO)
};

let cached: { hash: string; date: string } | null = null;

function getGitInfo() {
  if (cached) return cached;
  try {
    cached = {
      hash: execSync('git rev-parse --short HEAD', { cwd: process.cwd() }).toString().trim(),
      date: execSync('git log -1 --format=%cI HEAD', { cwd: process.cwd() }).toString().trim(),
    };
  } catch {
    cached = { hash: 'unknown', date: '' };
  }
  return cached;
}

function getPkgVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const SERVER_START = new Date().toISOString();

export async function GET(req: Request) {
  const adminKey = (process.env.ADMIN_CONFIG_KEY || '').trim();
  const reqKey = new URL(req.url).searchParams.get('key')?.trim() ?? '';

  if (!adminKey || reqKey !== adminKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { hash, date } = getGitInfo();
  return NextResponse.json({
    version: getPkgVersion(),
    gitHash: hash,
    gitDate: date,
    startedAt: SERVER_START,
  } satisfies AppVersion, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
