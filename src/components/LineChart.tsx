interface Point {
  label: string
  value: number
}

interface Props {
  points: Point[]
  unit?: string
}

/** Schlankes, abhängigkeitsfreies SVG-Liniendiagramm im Glas-Stil. */
export function LineChart({ points, unit = '' }: Props) {
  const W = 320
  const H = 180
  const padX = 14
  const padTop = 16
  const padBottom = 26

  if (points.length === 0) {
    return <div className="center-empty" style={{ padding: 24 }}>Noch keine Daten.</div>
  }

  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min = min - 1
    max = max + 1
  }
  const range = max - min

  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom
  const n = points.length

  const x = (i: number) => (n === 1 ? W / 2 : padX + (innerW * i) / (n - 1))
  const y = (v: number) => padTop + innerH * (1 - (v - min) / range)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`

  // Max. 5 X-Beschriftungen, damit es nicht überlappt.
  const labelStep = Math.max(1, Math.ceil(n / 5))

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>

        {/* Horizontale Hilfslinien */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t} x1={padX} x2={W - padX}
            y1={padTop + innerH * t} y2={padTop + innerH * t}
            stroke="var(--glass-border)" strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#area)" />
        <path className="line" d={linePath} fill="none" stroke="url(#line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={i === n - 1 ? 5.5 : 3} fill={i === n - 1 ? 'var(--action)' : 'var(--cyan)'} stroke="var(--bg-0)" strokeWidth="1.5" />
        ))}

        {/* Y-Extrema */}
        <text x={padX} y={padTop - 4} fill="var(--text-dim)" fontSize="10">{max}{unit}</text>
        <text x={padX} y={padTop + innerH + 12} fill="var(--text-dim)" fontSize="10">{min}{unit}</text>

        {/* X-Labels */}
        {points.map((p, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 8} fill="var(--text-dim)" fontSize="10" textAnchor="middle">
              {p.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}
