// src/components/cards/StatCard.jsx
import { Spinner } from '../common/Spinner';

const trendColors = {
  up: 'text-emerald-600 bg-emerald-50',
  down: 'text-red-500 bg-red-50',
  neutral: 'text-gray-400 bg-surface-2',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  loading = false,
  subtitle,
}) => {
  const colorMap = {
    blue:   { bg: 'bg-primary-50',   icon: 'text-primary-600',   ring: 'ring-primary-100' },
    green:  { bg: 'bg-secondary-50', icon: 'text-secondary-600', ring: 'ring-secondary-100' },
    teal:   { bg: 'bg-accent-50',    icon: 'text-accent-600',    ring: 'ring-accent-100' },
    red:    { bg: 'bg-red-50',       icon: 'text-red-600',       ring: 'ring-red-100' },
    amber:  { bg: 'bg-amber-50',     icon: 'text-amber-600',     ring: 'ring-amber-100' },
    purple: { bg: 'bg-purple-50',    icon: 'text-purple-600',    ring: 'ring-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card hover:shadow-card-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
          <div className="mt-2">
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {value ?? <span className="text-gray-300 text-base">—</span>}
              </p>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && !loading && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${trendColors[trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral']}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
              {trendLabel || `${Math.abs(trend)}%`}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ring-4 ${c.ring} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
