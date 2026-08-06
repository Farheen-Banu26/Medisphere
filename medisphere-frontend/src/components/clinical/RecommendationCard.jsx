import { memo } from 'react';

export const RecommendationCard = memo(function RecommendationCard({ title, detail }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-gray-400">{detail}</p>
    </div>
  );
});

export default RecommendationCard;
