import { useCallback, useRef, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Clock01Icon, Download04Icon, Edit02Icon, MoreHorizontalIcon, Search01Icon, UserGroupIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { Badge } from '@/shared/components/Badge'
import { avisarFlujoPendiente } from '../compartido/avisos'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BASE_LMS, reemplazarBorrador } from '../crear-contenido/components/borrador'
import { borradorDemo } from '../crear-contenido/components/demo'
import { retomarBorrador } from '../crear-contenido/components/publicar'
import { useParametroUrl, useVolverArriba } from './components/piezas'
import { FiltroPeriodo, usePeriodo } from './components/periodo'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { HistorialCambios } from './components/historial'
import { Asistencias } from './components/asistencias'
import { useDescargas, PanelDescargas, pedirReporte } from './components/descargas'
import { fecha, numero, useResultados, type PestanaId } from './components/datos'
import { alertasDe } from './components/atencion'
import { BloqueAtencion } from '@/shared/components/BloqueAtencion'
import { Encuestas } from './components/encuestas'
import { Evaluaciones } from './components/evaluaciones'
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

/** Los dos tipos que cambian qué se enseña en la vista previa. Los demás —curso, libro— van con el ejemplo normal. */
const TIPO_EVENTO = 'Evento'
const TIPO_RUTA = 'Ruta de aprendizaje'
const sembrarDemo = () => reemplazarBorrador({ ...borradorDemo(), navegacion: 'libre' })

// Los nombres de las pestañas. El orden en que se enseñan lo decide `useResultados`, que lo arma según lo que tiene
// cada contenido; aquí están en ese mismo orden solo para leerlo de corrido.
const ETIQUETA: Record<PestanaId, string> = {
  progreso: 'Progreso',
  asistencias: 'Asistencias',
  roleplay: 'Roleplay',
  evaluaciones: 'Evaluaciones',
  intentos: 'Gestión de intentos',
  encuestas: 'Encuestas',
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
  const periodo = usePeriodo()
  const resultados = useResultados(id, periodo)
  const ancla = useVolverArriba(id)
  // Hasta dónde baja la pantalla al saltar a una pestaña desde la franja de atención.
  const anclaPestanas = useRef<HTMLDivElement>(null)
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

  const { contenido, pestanas, datos, iniciaron } = resultados
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
    // Una ruta no tiene vista previa todavía: se recupera solo su ficha, como hasta ahora.
    if (contenido.tipo === TIPO_RUTA) return retomarBorrador(contenido)
    // Los demás se rellenan con las páginas del ejemplo —las del evento si es un evento, que son las que traen las
    // asistencias—, con la ficha de **este** contenido encima. Sin páginas, la vista del colaborador enseñaba solo la
    // portada y el cierre, que no es la vista previa de nada (Dave, 14-oct).
    retomarBorrador(contenido, { ...borradorDemo(contenido.tipo === TIPO_EVENTO), navegacion: 'libre' })
  }

  const verComoEstudiante = () => {
    cargarEsteContenido()
    // `destino` devuelve la X a Resultados. Con `volver` salía al asistente, que es de donde no se venía.
    navigate(`${BASE_LMS}/vista-colaborador?destino=${encodeURIComponent(`${BASE_LMS}/contenidos/${contenido.id}/resultados`)}`)
  }

  /**
   * **Editar un contenido publicado todavía no existe.**
   *
   * Llevaba al asistente de creación, y eso no es editar: se entraba por el paso 1 de «Crear contenido» con la ficha
   * cargada, sin saber si lo que se guardaba reemplazaba al contenido o creaba otro. Estaba confundiendo a la gente
   * que prueba el playground, así que hasta que el flujo exista lo dice y no lleva a ninguna parte (Dave, 15-oct).
   *
   * Vale para todas las puertas: el botón de la cabecera y los asuntos de la franja que ofrecen «Editar recurso»,
   * «Editar roleplay» o «Revisar la visibilidad».
   */
  const editar = () => avisarFlujoPendiente('edición')

  /**
   * Ir a una pestaña desde la franja de atención **baja hasta ella**.
   *
   * La franja vive arriba del todo, así que cambiar de pestaña sin moverse dejaba la pantalla igual: el cambio
   * pasaba fuera de la vista y parecía que el botón no hacía nada (Dave, 15-oct).
   */
  const irAPestana = (destino: PestanaId) => {
    setPestana(destino)
    // En el siguiente fotograma: la pestaña todavía no se ha pintado cuando se pide el desplazamiento.
    requestAnimationFrame(() => anclaPestanas.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Lo que necesita tu atención, con cada asunto enganchado a lo que hay que hacer con él.
  const alertas = alertasDe(resultados, {
    onIr: irAPestana,
    onEditar: editar,
    onSalir: (ruta) => navigate(ruta),
    // Pedir el reporte desde el asunto deja el panel abierto, que es donde se ve en qué va.
    onDescargar: (tipo) => {
      pedirReporte(centro, resultados, tipo)
      verDescargas()
    },
  })

  const contenidoDe = (cual: PestanaId): ReactNode => {
    if (cual === 'progreso') return <Progreso resultados={resultados} />
    if (cual === 'evaluaciones') return <Evaluaciones resultados={resultados} />
    if (cual === 'intentos') return <Intentos resultados={resultados} />
    if (cual === 'asistencias') return <Asistencias resultados={resultados} />
    if (cual === 'roleplay') return <Roleplay resultados={resultados} />
    if (cual === 'encuestas') return <Encuestas resultados={resultados} />
    return null
  }

  return (
    <PageShell>
      <div ref={ancla} />
      <Tabs value={activa} onValueChange={setPestana}>
        <PageHeader
          back={{ label: 'Contenidos', to: RUTA_CONTENIDOS }}
          title={
            // El título se queda en una línea y, si no cabe, se recorta con puntos suspensivos y se lee entero al
            // pasar el cursor. Solo en el teléfono ocupa las líneas que necesite, porque ahí no hay ancho que
            // repartir.
            //
            // El corte empieza en `sm` (640 px) y no en `lg` (1024): con `lg`, una ventana de escritorio estrecha
            // —o el navegador partido en dos— se quedaba sin recortar y el título se partía en dos y tres líneas
            // empujando los botones (Dave, 15-oct).
            <TextoCompleto texto={contenido.titulo}>
              <span className="sm:line-clamp-1">{contenido.titulo}</span>
            </TextoCompleto>
          }
          badge={<Badge variant={VARIANTE_VISIBILIDAD[contenido.visibilidad] ?? 'outline'}>{contenido.visibilidad}</Badge>}
          meta={[
            { icono: Calendar03Icon, texto: contenido.tipo },
            { icono: Clock01Icon, texto: contenido.minutos >= 60 ? `${Math.round((contenido.minutos / 60) * 10) / 10} h`.replace('.', ',') : `${contenido.minutos} min` },
            { icono: UserGroupIcon, texto: `${numero(iniciaron)} ${iniciaron === 1 ? 'persona lo inició' : 'personas lo iniciaron'}` },
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
                  el inicio, después el secundario y el primario al final.

                  **Editar sale del menú y se queda a la vista**, como secundario a la izquierda de «Descargar»
                  (Dave, 15-oct). Mirar cómo va un contenido y arreglar lo que se ve son el mismo rato de trabajo: el
                  análisis de arriba termina casi siempre en «Editar recurso», y tener que ir a buscar la edición en un
                  menú de tres puntos rompe ese camino. En el menú se queda lo que se abre de vez en cuando. */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del contenido" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuGroup>
                    {/* «Vista de colaborador», con el mismo nombre que el botón del asistente: es la misma pantalla,
                        y llamarla «Vista previa» aquí y «Vista del colaborador» allá hacía pensar en dos cosas. */}
                    <DropdownMenuItem onClick={verComoEstudiante}>
                      <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
                      Vista de colaborador
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
              <Button variant="outline" onClick={editar}>
                <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                Editar
              </Button>
              {/* El botón cambia solo cuando hay algo preparándose: así el estado se ve sin abrir el panel. */}
              <Button onClick={() => setConDescargas(true)}>
                {centro.preparando > 0 ? <Spinner /> : <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />}
                {centro.preparando > 0 ? 'Preparando archivo' : 'Descargar'}
              </Button>
            </>
          }
          tabs={
            <div className="flex flex-col gap-4">
              {/* **Lo que necesita tu atención va encima de todo, incluido el filtro de fechas.** Fue una pestaña
                  —«Análisis con IA»— y el problema no era cómo se veía sino dónde estaba: por debajo del filtro,
                  elegir una semana podía esconder que hay gente bloqueada. Aquí se lee siempre (Dave, 15-oct). */}
              <BloqueAtencion alertas={alertas} etiqueta="Lo que necesita tu atención en este contenido" />
              {/* **El periodo, en su propia fila y encima de las pestañas.** Manda sobre la pantalla entera: dentro
                  del contenido de una pestaña parece el filtro de esa pestaña, y en la fila de acciones parece una
                  acción sobre el contenido. Aquí está por encima de todo y no es de ninguna pestaña (Dave, 15-oct).

                  Alineado a la derecha, que es el lado de los controles de la página: a la izquierda arrancaba la
                  columna de texto y se leía como un título más. */}
              <div className="flex justify-end">
                <FiltroPeriodo periodo={periodo} />
              </div>
              {/* `scroll-mt-4` deja un respiro arriba: sin él, la fila de pestañas queda pegada al borde. */}
              <div ref={anclaPestanas} className="scroll-mt-4">
                <TabsList variant="line">
                  {pestanas.map((cual) => (
                    <TabsTrigger key={cual} value={cual} className="flex-none">
                      {ETIQUETA[cual]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          }
        />
        <PageContent>
          {/* **Al cambiar las fechas, la pantalla se relee y se ve que se está releyendo.** El mismo estado que usa
              el editor cuando la IA genera preguntas: el contenido se tapa, no se puede tocar y el orbe dice en qué
              está. Sin esto, cambiar el periodo cambiaba siete cifras de golpe y parecía un parpadeo (Dave, 15-oct). */}
          <div className="relative flex flex-1 flex-col gap-6">
            {periodo.analizando ? (
              <div aria-busy="true" className="bg-background/80 absolute inset-0 z-10 flex justify-center rounded-xl backdrop-blur-sm">
                <div className="sticky top-1/3 mt-24 h-fit">
                  <AiThinking label="Analizando los resultados del periodo" size="md" />
                </div>
              </div>
            ) : null}
            {pestanas.map((cual) => (
              <TabsContent key={cual} value={cual}>
                {cual === activa ? contenidoDe(cual) : null}
              </TabsContent>
            ))}
          </div>
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
