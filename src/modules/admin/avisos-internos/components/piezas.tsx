import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Archive01Icon,
  Link01Icon,
  PlayIcon,
  PlusSignIcon,
  ThumbsUpIcon,
  WorkHistoryIcon,
} from '@hugeicons/core-free-icons'
import {
  AspectRatio,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DrawerClose,
  IconTile,
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { fechaHora, iniciales } from '@/modules/design-system/patrones/formato'
import type { Aviso, EstadoAviso, Multimedia } from './datos'

// ── Estado ──

const BADGE_ESTADO: Record<EstadoAviso, 'success-light' | 'secondary' | 'info-light' | 'outline'> = {
  Publicado: 'success-light',
  Borrador: 'secondary',
  Programado: 'info-light',
  Archivado: 'outline',
}

export function EstadoBadge({ estado, size = 'sm' }: { estado: EstadoAviso; size?: 'sm' | 'default' }) {
  return (
    <Badge variant={BADGE_ESTADO[estado]} size={size}>
      {estado}
    </Badge>
  )
}

// ── Miniatura de la columna «Contenido» ──

export function Miniatura({ multimedia, icono, titulo }: { multimedia: Multimedia | null; icono: IconSvgElement; titulo: string }) {
  return (
    <div className="w-16">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
        {multimedia?.tipo === 'imagen' ? (
          <img src={multimedia.src} alt={`Imagen de «${titulo}»`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <IconTile variant="soft" size="xs">
              <HugeiconsIcon icon={multimedia?.tipo === 'video' ? PlayIcon : icono} aria-hidden="true" />
            </IconTile>
          </div>
        )}
      </AspectRatio>
    </div>
  )
}

// ── Historial de cambios (Ver historial) ──

export function HistorialSheet({ aviso, onCerrar }: { aviso: Aviso | null; onCerrar: () => void }) {
  return (
    <DrawerShell
      open={aviso !== null}
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      title="Historial de cambios"
      description="Quién cambió qué y cuándo, de lo más reciente a lo más viejo."
      footer={<DrawerClose render={<Button variant="outline" />}>Cerrar</DrawerClose>}
    >
      {/* De qué aviso es el historial: en el cuerpo, no en la cabecera, que se queda fija (Carlos, 1-oct). */}
      {aviso ? (
        <div className="mb-4 flex flex-col items-start gap-1">
          {/* Por debajo del título del panel, que mide 16px: antes esta línea era más grande que la cabecera. */}
          <Text as="p" size="sm" weight="semibold">
            {aviso.titulo}
          </Text>
          <EstadoBadge estado={aviso.estado} />
        </div>
      ) : null}
      {aviso ? (
        <Timeline orientation="vertical" value={aviso.historial.length}>
          {aviso.historial.map((cambio, indice) => (
            <TimelineItem key={cambio.id} step={indice + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{fechaHora(cambio.fecha)}</TimelineDate>
                <TimelineTitle className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{iniciales(cambio.autor)}</AvatarFallback>
                  </Avatar>
                  {cambio.accion}
                </TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>
                <Text variant="muted" size="sm">
                  {cambio.autor}
                  {cambio.detalle ? ` · ${cambio.detalle}` : ''}
                </Text>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      ) : null}
    </DrawerShell>
  )
}

// ── Guía de uso (modal de bienvenida de la plataforma) ──

const PASOS: { icono: IconSvgElement; titulo: string; texto: string }[] = [
  {
    icono: PlusSignIcon,
    titulo: 'Crear aviso',
    texto: 'Escribe el título, la descripción y, si quieres, un link y una imagen o video. Revisa la vista previa y publícalo.',
  },
  {
    icono: Archive01Icon,
    titulo: 'Archivar',
    texto: 'Cuando un aviso ya no aplica, archívalo desde el menú de la fila. Deja de verse en el inicio y conserva sus métricas.',
  },
  {
    icono: WorkHistoryIcon,
    titulo: 'Historial',
    texto: 'Consulta quién creó, editó, publicó o archivó cada aviso y cuándo lo hizo.',
  },
]

export function GuiaDialog({ abierta, onAbiertaChange }: { abierta: boolean; onAbiertaChange: (abierta: boolean) => void }) {
  return (
    // La única ventana del sistema, ActionDialog (decisión 4 de la auditoría, 5-oct: ConfiguredModal se retiró).
    <ActionDialog
      open={abierta}
      onOpenChange={onAbiertaChange}
      size="sm"
      title="Guía de uso de Avisos internos"
      sub="Publica noticias y comunicados para los colaboradores en tres pasos."
      footer={<Button onClick={() => onAbiertaChange(false)}>Entendido</Button>}
    >
      <ItemGroup className="flex flex-col gap-2">
        {PASOS.map((paso) => (
          <Item key={paso.titulo} variant="outline" size="sm">
            <ItemMedia>
              <IconTile variant="soft" size="sm">
                <HugeiconsIcon icon={paso.icono} aria-hidden="true" />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{paso.titulo}</ItemTitle>
              <Text variant="muted" size="sm">
                {paso.texto}
              </Text>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </ActionDialog>
  )
}

// ── Vista previa: la tarjeta del aviso en el inicio del colaborador ──

type VistaPreviaProps = {
  titulo: string
  descripcion: string
  link: string
  multimedia: Multimedia | null
}

export function VistaPrevia({ titulo, descripcion, link, multimedia }: VistaPreviaProps) {
  return (
    <Card>
      {multimedia?.tipo === 'imagen' ? (
        <img src={multimedia.src} alt="Imagen del aviso" className="aspect-video w-full object-cover" />
      ) : null}
      <CardHeader>
        {/* Sin avatar ni autor: el nombre que salía («Gestión Humana · Meta Colombia») estaba escrito a mano y no
            venía de ningún dato del aviso —el avatar, en cambio, sí usaba el autor—, así que decían cosas distintas
            y no se sabía de dónde salía ninguno (Dave, 2-oct). */}
        <Text as="span" variant="muted" size="xs">
          Ahora
        </Text>
        <CardTitle className="break-words">{titulo.trim() || 'Título del aviso'}</CardTitle>
        <CardDescription className="break-words whitespace-pre-line">
          {descripcion.trim() || 'Aquí se verá el cuerpo del aviso.'}
        </CardDescription>
      </CardHeader>
      {multimedia?.tipo === 'video' ? (
        <CardContent>
          <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-md bg-muted">
            <div className="flex flex-col items-center gap-2">
              <IconTile variant="solid" size="lg" radius="full">
                <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
              </IconTile>
              <Text as="span" variant="muted" size="xs">
                {multimedia.nombre} · {multimedia.duracion}
              </Text>
            </div>
          </AspectRatio>
        </CardContent>
      ) : null}
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="Me gusta">
            <HugeiconsIcon icon={ThumbsUpIcon} aria-hidden="true" />0
          </Button>
        </div>
        {link.trim() ? (
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
            Ver más
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
