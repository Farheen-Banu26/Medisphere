import { memo } from 'react';

export const OperationsTimeline = memo(function OperationsTimeline({ items = [] }) {
  if (!items.length) {
    return <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">No recent activity was returned by the current backend.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.title}-${item.timestamp}`} className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{item.timestamp}</p>
          <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
        </div>
      ))}
    </div>
  );
});

export default OperationsTimeline;
