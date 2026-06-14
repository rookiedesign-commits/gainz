import { useEffect, useRef, useState } from 'react'

interface Props {
  seconds: number
  onDismiss: () => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.max(0, s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Kurzer Ton via Web Audio (kein Binär-Asset nötig). Auf iOS nach User-Geste erlaubt. */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    play(880, 0, 0.18)
    play(1175, 0.22, 0.28)
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* ignore */
  }
}

const R = 120
const CIRC = 2 * Math.PI * R

export function RestTimer({ seconds, onDismiss }: Props) {
  const [total, setTotal] = useState(seconds)
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)
  const endAtRef = useRef<number>(Date.now() + seconds * 1000)
  const wakeRef = useRef<any>(null)

  // Wake Lock: Bildschirm während der Pause wach halten.
  useEffect(() => {
    let released = false
    const acquire = async () => {
      try {
        wakeRef.current = await (navigator as any).wakeLock?.request('screen')
      } catch {
        /* nicht unterstützt – kein Problem */
      }
    }
    acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVis)
      try {
        wakeRef.current?.release?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  // Countdown auf Zeitstempel-Basis (überlebt kurze Tab-Wechsel).
  useEffect(() => {
    const tick = () => {
      const left = Math.round((endAtRef.current - Date.now()) / 1000)
      if (left <= 0) {
        setRemaining(0)
        if (!done) {
          setDone(true)
          beep()
        }
      } else {
        setRemaining(left)
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [done])

  const addTime = (s: number) => {
    endAtRef.current += s * 1000
    setTotal((t) => t + s)
    setDone(false)
  }

  const progress = total > 0 ? Math.min(1, remaining / total) : 0
  const offset = CIRC * (1 - progress)

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className="timer-ring">
        <svg viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={R} fill="none" stroke="var(--glass-border)" strokeWidth="12" />
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--cyan)" />
              <stop offset="100%" stopColor="var(--blue)" />
            </linearGradient>
          </defs>
          <circle
            cx="130" cy="130" r={R} fill="none" stroke="url(#tg)" strokeWidth="12"
            strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="timer-num">
          <div className="big">{done ? 'Los!' : fmt(remaining)}</div>
          <div className="sub">{done ? 'Pause vorbei' : 'Satzpause'}</div>
        </div>
      </div>

      <div className="timer-actions">
        {!done && (
          <button className="btn" onClick={() => addTime(30)}>
            +30s
          </button>
        )}
        <button className="btn btn-primary" onClick={onDismiss}>
          {done ? 'Weiter' : 'Überspringen'}
        </button>
      </div>

      <div className="hint" style={{ maxWidth: 300, textAlign: 'center' }}>
        Tipp: App im Vordergrund lassen – bei gesperrtem iPhone pausiert der Web-Timer.
      </div>
    </div>
  )
}
