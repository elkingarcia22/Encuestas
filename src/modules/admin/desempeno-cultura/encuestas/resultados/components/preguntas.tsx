import { useMemo, useState } from 'react'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { DonaReparto } from '@/modules/design-system/graficos/piezas'
import { AnilloAvance } from '../../components/graficos'
import { PARTICIPANT_SCORE_LEGEND, formatPercent, tierForScore } from '../../modelo/favorabilityScale'
import { buildAnswerMatrix, buildOpenComments, buildQuestionBreakdowns, buildRespondents, effectiveSentiment, sentimentTotals, type Sentiment } from '../../modelo/questionResponses'
import {
  COMMENT_FILTER_KEYS,
  claveDemografico,
  SENTIMENT_LABELS,
  SENTIMENT_NEGATIVE_CEILING,
  SENTIMENT_ORDER,
  SENTIMENT_POSITIVE_FLOOR,
  SENTIMENT_WEIGHT,
  SIN_FILTROS_COMENTARIOS,
  commentMatchesFilters,
  sentimentAverage,
  type FiltrosComentarios,
} from '../../modelo/sentimiento'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { flattenResultSections, sectionResultsForFilters, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { SobreGris } from './arbol-resultados'
import { AvisoSinDemograficos } from './aviso-sin-demograficos'
import { Casilla, ChipsFiltro, Filtros, LeyendaEscala, PersonalizarFavorabilidad, Personalizar, SelectorVista, type OpcionEscala } from './controles'
import { numero } from './escala'
import { useFiltrosResultados, type FiltrosResultados } from './filtros'
import { PreguntasComentarios } from './preguntas-comentarios'
import { InsigniaSentimiento } from './sentimiento'
import { PreguntasPersonas, type Acotado } from './preguntas-personas'
import { PreguntasRecuentos } from './preguntas-recuentos'
import { TarjetaResumen } from './tarjeta-resumen'

// Preguntas: ¿qué respondió la gente, una por una? Tres vistas conectadas, y eso es lo que las hace
// una sola pantalla: desde el recuento de una opción se salta a las personas que la eligieron, y
// desde una pregunta abierta, a sus comentarios. Arriba, el sentimiento promedio de los comentarios,
// que se mueve cuando se corrige una lectura de la IA.

// Un área necesita al menos estos comentarios para entrar en «Área con más sentimiento negativo».
const MINIMO_COMENTARIOS_AREA = 3

type VistaPreguntas = 'recuentos' | 'personas' | 'comentarios'

const TITULO: Record<VistaPreguntas, string> = {
  recuentos: 'Detalle por secciones',
  personas: 'Respuestas por persona',
  comentarios: 'Comentarios',
}

const ESCALA_SENTIMIENTO: OpcionEscala[] = SENTIMENT_ORDER.map((id) => ({
  id,
  label: SENTIMENT_LABELS[id].label,
  range: SENTIMENT_LABELS[id].range,
  tone: id === 'positive' ? 'positive' : id === 'neutral' ? 'warning' : 'softer-negative',
}))

// Sin `segmento` la encuesta no recogió datos demográficos.
type Props = { borrador: SurveyDraft; resultados: SurveyResults; segmento?: SegmentDefinition; onSegmento: (clave: string) => void }

const alternarEn = <T,>(lista: readonly T[], valor: T): T[] => (lista.includes(valor) ? lista.filter((otro) => otro !== valor) : [...lista, valor])

// Sentimiento, tema y corregidos no son demográficos: van en «Personalizar», no en «Filtros». Como en «Por persona»:
// casillas con la insignia de color, varias a la vez; sin nada marcado salen todos.
function PersonalizarComentarios({
  estado,
  filtros,
  onFiltros,
  temas,
  cuentas,
  cuentasTema,
  corregidos,
}: {
  estado: FiltrosResultados
  filtros: FiltrosComentarios
  onFiltros: (filtros: FiltrosComentarios) => void
  temas: readonly string[]
  cuentas: Record<Sentiment, number>
  cuentasTema: ReadonlyMap<string, number>
  corregidos: number
}) {
  const activos = filtros.sentimientos.length + filtros.temas.length + (filtros.soloCorregidos ? 1 : 0)
  return (
    <Personalizar estado={estado} escala={[]} resaltadas={new Set()} onResaltar={() => undefined} onRestablecerResaltado={() => undefined} ajustesResaltado={0} ajustesExtra={activos}>
      <PopoverHeader>
        <PopoverTitle>Mostrar por sentimiento</PopoverTitle>
        <PopoverDescription>Muestra solo los comentarios de los sentimientos marcados. Sin marcar, salen todos.</PopoverDescription>
      </PopoverHeader>
      <div className="flex flex-col gap-2">
        {SENTIMENT_ORDER.map((id) => (
          <Casilla key={id} id={`comentarios-sentimiento-${id}`} marcada={filtros.sentimientos.includes(id)} onCambio={() => onFiltros({ ...filtros, sentimientos: alternarEn(filtros.sentimientos, id) })}>
            <InsigniaSentimiento sentimiento={id} />
            <Text as="span" size="xs" variant="muted" className="tabular-nums">
              {numero(cuentas[id])}
            </Text>
          </Casilla>
        ))}
      </div>
      {temas.length > 0 ? (
        <>
          <Separator />
          <PopoverHeader>
            <PopoverTitle>Mostrar por tema</PopoverTitle>
            <PopoverDescription>Puedes marcar varios temas a la vez.</PopoverDescription>
          </PopoverHeader>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {temas.map((tema) => (
              <Casilla key={tema} id={`comentarios-tema-${tema}`} marcada={filtros.temas.includes(tema)} onCambio={() => onFiltros({ ...filtros, temas: alternarEn(filtros.temas, tema) })}>
                {tema}
                <Text as="span" size="xs" variant="muted" className="tabular-nums">
                  {numero(cuentasTema.get(tema) ?? 0)}
                </Text>
              </Casilla>
            ))}
          </div>
        </>
      ) : null}
      <Separator />
      <div className="flex flex-col gap-2">
        <Casilla id="comentarios-corregidos" marcada={filtros.soloCorregidos} onCambio={() => onFiltros({ ...filtros, soloCorregidos: !filtros.soloCorregidos })}>
          Solo los corregidos a mano
          <Text as="span" size="xs" variant="muted" className="tabular-nums">
            {numero(corregidos)}
          </Text>
        </Casilla>
        {activos > 0 ? (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => onFiltros(SIN_FILTROS_COMENTARIOS)}>
            Restablecer
          </Button>
        ) : null}
      </div>
    </Personalizar>
  )
}

export function Preguntas({ borrador, resultados, segmento, onSegmento }: Props) {
  const [vista, setVista] = useState<VistaPreguntas>('recuentos')
  const [acotado, setAcotado] = useState<Acotado | null>(null)
  // Por persona: los niveles de promedio que se muestran; vacío es «todas».
  const [favorabilidad, setFavorabilidad] = useState<ReadonlySet<string>>(() => new Set())
  const [foco, setFoco] = useState<string | null>(null)
  const [correcciones, setCorrecciones] = useState<ReadonlyMap<string, Sentiment>>(() => new Map())
  const [filtrosComentarios, setFiltrosComentarios] = useState<FiltrosComentarios>(SIN_FILTROS_COMENTARIOS)

  const segmentos = resultados.segments.filter((opcion) => !opcion.perPerson)
  const activo = segmentos.find((opcion) => opcion.key === segmento?.key) ?? segmentos[0] ?? segmento
  // Sin datos demográficos todo se lee en total: sin filtros ni «Área con más sentimiento negativo».
  const sinDemograficos = segmentos.length === 0
  const estado = useFiltrosResultados(activo, segmentos, onSegmento)

  const secciones = useMemo(() => sectionResultsForFilters(resultados, estado.filtros), [resultados, estado.filtros])
  const recuentos = useMemo(() => buildQuestionBreakdowns(borrador, { ...resultados, sections: secciones }), [borrador, resultados, secciones])
  const personas = useMemo(() => buildRespondents(borrador, resultados), [borrador, resultados])
  const matriz = useMemo(() => buildAnswerMatrix(personas, recuentos), [personas, recuentos])
  const comentarios = useMemo(() => buildOpenComments(borrador, { ...resultados, sections: secciones }, personas), [borrador, resultados, secciones, personas])
  // Los comentarios se estrechan por lo que llevan (área y país) y por quien los escribió (líder, edad y género).
  const personaPorId = useMemo(() => new Map(personas.map((persona) => [persona.id, persona])), [personas])
  const comentariosPoblacion = useMemo(
    () => comentarios.filter((comentario) => commentMatchesFilters(comentario, estado.filtros, segmentos, personaPorId.get(comentario.respondentId) ?? null)),
    [comentarios, estado.filtros, segmentos, personaPorId],
  )
  const segmentosComentarios = segmentos.filter((opcion) => COMMENT_FILTER_KEYS.includes(claveDemografico(opcion.key)))

  const cuentas = useMemo(() => sentimentTotals(comentariosPoblacion, correcciones), [comentariosPoblacion, correcciones])
  const sentimiento = sentimentAverage(cuentas)
  const temas = useMemo(() => [...new Set(comentariosPoblacion.map((comentario) => comentario.topic))].sort(), [comentariosPoblacion])
  const cuentasTema = useMemo(() => {
    const porTema = new Map<string, number>()
    for (const comentario of comentariosPoblacion) porTema.set(comentario.topic, (porTema.get(comentario.topic) ?? 0) + 1)
    return porTema
  }, [comentariosPoblacion])
  const corregidos = comentariosPoblacion.filter((comentario) => correcciones.has(comentario.id)).length

  const totales = useMemo(() => {
    let preguntas = 0
    let respuestas = 0
    for (const seccion of flattenResultSections(secciones)) {
      preguntas += seccion.questions.length
      for (const pregunta of seccion.questions) respuestas += pregunta.n + pregunta.nsnr
    }
    return { preguntas, respuestas }
  }, [secciones])
  const posibles = resultados.participation.invited * totales.preguntas

  // Las tres secciones donde más pesa lo negativo.
  // Las tres áreas donde más pesa lo negativo. Un área es una agrupación: aun en una encuesta anónima se puede contar,
  // siempre que tenga al menos el mínimo de anonimato de la encuesta (como el mapa de calor); el área nunca se muestra
  // junto a un comentario. Con muy pocos comentarios tampoco entra: uno solo negativo la pondría primera.
  const minimoArea = Math.max(MINIMO_COMENTARIOS_AREA, borrador.visibility === 'anonymous' ? resultados.threshold : 0)
  const negativas = useMemo(() => {
    const grupos = new Map<string, { negativos: number; total: number }>()
    for (const comentario of comentariosPoblacion) {
      const grupo = grupos.get(comentario.groupArea) ?? { negativos: 0, total: 0 }
      grupos.set(comentario.groupArea, { total: grupo.total + 1, negativos: grupo.negativos + (effectiveSentiment(comentario, correcciones) === 'negative' ? 1 : 0) })
    }
    return [...grupos.entries()]
      .filter(([, grupo]) => grupo.total >= minimoArea)
      .map(([area, grupo]) => ({ id: area, etiqueta: area, valor: (grupo.negativos / grupo.total) * 100 }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3)
  }, [comentariosPoblacion, correcciones, minimoArea])


  const aPersonas = (pregunta: string, opcion: string) => {
    setAcotado({ pregunta, opcion })
    setVista('personas')
  }
  const aComentarios = (pregunta: string) => {
    setFoco(pregunta)
    setVista('comentarios')
  }
  const corregir = (id: string, nuevo: Sentiment) => setCorrecciones((actuales) => new Map(actuales).set(id, nuevo))
  const deshacer = (id: string) =>
    setCorrecciones((actuales) => {
      const siguientes = new Map(actuales)
      siguientes.delete(id)
      return siguientes
    })

  const cuentasPorTier = useMemo(() => {
    const cuentas: Record<string, number> = { favorable: 0, neutral: 0, unfavorable: 0 }
    personas.forEach((persona) => {
      if (persona.score !== null) cuentas[tierForScore(persona.score).id] += 1
    })
    return cuentas
  }, [personas])
  const cuenta = vista === 'recuentos' ? totales.preguntas : vista === 'personas' ? personas.length : comentariosPoblacion.length

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Sentimiento promedio"
        ayuda={`Cada comentario vale ${SENTIMENT_WEIGHT.positive} si es positivo, ${SENTIMENT_WEIGHT.neutral} si es neutral y ${SENTIMENT_WEIGHT.negative} si es negativo. El promedio se lee como Positivo desde ${SENTIMENT_POSITIVE_FLOOR}, Negativo hasta ${SENTIMENT_NEGATIVE_CEILING} y Neutral entre los dos. Las correcciones que hagas a una lectura de la IA entran en el cálculo.`}
        cifra={sentimiento.index === null ? '—' : String(Math.round(sentimiento.index))}
        lectura={SENTIMENT_LABELS[sentimiento.type].label}
        pie={`${numero(cuentas.positive)} positivos · ${numero(cuentas.neutral)} neutrales · ${numero(cuentas.negative)} negativos`}
        grafico={
          <DonaReparto
            etiqueta="Comentarios por sentimiento"
            tamano={48}
            segmentos={[
              { id: 'positive', etiqueta: 'Positivos', valor: cuentas.positive, color: 'var(--success)' },
              { id: 'neutral', etiqueta: 'Neutrales', valor: cuentas.neutral, color: 'var(--warning)' },
              { id: 'negative', etiqueta: 'Negativos', valor: cuentas.negative, color: 'var(--destructive)' },
            ]}
          />
        }
        tituloAnillos="Resumen de respuestas"
        totalAnillos={`${numero(totales.preguntas)} preguntas`}
        graficoReparto={
          <AnilloAvance
            valor={posibles > 0 ? (totales.respuestas / posibles) * 100 : 0}
            color="var(--success)"
            etiqueta="Respuestas de las posibles"
            texto={`${numero(totales.respuestas)} de ${numero(posibles)}`}
            tamano={48}
          />
        }
        anillos={[]}
        pieAnillos={`${numero(totales.respuestas)} de ${numero(posibles)} respuestas posibles · ${numero(personas.length)} ${personas.length === 1 ? 'persona' : 'personas'}`}
        tituloTop={sinDemograficos ? undefined : 'Área con más sentimiento negativo'}
        top={negativas.map((fila) => ({ ...fila, texto: formatPercent(fila.valor) }))}
        // Como el detalle de «Estado de los invitados»: cada área con su porcentaje de comentarios negativos.
        pieTop={negativas.length > 0 ? negativas.map((fila) => `${fila.etiqueta} ${formatPercent(fila.valor)}`).join(' · ') : undefined}
        sinTop="Ningún área llega al mínimo de comentarios todavía"
      />

            <div className="flex flex-col gap-4">
      {sinDemograficos ? <AvisoSinDemograficos /> : null}
      <Frame spacing="sm" className="[--frame-gap:0px]">
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>{TITULO[vista]}</FrameTitle>
            <FrameDescription>
              {numero(cuenta)} {vista === 'recuentos' ? 'preguntas' : vista === 'personas' ? 'personas' : 'comentarios'}
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* La pastilla del cambio de vista, primer control de la cabecera (Elkin, 9-oct, como el comparativo). */}
            <SelectorVista
              valor={vista}
              onCambio={setVista}
              opciones={[
                { value: 'recuentos', label: 'Secciones' },
                { value: 'personas', label: 'Por persona' },
                { value: 'comentarios', label: 'Comentarios' },
              ]}
            />
            {vista === 'recuentos' ? (
              <>
                {sinDemograficos ? null : <Filtros estado={{ ...estado, filtrables: segmentos }} activo={{ key: '', label: 'las preguntas', preloaded: false, perPerson: false, options: [] }} />}
                <Personalizar estado={estado} escala={[]} resaltadas={new Set()} onResaltar={() => undefined} onRestablecerResaltado={() => undefined} ajustesResaltado={0} />
              </>
            ) : null}
            {vista === 'personas' && personas.some((persona) => persona.score !== null) ? (
              <PersonalizarFavorabilidad
                escala={PARTICIPANT_SCORE_LEGEND}
                marcadas={favorabilidad}
                cuentas={cuentasPorTier}
                onAlternar={(id) => setFavorabilidad((actuales) => (actuales.has(id) ? new Set([...actuales].filter((otro) => otro !== id)) : new Set([...actuales, id])))}
                onLimpiar={() => setFavorabilidad(new Set())}
                descripcion="Muestra solo a quienes tienen su promedio en los niveles marcados. Sin marcar, salen todas."
              />
            ) : null}
            {vista === 'comentarios' ? (
              <>
                {segmentosComentarios.length > 0 ? <Filtros estado={{ ...estado, filtrables: segmentosComentarios }} activo={{ key: '', label: 'los comentarios', preloaded: false, perPerson: false, options: [] }} /> : null}
                <PersonalizarComentarios estado={estado} filtros={filtrosComentarios} onFiltros={setFiltrosComentarios} temas={temas} cuentas={cuentas} cuentasTema={cuentasTema} corregidos={corregidos} />
              </>
            ) : null}
            {vista === 'personas' && personas.some((persona) => persona.score !== null) ? (
              <LeyendaEscala
                titulo="Promedio por participante"
                descripcion="El número junto a cada nombre es el promedio de sus respuestas (de 1 a 5), agrupado en tres niveles. Las preguntas abiertas y NS/NR no cuentan."
                escala={PARTICIPANT_SCORE_LEGEND}
              />
            ) : null}
            {vista === 'comentarios' ? (
              <LeyendaEscala titulo="Sentimiento" descripcion="La IA lee cada comentario como positivo, neutral o negativo. Puedes corregir su lectura con los botones de cada comentario." escala={ESCALA_SENTIMIENTO} />
            ) : null}
          </div>
        </FrameHeader>
        {vista !== 'personas' && estado.filtros.length > 0 ? (
          <FramePanel>
            <ChipsFiltro estado={estado} segmentos={segmentos} />
          </FramePanel>
        ) : null}
        {vista === 'personas' ? (
          <FramePanel>
            <PreguntasPersonas
              secciones={secciones}
              personas={personas}
              recuentos={recuentos}
              matriz={matriz}
              comentarios={comentarios}
              correcciones={correcciones}
              acotado={acotado}
              favorabilidad={favorabilidad}
              onQuitarAcotado={() => setAcotado(null)}
            />
          </FramePanel>
        ) : (
          <SobreGris>
            {vista === 'recuentos' ? (
              <PreguntasRecuentos secciones={secciones} recuentos={recuentos} niveles={estado.niveles} onPersonas={aPersonas} onComentarios={aComentarios} />
            ) : (
            <PreguntasComentarios
              secciones={secciones}
              comentarios={comentariosPoblacion}
              correcciones={correcciones}
              filtros={filtrosComentarios}
              niveles={estado.niveles}
              foco={foco}
              onQuitarFoco={() => setFoco(null)}
              onCorregir={corregir}
              onDeshacer={deshacer}
              filtrosPoblacion={estado.filtros.length}
              onLimpiarPoblacion={estado.limpiarFiltros}
              onLimpiarFiltros={() => setFiltrosComentarios(SIN_FILTROS_COMENTARIOS)}
            />
            )}
          </SobreGris>
        )}
      </Frame>
      </div>
    </div>
  )
}
