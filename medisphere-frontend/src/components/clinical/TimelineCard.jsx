import { memo } from 'react';

export const TimelineCard = memo(function TimelineCard({ title, detail, timestamp }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{timestamp}</p>
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{detail}</p>
    </div>
  );
});

export default TimelineCard;
