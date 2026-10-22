import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Heading, Progress, Text } from '@ubits/flux-ui'
import { FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgente } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { PLANES, USUARIO_ID, type Plan } from '../zona-de-estudio/components/datos'
import { AgentePlanes } from './components/agente-planes'
import {
  AREA_PROPIA,
  equipo as equipoDe,
  hayPendientes,
  indicadores,
  leerDemo,
  planesVigentes,
  rankingAreas,
  rankingEmpresa,
  rankingEquipo,
  VISIBLES,
} from './components/datos'
import {
  AlcanceRanking,
  AvatarPersona,
  DrawerPlan,
  Indicador,
  Ranking,
  BotonRecordatorio,
  SelectorEquipo,
  TarjetaPlan,
  type Alcance,
} from './components/piezas'
import { INDICADORES, VACIOS } from './components/constantes'

// Aprendizaje › Progreso del colaborador líder (HU-progreso). El avance de sus planes vigentes y los de su equipo, el
// recordatorio de estudio, los rankings del mes y Orbit, el agente contextual, para crear un plan con IA.
// ?demo=equipo-grande muestra un equipo de 25 personas y ?demo=sin-planes, el estado vacío.

const RUTA_ZONA = '/portal-colaborador/aprendizaje/zona-de-estudio'
export const RUTA_CORREO_RECORDATORIO = '/portal-colaborador/aprendizaje/progreso/correo-recordatorio'
const TOKENS_INICIALES = 500_000

export function Component() {
  const [consulta] = useSearchParams()
  const navigate = useNavigate()
  const demo = leerDemo(consulta.get('demo'))
  const vacio = demo === 'sin-planes'
  const personas = useMemo(() => equipoDe(demo), [demo])

  const [elegida, setElegida] = useState(USUARIO_ID)
  const [vuelta, setVuelta] = useState(0) // sube cuando el agente guarda un plan: se vuelve a leer la base
  const [alcance, setAlcance] = useState<Alcance>('equipo')
  const [enDetalle, setEnDetalle] = useState<Plan | null>(null)
  // El agente se acopla a la derecha, como en Planes de formación del admin; `sesion` reinicia la conversación.
  const agente = useAgente()
  const [sesionAgente, setSesionAgente] = useState(0)
  const [tokens, setTokens] = useState(TOKENS_INICIALES)

  // Si la persona elegida no está en el equipo (cambio de demo), se ve la líder, que siempre va primero.
  const foco = personas.find((p) => p.id === elegida) ?? personas[0]
  // `vuelta` obliga a leer la base de nuevo después de generar un plan.
  const planes = useMemo(() => (vuelta >= 0 ? planesVigentes(foco.id, vacio) : []), [foco.id, vacio, vuelta])
  const kpi = indicadores(planes, foco.id)
  const filasEstudio = useMemo(
    () => (vacio || vuelta < 0 ? [] : alcance === 'equipo' ? rankingEquipo(personas) : rankingEmpresa()),
    [vacio, alcance, personas, vuelta],
  )
  const filasAreas = useMemo(() => (vacio || vuelta < 0 ? [] : rankingAreas()), [vacio, vuelta])

  const abrirPlan = (plan: Plan) => {
    // La líder va a su Zona de estudio con el plan elegido; de otra persona se ve el detalle en un panel.
    if (foco.id === USUARIO_ID)
      navigate(`${RUTA_ZONA}?planId=${encodeURIComponent(plan.id)}#${plan.tipo === 'competencias' ? 'competencias' : 'contenidos'}`)
    else setEnDetalle(PLANES.getPlanById(plan.id))
  }

  return (
    <PageShell>
      <PageHeader
        title="Progreso"
        actions={
          <>
            <BotonRecordatorio hayPendientes={hayPendientes(personas, vacio)} onEnviado={() => window.open(RUTA_CORREO_RECORDATORIO, '_blank')} />
            {/* Crear un plan con IA abre Orbit (auditoría, decisión 9): el botón del agente, el último de la fila. */}
            {agente.disponible ? (
              <ReopenAgentButton
                onClick={() => {
                  setSesionAgente((s) => s + 1)
                  agente.abrir()
                }}
              />
            ) : null}
          </>
        }
      />
      <PageContent>
        <div className="flex flex-col gap-6">
          {/* Quién se está viendo, su avance y sus planes vigentes. */}
          <section aria-labelledby="progreso-nombre">
            <Frame spacing="sm">
              <FramePanel className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <AvatarPersona persona={foco} size="lg" className="size-16" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Heading as="h2" level={4} id="progreso-nombre" className="truncate">
                        {foco.nombre}
                      </Heading>
                      {foco.cargo ? (
                        <Text as="p" size="sm" variant="muted">
                          {foco.cargo}
                        </Text>
                      ) : null}
                      {foco.username ? (
                        <Text as="p" size="sm" variant="muted" className="truncate">
                          {foco.username}
                        </Text>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 lg:items-end">
                    {/* El scroll es para pantallas angostas; el margen de 4px deja ver completo el borde de los avatares, que va por fuera. */}
                    <div className="-m-1 overflow-x-auto p-1 [scrollbar-width:none]">
                      <SelectorEquipo
                        personas={personas}
                        visibles={demo === 'normal' ? personas.length : Math.min(VISIBLES, personas.length)}
                        elegida={foco.id}
                        onElegir={setElegida}
                      />
                    </div>
                  </div>
                </div>

                {planes.length ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <Text as="span" size="sm" variant="muted">
                          Cumplimiento promedio de los planes vigentes
                        </Text>
                        <Text as="span" size="sm" weight="semibold" className="shrink-0 tabular-nums">
                          {kpi.promedio} %
                        </Text>
                      </div>
                      <Progress value={kpi.promedio} aria-label="Cumplimiento promedio de los planes vigentes" />
                    </div>

                    {/* La misma fila de métricas del admin: un panel con divisores, no una tarjeta por cifra. Se explican
                        solas con su etiqueta, así que el marco va sin título (Dave, 9-oct). */}
                    <Frame>
                      <FilaIndicadores etiqueta="Resumen de sus planes" columnas={4} enMarco>
                        {INDICADORES.map((i) => (
                          <Indicador key={i.clave} icono={i.icono} color={i.color} valor={kpi[i.clave]} etiqueta={i.etiqueta} />
                        ))}
                      </FilaIndicadores>
                    </Frame>
                  </>
                ) : null}
              </FramePanel>
            </Frame>
          </section>

          {/* Los planes salen de la caja de la persona: son su propia sección, con el título en el gris. */}
          <section aria-label="Planes vigentes">
            <Frame spacing="sm">
              <FrameHeader>
                <FrameTitle>Planes vigentes</FrameTitle>
                <FrameDescription>Abre un plan para ver sus contenidos y cuánto falta para cerrarlo.</FrameDescription>
              </FrameHeader>
              <FramePanel>
                {planes.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {planes.map((plan) => (
                      <TarjetaPlan key={plan.id} plan={plan} personaId={foco.id} onAbrir={() => abrirPlan(plan)} />
                    ))}
                  </div>
                ) : (
                  <PrimeraVez
                    className="py-10"
                    icono="glass-document"
                    titulo="Todavía no tienes planes vigentes"
                    descripcion="Cuando tu empresa te asigne uno, aquí vas a ver tu avance en cada uno."
                  />
                )}
              </FramePanel>
            </Frame>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Ranking
              titulo="Ranking de estudio del mes"
              descripcion="De mayor a menor tiempo de estudio."
              extra={<AlcanceRanking valor={alcance} onCambiar={setAlcance} />}
              filas={filasEstudio}
              resaltada={foco.id}
              vacio={vacio ? VACIOS.estudio : VACIOS.estudioSinDatos}
              seguir
            />
            <Ranking
              titulo="Ranking entre áreas este mes"
              descripcion="Cursos finalizados en promedio por persona de cada área."
              filas={filasAreas}
              resaltada={AREA_PROPIA}
              vacio={vacio ? VACIOS.areas : VACIOS.areasSinDatos}
            />
          </div>
        </div>
      </PageContent>

      <DrawerPlan plan={enDetalle} persona={foco} onCerrar={() => setEnDetalle(null)} />

      {agente.portal(
        <AgentePlanes
          onClose={agente.cerrar}
          sesion={sesionAgente}
          equipo={personas}
          tokens={tokens}
          gastar={(n) => {
            if (tokens < n) return false
            setTokens((t) => t - n)
            return true
          }}
          onGenerado={(ids) => {
            setVuelta((v) => v + 1)
            if (ids[0]) setElegida(ids[0])
          }}
        />,
      )}
    </PageShell>
  )
}

Component.displayName = 'PortalColaboradorAprendizajeProgresoPage'
