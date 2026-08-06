// src/pages/AuditLogs/AuditLogs.jsx
import { useEffect, useState, useMemo } from 'react';
import { RiFileTextLine, RiSearchLine, RiFilterLine, RiDownloadLine, RiHistoryLine } from 'react-icons/ri';
import { auditService } from '../../services/auditService';

const PAGE_SIZE = 15;

const getStatusColor = (s) => {
  if (s === 'SUCCESS') return 'badge-green';
  if (s === 'WARNING') return 'badge-yellow';
  if (s === 'ERROR' || s === 'FAILED') return 'badge-red';
  return 'badge-gray';
};

export const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const response = await auditService.getLogs();
        setLogs(response.data || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !search ||
        (log.user || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.patientId && log.patientId.toLowerCase().includes(search.toLowerCase()));

      const matchRole = !roleFilter || log.role === roleFilter;
      const matchAction = !actionFilter || log.action === actionFilter;

      return matchSearch && matchRole && matchAction;
    });
  }, [logs, search, roleFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginated = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiFileTextLine className="w-6 h-6 text-blue-400" /> System Audit Logs
          </h1>
          <p className="page-subtitle">Track all system events, authentication, and PHI access records</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-green text-[10px]">Live Backend</span>
          <button className="btn-outline btn-sm">
            <RiDownloadLine className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user, details, or patient ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <RiFilterLine className="w-4 h-4 text-gray-500" />
          <select 
            value={roleFilter} 
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="form-select w-36"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="SYSTEM">System</option>
          </select>
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="form-select w-48"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading audit logs from backend…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No audit logs match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Patient ID</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-[11px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="font-semibold text-gray-200 text-xs">{log.action}</td>
                    <td className="text-gray-300 text-xs">{log.user}</td>
                    <td><span className={`text-[10px] ${log.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`}>{log.role}</span></td>
                    <td>
                      {log.patientId ? (
                        <span className="font-mono text-[11px] text-blue-400">{log.patientId}</span>
                      ) : (
                        <span className="text-[10px] text-gray-500">—</span>
                      )}
                    </td>
                    <td><span className={`${getStatusColor(log.status)} text-[10px]`}>{log.status}</span></td>
                    <td className="text-gray-400 text-xs truncate max-w-sm">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1F2937]">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost btn-sm disabled:opacity-30">‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === pg ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-surface-2'}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost btn-sm disabled:opacity-30">Next ›</button>
            </div>
          </div>
        )}
      </div>

      <div className="card border border-blue-500/20 flex items-start gap-3">
        <RiHistoryLine className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-blue-400">HIPAA Compliance Notice</p>
          <p className="text-xs text-gray-400 mt-1">Audit logs are immutable and now load from the backend endpoint <span className="font-mono text-gray-300">GET /api/audit/logs</span> when available.</p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
