import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getPrimaryRoleRedirect } from '../auth/auth';
import { FiActivity } from 'react-icons/fi';

const LandingPage = () => {
  const { authenticated, keycloak } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate(getPrimaryRoleRedirect(), { replace: true });
    }
  }, [authenticated, navigate]);

  const handleLogin = () => {
    keycloak.login();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center space-y-8 border border-gray-100">
        
        <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <FiActivity size={32} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            MediSphere
          </h1>
          <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">
            AI Cognitive Digital Health Twin Platform
          </p>
        </div>

        <div className="text-sm text-gray-400 font-mono tracking-wider space-x-2">
          <span>FHIR</span>
          <span>&bull;</span>
          <span>Kafka</span>
          <span>&bull;</span>
          <span>AI</span>
          <span>&bull;</span>
          <span>TensorFlow</span>
        </div>

        <p className="text-gray-600 text-base leading-relaxed pt-4">
          Welcome to the future of healthcare. Experience real-time patient monitoring, 
          AI-driven predictive analytics, and seamless digital twin integration.
        </p>

        <div className="pt-6">
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Login with MediSphere
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default LandingPage;
