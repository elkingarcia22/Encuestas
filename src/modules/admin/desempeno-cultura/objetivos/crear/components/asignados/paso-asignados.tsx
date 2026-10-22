import { useState, type JSX } from 'react'
import { Settings02Icon } from '@hugeicons/core-free-icons'
import { Accordion } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { EncabezadoPaso } from '../../../../encuestas/components/pasos-drawer'
import { type CicloBuilderAssignmentSeed, type CicloDraft, type ObjectiveSet, type ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import type { PedidoIa } from '../ia/pedido'
import { NivelAsignaciones } from './nivel-asignaciones'
import type { PedidoPanel } from './creacion/usar-creacion'
import type { IntencionAsignacion } from './piezas-asignacion'

// Paso · Objetivos asignados: repartir los objetivos por grupo, por persona o de las dos formas, según el nivel que se
// decidió en la parametrización (aquí no se vuelve a preguntar: «Cambiar» lleva al bloque Gobierno). Mismo armado que
// los demás pasos del constructor: el encabezado con el nivel y «Cambiar» a la derecha y, cuando el ciclo es mixto,
// las pestañas «Por grupos» / «Por colaborador» como las del home, cada una con lo que ya reparte. Lo de cada nivel
// —avisos, vistas, selección y el panel donde se crea una asignación— vive en `NivelAsignaciones`.
//
// Una plantilla deja objetivos sin destinatario: al llegar a la pestaña de su tipo se abre una sola vez el panel de
// destinatarios con esos objetivos puestos; si se cancela, queda el aviso para retomarlo. Guardar esa asignación la
// resuelve.

type Cambio = Partial<CicloDraft> | ((actual: CicloDraft) => Partial<CicloDraft>)


export function PasoAsignados({
  borrador,
  onCambio,
  conErrores,
  semillas,
  onSemillaResuelta,
  onCambiarNivel,
  onCrearConIa,
  agenteAbierto,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Cambio) => void
  conErrores: boolean
  /** Objetivos de plantilla sin destinatario (grupal / individual). */
  semillas: readonly CicloBuilderAssignmentSeed[]
  /** Guardar la asignación que trae los objetivos de una semilla la resuelve. */
  onSemillaResuelta: (tipo: ObjectiveSetKind) => void
  /** Pestaña con la que abrir (desde «Añadir objetivos a grupos/colaborador» en la lista). */
  /** «Cambiar» en la cabecera: vuelve a la parametrización (bloque Gobierno). */
  onCambiarNivel: () => void
  /** Abre el agente de IA acoplado con un pedido. */
  onCrearConIa: (pedido: PedidoIa) => void
  /** El agente está acoplado: no se abre otro. */
  agenteAbierto: boolean
}): JSX.Element {
  const grupos = borrador.useGroupObjectives
  const individual = borrador.useIndividualObjectives
  const mixto = grupos && individual
  const [pedidoG, setPedidoG] = useState<PedidoPanel | null>(null)
  const [pedidoI, setPedidoI] = useState<PedidoPanel | null>(null)
  const [ofrecidas, setOfrecidas] = useState<ReadonlySet<ObjectiveSetKind>>(() => new Set())
  // Arranca abierto el primer nivel del ciclo, como Participantes abre el que ya trae algo.
  const [abiertos, setAbiertos] = useState<string[]>(() => [grupos ? 'grupal' : 'individual'])
  // Una creación pedida en un nivel cerrado lo abre: «En la fila» se dibuja dentro de su sección.
  const asegurarAbierto = (nivel: 'grupal' | 'individual') => setAbiertos((previos) => (previos.includes(nivel) ? previos : [...previos, nivel]))
  const pedirG = (pedido: PedidoPanel | null) => {
    setPedidoG(pedido)
    if (pedido) asegurarAbierto('grupal')
  }
  const pedirI = (pedido: PedidoPanel | null) => {
    setPedidoI(pedido)
    if (pedido) asegurarAbierto('individual')
  }

  const semillaDe = (kind: ObjectiveSetKind) => semillas.find((semilla) => semilla.kind === kind && semilla.objectives.length > 0) ?? null
  const pedidoDeSemilla = (kind: ObjectiveSetKind): PedidoPanel | null => {
    const semilla = semillaDe(kind)
    return semilla ? { setId: null, fase: 'destinatarios', intencion: 'plantilla', objetivosPlantilla: semilla.objectives } : null
  }

  const nivelActivo = grupos || individual
  if (grupos && pedidoG === null && !ofrecidas.has('grupal') && semillaDe('grupal')) {
    setOfrecidas(new Set([...ofrecidas, 'grupal']))
    pedirG(pedidoDeSemilla('grupal'))
  }
  if (individual && pedidoI === null && !ofrecidas.has('individual') && semillaDe('individual')) {
    setOfrecidas(new Set([...ofrecidas, 'individual']))
    pedirI(pedidoDeSemilla('individual'))
  }

  const onSets = (cambio: (actual: readonly ObjectiveSet[]) => readonly ObjectiveSet[]) => onCambio((actual) => ({ objectiveSets: cambio(actual.objectiveSets) }))
  const guardado = (set: ObjectiveSet, intencion: IntencionAsignacion) => {
    onSets((actual) => (actual.some((otro) => otro.id === set.id) ? actual.map((otro) => (otro.id === set.id ? set : otro)) : [...actual, set]))
    if (intencion === 'plantilla') onSemillaResuelta(set.kind)
  }

  const titulo = mixto ? 'Objetivos asignados' : grupos ? 'Objetivos por grupos' : 'Objetivos por colaborador'

  if (!nivelActivo) {
    return (
      <section className="flex flex-col gap-4" aria-label="Objetivos asignados">
        <EncabezadoPaso titulo="Objetivos asignados" descripcion="Este ciclo todavía no reparte objetivos a grupos ni a personas." />
        <PrimeraVez
          icono="glass-setting"
          titulo="Elige cómo se reparten los objetivos"
          descripcion="El nivel —por grupos, por persona o los dos— se decide en la parametrización, en el bloque Gobierno."
          accion={{ texto: 'Ir a la parametrización', icono: Settings02Icon, onClick: onCambiarNivel }}
          className="border"
        />
      </section>
    )
  }

  // Cada nivel trae su propia tabla con marco y título («Objetivos por grupos» / «Objetivos por colaborador»): aquí no
  // se envuelve en otro marco, que dejaba un borde dentro de otro.
  const renderNivel = (tipoNivel: ObjectiveSetKind) => {
    const isGrupos = tipoNivel === 'grupal'
    return (
      <NivelAsignaciones
        key={tipoNivel}
        tipo={tipoNivel}
        borrador={borrador}
        onSets={onSets}
        onAsignacion={(cambio) => onCambio((actual) => ({ assignment: { ...actual.assignment, ...cambio } }))}
        conErrores={conErrores}
        semilla={semillaDe(tipoNivel)?.objectives ?? null}
        onElegirSemilla={() => (isGrupos ? pedirG(pedidoDeSemilla('grupal')) : pedirI(pedidoDeSemilla('individual')))}
        pedido={isGrupos ? pedidoG : pedidoI}
        onPedido={isGrupos ? pedirG : pedirI}
        onGuardado={guardado}
        onCrearConIa={onCrearConIa}
        agenteAbierto={agenteAbierto}
      />
    )
  }

  // Los niveles como los acordeones de Participantes: se abren y se cierran solos, sin perder lo repartido.
  return (
    <section className="flex flex-col gap-4" aria-label={titulo}>
      <Accordion value={abiertos} onValueChange={(valor) => setAbiertos(valor as string[])} className="gap-4">
        {grupos && renderNivel('grupal')}
        {individual && renderNivel('individual')}
      </Accordion>
    </section>
  )
}
