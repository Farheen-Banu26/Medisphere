// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import RoleGuard from './auth/RoleGuard';
import AdminLayout from './layouts/AdminLayout';
import DoctorLayout from './layouts/DoctorLayout';
import PatientLayout from './layouts/PatientLayout';
import NotFound from './pages/NotFound/NotFound';

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';

// ── Dashboards ────────────────────────────────────────────────────────────────
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import DoctorDashboard from './pages/Dashboards/DoctorDashboard';
import PatientDashboard from './pages/Dashboards/PatientDashboard';

// ── Shared pages (mounted under multiple roles, zero duplication) ─────────────
import Monitoring from './pages/Monitoring/Monitoring';
import PopulationMonitoring from './pages/PopulationMonitoring/PopulationMonitoring';
import AlertHistory from './pages/AlertHistory/AlertHistory';
import PredictionDashboard from './pages/Predictions/PredictionDashboard';
import Reports from './pages/Reports/Reports';
import DigitalTwin from './pages/DigitalTwin/DigitalTwin';
import VitalsMonitoring from './pages/Vitals/VitalsMonitoring';

// ── Doctor-specific pages ─────────────────────────────────────────────────────
import PatientList from './pages/Patients/PatientList';
import PatientDetails from './pages/Patients/PatientDetails';
import Patient360 from './pages/Patient360/Patient360';
import CarePlans from './pages/CarePlans/CarePlans';
import ClinicalInsights from './pages/ClinicalInsights/ClinicalInsights';

// ── Admin-specific pages ──────────────────────────────────────────────────────
import ModelManagement from './pages/ModelManagement/ModelManagement';
import Settings from './pages/Settings/Settings';

// ── Patient-specific pages ────────────────────────────────────────────────────
import ConsentManagement from './pages/Consent/ConsentManagement';
import Profile from './pages/Profile/Profile';

export const router = createBrowserRouter([
  // ── Public ─────────────────────────────────────────────────────────────────
  {
    path: '/',
    element: <LandingPage />,
  },

  // ── Admin routes ────────────────────────────────────────────────────────────
  // RoleGuard wraps AdminLayout; unauthorized users are redirected to '/'.
  // AdminLayout renders Layout (with role="ADMIN") which provides <Outlet>.
  {
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      { path: '/admin/dashboard',              element: <AdminDashboard />      },
      { path: '/admin/population-monitoring',  element: <PopulationMonitoring /> },
      { path: '/admin/model-management',       element: <ModelManagement />     },
      { path: '/admin/reports',                element: <Reports />             },
      { path: '/admin/system-monitoring',      element: <Monitoring />          },
      { path: '/admin/settings',               element: <Settings />            },
    ],
  },

  // ── Doctor routes ───────────────────────────────────────────────────────────
  {
    element: (
      <RoleGuard allowedRoles={['DOCTOR']}>
        <DoctorLayout />
      </RoleGuard>
    ),
    children: [
      { path: '/doctor/dashboard',             element: <DoctorDashboard />      },
      { path: '/doctor/monitoring',            element: <Monitoring />           },
      { path: '/doctor/patients',              element: <PatientList />          },
      { path: '/doctor/patients/:patientId',   element: <PatientDetails />       },
      { path: '/doctor/patient360',            element: <Patient360 />           },
      { path: '/doctor/health-twin',           element: <DigitalTwin />          },
      { path: '/doctor/vitals',                element: <VitalsMonitoring />     },
      { path: '/doctor/predictions',           element: <PredictionDashboard />  },
      { path: '/doctor/alert-history',         element: <AlertHistory />         },
      { path: '/doctor/population-monitoring', element: <PopulationMonitoring /> },
      { path: '/doctor/careplans',             element: <CarePlans />            },
      { path: '/doctor/clinical-insights',     element: <ClinicalInsights />     },
      { path: '/doctor/reports',               element: <Reports />              },
    ],
  },

  // ── Patient routes ──────────────────────────────────────────────────────────
  {
    element: (
      <RoleGuard allowedRoles={['PATIENT']}>
        <PatientLayout />
      </RoleGuard>
    ),
    children: [
      { path: '/patient/dashboard',   element: <PatientDashboard />    },
      { path: '/patient/profile',     element: <Profile />             },
      { path: '/patient/health-twin', element: <DigitalTwin />         },
      { path: '/patient/vitals',      element: <VitalsMonitoring />    },
      { path: '/patient/predictions', element: <PredictionDashboard /> },
      { path: '/patient/alerts',      element: <AlertHistory />        },
      { path: '/patient/reports',     element: <Reports />             },
      { path: '/patient/consent',     element: <ConsentManagement />   },
    ],
  },

  // ── Catch-all ───────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);
