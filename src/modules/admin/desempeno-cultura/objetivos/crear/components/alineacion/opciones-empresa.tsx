import { HugeiconsIcon } from '@hugeicons/react'
import { Unlink04Icon } from '@hugeicons/core-free-icons'
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@ubits/flux-ui'

// «Contribuye a…»: la lista de objetivos de la empresa a los que se puede alinear algo. Es el mismo gesto que arrastrar
// el punto de una tarjeta, escrito: arrastrar con precisión no puede ser el único camino a una decisión del ciclo.
// La comparten el botón «Alinear» de cada tarjeta y el último paso de «Crear alineación».
//
// Es un Command sin buscador: se recorre con las flechas y se elige con Enter, y el visto que trae cada opción marca
// a qué objetivo apunta ya. Elegir uno ya marcado no lo suelta: para eso está «Quitar alineación», al final.

/** Un objetivo de la empresa, como destino elegible. */
export interface OpcionEmpresa {
  id: string
  titulo: string
}

export function OpcionesEmpresa({
  opciones,
  alineadoA,
  onElegir,
  onQuitar,
}: {
  opciones: readonly OpcionEmpresa[]
  /** Ids de los objetivos de la empresa a los que ya apunta lo que se alinea. */
  alineadoA: readonly string[]
  onElegir: (companyObjectiveId: string) => void
  /** Sin él (o sin nada alineado) no aparece «Quitar alineación». */
  onQuitar?: () => void
}) {
  return (
    <Command>
      <CommandList className="max-h-72">
        <CommandGroup heading="Contribuye a…">
          {opciones.map((opcion) => (
            <CommandItem key={opcion.id} value={opcion.id} data-checked={alineadoA.includes(opcion.id)} onSelect={() => onElegir(opcion.id)}>
              <span className="min-w-0 flex-1 truncate">{opcion.titulo}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {onQuitar && alineadoA.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem value="quitar-alineacion" onSelect={onQuitar}>
                <HugeiconsIcon icon={Unlink04Icon} aria-hidden="true" />
                Quitar alineación
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </Command>
  )
}
