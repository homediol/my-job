import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatMultiplier } from '../lib/format.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-xs text-slate-400">Round #{label + 1}</p>
      <p className="text-sm font-bold text-white">{formatMultiplier(payload[0].value)}</p>
    </div>
  );
}

export default function MultiplierChart({ rounds = [] }) {
  const recent = rounds.slice(-30);
  const data = recent.map((r, i) => ({
    round: i,
    multiplier: Number(r.multiplier || 1),
  }));

  const getBarColor = (val) => {
    if (val >= 5) return '#ff5277';
    if (val >= 2) return '#9cff45';
    return '#35d4ff';
  };

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Recent Multipliers</h2>
        <p className="text-xs text-slate-500">Last {data.length} rounds</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(53,212,255,0.08)' }} />
            <Bar dataKey="multiplier" radius={[3, 3, 0, 0]} maxBarSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.multiplier)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#35d4ff]" /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#9cff45]" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5277]" /> High
        </span>
      </div>
    </div>
  );
}

