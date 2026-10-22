import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useInicioDePagina } from '../../encuestas/components/usar-inicio-de-pagina'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Download04Icon, FileImportIcon, InformationCircleIcon, Target02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { cicloPorId, useCiclos } from '../components/almacen'
import { sacarDelCiclo, useAjustesCiclo } from '../components/ajustes-ciclo'
import { notify } from '@/shared/components/notify'
import { DialogoRespuestas } from '../../encuestas/crear/components/participantes/dialogo-respuestas'
import { PanelCargaObjetivos } from '../components/carga/panel-carga'
import type { EstadoCiclo } from '../modelo/ciclos'
import { construirResultados, resumir, type PersonaSeguida } from '../modelo/resultados/seguimiento'
import type { Corte } from '../modelo/resultados/lecturas'
import { cumpleFiltros, type FiltrosPersona } from '../../encuestas/modelo/filtrosPersona'
import { parseSurveyDate, startOfToday } from '../../encuestas/modelo/surveyListDates'
import { AnalisisIa } from './components/analisis-ia'
import { Colaboradores } from './components/colaboradores'
import { Cumplimiento } from './components/cumplimiento'
import { DetalleTramo, type PedidoDetalle } from './components/detalle-tramo'
import { DialogoRecordar } from './components/dialogo-recordar'
import { FichaPersona } from './components/ficha-persona'
import { Ranking } from './components/ranking'
import { ChipsReporte, FiltrosCaja, VerPorReporte } from './components/filtros-reporte'
import { Resumen } from './components/resumen'
import { PanelReportes, type PestanaReportes } from './descargas/panel-reportes'
import { useDescargasCiclo, useDescargasCicloEnProcesos } from './descargas/use-descargas-ciclo'

// Resultados de un ciclo de objetivos (9-oct), portado del prototipo «configuración objetivos» con las piezas del design
// system y la forma de Resultados de Encuestas (21-oct, «todo como en Encuestas»): la cabecera con el nombre, su estado,
// los datos del ciclo y «Descargar»; las pestañas pegadas a ella; el aviso de ciclo abierto arriba; y «Ver por» y los
// filtros en la cabecera de cada caja que compara grupos, no en una barra aparte. Las pestañas comparten «Ver por» y la
// ficha de cada persona.

const RUTA = '/admin/desempeno-cultura/objetivos'

type Pestana = 'resumen' | 'cumplimiento' | 'colaboradores' | 'ranking' | 'ia'
const PESTANAS: readonly { id: Pestana; etiqueta: string }[] = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'cumplimiento', etiqueta: 'Cumplimiento' },
  { id: 'colaboradores', etiqueta: 'Colaboradores' },
  { id: 'ranking', etiqueta: 'Ranking' },
  { id: 'ia', etiqueta: 'Análisis con IA' },
]

// Los mismos tonos que la lista de ciclos.
const VARIANTE_ESTADO: Record<EstadoCiclo, 'info-light' | 'warning-light' | 'success-light' | 'outline'> = {
  'En curso': 'info-light',
  'Por iniciar': 'warning-light',
  Finalizado: 'success-light',
  Borrador: 'outline',
}

function SinCiclo() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Objetivos', to: RUTA }} title="Resultados" />
      <PageContent>
        {/* El mismo vacío que «No encontramos esta encuesta» en Encuestas. */}
        <PrimeraVez
          icono="glass-search"
          titulo="No encontramos este ciclo"
          descripcion="Puede que se haya eliminado o que el enlace esté mal copiado. Vuelve a la lista para elegir otro."
          accion={{ texto: 'Volver a objetivos', onClick: () => navigate(RUTA) }}
        />
      </PageContent>
    </PageShell>
  )
}

// Como «Todavía no hay respuestas» en Encuestas: sin un solo avance reportado no hay nada que leer (ni porcentajes en 0,
// ni lecturas de la IA). Cada pestaña dice qué va a mostrar y lleva a Colaboradores, la única que sí dice algo: quién falta.
const QUE_MUESTRA: Partial<Record<Pestana, { icono: string; texto: string }>> = {
  resumen: { icono: 'glass-chart', texto: 'el avance general, los pendientes y cómo van los objetivos por grupo' },
  cumplimiento: { icono: 'glass-graph', texto: 'el cumplimiento por objetivo de empresa y el mapa de calor por grupo' },
  ranking: { icono: 'glass-chart', texto: 'quién va adelante y quién atrás, por grupo o por persona' },
  ia: { icono: 'glass-discovery', texto: 'los hallazgos, riesgos y acciones que la IA lea en el avance del ciclo' },
}

// Como «La encuesta sigue abierta» de Encuestas (RES-011): mientras el ciclo corre, todo es lo reportado hasta ahora. Va
// arriba de cualquier pestaña, con cuántos han reportado y hasta cuándo puede cambiar; si ya pasó su cierre, lo dice así.
function AvisoEnCurso({ reportaron, personas, cierre }: { reportaron: number; personas: number; cierre: string }) {
  const fecha = parseSurveyDate(cierre)
  const vencido = fecha !== null && fecha < startOfToday()
  return (
    <Alert variant="info">
      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      <AlertTitle>El ciclo sigue abierto</AlertTitle>
      <AlertDescription>
        {`Ves el avance reportado hasta ahora: ${reportaron.toLocaleString('es-CO')} de ${personas.toLocaleString('es-CO')} personas ya reportaron. `}
        {vencido ? `Su cierre era el ${cierre} y sigue recibiendo avances: las cifras pueden cambiar hasta que se finalice.` : `Las cifras pueden cambiar hasta el cierre, el ${cierre}.`}
      </AlertDescription>
    </Alert>
  )
}

function SinReportes({ pestana, onColaboradores }: { pestana: Pestana; onColaboradores: () => void }) {
  const que = QUE_MUESTRA[pestana] ?? { icono: 'glass-chart', texto: 'los resultados' }
  return <PrimeraVez icono={que.icono} titulo="Todavía nadie reporta avance" descripcion={`Aquí verás ${que.texto} en cuanto la primera persona reporte.`} accion={{ texto: 'Ver colaboradores', onClick: onColaboradores }} />
}

export function Component() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ciclos = useCiclos()
  const ciclo = cicloPorId(id)
  // Abre desde arriba, no donde se quedó el scroll de la lista (como Resultados de Encuestas, 21-oct).
  const inicio = useInicioDePagina(id)
  // Desde «Para atender» del inicio se llega directo a la pestaña que explica el caso (`state.pestana`), como en Encuestas.
  const location = useLocation()
  const [pestana, setPestanaElegida] = useState<Pestana>(() => {
    const pedida = (location.state as { pestana?: Pestana } | null)?.pestana
    return PESTANAS.some((opcion) => opcion.id === pedida) ? (pedida as Pestana) : 'resumen'
  })
  const ajustes = useAjustesCiclo(id)
  const completo = useMemo(() => (ciclo ? construirResultados(ciclo, ajustes) : null), [ciclo, ajustes])
  // Como en Encuestas: «Ver por» es de toda la pantalla (se conserva entre pestañas) y los filtros son de la caja en
  // la que se ponen (al cambiar de pestaña se sueltan: no significan nada en las otras).
  const [corte, setCorte] = useState<Corte>('area')
  const [filtros, setFiltros] = useState<FiltrosPersona>({})
  const setPestana = (nueva: Pestana) => {
    setFiltros({})
    setPestanaElegida(nueva)
  }
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
  const [persona, setPersona] = useState<PersonaSeguida | null>(null)
  const [carga, setCarga] = useState(false)
  // «Descargar» abre el panel de reportes; «Exportar seleccionados» lo abre con esas personas ya elegidas.
  const [reportes, setReportes] = useState<{ abierto: boolean; personas: readonly string[] }>({ abierto: false, personas: [] })
  const [pestanaReportes, setPestanaReportes] = useState<PestanaReportes>('reportes')
  const centro = useDescargasCiclo(completo)
  const verDescargas = useCallback(() => {
    setPestanaReportes('descargas')
    setReportes((actual) => ({ ...actual, abierto: true }))
  }, [])
  useDescargasCicloEnProcesos(centro, ciclo?.nombre ?? 'el ciclo', verDescargas)
  const abrirReportes = (personas: readonly string[] = []) => {
    setPestanaReportes('reportes')
    setReportes({ abierto: true, personas })
  }
  // A quiénes se va a sacar del ciclo (pregunta antes, con qué pasa con su avance), y qué soltar al hacerlo.
  const [sacando, setSacando] = useState<{ personas: readonly PersonaSeguida[]; soltar?: () => void } | null>(null)
  // A quiénes se les va a recordar que actualicen su avance (pregunta antes), y qué soltar al enviarlo.
  const [recordar, setRecordar] = useState<{ personas: readonly PersonaSeguida[]; soltar?: () => void } | null>(null)
  const filtrados = useMemo(() => {
    if (!ciclo || !completo) return null
    const hay = Object.values(filtros).some(Boolean)
    return hay ? resumir(ciclo, completo.personas.filter((persona) => cumpleFiltros(persona.colaborador, filtros))) : completo
  }, [ciclo, completo, filtros])

  if (!ciclo || !completo || !filtrados) return <SinCiclo />
  // Se mira en el ciclo entero, no en lo filtrado: un filtro que deja a nadie es otro vacío (lo dice cada caja).
  const sinReportes = completo.reportaron === 0
  const verPor = <VerPorReporte corte={corte} onCorte={setCorte} />
  const controles = (
    <>
      {verPor}
      <FiltrosCaja filtros={filtros} onFiltros={setFiltros} colaboradores={completo.personas.map((uno) => uno.colaborador)} />
    </>
  )
  const chips = <ChipsReporte filtros={filtros} onFiltros={setFiltros} personas={filtrados.personas.length} total={completo.personas.length} />

  return (
    <PageShell>
      <span ref={inicio} aria-hidden="true" className="hidden" />
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
        <PageHeader
          back={{ label: 'Objetivos', to: RUTA }}
          // Un nombre largo no parte el título en varios renglones: se corta con «…» y se lee entero en el globo, como en Encuestas.
          title={
            <TextoCompleto texto={ciclo.nombre}>
              <span className="block truncate" tabIndex={0}>
                {ciclo.nombre}
              </span>
            </TextoCompleto>
          }
          // Como Encuestas: la acción secundaria y «Descargar» de primario. Un ciclo finalizado ya no recibe objetivos ni
          // avances: la carga solo se ofrece mientras corre.
          actions={
            <>
              {ciclo.estado === 'Finalizado' ? null : (
                <Button variant="outline" onClick={() => setCarga(true)}>
                  <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
                  Cargar objetivos
                </Button>
              )}
              <Button onClick={() => abrirReportes()}>
                <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
                Descargar
              </Button>
            </>
          }
          badge={<Badge variant={VARIANTE_ESTADO[ciclo.estado]}>{ciclo.estado}</Badge>}
          meta={[
            { icono: Target02Icon, texto: ciclo.periodo },
            { icono: Calendar03Icon, texto: `${ciclo.inicio} – ${ciclo.cierre}` },
            { icono: UserGroupIcon, texto: `${completo.personas.length.toLocaleString('es-CO')} personas · ${completo.objetivos.toLocaleString('es-CO')} objetivos` },
          ].map((dato) => (
            <span key={dato.texto} className="flex items-center gap-1.5">
              <HugeiconsIcon icon={dato.icono} size={15} aria-hidden="true" />
              {dato.texto}
            </span>
          ))}
          tabs={
            <TabsList variant="line">
              {PESTANAS.map((opcion) => (
                <TabsTrigger key={opcion.id} value={opcion.id} className="flex-none">
                  {opcion.etiqueta}
                </TabsTrigger>
              ))}
            </TabsList>
          }
        />
        <PageContent>
          {ciclo.estado === 'En curso' && !sinReportes ? <AvisoEnCurso reportaron={completo.reportaron} personas={completo.personas.length} cierre={ciclo.cierre} /> : null}
          {PESTANAS.map((opcion) => (
            <TabsContent key={opcion.id} value={opcion.id}>
              {opcion.id !== pestana ? null : sinReportes && opcion.id !== 'colaboradores' ? (
                <SinReportes pestana={opcion.id} onColaboradores={() => setPestana('colaboradores')} />
              ) : opcion.id === 'resumen' ? (
                <Resumen resultados={completo} corte={corte} verPor={verPor} onTramo={(dimension, tramo, etiqueta) => setDetalle({ dimension, tramo, etiqueta })} />
              ) : opcion.id === 'cumplimiento' ? (
                <Cumplimiento resultados={completo} filtrados={filtrados} corte={corte} controles={controles} chips={chips} onAbrir={setPersona} />
              ) : opcion.id === 'colaboradores' ? (
                // La tabla trae su buscador y sus filtros por columna: como Participación en Encuestas, no lleva otros encima.
                <Colaboradores
                  resultados={completo}
                  editable={ciclo.estado !== 'Finalizado'}
                  onAbrir={setPersona}
                  onRecordar={(personas, soltar) => setRecordar({ personas, soltar })}
                  onExportar={(personas) => abrirReportes(personas.map((uno) => uno.id))}
                  onEditar={() => navigate(`${RUTA}/${ciclo.id}/editar`, { state: { paso: 'objectives', pestana: 'individual' } })}
                  onSacar={(personas, soltar) => setSacando({ personas, soltar })}
                />
              ) : opcion.id === 'ranking' ? (
                <Ranking resultados={filtrados} corte={corte} controles={controles} chips={chips} onAbrir={setPersona} />
              ) : (
                <AnalisisIa resultados={completo} corte={corte} />
              )}
            </TabsContent>
          ))}
        </PageContent>
      </Tabs>
      <PanelCargaObjetivos abierto={carga} onAbiertoChange={setCarga} ciclos={ciclos} cicloFijo={ciclo} />
      <DetalleTramo pedido={detalle} resultados={completo} onCerrar={() => setDetalle(null)} />
      {/* Desde la ficha, el recordatorio se pregunta dentro de su panel (lo monta la ficha); aquí solo el de la tabla. */}
      <FichaPersona
        // La ficha lee a la persona del reporte vigente: al activar o inactivar un objetivo se ve el avance nuevo.
        persona={persona ? (completo.personas.find((una) => una.id === persona.id) ?? null) : null}
        ciclo={ciclo}
        abierto={completo.abierto}
        editable={ciclo.estado !== 'Finalizado'}
        onCerrar={() => setPersona(null)}
      />
      <DialogoRespuestas
        key={sacando?.personas.map((una) => una.id).join(',')}
        contexto="ciclo"
        afectados={sacando ? sacando.personas.map((una) => una.colaborador) : null}
        onCancelar={() => setSacando(null)}
        onConfirmar={(destino) => {
          if (!sacando) return
          const cuantas = sacando.personas.length
          sacarDelCiclo(ciclo.id, sacando.personas.map((una) => una.id), destino)
          sacando.soltar?.()
          setSacando(null)
          notify(
            cuantas === 1 ? `${sacando.personas[0].colaborador.name} salió del ciclo` : `${cuantas} personas salieron del ciclo`,
            destino === 'conservar' ? 'Su avance sigue contando en el progreso del ciclo.' : 'Su avance ya no cuenta en el progreso del ciclo.',
            'success',
          )
        }}
      />
      <PanelReportes
        abierto={reportes.abierto}
        onAbierto={(abierto) => setReportes((actual) => ({ ...actual, abierto }))}
        pestana={pestanaReportes}
        onPestana={setPestanaReportes}
        r={completo}
        corte={corte}
        personasIniciales={reportes.personas}
        centro={centro}
      />
      <DialogoRecordar ciclo={ciclo} personas={recordar?.personas ?? null} onCerrar={() => setRecordar(null)} onEnviado={recordar?.soltar} />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosResultadosPage'
