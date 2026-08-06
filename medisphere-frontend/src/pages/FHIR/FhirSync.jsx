// src/pages/FHIR/FhirSync.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  RiExchangeLine, RiRefreshLine, RiCodeBoxLine, RiCheckLine,
  RiUploadLine,
} from 'react-icons/ri';
import { fhirService } from '../../services/fhirService';
import { patientService } from '../../services/patientService';
import { useNotification } from '../../context/NotificationContext';

const RESOURCE_TYPES = ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'Procedure', 'AllergyIntolerance'];

const StatusBadge = ({ status }) => {
  const map = { SYNCED: 'badge-green', FAILED: 'badge-red', PENDING: 'badge-yellow', PARTIAL: 'badge-orange' };
  return <span className={`${map[status] || 'badge-gray'} text-[10px]`}>{status}</span>;
};

export const FhirSync = () => {
  const { notify } = useNotification();
  const [resources,   setResources]   = useState([]);
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [connecting,  setConnecting]  = useState(false);
  const [validating,  setValidating]  = useState(false);
  const [importing,   setImporting]   = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [activeTab,   setTab]         = useState('Patient');
  const [importPid,   setImportPid]   = useState('');
  const [syncHistory, setSyncHistory] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes, hRes] = await Promise.allSettled([
        fhirService.getResources(),
        patientService.getAllPatients(),
        fhirService.getSyncHistory(),
      ]);

      if (rRes.status === 'fulfilled') {
        setResources(rRes.value.data || []);
      }
      if (pRes.status === 'fulfilled') {
        setPatients(pRes.value.data || []);
      }
      if (hRes.status === 'fulfilled') {
        setSyncHistory(hRes.value.data || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await fhirService.connect();
      notify.success('FHIR Connected', 'Successfully connected to the FHIR R4 server.');
      loadData();
    } catch (e) {
      notify.error('Connection Failed', e.response?.data?.message || e.message);
    } finally { setConnecting(false); }
  };

  const handleImport = async () => {
    if (!importPid) { notify.error('Required', 'Enter a patient ID to import.'); return; }
    setImporting(true);
    try {
      await fhirService.importPatient({ patientId: importPid });
      notify.success('Import Complete', `Patient ${importPid} resources imported.`);
      loadData();
    } catch (e) {
      notify.error('Import Failed', e.response?.data?.message || e.message);
    } finally { setImporting(false); }
  };

  const handleValidate = async () => {
    if (!importPid) { notify.error('Required', 'Enter a patient ID to validate.'); return; }
    setValidating(true);
    try {
      const r = await fhirService.validate({ patientId: importPid });
      notify.success('Validation Complete', r.data?.message || 'FHIR resources are valid.');
    } catch (e) {
      notify.error('Validation Failed', e.response?.data?.message || e.message);
    } finally { setValidating(false); }
  };

  const handleSync = async () => {
    if (!importPid) { notify.error('Required', 'Select a patient to sync.'); return; }
    setSyncing(true);
    try {
      const response = await fhirService.syncPatient(importPid);
      notify.success(
        'FHIR Sync Complete',
        response.data?.status === 'SUCCESS'
          ? `Synchronized ${response.data?.resources?.length || 0} resource types for ${importPid}.`
          : response.data?.message || `Resources synchronized for ${importPid}.`
      );
      loadData();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message;
      notify.error('FHIR Sync Failed', msg);
    } finally {
      setSyncing(false);
    }
  };

  const resourceCounts = RESOURCE_TYPES.reduce((acc, type) => {
    acc[type] = resources.filter(r => r.resourceType === type).length;
    return acc;
  }, {});

  const displayedResource = resources.find(r => r.resourceType === activeTab) || null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiExchangeLine className="w-6 h-6 text-blue-400" /> FHIR Synchronization
          </h1>
          <p className="page-subtitle">HL7 FHIR R4 integration, import and validation center</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleConnect} disabled={connecting} className="btn-outline btn-sm">
            {connecting ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <RiExchangeLine className="w-4 h-4" />}
            Connect FHIR
          </button>
          <button onClick={loadData} disabled={loading} className="btn-ghost btn-sm">
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resource Type Progress Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {RESOURCE_TYPES.map(type => {
          const count = resourceCounts[type] || 0;
          return (
            <div key={type} className={`card cursor-pointer ${activeTab === type ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
              onClick={() => setTab(type)}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{type}</p>
              <p className="text-3xl font-black text-white mt-1">{loading ? '—' : count}</p>
              <p className="text-[10px] text-gray-500 mt-1">records</p>
              {count > 0 && <div className="w-full h-1 bg-surface-2 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} /></div>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* FHIR JSON Viewer */}
        <div className="lg:col-span-8 card-lg bg-[#0A0F1C]">
          <div className="flex items-center justify-between mb-4 border-b border-[#1F2937] pb-4">
            <div className="flex items-center gap-2">
              <RiCodeBoxLine className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-white">FHIR R4 Resource Viewer</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {RESOURCE_TYPES.slice(0, 5).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${activeTab === t ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-surface-2'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="code-viewer h-72 overflow-auto custom-scroll">
            {loading && <span className="text-gray-600">{'// Loading FHIR resources from backend…'}</span>}
            {!loading && displayedResource && <pre>{JSON.stringify(displayedResource, null, 2)}</pre>}
            {!loading && !displayedResource && (
              <span className="text-gray-600">{`// No ${activeTab} resource found\n// Total resources: ${resources.length}\n// Use the Import section to sync patient FHIR records`}</span>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* Import Section */}
          <div className="card-lg">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1">
              <RiUploadLine className="w-3.5 h-3.5" /> Import & Validate
            </p>
            <div className="space-y-3">
              <div>
                <label className="form-label">Patient ID</label>
                <select
                  value={importPid}
                  onChange={e => setImportPid(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p.patientId || p.id} value={p.patientId || p.id}>
                      {p.firstName} {p.lastName} ({p.patientId || p.id})
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleImport} disabled={importing || !importPid} className="btn-primary w-full btn-sm">
                {importing ? 'Importing…' : 'Import Patient Resources'}
              </button>
              <button onClick={handleSync} disabled={syncing || !importPid} className="btn-secondary w-full btn-sm">
                {syncing ? 'Syncing…' : 'Sync Patient from FHIR'}
              </button>
              <button onClick={handleValidate} disabled={validating || !importPid} className="btn-outline w-full btn-sm">
                {validating ? 'Validating…' : <><RiCheckLine className="w-4 h-4" /> Validate FHIR</>}
              </button>
            </div>
          </div>

          {/* System Summary */}
          <div className="card">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">System Overview</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Resources</span>
                <span className="text-white font-bold">{resources.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">FHIR Version</span>
                <span className="text-blue-400 font-bold">R4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Patients</span>
                <span className="text-white font-bold">{patients.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync History */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">FHIR Sync History</p>
            <p className="text-xs text-gray-500">Recent synchronization events</p>
          </div>
          <span className="badge-yellow text-[10px]">Backend API Pending</span>
        </div>
        <div className="overflow-x-auto custom-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Started At</th>
                <th>Patient ID</th>
                <th>Resource Type</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {syncHistory.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-[11px] text-gray-500">{new Date(s.startedAt).toLocaleString()}</td>
                  <td className="font-mono text-[11px] text-blue-400">{s.patientId}</td>
                  <td className="text-xs">{s.resourceType}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-xs text-gray-400">{s.message || 'Synced'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FhirSync;
