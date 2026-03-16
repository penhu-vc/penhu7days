'use client';

import { useState } from 'react';

interface TimelineItemProps {
  title: string;
  description: string;
  status: 'done' | 'pending';
  index: number;
}

export default function TimelineItem({ title, description, status, index }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isLeft = index % 2 === 0;

  return (
    <div className="relative flex items-center w-full mb-8">
      {/* 左側卡片 */}
      <div className={`w-5/12 ${isLeft ? 'pr-8' : 'invisible'}`}>
        {isLeft && (
          <div
            className="timeline-card p-4 text-right"
            onClick={() => setExpanded(!expanded)}
          >
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <div className={`expand-content ${expanded ? 'expanded' : ''}`}>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {description}
              </p>
            </div>
            <span className="text-xs text-primary mt-2 inline-block">
              {expanded ? '收合 ▲' : '展開 ▼'}
            </span>
          </div>
        )}
      </div>

      {/* 中間圓點 */}
      <div className="w-2/12 flex justify-center relative">
        <div className={`timeline-dot ${status}`} />
      </div>

      {/* 右側卡片 */}
      <div className={`w-5/12 ${!isLeft ? 'pl-8' : 'invisible'}`}>
        {!isLeft && (
          <div
            className="timeline-card p-4"
            onClick={() => setExpanded(!expanded)}
          >
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <div className={`expand-content ${expanded ? 'expanded' : ''}`}>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {description}
              </p>
            </div>
            <span className="text-xs text-primary mt-2 inline-block">
              {expanded ? '收合 ▲' : '展開 ▼'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
