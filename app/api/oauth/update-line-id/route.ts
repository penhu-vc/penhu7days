import { NextRequest, NextResponse } from 'next/server';

const MEMBER_BASE = 'https://member.penhu.xyz';
const API_KEY = process.env.PENHU_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // 取得 OAuth session
    const sessionCookie = req.cookies.get('penhu_oauth_user')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString()) as {
      id: number;
      name: string;
      shortCode: string;
      email: string;
      role: string;
      accessToken: string;
    };

    const { lineName, lineId, phone, knowledgeLevel, budgetAmount } = await req.json() as {
      lineName?: string;
      lineId: string;
      phone?: string;
      knowledgeLevel?: number;
      budgetAmount?: number;
    };

    if (!lineId || typeof lineId !== 'string' || !lineId.trim()) {
      return NextResponse.json({ error: 'Invalid lineId' }, { status: 400 });
    }

    if (!API_KEY) {
      console.error('[update-line-id] PENHU_API_KEY not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // 先取得會員目前資料，檢查是否已有電話
    const getMemberRes = await fetch(`${MEMBER_BASE}/api/members/${session.shortCode}`, {
      headers: { 'X-API-Key': API_KEY },
    });

    let hasPhone = false;
    if (getMemberRes.ok) {
      const memberData = await getMemberRes.json() as {
        success: boolean;
        data: { phone?: string | null };
      };
      hasPhone = !!memberData.data?.phone;
    }

    // 呼叫 member.penhu.xyz API 更新會員資料
    // 使用專門的 lineId 欄位儲存 LINE ID
    const updatePayload: Record<string, string | number> = {
      lineId: lineId.trim(),
    };

    // 如果會員沒有電話，且報名表有填電話，就更新
    if (!hasPhone && phone && typeof phone === 'string' && phone.trim()) {
      updatePayload.phone = phone.trim();
    }

    // 組合 notes 內容：LINE 名稱 + 了解程度 + 投入金額
    const notesLines: string[] = [];

    if (lineName && typeof lineName === 'string' && lineName.trim()) {
      notesLines.push(`LINE 名稱: ${lineName.trim()}`);
    }

    if (typeof knowledgeLevel === 'number') {
      const levelMap: Record<number, string> = {
        1: '完全新手',
        2: '剛入門',
        3: '略有所聞',
        4: '有操作過',
        5: '具備基礎',
      };
      notesLines.push(`了解程度: ${levelMap[knowledgeLevel] || knowledgeLevel}`);
    }

    if (typeof budgetAmount === 'number') {
      notesLines.push(`投入金額: NT$ ${budgetAmount.toLocaleString()}`);
    }

    if (notesLines.length > 0) {
      updatePayload.notes = notesLines.join('\n');
    }

    const updateRes = await fetch(`${MEMBER_BASE}/api/members/${session.shortCode}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error('[update-line-id] Failed to update member:', updateRes.status, errorText);
      return NextResponse.json({ error: 'Failed to update member' }, { status: updateRes.status });
    }

    const result = await updateRes.json();
    return NextResponse.json({ success: true, data: result });

  } catch (err) {
    console.error('[update-line-id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
