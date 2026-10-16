import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, HelpCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DrawerClose,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ActionDialog } from '@/shared/components/ActionDialog'

import { AdjuntoCsv, type Subida } from '../../../estados/procesos'
import { useTemporizadores } from '../../../estados/temporizadores'
import { CampoFecha } from '../../../formularios/rango-de-fechas'
import { HOY, fechaCorta, fechaSinAnio } from '../../../patrones/formato'
import { avanceDe, preguntasDe, type Encuesta } from './datos'

// Diálogos del template Encuestas. Son la ventana de acción del sistema (`ActionDialog`, regla del 23-sep, que
// reemplaza la de «sin la X» del 2026-09-11): la X arriba y el pie gris con sus botones.

// ── Comparar encuestas ──
// Dos encuestas finalizadas lado a lado. Se valida que sean distintas.

export function DialogoComparar({ abierto, onAbiertoChange, encuestas }: { abierto: boolean; onAbiertoChange: (abierto: boolean) => void; encuestas: Encuesta[] }) {
  const finalizadas = encuestas.filter((e) => e.estado === 'Finalizado')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [comparando, setComparando] = useState(false)
  const ea = finalizadas.find((e) => e.id === a)
  const eb = finalizadas.find((e) => e.id === b)

  const comparar = () => {
    if (!ea || !eb) return setError('Elige las dos encuestas.')
    if (ea.id === eb.id) return setError('Elige dos encuestas distintas.')
    setError(undefined)
    setComparando(true)
  }

  const selector = (id: string, valor: string, onCambio: (v: string) => void, etiqueta: string) => (
    <Field data-invalid={error && !valor ? 'true' : undefined}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Select
        value={valor || null}
        onValueChange={(v) => {
          onCambio(String(v ?? ''))
          setError(undefined)
          setComparando(false)
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Elige una encuesta finalizada">{(v) => finalizadas.find((e) => e.id === v)?.nombre}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {finalizadas.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )

  const filas: [string, (e: Encuesta) => string][] = [
    ['Tipo', (e) => e.tipo],
    ['Fechas', (e) => `${fechaSinAnio(e.inicio)} – ${fechaCorta(e.cierre)}`],
    ['Participantes', (e) => (e.participantes ?? 0).toLocaleString('es-CO')],
    ['Respuestas', (e) => e.respuestas.toLocaleString('es-CO')],
    ['Avance', (e) => `${avanceDe(e)} %`],
  ]

  const cambiar = (siguiente: boolean) => {
    onAbiertoChange(siguiente)
    if (!siguiente) setComparando(false)
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={cambiar}
      title="Comparar encuestas"
      sub="Elige dos encuestas finalizadas para ver su participación lado a lado."
      // «Comparar» no cierra la ventana: la tabla aparece debajo de los selectores.
      footer={
        <>
          <Button variant="outline" onClick={() => cambiar(false)}>
            {comparando ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button onClick={comparar}>Comparar</Button>
        </>
      }
    >
        <FieldGroup>
          {selector('comparar-a', a, setA, 'Primera encuesta')}
          {selector('comparar-b', b, setB, 'Segunda encuesta')}
          {error ? (
            <Field data-invalid="true">
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        {/* Un resumen fijo de cinco datos lado a lado, no una lista de registros: por eso se queda en `Table` y no pasa a
            TablaDatos (sin buscador, orden ni paginación que ofrecer). */}
        {comparando && ea && eb ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Primera</TableHead>
                <TableHead>Segunda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map(([etiqueta, valor]) => (
                <TableRow key={etiqueta}>
                  <TableCell>{etiqueta}</TableCell>
                  <TableCell>{valor(ea)}</TableCell>
                  <TableCell>{valor(eb)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
    </ActionDialog>
  )
}

// ── Cambiar la fecha de cierre ──
// Lo único que se puede cambiar de una encuesta en progreso: el resto queda fijo mientras la gente responde.
// En la plataforma real se edita en la propia celda de la lista; aquí, en una ventana corta con un campo de fecha.

export function DialogoFechaCierre({
  encuesta,
  onCerrar,
  onGuardar,
}: {
  encuesta: Encuesta | null
  onCerrar: () => void
  onGuardar: (encuesta: Encuesta, cierre: Date) => void
}) {
  const [elegida, setElegida] = useState<Date | undefined>(undefined)
  const actual = encuesta ? new Date(`${encuesta.cierre}T00:00:00`) : undefined
  const propuesta = elegida ?? actual
  // Hay que elegir un día de hoy en adelante y distinto del que ya tiene.
  const valida = Boolean(encuesta && propuesta && propuesta.getTime() >= new Date(HOY).setHours(0, 0, 0, 0) && propuesta.getTime() !== actual?.getTime())

  return (
    <ActionDialog
      open={encuesta !== null}
      onOpenChange={(abierto) => {
        if (abierto) return
        setElegida(undefined)
        onCerrar()
      }}
      title="Cambiar la fecha de cierre"
      sub="Es lo único que puedes cambiar mientras la encuesta está en progreso. Las respuestas que ya llegaron se conservan."
      lead={
        encuesta ? (
          <>
            <Text weight="medium">{encuesta.nombre}</Text>
            <Text variant="muted" size="sm">
              Hoy cierra el {fechaCorta(encuesta.cierre)}
            </Text>
          </>
        ) : null
      }
      confirmLabel="Guardar"
      pendingLabel="Guardando…"
      confirmDisabled={!valida}
      onConfirm={() => {
        if (encuesta && propuesta) onGuardar(encuesta, propuesta)
        setElegida(undefined)
      }}
    >
      <Field>
        <FieldLabel htmlFor="encuesta-nuevo-cierre">Nueva fecha de cierre</FieldLabel>
        <CampoFecha id="encuesta-nuevo-cierre" valor={propuesta} desde={HOY} onCambio={setElegida} />
      </Field>
    </ActionDialog>
  )
}

// ── Vista previa ──

export function VistaPrevia({ encuesta, onCerrar }: { encuesta: Encuesta | null; onCerrar: () => void }) {
  // Las que se armaron en el formulario; las de ejemplo muestran las preguntas de base de su tipo.
  const preguntas = encuesta ? (encuesta.preguntas?.map((p) => p.texto) ?? preguntasDe(encuesta.tipo).map((p) => p.texto)) : []

  return (
    <DrawerShell
      open={encuesta !== null}
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      title={encuesta?.nombre ?? ''}
      description={encuesta ? `${encuesta.tipo} · ${fechaCorta(encuesta.inicio)} – ${fechaCorta(encuesta.cierre)}` : undefined}
      footer={<DrawerClose render={<Button variant="outline" />}>Cerrar vista previa</DrawerClose>}
    >
      <ItemGroup className="flex flex-col gap-2">
        {preguntas.map((pregunta, indice) => (
          <Item key={pregunta} variant="outline" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={HelpCircleIcon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Pregunta {indice + 1}</ItemTitle>
              <Text variant="muted" size="sm">
                {pregunta}
              </Text>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </DrawerShell>
  )
}

// ── Cargar datos demográficos ──
// Un CSV con una fila por persona; se valida y queda listo para segmentar resultados.

export function DialogoDemograficos({ abierto, onAbiertoChange, onListo }: { abierto: boolean; onAbiertoChange: (abierto: boolean) => void; onListo: () => void }) {
  const despues = useTemporizadores()
  const [estado, setEstado] = useState<Subida>('idle')
  const [porcentaje, setPorcentaje] = useState(0)

  const subir = () => {
    setEstado('uploading')
    ;[30, 65, 100].forEach((v, i) => despues(() => setPorcentaje(v), 350 * (i + 1)))
    despues(() => setEstado('processing'), 1200)
    despues(() => setEstado('done'), 2600)
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        onAbiertoChange(siguiente)
        if (!siguiente) setEstado('idle')
      }}
      title="Cargar datos demográficos"
      sub="Un CSV con el username de cada persona y sus datos: edad, antigüedad, sede, tipo de contrato y nivel."
      confirmLabel="Guardar datos"
      confirmDisabled={estado !== 'done'}
      onConfirm={onListo}
    >
        <AdjuntoCsv
          estado={estado}
          vacio={{ titulo: 'Elige el archivo de datos demográficos', descripcion: 'CSV · hasta 1 MB' }}
          nombre="demograficos-google-2026.csv"
          descripcion={estado === 'uploading' ? `Subiendo · ${porcentaje} %` : estado === 'processing' ? 'Revisando las 888 filas…' : '888 personas · 5 variables'}
          porcentaje={porcentaje}
          onElegir={subir}
          onQuitar={() => setEstado('idle')}
        />
        {estado === 'done' ? (
          <Alert variant="success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
            <AlertTitle>Archivo listo</AlertTitle>
            <AlertDescription>
              <p>Todas las filas coinciden con usuarios activos de tu empresa.</p>
            </AlertDescription>
          </Alert>
        ) : null}
    </ActionDialog>
  )
}
