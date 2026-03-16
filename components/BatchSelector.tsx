'use client';

import { useState } from 'react';

interface Batch {
  id: string;
  name: string;
  date: string;
  available: boolean;
}

const batches: Batch[] = [
  { id: 'batch1', name: '第一梯', date: '3/9 - 3/15', available: true },
  { id: 'batch2', name: '第二梯', date: '3/16 - 3/22', available: false },
  { id: 'batch3', name: '第三梯', date: '3/23 - 3/29', available: false },
  { id: 'batch4', name: '第四梯', date: '3/30 - 4/5', available: false },
  { id: 'batch5', name: '第五梯', date: '4/6 - 4/12', available: false },
];

export default function BatchSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-3">你想報名的課程是? *</label>

      {/* 橫向滾動的卡片列表 */}
      <div className="batch-scroll-container overflow-x-auto pb-3 -mx-2 px-2">
        <div className="flex gap-3" style={{ paddingRight: '100px' }}>
          {batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => batch.available && setSelected(batch.id)}
              className={`
                flex-shrink-0 w-[130px] p-4 rounded-xl border-2 transition-all duration-300
                ${batch.available
                  ? selected === batch.id
                    ? 'bg-[#f18401]/20 border-[#f18401] cursor-pointer scale-105'
                    : 'bg-[#0a0a0a] border-gray-700 hover:border-[#f18401]/50 cursor-pointer hover:scale-102'
                  : 'bg-[#0a0a0a]/50 border-gray-800 cursor-not-allowed opacity-50'
                }
              `}
            >
              {/* 梯次名稱 */}
              <div className={`font-bold text-lg mb-1 ${selected === batch.id && batch.available ? 'text-[#f18401]' : 'text-white'}`}>
                {batch.name}
              </div>

              {/* 日期 */}
              <div className="text-xs text-gray-400 mb-2">
                {batch.date}
              </div>

              {/* 狀態標籤 */}
              {batch.available ? (
                selected === batch.id ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#f18401] font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    已選擇
                  </span>
                ) : (
                  <span className="text-xs text-green-400 font-medium">
                    ● 開放中
                  </span>
                )
              ) : (
                <span className="text-xs text-gray-500">
                  🔒 尚未開放
                </span>
              )}
            </div>
          ))}

          {/* 更多課程提示 */}
          <div className="flex-shrink-0 w-[130px] p-4 rounded-xl border-2 border-dashed border-gray-700/50 flex flex-col items-center justify-center text-gray-500">
            <span className="text-2xl mb-1">📅</span>
            <span className="text-xs text-center">更多梯次<br/>敬請期待</span>
          </div>

          {/* 額外空間讓滾動更自然 */}
          <div className="flex-shrink-0 w-[50px]"></div>
        </div>
      </div>

      {/* 滾動提示 */}
      {!selected && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span>👆 請選擇梯次</span>
          <span className="text-gray-600">|</span>
          <span>← 左右滑動查看更多 →</span>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="batch" value={selected || ''} required />
    </div>
  );
}
