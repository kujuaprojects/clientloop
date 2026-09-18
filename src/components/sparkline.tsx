"use client";

export default function Sparkline({ data }: { data: number[] }) {
  if (!data.length) data = [0, 0, 0, 0, 0, 0];
  const W = 560, H = 180, P = 28;
  const max = Math.max(...data, 4);
  const pts = data.map((v, i) => [
    P + (i * (W - 2 * P)) / Math.max(data.length - 1, 1),
    H - 24 - (v / max) * (H - 48),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H - 24} L${pts[0][0]},${H - 24} Z`;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const ay = H - 24 - (avg / max) * (H - 48);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="sgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={P} y1={ay} x2={W - P} y2={ay} stroke="#d4d4d8" strokeDasharray="4 4" />
      <path d={area} fill="url(#sgFill)" />
      <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
          <text x={p[0]} y={H - 6} textAnchor="middle" fontSize="11" fill="#a1a1aa">W{data.length - i}</text>
        </g>
      ))}
      <text x={W - P} y={ay - 8} textAnchor="end" fontSize="11" fill="#a1a1aa">
        avg {avg.toFixed(1)} calls/wk
      </text>
    </svg>
  );
}
