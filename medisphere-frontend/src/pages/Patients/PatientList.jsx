// src/pages/Patients/PatientList.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  RiUserAddLine, RiSearchLine, RiEyeLine, RiDeleteBinLine,
  RiFilterLine, RiRefreshLine, RiUserLine, RiHeartPulseLine, RiAlertLine,
} from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { useNotification } from '../../context/NotificationContext';

const PAGE_SIZE = 15;

const getRiskBadge = (patientId) => {
  const n = patientId?.charCodeAt(patientId.length - 1) || 0;
  if (n % 4 === 0) return { label: 'High',     cls: 'badge-red'    };
  if (n % 4 === 1) return { label: 'Moderate',  cls: 'badge-orange' };
  if (n % 4 === 2) return { label: 'Low',       cls: 'badge-green'  };
  return               { label: 'Low',       cls: 'badge-green'  };
};

const getGenderBadge = (gender) => {
  if (gender === 'Male')   return 'badge-blue';
  if (gender === 'Female') return 'badge-purple';
  return 'badge-gray';
};

const calcAge = (dob) => {
  if (!dob) return null;
  return new Date().getFullYear() - new Date(dob).getFullYear();
};

const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-blue-300">{initials}</span>
    </div>
  );
};

export const PatientList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useNotification();

  const [patients,     setPatients]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState(searchParams.get('search') || '');
  const [genderFilter, setGenderFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [loadError,    setLoadError]    = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const res = await patientService.getAllPatients();
      setPatients(res.data || []);
    } catch {
      setLoadError('Backend service is unavailable.');
      notify.error('Backend unavailable', 'Unable to connect to the patient service.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return patients.filter((p) => {
      const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const id   = (p.patientId || p.id || '').toLowerCase();
      const matchSearch = !s || name.includes(s) || id.includes(s) || (p.email || '').toLowerCase().includes(s);
      const matchGender = !genderFilter || p.gender === genderFilter;
      return matchSearch && matchGender;
    });
  }, [patients, search, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patientService.deletePatient(deleteTarget.id || deleteTarget.patientId);
      notify.success('Patient removed', `${deleteTarget.firstName} ${deleteTarget.lastName} deleted.`);
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) {
      notify.error('Delete failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Patient Registry</h1>
          <p className="page-subtitle">
            {loading ? 'Fetching patients from backend…' : `${filtered.length} of ${patients.length} patients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPatients} className="btn-outline btn-sm" disabled={loading}>
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/patients/register')} className="btn-primary btn-sm" id="register-patient-btn">
            <RiUserAddLine className="w-4 h-4" /> Register Patient
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="patient-search"
            type="text"
            placeholder="Search by name, ID, or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <RiFilterLine className="w-4 h-4 text-gray-500" />
          <select
            id="gender-filter"
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="form-select w-36"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading patients from backend…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center space-y-4">
            <RiAlertLine className="w-16 h-16 text-yellow-500 mx-auto" />
            <p className="text-lg font-bold text-gray-200">Unable to connect</p>
            <p className="text-sm text-gray-400">Backend service is unavailable.</p>
            <button onClick={fetchPatients} className="btn-primary btn-sm mt-2">Retry</button>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <RiUserLine className="w-16 h-16 text-gray-700 mx-auto" />
            <p className="text-lg font-bold text-gray-400">No Patients Found</p>
            <p className="text-sm text-gray-500">No patient records exist in the database.</p>
            <button onClick={() => navigate('/patients/register')} className="btn-primary btn-sm mt-2">Register First Patient</button>
          </div>
        ) : (
          <>
            {paginated.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-400">No patients match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>ID</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>DOB</th>
                      <th>Blood Group</th>
                      <th>Risk</th>
                      <th>Registered</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p) => {
                      const risk = getRiskBadge(p.patientId || p.id);
                      return (
                        <tr
                          key={p.id || p.patientId}
                          className="cursor-pointer"
                          onClick={() => navigate(`/patients/${p.patientId || p.id}`)}
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <Avatar name={`${p.firstName} ${p.lastName}`} />
                              <div>
                                <p className="font-semibold text-gray-100 text-sm">{p.firstName} {p.lastName}</p>
                                <p className="text-[11px] text-gray-500">{p.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className="font-mono text-[11px] text-blue-400 font-semibold">{p.patientId || p.id}</span></td>
                          <td><span className={`${getGenderBadge(p.gender)} text-[11px]`}>{p.gender || '—'}</span></td>
                          <td className="text-gray-300 text-xs">{calcAge(p.dob || p.birthDate) ? `${calcAge(p.dob || p.birthDate)}y` : '—'}</td>
                          <td className="text-gray-400 text-xs">{p.dob || p.birthDate ? new Date(p.dob || p.birthDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td><span className="badge-gray text-[10px]">{p.bloodGroup || '—'}</span></td>
                          <td><span className={`${risk.cls} text-[10px]`}>{risk.label}</span></td>
                          <td className="text-gray-500 text-[11px]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                title="Patient Details"
                                onClick={() => navigate(`/patients/${p.patientId || p.id}`)}
                                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                              >
                                <RiEyeLine className="w-4 h-4" />
                              </button>
                              <button
                                title="Open 360"
                                onClick={() => navigate(`/patient360?patientId=${p.patientId || p.id}`)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-surface-2 transition-colors"
                              >
                                <RiHeartPulseLine className="w-4 h-4" />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => setDeleteTarget(p)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <RiDeleteBinLine className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1F2937]">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-sm w-full animate-slide-up border border-red-500/20">
            <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <RiDeleteBinLine className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete Patient</h3>
            <p className="text-sm text-gray-400 mb-6">
              Permanently remove <strong className="text-white">{deleteTarget.firstName} {deleteTarget.lastName}</strong> and all associated data? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting ? 'Deleting…' : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
