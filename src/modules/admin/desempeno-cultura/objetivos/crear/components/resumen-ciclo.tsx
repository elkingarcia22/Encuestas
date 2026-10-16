import type { ReactNode } from 'react'
import { Badge } from '@ubits/flux-ui'
import { plural } from '@/modules/design-system/patrones/formato'
import { AvanceObligatorios, Aviso, BloqueResumen, ItemEstado, Lista, ListaDatos, TarjetaResumen } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { formatCount, participantsGroupBreakdown, totalParticipantCount } from '../../../encuestas/modelo/participants'
import { formatSurveyDate } from '../../../encuestas/modelo/surveyListDates'
import { CICLO_PERIOD_LABELS, REMINDER_FREQUENCY_LABELS, isObjectiveComplete, isObjectiveSetComplete, setsOfKind, type CicloDraft } from '../../modelo/constructor/cicloBuilderTypes'
import { parseISODate } from '../../modelo/constructor/cicloDates'
import { GOVERNANCE_META, ASSIGNMENT_LEVEL_META, assignmentLevelOf } from '../../modelo/constructor/cicloSetup'
import { OBJECTIVE_MODEL_META } from '../../modelo/constructor/objectiveModel'
import { alignmentCounts, objectiveSetsReach } from '../../modelo/constructor/objectiveSets'
import { etiquetaFinal, faltaEn, pasoDe, type EstadoDelBorrador, type PasoId } from './pasos'

// «Así va el ciclo»: el panel de apoyo a la derecha, siempre a la vista, con las mismas piezas que «Así va la encuesta»
// y «Así va la vacante». Reúne lo que en el prototipo vivía en la tarjeta «Resumen del ciclo» de la barra flotante. El
// nombre, el modelo y las fechas quedan arriba como contexto; el cuerpo cuenta solo lo del paso en el que se está, y el
// último paso del recorrido junta el recuento de todo el ciclo antes de finalizar o lanzar.

type Props = { borrador: CicloDraft; paso: PasoId; estado: EstadoDelBorrador; guardado?: ReactNode }

const fecha = (iso: string) => {
  const valor = parseISODate(iso)
  return valor ? formatSurveyDate(valor) : ''
}

export function ResumenCiclo({ borrador, paso, estado, guardado }: Props) {
  const fechas = [fecha(borrador.startDate), fecha(borrador.endDate)].filter(Boolean).join(' – ')
  const ultimo = estado.orden[estado.orden.length - 1] === paso
  const modelo = borrador.objectiveModel ? OBJECTIVE_MODEL_META[borrador.objectiveModel] : null

  return (
    <TarjetaResumen
      kicker="Así va el ciclo"
      estado={guardado}
      descripcion={ultimo ? borrador.description.trim() : undefined}
      nombre={borrador.name.trim()}
      sinNombre="Sin nombre todavía"
      insignias={
        modelo ? (
          <Badge variant="secondary" size="xs">
            {borrador.objectiveModel === 'custom' ? 'Modelo personalizado' : modelo.label}
          </Badge>
        ) : null
      }
      contexto={paso !== 'general' && fechas ? fechas : undefined}
    >
      {ultimo && paso !== 'general' ? (
        <FocoRevision borrador={borrador} estado={estado} />
      ) : paso === 'general' ? (
        <FocoGeneral borrador={borrador} />
      ) : paso === 'participants' ? (
        <FocoParticipantes borrador={borrador} />
      ) : paso === 'company' ? (
        <FocoEmpresa borrador={borrador} estado={estado} />
      ) : paso === 'objectives' ? (
        <FocoAsignados borrador={borrador} estado={estado} />
      ) : (
        <FocoAlineacion borrador={borrador} estado={estado} />
      )}
    </TarjetaResumen>
  )
}

// Parametrización: lo obligatorio que falta y, debajo, lo que ya se decidió.
function FocoGeneral({ borrador }: { borrador: CicloDraft }) {
  const obligatorios: [string, boolean][] = [
    ['Nombre del ciclo', borrador.name.trim() !== ''],
    ['Duración', borrador.period !== null],
    ['Fechas del ciclo', borrador.startDate !== '' && borrador.endDate !== '' && borrador.endDate >= borrador.startDate],
    ['Modelo de medición', borrador.objectiveModel !== null],
    ['Quién redacta los objetivos', borrador.objectiveCreator !== null],
  ]
  const falta = obligatorios.filter(([, listo]) => !listo).map(([campo]) => campo)
  const filas = [
    { termino: 'Duración', valor: borrador.period ? CICLO_PERIOD_LABELS[borrador.period] : '' },
    { termino: 'Inicia', valor: fecha(borrador.startDate) },
    { termino: 'Cierra', valor: fecha(borrador.endDate) },
    { termino: 'Modelo', valor: borrador.objectiveModel ? (borrador.objectiveModel === 'custom' ? 'Personalizado' : OBJECTIVE_MODEL_META[borrador.objectiveModel].label) : '' },
    { termino: 'Objetivos de la empresa', valor: borrador.objectiveModel ? (borrador.useCompanyObjectives && borrador.modelRules.companyObjectives !== 'off' ? 'Sí' : 'No') : '' },
    { termino: 'Recordatorios', valor: borrador.objectiveModel ? (borrador.remindersEnabled ? REMINDER_FREQUENCY_LABELS[borrador.reminderFrequency] : 'No') : '' },
    { termino: 'Redacta', valor: borrador.objectiveCreator ? GOVERNANCE_META[borrador.objectiveCreator].label : '' },
    { termino: 'Reparto', valor: borrador.objectiveCreator === 'hr' && assignmentLevelOf(borrador) ? ASSIGNMENT_LEVEL_META[assignmentLevelOf(borrador)!].label : '' },
  ].filter((fila) => fila.valor)

  return (
    <>
      {falta.length ? <AvanceObligatorios falta={falta} total={obligatorios.length} /> : null}
      {filas.length ? (
        <BloqueResumen>
          <ListaDatos filas={filas} />
        </BloqueResumen>
      ) : null}
      {falta.length ? null : <AvanceObligatorios falta={falta} total={obligatorios.length} />}
    </>
  )
}

// Participantes: a cuántos llega y de dónde sale cada parte, como en Encuestas.
function FocoParticipantes({ borrador }: { borrador: CicloDraft }) {
  const { participants } = borrador
  const total = totalParticipantCount(participants)
  const { groups, outsideCount, excludedCount, importedCount } = participantsGroupBreakdown(participants)
  const filas = [
    { termino: 'Quiénes entran', valor: participants.mode === 'company' ? 'Toda la empresa' : 'Una parte de la empresa' },
    ...groups.map((grupo) => ({ termino: grupo.label, valor: formatCount(grupo.count) })),
    { termino: 'Excluidas de los grupos', valor: excludedCount ? formatCount(excludedCount) : '' },
    { termino: 'Elegidas a mano', valor: outsideCount ? formatCount(outsideCount) : '' },
    { termino: participants.importedFileName ?? 'Importadas', valor: importedCount ? formatCount(importedCount) : '' },
  ].filter((fila) => fila.valor)

  return (
    <>
      {total === 0 ? <Aviso tono="warning">Selecciona al menos un participante.</Aviso> : null}
      <BloqueResumen>
        <ListaDatos filas={filas} />
      </BloqueResumen>
      {total === 0 ? null : <Aviso tono="success">{`${formatCount(total)} ${plural(total, 'persona entra', 'personas entran')} al ciclo.`}</Aviso>}
    </>
  )
}

// Objetivos de la empresa: cada uno con su estado.
function FocoEmpresa({ borrador, estado }: { borrador: CicloDraft; estado: EstadoDelBorrador }) {
  const falta = faltaEn('company', estado)
  return (
    <>
      {falta ? <Aviso tono="warning">{`${falta}.`}</Aviso> : null}
      {borrador.companyObjectives.length ? (
        <div className="flex flex-col gap-2.5">
          {borrador.companyObjectives.map((objetivo, indice) => (
            <ItemEstado key={objetivo.id} titulo={`${indice + 1}. ${objetivo.title.trim() || 'Objetivo sin título'}`} completa={isObjectiveComplete(objetivo, { requireWeight: false })} hecho="Listo" pendiente="Por completar" />
          ))}
        </div>
      ) : null}
      {falta ? null : <Aviso tono="success">{`${borrador.companyObjectives.length} ${plural(borrador.companyObjectives.length, 'objetivo de la empresa listo', 'objetivos de la empresa listos')}.`}</Aviso>}
    </>
  )
}

/** El recuento de lo asignado: el de la tarjeta «Resumen del ciclo» del prototipo. */
function datosAsignados(borrador: CicloDraft) {
  const grupales = setsOfKind(borrador.objectiveSets, 'grupal')
  const individuales = setsOfKind(borrador.objectiveSets, 'individual')
  const objetivosDe = (sets: typeof grupales) => sets.reduce((suma, set) => suma + set.objectives.length, 0)
  const { aligned, unaligned } = alignmentCounts(borrador.objectiveSets)
  const listas = borrador.objectiveSets.filter(isObjectiveSetComplete).length
  return [
    { termino: 'Objetivos de la empresa', valor: borrador.useCompanyObjectives ? formatCount(borrador.companyObjectives.length) : '' },
    { termino: 'Objetivos en grupo', valor: borrador.useGroupObjectives ? formatCount(objetivosDe(grupales)) : '' },
    { termino: 'Objetivos individuales', valor: borrador.useIndividualObjectives ? formatCount(objetivosDe(individuales)) : '' },
    { termino: 'Asignaciones listas', valor: borrador.objectiveSets.length ? `${listas} / ${borrador.objectiveSets.length}` : '' },
    { termino: 'Personas con objetivos', valor: borrador.objectiveSets.length ? formatCount(objectiveSetsReach(borrador.objectiveSets, borrador.assignment.groupSegmentBy)) : '' },
    { termino: 'Objetivos alineados', valor: borrador.useCompanyObjectives && aligned + unaligned > 0 ? formatCount(aligned) : '' },
    { termino: 'Objetivos sin alineación', valor: borrador.useCompanyObjectives && unaligned > 0 ? formatCount(unaligned) : '' },
  ].filter((fila) => fila.valor)
}

function FocoAsignados({ borrador, estado }: { borrador: CicloDraft; estado: EstadoDelBorrador }) {
  const falta = faltaEn('objectives', estado)
  const filas = datosAsignados(borrador)
  return (
    <>
      {falta ? <Aviso tono="warning">{`${falta}.`}</Aviso> : null}
      {filas.length ? (
        <BloqueResumen>
          <ListaDatos filas={filas} />
        </BloqueResumen>
      ) : null}
      {falta ? null : <Aviso tono="success">Todas las asignaciones están listas.</Aviso>}
    </>
  )
}

function FocoAlineacion({ borrador, estado }: { borrador: CicloDraft; estado: EstadoDelBorrador }) {
  const falta = faltaEn('alignment', estado)
  const { aligned, unaligned } = alignmentCounts(borrador.objectiveSets)
  return (
    <>
      {falta ? <Aviso tono="warning">{`${falta}.`}</Aviso> : null}
      <BloqueResumen>
        <ListaDatos
          filas={[
            { termino: 'Objetivos alineados', valor: formatCount(aligned) },
            { termino: 'Sin alineación', valor: formatCount(unaligned) },
          ]}
        />
      </BloqueResumen>
      {falta ? null : <Aviso tono="success">{unaligned === 0 ? 'Todo lo asignado cuelga de la empresa.' : 'Alinear es opcional en este modelo.'}</Aviso>}
    </>
  )
}

// El último paso del recorrido: qué falta para terminar y el recuento de todo el ciclo.
function FocoRevision({ borrador, estado }: { borrador: CicloDraft; estado: EstadoDelBorrador }) {
  const pendientes = estado.orden.filter((paso) => faltaEn(paso, estado) !== null).map((paso) => pasoDe(paso).titulo)
  const filas = [
    { termino: 'Participantes', valor: borrador.objectiveCreator !== 'hr' ? formatCount(totalParticipantCount(borrador.participants)) : '' },
    ...datosAsignados(borrador),
  ].filter((fila) => fila.valor)
  const final = etiquetaFinal(borrador)
  return (
    <>
      {pendientes.length ? (
        <div className="flex flex-col gap-2">
          <Aviso tono="warning">{plural(pendientes.length, 'Falta completar un paso', `Faltan completar ${pendientes.length} pasos`)}</Aviso>
          <Lista items={pendientes} />
        </div>
      ) : null}
      {filas.length ? (
        <BloqueResumen>
          <ListaDatos filas={filas} />
        </BloqueResumen>
      ) : null}
      {pendientes.length ? null : <Aviso tono="success">{final === 'Finalizar' ? 'Listo para finalizar.' : 'Listo para lanzar el ciclo.'}</Aviso>}
    </>
  )
}
