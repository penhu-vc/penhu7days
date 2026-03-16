'use client';

import TimelineItem from './TimelineItem';

export interface MilestoneData {
  title: string;
  description: string;
  status: 'done' | 'pending';
  order: number;
}

interface TimelineProps {
  milestones: MilestoneData[];
}

export default function Timeline({ milestones }: TimelineProps) {
  // 按 order 排序
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="relative py-8 px-4">
      {/* 中央連接線 */}
      <div className="timeline-line top-0 bottom-0" />

      {/* 時間軸項目 */}
      <div className="relative z-10">
        {sortedMilestones.map((milestone, index) => (
          <TimelineItem
            key={index}
            title={milestone.title}
            description={milestone.description}
            status={milestone.status}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
