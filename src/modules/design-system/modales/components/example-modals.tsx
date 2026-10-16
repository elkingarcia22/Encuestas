import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, UserArrowLeftRightIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  IconTile,
  Input,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { notify } from '@/shared/components/notify'
import { STEP_INDICATOR, STEP_LINE } from '../../drawers/components/drawer-styles'
import { RegistroVentana } from './ventana-parts'
import { VENTANA_CASES } from './ventana-config'

// «Ver el caso completo»: cada caso de uso de Modales con contenido real, en el ActionDialog de verdad (la única
// ventana del sistema desde el 5-oct). Se abre el que diga `open` (el id del caso).

type Bind = { open: boolean; onOpenChange: (open: boolean) => void }

const muestra = (id: string) => (VENTANA_CASES.find((item) => item.id === id) ?? VENTANA_CASES[0]).sample

const MOVE = [
  { ini: 'LM', title: 'Laura Méndez', meta: 'Evaluación técnica' },
  { ini: 'JR', title: 'Juan Rincón', meta: 'Evaluación técnica' },
  { ini: 'AP', title: 'Ana Pardo', meta: 'Filtro inicial' },
]

const OFFER = [
  { label: 'Cargo', value: 'Analista de datos' },
  { label: 'Salario mensual', value: '$ 6.800.000' },
  { label: 'Fecha de inicio', value: '1 oct 2026' },
  { label: 'Modalidad', value: 'Híbrida · Bogotá' },
]

// Lista de término y valor dentro de un recuadro (lo que se pierde, los datos de la oferta).
function Datos({ filas }: { filas: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y rounded-xl border">
      {filas.map((fila) => (
        <div key={fila.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt>
            <Text as="span" variant="muted" size="sm">
              {fila.label}
            </Text>
          </dt>
          <dd className="text-right">
            <Text as="span" size="sm" weight="medium" className="tabular-nums">
              {fila.value}
            </Text>
          </dd>
        </div>
      ))}
    </dl>
  )
}

// Confirmar: el registro en la primera línea y a quiénes afecta.
function ConfirmarEjemplo(props: Bind) {
  const s = muestra('confirmar')
  return (
    <ActionDialog
      {...props}
      size="sm"
      media={
        <IconTile variant="elevated" size="xl">
          <HugeiconsIcon icon={UserArrowLeftRightIcon} aria-hidden="true" />
        </IconTile>
      }
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      items={MOVE}
      note={s.note}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('3 candidatos movidos a Entrevistas')}
    />
  )
}

// Formulario: dos campos y el registro arriba.
function FormularioEjemplo(props: Bind) {
  const s = muestra('formulario')
  return (
    <ActionDialog
      {...props}
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Nota guardada')}
    >
      <Field>
        <FieldLabel htmlFor="nota-titulo">Título</FieldLabel>
        <Input id="nota-titulo" placeholder="Ej.: Entrevista con el líder" />
      </Field>
      <Field>
        <FieldLabel htmlFor="nota-texto">Nota</FieldLabel>
        <Textarea id="nota-texto" rows={4} placeholder="Qué pasó y qué sigue" />
      </Field>
    </ActionDialog>
  )
}

// Formulario ancho: dos columnas y el clic afuera no cierra.
function FormularioAnchoEjemplo(props: Bind) {
  const s = muestra('formulario-ancho')
  const campos = [
    { id: 'vac-cargo', label: 'Cargo', valor: 'Analista de datos' },
    { id: 'vac-area', label: 'Área', valor: 'Analítica' },
    { id: 'vac-ciudad', label: 'Ciudad', valor: 'Bogotá' },
    { id: 'vac-modalidad', label: 'Modalidad', valor: 'Híbrida' },
    { id: 'vac-salario', label: 'Salario mensual', valor: '$ 6.800.000' },
    { id: 'vac-cupos', label: 'Personas a contratar', valor: '2' },
  ]
  return (
    <ActionDialog
      {...props}
      size="wide"
      dismissible={false}
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      note={s.note}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Vacante actualizada')}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <Field key={campo.id}>
            <FieldLabel htmlFor={campo.id}>{campo.label}</FieldLabel>
            <Input id={campo.id} defaultValue={campo.valor} />
          </Field>
        ))}
      </div>
      <Field>
        <FieldLabel htmlFor="vac-descripcion">Descripción del cargo</FieldLabel>
        <Textarea
          id="vac-descripcion"
          rows={4}
          defaultValue="Buscamos a alguien que convierta datos en decisiones: tableros, modelos sencillos y conversaciones con las áreas."
        />
      </Field>
    </ActionDialog>
  )
}

// A pantalla completa: el documento tal como se va a enviar, con su estado junto a la X.
function PantallaCompletaEjemplo(props: Bind) {
  const s = muestra('pantalla-completa')
  return (
    <ActionDialog
      {...props}
      size="full"
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      headerActions={<Badge variant="secondary">{s.headerAction}</Badge>}
      note={s.note}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Carta de oferta enviada')}
    >
      <div className="rounded-xl bg-muted/60 p-4 sm:p-8">
        <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-lg bg-background p-8 shadow-sm ring-1 ring-foreground/5">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Meta Colombia · Selección
          </Text>
          <Heading as="h3" level={4}>
            Carta de oferta
          </Heading>
          <Text as="span" variant="muted" size="sm">
            Bogotá, 15 sep 2026
          </Text>
          <Text as="p" size="sm">
            Hola Laura: después de conocerte en el proceso, queremos invitarte a unirte al equipo de Analítica. Estas son las
            condiciones de la oferta.
          </Text>
          <Datos filas={OFFER} />
          <Text as="p" size="sm">
            Si estás de acuerdo, responde este correo antes del 22 sep 2026. Cualquier duda, escríbenos: con gusto la
            resolvemos.
          </Text>
          <Text as="p" size="sm">
            Un saludo,
            <br />
            Carolina Ruiz · Administradora de Selección
          </Text>
        </div>
      </div>
    </ActionDialog>
  )
}

// Con pasos: los pasos abren el cuerpo, la flecha vuelve al anterior y el pie avanza.
function PasosEjemplo({ open, onOpenChange }: Bind) {
  const s = muestra('pasos')
  const [paso, setPaso] = useState(1)
  const cambiar = (abrir: boolean) => {
    if (!abrir) setPaso(1)
    onOpenChange(abrir)
  }
  const ultimo = paso === s.steps.length

  return (
    <ActionDialog
      open={open}
      onOpenChange={cambiar}
      dismissible={false}
      title={s.title}
      sub={s.sub}
      onBack={paso > 1 ? () => setPaso(paso - 1) : undefined}
      footer={
        <>
          <Button variant="outline" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
            Atrás
          </Button>
          <Button
            onClick={() => {
              if (ultimo) {
                cambiar(false)
                notify('Evaluación publicada')
              } else {
                setPaso(paso + 1)
              }
            }}
          >
            {ultimo ? 'Publicar' : 'Siguiente'}
          </Button>
        </>
      }
    >
      <Stepper value={paso} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
        <StepperNav className="w-full">
          {s.steps.map((etiqueta, indice) => (
            <StepperItem key={etiqueta} step={indice + 1} completed={indice + 1 < paso} className="flex-1 last:flex-none">
              <StepperTrigger className="gap-2" tabIndex={-1} aria-controls={undefined}>
                <StepperIndicator className={STEP_INDICATOR}>{indice + 1}</StepperIndicator>
                <StepperTitle className="text-sm whitespace-nowrap">{etiqueta}</StepperTitle>
              </StepperTrigger>
              {indice < s.steps.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
      {paso === 1 ? (
        <Field>
          <FieldLabel htmlFor="eval-nombre">Nombre de la evaluación</FieldLabel>
          <Input id="eval-nombre" defaultValue="Prueba técnica de SQL" />
        </Field>
      ) : null}
      {paso === 2 ? (
        <Field>
          <FieldLabel htmlFor="eval-preguntas">Preguntas</FieldLabel>
          <Textarea id="eval-preguntas" rows={4} defaultValue={'1. ¿Qué hace un LEFT JOIN?\n2. ¿Cuándo usarías una función de ventana?'} />
        </Field>
      ) : null}
      {paso === 3 ? (
        <Field>
          <FieldLabel htmlFor="eval-cierre">Fecha de cierre</FieldLabel>
          <Input id="eval-cierre" defaultValue="30 oct 2026" />
        </Field>
      ) : null}
    </ActionDialog>
  )
}

// Con pestañas: subrayadas al empezar el cuerpo; el panel tiene alto fijo para no saltar al cambiar de pestaña.
function PestanasEjemplo(props: Bind) {
  const s = muestra('pestanas')
  return (
    <ActionDialog
      {...props}
      size="wide"
      className="h-[70svh]"
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Laura Méndez pasó a Entrevistas')}
    >
      <Tabs defaultValue="respuestas" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="respuestas" className="flex-none px-3">
            Respuestas
          </TabsTrigger>
          <TabsTrigger value="evaluaciones" className="flex-none px-3">
            Evaluaciones
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex-none px-3">
            Historial
          </TabsTrigger>
        </TabsList>
        <TabsContent value="respuestas">
          <Datos
            filas={[
              { label: 'Años de experiencia', value: '4' },
              { label: 'Nivel de inglés', value: 'B2' },
              { label: 'Aspiración salarial', value: '$ 6.500.000' },
              { label: 'Disponibilidad', value: 'Inmediata' },
            ]}
          />
        </TabsContent>
        <TabsContent value="evaluaciones">
          <Datos
            filas={[
              { label: 'Prueba técnica', value: '86 / 100' },
              { label: 'Psicométrica', value: 'Apta' },
              { label: 'Entrevista con Serena', value: '88 / 100' },
            ]}
          />
        </TabsContent>
        <TabsContent value="historial">
          <Datos
            filas={[
              { label: 'Se postuló', value: '3 sep 2026' },
              { label: 'Pasó el filtro inicial', value: '5 sep 2026' },
              { label: 'Presentó la prueba técnica', value: '12 sep 2026' },
            ]}
          />
        </TabsContent>
      </Tabs>
    </ActionDialog>
  )
}

// Todos los ejemplos; se abre el del caso que diga `open`.
export function ExampleModals({ open, onOpenChange }: { open: string | null; onOpenChange: (id: string | null) => void }) {
  const bind = (id: string): Bind => ({ open: open === id, onOpenChange: (next) => onOpenChange(next ? id : null) })

  return (
    <>
      <ConfirmarEjemplo {...bind('confirmar')} />
      <FormularioEjemplo {...bind('formulario')} />
      <FormularioAnchoEjemplo {...bind('formulario-ancho')} />
      <PantallaCompletaEjemplo {...bind('pantalla-completa')} />
      <PasosEjemplo {...bind('pasos')} />
      <PestanasEjemplo {...bind('pestanas')} />
      {/* La ventana real de la barra lateral, no una copia (decisión 21 de la auditoría, 5-oct). */}
      <FeedbackDialog {...bind('feedback')} />
    </>
  )
}
