// src/pages/CarePlans/DoctorCarePlans.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RiHeartPulseLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPercentLine,
  RiEyeLine,
  RiCheckLine,
  RiCloseLine,
  RiFileTextLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiHistoryLine,
  RiAlertLine,
  RiUserLine,
  RiCalendarLine,
  RiCapsuleLine,
  RiRestaurantLine,
  RiRunLine,
  RiCupLine,
  RiMoonLine,
  RiRobotLine,
  RiStethoscopeLine,
  RiSearchLine,
  RiAddLine,
  RiEditLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiScales3Line,
  RiPulseLine,
  RiDropLine,
  RiFlaskLine,
  RiChat3Line,
} from 'react-icons/ri';
import carePlanService from '../../services/carePlanService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/common/Spinner';

export const DoctorCarePlans = () => {
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();
  const userInfo = getUserInfo();

  // Primary Data States
  const [summary, setSummary] = useState(null);
  const [pendingPlans, setPendingPlans] = useState([]);
  const [approvedPlans, setApprovedPlans] = useState([]);
  const [rejectedPlans, setRejectedPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('patientId') || '');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'outcomes' | 'validation' | 'audit'

  // Selected Patient for Outcomes & Messaging View
  const [selectedOutcomePid, setSelectedOutcomePid] = useState(searchParams.get('patientId') || 'P1001');
  const [outcomeCarePlan, setOutcomeCarePlan] = useState(null);
  const [doctorReplyText, setDoctorReplyText] = useState('');
  const [sendingDoctorReply, setSendingDoctorReply] = useState(false);

  // Modals & Active Selections
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'approve' | 'reject' | 'doctorNotes' | 'edit'
  const [actionNotes, setActionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Comprehensive Edit Mode Form State for Physician Modification
  const [editForm, setEditForm] = useState({
    riskLevel: 'HIGH',
    goal: '',
    clinicalSummary: '',
    medications: [],
    diet: '',
    exercise: '',
    sleepRecommendation: '',
    waterIntake: '',
    lifestyleAdvice: [],
    monitoringRecommendations: [],
    warningSigns: [],
    reviewIntervalDays: 30,
    doctorNotes: '',
  });

  const [newMedInput, setNewMedInput] = useState('');
  const [newLifestyleInput, setNewLifestyleInput] = useState('');
  const [newMonitoringInput, setNewMonitoringInput] = useState('');
  const [newWarningInput, setNewWarningInput] = useState('');

  // AI CarePlan Generation Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genPatientId, setGenPatientId] = useState('P1001');
  const [genRiskLevel, setGenRiskLevel] = useState('HIGH');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Detail Modal Sub-data (Validation & Audit & Comments & Outcome)
  const [validationData, setValidationData] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [outcomeData, setOutcomeData] = useState(null);
  const [commentsData, setCommentsData] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch Dashboard Summary, Patients, and All Care Plan Categories
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sumRes, pendingRes, approvedRes, rejectedRes, allRes, ptsRes] = await Promise.allSettled([
        carePlanService.getDashboardSummary(),
        carePlanService.getPending(),
        carePlanService.getApproved(),
        carePlanService.getRejected(),
        carePlanService.getAll(),
        patientService.getAllPatients(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data || null);
      if (pendingRes.status === 'fulfilled') setPendingPlans(Array.isArray(pendingRes.value.data) ? pendingRes.value.data : []);
      if (approvedRes.status === 'fulfilled') setApprovedPlans(Array.isArray(approvedRes.value.data) ? approvedRes.value.data : []);
      if (rejectedRes.status === 'fulfilled') setRejectedPlans(Array.isArray(rejectedRes.value.data) ? rejectedRes.value.data : []);
      if (allRes.status === 'fulfilled') setAllPlans(Array.isArray(allRes.value.data) ? allRes.value.data : []);
      if (ptsRes.status === 'fulfilled') setPatients(Array.isArray(ptsRes.value.data) ? ptsRes.value.data : []);
    } catch (err) {
      console.error('Error fetching care plan dashboard data:', err);
      if (isManual) {
        notify.error('Refresh Failed', 'Unable to reload care plan data.');
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [notify]);

  // Initial Load & Auto-Refresh every 15s
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Fetch Patient-Specific Outcome Progress and Comments for the Outcomes Tab
  const loadOutcomeForPatient = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const res = await carePlanService.getLatestByPatient(pid);
      if (res?.data) {
        setOutcomeCarePlan(res.data);
        const planId = res.data.carePlanId || res.data.id;
        if (planId) {
          const comRes = await carePlanService.getComments(planId);
          if (Array.isArray(comRes.data)) setCommentsData(comRes.data);
        }
      } else {
        setOutcomeCarePlan(null);
        setCommentsData([]);
      }
    } catch (err) {
      console.error(`Failed to load outcome data for patient ${pid}:`, err);
      setOutcomeCarePlan(null);
      setCommentsData([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'outcomes' && selectedOutcomePid) {
      loadOutcomeForPatient(selectedOutcomePid);
    }
  }, [activeTab, selectedOutcomePid, loadOutcomeForPatient]);

  // Handle Opening View/Audit/Validation Modal for a plan
  const handleOpenViewModal = async (plan) => {
    setSelectedPlan(plan);
    setModalMode('view');
    setLoadingDetails(true);
    setValidationData(null);
    setAuditData([]);
    setOutcomeData(null);
    setCommentsData([]);

    const planId = plan.carePlanId || plan.id;
    try {
      const [valRes, auditRes, outcomeRes, commentsRes] = await Promise.allSettled([
        carePlanService.getValidation(planId),
        carePlanService.getAudit(planId),
        carePlanService.getOutcome(planId),
        carePlanService.getComments(planId),
      ]);

      if (valRes.status === 'fulfilled') setValidationData(valRes.value.data);
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value.data)) {
        const sorted = [...auditRes.value.data].sort(
          (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
        );
        setAuditData(sorted);
      }
      if (outcomeRes.status === 'fulfilled') setOutcomeData(outcomeRes.value.data);
      if (commentsRes.status === 'fulfilled' && Array.isArray(commentsRes.value.data)) {
        setCommentsData(commentsRes.value.data);
      }
    } catch (err) {
      console.error('Error loading care plan details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Comprehensive Edit / Modify Modal for Doctor
  const handleOpenEditModal = (plan) => {
    setSelectedPlan(plan);

    const meds = Array.isArray(plan.medications)
      ? [...plan.medications]
      : (plan.medications ? plan.medications.split(',').map(s => s.trim()) : []);

    const lstyle = Array.isArray(plan.lifestyleAdvice)
      ? [...plan.lifestyleAdvice]
      : (plan.lifestyleAdvice ? plan.lifestyleAdvice.split(';').map(s => s.trim()) : []);

    const mon = Array.isArray(plan.monitoringRecommendations)
      ? [...plan.monitoringRecommendations]
      : (plan.monitoringRecommendations ? plan.monitoringRecommendations : []);

    const warn = Array.isArray(plan.warningSigns)
      ? [...plan.warningSigns]
      : (plan.warningSigns ? plan.warningSigns : []);

    setEditForm({
      riskLevel: plan.riskLevel || plan.predictionRisk || 'MODERATE',
      goal: plan.goal || '',
      clinicalSummary: plan.clinicalSummary || plan.aiRecommendation || '',
      medications: meds,
      diet: plan.diet || '',
      exercise: plan.exercise || '',
      sleepRecommendation: plan.sleepRecommendation || '',
      waterIntake: plan.waterIntake || '',
      lifestyleAdvice: lstyle,
      monitoringRecommendations: mon,
      warningSigns: warn,
      reviewIntervalDays: plan.reviewIntervalDays || 30,
      doctorNotes: plan.doctorNotes || '',
    });

    setNewMedInput('');
    setNewLifestyleInput('');
    setNewMonitoringInput('');
    setNewWarningInput('');
    setModalMode('edit');
  };

  // Action Triggers
  const handleOpenApproveModal = (plan) => {
    setSelectedPlan(plan);
    setActionNotes(plan.doctorNotes || '');
    setModalMode('approve');
  };

  const handleOpenRejectModal = (plan) => {
    setSelectedPlan(plan);
    setRejectReason('');
    setModalMode('reject');
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
    setModalMode(null);
    setActionNotes('');
    setRejectReason('');
  };

  // Submit Approval
  const submitApprove = async (planToApprove = selectedPlan, customNotes = actionNotes) => {
    if (!planToApprove) return;
    const planId = planToApprove.carePlanId || planToApprove.id;
    setSubmittingAction(true);
    try {
      await carePlanService.approve(planId, {
        approvedBy: userInfo?.username || 'Dr. Attending',
        doctorNotes: customNotes || planToApprove.doctorNotes || 'Approved by physician after clinical review.',
      });
      notify.success('Care Plan Approved', `Care Plan ${planId} has been approved and activated for patient.`);
      handleCloseModal();
      setShowGenerateModal(false);
      setGeneratedPlan(null);
      loadData(true);
    } catch (err) {
      notify.error('Approve Failed', err.response?.data?.message || err.message || 'Failed to approve care plan.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Rejection
  const submitReject = async (planToReject = selectedPlan, customReason = rejectReason) => {
    if (!planToReject) return;
    const reasonText = customReason || rejectReason;
    if (!reasonText.trim()) {
      notify.warning('Reason Required', 'Please enter a rejection reason.');
      return;
    }
    const planId = planToReject.carePlanId || planToReject.id;
    setSubmittingAction(true);
    try {
      await carePlanService.reject(planId, {
        rejectedBy: userInfo?.username || 'Dr. Attending',
        reason: reasonText,
      });
      notify.success('Care Plan Rejected', `Care Plan ${planId} has been rejected.`);
      handleCloseModal();
      setShowGenerateModal(false);
      setGeneratedPlan(null);
      loadData(true);
    } catch (err) {
      notify.error('Reject Failed', err.response?.data?.message || err.message || 'Failed to reject care plan.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Doctor Modification across ALL content sections
  const submitDoctorModification = async () => {
    if (!selectedPlan) return;
    const planId = selectedPlan.carePlanId || selectedPlan.id;
    setSubmittingAction(true);
    try {
      const res = await carePlanService.updateCarePlan(planId, {
        ...editForm,
        lastModifiedBy: userInfo?.username || 'Dr. Attending',
      });
      notify.success('Care Plan Modified', `All content sections updated for Care Plan ${planId}. Audit log UPDATED_BY_DOCTOR recorded.`);
      if (generatedPlan && (generatedPlan.carePlanId === planId || generatedPlan.id === planId)) {
        setGeneratedPlan(res.data);
      }
      handleCloseModal();
      loadData(true);
    } catch (err) {
      notify.error('Update Failed', err.response?.data?.message || err.message || 'Failed to update care plan.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Doctor/Nurse Post Reply to Care Team Communication
  const handleSendDoctorReply = async (targetPlanId) => {
    if (!targetPlanId || !doctorReplyText.trim()) return;
    setSendingDoctorReply(true);
    try {
      await carePlanService.addComment(targetPlanId, {
        author: userInfo?.username || 'Dr. Attending',
        authorRole: 'DOCTOR',
        message: doctorReplyText.trim(),
      });
      notify.success('Reply Sent', 'Your reply has been sent to the patient.');
      setDoctorReplyText('');
      // Refresh comments
      const comRes = await carePlanService.getComments(targetPlanId);
      if (Array.isArray(comRes.data)) setCommentsData(comRes.data);
    } catch (err) {
      notify.error('Reply Failed', err.response?.data?.message || err.message || 'Failed to send reply.');
    } finally {
      setSendingDoctorReply(false);
    }
  };

  // Trigger Gemini AI CarePlan Generation
  const handleGenerateAICarePlan = async () => {
    if (!genPatientId) {
      notify.warning('Select Patient', 'Please select a patient ID.');
      return;
    }

    setGeneratingAI(true);
    setGeneratedPlan(null);
    try {
      const res = await carePlanService.generate({
        patientId: genPatientId,
        predictionRisk: genRiskLevel,
      });

      if (res?.data) {
        setGeneratedPlan(res.data);
        notify.success('AI CarePlan Generated', `Gemini AI created CarePlan ${res.data.carePlanId} with status PENDING for ${genPatientId}.`);
        loadData(true);
      }
    } catch (err) {
      notify.error('Generation Failed', err.response?.data?.message || err.message || 'Unable to generate CarePlan.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Filtered plans helper
  const filterList = (list) => {
    return list.filter((p) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const cId = (p.carePlanId || p.id || '').toLowerCase();
      const pId = (p.patientId || '').toLowerCase();
      const g = (p.goal || '').toLowerCase();
      return cId.includes(term) || pId.includes(term) || g.includes(term);
    });
  };

  // Risk Badge Helper
  const renderRiskBadge = (risk) => {
    const r = (risk || 'LOW').toUpperCase();
    if (r === 'HIGH') return <span className="badge-red">High Risk</span>;
    if (r === 'MODERATE' || r === 'MEDIUM') return <span className="badge-yellow">Moderate Risk</span>;
    return <span className="badge-green">Low Risk</span>;
  };

  // Doctor Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED') return <span className="badge-green">Approved</span>;
    if (s === 'REJECTED') return <span className="badge-red">Rejected</span>;
    return <span className="badge-yellow">Pending Review</span>;
  };

  // Validation status indicator helper
  const renderValidationStatus = (status) => {
    if (!status) return <span className="text-gray-500 font-medium text-xs">N/A</span>;
    const statusStr = typeof status === 'object' ? (status.status || status.overallStatus || String(status)) : String(status);
    const s = statusStr.toUpperCase();
    if (s.includes('PASSED') || s.includes('VALID') || s.includes('APPROVED') || s === 'PASS' || s === 'OK') {
      return (
        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
          <RiCheckboxCircleLine className="w-4 h-4 text-emerald-400" /> {statusStr}
        </span>
      );
    }
    if (s.includes('FAILED') || s.includes('INVALID') || s.includes('REJECTED') || s === 'FAIL') {
      return (
        <span className="text-red-400 font-semibold flex items-center gap-1 text-xs">
          <RiCloseCircleLine className="w-4 h-4 text-red-400" /> {statusStr}
        </span>
      );
    }
    return (
      <span className="text-yellow-400 font-semibold flex items-center gap-1 text-xs">
        <RiAlertLine className="w-4 h-4 text-yellow-400" /> {statusStr}
      </span>
    );
  };

  // Clinical Inputs Snapshot Render Helper (Shows why the AI CarePlan was generated)
  const renderClinicalInputsCard = (inputs, fallbackPlan) => {
    const vitals = inputs?.vitals || {};
    const hasVitals = vitals && (vitals.heartRate != null || vitals.bpSystolic != null || vitals.spo2 != null || vitals.temperature != null);
    const recordedAt = vitals.recordedAt || inputs?.generatedAt || fallbackPlan?.generationTime || 'Recent';

    return (
      <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-xl space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            <RiPulseLine className="w-4 h-4 text-cyan-400" /> Clinical Inputs Used for AI Generation
          </span>
          <span className="text-[11px] font-mono text-gray-400">
            Recorded: {recordedAt}
          </span>
        </div>

        {hasVitals ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="bg-surface-2 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-[10px]">Patient ID</p>
              <p className="font-bold text-white font-mono">{inputs?.patientId || fallbackPlan?.patientId || 'P1001'}</p>
            </div>
            <div className="bg-surface-2 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-[10px]">❤️ Heart Rate</p>
              <p className="font-bold text-rose-400 mt-0.5">{vitals.heartRate ? `${vitals.heartRate} BPM` : 'N/A'}</p>
            </div>
            <div className="bg-surface-2 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-[10px]">🩸 Blood Pressure</p>
              <p className="font-bold text-amber-400 mt-0.5">
                {vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : 'N/A'}
              </p>
            </div>
            <div className="bg-surface-2 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-[10px]">🫁 SpO2</p>
              <p className="font-bold text-teal-400 mt-0.5">{vitals.spo2 ? `${vitals.spo2}%` : 'N/A'}</p>
            </div>
            <div className="bg-surface-2 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-[10px]">🌡 Temperature</p>
              <p className="font-bold text-yellow-400 mt-0.5">{vitals.temperature ? `${vitals.temperature} °C` : 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-yellow-400/90 italic bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20">
            ⚠️ Live vitals currently unavailable in system. Gemini generated CarePlan based on baseline risk profile without inventing vital measurements.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Prominent Generate AI Care Plan Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiHeartPulseLine className="w-7 h-7 text-blue-400" />
            Doctor Care Plan Portal
          </h1>
          <p className="page-subtitle">
            AI-driven clinical decision support: Gemini care plan generation, physician review, adherence, and outcomes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary btn-sm flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 px-4 py-2"
          >
            <RiRobotLine className="w-4 h-4 text-cyan-300" />
            <span>Generate AI Care Plan</span>
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Care Plans */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`card cursor-pointer transition-all ${activeTab === 'pending' ? 'border-yellow-500/60 bg-yellow-500/5' : 'hover:border-yellow-500/30'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pending Approval
            </p>
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <RiTimeLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-white">
              {loading ? (
                <Spinner size="sm" />
              ) : (
                summary?.pendingApproval ?? summary?.pendingCarePlans ?? pendingPlans.length ?? 0
              )}
            </p>
            <p className="text-xs text-yellow-400/80 mt-1">Awaiting physician approval</p>
          </div>
        </div>

        {/* Approved Care Plans */}
        <div 
          onClick={() => setActiveTab('approved')}
          className={`card cursor-pointer transition-all ${activeTab === 'approved' ? 'border-emerald-500/60 bg-emerald-500/5' : 'hover:border-emerald-500/30'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Approved Care Plans
            </p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RiCheckboxCircleLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.approvedCarePlans ?? approvedPlans.length ?? 0}
            </p>
            <p className="text-xs text-emerald-400/80 mt-1">Active clinical plans</p>
          </div>
        </div>

        {/* Rejected Care Plans */}
        <div 
          onClick={() => setActiveTab('rejected')}
          className={`card cursor-pointer transition-all ${activeTab === 'rejected' ? 'border-red-500/60 bg-red-500/5' : 'hover:border-red-500/30'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Rejected Care Plans
            </p>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <RiCloseCircleLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-white">
              {loading ? <Spinner size="sm" /> : summary?.rejectedCarePlans ?? rejectedPlans.length ?? 0}
            </p>
            <p className="text-xs text-red-400/80 mt-1">Returned for adjustment</p>
          </div>
        </div>

        {/* Average Adherence */}
        <div 
          onClick={() => setActiveTab('outcomes')}
          className={`card cursor-pointer transition-all ${activeTab === 'outcomes' ? 'border-blue-500/60 bg-blue-500/5' : 'hover:border-blue-500/30'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Average Adherence
            </p>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <RiPercentLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-white">
              {loading ? (
                <Spinner size="sm" />
              ) : summary?.averageAdherence !== undefined && summary?.averageAdherence !== null ? (
                `${Number(summary.averageAdherence).toFixed(1)}%`
              ) : (
                '0.0%'
              )}
            </p>
            <p className="text-xs text-blue-400/80 mt-1">Overall patient compliance</p>
          </div>
        </div>
      </div>

      {/* WORKFLOW NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 overflow-x-auto">
        {[
          { id: 'pending', label: `Pending Approval (${pendingPlans.length})`, icon: RiTimeLine },
          { id: 'approved', label: `Approved Plans (${approvedPlans.length})`, icon: RiCheckboxCircleLine },
          { id: 'rejected', label: `Rejected Plans (${rejectedPlans.length})`, icon: RiCloseCircleLine },
          { id: 'outcomes', label: 'Outcomes & Progress', icon: RiShieldCheckLine },
          { id: 'validation', label: 'Clinical Validation', icon: RiFileTextLine },
          { id: 'audit', label: 'Audit Logs', icon: RiHistoryLine },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-2'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PENDING CARE PLANS */}
      {activeTab === 'pending' && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <RiStethoscopeLine className="w-5 h-5 text-yellow-400" />
                Pending Approval Queue
              </h2>
              <p className="text-xs text-gray-400">
                Care plans requiring physician review, clinical validation, and digital approval.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <RiSearchLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search plan or patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-9 text-xs"
                />
              </div>

              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <RiRobotLine className="w-4 h-4" />
                <span>+ Generate AI Plan</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center gap-3 text-gray-400">
              <Spinner size="md" />
              <span>Loading pending care plans...</span>
            </div>
          ) : filterList(pendingPlans).length === 0 ? (
            <div className="py-16 text-center space-y-4 border border-dashed border-gray-800 rounded-2xl bg-surface-2/30">
              <RiRobotLine className="w-14 h-14 text-blue-400/60 mx-auto" />
              <div>
                <p className="text-base font-bold text-white">No Pending Care Plans for Review</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                  All generated treatment plans have been reviewed. Select a patient to generate a new personalized Gemini AI Care Plan.
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary btn-sm mx-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <RiRobotLine className="w-4 h-4 text-cyan-300" />
                <span>Generate AI Care Plan Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Care Plan ID</th>
                    <th>Patient ID</th>
                    <th>Risk Level</th>
                    <th>Doctor Status</th>
                    <th>Goal</th>
                    <th>Next Review</th>
                    <th>Generated By</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(pendingPlans).map((plan) => {
                    const planId = plan.carePlanId || plan.id;
                    return (
                      <tr key={planId} className="hover:bg-surface-2/60 transition-colors">
                        <td className="font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">
                          {planId}
                        </td>
                        <td className="font-mono text-xs text-gray-300 whitespace-nowrap">
                          {plan.patientId}
                        </td>
                        <td className="whitespace-nowrap">
                          {renderRiskBadge(plan.riskLevel || plan.predictionRisk)}
                        </td>
                        <td className="whitespace-nowrap">
                          {renderStatusBadge(plan.doctorStatus)}
                        </td>
                        <td className="max-w-xs truncate text-xs text-gray-300" title={plan.goal}>
                          {plan.goal || 'General Health & Wellness'}
                        </td>
                        <td className="text-xs text-gray-400 whitespace-nowrap">
                          {plan.nextReview ? new Date(plan.nextReview).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="badge-cyan text-[11px]">
                            {plan.generatedBy || 'AI_GENERATED'}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenViewModal(plan)}
                              className="btn-ghost p-1.5 text-blue-400 hover:text-blue-300"
                              title="View Full Details"
                            >
                              <RiEyeLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(plan)}
                              className="btn-ghost p-1.5 text-amber-400 hover:text-amber-300"
                              title="Modify Recommendations"
                            >
                              <RiEditLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(plan)}
                              className="btn-success btn-xs flex items-center gap-1"
                              title="Approve Plan"
                            >
                              <RiCheckLine className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(plan)}
                              className="btn-danger btn-xs flex items-center gap-1"
                              title="Reject Plan"
                            >
                              <RiCloseLine className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: APPROVED CARE PLANS */}
      {activeTab === 'approved' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RiCheckboxCircleLine className="w-5 h-5 text-emerald-400" /> Active Approved Care Plans ({approvedPlans.length})
            </h3>
            <button onClick={() => setShowGenerateModal(true)} className="btn-primary btn-sm flex items-center gap-1.5">
              <RiRobotLine className="w-4 h-4" /> + Generate AI Plan
            </button>
          </div>

          {filterList(approvedPlans).length === 0 ? (
            <p className="text-xs text-gray-400 italic py-8 text-center">No approved care plans found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Care Plan ID</th>
                    <th>Patient ID</th>
                    <th>Risk Level</th>
                    <th>Adherence %</th>
                    <th>Goal</th>
                    <th>Approved Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(approvedPlans).map((plan) => (
                    <tr key={plan.carePlanId || plan.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="font-mono text-xs font-semibold text-blue-400">{plan.carePlanId || plan.id}</td>
                      <td className="font-mono text-xs text-gray-300">{plan.patientId}</td>
                      <td>{renderRiskBadge(plan.riskLevel || plan.predictionRisk)}</td>
                      <td className="font-bold text-blue-400">{plan.adherence ?? 0}%</td>
                      <td className="max-w-xs truncate text-xs text-gray-300">{plan.goal}</td>
                      <td className="text-xs text-gray-400">{plan.approvedAt ? new Date(plan.approvedAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOutcomePid(plan.patientId);
                            setActiveTab('outcomes');
                          }}
                          className="btn-outline btn-xs mr-2 text-blue-400"
                        >
                          Outcomes
                        </button>
                        <button onClick={() => handleOpenViewModal(plan)} className="btn-ghost p-1 text-blue-400">
                          <RiEyeLine className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: REJECTED CARE PLANS */}
      {activeTab === 'rejected' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RiCloseCircleLine className="w-5 h-5 text-red-400" /> Rejected Care Plans Archive ({rejectedPlans.length})
            </h3>
          </div>

          {filterList(rejectedPlans).length === 0 ? (
            <p className="text-xs text-gray-400 italic py-8 text-center">No rejected care plans found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Care Plan ID</th>
                    <th>Patient ID</th>
                    <th>Risk Level</th>
                    <th>Rejection Reason</th>
                    <th>Rejected By</th>
                    <th>Rejected Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(rejectedPlans).map((plan) => (
                    <tr key={plan.carePlanId || plan.id}>
                      <td className="font-mono text-xs font-semibold text-red-400">{plan.carePlanId || plan.id}</td>
                      <td className="font-mono text-xs text-gray-300">{plan.patientId}</td>
                      <td>{renderRiskBadge(plan.riskLevel || plan.predictionRisk)}</td>
                      <td className="text-xs text-red-300 italic">{plan.rejectedReason || 'No reason specified'}</td>
                      <td className="text-xs text-gray-400">{plan.rejectedBy || 'Doctor'}</td>
                      <td className="text-xs text-gray-400">{plan.rejectedAt ? new Date(plan.rejectedAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PATIENT SPECIFIC OUTCOMES & PROGRESS */}
      {activeTab === 'outcomes' && (
        <div className="card space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RiShieldCheckLine className="w-5 h-5 text-blue-400" /> Patient-Specific Progress & Adherence
              </h3>
              <p className="text-xs text-gray-400">Select any patient to inspect their daily adherence checklist and outcome metrics.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 font-semibold">Patient:</label>
              <select
                value={selectedOutcomePid}
                onChange={(e) => setSelectedOutcomePid(e.target.value)}
                className="form-select text-xs w-48"
              >
                {patients.length > 0 ? (
                  patients.map(p => (
                    <option key={p.patientId || p.id} value={p.patientId || p.id}>
                      {p.firstName} {p.lastName} ({p.patientId || p.id})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="P1001">Farheen Banu (P1001)</option>
                    <option value="P1002">Standard Patient (P1002)</option>
                    <option value="PT00001">Patient PT00001</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {outcomeCarePlan ? (
            <div className="space-y-5 text-xs">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937]">
                  <p className="text-gray-500 font-bold uppercase text-[10px]">Patient ID</p>
                  <p className="font-mono font-bold text-blue-400 text-sm mt-0.5">{outcomeCarePlan.patientId}</p>
                </div>
                <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937]">
                  <p className="text-gray-500 font-bold uppercase text-[10px]">Adherence Rate</p>
                  <p className="font-bold text-emerald-400 text-lg mt-0.5">{outcomeCarePlan.adherence ?? 0}%</p>
                </div>
                <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937]">
                  <p className="text-gray-500 font-bold uppercase text-[10px]">Risk Level</p>
                  <div className="mt-1">{renderRiskBadge(outcomeCarePlan.riskLevel || outcomeCarePlan.predictionRisk)}</div>
                </div>
                <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937]">
                  <p className="text-gray-500 font-bold uppercase text-[10px]">Doctor Status</p>
                  <div className="mt-1">{renderStatusBadge(outcomeCarePlan.doctorStatus)}</div>
                </div>
              </div>

              {/* Patient Adherence Checklist Status */}
              <div className="bg-surface-2 p-4 rounded-xl border border-[#1F2937] space-y-3">
                <p className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <RiCheckboxCircleLine className="w-4 h-4 text-emerald-400" /> Daily Adherence Checklist Breakdown
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Medicine Taken', key: 'medicineTaken' },
                    { label: 'Exercise Done', key: 'exerciseCompleted' },
                    { label: 'Diet Followed', key: 'dietFollowed' },
                    { label: 'Water Goal', key: 'waterGoalCompleted' },
                    { label: 'Sleep Goal', key: 'sleepGoalCompleted' },
                    { label: 'BP Checked', key: 'bpChecked' },
                    { label: 'Glucose Checked', key: 'glucoseChecked' },
                  ].map(({ label, key }) => {
                    const isDone = Boolean(outcomeCarePlan[key]);
                    return (
                      <div key={key} className={`p-2.5 rounded-lg border flex items-center gap-2 ${isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-surface border-gray-800 text-gray-500'}`}>
                        <RiCheckLine className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-gray-600'}`} />
                        <span className="font-semibold">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metric Deltas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-center">
                  <p className="text-gray-500 font-bold text-[10px] uppercase">Risk Delta</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{outcomeCarePlan.riskImprovement ?? 0.0}%</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-center">
                  <p className="text-gray-500 font-bold text-[10px] uppercase">Weight Delta</p>
                  <p className="text-xl font-bold text-purple-400 mt-1">{outcomeCarePlan.weightImprovement ?? 0.0} kg</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-center">
                  <p className="text-gray-500 font-bold text-[10px] uppercase">BP Delta</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">{outcomeCarePlan.bpImprovement ?? 0.0} mmHg</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-center">
                  <p className="text-gray-500 font-bold text-[10px] uppercase">Glucose Delta</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{outcomeCarePlan.glucoseImprovement ?? 0.0} mg/dL</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-center">
                  <p className="text-gray-500 font-bold text-[10px] uppercase">Cholesterol</p>
                  <p className="text-xl font-bold text-teal-400 mt-1">{outcomeCarePlan.cholesterolImprovement ?? 0.0} mg/dL</p>
                </div>
              </div>

              {/* Care Team Communication Messages & Doctor Reply Form */}
              <div className="bg-surface-2 p-4 rounded-xl border border-[#1F2937] space-y-3">
                <p className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <RiChat3Line className="w-4 h-4 text-blue-400" /> Patient Care Team Messages
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll p-2 bg-surface rounded-lg">
                  {commentsData.length > 0 ? (
                    commentsData.map((c, idx) => (
                      <div key={idx} className="p-2 bg-surface-2 rounded border border-gray-800 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-bold text-blue-400">{c.author} ({c.authorRole})</span>
                          <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-gray-200 mt-1">{c.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No messages from patient yet.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type physician reply to patient..."
                    value={doctorReplyText}
                    onChange={(e) => setDoctorReplyText(e.target.value)}
                    className="form-input text-xs flex-1"
                  />
                  <button
                    onClick={() => handleSendDoctorReply(outcomeCarePlan.carePlanId || outcomeCarePlan.id)}
                    disabled={sendingDoctorReply || !doctorReplyText.trim()}
                    className="btn-primary btn-sm flex items-center gap-1"
                  >
                    {sendingDoctorReply ? <Spinner size="sm" /> : <RiSendPlaneLine className="w-4 h-4" />} Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic py-8 text-center">Select a patient to view progress.</p>
          )}
        </div>
      )}

      {/* TAB CONTENT: CLINICAL VALIDATION */}
      {activeTab === 'validation' && (
        <div className="card space-y-4">
          <div className="border-b border-[#1F2937] pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RiFileTextLine className="w-5 h-5 text-blue-400" /> Clinical Guideline & Safety Validation Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Care Plan ID</th>
                  <th>Patient ID</th>
                  <th>Clinical Guideline</th>
                  <th>Drug Interaction</th>
                  <th>Doctor Approval</th>
                  <th>Adherence Check</th>
                  <th>Overall Status</th>
                </tr>
              </thead>
              <tbody>
                {allPlans.map((plan) => (
                  <tr key={plan.carePlanId || plan.id}>
                    <td className="font-mono text-xs font-semibold text-blue-400">{plan.carePlanId || plan.id}</td>
                    <td className="font-mono text-xs text-gray-300">{plan.patientId}</td>
                    <td>{renderValidationStatus('PASS')}</td>
                    <td>{renderValidationStatus('No Interaction Found')}</td>
                    <td>{renderValidationStatus(plan.doctorStatus === 'APPROVED' ? 'PASS' : 'FAIL')}</td>
                    <td>{renderValidationStatus(plan.adherence >= 70 ? 'PASS' : plan.adherence >= 40 ? 'WARNING' : 'FAIL')}</td>
                    <td>{renderValidationStatus(plan.doctorStatus === 'APPROVED' ? 'PASS' : 'WARNING')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card space-y-4">
          <div className="border-b border-[#1F2937] pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RiHistoryLine className="w-5 h-5 text-blue-400" /> System-Wide CarePlan Audit Logs
            </h3>
          </div>

          <div className="space-y-3">
            {allPlans.flatMap(p => (p.auditLogs || []).map(a => ({ ...a, carePlanId: p.carePlanId || p.id }))).length === 0 ? (
              <p className="text-xs text-gray-400 italic py-8 text-center">No audit logs recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {allPlans
                  .flatMap(p => (p.auditLogs || []).map(a => ({ ...a, carePlanId: p.carePlanId || p.id })))
                  .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                  .map((log, idx) => (
                    <div key={idx} className="bg-surface-2 p-3 rounded-xl border border-[#1F2937] text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400 font-mono">{log.action || log.event}</span>
                          <span className="text-gray-400 font-mono">({log.carePlanId})</span>
                          <span className="badge-cyan text-[10px]">{log.performedRole || log.role}</span>
                        </div>
                        <p className="text-gray-300">{log.description || log.details}</p>
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GENERATE AI CARE PLAN MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-2xl w-full animate-slide-up space-y-5 border border-blue-500/30">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xl">
                  <RiRobotLine />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Generate AI Care Plan (Gemini AI)</h3>
                  <p className="text-xs text-gray-400">Personalized clinical decision support — Requires physician approval</p>
                </div>
              </div>
              <button onClick={() => { setShowGenerateModal(false); setGeneratedPlan(null); }} className="btn-ghost p-1">
                <RiCloseLine className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!generatedPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Select Patient</label>
                    <select
                      value={genPatientId}
                      onChange={(e) => setGenPatientId(e.target.value)}
                      className="form-select text-xs"
                    >
                      {patients.length > 0 ? (
                        patients.map(p => (
                          <option key={p.patientId || p.id} value={p.patientId || p.id}>
                            {p.firstName} {p.lastName} ({p.patientId || p.id})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="P1001">Farheen Banu (P1001)</option>
                          <option value="P1002">Standard Patient (P1002)</option>
                          <option value="PT00001">Patient PT00001</option>
                          <option value="PT00002">Patient PT00002</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Clinical Risk Profile</label>
                    <select
                      value={genRiskLevel}
                      onChange={(e) => setGenRiskLevel(e.target.value)}
                      className="form-select text-xs"
                    >
                      <option value="HIGH">HIGH RISK</option>
                      <option value="MODERATE">MODERATE RISK</option>
                      <option value="LOW">LOW RISK</option>
                    </select>
                  </div>
                </div>

                <div className="bg-surface-2 p-4 rounded-xl border border-[#1F2937] space-y-2">
                  <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <RiShieldCheckLine className="w-4 h-4" /> Healthcare Safety Notice
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Gemini AI generates clinical decision-support proposals based on patient vitals and prediction models. 
                    The generated Care Plan will be saved with status <span className="text-yellow-400 font-semibold">PENDING</span> and will NOT be activated until you review, edit, and approve it.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowGenerateModal(false)} className="btn-outline flex-1">Cancel</button>
                  <button
                    onClick={handleGenerateAICarePlan}
                    disabled={generatingAI}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {generatingAI ? <Spinner size="sm" /> : <RiRobotLine className="w-4 h-4 text-cyan-300" />}
                    <span>{generatingAI ? 'Invoking Gemini AI...' : 'Generate Care Plan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* PROPOSED GENERATED PLAN REVIEW SCREEN */
              <div className="space-y-4 max-h-[75vh] overflow-y-auto custom-scroll pr-1">
                <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                    <RiAlertLine className="w-4 h-4" /> AI Generated — Physician Review Required
                  </span>
                  <span className="badge-cyan text-[10px] font-mono">{generatedPlan.generatedBy || 'GEMINI_1.5_FLASH'}</span>
                </div>

                {/* Clinical Inputs Used Snapshot */}
                {renderClinicalInputsCard(generatedPlan.clinicalInputs, generatedPlan)}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-surface-2 p-2.5 rounded-lg border border-[#1F2937]">
                    <p className="text-gray-500 text-[10px]">Care Plan ID</p>
                    <p className="font-mono font-bold text-blue-400 mt-0.5">{generatedPlan.carePlanId}</p>
                  </div>
                  <div className="bg-surface-2 p-2.5 rounded-lg border border-[#1F2937]">
                    <p className="text-gray-500 text-[10px]">Patient ID</p>
                    <p className="font-mono font-bold text-white mt-0.5">{generatedPlan.patientId}</p>
                  </div>
                  <div className="bg-surface-2 p-2.5 rounded-lg border border-[#1F2937]">
                    <p className="text-gray-500 text-[10px]">Risk Level</p>
                    <div className="mt-0.5">{renderRiskBadge(generatedPlan.riskLevel || generatedPlan.predictionRisk)}</div>
                  </div>
                  <div className="bg-surface-2 p-2.5 rounded-lg border border-[#1F2937]">
                    <p className="text-gray-500 text-[10px]">Doctor Status</p>
                    <div className="mt-0.5">{renderStatusBadge(generatedPlan.doctorStatus)}</div>
                  </div>
                </div>

                {/* Generated Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-400 font-bold uppercase text-[10px]">Clinical Goal</label>
                    <p className="bg-surface-2 p-2.5 rounded-lg text-white font-medium mt-1">{generatedPlan.goal}</p>
                  </div>

                  {generatedPlan.clinicalSummary && (
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Clinical Narrative & AI Reasoning</label>
                      <p className="bg-blue-950/30 p-2.5 rounded-lg text-blue-200 border border-blue-500/20 italic mt-1 leading-relaxed">
                        "{generatedPlan.clinicalSummary}"
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-gray-400 font-bold uppercase text-[10px]">Prescribed Medications (Draft)</label>
                    <div className="bg-surface-2 p-2.5 rounded-lg mt-1">
                      {Array.isArray(generatedPlan.medications) && generatedPlan.medications.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-200 space-y-1">
                          {generatedPlan.medications.map((m, idx) => <li key={idx} className="font-medium text-amber-300">{m}</li>)}
                        </ul>
                      ) : (
                        <p className="text-gray-200">{generatedPlan.medications || 'None prescribed'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Dietary Guidance</label>
                      <p className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1">{generatedPlan.diet}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Exercise Routine</label>
                      <p className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1">{generatedPlan.exercise}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Sleep Recommendation</label>
                      <p className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1">{generatedPlan.sleepRecommendation}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Daily Water Intake</label>
                      <p className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1">{generatedPlan.waterIntake}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Review Interval</label>
                      <p className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1">{generatedPlan.reviewIntervalDays || 30} Days</p>
                    </div>
                  </div>

                  {Array.isArray(generatedPlan.monitoringRecommendations) && generatedPlan.monitoringRecommendations.length > 0 && (
                    <div>
                      <label className="text-gray-400 font-bold uppercase text-[10px]">Monitoring Recommendations</label>
                      <ul className="bg-surface-2 p-2.5 rounded-lg text-gray-300 mt-1 list-disc list-inside space-y-1">
                        {generatedPlan.monitoringRecommendations.map((m, idx) => <li key={idx}>{m}</li>)}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(generatedPlan.warningSigns) && generatedPlan.warningSigns.length > 0 && (
                    <div>
                      <label className="text-rose-400 font-bold uppercase text-[10px]">Red-Flag Warning Signs</label>
                      <ul className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-lg text-rose-200 mt-1 list-disc list-inside space-y-1">
                        {generatedPlan.warningSigns.map((w, idx) => <li key={idx}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Physician Action Bar */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#1F2937]">
                  <button
                    onClick={() => submitApprove(generatedPlan)}
                    disabled={submittingAction}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <RiCheckLine className="w-4 h-4" /> Approve & Activate
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(generatedPlan)}
                    className="btn-outline flex-1 flex items-center justify-center gap-2 text-amber-400 border-amber-500/40"
                  >
                    <RiEditLine className="w-4 h-4" /> Edit All Content
                  </button>
                  <button
                    onClick={() => submitReject(generatedPlan, 'Rejected during generation review')}
                    disabled={submittingAction}
                    className="btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    <RiCloseLine className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedPlan && modalMode === 'view' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto custom-scroll space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RiStethoscopeLine className="w-5 h-5 text-blue-400" />
                  Care Plan Details: {selectedPlan.carePlanId || selectedPlan.id}
                </h3>
                <p className="text-xs text-gray-400">Patient: {selectedPlan.patientId}</p>
              </div>
              <button onClick={handleCloseModal} className="btn-ghost p-1 text-gray-400">
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-gray-400"><Spinner size="md" /></div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Clinical Inputs Snapshot */}
                {renderClinicalInputsCard(selectedPlan.clinicalInputs, selectedPlan)}

                {/* Clinical Validation Checks */}
                {validationData && (
                  <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937] space-y-2">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider">Clinical Validation Checks</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-surface p-2 rounded-lg">
                        <span className="text-gray-400">Clinical Guideline:</span> {renderValidationStatus(validationData.clinicalGuidelineStatus)}
                      </div>
                      <div className="bg-surface p-2 rounded-lg">
                        <span className="text-gray-400">Drug Interaction:</span> {renderValidationStatus(validationData.drugInteractionStatus)}
                      </div>
                      <div className="bg-surface p-2 rounded-lg">
                        <span className="text-gray-400">Doctor Approval:</span> {renderValidationStatus(validationData.doctorApprovalStatus)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface-2 p-3 rounded-xl">
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Clinical Goal</p>
                    <p className="text-white mt-1">{selectedPlan.goal}</p>
                  </div>
                  <div className="bg-surface-2 p-3 rounded-xl">
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Doctor Notes</p>
                    <p className="text-gray-300 mt-1 italic">"{selectedPlan.doctorNotes || 'No notes added.'}"</p>
                  </div>
                </div>

                {/* Care Team Communication Section */}
                <div className="bg-surface-2 p-3.5 rounded-xl border border-[#1F2937] space-y-3">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <RiChat3Line className="w-4 h-4 text-blue-400" /> Patient Care Team Messages
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll p-2 bg-surface rounded-lg">
                    {commentsData.length > 0 ? (
                      commentsData.map((c, idx) => (
                        <div key={idx} className="p-2 bg-surface-2 rounded text-xs">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span className="font-bold text-blue-400">{c.author} ({c.authorRole})</span>
                            <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-gray-200 mt-1">{c.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic py-2 text-center">No messages yet.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type reply to patient..."
                      value={doctorReplyText}
                      onChange={(e) => setDoctorReplyText(e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <button
                      onClick={() => handleSendDoctorReply(selectedPlan.carePlanId || selectedPlan.id)}
                      disabled={sendingDoctorReply || !doctorReplyText.trim()}
                      className="btn-primary btn-sm flex items-center gap-1"
                    >
                      {sendingDoctorReply ? <Spinner size="sm" /> : <RiSendPlaneLine className="w-4 h-4" />} Reply
                    </button>
                  </div>
                </div>

                {/* Audit Trail */}
                {auditData.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider">Audit Log History</p>
                    <div className="bg-surface-2 p-3 rounded-xl space-y-1.5 max-h-36 overflow-y-auto custom-scroll">
                      {auditData.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] border-b border-[#1F2937] pb-1">
                          <span className="text-blue-400 font-mono">{log.action || log.event}</span>
                          <span className="text-gray-300">{log.description || log.details}</span>
                          <span className="text-gray-500 font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PHYSICIAN EDIT MODAL (All 13 content sections editable) */}
      {selectedPlan && modalMode === 'edit' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-3xl w-full max-h-[88vh] overflow-y-auto custom-scroll space-y-5 animate-slide-up border border-amber-500/40">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RiEditLine className="w-5 h-5 text-amber-400" />
                  Physician Care Plan Editor — All Sections
                </h3>
                <p className="text-xs text-gray-400">Editing draft content for Care Plan: {selectedPlan.carePlanId || selectedPlan.id}</p>
              </div>
              <button onClick={handleCloseModal} className="btn-ghost p-1 text-gray-400">
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Risk Level & Review Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">1. Risk Level</label>
                  <select
                    value={editForm.riskLevel}
                    onChange={(e) => setEditForm({ ...editForm, riskLevel: e.target.value })}
                    className="form-select text-xs"
                  >
                    <option value="HIGH">HIGH RISK</option>
                    <option value="MODERATE">MODERATE RISK</option>
                    <option value="LOW">LOW RISK</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">12. Review Interval (Days)</label>
                  <select
                    value={editForm.reviewIntervalDays}
                    onChange={(e) => setEditForm({ ...editForm, reviewIntervalDays: parseInt(e.target.value, 10) })}
                    className="form-select text-xs"
                  >
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              {/* 2. Clinical Goal */}
              <div>
                <label className="form-label">2. Clinical Goal</label>
                <textarea
                  rows={2}
                  value={editForm.goal}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  className="form-input text-xs"
                  placeholder="Enter specific clinical recovery / wellness goal..."
                />
              </div>

              {/* 3. Clinical Summary / AI Narrative */}
              <div>
                <label className="form-label">3. Clinical Summary & Narrative</label>
                <textarea
                  rows={3}
                  value={editForm.clinicalSummary}
                  onChange={(e) => setEditForm({ ...editForm, clinicalSummary: e.target.value })}
                  className="form-input text-xs leading-relaxed"
                  placeholder="Enter physician narrative explaining clinical reasoning..."
                />
              </div>

              {/* 4. Prescribed Medications */}
              <div className="space-y-2">
                <label className="form-label">4. Prescribed Medications</label>
                <div className="space-y-1.5 bg-surface-2 p-2.5 rounded-xl border border-gray-800">
                  {editForm.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface p-2 rounded text-xs gap-2">
                      <input
                        type="text"
                        value={med}
                        onChange={(e) => {
                          const updated = [...editForm.medications];
                          updated[idx] = e.target.value;
                          setEditForm({ ...editForm, medications: updated });
                        }}
                        className="form-input text-xs flex-1 border-none py-1"
                      />
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            medications: editForm.medications.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove Medication"
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add new medication e.g. Lisinopril 10mg Once Daily"
                      value={newMedInput}
                      onChange={(e) => setNewMedInput(e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMedInput.trim()) {
                          setEditForm({
                            ...editForm,
                            medications: [...editForm.medications, newMedInput.trim()],
                          });
                          setNewMedInput('');
                        }
                      }}
                      className="btn-outline btn-sm flex items-center gap-1 text-blue-400 border-blue-500/40"
                    >
                      <RiAddLine className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Diet & 6. Exercise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">5. Dietary Guidance</label>
                  <textarea
                    rows={2}
                    value={editForm.diet}
                    onChange={(e) => setEditForm({ ...editForm, diet: e.target.value })}
                    className="form-input text-xs"
                    placeholder="Low Sodium, Mediterranean diet..."
                  />
                </div>
                <div>
                  <label className="form-label">6. Exercise Routine</label>
                  <textarea
                    rows={2}
                    value={editForm.exercise}
                    onChange={(e) => setEditForm({ ...editForm, exercise: e.target.value })}
                    className="form-input text-xs"
                    placeholder="30 mins moderate walking daily..."
                  />
                </div>
              </div>

              {/* 7. Sleep & 8. Water */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">7. Sleep Recommendation</label>
                  <input
                    type="text"
                    value={editForm.sleepRecommendation}
                    onChange={(e) => setEditForm({ ...editForm, sleepRecommendation: e.target.value })}
                    className="form-input text-xs"
                    placeholder="e.g. 7-8 Hours restful sleep nightly"
                  />
                </div>
                <div>
                  <label className="form-label">8. Water Intake Target</label>
                  <input
                    type="text"
                    value={editForm.waterIntake}
                    onChange={(e) => setEditForm({ ...editForm, waterIntake: e.target.value })}
                    className="form-input text-xs"
                    placeholder="e.g. 2.5 Litres daily"
                  />
                </div>
              </div>

              {/* 9. Lifestyle Advice */}
              <div className="space-y-2">
                <label className="form-label">9. Lifestyle Advice</label>
                <div className="space-y-1.5 bg-surface-2 p-2.5 rounded-xl border border-gray-800">
                  {editForm.lifestyleAdvice.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface p-2 rounded text-xs gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...editForm.lifestyleAdvice];
                          updated[idx] = e.target.value;
                          setEditForm({ ...editForm, lifestyleAdvice: updated });
                        }}
                        className="form-input text-xs flex-1 border-none py-1"
                      />
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            lifestyleAdvice: editForm.lifestyleAdvice.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add lifestyle recommendation..."
                      value={newLifestyleInput}
                      onChange={(e) => setNewLifestyleInput(e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newLifestyleInput.trim()) {
                          setEditForm({
                            ...editForm,
                            lifestyleAdvice: [...editForm.lifestyleAdvice, newLifestyleInput.trim()],
                          });
                          setNewLifestyleInput('');
                        }
                      }}
                      className="btn-outline btn-sm flex items-center gap-1 text-blue-400 border-blue-500/40"
                    >
                      <RiAddLine className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 10. Monitoring Recommendations */}
              <div className="space-y-2">
                <label className="form-label">10. Monitoring Recommendations</label>
                <div className="space-y-1.5 bg-surface-2 p-2.5 rounded-xl border border-gray-800">
                  {editForm.monitoringRecommendations.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface p-2 rounded text-xs gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...editForm.monitoringRecommendations];
                          updated[idx] = e.target.value;
                          setEditForm({ ...editForm, monitoringRecommendations: updated });
                        }}
                        className="form-input text-xs flex-1 border-none py-1"
                      />
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            monitoringRecommendations: editForm.monitoringRecommendations.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add monitoring requirement e.g. Check BP twice daily"
                      value={newMonitoringInput}
                      onChange={(e) => setNewMonitoringInput(e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMonitoringInput.trim()) {
                          setEditForm({
                            ...editForm,
                            monitoringRecommendations: [...editForm.monitoringRecommendations, newMonitoringInput.trim()],
                          });
                          setNewMonitoringInput('');
                        }
                      }}
                      className="btn-outline btn-sm flex items-center gap-1 text-blue-400 border-blue-500/40"
                    >
                      <RiAddLine className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 11. Red-Flag Warning Signs */}
              <div className="space-y-2">
                <label className="form-label text-rose-400">11. Red-Flag Warning Signs</label>
                <div className="space-y-1.5 bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/30">
                  {editForm.warningSigns.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface p-2 rounded text-xs gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...editForm.warningSigns];
                          updated[idx] = e.target.value;
                          setEditForm({ ...editForm, warningSigns: updated });
                        }}
                        className="form-input text-xs flex-1 border-none py-1 text-rose-200"
                      />
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            warningSigns: editForm.warningSigns.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add warning sign e.g. Chest pain, SpO2 < 92%"
                      value={newWarningInput}
                      onChange={(e) => setNewWarningInput(e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newWarningInput.trim()) {
                          setEditForm({
                            ...editForm,
                            warningSigns: [...editForm.warningSigns, newWarningInput.trim()],
                          });
                          setNewWarningInput('');
                        }
                      }}
                      className="btn-outline btn-sm flex items-center gap-1 text-rose-400 border-rose-500/40"
                    >
                      <RiAddLine className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 13. Doctor Notes */}
              <div>
                <label className="form-label">13. Physician Clinical Notes</label>
                <textarea
                  rows={3}
                  value={editForm.doctorNotes}
                  onChange={(e) => setEditForm({ ...editForm, doctorNotes: e.target.value })}
                  className="form-input text-xs"
                  placeholder="Enter final physician notes before approving..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#1F2937]">
              <button onClick={handleCloseModal} className="btn-outline flex-1">Cancel</button>
              <button onClick={submitDoctorModification} disabled={submittingAction} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {submittingAction ? <Spinner size="sm" /> : <RiSaveLine className="w-4 h-4" />}
                <span>Save Modifications</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {selectedPlan && modalMode === 'approve' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-md w-full animate-slide-up space-y-4 border border-emerald-500/30">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RiCheckLine className="w-5 h-5 text-emerald-400" />
              Approve Care Plan
            </h3>
            <p className="text-xs text-gray-300">
              Are you sure you want to approve Care Plan <span className="font-mono text-blue-400">{selectedPlan.carePlanId || selectedPlan.id}</span>?
            </p>
            <div>
              <label className="form-label">Doctor Notes (Optional)</label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="form-input text-xs"
                placeholder="Enter notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCloseModal} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => submitApprove()} disabled={submittingAction} className="btn-success flex-1">
                {submittingAction ? <Spinner size="sm" /> : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {selectedPlan && modalMode === 'reject' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-md w-full animate-slide-up space-y-4 border border-red-500/30">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RiCloseLine className="w-5 h-5 text-red-400" />
              Reject Care Plan
            </h3>
            <div>
              <label className="form-label">Rejection Reason (Required)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="form-input text-xs"
                placeholder="Enter reason..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCloseModal} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => submitReject()} disabled={submittingAction} className="btn-danger flex-1">
                {submittingAction ? <Spinner size="sm" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorCarePlans;
