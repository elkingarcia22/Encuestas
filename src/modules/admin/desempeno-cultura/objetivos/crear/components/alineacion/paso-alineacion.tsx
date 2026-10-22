import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { EncabezadoPaso } from '../../../../encuestas/components/pasos-drawer'
import { ALIGNMENT_LEVEL_HINTS, ALIGNMENT_LEVEL_LABELS, buildAlignmentGraph, MAX_PERSON_NODES, type AlignmentLevel, type AlignmentNode, type ObjectiveRef } from '../../../modelo/constructor/alignmentGraph'
import type { CicloDraft, ObjectiveSet } from '../../../modelo/constructor/cicloBuilderTypes'
import { alignmentCounts, alignObjectives, unalignObjectives } from '../../../modelo/constructor/objectiveSets'
import { AyudasMapa } from './ayudas-mapa'
import { CrearAlineacion } from './crear-alineacion'
import { Lienzo } from './lienzo/lienzo'
import type { Posiciones } from './lienzo/geometria'
import type { OpcionEmpresa } from './opciones-empresa'
import { SelectorVista } from '../../../../encuestas/resultados/components/controles'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { BotonAmpliar, PantallaCompleta } from '@/modules/design-system/marco/pantalla-completa'

// Último paso del ciclo: el mapa de alineación. Los pasos anteriores reparten metas; este contesta la pregunta que
// ninguno contesta —¿hacia dónde empuja cada una?— y deja arreglarla en el sitio, arrastrando una flecha hasta el
// objetivo de la empresa que le toca, o con «Alinear» y «Crear alineación» sin arrastrar nada.
//
// El mismo ciclo se mira a tres alturas (objetivos, agrupación, colaboradores). No son tres mapas: es el mismo grafo
// agrupado de otra manera, y por eso el nivel no cambia el borrador, solo lo que se dibuja. El nivel, la tarjeta
// elegida y dónde dejó el autor cada tarjeta viven aquí, en el estado del paso: son preferencias de lectura, no ciclo.
//
// Lo único que este paso escribe en el borrador es `Objective.alignedTo`, siempre a través de `onSets`.
//
// «Ver en pantalla completa» (20-oct, Elkin): como el mapa de calor de Encuestas, el mapa se abre en la plantilla
// PantallaCompleta con sus mismos controles (nivel y «Crear alineación») junto a la X. Es el mismo estado del
// paso: lo que se mueve o alinea ahí queda al cerrar. Mientras está abierta, el lienzo de la página no se pinta, y al
// cerrar vuelve a armarse con las posiciones que dejó el autor.

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
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [posiciones, setPosiciones] = useState<Posiciones>({})
  const [ampliado, setAmpliado] = useState(false)

  const grafo = useMemo(() => buildAlignmentGraph(borrador, { level: nivel }), [borrador, nivel])

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
    borrador.objectiveSets.forEach((set) => set.objectives.forEach((o) => mapa.set(`${set.id}:${o.id}`, o.alignedTo.some((destino) => vivos.has(destino)))))
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
    const n = unicos.length
    // Un objetivo puede contribuir a varios (22-oct): elegir uno que ya tienen todos lo quita de ese destino solamente.
    const objetivoDe = (ref: ObjectiveRef) => borrador.objectiveSets.find((set) => set.id === ref.setId)?.objectives.find((o) => o.id === ref.objectiveId)
    if (companyObjectiveId !== null && unicos.every((ref) => objetivoDe(ref)?.alignedTo.includes(companyObjectiveId))) {
      onSets(unalignObjectives(borrador.objectiveSets, unicos, companyObjectiveId))
      const titulo = opciones.find((opcion) => opcion.id === companyObjectiveId)?.titulo ?? 'Objetivo sin título'
      notify(`${objetivos(n)} ya no ${n === 1 ? 'contribuye' : 'contribuyen'} a «${titulo}»`, 'Los demás objetivos a los que contribuye siguen igual.', 'success')
      return
    }
    onSets(alignObjectives(borrador.objectiveSets, unicos, companyObjectiveId))
    if (companyObjectiveId === null) {
      notify(`${objetivos(n)} sin alineación`, undefined, 'success')
      return
    }
    const titulo = opciones.find((opcion) => opcion.id === companyObjectiveId)?.titulo ?? 'Objetivo sin título'
    notify(`${objetivos(n)} ${n === 1 ? 'alineado' : 'alineados'}`, `Ahora contribuye${n === 1 ? '' : 'n'} a «${titulo}».`, 'success')
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

  // El nivel es una vista del mismo mapa: la pastilla de Encuestas (Secciones / Mapa de calor), solo texto (20-oct).
  const controlesNivel = <SelectorVista valor={nivel} onCambio={cambiarNivel} etiqueta="Nivel del mapa" opciones={NIVELES.map((opcion) => ({ value: opcion, label: ALIGNMENT_LEVEL_LABELS[opcion] }))} />
  // Sin buscador (20-oct, Elkin): la cabecera lleva el nivel, «Crear alineación» y ampliar.
  const crear = (
    <>
      <CrearAlineacion borrador={borrador} opciones={opciones} nodoSeleccionado={grafo.nodes.find((nodo) => nodo.id === seleccionada)} onAlinear={alinear} />
    </>
  )
  const avisos = (
    <>
      {marcarErrores ? (
        <Alert variant="destructive">
          <AlertTitle>{`Alinea ${objetivos(sueltos)} a los de la empresa`}</AlertTitle>
          <AlertDescription>Este modelo pide que cada objetivo asignado cuelgue de uno de la empresa. Las tarjetas en rojo todavía no contribuyen a ninguno.</AlertDescription>
        </Alert>
      ) : null}

      {grafo.hiddenCount > 0 ? (
        <Alert>
          <AlertDescription>
            {`El mapa dibuja hasta ${MAX_PERSON_NODES} personas: primero quienes reciben metas de más de un frente o tienen asignación propia. Otras ${grafo.hiddenCount} quedan representadas por la tarjeta de su grupo.`}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  )
  const lienzo = (
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
  )

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
        // Como las tablas y el «Detalle por secciones» de Encuestas (20-oct, Elkin): el título y su bajada en lo gris del
        // marco, y en la misma línea la pastilla del nivel, «Crear alineación» y ampliar.
        <Frame spacing="sm">
          {/* Cabecera del marco en fila: con el tema sin capa solo obedece con «!» (diferencias.json › instalacion-estilos-sin-capa). */}
          <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
            <div className="min-w-0">
              <FrameTitle>Mapa de alineación</FrameTitle>
              <FrameDescription>{grafo.nodes.length === 1 ? '1 tarjeta' : `${grafo.nodes.length} tarjetas`}</FrameDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {controlesNivel}
              {crear}
              <BotonAmpliar onClick={() => setAmpliado(true)} />
            </div>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-3">
            {avisos}

            <div className={ALTO_LIENZO}>{ampliado ? null : lienzo}</div>

            <AyudasMapa nivel={nivel} />
          </FramePanel>
        </Frame>
      )}

      <PantallaCompleta abierta={ampliado} onCerrar={() => setAmpliado(false)} titulo="Mapa de alineación" descripcion={hayNorte && hayAsignaciones ? `${cuentas.aligned} de ${total} alineados · ${cobertura} % · ${ALIGNMENT_LEVEL_HINTS[nivel]}` : undefined} acciones={<>{controlesNivel}{crear}</>}>
        <div className="flex h-full min-h-[480px] flex-col gap-3">
          {avisos}
          <div className="min-h-0 flex-1">{lienzo}</div>
          <AyudasMapa nivel={nivel} />
        </div>
      </PantallaCompleta>
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
