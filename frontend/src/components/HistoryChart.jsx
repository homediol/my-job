import { formatMultiplier } from '../lib/format.js';

export default function HistoryChart({ rounds = [] }) {
  const values = rounds.map((round) => Number(round.multiplier || 1));
  const max = Math.max(2, ...values);
  const width = 720;
  const height = 240;
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - (Math.log(value) / Math.log(max)) * (height - 24) - 12;
    return `${x},${Math.max(12, Math.min(height - 12, y))}`;
  });

  return (
    <section className="rounded-lg border border-line bg-panel/85 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white">Historical Graph</h2>
        <span className="text-sm text-slate-400">{rounds.length} rounds</span>
      </div>
      <div className="h-64 overflow-hidden rounded-md border border-slate-800 bg-ink/80 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#35d4ff" />
              <stop offset="100%" stopColor="#9cff45" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="0"
              x2={width}
              y1={(height / 4) * line + 12}
              y2={(height / 4) * line + 12}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}
          <polyline points={points.join(' ')} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
          {values.map((value, index) => {
            if (index % Math.ceil(values.length / 16 || 1) !== 0) return null;
            const [x, y] = points[index].split(',').map(Number);
            return <circle key={`${index}-${value}`} cx={x} cy={y} r="4" fill={value >= 5 ? '#ff5277' : value >= 1.5 ? '#9cff45' : '#35d4ff'} />;
          })}
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>Latest: {formatMultiplier(values[values.length - 1] || 0)}</span>
        <span>Peak: {formatMultiplier(max)}</span>
      </div>
    </section>
  );
}
