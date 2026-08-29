import React, { useState } from 'react';

export default function Meetings() {
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      groupName: 'Group Alpha',
      topic: 'Chapter 1 & Scope Review',
      date: '2026-09-02',
      time: '10:00 AM',
      type: 'Online (Google Meet)',
      link: 'https://meet.google.com/abc-defg-hij',
      status: 'Upcoming',
    },
    {
      id: 2,
      groupName: 'Group Beta',
      topic: 'Database Design & ERD Feedback',
      date: '2026-09-04',
      time: '02:30 PM',
      type: 'Face-to-Face (Office 204)',
      link: 'N/A',
      status: 'Upcoming',
    },
    {
      id: 3,
      groupName: 'Group Gamma',
      topic: 'Initial Project Proposal',
      date: '2026-08-20',
      time: '11:00 AM',
      type: 'Online',
      link: 'https://meet.google.com/xyz-uvwx-rst',
      status: 'Completed',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    groupName: 'Group Alpha',
    topic: '',
    date: '',
    time: '',
    type: 'Online (Google Meet)',
    link: '',
  });

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.topic || !newMeeting.date) return;

    setMeetings([
      ...meetings,
      {
        id: Date.now(),
        ...newMeeting,
        status: 'Upcoming',
      },
    ]);
    setShowModal(false);
    setNewMeeting({ groupName: 'Group Alpha', topic: '', date: '', time: '', type: 'Online (Google Meet)', link: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Supervision Meetings</h2>
          <p className="text-xs text-slate-500">
            Jadwalee oo maamul kulamada kormeerka ee aad la leedahay kooxaha ardayda.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition"
        >
          + Schedule Meeting
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="p-4">Group</th>
              <th className="p-4">Topic / Purpose</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Type / Location</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {meetings.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-bold text-slate-800">{m.groupName}</td>
                <td className="p-4 font-medium">{m.topic}</td>
                <td className="p-4 text-slate-600">
                  🗓️ {m.date} <span className="text-slate-400">({m.time})</span>
                </td>
                <td className="p-4">
                  {m.link !== 'N/A' ? (
                    <a href={m.link} target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">
                      🔗 {m.type}
                    </a>
                  ) : (
                    <span>📍 {m.type}</span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      m.status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal - Schedule New Meeting */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Schedule New Meeting</h3>
            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Select Group</label>
                <select
                  value={newMeeting.groupName}
                  onChange={(e) => setNewMeeting({ ...newMeeting, groupName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                >
                  <option>Group Alpha</option>
                  <option>Group Beta</option>
                  <option>Group Gamma</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Topic / Agenda</label>
                <input
                  type="text"
                  placeholder="e.g. SRS Review"
                  value={newMeeting.topic}
                  onChange={(e) => setNewMeeting({ ...newMeeting, topic: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Meeting Link / Location</label>
                <input
                  type="text"
                  placeholder="Google Meet Link or Room No."
                  value={newMeeting.link}
                  onChange={(e) => setNewMeeting({ ...newMeeting, link: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}