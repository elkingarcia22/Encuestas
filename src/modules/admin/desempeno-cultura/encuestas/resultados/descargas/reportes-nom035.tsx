import { Alert, AlertDescription, Heading, Progress, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { Nom035Responsible } from '../../modelo/descargas/tipos'
import { channeledRoster, type ChanneledPerson } from '../../modelo/descargas/canalizados'
import { NOM035_REQUIRED_PARTICIPATION } from '../../modelo/nom035'
import { collaboratorRiskOf, flattenSections, nom035AnswerContext, nom035Dimensions, peopleAtRiskIn, type CollaboratorRisk } from '../../modelo/nom035RiskModel'
import { RISK_BANDS, formatRisk, organizationRiskOf, riskBandForScore, riskScoreOf } from '../../modelo/nom035Scale'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { heatmapBySegment, participationBySegment, type HeatmapRow, type SectionResult, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { INSIGNIA_POR_TONO, numero } from '../components/escala'
import { Ajusta, Bloque, MAX_COLUMNAS, TANDAS, partir, Cifras, Documento, Leyenda, Nota, Pie, Portada, SeccionDocumento, fechaReporte, hoyReporte } from './documento'

// Los tres documentos impresos de la NOM 035: el reporte de riesgo psicosocial de la empresa y el
// reporte individual (Guía III), y las cartas de canalización (Guía I). La norma no produce
// favorabilidad: produce niveles de riesgo y casos, así que no comparten nada con el reporte general
// salvo las piezas del papel. Portados del prototipo, con los componentes de la pantalla.

const NORMA = 'NOM-035-STPS-2018'
const porcentaje = (valor: number) => `${Math.round(valor)} %`
const enRiesgo = (riesgo: number) => ['alto', 'muy-alto'].includes(riskBandForScore(riesgo).id)

function Riesgo({ riesgo, nivel }: { riesgo: number | null; nivel?: boolean }) {
  if (riesgo === null) return <Badge variant="secondary">{nivel ? 'Sin datos' : '—'}</Badge>
  const banda = riskBandForScore(riesgo)
  return (
    <Badge variant={INSIGNIA_POR_TONO[banda.scaleTone]} className="tabular-nums">
      {nivel ? banda.label : formatRisk(riesgo)}
    </Badge>
  )
}

const LEYENDA_RIESGO = RISK_BANDS.map((banda) => ({ etiqueta: banda.label, rango: banda.range.replace('.', ','), variante: INSIGNIA_POR_TONO[banda.scaleTone] }))
const LeyendaRiesgo = () => <Leyenda titulo="Nivel de riesgo" tramos={LEYENDA_RIESGO} />

/** Las dos rayas de firma: quien entrega (el responsable) y quien recibe. */
export function Firmas({ persona, responsable, respaldo }: { persona: string; responsable: Nom035Responsible | null; respaldo: { nombre: string; detalle: string } }) {
  const firma = (nombre: string, detalle: string) => (
    <div className="flex flex-col items-center gap-1 pt-12 text-center">
      <Separator />
      <Text as="span" size="sm" weight="semibold">
        {nombre}
      </Text>
      <Text as="span" size="xs" variant="muted">
        {detalle}
      </Text>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-10 break-inside-avoid">
      {firma(responsable?.name ?? respaldo.nombre, responsable?.id ? `Identificación ${responsable.id}` : respaldo.detalle)}
      {firma(persona, 'Recibí conforme · Fecha: ____________')}
    </div>
  )
}

// --- Reporte de riesgo psicosocial --------------------------------------------------------------

type Contexto = ReturnType<typeof nom035AnswerContext>

function TablaRiesgo({ secciones, contexto }: { secciones: readonly SectionResult[]; contexto: Contexto }) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Personas en riesgo</TableHead>
            <TableHead className="text-right">% afectados</TableHead>
            <TableHead className="text-center">Puntaje</TableHead>
            <TableHead className="text-center">Nivel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secciones.map((seccion) => {
            const riesgo = seccion.n > 0 ? riskScoreOf(seccion.score) : null
            const { atRisk, answered } = peopleAtRiskIn(seccion, contexto.respondents, contexto.breakdowns, contexto.matrix)
            return (
              <TableRow key={seccion.id} className="break-inside-avoid">
                <TableCell>
                  <Ajusta>
                    {seccion.numbering}. {seccion.title}
                  </Ajusta>
                </TableCell>
                <TableCell className="text-right tabular-nums">{numero(atRisk)}</TableCell>
                <TableCell className="text-right tabular-nums">{answered === 0 ? '—' : porcentaje((atRisk / answered) * 100)}</TableCell>
                <TableCell className="text-center">
                  <Riesgo riesgo={riesgo} />
                </TableCell>
                <TableCell className="text-center">
                  <Riesgo riesgo={riesgo} nivel />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <LeyendaRiesgo />
    </>
  )
}

function Cobertura({ resultados, segmento }: { resultados: SurveyResults; segmento: SegmentDefinition }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {participationBySegment(resultados, segmento).map((fila) => (
          <div key={fila.id} className="grid grid-cols-[12rem_1fr_9rem] items-center gap-3 break-inside-avoid">
            <Text as="span" size="sm" className="truncate">
              {fila.label}
            </Text>
            <Progress value={Math.min(100, fila.rate)} aria-label={`Participación de ${fila.label}`} />
            <Text as="span" size="xs" variant="muted" className="text-right tabular-nums">
              {porcentaje(fila.rate)} · {numero(fila.completed)}/{numero(fila.invited)}
            </Text>
          </div>
        ))}
      </div>
      <Nota>La norma exige el {porcentaje(NOM035_REQUIRED_PARTICIPATION)} de participación: los grupos por debajo son el hueco que hay que cerrar antes de leer sus resultados.</Nota>
    </>
  )
}

function Matriz({ resultados, segmento }: { resultados: SurveyResults; segmento: SegmentDefinition }) {
  const datos = heatmapBySegment(resultados, segmento)
  const aplanar = (filas: readonly HeatmapRow[]): HeatmapRow[] => filas.flatMap((fila) => (fila.kind === 'section' ? [fila, ...aplanar(fila.children)] : []))
  const filas = aplanar(datos.rows).filter((fila) => fila.depth <= 2)
  const celda = (clave: string, puntaje: number | null, reservada: boolean) => (
    <TableCell key={clave} className="text-center">
      {reservada ? <Badge variant="secondary">·</Badge> : <Riesgo riesgo={puntaje === null ? null : riskScoreOf(puntaje)} />}
    </TableCell>
  )
  const tandas = partir([...datos.columns.keys()], MAX_COLUMNAS)
  return (
    <>
      {tandas.map((indices, tanda) => (
        <div key={tanda} className="flex flex-col gap-2 break-inside-avoid">
          {tandas.length > 1 ? (
            <Text size="xs" variant="muted" weight="semibold">
              Grupo {TANDAS[tanda] ?? tanda + 1}
            </Text>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-center">Total</TableHead>
                {indices.map((i) => (
                  <TableHead key={datos.columns[i].id} className="text-center">
                    <Ajusta>{datos.columns[i].label}</Ajusta>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila.id}>
                  <TableCell className={fila.depth > 1 ? 'ps-6' : undefined}>
                    <Ajusta>
                      <Text as="span" size="sm" weight={fila.depth === 1 ? 'semibold' : 'normal'}>
                        {fila.label}
                      </Text>
                    </Ajusta>
                  </TableCell>
                  {celda('total', fila.total, false)}
                  {indices.map((i) => celda(String(i), fila.cells[i]?.score ?? null, fila.cells[i]?.masked ?? false))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
      <LeyendaRiesgo />
      <Nota>Los grupos que no alcanzan el umbral de anonimato se reportan como reservados (·).</Nota>
    </>
  )
}

function Responsable({ responsable }: { responsable: Nom035Responsible }) {
  return (
    <SeccionDocumento titulo="Responsable profesional del reporte" junta>
      <Nota>Quien avala la aplicación e interpretación de la {NORMA} para esta medición.</Nota>
      <Table>
        <TableBody>
          {[
            ['Nombre completo', responsable.name],
            ['Identificación', responsable.id],
            ['Fecha de emisión', hoyReporte()],
          ].map(([etiqueta, valor]) => (
            <TableRow key={etiqueta}>
              <TableCell className="w-48">
                <Text as="span" size="sm" weight="semibold">
                  {etiqueta}
                </Text>
              </TableCell>
              <TableCell>{valor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SeccionDocumento>
  )
}

export type PedidoNom035 = { participationSegments: readonly string[]; heatmapSegments: readonly string[]; responsible: Nom035Responsible | null; individualIds: readonly string[] }

const elegidos = (resultados: SurveyResults, claves: readonly string[]) => resultados.segments.filter((segmento) => !segmento.perPerson && claves.includes(segmento.key))

export function ReporteRiesgo({ borrador, resultados, pedido }: { borrador: SurveyDraft; resultados: SurveyResults; pedido: PedidoNom035 }) {
  const contexto = nom035AnswerContext(borrador, resultados)
  const categorias = resultados.sections
  const nivel = (profundidad: number) => flattenSections(categorias).filter((seccion) => seccion.depth === profundidad)
  const organizacion = organizationRiskOf(categorias)
  const dimensiones = nom035Dimensions(categorias)
  const dimensionesEnRiesgo = dimensiones.filter((dimension) => enRiesgo(riskScoreOf(dimension.score))).length
  const cumple = resultados.participation.rate >= NOM035_REQUIRED_PARTICIPATION
  const participacion = elegidos(resultados, pedido.participationSegments)
  const matrices = elegidos(resultados, pedido.heatmapSegments)
  let indice = 1

  return (
    <Documento>
      <Portada
        tipo={NORMA}
        rotulo="Reporte de riesgo psicosocial"
        titulo={borrador.name}
        datos={[
          { etiqueta: 'Período', valor: `${fechaReporte(borrador.startDate)} a ${fechaReporte(borrador.endDate)}` },
          { etiqueta: 'Invitados', valor: numero(resultados.participation.invited) },
          { etiqueta: 'Respuestas', valor: numero(resultados.participation.completed) },
          pedido.responsible ? { etiqueta: 'Responsable', valor: pedido.responsible.name } : { etiqueta: 'Participación', valor: porcentaje(resultados.participation.rate) },
        ]}
      />
      <SeccionDocumento numero={indice++} titulo="Verificación de la medición" junta>
        <Cifras
          cifras={[
            { etiqueta: 'Participación', valor: porcentaje(resultados.participation.rate), detalle: `${numero(resultados.participation.completed)} de ${numero(resultados.participation.invited)} invitados` },
            { etiqueta: 'Exigido por la norma', valor: porcentaje(NOM035_REQUIRED_PARTICIPATION), detalle: cumple ? 'La medición cumple' : 'La medición aún no cumple' },
            { etiqueta: 'Riesgo organizacional', valor: formatRisk(organizacion.score), detalle: `Nivel ${organizacion.band.label.toLowerCase()}` },
            { etiqueta: 'Dimensiones en riesgo', valor: numero(dimensionesEnRiesgo), detalle: `de ${numero(dimensiones.length)} evaluadas` },
          ]}
        />
        <Nota>El puntaje va de 0 a 5 y se lee al revés que una encuesta de clima: 5 es el extremo de riesgo. Una dimensión en nivel alto o muy alto obliga a un plan de acción según el numeral 8 de la norma.</Nota>
      </SeccionDocumento>
      <SeccionDocumento numero={indice++} titulo="Riesgo por categoría">
        <TablaRiesgo secciones={nivel(1)} contexto={contexto} />
      </SeccionDocumento>
      <SeccionDocumento numero={indice++} titulo="Riesgo por dominio">
        <TablaRiesgo secciones={nivel(2)} contexto={contexto} />
      </SeccionDocumento>
      <SeccionDocumento numero={indice++} titulo="Riesgo por dimensión">
        <Nota>El nivel más fino de la Guía III y el que dispara las obligaciones: una dimensión en alto o muy alto exige medidas de control.</Nota>
        <TablaRiesgo secciones={nivel(3)} contexto={contexto} />
      </SeccionDocumento>
      {participacion.map((segmento) => (
        <SeccionDocumento key={`p-${segmento.key}`} numero={indice++} titulo={`Participación por ${segmento.label.toLowerCase()}`}>
          <Cobertura resultados={resultados} segmento={segmento} />
        </SeccionDocumento>
      ))}
      {matrices.map((segmento) => (
        <SeccionDocumento key={`m-${segmento.key}`} numero={indice++} titulo={`Matriz de riesgo por ${segmento.label.toLowerCase()}`}>
          <Matriz resultados={resultados} segmento={segmento} />
        </SeccionDocumento>
      ))}
      {pedido.responsible ? <Responsable responsable={pedido.responsible} /> : null}
      <Pie izquierda={`${borrador.name} · Generado el ${hoyReporte()}`} derecha={`Los grupos con menos de ${resultados.threshold} respuestas se reportan como reservados.`} />
    </Documento>
  )
}

// --- Reporte individual -------------------------------------------------------------------------

function PaginaIndividual({ borrador, persona, responsable, ultima }: { borrador: SurveyDraft; persona: CollaboratorRisk; responsable: Nom035Responsible | null; ultima: boolean }) {
  const respondidas = persona.dimensions.filter((dimension) => dimension.risk !== null)
  const altas = respondidas.filter((dimension) => (dimension.risk ?? 0) >= 3.5)
  // Las de nivel medio todavía no obligan a actuar, pero son las que se revisan en la siguiente medición.
  const porVigilar = respondidas.filter((dimension) => (dimension.risk ?? 0) >= 2.5 && (dimension.risk ?? 0) < 3.5)
  const ordenadas = [...respondidas].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
  return (
    <article className={ultima ? 'flex flex-col gap-6' : 'flex flex-col gap-6 break-after-page'}>
      <Portada
        tipo={NORMA}
        rotulo="Reporte individual"
        titulo={persona.respondent.name}
        datos={[
          { etiqueta: 'Área', valor: persona.respondent.area ?? '—' },
          { etiqueta: 'Líder', valor: persona.respondent.leader ?? '—' },
          { etiqueta: 'Medición', valor: borrador.name },
          { etiqueta: 'Emitido', valor: hoyReporte() },
        ]}
      />
      <div className="flex items-center gap-2">
        <Text as="span" size="sm" variant="muted" weight="semibold">
          Nivel de riesgo
        </Text>
        <Riesgo riesgo={persona.risk} nivel />
        <Riesgo riesgo={persona.risk} />
      </div>
      <Cifras
        cifras={[
          { etiqueta: 'Dimensiones evaluadas', valor: numero(respondidas.length), detalle: `de ${numero(persona.dimensions.length)} de la guía` },
          { etiqueta: 'Dimensiones en riesgo', valor: numero(altas.length), detalle: 'nivel alto o muy alto' },
          { etiqueta: 'Dimensiones por vigilar', valor: numero(porVigilar.length), detalle: 'nivel medio' },
        ]}
      />
      <Bloque titulo="Evaluación de dimensiones">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dimensión</TableHead>
              <TableHead className="text-center">Puntaje</TableHead>
              <TableHead className="text-center">Nivel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenadas.map((dimension) => (
              <TableRow key={dimension.id} className="break-inside-avoid">
                <TableCell>
                  <Ajusta>{dimension.label}</Ajusta>
                </TableCell>
                <TableCell className="text-center">
                  <Riesgo riesgo={dimension.risk} />
                </TableCell>
                <TableCell className="text-center">
                  <Riesgo riesgo={dimension.risk} nivel />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <LeyendaRiesgo />
      </Bloque>
      <Alert>
        <AlertDescription>
          El nivel general de una persona es el más alto de sus dimensiones, no el promedio entre ellas: una sola dimensión en riesgo alto ya obliga a tomar medidas de control, y promediarla la escondería entre las demás.
        </AlertDescription>
      </Alert>
      {responsable ? (
        <Nota>
          Responsable profesional: {responsable.name} · Identificación {responsable.id}
        </Nota>
      ) : null}
      <Firmas persona={persona.respondent.name} responsable={responsable} respaldo={{ nombre: 'Responsable del reporte', detalle: 'Recursos Humanos' }} />
    </article>
  )
}

export function ReportesIndividuales({ borrador, resultados, pedido }: { borrador: SurveyDraft; resultados: SurveyResults; pedido: PedidoNom035 }) {
  const contexto = nom035AnswerContext(borrador, resultados)
  const dimensiones = nom035Dimensions(resultados.sections)
  const elegidas = new Set(pedido.individualIds)
  const personas = contexto.respondents.filter((persona) => elegidas.has(persona.id)).map((persona) => collaboratorRiskOf(persona, dimensiones, contexto.breakdowns, contexto.matrix))
  return (
    <Documento>
      {personas.map((persona, i) => (
        <PaginaIndividual key={persona.respondent.id} borrador={borrador} persona={persona} responsable={pedido.responsible} ultima={i === personas.length - 1} />
      ))}
    </Documento>
  )
}

// --- Cartas de canalización ---------------------------------------------------------------------

function Carta({ borrador, persona, posicion, total, responsable }: { borrador: SurveyDraft; persona: ChanneledPerson; posicion: number; total: number; responsable: Nom035Responsible | null }) {
  const folio = `NOM035-${new Date().getFullYear()}-${String(posicion).padStart(3, '0')}`
  const datos: [string, string][] = [
    ['Colaborador', persona.name],
    ['Área', persona.area ?? '—'],
    ['Líder directo', persona.leader ?? '—'],
    ['Medición', borrador.name],
    ['Fecha de emisión', hoyReporte()],
  ]
  return (
    <article className={posicion === total ? 'flex flex-col gap-5' : 'flex flex-col gap-5 break-after-page'}>
      <Text size="xs" variant="muted" className="text-right">
        Folio: {folio} · Página {posicion} de {total} · Confidencial
      </Text>
      <Alert variant="warning">
        <AlertDescription>Documento confidencial: uso exclusivo del área de Recursos Humanos.</AlertDescription>
      </Alert>
      <div className="flex flex-col items-center gap-1 text-center">
        <Heading level={2}>Carta de canalización</Heading>
        <Text variant="muted">Programa de atención a factores de riesgo psicosocial</Text>
        <Badge variant="default">{NORMA}</Badge>
      </div>
      <Table>
        <TableBody>
          {datos.map(([etiqueta, valor]) => (
            <TableRow key={etiqueta}>
              <TableCell className="w-44">
                <Text as="span" size="sm" weight="semibold">
                  {etiqueta}
                </Text>
              </TableCell>
              <TableCell>
                <Ajusta>{valor}</Ajusta>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Text as="span" size="sm" weight="semibold">
                Motivo
              </Text>
            </TableCell>
            <TableCell>
              <Badge variant="destructive-outline">Acontecimiento traumático severo reportado</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3">
        <Text>
          Estimado(a) <strong>{persona.name}</strong>:
        </Text>
        <Text>
          Por medio de la presente le informamos que, como resultado del cuestionario de identificación de acontecimientos traumáticos severos aplicado en cumplimiento de la <strong>{NORMA}</strong>, su respuesta activó el criterio que la
          norma establece para canalizar a atención médica especializada.
        </Text>
        <Text>
          De conformidad con el <strong>numeral 5.7</strong> de la norma vigente, el centro de trabajo tiene la obligación de canalizar a atención médica a quien presente signos o síntomas asociados a un acontecimiento traumático severo,
          con el objetivo de salvaguardar su salud física y mental.
        </Text>
        <Text>
          En consecuencia, usted ha sido incluido(a) en el <strong>Programa de canalización y atención</strong>, que le brindará acompañamiento especializado de manera estrictamente confidencial, sin que ello implique ningún tipo de
          repercusión laboral.
        </Text>
        <Text>Le solicitamos confirmar la recepción de este documento mediante su firma en el espacio designado y conservar una copia para sus registros.</Text>
        <Text>
          La información aquí contenida es <strong>estrictamente confidencial</strong> y será tratada conforme a la normativa aplicable en materia de protección de datos personales.
        </Text>
      </div>
      <Firmas persona={persona.name} responsable={responsable} respaldo={{ nombre: 'Responsable de Recursos Humanos', detalle: 'Por el centro de trabajo' }} />
    </article>
  )
}

// `soloIds`: las cartas de unas personas en concreto (las que se marcan en la pestaña Canalización); sin él, todas.
export function CartasCanalizacion({
  borrador,
  resultados,
  pedido,
  soloIds,
}: {
  borrador: SurveyDraft
  resultados: SurveyResults
  pedido: Pick<PedidoNom035, 'responsible'>
  soloIds?: readonly string[]
}) {
  const canalizados = channeledRoster(borrador, resultados).filter((persona) => persona.channeled && (!soloIds || soloIds.includes(persona.id)))
  return (
    <Documento>
      {canalizados.length === 0 ? (
        <SeccionDocumento titulo="Sin canalizaciones">
          <Text>Ningún participante activó el criterio de canalización de la Guía de Referencia I, así que esta medición no genera cartas.</Text>
        </SeccionDocumento>
      ) : (
        canalizados.map((persona, i) => <Carta key={persona.id} borrador={borrador} persona={persona} posicion={i + 1} total={canalizados.length} responsable={pedido.responsible} />)
      )}
    </Documento>
  )
}
