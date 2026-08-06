// src/components/common/Badge.jsx
const variantMap = {
  success: 'bg-emerald-100 text-emerald-700',
  danger:  'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info:    'bg-blue-100 text-blue-700',
  gray:    'bg-surface-2 text-gray-400',
  accent:  'bg-teal-100 text-teal-700',
  purple:  'bg-purple-100 text-purple-700',
};

export const Badge = ({ variant = 'gray', children, className = '', dot = false }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantMap[variant] || variantMap.gray} ${className}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const config = {
    ACTIVE:    { variant: 'success', label: 'Active' },
    INACTIVE:  { variant: 'gray',    label: 'Inactive' },
    REVOKED:   { variant: 'danger',  label: 'Revoked' },
    EXPIRED:   { variant: 'warning', label: 'Expired' },
    GRANTED:   { variant: 'success', label: 'Granted' },
    PENDING:   { variant: 'warning', label: 'Pending' },
    SUCCESS:   { variant: 'success', label: 'Success' },
    ERROR:     { variant: 'danger',  label: 'Error' },
    WARNING:   { variant: 'warning', label: 'Warning' },
    SYNCED:    { variant: 'success', label: 'Synced' },
    FAILED:    { variant: 'danger',  label: 'Failed' },
    LOW:       { variant: 'success', label: 'Low Risk' },
    MODERATE:  { variant: 'warning', label: 'Moderate' },
    HIGH:      { variant: 'danger',  label: 'High Risk' },
  };
  const cfg = config[status?.toUpperCase()] || { variant: 'gray', label: status || 'Unknown' };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
};

export default Badge;
