import { formatPercent } from '../lib/format.js';

export default function ConfidenceMeter({ value = 0 }) {
  const safe = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>Confidence</span>
        <span>{formatPercent(safe)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-acid transition-all duration-700"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
