import { useState, type DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  DragDropVerticalIcon,
  InformationCircleIcon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { AUDIENCES, DATE_RANGES, PEOPLE, PLAN_ROWS, initialsOf, type PlanRow } from '../../shared/data'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'

type ProposalCardProps = {
  onOpenProcesses: () => void
  onAssigned?: () => void
}

const LEADERS = PEOPLE.map((name) => ({ ini: initialsOf(name), title: name, meta: 'Líder · Ventas' }))

// Propuesta editable, como en el prototipo: mensaje del agente (orbe + tarjeta) con cabecera, título
// editable, filas arrastrables con la duración a la derecha, audiencia y fechas en pastillas, y pie.
// El campo del título es superficie propia (como el composer): el Input de flux-ui trae borde y alto propios.
export function ProposalCard({ onOpenProcesses, onAssigned }: ProposalCardProps) {
  const [title, setTitle] = useState('Feedback efectivo para líderes de Ventas')
  const [rows, setRows] = useState<PlanRow[]>(PLAN_ROWS)
  const [audience, setAudience] = useState(AUDIENCES[0])
  const [dates, setDates] = useState(DATE_RANGES[0])
  const [dragId, setDragId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [reviewAudience, setReviewAudience] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)

  const peopleCount = audience.split(' ')[0]

  const drop = (targetId: number) => (event: DragEvent) => {
    event.preventDefault()
    if (dragId === null || dragId === targetId) return
    setRows((current) => {
      const next = [...current]
      const from = next.findIndex((r) => r.id === dragId)
      const to = next.findIndex((r) => r.id === targetId)
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragId(null)
  }

  // Alternativa a arrastrar (teclado o un solo clic): el asa abre «Mover arriba / Mover abajo».
  const move = (id: number, step: -1 | 1) => {
    const from = rows.findIndex((r) => r.id === id)
    const to = from + step
    if (from < 0 || to < 0 || to >= rows.length) return
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)
    notify(`${moved.title} quedó en la posición ${to + 1} de ${next.length}`)
  }

  const assign = () => {
    setAssigning(true)
    window.setTimeout(() => {
      setAssigning(false)
      setAssigned(true)
      notify(`Plan asignado a ${audience}`)
      onAssigned?.()
    }, 1400)
  }

  const status = assigned ? `Asignado · ${peopleCount} personas` : assigning ? 'Asignando…' : 'Borrador, no asignado'

  return (
    <div className="flex w-full gap-3.5">
      <Orb className="mt-3.5 size-6.5" />

      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-card text-card-foreground">
        <div className="flex items-center gap-2.25 border-b px-4.5 py-3.5">
          {/* El orbe y no una estrella dibujada (auditoría, 5-oct). */}
          <IconoIA className="size-3.5 shrink-0" />
          <span className="text-sm">
            Propuesta editable · <span className="font-medium">Plan de formación</span>
          </span>
          <span className="ml-auto text-sm text-muted-foreground">{status}</span>
        </div>

        <div className="p-4.5">
          {/* Input de flux-ui sin borde ni anillo propios: la superficie es la etiqueta que lo envuelve, y es ella la que
              muestra el foco con el mismo borde y anillo que un Input de la librería. */}
          <label className="flex items-center gap-3 rounded-lg border px-4 py-3.25 transition-[color,box-shadow] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="Título del plan"
              disabled={assigned}
              className="h-auto! min-w-0 flex-1 rounded-none! border-0! bg-transparent! p-0! text-base! shadow-none! focus-visible:ring-0! disabled:text-muted-foreground disabled:opacity-100! md:text-base! dark:bg-transparent!"
            />
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} className="shrink-0 text-muted-foreground" />
          </label>

          <ul className="mt-3.5 overflow-hidden rounded-lg border">
            {rows.map((row, position) => (
              <li
                key={row.id}
                draggable={!assigned}
                onDragStart={() => setDragId(row.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={drop(row.id)}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  'flex items-center gap-3 border-b px-4 py-3 last:border-b-0',
                  dragId === row.id && 'bg-muted opacity-50',
                  !assigned && 'cursor-grab',
                )}
              >
                <DropdownMenu>
                  {/* Márgenes negativos: el botón mide 24px y el asa sigue viéndose donde estaba. */}
                  <DropdownMenuTrigger
                    render={
                      <BotonIcono
                        size="icon-xs"
                        aria-label={`Mover ${row.title}`}
                        disabled={assigned}
                        className="-mx-1.25 shrink-0"
                      />
                    }
                  >
                    <HugeiconsIcon icon={DragDropVerticalIcon} className="size-3.5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem disabled={position === 0} onClick={() => move(row.id, -1)}>
                      <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
                      Mover arriba
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={position === rows.length - 1} onClick={() => move(row.id, 1)}>
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                      Mover abajo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="min-w-0 flex-1 truncate text-sm">{row.title}</span>
                <span className="shrink-0 text-[13px] text-muted-foreground">{row.meta}</span>
                <BotonIcono
                  size="icon-xs"
                  aria-label={`Quitar ${row.title}`}
                  disabled={assigned}
                  onClick={() => {
                    setRows((current) => current.filter((r) => r.id !== row.id))
                    notify('Contenido quitado del plan')
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={13} />
                </BotonIcono>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-muted-foreground">Audiencia</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Audiencia: ${audience}`}
                    className="rounded-full! px-3.25!"
                    disabled={assigned}
                  />
                }
              >
                {audience}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuRadioGroup value={audience} onValueChange={(v) => { setAudience(v); notify(`Audiencia: ${v}`) }}>
                  {AUDIENCES.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>{option}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="ml-2 text-sm text-muted-foreground">Fechas</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Fechas: ${dates}`}
                    className="rounded-full! px-3.25!"
                    disabled={assigned}
                  />
                }
              >
                {dates}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup value={dates} onValueChange={(v) => { setDates(v); notify(`Fechas: ${v}`) }}>
                  {DATE_RANGES.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>{option}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t bg-muted/50 px-4.5 py-3">
          <HugeiconsIcon icon={InformationCircleIcon} size={16} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 text-[13px] text-foreground/70">
            {assigned
              ? 'Asignado el 10 sep 9:58. El correo ya salió; puedes retirar el plan sin borrar el historial.'
              : `Asignar notifica por correo a ${peopleCount} personas. Revisa la audiencia antes de continuar.`}
          </span>
          {!assigned ? (
            <Button variant="outline" size="sm" className="h-8.5!" onClick={() => setReviewAudience(true)}>
              Revisar audiencia
            </Button>
          ) : null}
          <Button size="sm" className="h-8.5!" disabled={assigning} onClick={() => (assigned ? onOpenProcesses() : setConfirm(true))}>
            {assigned ? 'Ver el proceso' : assigning ? 'Asignando…' : 'Asignar plan'}
          </Button>
        </div>
      </div>

      <ActionDialog
        open={reviewAudience}
        onOpenChange={setReviewAudience}
        title={audience}
        sub="Personas que recibirían el plan de formación"
        items={LEADERS}
        note="14 de 14 con correo válido"
        cancelLabel="Cerrar"
      />
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Asignar el plan a ${audience}`}
        sub="Se notifica por correo a cada persona y el plan aparece en su ruta de aprendizaje. Puedes retirarlo después, pero el correo ya habrá salido."
        note="Queda registrado en el historial"
        cancelLabel="Revisar de nuevo"
        confirmLabel="Asignar plan"
        onConfirm={assign}
      />
    </div>
  )
}
