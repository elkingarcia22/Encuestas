import { useState } from 'react'
import {
  Badge,
  Checkbox,
  Field,
  FieldLabel,
  Heading,
  Input,
  Label,
  Switch,
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

// Elegir de una lista (13-oct): marcar a quiénes llega algo. La lista para elegir es contenido, por eso va en ActionDialog;
// confirmar sin más (aunque afecte a muchas personas) es DialogoConfirmar con RegistroConfirmar.
function ElegirEjemplo({ open, onOpenChange }: Bind) {
  const s = muestra('elegir')
  const [marcadas, setMarcadas] = useState<string[]>(['LM'])
  const cambiar = (abrir: boolean) => {
    if (!abrir) setMarcadas(['LM'])
    onOpenChange(abrir)
  }
  const alternar = (ini: string, marcada: boolean) => setMarcadas((antes) => (marcada ? [...antes, ini] : antes.filter((otra) => otra !== ini)))
  return (
    <ActionDialog
      open={open}
      onOpenChange={cambiar}
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      note={s.note}
      confirmLabel={marcadas.length ? `${s.confirm} a ${marcadas.length}` : s.confirm}
      confirmDisabled={!marcadas.length}
      pendingLabel={s.pending}
      onConfirm={() => notify('Contenido asignado', `Lo ven ${marcadas.length} ${marcadas.length === 1 ? 'persona' : 'personas'} en su Zona de estudio.`, 'success')}
    >
      <ul className="divide-y rounded-xl border">
        {MOVE.map((persona) => (
          <li key={persona.ini}>
            <Label className="flex cursor-pointer items-center gap-3 px-4 py-3 font-normal">
              <Checkbox checked={marcadas.includes(persona.ini)} onCheckedChange={(valor) => alternar(persona.ini, valor === true)} />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium">
                  {persona.title}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {persona.meta}
                </Text>
              </span>
            </Label>
          </li>
        ))}
      </ul>
    </ActionDialog>
  )
}

// Formulario: dos campos y el registro arriba. El clic afuera no cierra: un clic perdido no borra lo escrito.
function FormularioEjemplo(props: Bind) {
  const s = muestra('formulario')
  return (
    <ActionDialog
      {...props}
      dismissible={false}
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Nota guardada', undefined, 'success')}
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

// Ajuste corto (13-oct): dos interruptores. Reemplaza a «Formulario ancho» (6 campos) y «Con pasos», que eran crear o
// editar dentro de una ventana: lo largo va en una página.
function AjusteEjemplo(props: Bind) {
  const s = muestra('ajuste')
  return (
    <ActionDialog
      {...props}
      dismissible={false}
      title={s.title}
      sub={s.sub}
      lead={<RegistroVentana s={s} />}
      note={s.note}
      confirmLabel={s.confirm}
      pendingLabel={s.pending}
      onConfirm={() => notify('Preferencias guardadas', undefined, 'success')}
    >
      <div className="divide-y rounded-xl border">
        <Label className="flex items-center justify-between gap-4 px-4 py-3 font-normal">
          <span className="flex flex-col">
            <Text as="span" size="sm" weight="medium">
              Aviso por cada postulación nueva
            </Text>
            <Text as="span" variant="muted" size="xs">
              Te llega un correo cuando alguien se postula.
            </Text>
          </span>
          <Switch defaultChecked />
        </Label>
        <Label className="flex items-center justify-between gap-4 px-4 py-3 font-normal">
          <span className="flex flex-col">
            <Text as="span" size="sm" weight="medium">
              Resumen semanal
            </Text>
            <Text as="span" variant="muted" size="xs">
              Un solo correo los lunes con lo que pasó en la vacante.
            </Text>
          </span>
          <Switch />
        </Label>
      </div>
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
      onConfirm={() => notify('Carta de oferta enviada', undefined, 'success')}
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
            Bogotá, 15 sept 2026
          </Text>
          <Text as="p" size="sm">
            Hola Laura: después de conocerte en el proceso, queremos invitarte a unirte al equipo de Analítica. Estas son las
            condiciones de la oferta.
          </Text>
          <Datos filas={OFFER} />
          <Text as="p" size="sm">
            Si estás de acuerdo, responde este correo antes del 22 sept 2026. Cualquier duda, escríbenos: con gusto la
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
      onConfirm={() => notify('Laura Méndez pasó a Entrevistas', undefined, 'success')}
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
              { label: 'Se postuló', value: '3 sept 2026' },
              { label: 'Pasó el filtro inicial', value: '5 sept 2026' },
              { label: 'Presentó la prueba técnica', value: '12 sept 2026' },
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
      <ElegirEjemplo {...bind('elegir')} />
      <FormularioEjemplo {...bind('formulario')} />
      <AjusteEjemplo {...bind('ajuste')} />
      <PantallaCompletaEjemplo {...bind('pantalla-completa')} />
      <PestanasEjemplo {...bind('pestanas')} />
      {/* La ventana real de la barra lateral, no una copia (decisión 21 de la auditoría, 5-oct). */}
      <FeedbackDialog {...bind('feedback')} />
    </>
  )
}
