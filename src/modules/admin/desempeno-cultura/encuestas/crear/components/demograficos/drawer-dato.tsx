import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldContent, FieldDescription, FieldError, FieldLabel, FramePanel, Switch } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { MIN_OPTIONS, buildOption } from '../../../modelo/questionCatalog'
import type { DemographicField } from '../../../modelo/surveyBuilderTypes'
import { BloqueNombre, BloqueOpciones, BloqueTipo } from '../../../components/demograficos/campos-demografico'
import { MarcoLista } from '../../../components/marco-lista'
import { MENSAJE_NOMBRE_REPETIDO, nombreRepetido, plegarNombre as plegar } from '../../../components/demograficos/nombre-repetido'
import { LIMITE_NOMBRE_DEMOGRAFICO, cortoDeMinimo, mensajeMinimo } from '../../../modelo/limites-texto'

// Crear o editar un dato demográfico de la encuesta, en el mismo panel que usa el módulo de datos
// demográficos. Se trabaja sobre una copia: lo escrito solo llega a la encuesta al guardar. En los del
// sistema las opciones son fijas, porque son los valores que la plataforma guarda de cada persona. El nombre no puede
// repetir el de otro dato: del sistema, del módulo o de los de esta encuesta.

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

  const guardar = () => {
    setIntento(true)
    if (listo) onGuardar(copia)
  }

  return (
    <DrawerShell
      open
      onOpenChange={(abierto) => (abierto ? undefined : onCancelar())}
      size="md"
      title={esNuevo ? 'Crear dato demográfico' : 'Editar dato demográfico'}
      description={esNuevo ? 'Solo se usará en esta encuesta. Después puedes guardarlo en el módulo para reutilizarlo.' : 'Los cambios se aplican solo a esta encuesta.'}
      footer={
        <>
          {/* Eliminar abajo a la izquierda, en el rojo del design system (Botones › Peligro): abre la confirmación. */}
          {!esNuevo && onEliminar ? (
            <Button variant="destructive" className="mr-auto" onClick={onEliminar}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
              Eliminar
            </Button>
          ) : null}
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={repetido}>{esNuevo ? 'Crear dato' : 'Guardar cambios'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <BloqueNombre id="dato-enunciado" valor={copia.label} onCambio={(label) => cambiar({ label })} error={repetido ? MENSAJE_NOMBRE_REPETIDO : intento && sinNombre ? `Ponle un nombre para poder ${esNuevo ? 'crearlo' : 'guardarlo'}.` : intento && nombreCorto ? mensajeMinimo(LIMITE_NOMBRE_DEMOGRAFICO.min) : null} />
        <BloqueTipo id="dato-tipo" valor={copia.type} onCambio={(type) => cambiar({ type })} deshabilitado={opcionesFijas} />
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
        {copia.visible ? (
          <MarcoLista titulo="Al responder">
            <FramePanel>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="dato-obligatoria">Obligatoria</FieldLabel>
                  <FieldDescription>El participante no puede terminar la encuesta sin responderla.</FieldDescription>
                </FieldContent>
                <Switch id="dato-obligatoria" checked={copia.required} onCheckedChange={(required) => cambiar({ required })} />
              </Field>
            </FramePanel>
          </MarcoLista>
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
