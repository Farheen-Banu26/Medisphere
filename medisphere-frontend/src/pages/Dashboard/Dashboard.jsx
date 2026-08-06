// src/pages/Dashboard/Dashboard.jsx
// Enterprise Healthcare Digital Twin Command Center Dashboard
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiRobot2Line, RiExchangeLine,
  RiHeartPulseLine, RiDropLine, RiThermometerLine, RiMoonLine, RiRunLine,
  RiShieldCheckLine, RiCodeBoxLine, RiRefreshLine, RiArrowRightLine,
  RiAlertLine, RiFlashlightLine,
} from 'react-icons/ri';
import { BodyHeatmap } from '../../components/charts/BodyHeatmap';
import { patientService } from '../../services/patientService';
import { fhirService } from '../../services/fhirService';
import { twinService } from '../../services/twinService';
import { auditService } from '../../services/auditService';

// ── Helpers ────────────────────────────────────────────
const riskColor = (score) => {
  if (!score && score !== 0) return 'text-gray-400';
  if (score < 25) return 'text-green-400';
  if (score < 50) return 'text-yellow-400';
  if (score < 75) return 'text-orange-400';
  return 'text-red-400';
};

const riskLabel = (score) => {
  if (!score && score !== 0) return 'N/A';
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
};

const getRiskForHeatmap = (score) => {
  const base = score || 10;
  return {
    head:      Math.max(0, base - 5),
    chest:     Math.min(100, base + 15),
    abdomen:   base,
    leftArm:   Math.max(0, base - 10),
    rightArm:  Math.max(0, base - 10),
    leftLeg:   Math.max(0, base - 5),
    rightLeg:  Math.max(0, base - 5),
  };
};

const auditStatusColor = (s) => {
  if (s === 'SUCCESS') return 'badge-green';
  if (s === 'WARNING') return 'badge-yellow';
  if (s === 'ERROR' || s === 'FAILED') return 'badge-red';
  return 'badge-gray';
};

// ── Stat Card ──────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, description, color, loading }) => {
  const colors = {
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   val: 'text-blue-100' },
    green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  val: 'text-green-100' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', val: 'text-purple-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`card flex items-start gap-4 ${c.border} border relative overflow-hidden`}>
      <div className={`${c.bg} rounded-xl p-3 shrink-0`}>
        <Icon className={`w-7 h-7 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
        {loading ? (
          <div className="skeleton h-8 w-20 rounded-lg mt-1" />
        ) : (
          <p className={`text-4xl font-black ${c.val} leading-none`}>{value ?? '—'}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      </div>
    </div>
  );
};

// ── Vital Chip ─────────────────────────────────────────
const VitalChip = ({ icon: Icon, label, value, unit, color }) => (
  <div className="flex flex-col items-center bg-surface-2 rounded-xl p-3 border border-[#1F2937] gap-1.5">
    <Icon className={`w-5 h-5 ${color}`} />
    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
    <p className="text-lg font-bold text-white leading-none">{value ?? '—'}</p>
    <p className="text-[10px] text-gray-600">{unit}</p>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients]       = useState([]);
  const [fhirResources, setFhirRes]   = useState([]);
  const [twin360, setTwin360]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeFhirTab, setFhirTab]   = useState('Patient');
  const [lastSync, setLastSync]       = useState(null);
  const [auditLogs, setAuditLogs]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, fRes, aRes] = await Promise.allSettled([
        patientService.getAllPatients(),
        fhirService.getResources(),
        auditService.getLogs(),
      ]);
      let pts = [];
      if (pRes.status === 'fulfilled' && pRes.value?.data) pts = pRes.value.data;
      setPatients(pts);
      if (fRes.status === 'fulfilled' && fRes.value?.data) setFhirRes(fRes.value.data);
      if (aRes.status === 'fulfilled' && aRes.value?.data) setAuditLogs(aRes.value.data);

      // Load the most-recently-registered patient's 360 summary for the twin panel
      if (pts.length > 0) {
        const latest = pts[pts.length - 1];
        const pid = latest.patientId || latest.id;
        try {
          const t = await twinService.getPatient360Summary(pid);
          setTwin360(t.data);
        } catch { /* twin may not exist yet */ }
      }
      setLastSync(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const twin    = twin360?.healthTwin;
  const vitals  = twin360?.latestVitals;
  const patient = twin360?.patient;
  const consent = twin360?.consent;

  const fhirTabs = ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'Procedure'];
  const displayedFhir = fhirResources.find(r => r.resourceType === activeFhirTab) || null;

  const age = patient?.birthDate
    ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
    : null;

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiFlashlightLine className="w-6 h-6 text-blue-400" />
            Clinical Command Center
          </h1>
          <p className="page-subtitle">
            {lastSync ? `Last synced: ${lastSync.toLocaleTimeString()}` : 'Loading platform data…'}
          </p>
        </div>
        <button onClick={load} className="btn-outline btn-sm" disabled={loading}>
          <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── ROW 1 : KPI Cards ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard title="Patients Onboarded" value={loading ? null : patients.length} icon={RiUserLine}     color="blue"   description="Total registered patients" loading={loading} />
        <KpiCard title="FHIR Resources"     value={loading ? null : fhirResources.length} icon={RiExchangeLine} color="green"  description="Synced FHIR R4 records"    loading={loading} />
        <KpiCard title="Digital Twins"      value={loading ? null : patients.length} icon={RiRobot2Line}   color="purple" description="100% twin coverage"           loading={loading} />
      </div>

      {/* ── ROW 2 : Digital Twin + Heatmap ────────── */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* LEFT — Digital Twin Panel */}
          <div className="xl:col-span-8 card-lg space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1F2937] pb-5">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Patient Digital Twin</p>
                {patient ? (
                  <h2 className="text-xl font-bold text-white">
                    {patient.firstName} {patient.lastName}
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold text-gray-400">No Patient Twin Found</h2>
                )}
                {patient && <p className="text-sm text-gray-400 mt-0.5">FHIR Patient ID · {patient.patientId || '—'}</p>}
              </div>
              <div className="flex items-center gap-2">
                {consent?.status === 'ACTIVE' && (
                  <span className="badge-green flex items-center gap-1">
                    <RiShieldCheckLine className="w-3.5 h-3.5" />
                    Consent Active
                  </span>
                )}
                {twin && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    (twin.riskScore || 0) < 25 ? 'bg-green-500/15 border-green-500/30 text-green-400' :
                    (twin.riskScore || 0) < 50 ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                    (twin.riskScore || 0) < 75 ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' :
                    'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}>
                    {riskLabel(twin.riskScore)} Risk · {twin.riskScore ?? '—'}
                  </span>
                )}
              </div>
            </div>

            {/* Demographics */}
            {patient && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                {[
                  { label: 'Gender',   val: patient.gender },
                  { label: 'DOB',      val: patient.birthDate },
                  { label: 'Age',      val: age ? `${age} yrs` : null },
                  { label: 'Phone',    val: patient.contactNumber || patient.phone },
                  { label: 'Source EHR',val: 'Epic FHIR R4' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-gray-200 mt-1">{val || '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Wearable Vitals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Wearable Vitals</p>
                {vitals && (
                  <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
                )}
              </div>
              {vitals || twin ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <VitalChip icon={RiHeartPulseLine} label="HR"   value={vitals?.heartRate || twin?.heartRate}              unit="bpm"  color="text-red-400"    />
                  <VitalChip icon={RiDropLine}        label="BP"   value={vitals ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : twin?.bloodPressure} unit="mmHg" color="text-blue-400" />
                  <VitalChip icon={RiHeartPulseLine} label="SpO₂" value={vitals?.spo2 || twin?.oxygen}                      unit="%"    color="text-cyan-400"   />
                  <VitalChip icon={RiThermometerLine}label="Temp" value={vitals?.temperature || twin?.temperature}           unit="°F"   color="text-amber-400"  />
                  <VitalChip icon={RiRunLine}         label="Steps"value={vitals?.steps || twin?.steps}                      unit="today"color="text-green-400"  />
                  <VitalChip icon={RiMoonLine}        label="Sleep"value={vitals?.sleepHours || twin?.sleepHours}            unit="hrs"  color="text-indigo-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 bg-surface-2 rounded-xl border border-dashed border-[#1F2937]">
                  <p className="text-sm text-gray-500">No vitals data available from backend</p>
                </div>
              )}
            </div>

            {/* Conditions + Labs row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Active Conditions */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Active Conditions</p>
                <div className="space-y-2">
                  {twin?.chronicDiseases?.length > 0 ? (
                    twin.chronicDiseases.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg border border-[#1F2937]">
                        <span className="text-sm text-gray-300">{d}</span>
                        <span className="badge-orange text-[10px]">Active</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-16 bg-surface-2 rounded-xl border border-dashed border-[#1F2937]">
                      <p className="text-xs text-gray-500">No conditions on record</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lab Results */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Laboratory Results</p>
                <div className="flex flex-col items-center justify-center h-full min-h-[80px] bg-surface-2 rounded-xl border border-dashed border-[#1F2937] p-4">
                  <RiAlertLine className="w-5 h-5 text-yellow-500 mb-2" />
                  <p className="text-xs font-semibold text-yellow-400">Laboratory Integration Pending</p>
                  <p className="text-[10px] text-gray-500 mt-1">Backend API: GET /api/labs/{'{patientId}'}</p>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Current Medications</p>
              {twin?.currentMedications?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {twin.currentMedications.map((m, i) => (
                    <div key={i} className="px-3 py-2.5 bg-surface-2 rounded-lg border border-[#1F2937] border-l-2 border-l-blue-500">
                      <p className="text-sm font-semibold text-white">{m}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Active prescription</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-12 bg-surface-2 rounded-xl border border-dashed border-[#1F2937]">
                  <p className="text-xs text-gray-500">No medications on record</p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#1F2937]">
              <button
                className="btn-primary btn-sm"
                onClick={() => twin360 && navigate(`/digital-twin?patientId=${patient?.patientId}`)}
              >
                <RiRobot2Line className="w-4 h-4" /> View Full Twin
              </button>
              <button className="btn-outline btn-sm" onClick={() => navigate('/patient360')}>
                <RiArrowRightLine className="w-4 h-4" /> Patient 360
              </button>
            </div>
          </div>

          {/* RIGHT — Body Heatmap */}
          <div className="xl:col-span-4 card-lg flex flex-col items-center gap-4">
            <div className="w-full border-b border-[#1F2937] pb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Digital Twin Heatmap</p>
              {twin && (
                <p className="text-sm font-bold mt-1">
                  Risk Score: <span className={`${riskColor(twin.riskScore)} font-black`}>{twin.riskScore ?? '—'}</span>
                </p>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center w-full">
              <BodyHeatmap risks={getRiskForHeatmap(twin?.riskScore)} />
            </div>

            {/* Risk Legend */}
            <div className="w-full bg-surface-2 rounded-xl p-4 border border-[#1F2937]">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center mb-3">System Risk Legend</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Cardiovascular', 'text-red-400',    (twin?.riskScore || 10) + 15],
                  ['Pulmonary',      'text-orange-400',  twin?.riskScore || 10],
                  ['Metabolic',      'text-yellow-400', (twin?.riskScore || 10) - 5],
                  ['Renal',          'text-amber-400',  (twin?.riskScore || 10) + 5],
                  ['Neurology',      'text-green-400',  (twin?.riskScore || 10) - 10],
                  ['Hepatic',        'text-green-400',  Math.max(0, (twin?.riskScore || 10) - 15)],
                ].map(([sys, col, val]) => (
                  <div key={sys} className="flex items-center justify-between">
                    <span className="text-gray-400">{sys}</span>
                    <span className={`font-mono font-bold ${col}`}>{Math.max(0, Math.min(100, val))}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 3 : FHIR Resource Viewer ──────────── */}
      <div className="card-lg bg-[#0A0F1C] border border-[#1F2937]">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <RiCodeBoxLine className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">FHIR R4 Resource Viewer</span>
          </div>
          <button className="btn-primary btn-sm">Ingest & Sync Twin</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto custom-scroll pb-1">
          {fhirTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFhirTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFhirTab === tab
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-surface-2'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* JSON Viewer */}
        <div className="code-viewer h-56 overflow-auto custom-scroll relative">
          <span className="absolute top-2 right-3 text-[10px] text-gray-600 font-mono">application/fhir+json</span>
          {fhirResources.length === 0 && !loading && (
            <span className="text-gray-500">{'// No FHIR resources loaded from backend\n// Ensure GET /api/fhir/resources is reachable'}</span>
          )}
          {loading && <span className="text-gray-500">{'// Loading FHIR resources…'}</span>}
          {!loading && displayedFhir && (
            <pre>{JSON.stringify(displayedFhir, null, 2)}</pre>
          )}
          {!loading && fhirResources.length > 0 && !displayedFhir && (
            <span className="text-gray-500">{`// No ${activeFhirTab} resource found\n// Available types: ${[...new Set(fhirResources.map(r => r.resourceType))].join(', ')}`}</span>
          )}
        </div>
      </div>

      {/* ── ROW 4 : HIPAA Audit Logs ──────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">HIPAA Audit Trail</h2>
            <p className="section-subtitle">System access and data modification history</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-blue text-[10px]">Live Backend</span>
            <button onClick={() => navigate('/audit')} className="btn-ghost btn-sm">
              View All <RiArrowRightLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User</th>
                <th>Role</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(auditLogs.slice(0, 8)).map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-[11px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="font-semibold text-gray-200 text-xs">{log.action}</td>
                  <td className="text-gray-300 text-xs">{log.user}</td>
                  <td><span className="badge-blue text-[10px]">{log.role}</span></td>
                  <td className="font-mono text-[11px] text-gray-400">{log.patientId || '—'}</td>
                  <td><span className={`${auditStatusColor(log.status)} text-[10px]`}>{log.status}</span></td>
                  <td className="text-gray-400 text-xs max-w-[200px] truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
