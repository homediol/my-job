import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatMultiplier } from '../lib/format.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-xs text-slate-400">Round #{label + 1}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {formatMultiplier(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function PerformanceChart({ rounds = [] }) {
  const data = rounds.map((r, i) => ({
    round: i,
    multiplier: Number(r.multiplier || 1),
  }));

  const avg = data.length
    ? (data.reduce((s, d) => s + d.multiplier, 0) / data.length).toFixed(2)
    : '0.00';

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Performance Trend</h2>
          <p className="text-xs text-slate-500">Multiplier progression over time</p>
        </div>
        <div className="rounded-lg border border-line bg-ink/60 px-3 py-1.5 text-right">
          <div className="text-xs text-slate-400">Average</div>
          <div className="text-sm font-bold text-acid">{avg}x</div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="perfGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#35d4ff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#35d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#35d4ff', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="multiplier"
              stroke="#35d4ff"
              strokeWidth={2.5}
              fill="url(#perfGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#35d4ff', stroke: '#070a12', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

