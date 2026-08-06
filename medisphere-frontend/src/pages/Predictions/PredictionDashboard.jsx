import { useState, useEffect, useCallback, useMemo } from 'react';
import { RiRobot2Line, RiRefreshLine, RiAlertLine, RiLoader4Line, RiHeartPulseLine } from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { labService } from '../../services/labService';
import { predictionService } from '../../services/predictionService';
import { useNotification } from '../../context/NotificationContext';
import { VitalsTrendChart } from '../../components/charts/VitalsTrendChart';
import { Spinner } from '../../components/common/Spinner';

const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '—';
  return `${(numericValue * 100).toFixed(2)}%`;
};

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return `${value}`;
};

const getFirstValue = (source, keys) => {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
};

const getClinicalLabel = (label, probability) => {
  const normalizedLabel = `${label ?? ''}`.trim().toLowerCase();
  if (normalizedLabel.includes('high')) return 'High Risk';
  if (normalizedLabel.includes('low')) return 'Low Risk';
  if (probability != null) {
    return Number(probability) < 0.5 ? 'Low Risk' : 'High Risk';
  }
  return '—';
};

const getSeverityClass = (label) => {
  const normalizedLabel = `${label ?? ''}`.trim().toLowerCase();
  if (normalizedLabel.includes('high')) return 'border-red-500/30 bg-red-500/10 text-red-200';
  if (normalizedLabel.includes('low')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
};

const RiskDonut = ({ label, value, riskLabel, description, tone = 'low' }) => {
  const numericValue = value == null ? null : Number(value);
  const percent = numericValue != null ? Math.max(0, Math.min(100, numericValue * 100)) : null;
  const strokeColor = tone === 'high' ? '#f87171' : '#34d399';
  const trackColor = tone === 'high' ? 'rgba(248, 113, 113, 0.16)' : 'rgba(52, 211, 153, 0.16)';
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = percent != null ? (circumference * percent) / 100 : 0;
  const remaining = percent != null ? circumference - dash : circumference;
  const displayPercent = percent != null ? `${percent.toFixed(2)}%` : '—';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#08111F] p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">{label}</p>
      <div className="relative mt-4 h-36 w-36 flex-shrink-0">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle cx="70" cy="70" r={radius} stroke={trackColor} strokeWidth="12" fill="none" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${remaining}`}
            strokeDashoffset={circumference * 0.25}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <span className="text-lg font-semibold text-white sm:text-xl">{displayPercent}</span>
          <span className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${tone === 'high' ? 'text-red-200' : 'text-emerald-200'}`}>{riskLabel || '—'}</span>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
};

export const PredictionDashboard = () => {
  const { notify } = useNotification();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [twin, setTwin] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [labs, setLabs] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientService.getAllPatients();
      setPatients(res.data || []);
    } catch (err) {
      setError('Unable to load patients from backend.');
      notify.error('Patient load failed', err.response?.data?.message || err.message || 'Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const loadPatientData = useCallback(async (patientId) => {
    if (!patientId) return;
    setLoadingPatient(true);
    setPrediction(null);
    setPredictionError(null);

    try {
      const [patientRes, twinRes, vitalsRes, vitalsHistoryRes, labRes] = await Promise.allSettled([
        patientService.getPatientById(patientId),
        twinService.getTwin(patientId),
        vitalsService.getLatestVitals(patientId),
        vitalsService.getVitalsByPatient(patientId),
        labService.getLabs(patientId),
      ]);

      if (patientRes.status === 'fulfilled') setPatient(patientRes.value.data || null);
      if (twinRes.status === 'fulfilled') setTwin(twinRes.value.data || null);
      if (vitalsRes.status === 'fulfilled') setVitals(vitalsRes.value.data || null);
      if (vitalsHistoryRes.status === 'fulfilled') setVitalsHistory(vitalsHistoryRes.value.data || []);
      if (labRes.status === 'fulfilled') setLabs(labRes.value.data || null);

      if (patientRes.status === 'rejected') throw patientRes.reason;
    } catch (err) {
      setError('Unable to load selected patient details.');
      notify.error('Patient load failed', err.response?.data?.message || err.message || 'Unable to retrieve patient data.');
    } finally {
      setLoadingPatient(false);
    }
  }, [notify]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    } else {
      setPatient(null);
      setTwin(null);
      setVitals(null);
      setVitalsHistory([]);
      setLabs(null);
      setPrediction(null);
      setPredictionError(null);
    }
  }, [selectedPatientId, loadPatientData]);

  const handlePrediction = async () => {
    if (!selectedPatientId) return;
    setPredicting(true);
    setPredictionError(null);

    try {
      const res = await predictionService.createPrediction(selectedPatientId);
      if (!res?.data) {
        throw new Error('Prediction response was empty.');
      }
      setPrediction(res.data);
    } catch (err) {
      setPredictionError(err.response?.data?.message || err.message || 'Prediction request failed.');
      notify.error('Prediction failed', err.response?.data?.message || err.message || 'Check backend or network.');
    } finally {
      setPredicting(false);
    }
  };

  const patientOptions = useMemo(() => patients.map((p) => ({
    value: p.patientId || p.id,
    label: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed Patient',
  })), [patients]);

  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : '—';
  const patientId = patient?.patientId || patient?.id || '—';
  const ageValue = getFirstValue(patient, ['age', 'patientAge']);
  const bmiValue = getFirstValue(twin, ['bmi', 'bodyMassIndex', 'weightIndex']) || getFirstValue(patient, ['bmi', 'bodyMassIndex']);
  const bloodPressureValue = vitals?.bpSystolic && vitals?.bpDiastolic
    ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`
    : getFirstValue(twin, ['bloodPressure', 'bp']) || getFirstValue(patient, ['bloodPressure', 'bp']);
  const spo2Value = getFirstValue(vitals, ['spo2', 'oxygen']);
  const temperatureValue = getFirstValue(vitals, ['temperature']);
  const healthScoreValue = getFirstValue(twin, ['healthScore', 'score']);

  const healthSnapshot = useMemo(() => [
    { label: 'Patient Name', value: patientName },
    { label: 'Patient ID', value: patientId },
    { label: 'Age', value: ageValue != null ? `${formatDisplayValue(ageValue)} years` : '—' },
    { label: 'BMI', value: bmiValue != null ? formatDisplayValue(bmiValue) : '—' },
    { label: 'Heart Rate', value: vitals?.heartRate != null ? `${formatDisplayValue(vitals.heartRate)} bpm` : '—' },
    { label: 'Blood Pressure', value: bloodPressureValue != null ? formatDisplayValue(bloodPressureValue) : '—' },
    { label: 'SpO₂', value: spo2Value != null ? `${formatDisplayValue(spo2Value)}%` : '—' },
    { label: 'Temperature', value: temperatureValue != null ? `${formatDisplayValue(temperatureValue)} °F` : '—' },
    { label: 'Health Score', value: healthScoreValue != null ? formatDisplayValue(healthScoreValue) : '—' },
    { label: 'Labs', value: labs ? 'Available' : '—' },
  ], [ageValue, bloodPressureValue, bmiValue, healthScoreValue, labs, patientId, patientName, spo2Value, temperatureValue, vitals]);

  const riskFactors = useMemo(() => {
    const factors = [];
    const addFactor = (label, value) => {
      if (value === null || value === undefined || value === '') return;
      factors.push({ label, value: formatDisplayValue(value) });
    };

    addFactor('Age', ageValue != null ? `${ageValue} years` : null);
    addFactor('BMI', bmiValue);
    addFactor('Blood Pressure', bloodPressureValue);
    addFactor('Cholesterol', getFirstValue(labs, ['cholesterol', 'totalCholesterol', 'cholestrol']));
    addFactor('Blood Glucose', getFirstValue(labs, ['bloodGlucose', 'glucose', 'fastingGlucose']));
    addFactor('HbA1c', getFirstValue(labs, ['hba1c', 'HbA1c', 'ha1c']));
    addFactor('Smoking History', getFirstValue(twin, ['smokingHistory', 'smoking', 'smokes']) || getFirstValue(patient, ['smokingHistory', 'smoking', 'smokes']));
    addFactor('Family History', getFirstValue(twin, ['familyHistory', 'familyHistoryPresent']) || getFirstValue(patient, ['familyHistory', 'familyHistoryPresent']));

    return factors;
  }, [ageValue, bmiValue, bloodPressureValue, labs, patient, twin]);

  const chartData = useMemo(() => {
    if (vitalsHistory?.length) {
      return vitalsHistory.slice(-8).map((entry) => ({
        time: entry.recordedAt || entry.timestamp || entry.time || 'Latest',
        heartRate: entry.heartRate ?? null,
        bpSystolic: entry.bpSystolic ?? null,
        bpDiastolic: entry.bpDiastolic ?? null,
        temperature: entry.temperature ?? null,
        spo2: entry.spo2 ?? null,
      }));
    }

    if (vitals) {
      return [{
        time: 'Latest',
        heartRate: vitals.heartRate ?? null,
        bpSystolic: vitals.bpSystolic ?? null,
        bpDiastolic: vitals.bpDiastolic ?? null,
        temperature: vitals.temperature ?? null,
        spo2: vitals.spo2 ?? null,
      }];
    }

    return [];
  }, [vitals, vitalsHistory]);

  const heartDiseaseProbability = prediction?.heartDiseaseProbability != null ? Number(prediction.heartDiseaseProbability) : null;
  const diabetesProbability = prediction?.diabetesProbability != null ? Number(prediction.diabetesProbability) : null;
  const heartDiseaseLabel = getClinicalLabel(prediction?.heartDiseasePrediction, heartDiseaseProbability);
  const diabetesLabel = getClinicalLabel(prediction?.diabetesPrediction, diabetesProbability);
  const heartDiseasePercent = heartDiseaseProbability != null ? Math.max(0, Math.min(100, heartDiseaseProbability * 100)) : null;
  const diabetesPercent = diabetesProbability != null ? Math.max(0, Math.min(100, diabetesProbability * 100)) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><RiRobot2Line className="w-6 h-6 text-blue-400" /> AI Predictions</h1>
          <p className="page-subtitle">AI-assisted disease risk assessment based on patient health data</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[240px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Patient</label>
            <select
              className="form-select w-full"
              aria-label="Select patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">Select a patient</option>
              {patientOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePrediction}
            className="btn-primary btn-md inline-flex items-center justify-center gap-2"
            disabled={!selectedPatientId || predicting || loadingPatient}
          >
            {predicting ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiRobot2Line className="w-4 h-4" />}
            Generate Prediction
          </button>
        </div>
      </div>

      {loading && !selectedPatientId && (
        <div className="card-lg p-6 text-sm text-gray-400">Loading patients from the backend…</div>
      )}

      {error && !loadingPatient && (
        <div className="card border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <RiAlertLine className="w-5 h-5 text-amber-300 mt-1" />
            <div>
              <p className="text-sm font-semibold text-white">Unable to load data</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loadingPatient && (
        <div className="card-lg p-6 flex items-center gap-3 text-sm text-gray-400">
          <Spinner size="sm" />
          <span>Loading patient details and vitals…</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-lg p-6 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Patient Summary</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Patient health snapshot</h2>
            </div>
            <button onClick={fetchPatients} className="btn-outline btn-sm flex items-center gap-2" disabled={loading}>
              <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {healthSnapshot.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-lg p-6 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">AI Risk Overview</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Independent risk visualizations</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <RiskDonut
              label="Heart Disease"
              value={heartDiseaseProbability}
              riskLabel={heartDiseaseLabel}
              description="Estimated Heart Disease Risk"
              tone={heartDiseaseLabel === 'High Risk' ? 'high' : 'low'}
            />
            <RiskDonut
              label="Diabetes"
              value={diabetesProbability}
              riskLabel={diabetesLabel}
              description="Estimated Diabetes Risk"
              tone={diabetesLabel === 'High Risk' ? 'high' : 'low'}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-lg p-6 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Heart Disease Risk</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Clinical risk estimate</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(heartDiseaseLabel)}`}>
              {heartDiseaseLabel}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#08111F] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Estimated Risk</p>
            <p className="mt-3 text-5xl font-semibold text-white">{heartDiseaseProbability != null ? formatPercent(heartDiseaseProbability) : '—'}</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">{heartDiseaseLabel}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="relative mt-3 h-2 rounded-full bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500" style={{ width: heartDiseasePercent != null ? `${heartDiseasePercent}%` : '0%' }} />
                <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500" style={{ left: heartDiseasePercent != null ? `${heartDiseasePercent}%` : '0%' }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Low risk</span>
                <span>High risk</span>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-400">Estimated model risk</p>
          </div>
        </div>

        <div className="card-lg p-6 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Diabetes Risk</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Clinical risk estimate</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(diabetesLabel)}`}>
              {diabetesLabel}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#08111F] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Estimated Risk</p>
            <p className="mt-3 text-5xl font-semibold text-white">{diabetesProbability != null ? formatPercent(diabetesProbability) : '—'}</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">{diabetesLabel}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="relative mt-3 h-2 rounded-full bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500" style={{ width: diabetesPercent != null ? `${diabetesPercent}%` : '0%' }} />
                <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500" style={{ left: diabetesPercent != null ? `${diabetesPercent}%` : '0%' }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Low risk</span>
                <span>High risk</span>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-400">Estimated model risk</p>
          </div>
        </div>
      </div>

      <div className="card-lg p-6 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Patient Risk Factors</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Relevant clinical factors</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {riskFactors.length ? riskFactors.map((factor) => (
            <div key={factor.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3">
              <span className="text-sm text-gray-400">{factor.label}</span>
              <span className="text-sm font-semibold text-white">{factor.value}</span>
            </div>
          )) : (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 bg-[#08111F] p-5 text-sm text-gray-400">
              No additional patient risk-factor values were returned by the current backend response.
            </div>
          )}
        </div>
      </div>

      <div className="card-lg p-6 min-w-0">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#08111F] p-2">
            <RiHeartPulseLine className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Vitals Trend</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Historical vitals trend</h2>
          </div>
        </div>

        {chartData.length ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#08111F] p-4">
            <VitalsTrendChart data={chartData} keys={['heartRate', 'bpSystolic', 'bpDiastolic', 'temperature', 'spo2']} />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#08111F] p-6 text-sm text-gray-400">
            Vitals history is not available for the selected patient yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionDashboard;
