// src/components/charts/FHIRProgressBar.jsx
export const FHIRProgressBar = ({ label, value, max, color = 'primary' }) => {
  const percentage = Math.min(Math.round((value / max) * 100) || 0, 100);
  
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-300">{label}</span>
        <span className="text-xs font-medium text-gray-400">
          {value} / {max} <span className="ml-1 text-gray-400">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${colors[color] || colors.primary}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default FHIRProgressBar;
