import { memo } from 'react';
import { RiShieldCheckLine, RiHeartPulseLine } from 'react-icons/ri';

const getRiskLabel = (score) => {
  if (score == null) return 'Unknown';
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
};

export const PatientQueueItem = memo(function PatientQueueItem({ patient, selected, onSelect }) {
  const score = patient.healthScore ?? patient.riskScore;
  const riskLabel = getRiskLabel(score);

  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${selected ? 'border-blue-500/40 bg-blue-500/10' : 'border-[#1F2937] bg-[#08111F] hover:border-blue-500/20'}`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{patient.firstName || ''} {patient.lastName || ''}</p>
          <p className="mt-1 text-xs text-gray-400">{patient.patientId || patient.id}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${riskLabel === 'Critical' ? 'bg-red-500/10 text-red-400' : riskLabel === 'High' ? 'bg-amber-500/10 text-amber-400' : riskLabel === 'Moderate' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {riskLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1"><RiShieldCheckLine className="h-3.5 w-3.5" /> {score ?? '—'}</span>
        <span className="inline-flex items-center gap-1"><RiHeartPulseLine className="h-3.5 w-3.5" /> {patient.latestVitals?.heartRate ? `${patient.latestVitals.heartRate} bpm` : '—'}</span>
      </div>
    </button>
  );
});

export default PatientQueueItem;
