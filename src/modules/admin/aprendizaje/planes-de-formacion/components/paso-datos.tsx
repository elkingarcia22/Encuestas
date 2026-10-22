import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  FramePanel,
  IconTile,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Textarea,
} from '@ubits/flux-ui'
import { Marco } from '@/modules/design-system/patrones/ficha'
import { CamposPlan, type DatosPlan } from './datos-plan'
import { MAXIMO_COMPETENCIAS, TIPOS, type TipoPlan } from './planes-datos'

// Paso 1 · Datos del plan: nombre, una descripción opcional (con su interruptor, como «Datos generales» de Encuestas),
// el tipo de plan en dos tarjetas de opción y las fechas (y, en competencias, las horas). Los campos de siempre son los
// de CamposPlan, los mismos de la ventana «Datos del plan» de la página del plan.

const MAX_DESCRIPCION = 300

const OPCIONES: { tipo: TipoPlan; icono: typeof BookOpen01Icon; detalle: string }[] = [
  { tipo: 'contenidos', icono: BookOpen01Icon, detalle: 'Cursos, rutas y charlas del catálogo, en el orden que elijas.' },
  { tipo: 'competencias', icono: Target02Icon, detalle: `Hasta ${MAXIMO_COMPETENCIAS} competencias por grupo, con horas de estudio para cada una.` },
]

export function PasoDatos({
  tipo,
  datos,
  descripcion,
  conDescripcion,
  conErrores,
  onDatos,
  onTipo,
  onDescripcion,
  onConDescripcion,
}: {
  tipo: TipoPlan
  datos: DatosPlan
  descripcion: string
  conDescripcion: boolean
  conErrores: boolean
  onDatos: (cambio: Partial<DatosPlan>) => void
  onTipo: (tipo: TipoPlan) => void
  onDescripcion: (descripcion: string) => void
  onConDescripcion: (activa: boolean) => void
}) {
  return (
    <Marco titulo="Datos del plan" descripcion="Cómo se llama, qué tipo de plan es y cuándo corre. Las fechas van según la zona horaria de tu compañía: America/Bogota.">
      <FramePanel className="@container">
        <CamposPlan
          tipo={tipo}
          datos={datos}
          onCambio={onDatos}
          conErrores={conErrores}
          notaFechas="Lo que se estudie fuera de estas fechas no cuenta para el plan."
          despuesDelNombre={
            <div className="flex flex-col gap-5">
              <Field orientation="horizontal">
                <Switch
                  id="plan-con-descripcion"
                  checked={conDescripcion}
                  onCheckedChange={(activa) => {
                    onConDescripcion(activa)
                    if (!activa) onDescripcion('')
                  }}
                />
                <FieldLabel htmlFor="plan-con-descripcion">Añadir descripción</FieldLabel>
              </Field>
              {conDescripcion ? (
                <Field>
                  <FieldLabel htmlFor="plan-descripcion">Descripción</FieldLabel>
                  <Textarea
                    id="plan-descripcion"
                    value={descripcion}
                    maxLength={MAX_DESCRIPCION}
                    onChange={(evento) => onDescripcion(evento.target.value.slice(0, MAX_DESCRIPCION))}
                    placeholder="Para qué es este plan y qué esperas que cambie"
                  />
                  <FieldDescription>
                    {descripcion.length} de {MAX_DESCRIPCION} caracteres
                  </FieldDescription>
                </Field>
              ) : null}
              {/* El tipo en dos tarjetas de opción, como «Tipo de visibilidad» en Encuestas. */}
              <FieldSet>
                <FieldLegend variant="label">Tipo de plan</FieldLegend>
                <RadioGroup value={tipo} onValueChange={(valor) => onTipo(valor as TipoPlan)} className="grid gap-3 @lg:grid-cols-2">
                  {OPCIONES.map((opcion) => (
                    <FieldLabel key={opcion.tipo} htmlFor={`plan-tipo-${opcion.tipo}`}>
                      {/* «items-center!», el mismo de «Tipo de visibilidad» en Encuestas: el campo horizontal del tema alinea arriba y el círculo quedaba suelto del icono. */}
                      <Field orientation="horizontal" className="items-center!">
                        <RadioGroupItem value={opcion.tipo} id={`plan-tipo-${opcion.tipo}`} />
                        <IconTile variant="soft" size="sm" className="shrink-0 text-primary">
                          <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                        </IconTile>
                        <FieldContent>
                          <FieldTitle>{TIPOS[opcion.tipo].singular}</FieldTitle>
                          <FieldDescription>{opcion.detalle}</FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
            </div>
          }
        />
      </FramePanel>
    </Marco>
  )
}
