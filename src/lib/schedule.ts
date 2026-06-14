import type { AppData, Plan, TrainingDay } from '../types'

/** Lokales ISO-Datum (YYYY-MM-DD) ohne Zeitzonen-Verschiebung. */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const WEEKDAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
export const WEEKDAY_NAMES_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function getActivePlan(data: AppData): Plan | null {
  return data.plans.find((p) => p.id === data.activePlanId) ?? null
}

/** Menge aller Trainings-Wochentage des Plans (Vereinigung über alle Tage). */
export function trainingWeekdays(plan: Plan): Set<number> {
  const s = new Set<number>()
  for (const day of plan.days) for (const w of day.weekdays) s.add(w)
  return s
}

/** Tag der Sequenz am gegebenen Pointer (zyklisch). */
export function dayAtPointer(plan: Plan, pointer: number): TrainingDay | null {
  if (plan.days.length === 0) return null
  const idx = ((pointer % plan.days.length) + plan.days.length) % plan.days.length
  return plan.days[idx]
}

export interface TodayStatus {
  plan: Plan | null
  /** Ist heute laut Plan ein Trainings-Wochentag? */
  isTrainingWeekday: boolean
  /** Die heute fällige Einheit (oder null an einem Ruhetag / ohne Plan). */
  day: TrainingDay | null
  /** Wurde heute bereits abgeschlossen oder verschoben? */
  resolvedToday: boolean
  /** Falls erledigt: war es abgeschlossen oder verschoben? */
  resolvedKind: 'done' | 'postponed' | null
  todayWeekday: number
}

export function getTodayStatus(data: AppData, now: Date = new Date()): TodayStatus {
  const plan = getActivePlan(data)
  const todayWeekday = now.getDay()
  if (!plan || plan.days.length === 0) {
    return { plan, isTrainingWeekday: false, day: null, resolvedToday: false, resolvedKind: null, todayWeekday }
  }
  const isTrainingWeekday = trainingWeekdays(plan).has(todayWeekday)
  const day = isTrainingWeekday ? dayAtPointer(plan, data.schedulePointer) : null
  // "Heute erledigt" gilt nur, wenn es für GENAU diesen aktiven Plan war.
  const resolvedToday =
    data.lastResolvedDate === todayISO(now) && data.lastResolvedPlanId === plan.id
  const resolvedKind = resolvedToday ? data.lastResolvedKind : null
  return { plan, isTrainingWeekday, day, resolvedToday, resolvedKind, todayWeekday }
}

export interface UpcomingItem {
  date: string
  weekday: number
  dayName: string
}

/**
 * Vorschau der nächsten `count` Trainingseinheiten ab morgen.
 * Berücksichtigt, ob heute schon abgeschlossen/verschoben wurde:
 * Bei Abschluss ist der Pointer bereits weitergerückt; bei Verschiebung bleibt er.
 */
export function getUpcoming(data: AppData, count = 5, now: Date = new Date()): UpcomingItem[] {
  const plan = getActivePlan(data)
  if (!plan || plan.days.length === 0) return []
  const trainDays = trainingWeekdays(plan)
  if (trainDays.size === 0) return []

  const result: UpcomingItem[] = []
  let pointer = data.schedulePointer
  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)

  for (let i = 1; i <= 365 && result.length < count; i++) {
    cursor.setDate(cursor.getDate() + 1)
    const wd = cursor.getDay()
    if (!trainDays.has(wd)) continue
    const day = dayAtPointer(plan, pointer)
    if (day) {
      result.push({ date: todayISO(cursor), weekday: wd, dayName: day.name })
      pointer++
    }
  }
  return result
}
