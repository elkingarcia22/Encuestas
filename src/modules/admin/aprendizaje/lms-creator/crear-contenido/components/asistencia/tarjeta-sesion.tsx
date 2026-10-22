import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, Field, FieldLabel, Input, Textarea } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import type { SesionAsistencia } from '../borrador'
import { MAX_NOMBRE_SESION, aFechaGuardada, leerFecha, nombrePorDefecto, normalizarHora } from './sesiones'

// El formulario de **una** sesión del recurso Asistencia: nombre, fecha, horario y descripción, con su borrado.
// Vive aparte porque lo usa la pantalla «Agregar asistencia» (antes estaba dentro de su modal).

export function TarjetaSesion({
  sesion,
  indice,
  unica,
  onCambio,
  onQuitar,
}: {
  sesion: SesionAsistencia
  indice: number
  unica: boolean
  onCambio: (cambio: Partial<SesionAsistencia>) => void
  onQuitar: () => void
}) {
  const base = `as-${sesion.id}`
  // Borrar una sesión se lleva por delante su fecha, su horario y su descripción, y no hay forma de deshacerlo: se
  // pregunta antes, como en el resto de los borrados del asistente (Dave, 2-oct).
  const [confirmando, setConfirmando] = useState(false)
  const [horasTocadas, setHorasTocadas] = useState({ inicio: false, fin: false })
  const horaInvalida = (campo: 'inicio' | 'fin') => horasTocadas[campo] && !normalizarHora(sesion[campo])

  // Al salir del campo: una hora válida queda como «HH:MM» (9:00 → 09:00).
  const cerrarHora = (campo: 'inicio' | 'fin') => {
    setHorasTocadas((t) => ({ ...t, [campo]: true }))
    const normal = normalizarHora(sesion[campo])
    if (normal && normal !== sesion[campo]) onCambio({ [campo]: normal })
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor={`${base}-nombre`}>Nombre de la sesión</FieldLabel>
            <Hint label={unica ? 'Debes tener al menos una sesión' : 'Eliminar sesión'}>
              {/* El span recibe el cursor: un botón deshabilitado no lo emite. */}
              <span className="inline-flex">
                <BotonIcono aria-label="Eliminar sesión" disabled={unica} onClick={() => setConfirmando(true)}>
                  <HugeiconsIcon icon={Delete02Icon} size={16} className="text-destructive" />
                </BotonIcono>
              </span>
            </Hint>
          </div>
          <Input
            id={`${base}-nombre`}
            value={sesion.nombre}
            maxLength={MAX_NOMBRE_SESION}
            onChange={(e) => onCambio({ nombre: e.target.value.slice(0, MAX_NOMBRE_SESION) })}
            onBlur={(e) => {
              if (!e.target.value.trim()) onCambio({ nombre: nombrePorDefecto(indice) })
            }}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr]">
          <Field>
            <FieldLabel htmlFor={`${base}-fecha`}>Fecha</FieldLabel>
            {/* El campo de fecha del sistema (decisión 19 de la auditoría, 5-oct): 40 px como las horas, «1 oct 2026» y
                calendario en español con selector de mes y año. Antes era una copia propia de 36 px con «dd/mm/aaaa». */}
            <CampoFecha
              id={`${base}-fecha`}
              valor={leerFecha(sesion.fecha) ?? undefined}
              invalido={!leerFecha(sesion.fecha)}
              onCambio={(fecha) => fecha && onCambio({ fecha: aFechaGuardada(fecha) })}
            />
          </Field>
          <Field data-invalid={horaInvalida('inicio') ? 'true' : undefined}>
            <FieldLabel htmlFor={`${base}-inicio`}>Hora inicio</FieldLabel>
            <Input
              id={`${base}-inicio`}
              value={sesion.inicio}
              inputMode="numeric"
              placeholder="09:00"
              maxLength={5}
              aria-invalid={horaInvalida('inicio') ? true : undefined}
              onChange={(e) => onCambio({ inicio: e.target.value })}
              onBlur={() => cerrarHora('inicio')}
            />
          </Field>
          <Field data-invalid={horaInvalida('fin') ? 'true' : undefined}>
            <FieldLabel htmlFor={`${base}-fin`}>Hora fin</FieldLabel>
            <Input
              id={`${base}-fin`}
              value={sesion.fin}
              inputMode="numeric"
              placeholder="10:00"
              maxLength={5}
              aria-invalid={horaInvalida('fin') ? true : undefined}
              onChange={(e) => onCambio({ fin: e.target.value })}
              onBlur={() => cerrarHora('fin')}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${base}-descripcion`}>
            Descripción
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </FieldLabel>
          <Textarea
            id={`${base}-descripcion`}
            rows={3}
            className="min-h-20"
            value={sesion.descripcion}
            placeholder="Agrega una descripción para la sesión"
            onChange={(e) => onCambio({ descripcion: e.target.value })}
          />
        </Field>
      </CardContent>

      {/* El nombre de la sesión va en el cuerpo, no en el título: el título dice qué es la ventana. */}
      <DialogoConfirmar
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        icono={Delete02Icon}
        destructiva
        titulo="¿Eliminar la sesión?"
        descripcion="Su fecha, su horario y su descripción se borran. No se puede deshacer."
        cancelar="Conservarla"
        accion="Eliminar sesión"
        onConfirmar={() => {
          setConfirmando(false)
          onQuitar()
        }}
      >
        <RegistroConfirmar nombre={sesion.nombre.trim() || nombrePorDefecto(indice)} detalle="Sesión de asistencia" tono="neutro" />
      </DialogoConfirmar>
    </Card>
  )
}
