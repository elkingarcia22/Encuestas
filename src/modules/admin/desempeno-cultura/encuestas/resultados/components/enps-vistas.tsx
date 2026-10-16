import { Fragment, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, LockIcon, Message01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  cn,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { EncabezadoOrdenable } from '../../components/tabla-piezas'
import { npsBandForScore } from '../../modelo/favorabilityScale'
import { NPS_BAND_LABELS, NPS_BAND_ORDER, type NpsDepthBand, type NpsDepthQuestion, type NpsDepthSection } from '../../modelo/npsDepth'
import type { NpsBand, NpsQuestionDetail, NpsSectionDetail, NpsSegmentCell, NpsSegmentData, NpsSegmentRow } from '../../modelo/surveyResults'
import { ArbolResultados, contarPreguntas } from './arbol-resultados'
import { TotalOculto } from './controles'
import { COLOR_POR_TONO, FONDO_ESCALA, INSIGNIA_POR_TONO, TEXTO_ESCALA, conSigno, numero } from './escala'
import { nivelDe, type Nivel } from './filtros'
import { COLUMNA_FIJA, LineasGuia, SANGRIA } from './mapa-calor'

// Las tres vistas del eNPS. El puntaje es % promotores − % detractores, de −100 a +100
// (detractores 0 a 6, neutros 7 y 8, promotores 9 y 10).

const RESPUESTAS_VISIBLES = 8

const VARIANTE_BANDA: Record<NpsBand, 'success-light' | 'warning-light' | 'destructive-outline'> = {
  promoter: 'success-light',
  passive: 'warning-light',
  detractor: 'destructive-outline',
}

/** El puntaje con su color; al pasar, la mezcla de promotores, neutros y detractores. */
export function PuntajeNps({ puntaje, promotores, neutros, detractores, n, gris, conEtiqueta }: { puntaje: number; promotores: number; neutros: number; detractores: number; n: number; gris?: boolean; conEtiqueta?: boolean }) {
  const parte = (valor: number) => (n > 0 ? Math.round((valor / n) * 100) : 0)
  return (
    <Hint label={`Promotores ${parte(promotores)}% · Neutros ${parte(neutros)}% · Detractores ${parte(detractores)}% · ${numero(n)} respuestas`}>
      <span className="inline-flex items-center gap-1.5" tabIndex={0}>
        {conEtiqueta ? (
          <Text as="span" size="xs" variant="muted" weight="medium">
            eNPS
          </Text>
        ) : null}
        <Badge variant={gris ? 'secondary' : INSIGNIA_POR_TONO[npsBandForScore(puntaje).tone]} className="tabular-nums">
          {conSigno(puntaje)}
        </Badge>
      </span>
    </Hint>
  )
}

// Fuera del resaltado: el puntaje sigue ahí, en gris.
const apagado = (puntaje: number, resaltadas: ReadonlySet<string>) => resaltadas.size > 0 && !resaltadas.has(npsBandForScore(puntaje).id)

// Las columnas del reparto, como «Favorables · Neutrales · Desfav.» en Favorabilidad › Secciones.
const COLUMNAS_NPS: { id: NpsBand; corto: string; texto: string }[] = [
  { id: 'promoter', corto: 'Promotores', texto: 'text-success' },
  { id: 'passive', corto: 'Neutros', texto: 'text-warning' },
  { id: 'detractor', corto: 'Detractores', texto: 'text-destructive' },
]

type ConReparto = { promoters: number; passives: number; detractors: number }

// Sobre lo que de verdad se contó: ningún grupo baja de 0 aunque el dato venga descuadrado.
function partes({ promoters, passives, detractors }: ConReparto): Record<NpsBand, number> {
  const valores = { promoter: Math.max(0, promoters), passive: Math.max(0, passives), detractor: Math.max(0, detractors) }
  const total = valores.promoter + valores.passive + valores.detractor
  const parte = (valor: number) => (total > 0 ? Math.round((valor / total) * 100) : 0)
  return { promoter: parte(valores.promoter), passive: parte(valores.passive), detractor: parte(valores.detractor) }
}

function RepartoNps({ datos, gris }: { datos: ConReparto; gris: boolean }) {
  const valores = partes(datos)
  return (
    <div className="flex items-center justify-end gap-4">
      {COLUMNAS_NPS.map((columna) => (
        <Text key={columna.id} as="span" size="xs" weight="semibold" className={cn('w-16 text-right tabular-nums', gris ? 'text-muted-foreground' : columna.texto)}>
          {valores[columna.id]}%
        </Text>
      ))}
    </div>
  )
}

/** La cifra de cada sección: «eNPS» siempre a la vista; el reparto, al pasar por la cabecera (como en Favorabilidad). */
function TotalSeccionNps({ seccion, gris }: { seccion: NpsSectionDetail; gris: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className="hidden opacity-0 transition-opacity group-hover/cabecera:opacity-100 group-focus-within/cabecera:opacity-100 xl:block">
        <RepartoNps datos={seccion} gris={gris} />
      </div>
      <PuntajeNps puntaje={seccion.score} promotores={seccion.promoters} neutros={seccion.passives} detractores={seccion.detractors} n={seccion.n} gris={gris} conEtiqueta />
    </div>
  )
}

function TablaPreguntasNps({ preguntas, oculto, resaltadas }: { preguntas: readonly NpsQuestionDetail[]; oculto: boolean; resaltadas: ReadonlySet<string> }) {
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const ordenadas = useMemo(() => {
    if (!orden) return preguntas
    const signo = orden.startsWith('-') ? -1 : 1
    return [...preguntas].sort((a, b) => (orden.replace('-', '') === 'pregunta' ? a.text.localeCompare(b.text, 'es') : a.score - b.score) * signo)
  }, [preguntas, orden])
  const ordenar = (campo: string) => setOrden((previo) => (previo === campo ? `-${campo}` : previo === `-${campo}` ? undefined : campo))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>
            <EncabezadoOrdenable etiqueta="Pregunta" campo="pregunta" ordenActual={orden} onOrdenar={ordenar} />
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            <div className="flex justify-end gap-4">
              {COLUMNAS_NPS.map((columna) => (
                <span key={columna.id} className="w-16 text-right">
                  {columna.corto}
                </span>
              ))}
            </div>
          </TableHead>
          <TableHead className="w-28">
            <div className="flex justify-end">
              <EncabezadoOrdenable etiqueta="eNPS" campo="enps" ordenActual={orden} onOrdenar={ordenar} />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenadas.map((pregunta, indice) => {
          const gris = apagado(pregunta.score, resaltadas)
          return (
            <TableRow key={pregunta.id}>
              <TableCell className="text-center tabular-nums">
                <Text as="span" size="xs" variant="muted" weight="semibold">
                  {indice + 1}
                </Text>
              </TableCell>
              <TableCell className="whitespace-normal!">
                <Text as="span" size="sm" weight="medium" variant={gris ? 'muted' : 'default'}>
                  {pregunta.text}
                </Text>
              </TableCell>
              <TableCell className="hidden xl:table-cell">{oculto ? null : <RepartoNps datos={pregunta} gris={gris} />}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {oculto ? <TotalOculto /> : <PuntajeNps puntaje={pregunta.score} promotores={pregunta.promoters} neutros={pregunta.passives} detractores={pregunta.detractors} n={pregunta.n} gris={gris} />}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/** eNPS › Secciones: el puntaje sobre el árbol completo de la encuesta, con la misma forma que Favorabilidad › Secciones. */
export function SeccionesNps({
  secciones,
  niveles,
  resaltadas,
  filtrosActivos,
  onLimpiar,
}: {
  secciones: readonly NpsSectionDetail[]
  niveles: ReadonlySet<Nivel>
  resaltadas: ReadonlySet<string>
  // Cuántos filtros de población hay puestos y cómo quitarlos (para el vacío «Sin resultados»).
  filtrosActivos: number
  onLimpiar: () => void
}) {
  // Los vacíos del sistema, con ilustración (decisión 14): si los filtros dejaron todo fuera, «Sin resultados» con el
  // botón para quitarlos; sin filtros, es que todavía no hay respuestas de eNPS.
  if (secciones.length === 0) {
    return filtrosActivos > 0 ? (
      <SinResultados filtrosActivos={filtrosActivos} onLimpiar={onLimpiar} />
    ) : (
      <PrimeraVez icono="glass-chart" titulo="Todavía no hay respuestas de eNPS" descripcion="El puntaje por sección aparece aquí cuando alguien responda la pregunta de recomendación." />
    )
  }
  return (
    <ArbolResultados
      secciones={secciones}
      metrica={(seccion) => (!niveles.has(nivelDe(seccion.depth)) ? <TotalOculto /> : <TotalSeccionNps seccion={seccion} gris={apagado(seccion.score, resaltadas)} />)}
      preguntas={(seccion) => <TablaPreguntasNps preguntas={seccion.questions} oculto={!niveles.has('question')} resaltadas={resaltadas} />}
    />
  )
}

// Las clases de una celda del mapa: llena su casilla, con esquinas suaves y sin borde, como en Favorabilidad › Mapa de calor.
const CELDA = 'h-full min-h-8 w-full m-0 justify-center rounded-sm'

function CeldaSegmento({ celda, resaltadas, oculta = false }: { celda: NpsSegmentCell | null; resaltadas: ReadonlySet<string>; oculta?: boolean }) {
  if (oculta) {
    return (
      <Hint label="Resultados ocultos: marca este nivel en Personalizar.">
        <Badge variant="outline" className={CELDA} aria-label="Oculto" />
      </Hint>
    )
  }
  if (!celda || celda.n === 0) {
    return (
      <Hint label="Todavía nadie de este grupo ha respondido.">
        <Badge variant="outline" className={CELDA} aria-label="Sin respuestas">
          —
        </Badge>
      </Hint>
    )
  }
  // Un grupo bajo el mínimo dice «Reservado», nunca un 0.
  if (celda.belowThreshold) {
    return (
      <Hint label={`Reservado · ${numero(celda.n)} respuestas. Por debajo del mínimo para mostrar resultados de este grupo.`}>
        <Badge variant="secondary" className={CELDA} aria-label="Reservado">
          <HugeiconsIcon icon={LockIcon} aria-hidden="true" />
        </Badge>
      </Hint>
    )
  }
  const gris = apagado(celda.score, resaltadas)
  const tono = npsBandForScore(celda.score).tone
  return (
    <Hint label={`${numero(celda.n)} respuestas · promotores ${celda.n ? Math.round((celda.promoters / celda.n) * 100) : 0}% · detractores ${celda.n ? Math.round((celda.detractors / celda.n) * 100) : 0}%`}>
      <Badge variant={gris ? 'secondary' : 'outline'} className={cn(CELDA, 'tabular-nums !border-0')} style={gris ? undefined : { backgroundColor: FONDO_ESCALA[tono], color: TEXTO_ESCALA[tono] }}>
        {conSigno(celda.score)}
      </Badge>
    </Hint>
  )
}

/** El total de la fila: la cifra con su color, sin casilla, separada de los grupos por una línea (como el mapa de calor). */
function TotalFila({ celda, resaltadas, oculta }: { celda: NpsSegmentCell; resaltadas: ReadonlySet<string>; oculta: boolean }) {
  if (oculta) return <TotalOculto />
  if (celda.belowThreshold || celda.n === 0) return <TotalOculto />
  const gris = apagado(celda.score, resaltadas)
  return (
    <span className={cn('text-sm font-medium tabular-nums', gris && 'text-muted-foreground opacity-50')} style={gris ? undefined : { color: COLOR_POR_TONO[npsBandForScore(celda.score).tone] }}>
      {conSigno(celda.score)}
    </span>
  )
}

// Cada casilla de grupo llena el alto de la fila, como en el mapa de calor.
function CasillaGrupo({ children }: { children: React.ReactNode }) {
  return (
    <TableCell className="relative h-full min-w-16 p-0 !border-b-0">
      <div className="absolute inset-0 flex flex-col p-0.5 [&>*]:flex-1 [&_button]:h-full [&_button]:w-full">{children}</div>
    </TableCell>
  )
}

function FilaSegmento({ fila, profundidad, abiertas, onAlternar, niveles, resaltadas }: { fila: NpsSegmentRow; profundidad: number; abiertas: ReadonlySet<string>; onAlternar: (id: string) => void; niveles: ReadonlySet<Nivel>; resaltadas: ReadonlySet<string> }) {
  const esPregunta = fila.kind === 'question'
  const nivel: Nivel = esPregunta ? 'question' : nivelDe(profundidad)
  // Con «Preguntas» desmarcado en Personalizar, las filas de pregunta no se muestran.
  if (esPregunta && !niveles.has('question')) return null
  const hijas = [...(niveles.has('question') ? (fila.questions ?? []) : []), ...(fila.children ?? [])]
  const abierta = abiertas.has(fila.id)
  const visibleNivel = niveles.has(nivel)
  const raiz = profundidad === 1 && !esPregunta
  return (
    <>
      <TableRow className="group/fila h-[1px] border-transparent !border-b-0 has-aria-expanded:bg-transparent">
        <TableHead scope="row" className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 !border-b-0')}>
          <LineasGuia depth={profundidad} />
          <div className={cn('flex items-center gap-1.5 py-1 whitespace-normal', SANGRIA[Math.min(profundidad, SANGRIA.length) - 1])}>
            {hijas.length > 0 ? (
              <BotonIcono size="icon-xs" aria-expanded={abierta} aria-label={abierta ? `Contraer ${fila.title}` : `Expandir ${fila.title}`} onClick={() => onAlternar(fila.id)}>
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
              </BotonIcono>
            ) : (
              <span className="w-6 shrink-0" aria-hidden="true" />
            )}
            {esPregunta ? (
              <Text as="span" size="xs" variant="muted" className="shrink-0">
                •
              </Text>
            ) : null}
            <Text as="span" size={raiz ? 'sm' : 'xs'} weight={esPregunta ? 'normal' : raiz ? 'bold' : 'semibold'} className="min-w-0 flex-1">
              {fila.title}
            </Text>
          </div>
        </TableHead>
        <TableCell className="w-20 border-r border-border text-center !border-b-0">
          <TotalFila celda={fila.total} resaltadas={resaltadas} oculta={!visibleNivel} />
        </TableCell>
        {fila.cells.map((celda, indice) => (
          <CasillaGrupo key={indice}>
            <CeldaSegmento celda={celda} resaltadas={resaltadas} oculta={!visibleNivel} />
          </CasillaGrupo>
        ))}
      </TableRow>
      {abierta
        ? hijas.map((hija) => <FilaSegmento key={hija.id} fila={hija} profundidad={hija.kind === 'question' ? Math.min(profundidad + 1, 4) : profundidad + 1} abiertas={abiertas} onAlternar={onAlternar} niveles={niveles} resaltadas={resaltadas} />)
        : null}
    </>
  )
}

const subseccionesDe = (fila: NpsSegmentRow): string[] => (fila.children ?? []).flatMap((hija) => [hija.id, ...subseccionesDe(hija)])

/** eNPS › Por segmento: la grilla dimensión × grupo, con la forma del mapa de calor de Favorabilidad. El total ignora las celdas reservadas. */
export function SegmentoNps({ datos, niveles, resaltadas }: { datos: NpsSegmentData; niveles: ReadonlySet<Nivel>; resaltadas: ReadonlySet<string> }) {
  // Como el mapa de calor de Favorabilidad: la primera sección arranca abierta con todas sus subsecciones.
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => {
    const primera = datos.sectionRows[0]
    return new Set(primera ? [primera.id, ...subseccionesDe(primera)] : [])
  })
  const alternar = (id: string) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales)
      if (siguientes.has(id)) siguientes.delete(id)
      else siguientes.add(id)
      return siguientes
    })
  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(COLUMNA_FIJA, 'w-80 min-w-80 max-w-80 text-xs tracking-wider uppercase')}>Sección</TableHead>
            <TableHead className="w-20 border-r border-border text-center text-xs tracking-wider uppercase">Total</TableHead>
            {datos.columns.map((columna) => (
              <TableHead key={columna.id} className="min-w-16 px-0.5 py-2 text-center text-xs tracking-wider uppercase">
                <Hint label={columna.label}>
                  <span className="block max-w-20 truncate" tabIndex={0}>
                    {columna.label}
                  </span>
                </Hint>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="group/fila h-[1px] border-transparent !border-b-0 has-aria-expanded:bg-transparent">
            <TableHead scope="row" className={cn(COLUMNA_FIJA, '!border-b-0')}>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-6 shrink-0" aria-hidden="true" />
                <Text as="span" size="sm" weight="bold">
                  eNPS total
                </Text>
              </div>
            </TableHead>
            <TableCell className="w-20 border-r border-border text-center !border-b-0">
              <TotalFila celda={datos.totalRow.total} resaltadas={resaltadas} oculta={false} />
            </TableCell>
            {datos.totalRow.cells.map((celda, indice) => (
              <CasillaGrupo key={indice}>
                <CeldaSegmento celda={celda} resaltadas={resaltadas} />
              </CasillaGrupo>
            ))}
          </TableRow>
          {datos.sectionRows.map((fila) => (
            <Fragment key={fila.id}>
              <FilaSegmento fila={fila} profundidad={1} abiertas={abiertas} onAlternar={alternar} niveles={niveles} resaltadas={resaltadas} />
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const porcentajeEs = (valor: number) => `${valor.toFixed(1).replace('.', ',')}%`

// Lo que escribió una banda, en la misma lista con separadores que usa Preguntas › Comentarios.
function RespuestasBanda({ banda }: { banda: NpsDepthBand }) {
  const [todas, setTodas] = useState(false)
  const visibles = todas ? banda.answers : banda.answers.slice(0, RESPUESTAS_VISIBLES)
  const resto = banda.answers.length - RESPUESTAS_VISIBLES
  if (visibles.length === 0) {
    return (
      <Text size="sm" variant="muted" className="py-2">
        Nadie de esta banda escribió todavía.
      </Text>
    )
  }
  return (
    <div className="flex flex-col gap-1 py-1">
      <ItemGroup>
        {visibles.map((respuesta, indice) => (
          <Fragment key={respuesta.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Item size="sm">
              <ItemContent className="min-w-0 gap-1">
                <Text as="p" size="sm">
                  «{respuesta.text}»
                </Text>
                {respuesta.segment ? <ItemDescription>{respuesta.segment}</ItemDescription> : null}
              </ItemContent>
            </Item>
          </Fragment>
        ))}
      </ItemGroup>
      {resto > 0 ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setTodas((valor) => !valor)}>
          {todas ? 'Ver menos' : `Y ${numero(resto)} más (también en el Excel, hoja «Profundidad»)`}
        </Button>
      ) : null}
    </div>
  )
}

/** Una pregunta de escala con sus tres preguntas de profundidad, en tabla; cada fila abre lo que escribió esa banda. */
function PreguntaProfundidad({ pregunta }: { pregunta: NpsDepthQuestion }) {
  const bandas = NPS_BAND_ORDER.map((orden) => pregunta.bands.find((banda) => banda.band === orden)).filter((banda): banda is NpsDepthBand => Boolean(banda))
  const [abiertas, setAbiertas] = useState<ReadonlySet<NpsBand>>(() => new Set())
  const alternar = (id: NpsBand) => setAbiertas((actuales) => (actuales.has(id) ? new Set([...actuales].filter((otra) => otra !== id)) : new Set([...actuales, id])))
  const escritas = bandas.reduce((suma, banda) => suma + banda.answered, 0)
  return (
    <div className="flex flex-col gap-1 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Text as="p" size="sm" weight="semibold">
          {pregunta.statement}
        </Text>
        <Text as="span" size="xs" variant="muted" className="min-w-0 flex-1">
          {pregunta.formatLabel} · {numero(pregunta.n)} respuestas a la escala
        </Text>
        <Hint label={`${numero(escritas)} respuestas escritas`}>
          <Badge variant="outline" size="sm" className="tabular-nums" tabIndex={0}>
            <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
            {numero(escritas)}
          </Badge>
        </Hint>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pregunta de profundidad</TableHead>
            <TableHead className="w-24 text-right">Personas</TableHead>
            <TableHead className="w-28 text-right">Respondieron</TableHead>
            <TableHead className="w-24 text-right">Cobertura</TableHead>
            <TableHead className="w-32">
              <span className="sr-only">Banda</span>
            </TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Ver respuestas</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bandas.map((banda) => {
            const abierta = abiertas.has(banda.band)
            const etiqueta = NPS_BAND_LABELS[banda.band]
            return (
              <Fragment key={banda.band}>
                <TableRow className="cursor-pointer" onClick={() => alternar(banda.band)}>
                  <TableCell className="whitespace-normal!">
                    <Text as="span" size="sm" weight="medium" variant={banda.question ? 'default' : 'muted'}>
                      {banda.question || 'Sin pregunta escrita para esta banda'}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{numero(banda.people)}</TableCell>
                  <TableCell className="text-right tabular-nums">{numero(banda.answered)}</TableCell>
                  <TableCell className="text-right tabular-nums">{porcentajeEs(banda.coverage)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Badge variant={VARIANTE_BANDA[banda.band]}>{etiqueta}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <BotonIcono
                      size="icon-xs"
                      aria-expanded={abierta}
                      aria-label={abierta ? `Ocultar lo que escribieron los ${etiqueta.toLowerCase()}` : `Ver lo que escribieron los ${etiqueta.toLowerCase()}`}
                      onClick={(evento) => {
                        evento.stopPropagation()
                        alternar(banda.band)
                      }}
                    >
                      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
                    </BotonIcono>
                  </TableCell>
                </TableRow>
                {abierta ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="whitespace-normal!">
                      <RespuestasBanda banda={banda} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/** eNPS › Profundidad: lo que escribió cada banda en su pregunta de seguimiento. */
export function ProfundidadNps({ secciones }: { secciones: readonly NpsDepthSection[] }) {
  if (secciones.length === 0) {
    return (
      <PrimeraVez
        icono="glass-chat"
        titulo="Ninguna pregunta pidió profundidad"
        descripcion="Las preguntas de profundidad se activan en el editor, sobre una pregunta de escala: cada banda (detractores, neutros y promotores) recibe su propia pregunta abierta. Cuando alguna las tenga, sus respuestas se leen aquí."
      />
    )
  }
  return (
    <ArbolResultados
      secciones={secciones}
      subtitulo={(seccion) => {
        // Cuenta también las preguntas de sus subsecciones, como el subtítulo de las demás vistas.
        const total = contarPreguntas(seccion)
        const hijas = seccion.children.length
        return `${total} ${total === 1 ? 'pregunta con profundidad' : 'preguntas con profundidad'}${hijas > 0 ? ` · ${hijas} ${hijas === 1 ? 'subsección' : 'subsecciones'}` : ''}`
      }}
      preguntas={(seccion) => (
        <div className="flex flex-col divide-y">
          {seccion.questions.map((pregunta) => (
            <PreguntaProfundidad key={pregunta.id} pregunta={pregunta} />
          ))}
        </div>
      )}
    />
  )
}
