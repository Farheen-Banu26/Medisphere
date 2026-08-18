// src/pages/CarePlans/PatientCarePlan.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RiHeartPulseLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPercentLine,
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
  RiSendPlaneLine,
  RiCheckLine,
  RiScales3Line,
  RiPulseLine,
  RiDropLine,
  RiFlaskLine,
  RiChat3Line,
  RiSaveLine,
} from 'react-icons/ri';
import carePlanService from '../../services/carePlanService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/common/Spinner';

export const PatientCarePlan = () => {
  const [searchParams] = useSearchParams();
  const { notify } = useNotification();
  const userInfo = getUserInfo();

  // Resolved Patient ID state
  const [resolvedPatientId, setResolvedPatientId] = useState('');

  // Core Data States
  const [todayPlan, setTodayPlan] = useState(null);
  const [fullPlan, setFullPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Identity Resolution Effect
  useEffect(() => {
    const resolveIdentity = async () => {
      const paramPid = searchParams.get('patientId');
      if (paramPid) {
        setResolvedPatientId(paramPid);
        return;
      }

      const uInfo = getUserInfo();
      const rawUser = uInfo?.patientId || uInfo?.username || 'me';

      try {
        const pRes = await patientService.getPatientById(rawUser);
        if (pRes?.data?.patientId) {
          setResolvedPatientId(pRes.data.patientId);
          return;
        }
      } catch (err) {
        console.warn('Identity resolution fallback:', err.message);
      }

      if (uInfo?.username === 'patient' || uInfo?.username === 'farheen') {
        setResolvedPatientId('P1001');
      } else {
        setResolvedPatientId(uInfo?.username?.toUpperCase() || 'P1001');
      }
    };

    resolveIdentity();
  }, [searchParams]);

  // Daily Adherence Checkbox States
  const [adherenceFlags, setAdherenceFlags] = useState({
    medicineTaken: false,
    exerciseCompleted: false,
    dietFollowed: false,
    waterGoalCompleted: false,
    sleepGoalCompleted: false,
    bpChecked: false,
    glucoseChecked: false,
  });
  const [savingAdherence, setSavingAdherence] = useState(false);

  // Outcome / Progress Data State
  const [outcomeData, setOutcomeData] = useState(null);

  // Doctor Comments Data & Input State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Validation Summary Data State
  const [validationData, setValidationData] = useState(null);

  // Audit History Data State
  const [auditData, setAuditData] = useState([]);

  // Fetch all care plan data for today
  const loadPatientCarePlan = useCallback(async (isManual = false) => {
    if (!resolvedPatientId) return;
    if (isManual) setRefreshing(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Today's Care Plan Summary & Full Care Plan Details
      const [todayRes, fullRes] = await Promise.allSettled([
        carePlanService.getPatientToday(resolvedPatientId),
        carePlanService.getLatestByPatient(resolvedPatientId),
      ]);

      let tData = null;
      let fData = null;

      if (todayRes.status === 'fulfilled') {
        tData = todayRes.value.data;
        setTodayPlan(tData);
      }
      if (fullRes.status === 'fulfilled') {
        fData = fullRes.value.data;
        setFullPlan(fData);
      }

      if (!tData && !fData) {
        setErrorMsg(`No active or approved care plan found for Patient ID ${resolvedPatientId}.`);
        setLoading(false);
        if (isManual) setRefreshing(false);
        return;
      }

      // Populate Adherence Flags from today's plan
      const source = tData || fData;
      setAdherenceFlags({
        medicineTaken: !!source?.medicineTaken,
        exerciseCompleted: !!source?.exerciseCompleted,
        dietFollowed: !!source?.dietFollowed,
        waterGoalCompleted: !!source?.waterGoalCompleted,
        sleepGoalCompleted: !!source?.sleepGoalCompleted,
        bpChecked: !!source?.bpChecked,
        glucoseChecked: !!source?.glucoseChecked,
      });

      // 2. Fetch Additional Outcome, Comments, Validation & Audit using carePlanId
      const carePlanId = fData?.carePlanId || fData?.id || tData?.carePlanId || tData?.id;
      if (carePlanId) {
        const [outRes, comRes, valRes, auditRes] = await Promise.allSettled([
          carePlanService.getOutcome(carePlanId),
          carePlanService.getComments(carePlanId),
          carePlanService.getValidation(carePlanId),
          carePlanService.getAudit(carePlanId),
        ]);

        if (outRes.status === 'fulfilled') setOutcomeData(outRes.value.data);
        if (comRes.status === 'fulfilled' && Array.isArray(comRes.value.data)) {
          setComments(comRes.value.data);
        }
        if (valRes.status === 'fulfilled') setValidationData(valRes.value.data);
        if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value.data)) {
          const sorted = [...auditRes.value.data].sort(
            (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
          );
          setAuditData(sorted);
        }
      }
    } catch (err) {
      console.error('Error loading patient care plan:', err);
      if (isManual) {
        notify.error('Refresh Failed', 'Unable to refresh care plan.');
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [resolvedPatientId, notify]);

  // Initial Load & Auto-Refresh every 15 seconds
  useEffect(() => {
    loadPatientCarePlan();
    const interval = setInterval(() => {
      loadPatientCarePlan();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadPatientCarePlan]);

  // Handle Checkbox Change
  const handleCheckboxChange = (field) => {
    setAdherenceFlags((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Save Daily Adherence
  const handleSaveAdherence = async () => {
    const carePlanId = fullPlan?.carePlanId || fullPlan?.id || todayPlan?.carePlanId || todayPlan?.id;
    if (!carePlanId) {
      notify.error('Save Failed', 'No active care plan ID identified.');
      return;
    }

    setSavingAdherence(true);
    try {
      await carePlanService.updateAdherence(carePlanId, adherenceFlags);
      notify.success('Adherence Updated', 'Your daily health progress has been saved.');
      // Refresh to update calculated adherence percentage
      loadPatientCarePlan(true);
    } catch (err) {
      notify.error('Save Failed', err.response?.data?.message || err.message || 'Unable to update adherence.');
    } finally {
      setSavingAdherence(false);
    }
  };

  // Submit Patient Doctor Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const carePlanId = fullPlan?.carePlanId || fullPlan?.id || todayPlan?.carePlanId || todayPlan?.id;
    if (!carePlanId) {
      notify.error('Comment Failed', 'No care plan ID found.');
      return;
    }

    setPostingComment(true);
    try {
      await carePlanService.addComment(carePlanId, {
        author: userInfo?.username || 'Patient',
        authorRole: 'PATIENT',
        message: newComment.trim(),
      });
      notify.success('Comment Sent', 'Your message has been posted to your care team.');
      setNewComment('');
      // Reload comments
      const comRes = await carePlanService.getComments(carePlanId);
      if (Array.isArray(comRes.data)) setComments(comRes.data);
    } catch (err) {
      notify.error('Comment Error', err.response?.data?.message || err.message || 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
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
    const s = (status || 'APPROVED').toUpperCase();
    if (s === 'APPROVED') return <span className="badge-green">Approved</span>;
    if (s === 'REJECTED') return <span className="badge-red">Rejected</span>;
    return <span className="badge-yellow">Pending Review</span>;
  };

  // Validation Status Indicator Helper
  const renderValidationStatus = (statusStr) => {
    if (!statusStr) return <span className="text-gray-500 font-medium">N/A</span>;
    const s = statusStr.toUpperCase();
    if (s.includes('PASSED') || s.includes('VALID') || s.includes('APPROVED') || s === 'PASS' || s === 'OK') {
      return <span className="text-emerald-400 font-semibold flex items-center gap-1"><RiCheckboxCircleLine className="w-4 h-4" /> {statusStr}</span>;
    }
    if (s.includes('FAILED') || s.includes('INVALID') || s.includes('REJECTED') || s === 'FAIL') {
      return <span className="text-red-400 font-semibold flex items-center gap-1"><RiCloseCircleLine className="w-4 h-4" /> {statusStr}</span>;
    }
    return <span className="text-yellow-400 font-semibold flex items-center gap-1"><RiAlertLine className="w-4 h-4" /> {statusStr}</span>;
  };

  const activeMedications = todayPlan?.medications || fullPlan?.medications || [];

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiHeartPulseLine className="w-7 h-7 text-blue-400" />
            My Care Plan Portal
          </h1>
          <p className="page-subtitle">
            Track your daily medication schedule, log health progress, and view doctor recommendations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">
            Auto-refreshes every 15s
          </span>
          <button
            onClick={() => loadPatientCarePlan(true)}
            disabled={refreshing}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3 text-gray-400">
          <Spinner size="lg" />
          <span>Loading your care plan...</span>
        </div>
      ) : errorMsg ? (
        <div className="card p-8 text-center space-y-3">
          <RiAlertLine className="w-12 h-12 text-yellow-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Care Plan Available</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">{errorMsg}</p>
        </div>
      ) : (
        <>
          {/* TOP SUMMARY */}
          <div className="card-lg bg-surface border border-[#1F2937] p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Care Plan Overview</p>
                <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{fullPlan?.goal || todayPlan?.goal || 'Personalized Wellness Pathway'}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {renderRiskBadge(fullPlan?.riskLevel || fullPlan?.predictionRisk)}
                {renderStatusBadge(fullPlan?.doctorStatus || 'APPROVED')}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Patient ID</p>
                <p className="font-mono text-sm font-bold text-white mt-1">
                  {resolvedPatientId || fullPlan?.patientId || todayPlan?.patientId || 'P1001'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Risk Level</p>
                <p className="text-sm font-semibold text-gray-200 mt-1">
                  {fullPlan?.riskLevel || fullPlan?.predictionRisk || 'Low Risk'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Doctor Status</p>
                <p className="text-sm font-semibold text-emerald-400 mt-1">
                  {fullPlan?.doctorStatus || 'APPROVED'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Next Review</p>
                <p className="text-sm font-semibold text-gray-200 mt-1">
                  {todayPlan?.nextReview || fullPlan?.nextReview
                    ? new Date(todayPlan?.nextReview || fullPlan?.nextReview).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Generated By</p>
                <div className="mt-1">
                  <span className="badge-cyan text-[10px]">
                    {fullPlan?.generatedBy || 'AI_GENERATED'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 font-semibold uppercase text-[10px]">Current Adherence</p>
                <p className="text-sm font-bold text-blue-400 mt-1">
                  {todayPlan?.adherence ?? fullPlan?.adherence ?? outcomeData?.adherence ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {/* TODAY'S PLAN CARDS */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <RiCalendarLine className="w-5 h-5 text-blue-400" />
              Today's Care Directives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Medicines */}
              <div className="card hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-purple-400">
                  <RiCapsuleLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Today's Medicines</p>
                </div>
                {Array.isArray(activeMedications) && activeMedications.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {activeMedications.map((med, idx) => (
                      <li key={idx} className="flex items-center gap-2 bg-surface-2/60 px-2.5 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{med}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {activeMedications || 'No specific medication prescribed for today.'}
                  </p>
                )}
              </div>

              {/* Diet */}
              <div className="card hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-emerald-400">
                  <RiRestaurantLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Diet Plan</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {todayPlan?.diet || fullPlan?.diet || 'Balanced low-sodium Mediterranean diet with controlled carb intake.'}
                </p>
              </div>

              {/* Exercise */}
              <div className="card hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-blue-400">
                  <RiRunLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Exercise Goal</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {todayPlan?.exercise || fullPlan?.exercise || '30 mins moderate walking daily, light stretching morning/evening.'}
                </p>
              </div>

              {/* Water Intake */}
              <div className="card hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-cyan-400">
                  <RiCupLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Water Intake</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  {todayPlan?.waterIntake || fullPlan?.waterIntake || '2.5 to 3.0 Litres daily'}
                </p>
              </div>

              {/* Sleep Recommendation */}
              <div className="card hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-indigo-400">
                  <RiMoonLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Sleep Recommendation</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  {todayPlan?.sleepRecommendation || fullPlan?.sleepRecommendation || '7 - 8 hours restful sleep nightly'}
                </p>
              </div>

              {/* Doctor Notes */}
              <div className="card hover:border-yellow-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-yellow-400">
                  <RiStethoscopeLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Doctor Notes</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic bg-surface-2 p-2.5 rounded-lg border border-[#1F2937]">
                  "{todayPlan?.doctorNotes || fullPlan?.doctorNotes || todayPlan?.latestDoctorComment || 'Follow daily routine and record vitals.'}"
                </p>
              </div>

              {/* AI Recommendation */}
              <div className="card hover:border-blue-500/30 transition-all bg-blue-950/20">
                <div className="flex items-center gap-2 mb-3 text-blue-400">
                  <RiRobotLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">AI Recommendation</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {fullPlan?.aiRecommendation || 'Adhering to daily vitals checks reduces long-term risk probabilities.'}
                </p>
              </div>

              {/* Clinical Summary */}
              {fullPlan?.clinicalSummary && (
                <div className="card hover:border-blue-500/30 transition-all bg-blue-950/20 col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <RiRobotLine className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-wider">Clinical Summary Narrative</p>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed italic">
                    "{fullPlan.clinicalSummary}"
                  </p>
                </div>
              )}

              {/* Lifestyle Advice */}
              <div className="card hover:border-teal-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3 text-teal-400">
                  <RiShieldCheckLine className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Lifestyle Advice</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {fullPlan?.lifestyleAdvice || 'Avoid smoking, limit sodium intake, maintain steady hydration.'}
                </p>
              </div>

              {/* Monitoring Recommendations */}
              {Array.isArray(fullPlan?.monitoringRecommendations) && fullPlan.monitoringRecommendations.length > 0 && (
                <div className="card hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-3 text-cyan-400">
                    <RiPulseLine className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-wider">Vitals Monitoring Protocols</p>
                  </div>
                  <ul className="text-xs text-gray-300 leading-relaxed list-disc list-inside space-y-1">
                    {fullPlan.monitoringRecommendations.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red-Flag Warning Signs */}
              {Array.isArray(fullPlan?.warningSigns) && fullPlan.warningSigns.length > 0 && (
                <div className="card hover:border-rose-500/40 transition-all bg-rose-950/20 border-rose-500/30">
                  <div className="flex items-center gap-2 mb-3 text-rose-400">
                    <RiAlertLine className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-wider">Red-Flag Warning Signs</p>
                  </div>
                  <ul className="text-xs text-rose-200 leading-relaxed list-disc list-inside space-y-1">
                    {fullPlan.warningSigns.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* DAILY ADHERENCE CHECKLIST & SAVE */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RiCheckboxCircleLine className="w-5 h-5 text-emerald-400" />
                  Daily Adherence Checklist
                </h3>
                <p className="text-xs text-gray-400">
                  Check off your completed health tasks for today and save to calculate your adherence percentage.
                </p>
              </div>

              <button
                onClick={handleSaveAdherence}
                disabled={savingAdherence}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                {savingAdherence ? <Spinner size="sm" /> : <RiSaveLine className="w-4 h-4" />}
                <span>Save Adherence</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Medicine Taken */}
              <label
                onClick={() => handleCheckboxChange('medicineTaken')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.medicineTaken
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.medicineTaken
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.medicineTaken && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Medicine Taken</span>
              </label>

              {/* 2. Exercise Completed */}
              <label
                onClick={() => handleCheckboxChange('exerciseCompleted')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.exerciseCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.exerciseCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.exerciseCompleted && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Exercise Completed</span>
              </label>

              {/* 3. Diet Followed */}
              <label
                onClick={() => handleCheckboxChange('dietFollowed')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.dietFollowed
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.dietFollowed
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.dietFollowed && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Diet Followed</span>
              </label>

              {/* 4. Water Goal Completed */}
              <label
                onClick={() => handleCheckboxChange('waterGoalCompleted')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.waterGoalCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.waterGoalCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.waterGoalCompleted && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Water Goal Completed</span>
              </label>

              {/* 5. Sleep Goal Completed */}
              <label
                onClick={() => handleCheckboxChange('sleepGoalCompleted')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.sleepGoalCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.sleepGoalCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.sleepGoalCompleted && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Sleep Goal Completed</span>
              </label>

              {/* 6. BP Checked */}
              <label
                onClick={() => handleCheckboxChange('bpChecked')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.bpChecked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.bpChecked
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.bpChecked && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">BP Checked</span>
              </label>

              {/* 7. Blood Glucose Checked */}
              <label
                onClick={() => handleCheckboxChange('glucoseChecked')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adherenceFlags.glucoseChecked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-surface border-[#1F2937] text-gray-400 hover:bg-surface-2'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    adherenceFlags.glucoseChecked
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-gray-600'
                  }`}
                >
                  {adherenceFlags.glucoseChecked && <RiCheckLine className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-xs font-semibold">Blood Glucose Checked</span>
              </label>
            </div>
          </div>

          {/* OUTCOME PROGRESS SECTION */}
          <div className="card space-y-4">
            <div className="border-b border-[#1F2937] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RiPercentLine className="w-5 h-5 text-blue-400" />
                Outcome Progress & Metrics Improvement
              </h3>
              <p className="text-xs text-gray-400">
                Calculated metrics deltas comparing baseline values against current health progress.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Adherence % */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Adherence %</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {todayPlan?.adherence ?? fullPlan?.adherence ?? outcomeData?.adherence ?? 0}%
                </p>
              </div>

              {/* Risk Improvement */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
                  <RiScales3Line className="w-3 h-3 text-emerald-400" /> Risk Delta
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {todayPlan?.riskImprovement ?? fullPlan?.riskImprovement ?? outcomeData?.riskImprovement ?? 0.0}%
                </p>
              </div>

              {/* Weight Improvement */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weight Delta</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {todayPlan?.weightImprovement ?? fullPlan?.weightImprovement ?? outcomeData?.weightImprovement ?? 0.0} kg
                </p>
              </div>

              {/* BP Improvement */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
                  <RiPulseLine className="w-3 h-3 text-red-400" /> BP Delta
                </p>
                <p className="text-2xl font-bold text-gray-200 mt-1">
                  {todayPlan?.bpImprovement ?? fullPlan?.bpImprovement ?? outcomeData?.bpImprovement ?? 0.0} mmHg
                </p>
              </div>

              {/* Glucose Improvement */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
                  <RiDropLine className="w-3 h-3 text-amber-400" /> Glucose Delta
                </p>
                <p className="text-2xl font-bold text-gray-200 mt-1">
                  {todayPlan?.glucoseImprovement ?? fullPlan?.glucoseImprovement ?? outcomeData?.glucoseImprovement ?? 0.0} mg/dL
                </p>
              </div>

              {/* Cholesterol Improvement */}
              <div className="p-4 bg-surface rounded-xl border border-[#1F2937] text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
                  <RiFlaskLine className="w-3 h-3 text-teal-400" /> Cholesterol
                </p>
                <p className="text-2xl font-bold text-gray-200 mt-1">
                  {todayPlan?.cholesterolImprovement ?? fullPlan?.cholesterolImprovement ?? outcomeData?.cholesterolImprovement ?? 0.0} mg/dL
                </p>
              </div>
            </div>
          </div>

          {/* DOCTOR COMMENTS & PATIENT MESSAGING */}
          <div className="card space-y-4">
            <div className="border-b border-[#1F2937] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RiChat3Line className="w-5 h-5 text-blue-400" />
                  Care Team Communication
                </h3>
                <p className="text-xs text-gray-400">
                  Ask questions or post health updates directly to your physician.
                </p>
              </div>
              <span className="text-xs text-gray-500 font-mono">{comments.length} Messages</span>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scroll p-2 bg-surface-2/40 rounded-xl border border-[#1F2937]">
              {comments.length > 0 ? (
                comments.map((c, idx) => {
                  const isPatient = (c.authorRole || '').toUpperCase() === 'PATIENT';
                  return (
                    <div
                      key={c.commentId || idx}
                      className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs space-y-1 ${
                          isPatient
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-surface border border-[#1F2937] text-gray-200 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 border-b border-white/10 pb-1">
                          <span className="font-bold">{c.author || (isPatient ? 'You' : 'Doctor')}</span>
                          <span className="font-mono">{c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <p className="leading-relaxed mt-1">{c.message || c.comment}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  No messages yet. Send a note below to contact your doctor.
                </p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Type your message to the doctor..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="form-input text-xs flex-1"
              />
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                {postingComment ? <Spinner size="sm" /> : <RiSendPlaneLine className="w-4 h-4" />}
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* VALIDATION PANEL */}
          <div className="card space-y-3 bg-surface-2/40">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RiShieldCheckLine className="w-5 h-5 text-emerald-400" />
                Clinical Validation Status
              </h3>
            </div>

            {validationData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Clinical Guideline</p>
                  <div className="mt-1">{renderValidationStatus(validationData.clinicalGuidelineStatus)}</div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Drug Interaction</p>
                  <div className="mt-1">{renderValidationStatus(validationData.drugInteractionStatus)}</div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Doctor Approval</p>
                  <div className="mt-1">{renderValidationStatus(validationData.doctorApprovalStatus)}</div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Adherence Check</p>
                  <div className="mt-1">{renderValidationStatus(validationData.adherenceStatus)}</div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Outcome Status</p>
                  <div className="mt-1">
                    {renderValidationStatus(validationData.outcomeTrackingStatus || validationData.outcomeStatus)}
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-[#1F2937]">
                  <p className="text-gray-500 font-semibold uppercase text-[10px]">Overall Status</p>
                  <div className="mt-1">{renderValidationStatus(validationData.overallStatus)}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No validation record loaded.</p>
            )}
          </div>

          {/* AUDIT PANEL (READ ONLY TIMELINE) */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RiHistoryLine className="w-5 h-5 text-blue-400" />
                Audit Trail (Read Only Timeline)
              </h3>
              <span className="text-xs text-gray-500">{auditData.length} History Events</span>
            </div>

            {auditData.length > 0 ? (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F2937]">
                {auditData.map((item, idx) => (
                  <div key={item.auditId || idx} className="relative group">
                    <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500/20 border-2 border-blue-400" />
                    <div className="bg-surface p-3 rounded-lg border border-[#1F2937] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase tracking-wider">{item.action}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No audit history recorded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientCarePlan;
