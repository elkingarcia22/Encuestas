import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ThumbsDownIcon, ThumbsUpIcon, Tick02Icon, UserSwitchIcon } from '@hugeicons/core-free-icons'
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
  Progress,
  Toggle,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PILL } from '../../../drawers/components/drawer-styles'
import type { Readiness, Role } from './data'

const READINESS: Record<Readiness, { label: string; variant: 'success-light' | 'warning-light' | 'outline' }> = {
  ahora: { label: 'Listo ahora', variant: 'success-light' },
  '12': { label: 'Listo en 12 meses', variant: 'warning-light' },
  '24': { label: 'Listo en 24 meses', variant: 'outline' },
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')

// Un cargo crítico con sus sucesores propuestos: aceptar o pedir reemplazo, y calificar el bloque.
export function RoleCard({ role }: { role: Role }) {
  const [accepted, setAccepted] = useState<string[]>([])
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle role="heading" aria-level={3}>
              {role.title}
            </CardTitle>
            <Badge variant={role.risk === 'Riesgo alto' ? 'destructive-outline' : 'warning-light'} radius="full">
              {role.risk}
            </Badge>
          </div>
          <CardDescription>{role.holder}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <span aria-live="polite" className="mr-1 text-sm text-muted-foreground">
            {vote ? 'Gracias por tu opinión' : '¿Es útil?'}
          </span>
          <Toggle
            size="sm"
            aria-label="Útil"
            className={PILL}
            pressed={vote === 'up'}
            onPressedChange={(pressed) => setVote(pressed ? 'up' : null)}
          >
            <HugeiconsIcon icon={ThumbsUpIcon} size={16} />
          </Toggle>
          <Toggle
            size="sm"
            aria-label="No útil"
            className={PILL}
            pressed={vote === 'down'}
            onPressedChange={(pressed) => {
              setVote(pressed ? 'down' : null)
              if (pressed) notify('Le contaremos al agente qué no funcionó')
            }}
          >
            <HugeiconsIcon icon={ThumbsDownIcon} size={16} />
          </Toggle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {role.candidates.map((candidate) => {
          const isAccepted = accepted.includes(candidate.name)
          const readiness = READINESS[candidate.readiness]
          return (
            <div key={candidate.name} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex min-w-56 flex-1 items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{candidate.name}</span>
                    <Badge variant={readiness.variant} radius="full" size="sm">
                      {readiness.label}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {candidate.role} · {candidate.why}
                  </span>
                </div>
              </div>
              <div className="flex w-48 items-center gap-2.5">
                <Progress value={candidate.fit} aria-label={`Ajuste de ${candidate.name}`} className="flex-1" />
                <span className="text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums">{candidate.fit}% ajuste</span>
              </div>
              <div className="flex w-52 justify-end gap-1">
                {isAccepted ? (
                  <>
                    <Badge variant="success-light" radius="full" className="gap-1">
                      <HugeiconsIcon icon={Tick02Icon} size={14} />
                      Aceptado
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${PILL} text-muted-foreground!`}
                      onClick={() => setAccepted((list) => list.filter((name) => name !== candidate.name))}
                    >
                      Deshacer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className={PILL} onClick={() => setAccepted((list) => [...list, candidate.name])}>
                      <HugeiconsIcon icon={Tick02Icon} size={16} />
                      Aceptar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${PILL} text-muted-foreground!`}
                      onClick={() => notify(`El agente busca otra opción en lugar de ${candidate.name}`)}
                    >
                      <HugeiconsIcon icon={UserSwitchIcon} size={16} />
                      Reemplazar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
