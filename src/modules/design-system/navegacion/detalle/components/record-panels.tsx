import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
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
import { notify } from '@/shared/components/notify'
import { WS } from '../../../drawers/components/drawer-styles'
import { FilaCifras } from '../../../metricas/cifras'
import { initials, type Vacancy } from './data'

type PanelProps = { vacancy: Vacancy }

export function SummaryPanel({ vacancy }: PanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Embudo del proceso</CardTitle>
          <CardDescription>Personas en cada etapa hoy</CardDescription>
        </CardHeader>
        {/* Las cifras van en la fila partida del sistema (FilaCifras, dentro de la tarjeta que ya tiene marco; decisión 11
            de la auditoría): nada de una cajita por cifra. */}
        <CardContent>
          <FilaCifras
            cifras={vacancy.stages.map((stage) => ({ etiqueta: stage.label, valor: String(stage.count) }))}
            columnas="grid-cols-2 lg:grid-cols-4"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Descripción del cargo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm leading-relaxed text-muted-foreground">{vacancy.description}</div>
          <div className="flex flex-wrap gap-1.5">
            {vacancy.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CandidatesPanel({ vacancy }: PanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>Candidatos</CardTitle>
        <CardDescription>Ordenados por afinidad con el cargo</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-2">
          {vacancy.candidates.map((candidate) => (
            <Item key={candidate.name} role="listitem" variant="outline">
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>{initials(candidate.name)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{candidate.name}</ItemTitle>
                <ItemDescription>
                  {candidate.role} · {candidate.stage}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary" className="tabular-nums">
                  {candidate.score} / 100
                </Badge>
                <Button variant="outline" size="sm" className={WS} onClick={() => notify(`Ficha de ${candidate.name}`, undefined, 'info')}>
                  Ver ficha
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

export function ActivityPanel({ vacancy }: PanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>Actividad</CardTitle>
        <CardDescription>Todo lo que ha pasado con esta vacante</CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline defaultValue={vacancy.activity.length}>
          {vacancy.activity.map((event, index) => (
            <TimelineItem key={`${event.date}-${event.title}`} step={index + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{event.date}</TimelineDate>
                <TimelineTitle>{event.title}</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>{event.text}</TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export function RecordAside({ vacancy }: PanelProps) {
  const facts = [
    { label: 'Salario', value: vacancy.salary },
    { label: 'Modalidad', value: vacancy.mode },
    { label: 'Cupos', value: String(vacancy.openings) },
    { label: 'Cierre esperado', value: vacancy.closing },
  ]

  return (
    <aside aria-label="Datos de la vacante" className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Avance del proceso</CardTitle>
          <CardDescription>{vacancy.status}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <Text as="span" size="xl" weight="semibold" className="tabular-nums">
            {vacancy.progress}%
          </Text>
          <Progress value={vacancy.progress} aria-label="Avance del proceso" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Datos clave</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="m-0 flex flex-col">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between gap-4 border-b py-2.5 text-sm first:pt-0 last:border-b-0 last:pb-0">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="m-0 text-right font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Equipo de selección</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {vacancy.team.map((person) => (
            <div key={person.name} className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{initials(person.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium">{person.name}</span>
                <span className="text-xs text-muted-foreground">{person.role}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  )
}
