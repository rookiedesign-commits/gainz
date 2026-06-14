import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { personalBest, progressFor, trackedExerciseNames } from '../lib/progress'
import { LineChart } from '../components/LineChart'

type Metric = 'weight' | 'volume'

export default function ProgressView() {
  const logs = useStore((s) => s.logs)
  const names = useMemo(() => trackedExerciseNames(logs), [logs])
  const [selected, setSelected] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('weight')

  const current = selected && names.includes(selected) ? selected : names[0] ?? null
  const points = useMemo(() => (current ? progressFor(logs, current) : []), [logs, current])

  const chartPoints = points.map((p) => ({
    label: shortDate(p.date),
    value: metric === 'weight' ? p.weight : p.volume,
  }))

  const best = personalBest(points)
  const latest = points.at(-1)
  const first = points[0]
  const delta = latest && first ? latest.weight - first.weight : 0

  return (
    <div>
      <h1 className="view-title">Progression</h1>

      {names.length === 0 ? (
        <div className="center-empty">
          Noch keine Daten.<br />
          Trag beim Training Gewicht & Wiederholungen ein und schließe es ab –
          dann erscheint hier deine Kurve.
        </div>
      ) : (
        <>
          {/* Übungsauswahl */}
          <div className="section-label">Übung</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {names.map((name) => (
              <button
                key={name}
                className={`pill ${name === current ? 'active' : ''}`}
                onClick={() => setSelected(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="glass glass-card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 17 }}>{current}</strong>
              <div className="seg">
                <button className={metric === 'weight' ? 'on' : ''} onClick={() => setMetric('weight')}>Gewicht</button>
                <button className={metric === 'volume' ? 'on' : ''} onClick={() => setMetric('volume')}>Volumen</button>
              </div>
            </div>

            <LineChart points={chartPoints} unit={metric === 'weight' ? '' : ''} />

            <div className="chart-stats">
              <div className="stat">
                <div className="v">{best} kg</div>
                <div className="k">Bestwert</div>
              </div>
              <div className="stat">
                <div className="v">{latest?.weight ?? '–'} kg</div>
                <div className="k">Aktuell</div>
              </div>
              <div className="stat">
                <div className="v" style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                  {delta >= 0 ? '+' : ''}{delta} kg
                </div>
                <div className="k">seit Start</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function shortDate(iso: string): string {
  const parts = iso.split('-')
  return `${Number(parts[2])}.${Number(parts[1])}.`
}
