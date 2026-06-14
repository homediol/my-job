import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

// API
import {
  fetchAccuracy,
  fetchDecisions,
  fetchHistory,
  fetchPrediction,
  fetchRiskHistory,
  fetchRiskOverview,
  trainModel,
} from '../api/client.js';

// Format
import { formatMultiplier, formatPercent, predictionColor, riskColor } from '../lib/format.js';

// Prediction components
import ConfidenceMeter from '../components/ConfidenceMeter.jsx';
import PerformanceChart from '../components/PerformanceChart.jsx';
import PredictionLog from '../components/PredictionLog.jsx';
import MetricCard from '../components/MetricCard.jsx';

// Risk components
import RiskGauge from '../components/RiskGauge.jsx';
import StatsGrid from '../components/StatsGrid.jsx';
import StreakTracker from '../components/StreakTracker.jsx';
import FactorBreakdown from '../components/FactorBreakdown.jsx';
import MACrossoverChart from '../components/MACrossoverChart.jsx';
import CategoryDistribution from '../components/CategoryDistribution.jsx';
import RiskHistoryChart from '../components/RiskHistoryChart.jsx';
import MultiplierChart from '../components/MultiplierChart.jsx';
import DistributionChart from '../components/DistributionChart.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function Dashboard() {
  // ── Tabs ──
  const [activeTab, setActiveTab] = useState('overview');

  // ── Prediction state ──
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [decisions, setDecisions] = useState([]);

  // ── Risk state ──
  const [riskOverview, setRiskOverview] = useState(null);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Refresh ──
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        predictionData,
        historyData,
        accuracyData,
        decisionData,
        riskData,
      ] = await Promise.all([
        fetchPrediction(),
        fetchHistory(80),
        fetchAccuracy(),
        fetchDecisions(30),
        fetchRiskOverview(),
      ]);
      setPrediction(predictionData);
      setHistory(historyData.rounds || []);
      setAccuracy(accuracyData);
      setDecisions(decisionData.decisions || []);
      setRiskOverview(riskData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Refresh failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const train = async () => {
    setTraining(true);
    setError('');
    try {
      await trainModel(30);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Training failed.');
    } finally {
      setTraining(false);
    }
  };

  // ── Derived ──
  const risk = riskOverview?.risk || {};
  const summary = riskOverview?.summary || {};
  const riskLevel = risk?.risk_level || 'LOW';
  const riskScore = risk?.risk_score || 0;
  const streakData = risk?.streaks;

  const probabilityRows = Object.entries(prediction?.probabilities || {});

  // ── Render helpers ──

  const renderOverview = () => (
    <>
      {/* Stats row */}
      <StatsGrid summary={summary} risk={risk} />

      {/* Risk gauge + factor breakdown */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Risk Index</h2>
              <p className="text-xs text-slate-500">Composite risk assessment</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${
              riskLevel === 'HIGH' ? 'bg-danger/10 text-danger' :
              riskLevel === 'MEDIUM' ? 'bg-amber-300/10 text-amber-300' :
              'bg-cyan/10 text-cyan'
            }`}>
              {riskLevel}
            </div>
          </div>
          <RiskGauge score={riskScore} level={riskLevel} size={240} />
        </div>
        <FactorBreakdown factors={risk?.factors} />
      </div>

      {/* Charts row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <PerformanceChart rounds={history} />
        <RiskHistoryChart rounds={history} />
      </div>
    </>
  );

  const renderPrediction = () => (
    <>
      {/* Metric cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current Prediction" value={prediction?.prediction || '--'}>
          <div className={`h-2 rounded-full bg-gradient-to-r ${predictionColor(prediction?.prediction)}`} />
        </MetricCard>
        <MetricCard label="Confidence %" value={formatPercent(prediction?.confidence)} accent="text-cyan">
          <ConfidenceMeter value={prediction?.confidence || 0} />
        </MetricCard>
        <MetricCard label="Recommended Cashout" value={formatMultiplier(prediction?.recommended_cashout)} accent="text-acid">
          <div className="text-sm text-slate-400">
            Risk: <span className={riskColor(prediction?.risk_level)}>{prediction?.risk_level || '--'}</span>
          </div>
        </MetricCard>
        <MetricCard label="Model Accuracy" value={formatPercent(accuracy?.validation_accuracy)} accent="text-amber-300">
          <div className="text-sm text-slate-400">Samples: {accuracy?.model?.samples || 0}</div>
        </MetricCard>
      </section>

      {/* Charts row */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <PerformanceChart rounds={history} />
        <section className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Probability Split</h2>
            <p className="text-xs text-slate-500">Prediction outcome probabilities</p>
          </div>
          <div className="space-y-4">
            {probabilityRows.map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-white">{label}</span>
                  <span className="text-slate-300">{formatPercent(value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-acid transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* Distribution + Logs */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <DistributionChart probabilities={prediction?.probabilities} />
        <PredictionLog decisions={decisions} />
      </div>
    </>
  );

  const renderDistribution = () => (
    <div className="grid gap-5 lg:grid-cols-2">
      <CategoryDistribution counts={summary?.category_counts} />
      <DistributionChart probabilities={prediction?.probabilities} />
    </div>
  );

  const renderMultipliers = () => (
    <div className="grid gap-5 lg:grid-cols-2">
      <MultiplierChart rounds={history} />
      <MACrossoverChart rounds={history} />
    </div>
  );

  const renderLogs = () => (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <StreakTracker streaks={streakData} />
        <RiskHistoryChart rounds={history} />
      </div>
      <div className="mt-5">
        <PredictionLog decisions={decisions} />
      </div>
    </>
  );

  const tabContent = {
    overview: renderOverview,
    performance: renderPrediction,
    distribution: renderDistribution,
    multipliers: renderMultipliers,
    logs: renderLogs,
  };

  return (
    <div className="flex min-h-screen bg-ink text-white">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={refresh}
        loading={loading}
        onTrain={train}
        training={training}
      />

      {/* Mobile header */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-line bg-panel/95 backdrop-blur lg:hidden">
        {['overview', 'performance', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] transition ${
              activeTab === tab ? 'text-cyan border-t-2 border-cyan' : 'text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]">
                {riskLevel === 'HIGH' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                ) : riskLevel === 'MEDIUM' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-cyan" />
                )}
                <span className={
                  riskLevel === 'HIGH' ? 'text-danger' :
                  riskLevel === 'MEDIUM' ? 'text-amber-300' :
                  'text-cyan'
                }>
                  Aviator Risk Management
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl capitalize">
                {activeTab === 'overview' && 'Risk Overview'}
                {activeTab === 'performance' && 'Prediction Console'}
                {activeTab === 'distribution' && 'Crash Distribution'}
                {activeTab === 'multipliers' && 'Multiplier Analysis'}
                {activeTab === 'logs' && 'History & Logs'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-line px-3 py-2 text-sm text-slate-300">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for data'}
              </span>
              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-md border border-cyan px-4 py-2 text-sm font-bold text-cyan transition hover:bg-cyan hover:text-ink disabled:opacity-50"
              >
                {loading ? 'Refreshing' : 'Refresh'}
              </button>
              <button
                onClick={train}
                disabled={training}
                className="rounded-md bg-acid px-4 py-2 text-sm font-black text-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {training ? 'Training' : 'Train Model'}
              </button>
            </div>
          </header>

          {/* Error */}
          {error ? (
            <div className="mb-5 rounded-lg border border-danger/60 bg-danger/10 p-4 text-sm text-rose-100">{error}</div>
          ) : null}

          {/* Tab content */}
          {(tabContent[activeTab] || tabContent.overview)()}
        </div>
      </main>
    </div>
  );
}

