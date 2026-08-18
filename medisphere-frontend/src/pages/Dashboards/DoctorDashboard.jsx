import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { patientService } from '../../services/patientService';
import { 
  RiHospitalLine, RiUserHeartLine, RiStethoscopeLine, 
  RiAlertLine, RiHeartPulseLine, RiArrowRightSLine, RiShieldCheckLine
} from 'react-icons/ri';

const DoctorDashboard = () => {
  const { keycloak } = useAuth();
  const userInfo = getUserInfo();
  const navigate = useNavigate();

  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctorData = async () => {
      setLoading(true);
      try {
        const username = userInfo?.username || 'doctor';
        const res = await patientService.getPatientsByDoctor(username);
        setAssignedPatients(res.data || []);
      } catch (err) {
        console.error('Failed to load doctor assigned patients', err);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorData();
  }, [userInfo?.username]);

  const doctorName = userInfo?.username === 'doctor' ? 'Dr. Sarah Jenkins' : `Dr. ${userInfo?.username || 'Doctor'}`;
  const specialty = 'Cardiology & Cardiovascular Risk';
  const hospital = 'MediSphere General Hospital';

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#0B1120] min-h-screen text-gray-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400 text-2xl shadow-glow-blue">
            <RiStethoscopeLine />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{doctorName}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-300 mt-1">
              <span className="flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                <RiStethoscopeLine className="text-blue-400" /> {specialty}
              </span>
              <span className="flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 text-purple-300">
                <RiHospitalLine className="text-purple-400" /> {hospital}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/workspace')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            Open Clinical Workspace <RiArrowRightSLine />
          </button>
          <button
            onClick={() => keycloak.logout()}
            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-xl font-medium text-sm transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
            <RiUserHeartLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Patients</p>
            <p className="text-2xl font-bold text-white mt-0.5">{assignedPatients.length}</p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl">
            <RiAlertLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">High CVD Risk</p>
            <p className="text-2xl font-bold text-red-400 mt-0.5">
              {assignedPatients.filter(p => (p.condition || '').toLowerCase().includes('coronary') || (p.condition || '').toLowerCase().includes('hypertension') || (p.condition || '').toLowerCase().includes('risk')).length}
            </p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
            <RiHeartPulseLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Monitoring</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{assignedPatients.length}</p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
            <RiShieldCheckLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</p>
            <p className="text-sm font-bold text-purple-300 mt-0.5">Cardiovascular Center</p>
          </div>
        </div>
      </div>

      {/* My Assigned Patients Table */}
      <div className="bg-[#131C31] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">My Assigned Patients</h2>
            <p className="text-xs text-gray-400 mt-0.5">Scoped clinical view for {doctorName} ({specialty})</p>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View All Patients <RiArrowRightSLine />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading assigned patients...</div>
        ) : assignedPatients.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No patients currently assigned to this doctor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0B1120] text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Clinical Condition</th>
                  <th className="px-4 py-3">Hospital</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {assignedPatients.slice(0, 10).map((patient) => (
                  <tr key={patient.patientId || patient.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-400 font-bold">
                      {patient.patientId || patient.id}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-white">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {patient.gender}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-amber-300 font-medium">
                      {patient.condition || 'General Evaluation'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {patient.hospitalName || 'MediSphere General'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-blue-300">
                      {patient.specialty || 'Cardiology'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.patientId || patient.id}`)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all"
                      >
                        View Health Twin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
