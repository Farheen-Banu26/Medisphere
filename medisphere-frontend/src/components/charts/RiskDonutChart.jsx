// src/components/charts/RiskDonutChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-xl shadow-card-md px-3 py-2">
      <p className="text-xs font-semibold text-gray-400">{payload[0].name}</p>
      <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].value} patients
      </p>
    </div>
  );
};

export const RiskDonutChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={55}
        outerRadius={85}
        paddingAngle={3}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend
        iconType="circle"
        iconSize={8}
        formatter={(value) => <span style={{ fontSize: '11px', color: '#6b7280' }}>{value}</span>}
      />
    </PieChart>
  </ResponsiveContainer>
);

export default RiskDonutChart;
