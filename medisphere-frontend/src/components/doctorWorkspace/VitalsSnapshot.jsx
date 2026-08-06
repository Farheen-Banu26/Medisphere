import { memo } from 'react';

export const VitalsSnapshot = memo(function VitalsSnapshot({ vitals }) {
  if (!vitals) {
    return <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-6 text-sm text-gray-400">Latest vitals are not available from the current backend.</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Heart Rate</p>
        <p className="mt-2 text-xl font-semibold text-white">{vitals.heartRate ?? '—'} bpm</p>
      </div>
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Blood Pressure</p>
        <p className="mt-2 text-xl font-semibold text-white">{vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '—'} mmHg</p>
      </div>
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Temperature</p>
        <p className="mt-2 text-xl font-semibold text-white">{vitals.temperature ?? '—'} °F</p>
      </div>
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">SpO₂</p>
        <p className="mt-2 text-xl font-semibold text-white">{vitals.spo2 ?? '—'}%</p>
      </div>
      {vitals.respiratoryRate != null && (
        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Respiratory Rate</p>
          <p className="mt-2 text-xl font-semibold text-white">{vitals.respiratoryRate} /min</p>
        </div>
      )}
      {vitals.bmi != null && (
        <div className="rounded-2xl border border-[#1F2937] bg-[#0B1221] p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">BMI</p>
          <p className="mt-2 text-xl font-semibold text-white">{vitals.bmi}</p>
        </div>
      )}
    </div>
  );
});

export default VitalsSnapshot;
