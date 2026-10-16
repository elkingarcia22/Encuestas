import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare02Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'

import { ShellUbits, type GrupoNav, type HijoNav, type Miga } from '../../shell/shell-ubits'
import { DialogoFeedback } from '../home-operativo/components/dialogo-feedback'
import { ActividadAgente } from './components/actividad'
import { AgenteContextual } from './components/agente-contextual'
import { Buscador } from './components/buscador'
import { BASE, HISTORIAL, INICIO, MENU, ruta, ubicacionDe, type Pantalla } from './components/data'
import { DialogoCambio, DialogoModal, DialogoNovedades } from './components/dialogos'
import { SuiteContexto, useEstadoSuite } from './components/estado'
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
} from './components/marco'

// Template «Suite AI»: el concepto de Nicolás García («Agente IA Ubits - Prototipo») llevado a
// código con flux-ui y el marco único del playground (ShellUbits). Siete casos navegables: Inicio,
// Agente IA, Propuesta editable, Editor + agente, Modo voz, Aprobación y Buscador. Cada chat es
// una ruta; la pestaña Suite AI se enciende sola cuando la ruta es un chat.

const aHijo = (pantalla: Pantalla): HijoNav => ({
  titulo: pantalla.titulo,
  ruta: pantalla.slug ? ruta(pantalla.slug) : undefined,
  hijos: pantalla.hijos?.map(aHijo),
})

const GRUPOS: GrupoNav[] = MENU.map((bloque) => ({
  etiqueta: bloque.etiqueta,
  items: bloque.secciones.map((seccion) => ({
    titulo: seccion.titulo,
    icono: seccion.icono,
    badge: seccion.badge,
    ruta: seccion.slug ? ruta(seccion.slug) : undefined,
    hijos: seccion.hijos?.map(aHijo),
  })),
}))

function migasDe(resto: string, tituloLibre: string | null): Miga[] {
  if (!resto) return [{ etiqueta: 'Inicio' }]
  if (resto === 'chat') return [{ etiqueta: 'Nuevo chat' }]
  if (resto === 'editor') return [{ etiqueta: 'Aprendizaje' }, { etiqueta: 'Contenidos' }, { etiqueta: 'Onboarding operativo' }]
  if (resto === 'vacantes') return [{ etiqueta: 'Selección' }, { etiqueta: 'Vacantes' }]
  if (resto.startsWith('chat/')) {
    const id = resto.slice(5)
    const chat = HISTORIAL.flatMap((g) => g.chats).find((c) => c.id === id)
    return [{ etiqueta: chat?.titulo ?? tituloLibre ?? 'Chat' }]
  }
  const ubicacion = ubicacionDe(resto)
  if (!ubicacion) return [{ etiqueta: 'Inicio', ruta: BASE }]
  return ubicacion.seccion ? [{ etiqueta: ubicacion.seccion }, { etiqueta: ubicacion.titulo }] : [{ etiqueta: ubicacion.titulo }]
}

export function Component() {
  const suite = useEstadoSuite()
  const { abrirBuscador } = suite
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const resto = pathname.slice(BASE.length).replace(/^\/|\/$/g, '')
  const enChat = resto === 'chat' || resto.startsWith('chat/')
  const enEditor = resto === 'editor'
  const enVoz = resto === 'voz'
  const enVacaciones = resto === 'chat/vacaciones'

  // La última pantalla de cada ambiente, para volver a ella con las pestañas Workspace / Suite AI.
  const ultima = useRef({ workspace: BASE, agente: ruta('chat') })
  useEffect(() => {
    if (enVoz) return
    if (enChat) ultima.current.agente = pathname
    else ultima.current.workspace = pathname
  }, [pathname, enChat, enVoz])

  // En el editor el menú se pliega a íconos para dar ancho, como en el concepto; se puede abrir.
  const [abierto, setAbierto] = useState(!enEditor)
  const [vistaEditor, setVistaEditor] = useState(enEditor)
  if (vistaEditor !== enEditor) {
    setVistaEditor(enEditor)
    setAbierto(!enEditor)
  }

  // ⌘K (o Ctrl+K) abre el buscador desde cualquier pantalla.
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

  const panelEditor = enEditor && suite.editor.panel !== 'cerrado'
  const lateral = panelEditor ? <AgenteContextual /> : enVacaciones ? <ActividadAgente /> : undefined

  // Los botones del encabezado cambian según la pantalla, como en el prototipo.
  const acciones = enEditor ? (
    <>
      <Badge variant={suite.editor.publicado ? 'success-light' : 'secondary'} size="sm">
        {suite.editor.publicado ? 'Publicado' : 'Borrador'}
      </Badge>
      {suite.editor.panel === 'cerrado' ? (
        <ReopenAgentButton onClick={() => suite.panelEditor('abierto')} />
      ) : null}
    </>
  ) : resto === 'vacantes' ? (
    <BotonBuscar forma="amplio" />
  ) : (
    <>
      <BotonBuscar forma={enChat ? 'icono' : 'campo'} />
      <BotonNovedades compacto={Boolean(lateral)} />
      {lateral ? null : <BotonAyuda />}
      <CentroProcesos />
    </>
  )
  const cuenta =
    enEditor || resto === 'vacantes' ? (
      <MenuPerfil />
    ) : (
      <>
        <PanelNotificaciones />
        <MenuPerfil />
      </>
    )

  return (
    <SuiteContexto.Provider value={suite}>
      <>
        {enVoz ? (
          <Outlet />
        ) : (
          <ShellUbits
            marca={{ nombre: suite.organizacion, inicial: 'M', fila: <FilaMarca /> }}
            inicio={{ titulo: INICIO.titulo, icono: INICIO.icono, ruta: BASE }}
            grupos={GRUPOS}
            migas={migasDe(resto, suite.tituloLibre)}
            promo={<PieSuite onFeedback={() => setFeedback((f) => ({ abierto: true, vez: f.vez + 1 }))} />}
            acciones={acciones}
            cuenta={cuenta}
            agente={{ menu: <MenuSuite /> }}
            modo={enChat ? 'agente-ia' : 'workspace'}
            onModoChange={(modo) => navigate(modo === 'agente-ia' ? ultima.current.agente : ultima.current.workspace)}
            iconosModo={{
              workspace: <HugeiconsIcon icon={DashboardSquare02Icon} aria-hidden="true" />,
              agente: <IconoIA />,
            }}
            variante="sidebar"
            abierto={abierto}
            onAbiertoChange={setAbierto}
            lateral={lateral}
          >
            <Outlet />
          </ShellUbits>
        )}
        <Buscador key={`buscador-${suite.buscador.vez}`} />
        <DialogoModal />
        <DialogoNovedades />
        <DialogoCambio />
        <DialogoFeedback key={`feedback-${feedback.vez}`} abierto={feedback.abierto} onAbierto={alCambiarFeedback} />
      </>
    </SuiteContexto.Provider>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAi'
