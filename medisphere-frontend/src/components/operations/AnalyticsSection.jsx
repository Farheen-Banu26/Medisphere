import { memo } from 'react';
import { RiskDonutChart } from '../charts/RiskDonutChart';
import { MonthlyActivityChart } from '../charts/MonthlyActivityChart';

export const AnalyticsSection = memo(function AnalyticsSection({ chartData, activityData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Risk Distribution</p>
        <div className="mt-3 h-64">
          <RiskDonutChart data={chartData} />
        </div>
      </div>
      <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Activity Overview</p>
        <div className="mt-3 h-64">
          <MonthlyActivityChart data={activityData} />
        </div>
      </div>
    </div>
  );
});

export default AnalyticsSection;
