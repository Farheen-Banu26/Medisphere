// src/pages/PopulationMonitoring/PopulationMonitoring.jsx
// Milestone 3 Population Monitoring Center
// Hospital-wide patient monitoring and operational overview with live KPI metrics,
// hospital status stats, Recharts patient distribution charts, recent critical events,
// and notification delivery logs. Polls every 10 seconds.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RiHospitalLine,
  RiUserLine,
  RiAlertLine,
  RiFireLine,
  RiWifiLine,
  RiHeartPulseLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiFilter3Line,
  RiTimeLine,
  RiBellLine,
  RiBarChartGroupedLine,
  RiPieChartLine,
} from 'react-icons/ri';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { patientService }      from '../../services/patientService';
import { alertService }        from '../../services/alertService';
import { notificationService } from '../../services/notificationService';
import { vitalsService }       from '../../services/vitalsService';
import { twinService }         from '../../services/twinService';
import { useNotification }     from '../../context/NotificationContext';

// ─── Constants & Helpers ───────────────────────────────────────────────────────
const POLL_MS = 10_000;

function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

function fmtTime(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const SEVERITY_CFG = {
  CRITICAL: { cls: 'badge-red',    label: 'Critical' },
  HIGH:     { cls: 'badge-orange', label: 'High' },
  MEDIUM:   { cls: 'badge-yellow', label: 'Medium' },
  LOW:      { cls: 'badge-green',  label: 'Low' },
};

const SeverityBadge = ({ severity }) => {
  const cfg = SEVERITY_CFG[severity?.toUpperCase()] ?? { cls: 'badge-gray', label: severity ?? '—' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

const ALERT_STATUS_CFG = {
  NEW:          { cls: 'badge-red',    label: 'New',          dot: '#f87171' },
  SENT:         { cls: 'badge-yellow', label: 'Sent',         dot: '#fbbf24' },
  DELIVERED:    { cls: 'badge-blue',   label: 'Delivered',    dot: '#60a5fa' },
  ACKNOWLEDGED: { cls: 'badge-purple', label: 'Acknowledged', dot: '#a78bfa' },
  CLOSED:       { cls: 'badge-green',  label: 'Closed',       dot: '#34d399' },
};

const AlertStatusBadge = ({ status }) => {
  const cfg = ALERT_STATUS_CFG[status?.toUpperCase()] ?? { cls: 'badge-gray', label: status ?? '—', dot: '#9ca3af' };
  return (
    <span className={`badge ${cfg.cls} flex items-center gap-1.5 w-fit`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const NOTIF_STATUS_CFG = {
  PENDING:   { cls: 'badge-yellow', label: 'Pending' },
  SENT:      { cls: 'badge-blue',   label: 'Sent' },
  DELIVERED: { cls: 'badge-green',  label: 'Delivered' },
  FAILED:    { cls: 'badge-red',    label: 'Failed' },
};

const NotifStatusBadge = ({ status }) => {
  const cfg = NOTIF_STATUS_CFG[status?.toUpperCase()] ?? { cls: 'badge-gray', label: status ?? '—' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0D1424] border border-[#1F2937] p-2.5 rounded-xl shadow-card-md text-xs">
      <p className="font-semibold text-gray-300 mb-1">{label || payload[0].name}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="font-bold" style={{ color: entry.fill || entry.color || '#60a5fa' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// ─── KPI Top Card Component ───────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, accentColor = 'blue', loading }) => {
  const colors = {
    blue:   { bg: 'bg-blue-600/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
    red:    { bg: 'bg-red-600/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    green:  { bg: 'bg-green-600/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
  };
  const c = colors[accentColor] ?? colors.blue;
  return (
    <div className={`card flex items-center gap-4 p-5 border ${c.border} relative overflow-hidden`}>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">{label}</p>
        {loading ? (
          <div className="skeleton h-7 w-20 rounded mt-1" />
        ) : (
          <p className={`text-2xl font-black ${c.text}`}>{value ?? '—'}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const PopulationMonitoring = () => {
  const { notify } = useNotification();

  // State
  const [patientRows,   setPatientRows]   = useState([]);
  const [allAlerts,     setAllAlerts]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState(null);

  // Time filter: 'ALL' | 'TODAY' | 'LAST_24H' | 'LAST_7D'
  const [timeFilter, setTimeFilter] = useState('ALL');

  const pollingRef   = useRef(null);
  const isMountedRef = useRef(true);

  // ── Fetch Patients & Vitals ──────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    try {
      const pRes = await patientService.getAllPatients();
      const pts = pRes.data ?? [];
      if (!isMountedRef.current) return [];

      const enriched = await Promise.all(
        pts.map(async (p) => {
          const pid = p.patientId || p.id;
          const [vitalsRes, scoreRes] = await Promise.allSettled([
            vitalsService.getLatestVitals(pid),
            twinService.getHealthScore(pid),
          ]);
          const vitals = vitalsRes.status === 'fulfilled' ? vitalsRes.value.data : null;
          const healthScore = scoreRes.status === 'fulfilled' ? scoreRes.value.data : null;
          return { ...p, pid, vitals, healthScore };
        })
      );
      if (isMountedRef.current) setPatientRows(enriched);
      return enriched;
    } catch (err) {
      console.error('[PopulationMonitoring] patients fetch error', err);
      return [];
    }
  }, []);

  // ── Fetch Alerts & Notifications ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [pRes, aRes, nRes] = await Promise.allSettled([
        fetchPatients(),
        alertService.getAll(),
        notificationService.getAll(),
      ]);

      if (!isMountedRef.current) return;

      if (aRes.status === 'fulfilled') setAllAlerts(aRes.value.data ?? []);
      if (nRes.status === 'fulfilled') setNotifications(nRes.value.data ?? []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[PopulationMonitoring] load data error', err);
      notify.error('Data Load Error', 'Failed to refresh population data.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [fetchPatients, notify]);

  // ── Mount & 10s Polling ─────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    pollingRef.current = setInterval(loadData, POLL_MS);
    return () => {
      isMountedRef.current = false;
      clearInterval(pollingRef.current);
    };
  }, [loadData]);

  // ── Filtered Alerts by Time Filter ──────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    if (timeFilter === 'ALL') return allAlerts;

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return allAlerts.filter((a) => {
      if (!a.createdAt) return false;
      const createdTime = new Date(a.createdAt).getTime();
      if (isNaN(createdTime)) return false;

      if (timeFilter === 'TODAY') {
        return createdTime >= startOfToday.getTime();
      }
      if (timeFilter === 'LAST_24H') {
        return createdTime >= now - 24 * 3600 * 1000;
      }
      if (timeFilter === 'LAST_7D') {
        return createdTime >= now - 7 * 24 * 3600 * 1000;
      }
      return true;
    });
  }, [allAlerts, timeFilter]);

  // ── Top KPI Metrics Calculations ─────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalPatients = patientRows.length;

    // Alerts Today (specifically created today regardless of dropdown selection for consistency)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const alertsTodayCount = allAlerts.filter((a) => {
      if (!a.createdAt) return false;
      const t = new Date(a.createdAt).getTime();
      return !isNaN(t) && t >= startOfToday.getTime();
    }).length;

    // Critical Alerts in filtered dataset
    const criticalAlertsCount = filteredAlerts.filter(
      (a) => a.severity?.toUpperCase() === 'CRITICAL'
    ).length;

    // Estimated Device Connectivity: (patients with recent vitals / total patients) * 100
    const patientsWithVitals = patientRows.filter((p) => p.vitals != null).length;
    const connectivityPct =
      totalPatients > 0
        ? Math.round((patientsWithVitals / totalPatients) * 100)
        : 0;

    return {
      onlinePatients: totalPatients,
      alertsToday: alertsTodayCount,
      criticalAlerts: criticalAlertsCount,
      connectivityPct,
      patientsWithVitals,
      totalPatients,
    };
  }, [patientRows, allAlerts, filteredAlerts]);

  // ── Hospital Status Overview (Left Panel) ─────────────────────────────────
  const hospitalStatus = useMemo(() => {
    const totalPatients = patientRows.length;
    const activeAlertsCount = filteredAlerts.filter((a) =>
      ['NEW', 'SENT', 'DELIVERED', 'ACKNOWLEDGED'].includes(a.status?.toUpperCase())
    ).length;
    const closedAlertsCount = filteredAlerts.filter(
      (a) => a.status?.toUpperCase() === 'CLOSED'
    ).length;

    // Avg Health Score
    const scores = patientRows
      .map((p) => p.healthScore)
      .filter((s) => s != null && !isNaN(Number(s)));
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + Number(b), 0) / scores.length)
        : null;

    // Avg Heart Rate
    const hrs = patientRows
      .map((p) => p.vitals?.heartRate)
      .filter((h) => h != null && !isNaN(Number(h)));
    const avgHr =
      hrs.length > 0
        ? Math.round(hrs.reduce((a, b) => a + Number(b), 0) / hrs.length)
        : null;

    // Avg SpO2
    const spo2s = patientRows
      .map((p) => p.vitals?.spo2)
      .filter((s) => s != null && !isNaN(Number(s)));
    const avgSpo2 =
      spo2s.length > 0
        ? Math.round(spo2s.reduce((a, b) => a + Number(b), 0) / spo2s.length)
        : null;

    return {
      totalPatients,
      activeAlertsCount,
      closedAlertsCount,
      avgScore,
      avgHr,
      avgSpo2,
    };
  }, [patientRows, filteredAlerts]);

  // ── Recharts Distribution Data ────────────────────────────────────────────
  // 1. Severity Distribution Data
  const severityChartData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    filteredAlerts.forEach((a) => {
      const sev = a.severity?.toUpperCase();
      if (counts[sev] !== undefined) counts[sev] += 1;
    });

    return [
      { name: 'Critical', value: counts.CRITICAL, color: '#EF4444' },
      { name: 'High',     value: counts.HIGH,     color: '#F97316' },
      { name: 'Medium',   value: counts.MEDIUM,   color: '#F59E0B' },
      { name: 'Low',      value: counts.LOW,      color: '#10B981' },
    ].filter((d) => d.value > 0 || filteredAlerts.length === 0);
  }, [filteredAlerts]);

  // 2. Alert Status Distribution Data
  const statusChartData = useMemo(() => {
    const counts = { NEW: 0, SENT: 0, DELIVERED: 0, ACKNOWLEDGED: 0, CLOSED: 0 };
    filteredAlerts.forEach((a) => {
      const st = a.status?.toUpperCase();
      if (counts[st] !== undefined) counts[st] += 1;
    });

    return [
      { name: 'New',          value: counts.NEW,          fill: '#F87171' },
      { name: 'Sent',         value: counts.SENT,         fill: '#FBBF24' },
      { name: 'Delivered',    value: counts.DELIVERED,    fill: '#60A5FA' },
      { name: 'Acknowledged', value: counts.ACKNOWLEDGED, fill: '#A78BFA' },
      { name: 'Closed',       value: counts.CLOSED,       fill: '#34D399' },
    ];
  }, [filteredAlerts]);

  // 3. Health Score Distribution Data (Patient Risk Categories)
  const healthScoreDistData = useMemo(() => {
    const buckets = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    patientRows.forEach((p) => {
      if (p.healthScore == null) return;
      const score = Number(p.healthScore);
      if (score < 25) buckets.Low += 1;
      else if (score < 50) buckets.Moderate += 1;
      else if (score < 75) buckets.High += 1;
      else buckets.Critical += 1;
    });

    return [
      { category: 'Low (<25)',       patients: buckets.Low,      fill: '#10B981' },
      { category: 'Moderate (25-49)',patients: buckets.Moderate, fill: '#F59E0B' },
      { category: 'High (50-74)',    patients: buckets.High,     fill: '#F97316' },
      { category: 'Critical (≥75)',  patients: buckets.Critical, fill: '#EF4444' },
    ];
  }, [patientRows]);

  // ── Recent Critical Events (Right Panel: Latest 10 Critical Alerts) ───────
  const recentCriticalEvents = useMemo(() => {
    return allAlerts
      .filter((a) => a.severity?.toUpperCase() === 'CRITICAL')
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
      .slice(0, 10);
  }, [allAlerts]);

  // ── Recent Notifications (Bottom Section) ──────────────────────────────────
  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
      .slice(0, 15);
  }, [notifications]);

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ══ Page Header ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiHospitalLine className="w-6 h-6 text-blue-400" />
            Population Monitoring Center
          </h1>
          <p className="page-subtitle">
            Hospital-wide patient monitoring and operational overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs">
            <RiFilter3Line className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 font-semibold">Period:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0D1424]">All Time</option>
              <option value="TODAY" className="bg-[#0D1424]">Today</option>
              <option value="LAST_24H" className="bg-[#0D1424]">Last 24 Hours</option>
              <option value="LAST_7D" className="bg-[#0D1424]">Last 7 Days</option>
            </select>
          </div>

          {/* Refreshed Time */}
          {lastUpdated && (
            <span className="text-xs text-gray-600 font-mono hidden md:block">
              Updated {fmtTime(lastUpdated)}
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-outline btn-sm flex items-center gap-1.5"
          >
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ Top KPI Cards ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Online Patients"
          value={kpis.onlinePatients}
          sub={`${kpis.totalPatients} registered in system`}
          icon={RiUserLine}
          accentColor="blue"
          loading={loading}
        />
        <KpiCard
          label="Alerts Today"
          value={kpis.alertsToday}
          sub="Created since 00:00 today"
          icon={RiAlertLine}
          accentColor={kpis.alertsToday > 0 ? 'yellow' : 'green'}
          loading={loading}
        />
        <KpiCard
          label="Critical Alerts"
          value={kpis.criticalAlerts}
          sub="Immediate action required"
          icon={RiFireLine}
          accentColor={kpis.criticalAlerts > 0 ? 'red' : 'green'}
          loading={loading}
        />
        <KpiCard
          label="Device Connectivity"
          value={`${kpis.connectivityPct}%`}
          sub="Estimated Device Connectivity"
          icon={RiWifiLine}
          accentColor={kpis.connectivityPct >= 70 ? 'green' : 'yellow'}
          loading={loading}
        />
      </div>

      {/* ══ 3-Column Dashboard Main Layout ════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[280px_1fr_340px] gap-5 items-start">

        {/* ── LEFT PANEL: Hospital Status Overview ──────────────────────── */}
        <div className="card-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1F2937]">
            <RiHospitalLine className="w-5 h-5 text-blue-400" />
            <h2 className="section-title text-base">Hospital Status</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Total Patients</span>
              <span className="font-bold text-white font-mono text-sm">{hospitalStatus.totalPatients}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Active Alerts</span>
              <span className="font-bold text-amber-400 font-mono text-sm">{hospitalStatus.activeAlertsCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Closed Alerts</span>
              <span className="font-bold text-green-400 font-mono text-sm">{hospitalStatus.closedAlertsCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <RiShieldCheckLine className="w-3.5 h-3.5 text-blue-400" /> Avg Health Score
              </span>
              <span className="font-bold text-blue-300 font-mono text-sm">
                {hospitalStatus.avgScore != null ? hospitalStatus.avgScore : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <RiHeartPulseLine className="w-3.5 h-3.5 text-red-400" /> Avg Heart Rate
              </span>
              <span className="font-bold text-red-300 font-mono text-sm">
                {hospitalStatus.avgHr != null ? `${hospitalStatus.avgHr} bpm` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-2 rounded-xl border border-[#1F2937]">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <RiHeartPulseLine className="w-3.5 h-3.5 text-cyan-400" /> Avg SpO₂
              </span>
              <span className="font-bold text-cyan-300 font-mono text-sm">
                {hospitalStatus.avgSpo2 != null ? `${hospitalStatus.avgSpo2}%` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL: Patient Distribution Charts ──────────────────── */}
        <div className="card-lg space-y-6 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <RiPieChartLine className="w-5 h-5 text-blue-400" />
              <h2 className="section-title text-base">Patient &amp; Alert Distribution</h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">Recharts Visuals</span>
          </div>

          {/* Chart 1: Severity Distribution & Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Severity Donut Chart */}
            <div className="bg-surface-2/40 p-4 rounded-xl border border-[#1F2937]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <RiFireLine className="w-4 h-4 text-red-400" /> Severity Breakdown
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => <span style={{ fontSize: '11px', color: '#9ca3af' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Alert Status Bar Chart */}
            <div className="bg-surface-2/40 p-4 rounded-xl border border-[#1F2937]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <RiBarChartGroupedLine className="w-4 h-4 text-blue-400" /> Lifecycle Status
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Alerts" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Health Score Risk Distribution */}
          <div className="bg-surface-2/40 p-4 rounded-xl border border-[#1F2937]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <RiShieldCheckLine className="w-4 h-4 text-green-400" /> Patient Risk Categories (Health Score)
            </p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={healthScoreDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="patients" name="Patients" radius={[4, 4, 0, 0]}>
                  {healthScoreDistData.map((entry, index) => (
                    <Cell key={`risk-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── RIGHT PANEL: Recent Critical Events ───────────────────────── */}
        <div className="card-lg space-y-4 lg:col-span-2 xl:col-span-1 min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <RiFireLine className="w-5 h-5 text-red-400" />
              <h2 className="section-title text-base">Critical Events</h2>
            </div>
            <span className="badge badge-red font-mono text-[10px]">
              Latest {recentCriticalEvents.length}
            </span>
          </div>

          {recentCriticalEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <RiShieldCheckLine className="w-8 h-8 mx-auto mb-2 opacity-30 text-green-400" />
              <p className="text-xs">No critical events recorded.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scroll pr-1">
              {recentCriticalEvents.map((evt) => (
                <div
                  key={evt.alertId || evt.id}
                  className="p-3 bg-surface-2 rounded-xl border border-[#1F2937] border-l-2 border-l-red-500 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-300">{evt.patientId ?? '—'}</span>
                    <SeverityBadge severity={evt.severity} />
                  </div>
                  <p className="text-xs font-semibold text-gray-200 truncate">{evt.type ?? 'Critical Alert'}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#1F2937]/40">
                    <AlertStatusBadge status={evt.status} />
                    <span className="font-mono">{fmtDateTime(evt.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM SECTION: Recent Notifications Table ════════════════════ */}
      <div className="card-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
          <div className="flex items-center gap-2">
            <RiBellLine className="w-5 h-5 text-blue-400" />
            <h2 className="section-title text-base">Recent Notifications</h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {recentNotifications.length} items logged
          </span>
        </div>

        <div className="overflow-x-auto custom-scroll rounded-xl border border-[#1F2937]">
          <table className="data-table w-full min-w-[650px]">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Patient ID</th>
                <th>Alert Type</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Created Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Loading notifications…
                  </td>
                </tr>
              )}

              {!loading && recentNotifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <RiBellLine className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications recorded.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                recentNotifications.map((n) => (
                  <tr key={n.notificationId || n.id}>
                    <td className="text-xs text-gray-200 font-semibold">{n.recipient ?? '—'}</td>
                    <td className="font-mono text-xs text-blue-300">{n.patientId ?? '—'}</td>
                    <td className="text-xs text-gray-400">{n.alertType ?? '—'}</td>
                    <td>
                      <span className="badge badge-cyan">{n.channel ?? 'IN_APP'}</span>
                    </td>
                    <td>
                      <NotifStatusBadge status={n.status} />
                    </td>
                    <td className="font-mono text-xs text-gray-500">{fmtDateTime(n.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Auto-refresh indicator ════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600 pb-2">
        <RiWifiLine className="w-3.5 h-3.5 text-green-500" />
        Auto-refreshing population metrics every {POLL_MS / 1000}s
      </div>
    </div>
  );
};

export default PopulationMonitoring;
