import { memo } from 'react';

export const DoctorNotesCard = memo(function DoctorNotesCard({ notes }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#08111F] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Doctor Notes</p>
      <p className="mt-4 text-sm text-gray-400">{notes || 'Doctor notes are not available from the current backend.'}</p>
    </div>
  );
});

export default DoctorNotesCard;
