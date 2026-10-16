import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, FileImportIcon, Notification01Icon, Search01Icon, Target02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Badge, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { cicloPorId, useCiclos } from '../components/almacen'
import { PanelCargaObjetivos } from '../components/carga/panel-carga'
import type { EstadoCiclo } from '../modelo/ciclos'
import { construirResultados, resumir, type PersonaSeguida } from '../modelo/resultados/seguimiento'
import type { Corte } from '../modelo/resultados/lecturas'
import { cumpleFiltros, type FiltrosPersona } from '../../encuestas/modelo/filtrosPersona'
import { AnalisisIa } from './components/analisis-ia'
import { Colaboradores } from './components/colaboradores'
import { Cumplimiento } from './components/cumplimiento'
import { DetalleTramo, type PedidoDetalle } from './components/detalle-tramo'
import { FichaPersona } from './components/ficha-persona'
import { Ranking } from './components/ranking'
import { FiltrosReporte } from './components/filtros-reporte'
import { Resumen } from './components/resumen'

// Resultados de un ciclo de objetivos (9-oct), portado del prototipo «configuración objetivos» con las piezas del design
// system y la forma de Resultados de Encuestas: la cabecera con el nombre, su estado y los datos del ciclo, y las
// pestañas pegadas a ella. Resumen, Cumplimiento, Colaboradores, Ranking y Análisis con IA
// comparten «Ver por», los filtros del reporte y la ficha de cada persona.

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
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No encontramos este ciclo</EmptyTitle>
            <EmptyDescription>Puede que se haya eliminado. Vuelve a la lista para elegir otro.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => navigate(RUTA)}>
              Volver a objetivos
            </Button>
          </EmptyContent>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const ciclos = useCiclos()
  const ciclo = cicloPorId(id)
  const [pestana, setPestana] = useState<Pestana>('resumen')
  const completo = useMemo(() => (ciclo ? construirResultados(ciclo) : null), [ciclo])
  // «Ver por» y los filtros del reporte son de toda la pantalla: se conservan al cambiar de pestaña.
  const [corte, setCorte] = useState<Corte>('area')
  const [filtros, setFiltros] = useState<FiltrosPersona>({})
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
  const [persona, setPersona] = useState<PersonaSeguida | null>(null)
  const [carga, setCarga] = useState(false)
  // A quiénes se les va a recordar que actualicen su avance (pregunta antes), y qué soltar al enviarlo.
  const [recordar, setRecordar] = useState<{ personas: readonly PersonaSeguida[]; soltar?: () => void } | null>(null)
  const resultados = useMemo(() => {
    if (!ciclo || !completo) return null
    const hay = Object.values(filtros).some(Boolean)
    return hay ? resumir(ciclo, completo.personas.filter((persona) => cumpleFiltros(persona.colaborador, filtros))) : completo
  }, [ciclo, completo, filtros])

  if (!ciclo || !completo || !resultados) return <SinCiclo />

  return (
    <PageShell>
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
        <PageHeader
          back={{ label: 'Objetivos', to: RUTA }}
          title={ciclo.nombre}
          // Un ciclo finalizado ya no recibe objetivos ni avances: la carga solo se ofrece mientras corre.
          actions={
            ciclo.estado === 'Finalizado' ? undefined : (
              <Button variant="outline" onClick={() => setCarga(true)}>
                <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
                Cargar objetivos
              </Button>
            )
          }
          badge={<Badge variant={VARIANTE_ESTADO[ciclo.estado]}>{ciclo.estado}</Badge>}
          meta={[
            { icono: Target02Icon, texto: ciclo.periodo },
            { icono: Calendar03Icon, texto: `${ciclo.inicio} – ${ciclo.cierre}` },
            { icono: UserGroupIcon, texto: `${resultados.personas.length.toLocaleString('es-CO')} personas · ${resultados.objetivos.toLocaleString('es-CO')} objetivos` },
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
          {PESTANAS.map((opcion) => (
            <TabsContent key={opcion.id} value={opcion.id}>
              {opcion.id === pestana ? (
                <div className="flex flex-col gap-6">
                  <FiltrosReporte corte={corte} onCorte={setCorte} filtros={filtros} onFiltros={setFiltros} personas={resultados.personas.length} total={completo.personas.length} colaboradores={completo.personas.map((persona) => persona.colaborador)} />
                  {opcion.id === 'resumen' ? (
                    <Resumen resultados={resultados} corte={corte} onTramo={(dimension, tramo, etiqueta) => setDetalle({ dimension, tramo, etiqueta })} />
                  ) : opcion.id === 'cumplimiento' ? (
                    <Cumplimiento resultados={resultados} corte={corte} onAbrir={setPersona} />
                  ) : opcion.id === 'colaboradores' ? (
                    <Colaboradores resultados={resultados} onAbrir={setPersona} onRecordar={(personas, soltar) => setRecordar({ personas, soltar })} />
                  ) : opcion.id === 'ranking' ? (
                    <Ranking resultados={resultados} corte={corte} onAbrir={setPersona} />
                  ) : (
                    <AnalisisIa resultados={resultados} corte={corte} />
                  )}
                </div>
              ) : null}
            </TabsContent>
          ))}
        </PageContent>
      </Tabs>
      <PanelCargaObjetivos abierto={carga} onAbiertoChange={setCarga} ciclos={ciclos} cicloFijo={ciclo} />
      <DetalleTramo pedido={detalle} resultados={resultados} onCerrar={() => setDetalle(null)} />
      <FichaPersona persona={persona} abierto={resultados.abierto} onCerrar={() => setPersona(null)} onRecordar={(quien) => setRecordar({ personas: [quien] })} />
      <DialogoConfirmar
        abierto={recordar !== null}
        onAbiertoChange={(valor) => (valor ? undefined : setRecordar(null))}
        icono={Notification01Icon}
        titulo="¿Enviar el recordatorio?"
        descripcion={
          recordar && recordar.personas.length === 1
            ? `A ${recordar.personas[0].colaborador.name} le llega un aviso para que actualice el avance de sus objetivos en «${ciclo.nombre}».`
            : `A ${recordar?.personas.length ?? 0} colaboradores les llega un aviso para que actualicen el avance de sus objetivos en «${ciclo.nombre}».`
        }
        accion="Enviar recordatorio"
        onConfirmar={() => {
          if (!recordar) return
          const n = recordar.personas.length
          notify(n === 1 ? `Recordamos actualizar su avance a ${recordar.personas[0].colaborador.name}` : `Recordamos actualizar su avance a ${n} personas`, ciclo.nombre, 'success')
          recordar.soltar?.()
          setRecordar(null)
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosResultadosPage'
