// src/components/clinical/CriticalAlertModal.jsx
// Milestone 3 Critical Alert Popup Component
// Displays emergency hospital popup when active critical alerts occur.
// Uses live alert payload fields only. No invented/hardcoded clinical data.

import { useState, useEffect } from 'react';
import {
  RiFireLine,
  RiCheckLine,
  RiCloseLine,
  RiAlarmWarningLine,
  RiHeartPulseLine,
  RiUserLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { useNotification } from '../../context/NotificationContext';

function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  } catch {
    return raw;
  }
}

export const CriticalAlertModal = ({
  criticalAlerts = [],
  onAcknowledge,
  onClose,
  user,
}) => {
  const { notify } = useNotification();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmEmergency, setShowConfirmEmergency] = useState(false);

  // Keep index within bounds if list shrinks
  useEffect(() => {
    if (currentIndex >= criticalAlerts.length && criticalAlerts.length > 0) {
      setCurrentIndex(criticalAlerts.length - 1);
    }
  }, [criticalAlerts.length, currentIndex]);

  if (!criticalAlerts || criticalAlerts.length === 0) {
    return null;
  }

  // Pick current alert (sorted newest first)
  const currentAlert = criticalAlerts[currentIndex] || criticalAlerts[0];
  const statusUpper = currentAlert?.status?.toUpperCase() || '';

  const canAck = ['NEW', 'SENT', 'DELIVERED'].includes(statusUpper);
  const canClose = statusUpper === 'ACKNOWLEDGED';

  // Check if AI payload fields exist
  const hasAiData =
    currentAlert.risk != null ||
    currentAlert.confidence != null ||
    currentAlert.prediction != null ||
    currentAlert.aiPrediction != null;

  // Check if vitals exist in payload
  const hasVitals =
    currentAlert.heartRate != null ||
    currentAlert.bpSystolic != null ||
    currentAlert.spo2 != null ||
    currentAlert.temperature != null;

  const handleAckClick = async () => {
    if (!currentAlert?.alertId) return;
    setActionLoading(true);
    try {
      const ackBy = user?.email || user?.name || 'Dr. Admin';
      await onAcknowledge(currentAlert.alertId, ackBy);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseClick = async () => {
    if (!currentAlert?.alertId) return;
    setActionLoading(true);
    try {
      await onClose(currentAlert.alertId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyTrigger = () => {
    setShowConfirmEmergency(false);
    notify.warning(
      'Emergency Escalation',
      'Emergency escalation placeholder'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#0D1424] border-2 border-red-600/80 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Top Emergency Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
              <RiAlarmWarningLine className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                🚨 CRITICAL ALERT
              </h2>
              <p className="text-[11px] text-red-100 font-medium">
                Immediate Clinical Attention Required
              </p>
            </div>
          </div>

          {/* Multiple critical alerts carousel selector */}
          {criticalAlerts.length > 1 && (
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="hover:text-yellow-300 disabled:opacity-30 disabled:hover:text-white"
                title="Previous Critical Alert"
              >
                <RiArrowLeftSLine className="w-5 h-5" />
              </button>
              <span className="font-mono font-bold text-yellow-300">
                {currentIndex + 1} / {criticalAlerts.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(criticalAlerts.length - 1, prev + 1)
                  )
                }
                disabled={currentIndex === criticalAlerts.length - 1}
                className="hover:text-yellow-300 disabled:opacity-30 disabled:hover:text-white"
                title="Next Critical Alert"
              >
                <RiArrowRightSLine className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-5 flex-1">
          {/* Key Alert Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-2/70 p-4 rounded-xl border border-[#1F2937]">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <RiUserLine className="w-3 h-3 text-blue-400" /> Patient ID
              </p>
              <p className="text-sm font-bold font-mono text-blue-300 mt-1 truncate">
                {currentAlert.patientId || '—'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Alert Type
              </p>
              <p className="text-sm font-semibold text-gray-200 mt-1 truncate">
                {currentAlert.type || '—'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Severity
              </p>
              <div className="mt-1">
                <span className="badge badge-red font-bold uppercase tracking-wide">
                  CRITICAL
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Status
              </p>
              <div className="mt-1">
                <span className="badge bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                  {currentAlert.status || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Message */}
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <RiFireLine className="w-4 h-4" /> Clinical Message
            </p>
            <p className="text-sm text-red-100 font-medium leading-relaxed">
              {currentAlert.message || 'Critical alert triggered for patient.'}
            </p>
          </div>

          {/* Vitals Section (Only rendered if present in payload) */}
          {hasVitals && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <RiHeartPulseLine className="w-4 h-4 text-red-400" /> Vital Signs Snapshot
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentAlert.heartRate != null && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Heart Rate</p>
                    <p className="text-lg font-black text-red-400 font-mono mt-0.5">
                      {currentAlert.heartRate} <span className="text-xs text-gray-500">bpm</span>
                    </p>
                  </div>
                )}

                {currentAlert.bpSystolic != null && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Blood Pressure</p>
                    <p className="text-lg font-black text-blue-400 font-mono mt-0.5">
                      {currentAlert.bpSystolic}
                      {currentAlert.bpDiastolic ? `/${currentAlert.bpDiastolic}` : ''}{' '}
                      <span className="text-xs text-gray-500">mmHg</span>
                    </p>
                  </div>
                )}

                {currentAlert.spo2 != null && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">SpO₂</p>
                    <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                      {currentAlert.spo2} <span className="text-xs text-gray-500">%</span>
                    </p>
                  </div>
                )}

                {currentAlert.temperature != null && (
                  <div className="bg-surface-2 p-3 rounded-xl border border-[#1F2937]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Temperature</p>
                    <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
                      {currentAlert.temperature} <span className="text-xs text-gray-500">°F</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Section (ONLY if payload contains risk, confidence, or prediction) */}
          {hasAiData && (
            <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl space-y-2">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                <RiSparklingLine className="w-4 h-4 text-purple-400" /> AI Insights Payload
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {currentAlert.risk != null && (
                  <div>
                    <span className="text-gray-400">Risk: </span>
                    <span className="font-bold text-purple-200">{String(currentAlert.risk)}</span>
                  </div>
                )}
                {currentAlert.confidence != null && (
                  <div>
                    <span className="text-gray-400">Confidence: </span>
                    <span className="font-bold text-purple-200">{String(currentAlert.confidence)}</span>
                  </div>
                )}
                {(currentAlert.prediction != null || currentAlert.aiPrediction != null) && (
                  <div>
                    <span className="text-gray-400">Prediction: </span>
                    <span className="font-bold text-purple-200">
                      {String(currentAlert.prediction || currentAlert.aiPrediction)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps & Audit details */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#1F2937] gap-2">
            <span className="flex items-center gap-1 font-mono">
              <RiTimeLine className="w-3.5 h-3.5" /> Created: {fmtDateTime(currentAlert.createdAt)}
            </span>
            {currentAlert.acknowledgedBy && (
              <span className="flex items-center gap-1 text-purple-300">
                <RiShieldCheckLine className="w-3.5 h-3.5 text-purple-400" /> Ack By:{' '}
                <strong className="font-mono">{currentAlert.acknowledgedBy}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Emergency Confirmation Step */}
        {showConfirmEmergency && (
          <div className="bg-red-950 border-t border-red-600 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-red-200 font-semibold">
              ⚠️ Confirm Emergency Escalation? This will log an emergency event placeholder.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowConfirmEmergency(false)}
                className="btn btn-sm bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyTrigger}
                className="btn btn-sm bg-red-600 text-white font-bold hover:bg-red-500 shadow-glow-red"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        {!showConfirmEmergency && (
          <div className="px-6 py-4 bg-[#0A0F1C] border-t border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Emergency Button */}
            <button
              onClick={() => setShowConfirmEmergency(true)}
              className="btn btn-sm bg-red-600/30 border border-red-500 text-red-200 hover:bg-red-600/50 focus:ring-red-500 font-bold flex items-center gap-2"
            >
              <RiAlarmWarningLine className="w-4 h-4 text-red-400 animate-pulse" />
              Emergency Escalation
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {canAck && (
                <button
                  onClick={handleAckClick}
                  disabled={actionLoading}
                  className="btn btn-sm bg-purple-600 text-white hover:bg-purple-500 focus:ring-purple-500 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  <RiCheckLine className="w-4 h-4" />
                  {actionLoading ? 'Acknowledging…' : 'Acknowledge'}
                </button>
              )}

              {canClose && (
                <button
                  onClick={handleCloseClick}
                  disabled={actionLoading}
                  className="btn btn-sm bg-green-600 text-white hover:bg-green-500 focus:ring-green-500 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  <RiCloseLine className="w-4 h-4" />
                  {actionLoading ? 'Closing…' : 'Close Alert'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalAlertModal;
