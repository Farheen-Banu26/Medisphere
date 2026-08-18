// src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
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

// ── Shared / Operational pages (mounted under multiple roles, zero duplication)
import Monitoring from './pages/Monitoring/Monitoring';
import PopulationMonitoring from './pages/PopulationMonitoring/PopulationMonitoring';
import AlertHistory from './pages/AlertHistory/AlertHistory';
import PredictionDashboard from './pages/Predictions/PredictionDashboard';
import Reports from './pages/Reports/Reports';
import DigitalTwin from './pages/DigitalTwin/DigitalTwin';
import VitalsMonitoring from './pages/Vitals/VitalsMonitoring';
import Dashboard from './pages/Dashboard/Dashboard';
import Operations from './pages/Operations/Operations';
import Validation from './pages/Validation/Validation';
import FhirSync from './pages/FHIR/FhirSync';
import CarePlans from './pages/CarePlans/CarePlans';

// ── Doctor-specific pages ─────────────────────────────────────────────────────
import PatientList from './pages/Patients/PatientList';
import PatientDetails from './pages/Patients/PatientDetails';
import Patient360 from './pages/Patient360/Patient360';
import DoctorCarePlans from './pages/CarePlans/DoctorCarePlans';
import ClinicalInsights from './pages/ClinicalInsights/ClinicalInsights';
import DoctorWorkspace from './pages/DoctorWorkspace/DoctorWorkspace';
import PatientRegistration from './pages/PatientRegistration/PatientRegistration';

// ── Admin-specific pages ──────────────────────────────────────────────────────
import ModelManagement from './pages/ModelManagement/ModelManagement';
import Settings from './pages/Settings/Settings';
import AdminCarePlanDashboard from './pages/CarePlans/AdminCarePlanDashboard';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import Predictions from './pages/Predictions/Predictions';
import DoctorsHospitals from './pages/Admin/DoctorsHospitals';

// ── Patient-specific pages ────────────────────────────────────────────────────
import ConsentManagement from './pages/Consent/ConsentManagement';
import Profile from './pages/Profile/Profile';
import PatientCarePlan from './pages/CarePlans/PatientCarePlan';

export const router = createBrowserRouter([
  // ── Public ─────────────────────────────────────────────────────────────────
  {
    path: '/',
    element: <LandingPage />,
  },

  // ── Legacy / Direct Shortcuts Redirects ────────────────────────────────────
  { path: '/patients',             element: <Navigate to="/doctor/patients" replace /> },
  { path: '/patient360',            element: <Navigate to="/doctor/patient360" replace /> },
  { path: '/vitals',                element: <Navigate to="/doctor/vitals" replace /> },
  { path: '/digital-twin',          element: <Navigate to="/doctor/health-twin" replace /> },
  { path: '/predictions',           element: <Navigate to="/doctor/predictions" replace /> },
  { path: '/clinical-insights',     element: <Navigate to="/doctor/clinical-insights" replace /> },
  { path: '/operations',            element: <Navigate to="/doctor/operations" replace /> },
  { path: '/fhir-sync',             element: <Navigate to="/admin/fhir-sync" replace /> },
  { path: '/validation',            element: <Navigate to="/doctor/validation" replace /> },
  { path: '/audit',                 element: <Navigate to="/admin/audit-logs" replace /> },
  { path: '/audit-logs',            element: <Navigate to="/admin/audit-logs" replace /> },
  { path: '/doctor-workspace',     element: <Navigate to="/doctor/workspace" replace /> },
  { path: '/patient-registration',  element: <Navigate to="/doctor/patient-registration" replace /> },

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
      { path: '/admin/dashboard',              element: <AdminDashboard />          },
      { path: '/admin/doctors-hospitals',      element: <DoctorsHospitals />        },
      { path: '/admin/population-monitoring',  element: <PopulationMonitoring />     },
      { path: '/admin/model-management',       element: <ModelManagement />         },
      { path: '/admin/reports',                element: <Reports />                 },
      { path: '/admin/system-monitoring',      element: <Monitoring />              },
      { path: '/admin/settings',               element: <Settings />                },
      { path: '/admin/careplan-dashboard',    element: <AdminCarePlanDashboard />     },
      { path: '/admin/audit-logs',            element: <AuditLogs />               },
      { path: '/admin/fhir-sync',             element: <FhirSync />                },
      { path: '/admin/operations',            element: <Operations />              },
      { path: '/admin/predictions-ops',       element: <Predictions />             },
      { path: '/admin/validation',            element: <Validation />              },
      { path: '/admin/care-plans-overview',   element: <CarePlans />               },
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
      { path: '/doctor/dashboard',             element: <DoctorDashboard />          },
      { path: '/doctor/workspace',             element: <DoctorWorkspace />          },
      { path: '/doctor/command-center',       element: <Dashboard />                },
      { path: '/doctor/monitoring',            element: <Monitoring />               },
      { path: '/doctor/patients',              element: <PatientList />              },
      { path: '/doctor/patient-registration', element: <PatientRegistration />     },
      { path: '/doctor/patients/:patientId',   element: <PatientDetails />           },
      { path: '/doctor/patient360',            element: <Patient360 />               },
      { path: '/doctor/health-twin',           element: <DigitalTwin />              },
      { path: '/doctor/vitals',                element: <VitalsMonitoring />         },
      { path: '/doctor/predictions',           element: <PredictionDashboard />      },
      { path: '/doctor/alert-history',         element: <AlertHistory />             },
      { path: '/doctor/population-monitoring', element: <PopulationMonitoring />     },
      { path: '/doctor/careplans',             element: <DoctorCarePlans />          },
      { path: '/doctor/care-plans-overview',   element: <CarePlans />               },
      { path: '/doctor/clinical-insights',     element: <ClinicalInsights />         },
      { path: '/doctor/reports',               element: <Reports />                  },
      { path: '/doctor/validation',            element: <Validation />               },
      { path: '/doctor/operations',            element: <Operations />               },
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
      { path: '/patient/careplan',    element: <PatientCarePlan />     },
    ],
  },

  // ── Catch-all ───────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);

