import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PlayIcon,
  SlidersHorizontalIcon,
  Album02Icon,
} from '@hugeicons/core-free-icons'
import {
  AspectRatio,
  Button,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { BotonIa } from '@/shared/components/BotonIa'
import { AiThinking } from '@/shared/components/AiThinking'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { ConfirmarGeneracion } from '../../crear-contenido/components/confirmar-generacion'
import { useTemporizadores } from '@/modules/design-system/estados/temporizadores'
import {
  cancelarRecurso,
  confirmarRecurso,
  gastarTokens,
  hashPagina,
  iniciarTrabajo,
  rutaAsistente,
  useBorrador,
} from '../../crear-contenido/components/borrador'
import { BotonSalirCreacion, MarcoInmersivo } from '../../crear-contenido/components/marco-inmersivo'
import { useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { EdicionEnLinea } from '@/shared/components/EdicionEnLinea'
import { PageActionBar, PageShell } from '@/shared/components/PageShell'
import {
  CATALOGO_TIPOS,
  COSTO_REGENERAR,
  DURACION_DIAPOSITIVA_MS,
  DURACION_REGENERAR_MS,
  derivarTitulo,
  etiquetaTipo,
  nuevoIdDiapositiva,
  plantillaVacia,
  type DatosDiapositiva,
  type DatosPresentacion,
} from '../../crear-contenido/components/presentacion/datos'
import { Diapositiva, LienzoDiapositiva, MiniaturaDiapositiva } from '../../crear-contenido/components/presentacion/diapositiva'
import {
  RUTA_SETUP_PRESENTACION,
  guardarSesion,
  leerSesion,
  limpiarSesionPresentacion,
  type SesionPresentacion,
} from '../../crear-contenido/components/presentacion/sesion'
import { ModalAjustes, ModalAnadir, ModalRegenerar } from '../components/modales'
import { TokenCost } from '../../crear-contenido/components/tokens'

// Editor de la presentación interactiva (HU-presentacion-interactiva, RN-06 a RN-09): estudio de tres columnas —
// diapositivas, vista previa editable y propiedades—. Al llegar desde el setup, las diapositivas se «generan» una a una
// de arriba abajo; «Generar presentación» espera a que terminen todas. En pantallas angostas se ve una columna a la vez.

type VistaMovil = 'diapositivas' | 'vista' | 'propiedades'

const dos = (n: number) => String(n).padStart(2, '0')

/** Título de la diapositiva regenerada: la primera frase de la idea, corta. */
function tituloDeIdea(idea: string) {
  const frase = idea.split(/[.!?\n]/)[0]?.trim() || idea.trim()
  const corta = frase.length > 60 ? `${frase.slice(0, 59).trimEnd()}…` : frase
  return corta.charAt(0).toUpperCase() + corta.slice(1)
}

export function Component() {
  const [inicial] = useState(() => leerSesion())
  // Sin diapositivas no hay nada que editar: de vuelta al setup.
  if (!inicial?.diapositivas.length) return <Navigate to={RUTA_SETUP_PRESENTACION} replace />
  return <Editor inicial={inicial} />
}

Component.displayName = 'LmsAgregarPresentacionInteractivaEditorPage'

function Editor({ inicial }: { inicial: SesionPresentacion }) {
  const navigate = useNavigate()
  const { tokens, intencion } = useBorrador()
  const programar = useTemporizadores()
  const [guardado, pulsarGuardado] = useGuardadoSimulado()
  const [sesion, setSesion] = useState(inicial)
  const [generando, setGenerando] = useState<number | null>(inicial.contenidoListo ? null : 0)
  const [regenerando, setRegenerando] = useState<number | null>(null)
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('vista')
  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [modal, setModal] = useState<'anadir' | 'ajustes' | 'regenerar' | 'generar' | null>(null)
  const [porEliminar, setPorEliminar] = useState<number | null>(null)

  const { diapositivas } = sesion
  const total = diapositivas.length
  const activa = Math.min(Math.max(sesion.activa, 0), total - 1)
  const actual = diapositivas[activa]
  const pendiente = (i: number) => (generando != null && i >= generando) || regenerando === i
  const activaPendiente = pendiente(activa)

  useEffect(() => {
    document.title = 'Editor de presentación interactiva — UBITS'
  }, [])

  // La sesión se guarda en cada cambio: «Volver al setup» conserva todo.
  useEffect(() => guardarSesion(sesion), [sesion])

  // Generación progresiva (mock): una diapositiva cada 420 ms, de arriba abajo.
  useEffect(() => {
    if (generando == null) return
    const id = window.setTimeout(() => {
      if (generando + 1 >= total) {
        setGenerando(null)
        setSesion((s) => ({ ...s, contenidoListo: true }))
      } else setGenerando(generando + 1)
    }, DURACION_DIAPOSITIVA_MS)
    return () => window.clearTimeout(id)
  }, [generando, total])

  /** Cambio hecho por el creador: se guarda y se ve el pulso de «Cambios guardados». */
  const editar = (cambio: (s: SesionPresentacion) => Partial<SesionPresentacion>) => {
    setSesion((s) => ({ ...s, ...cambio(s) }))
    pulsarGuardado()
  }

  const seleccionar = (i: number) => {
    setSesion((s) => ({ ...s, activa: i }))
    setVistaMovil('vista')
  }

  const reemplazar = (i: number, siguiente: DatosDiapositiva) => editar((s) => ({ diapositivas: s.diapositivas.map((d, j) => (j === i ? siguiente : d)) }))

  const mover = (desde: number, hasta: number) => {
    if (desde === hasta || hasta < 0 || hasta >= total) return
    editar((s) => {
      const lista = [...s.diapositivas]
      const [movida] = lista.splice(desde, 1)
      lista.splice(hasta, 0, movida)
      return { diapositivas: lista, activa: hasta }
    })
  }

  const eliminar = (i: number) => {
    if (total <= 1) return
    editar((s) => {
      const lista = s.diapositivas.filter((_, j) => j !== i)
      const nuevaActiva = s.activa > i ? s.activa - 1 : Math.min(s.activa, lista.length - 1)
      return { diapositivas: lista, activa: nuevaActiva }
    })
    if (generando != null && i < generando) setGenerando(Math.max(0, generando - 1))
  }

  const anadir = (tipo: string) => {
    const nueva = plantillaVacia(tipo)
    const posicion = activa + 1
    editar((s) => ({ diapositivas: [...s.diapositivas.slice(0, posicion), nueva, ...s.diapositivas.slice(posicion)], activa: posicion }))
    if (generando != null && posicion < generando) setGenerando(generando + 1)
    setModal(null)
    setVistaMovil('vista')
  }

  const cambiarTipo = (tipo: string) => {
    if (!actual || actual.type === tipo || activaPendiente) return
    reemplazar(activa, plantillaVacia(tipo))
  }

  const pedirRegenerar = () => {
    if (!actual || activaPendiente || regenerando != null) return
    if (tokens < COSTO_REGENERAR) {
      notify(`No tienes suficientes tokens (${COSTO_REGENERAR} requeridos).`)
      return
    }
    setModal('regenerar')
  }

  const regenerar = (idea: string) => {
    const indice = activa
    const base = diapositivas[indice]
    if (!base) return
    if (!gastarTokens(COSTO_REGENERAR)) {
      notify(`No tienes suficientes tokens (${COSTO_REGENERAR} requeridos).`)
      return
    }
    setModal(null)
    setRegenerando(indice)
    programar(() => {
      setSesion((s) => ({
        ...s,
        diapositivas: s.diapositivas.map((d) => (d.id === base.id ? { ...d, id: nuevoIdDiapositiva(), title: tituloDeIdea(idea), regenPrompt: idea } : d)),
      }))
      pulsarGuardado()
      setRegenerando(null)
    }, DURACION_REGENERAR_MS)
  }

  const generarPresentacion = () => {
    if (!total || generando != null) return
    const titulo = sesion.tituloEditor.trim() || derivarTitulo(sesion.idea, intencion?.titulo)
    const datos: DatosPresentacion = { titulo, diapositivas, acento: sesion.acento, logo: sesion.logo, estilo: sesion.estilo }
    const id = confirmarRecurso({ tipo: 'presentacion-interactiva', generando: true, generadoConIA: true, presentacion: datos }, titulo)
    iniciarTrabajo(id, 'presentacion', 6000, { generando: false })
    limpiarSesionPresentacion()
    navigate(rutaAsistente() + hashPagina(id))
  }

  // Salir deja la sesión (ya se autoguarda), y Agregar presentación la ofrece como «Sin terminar».
  const salir = () => navigate(cancelarRecurso())

  return (
    <MarcoInmersivo
      titulo={
        <EdicionEnLinea
          valor={sesion.tituloEditor}
          onCambiar={(valor) => editar(() => ({ tituloEditor: valor }))}
          etiqueta="Título de la presentación"
          marcador="Título de la presentación"
          className="max-w-[min(28rem,60vw)]"
        />
      }
      subtitulo="Presentación interactiva"
      tokens={tokens}
      // Sin volver: volver al setup después de haber armado las diapositivas no significa nada —el setup es lo que las
      // generó— y daba una salida de más (el jefe de Dave, 5-oct). Una sola salida, `BotonSalirCreacion`, sin X (regla
      // de creación, 6-oct). Sale directo, sin preguntar: lo hecho queda autoguardado (el jefe de Dave, 13-oct).
      acciones={<BotonSalirCreacion texto="Salir de la edición" onClick={salir} />}
      // Las acciones al pie, donde el setup las tiene: la principal no cambia de sitio al entrar al editor.
      pie={
        <PageActionBar className="mt-0">
          {/* El autoguardado vive donde están las acciones: es lo que acaba de pasar con lo que se está haciendo. */}
          <ChipGuardado estado={guardado} />
          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" onClick={() => setModal('ajustes')}>
              <HugeiconsIcon icon={SlidersHorizontalIcon} size={16} />
              Ajustes
            </Button>
            <BotonIa disabled={!total || generando != null} onClick={() => setModal('generar')}>
              Generar presentación
            </BotonIa>
          </div>
        </PageActionBar>
      }
      lleno
    >
      <PageShell width="wide" className="min-h-0 flex-1">
        {/* Pantallas angostas: una zona a la vez, y se elige **arriba**. Son las pestañas de siempre —las mismas del
            modal «Agregar video»—, sin caja alrededor: abajo parecían una barra de navegación de app y repetían el
            sitio de las acciones (Dave, 5-oct). */}
        <Tabs
          value={vistaMovil}
          onValueChange={(v) => setVistaMovil(v as VistaMovil)}
          className="shrink-0 px-4 pt-3 sm:px-8 min-[801px]:hidden"
        >
          {/* Centradas y con su icono, como las del modal «Agregar video». */}
          <div className="flex justify-center">
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="diapositivas">
                <HugeiconsIcon icon={Album02Icon} data-icon="inline-start" aria-hidden="true" />
                Diapositivas
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
        {/* Las tres zonas de la P7: Diapositivas · Vista previa · Propiedades, alineadas con la cabecera. */}
        <div className="grid min-h-0 flex-1 gap-4 px-4 py-3 sm:px-8 min-[801px]:grid-cols-[220px_minmax(0,1fr)_280px] min-[801px]:py-4 min-[1101px]:grid-cols-[300px_minmax(0,1fr)_320px] min-[1101px]:py-6">
          {/* Diapositivas */}
          <Panel
            titulo={`Diapositivas (${total.toLocaleString('es-CO')})`}
            etiqueta="Diapositivas"
            oculto={vistaMovil !== 'diapositivas'}
            accion={
              <Hint label="Añadir diapositiva">
                <BotonIcono size="icon-xs" aria-label="Añadir diapositiva" onClick={() => setModal('anadir')}>
                  <HugeiconsIcon icon={Add01Icon} size={16} />
                </BotonIcono>
              </Hint>
            }
            pie={
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setModal('anadir')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Añadir diapositiva
              </Button>
            }
          >
            <div role="listbox" aria-label="Lista de diapositivas" className="flex flex-col gap-3 py-1">
              {diapositivas.map((d, i) => {
                const enCola = pendiente(i)
                const seleccionada = i === activa
                return (
                  <Item
                    key={d.id ?? i}
                    role="option"
                    aria-selected={seleccionada}
                    aria-busy={enCola || undefined}
                    aria-label={`Diapositiva ${i + 1}, ${etiquetaTipo(d.type)}${enCola ? ', generando' : ''}`}
                    tabIndex={0}
                    // Cada diapositiva es una tarjeta con borde, como las escenas del editor de video; la activa, gris con
                    // la línea azul a la izquierda.
                    variant={seleccionada ? 'muted' : 'outline'}
                    size="xs"
                    className={cn('relative cursor-pointer flex-nowrap! p-1.5! pl-2.5!', seleccionada && 'border-border!', arrastrando === i && 'opacity-50')}
                    draggable={!enCola}
                    onDragStart={() => !enCola && setArrastrando(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (arrastrando != null && arrastrando !== i) mover(arrastrando, i)
                      setArrastrando(null)
                    }}
                    onDragEnd={() => setArrastrando(null)}
                    onClick={() => seleccionar(i)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        seleccionar(i)
                      }
                    }}
                  >
                    {seleccionada ? <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" /> : null}
                    <div className="w-22 shrink-0">
                      {enCola ? (
                        <AspectRatio ratio={16 / 10} className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          <AiThinking label="Generando" className="scale-75" />
                        </AspectRatio>
                      ) : (
                        <MiniaturaDiapositiva diapositiva={d} acento={sesion.acento} logo={sesion.logo} className="border" />
                      )}
                    </div>
                    <ItemContent className="min-w-0">
                      <ItemTitle>
                        <Text as="span" size="xs" weight="semibold" className="whitespace-nowrap">
                          {`Diapositiva ${dos(i + 1)}`}
                        </Text>
                      </ItemTitle>
                      <ItemDescription className="truncate">
                        <Text as="span" size="xs" variant="muted">
                          {etiquetaTipo(d.type)}
                        </Text>
                      </ItemDescription>
                    </ItemContent>
                    {!enCola ? (
                      <ItemActions onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <OpcionesDiapositiva
                          numero={i + 1}
                          puedeSubir={i > 0 && !pendiente(i - 1)}
                          puedeBajar={i < total - 1 && !pendiente(i + 1)}
                          puedeEliminar={total > 1}
                          onSubir={() => mover(i, i - 1)}
                          onBajar={() => mover(i, i + 1)}
                          onEliminar={() => setPorEliminar(i)}
                        />
                      </ItemActions>
                    ) : null}
                  </Item>
                )
              })}
            </div>
          </Panel>

          {/* Vista previa */}
          <Panel titulo="Vista previa" etiqueta="Vista previa" oculto={vistaMovil !== 'vista'}>
            <div className="flex flex-col gap-3">
              {!actual ? (
                <Text variant="muted" className="py-10 text-center">Selecciona una diapositiva</Text>
              ) : activaPendiente ? (
                <AspectRatio ratio={16 / 10} aria-busy="true">
                  <Empty className="size-full border p-6">
                    <EmptyHeader>
                      <EmptyMedia>
                        <AiThinking label={regenerando === activa ? 'Regenerando diapositiva' : 'Generando diapositiva'} size="md" />
                      </EmptyMedia>
                      <EmptyDescription>
                        {regenerando === activa ? `Diapositiva ${dos(activa + 1)}` : `${Math.min((generando ?? 0) + 1, total)} de ${total}`}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </AspectRatio>
              ) : (
                <LienzoDiapositiva etiqueta={`Diapositiva ${activa + 1}`}>
                  <Diapositiva diapositiva={actual} acento={sesion.acento} logo={sesion.logo} modo="edicion" onCambio={(d) => reemplazar(activa, d)} />
                </LienzoDiapositiva>
              )}
              {actual ? (
                <Text size="xs" variant="muted">
                  {activaPendiente ? 'La IA está generando esta diapositiva…' : 'Haz clic en el texto de la diapositiva para editarlo.'}
                </Text>
              ) : null}
            </div>
          </Panel>

          {/* Propiedades */}
          <Panel
            titulo="Propiedades"
            etiqueta="Propiedades"
            oculto={vistaMovil !== 'propiedades'}
            pie={
              actual ? (
                <BotonIaSecundario size="sm" className="w-full" disabled={activaPendiente || regenerando != null} onClick={pedirRegenerar}>
                  {regenerando === activa ? (
                    'Regenerando'
                  ) : (
                    <>
                      Regenerar
                      <TokenCost cost={COSTO_REGENERAR} />
                    </>
                  )}
                </BotonIaSecundario>
              ) : null
            }
          >
            {actual ? (
              <div className="flex flex-col gap-3">
                <Text size="xs" weight="semibold" variant="muted">
                  Tipo de diapositiva
                </Text>
                <ToggleGroup
                  aria-label="Tipo de diapositiva"
                  variant="outline"
                  orientation="vertical"
                  spacing={2}
                  className="w-full"
                  value={[actual.type]}
                  disabled={activaPendiente}
                  onValueChange={(v) => {
                    const tipo = (v as string[])[0]
                    if (tipo) cambiarTipo(tipo)
                  }}
                >
                  {CATALOGO_TIPOS.map((t) => (
                    <ToggleGroupItem key={t.type} value={t.type} aria-label={t.label} className="w-full justify-start">
                      <HugeiconsIcon icon={t.icon} data-icon="inline-start" aria-hidden="true" />
                      {t.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ) : (
              <Text size="sm" variant="muted">
                Selecciona una diapositiva para ver sus propiedades.
              </Text>
            )}
          </Panel>
        </div>

      </PageShell>

      <ModalAnadir abierto={modal === 'anadir'} onCerrar={() => setModal(null)} onElegir={anadir} />
      <ModalAjustes
        abierto={modal === 'ajustes'}
        onCerrar={() => setModal(null)}
        acento={sesion.acento}
        onAcento={(acento) => editar(() => ({ acento }))}
        logo={sesion.logo}
        onLogo={(logo) => editar(() => ({ logo }))}
      />
      <ModalRegenerar
        abierto={modal === 'regenerar'}
        onCerrar={() => setModal(null)}
        tokens={tokens}
        ideaPrevia={actual?.regenPrompt ?? ''}
        onGenerar={regenerar}
      />
      <DialogoConfirmar
        abierto={porEliminar != null}
        onAbiertoChange={(abrir) => !abrir && setPorEliminar(null)}
        icono={Delete02Icon}
        titulo="¿Eliminar la diapositiva?"
        descripcion="Su título, su texto y su imagen se pierden. No se puede deshacer."
        accion="Eliminar diapositiva"
        destructiva
        onConfirmar={() => {
          if (porEliminar != null) eliminar(porEliminar)
          setPorEliminar(null)
        }}
      >
        {/* Cuál, en el cuerpo y no en el título: el título dice qué es la ventana (acuerdo del 6-oct). */}
        {porEliminar != null ? (
          <RegistroConfirmar
            nombre={sesion.diapositivas[porEliminar]?.title?.trim() || 'Diapositiva sin título'}
            detalle={`Diapositiva ${porEliminar + 1} de ${sesion.diapositivas.length}`}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>
      <ConfirmarGeneracion
        abierto={modal === 'generar'}
        onAbiertoChange={(abrir) => !abrir && setModal(null)}
        titulo="Generar presentación"
        descripcion="¿Estás seguro de generar la presentación? Esta acción es gratis y no consume tokens."
        accion="Generar presentación"
        onConfirmar={() => {
          setModal(null)
          generarPresentacion()
        }}
      />
    </MarcoInmersivo>
  )
}

/** Una columna del estudio: encabezado, cuerpo con scroll y pie opcional. En pantallas angostas solo se ve la activa. */
function Panel({
  titulo,
  etiqueta,
  accion,
  pie,
  oculto,
  children,
}: {
  titulo: string
  etiqueta: string
  accion?: ReactNode
  pie?: ReactNode
  oculto: boolean
  children: ReactNode
}) {
  return (
    <Frame spacing="sm" role="region" aria-label={etiqueta} className={cn('min-h-0', oculto && 'max-[800px]:hidden')}>
      {/* El nombre de la columna vive en el gris; el panel blanco es solo su contenido (Dave, 9-oct). */}
      <FrameHeader className="flex shrink-0 flex-row items-center justify-between gap-2">
        <FrameTitle>{titulo}</FrameTitle>
        {accion}
      </FrameHeader>
      <FramePanel className="flex min-h-0 flex-1 flex-col overflow-hidden px-0!">
        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">{children}</div>
        {pie ? <div className="shrink-0 border-t px-3 py-3">{pie}</div> : null}
      </FramePanel>
    </Frame>
  )
}

function OpcionesDiapositiva({
  numero,
  puedeSubir,
  puedeBajar,
  puedeEliminar,
  onSubir,
  onBajar,
  onEliminar,
}: {
  numero: number
  puedeSubir: boolean
  puedeBajar: boolean
  puedeEliminar: boolean
  onSubir: () => void
  onBajar: () => void
  onEliminar: () => void
}) {
  if (!puedeSubir && !puedeBajar && !puedeEliminar) return null
  return (
    <DropdownMenu>
      <Hint label="Opciones">
        <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de diapositiva ${numero}`} />}>
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end">
        {puedeSubir ? (
          <DropdownMenuItem onClick={onSubir}>
            <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            Mover arriba
          </DropdownMenuItem>
        ) : null}
        {puedeBajar ? (
          <DropdownMenuItem onClick={onBajar}>
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            Mover abajo
          </DropdownMenuItem>
        ) : null}
        {puedeEliminar && (puedeSubir || puedeBajar) ? <DropdownMenuSeparator /> : null}
        {puedeEliminar ? (
          <DropdownMenuItem variant="destructive" onClick={onEliminar}>
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            Eliminar
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

