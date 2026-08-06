import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  RiHeartPulseLine,
  RiShieldCheckLine,
  RiStethoscopeLine,
  RiTestTubeLine,
  RiRobot2Line,
  RiAlertLine,
  RiRefreshLine,
  RiSearchLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { labService } from '../../services/labService';
import { consentService } from '../../services/consentService';
import { predictionService } from '../../services/predictionService';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import { ClinicalSummaryCard } from '../../components/clinical/ClinicalSummaryCard';
import { InsightCard } from '../../components/clinical/InsightCard';
import { AlertCard } from '../../components/clinical/AlertCard';
import { ExplainabilityPanel } from '../../components/clinical/ExplainabilityPanel';
import { TimelineCard } from '../../components/clinical/TimelineCard';
import { RecommendationCard } from '../../components/clinical/RecommendationCard';
import { VitalsTrendChart } from '../../components/charts/VitalsTrendChart';
import { Spinner } from '../../components/common/Spinner';

const resolveRisk = (score) => {
  if (score == null) return { label: 'Unknown', tone: 'info', score: '—' };
  if (score < 25) return { label: 'Low', tone: 'success', score };
  if (score < 50) return { label: 'Moderate', tone: 'warning', score };
  if (score < 75) return { label: 'High', tone: 'danger', score };
  return { label: 'Critical', tone: 'danger', score };
};

const normalizeLabs = (labs) => {
  if (!labs || typeof labs !== 'object') return [];
  return Object.entries(labs)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => ({ key, value }))
    .slice(0, 6);
};

export const ClinicalInsights = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [patient, setPatient] = useState(null);
  const [twin, setTwin] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [labs, setLabs] = useState(null);
  const [consent, setConsent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPatientData = useCallback(async (patientId) => {
    if (!patientId) return;

    setLoading(true);
    setError(null);
    setPatient(null);
    setTwin(null);
    setVitals(null);
    setVitalsHistory([]);
    setLabs(null);
    setConsent(null);
    setPrediction(null);
    setExplanation(null);

    try {
      const [patientRes, twinRes, vitalsRes, vitalsHistoryRes, labRes, consentRes] = await Promise.allSettled([
        patientService.getPatientById(patientId),
        twinService.getTwin(patientId),
        vitalsService.getLatestVitals(patientId),
        vitalsService.getVitalsByPatient(patientId),
        labService.getLabs(patientId),
        consentService.getConsent(patientId),
      ]);

      setPatient(patientRes.status === 'fulfilled' ? patientRes.value.data || null : null);
      setTwin(twinRes.status === 'fulfilled' ? twinRes.value.data || null : null);
      setVitals(vitalsRes.status === 'fulfilled' ? vitalsRes.value.data || null : null);
      setVitalsHistory(vitalsHistoryRes.status === 'fulfilled' ? vitalsHistoryRes.value.data || [] : []);
      setLabs(labRes.status === 'fulfilled' ? labRes.value.data || null : null);
      setConsent(consentRes.status === 'fulfilled' ? consentRes.value.data || null : null);

      try {
        const explanationRes = await axios.get(`http://localhost:8080/api/explanation/${patientId}`);
        setExplanation(explanationRes.data || null);
      } catch {
        setExplanation(null);
      }

      if (patientRes.status === 'rejected' && twinRes.status === 'rejected') {
        throw new Error('Unable to load patient data from the backend.');
      }
    } catch (err) {
      setError(err.message || 'Unable to load clinical insights.');
      notify.error('Clinical view unavailable', err.message || 'Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    patientService.getAllPatients()
      .then((res) => setPatients(res.data || []))
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    } else {
      setPatient(null);
      setTwin(null);
      setVitals(null);
      setVitalsHistory([]);
      setLabs(null);
      setConsent(null);
      setPrediction(null);
      setExplanation(null);
    }
  }, [selectedPatientId, loadPatientData]);

  const patientOptions = useMemo(() => patients.map((p) => ({
    value: p.patientId || p.id,
    label: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed Patient',
  })), [patients]);

  const healthScore = twin?.healthScore ?? twin?.riskScore ?? null;
  const riskDetails = useMemo(() => resolveRisk(healthScore), [healthScore]);

  const alerts = useMemo(() => {
    const items = [];
    if (riskDetails.label && riskDetails.label !== 'Low') {
      items.push({
        title: 'High Risk',
        description: `Current health score indicates ${riskDetails.label.toLowerCase()} clinical risk.`,
        tone: riskDetails.tone === 'success' ? 'info' : riskDetails.tone,
      });
    }
    if (vitals?.spo2 != null && vitals.spo2 < 95) {
      items.push({ title: 'Low Oxygen', description: `SpO₂ is ${vitals.spo2}%, which should be reviewed.`, tone: 'warning' });
    }
    if (vitals?.heartRate != null && (vitals.heartRate < 60 || vitals.heartRate > 100)) {
      items.push({ title: 'Abnormal Heart Rate', description: `Latest heart rate is ${vitals.heartRate} bpm.`, tone: 'danger' });
    }
    if (consent?.status && consent.status !== 'ACTIVE') {
      items.push({ title: 'Pending Consent', description: `Consent status is ${consent.status}.`, tone: 'warning' });
    }
    return items;
  }, [consent, riskDetails.label, riskDetails.tone, vitals]);

  const explainabilityItems = useMemo(() => {
    if (!explanation) return [];

    const items = [];
    if (explanation.risk) {
      items.push({ title: 'Risk', value: explanation.risk });
    }
    if (Array.isArray(explanation.factors) && explanation.factors.length) {
      items.push({ title: 'Top Factors', value: explanation.factors.join(' · ') });
    }
    return items;
  }, [explanation]);

  const timelineItems = useMemo(() => {
    if (!vitalsHistory?.length) return [];
    return vitalsHistory.slice(-5).reverse().map((item) => ({
      title: 'Vitals captured',
      detail: `HR ${item.heartRate ?? '—'} · BP ${item.bpSystolic ?? '—'}/${item.bpDiastolic ?? '—'} · SpO₂ ${item.spo2 ?? '—'}%`,
      timestamp: item.recordedAt ? new Date(item.recordedAt).toLocaleString() : 'Unknown time',
    }));
  }, [vitalsHistory]);

  const chartData = useMemo(() => (
    vitalsHistory.map((item) => ({
      time: item.recordedAt ? new Date(item.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
      heartRate: item.heartRate,
      spo2: item.spo2,
      temperature: item.temperature,
      bpSystolic: item.bpSystolic,
      bpDiastolic: item.bpDiastolic,
    }))
  ), [vitalsHistory]);

  const labRows = useMemo(() => normalizeLabs(labs), [labs]);

  const handlePatientSelect = (value) => {
    const nextValue = value.trim();
    setSelectedPatientId(nextValue);
    if (nextValue) {
      navigate(`/clinical-insights?patientId=${encodeURIComponent(nextValue)}`, { replace: true });
    } else {
      navigate('/clinical-insights', { replace: true });
    }
  };

  const handleLoadPrediction = useCallback(async () => {
    if (!selectedPatientId) return;
    setPredictionLoading(true);
    try {
      const res = await predictionService.createPrediction(selectedPatientId);
      setPrediction(res?.data || null);
    } catch (err) {
      notify.error('Prediction unavailable', err.response?.data?.message || err.message || 'The current backend could not return a prediction.');
      setPrediction(null);
    } finally {
      setPredictionLoading(false);
    }
  }, [notify, selectedPatientId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><RiHeartPulseLine className="h-6 w-6 text-blue-400" /> Clinical Insights</h1>
          <p className="page-subtitle">Live clinical summary, explainability context, and risk-aware recommendations from existing backend services.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select className="form-select pl-9" aria-label="Select patient" value={selectedPatientId} onChange={(e) => handlePatientSelect(e.target.value)}>
              <option value="">Select a patient</option>
              {patientOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-outline btn-sm flex items-center gap-2" onClick={() => selectedPatientId && loadPatientData(selectedPatientId)}>
            <RiRefreshLine className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {!selectedPatientId && !loading && (
        <div className="card-lg p-10 text-center text-gray-400">
          <RiStethoscopeLine className="mx-auto h-12 w-12 text-blue-400" />
          <p className="mt-4 text-lg font-semibold text-white">Choose a patient to view their clinical insights.</p>
          <p className="mt-2 text-sm">The page uses existing patient, twin, vitals, labs, consent, and prediction APIs only.</p>
        </div>
      )}

      {loading && (
        <div className="card-lg flex items-center justify-center gap-3 py-12 text-gray-400">
          <Spinner size="sm" />
          <span>Loading clinical insights…</span>
        </div>
      )}

      {error && !loading && (
        <div className="card border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <RiAlertLine className="mt-1 h-5 w-5 text-amber-300" />
            <div>
              <p className="font-semibold text-white">Clinical data unavailable</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && selectedPatientId && patient && (
        <>
          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div className="card-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Patient Clinical Summary</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{patient.firstName} {patient.lastName}</h2>
                    <p className="mt-2 text-sm text-gray-400">ID {patient.patientId || patient.id} · {patient.gender || '—'} · {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge-${riskDetails.tone === 'success' ? 'green' : riskDetails.tone === 'warning' ? 'yellow' : riskDetails.tone === 'danger' ? 'red' : 'blue'}`}>
                      {riskDetails.label} Risk
                    </span>
                    <span className={consent?.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}>
                      Consent {consent?.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ClinicalSummaryCard title="Health Score" value={healthScore ?? '—'} subtitle="Current digital twin score" tone={riskDetails.tone === 'success' ? 'green' : riskDetails.tone === 'warning' ? 'amber' : riskDetails.tone === 'danger' ? 'red' : 'blue'} icon={RiShieldCheckLine} />
                  <ClinicalSummaryCard title="Heart Rate" value={vitals?.heartRate != null ? `${vitals.heartRate} bpm` : '—'} subtitle="Latest vitals" tone="red" icon={RiHeartPulseLine} />
                  <ClinicalSummaryCard title="SpO₂" value={vitals?.spo2 != null ? `${vitals.spo2}%` : '—'} subtitle="Oxygen saturation" tone="blue" icon={RiTestTubeLine} />
                  <ClinicalSummaryCard title="Consent" value={consent?.status || 'Unknown'} subtitle="Current consent state" tone={consent?.status === 'ACTIVE' ? 'green' : 'amber'} icon={RiCheckboxCircleLine} />
                </div>
              </div>

              <div className="card-lg">
                <div className="flex items-center gap-2">
                  <RiRobot2Line className="h-5 w-5 text-blue-400" />
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">AI Prediction Summary</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="btn-outline btn-sm flex items-center gap-2" onClick={handleLoadPrediction} disabled={!selectedPatientId || predictionLoading}>
                    {predictionLoading ? <Spinner size="sm" /> : <RiRobot2Line className="h-4 w-4" />}
                    Load prediction
                  </button>
                </div>
                {prediction ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <InsightCard title="Prediction" value={prediction.heartDiseasePrediction || prediction.diabetesPrediction || 'Prediction received'} badge="Model Output" />
                    <InsightCard title="Risk Score" value={prediction.heartDiseaseProbability != null ? `${prediction.heartDiseaseProbability}` : '—'} badge="Probability" />
                    <InsightCard title="Confidence" value={prediction.heartDiseaseConfidence != null ? `${prediction.heartDiseaseConfidence}` : '—'} badge="Confidence" />
                    <InsightCard title="Priority" value={prediction.heartDiseaseProbability >= 75 ? 'High' : 'Routine'} badge="Clinical Priority" />
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">
                    Prediction data will appear here when the existing prediction API returns a result for the selected patient.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-lg">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Clinical Alerts</p>
                <div className="mt-4 space-y-3">
                  {alerts.length > 0 ? alerts.map((alert) => (
                    <AlertCard key={alert.title} title={alert.title} description={alert.description} tone={alert.tone} />
                  )) : (
                    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">No active alerts were identified from the current backend response.</div>
                  )}
                </div>
              </div>

              <div className="card-lg">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Recommendations</p>
                <div className="mt-4 space-y-3">
                  {prediction?.recommendation ? (
                    <RecommendationCard title="Recommendation" detail={prediction.recommendation} />
                  ) : (
                    <RecommendationCard title="Recommendation unavailable" detail="No recommendation payload was returned by the current backend response." />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="card-lg">
              <div className="flex items-center gap-2">
                <RiAlertLine className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Explainability</p>
              </div>
              <div className="mt-4">
                <ExplainabilityPanel items={explainabilityItems} fallbackMessage="No explainability data available." />
              </div>
            </div>

            <div className="card-lg">
              <div className="flex items-center gap-2">
                <RiTestTubeLine className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Active Lab Results</p>
              </div>
              <div className="mt-4 space-y-3">
                {labRows.length > 0 ? labRows.map((lab) => (
                  <div key={lab.key} className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#08111F] px-4 py-3 text-sm text-gray-300">
                    <span>{lab.key}</span>
                    <span className="font-medium text-white">{lab.value}</span>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">No active lab results were returned by the backend for this patient.</div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="card-lg">
              <div className="flex items-center gap-2">
                <RiTimeLine className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Health Timeline</p>
              </div>
              {timelineItems.length > 0 ? (
                <>
                  <div className="mt-4 rounded-2xl border border-[#1F2937] bg-[#08111F] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Trend Overview</p>
                    <div className="mt-4 h-64">
                      <VitalsTrendChart data={chartData} keys={['heartRate', 'spo2', 'temperature']} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {timelineItems.map((item) => (
                      <TimelineCard key={item.timestamp} title={item.title} detail={item.detail} timestamp={item.timestamp} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">Historical vitals were not returned by the backend, so the timeline section is hidden.</div>
              )}
            </div>

            <div className="card-lg">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Latest Vitals</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ClinicalSummaryCard title="Heart Rate" value={vitals?.heartRate != null ? `${vitals.heartRate} bpm` : '—'} subtitle="Latest measurement" tone="red" />
                <ClinicalSummaryCard title="Blood Pressure" value={vitals?.bpSystolic != null && vitals?.bpDiastolic != null ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '—'} subtitle="Systolic/Diastolic" tone="blue" />
                <ClinicalSummaryCard title="Temperature" value={vitals?.temperature != null ? `${vitals.temperature} °F` : '—'} subtitle="Latest reading" tone="amber" />
                <ClinicalSummaryCard title="SpO₂" value={vitals?.spo2 != null ? `${vitals.spo2}%` : '—'} subtitle="Oxygen saturation" tone="green" />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ClinicalInsights;
