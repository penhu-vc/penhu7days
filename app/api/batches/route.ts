import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdminRequest, unauthorizedJson } from '@/lib/admin-auth';

export type BatchDef = {
  id: string;          // 'batch-1', 'batch-2', ...
  label: string;       // '第一梯'
  courseDate: string;  // '03/09 - 03/15'
  endDateIso: string;  // 'YYYY-MM-DD' — signup closes (day before course start)
  forceShow?: boolean; // override date rules to show early
};

export type BatchConfig = {
  batches: BatchDef[];
};

// Computed batch returned to public
export type BatchPublic = {
  id: string;
  label: string;
  date: string;
  enabled: boolean;
  status: string;
  forceShow?: boolean;
};

// Admin view adds whether batch is shown by rules (can't be hidden if true)
export type BatchAdmin = BatchPublic & {
  endDateIso: string;
  isShownByRules: boolean;
};

type Variant = 'starter' | 'prov2';

const BATCH_GREY_DAYS = 2;

const CONFIG_PATHS: Record<Variant, string> = {
  starter: path.join(process.cwd(), 'data', 'batches-starter.json'),
  prov2:   path.join(process.cwd(), 'data', 'batches-prov2.json'),
};

const DEFAULT_CONFIGS: Record<Variant, BatchConfig> = {
  starter: {
    batches: [
      { id: 'batch-1', label: '第一梯', courseDate: '03/09 - 03/15', endDateIso: '2026-03-08' },
      { id: 'batch-2', label: '第二梯', courseDate: '03/23 - 03/29', endDateIso: '2026-03-22' },
      { id: 'batch-3', label: '第三梯', courseDate: '04/06 - 04/12', endDateIso: '2026-04-05' },
    ],
  },
  prov2: {
    batches: [
      { id: 'batch-1', label: '第一梯', courseDate: '3/16 - 3/22', endDateIso: '2026-03-15' },
      { id: 'batch-2', label: '第二梯', courseDate: '3/30 - 4/5',  endDateIso: '2026-03-29' },
      { id: 'batch-3', label: '第三梯', courseDate: '4/13 - 4/19', endDateIso: '2026-04-12' },
    ],
  },
};

function resolveVariant(req: NextRequest): Variant {
  return req.nextUrl.searchParams.get('variant') === 'prov2' ? 'prov2' : 'starter';
}

async function loadConfig(variant: Variant): Promise<BatchConfig> {
  const configPath = CONFIG_PATHS[variant];
  try {
    await fs.access(configPath);
    const raw = await fs.readFile(configPath, 'utf8');
    return JSON.parse(raw) as BatchConfig;
  } catch {
    return DEFAULT_CONFIGS[variant];
  }
}

function computeBatches(config: BatchConfig, adminMode: boolean): BatchPublic[] | BatchAdmin[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const batches = config.batches;

  return batches
    .filter((def, index) => {
      if (def.forceShow) return true;
      if (index === 0) return true;
      // Show if previous batch's grey period has started
      const prev = batches[index - 1];
      const prevEnd = new Date(prev.endDateIso);
      const prevGrey = new Date(prevEnd);
      prevGrey.setDate(prevGrey.getDate() - BATCH_GREY_DAYS);
      return today >= prevGrey;
    })
    .map((def) => {
      const endDate = new Date(def.endDateIso);
      const greyDate = new Date(endDate);
      greyDate.setDate(greyDate.getDate() - BATCH_GREY_DAYS);

      const expired = today > endDate;
      const greyed = today >= greyDate;
      const isShownByRules = (() => {
        const idx = batches.indexOf(def);
        if (idx === 0) return true;
        const prev = batches[idx - 1];
        const prevEnd = new Date(prev.endDateIso);
        const prevGrey = new Date(prevEnd);
        prevGrey.setDate(prevGrey.getDate() - BATCH_GREY_DAYS);
        return today >= prevGrey;
      })();

      const base: BatchPublic = {
        id: def.id,
        label: def.label,
        date: def.courseDate,
        enabled: !greyed && !expired,
        status: expired ? '已結束' : greyed ? '報名截止' : '已開放',
        forceShow: def.forceShow,
      };

      if (adminMode) {
        return { ...base, endDateIso: def.endDateIso, isShownByRules } as BatchAdmin;
      }
      return base;
    });
}

export async function GET(request: NextRequest) {
  const variant = resolveVariant(request);
  const adminMode = request.nextUrl.searchParams.get('mode') === 'admin';
  if (adminMode && !isAuthorizedAdminRequest(request)) {
    return unauthorizedJson();
  }
  const config = await loadConfig(variant);

  // Dev-only: inject a debug batch so the form can be tested locally
  if (process.env.NODE_ENV !== 'production') {
    config.batches = [
      ...config.batches,
      { id: 'batch-99', label: '🛠 Debug', courseDate: 'Dev only', endDateIso: '2099-12-31', forceShow: true },
    ];
  }

  if (adminMode) {
    // Admin: return all batches (not filtered) with metadata
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allBatches: BatchAdmin[] = config.batches.map((def, index) => {
      const endDate = new Date(def.endDateIso);
      const greyDate = new Date(endDate);
      greyDate.setDate(greyDate.getDate() - BATCH_GREY_DAYS);
      const expired = today > endDate;
      const greyed = today >= greyDate;
      const isShownByRules = (() => {
        if (index === 0) return true;
        const prev = config.batches[index - 1];
        const prevEnd = new Date(prev.endDateIso);
        const prevGrey = new Date(prevEnd);
        prevGrey.setDate(prevGrey.getDate() - BATCH_GREY_DAYS);
        return today >= prevGrey;
      })();
      return {
        id: def.id,
        label: def.label,
        date: def.courseDate,
        endDateIso: def.endDateIso,
        enabled: !greyed && !expired,
        status: expired ? '已結束' : greyed ? '報名截止' : '已開放',
        forceShow: def.forceShow,
        isShownByRules,
      };
    });
    return NextResponse.json({ batches: allBatches });
  }

  const batches = computeBatches(config, false);
  return NextResponse.json({ batches });
}

export async function PUT(req: Request) {
  try {
    const request = req as NextRequest;
    const variant = resolveVariant(request);
    const configPath = CONFIG_PATHS[variant];

    if (!isAuthorizedAdminRequest(request)) {
      return unauthorizedJson();
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const adminKey = (process.env.ADMIN_CONFIG_KEY || '').trim();
    const reqKey = request.headers.get('x-admin-key')?.trim() || '';
    if (isProduction && (!adminKey || reqKey !== adminKey)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const body = (await req.json()) as BatchConfig;

    // Validate: must be an array
    if (!Array.isArray(body.batches)) {
      return NextResponse.json({ ok: false, message: 'batches must be array' }, { status: 400 });
    }

    // Validate each batch
    for (const b of body.batches) {
      if (typeof b.id !== 'string' || !/^batch-[0-9]+$/.test(b.id)) {
        return NextResponse.json({ ok: false, message: `invalid id: ${b.id}` }, { status: 400 });
      }
      if (typeof b.label !== 'string' || !b.label.trim()) {
        return NextResponse.json({ ok: false, message: `invalid label for ${b.id}` }, { status: 400 });
      }
      if (typeof b.courseDate !== 'string' || !b.courseDate.trim()) {
        return NextResponse.json({ ok: false, message: `invalid courseDate for ${b.id}` }, { status: 400 });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b.endDateIso)) {
        return NextResponse.json({ ok: false, message: `invalid endDateIso for ${b.id}` }, { status: 400 });
      }
    }

    // Validate: no duplicate IDs
    const ids = body.batches.map((b) => b.id);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ ok: false, message: 'duplicate batch ids' }, { status: 400 });
    }

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('save batches failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
