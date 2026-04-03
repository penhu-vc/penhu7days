'use client';

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';

type BatchCheckState = 'idle' | 'checking' | 'full' | 'available';
import styles from './prov2.module.css';

type AbilityCard = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  badge: string;
  label: string;
};

type CurriculumBlock = {
  id: string;
  title: string;
  items: string[];
  badge: string;
};

type CoreSystemCard = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  badge: string;
  label: string;
  items?: string[];
};

type FaqItem = {
  question: string;
  answer: string;
};

type DecodedLineProps = {
  text: string;
  delayMs?: number;
};

const interestOptions = [
  '技術分析（K 線、指標、買賣點）',
  '幣圈理財（放貸、質押、套利）',
  '宏觀經濟（降息、局勢、牛熊）',
  'Web3 探索（DeFi、空投、新賽道）',
  '資產安全（防詐、冷熱錢包）',
  '實務操作（出入金、買幣、模擬）',
] as const;

const helperLineHref = (process.env.NEXT_PUBLIC_PENHU_LINE_HELPER_URL || 'https://lin.ee/UteSNuy').trim();

type Batch = { id: string; label: string; date: string; available: boolean; status: string };

const BATCH_GREY_DAYS = 2;
const batchDefs = [
  { id: 'batch-1', label: '第一梯', date: '3/16 - 3/22', endDate: new Date(2026, 2, 15) },
  { id: 'batch-2', label: '第二梯', date: '3/30 - 4/5',  endDate: new Date(2026, 2, 29) },
  { id: 'batch-3', label: '第三梯', date: '4/13 - 4/19', endDate: new Date(2026, 3, 12) },
];

function computeVisibleBatches(): Batch[] {
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
        available: !greyed && !expired,
        status: expired ? '已結束' : greyed ? '報名截止' : '已開放',
      };
    });
}

const batchesFallback: Batch[] = computeVisibleBatches();

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const abilities: AbilityCard[] = [
  {
    id: 'wealth',
    title: '幣圈理財系統',
    summary: '學會讓閒置資金不只是放著。',
    detail: '從交易所理財、DCA 到穩定型資金運用，先把「資金怎麼開始動」建立成基礎習慣。',
    badge: 'ACTIVE',
    label: 'CORE / 01',
  },
  {
    id: 'analysis',
    title: '實戰技術分析',
    summary: '從看不懂盤，到開始有依據地判斷盤。',
    detail: '用指標、SNR、SMC 建立最基本的盤面判斷能力，不靠感覺下單。',
    badge: 'PROTOCOL',
    label: 'CORE / 02',
  },
  {
    id: 'risk',
    title: '資金與風險管理',
    summary: '先守住風險，再談把報酬做大。',
    detail: '理解倉位、風險暴露、停損與資金控管，讓每一次出手都更有結構。',
    badge: 'LOCK-IN',
    label: 'CORE / 03',
  },
];

const curriculum: CurriculumBlock[] = [
  {
    id: 'capital',
    title: '理財與資金運用',
    badge: 'A / CAPITAL',
    items: ['交易所理財功能', 'DCA', '質押', '簡單賺幣'],
  },
  {
    id: 'analysis',
    title: '技術分析',
    badge: 'B / ANALYSIS',
    items: ['指標', 'SNR', 'SMC'],
  },
  {
    id: 'risk',
    title: '策略與風險控制',
    badge: 'C / CONTROL',
    items: ['合約網格基礎', '風險管理', '資金控管'],
  },
];

const coreSystemCards: CoreSystemCard[] = [
  ...abilities,
  ...curriculum.map((group) => ({
    id: `curriculum-${group.id}`,
    title: group.title,
    summary: group.items.join(' / '),
    detail: `本段聚焦 ${group.items.join('、')}，讓你把 ${group.title} 的核心內容直接裝進實戰框架。`,
    badge: group.badge,
    label: `CURRICULUM / ${group.badge.slice(0, 1)}`,
    items: group.items,
  })),
];

const faqItems: FaqItem[] = [
  {
    question: '我沒上過新手課，可以直接報名嗎？',
    answer: '這一階主要開放給已具備前置基礎者。如果你尚未完成新手陪跑課，建議先從前置階段開始。',
  },
  {
    question: '不確定自己有沒有資格，怎麼辦？',
    answer: '可以先聯繫聯盟小幫手確認資格，再決定是否進入本階段。',
  },
  {
    question: '報名後怎麼確認梯次與後續流程？',
    answer: '提交資料後，將依序進行資格確認、梯次安排與後續聯繫。',
  },
];

const heroOutcomeCards = [
  '何時該進場\n何時觀望',
  '活用閒置資產\n獲利生息',
  '不靠感覺\n靠邏輯交易',
] as const;

const heroCapabilityBlocks = [
  {
    title: '幣圈理財印鈔機',
    subtitle: '秒殺傳統定存，解鎖高年化被動收入',
    label: '【 學習幣圈三大理財產品 】',
    body:
      '不用天天死盯盤，手把手教你榨乾交易所的隱藏紅利！學會運用各種低風險理財工具，把交易所當成你的超高利活存銀行。只要設定好，就算行情不動，你的閒置資金也一樣 24 小時在偷偷變多！',
  },
  {
    title: '實戰技術分析',
    subtitle: '看懂盤面，一眼抓出精準買賣點',
    label: '【 實戰技術分析 - SNR｜指標｜SMC 】',
    body:
      '不再到處求明牌，不靠運氣盲猜！我們帶你從基礎的「指標」挖掘趨勢機會，到學會分析「SNR 支撐壓力防線」，接著破解「SMC 聰明錢概念」，一眼看穿主力巨鯨的背後意圖。哪裡該埋伏、哪裡該落跑，你自己就能抓出神準進場點！',
  },
  {
    title: '資金與風險管理',
    subtitle: '了解99%爆倉原因，學會控制風險，打造長期盈利的交易思維',
    label: '【 風險管理與資金控管 】',
    body:
      '散戶為什麼總是被割韭菜？因為不懂得守住利潤！賺得快不如賺得久，這堂課將植入職業操盤手的鐵血紀律。教你如何正確分配下單倉位、設定完美止損，徹底拒絕「賺一百次卻一次爆倉」的悲劇，把獲利穩穩鎖進口袋！',
  },
] as const;

const decodeCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+-=';

function randomDecodeChar() {
  return decodeCharset[Math.floor(Math.random() * decodeCharset.length)] || 'A';
}

function DecodedLine({ text, delayMs = 0 }: DecodedLineProps) {
  const [mounted, setMounted] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [scrambledChars, setScrambledChars] = useState<string[]>(() => (
    text.split('')
  ));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const startAnimation = () => {
      const startAt = performance.now();
      const revealStepMs = 44;
      const flipStepMs = 56;
      let lastFlipAt = startAt;

      const tick = (now: number) => {
        if (cancelled) return;

        const nextRevealCount = Math.min(
          text.length,
          Math.floor((now - startAt) / revealStepMs),
        );

        setRevealCount(nextRevealCount);

        if (now - lastFlipAt >= flipStepMs && nextRevealCount < text.length) {
          setScrambledChars(text.split('').map((char, index) => {
            if (char === ' ' || index < nextRevealCount) return char;
            return randomDecodeChar();
          }));
          lastFlipAt = now;
        }

        if (nextRevealCount < text.length) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setScrambledChars(text.split(''));
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    timeoutId = setTimeout(startAnimation, delayMs);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [delayMs, mounted, text]);

  return (
    <span className={styles.decodedLine} aria-label={text}>
      {text.split('').map((char, index) => {
        const revealed = !mounted || index < revealCount || char === ' ';
        const displayChar = revealed ? char : (scrambledChars[index] || randomDecodeChar());
        return (
          <span
            key={`${text}-${index}`}
            className={revealed ? styles.decodedCharRevealed : styles.decodedCharEncrypted}
          >
            {displayChar}
          </span>
        );
      })}
    </span>
  );
}

export default function ProV2LandingPage() {
  const [activeSystemCard, setActiveSystemCard] = useState(coreSystemCards[0].id);
  const [activeQuickCard, setActiveQuickCard] = useState<string | null>(null);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [oauthUser, setOauthUser] = useState<{ name: string; email: string; shortCode: string } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batchCheckState, setBatchCheckState] = useState<BatchCheckState>('idle');
  const [reserveSeconds, setReserveSeconds] = useState(30 * 60);
  const batchCheckIdRef = useRef(0);
  const [lineName, setLineName] = useState('');
  const [lineId, setLineId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [okxUid, setOkxUid] = useState('');
  const [interestAreas, setInterestAreas] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [batchError, setBatchError] = useState(false);
  const [batches, setBatches] = useState<Batch[]>(batchesFallback);

  useEffect(() => {
    fetch('/api/batches?variant=prov2', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.batches?.length) {
          setBatches(data.batches.map((b: { id: string; label: string; date: string; enabled: boolean; status: string }) => ({
            id: b.id, label: b.label, date: b.date, available: b.enabled, status: b.status,
          })));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // OAuth session prefill
    fetch('/api/oauth/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        setOauthUser(user);
        setLineName(user.name || '');
        setEmail(user.email || '');
        setOkxUid(user.shortCode || '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) {
      setSelectedBatch(null);
      setBatchCheckState('idle');
      batchCheckIdRef.current++;
    }
  }, [modalOpen]);

  useEffect(() => {
    if (batchCheckState !== 'available') return;
    setReserveSeconds(30 * 60);
    const id = window.setInterval(() => {
      setReserveSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [batchCheckState]);

  useEffect(() => {
    if (reserveSeconds === 0 && batchCheckState === 'available') {
      setSelectedBatch(null);
      setBatchCheckState('idle');
    }
  }, [reserveSeconds, batchCheckState]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const syncTouchMode = () => setIsTouchMode(mediaQuery.matches);

    syncTouchMode();
    mediaQuery.addEventListener('change', syncTouchMode);
    return () => mediaQuery.removeEventListener('change', syncTouchMode);
  }, []);

  const handleSignupClick = useCallback(() => {
    if (oauthUser) {
      setModalOpen(true);
    } else {
      window.location.href = `/api/oauth/login?returnTo=${encodeURIComponent('/pro#signup')}`;
    }
  }, [oauthUser]);

  const handleBatchClick = useCallback(async (batchId: string) => {
    if (selectedBatch === batchId) {
      setSelectedBatch(null);
      setBatchCheckState('idle');
      batchCheckIdRef.current++;
      return;
    }
    setSelectedBatch(batchId);
    setBatchCheckState('checking');
    const checkId = ++batchCheckIdRef.current;
    const minDelay = new Promise((r) => setTimeout(r, 1200));
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
      setBatchCheckState(data?.available === false ? 'full' : 'available');
    } catch {
      await minDelay;
      if (batchCheckIdRef.current !== checkId) return;
      setBatchCheckState('available');
    }
  }, [selectedBatch]);

  function handleSystemCardEnter(cardId: string) {
    if (isTouchMode) return;
    setActiveSystemCard(cardId);
  }

  function handleSystemCardClick(cardId: string) {
    setActiveSystemCard(cardId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBatch) {
      setSubmitState('error');
      setSubmitMessage('請先選擇梯次再送出申請。');
      setBatchError(true);
      setTimeout(() => setBatchError(false), 3000);
      const batchSection = document.querySelector('[class*="batchSection"], [class*="batchRow"], [class*="batchCard"]');
      if (batchSection) batchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (interestAreas.length === 0) {
      setSubmitState('error');
      setSubmitMessage('請至少勾選一項想多了解的主題。');
      return;
    }

    setSubmitState('submitting');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseType: 'pro',
          landingVariant: 'prov2',
          batchId: selectedBatch,
          lineName,
          lineId,
          email,
          phone,
          okxUid,
          knowledgeLevel: 3,
          budgetAmount: 0,
          interestAreas,
          websiteUrl,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || '送出失敗，請稍後再試。');
      }

      setSubmitState('success');
      setSubmitMessage('已送出卡位申請，接下來請聯繫聯盟小幫手完成資格確認。');
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : '送出失敗，請稍後再試。');
    }
  }

  function toggleInterestArea(option: string) {
    setInterestAreas((current) => (
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    ));
  }

  return (
    <main className={styles.pageShell}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.orb} ${styles.orbOne}`} />
        <span className={`${styles.orb} ${styles.orbTwo}`} />
        <span className={`${styles.beam} ${styles.beamOne}`} />
        <span className={`${styles.beam} ${styles.beamTwo}`} />
        <span className={styles.grid} />
        <span className={styles.wire} />
      </div>

      <div className={styles.pageFrame}>
        <section className={`${styles.sectionCard} ${styles.heroSection}`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroMeta}>
              <p>PENHU 交易聯盟</p>
              <p>頂尖交易員養成計劃</p>
            </div>
            <div className={styles.stageBadge}>三階段課程</div>
            <div className={styles.heroTitleGroup}>
              <div className={styles.heroCourseRow}>
                <span className={styles.heroCourseLabel}>實戰班</span>
                <span className={styles.heroStageCard}>Ⅰ 階</span>
              </div>
              <h1 className={styles.heroTitle}>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleNoBreak} ${styles.heroTitleLead}`}>把幣圈的</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleNoBreak}`}>「印鈔技能」</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleLineDelayed} ${styles.heroTitleNoBreak}`}>裝進自己腦袋</span>
              </h1>
            </div>
            <div className={styles.heroIntro}>
              <p className={styles.heroIntroFixed}>
                <span>聽好！</span>
                <span>你以為交易很難？</span>
                <span>其實你只是缺一套對的系統。</span>
                <br className={styles.desktopBr} />
                <span>外面收費十幾萬的精華，</span>
                <span>在 PENHU 交易聯盟，<strong className={styles.freeGlow}>全部免費！</strong></span>
              </p>
            </div>
            <div className={styles.heroQuickGrid}>
              <button
                type="button"
                className={`${styles.heroQuickCard} ${activeQuickCard === 'decision' ? styles.heroQuickCardActive : ''}`}
                onMouseEnter={() => setActiveQuickCard('decision')}
                onMouseLeave={() => setActiveQuickCard(null)}
                onClick={() => setActiveQuickCard('decision')}
              >
                <h3>{heroOutcomeCards[0]}</h3>
              </button>
              <button
                type="button"
                className={`${styles.heroQuickCard} ${activeQuickCard === 'capital' ? styles.heroQuickCardActive : ''}`}
                onMouseEnter={() => setActiveQuickCard('capital')}
                onMouseLeave={() => setActiveQuickCard(null)}
                onClick={() => setActiveQuickCard('capital')}
              >
                <h3>{heroOutcomeCards[1]}</h3>
              </button>
              <button
                type="button"
                className={`${styles.heroQuickCard} ${activeQuickCard === 'execution' ? styles.heroQuickCardActive : ''}`}
                onMouseEnter={() => setActiveQuickCard('execution')}
                onMouseLeave={() => setActiveQuickCard(null)}
                onClick={() => setActiveQuickCard('execution')}
              >
                <h3>{heroOutcomeCards[2]}</h3>
              </button>
            </div>

            <div className={styles.heroActions}>
              <button className={styles.primaryButton} type="button" onClick={handleSignupClick}>
                立即卡位 7 天實戰班
              </button>
              <a className={styles.heroTextLink} href={helperLineHref} target="_blank" rel="noreferrer">
                確認報名資格？
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroPortraitWrap}>
              <div className={styles.scanFrame} aria-hidden="true" />
              <div className={styles.scanLabel}>ACCESS / VERIFIED</div>
              <img className={styles.heroPortrait} src="/hero-man-cutout.webp" alt="柯男" />
            </div>

            <aside className={styles.authorityPanel}>
              <p className={styles.panelLabel}>AUTHORITY PANEL</p>
              <h2>柯男</h2>
              <ul>
                <li>星鏈學院創始人</li>
                <li>動區年度影響力人物</li>
                <li>全球頭部交易所特邀導師</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.sectionCard} id="core-system">
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>SECTION 02 / CORE SYSTEM</p>
            <h2>解鎖核心能力</h2>
          </div>

          <div className={styles.coreSystemBand}>
            <div className={styles.marqueeViewport}>
              <div className={styles.marqueeTrack}>
                {[...coreSystemCards, ...coreSystemCards].map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    className={`${styles.systemCard} ${activeSystemCard === item.id ? styles.systemCardActive : ''}`}
                    onMouseEnter={() => handleSystemCardEnter(item.id)}
                    onFocus={() => setActiveSystemCard(item.id)}
                    onClick={() => handleSystemCardClick(item.id)}
                  >
                    <div className={styles.systemCardTopline}>
                      <span className={styles.systemCardLabel}>{item.label}</span>
                      <span className={styles.cardStatus}>{item.badge}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    {item.items ? (
                      <div className={styles.systemChipList}>
                        {item.items.map((chip) => (
                          <span key={`${item.id}-${chip}-${index}`} className={styles.systemChip}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.capabilityStack}>
              {heroCapabilityBlocks.map((block) => (
                <article key={block.title} className={styles.capabilityCard}>
                  <p className={styles.capabilityTitle}>{block.title}</p>
                  <p className={styles.capabilitySubtitle}>{block.subtitle}</p>
                  <p className={styles.capabilityLabel}>{block.label}</p>
                  <p className={styles.capabilityBody}>{block.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionCard} id="eligibility">
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>SECTION 03 / ACCESS CHECK</p>
            <h2>符合資格，現在就能卡位。</h2>
          </div>

          <div className={styles.eligibilityShell}>
            <article className={styles.eligibilityCard}>
              <p className={styles.panelLabel}>ACCESS RULE</p>
              <p className={styles.eligibilityLead}>符合以下任一條件即可報名：</p>
              <ul className={styles.eligibilityList}>
                <li>已上過新手陪跑課程</li>
                <li>已具備 PENHU 聯盟 VIP 資格</li>
              </ul>
              <p className={styles.helperText}>不確定資格，先找聯盟小幫手確認。</p>
              <div className={`${styles.unlockReveal} ${styles.unlockRevealOpen}`}>
                <p>資格確認完成後，就可以直接卡位第一梯。</p>
                <div className={styles.eligibilityCtaRow}>
                  <button className={styles.primaryButton} type="button" onClick={handleSignupClick}>
                    立即卡位 7 天實戰班
                  </button>
                  <a className={styles.heroTextLink} href={helperLineHref} target="_blank" rel="noreferrer">
                    確認報名資格？
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.starterSection}`}>
          <div className={styles.starterCard}>
            <div className={styles.starterMedia}>
              <img className={styles.starterPortrait} src="/hero-woman-starter-trim.webp" alt="香菱" />
            </div>
            <div className={styles.starterCopy}>
              <p className={styles.kicker}>SECTION 04 / STARTER ENTRY</p>
              <h2>還沒完成前置基礎？</h2>
              <p>先從新手陪跑課程開始，補齊基本操作、名詞與基礎觀念，再進入 7 天實戰班會更順。</p>
              <a className={styles.secondaryButton} href="/">
                新手陪跑課程
              </a>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>SECTION 05 / FAQ</p>
            <h2>常見問題</h2>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((item, index) => {
              const open = index === faqOpenIndex;
              return (
                <article key={item.question} className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
                  <button type="button" className={styles.faqQuestion} onClick={() => setFaqOpenIndex(index)}>
                    <span>{item.question}</span>
                    <span className={styles.faqState}>{open ? 'OPEN' : 'LOCKED'}</span>
                  </button>
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.finalSection}`}>
          <div className={styles.finalCtaPanel}>
            <p className={styles.kicker}>SECTION 06 / FINAL CALL</p>
            <h2>
              <span className={styles.finalTitleLine}>把零散資訊</span>
              <span className={styles.finalTitleLine}>變成實戰框架</span>
            </h2>
            <p>符合資格的人，現在就可以開始卡位<br className={styles.mobileBreak} /> 7 天實戰班。</p>
            <div className={styles.finalCtaRow}>
              <button className={styles.primaryButton} type="button" onClick={handleSignupClick}>
                立即卡位 7 天實戰班
              </button>
              <a className={styles.secondaryButton} href={helperLineHref} target="_blank" rel="noreferrer">
                聯繫聯盟小幫手確認資格
              </a>
            </div>
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setModalOpen(false)}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="prov2-signup-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBlock}>
                <p className={styles.panelLabel}>OPEN ACCESS FORM</p>
                <h2 id="prov2-signup-title">立即卡位 7 天實戰班</h2>
              </div>
              <button className={styles.closeButton} type="button" onClick={() => setModalOpen(false)}>
                CLOSE
              </button>
            </div>

            <div className={styles.batchSection}>
              <div className={styles.batchHeader}>
                <span className={styles.batchLabel} style={batchError ? { color: '#ff4d4d' } : undefined}>
                  選擇梯次{batchError && ' ← 請先選擇！'}
                </span>
                {selectedBatch && batchCheckState === 'checking' && (
                  <span className={styles.batchStatusChecking}>
                    <span className={styles.batchStatusSpinner} />
                    正在為你搶位...
                  </span>
                )}
                {selectedBatch && batchCheckState === 'available' && (
                  <span className={styles.batchTimer}>
                    <span className={styles.batchTimerDot} />
                    名額保留 {formatTimer(reserveSeconds)}
                  </span>
                )}
                {selectedBatch && batchCheckState === 'full' && (
                  <span className={styles.batchStatusFull}>
                    梯次已滿 請聯絡聯盟小幫手
                  </span>
                )}
              </div>
              <div className={styles.batchRow}>
                {batches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    disabled={!batch.available}
                    onClick={() => batch.available && handleBatchClick(batch.id)}
                    className={`${styles.batchCard} ${!batch.available ? styles.batchCardDisabled : selectedBatch === batch.id ? styles.batchCardActive : ''}`}
                  >
                    <span className={styles.batchCardLabel}>{batch.label}</span>
                    <span className={styles.batchCardDate}>{batch.date}</span>
                    <span className={styles.batchCardStatus}>
                      {selectedBatch === batch.id ? '✓ 已選' : batch.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit} noValidate>
              <label>
                <span>LINE名稱 *</span>
                <input value={lineName} onChange={(event) => setLineName(event.target.value)} required />
              </label>
              <label>
                <span>您的 LINE ID</span>
                <input value={lineId} onChange={(event) => setLineId(event.target.value)} />
              </label>
              <label>
                <span>Email *</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                <span>電話 *</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              <label className={styles.fullWidth}>
                <span>PENHU會員 UID *</span>
                <input value={okxUid} onChange={(event) => setOkxUid(event.target.value)} required />
              </label>
              <fieldset className={`${styles.fullWidth} ${styles.checkboxFieldset}`}>
                <legend>你想多了解加密貨幣哪方面 *</legend>
                <div className={styles.checkboxGrid}>
                  {interestOptions.map((option) => (
                    <label key={option} className={styles.checkboxCard}>
                      <input
                        type="checkbox"
                        checked={interestAreas.includes(option)}
                        onChange={() => toggleInterestArea(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <p className={styles.checkboxHint}>複選</p>
              </fieldset>
              <label className={styles.honeypot}>
                <span>Website</span>
                <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>

              <div className={styles.formFooter}>
                <p>送出後安排資格確認與後續聯繫。<br />畢業後可報名進階課程。</p>
                <button className={styles.primaryButton} type="submit" disabled={submitState === 'submitting'}>
                  {submitState === 'submitting' ? '送出中...' : '送出申請'}
                </button>
              </div>

              {submitMessage ? (
                <p className={`${styles.formMessage} ${submitState === 'success' ? styles.formMessageSuccess : styles.formMessageError}`}>
                  {submitMessage}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
