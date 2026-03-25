'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import Script from 'next/script';

type Track = {
  id: string;
  title: string;
  description: string;
};

const defaultTracks: Track[] = [
  {
    id: 'ai-money-flow',
    title: '聰明錢追蹤',
    description:
      '不再憑感覺追盤，學會鎖定主力資金路徑，提前掌握關鍵轉折點，進場更有勝率。',
  },
  {
    id: 'data-analysis',
    title: '數據分析',
    description:
      '從成交量、持倉量、資金費率與流動性結構建立判斷模型，讓每次決策都有數據支撐。',
  },
  {
    id: 'web3-gold-dog',
    title: 'web3金鉤團',
    description:
      '建立鏈上雷達系統，提早發現高潛力標的，從資訊差中拿到先手優勢。',
  },
  {
    id: 'smc',
    title: 'SMC',
    description:
      '看懂流動性獵取與市場結構轉折，建立機構視角的進出場邏輯，避免被假突破收割。',
  },
  {
    id: 'airdrop',
    title: '嚕空投',
    description:
      '掌握空投評分規則與任務優先順序，降低成本、提升中獎率，讓每一步都有回報。',
  },
  {
    id: 'order-flow',
    title: '訂單流',
    description:
      '從委託簿與成交節奏讀懂真實買賣力道，不再猜方向，直接跟著資金動能交易。',
  },
];

const proTracks: Track[] = [
  {
    id: 'wealth-engine',
    title: '幣圈理財印鈔機',
    description:
      '學習幣圈三大理財產品，手把手教你榨乾交易所的隱藏紅利，讓閒置資金 24 小時持續生利息。',
  },
  {
    id: 'technical-analysis',
    title: '實戰技術分析',
    description:
      '從指標到 SNR 支撐壓力，再到 SMC 聰明錢概念，帶你看懂盤面，自己抓出精準買賣點。',
  },
  {
    id: 'risk-management',
    title: '資金與風險管理',
    description:
      '了解 99% 爆倉原因，建立正確倉位、止損與獲利保護紀律，把交易從碰運氣變成長期盈利系統。',
  },
];

const heroFeatureCards = [
  {
    title: '出入金安全',
    description: '避開常見詐騙，識別安全交易所',
  },
  {
    title: '專有名詞',
    description: '複雜的名詞一次搞懂',
  },
  {
    title: '進出場辨別',
    description: '新手常見誤區',
  },
  {
    title: '風險管理',
    description: '學會風控 晉升合格交易員',
  },
] as const;

const defaultTexts = {
  heroSysLabel: 'SUBJECT ONBOARDING',
  courseTag: '7天免費陪跑課程',
  heroTitle1: '想加入幣圈',
  heroTitle2: '不知道怎麼開始？',
  heroCopy: '從 0 開始教你：平台操作、專有名詞、獲利方式，一次帶你跑完。',
  pillSecurity: 'SECURITY',
  pillTerms: 'TERMS',
  pillEntryExit: 'ENTRY / EXIT',
  pillRisk: 'RISK',
  bridgeBio: 'BIO',
  bridgeCta: 'CTA',
  cta: '立即報名新手課程',
  lockOn: 'LOCK: ON · CONF: 98.7%',
  filterStatus: 'FILTER STATUS: ACTIVE',
  idMatch: 'ID MATCH: VERIFIED',
  subjectStatus: 'SUBJECT / STATUS',
  authStatus: 'LOCK ON / AUTH VERIFIED',
  readyIn: 'READY IN 00:06',
  step1SysLabel: 'STEP 01',
  step1Title: '開始你的專屬陪跑班',
  step1Desc: '',
  step1Locked: 'STEP 01 LOCKED · 向下滑動或點擊解鎖',
  flipCourse: '新手陪跑課程',
  flipBatch: '第一梯',
  timelineLabel: 'WINDOW: 7D',
  timelineBadge: 'FIRST BATCH',
  quickForm: 'QUICK FORM',
  safeEntry: 'SAFE ENTRY',
  eta30: 'ETA 30 SEC',
  formLineLabel: 'line名稱 *',
  formLinePlaceholder: '請輸入 line名稱',
  formLimeLabel: '您的LINE ID',
  formLimePlaceholder: '請輸入您的LINE ID',
  formEmailLabel: 'Email *',
  formEmailPlaceholder: '請輸入 Email',
  formPhoneLabel: '電話',
  formPhonePlaceholder: '請輸入電話',
  formUidLabel: 'PENHU聯盟會員編號 *',
  formUidPlaceholder: '請輸入 PENHU聯盟會員編號',
  formKnowLabel: '你對於加密貨幣的了解程度 *',
  formBudgetLabel: '你願意在加密貨幣投入多少新台幣? *',
  formCourseLabel: '你想報名的課程是? *',
  formChoose: '請選擇',
  know1: '我是小白 什麼都不懂',
  know2: '有稍微了解過一些相關知識',
  know3: '我是幣圈人 但平常沒什麼在交易',
  know4: '我是幣圈人 經常在做自主交易',
  budget1: '3萬以內',
  budget2: '3-10萬',
  budget3: '10萬以上',
  batchCourse: '第1梯新手陪跑課程（03 / 09 - 03 / 15）',
  formNote: '新手陪跑課程畢業後即可免費參加進階課程',
  formSubmit: '送出報名',
  step2SysLabel: 'STEP 02',
  step2Title: '機構級訓練地圖',
  step2UnlockCopy: '價值數十萬的頂級交易員內部培訓課程，現在直接為你解鎖。',
  step2UnlockBtnIdle: 'CLICK TO UNLOCK',
  step2UnlockBtnBusy: 'AUTHENTICATING...',
  step2Detail:
    '捨棄散戶思維，不再追高殺低。你將獲得機構級獲利系統，有數據依據、有風險模型、有進出場邏輯，交易不再是情緒對抗，而是有框架、有勝率的資金博弈。',
  step3SysLabel: 'STEP 02',
  step3Title: '機構級訓練地圖',
  step3Desc: '捨棄散戶思維，不再追高殺低。你將獲得機構級獲利系統，有數據依據、有風險模型、有進出場邏輯，交易不再是情緒對抗，而是有框架、有勝率的資金博弈。',
  step3Tag1: 'SMART TRACK',
  step3Tag2: 'ALPHA LAB',
  step3Tag3: 'RISK MAP',
  step3Reveal: '價值數十萬的頂級交易員內部培訓課程，現在為你解鎖',
  step3Status: '即將開放報名',
  step3DescTitle: '模組說明',
  step3Cta: '新手課程畢業即可解鎖',
  footerText: '© 2026 Penhu Trading Alliance. All rights reserved.',
} as const;

const proTextOverrides: Partial<Record<keyof typeof defaultTexts, string>> = {
  courseTag: '7天實戰班（一階）',
  heroTitle1: '把幣圈的',
  heroTitle2: '「印鈔技能」裝進自己腦袋！',
  heroCopy: '只用 7 天，把名詞、理財、技術分析、風險控管全部變成你真的敢用的實戰系統。',
  cta: '立即卡位 7 天實戰班',
  step1Title: '資格確認後，開始卡位 7 天實戰班',
  formNote: '上過新手陪跑課程與 PENHU 聯盟 VIP 可報名，不確定資格先找聯盟小幫手。',
  step2UnlockCopy: '畢業後直接解鎖這 3 大實戰能力，從理財到技術分析再到資金控管，全部帶你落地。',
  step3Title: '畢業直接解鎖這 3 大實戰能力',
  step3Desc: '把交易所理財、技術分析與風險管理三個核心模組裝進腦袋，從看不懂盤，到能自己做判斷。',
  step3Status: '三大核心武器',
  step3Cta: '我要先卡位 7 天實戰班',
};

type TextKey = keyof typeof defaultTexts;
type TextMap = Record<TextKey, string>;
type LandingVariant = 'starter' | 'pro';
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

type SiteConfigPayload = {
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
  texts: Partial<Record<TextKey, string>>;
  tracksData: Array<Pick<Track, 'title' | 'description'>>;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      enterprise?: {
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const preloadImageSources = [
  '/hero-image.png',
  '/hero-man-cutout.webp',
  '/hero-woman-cutout.webp',
  '/hero-image-2.webp',
] as const;

// 梯次定義：endDate 為報名截止日（開課前一天），到期前 2 天灰掉並顯示下一梯
const BATCH_GREY_DAYS = 2;
const batchDefs = [
  { id: 'batch-1', label: '第一梯', date: '03/09 - 03/15', endDate: new Date(2026, 2, 8) },
  { id: 'batch-2', label: '第二梯', date: '03/23 - 03/29', endDate: new Date(2026, 2, 22) },
  { id: 'batch-3', label: '第三梯', date: '04/06 - 04/12', endDate: new Date(2026, 3, 5) },
];

function computeVisibleBatches() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return batchDefs
    .filter((def, index) => {
      if (index === 0) return true;
      const prev = batchDefs[index - 1];
      const prevGrey = new Date(prev.endDate);
      prevGrey.setDate(prevGrey.getDate() - BATCH_GREY_DAYS);
      return today >= prevGrey;
    })
    .map((def) => {
      const greyDate = new Date(def.endDate);
      greyDate.setDate(greyDate.getDate() - BATCH_GREY_DAYS);
      const expired = today > def.endDate;
      const greyed = today >= greyDate;
      return {
        id: def.id,
        label: def.label,
        date: def.date,
        enabled: !greyed && !expired,
        status: expired ? '已結束' : greyed ? '報名截止' : '已開放',
      };
    });
}

// Module-level fallback (used as initial state before API loads)
const signupBatchesFallback = computeVisibleBatches();

const knowledgeOptions = [
  { value: 1, label: '完全新手' },
  { value: 2, label: '剛入門' },
  { value: 3, label: '略有所聞' },
  { value: 4, label: '有操作過' },
  { value: 5, label: '具備基礎' },
] as const;
const commonEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'proton.me'] as const;

const RESERVE_WINDOW_SECONDS = 30 * 60;
const RECAPTCHA_ACTION = 'signup_submit';
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}$/;
const PHONE_PATTERN = /^[0-9+\-()#* ]{6,24}$/;

export default function PenhuLandingPage({ variant = 'starter' }: { variant?: LandingVariant }) {
  const isProVariant = variant === 'pro';
  const initialTracks = isProVariant ? proTracks : defaultTracks;
  const initialTexts = (isProVariant ? { ...defaultTexts, ...proTextOverrides } : defaultTexts) as TextMap;
  const liveTuningKey = isProVariant ? 'penhu7days:live-layout-tuning-pro' : 'penhu7days:live-layout-tuning';
  const configUrl = isProVariant ? '/api/site-config?variant=pro' : '/api/site-config';
  const batchesUrl = '/api/batches?variant=starter';
  const recaptchaSiteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '').trim();
  const captchaProvider = (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || 'recaptcha_v3').trim().toLowerCase();
  const isRecaptchaEnterprise = captchaProvider === 'recaptcha_enterprise';
  const defaultLandscapeTuning: LayoutTuning = {
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
  const defaultPortraitDesktopTuning: LayoutTuning = {
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
  const defaultPortraitMobileTuning: LayoutTuning = {
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

  const [signupUnlocked, setSignupUnlocked] = useState(false);
  const [signupUnlocking, setSignupUnlocking] = useState(false);
  const [pendingEnrollUnlock, setPendingEnrollUnlock] = useState(false);
  const [isEnrollPreparing, setIsEnrollPreparing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [tracksData, setTracksData] = useState<Track[]>(() => initialTracks.map((track) => ({ ...track })));
  const [activeTrackId, setActiveTrackId] = useState<string>(initialTracks[0]?.id ?? '');
  const [moduleLeaving, setModuleLeaving] = useState(false);
  const [activeSpec, setActiveSpec] = useState<number | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [landscapeTuning, setLandscapeTuning] = useState<LayoutTuning>(defaultLandscapeTuning);
  const [portraitDesktopTuning, setPortraitDesktopTuning] = useState<LayoutTuning>(defaultPortraitDesktopTuning);
  const [portraitMobileTuning, setPortraitMobileTuning] = useState<LayoutTuning>(defaultPortraitMobileTuning);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [knowledgeLevel, setKnowledgeLevel] = useState<number | null>(null);
  const [knowledgeRequiredBlink, setKnowledgeRequiredBlink] = useState(false);
  const [batchRequiredBlink, setBatchRequiredBlink] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(1010000);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [budgetRequiredBlink, setBudgetRequiredBlink] = useState(false);
  const [enrollReserved, setEnrollReserved] = useState(false);
  const [leavingReserved, setLeavingReserved] = useState(false);
  const [batchCheckState, setBatchCheckState] = useState<'idle' | 'checking' | 'full' | 'available'>('idle');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [signupSubmitError, setSignupSubmitError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [reserveDeadlineMs, setReserveDeadlineMs] = useState<number | null>(null);
  const [reserveSecondsLeft, setReserveSecondsLeft] = useState(RESERVE_WINDOW_SECONDS);
  const [texts, setTexts] = useState<TextMap>({ ...initialTexts });
  const preloadAllRef = useRef<Promise<void> | null>(null);
  const hudPageRef = useRef<HTMLDivElement | null>(null);
  const scrollSettleTimerRef = useRef<number | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const portraitStageRef = useRef<HTMLDivElement | null>(null);
  const railListRef = useRef<HTMLDivElement | null>(null);
  const railSpacerRef = useRef<HTMLDivElement | null>(null);
  const skipCenterRef = useRef(false);
  const batchCheckIdRef = useRef(0);
  const [signupAnchoredMarginTop, setSignupAnchoredMarginTop] = useState(-214);
  const [signupBatches, setSignupBatches] = useState(signupBatchesFallback);

  const activeTrack = useMemo(
    () => tracksData.find((item) => item.id === activeTrackId) ?? tracksData[0],
    [activeTrackId, tracksData]
  );
  const selectedBatchLabel = useMemo(
    () => signupBatches.find((batch) => batch.id === selectedBatchId)?.label ?? '',
    [signupBatches, selectedBatchId]
  );
  const reserveTimeText = useMemo(() => {
    const mins = Math.floor(reserveSecondsLeft / 60)
      .toString()
      .padStart(2, '0');
    const secs = (reserveSecondsLeft % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [reserveSecondsLeft]);
  const submitDisabled = isSubmittingSignup || (Boolean(recaptchaSiteKey) && !recaptchaReady);
  const emailSuggestions = useMemo(() => {
    const raw = emailInput.trim().toLowerCase();
    const atIndex = raw.indexOf('@');
    if (atIndex <= 0) return [];
    const localPart = raw.slice(0, atIndex);
    const domainPrefix = raw.slice(atIndex + 1);
    return commonEmailDomains
      .filter((domain) => domain.startsWith(domainPrefix))
      .map((domain) => `${localPart}@${domain}`)
      .slice(0, 6);
  }, [emailInput]);

  useEffect(() => {
    if (!tracksData.length) return;
    if (tracksData.some((item) => item.id === activeTrackId)) return;
    setActiveTrackId(tracksData[0].id);
  }, [activeTrackId, tracksData]);

  const triggerBatchFlash = (el: HTMLButtonElement) => {
    el.classList.remove('fx-flash');
    void el.offsetWidth;
    el.classList.add('fx-flash');
    window.setTimeout(() => el.classList.remove('fx-flash'), 760);
  };

  const handleBatchSelect = async (batchId: string, target: HTMLButtonElement) => {
    // Toggle off if already selected
    if (selectedBatchId === batchId) {
      // Cancel any pending capacity check
      batchCheckIdRef.current++;
      // Start fade-out animation on the meta card
      setLeavingReserved(true);
      skipCenterRef.current = true; // block useEffect from firing a second centering
      // After CSS transition ends, clear state THEN center (meta is gone → correct layout)
      setTimeout(() => {
        setSelectedBatchId(null);
        setEnrollReserved(false);
        setLeavingReserved(false);
        setBatchCheckState('idle');
        setReserveDeadlineMs(null);
        setReserveSecondsLeft(RESERVE_WINDOW_SECONDS);
        setSignupSuccess(false);
        setSignupSubmitted(false);
        // Double RAF: first lets React commit the state, second measures clean layout
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            skipCenterRef.current = false;
            const rail = railListRef.current;
            if (!rail) return;
            const firstEnabled = rail.querySelector<HTMLButtonElement>('.batch-card.enabled');
            if (!firstEnabled) return;
            centerRailOn(rail, () => elCenterInRail(rail, firstEnabled) - rail.clientWidth / 2, false);
          });
        });
      }, 280);
      return;
    }
    setSelectedBatchId(batchId);
    setEnrollReserved(true);
    setBatchCheckState('checking');
    setSignupSuccess(false);
    setSignupSubmitted(false);
    setKnowledgeLevel(null);
    setKnowledgeRequiredBlink(false);
    setBudgetAmount(1010000);
    setBudgetTouched(false);
    setBudgetRequiredBlink(false);
    setEmailInput('');
    setSignupSubmitError('');
    triggerBatchFlash(target);

    const checkId = ++batchCheckIdRef.current;
    const minDelay = new Promise<void>((r) => setTimeout(r, 1200));
    try {
      const [res] = await Promise.all([
        fetch('/api/check-batch-capacity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId }),
          signal: AbortSignal.timeout(8000),
        }),
        minDelay,
      ]);
      if (batchCheckIdRef.current !== checkId) return;
      const data = await res.json().catch(() => null);
      if (data?.available === false) {
        setBatchCheckState('full');
      } else {
        setBatchCheckState('available');
        setReserveDeadlineMs(Date.now() + RESERVE_WINDOW_SECONDS * 1000);
        setReserveSecondsLeft(RESERVE_WINDOW_SECONDS);
      }
    } catch {
      await minDelay;
      if (batchCheckIdRef.current !== checkId) return;
      setBatchCheckState('available');
      setReserveDeadlineMs(Date.now() + RESERVE_WINDOW_SECONDS * 1000);
      setReserveSecondsLeft(RESERVE_WINDOW_SECONDS);
    }
  };

  // Position helpers using getBoundingClientRect (avoids offsetParent ambiguity)
  const elCenterInRail = (rail: HTMLDivElement, el: HTMLElement): number => {
    const rr = rail.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return (er.left - rr.left) + rail.scrollLeft + er.width / 2;
  };
  const elLeftInRail = (rail: HTMLDivElement, el: HTMLElement): number => {
    const rr = rail.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return (er.left - rr.left) + rail.scrollLeft;
  };
  const elRightInRail = (rail: HTMLDivElement, el: HTMLElement): number => {
    const rr = rail.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return (er.right - rr.left) + rail.scrollLeft;
  };

  // Center the rail: reset state, compute target via lambda, then apply via paddingLeft (desktop)
  // or scroll+spacer (mobile). Lambda runs after reset so BoundingClientRect is accurate.
  const centerRailOn = (rail: HTMLDivElement, getTarget: () => number, smooth = false) => {
    if (railSpacerRef.current) railSpacerRef.current.style.width = '0px';
    rail.style.paddingLeft = '';
    rail.scrollLeft = 0;
    const target = getTarget();
    if (target < 0) {
      // Content doesn't fill the rail: push via paddingLeft
      rail.style.paddingLeft = `${Math.ceil(-target)}px`;
    } else if (target > 0) {
      // Need to scroll right: ensure enough overflow via spacer
      const railRect = rail.getBoundingClientRect();
      const contentEls = Array.from(rail.querySelectorAll<HTMLElement>('.batch-card, .batch-reserve-meta'));
      const naturalRight = contentEls.reduce((max, el) => {
        const r = el.getBoundingClientRect();
        return Math.max(max, (r.right - railRect.left) + rail.scrollLeft);
      }, 0);
      const spacerNeeded = Math.ceil(target + rail.clientWidth - naturalRight + 1);
      if (railSpacerRef.current && spacerNeeded > 0) {
        railSpacerRef.current.style.width = `${spacerNeeded}px`;
      }
      if (smooth) rail.scrollTo({ left: target, behavior: 'smooth' });
      else rail.scrollLeft = target;
    }
  };

  // Mount: instant-center on first enabled batch
  useEffect(() => {
    const rail = railListRef.current;
    if (!rail) return;
    const firstEnabled = rail.querySelector<HTMLButtonElement>('.batch-card.enabled');
    if (!firstEnabled) return;
    centerRailOn(rail, () => elCenterInRail(rail, firstEnabled) - rail.clientWidth / 2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth-scroll on selection change
  useEffect(() => {
    const rail = railListRef.current;
    if (!rail) return;
    requestAnimationFrame(() => {
      if (!selectedBatchId) {
        if (skipCenterRef.current) { skipCenterRef.current = false; return; }
        const firstEnabled = rail.querySelector<HTMLButtonElement>('.batch-card.enabled');
        if (!firstEnabled) return;
        centerRailOn(rail, () => elCenterInRail(rail, firstEnabled) - rail.clientWidth / 2, true);
      } else if (enrollReserved) {
        const selectedCard = rail.querySelector<HTMLButtonElement>('.batch-card.selected');
        const metaEl = rail.querySelector<HTMLDivElement>('.batch-reserve-meta');
        if (!selectedCard) return;
        centerRailOn(rail, () => {
          const start = elLeftInRail(rail, selectedCard);
          const end = metaEl ? elRightInRail(rail, metaEl) : elRightInRail(rail, selectedCard);
          return (start + end) / 2 - rail.clientWidth / 2;
        }, true);
      }
    });
  }, [selectedBatchId, enrollReserved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!reserveDeadlineMs || !enrollReserved) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((reserveDeadlineMs - Date.now()) / 1000));
      setReserveSecondsLeft(next);
      if (next > 0) return;
      setReserveDeadlineMs(null);
      setEnrollReserved(false);
      setSignupSuccess(false);
      setSignupSubmitted(false);
      setSelectedBatchId(null);
      setKnowledgeLevel(null);
      setKnowledgeRequiredBlink(false);
      setBudgetAmount(1010000);
      setBudgetTouched(false);
      setBudgetRequiredBlink(false);
      setReserveSecondsLeft(RESERVE_WINDOW_SECONDS);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [reserveDeadlineMs, enrollReserved]);

  const flashInvalidInput = (input: HTMLInputElement) => {
    input.classList.remove('field-danger');
    void input.offsetWidth;
    input.classList.add('field-danger');
    window.setTimeout(() => input.classList.remove('field-danger'), 1100);
  };

  const getRecaptchaToken = useCallback(async () => {
    if (!recaptchaSiteKey) return '';
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) throw new Error('CAPTCHA_NOT_READY');

    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
    const token = isRecaptchaEnterprise
      ? await grecaptcha.enterprise?.execute(recaptchaSiteKey, { action: RECAPTCHA_ACTION })
      : await grecaptcha.execute(recaptchaSiteKey, { action: RECAPTCHA_ACTION });
    if (!token) throw new Error('CAPTCHA_EMPTY');
    return token;
  }, [isRecaptchaEnterprise, recaptchaSiteKey]);

  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingSignup) return;
    if (!selectedBatchId) {
      setBatchRequiredBlink(false);
      requestAnimationFrame(() => setBatchRequiredBlink(true));
      window.setTimeout(() => setBatchRequiredBlink(false), 1800);
      const batchRail = document.querySelector('.batch-rail');
      if (batchRail) batchRail.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const formEl = e.currentTarget;

    let hasInvalid = false;
    const localErrors: string[] = [];
    const flashField = (name: string) => {
      const input = formEl.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
      if (input) flashInvalidInput(input);
    };

    if (knowledgeLevel === null) {
      hasInvalid = true;
      localErrors.push('請選擇「你對於加密貨幣的了解程度」。');
      setKnowledgeRequiredBlink(false);
      requestAnimationFrame(() => setKnowledgeRequiredBlink(true));
      window.setTimeout(() => setKnowledgeRequiredBlink(false), 1200);
    }
    if (!budgetTouched) {
      hasInvalid = true;
      localErrors.push('請調整「你願意在加密貨幣投入多少新台幣」。');
      setBudgetRequiredBlink(false);
      requestAnimationFrame(() => setBudgetRequiredBlink(true));
      window.setTimeout(() => setBudgetRequiredBlink(false), 1200);
    }

    const formData = new FormData(formEl);
    const requiredFields: Array<{ name: string; label: string }> = [
      { name: 'line_name', label: 'LINE 名稱' },
      { name: 'line_id', label: 'LINE ID' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: '電話' },
      { name: 'okx_uid', label: 'OKX UID' },
    ];

    requiredFields.forEach(({ name, label }) => {
      const value = String(formData.get(name) ?? '').trim();
      if (value) return;
      flashField(name);
      localErrors.push(`${label} 為必填欄位。`);
      hasInvalid = true;
    });

    const emailValue = String(formData.get('email') ?? '').trim();
    if (emailValue && !EMAIL_PATTERN.test(emailValue)) {
      flashField('email');
      localErrors.push('Email 格式錯誤，請輸入有效的 Email（例如：name@example.com）。');
      hasInvalid = true;
    }

    const phoneValue = String(formData.get('phone') ?? '').trim();
    if (phoneValue && !PHONE_PATTERN.test(phoneValue)) {
      flashField('phone');
      localErrors.push('電話格式錯誤（限 6-24 碼，僅可包含數字與 + - ( ) # * 空白）。');
      hasInvalid = true;
    }

    if (hasInvalid) {
      setSignupSubmitError(localErrors[0] ?? '欄位格式有誤，請檢查後再送出。');
      return;
    }

    setSignupSubmitError('');
    setIsSubmittingSignup(true);
    try {
      const websiteUrl = String(formData.get('website_url') ?? '').trim();
      let captchaToken: string | undefined;
      if (recaptchaSiteKey) {
        try {
          captchaToken = await getRecaptchaToken();
        } catch {
          setSignupSubmitError('驗證服務尚未就緒，請稍後再試。');
          return;
        }
      }

      const payload = {
        courseType: isProVariant ? 'pro' : 'starter',
        batchId: selectedBatchId,
        lineName: String(formData.get('line_name') ?? '').trim(),
        lineId: String(formData.get('line_id') ?? '').trim(),
        email: emailValue.toLowerCase(),
        phone: String(formData.get('phone') ?? '').trim(),
        okxUid: String(formData.get('okx_uid') ?? '').trim(),
        knowledgeLevel,
        budgetAmount,
        captchaToken,
        websiteUrl: websiteUrl || undefined,
      };

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { code?: string; reason?: string } | null;
        if (
          data?.code === 'CAPTCHA_REQUIRED' ||
          data?.code === 'CAPTCHA_INVALID' ||
          data?.code === 'CAPTCHA_REPLAYED' ||
          data?.code === 'CAPTCHA_LOW_SCORE' ||
          data?.code === 'CAPTCHA_BAD_ACTION' ||
          data?.code === 'CAPTCHA_BAD_HOSTNAME'
        ) {
          setSignupSubmitError('驗證未通過，請稍後再試。');
        } else if (data?.code === 'RATE_LIMITED') {
          setSignupSubmitError('送出太頻繁，請稍後再試。');
        } else if (data?.code === 'FORBIDDEN_ORIGIN') {
          setSignupSubmitError('請在官方網站頁面提交表單。');
        } else if (data?.code === 'STORAGE_NOT_CONFIGURED') {
          setSignupSubmitError('系統尚未綁定 Google Sheet，請聯繫管理員。');
        } else if (data?.code === 'STORAGE_WRITE_FAILED') {
          setSignupSubmitError('資料寫入失敗，請稍後重試。');
        } else if (data?.code === 'BAD_REQUEST') {
          const reason = String(data.reason ?? '').toLowerCase();
          if (reason.includes('invalid email')) {
            flashField('email');
            setSignupSubmitError('Email 格式錯誤，請輸入有效的 Email（例如：name@example.com）。');
          } else if (reason.includes('invalid phone')) {
            flashField('phone');
            setSignupSubmitError('電話格式錯誤（限 6-24 碼，僅可包含數字與 + - ( ) # * 空白）。');
          } else if (reason.includes('invalid linename')) {
            flashField('line_name');
            setSignupSubmitError('LINE 名稱格式錯誤，請勿留白且長度需在 100 字以內。');
          } else if (reason.includes('invalid lineid')) {
            flashField('line_id');
            setSignupSubmitError('LINE ID 格式錯誤，請勿留白且長度需在 100 字以內。');
          } else if (reason.includes('invalid okxuid')) {
            flashField('okx_uid');
            setSignupSubmitError('PENHU聯盟會員編號 格式錯誤，請勿留白且長度需在 120 字以內。');
          } else if (reason.includes('invalid budgetamount')) {
            setSignupSubmitError('投入金額格式錯誤，請調整為 0 - 2,000,000 之間。');
          } else if (reason.includes('invalid knowledgelevel')) {
            setSignupSubmitError('了解程度格式錯誤，請重新選擇。');
          } else {
            setSignupSubmitError('欄位格式有誤，請檢查填寫內容後再送出。');
          }
        } else {
          setSignupSubmitError('送出失敗，請稍後再試。');
        }
        return;
      }

      setSignupSuccess(true);
      setSignupSubmitted(true);
      setEnrollReserved(false);
      setReserveDeadlineMs(null);
    } catch {
      setSignupSubmitError('送出失敗，請稍後再試。');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const setText = (key: TextKey, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  };

  const setTrackField = (id: string, field: 'title' | 'description', value: string) => {
    setTracksData((prev) => prev.map((track) => (track.id === id ? { ...track, [field]: value } : track)));
  };

  const updateLandscape = (key: keyof LayoutTuning, value: number) => {
    setLandscapeTuning((prev) => ({ ...prev, [key]: value }));
  };

  const updatePortraitDesktop = (key: keyof LayoutTuning, value: number) => {
    setPortraitDesktopTuning((prev) => ({ ...prev, [key]: value }));
  };

  const updatePortraitMobile = (key: keyof LayoutTuning, value: number) => {
    setPortraitMobileTuning((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const apply = () => {
      setIsPortrait(mq.matches);
      setIsMobileViewport(window.innerWidth <= 960);
    };
    apply();
    mq.addEventListener('change', apply);
    window.addEventListener('resize', apply);
    return () => {
      mq.removeEventListener('change', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);


  useEffect(() => {
    const loadSharedConfig = async () => {
      try {
        const res = await fetch(configUrl, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<SiteConfigPayload>;
        if (data.layoutLandscape) {
          setLandscapeTuning((prev) => ({ ...prev, ...data.layoutLandscape }));
        } else {
          setLandscapeTuning((prev) => ({
            ...prev,
            personOffsetY: typeof data.personOffsetY === 'number' ? data.personOffsetY : prev.personOffsetY,
            signupOffsetY: typeof data.signupOffsetY === 'number' ? data.signupOffsetY : prev.signupOffsetY,
            miniBadgesOffsetY: typeof data.miniBadgesOffsetY === 'number' ? data.miniBadgesOffsetY : prev.miniBadgesOffsetY,
            miniBadgeFontSize: typeof data.miniBadgeFontSize === 'number' ? data.miniBadgeFontSize : prev.miniBadgeFontSize,
            moduleBgOffsetX: typeof data.moduleBgOffsetX === 'number' ? data.moduleBgOffsetX : prev.moduleBgOffsetX,
            reserveTimerSize: typeof data.reserveTimerSize === 'number' ? data.reserveTimerSize : prev.reserveTimerSize,
            lockBlurPx: typeof data.lockBlurPx === 'number' ? data.lockBlurPx : prev.lockBlurPx,
            portraitStageOffsetY: typeof data.portraitStageOffsetY === 'number' ? data.portraitStageOffsetY : prev.portraitStageOffsetY,
            portraitStageGap: typeof data.portraitStageGap === 'number' ? data.portraitStageGap : prev.portraitStageGap,
            portraitStageHeight: typeof data.portraitStageHeight === 'number' ? data.portraitStageHeight : prev.portraitStageHeight,
          }));
        }
        if (data.layoutPortraitDesktop) {
          setPortraitDesktopTuning((prev) => ({ ...prev, ...data.layoutPortraitDesktop }));
        } else if (data.layoutPortrait) {
          setPortraitDesktopTuning((prev) => ({ ...prev, ...data.layoutPortrait }));
        }
        if (data.layoutPortraitMobile) {
          setPortraitMobileTuning((prev) => ({ ...prev, ...data.layoutPortraitMobile }));
        } else if (data.layoutPortrait) {
          setPortraitMobileTuning((prev) => ({ ...prev, ...data.layoutPortrait }));
        }
        if (data.texts && typeof data.texts === 'object') {
          setTexts((prev) => ({ ...prev, ...data.texts }));
        }
        if (Array.isArray(data.tracksData)) {
          setTracksData((prev) =>
            prev.map((track, index) => {
              const incoming = data.tracksData?.[index];
              if (!incoming) return track;
              return {
                ...track,
                title: typeof incoming.title === 'string' ? incoming.title : track.title,
                description: typeof incoming.description === 'string' ? incoming.description : track.description,
              };
            })
          );
        }
      } catch {
        // keep local defaults if loading shared config fails
      }
    };
    void loadSharedConfig();
  }, [configUrl]);

  useEffect(() => {
    fetch(batchesUrl, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.batches?.length) setSignupBatches(data.batches);
      })
      .catch(() => undefined);
  }, [batchesUrl]);


  const moduleLeavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleTrackSelect(trackId: string) {
    if (trackId === activeTrackId) return;
    if (moduleLeavingTimerRef.current) clearTimeout(moduleLeavingTimerRef.current);
    setModuleLeaving(true);
    moduleLeavingTimerRef.current = setTimeout(() => {
      setActiveTrackId(trackId);
      setModuleLeaving(false);
    }, 180);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.18 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    document.querySelectorAll('[data-fx]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;

    const markScrolling = () => {
      const hud = hudPageRef.current;
      if (!hud) return;
      hud.classList.add('is-scrolling');
      if (scrollSettleTimerRef.current) {
        window.clearTimeout(scrollSettleTimerRef.current);
      }
      scrollSettleTimerRef.current = window.setTimeout(() => {
        hud.classList.remove('is-scrolling');
      }, 150);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(markScrolling);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollSettleTimerRef.current) {
        window.clearTimeout(scrollSettleTimerRef.current);
      }
    };
  }, []);

  const triggerSignupUnlock = useCallback(() => {
    if (signupUnlocked || signupUnlocking) return;
    setSignupUnlocking(true);
    window.setTimeout(() => {
      setSignupUnlocked(true);
      setSignupUnlocking(false);
    }, 560);
  }, [signupUnlocked, signupUnlocking]);

  const preloadImage = useCallback((src: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => undefined).finally(() => resolve());
        return;
      }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }, []);

  const warmupAllAssets = useCallback(async () => {
    if (!preloadAllRef.current) {
      preloadAllRef.current = (async () => {
        const tasks: Array<Promise<unknown>> = [];
        tasks.push(fetch(configUrl, { cache: 'no-store' }).catch(() => undefined));
        if (typeof document !== 'undefined' && 'fonts' in document) {
          tasks.push((document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve());
        }
        tasks.push(Promise.allSettled(preloadImageSources.map((src) => preloadImage(src))));

        await Promise.allSettled(tasks);

        const signupEl = document.getElementById('signup');
        if (signupEl) {
          signupEl.getBoundingClientRect();
          signupEl.querySelectorAll('*').forEach((node) => {
            if (node instanceof HTMLElement) node.getBoundingClientRect();
          });
        }

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      })();
    }
    await preloadAllRef.current;
  }, [configUrl, preloadImage]);

  useEffect(() => {
    void warmupAllAssets();
  }, [warmupAllAssets]);

  const smoothScrollTo = useCallback((targetY: number, duration = 620) => {
    return new Promise<void>((resolve) => {
      const startY = window.scrollY || window.pageYOffset;
      const distance = targetY - startY;
      if (Math.abs(distance) < 2) {
        resolve();
        return;
      }

      const start = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: startY + distance * easeOutCubic(progress), behavior: 'auto' });
        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }
        resolve();
      };
      requestAnimationFrame(step);
    });
  }, []);

  const handleEnrollClick = useCallback(
    async (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (signupUnlocked || signupUnlocking || isEnrollPreparing) return;
      setIsEnrollPreparing(true);
      await warmupAllAssets();

      const signupEl = document.getElementById('signup');
      if (signupEl) {
        setPendingEnrollUnlock(true);
        const y = Math.max(0, signupEl.getBoundingClientRect().top + window.scrollY - 12);
        await smoothScrollTo(y);
      }
      setIsEnrollPreparing(false);
    },
    [isEnrollPreparing, signupUnlocked, signupUnlocking, smoothScrollTo, warmupAllAssets]
  );

  useEffect(() => {
    if (!pendingEnrollUnlock || signupUnlocked || signupUnlocking) return;
    const signupEl = document.getElementById('signup');
    if (!signupEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const reachedTargetZone = entry.boundingClientRect.top <= window.innerHeight * 0.22;
        if (reachedTargetZone || entry.intersectionRatio >= 0.4) {
          triggerSignupUnlock();
          setPendingEnrollUnlock(false);
        }
      },
      { threshold: [0.2, 0.35, 0.5] }
    );
    observer.observe(signupEl);
    return () => observer.disconnect();
  }, [pendingEnrollUnlock, signupUnlocked, signupUnlocking, triggerSignupUnlock]);

  const activeTuning = isPortrait ? (isMobileViewport ? portraitMobileTuning : portraitDesktopTuning) : landscapeTuning;
  const renderBatchDate = (date: string) => {
    const [start, end] = date.split('-').map((part) => part.trim());
    if (!start || !end) return date;
    return (
      <>
        <span>{start}</span>
        <span>-</span>
        <span>{end}</span>
      </>
    );
  };

  useEffect(() => {
    const recalcSignupAnchor = () => {
      if (!heroSectionRef.current || !portraitStageRef.current) return;
      const scrollY = window.scrollY || 0;
      const heroBottom = heroSectionRef.current.getBoundingClientRect().bottom + scrollY;
      const portraitBottom = portraitStageRef.current.getBoundingClientRect().bottom + scrollY;
      setSignupAnchoredMarginTop(portraitBottom - heroBottom + activeTuning.signupOffsetY);
    };

    const raf = requestAnimationFrame(recalcSignupAnchor);
    const onResize = () => recalcSignupAnchor();
    window.addEventListener('resize', onResize);

    const observer = new ResizeObserver(() => recalcSignupAnchor());
    if (heroSectionRef.current) observer.observe(heroSectionRef.current);
    if (portraitStageRef.current) observer.observe(portraitStageRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [
    activeTuning.signupOffsetY,
    activeTuning.portraitStageOffsetY,
    activeTuning.portraitStageGap,
    activeTuning.portraitStageHeight,
    activeTuning.personOffsetY,
    activeTuning.miniBadgesOffsetY,
    isPortrait,
  ]);


  return (
    <div
      ref={hudPageRef}
      className={`hud-page ${isProVariant ? 'theme-elite-red' : 'theme-starter-blue'}`}
      style={
        {
          '--scroll-shift': '0px',
          '--person-offset': `${activeTuning.personOffsetY}px`,
          '--signup-offset': `${activeTuning.signupOffsetY}px`,
          '--mini-badges-top': `${activeTuning.miniBadgesOffsetY}px`,
          '--mini-badge-font-size': `${activeTuning.miniBadgeFontSize}px`,
          '--module-bg-offset-x': `${activeTuning.moduleBgOffsetX}px`,
          '--reserve-timer-size': `${activeTuning.reserveTimerSize}px`,
          '--lock-blur-px': `${activeTuning.lockBlurPx}px`,
          '--portrait-stage-offset-y': `${activeTuning.portraitStageOffsetY}px`,
          '--portrait-stage-gap': `${activeTuning.portraitStageGap}px`,
          '--portrait-stage-height': `${activeTuning.portraitStageHeight}px`,
        } as CSSProperties
      }
    >
      {recaptchaSiteKey ? (
        <Script
          src={
            isRecaptchaEnterprise
              ? `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(recaptchaSiteKey)}`
              : `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`
          }
          strategy="afterInteractive"
          onLoad={() => setRecaptchaReady(true)}
          onError={() => setRecaptchaReady(false)}
        />
      ) : null}

      <div className="global-3d-layer" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
        <span className="wire wire-a" />
        <span className="wire wire-b" />
        <span className="beam beam-a" />
        <span className="beam beam-b" />
      </div>

      <section
        ref={heroSectionRef}
        className="hero-hud"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
          setTilt({ x, y });
        }}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="grid-overlay" aria-hidden="true" />

        <div className="hero-left">
          <p className="sys-label">{texts.heroSysLabel}</p>
          <p className="course-tag">
            {texts.courseTag.includes('免費') ? (
              <>
                <span>{texts.courseTag.split('免費')[0]}</span>
                <span className="course-free">免費</span>
                <span>{texts.courseTag.split('免費')[1]}</span>
              </>
            ) : (
              texts.courseTag
            )}
          </p>
          <h1>
            <span className="title-line">{texts.heroTitle1}</span>
            <br />
            <span className="title-line">{texts.heroTitle2}</span>
          </h1>
          <p className="hero-copy">{texts.heroCopy}</p>

          <div className="hero-feature-grid">
            {heroFeatureCards.map((item, index) => (
              <article
                key={item.title}
                className="hero-feature-card"
                onMouseEnter={() => setActiveSpec(index)}
                onMouseLeave={() => setActiveSpec(null)}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <a href="#signup" className={`btn-primary hero-cta ${isEnrollPreparing ? 'is-preparing' : ''}`}>
            <span
              className="btn-click-capture"
              onClick={handleEnrollClick}
            />
            <span className="btn-led" />
            <span className="btn-text">{texts.cta}</span>
            <span className="btn-code">{isEnrollPreparing ? 'LOADING' : 'ENROLL'}</span>
          </a>
        </div>

        <div
          className="bridge-layer"
          style={{ transform: `translate3d(${tilt.x * 0.4}px, ${tilt.y * -0.3}px, 0)` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 1000 700" preserveAspectRatio="none">
            <path className={activeSpec === 0 || activeSpec === 1 ? 'active' : ''} d="M198 334 L514 236 L752 238" />
            <path className={activeSpec === 2 || activeSpec === 3 ? 'active' : ''} d="M240 492 L520 492 L742 500" />
            <circle cx="198" cy="334" r="5" />
            <circle cx="240" cy="492" r="5" />
            <circle cx="748" cy="155" r="6" />
            <circle cx="752" cy="238" r="6" />
            <circle cx="740" cy="500" r="6" />
          </svg>
          <span className="bridge-tag a">{texts.bridgeBio}</span>
          <span className="bridge-tag c">{texts.bridgeCta}</span>
        </div>

        <div className="hero-right">
          <div className="anchor-code">香菱</div>

          <div ref={portraitStageRef} className="portrait-stage">
            <div className="industrial-shape one" />
            <div className="industrial-shape two" />
            <div className="industrial-shape three" />

            <div
              className="portrait-layer"
              style={{
                transform: `translate3d(${tilt.x * 0.9}px, calc(var(--person-offset) + ${tilt.y * -0.8}px), 0) scale(1.02)`,
              }}
            />
            <div className="portrait-ui-mask" />

            <div className="focus-box" />

            <div className="callout mask">{texts.filterStatus}</div>
            <div className="callout mark">{texts.idMatch}</div>
            <div className="mini-badges">
              <span>1% 交易俱樂部創辦人</span>
              <span>動區年度最有影響力 30 人</span>
              <span>百萬影音創作者</span>
            </div>

            <article className="hud-data-card">
              <p>{texts.subjectStatus}</p>
              <strong>{texts.authStatus}</strong>
              <span>{texts.readyIn}</span>
              <i className="risk-dot" />
            </article>
          </div>

        </div>
      </section>

      <section
        id="signup"
        className={`signup-hud ${signupUnlocked ? 'signup-unlocked' : 'signup-locked'}`}
        style={{ marginTop: `${signupAnchoredMarginTop}px` }}
        data-reveal
      >
        {!signupUnlocked && <p className="lock-step-label">{texts.step1SysLabel}</p>}
        {!signupUnlocked && (
          <button
            className={`signup-unlock-overlay unified-lock-overlay ${signupUnlocking ? 'unlocking' : ''}`}
            onClick={() => triggerSignupUnlock()}
            type="button"
          >
            <strong>{texts.step1Title}</strong>
            <span>{texts.step2UnlockBtnIdle}</span>
          </button>
        )}
        <header>
          <p className="sys-label">{texts.step1SysLabel}</p>
          <h2>{texts.step1Title}</h2>
          <p>選擇下面梯次 為你預留名額</p>
          {batchRequiredBlink && (
            <p style={{ color: '#ff4d4d', fontWeight: 600, marginTop: 4 }}>⚠️ 請先選擇梯次再送出</p>
          )}
          <div className="batch-rail" data-fx>
            <div className="batch-rail-list" ref={railListRef}>
              {signupBatches
                .map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  className={`batch-card ${batch.enabled ? 'enabled' : 'disabled'} ${selectedBatchId === batch.id && !leavingReserved ? 'selected' : ''}`}
                  onClick={(e) => {
                    if (!batch.enabled) return;
                    handleBatchSelect(batch.id, e.currentTarget);
                  }}
                >
                  <strong className="batch-title">{batch.label}</strong>
                  <em className="batch-status">{batch.status}</em>
                  <small className="batch-date">{renderBatchDate(batch.date)}</small>
                </button>
              ))}
              {(enrollReserved || leavingReserved) && !signupSubmitted && (
                <div className="batch-reserve-meta" data-leaving={leavingReserved} role="status" aria-live="polite">
                  {batchCheckState === 'checking' ? (
                    <>
                      <span className="batch-reserve-checking-spinner" />
                      <p className="batch-reserve-note batch-reserve-checking-label">正在為你搶位...</p>
                    </>
                  ) : batchCheckState === 'full' ? (
                    <p className="batch-reserve-full-msg">梯次已滿 請聯絡聯盟小幫手</p>
                  ) : (
                    <>
                      <p className="batch-reserve-note">已為你保留名額，請在限時內完成報名程序。</p>
                      <span className="batch-reserve-timer">{reserveTimeText}</span>
                    </>
                  )}
                </div>
              )}
              <div ref={railSpacerRef} aria-hidden style={{ flexShrink: 0 }} />
            </div>
          </div>
        </header>

        {(selectedBatchId || leavingReserved) && !signupSubmitted && (
          <div className="hud-form-outer" data-leaving={leavingReserved}>
          <form className="hud-form" noValidate onSubmit={handleSignupSubmit}>
            <label>
              <span>{texts.formLineLabel}</span>
              <input name="line_name" type="text" placeholder={texts.formLinePlaceholder} />
            </label>
            <label>
              <span>{texts.formLimeLabel}</span>
              <input name="line_id" type="text" placeholder={texts.formLimePlaceholder} />
            </label>
            <label>
              <span>{texts.formEmailLabel}</span>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                placeholder={texts.formEmailPlaceholder}
                list="email-domain-suggestions"
                onChange={(e) => setEmailInput(e.currentTarget.value)}
              />
            </label>
            <label>
              <span>{texts.formPhoneLabel}</span>
              <input name="phone" type="tel" placeholder={texts.formPhonePlaceholder} />
            </label>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {texts.formUidLabel}
                <a href="https://lin.ee/UteSNuy" target="_blank" rel="noopener noreferrer" style={{ fontSize: '1em', color: '#4a9eff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  還沒「會員編號」點此領取
                </a>
              </span>
              <input name="okx_uid" type="text" placeholder={texts.formUidPlaceholder} />
            </label>
            <input
              name="website_url"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
            <datalist id="email-domain-suggestions">
              {emailSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <fieldset className="level-field">
              <span>{texts.formKnowLabel}</span>
              <div className="level-grid">
                {knowledgeOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`level-chip ${knowledgeLevel === item.value ? 'active' : ''} ${knowledgeRequiredBlink && knowledgeLevel === null ? 'danger' : ''}`}
                    onClick={() => {
                      setKnowledgeLevel(item.value);
                      setKnowledgeRequiredBlink(false);
                    }}
                  >
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className={`range-field ${budgetRequiredBlink ? 'danger' : ''}`}>
              <span>{texts.formBudgetLabel}</span>
              <input
                className="budget-slider"
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={budgetAmount}
                onChange={(e) => {
                  setBudgetAmount(Number(e.target.value));
                  setBudgetTouched(true);
                  setBudgetRequiredBlink(false);
                }}
                style={{ '--budget-progress': `${(budgetAmount / 1000000) * 100}%` } as CSSProperties}
              />
              <small>NT$ {budgetAmount.toLocaleString('zh-TW')}</small>
            </label>
            <div className="form-note">
              <strong>{texts.formNote}</strong>
            </div>
            {recaptchaSiteKey ? (
              <p className="recaptcha-disclosure">
                本站受 reCAPTCHA 保護，適用 Google
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer"> 隱私權政策 </a>
                與
                <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer"> 服務條款</a>。
              </p>
            ) : null}
            <button type="submit" className="btn-primary full" disabled={submitDisabled}>
              <span className="btn-led" />
              <span className="btn-text">
                {isSubmittingSignup ? '送出中...' : recaptchaSiteKey && !recaptchaReady ? '驗證載入中...' : texts.formSubmit}
              </span>
              <span className="btn-code">EXECUTE</span>
            </button>
            {signupSubmitError ? <small style={{ color: '#a12b2b' }}>{signupSubmitError}</small> : null}
          </form>
          </div>
        )}
        {signupSubmitted && (
          <div className="signup-success-screen" role="status" aria-live="polite">
            <h2>
              報名成功！
              <br />
              請聯繫PENHU聯盟小幫手
            </h2>
          </div>
        )}

      </section>

      <section className={`advanced-hud ${mapOpen ? 'advanced-unlocked' : 'advanced-locked'}`} data-reveal>
        {!mapOpen && <p className="lock-step-label">{texts.step2SysLabel}</p>}
        {!mapOpen && (
          <button className="signup-unlock-overlay unified-lock-overlay advanced-lock-overlay" type="button" onClick={() => setMapOpen(true)}>
            <strong>{texts.step2UnlockCopy}</strong>
            <span>{texts.step2UnlockBtnIdle}</span>
          </button>
        )}

        <div className="advanced-content-shell">
          <header>
            <p className="sys-label">{texts.step3SysLabel}</p>
            <h2>{texts.step3Title}</h2>
            <p>{texts.step3Desc}</p>
            <div className="module-floaters" data-fx>
              <span>{texts.step3Tag1}</span>
              <span>{texts.step3Tag2}</span>
              <span>{texts.step3Tag3}</span>
            </div>
          </header>

          <div className="module-stage opened">
            <div className="module-visual" aria-hidden="true">
              <img className="module-portrait" src="/hero-man-cutout.webp" alt="" />
            </div>
            <div className="module-content">
              <div className="module-grid">
                {tracksData.map((track) => (
                  <button
                    key={track.id}
                    className={`module-item ${track.id === activeTrack.id ? 'active' : ''}`}
                    onClick={() => handleTrackSelect(track.id)}
                    type="button"
                  >
                    {track.title}
                  </button>
                ))}
              </div>

              <article className="module-detail pop-in" key={activeTrack.id} data-leaving={moduleLeaving}>
                <p className="status-tag">{texts.step3Status}</p>
                <p>{activeTrack.description}</p>
              </article>

              <a href="#signup" className="btn-primary unlock-cta">
                <span className="btn-led" />
                <span className="btn-text">{texts.step3Cta}</span>
                <span className="btn-code">OPEN</span>
              </a>
            </div>
          </div>
        </div>

      </section>

      <footer className="hud-footer">{texts.footerText}</footer>

    </div>
  );
}
