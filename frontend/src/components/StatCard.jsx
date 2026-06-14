import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const icons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: 'text-acid',
  down: 'text-danger',
  neutral: 'text-amber-300',
};

export default function StatCard({ label, value, subtitle, trend = 'neutral', accent, children }) {
  const Icon = icons[trend] || null;
  return (
    <section className="group relative overflow-hidden rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_0_32px_rgba(53,212,255,0.12)]">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-cyan/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
          {Icon && <Icon className={`h-4 w-4 ${trendColors[trend]}`} />}
        </div>
        <div className={`mt-2 text-3xl font-black tracking-tight ${accent || 'text-white'}`}>{value}</div>
        {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}

