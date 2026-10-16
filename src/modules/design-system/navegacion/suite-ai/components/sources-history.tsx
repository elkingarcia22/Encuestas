import { HugeiconsIcon } from '@hugeicons/react'
import { DatabaseIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { KICKER, PILL } from '../../../drawers/components/drawer-styles'
import { SOURCES } from './data'

export function SourcesTab() {
  return (
    <Card className="py-2">
      <CardContent className="px-2">
        <ItemGroup>
          {SOURCES.map((source) => (
            <Item key={source.title} role="listitem">
              <ItemMedia>
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={DatabaseIcon} />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{source.title}</ItemTitle>
                <ItemDescription>{source.meta}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {source.access ? null : (
                  <Badge variant="warning-light" radius="full">
                    Sin acceso
                  </Badge>
                )}
                {/* Popover que también abre al pasar el cursor: una tarjeta que solo sale con el mouse no se alcanza con teclado. */}
                <Popover>
                  <PopoverTrigger openOnHover render={<Button variant="ghost" size="sm" className={`${PILL} text-muted-foreground!`} />}>
                    Qué se usó
                  </PopoverTrigger>
                  <PopoverContent side="left" align="center" className="w-72 gap-0">
                    <div className={KICKER}>{source.title}</div>
                    <div className="mt-1.5 text-sm leading-relaxed">{source.used}</div>
                  </PopoverContent>
                </Popover>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

const VERSIONS = [
  { date: 'Hace 2 min', title: 'Versión 2 · Orbit', text: 'Ajuste pedido: «solo candidatos internos del área». Salieron 2 personas externas.', restore: false },
  { date: 'Hace 6 min', title: 'Versión 1 · Orbit', text: 'Primera propuesta con 9 candidatos para 2 cargos críticos.', restore: true },
  { date: 'Hace 7 min', title: 'Pedido de Carolina Ruiz', text: '«Arma un plan de sucesión para los cargos críticos del área comercial».', restore: false },
]

export function HistoryTab() {
  return (
    <Card>
      <CardContent>
        <Timeline defaultValue={1}>
          {VERSIONS.map((version, index) => (
            <TimelineItem key={version.title} step={index + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{version.date}</TimelineDate>
                <TimelineTitle>{version.title}</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>
                {version.text}
                {version.restore ? (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className={PILL} onClick={() => notify('Versión 1 restaurada como borrador')}>
                      Restaurar esta versión
                    </Button>
                  </div>
                ) : null}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}
