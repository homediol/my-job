export function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(1)}%`;
}

export function formatMultiplier(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)}x`;
}

export function riskColor(risk) {
  if (risk === 'LOW') return 'text-acid';
  if (risk === 'MEDIUM') return 'text-amber-300';
  return 'text-danger';
}

export function predictionColor(prediction) {
  if (prediction === 'LOW') return 'from-sky-400 to-cyan';
  if (prediction === 'MEDIUM') return 'from-acid to-emerald-300';
  return 'from-danger to-orange-300';
}
