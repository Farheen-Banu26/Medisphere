import { memo } from 'react';

export const OperationsSummaryCard = memo(function OperationsSummaryCard({ title, value, subtitle, tone = 'blue', icon: Icon }) {
  const toneClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value ?? '—'}</p>
          {subtitle && <p className="mt-2 text-sm text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl border p-2 ${toneClasses[tone] || toneClasses.blue}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
});

export default OperationsSummaryCard;
