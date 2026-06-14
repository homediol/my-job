import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = { LOW: '#35d4ff', MEDIUM: '#9cff45', HIGH: '#ff5277' };

export default function CategoryDistribution({ counts = {} }) {
  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Crash Distribution</h2>
        <p className="text-xs text-slate-500">Low / Medium / High breakdown</p>
      </div>
      {data.length > 0 ? (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-xl backdrop-blur">
                        <p className="text-sm font-bold text-white">{payload[0].payload.name}</p>
                        <p className="text-xs text-slate-300">{payload[0].value} rounds ({((payload[0].value / total) * 100).toFixed(1)}%)</p>
                      </div>
                    ) : null
                  }
                  cursor={{ fill: 'rgba(53,212,255,0.08)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            {data.map((d) => (
              <div key={d.name}>
                <div className="font-bold text-white">{d.value}</div>
                <div className="text-slate-500">{((d.value / total) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">No data</div>
      )}
    </div>
  );
}

