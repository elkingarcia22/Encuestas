import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, Search01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemGroup,
  Text,
  TrafficLight,
} from '@ubits/flux-ui'
import { AZUL, AZUL_CLARO, GRIS, TOOLTIP } from '@/modules/admin/inicio/components/bloques'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ActualizadoHace } from '@/modules/design-system/estados/procesos'
import { plural } from '@/modules/design-system/patrones/formato'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'
import { SALIDA_PANEL, TIPOS, porTiempoSinEntrar, progresoDe, type Plan } from './planes-datos'

// El avance de un plan en un bloque, con el mismo lenguaje que «Avance del ciclo 360» de la Home: la dona con el
// porcentaje de quienes terminaron todo (RN-08), la leyenda con cuántos van en cada punto y, al lado, quiénes no lo han
// empezado, que es a quienes hay que escribirles.

export type Avance = 'Completado' | 'En curso' | 'Sin iniciar'
export const avanceDe = (p: Participante): Avance => (p.progreso === 100 ? 'Completado' : p.progreso > 0 ? 'En curso' : 'Sin iniciar')
export const BADGE_AVANCE: Record<Avance, 'success-light' | 'info-light' | 'outline'> = {
  Completado: 'success-light',
  'En curso': 'info-light',
  'Sin iniciar': 'outline',
}

const COLOR: Record<Avance, string> = { Completado: AZUL, 'En curso': AZUL_CLARO, 'Sin iniciar': GRIS }
const MOSTRAR = 4

export function AvancePlan({
  plan,
  filas,
  onVer,
  onRecordar,
}: {
  plan: Plan
  filas: Participante[]
  onVer: (p: Participante) => void
  onRecordar: (p: Participante[]) => void
}) {
  const textos = TIPOS[plan.tipo]
  const progreso = progresoDe(plan)
  const datos = (['Completado', 'En curso', 'Sin iniciar'] as Avance[]).map((avance) => ({
    avance,
    cuantos: filas.filter((f) => avanceDe(f) === avance).length,
    color: COLOR[avance],
  }))
  const sinIniciar = porTiempoSinEntrar(filas.filter((f) => avanceDe(f) === 'Sin iniciar'))
  // Todos los que no han empezado, en un panel (revisión de David, 30 sep: «que lo muestre todo en un drawer»).
  const [verTodos, setVerTodos] = useState<'abierto' | 'cerrando' | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const q = busqueda.trim().toLowerCase()
  const encontrados = sinIniciar.filter((p) => !q || `${p.nombre} ${p.area}`.toLowerCase().includes(q))
  const cerrarTodos = () => {
    setVerTodos('cerrando')
    window.setTimeout(() => setVerTodos(null), SALIDA_PANEL)
  }
  const persona = (p: Participante) => (
    <Item key={p.id} size="xs" render={<button type="button" />} className="cursor-pointer text-left" onClick={() => onVer(p)}>
      {/* La fila de persona del sistema (decisión 21 de la auditoría, 5-oct). */}
      <ItemContent className="min-w-0">
        <Persona nombre={p.nombre} detalle={`${p.area} · ${p.ultimoAcceso ? `entró ${p.ultimoAcceso}` : 'nunca ha entrado'}`} />
      </ItemContent>
    </Item>
  )
  const faltan = filas.length - datos[0].cuantos
  const vigente = plan.estado === 'Vigente'

  return (
    <Frame>
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Avance del plan</FrameTitle>
          <FrameDescription>
            Cuenta a quienes terminaron todos sus {textos.items}, no el promedio de avances.
          </FrameDescription>
        </div>
        {faltan ? (
          <Badge variant={vigente ? 'warning-light' : 'outline'}>
            {faltan} sin terminar
          </Badge>
        ) : (
          <Badge variant="success-light">Todos terminaron</Badge>
        )}
      </FrameHeader>

      <div className="grid gap-1 lg:grid-cols-2">
        <FramePanel className="flex flex-col justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-6">
            <div className="size-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip {...TOOLTIP} />
                  <Pie
                    data={datos}
                    dataKey="cuantos"
                    nameKey="avance"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {datos.map((dato) => (
                      <Cell key={dato.avance} fill={dato.color} />
                    ))}
                    <Label value={`${Math.round(progreso)} %`} position="center" fill="var(--foreground)" fontSize={20} fontWeight={600} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <TrafficLight
              className="flex-col items-start"
              data={{
                label: 'Avance de las personas',
                items: datos.map((dato) => ({
                  label: dato.avance === 'Completado' ? 'Terminaron' : dato.avance,
                  value: `${dato.cuantos} ${plural(dato.cuantos, 'persona', 'personas')}`,
                  color: dato.color,
                })),
              }}
            />
          </div>
          {/* RN-09: el dato no está en vivo. */}
          <ActualizadoHace
            texto="Actualizado hace 12 minutos"
            ayuda="El progreso del plan se actualiza cada 30 minutos, no en tiempo real. Cuenta a quienes terminaron todo lo asignado, no el promedio de avances."
          />
        </FramePanel>

        <FramePanel className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Heading as="h3" level={6}>
              Aún no lo empiezan
            </Heading>
            {vigente && sinIniciar.length ? (
              <Button variant="outline" size="sm" onClick={() => onRecordar(sinIniciar)}>
                <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
                Recordar a {plural(sinIniciar.length, 'esta persona', `las ${sinIniciar.length}`)}
              </Button>
            ) : null}
          </div>
          {sinIniciar.length ? (
            <>
              <ItemGroup className="gap-1">
                {sinIniciar.slice(0, MOSTRAR).map(persona)}
              </ItemGroup>
              {sinIniciar.length > MOSTRAR ? (
                <Button variant="link" size="sm" className="self-start px-0!" onClick={() => setVerTodos('abierto')}>
                  Ver las {sinIniciar.length.toLocaleString('es-CO')} personas
                </Button>
              ) : null}
            </>
          ) : (
            <Text as="p" variant="muted" size="sm">
              Todas las personas ya empezaron: {datos[1].cuantos ? `${datos[1].cuantos} van a mitad de camino.` : 'y terminaron.'}
            </Text>
          )}
        </FramePanel>
      </div>

      {verTodos ? (
        <DrawerShell
          open={verTodos === 'abierto'}
          onOpenChange={(abierto) => (abierto ? undefined : cerrarTodos())}
          size="md"
          icon={UserMultiple02Icon}
          title="Aún no lo empiezan"
          description={`${sinIniciar.length.toLocaleString('es-CO')} ${plural(sinIniciar.length, 'persona', 'personas')} del plan. Primero quien lleva más tiempo sin entrar.`}
          footerClassName="justify-between!"
          footer={
            <>
              <Button variant="outline" onClick={cerrarTodos}>
                Cerrar
              </Button>
              {vigente ? (
                <Button onClick={() => onRecordar(sinIniciar)}>
                  <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
                  Recordar a las {sinIniciar.length.toLocaleString('es-CO')}
                </Button>
              ) : null}
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar persona o área" aria-label="Buscar persona o área" />
            </InputGroup>
            {/* Con cientos de personas no se pintan todas: las primeras 100 y la búsqueda acota. */}
            <ItemGroup className="gap-1">{encontrados.slice(0, 100).map(persona)}</ItemGroup>
            {encontrados.length > 100 ? (
              <Text as="p" variant="muted" size="sm">
                Viendo 100 de {encontrados.length.toLocaleString('es-CO')}. Busca para acotar.
              </Text>
            ) : !encontrados.length ? (
              <Text as="p" variant="muted" size="sm">
                Nadie coincide con «{busqueda.trim()}».
              </Text>
            ) : null}
          </div>
        </DrawerShell>
      ) : null}
    </Frame>
  )
}
