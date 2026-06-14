import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Bot, Activity, Clock, AlertCircle, RefreshCw, Eye, EyeOff, ArrowLeft, List, ChevronRight, Terminal } from 'lucide-react';
import { startBot, stopBot, fetchBotStatus } from '../api/client.js';
import Sidebar from '../components/Sidebar.jsx';

const STATUS_CONFIG = {
  idle:              { label: 'Idle',       color: 'text-slate-400', bg: 'bg-slate-800',      dot: 'bg-slate-400', pulse: false },
  starting:          { label: 'Starting',   color: 'text-cyan',      bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  running:           { label: 'Running',    color: 'text-acid',      bg: 'bg-acid/10',         dot: 'bg-acid',     pulse: true },
  launching_browser: { label: 'Launching Browser', color: 'text-cyan', bg: 'bg-cyan/10',       dot: 'bg-cyan',     pulse: true },
  browser_ready:     { label: 'Browser Ready', color: 'text-acid',   bg: 'bg-acid/10',         dot: 'bg-acid',     pulse: true },
  opening_page:      { label: 'Opening Page', color: 'text-cyan',    bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  page_ready:        { label: 'Page Ready',  color: 'text-cyan',     bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  checking_session:  { label: 'Checking Session', color: 'text-cyan', bg: 'bg-cyan/10',        dot: 'bg-cyan',     pulse: true },
  monitoring:        { label: 'Monitoring', color: 'text-acid',      bg: 'bg-acid/10',         dot: 'bg-acid',     pulse: true },
  navigating_login:  { label: 'Logging In', color: 'text-cyan',      bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  filling_credentials:{label: 'Entering Credentials', color:'text-cyan', bg:'bg-cyan/10',      dot:'bg-cyan',     pulse: true },
  logging_in:        { label: 'Logging In', color: 'text-cyan',      bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  login_success:     { label: 'Logged In',  color: 'text-acid',      bg: 'bg-acid/10',         dot: 'bg-acid',     pulse: false },
  navigating_aviator:{ label: 'Navigating', color: 'text-cyan',      bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  aviator_loaded:    { label: 'On Aviator', color: 'text-acid',      bg: 'bg-acid/10',         dot: 'bg-acid',     pulse: false },
  preparing_monitor: { label: 'Preparing Monitor', color: 'text-cyan', bg: 'bg-cyan/10',       dot: 'bg-cyan',     pulse: true },
  prepared_monitor:  { label: 'Monitor Ready', color: 'text-cyan',   bg: 'bg-cyan/10',         dot: 'bg-cyan',     pulse: true },
  restarting:        { label: 'Restarting', color: 'text-amber-300', bg: 'bg-amber-300/10',    dot: 'bg-amber-300', pulse: true },
  monitoring_hidden: { label: 'Monitoring Hidden', color: 'text-amber-300', bg: 'bg-amber-300/10', dot: 'bg-amber-300', pulse: true },
  no_data:           { label: 'Waiting for Data', color: 'text-amber-300', bg: 'bg-amber-300/10', dot: 'bg-amber-300', pulse: true },
  navigated_away:    { label: 'Re-routing', color: 'text-amber-300', bg: 'bg-amber-300/10',    dot: 'bg-amber-300', pulse: true },
  monitor_error:     { label: 'Monitor Issue', color:'text-amber-300', bg:'bg-amber-300/10',  dot:'bg-amber-300', pulse: false },
  stopping:          { label: 'Stopping',   color: 'text-amber-300', bg: 'bg-amber-300/10',    dot: 'bg-amber-300', pulse: true },
  stopped:           { label: 'Stopped',    color: 'text-slate-400', bg: 'bg-slate-800',       dot: 'bg-slate-400', pulse: false },
  killed:            { label: 'Killed',     color: 'text-danger',    bg: 'bg-danger/10',       dot: 'bg-danger',   pulse: false },
  crashed:           { label: 'Crashed',    color: 'text-danger',    bg: 'bg-danger/10',       dot: 'bg-danger',   pulse: false },
  error:             { label: 'Error',      color: 'text-danger',    bg: 'bg-danger/10',       dot: 'bg-danger',   pulse: false },
};

const ACTIVE_STATUSES = new Set([
  'starting', 'running', 'launching_browser', 'browser_ready', 'opening_page',
  'page_ready', 'checking_session', 'monitoring', 'logging_in',
  'navigating_aviator', 'navigating_login', 'filling_credentials',
  'aviator_loaded', 'login_success', 'preparing_monitor', 'prepared_monitor',
  'restarting', 'monitoring_hidden', 'no_data', 'navigated_away', 'monitor_error',
]);

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <span className="relative inline-flex items-center">
      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.pulse && (
        <span className={`absolute h-2.5 w-2.5 rounded-full ${cfg.dot} animate-ping opacity-40`} />
      )}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${cfg.color} ${cfg.bg}`}>
      <StatusDot status={status} />
      {cfg.label}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-ink/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

export default function BotControl() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [headless, setHeadless] = useState(false);
  const [status, setStatus] = useState('idle');
  const [botStatus, setBotStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const logRef = useRef(null);

  // Auto-scroll log to bottom when new steps arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [botStatus?.steps]);

  const poll = useCallback(async () => {
    try {
      const data = await fetchBotStatus();
      setBotStatus(data);
      setStatus(data.display_status || data.status || 'idle');
      if (data.error) setError(data.error);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Bot API unreachable');
    }
  }, []);

  useEffect(() => {
    if (ACTIVE_STATUSES.has(status)) {
      poll();
      pollRef.current = setInterval(poll, 2000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (status !== 'idle') poll();
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, poll]);

  const handleStart = async () => {
    if (!phone.trim() || !password.trim()) {
      setError('Phone number and password are required');
      return;
    }
    setStarting(true);
    setError('');
    try {
      const result = await startBot(phone.trim(), password, headless);
      setStatus('starting');
      setBotStatus({ ...result, status: 'starting' });
    } catch (err) {
      if (err.response?.status === 409) {
        await poll();
      }
      setError(err.response?.data?.detail || err.message || 'Failed to start bot');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    setError('');
    try {
      const result = await stopBot();
      setStatus(result.status || 'stopped');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to stop bot');
    } finally {
      setStopping(false);
    }
  };

  const isRunning = Boolean(botStatus?.running) || ACTIVE_STATUSES.has(status);
  const livePid = botStatus?.pid_alive ? (botStatus?._pid || botStatus?.pid) : null;

  return (
    <div className="flex min-h-screen bg-ink text-white">
      <Sidebar
        activeTab="overview"
        onTabChange={() => {}}
        onRefresh={() => {}}
        loading={false}
        onTrain={() => {}}
        training={false}
      />

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-line bg-panel/95 backdrop-blur lg:hidden">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-cyan border-t-2 border-cyan"
        >
          Dashboard
        </button>
        <button
          className="flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-acid"
        >
          Bot
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-6 border-b border-line pb-5">
            <button
              onClick={() => navigate('/')}
              className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan">
              <Bot className="h-3.5 w-3.5" />
              Aviator Bot Automation
            </div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Bot Control Center</h1>
          </header>

          {/* Status banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
            <div className="flex items-center gap-4">
              <StatusBadge status={status} />
              <span className="text-sm text-slate-400">
                {botStatus?.updated_at
                  ? `Last update: ${new Date(botStatus.updated_at).toLocaleTimeString()}`
                  : 'No status yet'}
              </span>
            </div>
            <button
              onClick={poll}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Control Panel */}
            <div className="rounded-xl border border-line bg-panel/80 p-6 shadow-lg backdrop-blur">
              <h2 className="mb-5 text-lg font-bold text-white">Bot Controls</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="phoneInput" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Phone Number
                  </label>
                  <input
                    id="phoneInput"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isRunning}
                    placeholder="e.g. 2507XXXXXX"
                    className="w-full rounded-lg border border-line bg-ink/60 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label htmlFor="passwordInput" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="passwordInput"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isRunning}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-line bg-ink/60 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 disabled:opacity-40 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={headless}
                    onChange={(e) => setHeadless(e.target.checked)}
                    disabled={isRunning}
                    className="h-4 w-4 rounded border-line bg-ink accent-cyan"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">Headless Mode</div>
                    <div className="text-xs text-slate-500">Run browser without visible UI</div>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={starting || !phone.trim() || !password.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-acid px-6 py-3 text-sm font-black text-ink transition hover:brightness-110 disabled:opacity-40"
                  >
                    {starting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-ink" />
                        Start Bot
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    disabled={stopping}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-danger px-6 py-3 text-sm font-bold text-danger transition hover:bg-danger hover:text-white disabled:opacity-40"
                  >
                    {stopping ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4" />
                        Stop Bot
                      </>
                    )}
                  </button>
                )}
              </div>

              {error ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-rose-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            {/* Live Status */}
            <div className="rounded-xl border border-line bg-panel/80 p-6 shadow-lg backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
                <Activity className="h-4 w-4 text-cyan" />
                Live Status
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard label="Status" value={<StatusBadge status={status} />} />
                  <InfoCard
                    label="PID"
                    value={livePid ? `#${livePid}` : '--'}
                  />
                  <InfoCard label="Rounds Seen" value={botStatus?.rounds_seen ?? 0} />
                  <InfoCard label="Phone" value={botStatus?.phone ? `••••${botStatus.phone.slice(-4)}` : '--'} />
                </div>

                {botStatus?.last_round && (
                  <div className="rounded-lg border border-line bg-ink/50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Last Round Data</div>
                    <pre className="mt-2 overflow-x-auto text-xs text-slate-300">
                      {JSON.stringify(botStatus.last_round, null, 2)}
                    </pre>
                  </div>
                )}

                {botStatus?.current_url && (
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Current Page</div>
                    <div className="truncate rounded-lg bg-ink/50 px-3 py-2 font-mono text-xs text-slate-400">
                      {botStatus.current_url}
                    </div>
                  </div>
                )}

                {botStatus?.error && (
                  <div className="flex items-start gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-rose-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <span>{botStatus.error}</span>
                  </div>
                )}

                <div className="border-t border-line pt-4 text-xs text-slate-500">
                  {botStatus?.started_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Started: {new Date(botStatus.started_at).toLocaleString()}
                    </div>
                  )}
                  {botStatus?.updated_at && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Updated: {new Date(botStatus.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Log */}
          <div className="mt-6 rounded-xl border border-line bg-panel/80 p-6 shadow-lg backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Terminal className="h-4 w-4 text-cyan" />
              Step Log
            </h2>

            <div
              ref={logRef}
              className="h-64 overflow-y-auto rounded-lg bg-ink/70 p-4 font-mono text-xs leading-relaxed"
              style={{ scrollBehavior: 'smooth' }}
            >
              {!botStatus?.steps || botStatus.steps.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-600 italic">
                  {isRunning ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Waiting for first step...
                    </span>
                  ) : (
                    'No step data yet. Start the bot to see live progress.'
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {botStatus.steps.map((entry, idx) => {
                    const isRunning = entry.status === 'running';
                    const isFailed = entry.status === 'failed';
                    const isSuccess = entry.status === 'success';
                    const ts = entry.timestamp
                      ? new Date(entry.timestamp).toLocaleTimeString()
                      : '';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded px-2 py-1 ${
                          isRunning
                            ? 'bg-cyan/5 text-cyan'
                            : isFailed
                            ? 'bg-danger/5 text-rose-300'
                            : isSuccess
                            ? 'bg-acid/5 text-emerald-300'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isRunning ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : isFailed ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : isSuccess ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {entry.step}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-600">{ts}</span>
                        <span className="font-semibold">{entry.action}</span>
                        <span className="text-slate-500">— {entry.details}</span>
                      </div>
                    );
                  })}
                  {isRunning && (
                    <div className="flex items-center gap-2 rounded px-2 py-1 text-cyan/70">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Listening for updates...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flow info */}
          <div className="mt-6 rounded-xl border border-line bg-panel/50 p-5 shadow-lg backdrop-blur">
            <h3 className="mb-3 text-sm font-bold text-white">Automation Flow</h3>
            <ol className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">1</span>
                Opens <span className="font-mono text-xs text-slate-300">winner.rw/en/authentication/login</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">2</span>
                Fills phone via <span className="font-mono text-xs text-slate-300">#phoneInput</span> and password via <span className="font-mono text-xs text-slate-300">#password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">3</span>
                Clicks <span className="font-mono text-xs text-slate-300">#buttonLoginSubmitLabel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">4</span>
                Navigates to <span className="font-mono text-xs text-slate-300">winner.rw/en/virtual/crash-games/aviator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">5</span>
                Monitors rounds and reports live status until stopped
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
