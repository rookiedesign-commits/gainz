import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTodayStatus, getUpcoming, WEEKDAY_NAMES, WEEKDAY_NAMES_LONG } from '../lib/schedule'
import { RestTimer } from '../components/RestTimer'
import { Overlay } from '../components/Overlay'
import { Icon } from '../components/Icon'

const HYPE = [
  'Let’s fetz!', 'Auf geht’s!', 'Heute wird gepusht!', 'Time to work!',
  'Mach was draus!', 'Eisen wartet nicht!', 'Beast-Mode an!',
]
function hypeFor(seed: string): string {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return HYPE[h % HYPE.length]
}

function SuccessCheck() {
  return (
    <svg className="success-ring" width={96} height={96} viewBox="0 0 100 100" fill="none">
      <circle className="bg" cx="50" cy="50" r="42" strokeWidth="5" />
      <circle className="fg" cx="50" cy="50" r="42" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 51l12 12 24-26" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TodayView() {
  const data = useStore((s) => s)
  const { settings } = data
  const status = useMemo(
    () => getTodayStatus(data),
    [data.activePlanId, data.schedulePointer, data.plans, data.lastResolvedDate]
  )
  const upcoming = useMemo(
    () => getUpcoming(data, 4),
    [data.activePlanId, data.schedulePointer, data.plans, data.lastResolvedDate]
  )

  const startDraft = useStore((s) => s.startDraft)
  const toggleExercise = useStore((s) => s.toggleExercise)
  const setEntryWeight = useStore((s) => s.setEntryWeight)
  const setEntryReps = useStore((s) => s.setEntryReps)
  const completeSession = useStore((s) => s.completeSession)
  const postponeToday = useStore((s) => s.postponeToday)

  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)

  const active = status.day && !status.resolvedToday
  useEffect(() => {
    if (active && status.day && status.plan) startDraft(status.day, status.plan.id)
  }, [active, status.day?.id, status.plan?.id])

  const draft = useStore((s) => s.draft)
  const todayName = WEEKDAY_NAMES_LONG[status.todayWeekday]

  const finish = () => {
    setCelebrate(true)
    completeSession()
    setTimeout(() => setCelebrate(false), 1800)
  }

  if (!status.plan) {
    return (
      <div className="view">
        <h1 className="view-title">Heute</h1>
        <div className="banner">
          <div className="row">
            <Icon name="info" size={26} className="b-ico" />
            <div>
              <h2>Willkommen!</h2>
              <p>Importiere zuerst einen Trainingsplan, dann zeige ich dir hier deinen Tag.</p>
            </div>
          </div>
        </div>
        <Link to="/plans/import" className="btn btn-primary btn-block">
          <Icon name="sparkles" size={18} /> Plan von Claude importieren
        </Link>
      </div>
    )
  }

  const restDefault = settings.restDefaultSeconds

  return (
    <div className="view">
      <h1 className="view-title">Heute</h1>

      {active && status.day ? (
        <div className="banner">
          <div className="row">
            <Icon name="dumbbell" size={26} className="b-ico" />
            <div>
              <h2>{status.day.name} — {hypeFor(new Date().toDateString())}</h2>
              <p>{todayName} · {status.day.exercises.length} Übungen · Du schaffst das, {settings.reminderName}!</p>
            </div>
          </div>
        </div>
      ) : status.resolvedToday ? (
        <div className="banner">
          <div className="row">
            <Icon name="check" size={26} className="b-ico" />
            <div>
              <h2>Stark, {settings.reminderName}!</h2>
              <p>Heute erledigt. Erhol dich gut für die nächste Einheit.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="banner">
          <div className="row">
            <Icon name="calendar" size={26} className="b-ico" />
            <div>
              <h2>Ruhetag</h2>
              <p>{todayName} steht kein Training an. Regeneration zählt auch!</p>
            </div>
          </div>
        </div>
      )}

      {active && status.day && draft && (
        <>
          <div className="section-label">Übungen abhaken</div>
          {status.day.exercises.map((ex) => {
            const entry = draft.entries.find((e) => e.exerciseId === ex.id)
            const done = entry?.done ?? false
            return (
              <div key={ex.id} className={`glass glass-card ${done ? 'done' : ''}`}>
                <div className="row">
                  <button className={`check ${done ? 'on' : ''}`} onClick={() => toggleExercise(ex.id)} aria-label="abhaken">
                    <Icon name="check" size={18} strokeWidth={3} />
                  </button>
                  <div className="grow">
                    <div className="ex-name">{ex.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {ex.targetSets} × {ex.targetReps} Wdh.{ex.notes ? ` · ${ex.notes}` : ''}
                    </div>
                  </div>
                  {done && <span className="done-tag">erledigt</span>}
                </div>

                <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: 14 }}>
                    <div>
                      <span className="input-label">Gewicht (kg)</span>
                      <input
                        className="num-field" type="number" inputMode="decimal" step="0.5" disabled={done}
                        value={entry?.weight ?? ''} placeholder="–"
                        onChange={(e) => setEntryWeight(ex.id, e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="input-label">Wdh.</span>
                      <input
                        className="num-field" type="number" inputMode="numeric" disabled={done}
                        value={entry?.reps ?? ''} placeholder="–"
                        onChange={(e) => setEntryReps(ex.id, e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button className="btn btn-sm" disabled={done} onClick={() => setRestSeconds(ex.restSeconds ?? restDefault)}>
                    <Icon name="timer" size={17} /> Pause
                  </button>
                </div>
              </div>
            )
          })}

          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={finish}>
            <Icon name="check" size={18} strokeWidth={2.4} /> Training abschließen
          </button>
          <button
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (confirm('Heute nicht trainieren? Die Einheit rutscht auf deinen nächsten Trainingstag.')) postponeToday()
            }}
          >
            Heute kann ich nicht
          </button>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="section-label">Demnächst</div>
          <div className="glass glass-card">
            <div className="stack">
              {upcoming.map((u, i) => (
                <div key={i} className="row-between">
                  <span style={{ fontWeight: 600 }}>{u.dayName}</span>
                  <span className="pill">{WEEKDAY_NAMES[u.weekday]} · {formatShort(u.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {restSeconds != null && <RestTimer seconds={restSeconds} onDismiss={() => setRestSeconds(null)} />}

      {celebrate && (
        <Overlay>
          <div className="success-card">
            <SuccessCheck />
            <h2>Geschafft!</h2>
            <p>Stark gemacht, {settings.reminderName}.</p>
          </div>
        </Overlay>
      )}
    </div>
  )
}

function formatShort(iso: string): string {
  const parts = iso.split('-')
  return `${Number(parts[2])}.${Number(parts[1])}.`
}
