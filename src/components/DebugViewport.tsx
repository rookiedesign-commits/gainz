import { useEffect, useState, type CSSProperties } from 'react'

// TEMPORÄR: zeigt die echten Viewport-Maße auf dem Gerät an, um den
// Standalone-Höhen-Bug zu diagnostizieren. Nach der Diagnose wieder entfernen.
export function DebugViewport() {
  const [, force] = useState(0)
  useEffect(() => {
    const on = () => force((n) => n + 1)
    window.addEventListener('resize', on)
    window.visualViewport?.addEventListener('resize', on)
    window.visualViewport?.addEventListener('scroll', on)
    const id = setInterval(on, 500)
    return () => {
      window.removeEventListener('resize', on)
      window.visualViewport?.removeEventListener('resize', on)
      window.visualViewport?.removeEventListener('scroll', on)
      clearInterval(id)
    }
  }, [])

  // safe-area-inset-bottom über ein Probe-Element messen
  const probe = document.getElementById('sai-probe')
  const saiBottom = probe ? Math.round(probe.getBoundingClientRect().height) : -1
  const ph = (id: string) => {
    const el = document.getElementById(id)
    return el ? Math.round(el.getBoundingClientRect().height) : -1
  }

  const de = document.documentElement
  const app = document.querySelector('.app') as HTMLElement | null
  const content = document.querySelector('.content') as HTMLElement | null
  const rows: [string, unknown][] = [
    ['screen.height', screen.height],
    ['availHeight', screen.availHeight],
    ['innerHeight', window.innerHeight],
    ['visualVP.h', Math.round(window.visualViewport?.height ?? -1)],
    ['docEl.client', de.clientHeight],
    ['safe-bottom', saiBottom],
    ['standalone', String((window.navigator as any).standalone)],
    ['displayMode', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'],
    ['.app rectH', app ? Math.round(app.getBoundingClientRect().height) : -1],
    ['.app bottom', app ? Math.round(app.getBoundingClientRect().bottom) : -1],
    ['.content rectH', content ? Math.round(content.getBoundingClientRect().height) : -1],
    ['.content bottom', content ? Math.round(content.getBoundingClientRect().bottom) : -1],
    ['.content scrollH', content ? content.scrollHeight : -1],
    ['100vh', ph('p-vh')],
    ['100dvh', ph('p-dvh')],
    ['100svh', ph('p-svh')],
    ['100lvh', ph('p-lvh')],
    ['fill-avail', ph('p-fill')],
  ]

  const hiddenProbe = (h: string): CSSProperties => ({
    position: 'fixed', top: 0, left: -9999, width: 1, height: h, pointerEvents: 'none', visibility: 'hidden',
  })

  return (
    <>
      <div id="sai-probe" style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 'env(safe-area-inset-bottom)', pointerEvents: 'none' }} />
      <div id="p-vh" style={hiddenProbe('100vh')} />
      <div id="p-dvh" style={hiddenProbe('100dvh')} />
      <div id="p-svh" style={hiddenProbe('100svh')} />
      <div id="p-lvh" style={hiddenProbe('100lvh')} />
      <div id="p-fill" style={hiddenProbe('-webkit-fill-available')} />
      <div
        style={{
          position: 'fixed', top: 'env(safe-area-inset-top)', left: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)', color: '#bfff39', font: '11px/1.35 monospace',
          padding: '6px 8px', maxWidth: '60vw', pointerEvents: 'none', borderRadius: '0 0 8px 0',
        }}
      >
        {rows.map(([k, v]) => (
          <div key={k}>{k}: {String(v)}</div>
        ))}
      </div>
    </>
  )
}
