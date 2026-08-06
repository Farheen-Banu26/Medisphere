import { RiListCheck, RiHeartPulseLine, RiFileTextLine, RiArrowRightLine } from 'react-icons/ri';

const PlanCard = ({ title, type, nextStep, owner }) => (
  <div className="card-lg border border-[#1F2937] p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{type}</p>
        <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
      </div>
      <RiListCheck className="w-6 h-6 text-blue-400" />
    </div>
    <div className="mt-5 space-y-3 text-sm text-gray-400">
      <p><span className="font-semibold text-gray-200">Next step:</span> {nextStep}</p>
      <p><span className="font-semibold text-gray-200">Owner:</span> {owner}</p>
    </div>
    <div className="mt-5 text-right">
      <button className="btn-outline btn-sm inline-flex items-center gap-2">View Plan <RiArrowRightLine className="w-4 h-4" /></button>
    </div>
  </div>
);

export const CarePlans = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <RiHeartPulseLine className="w-6 h-6 text-blue-400" /> Care Plans
        </h1>
        <p className="page-subtitle">Clinical care plans, treatment pathways, and follow-up coordination.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PlanCard title="Post-Operative Care" type="Surgical" nextStep="Medication review" owner="Dr. Rao" />
        <PlanCard title="Chronic Heart Failure" type="Cardiology" nextStep="Daily weight checks" owner="Dr. Patel" />
        <PlanCard title="Diabetes Management" type="Endocrinology" nextStep="Glucose monitoring" owner="Nurse Priya" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card-lg">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Plan Overview</p>
          <p className="text-sm text-gray-400 leading-relaxed">Build care plans for patients with integrated instructions for vitals review, medication adherence, and remote monitoring. This page is prepared to connect to treatment workflows and patient task lists.</p>
        </div>
        <div className="card-lg">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Workflow Status</p>
          <div className="space-y-3 text-sm text-gray-400">
            <p><span className="font-semibold text-gray-200">Active Plans:</span> 18</p>
            <p><span className="font-semibold text-gray-200">Pending Reviews:</span> 5</p>
            <p><span className="font-semibold text-gray-200">Due Today:</span> 7</p>
          </div>
        </div>
        <div className="card-lg bg-blue-950/20 border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <RiFileTextLine className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-bold text-white">Care Plan Guidance</p>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">Create patient-specific plans that align with digital twin insights. Use this shell to connect care pathways with predictive alerts and vitals monitoring.</p>
        </div>
      </div>
    </div>
  );
};

export default CarePlans;
