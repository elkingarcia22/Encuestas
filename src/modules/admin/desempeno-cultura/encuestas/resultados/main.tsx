import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Download04Icon, Globe02Icon, InformationCircleIcon, ViewOffSlashIcon, Tag01Icon, UserGroupIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { encuestaPorId, useEncuestas } from '../components/almacen'
import { VARIANTE_ESTADO } from '../components/tonos'
import { VistaPrevia } from '../components/vista-previa/vista-previa'
import { nom035VariantOf } from '../modelo/nom035'
import { parseSurveyDate, startOfToday } from '../modelo/surveyListDates'
import { buildSurveyResults } from '../modelo/surveyResults'
import { createPublishedSurveyDraft } from '../modelo/surveyPreviewMocks'
import { Accionables } from './components/accionables'
import { Canalizacion } from './components/canalizacion'
import { AnalisisIa } from './components/ia-analisis'
import { Enps } from './components/enps'
import { Favorabilidad } from './components/favorabilidad'
import { Participacion } from './components/participacion'
import { Preguntas } from './components/preguntas'
import { PanelDescargas, type PestanaDescargas } from './descargas/panel-descargas'
import { useCentroDescargas, useDescargasEnProcesos } from './descargas/use-centro-descargas'
import { RiesgoPsicosocial } from './components/riesgo'

// Resultados de una encuesta: cinco pestañas sobre la misma medición, cada una responde una
// pregunta distinta. Lo que se comparte entre ellas es el demográfico elegido («Ver por»): pasar
// de participación por área al mapa de calor por área es un solo pensamiento. Las acciones que en
// el prototipo iban en la barra flotante están en el encabezado y en la tabla de participación.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

const RUTA = '/admin/desempeno-cultura/encuestas'
// Cuántas mediciones anteriores del mismo tipo entran en la tendencia.
const PROFUNDIDAD_TENDENCIA = 5

type PestanaId = 'participation' | 'favorability' | 'questions' | 'nps' | 'ai' | 'actionables' | 'risk' | 'channeling'
type Pestana = {
  id: PestanaId
  etiqueta: string
}

const PARTICIPACION: Pestana = {
  id: 'participation',
  etiqueta: 'Participación',
}
const PREGUNTAS: Pestana = {
  id: 'questions',
  etiqueta: 'Preguntas',
}
const IA: Pestana = { id: 'ai', etiqueta: 'Análisis con IA' }
const ACCIONABLES: Pestana = {
  id: 'actionables',
  etiqueta: 'Accionables',
}

const ENPS: Pestana = { id: 'nps', etiqueta: 'eNPS' }
const PESTANAS: Pestana[] = [PARTICIPACION, { id: 'favorability', etiqueta: 'Favorabilidad' }, PREGUNTAS, ENPS, IA, ACCIONABLES]
// Una encuesta de eNPS no mide favorabilidad: solo la recomendación y su porqué. Sin esa pestaña, y el eNPS va segundo.
const PESTANAS_ENPS: Pestana[] = [PARTICIPACION, ENPS, PREGUNTAS, IA, ACCIONABLES]
const PESTANAS_RIESGO: Pestana[] = [PARTICIPACION, { id: 'risk', etiqueta: 'Riesgo psicosocial' }, PREGUNTAS, IA, ACCIONABLES]
const PESTANAS_CANALIZACION: Pestana[] = [PARTICIPACION, { id: 'channeling', etiqueta: 'Canalización' }, PREGUNTAS]

function SinEncuesta() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Encuestas', to: RUTA }} title="Resultados" />
      <PageContent>
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-search" />
            </EmptyMedia>
            <EmptyTitle>No encontramos esta encuesta</EmptyTitle>
            <EmptyDescription>Puede que se haya eliminado o que el enlace esté mal copiado. Vuelve a la lista para elegir otra.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => navigate(RUTA)}>
              Volver a encuestas
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

// Sin respuestas (o, en una anónima, sin llegar al mínimo) no hay nada que leer: ni porcentajes en 0, ni lecturas de la
// IA, ni accionables inventados. Cada pestaña dice qué va a mostrar cuando las haya y lleva a Participación, la única
// que sí tiene algo que decir: quién falta.
const QUE_MUESTRA: Partial<Record<PestanaId, { icono: string; texto: string }>> = {
  favorability: { icono: 'glass-chart', texto: 'la favorabilidad general, el mapa de calor por grupo y la tendencia' },
  questions: { icono: 'glass-document', texto: 'cómo se repartieron las respuestas de cada pregunta y los comentarios' },
  nps: { icono: 'glass-graph', texto: 'el eNPS, con sus promotores, pasivos y detractores' },
  ai: { icono: 'glass-discovery', texto: 'los hallazgos, riesgos y acciones que la IA lea en los resultados' },
  actionables: { icono: 'glass-tick', texto: 'los accionables sugeridos a partir de los resultados, listos para activar' },
  risk: { icono: 'glass-shield-done', texto: 'el riesgo psicosocial por dimensión y por área' },
  channeling: { icono: 'glass-profile', texto: 'las personas que hay que canalizar a atención médica' },
}

function SinRespuestas({ pestana, respondidas, minimo, onParticipacion }: { pestana: PestanaId; respondidas: number; minimo: number | null; onParticipacion: () => void }) {
  const que = QUE_MUESTRA[pestana] ?? { icono: 'glass-chart', texto: 'los resultados' }
  return (
    <PrimeraVez
      icono={que.icono}
      titulo={minimo === null ? 'Todavía no hay respuestas' : 'Todavía no hay suficientes respuestas'}
      descripcion={
        minimo === null
          ? `Aquí verás ${que.texto} en cuanto responda la primera persona.`
          : `Para cuidar el anonimato, los resultados se muestran desde ${minimo} respuestas y van ${respondidas}. Aquí verás ${que.texto}.`
      }
      accion={{ texto: 'Ver participación', onClick: onParticipacion }}
    />
  )
}

// Mientras la encuesta sigue abierta, todo lo que se ve es lo acumulado hasta ahora (RES-011): va arriba de cualquier
// pestaña, con lo que falta y hasta cuándo puede cambiar. Si ya pasó su cierre y sigue abierta, lo dice así.
function AvisoEnCurso({ respondidas, invitados, cierre }: { respondidas: number; invitados: number; cierre: string }) {
  const fecha = parseSurveyDate(cierre)
  const vencida = fecha !== null && fecha < startOfToday()
  return (
    <Alert variant="info">
      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      <AlertTitle>La encuesta sigue abierta</AlertTitle>
      <AlertDescription>
        {`Ves las cifras acumuladas hasta ahora: ${respondidas.toLocaleString('es-CO')} de ${invitados.toLocaleString('es-CO')} invitados ya respondieron. `}
        {vencida ? `Su cierre era el ${cierre} y sigue recibiendo respuestas: los números pueden cambiar hasta que se cierre.` : `Los números pueden cambiar hasta el cierre, el ${cierre}.`}
      </AlertDescription>
    </Alert>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const encuestas = useEncuestas()
  const encuesta = encuestaPorId(id)

  const borrador = useMemo(() => (encuesta ? (encuesta.draft ?? createPublishedSurveyDraft(encuesta)) : null), [encuesta])
  // La tendencia: las mediciones anteriores del mismo tipo, en el orden de la lista.
  const historia = useMemo(() => {
    if (!encuesta) return []
    const indice = encuestas.findIndex((otra) => otra.id === encuesta.id)
    return encuestas
      .slice(indice + 1)
      .filter((otra) => otra.type === encuesta.type)
      .slice(0, PROFUNDIDAD_TENDENCIA)
  }, [encuestas, encuesta])
  const resultados = useMemo(
    () =>
      encuesta && borrador
        ? buildSurveyResults({
            draft: borrador,
            item: encuesta,
            history: historia,
          })
        : null,
    [encuesta, borrador, historia],
  )

  // Desde el panel de riesgos del home se llega directo a la pestaña que explica el caso (`state.pestana`).
  const location = useLocation()
  const [pestana, setPestana] = useState<PestanaId>(() => (location.state as { pestana?: PestanaId } | null)?.pestana ?? 'participation')
  // Arranca por colaborador si la encuesta lo tiene: la pregunta de Participación es «¿quién falta?».
  const [claveSegmento, setClaveSegmento] = useState<string>(() => resultados?.segments.find((opcion) => opcion.perPerson)?.key ?? resultados?.segments[0]?.key ?? '')
  const [conVistaPrevia, setConVistaPrevia] = useState(false)
  // Las descargas viven en la pantalla: cerrar el panel no detiene un reporte a medio preparar.
  const centro = useCentroDescargas(borrador, resultados)
  const [conDescargas, setConDescargas] = useState(false)
  const [pestanaDescargas, setPestanaDescargas] = useState<PestanaDescargas>('reportes')
  // Desde el Centro de procesos (se abre desde las notificaciones), «Ver» abre el panel directo en «Descargas».
  const verDescargas = useCallback(() => {
    setPestanaDescargas('descargas')
    setConDescargas(true)
  }, [])
  useDescargasEnProcesos(centro, borrador?.name ?? 'la encuesta', verDescargas)

  if (!encuesta || !borrador || !resultados) return <SinEncuesta />

  const variante = nom035VariantOf(encuesta.id)
  const pestanas = variante === 'riesgo' ? PESTANAS_RIESGO : variante === 'acontecimientos' ? PESTANAS_CANALIZACION : borrador.kind === 'enps' ? PESTANAS_ENPS : PESTANAS
  // Si la pestaña pedida no existe en esta encuesta (la NOM 035 tiene las suyas), se abre la primera.
  const pestanaActiva = pestanas.some((opcion) => opcion.id === pestana) ? pestana : pestanas[0].id
  const segmento = resultados.segments.find((opcion) => opcion.key === claveSegmento) ?? resultados.segments[0]

  const respondidas = resultados.participation.completed
  const anonima = borrador.visibility === 'anonymous'
  const sinLectura = respondidas === 0 || (anonima && respondidas < resultados.threshold)

  const contenido = (id: PestanaId): ReactNode => {
    if (sinLectura && id !== 'participation') return <SinRespuestas pestana={id} respondidas={respondidas} minimo={respondidas === 0 ? null : resultados.threshold} onParticipacion={() => setPestana('participation')} />
    if (id === 'risk') return <RiesgoPsicosocial borrador={borrador} resultados={resultados} segmento={segmento} onSegmento={setClaveSegmento} />
    if (id === 'ai') return <AnalisisIa borrador={borrador} resultados={resultados} onIr={(destino) => setPestana(destino)} />
    if (id === 'actionables') return <Accionables resultados={resultados} />
    if (id === 'channeling') return <Canalizacion borrador={borrador} resultados={resultados} />
    // Sin datos demográficos `segmento` no existe y cada pestaña se lee en total: oculta «Ver por», filtros, mapa de
    // calor y lo que compara grupos, y en su lugar dice por qué con el mismo aviso (AvisoSinDemograficos).
    if (id === 'participation') return <Participacion resultados={resultados} segmento={segmento} onSegmento={setClaveSegmento} />
    if (id === 'questions') return <Preguntas borrador={borrador} resultados={resultados} segmento={segmento} onSegmento={setClaveSegmento} />
    if (id === 'nps') return <Enps borrador={borrador} resultados={resultados} segmento={segmento} onSegmento={setClaveSegmento} />
    if (id === 'favorability') return <Favorabilidad resultados={resultados} segmento={segmento} onSegmento={setClaveSegmento} />
    return null
  }

  return (
    <PageShell>
      {/* Las pestañas envuelven la página: la tira va en el hueco `tabs` de la cabecera, pegada al título, y cada pestaña
          es un TabsContent dentro de PageContent (decisión 13 de la auditoría; como Tareas y Navegación › Detalle). */}
      <Tabs value={pestanaActiva} onValueChange={(valor) => setPestana(valor as PestanaId)}>
      <PageHeader
        back={{ label: 'Encuestas', to: RUTA }}
        // Un nombre largo no parte el título en dos o tres renglones: se corta con «…» y se lee entero en el globo.
        title={<TextoCompleto texto={encuesta.name}><span className="block truncate" tabIndex={0}>{encuesta.name}</span></TextoCompleto>}
        badge={<Badge variant={VARIANTE_ESTADO[encuesta.status] ?? 'outline'}>{encuesta.status === 'Finalizado' ? 'Finalizada' : encuesta.status}</Badge>}
        // Como el «Detalle de registro» de Navegación: los datos de la encuesta bajo el título y las pestañas pegadas a la cabecera.
        meta={[
          { icono: Tag01Icon, texto: encuesta.type },
          { icono: Calendar03Icon, texto: `${encuesta.startDate} – ${encuesta.endDate}` },
          { icono: UserGroupIcon, texto: `${encuesta.participants} invitados` },
          // Si se ve quién respondió qué (pública) o no (anónima): condiciona cómo se leen los resultados.
          ...(borrador ? [borrador.visibility === 'anonymous' ? { icono: ViewOffSlashIcon, texto: 'Anónima' } : { icono: Globe02Icon, texto: 'Pública' }] : []),
        ].map((dato) => (
          <span key={dato.texto} className="flex items-center gap-1.5">
            <HugeiconsIcon icon={dato.icono} size={15} aria-hidden="true" />
            {dato.texto}
          </span>
        ))}
        actions={
          <>
            <Button variant="outline" onClick={() => setConVistaPrevia(true)}>
              <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
              Vista previa
            </Button>
            <Button onClick={() => setConDescargas(true)}>
              {centro.preparando > 0 ? <Spinner /> : <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />}
              {centro.preparando > 0 ? 'Preparando reporte' : 'Descargar'}
            </Button>
          </>
        }
        tabs={
          <TabsList variant="line">
            {pestanas.map((opcion) => (
              <TabsTrigger key={opcion.id} value={opcion.id} className="flex-none">
                {opcion.etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        }
      />
      <PageContent>
        {encuesta.status === 'En progreso' && respondidas > 0 ? <AvisoEnCurso respondidas={respondidas} invitados={resultados.participation.invited} cierre={encuesta.endDate} /> : null}
        {pestanas.map((opcion) => (
          <TabsContent key={opcion.id} value={opcion.id}>
            {opcion.id === pestanaActiva ? contenido(opcion.id) : null}
          </TabsContent>
        ))}
      </PageContent>
      </Tabs>

      <VistaPrevia borrador={borrador} open={conVistaPrevia} onOpenChange={setConVistaPrevia} />
      <PanelDescargas abierto={conDescargas} onAbierto={setConDescargas} borrador={borrador} resultados={resultados} nom035={variante} centro={centro} pestana={pestanaDescargas} onPestana={setPestanaDescargas} />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaEncuestasResultadosPage'
