import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { uid } from '../lib/id'
import { Icon } from '../components/Icon'
import { AutoGrowTextarea } from '../components/AutoGrowTextarea'
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

  // ---- Übungen per Press-and-Drag umsortieren (Pointer Events, touch-tauglich) ----
  // Die gezogene Kachel folgt dem Finger (translateY); die anderen weichen mit einer
  // Lücke aus. Die Reihenfolge wird erst beim Loslassen festgeschrieben.
  const GAP = 10 // entspricht .stack { gap }
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const startYRef = useRef(0)
  // Ursprüngliche Mittelpunkte der Kacheln (zum Drag-Start gemessen).
  const centersRef = useRef<number[]>([])

  interface DragState { dayId: string; exId: string; fromIndex: number; dy: number; slot: number; overIndex: number }
  const [drag, setDrag] = useState<DragState | null>(null)

  const moveEx = (dayId: string, exId: string, toIndex: number) => {
    setPlan((cur) => ({
      ...cur,
      days: cur.days.map((d) => {
        if (d.id !== dayId) return d
        const from = d.exercises.findIndex((e) => e.id === exId)
        if (from === -1 || toIndex === from) return d
        const next = [...d.exercises]
        const [item] = next.splice(from, 1)
        next.splice(toIndex, 0, item)
        return { ...d, exercises: next }
      }),
    }))
  }

  const onHandleDown = (e: React.PointerEvent, day: TrainingDay, exId: string, index: number) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const rects = day.exercises.map((ex) => rowRefs.current.get(ex.id)?.getBoundingClientRect())
    centersRef.current = rects.map((r) => (r ? r.top + r.height / 2 : 0))
    startYRef.current = e.clientY
    const h = rects[index]?.height ?? 0
    setDrag({ dayId: day.id, exId, fromIndex: index, dy: 0, slot: h + GAP, overIndex: index })
  }
  const onHandleMove = (e: React.PointerEvent, exId: string) => {
    setDrag((cur) => {
      if (!cur || cur.exId !== exId) return cur
      const dy = e.clientY - startYRef.current
      const draggedCenter = centersRef.current[cur.fromIndex] + dy
      // Ziel-Index = Anzahl anderer Kacheln, deren Mitte oberhalb der gezogenen liegt.
      let over = 0
      for (let i = 0; i < centersRef.current.length; i++) {
        if (i === cur.fromIndex) continue
        if (centersRef.current[i] < draggedCenter) over++
      }
      return { ...cur, dy, overIndex: over }
    })
  }
  const onHandleUp = (e: React.PointerEvent, exId: string) => {
    setDrag((cur) => {
      if (cur && cur.exId === exId) moveEx(cur.dayId, cur.exId, cur.overIndex)
      return null
    })
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  // Versatz einer Kachel während des Drags (gezogene folgt Finger, andere weichen aus).
  const dragStyle = (dayId: string, exId: string, index: number): React.CSSProperties => {
    if (!drag || drag.dayId !== dayId) return {}
    if (exId === drag.exId) {
      return { transform: `translateY(${drag.dy}px) scale(1.03)`, zIndex: 10, position: 'relative' }
    }
    const { fromIndex, overIndex, slot } = drag
    if (overIndex > fromIndex && index > fromIndex && index <= overIndex) return { transform: `translateY(${-slot}px)` }
    if (overIndex < fromIndex && index >= overIndex && index < fromIndex) return { transform: `translateY(${slot}px)` }
    return {}
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
    <div className="view">
      <h1 className="view-title">{isNew ? 'Neuer Plan' : 'Plan bearbeiten'}</h1>
      {/* An body portalen: außerhalb des .view-Containers (dessen Transform-Animation
          sonst position:fixed bricht) -> wirklich fix am Viewport oben rechts. */}
      {createPortal(
        <button className="btn btn-primary btn-sm save-fab" onClick={save}>
          <Icon name="check" size={18} /> Speichern
        </button>,
        document.body
      )}

      {error && (
        <div className="glass glass-card" style={{ borderColor: 'var(--danger)' }}>
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

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
              <button className="btn btn-sm btn-icon btn-ghost btn-danger" aria-label="Tag entfernen" onClick={() => removeDay(day.id)}>
                <Icon name="close" size={18} />
              </button>
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
            {day.exercises.map((ex, exIndex) => (
              <div
                key={ex.id}
                ref={(el) => { if (el) rowRefs.current.set(ex.id, el); else rowRefs.current.delete(ex.id) }}
                className={`glass ex-edit ${drag?.exId === ex.id ? 'dragging' : ''}`}
                style={{ padding: 12, ...dragStyle(day.id, ex.id, exIndex) }}
              >
                <div className="row">
                  {day.exercises.length > 1 && (
                    <button
                      className="drag-handle"
                      aria-label="Übung verschieben"
                      onPointerDown={(e) => onHandleDown(e, day, ex.id, exIndex)}
                      onPointerMove={(e) => onHandleMove(e, ex.id)}
                      onPointerUp={(e) => onHandleUp(e, ex.id)}
                      onPointerCancel={(e) => onHandleUp(e, ex.id)}
                    >
                      <Icon name="grip" size={20} />
                    </button>
                  )}
                  <input className="field grow" value={ex.name} placeholder="Übung"
                    onChange={(e) => patchEx(day.id, ex.id, { name: e.target.value })} />
                  {day.exercises.length > 1 && (
                    <button className="btn btn-sm btn-icon btn-ghost btn-danger" aria-label="Übung entfernen" onClick={() => removeEx(day.id, ex.id)}>
                      <Icon name="close" size={18} />
                    </button>
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
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="input-label" style={{ textAlign: 'left' }}>Notiz</span>
                  <AutoGrowTextarea className="field note-field" value={ex.notes ?? ''} placeholder="z.B. Ausführung, Gewichtssprünge, Erinnerungen …"
                    onChange={(e) => patchEx(day.id, ex.id, { notes: e.target.value })} />
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => addEx(day.id)}>
            <Icon name="plus" size={16} /> Übung
          </button>
        </div>
      ))}

      <button className="btn btn-block" style={{ marginBottom: 14 }} onClick={addDay}>
        <Icon name="plus" size={17} /> Trainingstag
      </button>
    </div>
  )
}
