// src/pages/Validation/Validation.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RiCheckboxLine, RiRefreshLine, RiAlertLine, RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri';
import { fhirService } from '../../services/fhirService';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { consentService } from '../../services/consentService';
import { vitalsService } from '../../services/vitalsService';
import { useNotification } from '../../context/NotificationContext';

const ProgressBar = ({ label, value, max }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="font-bold text-white">{value}/{max} <span className="text-gray-500 text-xs">({pct}%)</span></span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ValidationRow = ({ label, status, message }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-[#1F2937]/50 last:border-0">
    {status === 'pass'  && <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0"><RiCheckLine className="w-3.5 h-3.5 text-green-400" /></div>}
    {status === 'fail'  && <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0"><RiCloseLine className="w-3.5 h-3.5 text-red-400" /></div>}
    {status === 'warn'  && <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0"><RiAlertLine className="w-3.5 h-3.5 text-yellow-400" /></div>}
    {status === 'skip'  && <div className="w-6 h-6 rounded-full bg-gray-500/20 border border-gray-500/40 flex items-center justify-center shrink-0"><span className="text-[10px] text-gray-500">–</span></div>}
    <div className="flex-1">
      <p className="text-sm text-gray-200 font-medium">{label}</p>
      {message && <p className="text-xs text-gray-500 mt-0.5">{message}</p>}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wide ${status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-400' : status === 'warn' ? 'text-yellow-400' : 'text-gray-500'}`}>
      {status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'warn' ? 'WARN' : 'SKIP'}
    </span>
  </div>
);

export const Validation = () => {
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();
  const [patients,   setPatients]  = useState([]);
  const [fhirRes,    setFhirRes]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [validating, setValidating]= useState(false);
  const [results,    setResults]   = useState(null);
  const [selectedPid,setPid]       = useState(searchParams.get('patientId') || '');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.allSettled([
        patientService.getAllPatients(),
        fhirService.getResources(),
      ]);
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data || []);
      if (fRes.status === 'fulfilled') setFhirRes(fRes.value.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const pid = searchParams.get('patientId') || '';
    setPid(pid);
  }, [searchParams]);

  const handleValidate = async () => {
    if (!selectedPid) { notify.error('Required', 'Select a patient to validate.'); return; }
    setValidating(true);
    try {
      const [patientRes, consentRes, vitalsRes, fhirResResp, twinRes] = await Promise.allSettled([
        patientService.getPatientById(selectedPid),
        consentService.getConsent(selectedPid),
        vitalsService.getLatestVitals(selectedPid),
        fhirService.getPatientResources(selectedPid),
        twinService.getPatient360Summary(selectedPid),
      ]);

      const p = patientRes.status === 'fulfilled' ? patientRes.value.data : null;
      const consent = consentRes.status === 'fulfilled' ? consentRes.value.data : null;
      const vitals = vitalsRes.status === 'fulfilled' ? vitalsRes.value.data : null;
      const fhirPatientResources = fhirResResp.status === 'fulfilled' ? fhirResResp.value.data || [] : [];
      const twin = twinRes.status === 'fulfilled' ? twinRes.value.data?.healthTwin : null;
      const fhirValid = fhirPatientResources.length > 0 || fhirResResp.status === 'fulfilled';

      setResults({
        fhir: [
          { label: 'FHIR R4 Server Connectivity', status: fhirValid ? 'pass' : 'fail', message: fhirValid ? 'Patient-specific FHIR resources loaded' : 'No patient FHIR resources found' },
          { label: 'Patient Resource Present', status: p ? 'pass' : 'fail', message: p ? `Patient ${selectedPid} found` : 'No patient record' },
          { label: 'FHIR Patient Resources Synced', status: fhirPatientResources.some(r => r.resourceType === 'Patient') ? 'pass' : 'warn', message: `${fhirPatientResources.length} resources loaded for ${selectedPid}` },
          { label: 'Observation Resources', status: fhirPatientResources.some(r => r.resourceType === 'Observation') ? 'pass' : 'warn', message: 'Observation FHIR records' },
          { label: 'Condition Resources', status: fhirPatientResources.some(r => r.resourceType === 'Condition') ? 'pass' : 'warn', message: 'Condition records present' },
        ],
        consent: [
          { label: 'Consent Module Reachable', status: consentRes.status === 'fulfilled' ? 'pass' : 'fail', message: consentRes.status === 'fulfilled' ? 'Consent service responding' : 'Consent lookup failed' },
          { label: 'Patient Consent Record', status: consent ? 'pass' : 'warn', message: consent ? 'Consent found for selected patient' : 'No consent record found' },
        ],
        twin: [
          { label: 'Digital Twin Created', status: twin ? 'pass' : 'fail', message: twin ? 'Twin data loaded from backend' : 'No twin found' },
          { label: 'Risk Score Present', status: twin?.riskScore != null ? 'pass' : 'warn', message: `Risk: ${twin?.riskScore ?? 'Not computed'}` },
          { label: 'Health Score Present', status: twin?.healthScore != null ? 'pass' : 'warn', message: `Health: ${twin?.healthScore ?? 'Not computed'}` },
          { label: 'Medications Populated', status: twin?.currentMedications?.length > 0 ? 'pass' : 'warn', message: `${twin?.currentMedications?.length || 0} medications` },
          { label: 'Conditions Populated', status: twin?.chronicDiseases?.length > 0 ? 'pass' : 'warn', message: `${twin?.chronicDiseases?.length || 0} conditions` },
        ],
        vitals: [
          { label: 'Vitals Service Reachable', status: vitalsRes.status === 'fulfilled' ? 'pass' : 'fail', message: vitalsRes.status === 'fulfilled' ? 'Latest vitals returned' : 'No latest vitals found' },
          { label: 'Patient Has Vitals Record', status: vitals ? 'pass' : 'warn', message: vitals ? 'Latest vitals available' : 'No vitals record found' },
        ],
        patient: [
          { label: 'Patient Record Present', status: p ? 'pass' : 'fail', message: p ? `${p.firstName} ${p.lastName}` : 'Record not found' },
          { label: 'Demographics Complete', status: p?.gender && p?.dob ? 'pass' : 'warn', message: 'Gender and DOB check' },
          { label: 'Contact Info Present', status: p?.email ? 'pass' : 'warn', message: p?.email || 'Email missing' },
        ],
      });
      notify.success('Validation Complete', 'Clinical validation report generated.');
    } catch (e) {
      notify.error('Validation Error', e.message);
    } finally { setValidating(false); }
  };

  const totalFhirCount = fhirRes.length;
  const fhirByType = ['Patient','Observation','Condition','MedicationRequest','Procedure']
    .reduce((acc, t) => { acc[t] = fhirRes.filter(r => r.resourceType === t).length; return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiCheckboxLine className="w-6 h-6 text-blue-400" /> Clinical Validation
          </h1>
          <p className="page-subtitle">FHIR compliance, Twin completeness, and Data integrity validation</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPid}
            onChange={(e) => {
              const nextPid = e.target.value;
              setPid(nextPid);
              if (nextPid) {
                window.history.replaceState({}, '', `/validation?patientId=${encodeURIComponent(nextPid)}`);
              } else {
                window.history.replaceState({}, '', '/validation');
              }
            }}
            className="form-select w-52"
          >
            <option value="">Select Patient</option>
            {patients.map(p => (
              <option key={p.patientId || p.id} value={p.patientId || p.id}>
                {p.firstName} {p.lastName} ({p.patientId || p.id})
              </option>
            ))}
          </select>
          <button onClick={handleValidate} disabled={validating || !selectedPid} className="btn-primary btn-sm">
            {validating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Running…</> : <>Run Validation</>}
          </button>
          <button onClick={loadData} className="btn-ghost btn-sm">
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="card-lg">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Platform Data Completeness</p>
        <div className="space-y-4">
          <ProgressBar label="Patient Registry"   value={patients.length}    max={Math.max(patients.length, 1)}    />
          <ProgressBar label="FHIR R4 Resources"  value={totalFhirCount}     max={Math.max(totalFhirCount, 5)}     />
          {Object.entries(fhirByType).map(([type, count]) => (
            <ProgressBar key={type} label={`FHIR ${type}`} value={count} max={Math.max(count, 3)} />
          ))}
        </div>
      </div>

      {/* Validation Results */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[
            { title: 'FHIR Compliance',      key: 'fhir'    },
            { title: 'Twin Completeness',     key: 'twin'    },
            { title: 'Vitals Coverage',       key: 'vitals'  },
            { title: 'Consent Validation',    key: 'consent' },
            { title: 'Patient Data',          key: 'patient' },
          ].map(({ title, key }) => (
            <div key={key} className="card-lg">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</p>
              {results[key]?.map((r, i) => <ValidationRow key={i} {...r} />)}
            </div>
          ))}
        </div>
      )}

      {!results && !loading && (
        <div className="card py-16 text-center space-y-3">
          <RiCheckboxLine className="w-16 h-16 text-gray-700 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Select a patient and run validation</p>
          <p className="text-sm text-gray-500">This will check FHIR compliance, twin completeness, and data integrity.</p>
        </div>
      )}
    </div>
  );
};

export default Validation;
