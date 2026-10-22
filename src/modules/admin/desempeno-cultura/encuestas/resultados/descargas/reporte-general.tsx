import type { ReactNode } from 'react'
import { Alert, AlertDescription, Progress, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { FAVORABILITY_BANDS, FAVORABILITY_FLOOR, FAVORABILITY_TARGET, VERDICT_COPY, bandForScore, formatPercent, formatScore, npsBandForScore, verdictForFavorability } from '../../modelo/favorabilityScale'
import { SCOPE_ALL, analyseSegmentGaps, resolveScope, scopedMetrics } from '../../modelo/summaryModel'
import { SURVEY_KIND_LABELS, type SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { buildSurveyAnalysis, type InsightKind } from '../../modelo/surveyInsights'
import {
  flattenResultSections,
  heatmapBySegment,
  npsBySection,
  npsBySegmentData,
  participationBySegment,
  sectionResultsForFilters,
  type Distribution,
  type HeatmapRow,
  type NpsSectionDetail,
  type SectionResult,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from '../../modelo/surveyResults'
import { INSIGNIA_POR_LECTURA, INSIGNIA_POR_TONO, conSigno, numero } from '../components/escala'
import { Ajusta, Bloque, MAX_COLUMNAS, TANDAS, partir, Cifras, Documento, Leyenda, Nota, Pie, Portada, SeccionDocumento, fechaReporte, hoyReporte } from './documento'
import { plural } from '@/modules/design-system/patrones/formato'

// El reporte general de una medición de clima o cultura, impreso: la medición contada para quien
// decide. Alterna secciones generales (verificación, favorabilidad por secciones, IA), iguales para
// todo lector, con las que despliegan los demográficos que eligió quien lo descarga. Nada se compara
// contra la medición anterior: este documento responde «¿qué pasa hoy?». Portado del prototipo.

export type SeccionPdf = 'verification' | 'participation' | 'sections' | 'heatmap' | 'questions' | 'nps' | 'gaps' | 'ai'
export type CortePdf = 'participation' | 'heatmap' | 'nps' | 'gaps'

/** Lo que el reporte necesita del pedido de descarga. */
export type PedidoReporteGeneral = {
  pdfSections: readonly SeccionPdf[]
  pdfSegments: Readonly<Record<CortePdf, readonly string[]>>
  pdfQuestionSections: readonly string[]
  filters: readonly SegmentFilter[]
}

type Datos = {
  borrador: SurveyDraft
  resultados: SurveyResults
  pedido: PedidoReporteGeneral
  secciones: readonly SectionResult[]
  favorabilidad: number
  participacion: { invited: number; completed: number; inProgress: number; rate: number }
  corte: string | null
}

const cortes = ({ resultados, pedido }: Datos, slot: CortePdf): readonly SegmentDefinition[] => resultados.segments.filter((segmento) => (pedido.pdfSegments[slot] ?? []).includes(segmento.key))
const parte = (valor: number, total: number) => (total === 0 ? 0 : Math.round((valor / total) * 100))

// --- Piezas de la escala ------------------------------------------------------------------------

type Tramos = { desfavorables: number; neutrales: number; favorables: number; total: number }
const tramos = (distribucion: Distribution | null): Tramos => {
  const cajas = distribucion ?? [0, 0, 0, 0, 0]
  const desfavorables = cajas[0] + cajas[1]
  const neutrales = cajas[2]
  const favorables = cajas[3] + cajas[4]
  return { desfavorables, neutrales, favorables, total: desfavorables + neutrales + favorables }
}
const tramosDeSeccion = (seccion: SectionResult): Tramos => {
  const cajas: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const nodo of flattenResultSections([seccion])) for (const pregunta of nodo.questions) pregunta.distribution?.forEach((cuenta, i) => (cajas[i] += cuenta))
  return tramos(cajas)
}
const porcentaje = (valor: number, total: number) => (total === 0 ? '—' : `${parte(valor, total)} %`)

function Puntaje({ valor }: { valor: number | null }) {
  if (valor === null)
    return (
      <Text as="span" size="sm" variant="muted">
        —
      </Text>
    )
  return (
    <Badge variant={INSIGNIA_POR_TONO[bandForScore(valor).tone]} className="tabular-nums">
      {formatScore(valor)}
    </Badge>
  )
}

function Favorabilidad({ valor }: { valor: number | null }) {
  if (valor === null)
    return (
      <Text as="span" size="sm" variant="muted">
        —
      </Text>
    )
  const variante = valor >= FAVORABILITY_TARGET ? 'success-light' : valor >= FAVORABILITY_FLOOR ? 'warning-light' : 'destructive-outline'
  return (
    <Badge variant={variante} className="tabular-nums">
      {formatPercent(valor)}
    </Badge>
  )
}

function Nps({ valor }: { valor: number }) {
  return (
    <Badge variant={INSIGNIA_POR_TONO[npsBandForScore(valor).tone]} className="tabular-nums">
      {conSigno(valor)}
    </Badge>
  )
}

const LEYENDA_BANDAS = FAVORABILITY_BANDS.map((banda) => ({ etiqueta: banda.label, rango: banda.range, variante: INSIGNIA_POR_TONO[banda.tone] }))
const LEYENDA_FAVORABILIDAD = [
  { etiqueta: 'Favorable', rango: `${FAVORABILITY_TARGET} % o más`, variante: 'success-light' as const },
  { etiqueta: 'Neutral', rango: `${FAVORABILITY_FLOOR} % a ${FAVORABILITY_TARGET - 1} %`, variante: 'warning-light' as const },
  { etiqueta: 'Desfavorable', rango: `menos de ${FAVORABILITY_FLOOR} %`, variante: 'destructive-outline' as const },
]

// Sangría por profundidad: el árbol de secciones se lee en el papel igual que en la pantalla.
const SANGRIA = ['', 'ps-5', 'ps-10', 'ps-14']
const Numerada = ({ numeracion, titulo, profundidad, fuerte }: { numeracion: string; titulo: string; profundidad: number; fuerte?: boolean }) => (
  <div className={`${SANGRIA[Math.min(profundidad, 3)]} whitespace-normal`}>
    <Text as="span" size="sm" variant="muted" className="tabular-nums">
      {numeracion}
    </Text>{' '}
    <Text as="span" size="sm" weight={fuerte ? 'semibold' : 'normal'}>
      {titulo}
    </Text>
  </div>
)

const Num = ({ children }: { children: ReactNode }) => <TableCell className="text-right tabular-nums">{children}</TableCell>
const NumHead = ({ children }: { children: ReactNode }) => <TableHead className="text-right">{children}</TableHead>

// --- 1 · Verificación ---------------------------------------------------------------------------

function Verificacion({ resultados, secciones, favorabilidad, participacion }: Datos) {
  const metricas = scopedMetrics(resolveScope({ ...resultados, sections: [...secciones] }, SCOPE_ALL))
  const nps = resultados.nps
  return (
    <Cifras
      cifras={[
        { etiqueta: 'Favorabilidad', valor: formatPercent(favorabilidad), detalle: `${numero(metricas.scoredQuestions)} ${plural(metricas.scoredQuestions, 'pregunta', 'preguntas')} de escala` },
        { etiqueta: 'Participación', valor: formatPercent(participacion.rate), detalle: `${numero(participacion.completed)} de ${numero(participacion.invited)} personas` },
        nps
          ? { etiqueta: 'eNPS', valor: conSigno(nps.score), detalle: `${parte(nps.promoters, nps.n)} % promotores · ${parte(nps.detractors, nps.n)} % detractores` }
          : { etiqueta: 'eNPS', valor: '—', detalle: 'Esta encuesta no incluyó pregunta de recomendabilidad' },
        { etiqueta: 'Respuestas registradas', valor: numero(metricas.scaleAnswers), detalle: 'Respuestas sobre preguntas de escala 1 a 5' },
      ]}
    />
  )
}

// --- 2 · Participación --------------------------------------------------------------------------

function Participacion(datos: Datos) {
  const { resultados, pedido, participacion } = datos
  const tasa = participacion.rate
  const lectura = tasa >= 80 ? { texto: 'Alta participación', tono: 'positive' as const } : tasa >= 60 ? { texto: 'Participación media', tono: 'warning' as const } : { texto: 'Participación baja', tono: 'negative' as const }
  const sinAbrir = Math.max(0, participacion.invited - participacion.completed - participacion.inProgress)
  const mezcla = [
    { etiqueta: 'Completaron', valor: participacion.completed },
    { etiqueta: 'En progreso', valor: participacion.inProgress },
    { etiqueta: 'Sin abrir', valor: sinAbrir },
  ]
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Leyenda
          titulo="Escala de la tasa de respuesta"
          tramos={[
            { etiqueta: 'Alta', rango: '80 % o más', variante: 'success-light' },
            { etiqueta: 'Media', rango: '60 % a 79 %', variante: 'warning-light' },
            { etiqueta: 'Baja', rango: 'menos de 60 %', variante: 'destructive-outline' },
          ]}
        />
        <Badge variant={INSIGNIA_POR_LECTURA[lectura.tono]}>
          {formatPercent(tasa)} · {lectura.texto}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 break-inside-avoid">
        {mezcla.map((fila) => (
          <div key={fila.etiqueta} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Text as="span" size="sm" weight="medium">
                {fila.etiqueta}
              </Text>
              <Text as="span" size="sm" variant="muted" className="tabular-nums">
                {numero(fila.valor)} · {parte(fila.valor, participacion.invited)} %
              </Text>
            </div>
            <Progress value={parte(fila.valor, participacion.invited)} aria-label={fila.etiqueta} />
          </div>
        ))}
      </div>
      {cortes(datos, 'participation').map((segmento) => {
        const filas = participationBySegment(resultados, segmento, pedido.filters)
        if (filas.length === 0) return null
        // Sin fila de total: las respuestas de los grupos no suman exactamente la cifra global, y
        // dos números distintos a tres centímetros uno del otro no dejan saber cuál creer.
        return (
          <Bloque key={segmento.key} titulo={`Cobertura por ${segmento.label.toLowerCase()}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{segmento.label}</TableHead>
                  <NumHead>Invitados</NumHead>
                  <NumHead>Respuestas</NumHead>
                  <NumHead>En progreso</NumHead>
                  <TableHead className="w-48">Participación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id} className="break-inside-avoid">
                    <TableCell>
                      <Ajusta>{fila.label}</Ajusta>
                    </TableCell>
                    <Num>{numero(fila.invited)}</Num>
                    <Num>{numero(fila.completed)}</Num>
                    <Num>{numero(fila.inProgress)}</Num>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={fila.rate} className="flex-1" aria-label={`Participación de ${fila.label}`} />
                        <Text as="span" size="xs" weight="semibold" className="w-12 text-right tabular-nums">
                          {formatPercent(fila.rate)}
                        </Text>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Bloque>
        )
      })}
    </>
  )
}

// --- 3 · Favorabilidad por secciones ------------------------------------------------------------

function EncabezadoTramos() {
  return (
    <>
      <NumHead>Desfav.</NumHead>
      <NumHead>Neutral</NumHead>
      <NumHead>Favor.</NumHead>
    </>
  )
}

function CeldasTramos({ valores }: { valores: Tramos }) {
  return (
    <>
      <Num>{porcentaje(valores.desfavorables, valores.total)}</Num>
      <Num>{porcentaje(valores.neutrales, valores.total)}</Num>
      <Num>{porcentaje(valores.favorables, valores.total)}</Num>
    </>
  )
}

function Secciones({ secciones, favorabilidad }: Datos) {
  const veredicto = VERDICT_COPY[verdictForFavorability(favorabilidad)]
  const filas = (nodos: readonly SectionResult[], profundidad: number): ReactNode[] =>
    nodos.flatMap((seccion) => {
      const valores = tramosDeSeccion(seccion)
      const conEscala = seccion.n > 0 && valores.total > 0
      return [
        <TableRow key={seccion.id} className="break-inside-avoid">
          <TableCell>
            <Numerada numeracion={seccion.numbering} titulo={seccion.title} profundidad={profundidad} fuerte={profundidad === 0} />
          </TableCell>
          <Num>{numero(seccion.n)}</Num>
          <CeldasTramos valores={conEscala ? valores : { desfavorables: 0, neutrales: 0, favorables: 0, total: 0 }} />
          <TableCell className="text-center">
            <Puntaje valor={conEscala ? seccion.score : null} />
          </TableCell>
          <TableCell className="text-center">
            <Favorabilidad valor={conEscala ? seccion.favorability : null} />
          </TableCell>
        </TableRow>,
        ...filas(seccion.children, profundidad + 1),
      ]
    })
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Text as="span" size="sm" weight="semibold">
          Favorabilidad general {formatPercent(favorabilidad)}
        </Text>
        <Badge variant={INSIGNIA_POR_LECTURA[veredicto.variant === 'positive' ? 'positive' : veredicto.variant === 'warning' ? 'warning' : 'negative']}>{veredicto.label}</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sección / subsección</TableHead>
            <NumHead>Respuestas</NumHead>
            <EncabezadoTramos />
            <TableHead className="text-center">Puntaje</TableHead>
            <TableHead className="text-center">Favorabilidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{filas(secciones, 0)}</TableBody>
      </Table>
      <Leyenda titulo="Favorabilidad" tramos={LEYENDA_FAVORABILIDAD} />
    </>
  )
}

// --- 4 · Mapa de calor --------------------------------------------------------------------------

function Celda({ puntaje, reservada, rotulo }: { puntaje: number | null; reservada: boolean; rotulo: string }) {
  return (
    <TableCell className="text-center">
      {reservada || puntaje === null ? (
        <Badge variant="secondary" size="sm">
          {reservada ? rotulo : '—'}
        </Badge>
      ) : (
        <Puntaje valor={puntaje} />
      )}
    </TableCell>
  )
}

function MapaCalor(datos: Datos) {
  const { resultados, pedido, borrador } = datos
  const anonima = borrador.visibility === 'anonymous'
  const rotulo = anonima ? 'Reservado' : 'Sin datos'
  const grillas = cortes(datos, 'heatmap').map((segmento) => {
    const mapa = heatmapBySegment(resultados, segmento, pedido.filters)
    if (mapa.columns.length === 0) return null
    const filas: HeatmapRow[] = []
    const recorrer = (nodos: readonly HeatmapRow[]) => nodos.forEach((nodo) => nodo.kind === 'section' && (filas.push(nodo), recorrer(nodo.children)))
    recorrer(mapa.rows)
    if (filas.length === 0) return null
    const tandas = partir([...mapa.columns.keys()], MAX_COLUMNAS)
    return (
      <Bloque key={segmento.key} titulo={`Mapa de calor por ${segmento.label.toLowerCase()}`}>
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
                  <TableHead>Sección</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  {indices.map((i) => (
                    <TableHead key={i} className="text-center">
                      <Ajusta>{mapa.columns[i].label}</Ajusta>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id}>
                    <TableCell>
                      <Numerada numeracion={fila.numbering} titulo={fila.label} profundidad={fila.depth - 1} fuerte={fila.depth === 1} />
                    </TableCell>
                    <Celda puntaje={fila.total} reservada={false} rotulo={rotulo} />
                    {indices.map((i) => (
                      <Celda key={i} puntaje={fila.cells[i]?.score ?? null} reservada={fila.cells[i]?.masked ?? false} rotulo={rotulo} />
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Text as="span" size="sm" weight="semibold">
                      Total por grupo
                    </Text>
                  </TableCell>
                  <TableCell />
                  {indices.map((i) => (
                    <Celda key={i} puntaje={mapa.columnTotals[i] ?? null} reservada={false} rotulo={rotulo} />
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}
      </Bloque>
    )
  })
  if (grillas.every((grilla) => grilla === null)) return null
  return (
    <>
      <Nota>
        {anonima
          ? `Cada celda es el promedio 1 a 5 de ese cruce, y su color es la banda en la que cae. Las celdas grises son grupos con menos de ${resultados.threshold} respuestas: sus resultados se reservan para proteger el anonimato.`
          : 'Cada celda es el promedio 1 a 5 de ese cruce, y su color es la banda en la que cae. Las celdas grises son grupos que aún no tienen respuestas.'}
      </Nota>
      {grillas}
      <Leyenda titulo="Escala 1 a 5" tramos={[...LEYENDA_BANDAS, { etiqueta: rotulo, variante: 'secondary' }]} />
    </>
  )
}

// --- 5 · Detalle de preguntas -------------------------------------------------------------------

function Preguntas({ secciones, pedido }: Datos) {
  const elegidas = secciones.filter((seccion) => pedido.pdfQuestionSections.includes(seccion.id))
  const bloques = elegidas.map((seccion) => {
    const filas = flattenResultSections([seccion]).flatMap((nodo) => nodo.questions.filter((pregunta) => pregunta.scored && pregunta.n > 0).map((pregunta) => ({ nodo, pregunta })))
    if (filas.length === 0) return null
    return (
      <Bloque key={seccion.id} titulo={`${seccion.numbering}. ${seccion.title}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-right">#</TableHead>
              <TableHead>Pregunta</TableHead>
              <NumHead>Respuestas</NumHead>
              <EncabezadoTramos />
              <TableHead className="text-center">Puntaje</TableHead>
              <TableHead className="text-center">Favorabilidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map(({ nodo, pregunta }, indice) => (
              <TableRow key={pregunta.id} className="break-inside-avoid">
                <Num>{indice + 1}</Num>
                <TableCell>
                  <Ajusta>
                    <Text size="sm">{pregunta.statement}</Text>
                    <Text size="xs" variant="muted">
                      {nodo.numbering} {nodo.title}
                    </Text>
                  </Ajusta>
                </TableCell>
                <Num>{numero(pregunta.n)}</Num>
                <CeldasTramos valores={tramos(pregunta.distribution)} />
                <TableCell className="text-center">
                  <Puntaje valor={pregunta.score} />
                </TableCell>
                <TableCell className="text-center">
                  <Favorabilidad valor={pregunta.favorability} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Bloque>
    )
  })
  if (bloques.every((bloque) => bloque === null)) return null
  return (
    <>
      {bloques}
      <Leyenda titulo="Favorabilidad" tramos={LEYENDA_FAVORABILIDAD} />
    </>
  )
}

// --- 6 · eNPS -----------------------------------------------------------------------------------

function EncabezadoNps({ primera }: { primera: string }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{primera}</TableHead>
        <NumHead>Respuestas</NumHead>
        <NumHead>Detractores</NumHead>
        <NumHead>Neutros</NumHead>
        <NumHead>Promotores</NumHead>
        <TableHead className="text-center">eNPS</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function Enps(datos: Datos) {
  const { resultados, pedido } = datos
  const nps = resultados.nps
  if (!nps) return null
  const detalle = npsBySection(resultados, pedido.filters)
  const filas = (nodos: readonly NpsSectionDetail[], profundidad: number): ReactNode[] =>
    nodos.flatMap((seccion) => [
      <TableRow key={seccion.id} className="break-inside-avoid">
        <TableCell>
          <Numerada numeracion={seccion.numbering} titulo={seccion.title} profundidad={profundidad} fuerte={profundidad === 0} />
        </TableCell>
        <Num>{numero(seccion.n)}</Num>
        <Num>{parte(seccion.detractors, seccion.n)} %</Num>
        <Num>{parte(seccion.passives, seccion.n)} %</Num>
        <Num>{parte(seccion.promoters, seccion.n)} %</Num>
        <TableCell className="text-center">
          <Nps valor={seccion.score} />
        </TableCell>
      </TableRow>,
      ...filas(seccion.children, profundidad + 1),
    ])
  return (
    <>
      <Cifras
        cifras={[
          { etiqueta: 'eNPS', valor: conSigno(nps.score), detalle: `Sobre ${numero(nps.n)} ${plural(nps.n, 'persona', 'personas')}, de −100 a +100` },
          { etiqueta: 'Detractores', valor: `${parte(nps.detractors, nps.n)} %`, detalle: `${numero(nps.detractors)} ${plural(nps.detractors, 'persona', 'personas')} · 0 a 6` },
          { etiqueta: 'Neutros', valor: `${parte(nps.passives, nps.n)} %`, detalle: `${numero(nps.passives)} ${plural(nps.passives, 'persona', 'personas')} · 7 a 8` },
          { etiqueta: 'Promotores', valor: `${parte(nps.promoters, nps.n)} %`, detalle: `${numero(nps.promoters)} ${plural(nps.promoters, 'persona', 'personas')} · 9 a 10` },
        ]}
      />
      {detalle.length > 0 ? (
        <Bloque titulo="eNPS por secciones y subsecciones">
          <Table>
            <EncabezadoNps primera="Sección / subsección" />
            <TableBody>{filas(detalle, 0)}</TableBody>
          </Table>
        </Bloque>
      ) : null}
      {cortes(datos, 'nps').map((segmento) => {
        const grilla = npsBySegmentData(resultados, segmento, pedido.filters)
        if (grilla.columns.length === 0) return null
        const total = grilla.totalRow.total
        return (
          <Bloque key={segmento.key} titulo={`eNPS por ${segmento.label.toLowerCase()}`}>
            <Table>
              <EncabezadoNps primera={segmento.label} />
              <TableBody>
                {grilla.columns.map((columna, i) => {
                  const celda = grilla.totalRow.cells[i]
                  return (
                    <TableRow key={columna.id} className="break-inside-avoid">
                      <TableCell>
                        <Ajusta>{columna.label}</Ajusta>
                      </TableCell>
                      <Num>{celda ? numero(celda.n) : '—'}</Num>
                      {!celda || celda.belowThreshold ? (
                        <TableCell colSpan={4} className="text-center">
                          <Text as="span" size="xs" variant="muted">
                            Reservado · menos de {resultados.threshold} respuestas
                          </Text>
                        </TableCell>
                      ) : (
                        <>
                          <Num>{parte(celda.detractors, celda.n)} %</Num>
                          <Num>{parte(celda.passives, celda.n)} %</Num>
                          <Num>{parte(celda.promoters, celda.n)} %</Num>
                          <TableCell className="text-center">
                            <Nps valor={celda.score} />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell>
                    <Text as="span" size="sm" weight="semibold">
                      Total general
                    </Text>
                  </TableCell>
                  <Num>{numero(total.n)}</Num>
                  <Num>{parte(total.detractors, total.n)} %</Num>
                  <Num>{parte(total.passives, total.n)} %</Num>
                  <Num>{parte(total.promoters, total.n)} %</Num>
                  <TableCell className="text-center">
                    <Nps valor={total.score} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Bloque>
        )
      })}
    </>
  )
}

// --- 7 · Brechas --------------------------------------------------------------------------------

function Brechas(datos: Datos) {
  const { resultados, pedido } = datos
  const bloques = cortes(datos, 'gaps').map((segmento) => {
    const brechas = analyseSegmentGaps(segmento, resultados, pedido.filters)
    if (!brechas) return null
    return (
      <Bloque key={segmento.key} titulo={`Brechas por ${segmento.label.toLowerCase()}`}>
        {brechas.widest ? (
          <Alert>
            <AlertDescription>
              Mayor polarización: <strong>{brechas.widest.rowLabel}</strong> va de {formatScore(brechas.widest.min)} en {brechas.widest.minLabel} a {formatScore(brechas.widest.max)} en {brechas.widest.maxLabel}:{' '}
              {formatScore(brechas.widest.spread)} puntos de diferencia.
            </AlertDescription>
          </Alert>
        ) : null}
        {brechas.outliers.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo rezagado</TableHead>
                  <NumHead>Respuestas</NumHead>
                  <NumHead>Diferencia</NumHead>
                  <NumHead>Participación</NumHead>
                  <TableHead className="text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brechas.outliers.map(({ row, gap }) => (
                  <TableRow key={row.id} className="break-inside-avoid">
                    <TableCell>
                      <Ajusta>{row.label}</Ajusta>
                    </TableCell>
                    <Num>{numero(row.completed)}</Num>
                    <Num>{formatScore(gap)}</Num>
                    <Num>{formatPercent(row.participation)}</Num>
                    <TableCell className="text-center">
                      <Puntaje valor={row.score} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Nota>Diferencia contra el promedio de {formatScore(brechas.average)} de este demográfico.</Nota>
          </>
        ) : (
          <Nota>Ningún grupo cae por debajo del promedio de {formatScore(brechas.average)} lo suficiente para reportarlo.</Nota>
        )}
      </Bloque>
    )
  })
  return bloques.every((bloque) => bloque === null) ? null : <>{bloques}</>
}

// --- 8 · Análisis de IA -------------------------------------------------------------------------

const TIPO_LECTURA: Record<InsightKind, { texto: string; variante: 'secondary' | 'destructive-outline' | 'success-light' }> = {
  finding: { texto: 'Hallazgo', variante: 'secondary' },
  risk: { texto: 'Riesgo', variante: 'destructive-outline' },
  recommendation: { texto: 'Recomendación', variante: 'success-light' },
}
const CONFIABILIDAD = { low: 'Confiabilidad baja', medium: 'Confiabilidad media', high: 'Confiabilidad alta' } as const

function AnalisisIa({ resultados, secciones }: Datos) {
  const analisis = buildSurveyAnalysis({ ...resultados, sections: [...secciones] })
  if (analisis.insights.length === 0) return null
  return (
    <>
      <Text>{analisis.summary}</Text>
      <div className="flex flex-col gap-4">
        {analisis.insights.map((lectura) => (
          <div key={lectura.id} className="flex flex-col gap-1 break-inside-avoid">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={TIPO_LECTURA[lectura.kind].variante} size="sm">
                {TIPO_LECTURA[lectura.kind].texto}
              </Badge>
              <Text as="span" size="sm" weight="semibold">
                {lectura.title}
              </Text>
              <Text as="span" size="xs" variant="muted">
                {CONFIABILIDAD[lectura.confidence]}
              </Text>
            </div>
            <Text size="sm">{lectura.body}</Text>
            <Text size="xs" variant="muted">
              Evidencia: {lectura.evidence}
            </Text>
          </div>
        ))}
      </div>
      <Nota>Lectura generada a partir de los resultados de esta medición. Cada afirmación cita la cifra que la sostiene para que pueda verificarse contra las secciones anteriores.</Nota>
    </>
  )
}

// --- El documento -------------------------------------------------------------------------------

const SECCIONES: readonly { id: SeccionPdf; titulo: string; junta?: boolean; ia?: boolean; Cuerpo: (datos: Datos) => ReactNode }[] = [
  { id: 'verification', titulo: 'Verificación de la medición', junta: true, Cuerpo: Verificacion },
  { id: 'participation', titulo: 'Participación', Cuerpo: Participacion },
  { id: 'sections', titulo: 'Favorabilidad por secciones', Cuerpo: Secciones },
  { id: 'heatmap', titulo: 'Mapa de calor por demográficos', Cuerpo: MapaCalor },
  { id: 'questions', titulo: 'Detalle de preguntas', Cuerpo: Preguntas },
  { id: 'nps', titulo: 'eNPS', Cuerpo: Enps },
  { id: 'gaps', titulo: 'Brechas entre grupos', Cuerpo: Brechas },
  { id: 'ai', titulo: 'Análisis de IA', ia: true, Cuerpo: AnalisisIa },
]

// La favorabilidad ponderada del árbol recortado: el titular habla de la población elegida.
const favorabilidadDe = (secciones: readonly SectionResult[], respaldo: number) => {
  const n = secciones.reduce((suma, seccion) => suma + seccion.n, 0)
  return n > 0 ? Math.round((secciones.reduce((suma, seccion) => suma + seccion.favorability * seccion.n, 0) / n) * 10) / 10 : respaldo
}

function datosDelReporte(borrador: SurveyDraft, resultados: SurveyResults, pedido: PedidoReporteGeneral): Datos {
  const filtros = pedido.filters
  const secciones = sectionResultsForFilters(resultados, filtros)
  const segmentoFiltro = filtros.length ? resultados.segments.find((segmento) => segmento.key === filtros[0].key) : undefined
  const grupos = filtros.map((filtro) => segmentoFiltro?.options.find((opcion) => opcion.id === filtro.optionId)?.label).filter((etiqueta): etiqueta is string => Boolean(etiqueta))
  // Con un filtro, la participación se vuelve a totalizar desde los grupos que quedaron: la misma
  // cuenta que hace el titular de la pestaña, para que papel y pantalla no discrepen.
  const filas = segmentoFiltro ? participationBySegment(resultados, segmentoFiltro, filtros) : []
  const suma = (campo: 'invited' | 'completed' | 'inProgress') => filas.reduce((total, fila) => total + fila[campo], 0)
  const participacion = segmentoFiltro
    ? { invited: suma('invited'), completed: suma('completed'), inProgress: suma('inProgress'), rate: suma('invited') === 0 ? 0 : Math.round((suma('completed') / suma('invited')) * 1000) / 10 }
    : { invited: resultados.participation.invited, completed: resultados.participation.completed, inProgress: resultados.participation.inProgress, rate: resultados.participation.rate }
  return {
    borrador,
    resultados,
    pedido,
    secciones,
    favorabilidad: filtros.length ? favorabilidadDe(secciones, resultados.favorability) : resultados.favorability,
    participacion,
    corte: grupos.length ? `${segmentoFiltro?.label}: ${grupos.join(', ')}` : null,
  }
}

export function ReporteGeneral({ borrador, resultados, pedido }: { borrador: SurveyDraft; resultados: SurveyResults; pedido: PedidoReporteGeneral }) {
  const datos = datosDelReporte(borrador, resultados, pedido)
  // Las secciones apagadas o vacías no se imprimen, y las que quedan se renumeran: un documento
  // que salta del 3 al 5 hace pensar en una hoja perdida.
  const cuerpos = SECCIONES.filter((seccion) => pedido.pdfSections.includes(seccion.id))
    .map((seccion) => ({ ...seccion, cuerpo: seccion.Cuerpo(datos) }))
    .filter((seccion) => seccion.cuerpo !== null)
  return (
    <Documento>
      <Portada
        tipo={borrador.kind ? SURVEY_KIND_LABELS[borrador.kind] : 'Encuesta'}
        rotulo="Reporte general"
        titulo={borrador.name}
        corte={datos.corte}
        datos={[
          { etiqueta: 'Período', valor: `${fechaReporte(borrador.startDate)} a ${fechaReporte(borrador.endDate)}` },
          { etiqueta: 'Población', valor: datos.corte ?? 'Toda la empresa' },
          { etiqueta: 'Invitados', valor: numero(datos.participacion.invited) },
          { etiqueta: 'Generado', valor: hoyReporte() },
        ]}
      />
      {cuerpos.map((seccion, indice) => (
        <SeccionDocumento key={seccion.id} numero={indice + 1} titulo={seccion.titulo} junta={seccion.junta} icono={seccion.ia ? <IconoIA /> : undefined}>
          {seccion.cuerpo}
        </SeccionDocumento>
      ))}
      <Pie
        izquierda={`${borrador.name} · Reporte general generado el ${hoyReporte()}`}
        derecha={borrador.visibility === 'anonymous' ? `Los grupos con menos de ${resultados.threshold} respuestas se reportan como «Reservado».` : 'Encuesta nominal: los resultados pueden atribuirse.'}
      />
    </Documento>
  )
}
