import React, { createContext, useContext, useState, useEffect } from 'react';
import keycloak, { initKeycloak } from './keycloak';
import Spinner from '../components/common/Spinner';

const AuthContext = createContext({
  keycloak,
  authenticated: false,
  error: null
});

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // initKeycloak() is idempotent — returns the same promise on repeated calls.
    // This is safe under React StrictMode which mounts effects twice in dev.
    initKeycloak()
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);
        if (keycloak.token) {
          localStorage.setItem('medisphere_token', keycloak.token);
        }

        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30).then(() => {
            if (keycloak.token) {
              localStorage.setItem('medisphere_token', keycloak.token);
            }
          }).catch(() => {
            console.error('Failed to refresh token');
            keycloak.logout();
          });
        };
      })
      .catch((err) => {
        console.error('Keycloak initialization failed', err);
        setError('Keycloak unavailable');
        setInitialized(true);
      });

    return () => {
      keycloak.onTokenExpired = null;
    };
  }, []);

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
        <p className="text-gray-700">{error}</p>
        <p className="text-sm text-gray-500">
          Keycloak may be offline. You can still browse the landing page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ keycloak, authenticated, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
