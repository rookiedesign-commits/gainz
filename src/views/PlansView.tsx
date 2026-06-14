import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { WEEKDAY_NAMES } from '../lib/schedule'

export default function PlansView() {
  const plans = useStore((s) => s.plans)
  const activePlanId = useStore((s) => s.activePlanId)
  const setActivePlan = useStore((s) => s.setActivePlan)
  const removePlan = useStore((s) => s.removePlan)

  return (
    <div>
      <h1 className="view-title">Pläne</h1>

      <Link to="/plans/import" className="btn btn-primary btn-block" style={{ marginBottom: 18 }}>
        ✨ Plan von Claude importieren
      </Link>

      {plans.length === 0 ? (
        <div className="center-empty">
          Noch keine Pläne.<br />
          Lass dir von Claude einen Plan erstellen und importiere ihn oben.
        </div>
      ) : (
        plans.map((plan) => {
          const active = plan.id === activePlanId
          const dayWeekdays = (d: { weekdays: number[] }) =>
            d.weekdays.map((w) => WEEKDAY_NAMES[w]).join(', ')
          return (
            <div key={plan.id} className="glass glass-card">
              <div className="row-between">
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <strong style={{ fontSize: 17 }}>{plan.name}</strong>
                    {active && <span className="pill active">aktiv</span>}
                  </div>
                  {plan.description && <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{plan.description}</div>}
                </div>
              </div>

              <hr className="divider" />

              <div className="stack">
                {plan.days.map((d) => (
                  <div key={d.id} className="row-between">
                    <div>
                      <div style={{ fontWeight: 650 }}>{d.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {d.exercises.length} Übungen · {dayWeekdays(d)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row" style={{ marginTop: 14, gap: 10 }}>
                {!active && (
                  <button className="btn btn-sm grow" onClick={() => setActivePlan(plan.id)}>
                    Aktivieren
                  </button>
                )}
                <button
                  className="btn btn-sm btn-ghost btn-danger"
                  onClick={() => {
                    if (confirm(`Plan "${plan.name}" wirklich löschen?`)) removePlan(plan.id)
                  }}
                >
                  Löschen
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
