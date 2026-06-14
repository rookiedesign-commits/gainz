// Zentrale Datentypen der App.

export interface Exercise {
  id: string
  name: string
  targetSets: number
  targetReps: number
  notes?: string
  /** Optionale, übungsspezifische Pausenzeit (Sekunden). Sonst globaler Default. */
  restSeconds?: number
}

export interface TrainingDay {
  id: string
  /** z.B. "Push", "Core Day" */
  name: string
  /** Trainings-Wochentage: 0=So, 1=Mo, ... 6=Sa. Mehrere möglich. */
  weekdays: number[]
  exercises: Exercise[]
}

export interface Plan {
  id: string
  name: string
  description?: string
  /** Reihenfolge = Trainings-Sequenz (für die Verschiebe-Logik). */
  days: TrainingDay[]
  createdAt: string
}

export interface SessionEntry {
  exerciseId: string
  exerciseName: string
  done: boolean
  weight?: number
  reps?: number
}

export interface SessionLog {
  id: string
  /** ISO-Datum (YYYY-MM-DD) des Trainings. */
  date: string
  planId: string
  dayId: string
  dayName: string
  entries: SessionEntry[]
}

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  restDefaultSeconds: number
  /** Anrede/Name für das Motivations-Banner, z.B. "Champ". */
  reminderName: string
  theme: ThemeMode
}

export interface AppData {
  plans: Plan[]
  activePlanId: string | null
  logs: SessionLog[]
  /** Index in der Tages-Sequenz des aktiven Plans (für Verschiebe-Logik). */
  schedulePointer: number
  /** ISO-Datum des zuletzt erfassten/verschobenen Trainingstags (verhindert Doppelzählung). */
  lastResolvedDate: string | null
  settings: Settings
}
