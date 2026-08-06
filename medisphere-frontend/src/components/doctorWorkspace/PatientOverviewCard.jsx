import { memo } from 'react';

export const PatientOverviewCard = memo(function PatientOverviewCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">{title}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
});

export default PatientOverviewCard;
