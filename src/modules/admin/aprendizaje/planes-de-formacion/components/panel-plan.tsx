import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, BookOpen01Icon, Delete02Icon, Edit02Icon, Mail01Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import { ICONO_ALCANCE } from './agregar-asignacion'
import { BADGE_AVANCE, avanceDe } from './avance-plan'
import { fichaDe } from './catalogo'
import { BADGE_ESTADO, enfoqueDe, NOMBRE_ALCANCE, TIPOS, aQuien, itemsDelPlan, momentoDe, personasDelPlan, porTiempoSinEntrar, progresoDe, rutaPlan, type Plan } from './planes-datos'

// «Ver plan»: al tocar un plan en la lista se abre aquí, sin salir de ella. Es el mismo contenido que UBITS muestra
// en «Detalle del plan» (estado, fechas, progreso, a quién le llega y con qué), resumido, y desde aquí se va a lo
// demás: abrir el plan completo con su tabla de personas, editarlo o eliminarlo. Así un plan se abre siempre igual,
// esté en el estado que esté, y las acciones quedan en un solo sitio.
//
// Decidido con diseño (30 sep, después de probar tres variantes): arriba el avance en grande; debajo, dos pestañas:
// los contenidos SIEMPRE en tarjetas (la tarjeta de contenido del equipo) y las personas SIEMPRE en lista.
//
// Editar ya no vive en este panel (auditoría del 5-oct, decisión 5: crear y editar en una página con la barra fija
// abajo, nunca en panel ni ventana). «Editar» lleva a la misma página de Crear plan, con los datos del plan cargados.

export function PanelPlan({
  abierto,
  onAbiertoChange,
  plan,
  onAbrir,
  onEliminar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  plan: Plan
  onAbrir?: () => void
  onEliminar: () => void
}) {
  const navigate = useNavigate()
  const [pestana, setPestana] = useState('items')
  const [recordando, setRecordando] = useState(false)
  const textos = TIPOS[plan.tipo]
  const Items = textos.items.charAt(0).toUpperCase() + textos.items.slice(1)
  const competencias = plan.tipo === 'competencias'
  const empezo = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const editable = plan.estado !== 'No vigente'
  const personas = personasDelPlan(plan)
  const items = itemsDelPlan(plan)
  const progreso = Math.round(progresoDe(plan))
  const cuenta = (avance: ReturnType<typeof avanceDe>) => personas.filter((p) => avanceDe(p) === avance).length
  const n = (cuantos: number) => `${cuantos.toLocaleString('es-CO')} ${plural(cuantos, 'persona', 'personas')}`
  const sinEmpezar = porTiempoSinEntrar(personas.filter((p) => avanceDe(p) === 'Sin iniciar'))

  // La tarjeta de contenido del equipo (decisión 17 de la auditoría, 5-oct): el avance va en la barra sobre la portada y
  // el dato del plan —cuántos lo terminaron o a cuántos se asignó— en la esquina de la portada.
  const tarjetas = (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <TarjetaContenido
          key={item.titulo}
          {...fichaDe(plan.tipo, item.titulo, { horas: plan.horas, enfoque: enfoqueDe(plan, item.titulo) })}
          progreso={empezo && item.personas.length ? Math.round((item.terminaron / item.personas.length) * 100) : undefined}
          encimaIzquierda={
            <span className="inline-flex rounded-sm bg-card">
              <Badge variant="secondary" size="xs" className="font-normal tabular-nums">
                {empezo ? `${item.terminaron.toLocaleString('es-CO')} de ${item.personas.length.toLocaleString('es-CO')} terminaron` : n(item.personas.length)}
              </Badge>
            </span>
          }
          className="h-full"
        />
      ))}
    </div>
  )

  const listaDePersonas = (quienes: typeof personas, conAvance: boolean) => (
    <ItemGroup className="gap-1">
      {quienes.map((p) => (
        <Item key={p.id} size="xs">
          {/* La fila de persona del sistema (decisión 21 de la auditoría, 5-oct). */}
          <ItemContent className="min-w-0">
            <Persona nombre={p.nombre} detalle={`${p.area} · ${p.ultimoAcceso ? `entró ${p.ultimoAcceso}` : 'nunca ha entrado'}`} />
          </ItemContent>
          <ItemActions>
            {conAvance ? (
              <Badge variant={BADGE_AVANCE[avanceDe(p)]} size="xs">
                {p.hechos} de {p.total}
              </Badge>
            ) : null}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )

  const recordar = (
    <Button variant="outline" size="sm" onClick={() => setRecordando(true)}>
      <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
      Recordar a {sinEmpezar.length.toLocaleString('es-CO')}
    </Button>
  )

  const enLista = porTiempoSinEntrar(personas).slice(0, 20)

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="md"
      // 32 px más que el panel mediano (480 → 512): las dos tarjetas por fila respiran sin pasar al tamaño grande.
      style={{ width: '32rem' }}
      icon={competencias ? Target02Icon : BookOpen01Icon}
      kicker={textos.singular}
      title={plan.nombre}
      badge={
        <Badge variant={BADGE_ESTADO[plan.estado]} size="sm">
          {plan.estado === 'Procesando' ? `Procesando ${plan.procesando ?? 0} %` : plan.estado}
        </Badge>
      }
      description={`${fechaSinAnio(plan.inicio)} – ${fechaCorta(plan.fin)} · ${momentoDe(plan)}${empezo ? ` · ${n(personas.length)}` : ''}${competencias && plan.horas ? ` · ${plan.horas} h por competencia` : ''}`}
      footerClassName="justify-between!"
      footer={
        <>
          <Button variant="destructive" onClick={onEliminar}>
            <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
            Eliminar
          </Button>
          <div className="flex items-center gap-2">
            {/* Un plan que ya empezó se abre completo para ver a cada persona; uno que aún no, se edita. Editar lleva a
                la página del plan (la misma de Crear), no se edita dentro del panel. */}
            {editable ? (
              <Button variant={empezo ? 'outline' : 'default'} onClick={() => navigate(rutaPlan(`${plan.id}/editar`))}>
                <HugeiconsIcon icon={Edit02Icon} size={16} aria-hidden="true" />
                Editar
              </Button>
            ) : null}
            {empezo && onAbrir ? (
              <Button onClick={onAbrir}>
                Ver plan completo
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* El plan en cifras, por renglones: la cifra grande con su acción, la barra a todo el ancho, el avance en una
            sola fila y, aparte, a quién se le asignó (es un dato, no un estado). */}
        <Item variant="muted">
          <ItemContent className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <Heading as="h3" level={2} className="tabular-nums">
                  {empezo ? `${progreso} %` : personas.length.toLocaleString('es-CO')}
                </Heading>
                <ItemDescription>
                  {empezo ? `de ${n(personas.length)} terminaron todo` : `${plural(personas.length, 'persona lo recibe', 'personas lo reciben')} el ${fechaCorta(plan.inicio)}`}
                </ItemDescription>
              </div>
              {empezo && plan.estado === 'Vigente' && sinEmpezar.length ? recordar : null}
            </div>
            {empezo ? (
              <>
                <Progress value={progreso} aria-label={`${progreso} % del plan`} />
                <span className="flex flex-wrap gap-1.5">
                  <Badge variant="success-light" size="sm">
                    {cuenta('Completado')} terminaron
                  </Badge>
                  <Badge variant="info-light" size="sm">
                    {cuenta('En curso')} en curso
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {cuenta('Sin iniciar')} sin iniciar
                  </Badge>
                </span>
              </>
            ) : null}
            <ItemSeparator />
            {plan.asignaciones.map((a) => (
              <span key={a.id} className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon icon={ICONO_ALCANCE[a.alcance]} size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <Text as="span" size="sm" variant="muted" className="truncate">
                  {NOMBRE_ALCANCE[a.alcance]}
                  {a.alcance === 'empresa' ? '' : ` · ${aQuien(a)}`}
                </Text>
              </span>
            ))}
          </ItemContent>
        </Item>

        <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))}>
          <TabsList variant="line">
            <TabsTrigger value="items" className="flex-none px-3">
              {Items} · {items.length}
            </TabsTrigger>
            <TabsTrigger value="personas" className="flex-none px-3">
              Personas · {personas.length.toLocaleString('es-CO')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {pestana === 'items' ? (
          tarjetas
        ) : (
          <>
            {/* Primero quien lleva más tiempo sin entrar: es a quien hay que escribirle. */}
            {listaDePersonas(enLista, empezo)}
            {personas.length > enLista.length ? (
              <Text as="p" variant="muted" size="sm">
                Y {(personas.length - enLista.length).toLocaleString('es-CO')} más.{empezo ? ' Abre el plan completo para buscar, filtrar y ver a cada persona.' : ''}
              </Text>
            ) : null}
          </>
        )}

        {/* Le llega a otras personas: dice a cuántas antes de enviar, igual que «Enviar recordatorio» del detalle del plan. */}
        <DialogoConfirmar
          abierto={recordando}
          onAbiertoChange={setRecordando}
          icono={Mail01Icon}
          titulo="Enviar recordatorio"
          descripcion={
            sinEmpezar.length === 1
              ? `Le llegará un correo a ${sinEmpezar[0].nombre} con lo que le falta de «${plan.nombre}» y la fecha de cierre (${fechaCorta(plan.fin)}).`
              : `Le llegará un correo a ${sinEmpezar.length.toLocaleString('es-CO')} personas que aún no empiezan «${plan.nombre}», con lo que les falta y la fecha de cierre (${fechaCorta(plan.fin)}).`
          }
          accion={sinEmpezar.length === 1 ? 'Enviar recordatorio' : `Enviar a ${sinEmpezar.length.toLocaleString('es-CO')} personas`}
          onConfirmar={() => {
            notify('Recordatorio enviado', `Va en camino a ${sinEmpezar.length === 1 ? sinEmpezar[0].nombre : `${sinEmpezar.length.toLocaleString('es-CO')} personas`}.`)
            setRecordando(false)
          }}
        />
      </div>
    </DrawerShell>
  )
}
