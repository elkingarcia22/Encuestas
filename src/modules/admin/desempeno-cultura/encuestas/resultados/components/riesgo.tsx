import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { useCargaProgresiva } from '@/modules/design-system/templates/admin-compartido/lista'
import { BotonCargarMas, EncabezadoOrdenable, FiltroColumna } from '../../components/tabla-piezas'
import { formatPercent } from '../../modelo/favorabilityScale'
import { buildAnswerMatrix, buildQuestionBreakdowns, buildRespondents } from '../../modelo/questionResponses'
import { collaboratorRiskOf, flattenSections, type CollaboratorRisk } from '../../modelo/nom035RiskModel'
import { RISK_BANDS, RISK_BAND_IDS, RISK_SCALE_LEGEND, formatRisk, organizationRiskOf, riskBandForScore, riskPercentOf, riskScoreOf } from '../../modelo/nom035Scale'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { heatmapBySegment, sectionResultsForFilters, type QuestionResult, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { ArbolResultados, SobreGris } from './arbol-resultados'
import { ChipsFiltro, Filtros, LeyendaEscala, Personalizar, SelectorVista, TotalOculto } from './controles'
import { COLOR_POR_LECTURA, INSIGNIA_POR_TONO, numero } from './escala'
import { nivelDe, useFiltrosResultados, type Nivel } from './filtros'
import { MapaCalor, type EscalaMapa } from './mapa-calor'
import { TarjetaResumen } from './tarjeta-resumen'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'

// NOM 035 · Riesgo psicosocial (Guía III): el nivel de riesgo por categoría, dominio y dimensión,
// de 0 (nulo) a 5 (muy alto). Se lee al revés que la favorabilidad: aquí un número alto es malo.
// Tres vistas: el análisis por categoría, el mapa de riesgo por grupo y los colaboradores, donde
// cada persona queda en el nivel de su dimensión más alta (basta una para quedar ahí).

type VistaRiesgo = 'categorias' | 'mapa' | 'colaboradores'

const TITULO: Record<VistaRiesgo, string> = {
  categorias: 'Análisis por categoría',
  mapa: 'Mapa de riesgo',
  colaboradores: 'Colaboradores',
}
const LEYENDA = {
  titulo: 'Escala de riesgo NOM 035',
  descripcion: 'El riesgo es el promedio de las respuestas leído al revés que un 1 a 5 normal: «Siempre» es el extremo de riesgo. Nulo, bajo, medio, alto o muy alto, según dónde caiga.',
}

const riesgoDe = (puntaje: number) => riskScoreOf(puntaje)
const bandaDeRiesgo = (riesgo: number) => riskBandForScore(riesgo)

// El mapa de calor, leído con la escala de riesgo.
const ESCALA_RIESGO: EscalaMapa = {
  titulo: 'Mapa de riesgo',
  tituloLeyenda: LEYENDA.titulo,
  descripcion: LEYENDA.descripcion,
  bandas: RISK_SCALE_LEGEND,
  leyenda: RISK_SCALE_LEGEND,
  banda: (puntaje) => {
    const banda = bandaDeRiesgo(riesgoDe(puntaje))
    return { id: banda.id, label: banda.label, tone: banda.scaleTone }
  },
  formato: (puntaje) => formatRisk(riesgoDe(puntaje)),
}

function Riesgo({ riesgo, conEtiqueta = true }: { riesgo: number; conEtiqueta?: boolean }) {
  const banda = bandaDeRiesgo(riesgo)
  return (
    <Badge variant={INSIGNIA_POR_TONO[banda.scaleTone]} className="tabular-nums">
      {conEtiqueta ? `${banda.label} · ` : ''}
      {formatRisk(riesgo)}
    </Badge>
  )
}

function PreguntasDeRiesgo({ preguntas, oculto }: { preguntas: readonly QuestionResult[]; oculto: boolean }) {
  const [orden, setOrden] = useState<string | undefined>('-riesgo')
  const [bandas, setBandas] = useState<string[]>([])
  const conPuntaje = preguntas.filter((pregunta) => pregunta.score !== null)
  const visibles = conPuntaje
    .filter((pregunta) => bandas.length === 0 || bandas.includes(bandaDeRiesgo(riesgoDe(pregunta.score as number)).label))
    .sort((a, b) => {
      if (!orden) return 0
      const signo = orden.startsWith('-') ? -1 : 1
      return (orden.includes('riesgo') ? riesgoDe(a.score as number) - riesgoDe(b.score as number) : a.statement.localeCompare(b.statement, 'es')) * signo
    })
  const ordenar = (campo: string) => setOrden((previo) => (previo === campo ? `-${campo}` : previo === `-${campo}` ? undefined : campo))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>
            <EncabezadoOrdenable etiqueta="Pregunta" campo="pregunta" ordenActual={orden} onOrdenar={ordenar} />
          </TableHead>
          <TableHead className="w-44">
            <div className="flex items-center justify-end gap-0.5">
              <EncabezadoOrdenable etiqueta="Riesgo" campo="riesgo" ordenActual={orden} onOrdenar={ordenar} />
              <FiltroColumna etiqueta="nivel de riesgo" opciones={RISK_BANDS.map((banda) => banda.label)} seleccion={bandas} onCambiar={setBandas} />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3}>
              <Text size="sm" variant="muted">
                Ninguna pregunta de esta dimensión cae en los niveles seleccionados.
              </Text>
            </TableCell>
          </TableRow>
        ) : (
          visibles.map((pregunta, indice) => (
            <TableRow key={pregunta.id}>
              <TableCell className="text-center">
                <Text as="span" size="xs" variant="muted" weight="semibold" className="tabular-nums">
                  {indice + 1}
                </Text>
              </TableCell>
              <TableCell className="whitespace-normal!">
                <Text as="span" size="sm" weight="medium">
                  {pregunta.statement}
                </Text>
              </TableCell>
              <TableCell className="text-right">{oculto ? <TotalOculto /> : <Riesgo riesgo={riesgoDe(pregunta.score as number)} />}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function Colaboradores({ colaboradores }: { colaboradores: readonly CollaboratorRisk[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [bandas, setBandas] = useState<string[]>([])
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return [...colaboradores]
      .filter((colaborador) => (!q || colaborador.respondent.name.toLowerCase().includes(q)) && (bandas.length === 0 || (colaborador.risk !== null && bandas.includes(bandaDeRiesgo(colaborador.risk).label))))
      .sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1))
  }, [colaboradores, busqueda, bandas])
  const [cargadas, cargarMas] = useCargaProgresiva(lista.length, 20)
  const [elegidoId, setElegidoId] = useState<string | null>(null)
  const elegido = lista.find((colaborador) => colaborador.respondent.id === elegidoId) ?? lista[0] ?? null

  if (colaboradores.length === 0) {
    return (
      <PrimeraVez icono="glass-profile" titulo="Sin resultados por colaborador" descripcion="Cuando alguien responda la encuesta, su nivel de riesgo aparecerá aquí." />
    )
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Frame spacing="sm" className="[--frame-gap:0px]">
        <FrameHeader className="gap-3!">
          <div className="flex items-center justify-between gap-2">
            <FrameDescription>
              {numero(lista.length)} de {numero(colaboradores.length)}
            </FrameDescription>
            <FiltroColumna etiqueta="nivel de riesgo" opciones={RISK_BANDS.map((banda) => banda.label)} seleccion={bandas} onCambiar={setBandas} />
          </div>
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre" aria-label="Buscar colaboradores" />
          </InputGroup>
        </FrameHeader>
        <FramePanel className="max-h-[36rem] overflow-y-auto p-1!">
          {lista.length === 0 ? (
            // «Sin resultados» del sistema, con ilustración, lo buscado y el botón para limpiar (decisión 14).
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={bandas.length > 0 ? 1 : 0}
              onLimpiar={() => {
                setBusqueda('')
                setBandas([])
              }}
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              {lista.slice(0, cargadas).map((colaborador) => (
                <Item
                  key={colaborador.respondent.id}
                  size="sm"
                  variant={elegido?.respondent.id === colaborador.respondent.id ? 'muted' : 'default'}
                  render={<button type="button" />}
                  onClick={() => setElegidoId(colaborador.respondent.id)}
                  aria-pressed={elegido?.respondent.id === colaborador.respondent.id}
                  className="w-full text-left"
                >
                  <ItemMedia>
                    <Avatar size="sm">
                      <AvatarFallback>{colaborador.respondent.initials}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <TextoCompleto texto={colaborador.respondent.name}><ItemTitle className="truncate">{colaborador.respondent.name}</ItemTitle></TextoCompleto>
                    <TextoCompleto texto={[colaborador.respondent.area, colaborador.respondent.leader].filter(Boolean).join(" · ")}><ItemDescription className="truncate">{[colaborador.respondent.area, colaborador.respondent.leader].filter(Boolean).join(' · ') || 'Sin datos del grupo'}</ItemDescription></TextoCompleto>
                  </ItemContent>
                  <ItemActions>{colaborador.risk === null ? null : <Riesgo riesgo={colaborador.risk} conEtiqueta={false} />}</ItemActions>
                </Item>
              ))}
            </div>
          )}
        </FramePanel>
        {cargadas < lista.length ? (
          <FrameFooter>
            <BotonCargarMas onCargarMas={cargarMas} />
          </FrameFooter>
        ) : null}
      </Frame>
      {elegido ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{elegido.respondent.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <TextoCompleto texto={elegido.respondent.name}><CardTitle className="truncate">{elegido.respondent.name}</CardTitle></TextoCompleto>
                <CardDescription>{[elegido.respondent.area, elegido.respondent.leader && `Líder: ${elegido.respondent.leader}`].filter(Boolean).join(' · ') || 'Encuesta anónima'}</CardDescription>
              </div>
              {elegido.risk !== null ? (
                // El porqué en el globo del producto (Hint), no en el del navegador (decisión 16 de la auditoría).
                <Hint label="Su dimensión más alta: basta una para quedar en ese nivel.">
                  <div className="flex items-center gap-1.5">
                    <Text as="span" size="xs" variant="muted">
                      Nivel
                    </Text>
                    <Riesgo riesgo={elegido.risk} />
                  </div>
                </Hint>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimensión</TableHead>
                  <TableHead className="w-44 text-right">Riesgo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...elegido.dimensions]
                  .sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1))
                  .map((dimension) => (
                    <TableRow key={dimension.id}>
                      <TableCell className="whitespace-normal!">{dimension.label}</TableCell>
                      <TableCell className="text-right">
                        {dimension.risk === null ? (
                          <Text as="span" size="sm" variant="muted">
                            Sin responder
                          </Text>
                        ) : (
                          <Riesgo riesgo={dimension.risk} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

type Props = {
  borrador: SurveyDraft
  resultados: SurveyResults
  segmento: SegmentDefinition
  onSegmento: (clave: string) => void
}

export function RiesgoPsicosocial({ borrador, resultados, segmento, onSegmento }: Props) {
  const [vista, setVista] = useState<VistaRiesgo>('categorias')
  const segmentos = resultados.segments.filter((opcion) => !opcion.perPerson)
  const activo = segmentos.find((opcion) => opcion.key === segmento.key) ?? segmentos[0] ?? segmento
  const estado = useFiltrosResultados(activo, segmentos, onSegmento, RISK_BAND_IDS)

  const categorias = useMemo(() => sectionResultsForFilters(resultados, estado.filtros), [resultados, estado.filtros])
  const organizacion = organizationRiskOf(categorias)
  const mapa = useMemo(() => heatmapBySegment(resultados, activo, estado.filtros), [resultados, activo, estado.filtros])
  const dimensiones = useMemo(() => flattenSections(categorias).filter((seccion) => seccion.depth === 3 && seccion.n > 0), [categorias])
  const colaboradores = useMemo(() => {
    const personas = buildRespondents(borrador, resultados)
    const recuentos = buildQuestionBreakdowns(borrador, resultados)
    const matriz = buildAnswerMatrix(personas, recuentos)
    return personas.map((persona) => collaboratorRiskOf(persona, dimensiones, recuentos, matriz))
  }, [borrador, resultados, dimensiones])

  const enBanda = (id: string) => dimensiones.filter((seccion) => bandaDeRiesgo(riesgoDe(seccion.score)).id === id).length
  const parte = (cuenta: number) => (dimensiones.length === 0 ? 0 : Math.round((cuenta / dimensiones.length) * 100))
  const altoOMas = (puntaje: number) => ['alto', 'muy-alto'].includes(bandaDeRiesgo(riesgoDe(puntaje)).id)
  const dimensionesEnRiesgo = enBanda('muy-alto') + enBanda('alto')
  const gruposEnRiesgo = mapa.columnTotals.filter((total) => total !== null && altoOMas(total)).length

  // Las tres vistas se cambian con la pastilla, primer control de la cabecera de la caja (Elkin, 9-oct, como el comparativo).
  const cambioVista = (
    <SelectorVista
      valor={vista}
      onCambio={setVista}
      opciones={[
        { value: 'categorias', label: 'Por categoría' },
        { value: 'mapa', label: 'Mapa de riesgo' },
        { value: 'colaboradores', label: 'Colaboradores' },
      ]}
    />
  )

  const anillo = (id: string, etiqueta: string) => {
    const cuenta = enBanda(id)
    return {
      id,
      etiqueta,
      porcentaje: parte(cuenta),
      color: COLOR_POR_LECTURA[RISK_BANDS.find((banda) => banda.id === id)?.tone ?? 'warning'],
      cantidad: numero(cuenta),
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Nivel de riesgo organizacional"
        ayuda="Promedio ponderado de las categorías de la Guía de Referencia III, en escala de 0 (nulo) a 5 (muy alto): Σ (riesgo de la categoría × respuestas) ÷ total de respuestas. Se lee al revés que la favorabilidad. Los anillos cuentan dimensiones por su promedio del centro de trabajo completo."
        cifra={formatRisk(organizacion.score)}
        lectura={organizacion.band.label}
        pie={`${dimensionesEnRiesgo} ${dimensionesEnRiesgo === 1 ? 'dimensión' : 'dimensiones'} y ${gruposEnRiesgo} ${gruposEnRiesgo === 1 ? 'grupo' : 'grupos'} en alto`}
        tituloAnillos="Dimensiones por nivel de riesgo"
        totalAnillos={`${numero(dimensiones.length)} ${dimensiones.length === 1 ? 'dimensión' : 'dimensiones'}`}
        anillos={[anillo('muy-alto', 'Muy alto'), anillo('alto', 'Alto'), anillo('medio', 'Medio')]}
        restoAnillos="Bajo o nulo"
        tituloTop="Categoría en mayor riesgo"
        top={[...categorias]
          .filter((seccion) => seccion.n > 0)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((seccion) => ({
            id: seccion.id,
            etiqueta: seccion.title,
            valor: riskPercentOf(seccion.favorability),
            texto: formatPercent(riskPercentOf(seccion.favorability)),
          }))}
      />

      <div className="flex flex-col gap-4">
      {vista === 'mapa' ? (
        <MapaCalor resultados={resultados} segmentos={segmentos} segmento={activo} estado={estado} escala={ESCALA_RIESGO} extra={cambioVista} />
      ) : (
        <Frame spacing="sm" className="[--frame-gap:0px]">
          <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
            <div>
              <FrameTitle>{TITULO[vista]}</FrameTitle>
              <FrameDescription>{vista === 'categorias' ? `${categorias.length} categorías` : `${numero(colaboradores.length)} colaboradores`}</FrameDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cambioVista}
              {vista === 'categorias' ? (
                <>
                  <Filtros
                    estado={{ ...estado, filtrables: segmentos }}
                    activo={{
                      key: '',
                      label: 'las categorías',
                      preloaded: false,
                      perPerson: false,
                      options: [],
                    }}
                  />
                  <Personalizar estado={estado} escala={[]} resaltadas={new Set()} onResaltar={() => undefined} onRestablecerResaltado={() => undefined} ajustesResaltado={0} />
                </>
              ) : null}
              <LeyendaEscala titulo={LEYENDA.titulo} descripcion={LEYENDA.descripcion} escala={RISK_SCALE_LEGEND} />
            </div>
          </FrameHeader>
          {vista === 'categorias' && estado.filtros.length > 0 ? (
            <FramePanel>
              <ChipsFiltro estado={estado} segmentos={segmentos} />
            </FramePanel>
          ) : null}
          {vista === 'categorias' ? (
            <SobreGris>
              <ArbolResultados
                secciones={categorias}
                metrica={(seccion) => (!estado.niveles.has(nivelDe(seccion.depth) as Nivel) ? <TotalOculto /> : seccion.n > 0 ? <Riesgo riesgo={riesgoDe(seccion.score)} /> : null)}
                preguntas={(seccion) => <PreguntasDeRiesgo preguntas={seccion.questions} oculto={!estado.niveles.has('question')} />}
              />
            </SobreGris>
          ) : (
            <FramePanel>
              <Colaboradores colaboradores={colaboradores} />
            </FramePanel>
          )}
        </Frame>
      )}
      </div>
    </div>
  )
}
