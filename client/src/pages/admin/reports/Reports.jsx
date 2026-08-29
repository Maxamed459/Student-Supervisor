import { useState } from 'react';
import { LuGraduationCap, LuUsers, LuLayers, LuFileText, LuDownload } from 'react-icons/lu';
import Button from '../../../components/ui/Button';

const reportTypes = [
  { id: 'students', label: 'Students', desc: 'Progress, grades, and engagement metrics for all enrolled students.', icon: LuGraduationCap },
  { id: 'supervisors', label: 'Supervisors', desc: 'Workload distribution, feedback response times, and capacity.', icon: LuUsers },
  { id: 'groups', label: 'Groups', desc: 'Team formations, meeting attendance, and peer evaluations.', icon: LuLayers },
  { id: 'projects', label: 'Projects', desc: 'Status tracking, milestone completion rates, and resource usage.', icon: LuFileText },
];

export default function Reports() {
  const [selected, setSelected] = useState('students');
  const [format, setFormat] = useState('pdf');

  const selectedReport = reportTypes.find((r) => r.id === selected);

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-800 mb-1">Generate Reports</h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure and export administrative reports for system monitoring.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {reportTypes.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`text-left bg-white rounded-xl border p-5 transition-colors ${
              selected === id ? 'border-secondary ring-2 ring-secondary/20' : 'border-gray-100'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-3">
              <Icon size={18} />
            </div>
            <p className="font-medium text-gray-800 mb-1">{label}</p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{desc}</p>
            <span className="text-xs font-medium text-secondary">Configure →</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium text-gray-700">Report Configuration</p>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
            {selectedReport.label} Report Selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Date Range</label>
            <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
              <option>Current Semester</option>
              <option>Last Semester</option>
              <option>This Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Department</label>
            <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none">
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Engineering</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Export Format</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex-1 h-9 rounded-lg border text-sm flex items-center justify-center gap-2 ${
                  format === 'pdf'
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <LuFileText size={14} /> PDF
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 h-9 rounded-lg border text-sm flex items-center justify-center gap-2 ${
                  format === 'csv'
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <LuFileText size={14} /> Excel (CSV)
              </button>
            </div>
          </div>
        </div>

        <Button variant="primary" className="w-auto px-5 flex items-center gap-2">
          <LuDownload size={16} />
          Generate &amp; Download
        </Button>
      </div>
    </div>
  );
}