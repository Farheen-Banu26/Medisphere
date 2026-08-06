import { RiRobot2Line, RiBarChartLine, RiShieldCheckLine, RiArrowRightLine, RiCpuLine, RiRefreshLine } from 'react-icons/ri';

const OverviewCard = ({ title, value, unit, icon: Icon, variant }) => (
  <div className={`card flex flex-col p-5 gap-3 ${variant === 'highlight' ? 'border-blue-500/30' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-blue-600/15 flex items-center justify-center text-blue-400">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {unit && <p className="text-xs text-gray-500">{unit}</p>}
  </div>
);

export const Predictions = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiRobot2Line className="w-6 h-6 text-blue-400" /> AI Predictions
          </h1>
          <p className="page-subtitle">Clinical risk scoring, inference management, and model status dashboard.</p>
        </div>
        <button className="btn-primary btn-sm inline-flex items-center gap-2">
          <RiRefreshLine className="w-4 h-4" /> Refresh Predictions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <OverviewCard title="Active Models" value="4" unit="Production ready" icon={RiCpuLine} variant="highlight" />
        <OverviewCard title="Pending Inferences" value="24" unit="Next batch in 8 min" icon={RiBarChartLine} />
        <OverviewCard title="Latest Accuracy" value="92.4%" unit="Diabetes / CVD" icon={RiShieldCheckLine} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prediction Operations</p>
              <h2 className="text-xl font-bold text-white">Latest inference activity</h2>
            </div>
            <button className="btn-outline btn-sm">Review Logs</button>
          </div>
          <div className="overflow-x-auto custom-scroll">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Model</th>
                  <th>Patient</th>
                  <th>Outcome</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: '09:24', model: 'CVD Risk', patient: 'P1003', outcome: 'High', confidence: '91%' },
                  { time: '09:12', model: 'Diabetes Risk', patient: 'P1042', outcome: 'Moderate', confidence: '78%' },
                  { time: '08:58', model: 'Sepsis Alert', patient: 'P1007', outcome: 'Low', confidence: '82%' },
                ].map((item) => (
                  <tr key={`${item.time}-${item.patient}`}>
                    <td className="text-gray-400 text-xs font-mono">{item.time}</td>
                    <td className="text-gray-200 text-sm">{item.model}</td>
                    <td className="text-blue-400 text-sm">{item.patient}</td>
                    <td className="text-sm">{item.outcome}</td>
                    <td className="text-sm text-gray-300">{item.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-lg">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Model Status</p>
          <div className="space-y-4">
            {[
              { name: 'CVD Classifier', version: 'v2.1', status: 'Active' },
              { name: 'Diabetes Predictor', version: 'v1.9', status: 'Staging' },
              { name: 'Sepsis Monitor', version: 'v1.3', status: 'Idle' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 bg-surface-2 rounded-2xl p-4 border border-[#1F2937]">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">Version {item.version}</p>
                </div>
                <span className={`badge ${item.status === 'Active' ? 'badge-green' : item.status === 'Staging' ? 'badge-yellow' : 'badge-gray'}`}>{item.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-right">
            <button className="btn-ghost btn-sm">Manage Models <RiArrowRightLine className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
