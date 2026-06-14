import { formatMultiplier, formatPercent, riskColor } from '../lib/format.js';

export default function PredictionLog({ decisions = [] }) {
  return (
    <section className="rounded-lg border border-line bg-panel/85 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Prediction Logs</h2>
        <span className="text-sm text-slate-400">{decisions.length} entries</span>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="pb-3">Time</th>
              <th className="pb-3">Prediction</th>
              <th className="pb-3">Confidence</th>
              <th className="pb-3">Cashout</th>
              <th className="pb-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {[...decisions].reverse().map((item, index) => (
              <tr key={`${item.created_at}-${index}`} className="hover:bg-slate-900/60">
                <td className="py-3 text-slate-400">{new Date(item.created_at).toLocaleTimeString()}</td>
                <td className="py-3 font-bold">{item.prediction}</td>
                <td className="py-3">{formatPercent(item.confidence)}</td>
                <td className="py-3">{formatMultiplier(item.recommended_cashout)}</td>
                <td className={`py-3 font-semibold ${riskColor(item.risk_level)}`}>{item.risk_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
