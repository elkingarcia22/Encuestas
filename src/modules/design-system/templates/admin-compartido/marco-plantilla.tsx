import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'

import { PageShell } from '@/shared/components/PageShell'
import type { PageWidth } from '@/shared/components/page-width'
import { useSetPageCrumbs } from '@/shared/components/page-crumbs'

// Marco de las plantillas (Home operativo, Gestión de usuarios, Planes, Encuestas y Colaborador). La barra
// lateral, la barra superior y el pie son los del design system (marco general): el menú lo pone nav-config
// en las secciones «plantilla-admin» y «plantilla-colaborador». Aquí solo va el contenedor y las migas, que se
// registran para que las muestre la barra de arriba.
//
// El contenedor mide 1.140 px, salvo en formularios y pasos, que van a 720 (`ancho="narrow"`, como Navegación ›
// Pasos): cada plantilla lo decide según la ruta (auditoría, 5-oct).

export type Miga = { etiqueta: string; ruta?: string }

export function MarcoPlantilla({ migas, ancho = 'default', children }: { migas: Miga[]; ancho?: PageWidth; children: ReactNode }) {
  const { pathname } = useLocation()

  // La miga va arriba, en la barra superior: aquí solo se le dice dónde estamos (el menú no conoce pantallas como
  // «Crear encuesta»).
  useSetPageCrumbs(migas.map((miga) => ({ label: miga.etiqueta, path: miga.ruta })))

  // El contenido se desplaza dentro del marco general: al cambiar de pantalla vuelve arriba (después de
  // guardar un formulario largo, la lista no debe abrir a mitad de página).
  const inicio = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    inicio.current?.closest('.overflow-auto')?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      <PageShell width={ancho} className="gap-4">
        <span ref={inicio} aria-hidden="true" />
        {children}
      </PageShell>
    </>
  )
}
