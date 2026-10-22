import { Fragment, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon, Message01Icon } from '@hugeicons/core-free-icons'
import { Button, cn, FramePanel, Item, ItemContent, ItemDescription, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { FAVORABILITY_TARGET, formatPercent, formatScore } from '../../modelo/favorabilityScale'
import { CONFIDENCE_ORDER, CONFIDENCE_STYLES, type InsightConfidence } from '../../modelo/insightConfidence'
import { SENTIMENT_ORDER } from '../../modelo/sentimiento'
import { confidenceFor, type AlertTarget, type Finding, type Priority, type SegmentGaps, type SentimentRollup } from '../../modelo/summaryModel'
import type { SurveyInsight } from '../../modelo/surveyInsights'
import { BloquePlegable } from './arbol-resultados'
import { INSIGNIA_POR_TONO, numero } from './escala'
import { InsigniaSentimiento } from './sentimiento'

// Las secciones del análisis con IA con la misma forma que el resto de Resultados: cada bloque es una sección plegable
// numerada (como las de Favorabilidad › Secciones) con su tabla, y cada fila se abre sobre la cifra que la sostiene,
// para poder contradecirla con las demás pestañas.

type Nivel = 'alta' | 'media' | 'baja'

const NIVEL: Record<InsightConfidence, Nivel> = { high: 'alta', medium: 'media', low: 'baja' }
const VARIANTE_NIVEL: Record<Nivel, 'success-light' | 'warning-light' | 'outline'> = { alta: 'success-light', media: 'warning-light', baja: 'outline' }
const SEVERIDAD = {
  critical: { etiqueta: 'Crítica', variante: 'destructive-outline' },
  high: { etiqueta: 'Alta', variante: 'warning-light' },
  watch: { etiqueta: 'Seguimiento', variante: 'outline' },
} as const

const plural = (cantidad: number, uno: string, varios: string) => `${numero(cantidad)} ${cantidad === 1 ? uno : varios}`
const parte = (valor: number, total: number) => (total === 0 ? 0 : Math.round((valor / total) * 100))
const enMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

function Confianza({ nivel, conPalabra = false }: { nivel: Nivel; conPalabra?: boolean }) {
  return (
    <Badge variant={VARIANTE_NIVEL[nivel]} size="sm">
      {conPalabra ? `Confiabilidad ${nivel}` : enMayuscula(nivel)}
    </Badge>
  )
}

/** La cifra de la derecha de un bloque: cuántas filas trae y, si aplica, cuántas de cada confiabilidad. */
function Conteo({ texto, niveles }: { texto: string; niveles?: Partial<Record<Nivel, number>> }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Text as="span" size="xs" variant="muted" weight="medium">
        {texto}
      </Text>
      {niveles
        ? (['alta', 'media', 'baja'] as const).map((nivel) =>
            niveles[nivel] ? (
              <Hint key={nivel} label={`Confiabilidad ${nivel}`}>
                <Badge variant={VARIANTE_NIVEL[nivel]} size="sm" className="tabular-nums" tabIndex={0}>
                  {niveles[nivel]} {nivel}
                </Badge>
              </Hint>
            ) : null,
          )
        : null}
    </div>
  )
}

function Vacio({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" variant="muted" className="py-2">
      {children}
    </Text>
  )
}

/** Un dato del detalle de una fila: su nombre en gris y lo que dice. */
export function Dato({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text as="span" size="xs" variant="muted" weight="semibold">
        {nombre}
      </Text>
      <Text as="span" size="sm">
        {children}
      </Text>
    </div>
  )
}

/** Una fila que se abre sobre su detalle, con la flecha al final como en Comentarios y Profundidad. */
export function FilaDesplegable({ abierta, onAlternar, celdas, detalle, columnas, etiqueta }: { abierta: boolean; onAlternar: () => void; celdas: ReactNode; detalle: ReactNode; columnas: number; etiqueta: string }) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onAlternar}>
        {celdas}
        <TableCell className="w-10">
          <BotonIcono
            size="icon-xs"
            aria-expanded={abierta}
            aria-label={abierta ? `Ocultar el detalle de ${etiqueta}` : `Ver el detalle de ${etiqueta}`}
            onClick={(evento) => {
              evento.stopPropagation()
              onAlternar()
            }}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
          </BotonIcono>
        </TableCell>
      </TableRow>
      {abierta ? (
        <TableRow className="hover:bg-transparent">
          {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
          <TableCell colSpan={columnas} className="whitespace-normal!">
            <div className="flex flex-col gap-3 pb-2">{detalle}</div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

/** Qué filas están abiertas; arrancan abiertas las que se pidan. */
export function useAbiertas(iniciales: readonly string[] = []) {
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set(iniciales))
  const alternar = (id: string) => setAbiertas((actuales) => (actuales.has(id) ? new Set([...actuales].filter((otra) => otra !== id)) : new Set([...actuales, id])))
  return [abiertas, alternar] as const
}

export const Numero = ({ n }: { n: number }) => (
  <TableCell className="w-10 text-center tabular-nums">
    <Text as="span" size="xs" variant="muted" weight="semibold">
      {n}
    </Text>
  </TableCell>
)

/** El resumen de la IA, la primera tarjeta sobre el gris: un párrafo para leer, no una fila de cifras. */
export function ResumenGeneral({ texto, origen = 'Generado a partir de los resultados de esta medición' }: { texto: string; origen?: string }) {
  return (
    <FramePanel>
      <div className="flex flex-col gap-2">
        {/* Sin orbe propio: el marco «Lectura de la IA» ya dice que todo lo de adentro es de la IA. */}
        <div className="flex flex-wrap items-center gap-2">
          <Text as="span" size="base" weight="bold" className="flex-1">
            Resumen general
          </Text>
          <Text as="span" size="xs" variant="muted">
            {origen}
          </Text>
        </div>
        <Text as="p" size="sm" className="text-pretty">
          {texto}
        </Text>
      </div>
    </FramePanel>
  )
}

/** Hallazgos, riesgos o qué hacer: cada lectura en una fila que se abre sobre su explicación y su evidencia. */
export function GrupoLecturas({ id, numero: n, titulo, pregunta, lecturas }: { id: string; numero: number; titulo: string; pregunta: string; lecturas: readonly SurveyInsight[] }) {
  const [abiertas, alternar] = useAbiertas(lecturas[0] ? [lecturas[0].id] : [])
  const niveles = Object.fromEntries(CONFIDENCE_ORDER.map((nivel) => [NIVEL[nivel], lecturas.filter((lectura) => lectura.confidence === nivel).length])) as Record<Nivel, number>
  return (
    <BloquePlegable id={id} numero={String(n)} titulo={titulo} subtitulo={enMayuscula(pregunta)} metrica={<Conteo texto={plural(lecturas.length, 'lectura', 'lecturas')} niveles={niveles} />}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Lectura de la IA</TableHead>
            <TableHead className="w-32">Confiabilidad</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Ver detalle</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lecturas.map((lectura, indice) => (
            <FilaDesplegable
              key={lectura.id}
              abierta={abiertas.has(lectura.id)}
              onAlternar={() => alternar(lectura.id)}
              columnas={4}
              etiqueta={lectura.title}
              celdas={
                <>
                  <Numero n={indice + 1} />
                  {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                  <TableCell className="whitespace-normal!">
                    <Text as="span" size="sm" weight="medium">
                      {lectura.title}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge variant={INSIGNIA_POR_TONO[CONFIDENCE_STYLES[lectura.confidence].tone]} size="sm">
                      {CONFIDENCE_STYLES[lectura.confidence].label}
                    </Badge>
                  </TableCell>
                </>
              }
              detalle={
                <>
                  <Text as="p" size="sm" className="text-pretty">
                    {lectura.body}
                  </Text>
                  <Dato nombre="Evidencia">{lectura.evidence}</Dato>
                </>
              }
            />
          ))}
        </TableBody>
      </Table>
    </BloquePlegable>
  )
}

export function Prioridades({ numero: n, prioridades, onIr }: { numero: number; prioridades: readonly Priority[]; onIr: (destino: AlertTarget) => void }) {
  const [abiertas, alternar] = useAbiertas(prioridades[0] ? [prioridades[0].finding.id] : [])
  const niveles = { alta: prioridades.filter((p) => p.confidence === 'alta').length, media: prioridades.filter((p) => p.confidence === 'media').length, baja: prioridades.filter((p) => p.confidence === 'baja').length }
  return (
    <BloquePlegable id="prioridades" numero={String(n)} titulo="Prioridades de esta medición" subtitulo="Qué atender primero, y con qué respaldo" metrica={<Conteo texto={plural(prioridades.length, 'prioridad', 'prioridades')} niveles={niveles} />}>
      {prioridades.length === 0 ? (
        <Vacio>Ningún bloque de la medición está por debajo del objetivo de {FAVORABILITY_TARGET} %. Sostener el resultado es la tarea de este periodo.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="w-28 text-right">Respuestas</TableHead>
              <TableHead className="w-32 text-right">Favorabilidad</TableHead>
              <TableHead className="w-32">Severidad</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Ver detalle</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prioridades.map((prioridad, indice) => (
              <FilaDesplegable
                key={prioridad.finding.id}
                abierta={abiertas.has(prioridad.finding.id)}
                onAlternar={() => alternar(prioridad.finding.id)}
                columnas={6}
                etiqueta={prioridad.finding.title}
                celdas={
                  <>
                    <Numero n={indice + 1} />
                    {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                    <TableCell className="whitespace-normal!">
                      <div className="flex flex-col">
                        <Text as="span" size="sm" weight="medium">
                          {prioridad.finding.title}
                        </Text>
                        <Text as="span" size="xs" variant="muted">
                          {prioridad.finding.parent}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{numero(prioridad.finding.n)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive-outline" size="sm" className="tabular-nums">
                        {formatPercent(prioridad.finding.favorability)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={SEVERIDAD[prioridad.severity].variante} size="sm">
                        {SEVERIDAD[prioridad.severity].etiqueta}
                      </Badge>
                    </TableCell>
                  </>
                }
                detalle={
                  <>
                    <Text as="p" size="sm" className="text-pretty">
                      {prioridad.why}
                    </Text>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {prioridad.evidence.map((evidencia) => (
                        <Dato key={evidencia.label} nombre={evidencia.label}>
                          {evidencia.detail}
                        </Dato>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Confianza nivel={prioridad.confidence} conPalabra />
                      {prioridad.qual ? (
                        <Badge variant="outline" size="sm">
                          <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
                          {plural(prioridad.qual.mentions, 'comentario', 'comentarios')} sobre {prioridad.qual.topic.toLowerCase()} · {Math.round(prioridad.qual.negativeShare)} % negativos
                        </Badge>
                      ) : null}
                      <Button variant="link" size="xs" onClick={() => onIr('favorability')}>
                        Ver en Favorabilidad
                        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                      </Button>
                    </div>
                  </>
                }
              />
            ))}
          </TableBody>
        </Table>
      )}
    </BloquePlegable>
  )
}

export function Fortalezas({ numero: n, fortalezas }: { numero: number; fortalezas: readonly Finding[] }) {
  return (
    <BloquePlegable id="fortalezas" numero={String(n)} titulo="Fortalezas para apalancar" subtitulo="En qué apoyarse para comunicar los cambios" metrica={<Conteo texto={plural(fortalezas.length, 'fortaleza', 'fortalezas')} />}>
      {fortalezas.length === 0 ? (
        <Vacio>Ningún bloque de la medición alcanza todavía el rango de fortaleza.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Fortaleza</TableHead>
              <TableHead className="w-28 text-right">Respuestas</TableHead>
              <TableHead className="w-32 text-right">Favorabilidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fortalezas.map((fortaleza, indice) => (
              <TableRow key={fortaleza.id}>
                <Numero n={indice + 1} />
                {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                <TableCell className="whitespace-normal!">
                  <div className="flex flex-col gap-1">
                    <Text as="span" size="sm" weight="medium">
                      {fortaleza.title}
                    </Text>
                    <div className="flex flex-wrap items-center gap-2">
                      <Text as="span" size="xs" variant="muted">
                        {indice === 0 ? 'El aspecto mejor evaluado de la medición' : fortaleza.parent}
                      </Text>
                      <Confianza nivel={confidenceFor(fortaleza.n)} conPalabra />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{numero(fortaleza.n)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={fortaleza.favorability >= FAVORABILITY_TARGET ? 'success-light' : 'warning-light'} size="sm" className="tabular-nums">
                    {formatPercent(fortaleza.favorability)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </BloquePlegable>
  )
}

function DetalleBrecha({ corte }: { corte: SegmentGaps }) {
  return (
    <>
      {corte.widest ? (
        <Item variant="muted" size="sm">
          <ItemContent className="gap-2">
            <Dato nombre="Mayor polarización">«{corte.widest.rowLabel}»</Dato>
            <div className="flex flex-wrap gap-6">
              <Dato nombre="Mínimo">
                {formatScore(corte.widest.min)} · {corte.widest.minLabel}
              </Dato>
              <Dato nombre="Máximo">
                {formatScore(corte.widest.max)} · {corte.widest.maxLabel}
              </Dato>
              <Dato nombre="Brecha">{formatScore(corte.widest.spread)} pts</Dato>
            </div>
          </ItemContent>
        </Item>
      ) : null}
      <Text as="p" size="sm" weight="semibold">
        Grupos rezagados frente al promedio ({formatScore(corte.average)})
      </Text>
      {corte.outliers.length === 0 ? (
        <Text size="sm" variant="muted">
          Ningún grupo de {corte.segment.label.toLowerCase()} se aparta negativamente del promedio.
        </Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="w-28 text-right">Respuestas</TableHead>
              <TableHead className="w-28 text-right">Diferencia</TableHead>
              <TableHead className="w-24 text-right">Promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corte.outliers.map(({ row, gap }, indice) => (
              <TableRow key={row.id}>
                <Numero n={indice + 1} />
                {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                <TableCell className="whitespace-normal!">{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {numero(row.completed)} de {numero(row.invited)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive-outline" size="sm" className="tabular-nums">
                    {gap < 0 ? '−' : '+'}
                    {formatScore(Math.abs(gap))}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.score === null ? '—' : formatScore(row.score)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}

// Los grupos sin muestra suficiente no aparecen (ni se cuentan): solo se lee lo que se puede mostrar. Sin brechas, el bloque
// no se pinta (quien lo usa lo omite); el vacío de abajo queda por si alguien lo llama igual (Elkin, 14-oct: IA-032 fuera).
export function Brechas({ numero: n, analisis }: { numero: number; analisis: readonly SegmentGaps[] }) {
  const [abiertas, alternar] = useAbiertas(analisis[0] ? [analisis[0].segment.key] : [])
  return (
    <BloquePlegable id="brechas" numero={String(n)} titulo="Brechas entre grupos" subtitulo="Dónde se concentra la diferencia" metrica={<Conteo texto={plural(analisis.length, 'corte', 'cortes')} />}>
      {analisis.length === 0 ? (
        <Vacio>Ningún corte demográfico separa a sus grupos lo suficiente como para reportarlo. Abre el mapa de calor en Favorabilidad para ver los números uno a uno.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Corte demográfico</TableHead>
              <TableHead className="w-28 text-right">Rezagados</TableHead>
              <TableHead className="w-24 text-right">Promedio</TableHead>
              <TableHead className="w-28 text-right">Brecha</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Ver detalle</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analisis.map((corte, indice) => (
              <Fragment key={corte.segment.key}>
                <FilaDesplegable
                  abierta={abiertas.has(corte.segment.key)}
                  onAlternar={() => alternar(corte.segment.key)}
                  columnas={6}
                  etiqueta={corte.segment.label}
                  celdas={
                    <>
                      <Numero n={indice + 1} />
                      {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                      <TableCell className="whitespace-normal!">
                        <div className="flex flex-col gap-1">
                          <Text as="span" size="sm" weight="medium">
                            {corte.segment.label}
                          </Text>
                          <div className="flex flex-wrap items-center gap-2">
                            <Confianza nivel={confidenceFor(corte.outliers[0]?.row.participation ?? 0)} conPalabra />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{corte.outliers.length === 0 ? '—' : corte.outliers.length}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatScore(corte.average)}</TableCell>
                      <TableCell className="text-right">
                        {corte.widest ? (
                          <Badge variant="warning-light" size="sm" className="tabular-nums">
                            {formatScore(corte.widest.spread)} pts
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </>
                  }
                  detalle={<DetalleBrecha corte={corte} />}
                />
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </BloquePlegable>
  )
}

export function VozDeLaGente({ numero: n, sentimiento }: { numero: number; sentimiento: SentimentRollup }) {
  const cita = sentimiento.worstQuote
  return (
    <BloquePlegable id="voz" numero={String(n)} titulo="Voz de los colaboradores" subtitulo="En qué palabras lo dijo la gente" metrica={<Conteo texto={plural(sentimiento.total, 'comentario', 'comentarios')} />}>
      {sentimiento.total === 0 ? (
        <Vacio>Esta medición no recogió respuestas a preguntas abiertas, así que no hay sentimiento que interpretar.</Vacio>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Text as="span" size="xs" variant="muted" weight="semibold">
              Distribución de sentimiento
            </Text>
            <div className="flex flex-wrap items-center gap-4">
              {SENTIMENT_ORDER.map((id) => (
                <div key={id} className="flex items-center gap-1.5">
                  <InsigniaSentimiento sentimiento={id} />
                  <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                    {parte(sentimiento.counts[id], sentimiento.total)} %
                  </Text>
                  <Text as="span" size="xs" variant="muted" className="tabular-nums">
                    {numero(sentimiento.counts[id])}
                  </Text>
                </div>
              ))}
            </div>
          </div>
          {sentimiento.topics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Temas que concentran lo negativo</TableHead>
                  <TableHead className="w-24 text-right">Positivo</TableHead>
                  <TableHead className="w-24 text-right">Neutral</TableHead>
                  <TableHead className="w-24 text-right">Coment.</TableHead>
                  <TableHead className="w-28 text-right">Negativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentimiento.topics.slice(0, 4).map((tema, indice) => (
                  <TableRow key={tema.topic}>
                    <Numero n={indice + 1} />
                    {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                    <TableCell className="whitespace-normal!">
                      <div className="flex flex-wrap items-center gap-2">
                        <Text as="span" size="sm" weight="medium">
                          {tema.topic}
                        </Text>
                        <Confianza nivel={confidenceFor(tema.total)} conPalabra />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{parte(tema.positive, tema.total)} %</TableCell>
                    <TableCell className="text-right tabular-nums">{parte(tema.neutral, tema.total)} %</TableCell>
                    <TableCell className="text-right tabular-nums">{numero(tema.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive-outline" size="sm" className="tabular-nums">
                        {parte(tema.negative, tema.total)} %
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          <div className="flex flex-col gap-2">
            <Text as="span" size="xs" variant="muted" weight="semibold">
              Comentario del tema más crítico
            </Text>
            {cita ? (
              <Item variant="muted" size="sm">
                <ItemContent className="gap-1.5">
                  <Text as="p" size="sm">
                    «{cita.text}»
                  </Text>
                  <ItemDescription>
                    {cita.anonymous ? 'Respuesta anónima' : cita.respondentName} · {cita.sectionNumbering} {cita.sectionTitle} · {cita.topic}
                  </ItemDescription>
                </ItemContent>
                <InsigniaSentimiento sentimiento="negative" />
              </Item>
            ) : (
              <Vacio>Sin un comentario negativo destacable en esta medición.</Vacio>
            )}
          </div>
        </>
      )}
    </BloquePlegable>
  )
}
