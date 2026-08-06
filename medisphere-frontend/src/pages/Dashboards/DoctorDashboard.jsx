import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';

const DoctorDashboard = () => {
  const { keycloak } = useAuth();
  const userInfo = getUserInfo();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Welcome Doctor</h1>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
        <div>
          <span className="font-semibold text-gray-700">Logged-in username: </span>
          <span className="text-gray-900">{userInfo?.username}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">User email: </span>
          <span className="text-gray-900">{userInfo?.email || 'N/A'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Assigned roles: </span>
          <span className="text-gray-900">{userInfo?.roles?.join(', ')}</span>
        </div>
      </div>

      <button
        onClick={() => keycloak.logout()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
      >
        Logout
      </button>
    </div>
  );
};

export default DoctorDashboard;
