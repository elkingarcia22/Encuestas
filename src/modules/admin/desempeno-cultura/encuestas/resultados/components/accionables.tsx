import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, InformationCircleIcon, Task01Icon, ToggleOffIcon, ToggleOnIcon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'
import { notify } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { TEXTO_POR_TONO } from '../../components/tonos'
import {
  IMPACT_DESCRIPTION,
  IMPACT_LEGEND,
  LAUNCH_BY_ID,
  actionableTone,
  buildActionableShelves,
  defaultActivation,
  describeScore,
  pluralize,
  type Actionable,
  type ActivationConfig,
} from '../../modelo/actionables/actionableCatalog'
import { buildProgress } from '../../modelo/actionables/actionableProgress'
import { buildActionables } from '../../modelo/actionables/buildActionables'
import type { SurveyResults } from '../../modelo/surveyResults'
import { AccionableDetalle } from './accionable-detalle'
import { BloquePlegable, SobreGris } from './arbol-resultados'
import { LeyendaEscala } from './controles'
import { numero, varianteImpacto } from './escala'

// Accionables: las acciones que salen de estos resultados, agrupadas por el módulo donde quedan
// montadas (Desempeño, Aprendizaje, Selección, Diagnóstico). Cada una dice qué señal la dispara, a
// quién alcanza y qué entregable deja; activarla crea una tarea para quien debe actuar.

type Estado = 'todos' | 'activos' | 'sugeridos'

function Icono({ accionable, size = 'sm' }: { accionable: Actionable; size?: 'sm' | 'lg' }) {
  return (
    <IconTile variant="soft" size={size} className={`shrink-0 ${TEXTO_POR_TONO[actionableTone(accionable)]}`}>
      {accionable.ai ? <IconoIA /> : <HugeiconsIcon icon={accionable.icon} aria-hidden="true" />}
    </IconTile>
  )
}

// Qué significa el puntaje, en el globo del producto (Hint) y no en el del navegador (decisión 16 de la auditoría).
function Impacto({ accionable }: { accionable: Actionable }) {
  return (
    <Hint label={describeScore(accionable.score)}>
      <Badge variant={varianteImpacto(accionable.score)} className="tabular-nums">
        {accionable.score}
      </Badge>
    </Hint>
  )
}

function Alcance({ accionable }: { accionable: Actionable }) {
  return (
    <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
      <HugeiconsIcon icon={UserGroupIcon} size={14} aria-hidden="true" />
      {numero(accionable.audience.people)} {accionable.audience.people === 1 ? 'persona' : 'personas'} · {accionable.audience.label}
    </Text>
  )
}

function Tarea({ accionable }: { accionable: Actionable }) {
  return (
    <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
      <HugeiconsIcon icon={Task01Icon} size={14} aria-hidden="true" />
      Tarea para {accionable.task.assignee}
    </Text>
  )
}

/** Las acciones de un módulo como lista para elegir (ListaElegible, la de Participantes en Crear encuesta): dentro del
 *  bloque plegable no va una tabla con su propio marco (contenedor dentro de contenedor). Cada fila trae su casilla para
 *  activar varios de una vez, el accionable con su alcance y su tarea, y a la derecha el impacto, el estado y la flecha
 *  que abre su panel de detalle. */
function ListaAccionables({
  id,
  accionables,
  activaciones,
  marcados,
  onMarcar,
  onAbrir,
}: {
  id: string
  accionables: readonly Actionable[]
  activaciones: ReadonlyMap<string, ActivationConfig>
  marcados: ReadonlySet<string>
  onMarcar: (ids: readonly string[], marcar: boolean) => void
  onAbrir: (accionable: Actionable) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const termino = busqueda.trim().toLowerCase()
  const filtrados = termino ? accionables.filter((accionable) => `${accionable.title} ${accionable.feature}`.toLowerCase().includes(termino)) : accionables
  const filas = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina)
  const marcadasPagina = filas.filter((accionable) => marcados.has(accionable.id)).length
  return (
    <ListaElegible
      id={id}
      nombre="accionables"
      herramientasEnCabecera
      buscador={{
        valor: busqueda,
        placeholder: 'Busca un accionable',
        onValor: (valor) => {
          setBusqueda(valor)
          setPagina(1)
        },
      }}
      casillaPagina={{
        marcada: filas.length > 0 && marcadasPagina === filas.length,
        parcial: marcadasPagina > 0 && marcadasPagina < filas.length,
        onCambio: () => onMarcar(filas.map((accionable) => accionable.id), marcadasPagina !== filas.length),
        etiqueta: 'Marcar los accionables de esta página',
      }}
      paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: filtrados.length }}
      vacio={<SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />}
    >
      {filas.map((accionable) => {
        const activacion = activaciones.get(accionable.id)
        return (
          <FilaElegible
            key={accionable.id}
            marcada={marcados.has(accionable.id)}
            onCambio={() => onMarcar([accionable.id], !marcados.has(accionable.id))}
            etiqueta={`Marcar ${accionable.title}`}
            contenido={
              <div className="flex min-w-0 items-center gap-3">
                <Icono accionable={accionable} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <CeldaTitulo titulo={accionable.title} detalle={accionable.feature} onClick={() => onAbrir(accionable)} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Alcance accionable={accionable} />
                    <Tarea accionable={accionable} />
                  </div>
                </div>
              </div>
            }
            lateral={
              <div className="flex items-center gap-2">
                <Impacto accionable={accionable} />
                {activacion ? (
                  <Hint label={LAUNCH_BY_ID[activacion.launch].label}>
                    <Badge variant="success-light" size="sm" tabIndex={0}>
                      Activo
                    </Badge>
                  </Hint>
                ) : (
                  <Badge variant="outline" size="sm">
                    Sugerido
                  </Badge>
                )}
                <BotonIcono size="icon-xs" aria-label={`Ver el detalle de ${accionable.title}`} onClick={() => onAbrir(accionable)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                </BotonIcono>
              </div>
            }
          />
        )
      })}
    </ListaElegible>
  )
}

export function Accionables({ resultados }: { resultados: SurveyResults }) {
  const [estado, setEstado] = useState<Estado>('todos')
  const [activaciones, setActivaciones] = useState<ReadonlyMap<string, ActivationConfig>>(() => new Map())
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [panel, setPanel] = useState(false)
  const [desactivandoId, setDesactivandoId] = useState<string | null>(null)
  // Lo marcado en las listas, para activar varios de una vez con su configuración sugerida.
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(() => new Set())
  const [confirmandoVarios, setConfirmandoVarios] = useState(false)

  const accionables = useMemo(() => buildActionables(resultados), [resultados])

  const visibles = accionables.filter((accionable) => (estado === 'todos' || (estado === 'activos' ? activaciones.has(accionable.id) : !activaciones.has(accionable.id))))
  const estantes = buildActionableShelves(visibles)
  const abierto = accionables.find((accionable) => accionable.id === abiertoId) ?? null

  const abrir = (accionable: Actionable) => {
    setAbiertoId(accionable.id)
    setPanel(true)
  }
  const activar = (id: string, config: ActivationConfig) => {
    const nuevo = !activaciones.has(id)
    setActivaciones((previas) => new Map(previas).set(id, config))
    setPanel(false)
    const accionable = accionables.find((uno) => uno.id === id)
    notify(nuevo ? 'Accionable activado' : 'Cambios guardados', accionable ? `«${accionable.title}» sale ${LAUNCH_BY_ID[config.launch].label.toLowerCase()} y crea la tarea para ${accionable.task.assignee}.` : undefined)
  }
  const marcar = (ids: readonly string[], marcarlos: boolean) =>
    setMarcados((previos) => {
      const siguientes = new Set(previos)
      ids.forEach((id) => (marcarlos ? siguientes.add(id) : siguientes.delete(id)))
      return siguientes
    })
  // Solo cuentan los marcados que aún están sugeridos: activar uno que ya está activo no cambia nada.
  const porActivar = accionables.filter((accionable) => marcados.has(accionable.id) && !activaciones.has(accionable.id))
  const activarVarios = () => {
    setActivaciones((previas) => {
      const siguientes = new Map(previas)
      porActivar.forEach((accionable) => siguientes.set(accionable.id, defaultActivation(accionable)))
      return siguientes
    })
    notify(`${pluralize(porActivar.length, 'accionable activado', 'accionables activados')}`, 'Cada uno sale con su configuración sugerida y crea la tarea para quien debe actuar. Puedes ajustarlo en su detalle.')
    setMarcados(new Set())
    setConfirmandoVarios(false)
  }
  const desactivar = (id: string) => {
    setActivaciones((previas) => {
      const siguientes = new Map(previas)
      siguientes.delete(id)
      return siguientes
    })
    setPanel(false)
    notify('Accionable desactivado', 'Las tareas que ya se habían creado se cierran.')
  }
  // Desactivar cierra las tareas de otras personas y no se deshace: antes se pregunta (regla del 6-oct, DialogoConfirmar).
  const desactivando = accionables.find((accionable) => accionable.id === desactivandoId) ?? null
  const activacionDesactivando = desactivando ? activaciones.get(desactivando.id) : undefined
  const avanceDesactivando = desactivando && activacionDesactivando ? buildProgress(desactivando, activacionDesactivando) : null
  const tareasAbiertas = avanceDesactivando ? avanceDesactivando.doing + avanceDesactivando.todo : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Como las demás pestañas: un marco con sus controles y, sobre el gris, un bloque plegable por módulo con su tabla. */}
      <Frame spacing="sm" className="[--frame-gap:0px]">
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>Accionables</FrameTitle>
            <FrameDescription>{pluralize(accionables.length, 'acción salida', 'acciones salidas')} de estos resultados</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Pestañas subrayadas, como todas las del sistema (regla 5 de la auditoría). */}
            <Tabs value={estado} onValueChange={(valor) => setEstado(valor as Estado)}>
              <TabsList variant="line" aria-label="Estado de los accionables">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="activos">
                  Activos
                  <Badge variant="secondary" size="xs" className="tabular-nums">
                    {activaciones.size}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="sugeridos">
                  Sugeridos
                  <Badge variant="secondary" size="xs" className="tabular-nums">
                    {accionables.length - activaciones.size}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <LeyendaEscala titulo="Impacto del accionable" descripcion={IMPACT_DESCRIPTION} escala={IMPACT_LEGEND} />
            {porActivar.length > 0 ? (
              <Button size="sm" onClick={() => setConfirmandoVarios(true)}>
                <HugeiconsIcon icon={ToggleOnIcon} aria-hidden="true" />
                Activar ({porActivar.length})
              </Button>
            ) : null}
          </div>
        </FrameHeader>
        <SobreGris>
          <div className="flex flex-col gap-3">
            <Alert>
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertDescription>
                Cada accionable funciona con tareas: se le asigna una a quien debe actuar (el líder, el grupo, el responsable del módulo) y solo queda en check cuando el entregable está completo: el plan terminado, el objetivo aceptado, el
                pulso respondido. Mientras tanto sigue abierta y el recordatorio sigue llegando.
              </AlertDescription>
            </Alert>
            {estantes.length > 0 ? (
              estantes.map((estante, indice) => {
                const activos = estante.items.filter((accionable) => activaciones.has(accionable.id)).length
                return (
                  <BloquePlegable
                    key={estante.module.id}
                    id={`estante-${estante.module.id}`}
                    numero={String(indice + 1)}
                    titulo={estante.module.label}
                    subtitulo={estante.module.description}
                    metrica={
                      <div className="flex items-center gap-1.5">
                        <Text as="span" size="xs" variant="muted" weight="medium">
                          {pluralize(estante.items.length, 'accionable', 'accionables')}
                        </Text>
                        {activos > 0 ? (
                          <Badge variant="success-light" size="sm" className="tabular-nums">
                            {activos} {activos === 1 ? 'activo' : 'activos'}
                          </Badge>
                        ) : null}
                      </div>
                    }
                  >
                    <ListaAccionables id={`accionables-${estante.module.id}`} accionables={estante.items} activaciones={activaciones} marcados={marcados} onMarcar={marcar} onAbrir={abrir} />
                  </BloquePlegable>
                )
              })
            ) : (
              <FramePanel>
                {/* El vacío del sistema, con ilustración (decisión 14): la pestaña elegida no deja nada que mostrar. */}
                <PrimeraVez
                  icono={estado === 'activos' ? 'glass-activity' : 'glass-tick'}
                  titulo={estado === 'activos' ? 'Todavía no has activado ninguno' : 'Ya activaste todos los accionables'}
                  descripcion={estado === 'activos' ? 'Abre uno de los sugeridos y enciéndelo para verlo aquí con su avance.' : 'No queda ninguno por decidir en esta medición.'}
                  accion={{ texto: 'Ver todos los accionables', onClick: () => setEstado('todos') }}
                />
              </FramePanel>
            )}
          </div>
        </SobreGris>
      </Frame>

      <AccionableDetalle
        accionable={abierto}
        abierto={panel}
        onAbiertoChange={setPanel}
        activacion={abierto ? (activaciones.get(abierto.id) ?? null) : null}
        onActivar={(config) => abierto && activar(abierto.id, config)}
        onDesactivar={() => abierto && setDesactivandoId(abierto.id)}
      />

      {/* Activar crea tareas para otras personas: antes se pregunta (regla del 8-oct, DialogoConfirmar). */}
      <DialogoConfirmar
        abierto={confirmandoVarios}
        onAbiertoChange={setConfirmandoVarios}
        icono={ToggleOnIcon}
        titulo="¿Activar los accionables?"
        descripcion={`${porActivar.length === 1 ? `Se activa «${porActivar[0].title}»` : `Se activan ${pluralize(porActivar.length, 'accionable', 'accionables')}`} con su configuración sugerida y cada uno crea la tarea para quien debe actuar. Puedes ajustar cada uno después en su detalle.`}
        cancelar="Cancelar"
        accion={`Activar ${pluralize(porActivar.length, 'accionable', 'accionables')}`}
        onConfirmar={activarVarios}
      />

      <DialogoConfirmar
        abierto={desactivando !== null}
        onAbiertoChange={(abrir) => (abrir ? undefined : setDesactivandoId(null))}
        icono={ToggleOffIcon}
        titulo="¿Desactivar el accionable?"
        descripcion={`«${desactivando?.title ?? ''}» dejará de crear tareas y se cerrarán las que siguen abiertas: ${pluralize(tareasAbiertas, 'tarea', 'tareas')}. Esto no se puede deshacer; si lo quieres de vuelta, habrá que activarlo otra vez.`}
        cancelar="Cancelar"
        accion="Desactivar accionable"
        destructiva
        onConfirmar={() => {
          if (desactivando) desactivar(desactivando.id)
          setDesactivandoId(null)
        }}
      />
    </div>
  )
}
