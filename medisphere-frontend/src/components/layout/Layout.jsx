// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../sidebar/Sidebar';
import { Navbar } from '../navbar/Navbar';
import { NotificationToast } from '../common/NotificationToast';

export const Layout = ({ role }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background text-gray-200 overflow-hidden">
      <Sidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((p) => !p)}
        role={role}
      />

      {/* Main content area shifts right by sidebar width */}
      <div
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
        }`}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6">
          <div className="max-w-screen-2xl mx-auto animate-slide-up">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-[#1F2937] bg-[#0D1424] px-6 py-2.5">
          <p className="text-[10px] text-gray-600 text-center">
            © 2026 MediSphere Healthcare Digital Twin Platform · Built on FHIR R4 · Kafka-Powered
          </p>
        </footer>
      </div>

      <NotificationToast />
    </div>
  );
};

export default Layout;
