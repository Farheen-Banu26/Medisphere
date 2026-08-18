import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { patientService } from '../../services/patientService';
import { twinService } from '../../services/twinService';
import { vitalsService } from '../../services/vitalsService';
import { 
  RiUserLine, RiStethoscopeLine, RiHospitalLine, 
  RiHeartPulseLine, RiClipboardLine, RiShieldCheckLine, RiArrowRightSLine
} from 'react-icons/ri';

const PatientDashboard = () => {
  const { keycloak } = useAuth();
  const userInfo = getUserInfo();
  const navigate = useNavigate();

  const [patientRecord, setPatientRecord] = useState(null);
  const [twinData, setTwinData] = useState(null);
  const [vitalsData, setVitalsData] = useState(null);
  const resolvePid = (info) => {
    if (!info) return 'P1001';
    if (info.patientId) return info.patientId;
    const u = (info.username || '').toLowerCase();
    const e = (info.email || '').toLowerCase();
    if (u === 'farheen' || e.includes('farheen')) return 'P1001';
    if (u === 'patient' || e.includes('patient')) return 'P1002';
    return info.username || 'P1001';
  };

  const pid = resolvePid(userInfo);

  useEffect(() => {
    const fetchLatestVitals = async () => {
      try {
        const vRes = await vitalsService.getLatestVitals(pid);
        if (vRes?.data) setVitalsData(vRes.data);
      } catch (err) {
        console.error('Failed to update latest vitals', err);
      }
    };

    const loadPatientData = async () => {
      setLoading(true);
      try {
        const [pRes, tRes, vRes] = await Promise.allSettled([
          patientService.getPatientById(pid),
          twinService.getTwin(pid),
          vitalsService.getLatestVitals(pid)
        ]);

        if (pRes.status === 'fulfilled') setPatientRecord(pRes.value.data);
        if (tRes.status === 'fulfilled') setTwinData(tRes.value.data);
        if (vRes.status === 'fulfilled') setVitalsData(vRes.value.data);
      } catch (err) {
        console.error('Failed to load patient dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
    const interval = setInterval(fetchLatestVitals, 3000);
    return () => clearInterval(interval);
  }, [pid]);

  const patientName = patientRecord ? `${patientRecord.firstName} ${patientRecord.lastName}` : (userInfo?.username || 'Patient');

  const systolicVal = vitalsData?.bpSystolic ?? vitalsData?.systolicBP ?? null;
  const diastolicVal = vitalsData?.bpDiastolic ?? vitalsData?.diastolicBP ?? null;
  const hrVal = vitalsData?.heartRate ?? null;
  const spo2Val = vitalsData?.spo2 ?? vitalsData?.oxygen ?? null;
  const bpDisplay = (systolicVal != null && diastolicVal != null) ? `${systolicVal}/${diastolicVal}` : (systolicVal != null ? `${systolicVal}` : '—');

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#0B1120] min-h-screen text-gray-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-teal-900/20 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400 text-2xl shadow-glow-blue">
            <RiUserLine />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, {patientName}</h1>
              {vitalsData?.recordedAt && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live: {new Date(vitalsData.recordedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1">Patient ID: <span className="font-mono text-blue-400 font-bold">{patientRecord?.patientId || pid}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patient/health-twin')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            My Digital Health Twin <RiArrowRightSLine />
          </button>
          <button
            onClick={() => keycloak.logout()}
            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-xl font-medium text-sm transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Assigned Doctor & Hospital Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#131C31] border border-gray-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3 text-blue-400 font-bold text-base">
            <RiStethoscopeLine className="text-xl" /> My Assigned Physician
          </div>
          <div className="pl-8 space-y-1">
            <p className="text-lg font-bold text-white">{patientRecord?.assignedDoctorName || 'Dr. Sarah Jenkins'}</p>
            <p className="text-xs text-blue-300">Specialty: {patientRecord?.specialty || 'Cardiology'}</p>
            <p className="text-xs text-gray-400">Department: {patientRecord?.department || 'Cardiovascular Center'}</p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-3 text-purple-400 font-bold text-base">
            <RiHospitalLine className="text-xl" /> Primary Healthcare Facility
          </div>
          <div className="pl-8 space-y-1">
            <p className="text-lg font-bold text-white">{patientRecord?.hospitalName || 'MediSphere General Hospital'}</p>
            <p className="text-xs text-purple-300">Facility ID: {patientRecord?.hospitalId || 'HOSP001'}</p>
            <p className="text-xs text-gray-400">Condition: {patientRecord?.condition || 'Coronary Artery Risk'}</p>
          </div>
        </div>
      </div>

      {/* Vitals Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Heart Rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {hrVal != null ? <>{hrVal} <span className="text-xs font-normal text-gray-400">BPM</span></> : '—'}
          </p>
        </div>
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blood Pressure</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {bpDisplay} {bpDisplay !== '—' && <span className="text-xs font-normal text-gray-400">mmHg</span>}
          </p>
        </div>
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Oxygen Saturation</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {spo2Val != null ? `${spo2Val}%` : '—'}
          </p>
        </div>
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Health Score</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {twinData?.healthScore != null ? `${twinData.healthScore} / 100` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
