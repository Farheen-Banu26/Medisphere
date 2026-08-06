import { useState } from 'react';
import { RiSettings3Line, RiShieldCheckLine, RiBellLine, RiUserLine } from 'react-icons/ri';

const SettingCard = ({ title, description, children }) => (
  <div className="card-lg p-5">
    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">{title}</h2>
    <p className="text-sm text-gray-400 mb-5">{description}</p>
    <div className="space-y-4">{children}</div>
  </div>
);

export const Settings = () => {
  const [timezone, setTimezone] = useState('IST');
  const [defaultPage, setDefaultPage] = useState('Dashboard');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <RiSettings3Line className="w-6 h-6 text-blue-400" /> Platform Settings
        </h1>
        <p className="page-subtitle">Application preferences, notifications, and default dashboard settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SettingCard title="General Preferences" description="Set your default landing page and regional settings."> 
          <div>
            <label className="form-label">Default Landing Page</label>
            <select className="form-select w-full" value={defaultPage} onChange={(e) => setDefaultPage(e.target.value)}>
              <option>Dashboard</option>
              <option>Patients</option>
              <option>Monitoring</option>
              <option>AI Predictions</option>
            </select>
          </div>
          <div>
            <label className="form-label">Timezone</label>
            <select className="form-select w-full" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="UTC">UTC</option>
              <option value="EST">EST</option>
              <option value="IST">IST</option>
            </select>
          </div>
        </SettingCard>

        <SettingCard title="Notifications" description="Control platform alert delivery and system notifications.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white">System Notifications</p>
              <p className="text-xs text-gray-500">Enable alerts for key clinical events.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-[#1F2937] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </SettingCard>

        <SettingCard title="Security" description="Track session and authentication policy settings.">
          <div className="flex items-center gap-3">
            <RiShieldCheckLine className="w-5 h-5 text-green-400" />
            <p className="text-sm text-gray-300">Managed externally through Keycloak identity provider.</p>
          </div>
          <div className="flex items-center gap-3">
            <RiBellLine className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-300">Audit logging and security notifications are enabled.</p>
          </div>
        </SettingCard>
      </div>

      <div className="card border border-blue-500/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <RiUserLine className="w-5 h-5 text-blue-400" />
          <p className="text-sm font-bold text-white">Platform Policies</p>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">This page is ready to connect to backend user preferences, audit configuration, and administrative policy management.</p>
      </div>
    </div>
  );
};

export default Settings;
