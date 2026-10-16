import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Button, FieldError } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { createLibraryDemographic, updateLibraryDemographic } from '../../modelo/demographicsLibrary'
import type { DemographicType } from '../../modelo/surveyBuilderTypes'
import { BloqueNombre, BloqueOpciones, BloqueTipo } from './campos-demografico'
import { MENSAJE_NOMBRE_REPETIDO, nombreRepetido, plegarNombre as plegar } from './nombre-repetido'
import { LIMITE_NOMBRE_DEMOGRAFICO, cortoDeMinimo, mensajeMinimo } from '../../modelo/limites-texto'

// Crear o editar un dato demográfico: cómo se llama, cómo se responde y qué se puede responder.
// Cada opción es un grupo por el que se cortarán los resultados, así que no se aceptan menos de
// dos ni repetidas, y el nombre no puede chocar con otro: dos iguales serían indistinguibles en
// los filtros.

export type DemograficoEditable = {
  key: string
  label: string
  type: DemographicType
  optionLabels: readonly string[]
}

const MINIMO_OPCIONES = 2

export function FormularioDemografico({
  abierto,
  onAbiertoChange,
  editando,
  nombresUsados,
  onGuardado,
  onEliminar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** El demográfico que se edita, o null para crear uno nuevo. */
  editando: DemograficoEditable | null
  nombresUsados: readonly string[]
  onGuardado: () => void
  /** Al editar: eliminarlo (abre la confirmación de la pestaña). */
  onEliminar?: () => void
}) {
  const esEdicion = editando !== null
  const [nombre, setNombre] = useState(editando?.label ?? '')
  const [tipo, setTipo] = useState<DemographicType>(editando?.type ?? 'single')
  const [opciones, setOpciones] = useState<readonly string[]>(editando && editando.optionLabels.length > 0 ? editando.optionLabels : ['', ''])
  const [intento, setIntento] = useState(false)

  const nombreLimpio = nombre.trim()
  const repetido = nombreRepetido(nombreLimpio, nombresUsados)
  const conTexto = opciones.map((opcion) => opcion.trim()).filter((opcion) => opcion !== '')
  const opcionRepetida = new Set(conTexto.map(plegar)).size !== conTexto.length
  const sinNombre = nombreLimpio === ''
  const nombreCorto = cortoDeMinimo(nombreLimpio, LIMITE_NOMBRE_DEMOGRAFICO.min)
  const pocasOpciones = conTexto.length < MINIMO_OPCIONES
  const listo = !sinNombre && !nombreCorto && !repetido && !pocasOpciones && !opcionRepetida

  const errorNombre = repetido
    ? MENSAJE_NOMBRE_REPETIDO
    : intento && sinNombre
      ? `Ponle un nombre para poder ${esEdicion ? 'guardarlo' : 'crearlo'}.`
      : intento && nombreCorto
        ? mensajeMinimo(LIMITE_NOMBRE_DEMOGRAFICO.min)
        : null

  const guardar = () => {
    setIntento(true)
    if (!listo) return
    const datos = { label: nombreLimpio, type: tipo, optionLabels: conTexto }
    const resultado = esEdicion ? updateLibraryDemographic(editando.key, datos) : createLibraryDemographic(datos)
    if (!resultado) {
      notify(esEdicion ? 'No se pudo guardar el demográfico' : 'No se pudo crear el demográfico', 'Revisa que el nombre no esté repetido.')
      return
    }
    notify(
      esEdicion ? 'Demográfico actualizado' : 'Demográfico creado',
      esEdicion ? `«${resultado.label}» se actualizó correctamente.` : `«${resultado.label}» ya está disponible para segmentar.`,
    )
    onGuardado()
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="md"
      title={esEdicion ? 'Editar dato demográfico' : 'Crear dato demográfico'}
      description={
        esEdicion
          ? 'Los cambios se reflejarán en los filtros de resultados que ya lo usan.'
          : 'Quedará disponible para segmentar los resultados de cualquier encuesta.'
      }
      footer={
        <>
          {/* Eliminar abajo a la izquierda, en el rojo del design system (Botones › Peligro): abre la confirmación. */}
          {esEdicion && onEliminar ? (
            <Button variant="destructive" className="mr-auto" onClick={onEliminar}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
              Eliminar
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onAbiertoChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={repetido}>{esEdicion ? 'Guardar cambios' : 'Crear demográfico'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <BloqueNombre id="demografico-nombre" valor={nombre} onCambio={setNombre} error={errorNombre} />
        <BloqueTipo id="demografico-tipo" valor={tipo} onCambio={setTipo} />
        <BloqueOpciones
          opciones={opciones.map((texto, indice) => ({ clave: String(indice), texto }))}
          minimo={MINIMO_OPCIONES}
          onCambiar={(clave, texto) => setOpciones(opciones.map((actual, posicion) => (String(posicion) === clave ? texto : actual)))}
          onQuitar={(clave) => setOpciones(opciones.filter((_valor, posicion) => String(posicion) !== clave))}
          onAgregar={() => setOpciones([...opciones, ''])}
          errores={
            <>
              {intento && pocasOpciones ? <FieldError>Necesitas al menos {MINIMO_OPCIONES} opciones con texto: una sola no es una elección.</FieldError> : null}
              {opcionRepetida ? <FieldError>Hay opciones repetidas. Dos grupos con el mismo nombre no se pueden distinguir en los resultados.</FieldError> : null}
            </>
          }
        />
      </div>
    </DrawerShell>
  )
}
