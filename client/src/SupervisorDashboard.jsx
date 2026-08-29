import React, { useState } from 'react';
import Groups from './pages/Groups';
import Guidelines from './pages/Guidelines';
import Submissions from './pages/Submissions';
import Meetings from './pages/Meetings';

export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // 1. LOAD FROM LOCALSTORAGE
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('supervisor_profile_img') || null;
  });

  // 2. HANDLE IMAGE UPLOAD (Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Sawirka waa inuu ka yaryahay 2MB!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setProfileImage(base64Image);
        localStorage.setItem('supervisor_profile_img', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. REMOVE PROFILE IMAGE
  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem('supervisor_profile_img');
  };

  const handleLogout = () => {
    if (window.confirm("Ma hubtaa inaad ka baxdo nidaamka (Logout)?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; 
    }
  };

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Group Alpha submitted Chapter 1 draft.', time: '10m ago' },
    { id: 2, text: 'Admin approved your room request.', time: '1h ago' },
    { id: 3, text: 'Meeting scheduled with Group Beta tomorrow.', time: '3h ago' },
  ]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* 1. FIXED SIDEBAR (NAVY BLUE) */}
      <aside className="w-64 bg-[#031b33] text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 pt-2">
            
            {/* LOGO CONTAINER */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center p-1 border border-white/10">
              <img 
                src="/logo.png" 
                alt="EduAdmin Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '🎓';
                }}
              />
            </div>

            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight">EduAdmin</h1>
              <p className="text-[11px] text-slate-400">Supervisor Portal</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'groups', label: 'Assigned Groups', icon: '👥' },
              { id: 'guidelines', label: 'Guidelines & Milestones', icon: '📚' },
              { id: 'submissions', label: 'Submissions & Review', icon: '📋' },
              { id: 'meetings', label: 'Meetings', icon: '📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-[#0b2948] text-white border border-slate-700' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-[#0b2948] hover:bg-[#113861] border border-slate-700 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            ➕ New Request
          </button>
        </div>

        <div className="border-t border-slate-800 pt-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="text-xl font-bold text-[#031b33] tracking-tight capitalize">
            {activeTab === 'groups' && 'Assigned Groups (FR-S1)'}
            {activeTab === 'guidelines' && 'Project Guidelines (FR-S2)'}
            {activeTab === 'submissions' && 'Student Submissions (FR-S3 - FR-S5)'}
            {activeTab === 'meetings' && 'Supervision Meetings'}
            {activeTab === 'dashboard' && 'Dashboard Overview'}
          </h1>

          <div className="flex items-center gap-4 text-xs relative">
            {/* NOTIFICATION BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#031b33] rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 z-50">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-2">
                    <h4 className="font-bold text-[#031b33] text-xs">Notifications</h4>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-[#031b33] font-semibold hover:underline cursor-pointer">
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-100">
                          <p className="text-[11px] text-slate-700 font-medium">{n.text}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-400 py-4">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-200">|</span>

            {/* PROFILE BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center gap-2.5 hover:bg-slate-100 p-1.5 pr-3 rounded-xl transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center bg-[#031b33] text-white font-bold text-xs">
                  {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : 'DR'}
                </div>
                <span className="font-semibold text-[#031b33] text-xs">Dr. Hassan</span>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 z-50 space-y-3">
                  <div className="text-center border-b border-slate-100 pb-3">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#031b33] flex items-center justify-center bg-[#031b33] text-white font-bold text-lg">
                        {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : 'DR'}
                      </div>
                      
                      {/* Upload Camera Icon */}
                      <label className="absolute -bottom-1 -right-1 bg-[#031b33] hover:bg-[#0b2948] text-white p-1 rounded-lg cursor-pointer text-xs transition border border-white">
                        📷
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>

                      {/* Delete Icon */}
                      {profileImage && (
                        <button 
                          onClick={handleRemoveImage}
                          title="Tirtir Sawirka"
                          className="absolute -bottom-1 -left-1 bg-slate-700 hover:bg-slate-800 text-white p-1 rounded-lg cursor-pointer text-[10px] transition border border-white"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <h4 className="font-bold text-[#031b33] text-xs">Dr. Hassan Mohamed</h4>
                    <p className="text-[10px] text-slate-400">Senior Supervisor</p>
                  </div>
                  <div className="space-y-1.5 text-[11px] border-b border-slate-100 pb-3 text-slate-600">
                    <p>📧 hassan@eduadmin.edu</p>
                    <p>🏛️ Computer Science Dept.</p>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. DASHBOARD MAIN CONTENT */}
        <main className="p-8 flex-1 space-y-6">
          {activeTab === 'groups' && <Groups />}
          {activeTab === 'guidelines' && <Guidelines />}
          {activeTab === 'submissions' && <Submissions />}
          {activeTab === 'meetings' && <Meetings />}

          {activeTab === 'dashboard' && (
            <>
              {/* HERO WELCOME BANNER (NAVY BLUE) */}
              <div className="relative overflow-hidden rounded-3xl bg-[#031b33] p-7 text-white shadow-sm flex justify-between items-center">
                <div className="z-10 space-y-2 max-w-lg">
                  <span className="bg-white/10 text-slate-200 text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border border-white/10">
                    Academic Year 2026
                  </span>
                  <h2 className="text-2xl font-black tracking-tight">Welcome back, Dr. Hassan! 👋</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    
                  </p>
                </div>
                <div className="hidden md:flex text-6xl opacity-20 transform translate-x-4 translate-y-2 select-none">
                  📊
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: 'ASSIGNED GROUPS', value: '4', icon: '👥', tab: 'groups' },
                  { title: 'PENDING SUBS', value: '3', badge: 'Requires Action', icon: '📄', tab: 'submissions' },
                  { title: 'UPCOMING MTGS', value: '2', icon: '📅', tab: 'meetings' },
                  { title: 'GUIDELINES', value: '3', icon: '📚', tab: 'guidelines' },
                ].map((card, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveTab(card.tab)} 
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#031b33] transition-all cursor-pointer flex justify-between items-start group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-[#031b33]">{card.value}</h3>
                        {card.badge && <span className="text-[9px] font-bold text-white bg-[#031b33] px-2 py-0.5 rounded-full">{card.badge}</span>}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-[#031b33] group-hover:text-white flex items-center justify-center text-[#031b33] text-lg transition-colors border border-slate-200">
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* SUBMISSIONS & PROGRESS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[#031b33] text-sm flex items-center gap-2">
                      <span>📋</span> Recent Submissions
                    </h3>
                    <button onClick={() => setActiveTab('submissions')} className="text-xs text-[#031b33] font-semibold hover:underline">
                      View All →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                          <th className="pb-3">Group Name</th>
                          <th className="pb-3">Document Title</th>
                          <th className="pb-3">Submitted Date</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { group: 'Group Alpha', title: 'Chapter 1: Proposal Draft', date: 'Today, 10:20 AM', status: 'Pending Review' },
                          { group: 'Group Beta', title: 'Chapter 2: Literature Review', date: 'Yesterday', status: 'Approved' },
                          { group: 'Group Gamma', title: 'System Architecture Diagram', date: '24 Aug 2026', status: 'Needs Revision' },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="py-3 font-semibold text-[#031b33]">{row.group}</td>
                            <td className="py-3 text-slate-600">{row.title}</td>
                            <td className="py-3 text-slate-400 text-[11px]">{row.date}</td>
                            <td className="py-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-300 text-[#031b33] bg-slate-100">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-[#031b33] text-sm flex items-center gap-2">
                    <span>📈</span> Overall Progress
                  </h3>

                  <div className="space-y-4">
                    {[
                      { name: 'Group Alpha (MACVS Project)', progress: 75 },
                      { name: 'Group Beta (Task App)', progress: 40 },
                      { name: 'Group Gamma (Internship Portal)', progress: 90 },
                      { name: 'Group Delta (Gemini AI Bot)', progress: 20 },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-slate-400 text-[11px]">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-[#031b33]" 
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#031b33]">New Supervisor Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert("Codsigaaga si guul leh ayaa loo diray!"); setShowModal(false); }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Request Category</label>
                <select className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#031b33]">
                  <option>Change Student Group Assignment</option>
                  <option>Book Defense Hall / Room</option>
                  <option>Report Non-responsive Group</option>
                  <option>General Support Request</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Subject / Title</label>
                <input type="text" placeholder="Title of your request..." className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#031b33]" required />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Details / Reason</label>
                <textarea rows="3" placeholder="Fahfaahin ka bixi codsigaaga..." className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#031b33]" required></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#031b33] hover:bg-[#0b2948] text-white rounded-xl font-medium cursor-pointer shadow-sm">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}