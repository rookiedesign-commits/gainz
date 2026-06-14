import type { SessionLog } from '../types'

export interface ProgressPoint {
  date: string
  weight: number
  reps: number
  /** Geschätztes Volumen pro Satz: Gewicht × Wdh. */
  volume: number
}

/** Alle bisher getrackten Übungsnamen (für die Auswahl in der Progressions-Ansicht). */
export function trackedExerciseNames(logs: SessionLog[]): string[] {
  const set = new Set<string>()
  for (const log of logs) {
    for (const e of log.entries) {
      if (e.weight != null && e.weight > 0) set.add(e.exerciseName)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))
}

/** Zeitreihe für eine Übung (chronologisch, ein Punkt pro Trainingstag). */
export function progressFor(logs: SessionLog[], exerciseName: string): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const log of logs) {
    const entry = log.entries.find((e) => e.exerciseName === exerciseName && e.weight != null && e.weight > 0)
    if (!entry) continue
    const weight = entry.weight ?? 0
    const reps = entry.reps ?? 0
    points.push({ date: log.date, weight, reps, volume: weight * reps })
  }
  points.sort((a, b) => a.date.localeCompare(b.date))
  return points
}

/** Persönlicher Bestwert (höchstes Gewicht). */
export function personalBest(points: ProgressPoint[]): number {
  return points.reduce((m, p) => Math.max(m, p.weight), 0)
}
