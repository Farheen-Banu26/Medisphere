// src/components/charts/MonthlyActivityChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-xl shadow-card-md px-3 py-2">
      <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-medium" style={{ color: p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export const MonthlyActivityChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={8}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        formatter={(value) => <span style={{ fontSize: '11px', color: '#6b7280' }}>{value}</span>}
      />
      <Bar dataKey="vitals" name="Vitals" fill="#2563EB" radius={[4, 4, 0, 0]} />
      <Bar dataKey="consents" name="Consents" fill="#10B981" radius={[4, 4, 0, 0]} />
      <Bar dataKey="fhir" name="FHIR Syncs" fill="#14B8A6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default MonthlyActivityChart;
