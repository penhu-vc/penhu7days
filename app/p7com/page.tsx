'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { SignupRow, SignupsResponse } from '../api/admin/signups/route';
import type { BatchAdmin } from '../api/batches/route';
import type { ProdVersionResponse } from '../api/admin/prod-version/route';

const SITE_LINKS = [
  { label: '新手班', url: 'https://penhu.xyz', variant: 'starter' },
  { label: '實戰班', url: 'https://penhu.xyz/pro', variant: 'prov2' },
] as const;

type MainTab = 'signups' | 'batches' | 'apidocs';
type SignupTab = 'starter' | 'proV2';

const SIGNUP_TAB_LABELS: Record<SignupTab, string> = {
  starter: '新手陪跑班',
  proV2: '7天實戰班 v2',
};

const COL_LABELS: { key: keyof SignupRow; label: string; width?: string }[] = [
  { key: 'submittedAt', label: '報名時間', width: '140px' },
  { key: 'lineName', label: 'Line 名稱', width: '110px' },
  { key: 'lineId', label: 'Line ID', width: '110px' },
  { key: 'phone', label: '電話', width: '110px' },
  { key: 'email', label: 'Email', width: '160px' },
  { key: 'okxUid', label: 'OKX UID', width: '110px' },
  { key: 'budgetAmount', label: '預算', width: '90px' },
  { key: 'source', label: '來源', width: '90px' },
];

function formatDate(str: string): string {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString('zh-TW', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  } catch {
    return str;
  }
}

const COPYABLE_COLS: (keyof SignupRow)[] = ['lineName', 'lineId', 'phone', 'email', 'okxUid'];

function CellValue({ colKey, value }: { colKey: keyof SignupRow; value: string }) {
  const [copied, setCopied] = React.useState(false);
  const isCopyable = COPYABLE_COLS.includes(colKey);

  if (!value) return <span style={{ color: '#666' }}>—</span>;
  if (colKey === 'submittedAt') return <>{formatDate(value)}</>;

  if (isCopyable) {
    const handleCopy = () => {
      const doCopy = async () => {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const el = document.createElement('textarea');
          el.value = value;
          el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(el);
          el.focus(); el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      };
      doCopy().catch(() => {});
    };
    return (
      <span
        onClick={handleCopy}
        title="點擊複製"
        style={{
          cursor: 'pointer',
          fontSize: colKey === 'email' || colKey === 'lineId' ? '0.82em' : undefined,
          wordBreak: 'break-all',
          textDecoration: copied ? 'none' : 'underline',
          textDecorationStyle: 'dashed' as React.CSSProperties['textDecorationStyle'],
          textDecorationColor: 'rgba(167,139,250,0.5)',
          textUnderlineOffset: '3px',
          color: copied ? '#34d399' : undefined,
          transition: 'color 0.2s',
          userSelect: 'none',
        }}
      >
        {copied ? '✓ 已複製' : value}
      </span>
    );
  }

  return <>{value}</>;
}

function StatBadge({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10,
      padding: '8px 20px', minWidth: 80,
    }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa' }}>{count}</span>
      <span style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ── Batch Manager ────────────────────────────────────────────────────────────

type BatchVariant = 'starter' | 'prov2';

type DraftBatch = {
  id: string;
  label: string;
  courseStartIso: string; // YYYY-MM-DD
  courseEndIso: string;   // YYYY-MM-DD
  endDateIso: string;     // YYYY-MM-DD (signup close)
  forceShow: boolean;
};

// Parse "03/09 - 03/15" or "3/16 - 3/22" → { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
function parseCourseDate(courseDate: string, fallbackYear = 2026): { start: string; end: string } {
  const parts = courseDate.split('-').map(s => s.trim());
  if (parts.length < 2) return { start: '', end: '' };
  const toIso = (s: string) => {
    const [m, d] = s.split('/');
    if (!m || !d) return '';
    return `${fallbackYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };
  return { start: toIso(parts[0]), end: toIso(parts[1]) };
}

// Format two YYYY-MM-DD dates → "MM/DD - MM/DD"
function formatCourseDate(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${parseInt(m)}/${parseInt(d)}`;
  };
  return `${fmt(startIso)} - ${fmt(endIso)}`;
}

function emptyDraft(nextNum: number): DraftBatch {
  return { id: `batch-${nextNum}`, label: `第${nextNum}梯`, courseStartIso: '', courseEndIso: '', endDateIso: '', forceShow: false };
}

function BatchManager() {
  const [variant, setVariant] = useState<BatchVariant>('starter');
  const [batches, setBatches] = useState<BatchAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<DraftBatch | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<DraftBatch>(emptyDraft(1));

  const fetchBatches = useCallback(async (v: BatchVariant) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/batches?variant=${v}&mode=admin`);
      const json = await res.json();
      setBatches(json.batches ?? []);
    } catch {
      setMsg({ type: 'err', text: '載入失敗' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBatches(variant); }, [variant, fetchBatches]);

  function draftToApiShape(d: DraftBatch) {
    return {
      id: d.id,
      label: d.label,
      courseDate: formatCourseDate(d.courseStartIso, d.courseEndIso),
      endDateIso: d.endDateIso,
      forceShow: d.forceShow,
    };
  }

  async function saveBatches(updated: DraftBatch[]) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/p7com/save-batches?variant=${variant}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches: updated.map(draftToApiShape) }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ type: 'ok', text: '已儲存並同步到網站' });
        await fetchBatches(variant);
      } else {
        setMsg({ type: 'err', text: json.message || '儲存失敗' });
      }
    } catch {
      setMsg({ type: 'err', text: '網路錯誤' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(b: BatchAdmin) {
    const { start, end } = parseCourseDate(b.date);
    setEditing({ id: b.id, label: b.label, courseStartIso: start, courseEndIso: end, endDateIso: b.endDateIso, forceShow: b.forceShow ?? false });
    setAddingNew(false);
  }

  function cancelEdit() { setEditing(null); }

  async function commitEdit() {
    if (!editing) return;
    const updated = batches.map(b => b.id === editing.id
      ? editing
      : { id: b.id, label: b.label, courseStartIso: parseCourseDate(b.date).start, courseEndIso: parseCourseDate(b.date).end, endDateIso: b.endDateIso, forceShow: b.forceShow ?? false });
    await saveBatches(updated);
    setEditing(null);
  }

  function startAdd() {
    const nextNum = batches.length + 1;
    setNewDraft(emptyDraft(nextNum));
    setAddingNew(true);
    setEditing(null);
  }

  async function commitAdd() {
    const existing = batches.map(b => {
      const { start, end } = parseCourseDate(b.date);
      return { id: b.id, label: b.label, courseStartIso: start, courseEndIso: end, endDateIso: b.endDateIso, forceShow: b.forceShow ?? false };
    });
    await saveBatches([...existing, newDraft]);
    setAddingNew(false);
  }

  async function toggleForceShow(b: BatchAdmin) {
    if (b.isShownByRules && b.forceShow) return;
    const updated = batches.map(x => {
      const { start, end } = parseCourseDate(x.date);
      return { id: x.id, label: x.label, courseStartIso: start, courseEndIso: end, endDateIso: x.endDateIso, forceShow: x.id === b.id ? !x.forceShow : (x.forceShow ?? false) };
    });
    await saveBatches(updated);
  }

  const statusColor = (b: BatchAdmin) => {
    if (b.status === '已開放') return '#34d399';
    if (b.status === '報名截止') return '#f59e0b';
    return '#6b7280';
  };

  const S = {
    card: {
      background: '#0f0f20', border: '1px solid #1e1e3a', borderRadius: 10,
      padding: '14px 16px', marginBottom: 10,
    } as React.CSSProperties,
    row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const },
    label: { color: '#888', fontSize: '0.75rem', marginBottom: 3 } as React.CSSProperties,
    input: {
      background: '#111124', border: '1px solid #2a2a4a', color: '#e0e0e0',
      borderRadius: 7, padding: '6px 10px', fontSize: '0.85rem', outline: 'none',
    } as React.CSSProperties,
    btn: (color: string) => ({
      background: color, border: 'none', color: '#fff', borderRadius: 7,
      padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
    } as React.CSSProperties),
    ghost: {
      background: '#1a1a3a', border: '1px solid #2a2a4a', color: '#a78bfa',
      borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
    } as React.CSSProperties,
  };

  return (
    <div>
      {/* Variant selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['starter', 'prov2'] as BatchVariant[]).map(v => (
          <button key={v} onClick={() => { setVariant(v); setEditing(null); setAddingNew(false); }}
            style={{ ...S.btn(variant === v ? '#7c3aed' : '#1a1a3a'), border: variant === v ? 'none' : '1px solid #2a2a4a', color: variant === v ? '#fff' : '#888' }}>
            {v === 'starter' ? '新手陪跑班' : '7天實戰班'}
          </button>
        ))}
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          marginBottom: 12, padding: '9px 14px', borderRadius: 8, fontSize: '0.85rem',
          background: msg.type === 'ok' ? '#0d2a1a' : '#2a0a0a',
          border: `1px solid ${msg.type === 'ok' ? '#1a5a2a' : '#5a1a1a'}`,
          color: msg.type === 'ok' ? '#34d399' : '#ff6b6b',
        }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#555', padding: 24 }}>載入中…</div>
      ) : (
        <>
          {/* Batch list */}
          {batches.map(b => (
            <div key={b.id} style={S.card}>
              {editing?.id === b.id ? (
                /* ── Edit mode ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={S.row}>
                    <div>
                      <div style={S.label}>梯次 ID</div>
                      <input style={{ ...S.input, width: 90 }} value={editing.id} disabled />
                    </div>
                    <div>
                      <div style={S.label}>名稱</div>
                      <input style={{ ...S.input, width: 80 }} value={editing.label}
                        onChange={e => setEditing({ ...editing, label: e.target.value })} />
                    </div>
                    <div>
                      <div style={S.label}>上課開始日</div>
                      <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={editing.courseStartIso}
                        onChange={e => setEditing({ ...editing, courseStartIso: e.target.value })} />
                    </div>
                    <div>
                      <div style={S.label}>上課結束日</div>
                      <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={editing.courseEndIso}
                        onChange={e => setEditing({ ...editing, courseEndIso: e.target.value })} />
                    </div>
                    <div>
                      <div style={S.label}>報名截止日</div>
                      <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={editing.endDateIso}
                        onChange={e => setEditing({ ...editing, endDateIso: e.target.value })} />
                    </div>
                  </div>
                  <div style={S.row}>
                    <button style={S.btn('#7c3aed')} onClick={commitEdit} disabled={saving}>
                      {saving ? '儲存中…' : '✓ 確認儲存'}
                    </button>
                    <button style={S.ghost} onClick={cancelEdit}>取消</button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700, minWidth: 56 }}>{b.label}</span>
                  <span style={{ color: '#ccc', fontSize: '0.85rem', minWidth: 110 }}>{b.date}</span>
                  <span style={{ fontSize: '0.78rem', color: '#666', minWidth: 110 }}>截止：{b.endDateIso}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: statusColor(b), minWidth: 60 }}>{b.status}</span>

                  {/* ForceShow toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: b.isShownByRules ? 'default' : 'pointer', fontSize: '0.8rem', color: '#888' }}>
                    <input type="checkbox" checked={b.forceShow ?? false}
                      disabled={b.isShownByRules && !b.forceShow}
                      onChange={() => toggleForceShow(b)}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    強制顯示
                    {b.isShownByRules && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399' }}>(已自動顯示)</span>
                    )}
                  </label>

                  {/* Lock notice: can't hide if already shown by rules */}
                  {b.isShownByRules && (
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', background: '#1a1a2e', borderRadius: 5, padding: '2px 7px' }}>
                      🔒 已顯示，無法隱藏
                    </span>
                  )}

                  <button style={{ ...S.ghost, marginLeft: 'auto' }} onClick={() => startEdit(b)}>編輯</button>
                </div>
              )}
            </div>
          ))}

          {/* Add new batch */}
          {addingNew ? (
            <div style={{ ...S.card, borderColor: '#3a2a6a' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 10 }}>+ 新增梯次</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={S.row}>
                  <div>
                    <div style={S.label}>梯次 ID</div>
                    <input style={{ ...S.input, width: 90 }} value={newDraft.id}
                      onChange={e => setNewDraft({ ...newDraft, id: e.target.value })} />
                  </div>
                  <div>
                    <div style={S.label}>名稱</div>
                    <input style={{ ...S.input, width: 80 }} value={newDraft.label}
                      onChange={e => setNewDraft({ ...newDraft, label: e.target.value })} />
                  </div>
                  <div>
                    <div style={S.label}>上課開始日</div>
                    <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={newDraft.courseStartIso}
                      onChange={e => setNewDraft({ ...newDraft, courseStartIso: e.target.value })} />
                  </div>
                  <div>
                    <div style={S.label}>上課結束日</div>
                    <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={newDraft.courseEndIso}
                      onChange={e => setNewDraft({ ...newDraft, courseEndIso: e.target.value })} />
                  </div>
                  <div>
                    <div style={S.label}>報名截止日</div>
                    <input type="date" style={{ ...S.input, width: 140, colorScheme: 'dark' }} value={newDraft.endDateIso}
                      onChange={e => setNewDraft({ ...newDraft, endDateIso: e.target.value })} />
                  </div>
                </div>
                <div style={S.row}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#888', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newDraft.forceShow}
                      onChange={e => setNewDraft({ ...newDraft, forceShow: e.target.checked })}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    強制顯示（不等日期規則）
                  </label>
                </div>
                <div style={S.row}>
                  <button style={S.btn('#7c3aed')} onClick={commitAdd} disabled={saving}>
                    {saving ? '儲存中…' : '✓ 新增並儲存'}
                  </button>
                  <button style={S.ghost} onClick={() => setAddingNew(false)}>取消</button>
                </div>
              </div>
            </div>
          ) : (
            <button style={{ ...S.ghost, width: '100%', justifyContent: 'center', display: 'flex', marginTop: 4 }} onClick={startAdd}>
              + 新增梯次
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── API Docs Panel ────────────────────────────────────────────────────────────

const SITE = 'https://penhu.xyz';

const API_ENDPOINTS = [
  {
    id: 'signups-all',
    label: '所有報名資料',
    method: 'GET',
    path: '/api/v1/signups',
    desc: '回傳新手班、實戰班、實戰班v2 的所有報名記錄。',
    params: [],
    example: `curl "${SITE}/api/v1/signups" \\\n  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{\n  "ok": true,\n  "total": 78,\n  "starter": { "total": 75, "data": [...] },\n  "pro":     { "total": 0,  "data": [] },\n  "prov2":   { "total": 3,  "data": [...] }\n}`,
  },
  {
    id: 'signups-starter',
    label: '新手陪跑班報名',
    method: 'GET',
    path: '/api/v1/signups?variant=starter',
    desc: '只回傳新手陪跑班報名資料。',
    params: [{ name: 'variant', values: 'starter | prov2 | pro', note: '指定課程類型' }],
    example: `curl "${SITE}/api/v1/signups?variant=starter" \\\n  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{\n  "ok": true,\n  "variant": "starter",\n  "total": 75,\n  "data": [...]\n}`,
  },
  {
    id: 'signups-prov2',
    label: '7天實戰班報名',
    method: 'GET',
    path: '/api/v1/signups?variant=prov2',
    desc: '只回傳 7天實戰班 v2 報名資料。',
    params: [],
    example: `curl "${SITE}/api/v1/signups?variant=prov2" \\\n  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{\n  "ok": true,\n  "variant": "prov2",\n  "total": 3,\n  "data": [...]\n}`,
  },
  {
    id: 'batches-public',
    label: '梯次列表（公開）',
    method: 'GET',
    path: '/api/batches',
    desc: '公開梯次資料，不需認證。含完整日期：開課日、結課日、開始報名日、截止報名日。',
    params: [{ name: 'variant', values: 'starter（預設）| prov2', note: '指定課程類型' }],
    example: `curl "${SITE}/api/batches?variant=starter"`,
    response: `{\n  "batches": [\n    {\n      "id": "batch-3",\n      "label": "第三梯",\n      "date": "4/6 - 4/12",\n      "courseStart": "2026-04-06",\n      "courseEnd":   "2026-04-12",\n      "signupOpen":  "2026-03-20",\n      "deadline":    "2026-04-05",\n      "enabled": true,\n      "status": "已開放"\n    }\n  ]\n}`,
  },
  {
    id: 'batches-admin',
    label: '梯次原始設定（管理用）',
    method: 'GET',
    path: '/api/v1/batches',
    desc: '回傳新手班與實戰班的梯次原始設定，需要 Admin Token。',
    params: [],
    example: `curl "${SITE}/api/v1/batches" \\\n  -H "x-api-key: YOUR_ADMIN_TOKEN"`,
    response: `{\n  "ok": true,\n  "starter": {\n    "batches": [\n      { "id": "batch-3", "label": "第三梯", "courseDate": "4/6 - 4/12", "endDateIso": "2026-04-05" }\n    ]\n  },\n  "prov2": {\n    "batches": [\n      { "id": "batch-3", "label": "第三梯", "courseDate": "4/13 - 4/19", "endDateIso": "2026-04-12" }\n    ]\n  }\n}`,
  },
];

/** 通用複製，回傳 true = 成功 */
function universalCopy(text: string): boolean {
  // 先試 execCommand（不需要 permission，iframe 也可用）
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    if (ok) return true;
  } catch { /* fallthrough */ }
  return false;
}

/** 彈出框顯示可手動複製的文字 */
function showCopyModal(text: string) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:#1a1a2e;border:1px solid #7c3aed;border-radius:12px;padding:20px;max-width:90vw;max-height:70vh;display:flex;flex-direction:column;gap:10px';
  const title = document.createElement('p');
  title.textContent = '自動複製失敗，請手動全選後複製（Ctrl+A → Ctrl+C）';
  title.style.cssText = 'color:#f87171;margin:0;font-size:0.85rem';
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'width:60vw;height:50vh;background:#0d0d1a;color:#86efac;border:1px solid #3b3b5c;border-radius:6px;padding:10px;font-size:0.75rem;resize:none';
  ta.readOnly = true;
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ 關閉';
  closeBtn.style.cssText = 'align-self:flex-end;padding:6px 16px;background:#7c3aed;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
  box.append(title, ta, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  ta.focus();
  ta.select();
}

function CopyBtn({ text }: { text: string }) {
  const [state, setState] = React.useState<'idle'|'ok'|'fail'>('idle');
  return (
    <button
      onClick={async () => {
        let ok = universalCopy(text);
        if (!ok) {
          try {
            await navigator.clipboard.writeText(text);
            ok = true;
          } catch { /* fail */ }
        }
        if (ok) {
          setState('ok');
          setTimeout(() => setState('idle'), 1500);
        } else {
          showCopyModal(text);
          setState('fail');
          setTimeout(() => setState('idle'), 2000);
        }
      }}
      style={{
        position: 'absolute', top: 8, right: 8,
        padding: '3px 10px', fontSize: '0.72rem',
        background: state === 'ok' ? '#16a34a' : state === 'fail' ? '#dc2626' : '#3b3b5c',
        color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {state === 'ok' ? '✓ 已複製' : state === 'fail' ? '手動複製↑' : '複製'}
    </button>
  );
}

function ApiDocsPanel() {
  const [copiedAll, setCopiedAll] = React.useState<'idle'|'ok'|'fail'>('idle');
  const [token, setToken] = React.useState<string>('');
  const [tokenVisible, setTokenVisible] = React.useState(false);
  const [tokenCopied, setTokenCopied] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then((d: { token?: string }) => { if (d.token) setToken(d.token); })
      .catch(() => {});
  }, []);

  function resolveExample(example: string) {
    return token ? example.replace(/YOUR_ADMIN_TOKEN/g, token) : example;
  }

  async function copyAll() {
    const text = API_ENDPOINTS.map(ep =>
      `## ${ep.label}\n${ep.method} ${SITE}${ep.path}\n\n範例:\n${resolveExample(ep.example)}\n\n回傳:\n${ep.response}`
    ).join('\n\n---\n\n');
    let ok = universalCopy(text);
    if (!ok) {
      try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fail */ }
    }
    if (ok) {
      setCopiedAll('ok');
    } else {
      showCopyModal(text);
      setCopiedAll('fail');
    }
    setTimeout(() => setCopiedAll('idle'), 1800);
  }

  return (
    <div style={{ color: '#e2e0f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
          Base URL: <code style={{ color: '#a78bfa' }}>{SITE}</code>
          {'　　'}認證: <code style={{ color: '#a78bfa' }}>x-api-key: ADMIN_TOKEN</code>
        </p>
        <button
          onClick={copyAll}
          style={{
            padding: '6px 16px', fontSize: '0.82rem',
            background: copiedAll === 'ok' ? '#16a34a' : copiedAll === 'fail' ? '#dc2626' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
            fontWeight: 600, whiteSpace: 'nowrap', transition: 'background 0.2s',
          }}
        >
          {copiedAll === 'ok' ? '✓ 已複製全部' : copiedAll === 'fail' ? '❌ 複製失敗，請手動複製' : '📋 一鍵複製全部'}
        </button>
      </div>

      {/* Token 顯示區 */}
      <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: '14px 18px', marginBottom: 28 }}>
        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 8 }}>🔑 你的 ADMIN_TOKEN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{
            flex: 1, background: '#0d0d1a', border: '1px solid #3b3b5c', borderRadius: 6,
            padding: '7px 12px', fontSize: '0.82rem', color: '#a78bfa',
            letterSpacing: tokenVisible ? '0.02em' : '0.15em',
            filter: tokenVisible ? 'none' : 'blur(4px)',
            transition: 'filter 0.2s', userSelect: tokenVisible ? 'text' : 'none',
            minHeight: 32, display: 'flex', alignItems: 'center',
          }}>
            {token || '載入中…'}
          </code>
          <button
            onClick={() => setTokenVisible(v => !v)}
            style={{ padding: '6px 12px', background: '#2a2a4a', border: '1px solid #3b3b5c', borderRadius: 6, color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {tokenVisible ? '🙈 隱藏' : '👁 顯示'}
          </button>
          <button
            onClick={async () => {
              let ok = universalCopy(token);
              if (!ok) { try { await navigator.clipboard.writeText(token); ok = true; } catch { /* */ } }
              if (ok) { setTokenCopied(true); setTimeout(() => setTokenCopied(false), 1500); }
            }}
            style={{ padding: '6px 12px', background: tokenCopied ? '#16a34a' : '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
          >
            {tokenCopied ? '✓ 已複製' : '複製 Token'}
          </button>
        </div>
      </div>

      {API_ENDPOINTS.map((ep) => (
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
                {resolveExample(ep.example)}
              </pre>
              <CopyBtn text={resolveExample(ep.example)} />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>回傳格式</div>
            <div style={{ position: 'relative' }}>
              <pre style={{ background: '#0d0d1a', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: '#86efac', margin: 0, overflowX: 'auto', paddingRight: 70 }}>
                {ep.response}
              </pre>
              <CopyBtn text={ep.response} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [mainTab, setMainTab] = useState<MainTab>('signups');
  const [data, setData] = useState<{ starter: SignupRow[]; pro: SignupRow[]; proV2: SignupRow[] } | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [versions, setVersions] = useState<ProdVersionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signupTab, setSignupTab] = useState<SignupTab>('starter');
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof SignupRow>('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res: SignupsResponse = await fetch('/api/admin/signups', { cache: 'no-store' }).then(r => r.json());
      if (res.ok) {
        setData({ starter: res.starter, pro: res.pro, proV2: res.proV2 });
        if (res.spreadsheetId) setSpreadsheetId(res.spreadsheetId);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetch('/api/admin/prod-version').then(r => r.json()).then(setVersions).catch(() => {});
  }, [loadData]);

  const rows = data ? data[signupTab] : [];

  const batches = useMemo(() => {
    const set = new Set(rows.map(r => r.batch).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const levels = useMemo(() => {
    const set = new Set(rows.map(r => r.knowledgeLevel).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (batchFilter) result = result.filter(r => r.batch === batchFilter);
    if (levelFilter) result = result.filter(r => r.knowledgeLevel === levelFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      let cmp = 0;
      if (sortKey === 'submittedAt') {
        cmp = new Date(va).getTime() - new Date(vb).getTime();
      } else if (sortKey === 'budgetAmount') {
        cmp = (parseFloat(String(va)) || 0) - (parseFloat(String(vb)) || 0);
      } else {
        cmp = String(va).localeCompare(String(vb), 'zh-TW');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [rows, batchFilter, levelFilter, search, sortKey, sortDir]);

  function handleSort(key: keyof SignupRow) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const lastUpdated = rows[0]?.submittedAt ? formatDate(rows[0].submittedAt) : null;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
    color: active ? '#a78bfa' : '#666',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginBottom: -1,
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d1a',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '0.875rem',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1e1e3a',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#111124',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>PENHU 後台</span>
          <span style={{
            background: '#7c3aed', color: '#fff', borderRadius: 5,
            padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
          }}>
            {mainTab === 'batches' ? '梯次管理' : mainTab === 'apidocs' ? 'API 文件' : '報名管理'}
          </span>
          {/* Site links */}
          {SITE_LINKS.map(s => (
            <a key={s.variant} href={s.url} target="_blank" rel="noreferrer" style={{
              background: '#0d1a2e', border: '1px solid #1e3a5a', color: '#60a5fa',
              borderRadius: 5, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {s.label} ↗
            </a>
          ))}
          {/* Version badge */}
          {versions?.ok && (() => {
            const local = versions.local;
            const prod = versions.prod;
            const match = prod && prod.gitHash === local.gitHash;

            const timeAgo = (dateStr: string) => {
              if (!dateStr) return '';
              const diff = Date.now() - new Date(dateStr).getTime();
              const days = Math.floor(diff / 86400000);
              if (days < 1) return '今天';
              if (days < 30) return `${days} 天前`;
              const months = Math.floor(days / 30);
              if (months < 12) return `${months} 個月前`;
              const years = Math.floor(months / 12);
              return `${years} 年前`;
            };

            return (
              <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#555' }} title="本機版本">本機 {local.gitHash}</span>
                <span style={{ color: '#333' }}>|</span>
                {prod ? (
                  <span style={{ color: match ? '#4ade80' : '#f59e0b' }} title={`線上版本${match ? '（已是最新）' : '（尚未部署）'}`}>
                    線上 {prod.gitHash} {match ? '✓' : '⚠'}
                    {prod.gitDate && (
                      <span style={{ color: '#888', marginLeft: 4 }}>· 上次部署 {timeAgo(prod.gitDate)}</span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: '#555' }}>線上 無法連線</span>
                )}
              </span>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mainTab === 'signups' && lastUpdated && (
            <span style={{ color: '#555', fontSize: '0.75rem', marginRight: 4 }}>最新報名：{lastUpdated}</span>
          )}
          {mainTab === 'signups' && spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank" rel="noreferrer"
              style={{
                background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4ade80',
                borderRadius: 7, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              📊 試算表
            </a>
          )}
          {mainTab === 'signups' && (
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                background: '#1a1a3a', border: '1px solid #2a2a4a', color: refreshing ? '#555' : '#a78bfa',
                borderRadius: 7, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600,
                cursor: refreshing ? 'default' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {refreshing ? '更新中…' : '↻ 更新'}
            </button>
          )}
        </div>
      </div>

      {/* Banner Video */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a2e' }}>
        <video
          src="/city-wallpaper.webm"
          autoPlay loop muted playsInline
          style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'cover' }}
        />
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e1e3a', paddingBottom: 0 }}>
          <button style={tabStyle(mainTab === 'signups')} onClick={() => setMainTab('signups')}>
            📋 報名資料
          </button>
          <button style={tabStyle(mainTab === 'batches')} onClick={() => setMainTab('batches')}>
            🗓 梯次管理
          </button>
          <button style={tabStyle(mainTab === 'apidocs')} onClick={() => setMainTab('apidocs')}>
            📡 API 文件
          </button>
        </div>

        {/* ── BATCHES TAB ── */}
        {mainTab === 'batches' && <BatchManager />}

        {/* ── API DOCS TAB ── */}
        {mainTab === 'apidocs' && <ApiDocsPanel />}

        {/* ── SIGNUPS TAB ── */}
        {mainTab === 'signups' && (
          <>
            {/* Stats */}
            {data && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatBadge label="新手陪跑" count={data.starter.length} />
                <StatBadge label="實戰班 v2" count={data.proV2.length} />
                <StatBadge label="總計" count={data.starter.length + data.proV2.length} />
              </div>
            )}

            {/* Signup sub-tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1e1e3a', paddingBottom: 0 }}>
              {(Object.keys(SIGNUP_TAB_LABELS) as SignupTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setSignupTab(t); setBatchFilter(''); setSearch(''); }}
                  style={tabStyle(signupTab === t)}
                >
                  {SIGNUP_TAB_LABELS[t]}
                  {data && (
                    <span style={{
                      marginLeft: 6, fontSize: '0.7rem',
                      background: signupTab === t ? '#2d1b6e' : '#1a1a2e',
                      color: signupTab === t ? '#a78bfa' : '#555',
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {data[t].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                placeholder="搜尋 Line名稱 / ID / Email / OKX UID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: '1 1 240px', minWidth: 200,
                  background: '#111124', border: '1px solid #2a2a4a',
                  color: '#e0e0e0', borderRadius: 7, padding: '7px 12px',
                  outline: 'none', fontSize: '0.85rem',
                }}
              />
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                style={{
                  background: '#111124', border: '1px solid #2a2a4a',
                  color: '#e0e0e0', borderRadius: 7, padding: '7px 12px',
                  cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                <option value="">全部梯次</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value)}
                style={{
                  background: '#111124', border: '1px solid #2a2a4a',
                  color: '#e0e0e0', borderRadius: 7, padding: '7px 12px',
                  cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                <option value="">全部程度</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {(search || batchFilter || levelFilter) && (
                <button
                  onClick={() => { setSearch(''); setBatchFilter(''); setLevelFilter(''); }}
                  style={{
                    background: '#1e1e3a', border: '1px solid #2a2a4a',
                    color: '#a78bfa', borderRadius: 7, padding: '7px 12px',
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  清除篩選
                </button>
              )}
              <span style={{ alignSelf: 'center', color: '#555', fontSize: '0.8rem' }}>
                顯示 {filtered.length} / {rows.length} 筆
              </span>
            </div>

            {/* Content */}
            {loading && (
              <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>載入中…</div>
            )}
            {error && (
              <div style={{
                background: '#2a0a0a', border: '1px solid #5a1a1a',
                borderRadius: 8, padding: '16px 20px', color: '#ff6b6b',
              }}>
                <strong>錯誤：</strong>{error}
              </div>
            )}
            {!loading && !error && (
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #1e1e3a' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                }}>
                  <thead>
                    <tr style={{ background: '#111124', borderBottom: '2px solid #1e1e3a' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#555', fontWeight: 500, width: 40 }}>#</th>
                      {COL_LABELS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          style={{
                            padding: '10px 12px', textAlign: 'left',
                            color: sortKey === col.key ? '#a78bfa' : '#888',
                            fontWeight: 600, cursor: 'pointer',
                            width: col.width, whiteSpace: 'nowrap',
                            userSelect: 'none',
                          }}
                        >
                          {col.label}
                          {sortKey === col.key && (
                            <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>
                              {sortDir === 'desc' ? '▼' : '▲'}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={COL_LABELS.length + 1} style={{ textAlign: 'center', padding: 40, color: '#555' }}>
                          {rows.length === 0 ? '尚無報名資料' : '找不到符合的結果'}
                        </td>
                      </tr>
                    ) : filtered.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #1a1a2e',
                          background: i % 2 === 0 ? 'transparent' : '#0f0f20',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a1a3a')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#0f0f20')}
                      >
                        <td style={{ padding: '9px 12px', textAlign: 'center', color: '#444' }}>{i + 1}</td>
                        {COL_LABELS.map(col => (
                          <td key={col.key} style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                            <CellValue colKey={col.key} value={row[col.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
