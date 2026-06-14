import StatCard from './StatCard.jsx';

export default function StatsGrid({ summary = {}, risk = {} }) {
  const s = summary || {};
  const { factors = {} } = risk || {};

  const trendIcons = { increasing: 'up', decreasing: 'down', stable: 'neutral' };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Rounds"
        value={s.total_rounds?.toLocaleString() || '0'}
        subtitle={`Max: ${s.max_multiplier || 0}x`}
        accent="text-white"
      />
      <StatCard
        label="Average Multiplier"
        value={`${s.avg_multiplier || 0}x`}
        subtitle={`Min: ${s.min_multiplier || 0}x`}
        accent="text-cyan"
      />
      <StatCard
        label="Volatility Factor"
        value={`${(factors.volatility_factor ?? 0).toFixed(0)}%`}
        subtitle="Coefficient of variation"
        accent="text-amber-300"
        trend={factors.volatility_factor >= 50 ? 'down' : 'up'}
      >
        <div className="h-1.5 rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan to-amber-300 transition-all"
            style={{ width: `${Math.min(100, factors.volatility_factor ?? 0)}%` }}
          />
        </div>
      </StatCard>
      <StatCard
        label="Market Trend"
        value={s.recent_trend ? s.recent_trend.charAt(0).toUpperCase() + s.recent_trend.slice(1) : '--'}
        subtitle={s.recent_trend === 'increasing' ? 'Rising multipliers' : s.recent_trend === 'decreasing' ? 'Falling multipliers' : 'Sideways market'}
        accent={s.recent_trend === 'increasing' ? 'text-danger' : s.recent_trend === 'decreasing' ? 'text-cyan' : 'text-amber-300'}
        trend={trendIcons[s.recent_trend] || 'neutral'}
      />
    </div>
  );
}

