export default function MetricCard({ label, value, accent, children }) {
  return (
    <section className="rounded-lg border border-line bg-panel/85 p-5 shadow-glow backdrop-blur transition duration-300 hover:-translate-y-1">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-black ${accent || 'text-white'}`}>{value}</div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
