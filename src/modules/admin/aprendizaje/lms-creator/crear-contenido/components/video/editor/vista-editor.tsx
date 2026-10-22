import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, GalleryVerticalEndIcon, PlayIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Tabs, TabsList, TabsTrigger, cn } from '@ubits/flux-ui'
import { PageActionBar, PageShell } from '@/shared/components/PageShell'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { BotonIa } from '@/shared/components/BotonIa'
import { EdicionEnLinea } from '@/shared/components/EdicionEnLinea'
import { Hint } from '@/shared/components/Hint'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { ConfirmarGeneracion } from '../../confirmar-generacion'
import { DEMO_VIDEO } from '../../demo'
import {
  buscarPagina,
  cancelarRecurso,
  confirmarRecurso,
  gastarTokens,
  getBorrador,
  hashPagina,
  iniciarTrabajo,
  nuevoId,
  rutaAsistente,
  useBorrador,
} from '../../borrador'
import { BotonSalirCreacion, MarcoInmersivo } from '../../marco-inmersivo'
import { useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { COSTO_VIDEO, TIEMPO, TITULO_DEMO, avatarPorDefecto, camposDesdeIdea, imagenPack, vozPorId, type TransicionId } from '../datos'
import { aviso } from '../piezas'
import {
  aplicarPlazos,
  avatarDeEscena,
  cambiarTipo,
  duracionDeLocucion,
  enCola,
  escenaEnBlanco,
  guardarSesion,
  leerSesion,
  marcarActiva,
  ocupada,
  proximoPlazo,
  proyectoDemoEditor,
  sesionActiva,
  sincronizada,
  vozDe,
  type Escena,
  type Proyecto,
  type Sesion,
  type TipoEscena,
} from '../proyecto'
import { Inspector } from './inspector'
import { ModalAjustes, ModalTransicion } from './modales'
import { RailEscenas, type DondeEscena } from './rail'
import { useReproductor } from './reproductor'
import { VistaPrevia } from './vista-previa'

// Editor de escenas del video con IA (HU-LMS-001, recurso Video): el rail de escenas, la vista previa con su línea de
// tiempo y guion, y el inspector de propiedades. «Generar video» (gratis, con confirmación) crea o llena la página y
// la generación sigue en el asistente; salir sin generar no crea nada y el borrador queda en «Tus videos recientes».
//
// De dónde sale el proyecto: «Editar video» trae el de la página (`recurso.videoIA`); si no, el borrador de la sesión
// (`?draftId=` o el activo); si no hay nada, el demo listo «Onboarding comercial — 30 días».

type VistaMovil = 'escenas' | 'vista' | 'propiedades'

function sesionInicial(draftId: string | null): Sesion {
  const b = getBorrador()
  const intencion = b.intencion
  const pagina = intencion?.paginaId ? buscarPagina(b, intencion.paginaId)?.pagina : undefined
  const recurso = pagina?.recurso
  const desdePagina = recurso?.videoIA as Proyecto | undefined
  if (desdePagina?.escenas?.length) {
    const id = recurso?.proyectoVideoId ?? desdePagina.id
    return { id, fase: 'editor', setup: desdePagina.setup, proyecto: { ...desdePagina, titulo: desdePagina.titulo || pagina?.titulo || TITULO_DEMO }, snapshot: null }
  }
  const sesion = leerSesion(draftId) ?? leerSesion(sesionActiva())
  if (sesion?.proyecto) return { ...sesion, fase: 'editor' }
  const titulo = pagina?.titulo || intencion?.titulo || undefined
  const proyecto = proyectoDemoEditor(titulo)
  return { id: proyecto.id, fase: 'editor', setup: proyecto.setup, proyecto, snapshot: null }
}

/**
 * Por qué no se puede dejar (o generar) una escena todavía. Salir sigue la regla de React (video sin clip, avatar sin audio
 * o sin sincronizar); generar además pide imagen en las escenas Imagen y un tipo en todas, porque «Añadir escena» ya las
 * crea vacías de cualquier tipo y se colaban al render (Dave, 14-oct).
 */
function bloqueoDe(e: Escena, p: Proyecto, ahora: number, alGenerar = false): string | null {
  if (enCola(e, ahora)) return null
  if (alGenerar && !e.tipo) return 'Todas las escenas necesitan un tipo: elige si es imagen, video, avatar o canvas.'
  if (alGenerar && e.tipo === 'imagen' && !e.imagen) return 'Las escenas tipo imagen no pueden dejarse sin una imagen cargada.'
  if (e.tipo === 'video' && !e.clip) return 'Las escenas tipo video no pueden dejarse sin un video cargado.'
  if (e.tipo === 'avatar' && e.guionLocucion == null) return 'Las escenas tipo Avatar no pueden dejarse sin un audio generado.'
  if (e.tipo === 'avatar' && !sincronizada(e, p)) return 'Las escenas tipo Avatar no pueden dejarse sin sincronizar el avatar.'
  return null
}

export function VistaEditor() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tokens } = useBorrador()
  const inicial = useMemo(() => sesionInicial(params.get('draftId')), [params])
  const [sesion] = useState(inicial)
  const [proyecto, setProyecto] = useState<Proyecto>(() => aplicarPlazos(inicial.proyecto as Proyecto))
  const [seleccion, setSeleccion] = useState<string | null>(() => inicial.proyecto?.escenas[0]?.id ?? null)
  const [ahora, setAhora] = useState(() => Date.now())
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('vista')
  const [ajustes, setAjustes] = useState(false)
  const [transicion, setTransicion] = useState<number | null>(null)
  const [eliminar, setEliminar] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  // La capa del canvas elegida en la vista previa o en Propiedades. Se suelta al cambiar de escena.
  const [capaElegida, setCapaElegida] = useState<string | null>(null)
  useEffect(() => setCapaElegida(null), [seleccion])
  const [guardado, guardar] = useGuardadoSimulado()
  const guionRef = useRef<HTMLTextAreaElement>(null)
  const enfocarGuion = useRef(false)
  const primero = useRef(true)

  const reproductor = useReproductor({ proyecto, seleccion, onSeleccion: setSeleccion })
  const indice = Math.max(0, proyecto.escenas.findIndex((e) => e.id === seleccion))
  const escena = proyecto.escenas[indice]
  const enColaAlguna = proyecto.escenas.some((e) => enCola(e, ahora))
  const trabajando = proyecto.escenas.some((e) => ocupada(e, ahora) && (e.ocupada?.motivo === 'audio' || e.ocupada?.motivo === 'sincronizar'))
  const videoVacio = proyecto.escenas.some((e) => e.tipo === 'video' && !e.clip)

  useEffect(() => {
    document.title = `${proyecto.titulo || 'Video'} · UBITS`
  }, [proyecto.titulo])

  // Reloj de los plazos (cola inicial, regenerar, sincronizar): corre solo mientras hay algo pendiente.
  const siguientePlazo = proximoPlazo(proyecto)
  useEffect(() => {
    if (!Number.isFinite(siguientePlazo)) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setAhora(t)
      setProyecto((p) => aplicarPlazos(p, t))
    }, 200)
    return () => window.clearInterval(id)
  }, [siguientePlazo])

  // Autoguardado: la sesión (y «Tus videos recientes») con cada cambio; el indicador no parpadea con la cola.
  useEffect(() => {
    if (primero.current) {
      primero.current = false
      return
    }
    const id = window.setTimeout(() => guardarSesion({ ...sesion, fase: 'editor', proyecto }), 400)
    return () => window.clearTimeout(id)
  }, [proyecto, sesion])

  useEffect(() => {
    if (!enfocarGuion.current) return
    enfocarGuion.current = false
    guionRef.current?.focus()
  }, [seleccion])

  // ── Cambios ──

  const cambiarProyecto = (cambio: (p: Proyecto) => Proyecto, conIndicador = true) => {
    setProyecto(cambio)
    if (conIndicador && !enColaAlguna) guardar()
  }

  const cambiarEscena = (id: string, cambio: Partial<Escena> | ((e: Escena) => Escena)) =>
    cambiarProyecto((p) => ({ ...p, escenas: p.escenas.map((e) => (e.id === id ? (typeof cambio === 'function' ? cambio(e) : { ...e, ...cambio }) : e)) }))

  const ocupar = (id: string, motivo: NonNullable<Escena['ocupada']>['motivo'], ms: number, parche: Partial<Escena>) => {
    const hasta = Date.now() + ms
    cambiarEscena(id, { ocupada: { motivo, hasta, parche } })
    setAhora(Date.now())
  }

  /** Regla de salida: una escena Video sin clip o Avatar sin audio o sin sincronizar no se puede dejar. */
  const puedeSalir = () => {
    if (!escena) return true
    const motivo = bloqueoDe(escena, proyecto, Date.now())
    if (motivo) aviso('warning', motivo)
    return !motivo
  }

  const elegir = (id: string) => {
    if (id === seleccion) {
      setVistaMovil('vista')
      return
    }
    if (!puedeSalir()) return
    setSeleccion(id)
    setVistaMovil('vista')
  }

  // Una escena nueva del tipo elegido y en el lugar elegido del menú «Añadir escena» (14-oct).
  const agregar = (tipo: TipoEscena, donde: DondeEscena) => {
    if (!puedeSalir()) return
    const nueva = cambiarTipo(escenaEnBlanco(), tipo, proyecto)
    cambiarProyecto((p) => {
      const lista = [...p.escenas]
      const actual = lista.findIndex((x) => x.id === seleccion)
      const lugar = donde === 'inicio' ? 0 : donde === 'final' || actual < 0 ? lista.length : donde === 'antes' ? actual : actual + 1
      lista.splice(lugar, 0, nueva)
      return { ...p, escenas: lista }
    })
    enfocarGuion.current = true
    setSeleccion(nueva.id)
    setVistaMovil('vista')
  }

  const mover = (i: number, delta: number) =>
    cambiarProyecto((p) => {
      const lista = [...p.escenas]
      const [e] = lista.splice(i, 1)
      lista.splice(i + delta, 0, e)
      return { ...p, escenas: lista }
    })

  const duplicar = (id: string) =>
    cambiarProyecto((p) => {
      const i = p.escenas.findIndex((e) => e.id === id)
      if (i < 0) return p
      const copia = { ...p.escenas[i], id: nuevoId('scene'), ocupada: undefined }
      const lista = [...p.escenas]
      lista.splice(i + 1, 0, copia)
      return { ...p, escenas: lista }
    })

  const quitar = (id: string) => {
    const i = proyecto.escenas.findIndex((e) => e.id === id)
    const quedan = proyecto.escenas.filter((e) => e.id !== id)
    if (!quedan.length) return
    cambiarProyecto((p) => ({ ...p, escenas: p.escenas.filter((e) => e.id !== id) }))
    if (seleccion === id) setSeleccion(quedan[Math.min(i, quedan.length - 1)].id)
  }

  const cambiarTipoEscena = (tipo: TipoEscena) => {
    if (!escena) return
    cambiarEscena(escena.id, (e) => cambiarTipo(e, tipo, proyecto))
  }

  const generarAudio = (voz?: string) => {
    if (!escena) return
    const vozFinal = voz ?? vozDe(escena, proyecto)
    const antes = vozPorId(vozDe(escena, proyecto)).genero
    const ahoraGenero = vozPorId(vozFinal).genero
    const d = duracionDeLocucion(escena, vozFinal)
    const parche: Partial<Escena> = { guionLocucion: escena.guion, vozLocucion: vozFinal, duracionLocucion: d, duracion: d }
    // En una escena Avatar, cambiar la voz de género cambia al avatar por defecto de ese género.
    if (escena.tipo === 'avatar' && antes !== ahoraGenero) parche.avatarId = avatarPorDefecto(proyecto.setup.sector, ahoraGenero).id
    if (voz) cambiarEscena(escena.id, { voz })
    ocupar(escena.id, 'audio', TIEMPO.audio, parche)
  }

  const regenerarImagen = () => {
    if (!escena || !gastarTokens(COSTO_VIDEO.imagen)) return aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.imagen} requeridos).`)
    const otra = escena.imagenAlterna || imagenPack(proyecto.setup.estilo, 1 + Math.floor(Math.random() * 30))
    ocupar(escena.id, 'imagen', TIEMPO.imagen, { imagen: otra, imagenAlterna: escena.imagen, imagenGenerada: true })
  }

  const generarCanvas = (idea: string) => {
    if (!escena?.canvas || !gastarTokens(COSTO_VIDEO.canvas)) return aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.canvas} requeridos).`)
    const imagen = imagenPack(proyecto.setup.estilo, 1 + Math.floor(Math.random() * 30))
    ocupar(escena.id, 'canvas', TIEMPO.canvas, {
      imagen,
      canvas: { ...escena.canvas, campos: camposDesdeIdea(escena.canvas.plantilla, idea), idea },
    })
  }

  const elegirAvatar = (id: number, aTodas: boolean) =>
    cambiarProyecto((p) => ({
      ...p,
      escenas: p.escenas.map((e) => (e.id === escena?.id || (aTodas && e.tipo === 'avatar') ? { ...e, avatarId: id } : e)),
    }))

  const sincronizar = () => {
    if (!escena) return
    if (!gastarTokens(COSTO_VIDEO.sincronizar)) return aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.sincronizar} requeridos).`)
    const avatar = avatarDeEscena(escena, proyecto)
    ocupar(escena.id, 'sincronizar', TIEMPO.sincronizar, {
      sync: { guion: escena.guionLocucion ?? escena.guion, voz: escena.vozLocucion ?? vozDe(escena, proyecto), avatarId: avatar.id },
    })
  }

  const guardarTransicion = (id: TransicionId, aTodas: boolean) => {
    if (transicion == null) return
    const destino = proyecto.escenas[transicion]?.id
    cambiarProyecto((p) => ({ ...p, escenas: p.escenas.map((e, i) => (e.id === destino || (aTodas && i > 0) ? { ...e, transicion: id } : e)) }))
  }

  // ── Salir y generar ──

  const salir = () => {
    reproductor.pausar()
    guardarSesion({ ...sesion, fase: 'editor', proyecto })
    marcarActiva(null)
    navigate(cancelarRecurso())
  }

  const pedirGenerar = () => {
    for (const e of proyecto.escenas) {
      const motivo = bloqueoDe(e, proyecto, Date.now(), true)
      if (motivo) {
        aviso('warning', motivo)
        setSeleccion(e.id)
        return
      }
    }
    setConfirmar(true)
  }

  const generar = () => {
    setConfirmar(false)
    reproductor.pausar()
    const final = { ...proyecto, escenas: proyecto.escenas.map((e) => ({ ...e, ocupada: undefined })) }
    const id = confirmarRecurso(
      { tipo: 'video', generando: true, generadoConIA: true, origenVideo: 'ia', videoIA: final, proyectoVideoId: sesion.id },
      proyecto.titulo,
    )
    iniciarTrabajo(id, 'video', TIEMPO.render, { generando: false, src: DEMO_VIDEO })
    guardarSesion({ ...sesion, fase: 'listo', proyecto: final })
    marcarActiva(null)
    navigate(`${rutaAsistente()}${hashPagina(id)}`)
  }

  const generarDeshabilitado = enColaAlguna || reproductor.reproduciendo || trabajando || videoVacio
  const botonGenerar = (
    <span className="inline-flex">
      <BotonIa disabled={generarDeshabilitado} onClick={pedirGenerar}>
        Generar video
      </BotonIa>
    </span>
  )

  const titulo = (
    <EdicionEnLinea
      valor={proyecto.titulo}
      onCambiar={(valor) => cambiarProyecto((p) => ({ ...p, titulo: valor }))}
      etiqueta="Título del video"
      marcador="Título del video"
      className="max-w-[min(28rem,60vw)]"
    />
  )

  return (
    <MarcoInmersivo
      titulo={titulo}
      subtitulo="Video con IA"
      tokens={tokens}
      lleno
      // Una sola salida, `BotonSalirCreacion`, sin X (regla de creación, 6-oct). El editor se autoguarda y salir deja el
      // borrador en «Tus videos recientes»: con todo guardado sale directo; si hay algo a medio guardar pregunta con la
      // ventana del sistema, «¿Salir de la edición?» (war room del 13-oct).
      acciones={
        <BotonSalirCreacion
          texto="Salir de la edición"
          onClick={salir}
          salida={{
            conCambios: guardado !== 'guardado',
            alGuardarYSalir: salir,
            retomarEn: '«Tus videos recientes»',
          }}
        />
      }
      // Las acciones al pie, donde el setup las tiene: la principal no cambia de sitio al entrar al editor
      // (el jefe de Dave, 5-oct). Y sin volver: la salida es la de arriba.
      pie={
        <PageActionBar className="mt-0">
          {/* El autoguardado vive donde están las acciones: es lo que acaba de pasar con lo que se está haciendo. */}
          <ChipGuardado estado={guardado} />
          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" onClick={() => setAjustes(true)}>
              <HugeiconsIcon icon={SlidersHorizontalIcon} data-icon="inline-start" aria-hidden="true" />
              Ajustes
            </Button>
            {videoVacio && !enColaAlguna ? (
              <Hint label="Las escenas tipo video no pueden dejarse sin un video cargado.">
                <span className="inline-flex">{botonGenerar}</span>
              </Hint>
            ) : (
              botonGenerar
            )}
          </div>
        </PageActionBar>
      }
    >
      <PageShell width="wide" className="min-h-0 flex-1">
        {/* Pantallas angostas: una zona a la vez, y se elige **arriba**. Son las pestañas de siempre —las mismas del
            modal «Agregar video»—, sin caja alrededor (Dave, 5-oct). */}
        <Tabs
          value={vistaMovil}
          onValueChange={(v) => setVistaMovil(v as VistaMovil)}
          className="shrink-0 px-4 pt-3 sm:px-8 min-[801px]:hidden"
        >
          {/* Centradas y con su icono, como las del modal «Agregar video». */}
          <div className="flex justify-center">
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="escenas">
                <HugeiconsIcon icon={GalleryVerticalEndIcon} data-icon="inline-start" aria-hidden="true" />
                Escenas
              </TabsTrigger>
              <TabsTrigger value="vista">
                <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" aria-hidden="true" />
                Vista previa
              </TabsTrigger>
              <TabsTrigger value="propiedades">
                <HugeiconsIcon icon={SlidersHorizontalIcon} data-icon="inline-start" aria-hidden="true" />
                Propiedades
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        {/* Las tres zonas de la P7: Escenas · Vista previa · Propiedades, alineadas con la cabecera. */}
        <div className="grid min-h-0 flex-1 gap-4 px-4 py-4 max-[800px]:grid-cols-1 max-[800px]:py-3 sm:px-8 min-[801px]:grid-cols-[220px_minmax(0,1fr)_280px] min-[1101px]:grid-cols-[300px_minmax(0,1fr)_320px] min-[1101px]:py-6">
          {/* El rail ya es una tarjeta con su propio scroll: la columna no recorta, para que el borde se vea completo. */}
          <div className={cn('flex min-h-0 flex-col', 'max-[800px]:h-full', vistaMovil !== 'escenas' && 'max-[800px]:hidden')}>
            <RailEscenas
              proyecto={proyecto}
              seleccion={seleccion}
              ahora={ahora}
              bloqueado={enColaAlguna}
              onElegir={elegir}
              onAgregar={agregar}
              onOrden={(escenas) => cambiarProyecto((p) => ({ ...p, escenas }))}
              onMover={mover}
              onDuplicar={duplicar}
              onEliminar={setEliminar}
              onTransicion={(i) => {
                if (puedeSalir()) setTransicion(i)
              }}
            />
          </div>
          {/* La vista previa va en su tarjeta blanca con borde, como Escenas y Propiedades. */}
          <Frame spacing="sm" role="region" aria-label="Vista previa" className={cn('min-h-0', vistaMovil !== 'vista' && 'max-[800px]:hidden')}>
            {/* Qué se está viendo, en el gris: el panel ya no repite el título dentro (Dave, 9-oct). */}
            <FrameHeader className="flex shrink-0 flex-row items-baseline justify-between gap-2">
              <FrameTitle>Vista previa</FrameTitle>
              <FrameDescription>Escena {String(indice + 1).padStart(2, '0')}</FrameDescription>
            </FrameHeader>
            <FramePanel className="min-h-0 flex-1 overflow-auto">
            <VistaPrevia
              proyecto={proyecto}
              escena={escena}
              indice={indice}
              ahora={ahora}
              reproductor={reproductor}
              renderizando={false}
              guionRef={guionRef}
              onEscena={(cambio) => escena && cambiarEscena(escena.id, cambio)}
              onGenerarAudio={generarAudio}
              capaElegida={capaElegida}
              onCapaElegida={setCapaElegida}
            />
            </FramePanel>
          </Frame>
          {/* El marco recorta lo que se sale (overflow hidden): el scroll va en su panel. */}
          <Frame spacing="sm" role="region" aria-label="Propiedades" className={cn('min-h-0', vistaMovil !== 'propiedades' && 'max-[800px]:hidden')}>
            <FrameHeader className="shrink-0">
              <FrameTitle>Propiedades de la escena</FrameTitle>
            </FrameHeader>
            <FramePanel className="min-h-0 flex-1 overflow-auto">
            <Inspector
              proyecto={proyecto}
              escena={escena}
              ahora={ahora}
              onEscena={(cambio) => escena && cambiarEscena(escena.id, cambio)}
              onTipo={cambiarTipoEscena}
              onRegenerarImagen={regenerarImagen}
              onGenerarCanvas={generarCanvas}
              onAvatar={elegirAvatar}
              onSincronizar={sincronizar}
              capaElegida={capaElegida}
              onCapaElegida={setCapaElegida}
            />
            </FramePanel>
          </Frame>
        </div>

      </PageShell>

      <ModalAjustes abierto={ajustes} proyecto={proyecto} onCerrar={() => setAjustes(false)} onCambio={(cambio) => cambiarProyecto((p) => ({ ...p, ...cambio }))} />
      <ModalTransicion
        abierto={transicion != null}
        proyecto={proyecto}
        indice={transicion ?? 1}
        onCerrar={() => setTransicion(null)}
        onGuardar={guardarTransicion}
      />
      <DialogoConfirmar
        abierto={eliminar != null}
        onAbiertoChange={(v) => !v && setEliminar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar esta escena?"
        descripcion="Su guion y su imagen se pierden. No se puede deshacer."
        accion="Eliminar escena"
        destructiva
        onConfirmar={() => {
          if (eliminar) quitar(eliminar)
          setEliminar(null)
        }}
      />
      <ConfirmarGeneracion
        abierto={confirmar}
        onAbiertoChange={setConfirmar}
        titulo="Generar video"
        descripcion="¿Estás seguro de generar el video? Esta acción es gratis y no consume tokens."
        accion="Generar video"
        onConfirmar={generar}
      />
    </MarcoInmersivo>
  )
}
