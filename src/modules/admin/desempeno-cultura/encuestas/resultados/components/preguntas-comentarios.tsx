import { Fragment, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  cn,
  Item,
  ItemContent,
  ItemFooter,
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
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { effectiveSentiment, type OpenComment, type Sentiment } from '../../modelo/questionResponses'
import { SENTIMENT_LABELS, pasaFiltros, type FiltrosComentarios } from '../../modelo/sentimiento'
import type { QuestionResult, SectionResult } from '../../modelo/surveyResults'
import { ArbolResultados } from './arbol-resultados'
import { TotalOculto } from './controles'
import { numero } from './escala'
import { nivelDe, type Nivel } from './filtros'
import { InsigniaSentimiento, SelectorSentimiento } from './sentimiento'
import { plural } from '@/modules/design-system/patrones/formato'

// Preguntas › Comentarios: todas las respuestas abiertas, cada una con la pregunta de la que viene,
// el sentimiento que le puso la IA, su confianza y su tema. El sentimiento se corrige a mano, y la
// corrección mueve el promedio de la tarjeta de arriba. En una encuesta anónima, filtrar por área
// no reduce la lista: los comentarios no llevan área, y se prefiere conservarlos a inventarles uno.

const POR_PREGUNTA = 8

// Solo las ramas que tienen comentarios que mostrar.
function podar(secciones: readonly SectionResult[], porPregunta: ReadonlyMap<string, readonly OpenComment[]>): SectionResult[] {
  return secciones
    .map((seccion) => ({ ...seccion, questions: seccion.questions.filter((pregunta) => porPregunta.has(pregunta.id)), children: podar(seccion.children, porPregunta) }))
    .filter((seccion) => seccion.questions.length > 0 || seccion.children.length > 0)
}

const juntar = (seccion: SectionResult, porPregunta: ReadonlyMap<string, readonly OpenComment[]>): OpenComment[] => [
  ...seccion.questions.flatMap((pregunta) => porPregunta.get(pregunta.id) ?? []),
  ...seccion.children.flatMap((hija) => juntar(hija, porPregunta)),
]

// Las columnas del reparto, como «Favorables · Neutrales · Desfav.» en Favorabilidad › Secciones.
const COLUMNAS: { id: Sentiment; corto: string; texto: string }[] = [
  { id: 'positive', corto: 'Positivo', texto: 'text-success' },
  { id: 'neutral', corto: 'Neutral', texto: 'text-warning' },
  { id: 'negative', corto: 'Negativo', texto: 'text-destructive' },
]

function contar(comentarios: readonly OpenComment[], correcciones: ReadonlyMap<string, Sentiment>): Record<Sentiment, number> {
  const cuentas: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 }
  for (const comentario of comentarios) cuentas[effectiveSentiment(comentario, correcciones)] += 1
  return cuentas
}

const porcentaje = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : 0)

function Reparto({ cuentas, total }: { cuentas: Record<Sentiment, number>; total: number }) {
  return (
    <div className="flex items-center justify-end gap-4">
      {COLUMNAS.map((columna) => (
        <Hint key={columna.id} label={`${columna.corto} · ${numero(cuentas[columna.id])} ${plural(cuentas[columna.id], 'comentario', 'comentarios')}`}>
          <Text as="span" size="xs" weight="semibold" className={cn('w-16 text-right tabular-nums', columna.texto)} tabIndex={0}>
            {porcentaje(cuentas[columna.id], total)} %
          </Text>
        </Hint>
      ))}
    </div>
  )
}

/** La cifra de cada sección: «Negativos» siempre a la vista; el reparto completo, al pasar por la cabecera. */
function TotalSeccion({ comentarios, correcciones }: { comentarios: readonly OpenComment[]; correcciones: ReadonlyMap<string, Sentiment> }) {
  const cuentas = contar(comentarios, correcciones)
  const negativos = porcentaje(cuentas.negative, comentarios.length)
  return (
    <div className="flex items-center gap-4">
      <div className="hidden opacity-0 transition-opacity group-hover/cabecera:opacity-100 group-focus-within/cabecera:opacity-100 xl:block">
        <Reparto cuentas={cuentas} total={comentarios.length} />
      </div>
      <div className="flex items-center gap-1.5">
        <Text as="span" size="xs" variant="muted" weight="medium">
          Negativos
        </Text>
        <Badge variant={negativos > 0 ? 'destructive-outline' : 'secondary'} size="sm" className="tabular-nums">
          {negativos} %
        </Badge>
      </div>
    </div>
  )
}

function Comentario({ comentario, correcciones, onCorregir, onDeshacer }: { comentario: OpenComment; correcciones: ReadonlyMap<string, Sentiment>; onCorregir: (id: string, sentimiento: Sentiment) => void; onDeshacer: (id: string) => void }) {
  const actual = effectiveSentiment(comentario, correcciones)
  const corregido = correcciones.has(comentario.id)
  return (
    <Item
      // Con un comentario largo, el contenido arriba: con el tema sin capa la clase solo gana con «!». Ficha: diferencias.json › instalacion-estilos-sin-capa.
      size="sm"
      className="items-start!"
    >
      <ItemContent className="min-w-0 gap-1.5">
        <Text as="p" size="sm">
          «{comentario.text}»
        </Text>
        <ItemFooter className="flex-wrap justify-start gap-2">
          <Text as="span" size="xs" variant="muted">
            {comentario.respondentName}
            {comentario.area ? ` · ${comentario.area}` : ''}
            {comentario.country ? ` · ${comentario.country}` : ''}
            {comentario.submittedLabel ? ` · ${comentario.submittedLabel}` : ''}
          </Text>
          <InsigniaSentimiento sentimiento={actual} />
          <Badge variant="outline" size="sm">
            {comentario.topic}
          </Badge>
          {corregido ? (
            <>
              <Badge variant="info-outline" size="sm">
                Corregido a mano
              </Badge>
              <Button variant="link" size="xs" onClick={() => onDeshacer(comentario.id)}>
                Volver a la lectura de la IA ({SENTIMENT_LABELS[comentario.aiSentiment].label})
              </Button>
            </>
          ) : null}
        </ItemFooter>
      </ItemContent>
      <SelectorSentimiento
        valor={actual}
        etiqueta={`Sentimiento del comentario de ${comentario.respondentName}`}
        onCambio={(nuevo) => (nuevo === comentario.aiSentiment ? onDeshacer(comentario.id) : onCorregir(comentario.id, nuevo))}
      />
    </Item>
  )
}

function ListaComentarios({ comentarios, correcciones, onCorregir, onDeshacer }: { comentarios: readonly OpenComment[]; correcciones: ReadonlyMap<string, Sentiment>; onCorregir: (id: string, sentimiento: Sentiment) => void; onDeshacer: (id: string) => void }) {
  const [todos, setTodos] = useState(false)
  const visibles = todos ? comentarios : comentarios.slice(0, POR_PREGUNTA)
  return (
    <div className="flex flex-col gap-1 py-1">
      <ItemGroup>
        {visibles.map((comentario, indice) => (
          <Fragment key={comentario.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Comentario comentario={comentario} correcciones={correcciones} onCorregir={onCorregir} onDeshacer={onDeshacer} />
          </Fragment>
        ))}
      </ItemGroup>
      {comentarios.length > POR_PREGUNTA ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setTodos((valor) => !valor)}>
          {todos ? 'Ver menos' : `Ver ${numero(comentarios.length - POR_PREGUNTA)} más`}
        </Button>
      ) : null}
    </div>
  )
}

/** Las preguntas abiertas de una sección, en tabla como las de Favorabilidad › Secciones; cada fila abre sus comentarios. */
function TablaComentarios({ preguntas, porPregunta, correcciones, oculto, onCorregir, onDeshacer }: { preguntas: readonly QuestionResult[]; oculto: boolean; porPregunta: ReadonlyMap<string, readonly OpenComment[]>; correcciones: ReadonlyMap<string, Sentiment>; onCorregir: (id: string, sentimiento: Sentiment) => void; onDeshacer: (id: string) => void }) {
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set(preguntas.slice(0, 1).map((pregunta) => pregunta.id)))
  const alternar = (id: string) => setAbiertas((actuales) => (actuales.has(id) ? new Set([...actuales].filter((otra) => otra !== id)) : new Set([...actuales, id])))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>Pregunta abierta</TableHead>
          <TableHead className="hidden xl:table-cell">
            <div className="flex justify-end gap-4">
              {COLUMNAS.map((columna) => (
                <span key={columna.id} className="w-16 text-right">
                  {columna.corto}
                </span>
              ))}
            </div>
          </TableHead>
          <TableHead className="w-28 text-right">Comentarios</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Ver comentarios</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {preguntas.map((pregunta, indice) => {
          const comentarios = porPregunta.get(pregunta.id) ?? []
          const abierta = abiertas.has(pregunta.id)
          return (
            <Fragment key={pregunta.id}>
              <TableRow className="cursor-pointer" onClick={() => alternar(pregunta.id)}>
                <TableCell className="text-center tabular-nums">
                  <Text as="span" size="xs" variant="muted" weight="semibold">
                    {indice + 1}
                  </Text>
                </TableCell>
                {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                <TableCell className="whitespace-normal!">
                  <Text as="span" size="sm" weight="medium">
                    {pregunta.statement || 'Pregunta sin enunciado'}
                  </Text>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{oculto ? null : <Reparto cuentas={contar(comentarios, correcciones)} total={comentarios.length} />}</TableCell>
                <TableCell className="text-right">
                  {/* Con «Preguntas» desmarcado en Niveles, la fila se queda pero sin sus cifras. */}
                  {oculto ? (
                    <TotalOculto />
                  ) : (
                    <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                      {numero(comentarios.length)}
                    </Text>
                  )}
                </TableCell>
                <TableCell>
                  <BotonIcono
                    size="icon-xs"
                    aria-expanded={abierta}
                    aria-label={abierta ? `Ocultar los comentarios de «${pregunta.statement}»` : `Ver los comentarios de «${pregunta.statement}»`}
                    onClick={(evento) => {
                      evento.stopPropagation()
                      alternar(pregunta.id)
                    }}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={cn('transition-transform', !abierta && '-rotate-90')} />
                  </BotonIcono>
                </TableCell>
              </TableRow>
              {abierta ? (
                <TableRow className="hover:bg-transparent">
                  {/* El texto largo se parte en varias líneas: la celda de la librería no deja cambiar su estilo sin «!». Ficha: diferencias.json › table-relleno-celdas-forzado. */}
                  <TableCell colSpan={5} className="whitespace-normal!">
                    <ListaComentarios comentarios={comentarios} correcciones={correcciones} onCorregir={onCorregir} onDeshacer={onDeshacer} />
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

type Props = {
  secciones: readonly SectionResult[]
  comentarios: readonly OpenComment[]
  correcciones: ReadonlyMap<string, Sentiment>
  filtros: FiltrosComentarios
  niveles: ReadonlySet<Nivel>
  foco: string | null
  onQuitarFoco: () => void
  onCorregir: (id: string, sentimiento: Sentiment) => void
  onDeshacer: (id: string) => void
  // Cuántos filtros de población hay puestos y cómo quitarlos (para el vacío «Sin resultados»).
  filtrosPoblacion: number
  onLimpiarPoblacion: () => void
  // Quita la búsqueda y los filtros de los comentarios.
  onLimpiarFiltros: () => void
}

export function PreguntasComentarios({ secciones, comentarios, correcciones, filtros, niveles, foco, onQuitarFoco, onCorregir, onDeshacer, filtrosPoblacion, onLimpiarPoblacion, onLimpiarFiltros }: Props) {
  const acotados = useMemo(() => (foco ? comentarios.filter((comentario) => comentario.questionId === foco) : comentarios), [comentarios, foco])
  const visibles = useMemo(() => acotados.filter((comentario) => pasaFiltros(comentario, filtros, correcciones)), [acotados, filtros, correcciones])
  const porPregunta = useMemo(() => {
    const grupos = new Map<string, OpenComment[]>()
    for (const comentario of visibles) grupos.set(comentario.questionId, [...(grupos.get(comentario.questionId) ?? []), comentario])
    return grupos as ReadonlyMap<string, readonly OpenComment[]>
  }, [visibles])
  const arbol = useMemo(() => podar(secciones, porPregunta), [secciones, porPregunta])

  // Los vacíos del sistema, con ilustración (decisión 14): si el filtro de población dejó todo fuera, «Sin resultados»
  // con el botón para quitarlo; si la encuesta no trae preguntas abiertas, «Primera vez».
  if (comentarios.length === 0) {
    return filtrosPoblacion > 0 ? (
      <SinResultados filtrosActivos={filtrosPoblacion} onLimpiar={onLimpiarPoblacion} />
    ) : (
      <PrimeraVez
        icono="glass-chat"
        titulo="Esta encuesta no tiene preguntas abiertas"
        descripcion="Los comentarios aparecen aquí cuando la encuesta incluye al menos una pregunta abierta. Agrega una en la próxima medición para recoger texto libre."
      />
    )
  }
  const filtrosActivos = filtros.temas.length + filtros.sentimientos.length + (filtros.soloCorregidos ? 1 : 0) + (foco ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      {foco && acotados[0] ? (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-2">
            Solo «{acotados[0].questionStatement}»
            <BotonIcono size="icon-xs" aria-label="Ver los comentarios de todas las preguntas" onClick={onQuitarFoco}>
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </BotonIcono>
          </AlertDescription>
        </Alert>
      ) : null}
      {arbol.length === 0 ? (
        <SinResultados
          filtrosActivos={filtrosActivos}
          onLimpiar={() => {
            onLimpiarFiltros()
            if (foco) onQuitarFoco()
          }}
        />
      ) : (
        <ArbolResultados
          key={`${foco ?? ''}-${filtros.temas.join('|')}-${filtros.sentimientos.join('|')}-${filtros.soloCorregidos}`}
          secciones={arbol}
          subtitulo={(seccion) => {
            const total = juntar(seccion, porPregunta).length
            return `${numero(total)} ${total === 1 ? 'comentario' : 'comentarios'}`
          }}
          metrica={(seccion) => (niveles.has(nivelDe(seccion.depth)) ? <TotalSeccion comentarios={juntar(seccion, porPregunta)} correcciones={correcciones} /> : null)}
          preguntas={(seccion) => <TablaComentarios preguntas={seccion.questions} porPregunta={porPregunta} correcciones={correcciones} oculto={!niveles.has('question')} onCorregir={onCorregir} onDeshacer={onDeshacer} />}
        />
      )}
    </div>
  )
}
