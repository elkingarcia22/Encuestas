import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { MarcoAdmin } from '../admin-compartido/marco-admin'
import { PLANES_INICIALES, migasDe } from './components/datos'
import { PlanesContexto } from './components/estado'

// Template «Planes de formación» (Aprendizaje › Planes de Formación › Planes). Calca la lista, la
// creación con «Agregar asignación» y el detalle de progreso de la plataforma, con los patrones
// del design system: tabla con acciones según el estado, formulario por pasos, vacíos, dato que no
// está en vivo, confirmación escribiendo «eliminar» y avisos.

export function Component() {
  const { pathname } = useLocation()
  const [planes, setPlanes] = useState(PLANES_INICIALES)

  // Un plan en «Procesando» avanza solo mientras la plataforma asigna a las personas; al llegar al
  // 100 % queda en el estado que le toca por fechas (RN-05).
  const procesando = planes.some((p) => p.estado === 'Procesando')
  useEffect(() => {
    if (!procesando) return
    const id = window.setInterval(() => {
      setPlanes((todos) =>
        todos.map((p) => {
          if (p.estado !== 'Procesando') return p
          const siguiente = Math.min(100, (p.procesando ?? 0) + 5)
          if (siguiente < 100) return { ...p, procesando: siguiente }
          return { ...p, procesando: undefined, estado: p.inicio > '2026-09-11' ? 'Planeado' : 'Vigente' }
        }),
      )
    }, 2500)
    return () => window.clearInterval(id)
  }, [procesando])

  return (
    <MarcoAdmin migas={migasDe(pathname, planes)}>
      <PlanesContexto.Provider value={{ planes, setPlanes }}>
        <Outlet />
      </PlanesContexto.Provider>
    </MarcoAdmin>
  )
}

Component.displayName = 'DesignSystemTemplatePlanesFormacion'
