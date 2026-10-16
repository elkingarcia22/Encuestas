import { useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  InputGroupAddon,
  useComboboxAnchor,
} from '@ubits/flux-ui'

// Si lo escrito no está en la lista, se ofrece como una opción más para poder crearla sin salir del campo.
function conLoEscrito(opciones: string[], escrito: string) {
  const limpio = escrito.trim()
  if (!limpio) return opciones
  const existe = opciones.some((opcion) => opcion.toLowerCase() === limpio.toLowerCase())
  return existe ? opciones : [...opciones, limpio]
}

// Lo que se acaba de crear tiene que quedarse en la lista: el campo se vacía al elegir y, si el valor
// nuevo no siguiera estando entre las opciones, el selector lo daría por inexistente y lo borraría.
function useCreadas(opciones: string[]) {
  const [creadas, setCreadas] = useState<string[]>([])
  const todas = useMemo(() => [...opciones, ...creadas.filter((creada) => !opciones.includes(creada))], [opciones, creadas])
  const recordar = (elegidas: string[]) => {
    const nuevas = elegidas.filter((elegida) => !todas.includes(elegida))
    if (nuevas.length > 0) setCreadas((previas) => [...previas, ...nuevas])
  }
  return { todas, recordar }
}

// Campo de una sola opción con buscador, icono a la izquierda y la posibilidad de crear la que falte
// (el área de la vacante se crea aquí mismo, como en la pantalla real). Lo escrito que no existe
// aparece al final como «+ Crear área «…»», para que se note que se puede crear ahí mismo.
export function SelectorCreable({
  id,
  icono,
  opciones,
  valor,
  onCambio,
  placeholder,
  crear,
  onCrear,
}: {
  id: string
  icono: IconSvgElement
  opciones: string[]
  valor: string
  onCambio: (valor: string) => void
  placeholder: string
  // Qué se crea, en minúscula: «área», «categoría».
  crear: string
  // Avisa cuando se elige una opción nueva (p. ej. para guardarla fuera del campo).
  onCrear?: (valor: string) => void
}) {
  const ancla = useComboboxAnchor()
  const [escrito, setEscrito] = useState('')
  const { todas, recordar } = useCreadas(opciones)
  // La lista se memoriza: si cambia de identidad en cada render, el selector pierde la opción
  // resaltada justo antes del Enter y parece que la tecla no hace nada.
  const disponibles = useMemo(() => conLoEscrito(todas, escrito), [todas, escrito])

  return (
    <Combobox
      items={disponibles}
      value={valor || null}
      // Resalta la primera coincidencia: sin esto, Enter no elige nada y el campo parece no responder.
      autoHighlight
      // El texto del buscador lo maneja el componente: aquí solo se escucha para saber qué ofrecer crear.
      onInputValueChange={setEscrito}
      onValueChange={(nuevo) => {
        const elegido = (nuevo as string | null) ?? ''
        if (elegido && !todas.includes(elegido)) onCrear?.(elegido)
        recordar(elegido ? [elegido] : [])
        onCambio(elegido)
      }}
    >
      {/* El icono va en el lugar que el campo trae para eso, no encima con relleno a mano (5 oct, Nicolás: «¿por qué los
          de arriba tienen más espacio del icono al texto que los de abajo?»): queda a la misma distancia del texto que en
          los selectores de país y ciudad. */}
      <div ref={ancla}>
        <ComboboxInput id={id} placeholder={placeholder}>
          <InputGroupAddon align="inline-start">
            <HugeiconsIcon icon={icono} size={16} aria-hidden="true" />
          </InputGroupAddon>
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={ancla}>
        <ComboboxEmpty>Escribe un nombre para crear una {crear}.</ComboboxEmpty>
        <ComboboxList>
          {(opcion: string) =>
            todas.includes(opcion) ? (
              <ComboboxItem key={opcion} value={opcion}>
                {opcion}
              </ComboboxItem>
            ) : (
              <ComboboxItem key={opcion} value={opcion}>
                <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                Crear {crear} «{opcion}»
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// Campo de varias opciones en fichas. Con `creable` acepta valores que no están en la lista:
// es lo que necesitan las habilidades clave, donde cada empresa usa las suyas.
export function SelectorEtiquetas({
  id,
  icono,
  opciones,
  valor,
  onCambio,
  placeholder,
  creable = false,
}: {
  id: string
  icono?: IconSvgElement
  opciones: string[]
  valor: string[]
  onCambio: (valor: string[]) => void
  placeholder: string
  creable?: boolean
}) {
  const ancla = useComboboxAnchor()
  const [escrito, setEscrito] = useState('')
  const { todas, recordar } = useCreadas(opciones)
  const disponibles = useMemo(() => (creable ? conLoEscrito(todas, escrito) : todas), [creable, todas, escrito])

  return (
    <Combobox
      multiple
      items={disponibles}
      value={valor}
      autoHighlight
      onInputValueChange={setEscrito}
      onValueChange={(nuevo) => {
        const elegidas = nuevo as string[]
        recordar(elegidas)
        onCambio(elegidas)
      }}
    >
      <ComboboxChips ref={ancla}>
        {icono ? (
          <span className="flex items-center text-muted-foreground">
            <HugeiconsIcon icon={icono} size={18} aria-hidden="true" />
          </span>
        ) : null}
        <ComboboxValue>
          {(elegidas: string[]) => (
            <>
              {elegidas.map((elegida) => (
                <ComboboxChip key={elegida}>{elegida}</ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={elegidas.length ? '' : placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={ancla}>
        <ComboboxEmpty>{creable ? 'Escribe una habilidad para agregarla.' : 'No encontramos nada con ese nombre.'}</ComboboxEmpty>
        <ComboboxList>
          {(opcion: string) => (
            <ComboboxItem key={opcion} value={opcion}>
              {opcion}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
