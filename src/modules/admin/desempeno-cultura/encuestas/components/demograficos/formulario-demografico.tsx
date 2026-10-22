import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Button, FieldError } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { createLibraryDemographic, updateLibraryDemographic } from '../../modelo/demographicsLibrary'
import type { DemographicType } from '../../modelo/surveyBuilderTypes'
import { BloqueNombre, BloqueOpciones } from './campos-demografico'
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
  // El tipo de respuesta ya no se elige: al crear es «Opción única» y al editar se conserva el que traía.
  const tipo: DemographicType = editando?.type ?? 'single'
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
  // Hay algo escrito o cambiado frente a lo que había al abrir: cerrar pregunta antes de perderlo (regla «panel-con-cambios»).
  const opcionesIniciales = editando?.optionLabels ?? []
  const cambiado =
    nombreLimpio !== (editando?.label ?? '').trim() ||
    conTexto.length !== opcionesIniciales.length ||
    conTexto.some((opcion, posicion) => opcion !== opcionesIniciales[posicion])

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
      notify(esEdicion ? 'No se pudo guardar el demográfico' : 'No se pudo crear el demográfico', 'Revisa que el nombre no esté repetido.', 'error')
      return
    }
    notify(
      esEdicion ? 'Demográfico actualizado' : 'Demográfico creado',
      esEdicion ? `«${resultado.label}» se actualizó correctamente.` : `«${resultado.label}» ya está disponible para segmentar.`,
      'success',
    )
    onGuardado()
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="md"
      conCambios={cambiado}
      title={esEdicion ? 'Editar dato demográfico' : 'Crear dato demográfico'}
      description={
        esEdicion
          ? 'Los cambios se reflejarán en los filtros de resultados que ya lo usan.'
          : 'Quedará disponible para segmentar los resultados de cualquier encuesta.'
      }
      footer={
        <>
          {/* «Cancelar» pasa por la misma pregunta que la X y Escape cuando hay algo escrito. */}
          <BotonCancelarPanel />
          <Button onClick={guardar} disabled={repetido}>{esEdicion ? 'Guardar cambios' : 'Crear demográfico'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <BloqueNombre id="demografico-nombre" valor={nombre} onCambio={setNombre} error={errorNombre} />
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
        {/* Eliminar va en el cuerpo, al final y en el rojo del design system (Botones › Peligro): el pie lleva como mucho dos
            botones (regla «panel-volver-arriba», 13-oct). Abre la confirmación. */}
        {esEdicion && onEliminar ? (
          <Button variant="destructive" className="self-start" onClick={onEliminar}>
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
            Eliminar dato demográfico
          </Button>
        ) : null}
      </div>
    </DrawerShell>
  )
}
