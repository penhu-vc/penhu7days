'use client';

import { useState } from 'react';

const SITE = 'https://penhu.xyz';

const endpoints = [
  {
    id: 'signups-all',
    label: '所有報名資料',
    method: 'GET',
    path: '/api/v1/signups',
    desc: '回傳新手班、實戰班、實戰班v2 的所有報名記錄。',
    params: [],
    example: `curl "${SITE}/api/v1/signups" \\
  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{
  "ok": true,
  "total": 78,
  "starter": { "total": 75, "data": [...] },
  "pro":     { "total": 0,  "data": [] },
  "prov2":   { "total": 3,  "data": [...] }
}`,
  },
  {
    id: 'signups-starter',
    label: '新手陪跑班報名',
    method: 'GET',
    path: '/api/v1/signups?variant=starter',
    desc: '只回傳新手陪跑班報名資料。',
    params: [{ name: 'variant', values: 'starter | prov2 | pro', note: '指定課程類型' }],
    example: `curl "${SITE}/api/v1/signups?variant=starter" \\
  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{
  "ok": true,
  "variant": "starter",
  "total": 75,
  "data": [
    {
      "提交時間": "2026-03-09T05:49:...",
      "梯次": "第三梯 (batch-3)",
      "LINE 名稱": "Barry",
      "LINE ID": "barry920631",
      "Email": "a0958782018@gmail.com",
      "電話": "0958782018",
      "OKX UID": "81637905...",
      "了解程度": "1 - 完全新手",
      "投入金額(NTD)": "10000",
      "來源": "penhu7days-web"
    }
  ]
}`,
  },
  {
    id: 'signups-prov2',
    label: '7天實戰班報名',
    method: 'GET',
    path: '/api/v1/signups?variant=prov2',
    desc: '只回傳 7天實戰班 v2 報名資料。',
    params: [],
    example: `curl "${SITE}/api/v1/signups?variant=prov2" \\
  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{
  "ok": true,
  "variant": "prov2",
  "total": 3,
  "data": [...]
}`,
  },
  {
    id: 'batches-public',
    label: '梯次列表（公開）',
    method: 'GET',
    path: '/api/batches',
    desc: '公開梯次資料，不需認證。回傳各梯次的完整日期資訊（開課、結課、開始報名、截止報名）。',
    params: [{ name: 'variant', values: 'starter（預設）| prov2', note: '指定課程類型' }],
    example: `curl "${SITE}/api/batches?variant=starter"`,
    response: `{
  "batches": [
    {
      "id": "batch-3",
      "label": "第三梯",
      "date": "4/6 - 4/12",
      "courseStart": "2026-04-06",   // 開課日
      "courseEnd":   "2026-04-12",   // 結課日
      "signupOpen":  "2026-03-20",   // 開始報名日（null = 一直開放）
      "deadline":    "2026-04-05",   // 截止報名日
      "enabled": true,               // false = 已截止或已結束
      "status": "已開放"             // "已開放" | "報名截止" | "已結束"
    }
  ]
}`,
  },
  {
    id: 'batches',
    label: '梯次原始設定（管理用）',
    method: 'GET',
    path: '/api/v1/batches',
    desc: '回傳新手班與實戰班的梯次原始設定（含 endDateIso）。需要 Admin Token。',
    params: [],
    example: `curl "${SITE}/api/v1/batches" \\
  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{
  "ok": true,
  "starter": {
    "batches": [
      { "id": "batch-1", "label": "第一梯", "courseDate": "3/9 - 3/15",  "endDateIso": "2026-03-08" },
      { "id": "batch-2", "label": "第二梯", "courseDate": "3/23 - 3/29", "endDateIso": "2026-03-22" },
      { "id": "batch-3", "label": "第三梯", "courseDate": "4/6 - 4/12",  "endDateIso": "2026-04-05" }
    ]
  },
  "prov2": {
    "batches": [
      { "id": "batch-1", "label": "第一梯", "courseDate": "3/16 - 3/22", "endDateIso": "2026-03-15" },
      { "id": "batch-2", "label": "第二梯", "courseDate": "3/30 - 4/5",  "endDateIso": "2026-03-29" },
      { "id": "batch-3", "label": "第三梯", "courseDate": "4/13 - 4/19", "endDateIso": "2026-04-12" }
    ]
  }
}`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        position: 'absolute', top: 8, right: 8,
        padding: '3px 10px', fontSize: '0.72rem',
        background: copied ? '#16a34a' : '#3b3b5c',
        color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {copied ? '✓ 已複製' : '複製'}
    </button>
  );
}

export default function ApiDocsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', color: '#e2e0f0', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>📡 PENHU API 文件</h1>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 24 }}>
        Base URL: <code style={{ color: '#a78bfa' }}>{SITE}</code>
        　　認證: <code style={{ color: '#a78bfa' }}>x-api-key: ADMIN_TOKEN</code>
        （也支援 <code style={{ color: '#a78bfa' }}>Authorization: Bearer TOKEN</code>）
      </p>

      <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: '14px 18px', marginBottom: 28 }}>
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 6 }}>🔑 取得你的 API Token（後台設定頁面複製 ADMIN_TOKEN）</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/網頁管理" style={{ padding: '6px 14px', background: '#7c3aed', color: '#fff', borderRadius: 6, fontSize: '0.82rem', textDecoration: 'none' }}>
            → 前往後台取得 Token
          </a>
        </div>
      </div>

      {endpoints.map((ep) => (
        <div key={ep.id} style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #2a2a4a' }}>
            <span style={{ background: '#166534', color: '#4ade80', padding: '2px 8px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 700 }}>
              {ep.method}
            </span>
            <code style={{ color: '#a78bfa', fontSize: '0.9rem' }}>{ep.path}</code>
            <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{ep.label}</span>
          </div>
          <div style={{ padding: '12px 18px' }}>
            <p style={{ color: '#aaa', fontSize: '0.83rem', margin: '0 0 12px' }}>{ep.desc}</p>

            {ep.params.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>Query Params</div>
                {ep.params.map((p) => (
                  <div key={p.name} style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: '#ccc' }}>
                    <code style={{ color: '#fbbf24' }}>{p.name}</code>
                    <span style={{ color: '#60a5fa' }}>{p.values}</span>
                    <span style={{ color: '#888' }}>{p.note}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>範例指令</div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <pre style={{ background: '#0d0d1a', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#e2e0f0', margin: 0, overflowX: 'auto', paddingRight: 70 }}>
                {ep.example}
              </pre>
              <CopyButton text={ep.example} />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>回傳格式</div>
            <div style={{ position: 'relative' }}>
              <pre style={{ background: '#0d0d1a', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: '#86efac', margin: 0, overflowX: 'auto', paddingRight: 70 }}>
                {ep.response}
              </pre>
              <CopyButton text={ep.response} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
