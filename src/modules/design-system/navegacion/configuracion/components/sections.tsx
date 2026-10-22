import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { BubbleChatIcon, Calendar03Icon, Image01Icon, UserGroupIcon, WorkflowSquare10Icon, Message01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  IconTile,
  Input,
  Label,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { WS } from '../../../drawers/components/drawer-styles'
import {
  COUNTRIES,
  CYCLES,
  DATE_FORMATS,
  DIGESTS,
  INVITES,
  LANGUAGES,
  ROLES,
  TIMEZONES,
  type Option,
  type SectionId,
  type Settings,
} from './data'

type SetFn = <K extends keyof Settings>(key: K, value: Settings[K]) => void

function SettingsCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  )
}

function SwitchRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Label className="flex items-center justify-between gap-6 font-normal">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        {description ? <span className="text-sm text-muted-foreground">{description}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  )
}

function TextField({ id, label, value, onChange, description, type }: { id: string; label: string; value: string; onChange: (value: string) => void; description?: string; type?: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

// La etiqueta no es un <label for>: el selector es un botón y se nombra con aria-labelledby.
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const labelId = useId()
  return (
    <Field>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange(v as string)} items={options}>
        <SelectTrigger className="w-full" aria-labelledby={labelId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function RadioField({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const labelId = useId()
  return (
    <Field>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <RadioGroup aria-labelledby={labelId} value={value} onValueChange={(v) => onChange(v as string)} className="gap-3">
        {options.map((option) => (
          <Label key={option.value} className="flex items-start gap-2.5 font-normal">
            <RadioGroupItem value={option.value} className="mt-0.5" />
            <span className="flex flex-col gap-1">
              <span className="text-sm">{option.label}</span>
              {option.description ? <span className="text-sm text-muted-foreground">{option.description}</span> : null}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </Field>
  )
}

const INTEGRATIONS: { key: 'slack' | 'teams' | 'workday' | 'calendar'; name: string; description: string; icon: IconSvgElement }[] = [
  { key: 'slack', name: 'Slack', description: 'Recordatorios de cursos y evaluaciones por mensaje directo.', icon: BubbleChatIcon },
  { key: 'teams', name: 'Microsoft Teams', description: 'Avisos internos en los canales de cada área.', icon: Message01Icon },
  { key: 'workday', name: 'Workday', description: 'Sincroniza colaboradores, cargos y áreas cada noche.', icon: WorkflowSquare10Icon },
  { key: 'calendar', name: 'Google Calendar', description: 'Agrega sesiones de formación y vacaciones aprobadas al calendario.', icon: Calendar03Icon },
]

// Formularios de cada sección de la configuración.
export function SectionPanel({ section, values, set }: { section: SectionId; values: Settings; set: SetFn }) {
  switch (section) {
    case 'general':
      return (
        <>
          <SettingsCard title="Datos de la empresa" description="Así aparece tu empresa en UBITS, en los certificados y en los correos.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="cfg-name" label="Nombre visible" value={values.name} onChange={(v) => set('name', v)} />
              <TextField id="cfg-legal" label="Razón social" value={values.legalName} onChange={(v) => set('legalName', v)} />
              <TextField id="cfg-nit" label="NIT" value={values.nit} onChange={(v) => set('nit', v)} />
              <SelectField label="País" value={values.country} options={COUNTRIES} onChange={(v) => set('country', v)} />
            </div>
          </SettingsCard>
          <SettingsCard title="Región e idioma" description="Se usan en fechas, horarios de recordatorios y el idioma por defecto.">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Zona horaria" value={values.timezone} options={TIMEZONES} onChange={(v) => set('timezone', v)} />
              <SelectField label="Idioma por defecto" value={values.language} options={LANGUAGES} onChange={(v) => set('language', v)} />
            </div>
            <RadioField label="Formato de fecha" value={values.dateFormat} options={DATE_FORMATS} onChange={(v) => set('dateFormat', v)} />
          </SettingsCard>
        </>
      )
    case 'marca':
      return (
        <>
          <SettingsCard title="Identidad" description="El nombre y el logo que ven los colaboradores al entrar.">
            <TextField
              id="cfg-academy"
              label="Nombre de la academia"
              value={values.academy}
              onChange={(v) => set('academy', v)}
              description="Aparece en el portal del colaborador y en los certificados."
            />
            <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
              <IconTile variant="soft">
                <HugeiconsIcon icon={Image01Icon} />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-medium">logo-meta.svg</span>
                <span className="text-sm text-muted-foreground">SVG o PNG · mínimo 240 × 80 px</span>
              </div>
              <Button variant="outline" className={WS} onClick={() => notify('Elige un archivo para el logo', undefined, 'info')}>
                Cambiar logo
              </Button>
            </div>
            <SwitchRow
              title="Mostrar el logo en los correos"
              description="Encabezado de invitaciones, recordatorios y certificados."
              checked={values.logoInEmails}
              onChange={(c) => set('logoInEmails', c)}
            />
          </SettingsCard>
          <SettingsCard title="Pantalla de ingreso">
            <Field>
              <FieldLabel htmlFor="cfg-welcome">Mensaje de bienvenida</FieldLabel>
              <Textarea id="cfg-welcome" rows={3} maxLength={180} className="resize-none" value={values.welcome} onChange={(e) => set('welcome', e.target.value)} />
              <FieldDescription>{values.welcome.length} de 180 caracteres</FieldDescription>
            </Field>
          </SettingsCard>
        </>
      )
    case 'usuarios':
      return (
        <>
          <SettingsCard title="Acceso" description="Cómo entran los colaboradores a UBITS.">
            <SwitchRow title="Ingreso con Google Workspace" description="Entran con su correo @meta.com.co, sin contraseña aparte." checked={values.sso} onChange={(c) => set('sso', c)} />
            <Separator />
            <SwitchRow title="Verificación en dos pasos para administradores" description="Pide un código adicional al ingresar." checked={values.twoFactor} onChange={(c) => set('twoFactor', c)} />
          </SettingsCard>
          <SettingsCard title="Invitaciones">
            <RadioField label="Quién puede invitar personas" value={values.invites} options={INVITES} onChange={(v) => set('invites', v)} />
          </SettingsCard>
          <SettingsCard title="Roles" description="Personas por rol en Meta Colombia.">
            <div className="flex flex-col divide-y">
              {ROLES.map((role) => (
                <div key={role.name} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={UserGroupIcon} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{role.name}</span>
                    <span className="text-sm text-muted-foreground">{role.description}</span>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">{role.count}</span>
                  <Button variant="ghost" size="sm" className={WS} onClick={() => notify(`Gestionar ${role.name.toLowerCase()}`, undefined, 'info')}>
                    Gestionar
                  </Button>
                </div>
              ))}
            </div>
          </SettingsCard>
        </>
      )
    case 'notificaciones':
      return (
        <>
          <SettingsCard title="Resumen por correo" description="Un correo con lo pendiente de tu equipo.">
            <RadioField label="Frecuencia" value={values.digest} options={DIGESTS} onChange={(v) => set('digest', v)} />
          </SettingsCard>
          <SettingsCard title="Avisos a administradores">
            <SwitchRow title="Evaluaciones por vencer" description="Tres días antes del cierre de cada ciclo." checked={values.notifyEvaluations} onChange={(c) => set('notifyEvaluations', c)} />
            <Separator />
            <SwitchRow title="Nuevos candidatos" description="Cuando una vacante recibe postulaciones." checked={values.notifyCandidates} onChange={(c) => set('notifyCandidates', c)} />
            <Separator />
            <SwitchRow title="Cursos sin terminar" description="Colaboradores con cursos obligatorios atrasados." checked={values.notifyCourses} onChange={(c) => set('notifyCourses', c)} />
          </SettingsCard>
        </>
      )
    case 'integraciones':
      return (
        <SettingsCard title="Herramientas conectadas" description="Envía avisos y sincroniza datos con las herramientas que ya usa tu equipo.">
          <div className="flex flex-col divide-y">
            {INTEGRATIONS.map((integration) => (
              <Label key={integration.key} className="flex items-center gap-4 py-3.5 font-normal first:pt-0 last:pb-0">
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={integration.icon} />
                </IconTile>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {integration.name}
                    {values[integration.key] ? (
                      <Badge variant="secondary" size="xs">
                        Conectada
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">{integration.description}</span>
                </span>
                <Switch checked={values[integration.key]} onCheckedChange={(c) => set(integration.key, c)} />
              </Label>
            ))}
          </div>
        </SettingsCard>
      )
    case 'facturacion':
      return (
        <>
          <SettingsCard title="Plan Empresa" description="Se renueva el 1 de marzo de 2027.">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span id="cfg-licenses">Licencias en uso</span>
                <span className="text-muted-foreground tabular-nums">940 de 1.000</span>
              </div>
              <Progress value={94} aria-labelledby="cfg-licenses" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className={WS} onClick={() => notify('Historial de facturas', undefined, 'info')}>
                Ver facturas
              </Button>
              <Button variant="ghost" className={WS} onClick={() => notify('Comprar licencias', undefined, 'info')}>
                Comprar licencias
              </Button>
            </div>
          </SettingsCard>
          <SettingsCard title="Datos de facturación">
            <TextField id="cfg-billing" type="email" label="Correo para facturas" value={values.billingEmail} onChange={(v) => set('billingEmail', v)} />
            <RadioField label="Ciclo de pago" value={values.cycle} options={CYCLES} onChange={(v) => set('cycle', v)} />
          </SettingsCard>
        </>
      )
  }
}
