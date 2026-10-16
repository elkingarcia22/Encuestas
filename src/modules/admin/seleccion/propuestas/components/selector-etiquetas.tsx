import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

// Elegir etiquetas (las que reemplazan a las carpetas, decisión 8): el selector con fichas y buscador de la librería,
// como en «Formularios › Asignación». Si lo que se escribe no existe, la lista ofrece crearla: las etiquetas nacen al
// usarlas, no en una pantalla de configuración.
export function SelectorEtiquetas({
  valor,
  onCambiar,
  disponibles,
  placeholder = 'Elige o escribe una etiqueta',
  id,
}: {
  valor: string[]
  onCambiar: (valor: string[]) => void
  disponibles: string[]
  placeholder?: string
  id?: string
}) {
  const ancla = useComboboxAnchor()
  const [escrito, setEscrito] = useState('')
  const nueva = escrito.trim()
  const existe = [...disponibles, ...valor].some((una) => una.toLowerCase() === nueva.toLowerCase())
  const opciones = [...new Set([...valor, ...disponibles])].concat(nueva && !existe ? [nueva] : [])

  return (
    <Combobox
      multiple
      items={opciones}
      value={valor}
      // Resalta la primera: sin esto, escribir una nueva y dar Enter no la crea y el campo parece no responder.
      autoHighlight
      onValueChange={(nuevo) => {
        onCambiar(nuevo as string[])
        setEscrito('')
      }}
      inputValue={escrito}
      onInputValueChange={(texto) => setEscrito(texto)}
    >
      <ComboboxChips ref={ancla}>
        <ComboboxValue>
          {(elegidas: string[]) => (
            <>
              {elegidas.map((elegida) => (
                // La «x» de la librería no tiene nombre para el lector de pantalla (falla AA, 27 sep): va la del proyecto,
                // con «Quitar …».
                <ComboboxChip key={elegida} showRemove={false}>
                  {elegida}
                  <BotonIcono
                    size="icon-xs"
                    aria-label={`Quitar «${elegida}»`}
                    className="-me-1 size-4! opacity-60 hover:opacity-100"
                    onClick={() => onCambiar(valor.filter((una) => una !== elegida))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </BotonIcono>
                </ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={elegidas.length ? '' : placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={ancla}>
        <ComboboxEmpty>Escribe para crear una etiqueta.</ComboboxEmpty>
        <ComboboxList>
          {(opcion: string) => (
            <ComboboxItem key={opcion} value={opcion}>
              {opcion === nueva && !existe ? `Crear la etiqueta «${opcion}»` : opcion}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
