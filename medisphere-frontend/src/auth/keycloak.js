import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'medisphere',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'medisphere-frontend',
});

// Module-level promise so init() is only ever called ONCE,
// even when React StrictMode mounts effects twice.
let _initPromise = null;

export function initKeycloak() {
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = keycloak
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      return authenticated;
    })
    .catch((err) => {
      // Reset so a manual retry (page reload) can try again.
      _initPromise = null;
      return Promise.reject(err);
    });

  return _initPromise;
}

export default keycloak;
