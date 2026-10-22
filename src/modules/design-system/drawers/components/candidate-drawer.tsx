import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Call02Icon, Link02Icon, Mail02Icon, UserRemove01Icon, UserSearch01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
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
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { DrawerShell } from './drawer-shell'
import { KICKER, WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const CONTACT = [
  { icon: Mail02Icon, label: 'Correo', value: 'laura.mendez@correo.co' },
  { icon: Call02Icon, label: 'Teléfono', value: '+57 310 555 0142' },
  { icon: Link02Icon, label: 'Fuente', value: 'LinkedIn · referida por Andrés P.' },
]

const JOURNEY = [
  { date: '2 sept', title: 'Postulación', text: 'Llegó desde LinkedIn con referido interno.' },
  { date: '4 sept', title: 'Filtro inicial aprobado', text: 'Cumple 5 de 5 requisitos.' },
  { date: '6 sept', title: 'Prueba técnica', text: '82 de 100 en SQL y visualización.' },
  { date: 'Hoy 3:00 p. m.', title: 'Entrevista con líder', text: 'Con Juan Rincón, jefe de analítica.' },
]

const INTERVIEWS = [
  { title: 'Entrevista con líder', meta: 'Juan Rincón · hoy 3:00 p. m.' },
  { title: 'Prueba técnica', meta: '82 de 100 · 6 sept' },
]

const SCORES = [
  { label: 'Pensamiento analítico', value: 90 },
  { label: 'Comunicación', value: 78 },
  { label: 'Conocimiento técnico', value: 84 },
  { label: 'Ajuste cultural', value: 72 },
]

// Caso: ver un registro sin salir de la lista. Pestañas, recorrido en línea de tiempo y un drawer
// la evaluación de la entrevista como vista del mismo drawer (con «←» para volver al detalle).
export function CandidateDrawer({ open, onOpenChange }: Props) {
  const [interview, setInterview] = useState(false)
  const [pregunta, setPregunta] = useState<'rechazar' | 'oferta' | null>(null)
  const [notes, setNotes] = useState(['Muy clara explicando su proyecto de rotación de clientes. Pedir referencia laboral.'])
  const [draft, setDraft] = useState('')

  const close = () => onOpenChange(false)

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      media={
        <Avatar size="lg">
          <AvatarFallback>LM</AvatarFallback>
        </Avatar>
      }
      title="Laura Méndez"
      description="Analista de datos · postuló hace 12 días"
      footer={
        <>
          <Button variant="outline" className={WS} onClick={() => setPregunta('rechazar')}>
            Rechazar
          </Button>
          <Button className={WS} onClick={() => setPregunta('oferta')}>
            Mover a Oferta
          </Button>
          {/* 13-oct: rechazar y mover avisan a otras personas, así que preguntan antes (regla «preguntar-antes»). Dentro del
              panel, la pregunta se abre en el mismo panel con «← Laura Méndez» para volver. */}
          <DialogoConfirmar
            abierto={pregunta === 'rechazar'}
            onAbiertoChange={(abrir) => setPregunta(abrir ? 'rechazar' : null)}
            icono={UserRemove01Icon}
            titulo="¿Rechazar al candidato?"
            descripcion="Sale del proceso de la vacante y se le avisa por correo."
            cancelar="Seguir en el proceso"
            accion="Rechazar"
            destructiva
            onConfirmar={() => {
              setPregunta(null)
              close()
              notify('Laura Méndez quedó rechazada', 'Se le avisó por correo.', 'success')
            }}
          >
            <RegistroConfirmar nombre="Laura Méndez" detalle="Analista de datos · Entrevistas" estado="Se le avisa por correo" />
          </DialogoConfirmar>
          <DialogoConfirmar
            abierto={pregunta === 'oferta'}
            onAbiertoChange={(abrir) => setPregunta(abrir ? 'oferta' : null)}
            icono={ArrowRight01Icon}
            titulo="¿Mover a Oferta?"
            descripcion="Pasa de Entrevistas a Oferta. Quien lleva la vacante lo ve en su tablero."
            cancelar="Todavía no"
            accion="Mover a Oferta"
            onConfirmar={() => {
              setPregunta(null)
              close()
              notify('Laura Méndez pasó a Oferta', undefined, 'success')
            }}
          >
            <RegistroConfirmar nombre="Laura Méndez" detalle="Analista de datos · Entrevistas" estado="Pasa a Oferta" tono="neutro" />
          </DialogoConfirmar>
        </>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">Entrevistas</Badge>
        <Badge variant="outline">Match 86 %</Badge>
        <Badge variant="outline">Bogotá · híbrido</Badge>
      </div>

      <Tabs defaultValue="resumen" className="mt-4">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="resumen" className="flex-none">Resumen</TabsTrigger>
          <TabsTrigger value="entrevistas" className="flex-none">Entrevistas</TabsTrigger>
          <TabsTrigger value="notas" className="flex-none">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 flex flex-col gap-6">
          <ItemGroup className="gap-2">
            {CONTACT.map((row) => (
              <Item key={row.label} role="listitem" variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={row.icon} />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>{row.label}</ItemDescription>
                  <ItemTitle>{row.value}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>

          <div>
            <div role="heading" aria-level={3} className={KICKER}>
              Recorrido
            </div>
            <Timeline defaultValue={3} className="mt-3">
              {JOURNEY.map((step, index) => (
                <TimelineItem key={step.title} step={index + 1}>
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineDate>{step.date}</TimelineDate>
                    <TimelineTitle>{step.title}</TimelineTitle>
                    <TimelineIndicator />
                  </TimelineHeader>
                  <TimelineContent>{step.text}</TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </TabsContent>

        <TabsContent value="entrevistas" className="mt-4">
          <ItemGroup className="gap-2">
            {INTERVIEWS.map((row) => (
              <Item key={row.title} role="listitem" variant="outline">
                <ItemContent>
                  <ItemTitle>{row.title}</ItemTitle>
                  <ItemDescription>{row.meta}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm" className={WS} onClick={() => setInterview(true)}>
                    Ver evaluación
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </TabsContent>

        <TabsContent value="notas" className="mt-4 flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note} className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed">
              {note}
              <div className="mt-1.5 text-xs text-muted-foreground">Carolina Vélez · hace 2 h</div>
            </div>
          ))}
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Escribe una nota para el equipo de selección"
            aria-label="Nueva nota"
            className="resize-none"
          />
          <Button
            variant="outline"
            className={`self-end ${WS}`}
            disabled={!draft.trim()}
            onClick={() => {
              setNotes((all) => [...all, draft.trim()])
              setDraft('')
              notify('Nota agregada', undefined, 'success')
            }}
          >
            Agregar nota
          </Button>
        </TabsContent>
      </Tabs>

      {/* Un DrawerShell dentro de otro no abre otro drawer: cambia el contenido de este, con «←» para volver. */}
      <DrawerShell
        open={interview}
        onOpenChange={setInterview}
        size="md"
        icon={UserSearch01Icon}
        title="Entrevista con líder"
        description="Juan Rincón · hoy 3:00 p. m."
        footer={
          <>

            <Button
              className={WS}
              onClick={() => {
                notify('Evaluación registrada', undefined, 'success')
                setInterview(false)
              }}
            >
              Registrar evaluación
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between rounded-xl border px-4 py-3.5">
          <div>
            <div className={KICKER}>Recomendación</div>
            <div className="mt-1 text-base font-semibold">Avanzar a oferta</div>
          </div>
          <div className="text-4xl font-light tracking-tight tabular-nums">81</div>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {SCORES.map((score) => (
            <div key={score.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{score.label}</span>
                <span className="text-muted-foreground tabular-nums">{score.value}</span>
              </div>
              <Progress value={score.value} aria-label={score.label} className="**:data-[slot=progress-track]:h-1.5!" />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div role="heading" aria-level={3} className={KICKER}>
            Nota del entrevistador
          </div>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Estructura bien los problemas y hace buenas preguntas. Le falta experiencia presentando a gerencia; se puede
            cubrir con acompañamiento el primer trimestre.
          </div>
        </div>
      </DrawerShell>
    </DrawerShell>
  )
}
