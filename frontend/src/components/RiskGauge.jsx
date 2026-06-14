export default function RiskGauge({ score = 0, level = 'LOW', size = 200 }) {
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(Number(score || 0), 100));
  const offset = circumference - (safeScore / 100) * circumference;

  const colorMap = { LOW: '#35d4ff', MEDIUM: '#fbbf24', HIGH: '#ff5277' };
  const accent = colorMap[level] || '#35d4ff';

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.55}`} className="overflow-visible">
        <path
          d={`M ${size * 0.08} ${size * 0.48} A ${radius} ${radius} 0 0 1 ${size * 0.92} ${size * 0.48}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${size * 0.08} ${size * 0.48} A ${radius} ${radius} 0 0 1 ${size * 0.92} ${size * 0.48}`}
          fill="none"
          stroke={accent}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <text
          x={size / 2}
          y={size * 0.35}
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          {safeScore}
        </text>
        <text
          x={size / 2}
          y={size * 0.47}
          textAnchor="middle"
          fill={accent}
          fontSize="13"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {level}
        </text>
      </svg>
      <div className="mt-2 flex w-full max-w-[180px] justify-between text-[11px] text-slate-500">
        <span>Safe</span>
        <span>Risky</span>
      </div>
    </div>
  );
}

