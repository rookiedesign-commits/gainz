import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppData, Plan, SessionEntry, SessionLog, Settings, TrainingDay } from '../types'
import { todayISO } from '../lib/schedule'

interface Draft {
  date: string
  dayId: string
  dayName: string
  planId: string
  entries: SessionEntry[]
}

interface StoreState extends AppData {
  draft: Draft | null

  // Pläne
  addPlan: (plan: Plan) => void
  removePlan: (id: string) => void
  setActivePlan: (id: string) => void

  // Heutiges Training
  startDraft: (day: TrainingDay, planId: string) => void
  toggleExercise: (exerciseId: string) => void
  setEntryWeight: (exerciseId: string, weight: number | undefined) => void
  setEntryReps: (exerciseId: string, reps: number | undefined) => void
  completeSession: () => void
  postponeToday: () => void
  discardDraft: () => void

  // Einstellungen & Daten
  updateSettings: (patch: Partial<Settings>) => void
  replaceAll: (data: AppData) => void
}

const defaultSettings: Settings = {
  restDefaultSeconds: 120,
  reminderName: 'Champ',
  theme: 'system',
}

/** Letztes geloggtes Gewicht/Wdh. für eine Übung – zum Vorbefüllen des Drafts. */
function lastValuesFor(logs: SessionLog[], name: string): { weight?: number; reps?: number } {
  for (let i = logs.length - 1; i >= 0; i--) {
    const e = logs[i].entries.find((x) => x.exerciseName === name && x.weight != null)
    if (e) return { weight: e.weight, reps: e.reps }
  }
  return {}
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlanId: null,
      logs: [],
      schedulePointer: 0,
      lastResolvedDate: null,
      settings: defaultSettings,
      draft: null,

      addPlan: (plan) =>
        set((s) => ({
          plans: [...s.plans, plan],
          // Erster Plan wird automatisch aktiv.
          activePlanId: s.activePlanId ?? plan.id,
        })),

      removePlan: (id) =>
        set((s) => {
          const plans = s.plans.filter((p) => p.id !== id)
          const activePlanId =
            s.activePlanId === id ? (plans[0]?.id ?? null) : s.activePlanId
          return { plans, activePlanId, schedulePointer: s.activePlanId === id ? 0 : s.schedulePointer }
        }),

      setActivePlan: (id) =>
        set((s) => (s.activePlanId === id ? s : { activePlanId: id, schedulePointer: 0, draft: null })),

      startDraft: (day, planId) => {
        const s = get()
        const date = todayISO()
        if (s.draft && s.draft.dayId === day.id && s.draft.date === date) return
        const entries: SessionEntry[] = day.exercises.map((ex) => {
          const last = lastValuesFor(s.logs, ex.name)
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            done: false,
            weight: last.weight,
            reps: last.reps ?? ex.targetReps,
          }
        })
        set({ draft: { date, dayId: day.id, dayName: day.name, planId, entries } })
      },

      toggleExercise: (exerciseId) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  entries: s.draft.entries.map((e) =>
                    e.exerciseId === exerciseId ? { ...e, done: !e.done } : e
                  ),
                },
              }
            : s
        ),

      setEntryWeight: (exerciseId, weight) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  entries: s.draft.entries.map((e) =>
                    e.exerciseId === exerciseId ? { ...e, weight } : e
                  ),
                },
              }
            : s
        ),

      setEntryReps: (exerciseId, reps) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  entries: s.draft.entries.map((e) =>
                    e.exerciseId === exerciseId ? { ...e, reps } : e
                  ),
                },
              }
            : s
        ),

      completeSession: () => {
        const s = get()
        if (!s.draft) return
        const log: SessionLog = {
          id: Math.random().toString(36).slice(2, 10),
          date: s.draft.date,
          planId: s.draft.planId,
          dayId: s.draft.dayId,
          dayName: s.draft.dayName,
          entries: s.draft.entries,
        }
        set({
          logs: [...s.logs, log],
          schedulePointer: s.schedulePointer + 1,
          lastResolvedDate: todayISO(),
          draft: null,
        })
      },

      // Verschieben: Pointer bleibt → gleiche Einheit erscheint am nächsten Trainingstag.
      postponeToday: () => set({ lastResolvedDate: todayISO(), draft: null }),

      discardDraft: () => set({ draft: null }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      replaceAll: (data) =>
        set({
          plans: data.plans ?? [],
          activePlanId: data.activePlanId ?? null,
          logs: data.logs ?? [],
          schedulePointer: data.schedulePointer ?? 0,
          lastResolvedDate: data.lastResolvedDate ?? null,
          settings: { ...defaultSettings, ...(data.settings ?? {}) },
          draft: null,
        }),
    }),
    {
      name: 'fitness-app-v1',
      version: 1,
      partialize: (s) => ({
        plans: s.plans,
        activePlanId: s.activePlanId,
        logs: s.logs,
        schedulePointer: s.schedulePointer,
        lastResolvedDate: s.lastResolvedDate,
        settings: s.settings,
        draft: s.draft,
      }),
    }
  )
)

/** Reine Datensicht für Export (ohne Draft/Funktionen). */
export function snapshot(s: StoreState): AppData {
  return {
    plans: s.plans,
    activePlanId: s.activePlanId,
    logs: s.logs,
    schedulePointer: s.schedulePointer,
    lastResolvedDate: s.lastResolvedDate,
    settings: s.settings,
  }
}
