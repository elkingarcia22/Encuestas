import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { MarcoAdmin } from '../admin-compartido/marco-admin'
import { ENCUESTAS_INICIALES, migasDe } from './components/datos'
import { EncuestasContexto } from './components/estado'

// Template «Encuestas» (Desempeño y cultura › Encuestas). Calca /surveys/admin con los patrones
// del design system: tabla con búsqueda, filtros, recarga y acciones sobre la selección, carga,
// vacíos, el formulario por pasos para crear o editar, confirmaciones, avisos con «Deshacer» y carga de un archivo.

export function Component() {
  const { pathname } = useLocation()
  const [encuestas, setEncuestas] = useState(ENCUESTAS_INICIALES)
  const [demograficos, setDemograficos] = useState(false)
  // El formulario por pasos (crear o editar) va a 720 px, como Navegación › Pasos; la lista, a 1.140.
  const formulario = pathname.endsWith('/nueva') || pathname.endsWith('/editar')

  return (
    <MarcoAdmin migas={migasDe(pathname)} ancho={formulario ? 'narrow' : 'default'}>
      <EncuestasContexto.Provider value={{ encuestas, setEncuestas, demograficos, setDemograficos }}>
        <Outlet />
      </EncuestasContexto.Provider>
    </MarcoAdmin>
  )
}

Component.displayName = 'DesignSystemTemplateEncuestas'
