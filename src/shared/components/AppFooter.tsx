import { Fragment } from 'react'
import { useLocation } from 'react-router'
import { Separator } from '@ubits/flux-ui'
import { UbitsLogo } from '@/shared/components/UbitsLogo'
import { notify } from '@/shared/components/notify'
import { getSectionId } from '@/shared/layouts/nav-config'

const LINKS = ['Términos y condiciones de uso de la plataforma', 'Política de privacidad']

/**
 * Las pantallas donde **se está creando algo** tampoco lo llevan: son pantallas de trabajo que ocupan todo el alto
 * —índice, vista previa y barra de acciones—, así que el pie o empuja el contenido o aparece al final de un scroll
 * que no debería existir. Los legales siguen donde se consultan: listas y pantallas de detalle (Dave, 8-oct).
 */
const CREACION = ['/lms-creator/crear-contenido', '/lms-creator/crear-ruta', '/lms-creator/agregar-', '/lms-creator/vista-colaborador']
// Los resultados de un contenido tampoco: es una subvista, no un inicio (el jefe de Dave, 13-oct).
const SIN_PIE = [...CREACION, /\/lms-creator\/contenidos\/[^/]+\/resultados/]

// En estos módulos el pie va solo en su inicio (la pantalla que abre el menú), no en los procesos (crear, editar, cargar)
// ni en las vistas internas (resultados, comparativo, detalle): pedido de Elkin, 13-oct, para Encuestas y Objetivos.
const SOLO_EN_EL_INICIO = [
  '/admin/desempeno-cultura/encuestas',
  '/admin/desempeno-cultura/objetivos',
  '/portal-colaborador/desempeno-cultura/encuestas',
  '/portal-colaborador/desempeno-cultura/objetivos',
]
const esVistaInterna = (ruta: string) => SOLO_EN_EL_INICIO.some((inicio) => ruta.startsWith(`${inicio}/`) && ruta !== `${inicio}/`)

// Pie al final de cada pantalla: «Con la tecnología de UBITS» y los legales, todo en gris y centrado.
// Suite AI no lo lleva (el chat y la voz ocupan toda la altura), ni Selección. Encuestas y Objetivos solo en su inicio.
export function AppFooter() {
  const { pathname } = useLocation()
  if (getSectionId(pathname) === 'suite-ai' || esVistaInterna(pathname)) return null
  if (SIN_PIE.some((ruta) => (typeof ruta === 'string' ? pathname.includes(ruta) : ruta.test(pathname)))) return null
  // Selección no lo lleva (8 oct, Nicolás: «quitemos esto de todo lado en selección, solo va a estar en el home»).
  // Sin pie queda solo su aire: 24px debajo de lo último, también en páginas largas (con scroll se pierde el del marco).
  if (pathname.startsWith('/admin/seleccion')) return <div aria-hidden="true" className="-mb-6 shrink-0 pb-6" />

  return (
    // pb-6 con -mb-6: en páginas largas el margen de abajo del marco se pierde al hacer scroll; así el pie
    // siempre queda con 24px de aire debajo, sin duplicarlo en las páginas cortas.
    <footer className="mt-auto -mb-6 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-12 pb-6 text-[13px] text-muted-foreground">
      <span className="flex items-center gap-2">
        Con la tecnología de
        <UbitsLogo className="h-4 text-muted-foreground" />
      </span>
      {LINKS.map((link) => (
        <Fragment key={link}>
          <Separator orientation="vertical" className="h-3.5! self-center!" />
          {/* Enlace de texto legal: flux-ui no tiene un componente de enlace, se deja el <a> nativo. */}
          <a
            href="#"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            onClick={(event) => {
              event.preventDefault()
              notify(link)
            }}
          >
            {link}
          </a>
        </Fragment>
      ))}
    </footer>
  )
}
