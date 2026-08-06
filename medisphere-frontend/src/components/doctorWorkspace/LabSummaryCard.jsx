import { memo } from 'react';

export const LabSummaryCard = memo(function LabSummaryCard({ labs }) {
  if (!labs || typeof labs !== 'object' || !Object.keys(labs).length) {
    return <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">Lab summary is not available from the current backend.</div>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(labs).slice(0, 5).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
          <span>{key}</span>
          <span className="font-medium text-white">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
});

export default LabSummaryCard;
