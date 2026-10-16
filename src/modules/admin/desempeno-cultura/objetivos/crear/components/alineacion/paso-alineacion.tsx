import { useCallback, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {  Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Frame,
  FramePanel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { EncabezadoPaso } from '../../../../encuestas/components/pasos-drawer'
import { ALIGNMENT_LEVEL_HINTS, ALIGNMENT_LEVEL_LABELS, buildAlignmentGraph, MAX_PERSON_NODES, type AlignmentLevel, type AlignmentNode, type ObjectiveRef } from '../../../modelo/constructor/alignmentGraph'
import type { CicloDraft, ObjectiveSet } from '../../../modelo/constructor/cicloBuilderTypes'
import { alignmentCounts, alignObjectives } from '../../../modelo/constructor/objectiveSets'
import { AyudasMapa } from './ayudas-mapa'
import { CrearAlineacion } from './crear-alineacion'
import { Lienzo } from './lienzo/lienzo'
import type { Posiciones } from './lienzo/geometria'
import type { OpcionEmpresa } from './opciones-empresa'
import { ICONO_NIVEL } from './visual'
import { PrimeraVez } from '@/shared/components/PrimeraVez'

// Último paso del ciclo: el mapa de alineación. Los pasos anteriores reparten metas; este contesta la pregunta que
// ninguno contesta —¿hacia dónde empuja cada una?— y deja arreglarla en el sitio, arrastrando una flecha hasta el
// objetivo de la empresa que le toca, o con «Alinear» y «Crear alineación» sin arrastrar nada.
//
// El mismo ciclo se mira a tres alturas (objetivos, agrupación, colaboradores). No son tres mapas: es el mismo grafo
// agrupado de otra manera, y por eso el nivel no cambia el borrador, solo lo que se dibuja. El nivel, la tarjeta
// elegida y dónde dejó el autor cada tarjeta viven aquí, en el estado del paso: son preferencias de lectura, no ciclo.
//
// Lo único que este paso escribe en el borrador es `Objective.alignedTo`, siempre a través de `onSets`.

const NIVELES: readonly AlignmentLevel[] = ['objetivos', 'agrupacion', 'colaboradores']
/** Alto del marco del lienzo: cabe en la columna de trabajo sin empujar el resto del paso fuera de la pantalla. */
const ALTO_LIENZO = 'h-[560px]'

const objetivos = (n: number) => `${n} ${n === 1 ? 'objetivo' : 'objetivos'}`
const clave = (ref: ObjectiveRef) => `${ref.setId}:${ref.objectiveId}`
const sinRepetir = (refs: readonly ObjectiveRef[]) => [...new Map(refs.map((ref) => [clave(ref), ref])).values()]

export function PasoAlineacion({
  borrador,
  onSets,
  onIrAEmpresa,
  onCrearAsignacion,
  conErrores,
}: {
  borrador: CicloDraft
  /** Cambia los objetivos de los sets (alinear/desalinear escribe Objective.alignedTo). */
  onSets: (sets: readonly ObjectiveSet[]) => void
  /** Vacíos: ir al paso de empresa o crear una asignación. */
  onIrAEmpresa: () => void
  onCrearAsignacion: () => void
  conErrores: boolean
}) {
  const [nivel, setNivel] = useState<AlignmentLevel>('objetivos')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [posiciones, setPosiciones] = useState<Posiciones>({})

  const grafo = useMemo(() => buildAlignmentGraph(borrador, { level: nivel, search: busqueda }), [borrador, nivel, busqueda])

  const opciones = useMemo<OpcionEmpresa[]>(
    () => (borrador.useCompanyObjectives ? borrador.companyObjectives.map((objetivo) => ({ id: objetivo.id, titulo: objetivo.title.trim() || 'Objetivo sin título' })) : []),
    [borrador.companyObjectives, borrador.useCompanyObjectives],
  )

  const cuentas = useMemo(() => alignmentCounts(borrador.objectiveSets), [borrador.objectiveSets])
  const total = cuentas.aligned + cuentas.unaligned
  const hayNorte = opciones.length > 0
  const hayAsignaciones = total > 0

  // Qué objetivo asignado ya cuelga de un objetivo de la empresa que sigue existiendo. Una alineación a uno borrado
  // no cuenta: el grafo tampoco la dibuja.
  const alineado = useMemo(() => {
    const vivos = new Set(opciones.map((opcion) => opcion.id))
    const mapa = new Map<string, boolean>()
    borrador.objectiveSets.forEach((set) => set.objectives.forEach((o) => mapa.set(`${set.id}:${o.id}`, o.alignedTo !== null && vivos.has(o.alignedTo))))
    return mapa
  }, [borrador.objectiveSets, opciones])

  // En rojo solo después de intentar avanzar, y solo si el modelo exige colgar del norte (OKR, MBO…): con alineación
  // opcional, un objetivo suelto es una decisión, no un error. Misma condición que el stepper.
  const exigeAlineacion = borrador.modelRules.alignment === 'required' && borrador.modelRules.companyObjectives !== 'off' && hayNorte
  const sueltos = [...alineado.values()].filter((v) => !v).length
  const marcarErrores = conErrores && exigeAlineacion && sueltos > 0

  const errorDe = useCallback(
    (nodo: AlignmentNode): string | null => {
      if (!marcarErrores) return null
      const pendientes = sinRepetir(nodo.objectiveRefs).filter((ref) => alineado.get(clave(ref)) === false).length
      if (pendientes === 0) return null
      return nodo.kind === 'objective' ? 'Sin alinear' : `${pendientes} sin alinear`
    },
    [marcarErrores, alineado],
  )

  const alinear = (refs: readonly ObjectiveRef[], companyObjectiveId: string | null) => {
    const unicos = sinRepetir(refs)
    if (unicos.length === 0) return
    onSets(alignObjectives(borrador.objectiveSets, unicos, companyObjectiveId))
    const n = unicos.length
    if (companyObjectiveId === null) {
      notify(`${objetivos(n)} sin alineación`)
      return
    }
    const titulo = opciones.find((opcion) => opcion.id === companyObjectiveId)?.titulo ?? 'Objetivo sin título'
    notify(`${objetivos(n)} ${n === 1 ? 'alineado' : 'alineados'}`, `Ahora contribuye${n === 1 ? '' : 'n'} a "${titulo}".`)
  }

  const cambiarNivel = (siguiente: AlignmentLevel) => {
    setNivel(siguiente)
    setSeleccionada(null)
  }

  const cobertura = total === 0 ? 0 : Math.round((cuentas.aligned / total) * 100)
  const insigniaCobertura =
    hayNorte && hayAsignaciones ? (
      <Badge variant={cuentas.unaligned === 0 ? 'success-light' : 'warning-light'} className="shrink-0 tabular-nums">
        {cuentas.aligned} de {total} alineados · {cobertura} %
      </Badge>
    ) : null

  return (
    <section className="flex flex-col gap-4" aria-label="Alineación">
      <EncabezadoPaso titulo="Alineación" descripcion="Mira el mapa del ciclo y arrastra el punto azul de cada tarjeta hacia el objetivo de la empresa." extra={insigniaCobertura} />

      {!hayNorte ? (
        <Vacio
          icono="glass-add"
          titulo="Todavía no hay un norte al que alinear"
          descripcion="El mapa conecta lo que reparte el ciclo con los objetivos de la empresa. Sin ellos no hay nada a lo que apuntar."
          accion="Definir objetivos de la empresa"
          onAccion={onIrAEmpresa}
        />
      ) : !hayAsignaciones ? (
        <Vacio
          icono="glass-add"
          titulo="Este ciclo aún no reparte objetivos"
          descripcion="Cuando haya asignaciones por grupo o por persona, aparecerán aquí para conectarlas con el norte de la empresa."
          accion="Crear una asignación"
          onAccion={onCrearAsignacion}
        />
      ) : (
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <ToggleGroup variant="outline" size="sm" value={[nivel]} onValueChange={(valor) => valor[0] && cambiarNivel(valor[0] as AlignmentLevel)} aria-label="Nivel del mapa">
                  {NIVELES.map((opcion) => (
                    <ToggleGroupItem key={opcion} value={opcion}>
                      <HugeiconsIcon icon={ICONO_NIVEL[opcion]} aria-hidden="true" />
                      {ALIGNMENT_LEVEL_LABELS[opcion]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Text size="xs" variant="muted">
                  {ALIGNMENT_LEVEL_HINTS[nivel]}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <InputGroup className="w-52">
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar en el mapa…" aria-label="Buscar tarjetas del mapa" />
                  {busqueda !== '' ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton size="icon-xs" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}>
                        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : null}
                </InputGroup>
                <CrearAlineacion borrador={borrador} opciones={opciones} nodoSeleccionado={grafo.nodes.find((nodo) => nodo.id === seleccionada)} onAlinear={alinear} />
              </div>
            </div>

            {marcarErrores ? (
              <Alert variant="destructive">
                <AlertTitle>{`Alinea ${objetivos(sueltos)} a los de la empresa`}</AlertTitle>
                <AlertDescription>Este modelo pide que cada objetivo asignado cuelgue de uno de la empresa. Las tarjetas en rojo todavía no contribuyen a ninguno.</AlertDescription>
              </Alert>
            ) : null}

            {grafo.hiddenCount > 0 || (busqueda !== '' && grafo.filteredCount > 0) ? (
              <Alert>
                <AlertDescription>
                  {grafo.hiddenCount > 0
                    ? `El mapa dibuja hasta ${MAX_PERSON_NODES} personas: primero quienes reciben metas de más de un frente o tienen asignación propia. Otras ${grafo.hiddenCount} quedan representadas por la tarjeta de su grupo — búscalas por nombre para traerlas al mapa. `
                    : ''}
                  {busqueda !== '' && grafo.filteredCount > 0 ? `${grafo.filteredCount} ${grafo.filteredCount === 1 ? 'tarjeta oculta' : 'tarjetas ocultas'} por la búsqueda.` : ''}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className={ALTO_LIENZO}>
              <Lienzo
                key={nivel}
                grafo={grafo}
                opciones={opciones}
                posicionesIniciales={posiciones}
                onPosiciones={setPosiciones}
                seleccionada={seleccionada}
                onSeleccionar={setSeleccionada}
                onAlinear={alinear}
                errorDe={errorDe}
                claveEncuadre={`${nivel}:${grafo.nodes.length}`}
              />
            </div>

            <AyudasMapa nivel={nivel} />
          </FramePanel>
        </Frame>
      )}
    </section>
  )
}

function Vacio({ icono, titulo, descripcion, accion, onAccion }: { icono: string; titulo: string; descripcion: string; accion: string; onAccion: () => void }) {
  return (
    <Frame>
      <FramePanel>
        <PrimeraVez icono={icono} titulo={titulo} descripcion={descripcion} accion={{ texto: accion, onClick: onAccion }} />
      </FramePanel>
    </Frame>
  )
}
