import { useEffect, useState } from 'react'

// Utilidades sin interfaz de la pantalla de Tareas.

// En pantallas anchas el detalle va al lado de la lista; en angostas, en un panel lateral.
const CONSULTA_ANCHA = '(min-width: 80rem)'

export function useEsAncha() {
  const [ancha, setAncha] = useState(() => typeof window !== 'undefined' && window.matchMedia(CONSULTA_ANCHA).matches)
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_ANCHA)
    const cambiar = () => setAncha(consulta.matches)
    consulta.addEventListener('change', cambiar)
    return () => consulta.removeEventListener('change', cambiar)
  }, [])
  return ancha
}

// Copiar enlace: en el navegador puede fallar sin permiso; el aviso sale igual.
export function copiarEnlace(ruta: string) {
  const enlace = `${window.location.origin}${ruta}`
  navigator.clipboard?.writeText(enlace).catch(() => undefined)
}
