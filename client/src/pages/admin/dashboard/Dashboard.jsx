import { LuGraduationCap, LuUsers, LuLayers } from 'react-icons/lu';
import StatCard from '../../../components/ui/StatCard';

const activity = [
  { text: 'Supervision request approved for Group 43', time: '10 mins ago', type: 'default' },
  { text: 'New project proposal submitted by J. Doe', time: '1 hour ago', type: 'default' },
  { text: 'Missed milestone alert: Team Alpha', time: '3 hours ago', type: 'alert' },
  { text: 'System batch sync completed successfully', time: 'Yesterday, 11:00 PM', type: 'default' },
];

const projectStatus = [
  { label: 'In Progress', value: 75 },
  { label: 'Submitted', value: 40 },
  { label: 'Revision', value: 20 },
  { label: 'Completed', value: 100 },
];

export default function Dashboard() {
  const maxValue = Math.max(...projectStatus.map((p) => p.value));

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-800 mb-1">Overview</h2>
      <p className="text-sm text-gray-500 mb-6">
        Current metrics for the academic term.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Students"
          value="1,248"
          subtext="↑ 4.2% from last semester"
          icon={<LuGraduationCap size={16} />}
        />
        <StatCard
          label="Total Supervisors"
          value="156"
          subtext="Ratio: 8 students per supervisor"
          icon={<LuUsers size={16} />}
        />
        <StatCard
          label="Student Groups"
          value="312 Total"
          subtext="Assigned (280)  ·  Unassigned (32)"
          icon={<LuLayers size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Project Status Distribution
          </p>
          <div className="flex gap-3">
            <div className="flex flex-col justify-between h-40 text-xs text-gray-400 pb-6">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="flex-1 relative h-40">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-100 w-full" />
                ))}
              </div>
              <div className="relative flex items-end justify-between h-full gap-4 px-2">
                {projectStatus.map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full bg-secondary/20 rounded-t-md"
                      style={{ height: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <div className="w-8" />
            <div className="flex-1 flex justify-between gap-4 px-2">
              {projectStatus.map((item) => (
                <span key={item.label} className="flex-1 text-center text-xs text-gray-500">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Recent System Activity
          </p>
          <ul className="space-y-4">
            {activity.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    item.type === 'alert' ? 'bg-red-500' : 'bg-secondary'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      item.type === 'alert' ? 'text-red-500' : 'text-gray-700'
                    }`}
                  >
                    {item.text}
                  </p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="text-sm text-secondary hover:underline mt-4">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}