import { memo } from 'react';

export const ExplainabilityPanel = memo(function ExplainabilityPanel({ items = [], fallbackMessage }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">
        {fallbackMessage || 'Explainability data is not available from the current backend.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-2 text-sm text-gray-400">{item.value}</p>
        </div>
      ))}
    </div>
  );
});

export default ExplainabilityPanel;
