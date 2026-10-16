import { useNavigate } from 'react-router'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Frame, FramePanel, Heading, Progress, Text } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CajaCarrusel } from './carrusel'
import {
  abrirContenido,
  competenciaPorId,
  imagenCompetencia,
  minutosCompetencia,
  TARJETAS_EXCLUSIVO,
  TARJETAS_HISTORIAL,
  tarjetasDeCompetencia,
  tarjetasDelPlan,
  type Plan,
  type Tarjeta,
} from './datos'
import { ListaContenidos } from './lista-contenidos'
import { PlanWidget } from './plan-widget'

type PropsPlan = {
  planes: Plan[]
  plan: Plan | undefined
  onPlan: (id: string) => void
  /** `?demo=vacio`: enseñar el estado de primera vez de esta pestaña. */
  vacio?: boolean
}

const CATALOGO = '/portal-colaborador/aprendizaje/catalogo'

/** El «Primera vez» de una pestaña de Zona de estudio: aquí nadie crea, así que la salida siempre es el catálogo. */
function VacioZona({ icono, titulo, descripcion }: { icono: string; titulo: string; descripcion: string }) {
  const navigate = useNavigate()
  return (
    <PrimeraVez
      icono={icono}
      titulo={titulo}
      descripcion={descripcion}
      accion={{ texto: 'Explorar catálogo', icono: Search01Icon, onClick: () => navigate(CATALOGO) }}
    />
  )
}

// ── Plan de contenidos ───────────────────────────────────────────────────────────────────────────────────────────

export function PestanaContenidos({ planes, plan, onPlan, vacio }: PropsPlan) {
  return (
    <div className="flex flex-col gap-6">
      {vacio ? null : <PlanWidget tipo="contenidos" planes={planes} plan={plan} onPlan={onPlan} />}
      {/* La búsqueda es de este plan: al cambiar de plan empieza vacía. */}
      <ListaContenidos
        key={plan?.id ?? 'sin-plan'}
        id="zona-plan-contenidos"
        tarjetas={vacio || !plan ? [] : tarjetasDelPlan(plan)}
        vacio={
          <VacioZona
            icono="glass-document"
            titulo="Todavía no tienes un plan de contenidos"
            descripcion="Cuando tu empresa te asigne uno, aquí vas a ver los contenidos que te tocan y cómo vas."
          />
        }
      />
    </div>
  )
}

// ── Plan de competencias ─────────────────────────────────────────────────────────────────────────────────────────

function BloqueCompetencia({ plan }: { plan: Plan }) {
  const nombre = competenciaPorId(plan.competenciaId)?.nombre ?? 'Competencia'
  const { hechos, total, pct } = minutosCompetencia(plan)
  const tarjetas = tarjetasDeCompetencia(plan)
  return (
    <CajaCarrusel
      etiqueta={nombre}
      cabecera={
        <div className="flex min-w-0 items-center gap-3">
          <img src={imagenCompetencia(plan.competenciaId)} alt="" className="size-12.5 shrink-0 rounded-lg object-cover" />
          {/* Sin tope de ancho: los minutos, el porcentaje y la barra ocupan **todo lo que haya** hasta las flechas
              del carrusel. Con el tope de 448 px la barra se quedaba a media caja y el resto era hueco (Dave, 7-oct). */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Heading as="h3" level={6}>
              {nombre}
            </Heading>
            <div className="flex items-baseline gap-2">
              <Text as="span" size="sm" variant="muted" className="flex-1">
                {hechos} de {total} minutos
              </Text>
              <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                {pct} %
              </Text>
            </div>
            <Progress value={pct} aria-label={`Progreso de ${nombre}`} />
          </div>
        </div>
      }
      items={tarjetas.map((t) => ({ clave: t.id, nodo: <Tarjeta t={t} /> }))}
    />
  )
}

function Tarjeta({ t }: { t: Tarjeta }) {
  return (
    <TarjetaContenido
      titulo={t.titulo}
      imagen={t.imagen}
      tipo={t.tipo}
      proveedor={t.proveedor}
      logoProveedor={t.logoProveedor}
      competencia={t.competencia}
      nivel={t.nivel}
      duracion={t.duracion}
      idioma={t.idioma}
      progreso={t.progreso}
      onClick={abrirContenido}
      className="h-full"
    />
  )
}

export function PestanaCompetencias({ planes, plan, onPlan, vacio }: PropsPlan) {
  return (
    <div className="flex flex-col gap-6">
      {vacio ? null : <PlanWidget tipo="competencias" planes={planes} plan={plan} onPlan={onPlan} />}
      {vacio || !planes.length ? (
        <Frame>
          <FramePanel>
          <VacioZona
            icono="glass-star"
            titulo="Todavía no tienes un plan de competencias"
            descripcion="Cuando tu empresa te asigne uno, aquí vas a ver las competencias que vas a desarrollar."
          />
          </FramePanel>
        </Frame>
      ) : plan ? (
        <BloqueCompetencia key={plan.id} plan={plan} />
      ) : (
        <Frame>
          <FramePanel>
          {/* El vacío del sistema, con su ilustración glass, y no un `Empty` armado a mano con un icono de línea. */}
          <PrimeraVez
            icono="glass-star"
            titulo="Sin competencias en este plan"
            descripcion="Selecciona un plan de competencias para ver su contenido asignado."
          />
          </FramePanel>
        </Frame>
      )}
    </div>
  )
}

// ── Exclusivo para mí ────────────────────────────────────────────────────────────────────────────────────────────

export function PestanaExclusivo({ vacio }: { vacio?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <Text as="p" size="sm" variant="muted">
        Contenidos habilitados solo para ti. No tienen fecha límite para ser completados.
      </Text>
      <ListaContenidos
        id="zona-exclusivo"
        tarjetas={vacio ? [] : TARJETAS_EXCLUSIVO}
        vacio={
          <VacioZona
            icono="glass-ticket-star"
            titulo="Todavía no tienes contenidos exclusivos"
            descripcion="Aquí va a aparecer lo que tu empresa habilite solo para ti."
          />
        }
      />
    </div>
  )
}

// ── Historial y certificados ─────────────────────────────────────────────────────────────────────────────────────

// La misma lista de las otras pestañas —tabla o cuadrícula—, con el estado del certificado y la manera de descargarlo.
// Abre en tabla, como ya estaba (Dave, 9-oct): es donde se leen de corrido el avance y el certificado de cada contenido.
export function PestanaHistorial({ vacio }: { vacio?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <Text as="p" size="sm" variant="muted">
        Consulta lo que has visto y descarga certificados de contenidos finalizados que lo incluyan.
      </Text>
      <ListaContenidos
        historial
        vistaInicial="tabla"
        id="zona-historial"
        tarjetas={vacio ? [] : TARJETAS_HISTORIAL}
        vacio={
          <VacioZona
            icono="glass-tick"
            titulo="Todavía no has terminado ningún contenido"
            descripcion="Cuando completes el primero aparecerá aquí, con su certificado si lo incluye."
          />
        }
      />
    </div>
  )
}
