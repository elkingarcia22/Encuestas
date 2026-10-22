import { Fragment } from 'react'
import { useLocation } from 'react-router'
import { Separator } from '@ubits/flux-ui'
import { UbitsLogo } from '@/shared/components/UbitsLogo'
import { notify } from '@/shared/components/notify'

const LINKS = ['Términos y condiciones de uso de la plataforma', 'Política de privacidad']

// El pie solo vive en los inicios (regla «footer-solo-home», war room del 13-oct: Carlos se lo asignó a Cristian). En el
// resto de pantallas —listas, detalles, creaciones, Suite AI— no existe, para que no choque con las barras fijas ni sume
// un scroll que no debería existir. Antes era al revés: una lista de pantallas sin pie que crecía con cada caso.
const INICIOS = ['/admin', '/portal-colaborador', '/design-system']
const esInicio = (ruta: string) => INICIOS.includes(ruta.replace(/\/+$/, '') || '/')

// Pie de los inicios: «Con la tecnología de UBITS» y los legales, todo en gris y centrado. `siempre` es para las
// demostraciones del design system que enseñan el marco con su pie.
export function AppFooter({ siempre = false }: { siempre?: boolean }) {
  const { pathname } = useLocation()
  // Sin pie queda solo su aire: 24px debajo de lo último, también en páginas largas (con scroll se pierde el del marco).
  if (!siempre && !esInicio(pathname)) return <div aria-hidden="true" className="-mb-6 shrink-0 pb-6" />

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
