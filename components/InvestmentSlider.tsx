'use client';

import { useState } from 'react';

const investmentLevels = [
  { value: 'under30k', label: '3萬以內', amount: '< 30K' },
  { value: '30k-100k', label: '3-10萬', amount: '30K-100K' },
  { value: 'over100k', label: '10萬以上', amount: '> 100K' },
];

export default function InvestmentSlider() {
  const [level, setLevel] = useState(0);

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-4">你願意在加密貨幣投入多少新台幣? *</label>

      {/* 顯示當前選擇的金額 */}
      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-[#f18401]">
          {investmentLevels[level].label}
        </span>
      </div>

      {/* 滑桿 */}
      <div className="relative px-2">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="investment-slider w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
        />

        {/* 刻度標籤 */}
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          {investmentLevels.map((item, index) => (
            <span
              key={item.value}
              className={`transition-colors ${level === index ? 'text-[#f18401] font-medium' : ''}`}
            >
              {item.amount}
            </span>
          ))}
        </div>
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name="investment" value={investmentLevels[level].value} required />
    </div>
  );
}
