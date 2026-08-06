import { memo, useCallback } from 'react';
import { RiDownloadLine } from 'react-icons/ri';

export const ExportButton = memo(function ExportButton({ data = [], filename = 'operations-dashboard.csv' }) {
  const handleExport = useCallback(() => {
    if (!data.length) return;

    const headers = ['Patient ID', 'Name', 'Gender', 'Blood Group', 'Risk', 'Prediction Status'];
    const rows = data.map((item) => [
      item.patientId || item.id || '',
      `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      item.gender || '',
      item.bloodGroup || '',
      item.risk || '',
      item.predictionStatus || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, filename]);

  return (
    <button className="btn-outline btn-sm flex items-center gap-2" onClick={handleExport} disabled={!data.length} aria-label="Export current dashboard data as CSV">
      <RiDownloadLine className="h-4 w-4" /> Export CSV
    </button>
  );
});

export default ExportButton;
