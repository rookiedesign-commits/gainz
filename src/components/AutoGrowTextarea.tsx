import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

/** Textarea, die in der Höhe mit ihrem Inhalt wächst (keine feste Höhe, kein Scrollen). */
export function AutoGrowTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Bei jedem Wertwechsel (auch initial) neu anpassen.
  useLayoutEffect(resize, [props.value])

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onInput={(e) => {
        resize()
        props.onInput?.(e)
      }}
    />
  )
}
