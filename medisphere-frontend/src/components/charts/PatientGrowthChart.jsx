// src/components/charts/PatientGrowthChart.jsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-xl shadow-card-md px-3 py-2">
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className="text-sm font-bold text-primary-600">{payload[0].value} patients</p>
    </div>
  );
};

export const PatientGrowthChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Area
        type="monotone"
        dataKey="patients"
        stroke="#2563EB"
        strokeWidth={2.5}
        fill="url(#patientGrad)"
        dot={{ fill: '#2563EB', r: 3, strokeWidth: 0 }}
        activeDot={{ r: 5, fill: '#2563EB' }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default PatientGrowthChart;
