import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import { RiStethoscopeLine, RiHospitalLine, RiUserHeartLine, RiShieldCheckLine, RiRefreshLine } from 'react-icons/ri';

const DoctorsHospitals = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      const res = await patientService.getAllPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load patient assignment data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, []);

  // Aggregate Doctor directory dynamically from patients
  const doctorMap = {
    'D001': { doctorId: 'D001', doctorName: 'Dr. Sarah Jenkins', specialty: 'Cardiology', hospitalId: 'HOSP001', hospitalName: 'MediSphere General Hospital', patientCount: 0 },
    'D002': { doctorId: 'D002', doctorName: 'Dr. Robert Smith', specialty: 'Neurology', hospitalId: 'HOSP002', hospitalName: 'St. Jude Medical Center', patientCount: 0 },
    'D003': { doctorId: 'D003', doctorName: 'Dr. Emily Jones', specialty: 'Pulmonology', hospitalId: 'HOSP003', hospitalName: 'City Health Institute', patientCount: 0 },
    'D004': { doctorId: 'D004', doctorName: 'Dr. Rajesh Patel', specialty: 'General Medicine', hospitalId: 'HOSP001', hospitalName: 'MediSphere General Hospital', patientCount: 0 },
    'D005': { doctorId: 'D005', doctorName: 'Dr. Michael Chen', specialty: 'Nephrology', hospitalId: 'HOSP002', hospitalName: 'St. Jude Medical Center', patientCount: 0 },
  };

  patients.forEach(p => {
    const docId = p.assignedDoctorId || 'D001';
    if (!doctorMap[docId]) {
      doctorMap[docId] = {
        doctorId: docId,
        doctorName: p.assignedDoctorName || `Dr. ${docId}`,
        specialty: p.specialty || 'General',
        hospitalId: p.hospitalId || 'HOSP001',
        hospitalName: p.hospitalName || 'MediSphere General Hospital',
        patientCount: 0
      };
    }
    doctorMap[docId].patientCount += 1;
  });

  const doctorsList = Object.values(doctorMap);

  // Aggregate Hospital directory dynamically
  const hospitalMap = {
    'HOSP001': { hospitalId: 'HOSP001', hospitalName: 'MediSphere General Hospital', patientCount: 0, doctors: new Set(['Dr. Sarah Jenkins', 'Dr. Rajesh Patel']) },
    'HOSP002': { hospitalId: 'HOSP002', hospitalName: 'St. Jude Medical Center', patientCount: 0, doctors: new Set(['Dr. Robert Smith', 'Dr. Michael Chen']) },
    'HOSP003': { hospitalId: 'HOSP003', hospitalName: 'City Health Institute', patientCount: 0, doctors: new Set(['Dr. Emily Jones']) },
  };

  patients.forEach(p => {
    const hospId = p.hospitalId || 'HOSP001';
    if (!hospitalMap[hospId]) {
      hospitalMap[hospId] = {
        hospitalId: hospId,
        hospitalName: p.hospitalName || 'MediSphere Healthcare',
        patientCount: 0,
        doctors: new Set()
      };
    }
    hospitalMap[hospId].patientCount += 1;
    if (p.assignedDoctorName) hospitalMap[hospId].doctors.add(p.assignedDoctorName);
  });

  const hospitalsList = Object.values(hospitalMap);

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#0B1120] min-h-screen text-gray-100">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <RiHospitalLine className="text-blue-400" /> Doctors & Hospitals Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">System-wide directory of healthcare facilities, medical staff, and active patient allocations</p>
        </div>
        <button
          onClick={fetchAssignmentData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh Directory
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
            <RiStethoscopeLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Physicians</p>
            <p className="text-2xl font-bold text-white mt-0.5">{doctorsList.length}</p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
            <RiHospitalLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Hospitals</p>
            <p className="text-2xl font-bold text-white mt-0.5">{hospitalsList.length}</p>
          </div>
        </div>

        <div className="bg-[#131C31] border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
            <RiUserHeartLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Patients Assigned</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{patients.length}</p>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-[#131C31] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <RiStethoscopeLine className="text-blue-400" /> Physician Roster & Assignments
        </h2>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading doctors roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0B1120] text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Doctor ID</th>
                  <th className="px-4 py-3">Physician Name</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Hospital Facility</th>
                  <th className="px-4 py-3 text-right">Assigned Patients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {doctorsList.map(doc => (
                  <tr key={doc.doctorId} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-400 font-bold">{doc.doctorId}</td>
                    <td className="px-4 py-3.5 font-medium text-white">{doc.doctorName}</td>
                    <td className="px-4 py-3.5 text-xs text-blue-300 font-semibold">{doc.specialty}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">{doc.hospitalName}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">{doc.patientCount} patients</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hospitals Table */}
      <div className="bg-[#131C31] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <RiHospitalLine className="text-purple-400" /> Healthcare Facilities
        </h2>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading hospital details...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0B1120] text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Hospital ID</th>
                  <th className="px-4 py-3">Hospital Name</th>
                  <th className="px-4 py-3">Associated Physicians</th>
                  <th className="px-4 py-3 text-right">Total Patients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {hospitalsList.map(hosp => (
                  <tr key={hosp.hospitalId} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-purple-400 font-bold">{hosp.hospitalId}</td>
                    <td className="px-4 py-3.5 font-medium text-white">{hosp.hospitalName}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">{Array.from(hosp.doctors).join(', ') || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-purple-300">{hosp.patientCount} patients</td>
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

export default DoctorsHospitals;
