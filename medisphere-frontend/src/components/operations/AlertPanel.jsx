import { memo } from 'react';
import { RiAlertLine, RiShieldCheckLine, RiHeartPulseLine, RiTestTubeLine } from 'react-icons/ri';

const icons = {
  highRisk: RiAlertLine,
  consent: RiShieldCheckLine,
  vitals: RiHeartPulseLine,
  labs: RiTestTubeLine,
};

export const AlertPanel = memo(function AlertPanel({ alerts = [] }) {
  if (!alerts.length) {
    return <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">No operational alerts were returned by the current backend.</div>;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = icons[alert.type] || RiAlertLine;
        return (
          <div key={`${alert.title}-${alert.detail}`} className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="mt-1 text-sm text-gray-400">{alert.detail}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default AlertPanel;
