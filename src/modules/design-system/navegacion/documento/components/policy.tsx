import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon, Mail01Icon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { WS } from '../../../drawers/components/drawer-styles'
import { SECTIONS } from './sections'

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <Heading as="h2" level={2} className="m-0! text-2xl! leading-tight! font-normal! tracking-[-0.01em]!">
        {SECTIONS.find((section) => section.id === id)?.title}
      </Heading>
      {children}
    </section>
  )
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text as="p" className="m-0! leading-relaxed">
      {children}
    </Text>
  )
}

const SCOPE = [
  'Colaboradores con contrato a término indefinido o fijo.',
  'Aprendices SENA en etapa productiva, con las reglas de su contrato.',
  'Líderes que aprueban las solicitudes de su equipo.',
]

const DAYS = [
  { seniority: 'Menos de 1 año', law: 'Proporcionales', extra: '—', total: 'Según meses trabajados' },
  { seniority: '1 a 4 años', law: '15', extra: '—', total: '15' },
  { seniority: '5 a 9 años', law: '15', extra: '2', total: '17' },
  { seniority: '10 años o más', law: '15', extra: '4', total: '19' },
]

const STEPS = [
  'Elige las fechas en el calendario. UBITS te muestra cuántos días hábiles descuentas.',
  'Indica quién te reemplaza y deja una nota para tu líder si hace falta.',
  'Envía la solicitud. La respuesta te llega por correo y en UBITS.',
]

const FACTS = [
  { value: '3 días', label: 'hábiles tiene tu líder para responder' },
  { value: '60 días', label: 'máximo para reprogramar si se rechaza' },
  { value: '1 persona', label: 'de reemplazo asignada antes de salir' },
]

const SPECIAL = [
  { title: 'Día de la familia', text: 'Tienes un día por semestre, adicional a las vacaciones. Se pide igual que las vacaciones y no descuenta días de tu saldo.' },
  { title: 'Vacaciones colectivas de fin de año', text: 'Las sedes de producción cierran del 24 de diciembre al 2 de enero. Esos días hábiles se descuentan de tu saldo.' },
  { title: 'Incapacidad durante las vacaciones', text: 'Los días de incapacidad no se descuentan. Carga el soporte médico en UBITS en los 3 días hábiles siguientes.' },
  { title: 'Cambio de fechas ya aprobadas', text: 'Puedes pedir el cambio hasta 5 días antes de salir. Tu líder vuelve a aprobarlo.' },
]

// Contenido de la política de vacaciones 2026.
export function PolicyArticle() {
  return (
    <article className="flex max-w-3xl min-w-0 flex-col gap-12">
      <Section id="alcance">
        <Paragraph>
          Esta política explica cómo se ganan, se piden y se aprueban las vacaciones en Meta Colombia. Aplica desde el 1 de enero de 2026 y
          reemplaza la versión 3.1.
        </Paragraph>
        <ul className="m-0! flex list-none flex-col gap-2.5 p-0!">
          {SCOPE.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-px shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <Paragraph>No aplica a contratistas por prestación de servicios, que acuerdan sus descansos con el área que los contrata.</Paragraph>
      </Section>

      <Section id="dias">
        <Paragraph>Por cada año trabajado tienes 15 días hábiles de vacaciones pagadas. Meta Colombia suma días adicionales según tu antigüedad.</Paragraph>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4!">Antigüedad</TableHead>
                <TableHead>Días de ley</TableHead>
                <TableHead>Días adicionales</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((row) => (
                <TableRow key={row.seniority}>
                  <TableCell className="pl-4! font-medium">{row.seniority}</TableCell>
                  <TableCell className="tabular-nums">{row.law}</TableCell>
                  <TableCell className="tabular-nums">{row.extra}</TableCell>
                  <TableCell className="tabular-nums">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Paragraph>
          Los sábados, domingos y festivos no se descuentan. Si trabajas en turnos rotativos, tu líder te comparte el calendario de días hábiles
          de tu sede.
        </Paragraph>
      </Section>

      <Section id="solicitar">
        <Paragraph>Las vacaciones se piden desde UBITS, en Portal del colaborador › Mis solicitudes.</Paragraph>
        <ol className="m-0! flex list-none flex-col gap-3 p-0!">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">{index + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>Pídelas con tiempo</AlertTitle>
          <AlertDescription>Envía la solicitud con al menos 15 días de anticipación. Para diciembre, antes del 31 de octubre.</AlertDescription>
        </Alert>
      </Section>

      <Section id="aprobacion">
        <Paragraph>Tu líder directo tiene 3 días hábiles para responder. Si no responde, la solicitud pasa automáticamente a Gestión humana.</Paragraph>
        <Paragraph>
          Una solicitud solo se puede rechazar por necesidades del servicio y siempre con una fecha alternativa en los siguientes 60 días.
        </Paragraph>
        <div className="grid gap-3 sm:grid-cols-3">
          {FACTS.map((fact) => (
            <div key={fact.value} className="flex flex-col gap-1 rounded-xl bg-muted px-4 py-3">
              <span className="text-2xl font-light tabular-nums">{fact.value}</span>
              <span className="text-sm text-muted-foreground">{fact.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="acumulacion">
        <Paragraph>
          Puedes acumular hasta dos periodos de vacaciones. Pasado ese límite, Gestión humana programa contigo el disfrute de los días
          pendientes.
        </Paragraph>
        <Paragraph>
          El pago en dinero solo aplica al terminar el contrato o, mientras trabajas, hasta por la mitad de los días de un periodo y con acuerdo
          por escrito.
        </Paragraph>
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle>Días a punto de vencer</AlertTitle>
          <AlertDescription>Si tienes más de 25 días acumulados, UBITS te avisa cada mes hasta que programes tus vacaciones.</AlertDescription>
        </Alert>
      </Section>

      <Section id="casos">
        <Accordion>
          {SPECIAL.map((item) => (
            <AccordionItem key={item.title} value={item.title}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>{item.text}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section id="contacto">
        <Paragraph>Si tienes dudas sobre tu saldo o sobre un caso que no está aquí, escríbele a Gestión humana.</Paragraph>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
          <Avatar size="lg">
            <AvatarFallback>SG</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium">Sara Gómez</span>
            <span className="text-sm text-muted-foreground">Gestión humana · responde en 1 día hábil</span>
          </div>
          <Button variant="outline" className={WS} onClick={() => notify('Mensaje para Gestión humana')}>
            <HugeiconsIcon icon={Mail01Icon} size={16} />
            Escribir
          </Button>
        </div>
      </Section>
    </article>
  )
}
