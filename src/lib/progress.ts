import type { SessionEntry, SessionLog } from '../types'

export interface ProgressPoint {
  date: string
  weight: number
  reps: number
  /** Geschätztes Volumen pro Satz: Gewicht × Wdh. */
  volume: number
}

/**
 * Aktueller Anzeigename eines Log-Eintrags: zuerst der heutige Plan-Name (über die
 * stabile exerciseId), sonst der zum Trainingszeitpunkt gespeicherte Name. Dadurch
 * wirken Umbenennungen rückwirkend, ohne die Logs zu verändern.
 */
function displayName(entry: SessionEntry, nameById?: Map<string, string>): string {
  return nameById?.get(entry.exerciseId) ?? entry.exerciseName
}

/** Alle bisher getrackten Übungsnamen (für die Auswahl in der Progressions-Ansicht). */
export function trackedExerciseNames(logs: SessionLog[], nameById?: Map<string, string>): string[] {
  const set = new Set<string>()
  for (const log of logs) {
    for (const e of log.entries) {
      if (e.weight != null && e.weight > 0) set.add(displayName(e, nameById))
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))
}

/** Zeitreihe für eine Übung (chronologisch, ein Punkt pro Trainingstag). */
export function progressFor(logs: SessionLog[], exerciseName: string, nameById?: Map<string, string>): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const log of logs) {
    const entry = log.entries.find(
      (e) => displayName(e, nameById) === exerciseName && e.weight != null && e.weight > 0
    )
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
