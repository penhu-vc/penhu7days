import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function isAuthorized(req: NextRequest): boolean {
  const token = (process.env.API_TOKEN || process.env.ADMIN_TOKEN || '').trim();
  if (!token) return false;
  const header = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '') || '';
  return header === token;
}

async function readSheet(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return [];
    const headers = rows[0].map((h: string) => String(h).trim());
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim(); });
      return obj;
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();
  if (!spreadsheetId) {
    return NextResponse.json({ ok: false, error: 'not configured' }, { status: 503 });
  }

  const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  const auth = new google.auth.GoogleAuth(
    keyFile ? { keyFile, scopes: [SHEETS_SCOPE] } : { scopes: [SHEETS_SCOPE] }
  );
  const sheets = google.sheets({ version: 'v4', auth });

  const variant = req.nextUrl.searchParams.get('variant'); // starter | prov2 | all
  const sheetMap: Record<string, string> = {
    starter: '成功報名_新手班',
    prov2: '成功報名_實戰班v2',
    pro: '成功報名_實戰班',
  };

  if (variant && sheetMap[variant]) {
    const rows = await readSheet(sheets, spreadsheetId, sheetMap[variant]);
    return NextResponse.json({ ok: true, variant, total: rows.length, data: rows });
  }

  const [starter, pro, prov2] = await Promise.all([
    readSheet(sheets, spreadsheetId, '成功報名_新手班'),
    readSheet(sheets, spreadsheetId, '成功報名_實戰班'),
    readSheet(sheets, spreadsheetId, '成功報名_實戰班v2'),
  ]);

  return NextResponse.json({
    ok: true,
    total: starter.length + pro.length + prov2.length,
    starter: { total: starter.length, data: starter },
    pro: { total: pro.length, data: pro },
    prov2: { total: prov2.length, data: prov2 },
  });
}
