import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiHospitalLine, RiSearchLine, RiFilterLine, RiArrowDownSLine, RiAlertLine } from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { labService } from '../../services/labService';
import { consentService } from '../../services/consentService';
import { predictionService } from '../../services/predictionService';
import { useNotification } from '../../context/NotificationContext';
import { PatientQueueItem } from '../../components/doctorWorkspace/PatientQueueItem';
import { PatientStatusBadge } from '../../components/doctorWorkspace/PatientStatusBadge';
import { QuickActionsPanel } from '../../components/doctorWorkspace/QuickActionsPanel';
import { PatientOverviewCard } from '../../components/doctorWorkspace/PatientOverviewCard';
import { VitalsSnapshot } from '../../components/doctorWorkspace/VitalsSnapshot';
import { ConsentSummaryCard } from '../../components/doctorWorkspace/ConsentSummaryCard';
import { LabSummaryCard } from '../../components/doctorWorkspace/LabSummaryCard';
import { DoctorNotesCard } from '../../components/doctorWorkspace/DoctorNotesCard';
import { Spinner } from '../../components/common/Spinner';

const getRiskLabel = (score) => {
  if (score == null) return 'Unknown';
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
};

const deriveStatus = (patient) => {
  if ((patient.consent?.status || '').toUpperCase() !== 'ACTIVE') return 'Pending Consent';
  if ((patient.healthScore ?? patient.riskScore) != null && (patient.healthScore ?? patient.riskScore) >= 75) return 'Critical';
  if (patient.latestVitals && (patient.latestVitals.heartRate < 60 || patient.latestVitals.heartRate > 100 || patient.latestVitals.spo2 < 95)) return 'Observation';
  return 'Stable';
};

export const DoctorWorkspace = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [patients, setPatients] = useState([]);
  const [patientDetails, setPatientDetails] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('risk');
  const [riskFilter, setRiskFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientRes = await patientService.getAllPatients();
      const patientList = patientRes.data || [];
      setPatients(patientList);

      const enriched = [];
      for (const patient of patientList) {
        const pid = patient.patientId || patient.id;
        const [twinRes, vitalsRes, consentRes, labRes, predictionRes] = await Promise.allSettled([
          twinService.getTwin(pid),
          vitalsService.getLatestVitals(pid),
          consentService.getConsent(pid),
          labService.getLabs(pid),
          predictionService.createPrediction(pid),
        ]);

        enriched.push({
          ...patient,
          healthScore: twinRes.status === 'fulfilled' ? twinRes.value.data?.healthScore ?? twinRes.value.data?.riskScore ?? null : null,
          latestVitals: vitalsRes.status === 'fulfilled' ? vitalsRes.value.data || null : null,
          consent: consentRes.status === 'fulfilled' ? consentRes.value.data || null : null,
          labs: labRes.status === 'fulfilled' ? labRes.value.data || null : null,
          prediction: predictionRes.status === 'fulfilled' ? predictionRes.value.data || null : null,
        });
      }

      setPatientDetails(enriched);
      if (enriched.length) {
        setSelectedPatient(enriched[0]);
      }
    } catch (err) {
      setError('Unable to load the doctor workspace from the current backend.');
      notify.error('Workspace unavailable', err.message || 'Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = patientDetails.filter((patient) => {
      const searchText = `${patient.firstName || ''} ${patient.lastName || ''} ${patient.patientId || patient.id || ''}`.toLowerCase();
      const matchesSearch = !term || searchText.includes(term);
      const risk = getRiskLabel(patient.healthScore ?? patient.riskScore).toLowerCase();
      const matchesRisk = !riskFilter || risk === riskFilter.toLowerCase();
      const matchesGender = !genderFilter || (patient.gender || '').toLowerCase() === genderFilter.toLowerCase();
      const matchesBloodGroup = !bloodGroupFilter || (patient.bloodGroup || '').toLowerCase() === bloodGroupFilter.toLowerCase();
      return matchesSearch && matchesRisk && matchesGender && matchesBloodGroup;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'risk') return (b.healthScore ?? b.riskScore ?? 0) - (a.healthScore ?? a.riskScore ?? 0);
      if (sortBy === 'age') return (new Date(a.birthDate || 0) - new Date(b.birthDate || 0));
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [patientDetails, search, sortBy, riskFilter, genderFilter, bloodGroupFilter]);

  const selectedPatientDetail = useMemo(() => filteredPatients.find((patient) => patient.patientId === selectedPatient?.patientId || patient.id === selectedPatient?.id) || selectedPatient || null, [filteredPatients, selectedPatient]);

  const patientCount = useMemo(() => filteredPatients.length, [filteredPatients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><RiHospitalLine className="h-6 w-6 text-blue-400" /> Doctor Workspace</h1>
          <p className="page-subtitle">A clinician-focused queue for triage, review, and rapid module navigation.</p>
        </div>
        <button className="btn-outline btn-sm flex items-center gap-2" onClick={loadWorkspace}>
          <RiAlertLine className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <RiAlertLine className="mt-1 h-5 w-5 text-amber-300" />
            <div>
              <p className="font-semibold text-white">Workspace unavailable</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-lg flex items-center justify-center gap-3 py-12 text-gray-400">
          <Spinner size="sm" />
          <span>Loading doctor workspace…</span>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_1.5fr_0.8fr]">
          <div className="card-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Patient Queue</p>
                <p className="mt-1 text-sm text-gray-400">{patientCount} patients available</p>
              </div>
              <button className="rounded-xl border border-[#1F2937] bg-[#0B1221] p-2 text-gray-400" aria-label="Filter queue">
                <RiFilterLine className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1F2937] bg-[#0B1221] px-3 py-2">
              <RiSearchLine className="h-4 w-4 text-gray-500" />
              <input aria-label="Search patients" className="w-full bg-transparent text-sm text-white outline-none" placeholder="Search patient" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="form-label">Sort</span>
                <div className="relative">
                  <select aria-label="Sort patients" className="form-select pr-8" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="risk">Risk</option>
                    <option value="name">Name</option>
                    <option value="age">Age</option>
                  </select>
                  <RiArrowDownSLine className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </label>
              <label className="block">
                <span className="form-label">Risk</span>
                <select aria-label="Filter by risk" className="form-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="block">
                <span className="form-label">Gender</span>
                <select aria-label="Filter by gender" className="form-select" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <option value="">All</option>
                  {Array.from(new Set(patientDetails.map((p) => p.gender).filter(Boolean))).map((gender) => <option key={gender} value={gender}>{gender}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="form-label">Blood Group</span>
                <select aria-label="Filter by blood group" className="form-select" value={bloodGroupFilter} onChange={(e) => setBloodGroupFilter(e.target.value)}>
                  <option value="">All</option>
                  {Array.from(new Set(patientDetails.map((p) => p.bloodGroup).filter(Boolean))).map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '640px' }}>
              {filteredPatients.length ? filteredPatients.map((patient) => (
                <PatientQueueItem key={patient.patientId || patient.id} patient={patient} selected={selectedPatientDetail?.patientId === patient.patientId || selectedPatientDetail?.id === patient.id} onSelect={setSelectedPatient} />
              )) : (
                <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">No patients matched the current filters.</div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {selectedPatientDetail ? (
              <>
                <div className="card-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Patient Overview</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{selectedPatientDetail.firstName || ''} {selectedPatientDetail.lastName || ''}</h2>
                      <p className="mt-2 text-sm text-gray-400">{selectedPatientDetail.patientId || selectedPatientDetail.id} · {selectedPatientDetail.gender || '—'} · {selectedPatientDetail.bloodGroup || '—'}</p>
                    </div>
                    <PatientStatusBadge status={deriveStatus(selectedPatientDetail)} />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <PatientOverviewCard title="Basic Information">
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Age</span>
                        <span className="font-medium text-white">{selectedPatientDetail.birthDate ? `${new Date().getFullYear() - new Date(selectedPatientDetail.birthDate).getFullYear()} yrs` : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Contact</span>
                        <span className="font-medium text-white">{selectedPatientDetail.contactNumber || selectedPatientDetail.phone || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Address</span>
                        <span className="font-medium text-white">{selectedPatientDetail.address || '—'}</span>
                      </div>
                    </PatientOverviewCard>

                    <PatientOverviewCard title="Health Twin">
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Health Score</span>
                        <span className="font-medium text-white">{selectedPatientDetail.healthScore ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Chronic Conditions</span>
                        <span className="font-medium text-white">{selectedPatientDetail.chronicConditions || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Allergies</span>
                        <span className="font-medium text-white">{selectedPatientDetail.allergies || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                        <span>Medications</span>
                        <span className="font-medium text-white">{selectedPatientDetail.medications || '—'}</span>
                      </div>
                    </PatientOverviewCard>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <PatientOverviewCard title="Latest Vitals">
                    <VitalsSnapshot vitals={selectedPatientDetail.latestVitals} />
                  </PatientOverviewCard>
                  <PatientOverviewCard title="AI Prediction Summary">
                    {selectedPatientDetail.prediction ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                          <span className="text-gray-500">Prediction</span>
                          <p className="mt-1 font-medium text-white">{selectedPatientDetail.prediction.heartDiseasePrediction || selectedPatientDetail.prediction.diabetesPrediction || 'Prediction received'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                          <span className="text-gray-500">Confidence</span>
                          <p className="mt-1 font-medium text-white">{selectedPatientDetail.prediction.heartDiseaseConfidence ?? selectedPatientDetail.prediction.diabetesConfidence ?? '—'}</p>
                        </div>
                        {selectedPatientDetail.prediction.recommendation && (
                          <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] px-4 py-3 text-sm text-gray-300">
                            <span className="text-gray-500">Recommendation</span>
                            <p className="mt-1 font-medium text-white">{selectedPatientDetail.prediction.recommendation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">Prediction summary is not available from the current backend.</div>
                    )}
                  </PatientOverviewCard>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <PatientOverviewCard title="Consent Summary">
                    <ConsentSummaryCard consent={selectedPatientDetail.consent} />
                  </PatientOverviewCard>
                  <PatientOverviewCard title="Lab Summary">
                    <LabSummaryCard labs={selectedPatientDetail.labs} />
                  </PatientOverviewCard>
                </div>

                <DoctorNotesCard notes={null} />
              </>
            ) : (
              <div className="card-lg py-12 text-center text-gray-400">Select a patient to view the workspace overview.</div>
            )}
          </div>

          <div className="space-y-5">
            <div className="card-lg">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Quick Actions</p>
              <div className="mt-4">
                <QuickActionsPanel patientId={selectedPatientDetail?.patientId || selectedPatientDetail?.id} />
              </div>
            </div>
            <div className="card-lg">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Workspace Notes</p>
              <p className="mt-4 text-sm text-gray-400">Use the navigation shortcuts to move into Patient360, Clinical Insights, Predictions, Vitals, or Operations without leaving the workspace.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspace;
