import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="mb-1 text-xs text-slate-400">Round #{label + 1}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.name === 'Risk Score' ? '%' : 'x'}
        </p>
      ))}
    </div>
  );
}

export default function RiskHistoryChart({ rounds = [] }) {
  if (!rounds?.length) {
    return (
      <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-4 text-lg font-bold text-white">Risk Score Trend</h2>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">No data</div>
      </div>
    );
  }

  const data = rounds.map((r, i) => ({
    round: i,
    riskScore: r.risk_score ?? 0,
    multiplier: Number(r.multiplier || 1),
  }));

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Risk Score Trend</h2>
        <p className="text-xs text-slate-500">Risk index evolution over recent rounds</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff5277" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ff5277" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ff5277', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="riskScore"
              stroke="#ff5277"
              strokeWidth={2.5}
              fill="url(#riskGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#ff5277', stroke: '#070a12', strokeWidth: 2 }}
              name="Risk Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#35d4ff]" /> 0-34 Safe</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#fbbf24]" /> 35-64 Caution</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff5277]" /> 65-100 High Risk</span>
      </div>
    </div>
  );
}

