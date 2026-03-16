import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { isAuthorizedAdminRequest, unauthorizedJson } from '@/lib/admin-auth';

export type VersionInfo = {
  version: string;      // from package.json, e.g. "0.1.0"
  gitHash: string;      // short git commit hash
  gitDate: string;      // ISO date of last commit
  builtAt: string;      // server start time (ISO)
};

let cachedHash = '';
let cachedDate = '';

function getGitInfo(): { hash: string; date: string } {
  if (cachedHash) return { hash: cachedHash, date: cachedDate };
  try {
    cachedHash = execSync('git rev-parse --short HEAD', { cwd: process.cwd() })
      .toString().trim();
    cachedDate = execSync('git log -1 --format=%cI HEAD', { cwd: process.cwd() })
      .toString().trim();
  } catch {
    cachedHash = 'unknown';
    cachedDate = '';
  }
  return { hash: cachedHash, date: cachedDate };
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

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return unauthorizedJson();
  }

  const { hash, date } = getGitInfo();
  return NextResponse.json({
    version: getPkgVersion(),
    gitHash: hash,
    gitDate: date,
    builtAt: SERVER_START,
  } satisfies VersionInfo);
}
