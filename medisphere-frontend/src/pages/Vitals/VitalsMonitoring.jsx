// src/pages/Vitals/VitalsMonitoring.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiHeartPulseLine, RiDropLine, RiThermometerLine, RiMoonLine,
  RiRunLine, RiRefreshLine, RiAlertLine, RiAddLine,
} from 'react-icons/ri';
import { vitalsService } from '../../services/vitalsService';
import { patientService } from '../../services/patientService';
import { useNotification } from '../../context/NotificationContext';

const VitalCard = ({ icon: Icon, label, value, unit, normal, color }) => {
  const isAlert = value && normal && (value < normal[0] || value > normal[1]);
  return (
    <div className={`card flex flex-col items-center gap-2 py-6 ${isAlert ? 'border-red-500/30' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAlert ? 'bg-red-500/15' : 'bg-surface-2'}`}>
        <Icon className={`w-6 h-6 ${isAlert ? 'text-red-400' : color}`} />
      </div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={`text-4xl font-black ${isAlert ? 'text-red-400' : 'text-white'}`}>{value ?? '—'}</p>
      <p className="text-[10px] text-gray-600">{unit}</p>
      {isAlert && <span className="badge-red text-[10px]">Out of Range</span>}
      {!isAlert && value && normal && <span className="badge-green text-[10px]">Normal</span>}
    </div>
  );
};

export const VitalsMonitoring = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { notify }     = useNotification();

  const [patients,     setPatients]     = useState([]);
  const [selectedPid,  setSelectedPid]  = useState(searchParams.get('patientId') || '');
  const [latestVitals, setLatest]       = useState(null);
  const [vitalsHistory,setHistory]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [showAddForm,  setShowAdd]      = useState(false);
  const [addLoading,   setAddLoading]   = useState(false);
  const [form, setForm] = useState({
    heartRate:'', bpSystolic:'', bpDiastolic:'', spo2:'', temperature:'', steps:'', sleepHours:'', respirationRate:''
  });

  const loadVitals = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [lat, hist] = await Promise.allSettled([
        vitalsService.getLatestVitals(pid),
        vitalsService.getVitalsByPatient(pid),
      ]);
      if (lat.status === 'fulfilled') setLatest(lat.value.data);
      else setLatest(null);
      if (hist.status === 'fulfilled') setHistory(hist.value.data || []);
      else setHistory([]);
    } catch { setLatest(null); setHistory([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    patientService.getAllPatients()
      .then(r => setPatients(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pid = searchParams.get('patientId') || '';
    setSelectedPid(pid);
    if (pid) {
      loadVitals(pid);
    }
  }, [searchParams, loadVitals]);

  useEffect(() => {
    if (!selectedPid && patients.length > 0) {
      const firstPatientId = patients[0].patientId || patients[0].id;
      if (firstPatientId) {
        setSelectedPid(firstPatientId);
        navigate(`/vitals?patientId=${encodeURIComponent(firstPatientId)}`, { replace: true });
      }
    }
  }, [patients, selectedPid, navigate]);

  useEffect(() => {
    if (selectedPid) loadVitals(selectedPid);
  }, [selectedPid, loadVitals]);

  const handleAddVitals = async () => {
    if (!selectedPid) return;
    setAddLoading(true);
    try {
      await vitalsService.addVitals({
        patientId: selectedPid,
        heartRate:      Number(form.heartRate)      || undefined,
        bpSystolic:     Number(form.bpSystolic)     || undefined,
        bpDiastolic:    Number(form.bpDiastolic)    || undefined,
        spo2:           Number(form.spo2)           || undefined,
        temperature:    Number(form.temperature)    || undefined,
        steps:          Number(form.steps)          || undefined,
        sleepHours:     Number(form.sleepHours)     || undefined,
        respirationRate:Number(form.respirationRate)|| undefined,
      });
      notify.success('Vitals Recorded', 'Patient vitals saved successfully.');
      setShowAdd(false);
      setForm({ heartRate:'', bpSystolic:'', bpDiastolic:'', spo2:'', temperature:'', steps:'', sleepHours:'', respirationRate:'' });
      loadVitals(selectedPid);
    } catch (err) {
      notify.error('Failed', err.response?.data?.message || err.message);
    } finally { setAddLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiHeartPulseLine className="w-6 h-6 text-red-400" /> Vitals Monitoring
          </h1>
          <p className="page-subtitle">Hospital-grade wearable vitals tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPid}
            onChange={(e) => {
              const nextPid = e.target.value;
              setSelectedPid(nextPid);
              if (nextPid) {
                navigate(`/vitals?patientId=${encodeURIComponent(nextPid)}`, { replace: true });
              } else {
                navigate('/vitals', { replace: true });
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
          {selectedPid && (
            <>
              <button onClick={() => loadVitals(selectedPid)} className="btn-outline btn-sm" disabled={loading}>
                <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
                <RiAddLine className="w-4 h-4" /> Add Vitals
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedPid && (
        <div className="card py-20 text-center space-y-3">
          <RiHeartPulseLine className="w-16 h-16 text-gray-700 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Select a Patient to Monitor</p>
          <p className="text-sm text-gray-500">Choose from the dropdown above or browse <button onClick={() => navigate('/patients')} className="text-blue-400">Patient Registry</button></p>
        </div>
      )}

      {selectedPid && loading && (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading vitals from backend…</p>
        </div>
      )}

      {selectedPid && !loading && (
        <>
          {/* Latest Vitals Cards */}
          {latestVitals ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              <VitalCard icon={RiHeartPulseLine} label="Heart Rate"    value={latestVitals.heartRate}    unit="bpm"  color="text-red-400"    normal={[60,100]} />
              <VitalCard icon={RiDropLine}        label="Systolic BP"   value={latestVitals.bpSystolic}   unit="mmHg" color="text-blue-400"   normal={[90,140]} />
              <VitalCard icon={RiHeartPulseLine} label="SpO₂"          value={latestVitals.spo2}         unit="%"    color="text-cyan-400"   normal={[95,100]} />
              <VitalCard icon={RiThermometerLine}label="Temperature"    value={latestVitals.temperature}  unit="°F"   color="text-amber-400"  normal={[97,99]}  />
              <VitalCard icon={RiRunLine}         label="Steps"         value={latestVitals.steps}        unit="today"color="text-green-400"  />
              <VitalCard icon={RiMoonLine}        label="Sleep"         value={latestVitals.sleepHours}   unit="hrs"  color="text-indigo-400" normal={[7,9]}    />
              <VitalCard icon={RiHeartPulseLine} label="Respiration"   value={latestVitals.respirationRate} unit="/min"color="text-teal-400"  normal={[12,20]}  />
              <VitalCard icon={RiDropLine}        label="Diastolic BP"  value={latestVitals.bpDiastolic}  unit="mmHg" color="text-blue-300"   normal={[60,90]}  />
            </div>
          ) : (
            <div className="card py-12 text-center space-y-2">
              <RiAlertLine className="w-10 h-10 text-yellow-500 mx-auto" />
              <p className="text-gray-400">No vitals recorded for this patient. Add the first reading!</p>
            </div>
          )}

          {/* Vitals History Table */}
          {vitalsHistory.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1F2937]">
                <p className="text-sm font-bold text-white">Vitals History</p>
                <p className="text-xs text-gray-500 mt-0.5">{vitalsHistory.length} records from backend</p>
              </div>
              <div className="overflow-x-auto custom-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recorded At</th>
                      <th>HR (bpm)</th>
                      <th>BP (mmHg)</th>
                      <th>SpO₂ (%)</th>
                      <th>Temp (°F)</th>
                      <th>Resp (/min)</th>
                      <th>Steps</th>
                      <th>Sleep (hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsHistory.map((v, i) => (
                      <tr key={i}>
                        <td className="font-mono text-[11px] text-gray-500">
                          {v.recordedAt ? new Date(v.recordedAt).toLocaleString() : '—'}
                        </td>
                        <td className={v.heartRate > 100 || v.heartRate < 60 ? 'text-red-400 font-bold' : ''}>{v.heartRate ?? '—'}</td>
                        <td>{v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                        <td className={v.spo2 < 95 ? 'text-red-400 font-bold' : ''}>{v.spo2 ?? '—'}</td>
                        <td>{v.temperature ?? '—'}</td>
                        <td>{v.respirationRate ?? '—'}</td>
                        <td>{v.steps ?? '—'}</td>
                        <td>{v.sleepHours ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Vitals Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-lg w-full animate-slide-up">
            <h3 className="section-title mb-5">Record Vitals</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Heart Rate (bpm)', key: 'heartRate' },
                { label: 'BP Systolic', key: 'bpSystolic' },
                { label: 'BP Diastolic', key: 'bpDiastolic' },
                { label: 'SpO₂ (%)', key: 'spo2' },
                { label: 'Temperature (°F)', key: 'temperature' },
                { label: 'Respiration (/min)', key: 'respirationRate' },
                { label: 'Steps', key: 'steps' },
                { label: 'Sleep (hours)', key: 'sleepHours' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="form-input"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleAddVitals} disabled={addLoading} className="btn-primary flex-1">
                {addLoading ? 'Saving…' : 'Save Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalsMonitoring;
