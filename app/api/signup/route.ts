import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { google } from 'googleapis';

type CourseType = 'starter' | 'pro';
type LandingVariant = 'default' | 'prov2';

type SignupPayload = {
  courseType?: CourseType;
  landingVariant?: LandingVariant;
  batchId: string;
  lineName: string;
  lineId: string;
  email: string;
  phone: string;
  okxUid: string;
  knowledgeLevel: number;
  budgetAmount: number;
  interestAreas?: string[];
  captchaToken?: string;
  websiteUrl?: string;
  ref?: string;
};

type CaptchaFailureCode =
  | 'CAPTCHA_REQUIRED'
  | 'CAPTCHA_REPLAYED'
  | 'CAPTCHA_LOW_SCORE'
  | 'CAPTCHA_BAD_ACTION'
  | 'CAPTCHA_BAD_HOSTNAME'
  | 'CAPTCHA_INVALID';

const WINDOW_MS = 60_000;
const SOFT_LIMIT_PER_WINDOW = 10;
const HARD_LIMIT_PER_WINDOW = 30;
const SOFT_LIMIT_PER_FINGERPRINT = 16;
const HARD_LIMIT_PER_FINGERPRINT = 48;
const SOFT_LIMIT_GLOBAL = 120;
const HARD_LIMIT_GLOBAL = 300;
const CAPTCHA_REPLAY_TTL_MS = 2 * 60_000;

const ipRequestLog = new Map<string, number[]>();
const fingerprintRequestLog = new Map<string, number[]>();
const globalRequestLog: number[] = [];
const captchaReplayLog = new Map<string, number>();
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const EXPECTED_RECAPTCHA_ACTION = 'signup_submit';

type StorageErrorCode = 'STORAGE_NOT_CONFIGURED' | 'STORAGE_WRITE_FAILED';

class StorageError extends Error {
  code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  return realIp?.trim() || 'unknown';
}

function markAndCount(ip: string, now: number): number {
  const history = ipRequestLog.get(ip) ?? [];
  const next = history.filter((ts) => now - ts <= WINDOW_MS);
  next.push(now);
  ipRequestLog.set(ip, next);
  return next.length;
}

function markFingerprintAndCount(fingerprint: string, now: number): number {
  const history = fingerprintRequestLog.get(fingerprint) ?? [];
  const next = history.filter((ts) => now - ts <= WINDOW_MS);
  next.push(now);
  fingerprintRequestLog.set(fingerprint, next);
  return next.length;
}

function markGlobalAndCount(now: number): number {
  while (globalRequestLog.length > 0) {
    if (now - globalRequestLog[0] <= WINDOW_MS) break;
    globalRequestLog.shift();
  }
  globalRequestLog.push(now);
  return globalRequestLog.length;
}

function cleanupCaptchaReplayCache(now: number) {
  for (const [hash, until] of captchaReplayLog.entries()) {
    if (until <= now) captchaReplayLog.delete(hash);
  }
}

function claimCaptchaToken(token: string, now: number): boolean {
  cleanupCaptchaReplayCache(now);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const existing = captchaReplayLog.get(tokenHash) ?? 0;
  if (existing > now) return false;
  captchaReplayLog.set(tokenHash, now + CAPTCHA_REPLAY_TTL_MS);
  return true;
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '');
}

function isSameOrigin(req: NextRequest): boolean {
  const host = normalizeHost(req.headers.get('x-forwarded-host') || req.headers.get('host') || '');
  if (!host) return true;

  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (normalizeHost(new URL(origin).host) !== host) return false;
    } catch {
      return false;
    }
  }

  const referer = req.headers.get('referer');
  if (referer) {
    try {
      if (normalizeHost(new URL(referer).host) !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function validatePayload(raw: unknown): { ok: true; data: SignupPayload } | { ok: false; message: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, message: 'invalid payload' };
  const data = raw as Partial<SignupPayload>;

  const batchId = String(data.batchId ?? '').trim();
  const lineName = String(data.lineName ?? '').trim();
  const lineId = String(data.lineId ?? '').trim();
  const email = String(data.email ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const okxUid = String(data.okxUid ?? '').trim();
  const knowledgeLevel = Number(data.knowledgeLevel);
  const budgetAmount = Number(data.budgetAmount);
  const captchaToken = String(data.captchaToken ?? '').trim();
  const websiteUrl = String(data.websiteUrl ?? '').trim();
  const ref = String(data.ref ?? '').trim().slice(0, 80);
  const courseTypeRaw = String(data.courseType ?? '').trim().toLowerCase();
  const landingVariantRaw = String(data.landingVariant ?? '').trim().toLowerCase();

  if (!/^batch-[0-9]+$/.test(batchId)) return { ok: false, message: 'invalid batchId' };
  if (courseTypeRaw && courseTypeRaw !== 'starter' && courseTypeRaw !== 'pro') {
    return { ok: false, message: 'invalid courseType' };
  }
  if (landingVariantRaw && landingVariantRaw !== 'default' && landingVariantRaw !== 'prov2') {
    return { ok: false, message: 'invalid landingVariant' };
  }
  if (!lineName || lineName.length > 100) return { ok: false, message: 'invalid lineName' };
  if (!lineId || lineId.length > 100) return { ok: false, message: 'invalid lineId' };
  if (!/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}$/.test(email) || email.length > 320) {
    return { ok: false, message: 'invalid email' };
  }
  if (!/^[0-9+\-()#* ]{6,24}$/.test(phone)) return { ok: false, message: 'invalid phone' };
  if (!okxUid || okxUid.length > 120) return { ok: false, message: 'invalid okxUid' };
  if (!Number.isInteger(knowledgeLevel) || knowledgeLevel < 1 || knowledgeLevel > 5) {
    return { ok: false, message: 'invalid knowledgeLevel' };
  }
  if (!Number.isFinite(budgetAmount) || budgetAmount < 0 || budgetAmount > 2_000_000) {
    return { ok: false, message: 'invalid budgetAmount' };
  }
  if (websiteUrl.length > 200) return { ok: false, message: 'invalid websiteUrl' };

  const rawInterestAreas = (raw as Record<string, unknown>).interestAreas;
  let interestAreas: string[] | undefined;
  if (rawInterestAreas !== undefined) {
    if (!Array.isArray(rawInterestAreas)) return { ok: false, message: 'invalid interestAreas' };
    const items = (rawInterestAreas as unknown[])
      .slice(0, 10)
      .map((item) => String(item).trim())
      .filter((s) => s.length > 0 && s.length <= 200);
    interestAreas = items.length > 0 ? items : undefined;
  }

  return {
    ok: true,
    data: {
      batchId,
      lineName,
      lineId,
      email,
      phone,
      okxUid,
      knowledgeLevel,
      budgetAmount,
      interestAreas,
      captchaToken: captchaToken || undefined,
      websiteUrl: websiteUrl || undefined,
      ref: ref || undefined,
      courseType: (courseTypeRaw || undefined) as CourseType | undefined,
      landingVariant: (landingVariantRaw || undefined) as LandingVariant | undefined,
    },
  };
}

type CaptchaResult = {
  ok: boolean;
  reason?: 'invalid' | 'low_score' | 'bad_action' | 'bad_hostname' | 'verify_failed';
  provider?: 'recaptcha_v3' | 'hcaptcha' | 'recaptcha_enterprise';
  score?: number | null;
  action?: string | null;
  hostname?: string | null;
  errorCodes?: string[];
};

function getCaptchaProvider(): 'recaptcha_v3' | 'hcaptcha' | 'recaptcha_enterprise' {
  const provider = (process.env.CAPTCHA_PROVIDER || 'recaptcha_v3').trim().toLowerCase();
  if (provider === 'hcaptcha') return 'hcaptcha';
  if (provider === 'recaptcha_enterprise') return 'recaptcha_enterprise';
  return 'recaptcha_v3';
}

function getRecaptchaMinScore(): number {
  const raw = Number(process.env.RECAPTCHA_MIN_SCORE || '0.55');
  if (!Number.isFinite(raw)) return 0.55;
  return Math.min(0.99, Math.max(0.05, raw));
}

function getCaptchaEnforceMode(): 'always' | 'suspicious' {
  const raw = (process.env.CAPTCHA_ENFORCE_MODE || 'suspicious').trim().toLowerCase();
  if (raw === 'always') return 'always';
  return 'suspicious';
}

async function verifyCaptchaToken(params: {
  token: string;
  ip: string;
  userAgent: string;
  expectedHost: string;
}): Promise<CaptchaResult> {
  const provider = getCaptchaProvider();
  const secret = (process.env.CAPTCHA_SECRET || '').trim();

  if (provider === 'recaptcha_enterprise') {
    const projectId = (process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '').trim();
    const projectNumber = (process.env.RECAPTCHA_ENTERPRISE_PROJECT_NUMBER || '').trim();
    const parent = projectNumber
      ? `projects/${projectNumber}`
      : projectId
        ? `projects/${projectId}`
        : '';
    const siteKey = (process.env.RECAPTCHA_ENTERPRISE_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '').trim();
    if (!parent || !siteKey) return { ok: false, reason: 'verify_failed' };

    try {
      const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
      const auth = new google.auth.GoogleAuth(
        keyFile ? { keyFile, scopes: [CLOUD_PLATFORM_SCOPE] } : { scopes: [CLOUD_PLATFORM_SCOPE] }
      );
      const recaptcha = google.recaptchaenterprise({ version: 'v1', auth });
      const result = await recaptcha.projects.assessments.create({
        parent,
        requestBody: {
          event: {
            token: params.token,
            siteKey,
            userIpAddress: params.ip,
            userAgent: params.userAgent,
            expectedAction: EXPECTED_RECAPTCHA_ACTION,
          },
        },
      });

      const tokenProps = result.data.tokenProperties;
      const risk = result.data.riskAnalysis;

      if (!tokenProps?.valid) return { ok: false, reason: 'invalid' };
      if (tokenProps.action !== EXPECTED_RECAPTCHA_ACTION) {
        return {
          ok: false,
          reason: 'bad_action',
          provider,
          score: typeof risk?.score === 'number' ? risk.score : null,
          action: tokenProps.action || null,
          hostname: tokenProps.hostname || null,
        };
      }
      if (typeof risk?.score !== 'number' || risk.score < getRecaptchaMinScore()) {
        return {
          ok: false,
          reason: 'low_score',
          provider,
          score: typeof risk?.score === 'number' ? risk.score : null,
          action: tokenProps.action || null,
          hostname: tokenProps.hostname || null,
        };
      }
      if (tokenProps.hostname) {
        const configuredExpectedHost = normalizeHost(process.env.RECAPTCHA_EXPECTED_HOST || params.expectedHost);
        const returnedHost = normalizeHost(tokenProps.hostname);
        if (configuredExpectedHost && returnedHost && configuredExpectedHost !== returnedHost) {
          return {
            ok: false,
            reason: 'bad_hostname',
            provider,
            score: typeof risk?.score === 'number' ? risk.score : null,
            action: tokenProps.action || null,
            hostname: tokenProps.hostname || null,
          };
        }
      }
      return {
        ok: true,
        provider,
        score: typeof risk?.score === 'number' ? risk.score : null,
        action: tokenProps.action || null,
        hostname: tokenProps.hostname || null,
      };
    } catch {
      return { ok: false, reason: 'verify_failed', provider };
    }
  }

  if (!secret) return { ok: false, reason: 'verify_failed' };

  const endpoint =
    provider === 'hcaptcha' ? 'https://hcaptcha.com/siteverify' : 'https://www.google.com/recaptcha/api/siteverify';
  const body = new URLSearchParams({ secret, response: params.token, remoteip: params.ip });
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, reason: 'verify_failed' };

  if (provider === 'hcaptcha') {
    const json = (await res.json()) as { success?: boolean; ['error-codes']?: string[] };
    return {
      ok: json.success === true,
      reason: json.success === true ? undefined : 'invalid',
      provider,
      score: null,
      action: null,
      hostname: null,
      errorCodes: Array.isArray(json['error-codes']) ? json['error-codes'] : [],
    };
  }

  const json = (await res.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
    hostname?: string;
  };
  if (json.success !== true) return { ok: false, reason: 'invalid' };
  if (typeof json.score !== 'number' || json.score < getRecaptchaMinScore()) {
    return {
      ok: false,
      reason: 'low_score',
      provider,
      score: typeof json.score === 'number' ? json.score : null,
      action: json.action || null,
      hostname: json.hostname || null,
    };
  }
  if (json.action !== EXPECTED_RECAPTCHA_ACTION) {
    return {
      ok: false,
      reason: 'bad_action',
      provider,
      score: typeof json.score === 'number' ? json.score : null,
      action: json.action || null,
      hostname: json.hostname || null,
    };
  }

  const configuredExpectedHost = normalizeHost(process.env.RECAPTCHA_EXPECTED_HOST || params.expectedHost);
  const returnedHost = normalizeHost(json.hostname || '');
  if (configuredExpectedHost && returnedHost && configuredExpectedHost !== returnedHost) {
    return {
      ok: false,
      reason: 'bad_hostname',
      provider,
      score: typeof json.score === 'number' ? json.score : null,
      action: json.action || null,
      hostname: json.hostname || null,
    };
  }
  return {
    ok: true,
    provider,
    score: typeof json.score === 'number' ? json.score : null,
    action: json.action || null,
    hostname: json.hostname || null,
  };
}

const CHINESE_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function getBatchLabel(batchId: string): string {
  const m = batchId.match(/^batch-(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    const label = n <= 10 ? CHINESE_NUMS[n] : String(n);
    return `第${label}梯`;
  }
  return batchId;
}

function getKnowledgeLabel(level: number): string {
  if (level === 1) return '完全新手';
  if (level === 2) return '剛入門';
  if (level === 3) return '略有所聞';
  if (level === 4) return '有操作過';
  if (level === 5) return '具備基礎';
  return String(level);
}

function getCourseLabel(courseType: CourseType): string {
  return courseType === 'pro' ? '實戰班' : '新手班';
}

function getSignupSheetName(params: { courseType: CourseType; landingVariant?: LandingVariant }): string {
  if (params.courseType === 'pro' && params.landingVariant === 'prov2') return '成功報名_實戰班v2';
  return params.courseType === 'pro' ? '成功報名_實戰班' : '成功報名_新手班';
}

function inferCourseType(req: NextRequest, data: SignupPayload): CourseType {
  if (data.courseType === 'pro' || data.courseType === 'starter') return data.courseType;
  const referer = req.headers.get('referer');
  if (!referer) return 'starter';
  try {
    const pathnameRaw = new URL(referer).pathname || '';
    const pathname = decodeURIComponent(pathnameRaw).toLowerCase();
    if (pathname.startsWith('/pro') || pathname.startsWith('/實戰班')) return 'pro';
  } catch {
    // ignore invalid referer
  }
  return 'starter';
}

async function appendSignupToSpreadsheet(params: {
  data: SignupPayload;
  courseType: CourseType;
  ip: string;
  userAgent: string;
}) {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();
  if (!spreadsheetId) {
    throw new StorageError('STORAGE_NOT_CONFIGURED', 'GOOGLE_SPREADSHEET_ID is missing');
  }

  try {
    const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
    const auth = new google.auth.GoogleAuth(
      keyFile ? { keyFile, scopes: [SHEETS_SCOPE] } : { scopes: [SHEETS_SCOPE] }
    );
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetName = getSignupSheetName({
      courseType: params.courseType,
      landingVariant: params.data.landingVariant,
    });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const hasTargetSheet = (spreadsheet.data.sheets || []).some(
      (sheet) => sheet.properties?.title === sheetName
    );
    if (!hasTargetSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }
    const escapedSheetName = sheetName.replace(/'/g, "''");
    const isProv2 = params.data.landingVariant === 'prov2';
    const now = new Date();

    if (isProv2) {
      const headerRange = `'${escapedSheetName}'!A1:L1`;
      const appendRange = `'${escapedSheetName}'!A:L`;
      const expectedHeaders = [
        '提交時間', '梯次', '課程類型', 'LINE 名稱', 'LINE ID', 'Email',
        '電話', 'OKX UID', '想了解的主題', 'IP', 'User-Agent', '來源',
      ] as const;

      const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
      const currentHeader = headerRes.data.values?.[0] ?? [];
      const shouldUpdateHeader =
        currentHeader.length < expectedHeaders.length ||
        expectedHeaders.some((item, index) => String(currentHeader[index] ?? '') !== item);
      if (shouldUpdateHeader) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: headerRange,
          valueInputOption: 'RAW',
          requestBody: { values: [Array.from(expectedHeaders)] },
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: appendRange,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            now.toISOString(),
            `${getBatchLabel(params.data.batchId)} (${params.data.batchId})`,
            getCourseLabel(params.courseType),
            params.data.lineName,
            params.data.lineId,
            params.data.email,
            params.data.phone,
            params.data.okxUid,
            (params.data.interestAreas || []).join('、'),
            params.ip,
            params.userAgent,
            params.data.ref ? `ref:${params.data.ref}` : 'penhu7days-web',
          ]],
        },
      });
    } else {
      const headerRange = `'${escapedSheetName}'!A1:M1`;
      const appendRange = `'${escapedSheetName}'!A:M`;
      const expectedHeaders = [
        '提交時間', '梯次', '課程類型', 'LINE 名稱', 'LINE ID', 'Email',
        '電話', 'OKX UID', '了解程度', '投入金額(NTD)', 'IP', 'User-Agent', '來源',
      ] as const;

      const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
      const currentHeader = headerRes.data.values?.[0] ?? [];
      const shouldUpdateHeader =
        currentHeader.length < expectedHeaders.length ||
        expectedHeaders.some((item, index) => String(currentHeader[index] ?? '') !== item);
      if (shouldUpdateHeader) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: headerRange,
          valueInputOption: 'RAW',
          requestBody: { values: [Array.from(expectedHeaders)] },
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: appendRange,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            now.toISOString(),
            `${getBatchLabel(params.data.batchId)} (${params.data.batchId})`,
            getCourseLabel(params.courseType),
            params.data.lineName,
            params.data.lineId,
            params.data.email,
            params.data.phone,
            params.data.okxUid,
            `${params.data.knowledgeLevel} - ${getKnowledgeLabel(params.data.knowledgeLevel)}`,
            params.data.budgetAmount,
            params.ip,
            params.userAgent,
            params.data.ref ? `ref:${params.data.ref}` : 'penhu7days-web',
          ]],
        },
      });
    }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError('STORAGE_WRITE_FAILED', `failed to append spreadsheet row: ${String(error)}`);
  }
}

function mapFailureReasonText(code: CaptchaFailureCode): string {
  if (code === 'CAPTCHA_REQUIRED') return '請求未帶 captcha token';
  if (code === 'CAPTCHA_REPLAYED') return 'captcha token 重複使用（重放）';
  if (code === 'CAPTCHA_LOW_SCORE') return 'captcha 風險分數過低';
  if (code === 'CAPTCHA_BAD_ACTION') return 'captcha action 不符合預期';
  if (code === 'CAPTCHA_BAD_HOSTNAME') return 'captcha hostname 不符合預期';
  return 'captcha 無效或驗證失敗';
}

async function appendFailureToSpreadsheet(params: {
  code: string;
  reason: string;
  data: Partial<SignupPayload>;
  ip: string;
  userAgent: string;
  extra?: string;
}) {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();
  if (!spreadsheetId) return;

  try {
    const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
    const auth = new google.auth.GoogleAuth(
      keyFile ? { keyFile, scopes: [SHEETS_SCOPE] } : { scopes: [SHEETS_SCOPE] }
    );
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = '送出失敗記錄';
    const escapedSheetName = sheetName.replace(/'/g, "''");
    const headerRange = `'${escapedSheetName}'!A1:L1`;
    const appendRange = `'${escapedSheetName}'!A:L`;
    const expectedHeaders = [
      '提交時間', '失敗代碼', '失敗原因', '補充說明',
      'LINE 名稱', 'LINE ID', 'Email', '電話', 'OKX UID',
      'IP', 'User-Agent', '梯次',
    ] as const;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const hasSheet = (spreadsheet.data.sheets || []).some(
      (s) => s.properties?.title === sheetName
    );
    if (!hasSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
      });
    }

    const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
    const currentHeader = headerRes.data.values?.[0] ?? [];
    const shouldUpdate =
      currentHeader.length < expectedHeaders.length ||
      expectedHeaders.some((item, i) => String(currentHeader[i] ?? '') !== item);
    if (shouldUpdate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'RAW',
        requestBody: { values: [Array.from(expectedHeaders)] },
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: appendRange,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          new Date().toISOString(),
          params.code,
          params.reason,
          params.extra ?? '',
          params.data.lineName ?? '',
          params.data.lineId ?? '',
          params.data.email ?? '',
          params.data.phone ?? '',
          params.data.okxUid ?? '',
          params.ip,
          params.userAgent,
          params.data.batchId ? `${getBatchLabel(params.data.batchId)} (${params.data.batchId})` : '',
        ]],
      },
    });
  } catch (error) {
    console.error('append failure log failed', error);
  }
}

async function appendCaptchaFailureToSpreadsheet(params: {
  code: CaptchaFailureCode;
  data: SignupPayload;
  ip: string;
  userAgent: string;
  expectedHost: string;
  provider: ReturnType<typeof getCaptchaProvider>;
  captchaResult?: CaptchaResult;
}) {
  const spreadsheetId = (
    process.env.GOOGLE_SPREADSHEET_ID_CAPTCHA_FAILURES ||
    process.env.GOOGLE_SPREADSHEET_ID_FAILURES ||
    ''
  ).trim();
  if (!spreadsheetId) {
    console.warn('captcha failure logging skipped: GOOGLE_SPREADSHEET_ID_CAPTCHA_FAILURES is missing');
    return;
  }

  try {
    const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
    const auth = new google.auth.GoogleAuth(
      keyFile ? { keyFile, scopes: [SHEETS_SCOPE] } : { scopes: [SHEETS_SCOPE] }
    );
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = '驗證未通過名單';
    const escapedSheetName = sheetName.replace(/'/g, "''");
    const headerRange = `'${escapedSheetName}'!A1:S1`;
    const appendRange = `'${escapedSheetName}'!A:S`;
    const expectedHeaders = [
      '提交時間',
      '失敗代碼',
      '失敗原因',
      '驗證供應商',
      'score',
      'action',
      '預期 action',
      'hostname',
      '預期 hostname',
      'error-codes',
      'IP',
      'User-Agent',
      '梯次',
      'LINE 名稱',
      'LINE ID',
      'Email',
      '電話',
      'OKX UID',
      '投入金額(NTD)',
    ] as const;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const hasFailureSheet = (spreadsheet.data.sheets || []).some(
      (sheet) => sheet.properties?.title === sheetName
    );
    if (!hasFailureSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const currentHeader = headerRes.data.values?.[0] ?? [];
    const shouldUpdateHeader =
      currentHeader.length < expectedHeaders.length ||
      expectedHeaders.some((item, index) => String(currentHeader[index] ?? '') !== item);
    if (shouldUpdateHeader) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [Array.from(expectedHeaders)],
        },
      });
    }

    const now = new Date();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: appendRange,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          now.toISOString(),
          params.code,
          mapFailureReasonText(params.code),
          params.provider,
          params.captchaResult?.score ?? '',
          params.captchaResult?.action ?? '',
          EXPECTED_RECAPTCHA_ACTION,
          params.captchaResult?.hostname ?? '',
          normalizeHost(process.env.RECAPTCHA_EXPECTED_HOST || params.expectedHost),
          (params.captchaResult?.errorCodes || []).join(','),
          params.ip,
          params.userAgent,
          `${getBatchLabel(params.data.batchId)} (${params.data.batchId})`,
          params.data.lineName,
          params.data.lineId,
          params.data.email,
          params.data.phone,
          params.data.okxUid,
          params.data.budgetAmount,
        ]],
      },
    });
  } catch (error) {
    console.error('append captcha failure log failed', error);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent')?.trim() || 'unknown';

  if (!isSameOrigin(req)) {
    appendFailureToSpreadsheet({ code: 'FORBIDDEN_ORIGIN', reason: '請求來源不符合，疑似跨域攻擊', data: {}, ip, userAgent }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'FORBIDDEN_ORIGIN' }, { status: 403 });
  }

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    appendFailureToSpreadsheet({ code: 'BAD_CONTENT_TYPE', reason: '請求格式錯誤，非 JSON', data: {}, ip, userAgent, extra: contentType }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'BAD_CONTENT_TYPE' }, { status: 415 });
  }

  const acceptLanguage = req.headers.get('accept-language')?.trim() || 'unknown';
  const fingerprint = `${ip}::${userAgent.slice(0, 120)}::${acceptLanguage.slice(0, 80)}`;
  const now = Date.now();
  const count = markAndCount(ip, now);
  const fingerprintCount = markFingerprintAndCount(fingerprint, now);
  const globalCount = markGlobalAndCount(now);
  const captchaProvider = getCaptchaProvider();
  const hasCaptchaConfig =
    captchaProvider === 'recaptcha_enterprise'
      ? Boolean(
          (process.env.RECAPTCHA_ENTERPRISE_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '').trim() &&
            ((process.env.RECAPTCHA_ENTERPRISE_PROJECT_NUMBER || '').trim() ||
              (process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '').trim())
        )
      : Boolean((process.env.CAPTCHA_SECRET || '').trim());

  if (count > HARD_LIMIT_PER_WINDOW || fingerprintCount > HARD_LIMIT_PER_FINGERPRINT || globalCount > HARD_LIMIT_GLOBAL) {
    appendFailureToSpreadsheet({
      code: 'RATE_LIMITED',
      reason: `請求頻率超過限制`,
      data: {},
      ip,
      userAgent,
      extra: `IP次數:${count} 指紋次數:${fingerprintCount} 全域次數:${globalCount}`,
    }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'RATE_LIMITED' }, { status: 429 });
  }

  const rawBody = await req.json().catch(() => null);
  const validation = validatePayload(rawBody);
  if (!validation.ok) {
    const partial = (rawBody && typeof rawBody === 'object') ? rawBody as Partial<SignupPayload> : {};
    appendFailureToSpreadsheet({
      code: 'BAD_REQUEST',
      reason: `欄位驗證失敗：${validation.message}`,
      data: partial,
      ip,
      userAgent,
    }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: validation.message }, { status: 400 });
  }
  const courseType = inferCourseType(req, validation.data);

  if (validation.data.websiteUrl) {
    return NextResponse.json({ ok: true });
  }

  const suspiciousTraffic =
    count > SOFT_LIMIT_PER_WINDOW ||
    fingerprintCount > SOFT_LIMIT_PER_FINGERPRINT ||
    globalCount > SOFT_LIMIT_GLOBAL;
  const captchaEnforceMode = getCaptchaEnforceMode();
  const requireCaptcha = hasCaptchaConfig && (captchaEnforceMode === 'always' || suspiciousTraffic);

  if (!hasCaptchaConfig && suspiciousTraffic) {
    return NextResponse.json({ ok: false, code: 'RATE_LIMITED' }, { status: 429 });
  }

  if (hasCaptchaConfig) {
    const token = validation.data.captchaToken;
    if (!token) {
      if (requireCaptcha) {
        await appendCaptchaFailureToSpreadsheet({
          code: 'CAPTCHA_REQUIRED',
          data: validation.data,
          ip,
          userAgent,
          expectedHost: req.nextUrl.host,
          provider: captchaProvider,
        });
        return NextResponse.json({ ok: false, code: 'CAPTCHA_REQUIRED' }, { status: 429 });
      }
    } else if (!claimCaptchaToken(token, now)) {
      await appendCaptchaFailureToSpreadsheet({
        code: 'CAPTCHA_REPLAYED',
        data: validation.data,
        ip,
        userAgent,
        expectedHost: req.nextUrl.host,
        provider: captchaProvider,
      });
      if (requireCaptcha) {
        return NextResponse.json({ ok: false, code: 'CAPTCHA_REPLAYED' }, { status: 429 });
      }
    } else {
      const captchaCheck = await verifyCaptchaToken({
        token,
        ip,
        userAgent,
        expectedHost: req.nextUrl.host,
      });
      if (!captchaCheck.ok) {
        let failureCode: CaptchaFailureCode = 'CAPTCHA_INVALID';
        if (captchaCheck.reason === 'low_score') failureCode = 'CAPTCHA_LOW_SCORE';
        if (captchaCheck.reason === 'bad_action') failureCode = 'CAPTCHA_BAD_ACTION';
        if (captchaCheck.reason === 'bad_hostname') failureCode = 'CAPTCHA_BAD_HOSTNAME';
        await appendCaptchaFailureToSpreadsheet({
          code: failureCode,
          data: validation.data,
          ip,
          userAgent,
          expectedHost: req.nextUrl.host,
          provider: captchaProvider,
          captchaResult: captchaCheck,
        });
        if (requireCaptcha) {
          return NextResponse.json({ ok: false, code: failureCode }, { status: 429 });
        }
      }
    }
  }

  try {
    await appendSignupToSpreadsheet({
      data: validation.data,
      courseType,
      ip,
      userAgent,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      const status = error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500;
      appendFailureToSpreadsheet({
        code: error.code,
        reason: error.code === 'STORAGE_NOT_CONFIGURED' ? 'Google Sheets 未設定，資料未寫入' : `Google Sheets 寫入失敗：${error.message}`,
        data: validation.data,
        ip,
        userAgent,
      }).catch(() => {});
      return NextResponse.json({ ok: false, code: error.code }, { status });
    }
    appendFailureToSpreadsheet({
      code: 'STORAGE_WRITE_FAILED',
      reason: `Google Sheets 寫入例外：${String(error)}`,
      data: validation.data,
      ip,
      userAgent,
    }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'STORAGE_WRITE_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
