import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, snapshot } from '../store/useStore'
import { uid } from '../lib/id'
import { Icon } from '../components/Icon'
import type { Plan, ThemeMode } from '../types'

/** Build-Zeit lesbar machen (Datum + Uhrzeit, lokal). */
function formatBuild(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

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
            { id: uid(), name: 'Brustpresse', targetSets: 3, targetReps: 10 },
            { id: uid(), name: 'Latzug', targetSets: 3, targetReps: 10 },
            { id: uid(), name: 'Beinpresse', targetSets: 3, targetReps: 12 },
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
          setMsg('Backup geladen.')
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
    <div className="view">
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
          <button className="btn btn-sm grow" style={{ justifyContent: 'center' }} onClick={exportData}>
            <Icon name="download" size={17} /> Exportieren
          </button>
          <label className="btn btn-sm grow" style={{ position: 'relative', overflow: 'hidden', justifyContent: 'center' }}>
            <Icon name="upload" size={17} /> Importieren
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
          zum Ausprobieren aller Trainingsfunktionen.
        </p>
        <button className="btn btn-primary btn-block" onClick={loadTestPlan}>
          <Icon name="flask" size={18} /> Testplan laden & zu „Heute"
        </button>
      </div>

      <div className="section-label">Über</div>
      <div className="glass glass-card">
        <p className="hint" style={{ margin: 0 }}>
          Gainz · PWA · Erinnerungs-Push folgt später. Für den Satz-Timer die App im Vordergrund lassen.
        </p>
        <p className="hint" style={{ margin: '8px 0 0', opacity: 0.7 }}>
          Build: {formatBuild(__BUILD_TIME__)}
        </p>
      </div>
    </div>
  )
}
