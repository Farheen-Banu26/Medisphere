import { RiFileTextLine, RiDownloadLine, RiPieChartLine, RiBarChartLine } from 'react-icons/ri';

const ReportItem = ({ title, subtext, icon: Icon }) => (
  <div className="card flex items-start gap-4 p-5">
    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400">
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
    <button className="btn-ghost btn-sm text-blue-300">Export</button>
  </div>
);

export const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <RiPieChartLine className="w-6 h-6 text-blue-400" /> Reports
        </h1>
        <p className="page-subtitle">Operational, clinical, and AI reporting dashboards for compliance and review.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ReportItem title="Patient Risk Summary" subtext="Latest risk distributions across cohorts." icon={RiBarChartLine} />
        <ReportItem title="FHIR Sync Audit" subtext="Historical integration and sync metrics." icon={RiFileTextLine} />
        <ReportItem title="Prediction Performance" subtext="Accuracy, drift, and prediction trends." icon={RiDownloadLine} />
      </div>

      <div className="card-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Builder</p>
            <h2 className="text-xl font-bold text-white">Generate a new clinical report</h2>
          </div>
          <button className="btn-primary btn-sm">Create Report</button>
        </div>
        <p className="text-sm text-gray-400">Configure custom reports for patient cohorts, risk alerts, AI prediction outcomes, and operational metrics.</p>
      </div>
    </div>
  );
};

export default Reports;
