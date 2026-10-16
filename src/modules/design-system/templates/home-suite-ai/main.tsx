import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare02Icon } from '@hugeicons/core-free-icons'

import { ShellUbits, type GrupoNav, type HijoNav } from '../../shell/shell-ubits'
import { DialogoFeedback } from '../home-operativo/components/dialogo-feedback'
import { InicioOperativo } from '../home-operativo/components/inicio-operativo'
import { Buscador } from '../suite-ai/components/buscador'
import { INICIO, MENU, ruta as rutaSuite, type Pantalla } from '../suite-ai/components/data'
import { DialogoCambio, DialogoModal, DialogoNovedades } from '../suite-ai/components/dialogos'
import { SuiteContexto, useEstadoSuite } from '../suite-ai/components/estado'
import {
  BotonAyuda,
  BotonBuscar,
  BotonNovedades,
  CentroProcesos,
  FilaMarca,
  MenuPerfil,
  MenuSuite,
  PanelNotificaciones,
  PieSuite,
} from '../suite-ai/components/marco'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'

// Template «Home Suite AI»: el Home operativo (top métricas, Necesita tu atención y Quick actions)
// dentro del menú lateral y la barra superior del template Suite AI (concepto de Nicolás). Solo el
// Inicio vive aquí; el resto del menú, la pestaña Suite AI y el buscador llevan a las pantallas del
// template Suite AI, que comparte el mismo marco.

const BASE = '/design-system/templates/home-suite-ai'

const aHijo = (pantalla: Pantalla): HijoNav => ({
  titulo: pantalla.titulo,
  ruta: pantalla.slug ? rutaSuite(pantalla.slug) : undefined,
  hijos: pantalla.hijos?.map(aHijo),
})

const GRUPOS: GrupoNav[] = MENU.map((bloque) => ({
  etiqueta: bloque.etiqueta,
  items: bloque.secciones.map((seccion) => ({
    titulo: seccion.titulo,
    icono: seccion.icono,
    badge: seccion.badge,
    ruta: seccion.slug ? rutaSuite(seccion.slug) : undefined,
    hijos: seccion.hijos?.map(aHijo),
  })),
}))

// Slugs del Home operativo → pantallas del template Suite AI (LMS Creator es el editor).
const EQUIVALENTES: Record<string, string> = {
  contenidos: 'editor',
  planes: 'planes-de-formacion',
  'descarga-certificados': 'certificados',
}
const enlace = (slug: string) => rutaSuite(EQUIVALENTES[slug] ?? slug)

export function Component() {
  const suite = useEstadoSuite()
  const { abrirBuscador } = suite
  const navigate = useNavigate()

  // ⌘K (o Ctrl+K) abre el buscador, como en Suite AI.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        abrirBuscador()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abrirBuscador])

  // Cada vez que se abre Feedback el formulario arranca limpio.
  const [feedback, setFeedback] = useState({ abierto: false, vez: 0 })
  const alCambiarFeedback = useCallback((abrir: boolean) => setFeedback((f) => ({ ...f, abierto: abrir })), [])

  return (
    <SuiteContexto.Provider value={suite}>
      <>
        <ShellUbits
          marca={{ nombre: suite.organizacion, inicial: 'M', fila: <FilaMarca /> }}
          inicio={{ titulo: INICIO.titulo, icono: INICIO.icono, ruta: BASE }}
          grupos={GRUPOS}
          migas={[{ etiqueta: 'Inicio' }]}
          promo={<PieSuite onFeedback={() => setFeedback((f) => ({ abierto: true, vez: f.vez + 1 }))} />}
          acciones={
            <>
              <BotonBuscar forma="campo" />
              <BotonNovedades />
              <BotonAyuda />
              <CentroProcesos />
            </>
          }
          cuenta={
            <>
              <PanelNotificaciones />
              <MenuPerfil />
            </>
          }
          agente={{ menu: <MenuSuite /> }}
          modo="workspace"
          onModoChange={(modo) => {
            if (modo === 'agente-ia') navigate(rutaSuite('chat'))
          }}
          iconosModo={{
            workspace: <HugeiconsIcon icon={DashboardSquare02Icon} aria-hidden="true" />,
            agente: <IconoIA />,
          }}
          variante="sidebar"
        >
          <InicioOperativo enlace={enlace} />
        </ShellUbits>
        <Buscador key={`buscador-${suite.buscador.vez}`} />
        <DialogoModal />
        <DialogoNovedades />
        <DialogoCambio />
        <DialogoFeedback key={`feedback-${feedback.vez}`} abierto={feedback.abierto} onAbierto={alCambiarFeedback} />
      </>
    </SuiteContexto.Provider>
  )
}

Component.displayName = 'DesignSystemTemplateHomeSuiteAi'
