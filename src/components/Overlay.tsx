import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  children: ReactNode
  onBackdrop?: () => void
}

/**
 * Vollbild-Overlay. Wird per Portal direkt an <body> gehängt, damit es nicht
 * von Eltern-Containern mit transform/backdrop-filter eingefangen wird
 * (sonst erscheint es nur als kleines Rechteck). Sperrt zusätzlich das Scrollen.
 */
export function Overlay({ children, onBackdrop }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div className="overlay" onClick={(e) => onBackdrop && e.target === e.currentTarget && onBackdrop()}>
      {children}
    </div>,
    document.body
  )
}
