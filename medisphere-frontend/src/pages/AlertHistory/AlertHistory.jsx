// src/pages/AlertHistory/AlertHistory.jsx
// Milestone 3 Alert History Page
// Displays full audit trail of clinical alerts with filtering, search, sorting, CSV export, and detail modal.
// Polls every 10 seconds. Frontend only — uses GET /api/alerts.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RiTimeLine,
  RiAlertLine,
  RiFireLine,
  RiShieldCheckLine,
  RiDownloadLine,
  RiRefreshLine,
  RiSearchLine,
  RiFilter3Line,
  RiCloseLine,
  RiUserLine,
  RiCheckLine,
  RiInformationLine,
  RiErrorWarningLine,
  RiArrowUpDownLine,
  RiCodeBoxLine,
  RiHeartPulseLine,
} from 'react-icons/ri';
import { alertService } from '../../services/alertService';
import { useNotification } from '../../context/NotificationContext';

// ─── Constants & Helpers ───────────────────────────────────────────────────────
const POLL_MS = 10_000;

function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  } catch {
    return '—';
  }
}

function fmtVal(val) {
  if (val == null || val === '' || val === 'null' || val === 'undefined') return '—';
  return String(val);
}

// ─── Badge Styling ─────────────────────────────────────────────────────────────
const SEVERITY_CFG = {
  CRITICAL: { cls: 'badge-red',    label: 'Critical', Icon: RiFireLine },
  HIGH:     { cls: 'badge-orange', label: 'High',     Icon: RiErrorWarningLine },
  MEDIUM:   { cls: 'badge-yellow', label: 'Medium',   Icon: RiAlertLine },
  LOW:      { cls: 'badge-green',  label: 'Low',      Icon: RiInformationLine },
};

const SeverityBadge = ({ severity }) => {
  const cfg = SEVERITY_CFG[severity?.toUpperCase()] ?? {
    cls: 'badge-gray',
    label: severity ? fmtVal(severity) : '—',
    Icon: RiInformationLine,
  };
  const { Icon } = cfg;
  return (
    <span className={`badge ${cfg.cls} flex items-center gap-1 w-fit`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const ALERT_STATUS_CFG = {
  NEW:          { cls: 'badge-red',    label: 'New',          dot: '#f87171' },
  SENT:         { cls: 'badge-yellow', label: 'Sent',         dot: '#fbbf24' },
  DELIVERED:    { cls: 'badge-blue',   label: 'Delivered',    dot: '#60a5fa' },
  ACKNOWLEDGED: { cls: 'badge-purple', label: 'Acknowledged', dot: '#a78bfa' },
  CLOSED:       { cls: 'badge-green',  label: 'Closed',       dot: '#34d399' },
};

const AlertStatusBadge = ({ status }) => {
  const cfg = ALERT_STATUS_CFG[status?.toUpperCase()] ?? {
    cls: 'badge-gray',
    label: status ? fmtVal(status) : '—',
    dot: '#9ca3af',
  };
  return (
    <span className={`badge ${cfg.cls} flex items-center gap-1.5 w-fit`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

// ─── Summary Card Component ───────────────────────────────────────────────────
const SummaryCard = ({ label, value, sub, icon: Icon, accentColor = 'blue', loading }) => {
  const colors = {
    blue:   { bg: 'bg-blue-600/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
    red:    { bg: 'bg-red-600/10',    text: 'text-red-400',    border: 'border-red-500/20' },
    amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
    green:  { bg: 'bg-green-600/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  };
  const c = colors[accentColor] ?? colors.blue;
  return (
    <div className={`card flex items-center gap-4 p-5 border ${c.border}`}>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">{label}</p>
        {loading ? (
          <div className="skeleton h-7 w-16 rounded mt-1" />
        ) : (
          <p className={`text-2xl font-black ${c.text}`}>{value ?? 0}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
};

// ─── Alert Details Modal Component ────────────────────────────────────────────
const AlertDetailModal = ({ alert, onClose }) => {
  const [showJson, setShowJson] = useState(false);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0D1424] border border-[#1F2937] rounded-2xl shadow-card-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-2 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RiTimeLine className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Alert Details</h3>
              <p className="text-xs text-gray-400 font-mono">ID: {fmtVal(alert.alertId || alert.id)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition-colors"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-5 flex-1">
          {/* Status & Severity row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/60 p-4 rounded-xl border border-[#1F2937]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Severity:</span>
              <SeverityBadge severity={alert.severity} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Lifecycle Status:</span>
              <AlertStatusBadge status={alert.status} />
            </div>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider">Patient ID</p>
              <p className="font-mono text-sm font-semibold text-blue-300 mt-0.5">{fmtVal(alert.patientId)}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider">Alert Type</p>
              <p className="font-semibold text-gray-200 mt-0.5">{fmtVal(alert.type)}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider">Source</p>
              <p className="font-semibold text-gray-300 mt-0.5">{fmtVal(alert.source)}</p>
            </div>
          </div>

          {/* Clinical Message */}
          <div className="bg-surface p-4 rounded-xl border border-[#1F2937]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Clinical Message</p>
            <p className="text-sm text-gray-200 leading-relaxed">{fmtVal(alert.message)}</p>
          </div>

          {/* Vitals Snapshot (if available) */}
          {(alert.heartRate != null || alert.bpSystolic != null || alert.spo2 != null || alert.temperature != null) && (
            <div className="bg-surface p-4 rounded-xl border border-[#1F2937] space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <RiHeartPulseLine className="w-4 h-4 text-red-400" /> Vitals Payload Snapshot
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Heart Rate: </span>
                  <span className="font-mono font-bold text-white">{fmtVal(alert.heartRate)} bpm</span>
                </div>
                <div>
                  <span className="text-gray-500">Blood Pressure: </span>
                  <span className="font-mono font-bold text-white">
                    {alert.bpSystolic != null ? `${alert.bpSystolic}/${fmtVal(alert.bpDiastolic)}` : '—'} mmHg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">SpO₂: </span>
                  <span className="font-mono font-bold text-white">{fmtVal(alert.spo2)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Temperature: </span>
                  <span className="font-mono font-bold text-white">{fmtVal(alert.temperature)}°F</span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps & Lifecycle */}
          <div className="bg-surface p-4 rounded-xl border border-[#1F2937] space-y-2 text-xs">
            <p className="font-bold text-gray-400 uppercase tracking-wider mb-2">Lifecycle Timestamps</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
              <div>
                <span className="text-gray-500">Created: </span>
                <span className="font-mono">{fmtDateTime(alert.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Sent: </span>
                <span className="font-mono">{fmtDateTime(alert.sentAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Delivered: </span>
                <span className="font-mono">{fmtDateTime(alert.deliveredAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Acknowledged: </span>
                <span className="font-mono">{fmtDateTime(alert.acknowledgedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Acknowledged By: </span>
                <span className="font-mono text-purple-300">{fmtVal(alert.acknowledgedBy)}</span>
              </div>
              <div>
                <span className="text-gray-500">Closed: </span>
                <span className="font-mono">{fmtDateTime(alert.closedAt)}</span>
              </div>
            </div>
          </div>

          {/* Toggle JSON Viewer for complete Backend payload */}
          <div>
            <button
              onClick={() => setShowJson((prev) => !prev)}
              className="btn-ghost btn-sm text-xs text-blue-400 flex items-center gap-1.5"
            >
              <RiCodeBoxLine className="w-4 h-4" />
              {showJson ? 'Hide Raw JSON Payload' : 'View Full Backend JSON Payload'}
            </button>
            {showJson && (
              <div className="mt-2 code-viewer max-h-48 overflow-auto text-xs">
                <pre>{JSON.stringify(alert, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-surface-2 border-t border-[#1F2937] flex justify-end">
          <button onClick={onClose} className="btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AlertHistory Component ─────────────────────────────────────────────
export const AlertHistory = () => {
  const { notify } = useNotification();

  const [alerts, setAlerts]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(null);

  // Search & Filter state
  const [searchPatient, setSearchPatient] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter]     = useState('ALL');

  // Sorting state
  const [sortField, setSortField] = useState('createdAt'); // 'createdAt' | 'severity' | 'patientId'
  const [sortOrder, setSortOrder] = useState('desc');      // 'desc' | 'asc'

  // Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);

  const pollingRef = useRef(null);
  const isMountedRef = useRef(true);

  // ── Fetch all alerts from GET /api/alerts ─────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const res = await alertService.getAll();
      if (!isMountedRef.current) return;
      setAlerts(res.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('[AlertHistory] Failed to fetch alerts:', err);
      setError('Unable to load alert history from the backend service.');
      notify.error('Fetch Error', 'Failed to retrieve alert history.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [notify]);

  // ── Mount & 10s Auto Refresh ──────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    fetchAlerts();
    pollingRef.current = setInterval(fetchAlerts, POLL_MS);
    return () => {
      isMountedRef.current = false;
      clearInterval(pollingRef.current);
    };
  }, [fetchAlerts]);

  // ── Derived KPI Summary Cards ──────────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter(
      (a) => a.severity?.toUpperCase() === 'CRITICAL'
    ).length;
    const active = alerts.filter((a) =>
      ['NEW', 'SENT', 'DELIVERED', 'ACKNOWLEDGED'].includes(a.status?.toUpperCase())
    ).length;
    const closed = alerts.filter(
      (a) => a.status?.toUpperCase() === 'CLOSED'
    ).length;
    return { total, critical, active, closed };
  }, [alerts]);

  // ── Filtering & Sorting Logic ──────────────────────────────────────────────
  const filteredAndSortedAlerts = useMemo(() => {
    const term = searchPatient.trim().toLowerCase();

    const filtered = alerts.filter((alert) => {
      // Patient ID Search
      const matchesSearch =
        !term || (alert.patientId && alert.patientId.toLowerCase().includes(term));

      // Severity Filter
      const matchesSeverity =
        severityFilter === 'ALL' ||
        alert.severity?.toUpperCase() === severityFilter;

      // Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        alert.status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });

    // Sorting
    const SEV_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    filtered.sort((a, b) => {
      let valA, valB;

      if (sortField === 'createdAt') {
        valA = new Date(a.createdAt ?? 0).getTime();
        valB = new Date(b.createdAt ?? 0).getTime();
      } else if (sortField === 'severity') {
        valA = SEV_RANK[a.severity?.toUpperCase()] ?? 0;
        valB = SEV_RANK[b.severity?.toUpperCase()] ?? 0;
      } else if (sortField === 'patientId') {
        valA = (a.patientId ?? '').toLowerCase();
        valB = (b.patientId ?? '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [alerts, searchPatient, severityFilter, statusFilter, sortField, sortOrder]);

  // ── Client-Side CSV Export Function ───────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!filteredAndSortedAlerts.length) return;

    const headers = [
      'Alert ID',
      'Patient ID',
      'Alert Type',
      'Severity',
      'Status',
      'Created Time',
      'Acknowledged By',
      'Acknowledged Time',
      'Closed Time',
      'Clinical Message',
    ];

    const rows = filteredAndSortedAlerts.map((a) => [
      a.alertId || a.id || '',
      a.patientId || '',
      a.type || '',
      a.severity || '',
      a.status || '',
      fmtDateTime(a.createdAt),
      a.acknowledgedBy || '',
      fmtDateTime(a.acknowledgedAt),
      fmtDateTime(a.closedAt),
      a.message || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `alert-history-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify.success('CSV Exported', `Exported ${filteredAndSortedAlerts.length} alert records.`);
  }, [filteredAndSortedAlerts, notify]);

  // Toggle sort order or field
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ══ Page Header ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiTimeLine className="w-6 h-6 text-blue-400" />
            Alert History
          </h1>
          <p className="page-subtitle">
            Historical clinical alerts and lifecycle tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-600 font-mono hidden sm:block">
              Refreshed {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleExportCSV}
            disabled={filteredAndSortedAlerts.length === 0}
            className="btn-outline btn-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            <RiDownloadLine className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="btn-outline btn-sm flex items-center gap-1.5"
          >
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ Summary Cards ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Alerts"
          value={kpiStats.total}
          sub="All historical alert records"
          icon={RiTimeLine}
          accentColor="blue"
          loading={loading}
        />
        <SummaryCard
          label="Critical Alerts"
          value={kpiStats.critical}
          sub="Critical severity alerts"
          icon={RiFireLine}
          accentColor={kpiStats.critical > 0 ? 'red' : 'green'}
          loading={loading}
        />
        <SummaryCard
          label="Active Alerts"
          value={kpiStats.active}
          sub="Awaiting acknowledgment/closure"
          icon={RiAlertLine}
          accentColor={kpiStats.active > 0 ? 'amber' : 'green'}
          loading={loading}
        />
        <SummaryCard
          label="Closed Alerts"
          value={kpiStats.closed}
          sub="Resolved alert lifecycle"
          icon={RiShieldCheckLine}
          accentColor="green"
          loading={loading}
        />
      </div>

      {/* ══ Search & Filter Toolbar ═══════════════════════════════════════ */}
      <div className="card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Patient ID Search */}
        <div className="relative flex-1 min-w-[220px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            placeholder="Search by Patient ID (e.g. P1002)..."
            className="form-input pl-9 text-xs"
          />
          {searchPatient && (
            <button
              onClick={() => setSearchPatient('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters & Sorting Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <RiFilter3Line className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-select text-xs py-1.5 px-2.5 w-32"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-xs py-1.5 px-2.5 w-36"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <RiArrowUpDownLine className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 font-semibold">Sort By:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortField(f);
                setSortOrder(o);
              }}
              className="form-select text-xs py-1.5 px-2.5 w-40"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="severity-desc">Highest Severity</option>
              <option value="severity-asc">Lowest Severity</option>
              <option value="patientId-asc">Patient ID (A-Z)</option>
              <option value="patientId-desc">Patient ID (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══ Error Banner (if any) ═════════════════════════════════════════ */}
      {error && (
        <div className="card border-red-500/30 bg-red-500/10 text-red-300 text-sm flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <RiErrorWarningLine className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAlerts} className="btn-danger btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* ══ Main Alerts Table ═════════════════════════════════════════════ */}
      <div className="card-lg min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-base">Alert Audit Log</h2>
          <span className="text-xs text-gray-500 font-mono">
            Showing {filteredAndSortedAlerts.length} of {alerts.length} records
          </span>
        </div>

        <div className="overflow-x-auto custom-scroll rounded-xl border border-[#1F2937]">
          <table className="data-table w-full min-w-[900px]">
            <thead>
              <tr>
                <th
                  onClick={() => toggleSort('patientId')}
                  className="cursor-pointer hover:text-white transition-colors"
                >
                  Patient ID {sortField === 'patientId' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Alert ID</th>
                <th>Alert Type</th>
                <th
                  onClick={() => toggleSort('severity')}
                  className="cursor-pointer hover:text-white transition-colors"
                >
                  Severity {sortField === 'severity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Status</th>
                <th
                  onClick={() => toggleSort('createdAt')}
                  className="cursor-pointer hover:text-white transition-colors"
                >
                  Created Time {sortField === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Acknowledged By</th>
                <th>Acknowledged Time</th>
                <th>Closed Time</th>
                <th>Clinical Message</th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton loading rows */}
              {loading && (
                <>
                  {Array.from({ length: 5 }).map((_, r) => (
                    <tr key={r}>
                      {Array.from({ length: 10 }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                          <div className="skeleton h-4 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {/* Empty state */}
              {!loading && filteredAndSortedAlerts.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-500">
                    <RiAlertLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-gray-400">No alert history available.</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {searchPatient || severityFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try adjusting your search query or filter selections.'
                        : 'No alert records returned by backend service.'}
                    </p>
                  </td>
                </tr>
              )}

              {/* Table Data Rows */}
              {!loading &&
                filteredAndSortedAlerts.map((alert) => (
                  <tr
                    key={alert.alertId || alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="cursor-pointer hover:bg-surface-2 transition-colors group"
                    title="Click row to open full alert details"
                  >
                    {/* Patient ID */}
                    <td className="font-mono text-xs font-semibold text-blue-300">
                      {fmtVal(alert.patientId)}
                    </td>

                    {/* Alert ID */}
                    <td
                      className="font-mono text-xs text-gray-400 truncate max-w-[110px]"
                      title={alert.alertId || alert.id}
                    >
                      {alert.alertId ? `${alert.alertId.slice(0, 10)}…` : fmtVal(alert.id)}
                    </td>

                    {/* Alert Type */}
                    <td className="text-xs text-gray-200 font-medium">
                      {fmtVal(alert.type)}
                    </td>

                    {/* Severity */}
                    <td>
                      <SeverityBadge severity={alert.severity} />
                    </td>

                    {/* Status */}
                    <td>
                      <AlertStatusBadge status={alert.status} />
                    </td>

                    {/* Created Time */}
                    <td className="font-mono text-xs text-gray-400 whitespace-nowrap">
                      {fmtDateTime(alert.createdAt)}
                    </td>

                    {/* Acknowledged By */}
                    <td className="text-xs text-gray-300">
                      {alert.acknowledgedBy ? (
                        <span className="flex items-center gap-1 text-purple-300">
                          <RiUserLine className="w-3 h-3 text-purple-400" />
                          {alert.acknowledgedBy}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Acknowledged Time */}
                    <td className="font-mono text-xs text-gray-400 whitespace-nowrap">
                      {fmtDateTime(alert.acknowledgedAt)}
                    </td>

                    {/* Closed Time */}
                    <td className="font-mono text-xs text-gray-400 whitespace-nowrap">
                      {fmtDateTime(alert.closedAt)}
                    </td>

                    {/* Clinical Message */}
                    <td
                      className="text-xs text-gray-400 max-w-[220px] truncate"
                      title={alert.message}
                    >
                      {fmtVal(alert.message)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Auto-refresh footer indicator ═════════════════════════════════ */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Auto-refreshing every {POLL_MS / 1000}s
      </div>

      {/* ══ Detail Modal ══════════════════════════════════════════════════ */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export default AlertHistory;
