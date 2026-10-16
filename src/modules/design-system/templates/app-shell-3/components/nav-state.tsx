import { useMemo, useState, type ReactNode } from 'react'

import { PLATAFORMA, PROGRAMAS } from './data'
import { NavContext } from './nav-context'

function resolverRuta(activo: string) {
  // El inicio se llama "Resumen" en las migas para no repetir "Inicio › Inicio".
  if (activo === 'inicio') return { etiqueta: 'Resumen' }

  for (const item of PLATAFORMA) {
    if (item.id === activo) return { etiqueta: item.label }
    const hijo = item.children?.find((c) => c.id === activo)
    if (hijo) return { etiqueta: hijo.label, seccion: item.label }
  }

  const programa = PROGRAMAS.find((p) => p.id === activo)
  if (programa) return { etiqueta: programa.label, seccion: 'Programas activos' }

  return { etiqueta: 'Resumen' }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [activo, setActivo] = useState('inicio')

  const valor = useMemo(() => {
    const { etiqueta, seccion } = resolverRuta(activo)
    return { activo, navegar: setActivo, etiqueta, seccion }
  }, [activo])

  return <NavContext.Provider value={valor}>{children}</NavContext.Provider>
}
