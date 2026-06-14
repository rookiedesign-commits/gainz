import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, snapshot } from '../store/useStore'
import { uid } from '../lib/id'
import type { Plan, ThemeMode } from '../types'

export default function SettingsView() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const replaceAll = useStore((s) => s.replaceAll)
  const addPlan = useStore((s) => s.addPlan)
  const setActivePlan = useStore((s) => s.setActivePlan)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  // Testplan: an JEDEM Wochentag trainierbar (also auch heute), zum Ausprobieren.
  const loadTestPlan = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6]
    const plan: Plan = {
      id: uid(),
      name: 'Testtag (jeden Tag)',
      description: 'Zum Ausprobieren der Trainingsfunktionen – heute aktiv.',
      createdAt: new Date().toISOString(),
      days: [
        {
          id: uid(),
          name: 'Testtag',
          weekdays: allDays,
          exercises: [
            { id: uid(), name: 'Brustpresse', targetSets: 3, targetReps: 10, restSeconds: 5, notes: 'Pause kurz zum Testen' },
            { id: uid(), name: 'Latzug', targetSets: 3, targetReps: 10, restSeconds: 5 },
            { id: uid(), name: 'Beinpresse', targetSets: 3, targetReps: 12, restSeconds: 5 },
          ],
        },
      ],
    }
    addPlan(plan)
    setActivePlan(plan.id)
    navigate('/')
  }

  const restMin = Math.floor(settings.restDefaultSeconds / 60)
  const restSec = settings.restDefaultSeconds % 60

  const exportData = () => {
    const data = snapshot(useStore.getState())
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!data || !Array.isArray(data.plans)) throw new Error('Falsches Format')
        if (confirm('Backup laden? Deine aktuellen Daten werden ersetzt.')) {
          replaceAll(data)
          setMsg('✓ Backup geladen.')
        }
      } catch {
        setMsg('Konnte die Datei nicht lesen (kein gültiges Backup).')
      }
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const themes: { v: ThemeMode; label: string }[] = [
    { v: 'system', label: 'System' },
    { v: 'light', label: 'Hell' },
    { v: 'dark', label: 'Dunkel' },
  ]

  return (
    <div>
      <h1 className="view-title">Mehr</h1>

      <div className="section-label">Darstellung</div>
      <div className="glass glass-card">
        <div className="row-between">
          <span>Theme</span>
          <div className="seg">
            {themes.map((t) => (
              <button key={t.v} className={settings.theme === t.v ? 'on' : ''} onClick={() => updateSettings({ theme: t.v })}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label">Training</div>
      <div className="glass glass-card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <span>Standard-Satzpause</span>
          <div className="row" style={{ gap: 6 }}>
            <input
              className="num-field" type="number" min={0} max={9} value={restMin}
              onChange={(e) => updateSettings({ restDefaultSeconds: Number(e.target.value) * 60 + restSec })}
            />
            <span className="muted">min</span>
            <input
              className="num-field" type="number" min={0} max={59} step={5} value={restSec}
              onChange={(e) => updateSettings({ restDefaultSeconds: restMin * 60 + Number(e.target.value) })}
            />
            <span className="muted">s</span>
          </div>
        </div>
        <hr className="divider" />
        <div className="row-between">
          <span>Deine Anrede</span>
          <input
            className="field" style={{ width: 160 }} value={settings.reminderName}
            onChange={(e) => updateSettings({ reminderName: e.target.value })}
            placeholder="Champ"
          />
        </div>
        <p className="hint" style={{ marginTop: 8 }}>Wird im Motivations-Banner verwendet.</p>
      </div>

      <div className="section-label">Daten-Backup</div>
      <div className="glass glass-card">
        <p className="hint" style={{ marginTop: 0 }}>
          Deine Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig als Datei –
          besonders bevor du Safari-Daten löschst.
        </p>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-sm grow" onClick={exportData}>⬇️ Exportieren</button>
          <label className="btn btn-sm grow" style={{ position: 'relative', overflow: 'hidden' }}>
            ⬆️ Importieren
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={importData}
              style={{ position: 'absolute', inset: 0, opacity: 0 }} />
          </label>
        </div>
        {msg && <div className="hint" style={{ marginTop: 10 }}>{msg}</div>}
      </div>

      <div className="section-label">Test & Demo</div>
      <div className="glass glass-card">
        <p className="hint" style={{ marginTop: 0 }}>
          Lädt einen Testplan, der an <strong>jedem</strong> Wochentag (also auch heute) trainierbar ist –
          mit kurzer 5-Sekunden-Pause, damit du den Rest-Timer schnell siehst.
        </p>
        <button className="btn btn-primary btn-block" onClick={loadTestPlan}>🧪 Testplan laden & zu „Heute"</button>
      </div>

      <div className="section-label">Über</div>
      <div className="glass glass-card">
        <p className="hint" style={{ margin: 0 }}>
          Fitness PWA · v0.1 · Erinnerungs-Push folgt in einer späteren Version.
          Für den Satz-Timer die App im Vordergrund lassen.
        </p>
      </div>
    </div>
  )
}
