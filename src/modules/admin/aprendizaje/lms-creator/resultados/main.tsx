import { useCallback, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Clock01Icon, Download04Icon, Edit02Icon, MoreHorizontalIcon, Search01Icon, UserGroupIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BASE_LMS, reemplazarBorrador } from '../crear-contenido/components/borrador'
import { borradorDemo } from '../crear-contenido/components/demo'
import { retomarBorrador } from '../crear-contenido/components/publicar'
import { useParametroUrl, useVolverArriba } from './components/piezas'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { HistorialCambios } from './components/historial'
import { Asistencias } from './components/asistencias'
import { useDescargas, PanelDescargas } from './components/descargas'
import { fecha, numero, useResultados, type PestanaId } from './components/datos'
import { Evaluaciones } from './components/evaluaciones'
import { AnalisisIa } from './components/ia'
import { Intentos } from './components/intentos'
import { Progreso } from './components/progreso'
import { Roleplay } from './components/roleplay'

// Resultados de un contenido: cómo le está yendo a la gente con lo que publicaste.
//
// Es una pantalla **aparte de la edición**, y esa es la decisión que la define (Dave, 13-oct). En producción y en el
// playground React, Resultados es un paso más del editor: se entra a «editar» un contenido y la primera pestaña son
// los resultados. Pero mirar cómo va y cambiar lo que dice son dos trabajos distintos, con dos momentos distintos y
// —casi siempre— dos personas distintas. Mezclarlos hace que quien solo quería mirar entre en modo edición, con el
// riesgo de tocar algo sin querer.
//
// Por eso: un contenido en **borrador** abre el asistente de creación (hay que terminarlo), y uno **ya publicado**
// abre esta pantalla (hay que mirarlo). Para cambiarlo está el botón «Editar», que es una decisión consciente.

const RUTA_CONTENIDOS = `${BASE_LMS}/contenidos`

// El curso de ejemplo del playground: el único con recursos de verdad (vídeo, SCORM, evaluaciones y roleplay).
const ID_DEMO = 'f007'
const sembrarDemo = () => reemplazarBorrador({ ...borradorDemo(), navegacion: 'libre' })

const ETIQUETA: Record<PestanaId, string> = {
  progreso: 'Progreso',
  evaluaciones: 'Evaluaciones',
  intentos: 'Gestión de intentos',
  asistencias: 'Asistencias',
  roleplay: 'Roleplay',
  ia: 'Análisis con IA',
}

const VARIANTE_VISIBILIDAD = {
  Publicado: 'success-light',
  Privado: 'info-light',
  Borrador: 'secondary',
  Oculto: 'warning-light',
  Archivado: 'outline',
} as const

function SinContenido() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Contenidos', to: RUTA_CONTENIDOS }} title="Resultados" />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No encontramos este contenido</EmptyTitle>
            <EmptyDescription>Puede que se haya eliminado. Vuelve a la lista para elegir otro.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => navigate(RUTA_CONTENIDOS)}>
              Volver a contenidos
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const resultados = useResultados(id)
  const ancla = useVolverArriba(id)
  // La pestaña abierta va en la dirección: `?tab=roleplay` abre esa pestaña y se puede pasar por un enlace.
  const [pestana, setPestana] = useParametroUrl('tab', 'progreso')
  // El panel y su pestaña, también en la dirección: `?panel=descargas` lo abre.
  const [panel, setPanel] = useParametroUrl('panel')
  const [pestanaDescargas, setPestanaDescargas] = useParametroUrl('reporte', 'reportes')
  const conDescargas = panel === 'descargas'
  const setConDescargas = useCallback((abierto: boolean) => setPanel(abierto ? 'descargas' : ''), [setPanel])
  // Desde el Centro de procesos, «Ver» abre este panel directo en «Descargas», que es donde está lo que se preparó.
  const verDescargas = useCallback(() => {
    setPestanaDescargas('descargas')
    setPanel('descargas')
  }, [setPanel, setPestanaDescargas])
  const centro = useDescargas(verDescargas)

  if (!resultados) return <SinContenido />

  const { contenido, pestanas, datos, inscritos } = resultados
  // Si la dirección pide una pestaña que este contenido no tiene, se abre la primera: un enlace a `?tab=roleplay`
  // de un contenido sin roleplay no puede dejar la pantalla en blanco.
  const activa = pestanas.includes(pestana as PestanaId) ? (pestana as PestanaId) : pestanas[0]

  // Las dos salidas a otra pantalla cargan **este** contenido antes de irse. Sin eso abrían lo último que hubiera
  // quedado en el borrador, que podía ser cualquier otro contenido: desde el evento, «Editar» llevaba a editar otro
  // curso sin avisar (13-oct).
  //
  // El curso de ejemplo del playground es el único que trae recursos de verdad; de los demás solo hay su ficha, así
  // que la vista previa de esos muestra la portada y nada más, que es lo que hay.
  const cargarEsteContenido = () => {
    if (contenido.id === ID_DEMO) return sembrarDemo()
    retomarBorrador(contenido)
  }

  const verComoEstudiante = () => {
    cargarEsteContenido()
    // `destino` devuelve la X a Resultados. Con `volver` salía al asistente, que es de donde no se venía.
    navigate(`${BASE_LMS}/vista-colaborador?destino=${encodeURIComponent(`${BASE_LMS}/contenidos/${contenido.id}/resultados`)}`)
  }

  const editar = () => {
    cargarEsteContenido()
    navigate(`${BASE_LMS}/crear-contenido`)
  }

  const contenidoDe = (cual: PestanaId): ReactNode => {
    if (cual === 'progreso') return <Progreso resultados={resultados} />
    if (cual === 'evaluaciones') return <Evaluaciones resultados={resultados} />
    if (cual === 'intentos') return <Intentos resultados={resultados} />
    if (cual === 'asistencias') return <Asistencias resultados={resultados} />
    if (cual === 'roleplay') return <Roleplay resultados={resultados} />
    // Desde un hallazgo de la IA se salta a la pestaña que tiene la evidencia.
    if (cual === 'ia') return <AnalisisIa resultados={resultados} onIr={setPestana} />
    return null
  }

  return (
    <PageShell>
      <div ref={ancla} />
      <Tabs value={activa} onValueChange={setPestana}>
        <PageHeader
          back={{ label: 'Contenidos', to: RUTA_CONTENIDOS }}
          title={
            // En escritorio el título se queda en una línea y, si no cabe, se recorta y se lee entero al pasar el
            // cursor; en el teléfono ocupa las líneas que necesite, porque ahí no hay ancho que repartir. `block` es
            // lo que hace falta para que recorte: en un `span` en línea, `overflow` no hace nada.
            <TextoCompleto texto={contenido.titulo}>
              <span className="lg:line-clamp-1">{contenido.titulo}</span>
            </TextoCompleto>
          }
          badge={<Badge variant={VARIANTE_VISIBILIDAD[contenido.visibilidad] ?? 'outline'}>{contenido.visibilidad}</Badge>}
          meta={[
            { icono: Calendar03Icon, texto: contenido.tipo },
            { icono: Clock01Icon, texto: contenido.minutos >= 60 ? `${Math.round((contenido.minutos / 60) * 10) / 10} h`.replace('.', ',') : `${contenido.minutos} min` },
            { icono: UserGroupIcon, texto: `${numero(inscritos)} ${inscritos === 1 ? 'inscrito' : 'inscritos'}` },
            ...(datos.fechaPublicacion ? [{ icono: Calendar03Icon, texto: `Publicado el ${fecha(datos.fechaPublicacion)}` }] : []),
          ].map((dato) => (
            <span key={dato.texto} className="flex items-center gap-1.5">
              <HugeiconsIcon icon={dato.icono} size={15} aria-hidden="true" />
              {dato.texto}
            </span>
          ))}
          actions={
            <>
              {/* Orden de la cabecera (decisión 15 de la auditoría, 5-oct): el «⋯» primero, con su menú abierto hacia
                  el inicio, y el primario al final.

                  **Descargar es el primario y Editar se va al menú** (Dave, 13-oct). A esta pantalla se entra a mirar
                  cómo va el contenido, y lo que se hace con lo que se ve es llevárselo; editar es irse a otro sitio, y
                  tenerlo de botón grande invita a tocar lo que solo se venía a consultar. */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del contenido" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={editar}>
                      <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={verComoEstudiante}>
                      <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
                      Vista previa
                    </DropdownMenuItem>
                    {/* Un borrador no tiene historial: mientras se crea, nada de lo que se cambia afecta a nadie. */}
                    {contenido.visibilidad !== 'Borrador' ? (
                      <DropdownMenuItem onClick={() => setPanel('historial')}>
                        <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
                        Historial de cambios
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* El botón cambia solo cuando hay algo preparándose: así el estado se ve sin abrir el panel. */}
              <Button onClick={() => setConDescargas(true)}>
                {centro.preparando > 0 ? <Spinner /> : <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />}
                {centro.preparando > 0 ? 'Preparando archivo' : 'Descargar'}
              </Button>
            </>
          }
          tabs={
            <TabsList variant="line">
              {pestanas.map((cual) => (
                <TabsTrigger key={cual} value={cual} className="flex-none">
                  {ETIQUETA[cual]}
                </TabsTrigger>
              ))}
            </TabsList>
          }
        />
        <PageContent>
          {pestanas.map((cual) => (
            <TabsContent key={cual} value={cual}>
              {cual === activa ? contenidoDe(cual) : null}
            </TabsContent>
          ))}
          {/* El aire que dejaría el pie. Esta pantalla no lo lleva, y sin esto lo último de la tabla queda pegado al
              borde de abajo. Es el mismo apaño que usa el marco donde tampoco hay pie: `pb-6` con `-mb-6`, porque al
              desplazarse se pierde el margen de abajo del contenedor y queda solo este relleno (Dave, 13-oct). */}
          <div aria-hidden="true" className="-mb-6 shrink-0 pb-6" />
        </PageContent>
      </Tabs>

      <DrawerShell open={panel === 'historial'} onOpenChange={(abierto) => !abierto && setPanel('')} title="Historial de cambios" size="md">
        <HistorialCambios resultados={resultados} />
      </DrawerShell>

      <PanelDescargas abierto={conDescargas} onAbierto={setConDescargas} resultados={resultados} centro={centro} pestana={pestanaDescargas === 'descargas' ? 'descargas' : 'reportes'} onPestana={setPestanaDescargas} />
    </PageShell>
  )
}

Component.displayName = 'AdminAprendizajeLmsCreatorResultadosPage'
