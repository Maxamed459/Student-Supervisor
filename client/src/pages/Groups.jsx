import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ka soo akhriso kooxaha Backend API-ka laga sameeyay Admin-ka
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        // Waxaad ku baddali kartaa endpoint-kaaga rasmiga ah marka backend-ka la diyaariyo
        const response = await axios.get('http://localhost:5000/api/groups');
        setGroups(response.data);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Ma kleen karin xogta kooxaha. Hubi backend server-ka.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 font-medium text-sm">
        🌀 Waxaa la soo xambaarayaa kooxaha Admin-ku soo abuuray...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Assigned Student Groups</h2>
          <p className="text-xs text-slate-500">Kooxaha uu Admin-ku kuu soo xilsaaray inay kormeeran.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {groups.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
            👥
          </div>
          <h3 className="text-sm font-bold text-slate-700">Weli wax group ah laguma soo xilsaarin</h3>
          <p className="text-xs text-slate-400 mt-1">Admin-ka ayaa marka uu soo abuuro kooxaha halkan kuu soo diraya.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Group Name</th>
                <th className="p-4">Leader / Contact</th>
                <th className="p-4">Project Title</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {groups.map((group) => (
                <tr key={group._id || group.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-800">{group.name}</td>
                  <td className="p-4">{group.leader || 'N/A'}</td>
                  <td className="p-4 font-medium">{group.projectTitle || group.project || 'Not Assigned'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {group.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}