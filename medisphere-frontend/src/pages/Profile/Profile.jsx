// src/pages/Profile/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { getUserInfo } from '../../auth/auth';
import { 
  RiUserLine, RiMailLine, RiShieldUserLine, RiSettings3Line,
  RiKey2Line, RiNotification3Line, RiHospitalLine, RiLogoutBoxRLine
} from 'react-icons/ri';

export const Profile = () => {
  const { keycloak } = useAuth();
  const userInfo = getUserInfo();

  // Derive profile from Keycloak token; fall back to defaults when token is unavailable
  const profileUser = {
    name: userInfo?.username || 'Dr. Sarah Jenkins',
    email: userInfo?.email || 's.jenkins@medisphere.com',
    role: userInfo?.roles?.[0] || 'Chief Medical Officer',
    department: 'Cardiology',
    hospital: 'General Hospital',
    id: userInfo?.username ? `USR-${userInfo.username.slice(0, 4).toUpperCase()}` : 'DOC-8821',
  };

  const handleLogout = () => keycloak.logout({ redirectUri: window.location.origin });

  const [activeTab, setActiveTab] = useState('details');

  const Avatar = ({ name }) => {
    const initials = name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?';
    return (
      <div className="w-20 h-20 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold text-blue-300">{initials}</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="card-lg bg-gradient-to-r from-blue-900/40 to-surface border border-blue-500/20">
         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar name={profileUser.name} />
            <div className="text-center sm:text-left flex-1">
               <h1 className="text-3xl font-black text-white">{profileUser.name}</h1>
               <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mt-1">{profileUser.role}</p>
               
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs font-semibold text-gray-400">
                 <span className="flex items-center gap-1.5"><RiHospitalLine className="w-4 h-4 text-gray-500" /> {profileUser.hospital}</span>
                 <span className="flex items-center gap-1.5"><RiShieldUserLine className="w-4 h-4 text-gray-500" /> {profileUser.department}</span>
                 <span className="flex items-center gap-1.5"><RiMailLine className="w-4 h-4 text-gray-500" /> {profileUser.email}</span>
               </div>
            </div>
            <button onClick={handleLogout} className="btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10 mt-4 sm:mt-0">
               <RiLogoutBoxRLine className="w-4 h-4" /> Sign Out
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <div className="card p-2 md:col-span-1 space-y-1 h-fit">
           <button 
             onClick={() => setActiveTab('details')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-surface-2'}`}
           >
             <RiUserLine className="w-4 h-4" /> Personal Details
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'security' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-surface-2'}`}
           >
             <RiKey2Line className="w-4 h-4" /> Security
           </button>
           <button 
             onClick={() => setActiveTab('notifications')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-surface-2'}`}
           >
             <RiNotification3Line className="w-4 h-4" /> Notifications
           </button>
           <button 
             onClick={() => setActiveTab('preferences')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'preferences' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-surface-2'}`}
           >
             <RiSettings3Line className="w-4 h-4" /> Preferences
           </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {activeTab === 'details' && (
            <div className="card-lg space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-[#1F2937] pb-3 uppercase tracking-widest">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div>
                   <label className="form-label">Full Name</label>
                   <input type="text" className="form-input bg-surface-2 opacity-70" defaultValue={profileUser.name} readOnly />
                 </div>
                 <div>
                   <label className="form-label">Provider ID</label>
                   <input type="text" className="form-input bg-surface-2 opacity-70 font-mono" defaultValue={profileUser.id} readOnly />
                 </div>
                 <div>
                   <label className="form-label">Email Address</label>
                   <input type="email" className="form-input bg-surface-2 opacity-70" defaultValue={profileUser.email} readOnly />
                 </div>
                 <div>
                   <label className="form-label">Primary Role</label>
                   <input type="text" className="form-input bg-surface-2 opacity-70" defaultValue={profileUser.role} readOnly />
                 </div>
                 <div className="sm:col-span-2">
                   <label className="form-label">Hospital Affiliation</label>
                   <input type="text" className="form-input bg-surface-2 opacity-70" defaultValue={profileUser.hospital} readOnly />
                 </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Profile details are managed via Keycloak Identity Provider. Please contact IT to request changes.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-lg space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-[#1F2937] pb-3 uppercase tracking-widest">Security Settings</h2>
              
              <div className="flex items-center justify-between py-2">
                 <div>
                   <p className="text-sm font-bold text-gray-200">Two-Factor Authentication (2FA)</p>
                   <p className="text-xs text-gray-500 mt-0.5">Protect your account with an extra layer of security</p>
                 </div>
                 <button className="btn-primary btn-sm bg-green-600 border-green-500 hover:bg-green-700">Enable 2FA</button>
              </div>
              <div className="h-px bg-[#1F2937]" />
              <div className="flex items-center justify-between py-2">
                 <div>
                   <p className="text-sm font-bold text-gray-200">Password</p>
                   <p className="text-xs text-gray-500 mt-0.5">Last changed 45 days ago</p>
                 </div>
                 <button className="btn-outline btn-sm">Change</button>
              </div>
              <div className="h-px bg-[#1F2937]" />
              <div className="flex items-center justify-between py-2">
                 <div>
                   <p className="text-sm font-bold text-gray-200">Active Sessions</p>
                   <p className="text-xs text-gray-500 mt-0.5">You are currently logged in on 1 device</p>
                 </div>
                 <button className="btn-outline btn-sm border-red-500/30 text-red-400 hover:bg-red-500/10">Logout All</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card-lg space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-[#1F2937] pb-3 uppercase tracking-widest">Notification Preferences</h2>
              
              {['Critical Patient Alerts', 'Consent Expirations', 'FHIR Sync Failures', 'Weekly Summary Reports'].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-300">{item}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                    <div className="w-11 h-6 bg-[#1F2937] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card-lg space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-[#1F2937] pb-3 uppercase tracking-widest">Application Preferences</h2>
              
              <div>
                <label className="form-label">Theme</label>
                <select className="form-select max-w-xs">
                  <option>Dark (Enterprise Default)</option>
                  <option disabled>Light</option>
                  <option disabled>System Match</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Default Landing Page</label>
                <select className="form-select max-w-xs">
                  <option>Command Center Dashboard</option>
                  <option>Patient Registry</option>
                  <option>Vitals Monitoring</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Timezone</label>
                <select className="form-select max-w-xs" defaultValue="IST">
                  <option value="EST">Eastern Time (ET)</option>
                  <option value="UTC">UTC</option>
                  <option value="IST">India Standard Time (IST)</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-[#1F2937]">
                <button className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
