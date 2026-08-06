import keycloak from './keycloak';

export const extractRoles = () => {
  if (!keycloak.tokenParsed) return [];
  return keycloak.tokenParsed.realm_access?.roles || [];
};

export const hasRole = (roles) => {
  const userRoles = extractRoles();
  return roles.some(role => userRoles.includes(role));
};

export const getPrimaryRoleRedirect = () => {
  const userRoles = extractRoles();
  if (userRoles.includes('ADMIN')) return '/admin/dashboard';
  if (userRoles.includes('DOCTOR')) return '/doctor/dashboard';
  if (userRoles.includes('PATIENT')) return '/patient/dashboard';
  return '/'; // Fallback
};

export const getUserInfo = () => {
  if (!keycloak.tokenParsed) return null;
  return {
    username: keycloak.tokenParsed.preferred_username,
    email: keycloak.tokenParsed.email,
    roles: extractRoles()
  };
};
