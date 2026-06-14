export default function FactorBreakdown({ factors = {} }) {
  const items = [
    { key: 'volatility_factor', label: 'Volatility', desc: 'Price dispersion' },
    { key: 'streak_factor', label: 'Streak', desc: 'Consecutive pattern' },
    { key: 'trend_factor', label: 'Momentum', desc: 'MA trend direction' },
    { key: 'high_frequency_factor', label: 'High Crash', desc: 'Frequency of 5x+' },
  ];

  if (!Object.keys(factors).length) {
    return (
      <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-4 text-lg font-bold text-white">Risk Factor Breakdown</h2>
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">No data</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Risk Factor Breakdown</h2>
        <p className="text-xs text-slate-500">Contributing factors to risk score</p>
      </div>
      <div className="space-y-4">
        {items.map(({ key, label, desc }) => {
          const val = factors[key] ?? 0;
          const color = val >= 65 ? 'bg-danger' : val >= 35 ? 'bg-amber-300' : 'bg-cyan';
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-white">{label}</span>
                  <span className="ml-2 text-xs text-slate-500">{desc}</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{val.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${Math.min(100, val)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

