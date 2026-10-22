import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  Text,
} from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { AiThinking } from '@/shared/components/AiThinking'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { SinResultados } from '@/shared/components/SinResultados'
import { AnilloAvance } from '../../components/graficos'
import { formatPercent } from '../../modelo/favorabilityScale'
import { CONFIDENCE_LEGEND, CONFIDENCE_ORDER, CONFIDENCE_STYLES, type InsightConfidence } from '../../modelo/insightConfidence'
import { buildOpenComments, buildRespondents, type Sentiment } from '../../modelo/questionResponses'
import { SCOPE_ALL, analyseSegmentGaps, buildPriorities, buildStrengths, confidenceFor, defaultFindingLevel, findingsAtLevel, resolveScope, sentimentRollup, type AlertTarget, type SegmentGaps } from '../../modelo/summaryModel'
import { buildSurveyAnalysis, isEnpsOnly, type InsightKind } from '../../modelo/surveyInsights'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { npsBySegmentData, type SurveyResults } from '../../modelo/surveyResults'
import { fallaEnQA } from '../../modelo/surveyCasos'
import { FallaIa } from '../../components/falla-ia'
import { SobreGris } from './arbol-resultados'
import { Casilla, LeyendaEscala } from './controles'
import { INSIGNIA_POR_TONO, numero } from './escala'
import { Brechas, Fortalezas, GrupoLecturas, Prioridades, ResumenGeneral, VozDeLaGente } from './ia-secciones'
import { TarjetaResumen } from './tarjeta-resumen'

// Análisis con IA: cierra la lectura. Primero lo que afirma la IA (hallazgos, riesgos y qué hacer)
// y después la evidencia en la que se apoya: prioridades, fortalezas, brechas entre grupos y la voz
// de la gente, como un documento continuo. La pestaña entera es de IA: el orbe va en su nombre.

const KINDS: { id: InsightKind; titulo: string; pregunta: string; anillo: string; color: string }[] = [
  { id: 'finding', titulo: 'Hallazgos', pregunta: 'qué pasó en esta medición', anillo: 'Hallazgos', color: 'var(--primary)' },
  { id: 'risk', titulo: 'Riesgos', pregunta: 'qué está en juego si no se atiende', anillo: 'Riesgos', color: 'var(--destructive)' },
  { id: 'recommendation', titulo: 'Qué hacer', pregunta: 'por dónde abrir el plan', anillo: 'Acciones sugeridas', color: 'var(--success)' },
]

// Lo que va diciendo la IA mientras vuelve a leer la medición.
const PASOS_ENPS = ['Procesando respuestas y calculando el eNPS…', 'Separando promotores, neutros y detractores…', 'Comparando el eNPS por área…', 'Leyendo lo que piden los detractores…']
// «Prioridades de esta medición» y «Brechas entre grupos» quedan ocultos (Elkin, 15-oct). No se borran: para volver a
// mostrarlos basta con poner esto en true.
const MOSTRAR_PRIORIDADES_Y_BRECHAS = false

const PASOS = ['Procesando respuestas y calculando favorabilidad…', 'Identificando fortalezas y áreas de mejora…', 'Analizando brechas demográficas…', 'Leyendo comentarios y detectando sentimiento…']
const MS_PASO = 400

// Con menos respuestas que esto, o menos de esta parte de los invitados, la muestra es pequeña: una sola respuesta mueve
// varios puntos y las lecturas son preliminares (IA-033). Treinta es el piso habitual para leer porcentajes con algo de
// estabilidad; el 20 % evita sacar conclusiones de una minoría que respondió primero.
const MUESTRA_MINIMA = 30
const COBERTURA_MINIMA = 20

const EN_ESPANOL: Record<InsightConfidence, 'alta' | 'media' | 'baja'> = { high: 'alta', medium: 'media', low: 'baja' }

type Props = { borrador: SurveyDraft; resultados: SurveyResults; onIr: (destino: AlertTarget) => void }

// La confiabilidad no es un demográfico: va en «Personalizar», con casillas e insignias de color como en las demás pestañas.
function PersonalizarConfiabilidad({ niveles, onCambio, cuentas }: { niveles: ReadonlySet<InsightConfidence>; onCambio: (niveles: ReadonlySet<InsightConfidence>) => void; cuentas: Record<InsightConfidence, number> }) {
  const apagados = CONFIDENCE_ORDER.length - niveles.size
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={SlidersHorizontalIcon} aria-hidden="true" />
        Personalizar
        {apagados > 0 ? (
          <Badge size="xs" className="tabular-nums">
            {apagados}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Confiabilidad de la lectura</PopoverTitle>
          <PopoverDescription>Deja solo las lecturas de la confiabilidad que quieras revisar.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-2">
          {CONFIDENCE_ORDER.map((nivel) => (
            <Casilla
              key={nivel}
              id={`confianza-${nivel}`}
              marcada={niveles.has(nivel)}
              onCambio={() => onCambio(niveles.has(nivel) ? new Set([...niveles].filter((otro) => otro !== nivel)) : new Set([...niveles, nivel]))}
            >
              <Badge variant={INSIGNIA_POR_TONO[CONFIDENCE_STYLES[nivel].tone]} size="sm">
                {CONFIDENCE_STYLES[nivel].label}
              </Badge>
              <Text as="span" size="xs" variant="muted" className="tabular-nums">
                {numero(cuentas[nivel])}
              </Text>
            </Casilla>
          ))}
          {apagados > 0 ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => onCambio(new Set(CONFIDENCE_ORDER))}>
              Restablecer
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AnalisisIa({ borrador, resultados, onIr }: Props) {
  const [niveles, setNiveles] = useState<ReadonlySet<InsightConfidence>>(() => new Set(CONFIDENCE_ORDER))
  const [analizando, setAnalizando] = useState(false)
  const [avance, setAvance] = useState(0)
  // Con la encuesta de prueba que falla (fallaEnQA), «Re-analizar» no termina (IA-031): la pestaña queda en el vacío de falla
  // de la IA, sin nada de lo que ella hizo (ni la lectura anterior ni sus cifras), y «Reintentar» lo vuelve a pedir.
  const falla = fallaEnQA(useParams().id)
  const [fallo, setFallo] = useState(false)
  const reloj = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(reloj.current), [])

  const analisis = useMemo(() => buildSurveyAnalysis(resultados), [resultados])
  // Una encuesta de eNPS no tiene favorabilidad: su lectura sale del eNPS, y no lleva prioridades, fortalezas ni brechas
  // (las tres se calculan sobre la favorabilidad). El top son las áreas más detractoras, como en la pestaña eNPS.
  const soloEnps = isEnpsOnly(resultados)
  const detractoras = useMemo(() => {
    if (!soloEnps) return []
    const area = resultados.segments.find((opcion) => opcion.key === 'area') ?? resultados.segments.find((opcion) => !opcion.perPerson)
    if (!area) return []
    const datos = npsBySegmentData(resultados, area)
    return datos.columns
      .map((columna, indice) => ({ columna, celda: datos.totalRow.cells[indice] }))
      .filter((fila) => fila.celda !== null && !fila.celda.belowThreshold && fila.celda.n > 0)
      .sort((a, b) => (a.celda?.score ?? 0) - (b.celda?.score ?? 0))
      .slice(0, 3)
      .map(({ columna, celda }) => ({ id: columna.id, etiqueta: columna.label, valor: Math.max(0, Math.min(100, (100 - (celda?.score ?? 0)) / 2)), texto: `${(celda?.score ?? 0) > 0 ? '+' : ''}${Math.round(celda?.score ?? 0)}` }))
  }, [soloEnps, resultados])
  // Las tres secciones con mayor foco accionable (las de menor favorabilidad, con su porcentaje no favorable) o, en eNPS,
  // las tres áreas más detractoras.
  const focos = soloEnps
    ? detractoras
    : [...resultados.sections]
        .filter((seccion) => seccion.n > 0)
        .sort((a, b) => a.favorability - b.favorability)
        .slice(0, 3)
        .map((seccion) => ({ id: seccion.id, etiqueta: seccion.title, valor: 100 - seccion.favorability, texto: formatPercent(100 - seccion.favorability) }))
  const alcance = useMemo(() => resolveScope(resultados, SCOPE_ALL), [resultados])
  const hallazgos = useMemo(() => findingsAtLevel(alcance, defaultFindingLevel(alcance)), [alcance])
  const comentarios = useMemo(() => buildOpenComments(borrador, resultados, buildRespondents(borrador, resultados)), [borrador, resultados])
  const sentimiento = useMemo(() => sentimentRollup(comentarios, new Map<string, Sentiment>()), [comentarios])
  const permitidas = new Set([...niveles].map((nivel) => EN_ESPANOL[nivel]))

  const prioridades = useMemo(() => buildPriorities(hallazgos, sentimiento.topics), [hallazgos, sentimiento.topics]).filter((prioridad) => permitidas.has(prioridad.confidence))
  const fortalezas = useMemo(() => buildStrengths(hallazgos), [hallazgos]).filter((fortaleza) => permitidas.has(confidenceFor(fortaleza.n)))
  const brechas = useMemo(
    () =>
      resultados.segments
        .filter((segmento) => !segmento.perPerson)
        .map((segmento) => analyseSegmentGaps(segmento, resultados, []))
        .filter((corte): corte is SegmentGaps => corte !== null),
    [resultados],
  ).filter((corte) => permitidas.has(confidenceFor(corte.outliers[0]?.row.participation ?? 0)))
  const voz = { ...sentimiento, topics: sentimiento.topics.filter((tema) => permitidas.has(confidenceFor(tema.total))) }

  const grupos = KINDS.map((tipo) => ({
    ...tipo,
    lecturas: analisis.insights.filter((lectura) => lectura.kind === tipo.id && niveles.has(lectura.confidence)),
  })).filter((grupo) => grupo.lecturas.length > 0)

  const total = analisis.insights.length
  const porTipo = (tipo: InsightKind) => analisis.insights.filter((lectura) => lectura.kind === tipo).length
  const porNivel = Object.fromEntries(CONFIDENCE_ORDER.map((nivel) => [nivel, analisis.insights.filter((lectura) => lectura.confidence === nivel).length])) as Record<InsightConfidence, number>
  const solidas = total > 0 ? Math.round((porNivel.high / total) * 100) : 0
  const visibles = grupos.reduce((suma, grupo) => suma + grupo.lecturas.length, 0)

  // Mientras se reintenta tras una falla no se vuelve a pintar la lectura anterior: `fallo` solo se apaga si el análisis sale.
  const reanalizar = () => {
    setAnalizando(true)
    setAvance(0)
    window.clearInterval(reloj.current)
    reloj.current = window.setInterval(() => {
      setAvance((previo) => {
        const siguiente = Math.min(100, previo + 12)
        if (siguiente >= 100) {
          window.clearInterval(reloj.current)
          window.setTimeout(() => {
            setAnalizando(false)
            setFallo(falla)
          }, 500)
        }
        return siguiente
      })
    }, MS_PASO / 2)
  }
  const pasos = soloEnps ? PASOS_ENPS : PASOS
  const paso = pasos[Math.min(pasos.length - 1, Math.floor(avance / 25))]

  const { completed: respondidas, invited: invitados } = resultados.participation
  const cobertura = invitados > 0 ? (respondidas / invitados) * 100 : 0
  const muestraPequena = respondidas > 0 && (respondidas < MUESTRA_MINIMA || cobertura < COBERTURA_MINIMA)
  // Las brechas solo se cuentan si hay alguna que mostrar: sin brechas (o sin grupos con muestra suficiente) el bloque no va.
  const conBrechas = MOSTRAR_PRIORIDADES_Y_BRECHAS && !soloEnps && brechas.length > 0
  // Numeración de los bloques que siguen a las lecturas: Fortalezas, (Brechas) y la voz de la gente.
  const despues = grupos.length + (MOSTRAR_PRIORIDADES_Y_BRECHAS ? 1 : 0)

  if (fallo)
    return (
      <Frame spacing="sm">
        <FrameHeader>
          <div className="flex items-center gap-2">
            <IconoIA />
            <FrameTitle>Lectura de la IA</FrameTitle>
          </div>
        </FrameHeader>
        <FramePanel>
          {analizando ? (
            <div className="flex flex-col gap-3 py-4">
              <AiThinking label={paso} />
              <Progress value={avance} aria-label="Avance del análisis" />
            </div>
          ) : (
            <FallaIa titulo="No pudimos completar el análisis" descripcion="La IA no respondió. Vuelve a intentarlo en un momento." onReintentar={reanalizar} />
          )}
        </FramePanel>
      </Frame>
    )

  return (
    <div className="flex flex-col gap-6">
      {muestraPequena ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>Muestra pequeña: lecturas preliminares</AlertTitle>
          <AlertDescription>
            Respondieron {numero(respondidas)} de {numero(invitados)} invitados ({formatPercent(cobertura)}). Con menos de {MUESTRA_MINIMA} respuestas o menos del {COBERTURA_MINIMA} % de los invitados, una sola respuesta mueve mucho los porcentajes: toma estas lecturas como indicios y confírmalas cuando haya más respuestas.
          </AlertDescription>
        </Alert>
      ) : null}
      <TarjetaResumen
        titulo="Lecturas de la IA"
        ayuda="Cuántas lecturas hizo la IA sobre esta medición y de qué tipo. Cada una viaja con la cifra que la sostiene: alta viene de un número de la medición; media es una interpretación razonable; baja es un indicio que conviene confirmar."
        cifra={numero(total)}
                pie={`${formatPercent(solidas)} con confiabilidad alta`}
        tituloAnillos="Qué contiene la lectura"
        totalAnillos={`${numero(total)} en total`}
        anillos={KINDS.map((tipo) => ({
          id: tipo.id,
          etiqueta: tipo.anillo,
          porcentaje: Math.round((porTipo(tipo.id) / Math.max(total, 1)) * 100),
          color: tipo.color,
          cantidad: numero(porTipo(tipo.id)),
        }))}
        tituloTop={soloEnps ? 'Área más detractora' : 'Sección con mayor foco accionable'}
        top={focos}
        // Como el detalle de «Estado de los invitados» en Participación: cada sección (o área) con su cifra.
        pieTop={focos.length > 0 ? focos.map((foco) => `${foco.etiqueta} ${foco.texto}`).join(' · ') : undefined}
        grafico={<AnilloAvance valor={solidas} color="var(--primary)" etiqueta="Confiabilidad alta" tamano={48} />}
      />

      {/* Como Favorabilidad › Secciones: un marco con sus controles y, sobre el gris, el resumen y los bloques plegables. */}
      <Frame spacing="sm" className="[--frame-gap:0px]">
        {/* Cabecera del marco en fila (título a la izquierda, controles a la derecha): con el tema sin capa solo obedece con «!». Ficha: diferencias.json › instalacion-estilos-sin-capa. */}
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <div className="flex items-center gap-2">
              <IconoIA />
              <FrameTitle>Lectura de la IA</FrameTitle>
              <Badge variant="secondary" size="sm" className="tabular-nums">
                {visibles}
              </Badge>
            </div>
            <FrameDescription>
              {visibles} de {total} lecturas
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PersonalizarConfiabilidad niveles={niveles} onCambio={setNiveles} cuentas={porNivel} />
            <BotonIaSecundario size="sm" onClick={reanalizar} disabled={analizando}>
              {analizando ? 'Analizando…' : 'Re-analizar'}
            </BotonIaSecundario>
            {/* La leyenda cierra la fila, como en las demás pestañas: la insignia dice el nivel y el texto, qué significa. */}
            <LeyendaEscala
              titulo="Confiabilidad de la lectura"
              descripcion="Cada lectura dice qué tan directa es la cifra en la que se apoya. Alta viene de un número de la medición; media es una interpretación razonable; baja es un indicio que conviene confirmar en las demás pestañas."
              escala={CONFIDENCE_LEGEND.map((nivel) => ({ ...nivel, range: nivel.label, label: nivel.range }))}
            />
          </div>
        </FrameHeader>
        <SobreGris>
          {analizando ? (
            <FramePanel>
              <div className="flex flex-col gap-3 py-4">
                <AiThinking label={paso} />
                <Progress value={avance} aria-label="Avance del análisis" />
              </div>
            </FramePanel>
          ) : (
            <div className="flex flex-col gap-3">
              <ResumenGeneral texto={analisis.summary} />
              {grupos.length === 0 ? (
                <FramePanel>
                  {/* «Sin resultados» del sistema (decisión 14): lo que dejó fuera la confiabilidad elegida en Personalizar. */}
                  <SinResultados filtrosActivos={CONFIDENCE_ORDER.length - niveles.size} onLimpiar={() => setNiveles(new Set(CONFIDENCE_ORDER))} />
                </FramePanel>
              ) : (
                grupos.map((grupo, indice) => <GrupoLecturas key={grupo.id} id={grupo.id} numero={indice + 1} titulo={grupo.titulo} pregunta={grupo.pregunta} lecturas={grupo.lecturas} />)
              )}
              {soloEnps ? null : (
                <>
                  {MOSTRAR_PRIORIDADES_Y_BRECHAS ? <Prioridades numero={grupos.length + 1} prioridades={prioridades} onIr={onIr} /> : null}
                  <Fortalezas numero={despues + 1} fortalezas={fortalezas} />
                  {conBrechas ? <Brechas numero={despues + 2} analisis={brechas} /> : null}
                </>
              )}
              <VozDeLaGente numero={soloEnps ? grupos.length + 1 : despues + (conBrechas ? 3 : 2)} sentimiento={voz} />
            </div>
          )}
        </SobreGris>
      </Frame>
    </div>
  )
}
