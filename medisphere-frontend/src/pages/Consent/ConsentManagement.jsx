import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  RiShieldCheckLine, RiShieldLine, RiRefreshLine,
  RiAddLine, RiCheckLine, RiCloseLine, RiAlertLine,
} from 'react-icons/ri';
import { consentService } from '../../services/consentService';
import { patientService } from '../../services/patientService';
import { useNotification } from '../../context/NotificationContext';

const ConsentBadge = ({ status }) => {
  const map = {
    ACTIVE:  'badge-green',
    REVOKED: 'badge-red',
    EXPIRED: 'badge-gray',
  };
  return <span className={`${map[status] || 'badge-gray'} text-[10px]`}>{status || 'UNKNOWN'}</span>;
};

export const ConsentManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { notify } = useNotification();

  const [patients,       setPatients]  = useState([]);
  const [selectedPid,    setPid]       = useState(searchParams.get('patientId') || '');
  const [consentData,    setConsent]   = useState(null);
  const [loading,        setLoading]   = useState(false);
  const [actionLoading,  setActLoad]   = useState(false);
  const [showGrantForm,  setShowGrant] = useState(false);
  const [grantForm, setGrantForm] = useState({ purpose: '', expiryDate: '' });

  const loadConsent = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const r = await consentService.getConsent(pid);
      setConsent(r.data);
    } catch (e) {
      if (e.response?.status === 404) setConsent(null);
      else notify.error('Error', 'Could not load consent record.');
    } finally { setLoading(false); }
  }, [notify]);

  useEffect(() => {
    patientService.getAllPatients()
      .then(r => setPatients(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pid = searchParams.get('patientId') || '';
    setPid(pid);
    if (pid) {
      loadConsent(pid);
    }
  }, [searchParams, loadConsent]);

  useEffect(() => { if (selectedPid) loadConsent(selectedPid); }, [selectedPid, loadConsent]);

  const handleVerify = async () => {
    if (!selectedPid) return;
    setActLoad(true);
    try {
      const r = await consentService.verifyConsent(selectedPid);
      notify.success('Consent Verified', r.data?.message || 'Consent is valid and active.');
      loadConsent(selectedPid);
    } catch (e) {
      notify.error('Verification Failed', e.response?.data?.message || e.message);
    } finally { setActLoad(false); }
  };

  const handleRevoke = async () => {
    if (!selectedPid || !window.confirm('Revoke this patient consent? This action is logged in the HIPAA Audit trail.')) return;
    setActLoad(true);
    try {
      await consentService.revokeConsent(selectedPid);
      notify.success('Consent Revoked', 'Patient consent has been revoked.');
      loadConsent(selectedPid);
    } catch (e) {
      notify.error('Revoke Failed', e.response?.data?.message || e.message);
    } finally { setActLoad(false); }
  };

  const handleGrant = async () => {
    if (!selectedPid) return;
    setActLoad(true);
    try {
      await consentService.createConsent({
        patientId: selectedPid,
        purpose:   grantForm.purpose,
        expiryDate:grantForm.expiryDate,
        status:    'ACTIVE',
      });
      notify.success('Consent Granted', 'Patient consent has been created.');
      setShowGrant(false);
      loadConsent(selectedPid);
    } catch (e) {
      notify.error('Grant Failed', e.response?.data?.message || e.message);
    } finally { setActLoad(false); }
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex items-start gap-2 py-2 border-b border-[#1F2937]/50 last:border-0">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-200 font-medium">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiShieldCheckLine className="w-6 h-6 text-blue-400" /> Consent Management
          </h1>
          <p className="page-subtitle">HIPAA-compliant patient consent tracking and management</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPid}
            onChange={(e) => {
              const nextPid = e.target.value;
              setPid(nextPid);
              if (nextPid) {
                navigate(`${location.pathname}?patientId=${encodeURIComponent(nextPid)}`, { replace: true });
              } else {
                navigate(location.pathname, { replace: true });
              }
            }}
            className="form-select w-56"
          >
            <option value="">Select Patient</option>
            {patients.map(p => (
              <option key={p.patientId || p.id} value={p.patientId || p.id}>
                {p.firstName} {p.lastName} ({p.patientId || p.id})
              </option>
            ))}
          </select>
          {selectedPid && (
            <button onClick={() => loadConsent(selectedPid)} className="btn-outline btn-sm" disabled={loading}>
              <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {!selectedPid && (
        <div className="card py-20 text-center space-y-3">
          <RiShieldLine className="w-16 h-16 text-gray-700 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Select a Patient</p>
          <p className="text-sm text-gray-500">Choose a patient to view or manage their consent record.</p>
        </div>
      )}

      {selectedPid && loading && (
        <div className="card py-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {selectedPid && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Consent Detail Card */}
          <div className="lg:col-span-8">
            <div className="card-lg">
              {consentData ? (
                <>
                  <div className="flex items-center justify-between mb-5 border-b border-[#1F2937] pb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Consent Record</p>
                      <p className="text-lg font-bold text-white mt-0.5">Patient: {selectedPid}</p>
                    </div>
                    <ConsentBadge status={consentData.status} />
                  </div>
                  <InfoRow label="Status"      value={consentData.status} />
                  <InfoRow label="Purpose"     value={consentData.purpose} />
                  <InfoRow label="Granted On"  value={consentData.grantedOn ? new Date(consentData.grantedOn).toLocaleString() : null} />
                  <InfoRow label="Expires"     value={consentData.expiryDate ? new Date(consentData.expiryDate).toLocaleDateString() : null} />
                  <InfoRow label="Revoked"     value={consentData.revoked ? 'Yes' : 'No'} />
                  <InfoRow label="Consent ID"  value={consentData.id || consentData.consentId} />
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <RiAlertLine className="w-12 h-12 text-yellow-500 mx-auto" />
                  <p className="text-lg font-bold text-gray-400">No Consent Record</p>
                  <p className="text-sm text-gray-500">No consent record exists for patient <span className="font-mono text-white">{selectedPid}</span></p>
                  <button onClick={() => setShowGrant(true)} className="btn-primary btn-sm">
                    <RiAddLine className="w-4 h-4" /> Grant Consent
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-lg">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Consent Actions</p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowGrant(true)}
                  className="btn-primary w-full"
                  disabled={actionLoading}
                >
                  <RiAddLine className="w-4 h-4" />
                  Grant / Update Consent
                </button>
                <button
                  onClick={handleVerify}
                  className="btn-outline w-full"
                  disabled={actionLoading || !consentData}
                >
                  <RiCheckLine className="w-4 h-4" />
                  Verify Consent
                </button>
                <button
                  onClick={handleRevoke}
                  className="btn-danger w-full"
                  disabled={actionLoading || !consentData || consentData?.status === 'REVOKED'}
                >
                  <RiCloseLine className="w-4 h-4" />
                  Revoke Consent
                </button>
              </div>
            </div>

            <div className="card border border-blue-500/20">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <RiShieldCheckLine className="w-3.5 h-3.5" /> HIPAA Notice
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                All consent actions are logged in the HIPAA-compliant audit trail. Consent revocations are irreversible and must be authorized by an attending physician.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grant Consent Modal */}
      {showGrantForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-md w-full animate-slide-up">
            <h3 className="section-title mb-5">Grant Patient Consent</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Purpose</label>
                <textarea
                  value={grantForm.purpose}
                  onChange={e => setGrantForm(f => ({ ...f, purpose: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="Purpose of data sharing consent…"
                />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  value={grantForm.expiryDate}
                  onChange={e => setGrantForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGrant(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleGrant} disabled={actionLoading} className="btn-primary flex-1">
                {actionLoading ? 'Granting…' : 'Grant Consent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentManagement;
