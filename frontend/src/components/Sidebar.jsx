import { Activity, BarChart3, PieChart, TrendingUp, History, RefreshCw, Brain, Bot, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'distribution', label: 'Distribution', icon: PieChart },
  { id: 'multipliers', label: 'Multipliers', icon: BarChart3 },
  { id: 'logs', label: 'History Log', icon: History },
];

export default function Sidebar({ activeTab, onTabChange, onRefresh, loading, onTrain, training }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isBotPage = location.pathname === '/bot';

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-panel/50 backdrop-blur lg:flex lg:flex-col">
      {/* Logo */}
      <div
        className="flex cursor-pointer items-center gap-3 border-b border-line px-6 py-5 transition hover:opacity-80"
        onClick={() => navigate('/')}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-acid">
          <Brain className="h-5 w-5 text-ink" />
        </div>
        <div>
          <div className="text-sm font-black text-white">Aviator ML</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan">Console</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (isBotPage) navigate('/');
              onTabChange(id);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              !isBotPage && activeTab === id
                ? 'bg-cyan/10 text-cyan shadow-[inset_0_0_0_1px_rgba(53,212,255,0.25)]'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}

        {/* Separator */}
        <div className="my-3 border-t border-line" />

        {/* Bot Control nav */}
        <button
          onClick={() => navigate('/bot')}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            isBotPage
              ? 'bg-acid/10 text-acid shadow-[inset_0_0_0_1px_rgba(156,255,69,0.25)]'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Bot className="h-4 w-4" />
          Bot Control
          <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-line p-4">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan/40 px-4 py-2.5 text-sm font-bold text-cyan transition hover:bg-cyan/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing' : 'Refresh'}
        </button>
        <button
          onClick={onTrain}
          disabled={training}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-acid px-4 py-2.5 text-sm font-black text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          <Brain className="h-4 w-4" />
          {training ? 'Training...' : 'Train Model'}
        </button>
      </div>
    </aside>
  );
}

