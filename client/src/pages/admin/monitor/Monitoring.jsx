import { useState } from 'react';
import StatCard from '../../../components/ui/StatCard';

const mockProjects = [
  { id: 1, title: 'AI Driven Resource Allocation', code: 'PRJ-2023-089', supervisor: 'Dr. Alan Turing', status: 'progress', progress: 65 },
  { id: 2, title: 'Sustainable Urban Drainage Systems', code: 'PRJ-2023-112', supervisor: 'Prof. Sarah Jenkins', status: 'pending', progress: 20 },
  { id: 3, title: 'Blockchain in Supply Chain', code: 'PRJ-2023-045', supervisor: 'Dr. Chen Wei', status: 'completed', progress: 100 },
  { id: 4, title: 'Quantum Cryptography Protocols', code: 'PRJ-2023-156', supervisor: 'Dr. Elena Rostova', status: 'progress', progress: 85 },
];

const statusStyles = {
  progress: 'bg-blue-50 text-secondary',
  pending: 'bg-red-50 text-red-500',
  completed: 'bg-gray-100 text-gray-500',
};

const statusLabel = {
  progress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
};

const tabs = ['All Projects', 'In Progress', 'Pending', 'Completed'];

export default function Monitoring() {
  const [activeTab, setActiveTab] = useState('All Projects');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-xl font-medium text-gray-800">Project Monitoring</h2>
          <p className="text-sm text-gray-500 mt-1">
            Overview of all final year projects and their current progress status.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <StatCard label="Total Projects" value="124" />
        <StatCard label="In Progress" value="68" />
        <StatCard label="Pending Review" value="22" />
        <StatCard label="Completed" value="34" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Active Monitoring</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
              <th className="py-3 px-4 font-medium">Project Title &amp; Group</th>
              <th className="py-3 px-4 font-medium">Supervisor</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {mockProjects.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4">
                  <p className="text-gray-800">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.code}</p>
                </td>
                <td className="py-3 px-4 text-gray-500">{p.supervisor}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 w-40">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.status === 'completed' ? 'bg-gray-300' : 'bg-primary'
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{p.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
          <span>Showing 1 to 4 of 124 entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-gray-200 text-gray-400" disabled>
              Previous
            </button>
            <button className="px-3 py-1 rounded border border-gray-200">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}