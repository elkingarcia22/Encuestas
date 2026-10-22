import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle, FramePanel, IconTile, Input, RadioGroup, RadioGroupItem, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { TARJETA_OPCION } from '@/shared/components/estilos-propios'
import { DEMOGRAPHIC_TYPES, demographicTypeTone } from '../../modelo/demographics'
import { TYPE_HINTS } from '../../modelo/demographicTypeHints'
import type { DemographicType } from '../../modelo/surveyBuilderTypes'
import { LIMITE_NOMBRE_DEMOGRAFICO, LIMITE_OPCION_DEMOGRAFICO, cercaDelTope, contador } from '../../modelo/limites-texto'
import { MarcoLista } from '../marco-lista'
import { TEXTO_POR_TONO } from '../tonos'

// Los bloques del formulario de un dato demográfico, iguales al crear o editar desde el módulo de datos demográficos
// y desde el paso de la encuesta. Cada bloque es un marco, como el resto de los drawers del módulo: el nombre, el tipo
// de respuesta (una tarjeta de opción por tipo, como en Formularios del design system) y las opciones.

export function BloqueNombre({ id, valor, onCambio, error }: { id: string; valor: string; onCambio: (valor: string) => void; error: string | null }) {
  return (
    <MarcoLista titulo="Pregunta o enunciado" descripcion="Lo verán los participantes y los filtros de resultados.">
      <FramePanel>
        <Field data-invalid={error !== null || undefined}>
          <Input id={id} value={valor} maxLength={LIMITE_NOMBRE_DEMOGRAFICO.max} onChange={(evento) => onCambio(evento.target.value.slice(0, LIMITE_NOMBRE_DEMOGRAFICO.max))} placeholder="Ej. Tipo de jornada" aria-label="Pregunta o enunciado" aria-invalid={error !== null} />
          <FieldDescription>{contador(valor.length, LIMITE_NOMBRE_DEMOGRAFICO.max)}</FieldDescription>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FramePanel>
    </MarcoLista>
  )
}

export function BloqueTipo({ id, valor, onCambio, deshabilitado = false }: { id: string; valor: DemographicType; onCambio: (valor: DemographicType) => void; deshabilitado?: boolean }) {
  return (
    <MarcoLista titulo="Tipo de respuesta" descripcion={deshabilitado ? 'Lo define la plataforma.' : undefined}>
      <FramePanel>
        <RadioGroup value={valor} onValueChange={(nuevo) => onCambio(nuevo as DemographicType)} disabled={deshabilitado} className="grid gap-2">
            {DEMOGRAPHIC_TYPES.map((entrada) => (
              <FieldLabel key={entrada.value} htmlFor={`${id}-${entrada.value}`} className={TARJETA_OPCION}>
                {/* items-center!: el radio, el icono y el texto centrados en la tarjeta; el campo en fila los alinea arriba y no
                    cede con una clase normal (ficha instalacion-estilos-sin-capa en ai-tools/flux-ui/diferencias.json). */}
                <Field orientation="horizontal" className="items-center!">
                  <RadioGroupItem value={entrada.value} id={`${id}-${entrada.value}`} />
                  <IconTile variant="soft" size="sm" className={`shrink-0 ${TEXTO_POR_TONO[demographicTypeTone(entrada.value)]}`}>
                    <HugeiconsIcon icon={entrada.icon} aria-hidden="true" />
                  </IconTile>
                  <FieldContent>
                    <FieldTitle>{entrada.label}</FieldTitle>
                    <FieldDescription>{TYPE_HINTS[entrada.value]}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
        </RadioGroup>
      </FramePanel>
    </MarcoLista>
  )
}

export type OpcionEditable = { clave: string; texto: string }

export function BloqueOpciones({
  opciones,
  minimo,
  fijas = false,
  errores,
  onCambiar,
  onQuitar,
  onAgregar,
}: {
  opciones: readonly OpcionEditable[]
  minimo: number
  /** Las de los datos del sistema: se ven, no se cambian. */
  fijas?: boolean
  errores: ReactNode
  onCambiar: (clave: string, texto: string) => void
  onQuitar: (clave: string) => void
  onAgregar: () => void
}) {
  return (
    <MarcoLista
      titulo="Opciones de respuesta"
      descripcion={fijas ? 'Las define la plataforma.' : 'Cada una será un grupo para filtrar resultados.'}
    >
      <FramePanel className="flex flex-col gap-2">
        {opciones.map((opcion, indice) => (
          <div key={opcion.clave} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Text as="span" size="xs" variant="muted" className="w-4 shrink-0 text-right tabular-nums">
              {indice + 1}
            </Text>
            <Input value={opcion.texto} disabled={fijas} maxLength={LIMITE_OPCION_DEMOGRAFICO.max} aria-label={`Opción ${indice + 1}`} placeholder={`Opción ${indice + 1}`} onChange={(evento) => onCambiar(opcion.clave, evento.target.value.slice(0, LIMITE_OPCION_DEMOGRAFICO.max))} />
            {fijas ? null : (
              // text-destructive!: el botón de icono no trae tono rojo para eliminar (ficha button-ghost-tonos).
              <BotonIcono aria-label={`Eliminar opción ${indice + 1}`} className="text-destructive!" disabled={opciones.length <= minimo} onClick={() => onQuitar(opcion.clave)}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              </BotonIcono>
            )}
          </div>
          {/* Campo corto: el contador sale al acercarse al tope, alineado con el campo (después del número). */}
          {!fijas && cercaDelTope(opcion.texto.length, LIMITE_OPCION_DEMOGRAFICO.max) ? <FieldDescription className="ps-6">{contador(opcion.texto.length, LIMITE_OPCION_DEMOGRAFICO.max)}</FieldDescription> : null}
          </div>
        ))}
        {fijas ? null : (
          <div className="ps-6">
            <Button variant="ghost" size="sm" onClick={onAgregar}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Agregar opción
            </Button>
          </div>
        )}
        {errores}
      </FramePanel>
    </MarcoLista>
  )
}
