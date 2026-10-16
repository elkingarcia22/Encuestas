import { useCallback, useEffect, useRef, useState } from 'react'

// Abre el buscador con ⌘K / Ctrl+K y lo cierra con Esc.
// `returnFocus` guarda dónde estaba el foco al abrir, para devolverlo ahí al cerrar: el buscador no tiene disparador propio
// y el foco se perdía en la página (AA 2.4.3).
export function useCommandPalette() {
  const [open, setOpenState] = useState(false)
  const openRef = useRef(open)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    openRef.current = open
  }, [open])

  const remember = useCallback(() => {
    if (!openRef.current && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement
  }, [])

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) remember()
      setOpenState(next)
    },
    [remember],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        remember()
        setOpenState((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [remember])

  return { open, setOpen, returnFocus }
}
