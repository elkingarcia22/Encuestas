import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Call02Icon, Cancel01Icon, Location01Icon, Mail01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../../drawers/components/drawer-styles'
import { EtiquetaIA } from '../../../ia/etiqueta-ia'
import { ReopenAgentButton } from '../../components/agent-kit'
import styles from '../../components/agent.module.css'
import { EDUCATION, JOBS, SCORES, SKILLS, SQL_TOPICS, type Note, type SectionId, type TabId } from './data'

export type Flash = { id: SectionId; tick: number } | null

type ProfilePageProps = {
  tab: TabId
  onTabChange: (tab: TabId) => void
  flash: Flash
  notes: Note[]
  agentClosed: boolean
  onOpenAgent: () => void
}

// Sección de la ficha. Cuando el agente la cita, late con el resaltado (la clave nueva reinicia la animación).
function Section({ id, flash, title, description, children }: { id: SectionId; flash: Flash; title: string; description?: string; children: ReactNode }) {
  const active = flash?.id === id
  return (
    <section key={active ? flash.tick : id} id={id} className={cn('scroll-mt-6 rounded-xl', active && styles.flash)}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

// Pantalla de trabajo: ficha de la candidata con pestañas Hoja de vida / Entrevistas / Pruebas.
export function ProfilePage({ tab, onTabChange, flash, notes, agentClosed, onOpenAgent }: ProfilePageProps) {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección' },
          { label: 'Analista de datos', path: '/design-system/navegacion/detalle' },
          { label: 'Laura Méndez' },
        ]}
        media={
          <Avatar size="lg">
            <AvatarFallback>LM</AvatarFallback>
          </Avatar>
        }
        title="Laura Méndez"
        badge={
          <Badge variant="secondary" className="font-normal">
            Entrevistas
          </Badge>
        }
        description="Candidata a Analista de datos · postuló el 2 de septiembre por el portal de empleo."
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={16} />
              Bogotá
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Mail01Icon} size={16} />
              laura.mendez@correo.com
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Call02Icon} size={16} />
              +57 310 555 0142
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" className={WS} onClick={() => notify('Mover de etapa')}>
              Mover de etapa
            </Button>
            <Button className={WS} onClick={() => notify('Agendar segunda entrevista')}>
              Agendar entrevista
            </Button>
            {agentClosed ? <ReopenAgentButton onClick={onOpenAgent} compact /> : null}
          </>
        }
        tabs={
          <Tabs value={tab} onValueChange={(value) => onTabChange(value as TabId)}>
            {/* Con poco ancho (320px) las pestañas se desplazan de lado en vez de cortarse. */}
            <TabsList variant="line" className="max-w-full overflow-x-auto">
              <TabsTrigger value="cv" className="flex-none px-3">
                Hoja de vida
              </TabsTrigger>
              <TabsTrigger value="entrevistas" className="flex-none gap-2 px-3">
                Entrevistas
                <Badge variant="secondary" size="xs">
                  {notes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pruebas" className="flex-none gap-2 px-3">
                Pruebas
                <Badge variant="secondary" size="xs">
                  1
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <PageContent className="gap-5 pb-10">
        {tab === 'cv' ? (
          <>
            <Section id="experiencia" flash={flash} title="Experiencia" description="4 años en analítica de datos">
              <div className="flex flex-col gap-5">
                {JOBS.map((job) => (
                  <div key={job.company} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-primary/60" />
                    <div className="min-w-0">
                      <div className="font-medium">
                        {job.role} · {job.company}
                      </div>
                      <div className="text-sm text-muted-foreground">{job.period}</div>
                      <div className="mt-2 flex flex-col gap-1">
                        {job.points.map((point) => (
                          <div key={point} className="text-sm text-foreground/80">
                            — {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="educacion" flash={flash} title="Educación e idiomas">
              <div className="flex flex-col divide-y">
                {EDUCATION.map((item) => (
                  <div key={item.title} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.place}</div>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{item.period}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="habilidades" flash={flash} title="Habilidades">
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <Badge key={skill.name} variant={skill.level === 'Básico' ? 'outline' : 'secondary'} className="font-normal">
                    {skill.name} · {skill.level}
                  </Badge>
                ))}
              </div>
            </Section>
          </>
        ) : null}

        {tab === 'entrevistas' ? (
          <>
            <Section
              id="entrevista-tecnica"
              flash={flash}
              title="Entrevista técnica · 12 sep"
              description="Panel: Andrés Pardo (líder de analítica) y Sara Gómez (gestión humana)"
            >
              <div className="flex flex-col gap-3.5">
                {SCORES.map((score) => (
                  <div key={score.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-foreground/80">{score.label}</span>
                      <span className="font-medium tabular-nums">{score.value.toString().replace('.', ',')} / 5</span>
                    </div>
                    <Progress value={(score.value / 5) * 100} aria-label={score.label} className="mt-1.5 **:data-[slot=progress-track]:h-1.5!" />
                  </div>
                ))}
              </div>
            </Section>

            <Section id="notas" flash={flash} title="Notas de entrevista" description="Solo las ve el equipo de selección">
              <div className="flex flex-col divide-y">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                    {note.agent ? (
                      <Orb className="size-8" />
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {note.author
                            .split(' ')
                            .map((word) => word[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">{note.author}</span>
                        {/* Insignia de IA: siempre la etiqueta gris con el orbe (auditoría 5-oct). */}
                        {note.agent ? <EtiquetaIA size="xs">Resumen del agente</EtiquetaIA> : null}
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-foreground/80">{note.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        ) : null}

        {tab === 'pruebas' ? (
          <Section id="prueba-sql" flash={flash} title="Prueba de SQL" description="Enviada el 9 sep · resuelta en 38 de 60 minutos">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-light tabular-nums">9/10</span>
              <span className="pb-1.5 text-sm text-muted-foreground">consultas correctas</span>
            </div>
            <Progress value={90} aria-label="Consultas correctas" className="mt-3 **:data-[slot=progress-track]:h-1.5!" />
            <div className="mt-5 flex flex-col gap-2.5">
              {SQL_TOPICS.map((topic) => (
                <div key={topic.text} className="flex items-center gap-2.5 text-sm">
                  <HugeiconsIcon
                    icon={topic.ok ? Tick02Icon : Cancel01Icon}
                    size={16}
                    aria-hidden="true"
                    className={topic.ok ? 'text-primary' : 'text-muted-foreground'}
                  />
                  {/* El visto o la X dicen si la resolvió: también en texto para el lector de pantalla. */}
                  <span className={topic.ok ? 'text-foreground/80' : 'text-muted-foreground'}>
                    <span className="sr-only">{topic.ok ? 'Correcta: ' : 'Incorrecta: '}</span>
                    {topic.text}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </PageContent>
    </PageShell>
  )
}
