import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { hasRole } from './auth';

const RoleGuard = ({ children, allowedRoles }) => {
  const { authenticated, keycloak } = useAuth();

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default RoleGuard;
