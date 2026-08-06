// src/pages/Patients/PatientDetails.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RiArrowLeftLine, RiHeartPulseLine, RiShieldCheckLine,
  RiRefreshLine, RiUserLine, RiStethoscopeLine,
  RiAlertLine, RiCalendarLine,
} from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { consentService } from '../../services/consentService';
import { fhirService } from '../../services/fhirService';
import { labService } from '../../services/labService';
import { useNotification } from '../../context/NotificationContext';
import StatCard from '../../components/cards/StatCard';
import { VitalsTrendChart } from '../../components/charts/VitalsTrendChart';

const InfoRow = ({ label, value }) => (
  <div className="flex items-start gap-2 py-2 border-b border-[#1F2937] last:border-0">
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-200 font-medium">{value ?? '—'}</span>
  </div>
);

const getRiskBadge = (risk) => {
  if (risk == null) return { label: 'Unknown', cls: 'badge-gray' };
  if (risk < 25) return { label: 'Low', cls: 'badge-green' };
  if (risk < 50) return { label: 'Moderate', cls: 'badge-amber' };
  if (risk < 75) return { label: 'High', cls: 'badge-orange' };
  return { label: 'Critical', cls: 'badge-red' };
};

export const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [patient, setPatient] = useState(null);
  const [twin, setTwin] = useState(null);
  const [latestVitals, setLatestVitals] = useState(null);
  const [labResults, setLabResults] = useState(null);
  const [consent, setConsent] = useState(null);
  const [fhirResources, setFhirResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPatientDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [patientRes, twinRes, vitalsRes, consentRes, fhirRes, labRes] = await Promise.allSettled([
        patientService.getPatientById(patientId),
        twinService.getTwin(patientId),
        vitalsService.getLatestVitals(patientId),
        consentService.getConsent(patientId),
        fhirService.getPatientResources(patientId),
        labService.getLabs(patientId),
      ]);

      if (patientRes.status === 'fulfilled') {
        setPatient(patientRes.value.data || null);
      } else {
        throw new Error('Patient not found');
      }

      setTwin(twinRes.status === 'fulfilled' ? twinRes.value.data || null : null);
      setLatestVitals(vitalsRes.status === 'fulfilled' ? vitalsRes.value.data || null : null);
      setConsent(consentRes.status === 'fulfilled' ? consentRes.value.data || null : null);
      setFhirResources(fhirRes.status === 'fulfilled' ? fhirRes.value.data || [] : []);
      setLabResults(labRes.status === 'fulfilled' ? labRes.value.data || null : null);
    } catch (err) {
      setError(err.message || 'Unable to load patient details');
      notify.error('Patient load failed', err.response?.data?.message || err.message || 'Check the backend connection.');
    } finally {
      setLoading(false);
    }
  }, [patientId, notify]);

  useEffect(() => {
    if (!patientId) return;
    loadPatientDetails();
  }, [patientId, loadPatientDetails]);

  const age = patient?.dob ? Math.max(0, new Date().getFullYear() - new Date(patient.dob).getFullYear()) : null;
  const bloodGroup = patient?.bloodGroup || twin?.bloodGroup;
  const risk = twin?.riskScore;
  const riskBadge = getRiskBadge(risk);

  const summaryStats = [
    { title: 'Age', value: age ? `${age} yrs` : '—', icon: RiCalendarLine, color: 'blue' },
    { title: 'Risk', value: risk != null ? `${risk}` : '—', icon: RiShieldCheckLine, color: risk != null ? (risk < 50 ? 'green' : risk < 75 ? 'amber' : 'red') : 'gray' },
    { title: 'Health Score', value: twin?.healthScore ?? '—', icon: RiHeartPulseLine, color: 'teal' },
    { title: 'Latest Vitals', value: latestVitals ? `${latestVitals.heartRate ?? '—'} bpm` : '—', icon: RiStethoscopeLine, color: 'purple' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div>
          <h1 className="page-title">Patient Details</h1>
          <p className="page-subtitle">Live patient profile and care data from backend services</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate('/patients')} className="btn-outline btn-sm flex items-center gap-2">
            <RiArrowLeftLine className="w-4 h-4" /> Back to Registry
          </button>
          <button onClick={() => navigate(`/patient360?patientId=${encodeURIComponent(patientId)}`)} className="btn-primary btn-sm flex items-center gap-2">
            <RiHeartPulseLine className="w-4 h-4" /> Open 360
          </button>
          <button onClick={loadPatientDetails} disabled={loading} className="btn-ghost btn-sm flex items-center gap-2">
            <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading patient details from backend…</p>
        </div>
      ) : error ? (
        <div className="card py-16 text-center">
          <RiAlertLine className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-300">Unable to load patient details</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.95fr] gap-5">
            <div className="space-y-5">
              <div className="card-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <RiUserLine className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{patient?.firstName} {patient?.lastName}</h2>
                      <p className="text-sm text-gray-400">{patient?.patientId || patient?.id} • {patient?.gender || '—'} • {bloodGroup || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${riskBadge.cls} text-[10px] uppercase font-semibold`}>{riskBadge.label}</span>
                    <span className="badge-blue text-[10px]">{patient?.status || 'Active'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <InfoRow label="Date of Birth" value={patient?.dob || patient?.birthDate} />
                    <InfoRow label="Phone" value={patient?.phone || patient?.contactNumber} />
                    <InfoRow label="Email" value={patient?.email} />
                    <InfoRow label="Address" value={patient?.address} />
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Insurance" value={patient?.insuranceProvider || patient?.insuranceProv || '—'} />
                    <InfoRow label="Insurance ID" value={patient?.insuranceId || '—'} />
                    <InfoRow label="Emergency" value={patient?.emergencyContact?.name ? `${patient.emergencyContact.name} (${patient.emergencyContact.relationship})` : '—'} />
                    <InfoRow label="Emergency Phone" value={patient?.emergencyContact?.phone || '—'} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summaryStats.map((item) => (
                  <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} color={item.color} loading={false} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="card-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Health Twin Snapshot</p>
                  {twin ? (
                    <div className="space-y-3">
                      <InfoRow label="Health Score" value={twin.healthScore ?? '—'} />
                      <InfoRow label="Risk Score" value={twin.riskScore ?? '—'} />
                      <InfoRow label="BMI" value={twin.bmi ?? '—'} />
                      <InfoRow label="Height" value={twin.height ? `${twin.height} cm` : '—'} />
                      <InfoRow label="Weight" value={twin.weight ? `${twin.weight} kg` : '—'} />
                      <InfoRow label="Conditions" value={twin.chronicDiseases?.join(', ') || '—'} />
                      <InfoRow label="Medications" value={twin.currentMedications?.join(', ') || '—'} />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-400">No health twin record available for this patient.</div>
                  )}
                </div>

                <div className="card-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Consent Snapshot</p>
                  {consent ? (
                    <div className="space-y-3">
                      <InfoRow label="Status" value={consent.status} />
                      <InfoRow label="Purpose" value={consent.purpose} />
                      <InfoRow label="Granted" value={consent.grantedOn ? new Date(consent.grantedOn).toLocaleDateString() : '—'} />
                      <InfoRow label="Expires" value={consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : '—'} />
                      <InfoRow label="Revoked" value={consent.revoked ? 'Yes' : 'No'} />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-400">No consent record found for this patient.</div>
                  )}
                </div>
              </div>

              <div className="card-lg">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Latest Vitals</p>
                {latestVitals ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Heart Rate" value={latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : null} />
                    <InfoRow label="Blood Pressure" value={latestVitals.bpSystolic ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic} mmHg` : null} />
                    <InfoRow label="SpO₂" value={latestVitals.spo2 ? `${latestVitals.spo2}%` : null} />
                    <InfoRow label="Temperature" value={latestVitals.temperature ? `${latestVitals.temperature} °F` : null} />
                    <InfoRow label="Steps" value={latestVitals.steps ? `${latestVitals.steps}` : null} />
                    <InfoRow label="Sleep" value={latestVitals.sleepHours ? `${latestVitals.sleepHours} hrs` : null} />
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400">No latest vitals available for this patient.</div>
                )}
              </div>

              <div className="card-lg">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">FHIR Resource Preview</p>
                {fhirResources.length > 0 ? (
                  <div className="code-viewer h-64 overflow-auto custom-scroll rounded-2xl bg-[#0B1221] p-4 border border-[#1F2937]">
                    <pre className="text-[11px] leading-5 text-gray-300">{JSON.stringify(fhirResources, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400">No FHIR records were returned for this patient.</div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-lg">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Clinical Insights</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 rounded-2xl p-4">
                    <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-2">BMI</p>
                    <p className="text-3xl font-black text-white">{twin?.bmi ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-2">Body mass index from twin record</p>
                  </div>
                  <div className="bg-surface-2 rounded-2xl p-4">
                    <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-2">Risk Category</p>
                    <p className="text-3xl font-black text-white">{riskBadge.label}</p>
                    <p className="text-xs text-gray-400 mt-2">Based on latest twin risk score</p>
                  </div>
                </div>
              </div>

              <div className="card-lg">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Lab Results</p>
                {labResults && Object.keys(labResults).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(labResults).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm text-gray-200">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>{value ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400">No laboratory results available for this patient.</div>
                )}
              </div>

              <div className="card-lg">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Vitals Trend</p>
                {latestVitals ? (
                  <VitalsTrendChart data={[latestVitals]} keys={['heartRate', 'bpSystolic', 'bpDiastolic', 'temperature', 'spo2']} />
                ) : (
                  <div className="py-10 text-center text-gray-400">Waiting for vitals history from backend.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDetails;
