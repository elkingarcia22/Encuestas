import { useState } from 'react'
import { CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Field, FieldDescription, FieldLabel, Input } from '@ubits/flux-ui'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import type { Ciclo } from '../modelo/ciclos'

// Las dos confirmaciones de la lista de ciclos, con la misma pieza que las de Encuestas. Finalizar cierra el reporte de
// avance; eliminar borra el ciclo con sus objetivos y su historial de avance. Las dos llevan la tarjeta del registro
// (RegistroConfirmar): qué ciclo se toca, en qué estado está y a cuántas personas y objetivos afecta.

const detalleCiclo = (ciclo: Ciclo) => `${ciclo.periodo} · ${plural(ciclo.personas, '1 persona', `${ciclo.personas.toLocaleString('es-CO')} personas`)} · ${plural(ciclo.objetivos, '1 objetivo', `${ciclo.objetivos.toLocaleString('es-CO')} objetivos`)}`

export function DialogoFinalizar({ ciclo, onCerrar, onConfirmar }: { ciclo: Ciclo | null; onCerrar: () => void; onConfirmar: (ciclo: Ciclo) => void }) {
  return (
    <DialogoConfirmar
      abierto={ciclo !== null}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCerrar())}
      icono={CheckmarkCircle02Icon}
      titulo="¿Finalizar este ciclo?"
      descripcion={<><strong className="font-semibold">{ciclo?.nombre ?? ''}</strong> dejará de recibir reportes de avance desde hoy. El avance queda como está y podrás consultarlo.</>}
      accion="Finalizar ciclo"
      onConfirmar={() => ciclo && onConfirmar(ciclo)}
    >
      {ciclo ? <RegistroConfirmar nombre={ciclo.nombre} detalle={detalleCiclo(ciclo)} estado={ciclo.estado} tono="neutro" /> : null}
    </DialogoConfirmar>
  )
}

export function DialogoEliminar({ ciclos, onCerrar, onConfirmar }: { ciclos: readonly Ciclo[]; onCerrar: () => void; onConfirmar: (ciclos: readonly Ciclo[]) => void }) {
  const uno = ciclos.length === 1 ? ciclos[0] : null
  // Un solo ciclo se elimina escribiendo su nombre, como una encuesta (21-oct, del prototipo): es lo menos reversible del
  // módulo. Con varios no hay un nombre que escribir.
  const [texto, setTexto] = useState('')
  const listo = uno ? texto.trim() === uno.nombre : ciclos.length > 1
  return (
    <DialogoConfirmar
      abierto={ciclos.length > 0}
      onAbiertoChange={(abierto) => {
        if (abierto) return
        setTexto('')
        onCerrar()
      }}
      icono={Delete02Icon}
      titulo={uno ? '¿Eliminar este ciclo?' : `¿Eliminar ${ciclos.length} ciclos?`}
      descripcion={
        uno
          ? <><strong className="font-semibold">{uno.nombre}</strong>, sus objetivos y su historial de avance se eliminarán definitivamente. Esta acción no se puede deshacer.</>
          : 'Los ciclos seleccionados, sus objetivos y su historial de avance se eliminarán definitivamente. Esta acción no se puede deshacer.'
      }
      accion="Eliminar"
      destructiva
      deshabilitada={!listo}
      onConfirmar={() => {
        setTexto('')
        onConfirmar(ciclos)
      }}
    >
      {uno ? (
        <>
          <RegistroConfirmar nombre={uno.nombre} detalle={detalleCiclo(uno)} estado={uno.estado} tono="neutro" />
          <Field>
            <FieldLabel htmlFor="confirmar-eliminar-ciclo">
              {/* El rótulo es un flex: sin el span cada trozo de texto sería una columna aparte. */}
              <span className="block">
                Escribe <strong className="font-semibold">«{uno.nombre}»</strong> para confirmar
              </span>
            </FieldLabel>
            <Input id="confirmar-eliminar-ciclo" value={texto} autoComplete="off" onChange={(evento) => setTexto(evento.target.value)} />
            <FieldDescription>Así nadie elimina un ciclo con avance por un clic de más.</FieldDescription>
          </Field>
        </>
      ) : ciclos.length > 1 ? (
        <RegistroConfirmar
          nombre={`${ciclos.length} ciclos`}
          detalle={`${ciclos.slice(0, 3).map((ciclo) => ciclo.nombre).join(', ')}${ciclos.length > 3 ? ` y ${ciclos.length - 3} más` : ''} · ${plural(
            ciclos.reduce((suma, ciclo) => suma + ciclo.objetivos, 0),
            '1 objetivo',
            `${ciclos.reduce((suma, ciclo) => suma + ciclo.objetivos, 0).toLocaleString('es-CO')} objetivos`,
          )}`}
          tono="neutro"
        />
      ) : null}
    </DialogoConfirmar>
  )
}
