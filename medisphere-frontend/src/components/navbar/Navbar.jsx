// src/components/navbar/Navbar.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RiMenuLine, RiBellLine, RiSearchLine, RiLogoutBoxRLine,
  RiSettings3Line, RiRefreshLine, RiWifiLine,
} from 'react-icons/ri';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { Avatar } from '../common/Avatar';

const breadcrumbMap = {
  // ── Admin routes ──────────────────────────────────────────────
  '/admin/dashboard':             ['Admin',     'Dashboard'],
  '/admin/population-monitoring': ['Admin',     'Population Monitoring'],
  '/admin/model-management':      ['Admin',     'Model Management'],
  '/admin/reports':               ['Admin',     'Reports'],
  '/admin/system-monitoring':     ['Admin',     'System Monitoring'],
  '/admin/settings':              ['Admin',     'Settings'],
  '/admin/careplan-dashboard':    ['Admin',     'Care Plan Analytics'],
  '/admin/audit-logs':            ['Admin',     'System Audit Logs'],
  '/admin/fhir-sync':             ['Admin',     'FHIR Synchronization'],
  '/admin/operations':            ['Admin',     'Operations Dashboard'],
  '/admin/predictions-ops':       ['Admin',     'AI Model Operations'],
  '/admin/validation':            ['Admin',     'Clinical Validation'],
  '/admin/care-plans-overview':   ['Admin',     'Care Plans Overview'],
  // ── Doctor routes ─────────────────────────────────────────────
  '/doctor/dashboard':            ['Doctor',    'Dashboard'],
  '/doctor/workspace':            ['Doctor',    'Doctor Workspace'],
  '/doctor/command-center':       ['Doctor',    'Clinical Command Center'],
  '/doctor/monitoring':           ['Doctor',    'Monitoring'],
  '/doctor/patients':             ['Doctor',    'Patients'],
  '/doctor/patient-registration': ['Doctor',    'Patient Registration'],
  '/doctor/patient360':           ['Doctor',    'Patient 360'],
  '/doctor/health-twin':          ['Doctor',    'Health Twin'],
  '/doctor/vitals':               ['Doctor',    'Vitals Monitoring'],
  '/doctor/predictions':          ['Doctor',    'AI Predictions'],
  '/doctor/alert-history':        ['Doctor',    'Alert History'],
  '/doctor/population-monitoring':['Doctor',    'Population Monitoring'],
  '/doctor/careplans':            ['Doctor',    'Care Plans'],
  '/doctor/care-plans-overview':  ['Doctor',    'Care Plans Overview'],
  '/doctor/clinical-insights':    ['Doctor',    'Clinical Insights'],
  '/doctor/operations':           ['Doctor',    'Operations Dashboard'],
  '/doctor/validation':           ['Doctor',    'Clinical Validation'],
  '/doctor/fhir-sync':            ['Doctor',    'FHIR Synchronization'],
  '/doctor/reports':              ['Doctor',    'Reports'],
  // ── Patient routes ────────────────────────────────────────────
  '/patient/dashboard':           ['Patient',   'Dashboard'],
  '/patient/profile':             ['Patient',   'My Profile'],
  '/patient/health-twin':         ['Patient',   'Health Twin'],
  '/patient/vitals':              ['Patient',   'My Vitals'],
  '/patient/predictions':         ['Patient',   'AI Predictions'],
  '/patient/alerts':              ['Patient',   'My Alerts'],
  '/patient/reports':             ['Patient',   'My Reports'],
  '/patient/consent':             ['Patient',   'Consent Management'],
  '/patient/careplan':            ['Patient',   'My Care Plan'],
};

const systemAlerts = [
  { id: 1, text: 'Critical vitals detected — Review required', time: '2 min ago', dot: 'bg-red-500' },
  { id: 2, text: 'FHIR sync completed for latest patient batch', time: '15 min ago', dot: 'bg-green-500' },
  { id: 3, text: 'Consent expiring for 3 patients this week', time: '1 hr ago', dot: 'bg-yellow-500' },
];

export const Navbar = ({ onMenuClick }) => {
  const { keycloak } = useAuth();
  const userInfo = getUserInfo();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pathKey = Object.keys(breadcrumbMap)
    .filter((k) => location.pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  const [section, page] = breadcrumbMap[pathKey] || ['MediSphere', 'Dashboard'];

  const displayName = userInfo?.username || 'User';
  const displayEmail = userInfo?.email || '';
  const displayRole = userInfo?.roles?.[0] || '';

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const handleProfileNav = () => {
    // Navigate to role-appropriate profile route
    const path = location.pathname.startsWith('/patient') ? '/patient/profile'
      : location.pathname.startsWith('/admin') ? '/admin/settings'
      : '/doctor/dashboard';
    navigate(path);
    setShowProfile(false);
  };

  return (
    <>
      {/* Click-away overlay */}
      {(showAlerts || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowAlerts(false); setShowProfile(false); }} />
      )}

      <header className="h-16 bg-[#0D1424] border-b border-[#1F2937] flex items-center px-4 gap-3 sticky top-0 z-10 shadow-card-md">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-surface-2 transition-colors"
          id="mobile-menu-btn"
        >
          <RiMenuLine className="w-5 h-5" />
        </button>

        {/* Workspace Label */}
        <div className="hidden sm:flex flex-col justify-center min-w-0">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">{section}</p>
          <h1 className="text-sm font-bold text-white leading-tight truncate">{page}</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Kafka / Connection Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs font-semibold text-green-400">Kafka</span>
          </div>

          {/* FHIR Status */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <RiWifiLine className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">FHIR</span>
          </div>

          {/* Sync / Refresh button */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-[#1F2937] hover:bg-[#1F2937] transition-colors text-xs font-medium text-gray-300"
            title="Sync Platform"
          >
            <RiRefreshLine className="w-3.5 h-3.5" />
            Sync
          </button>

          {/* Search Button */}
          <button
            className="p-2 rounded-lg text-gray-400 hover:bg-surface-2 hover:text-white transition-colors"
            title="Quick Search"
            onClick={() => {
              const target = location.pathname.startsWith('/doctor') ? '/doctor/patients'
                : location.pathname.startsWith('/admin') ? '/admin/population-monitoring'
                : '/patient/dashboard';
              navigate(target);
            }}
          >
            <RiSearchLine className="w-4.5 h-4.5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              id="notification-bell"
              onClick={() => { setShowAlerts(!showAlerts); setShowProfile(false); }}
              className="relative p-2 rounded-lg text-gray-400 hover:bg-surface-2 hover:text-white transition-colors"
            >
              <RiBellLine className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showAlerts && (
              <div className="absolute right-0 top-12 w-80 bg-[#111827] rounded-xl shadow-card-lg border border-[#1F2937] z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">System Alerts</h3>
                  <span className="badge-red text-[10px]">3 active</span>
                </div>
                <div className="divide-y divide-[#1F2937]">
                  {systemAlerts.map((a) => (
                    <div key={a.id} className="px-4 py-3 hover:bg-surface-2 cursor-pointer flex gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.dot}`} />
                      <div>
                        <p className="text-xs text-gray-200 font-medium leading-snug">{a.text}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-[#1F2937] text-center">
                  <button
                    onClick={() => {
                      const target = location.pathname.startsWith('/doctor') ? '/doctor/alert-history'
                        : location.pathname.startsWith('/patient') ? '/patient/alerts'
                        : '/admin/system-monitoring';
                      navigate(target);
                      setShowAlerts(false);
                    }}
                    className="text-xs text-blue-400 font-medium hover:text-blue-300"
                  >
                    View Alerts →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              id="profile-menu-btn"
              onClick={() => { setShowProfile(!showProfile); setShowAlerts(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-2 transition-colors border border-transparent hover:border-[#1F2937]"
            >
              <Avatar name={displayName} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-white leading-none">{displayName}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">{displayRole}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-52 bg-[#111827] rounded-xl shadow-card-lg border border-[#1F2937] z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-[#1F2937]">
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs text-gray-400">{displayEmail}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleProfileNav}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-surface-2 hover:text-white"
                  >
                    <RiSettings3Line className="w-4 h-4" /> Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 mt-0.5"
                  >
                    <RiLogoutBoxRLine className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
