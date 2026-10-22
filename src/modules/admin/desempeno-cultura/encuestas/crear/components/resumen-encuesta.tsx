import type { ReactNode } from 'react'
import { Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import {
  AvanceObligatorios,
  Aviso,
  BloqueResumen,
  ItemEstado,
  Lista,
  ListaDatos,
  TarjetaResumen,
} from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { isDemographicComplete } from '../../modelo/demographics'
import { LIMITE_NOMBRE_ENCUESTA, largoDe } from '../../modelo/limites-texto'
import { formatCount, participantsGroupBreakdown, totalParticipantCount } from '../../modelo/participants'
import { countQuestions, flattenSections } from '../../modelo/sectionTree'
import { REQUIRED_STEPS, type StepperStatusInput } from '../../modelo/stepper'
import { estimatedMinutesOf } from '../../modelo/previewModel'
import { SURVEY_KIND_LABELS, type SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { PASOS, indiceDe, pasoCompleto, seccionLlena, type PasoId } from './pasos'
import { TiempoEstimado } from './tiempo-estimado'

type Props = { borrador: SurveyDraft; paso: PasoId; estado: StepperStatusInput; guardado?: ReactNode; onCambio?: (cambio: Partial<SurveyDraft>) => void }

// «aaaa-mm-dd» → «9 sep 2026», sin cero delante: la forma única de fechas del sistema (fechaCorta, decisión 19).
const fecha = (valor: string) => (valor ? fechaCorta(valor) : '')

const tiempoEstimado = (borrador: SurveyDraft) => {
  const minutos = estimatedMinutesOf(borrador)
  return minutos === 0 ? '—' : `${minutos} min`
}

// Panel de apoyo de los cinco pasos, a la derecha y siempre a la vista: el mismo «Así va…» de «Crear
// vacante». El nombre, el tipo y —desde el paso 2— las fechas y a cuántos llega se quedan arriba como
// contexto; el cuerpo cambia de un paso a otro y cuenta solo lo de ese paso. En el último, que es la
// revisión antes de finalizar, junta el recuento de toda la encuesta.
export function ResumenEncuesta({ borrador, paso, estado, guardado, onCambio }: Props) {
  const fechas = [fecha(borrador.startDate), fecha(borrador.endDate)].filter(Boolean).join(' – ')
  const total = totalParticipantCount(borrador.participants)
  // Cada dato en su renglón: las fechas por un lado y, desde el paso 3, a cuántas personas llega por otro.
  const contexto = [fechas, indiceDe(paso) > indiceDe('participants') && total > 0 ? `${formatCount(total)} ${plural(total, 'participante', 'participantes')}` : ''].filter(Boolean)

  return (
    <TarjetaResumen
      kicker="Así va la encuesta"
      estado={guardado}
      // En la revisión final, la descripción que se escribió en el paso 1 va debajo del nombre.
      descripcion={paso === 'pages' ? borrador.description.trim() : undefined}
      nombre={borrador.name.trim()}
      sinNombre="Sin nombre todavía"
      insignias={
        borrador.kind ? (
          <Badge variant="secondary" size="xs">
            {SURVEY_KIND_LABELS[borrador.kind]}
          </Badge>
        ) : null
      }
      contexto={paso !== 'general' ? contexto : undefined}
    >
      {paso === 'general' ? (
        <FocoGeneral borrador={borrador} />
      ) : paso === 'participants' ? (
        <FocoParticipantes borrador={borrador} />
      ) : paso === 'demographics' ? (
        <FocoDemograficos borrador={borrador} />
      ) : paso === 'sections' ? (
        <FocoSecciones borrador={borrador} estado={estado} onCambio={onCambio} />
      ) : (
        <FocoRevision borrador={borrador} estado={estado} />
      )}
    </TarjetaResumen>
  )
}

// Paso 1: lo obligatorio que falta y, debajo, lo que ya se eligió.
function FocoGeneral({ borrador }: { borrador: SurveyDraft }) {
  const obligatorios: [string, boolean][] = [
    ['Nombre de la encuesta', largoDe(borrador.name) >= LIMITE_NOMBRE_ENCUESTA.min],
    ['Tipo de encuesta', borrador.kind !== null],
    ['Fecha de inicio', borrador.startDate !== ''],
    ['Fecha de cierre', borrador.endDate !== ''],
  ]
  const falta = obligatorios.filter(([, listo]) => !listo).map(([campo]) => campo)
  const filas = [
    { termino: 'Tipo', valor: borrador.kind ? SURVEY_KIND_LABELS[borrador.kind] : '' },
    { termino: 'Inicia', valor: fecha(borrador.startDate) },
    { termino: 'Cierra', valor: fecha(borrador.endDate) },
    {
      termino: 'Visibilidad',
      valor: borrador.visibility === 'anonymous' ? `Anónima · desde ${borrador.anonymityThreshold} respuestas` : 'Pública',
    },
    { termino: 'Descripción', valor: borrador.description.trim() ? 'Escrita' : '' },
  ].filter((fila) => fila.valor)

  return (
    <>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final, debajo de lo elegido. */}
      {falta.length ? <AvanceObligatorios falta={falta} total={obligatorios.length} /> : null}
      <BloqueResumen>
        <ListaDatos filas={filas} />
      </BloqueResumen>
      {falta.length ? null : <AvanceObligatorios falta={falta} total={obligatorios.length} />}
    </>
  )
}

// Paso 2: a cuántos llega y de dónde sale cada parte.
function FocoParticipantes({ borrador }: { borrador: SurveyDraft }) {
  const { participants } = borrador
  const total = totalParticipantCount(participants)
  const { groups, outsideCount, excludedCount, importedCount } = participantsGroupBreakdown(participants)
  const filas = [
    { termino: 'A quién llega', valor: participants.mode === 'company' ? 'Toda la empresa' : 'Una parte de la empresa' },
    ...groups.map((grupo) => ({ termino: grupo.label, valor: formatCount(grupo.count) })),
    { termino: 'Excluidas de los grupos', valor: excludedCount ? formatCount(excludedCount) : '' },
    { termino: 'Elegidos a mano', valor: outsideCount ? formatCount(outsideCount) : '' },
    { termino: participants.importedFileName ?? 'Importados', valor: importedCount ? formatCount(importedCount) : '' },
  ].filter((fila) => fila.valor)

  return (
    <>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final, debajo de lo elegido. */}
      {total === 0 ? <Aviso tono="warning">Selecciona al menos un participante.</Aviso> : null}
      <BloqueResumen>
        <ListaDatos filas={filas} />
      </BloqueResumen>
      {total === 0 ? null : <Aviso tono="success">{`${formatCount(total)} ${plural(total, 'persona recibirá', 'personas recibirán')} la encuesta.`}</Aviso>}
    </>
  )
}

// Los contenedores del paso 3, en el mismo orden y con los mismos nombres que en el paso.
const ORIGENES = [
  { origen: 'custom', termino: 'Solo para esta encuesta' },
  { origen: 'library', termino: 'Creados en el módulo' },
  { origen: 'import', termino: 'Usuarios nuevos' },
  { origen: 'system', termino: 'Precargados del sistema' },
] as const

// Paso 3: cuántos datos lleva cada contenedor.
function FocoDemograficos({ borrador }: { borrador: SurveyDraft }) {
  const { enabled, fields } = borrador.demographics
  if (!enabled) {
    return (
      <div className="flex flex-col gap-2">
        <Aviso tono="success">No se usan datos demográficos.</Aviso>
        <Text variant="muted" size="sm">
          Los resultados no se podrán ver por área, sede u otros grupos.
        </Text>
      </div>
    )
  }

  const incompletos = fields.filter((campo) => !isDemographicComplete(campo)).length
  // Un renglón por contenedor, con los mismos nombres del paso, en vez de uno por dato: con siete precargados la lista
  // se hacía larga. Cada uno cuenta cuántos datos lleva y, si alguno solo sirve para filtrar, cuántos.
  const filas = ORIGENES.map(({ origen, termino }) => {
    const delOrigen = fields.filter((campo) => campo.source === origen)
    const sinEdicion = delOrigen.filter((campo) => !campo.visible).length
    const etiquetaSinEdicion = sinEdicion === delOrigen.length ? 'no permiten edición' : `${sinEdicion} ${plural(sinEdicion, 'no permite edición', 'no permiten edición')}`
    const cuenta = `${delOrigen.length}${sinEdicion ? ` · ${etiquetaSinEdicion}` : ''}`
    return { termino, valor: delOrigen.length ? cuenta : '' }
  }).filter((fila) => fila.valor)

  return (
    <>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final, debajo de lo elegido. */}
      {fields.length === 0 ? (
        <Aviso tono="warning">Activa o crea al menos un dato demográfico.</Aviso>
      ) : incompletos ? (
        <Aviso tono="warning">{plural(incompletos, 'Falta completar un dato', `Faltan completar ${incompletos} datos`)}</Aviso>
      ) : null}
      <BloqueResumen>
        <ListaDatos filas={filas} />
      </BloqueResumen>
      {fields.length > 0 && !incompletos ? <Aviso tono="success">{`${fields.length} ${plural(fields.length, 'dato demográfico activo', 'datos demográficos activos')}.`}</Aviso> : null}
    </>
  )
}

// Paso 4: cada sección con cuántas preguntas lleva, y el tiempo que tomará responder.
function FocoSecciones({ borrador, estado, onCambio }: { borrador: SurveyDraft; estado: StepperStatusInput; onCambio?: (cambio: Partial<SurveyDraft>) => void }) {
  const secciones = borrador.sections
  const entradas = flattenSections(secciones)
  const preguntas = countQuestions(secciones)
  const aviso = !estado.hasSectionWithQuestion
    ? 'Agrega al menos una sección con preguntas.'
    : !estado.allSectionsHaveQuestions
      ? 'Hay secciones sin preguntas.'
      : !estado.allQuestionsComplete
        ? 'Hay preguntas con campos por completar.'
        : null

  return (
    <>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final, debajo de lo elegido. */}
      {aviso ? <Aviso tono="warning">{aviso}</Aviso> : null}
      {/* Cada sección y cada subsección en su propio renglón, con su número («2», «2.1») y las subsecciones sangradas bajo
          la sección a la que pertenecen. */}
      <div className="flex flex-col gap-2.5">
        {entradas.map(({ section, depth, numbering }) => {
          const cuantas = countQuestions([section])
          return (
            <div key={section.id} style={{ paddingInlineStart: `${(depth - 1) * 1}rem` }}>
              <ItemEstado
                titulo={`${numbering}. ${section.title.trim() || (depth === 1 ? 'Sección sin nombre' : 'Subsección sin nombre')}`}
                completa={seccionLlena(section)}
                hecho={`${cuantas} ${plural(cuantas, 'pregunta', 'preguntas')}`}
                pendiente="Sin preguntas"
              />
            </div>
          )
        })}
      </div>
      <BloqueResumen>
        <ListaDatos
          filas={[
            { termino: 'Secciones', valor: formatCount(entradas.filter((entrada) => entrada.depth === 1).length) },
            { termino: 'Subsecciones', valor: formatCount(entradas.filter((entrada) => entrada.depth > 1).length) },
            { termino: 'Preguntas', valor: formatCount(preguntas) },
            ...(onCambio ? [] : [{ termino: 'Tiempo estimado', valor: tiempoEstimado(borrador) }]),
          ]}
        />
        {/* Editable: la cifra sugerida se puede cambiar por la que el autor sabe que toma. */}
        {onCambio ? (
          <div className="mt-2.5">
            <TiempoEstimado borrador={borrador} onCambio={onCambio} />
          </div>
        ) : null}
      </BloqueResumen>
      {aviso ? null : <Aviso tono="success">Todas las secciones tienen sus preguntas.</Aviso>}
    </>
  )
}

// Paso 5, la revisión: qué falta para finalizar, las dos páginas opcionales y el recuento de toda la encuesta.
function FocoRevision({ borrador, estado }: { borrador: SurveyDraft; estado: StepperStatusInput }) {
  const pendientes = REQUIRED_STEPS.filter((paso) => !pasoCompleto(paso, estado)).map((paso) => PASOS[indiceDe(paso)].titulo)
  const preguntas = countQuestions(borrador.sections)

  return (
    <>
      {pendientes.length ? (
        <div className="flex flex-col gap-2">
          <Aviso tono="warning">{plural(pendientes.length, 'Falta completar un paso', `Faltan completar ${pendientes.length} pasos`)}</Aviso>
          <Lista items={pendientes} />
        </div>
      ) : null}
      <div className="flex flex-col gap-2.5">
        <ItemEstado titulo="Página de bienvenida" completa={borrador.welcomeEnabled} hecho="Activa" pendiente="Apagada" />
        <ItemEstado titulo="Página de cierre" completa={borrador.closingEnabled} hecho="Activa" pendiente="Apagada" />
      </div>
      <BloqueResumen>
        <ListaDatos
          filas={[
            { termino: 'Participantes', valor: formatCount(totalParticipantCount(borrador.participants)) },
            { termino: 'Datos demográficos', valor: borrador.demographics.enabled ? formatCount(borrador.demographics.fields.length) : 'No se usan' },
            { termino: 'Secciones', valor: formatCount(flattenSections(borrador.sections).length) },
            { termino: 'Preguntas', valor: formatCount(preguntas) },
            { termino: 'Tiempo estimado', valor: tiempoEstimado(borrador) },
          ]}
        />
      </BloqueResumen>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final. */}
      {pendientes.length ? null : <Aviso tono="success">Lista para finalizar.</Aviso>}
    </>
  )
}
