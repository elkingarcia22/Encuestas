import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Progress,
  cn,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../../drawers/components/drawer-styles'
import { ReopenAgentButton } from '../../components/agent-kit'
import styles from '../../components/agent.module.css'
import { CANDIDATES, type CandidateId } from './data'

type FinalistsPageProps = {
  selected: CandidateId[]
  onToggle: (id: CandidateId, checked: boolean) => void
  offer: boolean
  flash: { id: CandidateId; tick: number } | null
  agentClosed: boolean
  onOpenAgent: () => void
}

// Pantalla de trabajo: las tres finalistas con la casilla «Comparar» que alimenta la tabla del agente.
export function FinalistsPage({ selected, onToggle, offer, flash, agentClosed, onOpenAgent }: FinalistsPageProps) {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección' },
          { label: 'Analista de datos', path: '/design-system/navegacion/detalle' },
          { label: 'Finalistas' },
        ]}
        title="Finalistas"
        description="Analista de datos · 3 de 42 candidatos llegaron a la entrevista final."
        actions={
          <>
            <Button variant="outline" className={WS} onClick={() => notify('Los 42 candidatos de la vacante', undefined, 'info')}>
              Ver los 42 candidatos
            </Button>
            {agentClosed ? <ReopenAgentButton onClick={onOpenAgent} /> : null}
          </>
        }
      />

      <PageContent className="gap-4 pb-10">
        <div className="text-sm text-muted-foreground">Marca «Comparar» en las finalistas que quieras ver en la tabla del agente.</div>
        <div className="@container">
          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            {CANDIDATES.map((candidate) => {
              const active = flash?.id === candidate.id
              const offered = offer && candidate.id === 'laura'
              return (
                <div
                  key={active ? `${candidate.id}-${flash.tick}` : candidate.id}
                  id={`finalista-${candidate.id}`}
                  className={cn('rounded-xl', active && styles.flash)}
                >
                  <Card className="h-full gap-4">
                    <CardHeader className="flex flex-row! items-center gap-3">
                      <Avatar size="lg" aria-hidden="true">
                        <AvatarFallback>{candidate.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <CardTitle className="truncate">{candidate.name}</CardTitle>
                        <CardDescription className="truncate">{candidate.role}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div>
                        <Badge variant={offered ? 'default' : 'outline'} className="font-normal">
                          {offered ? 'En oferta' : 'Entrevista final'}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="text-muted-foreground">Encaje con el cargo</span>
                          <span className="font-medium tabular-nums">{candidate.fit}%</span>
                        </div>
                        <Progress value={candidate.fit} aria-label={`Encaje de ${candidate.name} con el cargo`} className="mt-2 **:data-[slot=progress-track]:h-1.5!" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {candidate.facts.map((fact) => (
                          <div key={fact.label}>
                            <div className="text-xs text-muted-foreground">{fact.label}</div>
                            <div className="mt-0.5 text-sm">{fact.value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="mt-auto">
                      <Label className="flex items-center gap-2 font-normal">
                        {/* Las tres casillas dicen «Comparar»: el nombre accesible suma a quién. */}
                        <Checkbox
                          checked={selected.includes(candidate.id)}
                          onCheckedChange={(checked) => onToggle(candidate.id, Boolean(checked))}
                          aria-label={`Comparar a ${candidate.name}`}
                        />
                        Comparar
                      </Label>
                    </CardFooter>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
