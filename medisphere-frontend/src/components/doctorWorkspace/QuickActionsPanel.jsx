import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiHeartPulseLine, RiRobot2Line, RiBarChartLine, RiStethoscopeLine, RiTestTubeLine, RiShieldCheckLine } from 'react-icons/ri';

const actions = [
  { title: 'Open Patient360', path: '/doctor/patient360', icon: RiHeartPulseLine },
  { title: 'Open Clinical Insights', path: '/doctor/clinical-insights', icon: RiStethoscopeLine },
  { title: 'Open Prediction Dashboard', path: '/doctor/predictions', icon: RiRobot2Line },
  { title: 'Open Operations Dashboard', path: '/doctor/operations', icon: RiBarChartLine },
  { title: 'View Vitals', path: '/doctor/vitals', icon: RiHeartPulseLine },
  { title: 'View Labs', path: '/doctor/patient360', icon: RiTestTubeLine },
];

export const QuickActionsPanel = memo(function QuickActionsPanel({ patientId }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(`${action.path}${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ''}`)}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#1F2937] bg-[#08111F] p-4 text-left transition-all hover:border-blue-500/20"
          >
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">{action.title}</span>
          </button>
        );
      })}
    </div>
  );
});

export default QuickActionsPanel;
