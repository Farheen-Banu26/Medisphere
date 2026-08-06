import { memo } from 'react';

export const InsightCard = memo(function InsightCard({ title, value, description, badge }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        {badge && <span className="badge-blue text-[10px]">{badge}</span>}
      </div>
      <p className="mt-3 text-xl font-semibold text-white">{value ?? '—'}</p>
      {description && <p className="mt-2 text-sm text-gray-400">{description}</p>}
    </div>
  );
});

export default InsightCard;
