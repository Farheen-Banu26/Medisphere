// src/pages/DigitalTwin/DigitalTwin.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiRobot2Line, RiSearchLine, RiRefreshLine, RiAlertLine,
  RiHeartPulseLine, RiDropLine, RiThermometerLine, RiMoonLine, RiRunLine,
} from 'react-icons/ri';
import { BodyHeatmap } from '../../components/charts/BodyHeatmap';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { patientService } from '../../services/patientService';
import { labService } from '../../services/labService';
import { useNotification } from '../../context/NotificationContext';

const getRiskColor = (s) => !s && s!==0?'text-gray-400':s<25?'text-green-400':s<50?'text-yellow-400':s<75?'text-orange-400':'text-red-400';
const getRiskLabel = (s) => !s && s!==0?'—':s<25?'Low':s<50?'Moderate':s<75?'High':'Critical';
const getHeatmapRisks = (score) => {
  if (score == null) {
    return { head: 0, chest: 0, abdomen: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 };
  }
  const b = score;
  return { head: Math.max(0,b-5), chest: Math.min(100,b+15), abdomen: b, leftArm: Math.max(0,b-10), rightArm: Math.max(0,b-10), leftLeg: Math.max(0,b-5), rightLeg: Math.max(0,b-5) };
};

const MetricBox = ({ label, value, sub, highlight }) => (
  <div className={`card flex flex-col gap-1 ${highlight ? 'border-blue-500/30' : ''}`}>
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    <p className={`text-3xl font-black ${highlight ? 'text-blue-400' : 'text-white'}`}>{value ?? '—'}</p>
    {sub && value != null && <p className="text-xs text-gray-500">{sub}</p>}
  </div>
);

const VitalBox = ({ icon: Icon, label, value, unit, color }) => (
  <div className="card flex flex-col items-center gap-1.5 py-4">
    <Icon className={`w-6 h-6 ${color}`} />
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black text-white">{value ?? '—'}</p>
    <p className="text-[10px] text-gray-600">{unit}</p>
  </div>
);

export const DigitalTwin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [pidInput, setPid]   = useState(searchParams.get('patientId') || '');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data360, setData]    = useState(null);
  const [vitals, setVitals]   = useState(null);
  const [labResults, setLabResults] = useState(null);
  const [labError, setLabError] = useState(false);

  const loadTwin = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [r, v, l] = await Promise.allSettled([
        twinService.getPatient360Summary(pid),
        vitalsService.getLatestVitals(pid),
        labService.getLabs(pid),
      ]);
      if (r.status === 'fulfilled') setData(r.value.data);
      else { notify.error('Not found', `No twin data for patient: ${pid}`); setData(null); }
      if (v.status === 'fulfilled') setVitals(v.value.data);
      if (l.status === 'fulfilled') {
        setLabResults(l.value.data || null);
        setLabError(false);
      } else {
        setLabResults(null);
        setLabError(true);
      }
    } catch {
      setData(null);
      setLabResults(null);
      setLabError(true);
    } finally { setLoading(false); }
  }, [notify]);

  useEffect(() => {
    patientService.getAllPatients()
      .then((r) => setPatients(r.data || []))
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    const pid = searchParams.get('patientId') || '';
    setPid(pid);
    if (pid) {
      loadTwin(pid);
    } else {
      setData(null);
      setVitals(null);
    }
  }, [searchParams, loadTwin]);

  const twin    = data360?.healthTwin;
  const patient = data360?.patient;
  const consent = data360?.consent;
  const healthScore = twin?.healthScore ?? twin?.riskScore ?? null;
  const bmi = twin?.bmi ?? (twin?.height && twin?.weight ? (twin.weight / ((twin.height / 100) ** 2)).toFixed(1) : null);
  const hasLabResults = labResults && Object.keys(labResults).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiRobot2Line className="w-6 h-6 text-blue-400" /> Health Twin Console
          </h1>
          <p className="page-subtitle">Digital replica of patient health and risk profile</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={pidInput}
              onChange={(e) => {
                const nextPid = e.target.value.trim();
                setPid(nextPid);
                if (nextPid) {
                  navigate(`/digital-twin?patientId=${encodeURIComponent(nextPid)}`, { replace: true });
                } else {
                  navigate('/digital-twin', { replace: true });
                }
              }}
              className="form-select pl-9 w-56"
            >
              <option value="">Select Patient</option>
              {patients.map((p) => (
                <option key={p.patientId || p.id} value={p.patientId || p.id}>
                  {p.firstName} {p.lastName} ({p.patientId || p.id})
                </option>
              ))}
            </select>
          </div>
          <button onClick={() => {
            const pid = pidInput.trim();
            if (pid) navigate(`/digital-twin?patientId=${encodeURIComponent(pid)}`, { replace: true });
          }} className="btn-primary btn-sm" disabled={loading || !pidInput.trim()}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RiRefreshLine className="w-4 h-4" />}
            Load
          </button>
        </div>
      </div>

      {!pidInput && !data360 && (
        <div className="card py-20 text-center space-y-3">
          <RiRobot2Line className="w-16 h-16 text-gray-700 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Choose a patient to view the digital twin</p>
          <button onClick={() => navigate('/patients')} className="btn-outline btn-sm">Browse Patients</button>
        </div>
      )}

      {loading && (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading digital twin from backend…</p>
        </div>
      )}

      {!loading && pidInput && !data360 && (
        <div className="card py-16 text-center space-y-2">
          <RiAlertLine className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Twin Not Found</p>
          <p className="text-sm text-gray-500">No digital twin exists for patient <span className="font-mono text-white">{pidInput}</span></p>
        </div>
      )}

      {!loading && data360 && (
        <>
          {/* Patient Banner */}
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <RiRobot2Line className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white">{patient?.firstName} {patient?.lastName}</p>
              <p className="text-sm text-gray-400">{patient?.patientId} · {patient?.gender} · {patient?.bloodGroup || '—'}</p>
            </div>
            {consent?.status === 'ACTIVE' && <span className="badge-green text-xs">Consent Active</span>}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left — Twin Metrics */}
            <div className="xl:col-span-8 space-y-5">
              {/* Core Metrics */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Core Twin Metrics</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MetricBox label="Risk Score"   value={twin?.riskScore}   sub={getRiskLabel(twin?.riskScore)} highlight />
                  <MetricBox label="Health Score" value={healthScore}  sub={healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Poor'} />
                  <MetricBox label="BMI"          value={bmi}         sub="Body Mass Index" />
                  <MetricBox label="Height"       value={twin?.height ? `${twin.height} cm` : null}      sub="centimetres" />
                  <MetricBox label="Weight"       value={twin?.weight ? `${twin.weight} kg` : null}      sub="kilograms" />
                  <MetricBox label="Blood Group"  value={twin?.bloodGroup || '—'}  sub="ABO type" />
                </div>
              </div>

              {/* Latest Vitals */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Latest Vitals</p>
                {vitals ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <VitalBox icon={RiHeartPulseLine} label="HR"    value={vitals.heartRate}   unit="bpm"  color="text-red-400" />
                    <VitalBox icon={RiDropLine}        label="BP"    value={vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null} unit="mmHg" color="text-blue-400" />
                    <VitalBox icon={RiHeartPulseLine} label="SpO₂"  value={vitals.spo2}        unit="%"    color="text-cyan-400" />
                    <VitalBox icon={RiThermometerLine}label="Temp"   value={vitals.temperature} unit="°F"   color="text-amber-400" />
                    <VitalBox icon={RiRunLine}         label="Steps"  value={vitals.steps}       unit="today"color="text-green-400" />
                    <VitalBox icon={RiMoonLine}        label="Sleep"  value={vitals.sleepHours}  unit="hrs"  color="text-indigo-400" />
                  </div>
                ) : (
                  <div className="card py-8 text-center">
                    <p className="text-gray-400 text-sm">No vitals recorded for this patient.</p>
                  </div>
                )}
              </div>

              {/* Diseases */}
              {twin?.chronicDiseases?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Chronic Conditions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {twin.chronicDiseases.map((d, i) => (
                      <div key={i} className="px-3 py-2.5 bg-surface-2 rounded-lg border border-[#1F2937] flex items-center justify-between">
                        <span className="text-sm text-gray-300">{d}</span>
                        <span className="badge-orange text-[10px]">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {twin?.currentMedications?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Medications</p>
                  <div className="grid grid-cols-2 gap-3">
                    {twin.currentMedications.map((m, i) => (
                      <div key={i} className="px-3 py-2.5 bg-surface-2 rounded-lg border border-[#1F2937] border-l-2 border-l-blue-500">
                        <p className="text-sm font-semibold text-white">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {twin?.allergies?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {twin.allergies.map((a, i) => <span key={i} className="badge-red">{a}</span>)}
                  </div>
                </div>
              )}

              {/* Lab Results Placeholder */}
              <div className="card border border-dashed border-yellow-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <RiAlertLine className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-bold text-yellow-400">Laboratory Results</p>
                </div>
                {hasLabResults ? (
                  <div className="space-y-3">
                    {Object.entries(labResults).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm text-gray-200">
                        <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>{value ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">No laboratory results are available for this patient.</p>
                    {labError && (
                      <p className="text-xs text-gray-500">Lab service cannot be reached or is not configured for this environment.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right — Heatmap */}
            <div className="xl:col-span-4 card-lg flex flex-col items-center gap-4">
              <div className="w-full border-b border-[#1F2937] pb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Digital Twin Heatmap</p>
                <p className={`text-sm font-bold mt-1 ${getRiskColor(twin?.riskScore)}`}>
                  {getRiskLabel(twin?.riskScore)} Risk
                </p>
              </div>
              <BodyHeatmap risks={getHeatmapRisks(twin?.riskScore)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DigitalTwin;
