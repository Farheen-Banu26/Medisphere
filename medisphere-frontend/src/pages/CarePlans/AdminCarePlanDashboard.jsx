// src/pages/CarePlans/AdminCarePlanDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  RiBarChartLine,
  RiPieChartLine,
  RiRefreshLine,
  RiHeartPulseLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPercentLine,
  RiGroupLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiCheckDoubleLine,
  RiTableLine,
} from 'react-icons/ri';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import carePlanService from '../../services/carePlanService';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/common/Spinner';

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-[#0D1424] border border-[#1F2937] rounded-xl shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-300">{data.name}</p>
      <p className="font-bold mt-0.5" style={{ color: data.payload.color }}>
        {data.value} Patients
      </p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1424] border border-[#1F2937] rounded-xl shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-300 mb-1">Adherence Range: {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold text-blue-400">
          Patients: {p.value}
        </p>
      ))}
    </div>
  );
};

export const AdminCarePlanDashboard = () => {
  const { notify } = useNotification();

  // Data States
  const [summary, setSummary] = useState(null);
  const [riskData, setRiskData] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sumRes, riskRes, adhRes] = await Promise.allSettled([
        carePlanService.getDashboardSummary(),
        carePlanService.getRiskDistribution(),
        carePlanService.getAdherenceDistribution(),
      ]);

      // Process Summary
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data || null);
      }

      // Process Risk Distribution
      if (riskRes.status === 'fulfilled' && riskRes.value.data) {
        const raw = riskRes.value.data;
        const formatted = [
          { name: 'HIGH', value: raw.HIGH || raw.high || 0, color: '#EF4444' },
          { name: 'MODERATE', value: raw.MODERATE || raw.moderate || raw.MEDIUM || raw.medium || 0, color: '#F59E0B' },
          { name: 'LOW', value: raw.LOW || raw.low || 0, color: '#10B981' },
        ];
        setRiskData(formatted);
      } else {
        // Fallback if summary exists
        const s = sumRes.status === 'fulfilled' ? sumRes.value.data : null;
        setRiskData([
          { name: 'HIGH', value: s?.highRiskPatients || 0, color: '#EF4444' },
          { name: 'MODERATE', value: s?.moderateRiskPatients || 0, color: '#F59E0B' },
          { name: 'LOW', value: s?.lowRiskPatients || 0, color: '#10B981' },
        ]);
      }

      // Process Adherence Distribution
      if (adhRes.status === 'fulfilled' && adhRes.value.data) {
        const raw = adhRes.value.data;
        const formatted = [
          { bucket: '0–25%', count: raw['0-25'] || raw['0-25%'] || raw['0–25%'] || 0 },
          { bucket: '26–50%', count: raw['26-50'] || raw['26-50%'] || raw['26–50%'] || 0 },
          { bucket: '51–75%', count: raw['51-75'] || raw['51-75%'] || raw['51–75%'] || 0 },
          { bucket: '76–100%', count: raw['76-100'] || raw['76-100%'] || raw['76–100%'] || 0 },
        ];
        setAdherenceData(formatted);
      }
    } catch (err) {
      console.error('Error fetching admin care plan analytics:', err);
      if (isManual) {
        notify.error('Refresh Failed', 'Unable to reload dashboard analytics.');
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [notify]);

  // Initial Load & Auto-Refresh every 15 seconds
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Metric Rows for Summary Table
  const tableMetrics = [
    { metric: 'Total Care Plans', value: summary?.totalCarePlans ?? 0, desc: 'All care plans generated across the platform' },
    { metric: 'Active Care Plans', value: summary?.activeCarePlans ?? 0, desc: 'Currently active clinical treatment plans' },
    { metric: 'Pending Approval', value: summary?.pendingApproval ?? 0, desc: 'Care plans awaiting physician review' },
    { metric: 'Approved Care Plans', value: summary?.approvedCarePlans ?? 0, desc: 'Care plans validated and approved by doctors' },
    { metric: 'Rejected Care Plans', value: summary?.rejectedCarePlans ?? 0, desc: 'Care plans returned for revision or adjustment' },
    { metric: 'Completed Care Plans', value: summary?.completedCarePlans ?? 0, desc: 'Care plans successfully finished' },
    {
      metric: 'Average Adherence',
      value: summary?.averageAdherence !== undefined ? `${Number(summary.averageAdherence).toFixed(1)}%` : '0.0%',
      desc: 'Platform-wide average patient compliance rate',
    },
    {
      metric: 'Average Risk Reduction',
      value: summary?.averageRiskReduction !== undefined ? `${Number(summary.averageRiskReduction).toFixed(1)}%` : '0.0%',
      desc: 'Average patient risk improvement score',
    },
    { metric: 'High Risk Patients', value: summary?.highRiskPatients ?? 0, desc: 'Patients classified under High Risk category' },
    { metric: 'Moderate Risk Patients', value: summary?.moderateRiskPatients ?? 0, desc: 'Patients classified under Moderate Risk category' },
    { metric: 'Low Risk Patients', value: summary?.lowRiskPatients ?? 0, desc: 'Patients classified under Low Risk category' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiBarChartLine className="w-7 h-7 text-blue-400" />
            Care Plan Analytics Dashboard
          </h1>
          <p className="page-subtitle">
            Executive oversight of care plan generation, doctor approvals, risk distribution, and patient adherence metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">
            Auto-refreshes every 15s
          </span>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* TOP 11 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* 1. Total Care Plans */}
        <div className="card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Care Plans</p>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <RiHeartPulseLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.totalCarePlans ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Platform total</p>
          </div>
        </div>

        {/* 2. Active Care Plans */}
        <div className="card hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Care Plans</p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <RiShieldCheckLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.activeCarePlans ?? 0}
            </p>
            <p className="text-[10px] text-cyan-400 mt-0.5">Ongoing pathways</p>
          </div>
        </div>

        {/* 3. Pending Approval */}
        <div className="card hover:border-yellow-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Approval</p>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <RiTimeLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.pendingApproval ?? 0}
            </p>
            <p className="text-[10px] text-yellow-400 mt-0.5">Awaiting doctor review</p>
          </div>
        </div>

        {/* 4. Approved Care Plans */}
        <div className="card hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved Care Plans</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RiCheckboxCircleLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.approvedCarePlans ?? 0}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Validated pathways</p>
          </div>
        </div>

        {/* 5. Rejected Care Plans */}
        <div className="card hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rejected Care Plans</p>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <RiCloseCircleLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.rejectedCarePlans ?? 0}
            </p>
            <p className="text-[10px] text-red-400 mt-0.5">Returned by physician</p>
          </div>
        </div>

        {/* 6. Completed Care Plans */}
        <div className="card hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed Care Plans</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <RiCheckDoubleLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.completedCarePlans ?? 0}
            </p>
            <p className="text-[10px] text-indigo-400 mt-0.5">Finished programs</p>
          </div>
        </div>

        {/* 7. Average Adherence */}
        <div className="card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Adherence</p>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <RiPercentLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? (
                <Spinner size="sm" />
              ) : summary?.averageAdherence !== undefined ? (
                `${Number(summary.averageAdherence).toFixed(1)}%`
              ) : (
                '0.0%'
              )}
            </p>
            <p className="text-[10px] text-blue-400 mt-0.5">Overall compliance</p>
          </div>
        </div>

        {/* 8. Average Risk Reduction */}
        <div className="card hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Risk Reduction</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RiShieldCheckLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? (
                <Spinner size="sm" />
              ) : summary?.averageRiskReduction !== undefined ? (
                `${Number(summary.averageRiskReduction).toFixed(1)}%`
              ) : (
                '0.0%'
              )}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Risk improvement score</p>
          </div>
        </div>

        {/* 9. High Risk Patients */}
        <div className="card hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">High Risk Patients</p>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <RiAlertLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.highRiskPatients ?? 0}
            </p>
            <p className="text-[10px] text-red-400 mt-0.5">Urgent intervention</p>
          </div>
        </div>

        {/* 10. Moderate Risk Patients */}
        <div className="card hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Moderate Risk Patients</p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RiGroupLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.moderateRiskPatients ?? 0}
            </p>
            <p className="text-[10px] text-amber-400 mt-0.5">Regular monitoring</p>
          </div>
        </div>

        {/* 11. Low Risk Patients */}
        <div className="card hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Risk Patients</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RiShieldCheckLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.lowRiskPatients ?? 0}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Stable condition</p>
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut Chart */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RiPieChartLine className="w-5 h-5 text-blue-400" />
                Risk Level Distribution
              </h2>
              <p className="text-xs text-gray-400">
                Breakdown of active care plans by predicted patient risk levels (HIGH, MODERATE, LOW).
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex justify-center items-center gap-2 text-gray-400">
              <Spinner size="md" />
              <span>Loading risk distribution chart...</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-xs font-medium text-gray-300 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Adherence Distribution Bar Chart */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RiBarChartLine className="w-5 h-5 text-emerald-400" />
                Adherence Distribution Buckets
              </h2>
              <p className="text-xs text-gray-400">
                Patient population count across adherence completion ranges (0–25%, 26–50%, 51–75%, 76–100%).
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex justify-center items-center gap-2 text-gray-400">
              <Spinner size="md" />
              <span>Loading adherence distribution chart...</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adherenceData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" name="Patients" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY TABLE SECTION */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RiTableLine className="w-5 h-5 text-blue-400" />
              Executive Metrics Summary Table
            </h2>
            <p className="text-xs text-gray-400">
              Consolidated breakdown of platform performance metrics and current operational values.
            </p>
          </div>
          <span className="text-xs text-gray-500 font-mono">11 Metrics Recorded</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center gap-3 text-gray-400">
            <Spinner size="md" />
            <span>Loading summary table data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-1/3">Metric Name</th>
                  <th className="w-1/4">Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {tableMetrics.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/60 transition-colors">
                    <td className="font-semibold text-white text-xs">{row.metric}</td>
                    <td className="font-mono font-bold text-blue-400 text-sm">{row.value}</td>
                    <td className="text-xs text-gray-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCarePlanDashboard;
