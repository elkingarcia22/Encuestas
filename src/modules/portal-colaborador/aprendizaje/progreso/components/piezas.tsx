import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { MedalThirdPlaceIcon, Medal01Icon, SentIcon, ChampionIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Button,
  Card,
  CardContent,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Separator,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  cn,
  toast,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { ColumnaIndicador } from '@/modules/design-system/graficos/fila-indicadores'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import {
  avatarDe,
  CATALOGO,
  formatIndicatorNumber,
  horasMinutos,
  imagenCompetencia,
  minutosCompetencia,
  PLANES,
  tarjetaUbits,
  type Plan,
  type Registro,
} from '../../zona-de-estudio/components/datos'
import { resumenPlan, type Fila } from './datos'

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function AvatarPersona({ persona, className, size }: { persona: Registro; className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const src = avatarDe(persona)
  return (
    <Avatar size={size} className={className}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{iniciales(persona.nombre)}</AvatarFallback>
    </Avatar>
  )
}

// ── Selector del equipo ──────────────────────────────────────────────────────────────────────────────────────────

/** Los avatares del equipo, encimados; clic para ver el progreso de esa persona. Los que no caben van en «+N». */
export function SelectorEquipo({
  personas,
  visibles,
  elegida,
  onElegir,
}: {
  personas: Registro[]
  visibles: number
  elegida: string
  onElegir: (id: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const aLaVista = personas.slice(0, visibles)
  const resto = personas.slice(visibles)
  // El grupo de avatares con contador de la librería (Avatar › AvatarGroup + AvatarGroupCount). Cada avatar es un botón
  // para ver el progreso de esa persona; el contador abre la lista de los que no caben.
  return (
    <AvatarGroup role="group" aria-label="Tu equipo">
      {aLaVista.map((p) => (
        <Hint key={p.id} label={p.nombre}>
          <Avatar
            size="sm"
            render={<button type="button" />}
            // El tooltip le pone su propio data-slot; se devuelve el del avatar para que el grupo le dé su borde.
            data-slot="avatar"
            aria-label={p.nombre}
            aria-pressed={p.id === elegida}
            onClick={() => onElegir(p.id)}
            className={cn('cursor-pointer outline-none focus-visible:ring-ring', p.id === elegida && 'z-10 ring-primary!')}
          >
            {avatarDe(p) ? <AvatarImage src={avatarDe(p)} alt="" /> : null}
            <AvatarFallback>{iniciales(p.nombre)}</AvatarFallback>
          </Avatar>
        </Hint>
      ))}
      {resto.length ? (
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger
            nativeButton={false}
            render={
              <AvatarGroupCount
                data-slot="avatar-group-count"
                role="button"
                tabIndex={0}
                aria-label={`Ver ${resto.length} más`}
                className="cursor-pointer"
              />
            }
          >
            +{resto.length}
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-80 w-72 overflow-y-auto p-1">
            {resto.map((p) => (
              <Item
                key={p.id}
                size="sm"
                variant={p.id === elegida ? 'muted' : 'default'}
                render={<button type="button" />}
                className="w-full text-left"
                onClick={() => {
                  onElegir(p.id)
                  setAbierto(false)
                }}
              >
                <ItemMedia>
                  <AvatarPersona persona={p} size="sm" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{p.nombre}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
    </AvatarGroup>
  )
}

// ── Indicadores ──────────────────────────────────────────────────────────────────────────────────────────────────

// La misma fila de indicadores que las métricas del admin (`FilaIndicadores`): un solo panel partido por divisores,
// con el nombre arriba, la cifra abajo y el icono en la esquina derecha. Antes cada cifra era su propia tarjeta y no se
// parecía a ninguna otra sección de métricas del playground (Dave, 9-oct).
export function Indicador({ icono, color, valor, etiqueta }: { icono: IconSvgElement; color: string; valor: number; etiqueta: string }) {
  return (
    <ColumnaIndicador
      titulo={etiqueta}
      cifra={formatIndicatorNumber(valor)}
      grafico={
        <IconTile variant="soft" size="sm" className={color}>
          <HugeiconsIcon icon={icono} aria-hidden="true" />
        </IconTile>
      }
    />
  )
}

// ── Tarjeta de plan ──────────────────────────────────────────────────────────────────────────────────────────────

export function TarjetaPlan({ plan, personaId, onAbrir }: { plan: Plan; personaId: string; onAbrir: () => void }) {
  const { pct, etiqueta, cierre } = resumenPlan(plan, personaId)
  const completo = pct >= 100
  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      data-plan-id={plan.id}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAbrir()
        }
      }}
      className="h-full cursor-pointer transition-shadow hover:ring-primary focus-visible:ring-primary"
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Text as="span" size="sm" variant="muted">
            Tipo: {plan.tipo === 'competencias' ? 'Competencias' : 'Contenidos'}
          </Text>
          <Text as="span" size="sm" variant="muted">
            {cierre}
          </Text>
        </div>
        <Heading as="h3" level={6} className="truncate">
          {plan.nombre}
        </Heading>
        <Progress value={pct} aria-label="Progreso del plan" className={cn(completo && '**:data-[slot=progress-indicator]:bg-success')} />
        <div className="flex items-center justify-between gap-2">
          <Text as="span" size="sm" variant="muted">
            {etiqueta}
          </Text>
          <Text as="span" size="sm" weight="semibold" className={cn('tabular-nums', completo ? 'text-success' : 'text-primary')}>
            {pct} %
          </Text>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Rankings ─────────────────────────────────────────────────────────────────────────────────────────────────────

const MEDALLA: Record<number, { icono: IconSvgElement; color: string }> = {
  1: { icono: ChampionIcon, color: 'text-warning' },
  2: { icono: Medal01Icon, color: 'text-muted-foreground' },
  3: { icono: MedalThirdPlaceIcon, color: 'text-destructive' },
}

const ALTO_FILA = 44

export function Ranking({
  titulo,
  descripcion,
  extra,
  filas,
  resaltada,
  vacio,
  seguir = false,
}: {
  titulo: string
  descripcion: string
  extra?: React.ReactNode
  filas: Fila[]
  resaltada: string
  /** El vacío del sistema: la ilustración glass («glass-clock»), lo que falta y qué va a aparecer aquí. */
  vacio: { icono: string; titulo: string; descripcion: string }
  /** Baja la lista hasta la fila resaltada cuando cambia. */
  seguir?: boolean
}) {
  const lista = useRef<HTMLOListElement>(null)
  const podio = filas.slice(0, 3)
  const resto = filas.slice(3)
  const posicion = filas.findIndex((f) => f.clave === resaltada) + 1

  // La fila resaltada queda arriba de la lista con scroll (como en el prototipo); si está en el podio, la lista vuelve al inicio.
  useEffect(() => {
    const caja = lista.current
    if (!seguir || !caja) return
    const fila = posicion > 3 ? caja.querySelector<HTMLElement>(`[data-rank="${posicion}"]`) : null
    caja.scrollTop = fila ? fila.offsetTop - caja.offsetTop : 0
  }, [seguir, posicion, filas])

  const fila = (f: Fila, i: number) => {
    const puesto = i + 1
    const medalla = MEDALLA[puesto]
    const propia = f.clave === resaltada
    return (
      <li
        key={f.clave}
        data-rank={puesto}
        className={cn('grid min-h-11 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2', propia && 'bg-muted')}
      >
        {medalla ? (
          <IconTile variant="soft" size="xs" radius="full" className={medalla.color} aria-hidden="true">
            <HugeiconsIcon icon={medalla.icono} />
          </IconTile>
        ) : (
          <Text as="span" size="sm" weight="semibold" className="text-center tabular-nums">
            {puesto}
          </Text>
        )}
        <Text as="span" size="sm" title={f.etiqueta} className={cn('truncate', propia && 'font-semibold text-primary')}>
          {f.etiqueta}
        </Text>
        <Text as="span" size="sm" weight="semibold" className="text-right tabular-nums">
          {f.texto}
        </Text>
      </li>
    )
  }

  return (
    <Frame spacing="sm" className="h-full">
      {/* El título y lo que ordena la lista viven en el marco gris; el panel blanco es solo el ranking (Dave, 9-oct). */}
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <FrameTitle>{titulo}</FrameTitle>
          <FrameDescription>{descripcion}</FrameDescription>
        </div>
        {extra}
      </FrameHeader>
      <FramePanel className="flex h-full flex-col gap-3">
        {filas.length ? (
          <div className="flex flex-col gap-1">
            <ol className="flex flex-col gap-1">{podio.map(fila)}</ol>
            {resto.length ? (
              <>
                <Separator />
                <ol ref={lista} className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: ALTO_FILA * 7 }}>
                  {resto.map((f, i) => fila(f, i + 3))}
                </ol>
              </>
            ) : null}
          </div>
        ) : (
          <PrimeraVez className="py-8" icono={vacio.icono} titulo={vacio.titulo} descripcion={vacio.descripcion} />
        )}
      </FramePanel>
    </Frame>
  )
}

export type Alcance = 'equipo' | 'empresa'

export function AlcanceRanking({ valor, onCambiar }: { valor: Alcance; onCambiar: (v: Alcance) => void }) {
  return (
    <ToggleGroup
      aria-label="Alcance del ranking"
      value={[valor]}
      onValueChange={(v) => v.length && onCambiar(v[0] as Alcance)}
      variant="outline"
      size="sm"
      spacing={0}
    >
      <ToggleGroupItem value="equipo" className="px-3">
        Equipo
      </ToggleGroupItem>
      <ToggleGroupItem value="empresa" className="px-3">
        Empresa
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

// ── Recordatorio de estudio ──────────────────────────────────────────────────────────────────────────────────────

/** «Enviar recordatorio» de la cabecera de la página, con su modal de confirmación. */
export function BotonRecordatorio({ hayPendientes, onEnviado }: { hayPendientes: boolean; onEnviado: () => void }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <HugeiconsIcon icon={SentIcon} data-icon="inline-start" aria-hidden="true" />
        Enviar recordatorio
      </Button>
      <ModalRecordatorio
        abierto={abierto}
        hayPendientes={hayPendientes}
        onCerrar={() => setAbierto(false)}
        onConfirmar={() => {
          setAbierto(false)
          // En el prototipo, la vista del correo se abre cuando se cierra el aviso.
          // 13-oct: queda con toast.add a propósito: notify todavía no admite onRemove (para ingeniería).
          toast.add({ type: 'success', title: 'Recordatorios enviados', onRemove: onEnviado })
        }}
      />
    </>
  )
}

// La ventana de acción del sistema (auditoría, decisión 4): la X arriba y el pie gris con la nota, Cancelar y enviar,
// como en la plantilla de Progreso del design system.
function ModalRecordatorio({
  abierto,
  hayPendientes,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  hayPendientes: boolean
  onCerrar: () => void
  onConfirmar: () => void
}) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="sm"
      title="Enviar recordatorio"
      note={hayPendientes ? 'Al enviarlo se abre el correo que reciben.' : undefined}
      confirmLabel="Enviar recordatorio"
      pendingLabel="Enviando…"
      onConfirm={onConfirmar}
      footer={hayPendientes ? undefined : <Button onClick={onCerrar}>Entendido</Button>}
    >
      <Text as="p">
        {hayPendientes
          ? 'Se enviará un recordatorio por correo a todas las personas de tu equipo que no hayan completado sus planes de formación, informándoles su avance hasta el momento y la fecha de vencimiento de cada plan.'
          : 'En este momento no hay personas con planes de formación sin completar.'}
      </Text>
    </ActionDialog>
  )
}

// ── Detalle del plan de otra persona ─────────────────────────────────────────────────────────────────────────────

export function DrawerPlan({ plan, persona, onCerrar }: { plan: Plan | null; persona: Registro | undefined; onCerrar: () => void }) {
  const abierto = Boolean(plan && persona)
  const id = persona?.id ?? ''
  const detalle = plan && plan.tipo === 'contenidos' ? (PLANES.getDetalleContenidoPorUsuario(plan)[id] ?? []) : []
  const competencias = plan && plan.tipo === 'competencias' ? (plan.competenciaPorUsuario?.[id] ?? []) : []
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="sm"
      title="Detalle del plan"
      description="Cómo va esta persona en el plan, contenido por contenido."
      footer={
        <Button className="w-full" onClick={onCerrar}>
          Cerrar
        </Button>
      }
    >
      {/* De quién y de qué plan: en el cuerpo, no en el título de la cabecera, que se queda fijo (Carlos, 1-oct). */}
      {plan && persona ? (
        <div className="mb-4 flex flex-col gap-0.5">
          {/* Por debajo del título del panel, que mide 16px: antes esta línea era más grande que la cabecera. */}
          <Text as="p" size="sm" weight="semibold">
            {persona.nombre}
          </Text>
          <Text size="sm" variant="muted">
            {plan.nombre}
          </Text>
        </div>
      ) : null}
      <ItemGroup className="flex flex-col gap-2">
        {detalle.map((item) => {
          const c = CATALOGO.find((x) => x.id === item.id || x.titulo === item.title)
          const t = c ? tarjetaUbits(c, item.progress ?? 0) : null
          const pct = item.progress ?? 0
          return (
            <Item key={item.id} variant="outline" size="sm" className="flex-col items-stretch gap-2">
              <div className="flex items-center gap-3">
                <ItemMedia variant="image" className="aspect-video! w-20! shrink-0 overflow-hidden rounded-md">
                  {t?.imagen ? <img src={t.imagen} alt="" className="size-full object-cover" /> : null}
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-2">{t?.titulo ?? item.title}</ItemTitle>
                  <ItemDescription>
                    {t?.tipo ?? 'Curso'} · {t?.proveedor ?? 'UBITS'} · {t?.duracion ?? item.duration}
                  </ItemDescription>
                </ItemContent>
              </div>
              <Progress value={pct} aria-label={`Progreso de ${t?.titulo ?? item.title}`} />
            </Item>
          )
        })}
        {competencias.map((c) => {
          const total = minutosCompetencia(plan as Plan, id).total
          const hechos = competencias.length === 1 ? minutosCompetencia(plan as Plan, id).hechos : (total * (c.progress ?? 0)) / 100
          return (
            <Item key={c.id} variant="outline" size="sm" className="flex-col items-stretch gap-2">
              <div className="flex items-center gap-3">
                <ItemMedia variant="image" className="size-12! shrink-0 overflow-hidden rounded-md">
                  <img src={imagenCompetencia(c.id)} alt="" className="size-full object-cover" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.title ?? c.nombre}</ItemTitle>
                  <ItemDescription>
                    {horasMinutos(hechos)} de {horasMinutos(total)}
                  </ItemDescription>
                </ItemContent>
              </div>
              <Progress value={c.progress ?? 0} aria-label="Progreso de competencia" />
            </Item>
          )
        })}
      </ItemGroup>
    </DrawerShell>
  )
}
