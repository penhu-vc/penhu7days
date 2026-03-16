export type UniverseSiteStage = "live" | "building" | "planned";

export type UniverseSite = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  stage: UniverseSiteStage;
  href?: string;
  localHref?: string;
  tags: string[];
};

export const universeSites: UniverseSite[] = [
  {
    id: "penhu-7days",
    name: "Penhu 新手七天陪跑課",
    subtitle: "目前主站",
    description: "目前正式報名頁與課程解鎖流程。",
    stage: "live",
    href: "https://penhu.xyz",
    localHref: "http://localhost:3000",
    tags: ["Next.js", "Signup", "Google Sheet"],
  },
  {
    id: "penhu-universe-hub",
    name: "Penhu 宇宙入口",
    subtitle: "本地中控入口",
    description: "聚合所有 Penhu 專案入口，後續站點都從這裡進入。",
    stage: "live",
    localHref: "http://localhost:3000/universe",
    tags: ["Local", "Hub", "Directory"],
  },
  {
    id: "penhu-strategy-map",
    name: "Penhu 策略地圖站",
    subtitle: "下一個模組",
    description: "策略拆解、教案地圖、進階關卡入口。",
    stage: "building",
    tags: ["Course", "Map", "Stage 2"],
  },
  {
    id: "penhu-member-portal",
    name: "Penhu 會員中心",
    subtitle: "預留卡位",
    description: "會員資料、任務進度、權限管理。",
    stage: "planned",
    tags: ["Member", "Auth", "Dashboard"],
  },
  {
    id: "penhu-content-lab",
    name: "Penhu 內容工廠",
    subtitle: "預留卡位",
    description: "短影音腳本、素材排程與內容生產流程。",
    stage: "planned",
    tags: ["Content", "Ops", "Automation"],
  },
  {
    id: "penhu-trading-lab",
    name: "Penhu 交易實驗室",
    subtitle: "預留卡位",
    description: "交易策略回測、觀測儀表與數據追蹤。",
    stage: "planned",
    tags: ["Data", "Backtest", "Research"],
  },
];
