'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type LayoutTuning = {
  personOffsetY: number;
  signupOffsetY: number;
  miniBadgesOffsetY: number;
  miniBadgeFontSize: number;
  moduleBgOffsetX: number;
  reserveTimerSize: number;
  lockBlurPx: number;
  portraitStageOffsetY: number;
  portraitStageGap: number;
  portraitStageHeight: number;
};

type SiteConfig = {
  layoutLandscape: LayoutTuning;
  layoutPortraitDesktop: LayoutTuning;
  layoutPortraitMobile: LayoutTuning;
  layoutPortrait?: LayoutTuning;
  personOffsetY?: number;
  signupOffsetY?: number;
  miniBadgesOffsetY?: number;
  miniBadgeFontSize?: number;
  moduleBgOffsetX?: number;
  reserveTimerSize?: number;
  lockBlurPx?: number;
  portraitStageOffsetY?: number;
  portraitStageGap?: number;
  portraitStageHeight?: number;
  texts?: Record<string, string>;
  tracksData?: Array<Record<string, unknown>>;
};

const LIVE_TUNING_KEY = 'penhu7days:live-layout-tuning';

const defaultLandscape: LayoutTuning = {
  personOffsetY: 190,
  signupOffsetY: -214,
  miniBadgesOffsetY: 236,
  miniBadgeFontSize: 9,
  moduleBgOffsetX: 0,
  reserveTimerSize: 26,
  lockBlurPx: 10,
  portraitStageOffsetY: 0,
  portraitStageGap: 48,
  portraitStageHeight: 620,
};

const defaultPortraitDesktop: LayoutTuning = {
  personOffsetY: 140,
  signupOffsetY: -120,
  miniBadgesOffsetY: 280,
  miniBadgeFontSize: 9,
  moduleBgOffsetX: 0,
  reserveTimerSize: 24,
  lockBlurPx: 10,
  portraitStageOffsetY: 0,
  portraitStageGap: 24,
  portraitStageHeight: 580,
};

const defaultPortraitMobile: LayoutTuning = {
  personOffsetY: 132,
  signupOffsetY: -132,
  miniBadgesOffsetY: 292,
  miniBadgeFontSize: 9,
  moduleBgOffsetX: 0,
  reserveTimerSize: 24,
  lockBlurPx: 10,
  portraitStageOffsetY: 0,
  portraitStageGap: 24,
  portraitStageHeight: 580,
};

const ranges: Array<{
  key: keyof LayoutTuning;
  label: string;
  min: number;
  max: number;
}> = [
  { key: 'personOffsetY', label: '人物 Y', min: -240, max: 520 },
  { key: 'miniBadgesOffsetY', label: '肩膀標籤 Y', min: 0, max: 680 },
  { key: 'miniBadgeFontSize', label: '肩膀標籤字級', min: 8, max: 24 },
  { key: 'moduleBgOffsetX', label: '男生照片 X', min: -320, max: 320 },
  { key: 'portraitStageOffsetY', label: '主方塊 Y', min: -260, max: 320 },
  { key: 'portraitStageGap', label: '主方塊與按鈕間距', min: -120, max: 260 },
  { key: 'portraitStageHeight', label: '主方塊高度', min: 360, max: 1120 },
  { key: 'signupOffsetY', label: '報名區塊相對 Y', min: -620, max: 220 },
  { key: 'reserveTimerSize', label: '倒計時大小', min: 16, max: 64 },
  { key: 'lockBlurPx', label: '鎖屏模糊', min: 0, max: 24 },
];

function normalizeConfig(raw: Partial<SiteConfig>): SiteConfig {
  const legacyLandscape: LayoutTuning = {
    personOffsetY: typeof raw.personOffsetY === 'number' ? raw.personOffsetY : defaultLandscape.personOffsetY,
    signupOffsetY: typeof raw.signupOffsetY === 'number' ? raw.signupOffsetY : defaultLandscape.signupOffsetY,
    miniBadgesOffsetY:
      typeof raw.miniBadgesOffsetY === 'number' ? raw.miniBadgesOffsetY : defaultLandscape.miniBadgesOffsetY,
    miniBadgeFontSize:
      typeof raw.miniBadgeFontSize === 'number' ? raw.miniBadgeFontSize : defaultLandscape.miniBadgeFontSize,
    moduleBgOffsetX:
      typeof raw.moduleBgOffsetX === 'number' ? raw.moduleBgOffsetX : defaultLandscape.moduleBgOffsetX,
    reserveTimerSize:
      typeof raw.reserveTimerSize === 'number' ? raw.reserveTimerSize : defaultLandscape.reserveTimerSize,
    lockBlurPx: typeof raw.lockBlurPx === 'number' ? raw.lockBlurPx : defaultLandscape.lockBlurPx,
    portraitStageOffsetY:
      typeof raw.portraitStageOffsetY === 'number' ? raw.portraitStageOffsetY : defaultLandscape.portraitStageOffsetY,
    portraitStageGap: typeof raw.portraitStageGap === 'number' ? raw.portraitStageGap : defaultLandscape.portraitStageGap,
    portraitStageHeight:
      typeof raw.portraitStageHeight === 'number' ? raw.portraitStageHeight : defaultLandscape.portraitStageHeight,
  };

  return {
    ...raw,
    layoutLandscape: { ...legacyLandscape, ...(raw.layoutLandscape ?? {}) },
    layoutPortraitDesktop: { ...defaultPortraitDesktop, ...(raw.layoutPortrait ?? {}) , ...(raw.layoutPortraitDesktop ?? {}) },
    layoutPortraitMobile: { ...defaultPortraitMobile, ...(raw.layoutPortrait ?? {}), ...(raw.layoutPortraitMobile ?? {}) },
    texts: raw.texts ?? {},
    tracksData: raw.tracksData ?? [],
  };
}

export default function DebugPage() {
  const [config, setConfig] = useState<SiteConfig>(() =>
    normalizeConfig({
      layoutLandscape: defaultLandscape,
      layoutPortraitDesktop: defaultPortraitDesktop,
      layoutPortraitMobile: defaultPortraitMobile,
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  const channelRef = useRef<BroadcastChannel | null>(null);

  const emitLiveTuning = (
    layoutLandscape: LayoutTuning,
    layoutPortraitDesktop: LayoutTuning,
    layoutPortraitMobile: LayoutTuning
  ) => {
    const payload = { layoutLandscape, layoutPortraitDesktop, layoutPortraitMobile, ts: Date.now() };
    const json = JSON.stringify(payload);
    localStorage.setItem(LIVE_TUNING_KEY, json);
    channelRef.current?.postMessage(payload);
  };

  useEffect(() => {
    channelRef.current = new BroadcastChannel('penhu7days-debug-sync');
    const load = async () => {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<SiteConfig>;
      const normalized = normalizeConfig(data);
      setConfig(normalized);
      emitLiveTuning(normalized.layoutLandscape, normalized.layoutPortraitDesktop, normalized.layoutPortraitMobile);
    };
    void load();
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  const save = async () => {
    setIsSaving(true);
    const payload: SiteConfig = {
      ...config,
      personOffsetY: config.layoutLandscape.personOffsetY,
      signupOffsetY: config.layoutLandscape.signupOffsetY,
      miniBadgesOffsetY: config.layoutLandscape.miniBadgesOffsetY,
      miniBadgeFontSize: config.layoutLandscape.miniBadgeFontSize,
      moduleBgOffsetX: config.layoutLandscape.moduleBgOffsetX,
      reserveTimerSize: config.layoutLandscape.reserveTimerSize,
      lockBlurPx: config.layoutLandscape.lockBlurPx,
      portraitStageOffsetY: config.layoutLandscape.portraitStageOffsetY,
      portraitStageGap: config.layoutLandscape.portraitStageGap,
      portraitStageHeight: config.layoutLandscape.portraitStageHeight,
    };

    const res = await fetch('/api/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setIsSaving(false);
    setSaveHint(res.ok ? '已保存' : '保存失敗');
    window.setTimeout(() => setSaveHint(''), 1200);
  };

  const panels = useMemo(
    () => [
      {
        key: 'layoutLandscape' as const,
        title: '橫屏設定',
      },
      {
        key: 'layoutPortraitDesktop' as const,
        title: '電腦豎屏設定',
      },
      {
        key: 'layoutPortraitMobile' as const,
        title: '手機豎屏設定',
      },
    ],
    []
  );

  return (
    <main style={{ padding: '16px 18px 28px', maxWidth: 880, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Layout Debug</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/" target="_blank" style={{ fontSize: 14 }}>
            開主畫面（新分頁）
          </Link>
          <button type="button" onClick={save} disabled={isSaving} style={{ padding: '8px 14px' }}>
            {isSaving ? '保存中...' : '保存'}
          </button>
          <span style={{ minWidth: 64, fontSize: 13 }}>{saveHint}</span>
        </div>
      </header>

      <p style={{ fontSize: 13, color: '#52627d', marginTop: 8 }}>
        建議：此頁調數值，另一個分頁開首頁即時看效果。
      </p>

      {panels.map((panel) => (
        <section key={panel.key} style={{ marginTop: 18, border: '1px solid #c8d5ec', borderRadius: 10, padding: 14 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>{panel.title}</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {ranges.map((item) => {
              const value = config[panel.key][item.key];
              return (
                <label key={`${panel.key}-${item.key}`} style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                  <span>
                    {item.label}：{value}
                  </span>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={1}
                    value={value}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setConfig((prev) => {
                        const nextConfig = {
                          ...prev,
                          [panel.key]: {
                            ...prev[panel.key],
                            [item.key]: nextValue,
                          },
                        };
                        emitLiveTuning(
                          nextConfig.layoutLandscape,
                          nextConfig.layoutPortraitDesktop,
                          nextConfig.layoutPortraitMobile
                        );
                        return nextConfig;
                      });
                    }}
                  />
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
