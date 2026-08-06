// src/components/sidebar/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiDashboardLine, RiUserLine, RiRobot2Line,
  RiHeartPulseLine, RiShieldCheckLine, RiExchangeLine,
  RiFileTextLine, RiAccountCircleLine, RiHospitalLine,
  RiCloseLine, RiMenuFoldLine, RiMenuUnfoldLine, RiAddCircleLine,
  RiStethoscopeLine,
  RiBarChartLine, RiPulseLine, RiClipboardLine, RiTimeLine,
  RiSettings3Line, RiGitBranchLine, RiAlertLine,
} from 'react-icons/ri';

// ─── Admin navigation ──────────────────────────────────────────────────────────
const adminNavItems = [
  { section: 'WORKSPACE' },
  { path: '/admin/dashboard',              label: 'Dashboard',            icon: RiDashboardLine    },
  { section: 'ANALYTICS' },
  { path: '/admin/population-monitoring',  label: 'Population Monitoring', icon: RiHospitalLine    },
  { path: '/admin/reports',                label: 'Reports',              icon: RiFileTextLine     },
  { section: 'AI' },
  { path: '/admin/model-management',       label: 'Model Management',     icon: RiGitBranchLine    },
  { section: 'OPERATIONS' },
  { path: '/admin/system-monitoring',      label: 'System Monitoring',    icon: RiPulseLine        },
  { section: 'ACCOUNT' },
  { path: '/admin/settings',               label: 'Settings',             icon: RiSettings3Line   },
];

// ─── Doctor navigation ─────────────────────────────────────────────────────────
const doctorNavItems = [
  { section: 'WORKSPACE' },
  { path: '/doctor/dashboard',             label: 'Dashboard',            icon: RiDashboardLine    },
  { section: 'PATIENTS' },
  { path: '/doctor/patients',              label: 'Patients',             icon: RiUserLine         },
  { path: '/doctor/patient360',            label: 'Patient 360',          icon: RiHeartPulseLine   },
  { section: 'CLINICAL' },
  { path: '/doctor/health-twin',           label: 'Health Twin',          icon: RiRobot2Line       },
  { path: '/doctor/vitals',                label: 'Vitals',               icon: RiHeartPulseLine   },
  { path: '/doctor/careplans',             label: 'Care Plans',           icon: RiClipboardLine    },
  { path: '/doctor/clinical-insights',     label: 'Clinical Insights',    icon: RiStethoscopeLine  },
  { section: 'AI & ANALYTICS' },
  { path: '/doctor/predictions',           label: 'AI Predictions',       icon: RiBarChartLine     },
  { path: '/doctor/alert-history',         label: 'Alert History',        icon: RiTimeLine         },
  { path: '/doctor/monitoring',            label: 'Monitoring',           icon: RiPulseLine        },
  { path: '/doctor/population-monitoring', label: 'Population Monitoring', icon: RiHospitalLine   },
  { path: '/doctor/reports',               label: 'Reports',              icon: RiFileTextLine     },
];

// ─── Patient navigation ────────────────────────────────────────────────────────
const patientNavItems = [
  { section: 'MY HEALTH' },
  { path: '/patient/dashboard',  label: 'Dashboard',      icon: RiDashboardLine   },
  { path: '/patient/health-twin', label: 'Health Twin',   icon: RiRobot2Line      },
  { path: '/patient/vitals',     label: 'Vitals',          icon: RiHeartPulseLine  },
  { path: '/patient/predictions', label: 'AI Predictions', icon: RiBarChartLine   },
  { path: '/patient/alerts',     label: 'Alerts',          icon: RiAlertLine       },
  { section: 'INFORMATION' },
  { path: '/patient/reports',    label: 'Reports',         icon: RiFileTextLine    },
  { path: '/patient/consent',    label: 'Consent',         icon: RiShieldCheckLine },
  { section: 'ACCOUNT' },
  { path: '/patient/profile',    label: 'Profile',         icon: RiAccountCircleLine },
];

const NAV_MAP = {
  ADMIN:   adminNavItems,
  DOCTOR:  doctorNavItems,
  PATIENT: patientNavItems,
};

export const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse, role }) => {
  const location = useLocation();
  const navItems = NAV_MAP[role] || adminNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-[#0D1424] border-r border-[#1F2937]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-[72px]' : 'w-60'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1F2937] shrink-0 overflow-hidden">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shrink-0 shadow-glow-blue">
            <RiHospitalLine className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-none whitespace-nowrap">MediSphere</p>
              <p className="text-[10px] text-blue-400 mt-0.5 whitespace-nowrap">Digital Twin Platform</p>
            </div>
          )}
          {/* Close on mobile */}
          <button onClick={onClose} className="ml-auto lg:hidden text-gray-500 hover:text-gray-300">
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scroll">
          {navItems.map((item, idx) => {
            if (item.section) {
              if (collapsed) return null;
              return (
                <p key={idx} className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 pt-5 pb-1 whitespace-nowrap">
                  {item.section}
                </p>
              );
            }

            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5
                  transition-all duration-150 cursor-pointer overflow-hidden
                  ${isActive ? 'sidebar-item-active' : 'sidebar-item'}
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
                )}
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[#1F2937] p-3 flex flex-col gap-2 shrink-0">
          {!collapsed && role === 'DOCTOR' && (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-blue-400
                         bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
            >
              <RiAddCircleLine className="w-4 h-4 shrink-0" />
              Quick Add Patient
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg
                       text-gray-500 hover:bg-surface-2 hover:text-gray-300 transition-colors text-xs"
          >
            {collapsed ? <RiMenuUnfoldLine className="w-4 h-4" /> : <><RiMenuFoldLine className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
