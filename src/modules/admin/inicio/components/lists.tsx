import { HugeiconsIcon } from '@hugeicons/react'
import { useNavigate } from 'react-router'
import { Avatar, AvatarFallback, Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, IconTile, Progress, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ubits/flux-ui'
import { ACTIVITY, PROGRAMS, VACANCIES } from './data'
import { notify } from '@/shared/components/notify'

// Programas activos: avance de cada plan de formación.
export function ProgramsCard() {
  const navigate = useNavigate()
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2}>Programas activos</CardTitle>
        <CardDescription>Avance de cada plan de formación</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" aria-label="Ver todo en Planes de formación" onClick={() => navigate('/admin/aprendizaje/planes-de-formacion')}>
            Ver todo
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-5">
        {PROGRAMS.map((program) => (
          <div key={program.title} className="flex items-center gap-3">
            <IconTile variant="solid" className="size-9! rounded-lg! bg-muted! text-muted-foreground! [--icon-tile-icon-size:18px]">
              <HugeiconsIcon icon={program.icon} size={18} aria-hidden="true" />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{program.title}</span>
                <span className="tabular-nums text-xs text-muted-foreground">{program.pct} %</span>
              </div>
              <Progress value={program.pct} aria-label={`Avance de ${program.title}`} className="**:data-[slot=progress-track]:h-1.5" />
              <span className="text-xs text-muted-foreground">{program.meta}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Vacantes abiertas: tabla compacta con etapa y responsable.
export function VacanciesCard() {
  const navigate = useNavigate()
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2} className="flex items-center gap-2">
          Vacantes abiertas
          <Badge variant="secondary" size="xs">{VACANCIES.length}</Badge>
        </CardTitle>
        <CardDescription>En qué etapa va cada proceso y quién lo lleva</CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="outline" size="sm" aria-label="Preguntar a Orbit por las vacantes" onClick={() => navigate('/suite-ai?draft=%C2%BFQu%C3%A9%20vacantes%20llevan%20m%C3%A1s%20de%2020%20d%C3%ADas%20abiertas%3F')}>
            Preguntar
          </Button>
          <Button variant="outline" size="sm" aria-label="Ver todas las vacantes" onClick={() => navigate('/admin/seleccion/exploraciones/uno')}>
            Ver todas
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Cargo</TableHead>
              <TableHead>Etapa y avance</TableHead>
              <TableHead className="text-right">Candidatos</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Responsable</span>
                <span aria-hidden="true">•</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VACANCIES.map((vacancy) => (
              // El clic en la fila es un atajo de mouse: con teclado se llega por «Ver todas», que va al mismo lugar.
              <TableRow key={vacancy.role} className="cursor-pointer" onClick={() => navigate('/admin/seleccion/exploraciones/uno')}>
                <TableCell className="pl-5">
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-sm font-medium">{vacancy.role}</span>
                    <span className="text-xs text-muted-foreground">{vacancy.meta}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="xs">{vacancy.stage}</Badge>
                      <span className="tabular-nums text-xs text-muted-foreground">{vacancy.step}</span>
                    </div>
                    <Progress value={vacancy.pct} aria-label={`Avance de ${vacancy.role}`} className="w-24 **:data-[slot=progress-track]:h-1" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium">{vacancy.cands}</span>
                    <span className="text-xs text-muted-foreground">{vacancy.fresh}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  {/* Las iniciales solas no dicen quién es: el lector oye el nombre completo. */}
                  <Avatar className="ml-auto size-7" title={vacancy.owner} aria-hidden="true">
                    <AvatarFallback>{vacancy.initials}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">{vacancy.owner}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Actividad reciente: lo último que pasó en el equipo.
export function ActivityCard() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2}>Actividad reciente</CardTitle>
        <CardDescription>Lo último que pasó en tu equipo</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {ACTIVITY.map((entry) => (
          // Button de flux-ui como fila: la línea entre filas va en cada botón (su borde propio tapaba el divide).
          <Button
            key={entry.who + entry.what}
            variant="ghost"
            onClick={() => notify(`${entry.who} · ${entry.what}`)}
            className="h-auto! w-full justify-start! gap-3! rounded-none! border-0! [border-color:var(--border)]! px-5! py-3! text-left font-normal! not-last:border-b! hover:bg-muted/50! dark:hover:bg-muted/50!"
          >
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted-foreground">{entry.when}</span>
            <Avatar className="size-7" aria-hidden="true">
              <AvatarFallback>{entry.initials}</AvatarFallback>
            </Avatar>
            {/* Sin truncar: a 320px la frase se cortaba; el botón no parte líneas si el texto no lo pide. */}
            <span className="min-w-0 flex-1 text-sm break-words whitespace-normal">
              <span className="font-medium">{entry.who}</span> {entry.what}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
