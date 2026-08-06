import { memo } from 'react';
import { RiAlertLine, RiCheckboxCircleLine, RiErrorWarningLine } from 'react-icons/ri';

const variants = {
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  danger: 'border-red-500/20 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
};

export const AlertCard = memo(function AlertCard({ title, description, tone = 'info' }) {
  const Icon = tone === 'danger' ? RiErrorWarningLine : tone === 'warning' ? RiAlertLine : RiCheckboxCircleLine;

  return (
    <div className={`rounded-2xl border p-4 ${variants[tone] || variants.info}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
});

export default AlertCard;
