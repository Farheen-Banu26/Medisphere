import { memo } from 'react';

export const PatientStatusBadge = memo(function PatientStatusBadge({ status }) {
  const styles = {
    Stable: 'bg-emerald-500/10 text-emerald-400',
    Observation: 'bg-amber-500/10 text-amber-400',
    Critical: 'bg-red-500/10 text-red-400',
    'Pending Consent': 'bg-blue-500/10 text-blue-400',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-slate-500/10 text-slate-400'}`}>
      {status || 'Unknown'}
    </span>
  );
});

export default PatientStatusBadge;
