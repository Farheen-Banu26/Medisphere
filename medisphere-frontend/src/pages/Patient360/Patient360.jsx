// src/pages/Patient360/Patient360.new.jsx
// Enterprise EMR — Patient 360 View
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiUserLine,
  RiHeartPulseLine,
  RiShieldCheckLine,
  RiExchangeLine,
  RiSearchLine,
  RiRefreshLine,
  RiDropLine,
  RiThermometerLine,
  RiMoonLine,
  RiRunLine,
  RiAlertLine,
  RiStethoscopeLine,
  RiCalendarLine,
  RiFileTextLine,
} from 'react-icons/ri';
import { BodyHeatmap } from '../../components/charts/BodyHeatmap';
import { VitalsTrendChart } from '../../components/charts/VitalsTrendChart';
import { twinService } from '../../services/twinService';
import { fhirService } from '../../services/fhirService';
import { vitalsService } from '../../services/vitalsService';
import { patientService } from '../../services/patientService';
import { consentService } from '../../services/consentService';
import { labService } from '../../services/labService';
import { useNotification } from '../../context/NotificationContext';

const getRiskForHeatmap = (score) => {
  if (score === null || score === undefined) {
    return {
      head: null,
      chest: null,
      abdomen: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
    };
  }

  const baseline = Number(score);
  return {
    head: Math.max(0, baseline - 5),
    chest: Math.min(100, baseline + 20),
    abdomen: Math.min(100, baseline + 5),
    leftArm: Math.max(0, baseline - 15),
    rightArm: Math.max(0, baseline - 10),
    leftLeg: Math.max(0, baseline - 5),
    rightLeg: Math.max(0, baseline - 5),
  };
};

export const Patient360 = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [patientIdInput, setPidInput] = useState(searchParams.get('patientId') || '');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data360, setData360] = useState(null);
  const [patient, setPatient] = useState(null);
  const [consent, setConsent] = useState(null);
  const [latestVitals, setLatestVitals] = useState(null);
  const [vitalsHistory, setVitalsHist] = useState([]);
  const [fhirData, setFhirData] = useState([]);
  const [labResults, setLabResults] = useState(null);
  const [labError, setLabError] = useState(false);

  const load360 = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);

    try {
      const [r360, patientRes, consentRes, fhirRes, vitalsHistRes, latestVitalsRes, labsRes] = await Promise.allSettled([
        twinService.getPatient360Summary(pid),
        patientService.getPatientById(pid),
        consentService.getConsent(pid),
        fhirService.getPatientResources(pid),
        vitalsService.getVitalsByPatient(pid),
        vitalsService.getLatestVitals(pid),
        labService.getLabs(pid),
      ]);

      setData360(r360.status === 'fulfilled' ? r360.value.data : null);
      setPatient(patientRes.status === 'fulfilled' ? patientRes.value.data || null : null);
      setConsent(consentRes.status === 'fulfilled' ? consentRes.value.data || null : null);
      setFhirData(fhirRes.status === 'fulfilled' ? fhirRes.value.data || [] : []);
      setVitalsHist(vitalsHistRes.status === 'fulfilled' ? vitalsHistRes.value.data || [] : []);
      setLatestVitals(latestVitalsRes.status === 'fulfilled' ? latestVitalsRes.value.data || null : null);

      if (labsRes.status === 'fulfilled') {
        setLabResults(labsRes.value.data || null);
        setLabError(false);
      } else {
        setLabResults(null);
        setLabError(true);
      }

      if (patientRes.status !== 'fulfilled' && r360.status !== 'fulfilled') {
        notify.error('Patient not found', `No data for patient: ${pid}`);
      }
    } catch (err) {
      setData360(null);
      setPatient(null);
      setConsent(null);
      setFhirData([]);
      setVitalsHist([]);
      setLatestVitals(null);
      setLabResults(null);
      setLabError(true);
      notify.error('Dashboard load failed', err.message || 'Unable to load patient dashboard.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    patientService.getAllPatients()
      .then((r) => setPatients(r.data || []))
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    const pid = searchParams.get('patientId') || '';
    setPidInput(pid);
    if (pid) {
      load360(pid);
    } else {
      setData360(null);
      setPatient(null);
      setConsent(null);
      setFhirData([]);
      setVitalsHist([]);
      setLatestVitals(null);
      setLabResults(null);
      setLabError(false);
    }
  }, [searchParams, load360]);

  useEffect(() => {
    if (!patientIdInput) return undefined;

    const interval = setInterval(() => {
      fhirService.getPatientResources(patientIdInput)
        .then((response) => setFhirData(response.data || []))
        .catch(() => { });
    }, 30000);

    return () => clearInterval(interval);
  }, [patientIdInput]);

  const patientRecord = patient || data360?.patient || null;
  const twin = data360?.healthTwin;
  const vitals = latestVitals || data360?.latestVitals || null;
  const consentRecord = consent || data360?.consent || null;

  const patientDob = patientRecord?.birthDate || patientRecord?.dob;
  const age = patientDob ? new Date().getFullYear() - new Date(patientDob).getFullYear() : null;
  const bloodGroup = patientRecord?.bloodGroup || twin?.bloodGroup || '—';
  const healthScore = twin?.healthScore ?? twin?.riskScore;
  const bmi = twin?.bmi ?? (twin?.height && twin?.weight ? (twin.weight / ((twin.height / 100) ** 2)).toFixed(1) : null);
  const weight = twin?.weight || vitals?.weight;
  const height = twin?.height;
  const hasLabResults = labResults && Object.keys(labResults).length > 0;

  const riskColor = (score) => score == null ? 'text-gray-400' : score < 25 ? 'text-green-400' : score < 50 ? 'text-yellow-400' : score < 75 ? 'text-orange-400' : 'text-red-400';
  const riskLabel = (score) => score == null ? 'Unknown' : score < 25 ? 'Low' : score < 50 ? 'Moderate' : score < 75 ? 'High' : 'Critical';

  const latestVitalsCards = [
    { icon: RiHeartPulseLine, label: 'Heart Rate', value: vitals?.heartRate, unit: 'bpm', color: 'text-red-400' },
    { icon: RiDropLine, label: 'Blood Pressure', value: vitals?.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null, unit: 'mmHg', color: 'text-blue-400' },
    { icon: RiThermometerLine, label: 'Temperature', value: vitals?.temperature, unit: '°F', color: 'text-amber-400' },
    { icon: RiMoonLine, label: 'SpO₂', value: vitals?.spo2, unit: '%', color: 'text-cyan-400' },
    { icon: RiShieldCheckLine, label: 'BMI', value: bmi, unit: 'kg/m²', color: 'text-violet-400' },
    { icon: RiStethoscopeLine, label: 'Weight', value: weight, unit: 'kg', color: 'text-lime-400' },
    { icon: RiCalendarLine, label: 'Height', value: height, unit: 'cm', color: 'text-sky-400' },
    { icon: RiRunLine, label: 'Steps', value: vitals?.steps, unit: 'today', color: 'text-green-400' },
    { icon: RiMoonLine, label: 'Sleep', value: vitals?.sleepHours, unit: 'hrs', color: 'text-indigo-400' },
  ];

  const sortedVitalsHistory = useMemo(() => [...(vitalsHistory || [])].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)), [vitalsHistory]);

  const chartData = useMemo(() => sortedVitalsHistory.map((item) => ({
    time: item.recordedAt ? new Date(item.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
    heartRate: item.heartRate,
    bpSystolic: item.bpSystolic,
    bpDiastolic: item.bpDiastolic,
    temperature: item.temperature,
    spo2: item.spo2,
    steps: item.steps,
    sleepHours: item.sleepHours,
  })), [sortedVitalsHistory]);

  const timelineItems = useMemo(() => {
    const items = [];
    if (consentRecord?.grantedOn) {
      items.push({ date: new Date(consentRecord.grantedOn), title: 'Consent granted', detail: consentRecord.purpose || 'Consent agreement accepted' });
    }
    if (consentRecord?.expiryDate) {
      items.push({ date: new Date(consentRecord.expiryDate), title: 'Consent expires', detail: 'Review consent expiration' });
    }
    sortedVitalsHistory.slice(-4).reverse().forEach((item) => {
      if (item.recordedAt) {
        items.push({
          date: new Date(item.recordedAt),
          title: 'Vitals recorded',
          detail: `HR ${item.heartRate ?? '—'} · BP ${item.bpSystolic ?? '—'}/${item.bpDiastolic ?? '—'} · SpO₂ ${item.spo2 ?? '—'}%`,
        });
      }
    });
    fhirData.slice(0, 4).forEach((resource) => {
      const timestamp = resource.meta?.lastUpdated || resource.effectiveDateTime || resource.issued || resource.authoredOn;
      if (timestamp) {
        items.push({
          date: new Date(timestamp),
          title: `FHIR ${resource.resourceType}`,
          detail: resource.id ? `Resource ${resource.id}` : 'FHIR resource synced',
        });
      }
    });
    return items.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [consentRecord, sortedVitalsHistory, fhirData]);

  const medicalHistory = twin?.chronicDiseases || patientRecord?.conditions || [];
  const allergies = twin?.allergies || patientRecord?.allergies || [];
  const medications = twin?.currentMedications || patientRecord?.medications || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="page-title">Patient 360°</h1>
          <p className="page-subtitle">Enterprise clinical view using live service data</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={patientIdInput}
              onChange={(e) => {
                const nextPid = e.target.value.trim();
                setPidInput(nextPid);
                if (nextPid) {
                  navigate(`/patient360?patientId=${encodeURIComponent(nextPid)}`, { replace: true });
                } else {
                  navigate('/patient360', { replace: true });
                }
              }}
              className="form-select pl-9"
            >
              <option value="">Select Patient</option>
              {patients.map((p) => (
                <option key={p.patientId || p.id} value={p.patientId || p.id}>
                  {p.firstName} {p.lastName} ({p.patientId || p.id})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              const pid = patientIdInput.trim();
              if (pid) {
                navigate(`/patient360?patientId=${encodeURIComponent(pid)}`, { replace: true });
              }
            }}
            className="btn-primary btn-sm whitespace-nowrap"
            disabled={loading || !patientIdInput.trim()}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RiRefreshLine className="w-4 h-4" />}
            <span className="ml-2">Load</span>
          </button>
        </div>
      </div>

      {!patientIdInput && !data360 && (
        <div className="card py-20 text-center space-y-3">
          <RiUserLine className="w-16 h-16 text-gray-700 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Choose a patient to begin</p>
          <p className="text-sm text-gray-500">
            Select a patient from the dropdown or browse the <button onClick={() => navigate('/patients')} className="text-blue-400 hover:text-blue-300">Patient Registry</button>.
          </p>
        </div>
      )}

      {loading && (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading patient dashboard…</p>
        </div>
      )}

      {!loading && patientIdInput && !data360 && (
        <div className="card py-16 text-center space-y-3">
          <RiAlertLine className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="text-lg font-bold text-gray-400">Patient not found</p>
          <p className="text-sm text-gray-500">No data returned for <span className="font-mono text-white">{patientIdInput}</span>.</p>
        </div>
      )}

      {!loading && data360 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
            <div className="card-lg">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
                    <RiUserLine className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{patientRecord?.firstName} {patientRecord?.lastName}</h2>
                    <p className="text-sm text-gray-400 mt-1">{patientRecord?.patientId || patientRecord?.id} · {patientRecord?.gender || '—'} · {bloodGroup}</p>
                    <p className="text-xs text-gray-500 mt-2">{patientRecord?.email || 'No email'} · {patientRecord?.contactNumber || patientRecord?.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="badge-blue">Patient Summary</span>
                  <span className={`${consentRecord?.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>Consent {consentRecord?.status || 'Unknown'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                <div className="bg-surface-2 rounded-3xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Patient ID</p>
                  <p className="text-xl font-bold text-white mt-2">{patientRecord?.patientId || patientRecord?.id}</p>
                </div>
                <div className="bg-surface-2 rounded-3xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Age</p>
                  <p className="text-xl font-bold text-white mt-2">{age ? `${age} yrs` : '—'}</p>
                </div>
                <div className="bg-surface-2 rounded-3xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Gender</p>
                  <p className="text-xl font-bold text-white mt-2">{patientRecord?.gender || '—'}</p>
                </div>
                <div className="bg-surface-2 rounded-3xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Blood Group</p>
                  <p className="text-xl font-bold text-white mt-2">{bloodGroup}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-lg">
                <p className="section-title mb-4">Digital Twin Score</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-6">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Health Score</p>
                    <p className="text-5xl font-black text-white">{healthScore ?? '—'}</p>
                    <p className={`mt-3 text-sm font-semibold ${riskColor(twin?.riskScore)}`}>{riskLabel(twin?.riskScore)} risk</p>
                  </div>
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-6 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Clinical Snapshot</p>
                      <div className="space-y-3 text-sm text-gray-200">
                        <div className="flex justify-between"><span>Risk Score</span><span>{twin?.riskScore ?? '—'}</span></div>
                        <div className="flex justify-between"><span>BMI</span><span>{bmi ?? '—'}</span></div>
                        <div className="flex justify-between"><span>Weight</span><span>{weight ? `${weight} kg` : '—'}</span></div>
                        <div className="flex justify-between"><span>Height</span><span>{height ? `${height} cm` : '—'}</span></div>
                      </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0B1221] p-3">
                      <BodyHeatmap risks={getRiskForHeatmap(twin?.riskScore)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-lg">
                <p className="section-title mb-4">Latest Vitals</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {latestVitalsCards.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <p className="text-xs uppercase tracking-widest text-gray-500">{item.label}</p>
                      </div>
                      <p className="text-3xl font-black text-white">{item.value ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-2">{item.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
            <div className="card-lg">
              <p className="section-title mb-4">Trend Charts</p>
              <div className="space-y-5">
                <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Heart Rate · Temperature · SpO₂</p>
                  <VitalsTrendChart data={chartData} keys={['heartRate', 'temperature', 'spo2']} />
                </div>
                <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Blood Pressure</p>
                  <VitalsTrendChart data={chartData} keys={['bpSystolic', 'bpDiastolic']} />
                </div>
                <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Steps · Sleep</p>
                  <VitalsTrendChart data={chartData} keys={['steps', 'sleepHours']} />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="section-title">Clinical Summary</p>
                    <p className="text-xs text-gray-500">Allergies, conditions, medications</p>
                  </div>
                  <RiFileTextLine className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Medical History</p>
                    {medicalHistory.length > 0 ? (
                      <ul className="space-y-2 text-sm text-gray-200">
                        {medicalHistory.map((entry, index) => (
                          <li key={`${entry}-${index}`} className="rounded-2xl bg-[#0B1221] p-3">{entry}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">No medical history available.</p>
                    )}
                  </div>
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Allergies</p>
                    {allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allergies.map((item, index) => (
                          <span key={`${item}-${index}`} className="badge-red text-[11px]">{item}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No known allergies recorded.</p>
                    )}
                  </div>
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Current Medications</p>
                    {medications.length > 0 ? (
                      <ul className="space-y-2 text-sm text-gray-200">
                        {medications.map((item, index) => (
                          <li key={`${item}-${index}`} className="rounded-2xl bg-[#0B1221] p-3">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">No active medications found.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-lg">
                <p className="section-title mb-4">Recent Activity</p>
                {timelineItems.length > 0 ? (
                  <div className="space-y-3">
                    {timelineItems.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">{item.date.toLocaleString()}</p>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-sm text-gray-400 mt-1">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No recent activity available yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-5">
            <div className="card-lg">
              <div className="flex items-center gap-2 mb-4">
                <RiExchangeLine className="w-5 h-5 text-blue-400" />
                <p className="text-sm font-bold text-white">FHIR Resources</p>
                <span className="badge-blue text-[10px]">{fhirData.length} records</span>
              </div>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Resource count</p>
                    <p className="text-3xl font-bold text-white mt-2">{fhirData.length}</p>
                  </div>
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Top types</p>
                    <p className="text-sm text-gray-300 mt-2">{[...new Set(fhirData.map((r) => r.resourceType))].slice(0, 3).join(', ') || 'None'}</p>
                  </div>
                </div>
                {fhirData.length > 0 ? (
                  <div className="rounded-3xl border border-[#1F2937] bg-[#0B1221] p-4 overflow-auto h-72">
                    <pre className="whitespace-pre-wrap text-[11px] text-gray-200">{JSON.stringify(fhirData.slice(0, 4), null, 2)}</pre>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-8 text-center text-gray-400">No FHIR resources loaded.</div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-lg">
                <p className="section-title mb-4">Laboratory Results</p>
                {hasLabResults ? (
                  <div className="space-y-3">
                    {Object.entries(labResults).map(([key, value]) => (
                      <div key={key} className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-3 flex items-center justify-between text-sm text-gray-200">
                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>{value ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-[#1F2937] bg-[#08111F] p-8 text-center text-gray-400">
                    {labError ? 'Laboratory service is unavailable.' : 'No laboratory results available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Patient360;
