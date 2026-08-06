import { memo } from 'react';

export const ConsentSummaryCard = memo(function ConsentSummaryCard({ consent }) {
  if (!consent) {
    return <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">Consent status is not available from the current backend.</div>;
  }

  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <p className="text-sm font-semibold text-white">Consent {consent.status || 'Unknown'}</p>
      <p className="mt-2 text-sm text-gray-400">Purpose: {consent.purpose || 'Not provided'}</p>
      <p className="mt-1 text-sm text-gray-400">Expires: {consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : '—'}</p>
    </div>
  );
});

export default ConsentSummaryCard;
