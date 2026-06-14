import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="mb-1 text-xs text-slate-400">Round #{label + 1}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}x
        </p>
      ))}
    </div>
  );
}

export default function MACrossoverChart({ rounds = [] }) {
  if (!rounds?.length) {
    return (
      <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-4 text-lg font-bold text-white">Moving Averages</h2>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">No data</div>
      </div>
    );
  }

  // compute SMAs for display
  const sma5 = (arr, i) => {
    const window = arr.slice(Math.max(0, i - 4), i + 1);
    return window.reduce((s, v) => s + v, 0) / window.length;
  };
  const sma20 = (arr, i) => {
    if (i < 19) return null;
    const window = arr.slice(i - 19, i + 1);
    return window.reduce((s, v) => s + v, 0) / window.length;
  };

  const multipliers = rounds.map((r) => Number(r.multiplier || 1));
  // show last 60 for readability
  const slice = multipliers.slice(-60);

  const data = slice.map((m, i) => ({
    round: i,
    multiplier: m,
    sma5: Math.round(sma5(slice, i) * 100) / 100,
    sma20: sma20(slice, i) !== null ? Math.round(sma20(slice, i) * 100) / 100 : undefined,
  }));

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Moving Averages</h2>
        <p className="text-xs text-slate-500">SMA(5) vs SMA(20) crossover signals</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(val) => <span style={{ color: '#94a3b8' }}>{val}</span>}
            />
            <Line
              type="monotone"
              dataKey="multiplier"
              stroke="#64748b"
              strokeWidth={1}
              dot={false}
              opacity={0.5}
              name="Crash"
            />
            <Line
              type="monotone"
              dataKey="sma5"
              stroke="#35d4ff"
              strokeWidth={2}
              dot={false}
              name="SMA(5)"
            />
            <Line
              type="monotone"
              dataKey="sma20"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              name="SMA(20)"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

