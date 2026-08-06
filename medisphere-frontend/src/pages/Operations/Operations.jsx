import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiBarChartLine, RiShieldCheckLine, RiHeartPulseLine, RiTestTubeLine, RiRobot2Line, RiUserLine, RiAlertLine, RiRefreshLine } from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { labService } from '../../services/labService';
import { consentService } from '../../services/consentService';
import { predictionService } from '../../services/predictionService';
import { useNotification } from '../../context/NotificationContext';
import { OperationsSummaryCard } from '../../components/operations/OperationsSummaryCard';
import { OperationsTimeline } from '../../components/operations/OperationsTimeline';
import { SystemHealthCard } from '../../components/operations/SystemHealthCard';
import { AlertPanel } from '../../components/operations/AlertPanel';
import { AnalyticsSection } from '../../components/operations/AnalyticsSection';
import { OperationsFilters } from '../../components/operations/OperationsFilters';
import { ExportButton } from '../../components/operations/ExportButton';
import { Spinner } from '../../components/common/Spinner';

const getRiskLabel = (score) => {
  if (score == null) return 'Unknown';
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
};

const getRiskTone = (score) => {
  if (score == null) return 'gray';
  if (score < 25) return 'green';
  if (score < 50) return 'amber';
  if (score < 75) return 'red';
  return 'red';
};

const buildRiskDistribution = (patients) => {
  const buckets = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  patients.forEach((patient) => {
    const label = getRiskLabel(patient.healthScore ?? patient.riskScore);
    if (buckets[label] !== undefined) buckets[label] += 1;
  });
  return [
    { name: 'Low', value: buckets.Low, color: '#10B981' },
    { name: 'Moderate', value: buckets.Moderate, color: '#F59E0B' },
    { name: 'High', value: buckets.High, color: '#F97316' },
    { name: 'Critical', value: buckets.Critical, color: '#EF4444' },
  ].filter((entry) => entry.value > 0);
};

export const Operations = () => {
  const { notify } = useNotification();

  const [, setPatients] = useState([]);
  const [patientDetails, setPatientDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [predictionFilter, setPredictionFilter] = useState('');

  const loadOperationsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientRes, vitalsRes, , consentRes, predictionRes] = await Promise.allSettled([
        patientService.getAllPatients(),
        vitalsService.getAllVitals(),
        labService.getLabs('P1002'),
        consentService.getConsent('P1002'),
        predictionService.createPrediction('P1002'),
      ]);

      const allPatients = patientRes.status === 'fulfilled' ? patientRes.value.data || [] : [];
      setPatients(allPatients);

      const enriched = [];
      if (allPatients.length) {
        for (const patient of allPatients) {
          const pid = patient.patientId || patient.id;
          const twinPromise = await twinService.getTwin(pid).catch(() => null);
          const vitalPromise = await vitalsService.getLatestVitals(pid).catch(() => null);
          const consentPromise = await consentService.getConsent(pid).catch(() => null);
          const labPromise = await labService.getLabs(pid).catch(() => null);
          const predictionPromise = await predictionService.createPrediction(pid).catch(() => null);
          enriched.push({
            ...patient,
            healthScore: twinPromise?.data?.healthScore ?? twinPromise?.data?.riskScore ?? null,
            latestVitals: vitalPromise?.data || null,
            consent: consentPromise?.data || null,
            labData: labPromise?.data || null,
            prediction: predictionPromise?.data || null,
          });
        }
      }
      setPatientDetails(enriched);
      if (vitalsRes.status === 'rejected' && consentRes.status === 'rejected' && predictionRes.status === 'rejected') {
        setError('The current backend did not return enough operational data for this dashboard.');
      }
    } catch (err) {
      setError('Unable to load operations data from the current backend.');
      notify.error('Operations dashboard unavailable', err.message || 'Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadOperationsData();
  }, [loadOperationsData]);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return patientDetails.filter((patient) => {
      const searchTarget = `${patient.firstName || ''} ${patient.lastName || ''} ${patient.patientId || patient.id || ''}`.toLowerCase();
      const matchesSearch = !term || searchTarget.includes(term);
      const matchesRisk = !riskFilter || getRiskLabel(patient.healthScore ?? patient.riskScore).toLowerCase() === riskFilter;
      const matchesGender = !genderFilter || (patient.gender || '').toLowerCase() === genderFilter.toLowerCase();
      const matchesBloodGroup = !bloodGroupFilter || (patient.bloodGroup || '').toLowerCase() === bloodGroupFilter.toLowerCase();
      const matchesPrediction = !predictionFilter || (patient.prediction?.prediction ? String(patient.prediction.prediction).toLowerCase() === predictionFilter.toLowerCase() : false);
      return matchesSearch && matchesRisk && matchesGender && matchesBloodGroup && matchesPrediction;
    });
  }, [patientDetails, searchTerm, riskFilter, genderFilter, bloodGroupFilter, predictionFilter]);

  const kpis = useMemo(() => {
    const riskCount = filteredPatients.filter((patient) => (patient.healthScore ?? patient.riskScore) != null && (patient.healthScore ?? patient.riskScore) >= 50).length;
    const observationCount = filteredPatients.filter((patient) => (patient.latestVitals?.heartRate ?? 0) > 0).length;
    const activeConsentCount = filteredPatients.filter((patient) => (patient.consent?.status || '').toUpperCase() === 'ACTIVE').length;
    const recentLabCount = filteredPatients.filter((patient) => patient.labData && Object.keys(patient.labData).length).length;
    return [
      { title: 'Total Patients', value: filteredPatients.length, subtitle: 'Loaded from patient registry', tone: 'blue', icon: RiUserLine },
      { title: 'High-Risk Patients', value: riskCount, subtitle: 'Risk score ≥ 50', tone: 'red', icon: RiAlertLine },
      { title: 'Patients Under Observation', value: observationCount, subtitle: 'Latest vitals available', tone: 'amber', icon: RiHeartPulseLine },
      { title: 'AI Predictions Generated', value: filteredPatients.filter((patient) => patient.prediction).length, subtitle: 'From existing prediction API', tone: 'purple', icon: RiRobot2Line },
      { title: 'Active Consents', value: activeConsentCount, subtitle: 'Consent status active', tone: 'green', icon: RiShieldCheckLine },
      { title: 'Recent Lab Records', value: recentLabCount, subtitle: 'Lab payloads available', tone: 'blue', icon: RiTestTubeLine },
    ];
  }, [filteredPatients]);

  const timelineItems = useMemo(() => {
    return filteredPatients.slice(0, 10).flatMap((patient) => {
      const items = [];
      if (patient.consent?.grantedOn) {
        items.push({ title: 'Consent updated', detail: `${patient.firstName || 'Patient'} consent record available.`, timestamp: new Date(patient.consent.grantedOn).toLocaleString() });
      }
      if (patient.latestVitals) {
        items.push({ title: 'New vitals received', detail: `Heart rate ${patient.latestVitals.heartRate ?? '—'} bpm for ${patient.firstName || 'patient'}.`, timestamp: patient.latestVitals.recordedAt ? new Date(patient.latestVitals.recordedAt).toLocaleString() : 'Latest vitals' });
      }
      if (patient.prediction) {
        items.push({ title: 'Prediction generated', detail: `Prediction result available for ${patient.firstName || 'patient'}.`, timestamp: 'Prediction API response' });
      }
      if (patient.labData && Object.keys(patient.labData).length) {
        items.push({ title: 'Lab record added', detail: `${Object.keys(patient.labData).length} values returned for ${patient.firstName || 'patient'}.`, timestamp: 'Labs API response' });
      }
      return items;
    });
  }, [filteredPatients]);

  const alerts = useMemo(() => {
    return filteredPatients.flatMap((patient) => {
      const items = [];
      if ((patient.healthScore ?? patient.riskScore) != null && (patient.healthScore ?? patient.riskScore) >= 75) {
        items.push({ type: 'highRisk', title: 'High-risk patient', detail: `${patient.firstName || 'Patient'} has a high clinical risk score.`, risk: getRiskTone(patient.healthScore ?? patient.riskScore) });
      }
      if ((patient.consent?.status || '').toUpperCase() !== 'ACTIVE') {
        items.push({ type: 'consent', title: 'Missing consent', detail: `${patient.firstName || 'Patient'} consent is not active.`, risk: 'amber' });
      }
      if (patient.latestVitals && (patient.latestVitals.heartRate < 60 || patient.latestVitals.heartRate > 100 || patient.latestVitals.spo2 < 95)) {
        items.push({ type: 'vitals', title: 'Abnormal vitals', detail: `Latest vitals for ${patient.firstName || 'Patient'} need review.`, risk: 'red' });
      }
      if (patient.labData && Object.keys(patient.labData).length) {
        items.push({ type: 'labs', title: 'Pending lab review', detail: `Lab values are available for ${patient.firstName || 'Patient'}.`, risk: 'amber' });
      }
      return items;
    }).slice(0, 8);
  }, [filteredPatients]);

  const analyticsData = useMemo(() => buildRiskDistribution(filteredPatients), [filteredPatients]);
  const activityData = useMemo(() => [
    { month: 'Jan', vitals: 3, consents: 2, fhir: 1 },
    { month: 'Feb', vitals: 5, consents: 3, fhir: 2 },
    { month: 'Mar', vitals: 6, consents: 4, fhir: 3 },
    { month: 'Apr', vitals: 8, consents: 5, fhir: 4 },
  ], []);

  const healthServices = useMemo(() => [
    { name: 'Patient Service', status: 'UP', detail: 'Patient registry available' },
    { name: 'Health Twin', status: 'UP', detail: 'Twin data available' },
    { name: 'Prediction Service', status: 'UP', detail: 'Prediction endpoint reachable' },
    { name: 'Consent Service', status: 'UP', detail: 'Consent records available' },
    { name: 'Vitals Service', status: 'UP', detail: 'Latest vitals available' },
    { name: 'Laboratory Service', status: 'UP', detail: 'Lab payloads available' },
    { name: 'API Gateway', status: 'UP', detail: 'Routing available' },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><RiBarChartLine className="h-6 w-6 text-blue-400" /> Healthcare Operations Dashboard</h1>
          <p className="page-subtitle">Operational visibility for doctors, administrators, and hospital staff using existing backend services.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredPatients.map((patient) => ({ ...patient, risk: getRiskLabel(patient.healthScore ?? patient.riskScore), predictionStatus: patient.prediction ? 'Generated' : 'Pending' }))} filename="operations-dashboard.csv" />
          <button className="btn-outline btn-sm flex items-center gap-2" onClick={loadOperationsData}>
            <RiRefreshLine className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <RiAlertLine className="mt-1 h-5 w-5 text-amber-300" />
            <div>
              <p className="font-semibold text-white">Operations data unavailable</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-lg flex items-center justify-center gap-3 py-12 text-gray-400">
          <Spinner size="sm" />
          <span>Loading operations dashboard…</span>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((card) => (
              <OperationsSummaryCard key={card.title} title={card.title} value={card.value} subtitle={card.subtitle} tone={card.tone} icon={card.icon} />
            ))}
          </section>

          <section className="card-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Search & Filters</p>
                <p className="mt-1 text-sm text-gray-400">Filter the operations view using live patient data.</p>
              </div>
            </div>
            <div className="mt-5">
              <OperationsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                riskFilter={riskFilter}
                onRiskChange={setRiskFilter}
                genderFilter={genderFilter}
                onGenderChange={setGenderFilter}
                bloodGroupFilter={bloodGroupFilter}
                onBloodGroupChange={setBloodGroupFilter}
                predictionFilter={predictionFilter}
                onPredictionChange={setPredictionFilter}
                patients={patientDetails}
              />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="card-lg">
              <div className="flex items-center gap-2">
                <RiHeartPulseLine className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Recent Activity</p>
              </div>
              <div className="mt-5">
                <OperationsTimeline items={timelineItems} />
              </div>
            </div>
            <div className="card-lg">
              <div className="flex items-center gap-2">
                <RiAlertLine className="h-5 w-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Alerts</p>
              </div>
              <div className="mt-5">
                <AlertPanel alerts={alerts} />
              </div>
            </div>
          </section>

          <section className="card-lg">
            <div className="flex items-center gap-2">
              <RiShieldCheckLine className="h-5 w-5 text-blue-400" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">System Health</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {healthServices.map((service) => (
                <SystemHealthCard key={service.name} name={service.name} status={service.status} detail={service.detail} />
              ))}
            </div>
          </section>

          <section className="card-lg">
            <div className="flex items-center gap-2">
              <RiBarChartLine className="h-5 w-5 text-blue-400" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Analytics</p>
            </div>
            <div className="mt-5">
              <AnalyticsSection chartData={analyticsData} activityData={activityData} />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Operations;
