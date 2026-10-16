import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Briefcase06Icon,
  Mortarboard02Icon,
  Notification03Icon,
  PartyIcon,
  Settings02Icon,
  UserGroupIcon,
  WorkflowSquare10Icon,
} from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, IconTile, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, Tabs, TabsList, TabsTrigger, cn } from '@ubits/flux-ui'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const SEED = [
  { id: 1, icon: WorkflowSquare10Icon, title: 'Proceso terminado', text: 'Se publicó la política de vacaciones para 312 personas.', time: '9:58', unread: true },
  { id: 2, icon: Briefcase06Icon, title: 'Nuevo candidato', text: 'Laura Méndez avanzó a entrevista en Analista de datos.', time: '9:12', unread: true },
  { id: 3, icon: UserGroupIcon, title: 'Evaluaciones vencidas', text: '24 evaluaciones 360 de Ventas siguen sin cerrar.', time: '8:40', unread: true },
  { id: 4, icon: Mortarboard02Icon, title: 'Curso publicado', text: 'Onboarding operativo quedó disponible para 128 personas.', time: 'Ayer', unread: false },
]

// Caso: la campana del header en un panel, igual que NotificationsPopover (auditoría, 5 oct): «Notificaciones», filtro
// Todas / Sin leer · N con «Marcar todas» arriba, fila gris de novedades (abre «Ver qué cambió»), avisos con punto si
// están sin leer, estado vacío y pie con «Configurar avisos» y «Ver todas». Sin «Menciones».
export function NotificationsDrawer({ open, onOpenChange }: Props) {
  const [items, setItems] = useState(SEED)
  const [tab, setTab] = useState('todas')
  const [novedades, setNovedades] = useState(false)
  const unread = items.filter((item) => item.unread).length
  const visible = tab === 'todas' ? items : items.filter((item) => item.unread)

  const markRead = (id: number) => setItems((all) => all.map((item) => (item.id === id ? { ...item, unread: false } : item)))

  return (
    <>
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      icon={Notification03Icon}
      title="Notificaciones"
      description={unread ? `${unread} sin leer` : 'Estás al día'}
      headerExtra={
        <div className="flex items-center gap-2 border-b px-5 py-2.5">
          <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="sin-leer">Sin leer · {unread}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            className={`ml-auto ${WS}`}
            disabled={!unread}
            onClick={() => {
              setItems((all) => all.map((item) => ({ ...item, unread: false })))
              notify('Notificaciones marcadas como leídas')
            }}
          >
            Marcar todas
          </Button>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" className={`mr-auto ${WS}`} onClick={() => notify('Preferencias de notificación')}>
            <HugeiconsIcon icon={Settings02Icon} size={16} />
            Configurar avisos
          </Button>
          <Button className={WS} onClick={() => notify('Bandeja completa de notificaciones')}>
            Ver todas
          </Button>
        </>
      }
    >
      {/* Novedades de la versión en una fila gris, siempre arriba de los avisos, como en la campana. */}
      <div className="-mx-2 mb-1 flex flex-col">
        <Item
          size="sm"
          render={<button type="button" />}
          onClick={() => {
            onOpenChange(false)
            setNovedades(true)
          }}
          className="rounded-xl! bg-muted! px-2! text-left hover:bg-foreground/8! dark:hover:bg-foreground/14!"
        >
          <ItemMedia variant="icon">
            <IconTile variant="soft" size="sm">
              <HugeiconsIcon icon={PartyIcon} />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Novedades de la v4.2</ItemTitle>
            <ItemDescription className="line-clamp-1!">Tres mejoras nuevas esta semana</ItemDescription>
          </ItemContent>
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="shrink-0 text-muted-foreground" />
        </Item>
      </div>
      {visible.length ? (
        <div className="-mx-2 flex flex-col">
          {visible.map((item) => (
            <Item
              key={item.id}
              size="sm"
              render={<button type="button" />}
              onClick={() => markRead(item.id)}
              className="items-start! rounded-xl! px-2! text-left hover:bg-muted!"
            >
              <ItemMedia variant="icon">
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={item.icon} />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className={cn(!item.unread && 'font-normal! text-muted-foreground!')}>{item.title}</ItemTitle>
                <ItemDescription>{item.text}</ItemDescription>
              </ItemContent>
              <ItemActions className="shrink-0 flex-col! items-end! gap-2!">
                <span className="tabular-nums text-xs text-muted-foreground">{item.time}</span>
                {item.unread ? (
                  <>
                    <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
                    <span className="sr-only">Sin leer</span>
                  </>
                ) : null}
              </ItemActions>
            </Item>
          ))}
        </div>
      ) : (
        <Empty className="py-10">
          <EmptyHeader>
            {/* Vacío con ilustración glass, como todos (decisión 14 de la auditoría, 5-oct). */}
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-tick" />
            </EmptyMedia>
            {/* Los mismos textos del vacío de la campana real (auditoría, 5 oct). */}
            <EmptyTitle>Todo leído</EmptyTitle>
            <EmptyDescription>No te queda ningún aviso sin abrir.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </DrawerShell>
    <ChangelogDialog open={novedades} onOpenChange={setNovedades} />
    </>
  )
}
