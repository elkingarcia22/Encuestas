import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Button, FieldError } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { MIN_OPTIONS, buildOption } from '../../../modelo/questionCatalog'
import type { DemographicField } from '../../../modelo/surveyBuilderTypes'
import { BloqueNombre, BloqueOpciones } from '../../../components/demograficos/campos-demografico'
import { MENSAJE_NOMBRE_REPETIDO, nombreRepetido, plegarNombre as plegar } from '../../../components/demograficos/nombre-repetido'
import { LIMITE_NOMBRE_DEMOGRAFICO, cortoDeMinimo, mensajeMinimo } from '../../../modelo/limites-texto'

// Crear o editar un dato demográfico de la encuesta, en el mismo panel que usa el módulo de datos
// demográficos. Se trabaja sobre una copia: lo escrito solo llega a la encuesta al guardar. En los del
// sistema las opciones son fijas, porque son los valores que la plataforma guarda de cada persona. El nombre no puede
// repetir el de otro dato: del sistema, del módulo o de los de esta encuesta. Todos los datos demográficos son
// obligatorios al responder, así que el panel no pregunta por eso.

function Formulario({ campo, esNuevo, opcionesFijas, nombresUsados, onGuardar, onCancelar, onEliminar }: { campo: DemographicField; esNuevo: boolean; opcionesFijas: boolean; nombresUsados: readonly string[]; onGuardar: (campo: DemographicField) => void; onCancelar: () => void; onEliminar?: () => void }) {
  const [copia, setCopia] = useState(campo)
  const [intento, setIntento] = useState(false)
  const cambiar = (cambio: Partial<DemographicField>) => setCopia((actual) => ({ ...actual, ...cambio }))

  const sinNombre = copia.label.trim() === ''
  const nombreCorto = cortoDeMinimo(copia.label, LIMITE_NOMBRE_DEMOGRAFICO.min)
  const conTexto = copia.options.map((opcion) => opcion.label.trim()).filter((etiqueta) => etiqueta !== '')
  const pocasOpciones = conTexto.length < MIN_OPTIONS || conTexto.length < copia.options.length
  const opcionRepetida = new Set(conTexto.map(plegar)).size !== conTexto.length
  // Al editar, el nombre que ya traía no cuenta como repetido: solo se avisa si se cambia a otro que ya existe.
  const repetido = plegar(copia.label) !== plegar(campo.label) || esNuevo ? nombreRepetido(copia.label, nombresUsados) : false
  const listo = !sinNombre && !nombreCorto && !repetido && !pocasOpciones && !opcionRepetida
  // Algo cambió respecto a como se abrió: cerrar con la X, Escape, fuera o «Cancelar» pregunta antes (regla «panel-con-datos»).
  const conCambios = JSON.stringify(copia) !== JSON.stringify(campo)

  const guardar = () => {
    setIntento(true)
    if (listo) onGuardar(copia)
  }

  return (
    <DrawerShell
      open
      onOpenChange={(abierto) => (abierto ? undefined : onCancelar())}
      size="md"
      conCambios={conCambios}
      title={esNuevo ? 'Crear dato demográfico' : 'Editar dato demográfico'}
      description={esNuevo ? 'Solo se usará en esta encuesta. Después puedes guardarlo para reutilizarlo en futuras encuestas.' : 'Los cambios se aplican solo a esta encuesta.'}
      footer={
        <>
          {/* El pie lleva como mucho dos botones (regla «panel-volver-arriba»): «Cancelar» pasa por la misma pregunta que la X. */}
          <BotonCancelarPanel />
          <Button onClick={guardar} disabled={repetido}>{esNuevo ? 'Crear dato' : 'Guardar cambios'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <BloqueNombre id="dato-enunciado" valor={copia.label} onCambio={(label) => cambiar({ label })} error={repetido ? MENSAJE_NOMBRE_REPETIDO : intento && sinNombre ? `Ponle un nombre para poder ${esNuevo ? 'crearlo' : 'guardarlo'}.` : intento && nombreCorto ? mensajeMinimo(LIMITE_NOMBRE_DEMOGRAFICO.min) : null} />
        <BloqueOpciones
          opciones={copia.options.map((opcion) => ({ clave: opcion.id, texto: opcion.label }))}
          minimo={MIN_OPTIONS}
          fijas={opcionesFijas}
          onCambiar={(clave, texto) => cambiar({ options: copia.options.map((actual) => (actual.id === clave ? { ...actual, label: texto } : actual)) })}
          onQuitar={(clave) => cambiar({ options: copia.options.filter((actual) => actual.id !== clave) })}
          onAgregar={() => cambiar({ options: [...copia.options, buildOption()] })}
          errores={
            <>
              {intento && pocasOpciones ? <FieldError>Necesitas al menos {MIN_OPTIONS} opciones con texto: una sola no es una elección.</FieldError> : null}
              {opcionRepetida ? <FieldError>Hay opciones repetidas. Dos grupos con el mismo nombre no se pueden distinguir en los resultados.</FieldError> : null}
            </>
          }
        />
        {/* Eliminar va fuera del pie, al final del panel, en el rojo del design system (Botones › Peligro): abre la confirmación. */}
        {!esNuevo && onEliminar ? (
          <div>
            <Button variant="destructive" onClick={onEliminar}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
              Eliminar dato
            </Button>
          </div>
        ) : null}
      </div>
    </DrawerShell>
  )
}

export type EditorDato = { campo: DemographicField; esNuevo: boolean; opcionesFijas: boolean }

/** El panel se monta solo mientras hay algo que editar; al guardar o cancelar, `editor` vuelve a null. */
export function DrawerDato({ editor, nombresUsados, onGuardar, onCancelar, onEliminar }: { editor: EditorDato | null; nombresUsados: readonly string[]; onGuardar: (campo: DemographicField, esNuevo: boolean) => void; onCancelar: () => void; onEliminar?: (campo: DemographicField) => void }) {
  if (!editor) return null
  return <Formulario key={editor.campo.id} campo={editor.campo} esNuevo={editor.esNuevo} opcionesFijas={editor.opcionesFijas} nombresUsados={nombresUsados} onGuardar={(campo) => onGuardar(campo, editor.esNuevo)} onCancelar={onCancelar} onEliminar={onEliminar ? () => onEliminar(editor.campo) : undefined} />
}
