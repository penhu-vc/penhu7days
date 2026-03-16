import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim();

    if (!spreadsheetId) {
      // 回傳預設資料（開發用）
      return NextResponse.json({
        milestones: getDefaultMilestones()
      });
    }

    // Google Sheets 驗證
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/yaja/projects/gcp-current.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 取得試算表資訊
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1';

    // 讀取資料
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:D`,
    });

    const rows = response.data.values;

    if (!rows || rows.length < 2) {
      return NextResponse.json({
        milestones: getDefaultMilestones()
      });
    }

    // 跳過標題列，解析資料
    const milestones = rows.slice(1).map((row) => ({
      title: row[0] || '',
      description: row[1] || '',
      status: (row[2]?.toLowerCase() === 'done' ? 'done' : 'pending') as 'done' | 'pending',
      order: parseInt(row[3]) || 0,
    }));

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('Error fetching progress:', error);
    // 錯誤時回傳預設資料
    return NextResponse.json({
      milestones: getDefaultMilestones()
    });
  }
}

function getDefaultMilestones() {
  return [
    {
      title: 'Day 1 - 開戶教學',
      description: '完成交易所註冊（OKX / Bybit）\n完成 KYC 身份驗證\n設定雙重驗證 (2FA)',
      status: 'pending' as const,
      order: 1,
    },
    {
      title: 'Day 2 - 入金指南',
      description: '學習 C2C 入金方式\n了解 USDT 穩定幣\n完成首次入金',
      status: 'pending' as const,
      order: 2,
    },
    {
      title: 'Day 3 - 現貨交易基礎',
      description: '認識交易介面\n學習限價單/市價單\n完成首筆現貨交易',
      status: 'pending' as const,
      order: 3,
    },
    {
      title: 'Day 4 - K線圖入門',
      description: '學習 K 線基礎形態\n認識支撐與阻力\n了解成交量指標',
      status: 'pending' as const,
      order: 4,
    },
    {
      title: 'Day 5 - 合約交易入門',
      description: '了解槓桿原理\n認識全倉/逐倉模式\n學習設定止損止盈',
      status: 'pending' as const,
      order: 5,
    },
    {
      title: 'Day 6 - 風險管理',
      description: '學習倉位管理\n設定每日止損\n建立交易紀錄習慣',
      status: 'pending' as const,
      order: 6,
    },
    {
      title: 'Day 7 - 結業測驗',
      description: '完成線上測驗\n加入交易群組\n獲得結業證書',
      status: 'pending' as const,
      order: 7,
    },
  ];
}
