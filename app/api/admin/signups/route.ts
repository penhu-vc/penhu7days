import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { isAuthorizedAdminRequest, unauthorizedJson } from '@/lib/admin-auth';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export type SignupRow = {
  submittedAt: string;
  batch: string;
  courseType: string;
  lineName: string;
  lineId: string;
  email: string;
  phone: string;
  okxUid: string;
  knowledgeLevel: string;
  budgetAmount: string;
  ip: string;
  userAgent: string;
  source: string;
};

export type SignupsResponse = {
  ok: true;
  starter: SignupRow[];
  pro: SignupRow[];
  proV2: SignupRow[];
  spreadsheetId: string;
} | {
  ok: false;
  error: string;
};

async function readSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
): Promise<SignupRow[]> {
  try {
    const escapedName = sheetName.replace(/'/g, "''");
    const range = `'${escapedName}'!A:M`;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values ?? [];
    if (rows.length <= 1) return [];

    // Skip header row (index 0), map subsequent rows
    const dataRows = rows.slice(1);
    return dataRows.map((row): SignupRow => ({
      submittedAt: String(row[0] ?? ''),
      batch: String(row[1] ?? ''),
      courseType: String(row[2] ?? ''),
      lineName: String(row[3] ?? ''),
      lineId: String(row[4] ?? ''),
      email: String(row[5] ?? ''),
      phone: String(row[6] ?? ''),
      okxUid: String(row[7] ?? ''),
      knowledgeLevel: String(row[8] ?? ''),
      budgetAmount: String(row[9] ?? ''),
      ip: String(row[10] ?? ''),
      userAgent: String(row[11] ?? ''),
      source: String(row[12] ?? ''),
    }));
  } catch {
    // Sheet might not exist yet - return empty
    return [];
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return unauthorizedJson();
  }

  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();
  if (!spreadsheetId) {
    return NextResponse.json(
      { ok: false, error: 'GOOGLE_SPREADSHEET_ID is not configured' },
      { status: 503 }
    );
  }

  try {
    const keyFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
    const auth = new google.auth.GoogleAuth(
      keyFile ? { keyFile, scopes: [SHEETS_SCOPE] } : { scopes: [SHEETS_SCOPE] }
    );
    const sheets = google.sheets({ version: 'v4', auth });

    // Read all three sheet tabs in parallel
    const [starter, pro, proV2] = await Promise.all([
      readSheet(sheets, spreadsheetId, '成功報名_新手班'),
      readSheet(sheets, spreadsheetId, '成功報名_實戰班'),
      readSheet(sheets, spreadsheetId, '成功報名_實戰班v2'),
    ]);

    // Sort each dataset newest first
    const sortNewestFirst = (rows: SignupRow[]) =>
      [...rows].sort((a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });

    return NextResponse.json({
      ok: true,
      starter: sortNewestFirst(starter),
      pro: sortNewestFirst(pro),
      proV2: sortNewestFirst(proV2),
      spreadsheetId,
    } satisfies SignupsResponse);
  } catch (error) {
    console.error('admin signups fetch error', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
