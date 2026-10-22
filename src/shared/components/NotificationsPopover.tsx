import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Notification01Icon,
  PartyIcon,
  Settings02Icon,
  TickDouble01Icon,
} from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
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
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { HEADER_ICON } from '@/shared/components/header-icon'
import { notify } from '@/shared/components/notify'
import { NOTIFICATIONS, type Notification } from '@/shared/components/shell-data'

type NotificationsPopoverProps = {
  onOpenProcesses: () => void
  onOpenChangelog: () => void
}

type Filter = 'todas' | 'sin-leer'

// Las filas son el Item de la librería (el mismo de REUI): él pone el ritmo vertical, el título en medium y la bajada
// en gris. Aquí solo se le quita el radio y se le deja la línea de abajo, para que el panel se lea como una lista
// seguida y no como tarjetas sueltas; y se le enciende el hover, que el Item solo trae para enlaces.
const ROW =
  'rounded-none! border-x-0! border-t-0! border-b! border-b-border! text-left whitespace-normal! last:border-b-0! hover:bg-muted! dark:hover:bg-accent!'

// Filtro en pastilla: la marca de la pestaña activa (que en flux-ui se desliza) se pinta azul y redonda.
const FILTER =
  'h-7! flex-none! rounded-full! border-0! px-3! py-0! font-normal! text-muted-foreground! hover:text-foreground! data-active:font-normal! data-active:text-primary-foreground! data-active:hover:text-primary-foreground! [&>div]:rounded-full! [&>div]:bg-primary! [&>div]:shadow-none!'

// Enlace de texto del header y el pie: Button de flux-ui sin alto, relleno ni subrayado propios.
const TEXT_BUTTON = 'h-auto! rounded-sm! border-0! p-0! font-medium no-underline! hover:bg-transparent! dark:hover:bg-transparent!'

// Campana del header, sobre el Item de la librería (panel de 320px): cabecera con contador en pastilla azul y
// «Marcar todas» (sin cerrar, pedido de diseño); filtros Todas / Sin leer en pastilla; fila gris de novedades de
// versión; avisos con baldosa de icono, punto azul si están sin leer, hora y su acción subrayada; estado vacío
// «Todo leído» con el Empty de la librería y pie gris con «Configurar avisos» y «Ver todas».
export function NotificationsPopover({ onOpenProcesses, onOpenChangelog }: NotificationsPopoverProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Filter>('todas')
  const [items, setItems] = useState<Notification[]>(NOTIFICATIONS)

  const unread = items.filter((n) => n.fresh).length
  const visible = tab === 'todas' ? items : items.filter((n) => n.fresh)

  const close = () => setOpen(false)

  const act = (n: Notification) => {
    setItems((all) => all.map((x) => (x.id === n.id ? { ...x, fresh: false } : x)))
    close()
    if (n.cta === 'Abrir procesos') onOpenProcesses()
    else if (n.to) navigate(n.to)
    else notify(n.title)
  }

  const markAll = () => {
    setItems((all) => all.map((x) => ({ ...x, fresh: false })))
    notify('Notificaciones marcadas como leídas')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Icono en el gris del header; con el panel abierto, en azul como la opción activa de la barra lateral. */}
      <Hint label="Notificaciones">
        <PopoverTrigger
          // El punto azul avisa que hay sin leer: el nombre del botón lo dice también, para quien no lo ve.
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className={cn('relative', HEADER_ICON)}
              aria-label={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
            />
          }
        >
          <HugeiconsIcon icon={Notification01Icon} size={18} className="size-4.5" />
          {unread ? <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" /> : null}
        </PopoverTrigger>
      </Hint>

      {/* El panel de la librería es translúcido: se deja sólido, con las esquinas y la sombra amplia del prototipo.
          Con nombre (es una ventana para el lector de pantalla) y sin pasarse del ancho de la ventana en móvil (AA 1.4.10).
          El aire lateral es el del Item (12px), para que cabecera, filas y pie caigan en la misma línea. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label="Notificaciones"
        className="w-80! max-w-[calc(100vw-1rem)]! gap-0! overflow-hidden bg-popover! p-0! shadow-2xl"
      >
        {/* Cabecera */}
        <div className="flex items-center gap-2 px-3 pt-3.5 pb-3">
          <span className="text-[15px] font-medium">Notificaciones</span>
          {unread ? (
            <Badge radius="full" size="sm">
              <span className="tabular-nums">{unread}</span>
            </Badge>
          ) : null}
          {/* Sin botón de cerrar: el panel se cierra al hacer clic fuera o con Esc. */}
          <Button
            variant="ghost"
            className={cn(TEXT_BUTTON, 'ml-auto text-muted-foreground! hover:text-foreground!')}
            onClick={markAll}
          >
            <span className="text-sm">Marcar todas</span>
          </Button>
        </div>

        {/* Filtros en pastilla: la activa en azul. */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as Filter)} className="gap-0! border-b px-3 pb-3">
          <TabsList aria-label="Filtro de notificaciones" className="h-auto! justify-start! gap-2! rounded-none! bg-transparent! p-0!">
            {(
              [
                ['todas', 'Todas'],
                ['sin-leer', `Sin leer · ${unread}`],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger key={value} value={value} className={FILTER}>
                <span className={cn('text-[13px]', tab === value && 'font-medium')}>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Alto para que quepan la novedad y los 4 avisos sin cortar el último; con más avisos aparece el scroll. */}
        <div className="max-h-112 overflow-y-auto">
          <ItemGroup className="gap-0!">
            {/* Novedades de versión: fila gris con party-popper (el mismo de Novedades del header) en baldosa blanca y
                flecha. Todos los iconos del panel van en el gris y el trazo fino de la barra lateral. */}
            <Item
              size="sm"
              render={<button type="button" />}
              // Ya viene en gris, así que al pasar el cursor solo se oscurece un punto más, en vez de usar el gris de las demás.
              className={cn(ROW, 'bg-muted! hover:bg-foreground/8! dark:hover:bg-foreground/14!')}
              onClick={() => {
                close()
                onOpenChangelog()
              }}
            >
              <ItemMedia variant="icon">
                <IconTile
                  variant="solid"
                  className="size-8! rounded-sm! bg-background! text-muted-foreground! ring-1 ring-border ring-inset [--icon-tile-icon-size:16px] dark:bg-card!"
                >
                  <HugeiconsIcon icon={PartyIcon} size={16} strokeWidth={1.6} />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Novedades de la v4.2</ItemTitle>
                <ItemDescription className="line-clamp-1!">Cuatro mejoras nuevas esta semana</ItemDescription>
              </ItemContent>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="size-3.75 shrink-0 text-muted-foreground" />
            </Item>

            {visible.map((n) => (
              <Item
                key={n.id}
                size="sm"
                render={<button type="button" />}
                className={cn(ROW, 'items-start!')}
                onClick={() => act(n)}
              >
                {/* Sin leer: baldosa gris rellena; leída: solo el filo. El icono siempre en el gris de la barra lateral. */}
                <ItemMedia variant="icon">
                  <IconTile
                    variant="solid"
                    className={cn(
                      'size-8! rounded-sm! bg-transparent! text-muted-foreground! [--icon-tile-icon-size:16px]',
                      n.fresh ? 'bg-muted! dark:bg-accent!' : 'ring-1 ring-border ring-inset',
                    )}
                  >
                    <HugeiconsIcon icon={n.icon} size={16} strokeWidth={1.6} />
                  </IconTile>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className={cn(!n.fresh && 'font-normal!')}>
                    <span className="truncate">{n.title}</span>
                    {/* `aria-label` en un span sin rol no se lee: el aviso va como texto oculto. */}
                    {n.fresh ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">Sin leer</span>
                      </span>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>{n.text}</ItemDescription>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">{n.time}</span>
                    {n.cta ? <span className="font-medium text-foreground underline underline-offset-3">{n.cta}</span> : null}
                  </span>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>

          {/* Estado vacío de la librería, sin el filo punteado ni el aire de página entera que trae por defecto. */}
          {visible.length ? null : (
            <Empty className="border-0! p-8!">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={TickDouble01Icon} size={24} />
                </EmptyMedia>
                <EmptyTitle className="text-base!">Todo leído</EmptyTitle>
                <EmptyDescription>No te queda ningún aviso sin abrir.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        {/* Pie gris */}
        <div className="flex items-center justify-between border-t bg-muted px-3 py-2.5">
          <Button
            variant="ghost"
            className={cn(TEXT_BUTTON, 'gap-1.75! font-normal! text-muted-foreground! hover:text-foreground!')}
            onClick={() => {
              close()
              notify('Preferencias de notificación')
            }}
          >
            <HugeiconsIcon icon={Settings02Icon} size={14} className="size-3.5" />
            <span className="text-xs">Configurar avisos</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(TEXT_BUTTON, 'text-foreground! underline! underline-offset-3!')}
            onClick={() => {
              close()
              notify('Bandeja completa de notificaciones')
            }}
          >
            <span className="text-sm">Ver todas</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
