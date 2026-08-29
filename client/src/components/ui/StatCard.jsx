export default function StatCard({ label, value, subtext, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}