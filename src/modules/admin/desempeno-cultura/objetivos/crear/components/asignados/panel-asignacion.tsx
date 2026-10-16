import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { ANCHO_AGENTE } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import { COLLABORATORS } from '../../../../encuestas/modelo/collaborators'
import { groupMemberIds } from '../../../../encuestas/modelo/participants'
import type { SegmentKey } from '../../../../encuestas/modelo/surveyBuilderTypes'
import { TOTAL_WEIGHT, createBlankObjective, createObjectiveSet, objectiveSetIssue, setWeightBudget, totalWeight, type Objective, type ObjectiveSet, type ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import type { ObjectiveModelId, ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import { distributeSetWeights, freeWeight, insertObjectivesFromAI, rescaleObjectives, setWeightShare, targetLabel } from '../../../modelo/constructor/objectiveSets'
import { loadsForTargets, tightestFreeShare } from '../../../modelo/constructor/weightConflicts'
import { useWeightShares } from '../../../modelo/constructor/weightShares'
import { weightBalanceGroup } from '../../../modelo/constructor/weightBalance'
import { useObjectiveBank } from '../../../modelo/constructor/objectiveBankBrowse'
import { FiltrosBanco, ListaBanco } from '../banco/piezas-banco'
import { ListaObjetivos } from '../objetivo/lista-objetivos'
import type { PedidoIa } from '../ia/pedido'
import { DialogoPesos } from './dialogo-pesos'
import { AvisoCargaPrevia, FaseDestinatarios } from './fase-destinatarios'
import { FaseObjetivos } from './fase-objetivos'
import type { IntencionAsignacion } from './piezas-asignacion'
import { AccionesConflicto, VistaConflicto } from './vista-conflicto'

// Crear o editar una asignación de principio a fin sin salir del panel: primero a quién (destinatarios), después qué
// (objetivos), con los pasos arriba como los asistentes de Encuestas. Todo es local hasta «Guardar asignación»: cerrar
// con algo escrito pregunta antes de descartarlo. Dentro, como páginas del mismo panel y no ventanas encima, el banco de objetivos y «Repartir el peso del
// ciclo»; sus acciones van en el pie. La intención con la que se abrió (a mano, banco, IA o plantilla) decide qué se
// abre solo al llegar a los objetivos si todavía no hay ninguno. Con el agente de IA acoplado el panel se corre a su
// izquierda y deja de ser modal; la propuesta entra en el set local, marcada, hasta conservarla o descartarla. Traer del
// banco o conservar la propuesta guarda y cierra solo si con eso la asignación queda completa.

export interface PedidoPanel {
  setId: string | null
  fase: 'destinatarios' | 'objetivos'
  intencion: IntencionAsignacion
  targetIds?: readonly string[]
  /** Con intención «plantilla», los objetivos ya escritos con los que arranca. */
  objetivosPlantilla?: readonly Objective[]
}

export interface PanelAsignacionProps {
  pedido: PedidoPanel | null
  onCerrar: () => void
  tipo: ObjectiveSetKind
  /** Todo lo repartido del ciclo, de los dos tipos. */
  sets: readonly ObjectiveSet[]
  onSets: (cambio: (actual: readonly ObjectiveSet[]) => readonly ObjectiveSet[]) => void
  segmentBy: SegmentKey
  onSegmentBy: (valor: SegmentKey) => void
  sincronizar: boolean
  onSincronizar: (activo: boolean) => void
  empresa: readonly Objective[]
  reglas: ObjectiveModelRules
  modelo: ObjectiveModelId | null
  nombreCiclo: string
  onGuardar: (set: ObjectiveSet, intencion: IntencionAsignacion) => void
  onCrearConIa: (pedido: PedidoIa) => void
  agenteAbierto: boolean
}

export function PanelAsignacion(props: PanelAsignacionProps) {
  // Una sesión por apertura: lo que se dejó a medias al cerrar no se arrastra a la siguiente.
  const [sesion, setSesion] = useState({ pedido: props.pedido, cuenta: 0 })
  if (props.pedido && props.pedido !== sesion.pedido) setSesion({ pedido: props.pedido, cuenta: sesion.cuenta + 1 })
  if (!sesion.pedido) return null
  return <Panel key={sesion.cuenta} {...props} abierto={props.pedido !== null} pedido={sesion.pedido} />
}

type Subpagina = 'lista' | 'banco' | 'conflicto'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

function Panel({
  abierto,
  pedido,
  onCerrar,
  tipo,
  sets,
  onSets,
  segmentBy,
  onSegmentBy,
  sincronizar,
  onSincronizar,
  empresa,
  reglas,
  modelo,
  nombreCiclo,
  onGuardar,
  onCrearConIa,
  agenteAbierto,
}: Omit<PanelAsignacionProps, 'pedido'> & { abierto: boolean; pedido: PedidoPanel }) {
  const grupal = tipo === 'grupal'
  const alcanceBanco = grupal ? 'grupo' : 'individual'
  const [inicial] = useState(() => (pedido.setId ? (sets.find((set) => set.id === pedido.setId) ?? null) : null))
  const [set, setSet] = useState<ObjectiveSet>(() => inicial ?? { ...createObjectiveSet(tipo, pedido.targetIds ?? []), objectives: pedido.intencion === 'plantilla' ? (pedido.objetivosPlantilla ?? []) : [] })
  const [fase, setFase] = useState<'destinatarios' | 'objetivos'>(() => {
    if (pedido.fase === 'objetivos') return 'objetivos'
    return (inicial && inicial.targetIds.length > 0) ? pedido.fase : 'destinatarios'
  })
  // Cómo estaba la asignación al abrir el panel: lo que se compara para saber si hay algo que perder al cerrar.
  const [alAbrir] = useState(() => JSON.stringify(set))
  const [preguntando, setPreguntando] = useState(false)
  const [subpagina, setSubpagina] = useState<Subpagina>('lista')
  const [pesos, setPesos] = useState(false)
  const [conErrores, setConErrores] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const banco = useObjectiveBank(alcanceBanco)

  // La propuesta de la IA que todavía no se conserva. La lista lleva los ids (para marcarla) y el ref los lee dentro
  // de los callbacks del agente, que se crean una vez y viven más que este render.
  const [propuesta, setPropuesta] = useState<ReadonlySet<string>>(() => new Set())
  const propuestaRef = useRef(propuesta)
  propuestaRef.current = propuesta
  const setRef = useRef(set)
  setRef.current = set
  const [ia, setIa] = useState({ pedida: false, vista: false })
  if (ia.pedida && agenteAbierto && !ia.vista) setIa({ pedida: true, vista: true })
  if (ia.pedida && ia.vista && !agenteAbierto) {
    // Cerrar el agente cierra la decisión: lo que quedó en la lista ya es del borrador.
    setIa({ pedida: false, vista: false })
    setPropuesta(new Set())
  }
  const iaAbierta = ia.pedida && agenteAbierto

  const elegidos = set.targetIds
  const requiereAlineacion = reglas.alignment === 'required' && reglas.companyObjectives !== 'off' && empresa.length > 0
  const problemaDe = (candidato: ObjectiveSet) => objectiveSetIssue(candidato, { rules: reglas, requireAlignment: requiereAlineacion })

  // Un destinatario que ya está en otra asignación del mismo tipo: en grupos se marca igual (con insignia), en individual
  // ni aparece.
  const tomados = useMemo(() => new Set(sets.filter((otro) => otro.kind === tipo && otro.id !== set.id).flatMap((otro) => otro.targetIds)), [sets, tipo, set.id])
  const personas = useMemo(() => (grupal ? [] : COLLABORATORS.filter((persona) => !tomados.has(persona.id) || elegidos.includes(persona.id))), [grupal, tomados, elegidos])
  const alcance = grupal ? groupMemberIds(segmentBy, elegidos).size : elegidos.length

  // Quién de los marcados ya lleva objetivos por otra vía (sin contar este borrador, cuyo peso todavía se decide, ni a
  // quien ya se sacó de él).
  const cargas = useMemo(() => {
    const todas = loadsForTargets(sets, segmentBy, tipo, elegidos, { excludeSetId: set.id })
    const fuera = new Set(set.excludedIds ?? [])
    return todas.filter((carga) => !fuera.has(carga.personId))
  }, [sets, segmentBy, tipo, elegidos, set.id, set.excludedIds])
  const libre = tightestFreeShare(cargas)
  const cupo = setWeightBudget(set)
  const total = totalWeight(set.objectives)
  const resuelto = set.weightShare !== undefined && set.weightShare <= libre
  const pendienteDeRepartir = cargas.length > 0 && !resuelto
  const lleno = cargas.length > 0 && libre === 0
  // Las mismas cargas contando esta asignación como una vía más: el reparto tiene que verla aunque aún no exista.
  const cargasConEsta = useMemo(
    () =>
      cargas.map((carga) => ({
        ...carga,
        total: carga.total + total,
        sources: [...carga.sources, { setId: set.id, kind: tipo, label: inicial ? 'Esta asignación' : 'Esta asignación (nueva)', weight: total, objectiveCount: set.objectives.length, sharedWith: Math.max(0, alcance - 1) }],
      })),
    [cargas, total, set.id, set.objectives.length, tipo, inicial, alcance],
  )
  const reparto = useWeightShares(cargasConEsta, subpagina === 'conflicto')

  const titular = elegidos.length === 0 ? (grupal ? 'Sin grupos' : 'Sin personas') : elegidos.length === 1 ? targetLabel(set, elegidos[0]) : plural(elegidos.length, grupal ? 'grupo' : 'persona', grupal ? 'grupos' : 'personas')

  const cerrarCon = (final: ObjectiveSet) => {
    onGuardar(final, pedido.intencion)
    onCerrar()
  }
  const terminarSiCompleta = (siguiente: ObjectiveSet) => {
    if (problemaDe(siguiente) !== null) return false
    cerrarCon(siguiente)
    return true
  }

  const conCupo = (actual: ObjectiveSet, nuevo: number): ObjectiveSet => ({ ...actual, weightShare: nuevo === TOTAL_WEIGHT ? undefined : nuevo, objectives: rescaleObjectives(actual.objectives, nuevo) })
  const usarLibre = () => setSet((actual) => conCupo(actual, libre))
  const aplicarReparto = () => {
    const cupos = reparto.shareMap()
    const propio = cupos.get(set.id)
    if (propio !== undefined) setSet((actual) => conCupo(actual, propio))
    const otros = [...cupos.entries()].filter(([id]) => id !== set.id)
    if (otros.length) onSets((actual) => otros.reduce((lista, [id, valor]) => setWeightShare(lista, id, valor), actual))
    setSubpagina('lista')
  }
  const sacar = (setId: string, personaId: string) => {
    if (setId === set.id) return setSet((actual) => ({ ...actual, excludedIds: [...new Set([...(actual.excludedIds ?? []), personaId])] }))
    onSets((actual) => actual.map((otro) => (otro.id === setId && otro.kind === 'grupal' ? { ...otro, excludedIds: [...new Set([...(otro.excludedIds ?? []), personaId])] } : otro)))
  }

  const agregarEnBlanco = () => {
    const nuevo = createBlankObjective(freeWeight(setRef.current))
    setSet((actual) => ({ ...actual, objectives: [...actual.objectives, nuevo] }))
    setAbierta(nuevo.id)
  }
  const abrirBanco = () => {
    banco.clearSelection()
    setSubpagina('banco')
  }
  const agregarDelBanco = () => {
    const llegan = banco.buildObjectives(freeWeight(set))
    if (llegan.length === 0) return
    const siguiente = insertObjectivesFromAI([set], set.id, llegan)[0]
    setSubpagina('lista')
    if (terminarSiCompleta(siguiente)) return
    setSet(siguiente)
    setAbierta(llegan[0].id)
  }
  const abrirIa = () => {
    if (agenteAbierto) return
    setIa({ pedida: true, vista: false })
    // Los ids de la tanda anterior se leen antes de reemplazarlos: el actualizador corre después, con el ref ya cambiado.
    const sinTanda = (anteriores: ReadonlySet<string>) => (actual: ObjectiveSet) => ({ ...actual, objectives: actual.objectives.filter((objetivo) => !anteriores.has(objetivo.id)) })
    onCrearConIa({
      alcance: grupal ? 'grupo' : 'individual',
      audiencia: elegidos.length === 1 ? titular : `${grupal ? 'estos' : 'estas'} ${titular}`,
      existentes: set.objectives.length,
      pesoLibre: freeWeight(set),
      onAplicar: (objetivos) => {
        const quitar = sinTanda(propuestaRef.current)
        setSet((actual) => {
          const limpio = quitar(actual)
          return { ...limpio, objectives: [...limpio.objectives, ...objetivos] }
        })
        const ids = new Set(objetivos.map((objetivo) => objetivo.id))
        propuestaRef.current = ids
        setPropuesta(ids)
        setAbierta(null)
      },
      onDescartar: () => {
        setSet(sinTanda(propuestaRef.current))
        propuestaRef.current = new Set()
        setPropuesta(new Set())
      },
      onConservar: () => {
        propuestaRef.current = new Set()
        setPropuesta(new Set())
        terminarSiCompleta(setRef.current)
      },
    })
  }
  const elegir = (intencion: Exclude<IntencionAsignacion, 'plantilla'>) => (intencion === 'ia' ? abrirIa() : intencion === 'banco' ? abrirBanco() : agregarEnBlanco())

  // La intención con la que se abrió se aplica una sola vez, al llegar a los objetivos sin ninguno escrito.
  const intencionAplicada = useRef(false)
  const aplicarIntencion = (actual: ObjectiveSet) => {
    if (intencionAplicada.current) return
    intencionAplicada.current = true
    if (actual.objectives.length > 0 || pedido.intencion === 'plantilla') return
    elegir(pedido.intencion)
  }
  useEffect(() => {
    if (fase === 'objetivos') aplicarIntencion(setRef.current)
    // Solo al abrir directo en los objetivos (editar): al llegar con «Continuar» la aplica el propio botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const continuar = () => {
    setFase('objetivos')
    aplicarIntencion(set)
  }

  const guardar = () => (problemaDe(set) !== null ? setConErrores(true) : cerrarCon(set))

  // Cerrar (la X, Escape o «Cancelar») con algo escrito pregunta antes de descartarlo; sin cambios cierra directo.
  const hayCambios = JSON.stringify(set) !== alAbrir
  const sePuedeGuardar = problemaDe(set) === null
  const pedirCerrar = () => (hayCambios ? setPreguntando(true) : onCerrar())

  const pista =
    subpagina === 'conflicto'
      ? reparto.status.text
      : subpagina === 'banco'
        ? banco.selectedCount === 0
          ? `Se añadirán a ${titular}`
          : `${plural(banco.selectedCount, 'elegido', 'elegidos')} · irán a ${titular}`
        : fase === 'destinatarios'
          ? elegidos.length === 0
            ? `Marca al menos ${grupal ? 'un grupo' : 'una persona'} para continuar`
            : lleno
              ? `${cargas.length === 1 ? `${cargas[0].name} ya reparte` : `${cargas.length} personas ya reparten`} todo su ${TOTAL_WEIGHT} % de peso · reparte ese peso antes de crear objetivos`
              : pendienteDeRepartir
                ? `${cargas.length} ${cargas.length === 1 ? 'persona ya lleva' : 'personas ya llevan'} objetivos · solo les queda ${libre} % de peso libre`
                : grupal
                  ? `${plural(elegidos.length, 'grupo', 'grupos')} · ${plural(alcance, 'persona', 'personas')}`
                  : `${plural(elegidos.length, 'persona seleccionada', 'personas seleccionadas')}`
          : set.objectives.length === 0
            ? 'Añade al menos un objetivo para guardar'
            : total === cupo
              ? `${plural(set.objectives.length, 'objetivo', 'objetivos')} · los pesos suman ${cupo} %`
              : `Los pesos suman ${total} % de ${cupo} %`

  const aviso = pendienteDeRepartir ? <AvisoCargaPrevia cargas={cargas} libre={libre} onRepartir={() => setSubpagina('conflicto')} onUsarLibre={usarLibre} /> : null

  const pie =
    subpagina === 'conflicto' ? (
      <AccionesConflicto control={reparto} onAplicar={aplicarReparto} />
    ) : subpagina === 'banco' ? (
      <>
        <Button variant="outline" onClick={() => setSubpagina('lista')}>
          Volver
        </Button>
        <Button disabled={banco.selectedCount === 0} onClick={agregarDelBanco}>
          Añadir {banco.selectedCount > 0 ? `(${banco.selectedCount})` : ''}
        </Button>
      </>
    ) : fase === 'destinatarios' ? (
      <>
        {pendienteDeRepartir ? (
          <Button variant="outline" onClick={() => setSubpagina('conflicto')}>
            Repartir el peso
          </Button>
        ) : null}
        <Button variant="outline" onClick={pedirCerrar}>
          Cancelar
        </Button>
        <Button disabled={elegidos.length === 0 || lleno} onClick={continuar}>
          Continuar
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </Button>
      </>
    ) : (
      <>
        {/* Volver solo si se llegó eligiendo destinatarios; desde la fila de un grupo o persona el panel abre aquí. */}
        {pedido.fase === 'destinatarios' && !iaAbierta ? (
          <Button variant="outline" onClick={() => setFase('destinatarios')}>
            <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
            Volver
          </Button>
        ) : (
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
        )}
        {set.objectives.length > 1 ? (
          <Button variant="outline" onClick={() => setPesos(true)}>
            Ajustar pesos
          </Button>
        ) : null}
        <Button onClick={guardar}>{inicial ? 'Guardar cambios' : 'Guardar asignación'}</Button>
      </>
    )

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(abrir) => (abrir ? undefined : pedirCerrar())}
      // Con el agente acoplado el panel queda junto a él en vez de taparlo (posición, no apariencia) y, para caber, se angosta.
      // Tocar fuera nunca lo cierra: con algo escrito se perdería sin querer.
      modal={!agenteAbierto}
      disablePointerDismissal
      style={agenteAbierto ? { right: ANCHO_AGENTE } : undefined}
      size="lg"
      // El banco es una página del mismo panel: su título, y los filtros fijos bajo la cabecera como en el drawer del banco.
      headerExtra={
        subpagina === 'banco' ? (
          <div className="border-b px-5 py-3">
            <FiltrosBanco banco={banco} />
          </div>
        ) : undefined
      }
      title={subpagina === 'banco' ? 'Banco de objetivos' : fase === 'destinatarios' ? `${inicial ? 'Editar' : 'Nueva'} asignación ${grupal ? 'grupal' : 'individual'}` : `Objetivos de ${titular}`}
      description={
        subpagina === 'banco'
          ? 'Marca los que quieras añadir.'
          : fase === 'destinatarios'
          ? grupal
            ? 'Elige los grupos que lo recibirán.'
            : 'Elige quiénes lo recibirán.'
          : cupo === TOTAL_WEIGHT
            ? `Entre todos deben sumar ${TOTAL_WEIGHT} %.`
            : `Esta asignación reparte el ${cupo} % del ciclo.`
      }
      footer={
        <>
          <Text as="span" size="sm" variant="muted" className="mr-auto min-w-0">
            {pista}
          </Text>
          {pie}
        </>
      }
    >
      {subpagina === 'conflicto' ? (
        <VistaConflicto control={reparto} afectadas={cargasConEsta.length} onVolver={() => setSubpagina('lista')} onSacar={sacar} />
      ) : fase === 'destinatarios' ? (
        <FaseDestinatarios
          grupal={grupal}
          plantilla={pedido.intencion === 'plantilla'}
          aviso={aviso}
          sincronizar={sincronizar}
          onSincronizar={onSincronizar}
          segmentBy={segmentBy}
          onSegmentBy={(valor) => {
            if (valor === segmentBy) return
            onSegmentBy(valor)
            setSet((actual) => ({ ...actual, targetIds: [] }))
          }}
          elegidos={elegidos}
          onElegidos={(targetIds) => setSet((actual) => ({ ...actual, targetIds }))}
          tomados={tomados}
          personas={personas}
        />
      ) : subpagina === 'banco' ? (
        <ListaBanco banco={banco} />
      ) : (
        <FaseObjetivos
          set={set}
          total={total}
          cupo={cupo}
          onRepartir={() => setSet((actual) => distributeSetWeights([actual], actual.id)[0])}
          onRecuperar={cargas.length === 0 && cupo < TOTAL_WEIGHT ? () => setSet((actual) => conCupo(actual, TOTAL_WEIGHT)) : undefined}
          aviso={aviso}
          iaAbierta={iaAbierta}
          sinIa={agenteAbierto}
          onElegir={elegir}
        >
          <ListaObjetivos
            objetivos={set.objectives}
            variante="asignado"
            modelo={modelo}
            reglas={reglas}
            conErrores={conErrores}
            // En individuales también se puede colgar de otro objetivo del mismo set («Del ciclo»).
            alineables={(objetivo) => ({ empresa, ciclo: grupal ? undefined : set.objectives.filter((otro) => otro.id !== objetivo.id) })}
            alineacionRequerida={requiereAlineacion}
            cupo={cupo}
            alcance={alcanceBanco}
            // La IA de cada tarjeta rellena en cascada: cada cambio va sobre el set más reciente, no el de este render.
            onCambio={(id, cambio) => setSet((actual) => ({ ...actual, objectives: actual.objectives.map((objetivo) => (objetivo.id === id ? { ...objetivo, ...cambio } : objetivo)) }))}
            onEliminar={(id) => setSet((actual) => ({ ...actual, objectives: actual.objectives.filter((objetivo) => objetivo.id !== id) }))}
            abierta={abierta}
            onAbierta={setAbierta}
            contextoIa={{ nombreCiclo }}
            resaltados={propuesta}
          />
        </FaseObjetivos>
      )}

      <DialogoPesos
        abierto={pesos}
        onAbiertoChange={setPesos}
        grupos={[weightBalanceGroup(set, cupo)]}
        titulo="Ajustar los pesos de esta asignación"
        descripcion={`Reparte el ${cupo} % entre los objetivos sin entrar uno por uno.`}
        onAplicar={(resultado) => {
          const nuevos = resultado[set.id]
          if (nuevos) setSet((actual) => ({ ...actual, objectives: actual.objectives.map((objetivo) => (objetivo.id in nuevos ? { ...objetivo, weight: nuevos[objetivo.id] } : objetivo)) }))
        }}
      />

      {/* Salir con lo escrito, como «¿Salir de la creación?» de Crear contenido (14-oct): dos botones. Si la asignación se
          puede guardar, salir la guarda; si está incompleta, se avisa que se pierde. */}
      <DialogoConfirmar
        abierto={preguntando}
        onAbiertoChange={setPreguntando}
        icono={Logout01Icon}
        titulo={inicial ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          sePuedeGuardar
            ? `La asignación de «${titular}» queda guardada con lo que llevas. Puedes seguir editándola desde la lista.`
            : `La asignación de «${titular}» todavía está incompleta y no se puede guardar. Si sales ahora, se pierde lo que llevas.`
        }
        cancelar="Seguir aquí"
        accion={inicial ? 'Salir de la edición' : 'Salir de la creación'}
        destructiva={!sePuedeGuardar}
        onConfirmar={() => {
          setPreguntando(false)
          if (sePuedeGuardar) cerrarCon(set)
          else onCerrar()
        }}
      />
    </DrawerShell>
  )
}
