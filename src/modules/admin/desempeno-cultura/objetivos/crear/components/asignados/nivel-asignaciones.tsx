import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon, Edit02Icon, GitForkIcon, InformationCircleIcon, LibraryIcon, UserEdit01Icon, WeightScaleIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, AlertTitle, Button, Text } from '@ubits/flux-ui'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { formatCount } from '../../../../encuestas/modelo/participants'
import { colaboradoresDelCiclo, gruposDelCiclo, segmentoDeGrupos } from '../../../modelo/constructor/participantesCiclo'
import { assignedObjectiveCount, setWeightBudget, totalWeight, type CicloDraft, type Objective, type ObjectiveSet, type ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import { assignmentSetSummaries, splitAssignmentRowId } from "../../../modelo/constructor/assignmentRows" 
import { type IntencionAsignacion } from './piezas-asignacion'
import { applyObjectiveWeights, coveredMemberIds, detachTarget, excludeFromSet, objectiveSetsReach, removeTargets, setWeightShare } from '../../../modelo/constructor/objectiveSets'
import { conflictedLoads } from '../../../modelo/constructor/weightConflicts'
import { useWeightShares } from '../../../modelo/constructor/weightShares'
import { weightBalanceGroup } from '../../../modelo/constructor/weightBalance'
import type { PedidoIa } from '../ia/pedido'
import { DialogoPesos } from './dialogo-pesos'
import { VentanaAsignacion } from './creacion/ventana-asignacion'
import type { PedidoPanel } from './creacion/usar-creacion'
import { AccionesConflicto, VistaConflicto } from './vista-conflicto'
import { ListaRoster, type AccionEnBloque, type FilaAsignado } from './lista-roster'
import { ContenedorDesplegable } from '../../../../encuestas/crear/components/participantes/contenedor-desplegable'

// Un nivel del paso (por grupos o por colaborador): el registro de lo repartido. Arriba, a cuánta gente llega y cuántos
// objetivos reparte, «Cómo ver lo asignado» y «Crear asignación»; después, los avisos que solo se ven desde aquí, cada
// uno con su arreglo en bloque al lado (pesos sin cuadrar, peso que no cierra entre dos asignaciones, solapamiento con
// los grupos, plantilla pendiente); y la vista elegida. Las dos vistas leen la misma selección, que vive aquí: cambiar
// de vista no la pierde. Lo que se hace con lo marcado va en la cabecera de la tabla o, en agrupaciones, en una fila
// encima. «Repartir el peso» ocupa el paso entero, como una página más.


export function NivelAsignaciones({
  tipo,
  borrador,
  onSets,
  onAsignacion,
  conErrores,
  semilla,
  onElegirSemilla,
  pedido,
  onPedido,
  onGuardado,
  onCrearConIa,
  agenteAbierto,
}: {
  tipo: ObjectiveSetKind
  borrador: CicloDraft
  onSets: (cambio: (actual: readonly ObjectiveSet[]) => readonly ObjectiveSet[]) => void
  onAsignacion: (cambio: Partial<CicloDraft['assignment']>) => void
  conErrores: boolean
  /** Objetivos de plantilla de este nivel todavía sin destinatario. */
  semilla: readonly Objective[] | null
  onElegirSemilla: () => void
  pedido: PedidoPanel | null
  onPedido: (pedido: PedidoPanel | null) => void
  onGuardado: (set: ObjectiveSet, intencion: IntencionAsignacion) => void
  onCrearConIa: (pedido: PedidoIa) => void
  agenteAbierto: boolean
}) {
  const grupal = tipo === 'grupal'
  const unidades = grupal ? 'grupos' : 'personas'
  const todos = borrador.objectiveSets
  // Los grupos son los de Participantes, con su categoría (un líder no es un área).
  const segmentBy = segmentoDeGrupos(borrador)
  const empresa = borrador.useCompanyObjectives ? borrador.companyObjectives : []
  const reglas = borrador.modelRules
  const requireAlignment = reglas.alignment === 'required' && reglas.companyObjectives !== 'off' && empresa.length > 0

  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(() => new Set())
  const [cuadrando, setCuadrando] = useState<readonly string[] | null>(null)
  const [enConflicto, setEnConflicto] = useState(false)
  const [quitando, setQuitando] = useState(false)

  const sets = useMemo(() => todos.filter((set) => set.kind === tipo), [todos, tipo])
  const resumenes = useMemo(() => assignmentSetSummaries(sets, segmentBy, { rules: reglas, requireAlignment }), [sets, segmentBy, reglas, requireAlignment])

  // Solo lo que se eligió en Participantes: los grupos que se marcaron ahí y las personas elegidas una a una.
  const entidades = useMemo(() => {
    if (tipo === 'individual') {
      return colaboradoresDelCiclo(borrador.participants).map((p) => ({ id: p.id, nombre: p.name, detalle: p.area, esGrupo: false, persona: p }))
    }
    return gruposDelCiclo(borrador).map((g) => ({ id: g.id, nombre: g.nombre, detalle: `${formatCount(g.personas)} ${plural(g.personas, 'persona', 'personas')}`, esGrupo: true }))
  }, [borrador, tipo])

  // El id de la fila es «agrupación::destinatario», el formato que leen separar y quitar (splitAssignmentRowId).
  const filas = useMemo<FilaAsignado[]>(
    () =>
      entidades.map((e) => {
        const set = sets.find((s) => s.targetIds.includes(e.id)) ?? null
        const resumen = set ? (resumenes.find((r) => r.set.id === set.id) ?? null) : null
        return { ...e, id: set ? `${set.id}::${e.id}` : e.id, targetId: e.id, set, resumen }
      }),
    [entidades, sets, resumenes],
  )

  const rowIdMap = useMemo(() => new Map(filas.map((fila) => [fila.id, { targetId: fila.targetId, setId: fila.set?.id ?? null }])), [filas])

  // Lo marcado que ya no existe (un grupo quitado, una agrupación borrada) se suelta solo.
  const seleccion = [...marcadas].filter((id) => rowIdMap.has(id))
  if (seleccion.length !== marcadas.size) setMarcadas(new Set(seleccion))

  const selectedWithSet = seleccion.map(id => rowIdMap.get(id)!).filter(x => x.setId !== null)
  const selectedWithoutSet = seleccion.map(id => rowIdMap.get(id)!).filter(x => x.setId === null)

  const agrupacionesMarcadas = [...new Set(selectedWithSet.map(x => x.setId!))]
  const separables = seleccion.filter((id) => {
     const meta = rowIdMap.get(id)
     if (!meta || !meta.setId) return false
     return (sets.find((set) => set.id === meta.setId)?.targetIds.length ?? 0) > 1
  })
  const soltar = () => setMarcadas(new Set())

  // Saca lo marcado a agrupaciones propias, con copia de los objetivos. Con una sola, abre la nueva en sus objetivos:
  // separar es el paso previo a editarla.
  const separar = () => {
    const resultado = seleccion.reduce<{ lista: readonly ObjectiveSet[]; creadas: ObjectiveSet[] }>(
      (acumulado, id) => {
        const { setId, targetId } = splitAssignmentRowId(id)
        if ((acumulado.lista.find((set) => set.id === setId)?.targetIds.length ?? 0) < 2) return acumulado
        const separado = detachTarget(acumulado.lista, setId, targetId)
        return { lista: separado.sets, creadas: separado.created ? [...acumulado.creadas, separado.created] : acumulado.creadas }
      },
      { lista: todos, creadas: [] },
    )
    if (resultado.creadas.length === 0) return
    onSets(() => resultado.lista)
    soltar()
    if (resultado.creadas.length === 1) onPedido({ setId: resultado.creadas[0].id, fase: 'objetivos', intencion: 'manual' })
  }

  // Lo que se hace con lo marcado: va en la fila de arriba de la lista, en lugar del conteo.
  const acciones: AccionEnBloque[] = [
    ...(selectedWithoutSet.length > 0
      ? [
          { id: 'crear-varios', etiqueta: 'Crear objetivos', principal: true, icono: PlusSignIcon, onClick: () => onPedido({ setId: null, fase: 'objetivos', intencion: 'manual', targetIds: selectedWithoutSet.map(x => x.targetId) }) }
        ]
      : []),
    ...(agrupacionesMarcadas.length === 1
      ? [
          { id: 'editar', etiqueta: 'Editar objetivos', icono: Edit02Icon, onClick: () => onPedido({ setId: agrupacionesMarcadas[0], fase: 'objetivos', intencion: 'manual' }) },
          { id: 'destinatarios', etiqueta: `Cambiar ${unidades}`, icono: UserEdit01Icon, onClick: () => onPedido({ setId: agrupacionesMarcadas[0], fase: 'destinatarios', intencion: 'manual' }) },
        ]
      : []),
    ...(agrupacionesMarcadas.length > 0 ? [
       {
         id: 'pesos',
         etiqueta: 'Ajustar pesos',
         icono: WeightScaleIcon,
         onClick: () => setCuadrando(agrupacionesMarcadas),
       }
    ] : []),
    ...(separables.length > 0
      ? [
          {
            id: 'separar',
            etiqueta: 'Separar con copia',
            icono: GitForkIcon,
            onClick: separar,
          },
        ]
      : []),
    ...(agrupacionesMarcadas.length > 0 ? [
       { id: 'quitar', etiqueta: 'Quitar objetivos', icono: Delete02Icon, destructiva: true, onClick: () => setQuitando(true) }
    ] : []),
  ]


  // Revisiones que solo se ven desde arriba.
  const sinCuadrar = sets.filter((set) => set.objectives.length > 0 && totalWeight(set.objectives) !== setWeightBudget(set))
  const conflictos = useMemo(() => conflictedLoads(todos, segmentBy), [todos, segmentBy])
  const reparto = useWeightShares(conflictos, enConflicto)
  const solapadas = useMemo(() => {
    if (grupal) return 0
    const cubiertas = coveredMemberIds(todos.filter((set) => set.kind === 'grupal'), segmentBy)
    return new Set(sets.flatMap((set) => set.targetIds.filter((id) => cubiertas.has(id)))).size
  }, [grupal, todos, sets, segmentBy])

  // El resumen cuenta solo lo que está en la lista: una agrupación de un grupo que ya no es participante no suma.
  const enLista = new Set(filas.flatMap((fila) => (fila.set ? [fila.set.id] : [])))
  const setsEnLista = sets.filter((set) => enLista.has(set.id))
  const alcance = objectiveSetsReach(setsEnLista, segmentBy)
  const objetivos = assignedObjectiveCount(setsEnLista)
  const sinTerminar = resumenes.filter((resumen) => resumen.issue !== null && enLista.has(resumen.set.id)).length
  const resumenNivel = [
    `${formatCount(alcance)} ${plural(alcance, 'persona alcanzada', 'personas alcanzadas')}`,
    `${objetivos} ${plural(objetivos, 'objetivo', 'objetivos')}`,
    ...(sinTerminar > 0 ? [`${sinTerminar} sin terminar`] : []),
  ].join(' · ')
  const grupos =(cuadrando ?? []).map((id) => sets.find((set) => set.id === id)).filter((set): set is ObjectiveSet => set !== undefined)
  const conObjetivos = filas.filter((fila) => (fila.set?.objectives.length ?? 0) > 0).length

  // La creación de una asignación, en una ventana de trabajo encima de la pantalla (21-oct, Elkin: «dejar el de la ventana»).
  const creacion = (
    <VentanaAsignacion
      pedido={pedido}
      onCerrar={() => onPedido(null)}
      tipo={tipo}
      sets={todos}
      onSets={onSets}
      segmentBy={segmentBy}
      onSegmentBy={(groupSegmentBy) => onAsignacion({ groupSegmentBy })}
      sincronizar={borrador.assignment.groupsAutoInclude}
      onSincronizar={(groupsAutoInclude) => onAsignacion({ groupsAutoInclude })}
      empresa={empresa}
      reglas={reglas}
      modelo={borrador.objectiveModel}
      nombreCiclo={borrador.name}
      onGuardar={onGuardado}
      onCrearConIa={onCrearConIa}
      agenteAbierto={agenteAbierto}
    />
  )
  // Como «Por grupos» y «Por persona» de Participantes (21-oct, Elkin): cada nivel es un acordeón con su título, el
  // resumen de lo repartido debajo y, a la derecha, cuántos ya tienen objetivos. Adentro, los avisos y la lista.
  const contenedor = (contenido: ReactNode) => (
    <ContenedorDesplegable
      id={tipo}
      titulo={grupal ? 'Por grupos' : 'Por colaborador'}
      detalle={resumenNivel}
      conteo={filas.length > 0 ? `${conObjetivos}/${filas.length} con objetivos` : undefined}
    >
      {contenido}
    </ContenedorDesplegable>
  )


  if (enConflicto) {
    return contenedor(
      <div className="flex flex-col gap-4">
        <VistaConflicto control={reparto} afectadas={conflictos.length} onVolver={() => setEnConflicto(false)} onSacar={(setId, personaId) => onSets((actual) => excludeFromSet(actual, setId, personaId))} />
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Text as="span" size="sm" variant="muted" className="mr-auto">
            {reparto.status.text}
          </Text>
          <AccionesConflicto
            control={reparto}
            onAplicar={() => {
              const cupos = [...reparto.shareMap().entries()]
              onSets((actual) => cupos.reduce((lista, [id, valor]) => setWeightShare(lista, id, valor), actual))
              setEnConflicto(false)
            }}
          />
        </div>
      </div>,
    )
  }

  return (
    <>
      {contenedor(
    <div className="flex flex-col gap-4">
      {sinCuadrar.length > 0 ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={WeightScaleIcon} aria-hidden="true" />
          <AlertTitle>{sinCuadrar.length === 1 ? '1 agrupación tiene los pesos sin cuadrar.' : `${sinCuadrar.length} agrupaciones tienen los pesos sin cuadrar.`}</AlertTitle>
          <AlertDescription>
            <p>Puedes repartirlos todos de una vez, sin abrir cada objetivo.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => setCuadrando(sinCuadrar.map((set) => set.id))}>
              Ajustar pesos
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {conflictos.length > 0 ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>
            {conflictos.length === 1 ? `El peso de los objetivos de ${conflictos[0].name} suma ${conflictos[0].total} %, no 100 %.` : `A ${conflictos.length} personas el peso de sus objetivos no les suma 100 %.`}
          </AlertTitle>
          <AlertDescription>
            <p>Les llegan objetivos por más de una asignación, y entre todas tienen que repartir ese 100 %.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => setEnConflicto(true)}>
              Repartir el peso
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {solapadas > 0 ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>
              {solapadas === 1 ? '1 persona ya recibe' : `${solapadas} personas ya reciben`} objetivos por su grupo. El peso de lo que definas aquí se suma al que ya llevan, y entre las dos asignaciones
              tiene que dar 100 %.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      {semilla && semilla.length > 0 ? (
        <Alert variant="info">
          <HugeiconsIcon icon={LibraryIcon} aria-hidden="true" />
          <AlertDescription>
            <p>
              <strong>
                {semilla.length} {semilla.length === 1 ? 'objetivo' : 'objetivos'} de la plantilla
              </strong>{' '}
              {semilla.length === 1 ? 'está' : 'están'} sin {grupal ? 'grupo asignado' : 'persona asignada'}.
            </p>
          </AlertDescription>
          <AlertAction>
            <Button size="sm" onClick={onElegirSemilla}>
              {grupal ? 'Elegir grupos' : 'Elegir personas'}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <ListaRoster
        tipo={tipo}
        filas={filas}
        conErrores={conErrores}
        onAbrir={(fila) => onPedido({ setId: fila.set?.id ?? null, fase: 'objetivos', intencion: 'manual', targetIds: [fila.targetId] })}
        onEliminar={(fila) => (fila.set ? onSets((actual) => removeTargets(actual, [{ setId: fila.set!.id, targetId: fila.targetId }])) : undefined)}
        marcadas={marcadas}
        onMarcadas={setMarcadas}
        acciones={acciones}
      />
    </div>,
      )}

      {creacion}

      <DialogoPesos
        abierto={cuadrando !== null}
        onAbiertoChange={(abrir) => (abrir ? undefined : setCuadrando(null))}
        grupos={grupos.map((set) => weightBalanceGroup(set, setWeightBudget(set)))}
        onAplicar={(resultado) => onSets((actual) => Object.entries(resultado).reduce((lista, [setId, pesos]) => applyObjectiveWeights(lista, setId, pesos), actual))}
      />

      <DialogoConfirmar
        abierto={quitando}
        onAbiertoChange={setQuitando}
        icono={Delete02Icon}
        titulo={seleccion.length === 1 ? `¿Quitar los objetivos de ${grupal ? 'este grupo' : 'esta persona'}?` : `¿Quitar los objetivos de ${seleccion.length} ${unidades}?`}
        descripcion="Dejan de tener objetivos en este ciclo. Una agrupación que se quede sin nadie se va con ellos."
        accion="Quitar"
        destructiva
        onConfirmar={() => {
          const destinos = seleccion.map(splitAssignmentRowId)
          onSets((actual) => removeTargets(actual, destinos))
          soltar()
          setQuitando(false)
        }}
      >
        {/* Qué se quita y a cuántos toca: los nombres marcados y cuántos objetivos se van con ellos. */}
        {quitando ? (() => {
          const marcadasFilas = filas.filter((fila) => seleccion.includes(fila.id))
          const objetivos = marcadasFilas.reduce((suma, fila) => suma + (fila.set?.objectives.length ?? 0), 0)
          const nombres = marcadasFilas.slice(0, 3).map((fila) => fila.nombre).join(', ') + (marcadasFilas.length > 3 ? ` y ${marcadasFilas.length - 3} más` : '')
          return <RegistroConfirmar nombre={nombres} detalle={`${formatCount(marcadasFilas.length)} ${plural(marcadasFilas.length, grupal ? 'grupo' : 'persona', unidades)} · ${formatCount(objetivos)} ${plural(objetivos, 'objetivo', 'objetivos')}`} tono="neutro" />
        })() : null}
      </DialogoConfirmar>
    </>
  )
}
