import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Link04Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import type { AlignmentNode, ObjectiveRef } from '../../../modelo/constructor/alignmentGraph'
import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { targetLabel } from '../../../modelo/constructor/objectiveSets'
import { OpcionesEmpresa, type OpcionEmpresa } from './opciones-empresa'

// «Crear alineación»: alinear sin tocar el mapa, en tres pasos — a quién (un grupo o una persona), qué objetivo suyo y
// a qué objetivo de la empresa contribuye. Es el camino de teclado al mismo resultado que arrastrar una flecha.
//
// Si hay una tarjeta elegida en el mapa, el botón se salta el asistente y ofrece alinear esa tarjeta directamente: es
// lo que el autor está mirando. Una tarjeta de la empresa no se alinea a nada, y se dice.

type Paso = 'destinatario' | 'objetivo' | 'empresa'
type Pestana = 'grupal' | 'individual'

interface Elegido {
  setId: string
  targetId: string
}

const sinTitulo = (titulo: string) => titulo.trim() || 'Objetivo sin título'

export function CrearAlineacion({
  borrador,
  opciones,
  nodoSeleccionado,
  onAlinear,
}: {
  borrador: CicloDraft
  opciones: readonly OpcionEmpresa[]
  nodoSeleccionado: AlignmentNode | undefined
  onAlinear: (refs: readonly ObjectiveRef[], companyObjectiveId: string | null) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState<Paso>('destinatario')
  const [elegido, setElegido] = useState<Elegido | null>(null)
  const [objetivoId, setObjetivoId] = useState<string | null>(null)
  const hayGrupos = borrador.objectiveSets.some((set) => set.kind === 'grupal')
  const hayPersonas = borrador.objectiveSets.some((set) => set.kind === 'individual')
  const [pestana, setPestana] = useState<Pestana>(hayGrupos ? 'grupal' : 'individual')

  // Al abrir se empieza siempre desde el principio: retomar un asistente a medias desde un botón es desorientador.
  const abrir = (siguiente: boolean) => {
    if (siguiente) {
      setPaso('destinatario')
      setElegido(null)
      setObjetivoId(null)
      setPestana(hayGrupos ? 'grupal' : 'individual')
    }
    setAbierto(siguiente)
  }

  const alinear = (refs: readonly ObjectiveRef[], companyObjectiveId: string | null) => {
    onAlinear(refs, companyObjectiveId)
    setAbierto(false)
  }

  const destinatarios = useMemo(
    () =>
      borrador.objectiveSets
        .filter((set) => set.kind === pestana)
        .flatMap((set) => set.targetIds.map((targetId) => ({ setId: set.id, targetId, etiqueta: targetLabel(set, targetId) }))),
    [borrador.objectiveSets, pestana],
  )
  const set = borrador.objectiveSets.find((actual) => actual.id === elegido?.setId)
  const objetivo = set?.objectives.find((actual) => actual.id === objetivoId)

  const contenido = () => {
    if (nodoSeleccionado) {
      if (nodoSeleccionado.objectiveRefs.length === 0) {
        return (
          <Text size="sm" variant="muted" className="p-4">
            Esta tarjeta no se puede alinear. Selecciona una tarjeta de origen, grupo o persona.
          </Text>
        )
      }
      return (
        <OpcionesEmpresa
          opciones={opciones}
          alineadoA={nodoSeleccionado.alignedTo}
          onElegir={(id) => alinear(nodoSeleccionado.objectiveRefs, id)}
          onQuitar={() => alinear(nodoSeleccionado.objectiveRefs, null)}
        />
      )
    }

    if (paso === 'destinatario') {
      return (
        <div className="flex flex-col gap-2">
          <Encabezado titulo="¿A quién quieres alinear?" paso={1} />
          {hayGrupos && hayPersonas ? (
            <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)} className="px-3">
              <TabsList variant="line" className="w-full">
                <TabsTrigger value="grupal">Grupos</TabsTrigger>
                <TabsTrigger value="individual">Colaboradores</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
          <Command key={pestana}>
            <CommandInput placeholder="Buscar..." />
            <CommandList className="max-h-60">
              <CommandEmpty>No hay resultados</CommandEmpty>
              <CommandGroup>
                {destinatarios.map((destinatario) => (
                  <CommandItem
                    key={`${destinatario.setId}-${destinatario.targetId}`}
                    value={`${destinatario.etiqueta} ${destinatario.setId}`}
                    onSelect={() => {
                      setElegido({ setId: destinatario.setId, targetId: destinatario.targetId })
                      setPaso('objetivo')
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{destinatario.etiqueta}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )
    }

    if (paso === 'objetivo' && set && elegido) {
      return (
        <div className="flex flex-col gap-2">
          <Encabezado titulo="¿Qué objetivo?" detalle={targetLabel(set, elegido.targetId)} paso={2} onVolver={() => setPaso('destinatario')} />
          <Command>
            <CommandList className="max-h-64">
              <CommandEmpty>Esta asignación no tiene objetivos todavía</CommandEmpty>
              <CommandGroup>
                {set.objectives.map((actual) => (
                  <CommandItem
                    key={actual.id}
                    value={actual.id}
                    onSelect={() => {
                      setObjetivoId(actual.id)
                      setPaso('empresa')
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{sinTitulo(actual.title)}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )
    }

    if (paso === 'empresa' && set && objetivo) {
      const refs = [{ setId: set.id, objectiveId: objetivo.id }]
      return (
        <div className="flex flex-col gap-1">
          <Encabezado titulo="¿A qué contribuye?" detalle={sinTitulo(objetivo.title)} paso={3} onVolver={() => setPaso('objetivo')} />
          <OpcionesEmpresa
            opciones={opciones}
            alineadoA={objetivo.alignedTo === null ? [] : [objetivo.alignedTo]}
            onElegir={(id) => alinear(refs, id)}
            onQuitar={() => alinear(refs, null)}
          />
        </div>
      )
    }

    return null
  }

  return (
    <Popover open={abierto} onOpenChange={abrir}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={Link04Icon} aria-hidden="true" />
        Crear alineación
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80 p-0">
        {contenido()}
      </PopoverContent>
    </Popover>
  )
}

function Encabezado({ titulo, detalle, paso, onVolver }: { titulo: string; detalle?: string; paso: number; onVolver?: () => void }) {
  return (
    <div className="flex items-start gap-1 px-3 pt-3">
      {onVolver ? (
        <BotonIcono size="icon-xs" aria-label="Volver al paso anterior" onClick={onVolver}>
          <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
        </BotonIcono>
      ) : null}
      <PopoverHeader className="min-w-0 flex-1">
        <PopoverTitle>{titulo}</PopoverTitle>
        <PopoverDescription className="truncate">{detalle ? `Paso ${paso} de 3 · ${detalle}` : `Paso ${paso} de 3`}</PopoverDescription>
      </PopoverHeader>
    </div>
  )
}
