import { z } from 'zod'
import type { Plan } from '../types'

/**
 * Schema für von Claude importierte Pläne. Bewusst tolerant beim Input
 * (IDs/optional-Felder werden ergänzt), streng bei Pflichtfeldern.
 */
const exerciseSchema = z.object({
  name: z.string().min(1),
  targetSets: z.number().int().positive().max(20),
  targetReps: z.number().int().positive().max(100),
  notes: z.string().optional(),
  restSeconds: z.number().int().positive().max(900).optional(),
})

const daySchema = z.object({
  name: z.string().min(1),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  exercises: z.array(exerciseSchema).min(1),
})

export const importPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  days: z.array(daySchema).min(1),
})

export type ImportPlan = z.infer<typeof importPlanSchema>

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** Validiert rohen JSON-Text und baut einen vollständigen Plan (mit IDs). */
export function parsePlanJSON(raw: string): { plan: Plan } | { error: string } {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { error: 'Das ist kein gültiges JSON. Achte darauf, den kompletten { … }-Block zu kopieren.' }
  }
  const result = importPlanSchema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    const path = first.path.join(' → ')
    return { error: `Feld "${path || '(Wurzel)'}": ${first.message}` }
  }
  const p = result.data
  const plan: Plan = {
    id: uid(),
    name: p.name,
    description: p.description,
    createdAt: new Date().toISOString(),
    days: p.days.map((d) => ({
      id: uid(),
      name: d.name,
      weekdays: Array.from(new Set(d.weekdays)).sort((a, b) => a - b),
      exercises: d.exercises.map((e) => ({
        id: uid(),
        name: e.name,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        notes: e.notes,
        restSeconds: e.restSeconds,
      })),
    })),
  }
  return { plan }
}

/** Prompt-Vorlage zum Kopieren in die Claude-App auf dem iPhone. */
export function buildClaudePrompt(wish = 'einen Push-Pull-Fullbody-Split, 3× pro Woche'): string {
  return `Erstelle mir ${wish}.

Gib das Ergebnis AUSSCHLIESSLICH als JSON zurück – kein Text davor oder danach, keine Code-Fences.
Halte dich exakt an dieses Format:

{
  "name": "Mein Plan",
  "description": "kurze Beschreibung",
  "days": [
    {
      "name": "Push",
      "weekdays": [1],
      "exercises": [
        { "name": "Brustpresse", "targetSets": 3, "targetReps": 10, "restSeconds": 120, "notes": "optional" }
      ]
    }
  ]
}

Regeln:
- "weekdays": Zahlen 0=Sonntag, 1=Montag, ... 6=Samstag. Pro Trainingstag mindestens eine.
- Reihenfolge der "days" = Trainings-Reihenfolge.
- "targetSets" und "targetReps" sind ganze Zahlen. "restSeconds" und "notes" sind optional.
- Nutze sinnvolle, gängige Übungsnamen auf Deutsch.`
}
