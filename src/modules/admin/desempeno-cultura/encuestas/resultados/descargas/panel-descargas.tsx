import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Field, FieldDescription, FieldLabel, FramePanel, IconTile, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, RadioGroup, RadioGroupItem, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../../components/marco-lista'
import { blockedReason, populationFilterApplies, populationScope } from '../../modelo/descargas/anonimato'
import { channeledRoster } from '../../modelo/descargas/canalizados'
import {
  NOM035_ACONTECIMIENTOS_REPORT_TYPES,
  PDF_SECTIONS,
  REPORT_TYPES,
  XLSX_SHEETS,
  nom035ReportTypes,
  reportDescriptionFor,
  reportDetailFor,
  reportTypeFor,
  reportableSegments,
  type PdfSectionId,
  type PdfSegmentSlot,
  type ReportKind,
  type ReportRequest,
  type XlsxSegmentSlot,
  type XlsxSheetId,
} from '../../modelo/descargas/tipos'
import type { Nom035Variant } from '../../modelo/nom035'
import { hasNpsDepthQuestions } from '../../modelo/npsDepth'
import { buildOpenComments, buildRespondents, type Sentiment } from '../../modelo/questionResponses'
import { SENTIMENT_LABELS, SENTIMENT_ORDER } from '../../modelo/sentimiento'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import type { SurveyResults } from '../../modelo/surveyResults'
import { numero } from '../components/escala'
import { CamposResponsable, FiltroPoblacion, FilaBloque, ListaDescargas, SelectorVarios, type Opcion } from './panel-piezas'
import type { CentroDescargas } from './use-centro-descargas'

// El panel de descargas: elegir un reporte, darle forma y seguir su preparación. Dos pestañas a
// propósito: «Reportes» es configuración (el próximo archivo) y «Descargas» es estado (lo ya pedido y
// cuánto le falta). La NOM 035 cambia el catálogo entero, no solo el título: la norma no produce
// favorabilidad ni eNPS, produce niveles de riesgo y casos. Portado del prototipo.

export type PestanaDescargas = 'reportes' | 'descargas'
type Pestana = PestanaDescargas

// Área primero, o el primer demográfico que haya: la unidad por la que se asignan presupuestos,
// líderes y planes, y por eso la que casi siempre se quiere desglosada. Precargar todos serían
// decenas de grillas que nadie pidió.
const areaPrimero = (opciones: readonly Opcion[]): ReadonlySet<string> => {
  const area = opciones.find((opcion) => (opcion.id.split('-dem-').pop() ?? opcion.id) === 'area')
  const elegida = area ?? opciones[0]
  return new Set(elegida ? [elegida.id] : [])
}

const alternar = <T,>(conjunto: ReadonlySet<T>, valor: T): ReadonlySet<T> => {
  const siguiente = new Set(conjunto)
  if (siguiente.has(valor)) siguiente.delete(valor)
  else siguiente.add(valor)
  return siguiente
}

const TITULO: Record<'clima' | Nom035Variant, string> = {
  clima: 'Reportes de resultados',
  riesgo: 'Reporte de riesgo psicosocial',
  acontecimientos: 'Reporte de acontecimientos traumáticos',
}

/** El título de un marco con su recuento, como «Organizacional 4» en Crear con plantilla. */
function TituloConCuenta({ titulo, cuenta }: { titulo: string; cuenta: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {titulo}
      <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
        {cuenta}
      </Badge>
    </span>
  )
}

/** Por qué un reporte saldría vacío: el aviso informativo del módulo, no un error (nadie se equivocó). */
function AvisoVacio({ texto }: { texto: string }) {
  return (
    <Alert variant="info">
      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      <AlertDescription>{texto}</AlertDescription>
    </Alert>
  )
}

type Props = {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  borrador: SurveyDraft
  resultados: SurveyResults
  nom035: Nom035Variant | null
  centro: CentroDescargas
  /** La pestaña la lleva la pantalla: así el Centro de procesos puede abrir el panel directo en «Descargas». */
  pestana: Pestana
  onPestana: (pestana: Pestana) => void
}

export function PanelDescargas({ abierto, onAbierto, borrador, resultados, nom035, centro, pestana, onPestana: setPestana }: Props) {

  const segmentos = useMemo(() => resultados.segments.filter((segmento) => !segmento.perPerson), [resultados.segments])
  const opcionesSegmento = useMemo(() => segmentos.map((segmento) => ({ id: segmento.key, label: segmento.label })), [segmentos])
  // El PDF viaja por correo sin control de acceso: no despliega cortes por líder (personas con nombre).
  const opcionesPdf = useMemo(() => reportableSegments(segmentos).map((segmento) => ({ id: segmento.key, label: segmento.label })), [segmentos])
  const conSegmentos = segmentos.length > 0
  const conNps = resultados.nps !== null
  const anonima = borrador.visibility === 'anonymous'
  const conProfundidad = useMemo(() => hasNpsDepthQuestions(borrador), [borrador])

  // --- Tipo de reporte
  const tipos = nom035 ? nom035ReportTypes(nom035) : REPORT_TYPES
  const [tipoElegido, setTipo] = useState<ReportKind>(tipos[0].kind)
  // El tipo vigente se deriva: si el catálogo cambió, lo elegido antes puede no existir aquí.
  const tipo = tipos.some((candidato) => candidato.kind === tipoElegido) ? tipoElegido : tipos[0].kind
  const definicion = reportTypeFor(tipo)

  // --- Reporte general (PDF)
  const seccionesDisponibles = useMemo(() => PDF_SECTIONS.filter((seccion) => (!seccion.needsSegments || conSegmentos) && (!seccion.needsNps || conNps)).map((seccion) => seccion.id), [conSegmentos, conNps])
  const [seccionesPdf, setSeccionesPdf] = useState<ReadonlySet<PdfSectionId>>(() => new Set(seccionesDisponibles))
  const [cortesPdf, setCortesPdf] = useState<Readonly<Record<PdfSegmentSlot, ReadonlySet<string>>>>(() => {
    const base = areaPrimero(opcionesPdf)
    return { participation: base, heatmap: base, nps: base, gaps: base }
  })
  const opcionesSecciones = useMemo(() => resultados.sections.map((seccion) => ({ id: seccion.id, label: `${seccion.numbering}. ${seccion.title}` })), [resultados.sections])
  const [seccionesPreguntas, setSeccionesPreguntas] = useState<ReadonlySet<string>>(() => new Set(resultados.sections.map((seccion) => seccion.id)))

  // --- Resultados generales (XLSX)
  const hojasDisponibles = useMemo(
    () => XLSX_SHEETS.filter((hoja) => (!hoja.needsNps || conNps) && (!hoja.needsSegments || conSegmentos) && (!hoja.needsDepth || conProfundidad)).map((hoja) => hoja.id),
    [conNps, conSegmentos, conProfundidad],
  )
  const [hojas, setHojas] = useState<ReadonlySet<XlsxSheetId>>(() => new Set(hojasDisponibles))
  const [cortesXlsx, setCortesXlsx] = useState<Readonly<Record<XlsxSegmentSlot, ReadonlySet<string>>>>(() => {
    const base = areaPrimero(opcionesSegmento)
    return { participation: base, heatmap: base, nps: base }
  })
  const cortesDeHoja = (slot: XlsxSegmentSlot, hoja: XlsxSheetId): string[] => (hojas.has(hoja) ? [...cortesXlsx[slot]] : [])

  // --- Comentarios (XLSX)
  const comentarios = useMemo(() => (nom035 ? [] : buildOpenComments(borrador, resultados, buildRespondents(borrador, resultados))), [nom035, borrador, resultados])
  const opcionesSentimiento = useMemo(() => SENTIMENT_ORDER.map((id) => ({ id, label: `${SENTIMENT_LABELS[id].plural} (${numero(comentarios.filter((comentario) => comentario.aiSentiment === id).length)})` })), [comentarios])
  const opcionesTema = useMemo(() => {
    const cuentas = new Map<string, number>()
    for (const comentario of comentarios) cuentas.set(comentario.topic, (cuentas.get(comentario.topic) ?? 0) + 1)
    return [...cuentas].sort((a, b) => b[1] - a[1]).map(([tema, cuenta]) => ({ id: tema, label: `${tema} (${numero(cuenta)})` }))
  }, [comentarios])
  const [porSentimiento, setPorSentimiento] = useState(true)
  const [sentimientos, setSentimientos] = useState<ReadonlySet<string>>(() => new Set(SENTIMENT_ORDER))
  const [porTema, setPorTema] = useState(true)
  const [temas, setTemas] = useState<ReadonlySet<string> | null>(null)
  const temasElegidos = temas ?? new Set(opcionesTema.map((opcion) => opcion.id))

  // --- NOM 035
  const esRiesgo = nom035 === 'riesgo'
  const esIndividual = tipo === 'nom035-individual'
  const llevaResponsable = tipo === 'nom035-pdf' || esIndividual
  const [nomParticipacion, setNomParticipacion] = useState(true)
  const [cortesNomParticipacion, setCortesNomParticipacion] = useState<ReadonlySet<string>>(() => areaPrimero(opcionesSegmento))
  const [nomMatriz, setNomMatriz] = useState(true)
  const [cortesNomMatriz, setCortesNomMatriz] = useState<ReadonlySet<string>>(() => areaPrimero(opcionesSegmento))
  const [conResponsable, setConResponsable] = useState(false)
  const [nombreResponsable, setNombreResponsable] = useState('')
  const [idResponsable, setIdResponsable] = useState('')
  const [intentado, setIntentado] = useState(false)
  const [individuales, setIndividuales] = useState<ReadonlySet<string>>(() => new Set())
  const personas = useMemo(() => (esRiesgo ? buildRespondents(borrador, resultados).map((persona) => ({ id: persona.id, label: persona.area ? `${persona.name} · ${persona.area}` : persona.name })) : []), [esRiesgo, borrador, resultados])
  const canalizados = useMemo(() => (nom035 === 'acontecimientos' ? channeledRoster(borrador, resultados).filter((persona) => persona.channeled).length : 0), [nom035, borrador, resultados])
  const responsableIncompleto = conResponsable && llevaResponsable && (nombreResponsable.trim() === '' || idResponsable.trim() === '')
  // Un reporte de la norma sin ningún desglose es solo el árbol de categorías: el prototipo no lo deja salir.
  const nomConContenido = esIndividual || !esRiesgo || (nomParticipacion && cortesNomParticipacion.size > 0) || (nomMatriz && cortesNomMatriz.size > 0)

  // --- Filtro de población
  const aplicaFiltro = !nom035 && conSegmentos && populationFilterApplies(tipo, anonima)
  const [filtrar, setFiltrar] = useState(false)
  const [claveFiltro, setClaveFiltro] = useState(segmentos[0]?.key ?? '')
  const [gruposFiltro, setGruposFiltro] = useState<ReadonlySet<string>>(() => new Set())
  const filtros = useMemo(() => (aplicaFiltro && filtrar && gruposFiltro.size > 0 ? [...gruposFiltro].map((optionId) => ({ key: claveFiltro, optionId })) : []), [aplicaFiltro, filtrar, gruposFiltro, claveFiltro])
  const alcance = useMemo(() => populationScope(borrador, resultados, filtros), [borrador, resultados, filtros])
  const bloqueo = blockedReason(alcance)

  // --- Qué se puede descargar
  const pdfConContenido = seccionesDisponibles.some((id) => seccionesPdf.has(id))
  const xlsxConContenido = hojasDisponibles.some((id) => {
    if (!hojas.has(id)) return false
    const slot = XLSX_SHEETS.find((hoja) => hoja.id === id)?.segmentSlot
    return slot ? cortesXlsx[slot].size > 0 : true
  })
  const comentariosConContenido = (!porSentimiento || sentimientos.size > 0) && (!porTema || temasElegidos.size > 0)
  // El responsable a medias no apaga el botón: lo deja pulsar y entonces señala los dos campos.
  // Una medición sin ninguna respuesta no tiene nada que reportar (RES-108): ningún reporte sale vacío.
  const sinRespuestas = resultados.participation.completed === 0
  // Por qué el botón está apagado, en una línea: va en el globo del botón para que no haya que adivinarlo (RES-108).
  const motivoApagado = sinRespuestas
    ? 'Esta medición aún no tiene respuestas'
    : nom035
      ? !nomConContenido
        ? 'Enciende participación o matrices'
        : esIndividual && individuales.size === 0
          ? 'Elige al menos un colaborador'
          : null
      : bloqueo !== null
        ? alcance.empty
          ? 'La población elegida no tiene respuestas'
          : 'La población elegida está bajo el mínimo de respuestas'
        : tipo === 'pdf' && !pdfConContenido
          ? 'Enciende al menos una sección del reporte'
          : tipo === 'xlsx' && !xlsxConContenido
            ? 'Enciende al menos una hoja y elige sus demográficos'
            : tipo === 'comments' && !comentariosConContenido
              ? 'Elige al menos un sentimiento y un tema'
              : null
  const puedeDescargar = motivoApagado === null
  const rotuloBoton = esIndividual && individuales.size > 1 ? `Descargar PDF (${individuales.size} reportes)` : (definicion.ctaLabel ?? `Descargar ${definicion.format}`)

  const descargar = () => {
    setIntentado(true)
    if (responsableIncompleto) return
    const pedido: ReportRequest = {
      kind: tipo,
      // La norma usa estas dos llaves para sus propios desgloses: el mismo campo, otra fuente.
      participationSegments: nom035 ? (nomParticipacion && !esIndividual ? [...cortesNomParticipacion] : []) : cortesDeHoja('participation', 'participation-by'),
      heatmapSegments: nom035 ? (nomMatriz && !esIndividual ? [...cortesNomMatriz] : []) : cortesDeHoja('heatmap', 'heatmap-by'),
      npsSegments: conNps ? cortesDeHoja('nps', 'nps-by') : [],
      xlsxSheets: XLSX_SHEETS.map((hoja) => hoja.id).filter((id) => hojas.has(id)),
      pdfSections: PDF_SECTIONS.map((seccion) => seccion.id).filter((id) => seccionesDisponibles.includes(id) && seccionesPdf.has(id)),
      pdfSegments: { participation: [...cortesPdf.participation], heatmap: [...cortesPdf.heatmap], nps: [...cortesPdf.nps], gaps: [...cortesPdf.gaps] },
      pdfQuestionSections: [...seccionesPreguntas],
      commentSentiments: porSentimiento ? ([...sentimientos] as Sentiment[]) : [...SENTIMENT_ORDER],
      commentTopics: porTema && temasElegidos.size < opcionesTema.length ? [...temasElegidos] : [],
      filters: filtros,
      responsible: conResponsable && llevaResponsable ? { name: nombreResponsable.trim(), id: idResponsable.trim() } : null,
      individualIds: esIndividual ? [...individuales] : [],
    }
    centro.iniciar(pedido)
    setPestana('descargas')
  }

  // La posición real de cada hoja en el libro: una tanda por demográfico ocupa una pestaña por cada uno.
  const pestanasDe = (hoja: (typeof XLSX_SHEETS)[number]) => (!hojasDisponibles.includes(hoja.id) || !hojas.has(hoja.id) ? 0 : hoja.segmentSlot ? cortesXlsx[hoja.segmentSlot].size : 1)
  const indiceHoja = (posicion: number): string | null => {
    const antes = XLSX_SHEETS.slice(0, posicion).reduce((total, hoja) => total + pestanasDe(hoja), 0)
    const propias = pestanasDe(XLSX_SHEETS[posicion])
    return propias === 0 ? null : propias === 1 ? `${antes + 1}` : `${antes + 1}–${antes + propias}`
  }
  const pestanasLibro = XLSX_SHEETS.reduce((total, hoja) => total + pestanasDe(hoja), 0)
  const seccionesImpresas = PDF_SECTIONS.filter((seccion) => seccionesDisponibles.includes(seccion.id) && seccionesPdf.has(seccion.id))

  const sinDisponibilidad = (necesita: { needsNps?: boolean; needsDepth?: boolean }) =>
    necesita.needsNps && !conNps ? 'Esta medición no incluyó pregunta eNPS' : necesita.needsDepth && !conProfundidad ? 'Ninguna pregunta activó preguntas de profundidad' : 'Esta encuesta no recogió demográficos'

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbierto}
      size="md"
      icon={Download04Icon}
      title={TITULO[nom035 ?? 'clima']}
      description="Configura y descarga los reportes de esta medición"
      footer={
        pestana === 'reportes' ? (
          puedeDescargar ? (
            <Button onClick={descargar}>
              <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
              {rotuloBoton}
            </Button>
          ) : (
            // Un botón apagado no recibe el cursor: el globo va en un envoltorio que sí lo recibe (y el foco del teclado).
            <Hint label={motivoApagado} side="left">
              <span tabIndex={0} className="inline-flex">
                <Button disabled>
                  <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
                  {rotuloBoton}
                </Button>
              </span>
            </Hint>
          )
        ) : (
          <Button variant="outline" onClick={() => onAbierto(false)}>
            Seguir en segundo plano
          </Button>
        )
      }
    >
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)} className="flex flex-col gap-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="reportes" className="flex-none">
            Reportes
          </TabsTrigger>
          <TabsTrigger value="descargas" className="flex-none">
            Descargas
            {centro.preparando > 0 ? (
              <Badge variant="primary-light" size="xs" className="tabular-nums">
                {centro.preparando}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Como los demás drawers del módulo (Crear con plantilla, comparar encuestas, detalle de accionables): cada
            sección es un marco con su título y su descripción y, dentro, una tarjeta con las opciones o las filas. */}
        <TabsContent value="reportes" className="flex flex-col gap-6">
          {sinRespuestas ? (
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertTitle>Aún no hay nada que reportar</AlertTitle>
              <AlertDescription>Podrás descargar en cuanto alguien responda.</AlertDescription>
            </Alert>
          ) : null}
          {/* Una lista para elegir, como «Tipos de encuesta» de Comparar (Elkin, 15-oct): filas separadas con el círculo a la
              izquierda, no tarjetas. */}
          <MarcoLista titulo="Tipo de reporte" descripcion="Elige qué archivo quieres generar de esta medición.">
            {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
            <FramePanel className="py-1!">
              <RadioGroup value={tipo} onValueChange={(valor) => setTipo(valor as ReportKind)} aria-label="Tipo de reporte">
                <FilasSeparadas>
                  {tipos.map((opcion) => (
                    <Item key={opcion.kind} size="sm" render={<label htmlFor={`reporte-${opcion.kind}`} />} className={FILA_CLICABLE}>
                      <RadioGroupItem value={opcion.kind} id={`reporte-${opcion.kind}`} />
                      <ItemMedia>
                        <IconTile variant="soft" size="sm">
                          <HugeiconsIcon icon={opcion.icon} aria-hidden="true" />
                        </IconTile>
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle>{opcion.title}</ItemTitle>
                        <ItemDescription>{reportDescriptionFor(opcion.kind, anonima)}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </FilasSeparadas>
              </RadioGroup>
            </FramePanel>
          </MarcoLista>

          {!nom035 && tipo === 'pdf' ? (
          <>
            <MarcoLista titulo={<TituloConCuenta titulo="Secciones del reporte" cuenta={seccionesImpresas.length} />} descripcion="Se imprimen en este orden en el PDF.">
              {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  {PDF_SECTIONS.map((seccion) => {
                    const disponible = seccionesDisponibles.includes(seccion.id)
                    const slot = seccion.segmentSlot
                    const posicion = seccionesImpresas.findIndex((candidata) => candidata.id === seccion.id)
                    return (
                      <FilaBloque
                        key={seccion.id}
                        id={`pdf-${seccion.id}`}
                        titulo={seccion.label}
                        descripcion={seccion.description}
                        indice={posicion >= 0 ? `${posicion + 1}` : null}
                        activo={disponible && seccionesPdf.has(seccion.id)}
                        onActivo={() => setSeccionesPdf(alternar(seccionesPdf, seccion.id))}
                        motivoNoDisponible={disponible ? null : sinDisponibilidad(seccion)}
                        rotuloSelector={seccion.pickerLabel}
                        avisoVacio={seccion.pickerEmptyHint}
                        selector={
                          slot && opcionesPdf.length > 0
                            ? { opciones: opcionesPdf, valor: cortesPdf[slot], onCambio: (valor) => setCortesPdf({ ...cortesPdf, [slot]: valor }), placeholder: 'Elige demográficos' }
                            : seccion.picksSections
                              ? { opciones: opcionesSecciones, valor: seccionesPreguntas, onCambio: setSeccionesPreguntas, placeholder: 'Elige secciones' }
                              : null
                        }
                      />
                    )
                  })}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
            {seccionesImpresas.length === 0 ? <AvisoVacio texto="Enciende al menos una sección para descargar." /> : null}
          </>
          ) : null}

          {!nom035 && tipo === 'xlsx' ? (
          <>
            <MarcoLista titulo={<TituloConCuenta titulo="Hojas del libro" cuenta={pestanasLibro} />} descripcion="Cada hoja encendida es una pestaña del archivo.">
              {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  {XLSX_SHEETS.map((hoja, posicion) => {
                    const disponible = hojasDisponibles.includes(hoja.id)
                    const slot = hoja.segmentSlot
                    return (
                      <FilaBloque
                        key={hoja.id}
                        id={`xlsx-${hoja.id}`}
                        titulo={hoja.label}
                        descripcion={hoja.description}
                        indice={indiceHoja(posicion)}
                        activo={disponible && hojas.has(hoja.id)}
                        onActivo={() => setHojas(alternar(hojas, hoja.id))}
                        motivoNoDisponible={disponible ? null : sinDisponibilidad(hoja)}
                        rotuloSelector={hoja.pickerLabel}
                        avisoVacio={hoja.pickerEmptyHint}
                        selector={slot && opcionesSegmento.length > 0 ? { opciones: opcionesSegmento, valor: cortesXlsx[slot], onCambio: (valor) => setCortesXlsx({ ...cortesXlsx, [slot]: valor }), placeholder: 'Elige demográficos' } : null}
                      />
                    )
                  })}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
            {!hojasDisponibles.some((id) => hojas.has(id)) ? <AvisoVacio texto="Enciende al menos una hoja para descargar." /> : null}
          </>
          ) : null}

          {!nom035 && tipo === 'comments' ? (
            <MarcoLista titulo="Comentarios que entran" descripcion="Apagados, entran todos.">
              {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  <FilaBloque
                    id="sentimiento"
                    titulo="Sentimiento de los comentarios"
                    descripcion="Apagado, entran los tres."
                    activo={porSentimiento}
                    onActivo={setPorSentimiento}
                    avisoVacio="Elige al menos un sentimiento."
                    selector={{ opciones: opcionesSentimiento, valor: sentimientos, onCambio: setSentimientos, placeholder: 'Elige sentimientos' }}
                  />
                  {opcionesTema.length > 0 ? (
                    <FilaBloque
                      id="temas"
                      titulo="Temas de los comentarios"
                      descripcion="Apagado, entran todos los temas."
                      activo={porTema}
                      onActivo={setPorTema}
                      avisoVacio="Elige al menos un tema."
                      selector={{ opciones: opcionesTema, valor: temasElegidos, onCambio: setTemas, placeholder: 'Elige temas' }}
                    />
                  ) : null}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
          ) : null}

          {!nom035 && (tipo === 'questions-csv' || tipo === 'answers-csv') ? (
            <MarcoLista titulo="Contenido del archivo">
              <FramePanel>
                <Text size="sm">{reportDetailFor(tipo, anonima)}</Text>
              </FramePanel>
            </MarcoLista>
          ) : null}

          {esRiesgo ? (
            <MarcoLista titulo="Personalización del reporte" descripcion={esIndividual ? 'Elige a quién se le genera el reporte individual.' : 'Qué bloques por demográfico lleva el reporte.'}>
              {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  {!esIndividual && conSegmentos ? (
                    <FilaBloque
                      id="nom-participacion"
                      titulo="Participación por demográficos"
                      descripcion="Cobertura de cada demográfico elegido"
                      activo={nomParticipacion}
                      onActivo={setNomParticipacion}
                      avisoVacio="Elige al menos un demográfico o este bloque no se imprime."
                      selector={{ opciones: opcionesSegmento, valor: cortesNomParticipacion, onCambio: setCortesNomParticipacion, placeholder: 'Elige demográficos' }}
                    />
                  ) : null}
                  {!esIndividual && conSegmentos ? (
                    <FilaBloque
                      id="nom-matriz"
                      titulo="Matrices de riesgo por demográficos"
                      descripcion="Una matriz de riesgo por cada demográfico elegido"
                      activo={nomMatriz}
                      onActivo={setNomMatriz}
                      avisoVacio="Elige al menos un demográfico o este bloque no se imprime."
                      selector={{ opciones: opcionesSegmento, valor: cortesNomMatriz, onCambio: setCortesNomMatriz, placeholder: 'Elige demográficos' }}
                    />
                  ) : null}
                  {!esIndividual && !conSegmentos ? (
                    <Text size="sm" variant="muted" className="py-3">
                      Esta encuesta no recogió demográficos: el reporte sale con el árbol de categorías, dominios y dimensiones.
                    </Text>
                  ) : null}
                  {esIndividual ? (
                    <Field className="py-3">
                      <FieldLabel htmlFor="colaboradores-individual">Colaboradores</FieldLabel>
                      <FieldDescription>Una hoja por persona en el mismo PDF.</FieldDescription>
                      <SelectorVarios id="colaboradores-individual" opciones={personas} valor={individuales} onCambio={setIndividuales} placeholder="Busca por nombre" error={individuales.size === 0} />
                    </Field>
                  ) : null}
                  {llevaResponsable ? (
                    <CamposResponsable
                      activo={conResponsable}
                      onActivo={setConResponsable}
                      nombre={nombreResponsable}
                      onNombre={setNombreResponsable}
                      identificacion={idResponsable}
                      onIdentificacion={setIdResponsable}
                      mostrarErrores={intentado}
                    />
                  ) : null}
                </FilasSeparadas>
                {!nomConContenido ? (
                  <Text size="xs" variant="destructive" className="pb-3">
                    Enciende participación o matrices.
                  </Text>
                ) : null}
              </FramePanel>
            </MarcoLista>
          ) : null}

          {nom035 === 'acontecimientos' ? (
            <MarcoLista titulo="Contenido del archivo">
              <FramePanel>
                <Text size="sm">
                  {tipo === NOM035_ACONTECIMIENTOS_REPORT_TYPES[0].kind
                    ? `Una carta con firma por cada canalizado (${canalizados}).`
                    : 'Una fila por persona y si queda por canalizar.'}
                </Text>
              </FramePanel>
            </MarcoLista>
          ) : null}

          {aplicaFiltro ? (
            <MarcoLista titulo="Población" descripcion="Por defecto, toda la medición.">
              {/* Relleno del panel forzado con «!»: el tema de la librería va sin capa y la clase sola no gana. Ficha: diferencias.json › frame-panel-relleno-no-se-quita. */}
              <FramePanel className="py-1!">
                <FiltroPoblacion
                  segmentos={segmentos}
                  alcance={alcance}
                  bloqueo={bloqueo}
                  activo={filtrar}
                  onActivo={setFiltrar}
                  clave={claveFiltro}
                  onClave={(clave) => {
                    setClaveFiltro(clave)
                    setGruposFiltro(new Set())
                  }}
                  grupos={gruposFiltro}
                  onGrupos={setGruposFiltro}
                />
              </FramePanel>
            </MarcoLista>
          ) : null}
        </TabsContent>

        <TabsContent value="descargas">
          <ListaDescargas entradas={centro.entradas} onEntregar={centro.entregar} vacio="Los reportes que pidas aparecen aquí." />
        </TabsContent>
      </Tabs>
    </DrawerShell>
  )
}
