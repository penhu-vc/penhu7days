'use client';

import { useEffect, useState } from 'react';

function FlipCard({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center justify-center w-[52px] h-[72px] bg-gradient-to-b from-[#2d2d2d] via-[#1a1a1a] to-[#2d2d2d] rounded-lg border border-[#f18401]/20 shadow-lg relative">
      <span className="text-4xl font-bold text-white" style={{ fontFamily: 'SF Mono, Monaco, monospace', textShadow: '0 0 10px rgba(241,132,1,0.3)' }}>
        {value}
      </span>
      {/* 中間分割線 */}
      <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-black/30" />
    </div>
  );
}

export default function FlipCalendar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-40" />;
  }

  return (
    <div className="inline-block bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border-2 border-[#f18401]/30 rounded-2xl p-7 shadow-2xl">
      {/* 標題 */}
      <div className="text-center mb-5">
        <span className="inline-block px-4 py-1.5 bg-[#f18401]/20 border border-[#f18401]/50 rounded-full">
          <span className="text-[#f18401] font-bold">第一梯</span>
          <span className="text-gray-400 mx-2">•</span>
          <span className="text-gray-300 text-sm">限量 30 位</span>
        </span>
      </div>

      {/* 日期翻牌 - 水平排列 */}
      <div className="flex items-center justify-center gap-1">
        <FlipCard value="3" />
        <span className="text-4xl font-bold text-[#f18401] mx-1">/</span>
        <FlipCard value="0" />
        <FlipCard value="9" />

        {/* 箭頭 */}
        <div className="mx-5">
          <svg className="w-10 h-10 text-[#f18401] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        <FlipCard value="3" />
        <span className="text-4xl font-bold text-[#f18401] mx-1">/</span>
        <FlipCard value="1" />
        <FlipCard value="5" />
      </div>

      {/* 底部說明 */}
      <div className="text-center mt-5 text-gray-400 text-sm">
        ⏱ 每天 10 分鐘 <span className="text-[#f18401] mx-1">•</span> 💰 完全免費
      </div>
    </div>
  );
}
