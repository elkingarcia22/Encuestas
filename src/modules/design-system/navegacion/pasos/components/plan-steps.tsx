import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@ubits/flux-ui'
import { KICKER, WS } from '../../../drawers/components/drawer-styles'
import { AREAS, CATEGORIES, COMPANY_PEOPLE, COURSES, audienceCount, type Audience, type PlanForm } from './plan-data'

type StepProps = { form: PlanForm; update: (patch: Partial<PlanForm>) => void }

export function BasicsStep({ form, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="plan-name">Nombre del plan</FieldLabel>
        <Input id="plan-name" value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Líderes que forman líderes 2026" />
      </Field>
      <Field>
        <FieldLabel htmlFor="plan-goal">Objetivo</FieldLabel>
        <Textarea
          id="plan-goal"
          rows={4}
          value={form.goal}
          onChange={(e) => update({ goal: e.target.value })}
          placeholder="Qué deben lograr las personas al terminar"
          className="resize-none"
        />
        <FieldDescription>Se muestra a los colaboradores al entrar al plan.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel id="plan-category-label">Categoría</FieldLabel>
        <Select value={form.category} onValueChange={(v) => update({ category: v as string })} items={CATEGORIES}>
          <SelectTrigger className="w-full" aria-labelledby="plan-category-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

const AUDIENCES: { value: Audience; title: string; text: string }[] = [
  { value: 'empresa', title: 'Toda la empresa', text: `${COMPANY_PEOPLE.toLocaleString('es-CO')} colaboradores activos de Meta Colombia` },
  { value: 'area', title: 'Un área', text: 'Todas las personas de un área, incluidas las que entren después' },
  { value: 'personas', title: 'Personas específicas', text: 'Pega correos o nombres, uno por línea' },
]

export function AudienceStep({ form, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <RadioGroup aria-label="Audiencia" value={form.audience} onValueChange={(v) => update({ audience: v as Audience })} className="grid gap-3">
        {AUDIENCES.map((option) => (
          <Label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 font-normal has-data-checked:border-primary"
          >
            <RadioGroupItem value={option.value} className="mt-0.5" />
            <span className="flex flex-col gap-1">
              <span className="font-medium">{option.title}</span>
              <span className="text-sm text-muted-foreground">{option.text}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      {form.audience === 'area' ? (
        <Field>
          <FieldLabel id="plan-area-label">Área</FieldLabel>
          <Select
            value={form.area || null}
            onValueChange={(v) => update({ area: (v as string) ?? '' })}
            items={AREAS.map(({ value, label }) => ({ value, label }))}
          >
            <SelectTrigger className="w-full" aria-labelledby="plan-area-label">
              <SelectValue placeholder="Elige un área" />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} · {option.people} personas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {form.audience === 'personas' ? (
        <Field>
          <FieldLabel htmlFor="plan-people">Personas</FieldLabel>
          <Textarea
            id="plan-people"
            rows={4}
            value={form.people}
            onChange={(e) => update({ people: e.target.value })}
            placeholder={'laura.mendez@meta.co\nandres.pardo@meta.co'}
            className="resize-none"
          />
          <FieldDescription>{audienceCount(form)} personas en la lista.</FieldDescription>
        </Field>
      ) : null}
    </div>
  )
}

export function ContentStep({ form, update }: StepProps) {
  const toggle = (id: string, checked: boolean) =>
    update({ courses: checked ? [...form.courses, id] : form.courses.filter((course) => course !== id) })
  const minutes = COURSES.filter((c) => form.courses.includes(c.id)).reduce((sum, c) => sum + c.minutes, 0)

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel id="plan-courses-label">Cursos</FieldLabel>
        <div role="group" aria-labelledby="plan-courses-label" className="flex flex-col gap-2">
          {COURSES.map((course) => (
            <Label key={course.id} className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-normal has-data-checked:border-primary">
              <Checkbox checked={form.courses.includes(course.id)} onCheckedChange={(checked) => toggle(course.id, Boolean(checked))} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium">{course.title}</span>
                <span className="text-sm text-muted-foreground">{course.provider}</span>
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">{course.minutes} min</span>
            </Label>
          ))}
        </div>
        <FieldDescription>
          {form.courses.length ? `${form.courses.length} cursos · ${minutes} minutos en total` : 'Elige al menos un curso.'}
        </FieldDescription>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="plan-deadline">Fecha límite</FieldLabel>
          <Input id="plan-deadline" type="date" value={form.deadline} onChange={(e) => update({ deadline: e.target.value })} />
        </Field>
        <Label className="flex items-center justify-between gap-3 self-end rounded-xl border px-4 py-2.5 font-normal">
          <span className="flex flex-col gap-1">
            Recordatorios semanales
            <span className="text-xs text-muted-foreground">A quien vaya atrasado</span>
          </span>
          <Switch checked={form.reminders} onCheckedChange={(checked) => update({ reminders: checked })} />
        </Label>
      </div>
    </div>
  )
}

const formatDate = (value: string) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

export function ReviewStep({ form, update, goTo }: StepProps & { goTo: (step: number) => void }) {
  const area = AREAS.find((a) => a.value === form.area)?.label
  const audience = form.audience === 'empresa' ? 'Toda la empresa' : form.audience === 'area' ? `Área ${area}` : 'Personas específicas'
  const rows = [
    { step: 1, label: 'Plan', value: form.name, detail: CATEGORIES.find((c) => c.value === form.category)?.label },
    { step: 2, label: 'Audiencia', value: audience, detail: `${audienceCount(form)} personas` },
    {
      step: 3,
      label: 'Contenido',
      value: `${form.courses.length} cursos`,
      detail: `Fecha límite ${formatDate(form.deadline)}${form.reminders ? ' · con recordatorios' : ''}`,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col divide-y rounded-xl border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-4 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className={KICKER}>{row.label}</div>
              <div className="font-medium">{row.value}</div>
              <div className="text-sm text-muted-foreground">{row.detail}</div>
            </div>
            <Button variant="ghost" size="sm" className={`${WS} text-muted-foreground!`} onClick={() => goTo(row.step)}>
              <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
              Editar
            </Button>
          </div>
        ))}
      </div>
      <Label className="flex items-center gap-2.5 font-normal">
        <Checkbox checked={form.notifyManagers} onCheckedChange={(checked) => update({ notifyManagers: Boolean(checked) })} />
        Avisar a los jefes directos cuando el plan quede activo
      </Label>
    </div>
  )
}
