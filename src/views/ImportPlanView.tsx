import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { buildClaudePrompt, parsePlanJSON } from '../lib/planSchema'

export default function ImportPlanView() {
  const navigate = useNavigate()
  const addPlan = useStore((s) => s.addPlan)
  const [wish, setWish] = useState('einen Push-Pull-Fullbody-Split, 3× pro Woche')
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const copyPrompt = async () => {
    const prompt = buildClaudePrompt(wish.trim() || 'einen Trainingsplan')
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback: Prompt im Textfeld zeigen, damit man manuell kopieren kann.
      setRaw(prompt)
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRaw(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const doImport = () => {
    setError(null)
    const res = parsePlanJSON(raw.trim())
    if ('error' in res) {
      setError(res.error)
      return
    }
    addPlan(res.plan)
    navigate('/plans')
  }

  return (
    <div>
      <h1 className="view-title">Plan importieren</h1>

      <div className="glass glass-card">
        <div className="section-label" style={{ margin: '0 0 8px' }}>1 · Prompt für Claude</div>
        <p className="hint" style={{ marginTop: 0 }}>
          Beschreibe kurz, was du willst. Dann Prompt kopieren, in der Claude-App einfügen,
          und die JSON-Antwort hierher zurückkopieren.
        </p>
        <input
          className="field"
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="z.B. Core-Limbs-Split, 4× pro Woche"
        />
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={copyPrompt}>
          {copied ? '✓ Kopiert!' : '📋 Prompt kopieren'}
        </button>
      </div>

      <div className="glass glass-card">
        <div className="section-label" style={{ margin: '0 0 8px' }}>2 · JSON einfügen</div>
        <textarea
          className="field"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='Hier die JSON-Antwort von Claude einfügen { "name": ... }'
        />
        <div className="row" style={{ marginTop: 10, gap: 10 }}>
          <label className="btn btn-sm grow" style={{ position: 'relative', overflow: 'hidden' }}>
            📁 Datei wählen
            <input
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              style={{ position: 'absolute', inset: 0, opacity: 0 }}
            />
          </label>
        </div>
        {error && (
          <div className="glass glass-card" style={{ marginTop: 12, borderColor: 'var(--danger)' }}>
            <strong style={{ color: 'var(--danger)' }}>Import fehlgeschlagen</strong>
            <div className="hint" style={{ marginTop: 4 }}>{error}</div>
          </div>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={doImport} disabled={!raw.trim()}>
          Plan importieren
        </button>
      </div>
    </div>
  )
}
