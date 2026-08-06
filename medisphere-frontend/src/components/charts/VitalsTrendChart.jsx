// src/components/charts/VitalsTrendChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-xl shadow-card-md px-3 py-2">
      <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const VITALS_CONFIG = {
  heartRate:    { color: '#ef4444', label: 'Heart Rate (bpm)' },
  bpSystolic:   { color: '#2563EB', label: 'BP Systolic' },
  bpDiastolic:  { color: '#7c3aed', label: 'BP Diastolic' },
  temperature:  { color: '#f97316', label: 'Temperature (°F)' },
  spo2:         { color: '#10B981', label: 'SpO2 (%)' },
  steps:        { color: '#14B8A6', label: 'Steps' },
  sleepHours:   { color: '#8b5cf6', label: 'Sleep (hrs)' },
};

export const VitalsTrendChart = ({ data = [], keys = ['heartRate', 'spo2'] }) => (
  <ResponsiveContainer width="100%" height={260}>
    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        formatter={(value) => (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            {VITALS_CONFIG[value]?.label || value}
          </span>
        )}
      />
      {keys.map((key) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={VITALS_CONFIG[key]?.color || '#2563EB'}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

export default VitalsTrendChart;
