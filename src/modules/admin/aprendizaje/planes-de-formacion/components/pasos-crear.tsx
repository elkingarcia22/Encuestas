import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button, Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger, Text, ToggleGroup, ToggleGroupItem, cn } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { plural } from '@/modules/design-system/patrones/formato'
import { miembrosDe, piezasDe, quienesDe, type Asignacion } from './planes-datos'

// Los pasos de Crear plan y el selector de asignaciones de los pasos 2 y 3. La fila de pasos es la de Encuestas (Elkin,
// pasos-encuesta.tsx): el actual y los hechos en círculo primario (los hechos con su marca), el bloqueado atenuado y el
// que se intentó dejar incompleto en rojo. Un paso bloqueado no se deshabilita: al pulsarlo, la pantalla dice qué falta.

export type PasoId = 'datos' | 'quienes' | 'que' | 'revisar'

export const PASOS: { id: PasoId; titulo: string; descripcion: string }[] = [
  { id: 'datos', titulo: 'Datos del plan', descripcion: 'Ponle nombre, tipo y fechas.' },
  { id: 'quienes', titulo: 'A quiénes', descripcion: 'Elige a quiénes les llega esta asignación.' },
  { id: 'que', titulo: 'Qué ven', descripcion: 'Elige qué ve esta asignación y en qué orden.' },
  { id: 'revisar', titulo: 'Revisar y guardar', descripcion: 'Así le llega el plan a cada grupo.' },
]
export const indiceDe = (paso: PasoId) => PASOS.findIndex((p) => p.id === paso)

// El que falló al intentar avanzar se pinta en rojo, gane a cualquier otro estado (el mismo «!» de Encuestas).
const FALLIDO = 'bg-destructive! text-primary-foreground! shadow-none!'

export function PasosPlan({
  paso,
  completos,
  bloqueados,
  fallidos,
  onPaso,
}: {
  paso: PasoId
  completos: ReadonlySet<PasoId>
  bloqueados: ReadonlySet<PasoId>
  fallidos: ReadonlySet<PasoId>
  onPaso: (paso: PasoId) => void
}) {
  return (
    <div className="@container">
      <Stepper value={indiceDe(paso) + 1} onValueChange={(numero) => onPaso(PASOS[numero - 1].id)} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
        <StepperNav aria-label="Pasos de creación" className="w-full">
          {PASOS.map((item, indice) => {
            const actual = item.id === paso
            const bloqueado = bloqueados.has(item.id)
            const fallido = fallidos.has(item.id) && !actual
            return (
              <StepperItem key={item.id} step={indice + 1} completed={completos.has(item.id) && !actual && !fallido} className="flex-1 last:flex-none">
                <StepperTrigger aria-controls={undefined} aria-disabled={bloqueado || undefined} className={cn('gap-2', bloqueado && 'opacity-60')}>
                  <StepperIndicator className={cn(STEP_INDICATOR, fallido && FALLIDO)}>{indice + 1}</StepperIndicator>
                  {/* Si la fila es angosta, solo el paso actual lleva su nombre. */}
                  <StepperTitle className={cn('text-sm whitespace-nowrap', !actual && '@max-[40rem]:sr-only')}>
                    {item.titulo}
                    {bloqueado ? <span className="sr-only">, bloqueado</span> : fallido ? <span className="sr-only">, por completar</span> : null}
                  </StepperTitle>
                </StepperTrigger>
                {indice < PASOS.length - 1 ? <StepperSeparator className={cn('mx-3 flex-1', STEP_LINE)} /> : null}
              </StepperItem>
            )
          })}
        </StepperNav>
      </Stepper>
    </div>
  )
}

// Una asignación está lista cuando tiene a quién llegarle y algo que ver.
export const asignacionLista = (asignacion: Asignacion) => miembrosDe(asignacion).length > 0 && asignacion.items.length > 0
// Una recién agregada que nadie tocó: no cuenta para el plan (se descarta al guardar).
export const asignacionVacia = (asignacion: Asignacion) => miembrosDe(asignacion).length === 0 && asignacion.items.length === 0

// «Asignación 2 · Comerciales · 84 personas»: el número para ubicarla, el nombre (o sus grupos) y a cuántos les llega.
export function rotuloAsignacion(asignacion: Asignacion, numero: number) {
  const cuantas = miembrosDe(asignacion).length
  const nombre = asignacion.nombre?.trim() || (piezasDe(asignacion).length ? quienesDe(asignacion) : '')
  return [`Asignación ${numero}`, nombre, cuantas ? `${cuantas.toLocaleString('es-CO')} ${plural(cuantas, 'persona', 'personas')}` : 'Sin personas'].filter(Boolean).join(' · ')
}

// Arriba de los pasos 2 y 3: las asignaciones del plan, una pastilla por cada una, para que se vea desde el principio que
// un plan puede tener varias (cada grupo con lo suyo) sin esperar a «Revisar». La actual va marcada; la que todavía no
// tiene personas o contenidos lleva el aviso. Cambiar de pastilla se queda en el mismo paso.
export function SelectorAsignaciones({
  asignaciones,
  actual,
  onElegir,
  onOtra,
}: {
  asignaciones: Asignacion[]
  actual: string
  onElegir: (id: string) => void
  onOtra: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup variant="outline" size="sm" spacing={2} value={[actual]} onValueChange={(valor) => (valor[0] ? onElegir(valor[0] as string) : undefined)} aria-label="Asignaciones del plan" className="flex-wrap">
          {asignaciones.map((asignacion, indice) => {
            const falta = !asignacionLista(asignacion)
            return (
              <ToggleGroupItem key={asignacion.id} value={asignacion.id} className="max-w-full min-w-0">
                {/* Un nombre que no cabe en la fila se corta; el tooltip lo dice completo. */}
                <TextoCompleto texto={rotuloAsignacion(asignacion, indice + 1)}>
                  <span className="truncate">{rotuloAsignacion(asignacion, indice + 1)}</span>
                </TextoCompleto>
                {falta ? (
                  <>
                    <HugeiconsIcon icon={Alert02Icon} className="text-warning" aria-hidden="true" />
                    <span className="sr-only">, le faltan personas o {asignacion.items.length ? 'personas' : 'contenidos'}</span>
                  </>
                ) : null}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
        <Button variant="ghost" size="sm" onClick={onOtra}>
          <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
          Otra asignación
        </Button>
      </div>
      <Text as="p" size="sm" variant="muted">
        Cada asignación es un grupo con sus propios contenidos. Arma una por grupo; en Revisar las ves todas juntas.
      </Text>
    </div>
  )
}
