import { memo } from 'react';
import { RiCheckboxCircleLine, RiAlertLine } from 'react-icons/ri';

export const SystemHealthCard = memo(function SystemHealthCard({ name, status, detail }) {
  const isHealthy = status === 'UP' || status === 'healthy' || status === 'available';

  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="mt-1 text-sm text-gray-400">{detail}</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {isHealthy ? <RiCheckboxCircleLine className="h-4 w-4" /> : <RiAlertLine className="h-4 w-4" />}
          {status || 'Unknown'}
        </div>
      </div>
    </div>
  );
});

export default SystemHealthCard;
