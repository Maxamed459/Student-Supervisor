import { useState } from 'react';
import { LuBell, LuMail, LuBuilding2, LuCamera } from 'react-icons/lu';
import { useSelector } from 'react-redux';

const mockNotifications = [
  { id: 1, text: 'Group Alpha submitted Chapter 1 draft.', time: '10m ago' },
  { id: 2, text: 'Admin approved your room request.', time: '1h ago' },
  { id: 3, text: 'Meeting scheduled with Group Beta tomorrow.', time: '3h ago' },
];

export default function Topbar({ title }) {
  const { user } = useSelector((state) => state.auth);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [profileImage, setProfileImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-base font-medium text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
          >
            <LuBell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800 text-sm">Notifications</h4>
                  <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {notifications.length}
                  </span>
                </div>
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-secondary hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                    >
                      <p className="text-xs text-gray-700 font-medium leading-snug">{n.text}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">{n.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-4">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-secondary/10 text-secondary font-medium text-xs">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 space-y-3">
              <div className="text-center border-b border-gray-100 pb-3">
                <div className="relative w-16 h-16 mx-auto mb-2 group">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary flex items-center justify-center bg-secondary/10 text-secondary font-semibold text-lg">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-secondary hover:bg-secondary/90 text-white p-1.5 rounded-full cursor-pointer shadow-md transition">
                    <LuCamera size={12} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">
                  {user?.name || 'Admin User'}
                </h4>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600">
                <p className="flex items-center gap-2">
                  <LuMail size={13} className="text-gray-400" />
                  {user?.email || 'admin@university.edu'}
                </p>
                <p className="flex items-center gap-2">
                  <LuBuilding2 size={13} className="text-gray-400" />
                  System Administration
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}