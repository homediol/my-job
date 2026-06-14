import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatPercent } from '../lib/format.js';

const COLORS = ['#35d4ff', '#9cff45', '#ff5277', '#fbbf24', '#a78bfa'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-sm font-bold text-white">{name}</p>
      <p className="text-xs text-slate-300">{formatPercent(value)}</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DistributionChart({ probabilities = {} }) {
  const data = Object.entries(probabilities)
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-4 text-lg font-bold text-white">Probability Distribution</h2>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Probability Distribution</h2>
        <p className="text-xs text-slate-500">Prediction outcome breakdown</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

