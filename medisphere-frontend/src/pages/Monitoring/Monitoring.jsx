// src/pages/Monitoring/Monitoring.jsx
// Doctor Monitoring Dashboard — Milestone 3
// Professional ICU command center: live patient vitals, alerts, notifications
// Polls every 5 seconds + receives real-time pushes via SSE notification-stream.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiPulseLine,
  RiAlertLine,
  RiBellLine,
  RiRefreshLine,
  RiFireLine,
  RiHeartPulseLine,
  RiShieldCheckLine,
  RiUserLine,
  RiWifiLine,
  RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri';
import { alertService }       from '../../services/alertService';
import { notificationService } from '../../services/notificationService';
import { patientService }     from '../../services/patientService';
import { vitalsService }      from '../../services/vitalsService';
import { twinService }        from '../../services/twinService';
import { useNotification }    from '../../context/NotificationContext';
import { useAuth }            from '../../auth/AuthProvider';
import { CriticalAlertModal } from '../../components/clinical/CriticalAlertModal';
import { useNotificationStream } from '../../hooks/useNotificationStream';

// ─── Constants ─────────────────────────────────────────────────────────────────
const POLL_MS = 5_000;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return raw;
  }
}

function fmtTime(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return raw;
  }
}

// Map score (0–100) to risk level: lower score = healthier = lower risk
function getRiskFromScore(score) {
  if (score == null || isNaN(score)) return null;
  if (score < 25) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

// ─── Sub-components ────────────────────────────────────────────────────────────
const RiskBadge = ({ risk }) => {
  const cfg = {
    LOW:      { cls: 'badge-green',  label: 'Low'      },
    MODERATE: { cls: 'badge-yellow', label: 'Moderate' },
    HIGH:     { cls: 'badge-orange', label: 'High'     },
    CRITICAL: { cls: 'badge-red',    label: 'Critical' },
  }[risk] ?? { cls: 'badge-gray', label: risk };

  return <span className={`badge ${cfg.cls} text-xs font-semibold`}>{cfg.label}</span>;
};

const SeverityBadge = ({ severity }) => {
  const cfg = {
    CRITICAL: 'badge-red',
    HIGH:     'badge-orange',
    MEDIUM:   'badge-yellow',
    LOW:      'badge-green',
  }[severity?.toUpperCase()] ?? 'badge-gray';

  return <span className={`badge ${cfg} text-[10px] font-bold uppercase`}>{severity}</span>;
};

const AlertStatusBadge = ({ status }) => {
  const cfg = {
    NEW:          { cls: 'badge-red',    label: 'New'          },
    SENT:         { cls: 'badge-yellow', label: 'Sent'         },
    DELIVERED:    { cls: 'badge-blue',   label: 'Delivered'    },
    ACKNOWLEDGED: { cls: 'badge-purple', label: 'Acknowledged' },
    CLOSED:       { cls: 'badge-green',  label: 'Closed'       },
  }[status?.toUpperCase()] ?? { cls: 'badge-gray', label: status };

  return <span className={`badge ${cfg.cls} text-[10px] font-semibold`}>{cfg.label}</span>;
};

const NotifStatusBadge = ({ status }) => {
  const cfg = {
    SENT:      { cls: 'badge-green',  label: 'Sent'      },
    PENDING:   { cls: 'badge-yellow', label: 'Pending'   },
    DELIVERED: { cls: 'badge-blue',   label: 'Delivered' },
    FAILED:    { cls: 'badge-red',    label: 'Failed'    },
  }[status?.toUpperCase()] ?? { cls: 'badge-gray', label: status };

  return <span className={`badge ${cfg.cls} text-[10px] font-semibold`}>{cfg.label}</span>;
};

// ─── Table skeleton row ────────────────────────────────────────────────────────
const SkeletonRow = ({ cols = 8 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <div className="skeleton h-4 rounded w-full" />
      </td>
    ))}
  </tr>
);

// ─── Vital value cell — turns red when outside normal range ───────────────────
const VitalCell = ({ value, normal, unit }) => {
  if (value == null) return <span className="text-gray-600 text-sm">—</span>;
  const isAlert = normal != null && (value < normal[0] || value > normal[1]);
  return (
    <span className={`font-mono text-sm font-semibold ${isAlert ? 'text-red-400' : 'text-gray-200'}`}>
      {value}
      {unit && <span className="text-gray-600 text-xs ml-0.5">{unit}</span>}
    </span>
  );
};

// ─── Summary KPI card ─────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, sub, icon: Icon, accentColor = 'blue', loading }) => {
  const colors = {
    blue:   { bg: 'bg-blue-600/10',   text: 'text-blue-400',   glow: '#3b82f618', border: 'border-blue-500/20'   },
    red:    { bg: 'bg-red-600/10',    text: 'text-red-400',    glow: '#ef444418', border: 'border-red-500/20'    },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: '#f59e0b18', border: 'border-yellow-500/20' },
    green:  { bg: 'bg-green-600/10',  text: 'text-green-400',  glow: '#10b98118', border: 'border-green-500/20'  },
    purple: { bg: 'bg-purple-600/10', text: 'text-purple-400', glow: '#a78bfa18', border: 'border-purple-500/20' },
    cyan:   { bg: 'bg-cyan-600/10',   text: 'text-cyan-400',   glow: '#06b6d418', border: 'border-cyan-500/20'   },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', glow: '#f9731618', border: 'border-orange-500/20' },
  };
  const c = colors[accentColor] ?? colors.blue;
  return (
    <div
      className={`card flex items-center gap-4 p-5 border ${c.border} relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5`}
      style={{ boxShadow: `0 4px 24px ${c.glow}` }}
    >
      <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">{label}</p>
        {loading
          ? <div className="skeleton h-7 w-16 rounded mt-1" />
          : <p className={`text-2xl font-black ${c.text}`}>{value ?? '—'}</p>
        }
        <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
};

// ─── Alert card for right panel ───────────────────────────────────────────────
const SEV_BORDER = {
  CRITICAL: 'border-l-red-500',
  HIGH:     'border-l-orange-500',
  MEDIUM:   'border-l-yellow-500',
  LOW:      'border-l-green-500',
};

const AlertCard = ({ alert, onAcknowledge, onClose, isActionLoading }) => {
  const borderCls = SEV_BORDER[alert.severity?.toUpperCase()] ?? 'border-l-gray-600';
  const statusUpper = alert.status?.toUpperCase() || '';
  const canAck = ['NEW', 'SENT', 'DELIVERED'].includes(statusUpper);
  const canClose = statusUpper === 'ACKNOWLEDGED';

  return (
    <div
      className={`bg-surface-2 rounded-xl p-3.5 border border-[#1F2937] border-l-2 ${borderCls}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <RiUserLine className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs font-bold text-blue-300 font-mono truncate">{alert.patientId ?? '—'}</span>
        </div>
        <SeverityBadge severity={alert.severity} />
      </div>

      {/* Alert type */}
      <p className="text-xs font-semibold text-gray-200 truncate mb-1">
        {alert.type ?? 'Unknown Alert'}
      </p>

      {/* Message (clamped) */}
      {alert.message && (
        <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{alert.message}</p>
      )}

      {/* Footer row with status & action buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1F2937]/50">
        <div className="flex items-center gap-2">
          <AlertStatusBadge status={alert.status} />
          <span className="text-[10px] text-gray-600 font-mono">{fmtTime(alert.createdAt)}</span>
        </div>

        {canAck && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.alertId)}
            disabled={isActionLoading}
            className="btn btn-xs bg-purple-600/80 text-white hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1 text-[11px] py-1 px-2"
          >
            <RiCheckLine className="w-3 h-3" />
            {isActionLoading ? '…' : 'Acknowledge'}
          </button>
        )}

        {canClose && onClose && (
          <button
            onClick={() => onClose(alert.alertId, alert.status)}
            disabled={isActionLoading}
            className="btn btn-xs bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50 flex items-center gap-1 text-[11px] py-1 px-2"
          >
            <RiCloseLine className="w-3 h-3" />
            {isActionLoading ? '…' : 'Close'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
export const Monitoring = () => {
  const { user }   = useAuth();
  const { notify } = useNotification();

  // ── State ─────────────────────────────────────────────────────────────────
  const [patientRows,     setPatientRows]     = useState([]); // patients enriched with vitals + health score
  const [activeAlerts,    setActiveAlerts]    = useState([]);
  const [allAlerts,       setAllAlerts]       = useState([]);
  const [notifications,   setNotifications]   = useState([]);
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [patientsLoading, setPatientsLoading] = useState(true);
  const [alertsLoading,   setAlertsLoading]   = useState(true);
  const [notifLoading,    setNotifLoading]     = useState(true);

  const pollingRef   = useRef(null);
  const isMountedRef = useRef(true);

  // ── Fetch patients + vitals + health score in parallel ──────────────────
  const fetchPatients = useCallback(async () => {
    try {
      const pRes = await patientService.getAllPatients();
      const pts  = pRes.data ?? [];
      if (!isMountedRef.current) return;

      // Fan-out: for each patient, fetch vitals + health-score concurrently
      const enriched = await Promise.all(
        pts.map(async (p) => {
          const pid = p.patientId || p.id;
          const [vitalsRes, scoreRes] = await Promise.allSettled([
            vitalsService.getLatestVitals(pid),
            twinService.getHealthScore(pid),
          ]);
          const vitals      = vitalsRes.status === 'fulfilled' ? vitalsRes.value.data : null;
          const healthScore = scoreRes.status  === 'fulfilled' ? scoreRes.value.data  : null;
          return { ...p, pid, vitals, healthScore };
        })
      );

      if (!isMountedRef.current) return;
      setPatientRows(enriched);
    } catch (err) {
      console.error('[MonitoringDashboard] patients fetch error', err);
    } finally {
      if (isMountedRef.current) setPatientsLoading(false);
    }
  }, []);

  // ── Fetch alerts (Declared BEFORE useNotificationStream) ────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const [activeRes, allRes] = await Promise.allSettled([
        alertService.getActive(),
        alertService.getAll(),
      ]);
      if (!isMountedRef.current) return;
      if (activeRes.status === 'fulfilled') setActiveAlerts(activeRes.value.data ?? []);
      if (allRes.status   === 'fulfilled') setAllAlerts(allRes.value.data ?? []);
    } catch (err) {
      console.error('[MonitoringDashboard] alerts fetch error', err);
    } finally {
      if (isMountedRef.current) setAlertsLoading(false);
    }
  }, []);

  // ── Fetch notifications ────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      if (!isMountedRef.current) return;
      setNotifications(res.data ?? []);
    } catch (err) {
      console.error('[MonitoringDashboard] notifications fetch error', err);
    } finally {
      if (isMountedRef.current) setNotifLoading(false);
    }
  }, []);

  // ── Combined refresh (called on mount + every 5 s) ────────────────────
  const refresh = useCallback(async () => {
    await Promise.all([fetchPatients(), fetchAlerts(), fetchNotifications()]);
    if (isMountedRef.current) setLastUpdated(new Date());
  }, [fetchPatients, fetchAlerts, fetchNotifications]);

  // ── Alert Acknowledge Handler ──────────────────────────────────────────
  const handleAcknowledgeAlert = async (alertId, ackBy) => {
    if (!alertId || actionLoadingId === alertId) return;
    setActionLoadingId(alertId);
    try {
      const name = ackBy || user?.name || user?.preferred_username || user?.username || user?.email || 'Dr. Sarah Jenkins';
      await alertService.acknowledge(alertId, name);
      notify.success('Alert Acknowledged', `Alert ${alertId} acknowledged by ${name}.`);
      await refresh();
    } catch (err) {
      notify.error('Acknowledge Failed', err?.response?.data?.message || err.message);
    }
  };

  // ── Alert Close Handler ────────────────────────────────────────────────
  const handleCloseAlert = async (alertId, currentStatus) => {
    if (!alertId || actionLoadingId === alertId) return;
    // Enforce lifecycle: must be ACKNOWLEDGED before CLOSED
    if (currentStatus?.toUpperCase() !== 'ACKNOWLEDGED') {
      notify.warning(
        'Cannot Close Alert',
        'Alert must be acknowledged before it can be closed. Please acknowledge it first.'
      );
      return;
    }
    setActionLoadingId(alertId);
    try {
      await alertService.close(alertId);
      notify.success('Alert Closed', `Alert ${alertId} has been closed.`);
      await refresh();
    } catch (err) {
      notify.error('Close Failed', err?.response?.data?.message || err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── SSE: receive real-time notification pushes from notification-stream ─
  useNotificationStream(
    useCallback((incoming) => {
      // Prepend the new notification to local state immediately without waiting for poll
      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n.notificationId === incoming.notificationId
        );
        if (exists) return prev;
        return [incoming, ...prev].slice(0, 50); // keep last 50
      });
      // Also trigger an alerts refresh so the dashboard stays in sync
      if (isMountedRef.current) {
        fetchAlerts();
      }
    }, [fetchAlerts]),
    true
  );

  // ── Mount / unmount ────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    refresh();
    pollingRef.current = setInterval(refresh, POLL_MS);
    return () => {
      isMountedRef.current = false;
      clearInterval(pollingRef.current);
    };
  }, [refresh]);

  // ── Derived statistics ─────────────────────────────────────────────────
  const criticalAlertCount = activeAlerts.filter(
    (a) => a.severity?.toUpperCase() === 'CRITICAL'
  ).length;

  // Active Critical Alerts sorted newest first for Critical Alert Popup
  const criticalAlerts = activeAlerts
    .filter(
      (a) =>
        a.severity?.toUpperCase() === 'CRITICAL' &&
        a.status?.toUpperCase() !== 'CLOSED'
    )
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

  const healthScores = patientRows
    .map((r) => r.healthScore)
    .filter((s) => s != null && !isNaN(Number(s)));
  const avgHealthScore =
    healthScores.length > 0
      ? Math.round(
          healthScores.reduce((acc, s) => acc + Number(s), 0) / healthScores.length
        )
      : null;

  // Worst active alert per patient (for the table "Alert Status" column)
  const SEVERITY_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const alertByPatient = {};
  for (const alert of activeAlerts) {
    const pid = alert.patientId;
    if (!pid) continue;
    const prev = alertByPatient[pid];
    const currRank = SEVERITY_ORDER[alert.severity?.toUpperCase()] ?? 0;
    const prevRank = SEVERITY_ORDER[prev?.severity?.toUpperCase()]  ?? -1;
    if (!prev || currRank > prevRank) alertByPatient[pid] = alert;
  }

  // Right panel — active alerts first, then recent closed ones, most-recent-first
  const closedAlerts = allAlerts.filter(
    (a) => !['NEW', 'SENT', 'DELIVERED', 'ACKNOWLEDGED'].includes(a.status?.toUpperCase())
  );
  const recentAlerts = [...activeAlerts, ...closedAlerts]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 12);

  // Bottom table — most recent first, capped at 20
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 20);

  // Avg score accent color
  const avgAccent =
    avgHealthScore == null ? 'cyan'
    : avgHealthScore < 25  ? 'green'
    : avgHealthScore < 50  ? 'yellow'
    : avgHealthScore < 75  ? 'orange'
    : 'red';

  // ── Average Response Time (acknowledgedAt - createdAt) in minutes ──────
  const acknowledgedAlerts = allAlerts.filter(
    (a) => a.acknowledgedAt != null && a.createdAt != null
  );
  const avgResponseMinutes =
    acknowledgedAlerts.length > 0
      ? Math.round(
          acknowledgedAlerts.reduce((acc, a) => {
            const diffMs =
              new Date(a.acknowledgedAt).getTime() - new Date(a.createdAt).getTime();
            return acc + (diffMs > 0 ? diffMs / 60000 : 0);
          }, 0) / acknowledgedAlerts.length
        )
      : null;
  const avgResponseLabel =
    avgResponseMinutes == null
      ? '—'
      : avgResponseMinutes < 60
      ? `${avgResponseMinutes}m`
      : `${Math.round(avgResponseMinutes / 60)}h ${avgResponseMinutes % 60}m`;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* ══ Page header ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiHeartPulseLine className="w-6 h-6 text-red-400" />
            Doctor Monitoring Dashboard
          </h1>
          <p className="page-subtitle">
            Live ICU command center — patient vitals, active alerts &amp; notification delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-600 font-mono hidden sm:block">
              Updated {fmtTime(lastUpdated)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <button
            id="btn-refresh-monitoring"
            onClick={refresh}
            className="btn-outline btn-sm"
          >
            <RiRefreshLine className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ Summary Cards ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <SummaryCard
          label="Online Patients"
          value={patientRows.length}
          sub={`${patientRows.length} registered in system`}
          icon={RiUserLine}
          accentColor="blue"
          loading={patientsLoading}
        />
        <SummaryCard
          label="Active Alerts"
          value={activeAlerts.length}
          sub={`${criticalAlertCount} critical, requiring action`}
          icon={RiAlertLine}
          accentColor={activeAlerts.length > 0 ? 'red' : 'green'}
          loading={alertsLoading}
        />
        <SummaryCard
          label="Critical Alerts"
          value={criticalAlertCount}
          sub="Immediate intervention required"
          icon={RiFireLine}
          accentColor={criticalAlertCount > 0 ? 'red' : 'green'}
          loading={alertsLoading}
        />
        <SummaryCard
          label="Avg Health Score"
          value={avgHealthScore != null ? avgHealthScore : '—'}
          sub="Mean across all patients"
          icon={RiShieldCheckLine}
          accentColor={avgAccent}
          loading={patientsLoading}
        />
        <SummaryCard
          label="Avg Response Time"
          value={avgResponseLabel}
          sub={`${acknowledgedAlerts.length} acknowledged alerts`}
          icon={RiRefreshLine}
          accentColor={
            avgResponseMinutes == null ? 'cyan'
            : avgResponseMinutes <= 5   ? 'green'
            : avgResponseMinutes <= 15  ? 'yellow'
            : 'red'
          }
          loading={alertsLoading}
        />
      </div>

      {/* ══ Main Grid: Patient Table + Alerts Panel ════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">

        {/* ── Live Patient Monitoring Table ────────────────────────────── */}
        <div className="card-lg min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <RiPulseLine className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="section-title">Live Patient Monitoring</h2>
                <p className="section-subtitle">
                  Real-time vitals, health score, and risk status
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-green-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              5s poll
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scroll rounded-xl border border-[#1F2937]">
            <table className="data-table w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>SpO₂</th>
                  <th>Temperature</th>
                  <th>Health Score</th>
                  <th>Current Risk</th>
                  <th>Alert Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeleton */}
                {patientsLoading && (
                  <>
                    <SkeletonRow cols={8} />
                    <SkeletonRow cols={8} />
                    <SkeletonRow cols={8} />
                    <SkeletonRow cols={8} />
                  </>
                )}

                {/* Empty state */}
                {!patientsLoading && patientRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      <RiUserLine className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No patients found in registry</p>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!patientsLoading &&
                  patientRows.map((row) => {
                    const v            = row.vitals;
                    const score        = row.healthScore != null ? Number(row.healthScore) : null;
                    const risk         = getRiskFromScore(score);
                    const worstAlert   = alertByPatient[row.pid];
                    const bpDisplay    =
                      v?.bpSystolic != null && v?.bpDiastolic != null
                        ? `${v.bpSystolic}/${v.bpDiastolic}`
                        : null;

                    // Score color
                    const scoreColor =
                      score == null    ? 'text-gray-600'
                      : score < 25     ? 'text-green-400'
                      : score < 50     ? 'text-yellow-400'
                      : score < 75     ? 'text-orange-400'
                      : 'text-red-400';

                    return (
                      <tr key={row.pid} className="group">
                        {/* Patient name + ID */}
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-white leading-tight">
                              {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                            </span>
                            <span className="text-[10px] font-mono text-blue-400">{row.pid}</span>
                          </div>
                        </td>

                        {/* Heart Rate */}
                        <td>
                          <VitalCell value={v?.heartRate} normal={[60, 100]} unit=" bpm" />
                        </td>

                        {/* Blood Pressure */}
                        <td>
                          {bpDisplay ? (
                            <span className="font-mono text-sm font-semibold text-gray-200">
                              {bpDisplay}
                              <span className="text-gray-600 text-xs ml-0.5">mmHg</span>
                            </span>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>

                        {/* SpO₂ */}
                        <td>
                          <VitalCell value={v?.spo2} normal={[95, 100]} unit="%" />
                        </td>

                        {/* Temperature */}
                        <td>
                          <VitalCell value={v?.temperature} normal={[97, 99]} unit="°F" />
                        </td>

                        {/* Health Score */}
                        <td>
                          {score != null ? (
                            <span className={`font-mono font-black text-base ${scoreColor}`}>
                              {Math.round(score)}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>

                        {/* Current Risk */}
                        <td>
                          {risk ? (
                            <RiskBadge risk={risk} />
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Alert Status */}
                        <td>
                          {worstAlert ? (
                            <AlertStatusBadge status={worstAlert.status} />
                          ) : (
                            <span className="badge badge-green flex items-center gap-1.5 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              Clear
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent Alerts Right Panel ─────────────────────────────────── */}
        <div className="card-lg flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <RiAlertLine className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="section-title">Recent Alerts</h2>
              <p className="section-subtitle">From alert-service</p>
            </div>
          </div>

          {/* Alert count badge */}
          {!alertsLoading && activeAlerts.length > 0 && (
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <span className="badge badge-red">
                {activeAlerts.length} active
              </span>
              {criticalAlertCount > 0 && (
                <span className="badge badge-red">
                  {criticalAlertCount} critical
                </span>
              )}
            </div>
          )}

          {/* Cards */}
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <RiShieldCheckLine className="w-10 h-10 text-green-500/40" />
              <p className="text-sm text-gray-500 text-center">
                No alerts — all systems clear
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto custom-scroll max-h-[640px] pr-0.5">
              {recentAlerts.map((alert, idx) => (
                <AlertCard
                  key={alert.alertId ?? idx}
                  alert={alert}
                  onAcknowledge={handleAcknowledgeAlert}
                  onClose={handleCloseAlert}
                  isActionLoading={actionLoadingId === alert.alertId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Recent Notifications ═══════════════════════════════════════ */}
      <div className="card-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <RiBellLine className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="section-title">Recent Notifications</h2>
              <p className="section-subtitle">
                Delivery log from notification-service
              </p>
            </div>
          </div>
          {!notifLoading && (
            <span className="text-xs text-gray-600 font-mono">
              {recentNotifications.length} records
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scroll rounded-xl border border-[#1F2937]">
          <table className="data-table w-full min-w-[600px]">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Alert</th>
                <th>Alert Type</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {notifLoading && (
                <>
                  <SkeletonRow cols={6} />
                  <SkeletonRow cols={6} />
                  <SkeletonRow cols={6} />
                </>
              )}

              {/* Empty */}
              {!notifLoading && recentNotifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <RiBellLine className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications recorded yet</p>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!notifLoading &&
                recentNotifications.map((n) => (
                  <tr key={n.notificationId ?? n.id}>
                    {/* Recipient */}
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-200">{n.recipient ?? '—'}</span>
                        {n.recipientType && (
                          <span className="text-[10px] text-gray-600 uppercase font-mono">
                            {n.recipientType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alert ID */}
                    <td>
                      <span
                        className="font-mono text-xs text-blue-300 block truncate max-w-[110px]"
                        title={n.alertId ?? undefined}
                      >
                        {n.alertId ? `${n.alertId.slice(0, 10)}…` : '—'}
                      </span>
                    </td>

                    {/* Alert Type */}
                    <td className="text-xs text-gray-400">
                      {n.alertType ?? '—'}
                    </td>

                    {/* Channel */}
                    <td>
                      <span className="badge badge-cyan">
                        {n.channel ?? 'IN_APP'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <NotifStatusBadge status={n.status} />
                    </td>

                    {/* Created */}
                    <td className="font-mono text-xs text-gray-500">
                      {fmtDateTime(n.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Polling indicator ════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600 pb-2">
        <RiWifiLine className="w-3.5 h-3.5" />
        Auto-refreshing every {POLL_MS / 1000}s
        {lastUpdated && (
          <> · Last updated: <span className="font-mono">{fmtTime(lastUpdated)}</span></>
        )}
      </div>

      {/* ══ Milestone 3 Critical Alert Popup ══════════════════════════════ */}
      <CriticalAlertModal
        criticalAlerts={criticalAlerts}
        onAcknowledge={handleAcknowledgeAlert}
        onClose={(alertId) => {
          const alert = [...activeAlerts, ...allAlerts].find(a => a.alertId === alertId);
          return handleCloseAlert(alertId, alert?.status);
        }}
        user={user}
      />

    </div>
  );
};

export default Monitoring;
