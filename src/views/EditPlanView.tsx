import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { uid } from '../lib/id'
import type { Exercise, Plan, TrainingDay } from '../types'

const WD = [
  { n: 1, l: 'Mo' }, { n: 2, l: 'Di' }, { n: 3, l: 'Mi' }, { n: 4, l: 'Do' },
  { n: 5, l: 'Fr' }, { n: 6, l: 'Sa' }, { n: 0, l: 'So' },
]

function emptyExercise(): Exercise {
  return { id: uid(), name: '', targetSets: 3, targetReps: 10, restSeconds: 120, notes: '' }
}
function emptyDay(): TrainingDay {
  return { id: uid(), name: '', weekdays: [], exercises: [emptyExercise()] }
}
function emptyPlan(): Plan {
  return { id: uid(), name: '', description: '', days: [emptyDay()], createdAt: new Date().toISOString() }
}

export default function EditPlanView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const plans = useStore((s) => s.plans)
  const addPlan = useStore((s) => s.addPlan)
  const updatePlan = useStore((s) => s.updatePlan)

  const isNew = !id
  const initial = useMemo<Plan>(() => {
    if (id) {
      const found = plans.find((p) => p.id === id)
      if (found) return structuredClone(found)
    }
    return emptyPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const [plan, setPlan] = useState<Plan>(initial)
  const [error, setError] = useState<string | null>(null)

  // ---- Mutationen (immer neuen Plan-State setzen) ----
  const patch = (p: Partial<Plan>) => setPlan((cur) => ({ ...cur, ...p }))
  const patchDay = (dayId: string, p: Partial<TrainingDay>) =>
    setPlan((cur) => ({ ...cur, days: cur.days.map((d) => (d.id === dayId ? { ...d, ...p } : d)) }))
  const patchEx = (dayId: string, exId: string, p: Partial<Exercise>) =>
    patchDay(dayId, {
      exercises: plan.days.find((d) => d.id === dayId)!.exercises.map((e) =>
        e.id === exId ? { ...e, ...p } : e
      ),
    })

  const toggleWeekday = (dayId: string, n: number) => {
    const day = plan.days.find((d) => d.id === dayId)!
    const set = new Set(day.weekdays)
    set.has(n) ? set.delete(n) : set.add(n)
    patchDay(dayId, { weekdays: Array.from(set).sort((a, b) => a - b) })
  }

  const addDay = () => patch({ days: [...plan.days, emptyDay()] })
  const removeDay = (dayId: string) => patch({ days: plan.days.filter((d) => d.id !== dayId) })
  const addEx = (dayId: string) => {
    const day = plan.days.find((d) => d.id === dayId)!
    patchDay(dayId, { exercises: [...day.exercises, emptyExercise()] })
  }
  const removeEx = (dayId: string, exId: string) => {
    const day = plan.days.find((d) => d.id === dayId)!
    patchDay(dayId, { exercises: day.exercises.filter((e) => e.id !== exId) })
  }

  const num = (v: string, min: number, max: number, fallback: number) => {
    const n = Number(v)
    if (Number.isNaN(n)) return fallback
    return Math.min(max, Math.max(min, Math.round(n)))
  }

  const save = () => {
    // Validierung
    if (!plan.name.trim()) return setError('Bitte gib dem Plan einen Namen.')
    for (const d of plan.days) {
      if (!d.name.trim()) return setError('Jeder Trainingstag braucht einen Namen.')
      if (d.weekdays.length === 0) return setError(`"${d.name}": mindestens einen Wochentag wählen.`)
      const exs = d.exercises.filter((e) => e.name.trim())
      if (exs.length === 0) return setError(`"${d.name}": mindestens eine Übung mit Namen.`)
    }
    // Leere Übungen rauswerfen, Notizen/leere Felder säubern
    const clean: Plan = {
      ...plan,
      name: plan.name.trim(),
      description: plan.description?.trim() || undefined,
      days: plan.days.map((d) => ({
        ...d,
        name: d.name.trim(),
        exercises: d.exercises
          .filter((e) => e.name.trim())
          .map((e) => ({
            ...e,
            name: e.name.trim(),
            notes: e.notes?.trim() || undefined,
            restSeconds: e.restSeconds || undefined,
          })),
      })),
    }
    if (isNew) addPlan(clean)
    else updatePlan(clean)
    navigate('/plans')
  }

  return (
    <div>
      <h1 className="view-title">{isNew ? 'Neuer Plan' : 'Plan bearbeiten'}</h1>

      <div className="glass glass-card">
        <span className="input-label" style={{ textAlign: 'left' }}>Name</span>
        <input className="field" value={plan.name} placeholder="z.B. Push-Pull-Fullbody"
          onChange={(e) => patch({ name: e.target.value })} />
        <span className="input-label" style={{ textAlign: 'left', marginTop: 10 }}>Beschreibung (optional)</span>
        <input className="field" value={plan.description ?? ''} placeholder="kurze Notiz"
          onChange={(e) => patch({ description: e.target.value })} />
      </div>

      {plan.days.map((day, di) => (
        <div key={day.id} className="glass glass-card">
          <div className="row-between">
            <input className="field grow" value={day.name} placeholder={`Tag ${di + 1} (z.B. Core A)`}
              onChange={(e) => patchDay(day.id, { name: e.target.value })} />
            {plan.days.length > 1 && (
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => removeDay(day.id)}>✕</button>
            )}
          </div>

          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {WD.map((w) => (
              <button key={w.n}
                className={`pill ${day.weekdays.includes(w.n) ? 'active' : ''}`}
                onClick={() => toggleWeekday(day.id, w.n)}>
                {w.l}
              </button>
            ))}
          </div>

          <hr className="divider" />

          <div className="stack">
            {day.exercises.map((ex) => (
              <div key={ex.id} className="glass" style={{ padding: 12 }}>
                <div className="row">
                  <input className="field grow" value={ex.name} placeholder="Übung"
                    onChange={(e) => patchEx(day.id, ex.id, { name: e.target.value })} />
                  {day.exercises.length > 1 && (
                    <button className="btn btn-sm btn-ghost btn-danger" onClick={() => removeEx(day.id, ex.id)}>✕</button>
                  )}
                </div>
                <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <div>
                    <span className="input-label">Sätze</span>
                    <input className="num-field" type="number" inputMode="numeric" value={ex.targetSets}
                      onChange={(e) => patchEx(day.id, ex.id, { targetSets: num(e.target.value, 1, 20, 3) })} />
                  </div>
                  <div>
                    <span className="input-label">Wdh.</span>
                    <input className="num-field" type="number" inputMode="numeric" value={ex.targetReps}
                      onChange={(e) => patchEx(day.id, ex.id, { targetReps: num(e.target.value, 1, 100, 10) })} />
                  </div>
                  <div>
                    <span className="input-label">Pause (s)</span>
                    <input className="num-field" type="number" inputMode="numeric" value={ex.restSeconds ?? 0}
                      onChange={(e) => patchEx(day.id, ex.id, { restSeconds: num(e.target.value, 0, 900, 120) })} />
                  </div>
                  <div className="grow">
                    <span className="input-label" style={{ textAlign: 'left' }}>Notiz</span>
                    <input className="field" value={ex.notes ?? ''} placeholder="optional"
                      onChange={(e) => patchEx(day.id, ex.id, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => addEx(day.id)}>
            + Übung
          </button>
        </div>
      ))}

      <button className="btn btn-block" style={{ marginBottom: 14 }} onClick={addDay}>+ Trainingstag</button>

      {error && (
        <div className="glass glass-card" style={{ borderColor: 'var(--danger)' }}>
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost grow" onClick={() => navigate('/plans')}>Abbrechen</button>
        <button className="btn btn-primary grow" onClick={save}>Speichern</button>
      </div>
    </div>
  )
}
