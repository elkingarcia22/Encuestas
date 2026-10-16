import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileImportIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { tituloEtapa, type Candidatura, type VacanteUI } from '../datos'
import type { Persona } from '../personas'
import { candidaturaDesdeLaBase, coincideTexto, usePersonasDeLaBase } from '../base'

// Sumar gente al tablero desde la base global («Mis candidatos»): la mitad del caso «una persona es un solo registro».
// Se busca a quien ya está en la base, se eligen varias y entran a la etapa que se diga, sin correo. Quien ya está en
// la vacante (activa o rechazada) sale marcado y no se puede elegir otra vez; quien está en otro proceso se puede
// sumar, y conserva su ficha. Si la persona no está en la base, el camino es importar su hoja de vida.

const MOSTRAR = 40

// El proceso vivo de la persona en otra vacante, si tiene.
const otroProceso = (persona: Persona, vacanteId: string) => persona.procesos.find((p) => p.estado === 'En proceso' && p.vacanteId !== vacanteId)
const textoOtroProceso = (proceso: { etapa: string; vacante: string }) => `En ${proceso.etapa} · ${proceso.vacante}`

export function AgregarCandidatos({
  abierto,
  onOpenChange,
  vacante,
  etapaInicial,
  yaEstan,
  rechazadas,
  onAgregar,
  onImportar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  vacante: VacanteUI
  etapaInicial: string
  // Las personas que ya están en esta vacante, activas o rechazadas.
  yaEstan: Set<string>
  // Las rechazadas en esta vacante, con cómo volver a considerarlas (VA-48): no son «ya está», salieron.
  rechazadas?: Map<string, () => void>
  onAgregar: (nuevas: Candidatura[]) => void
  onImportar: () => void
}) {
  const [etapa, setEtapa] = useState(etapaInicial)
  const [busqueda, setBusqueda] = useState('')
  const [elegidas, setElegidas] = useState<string[]>([])

  // Cada vez que se abre, se parte de cero y en la etapa desde donde se pidió (se ajusta en el render, no en un efecto).
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto) {
      setEtapa(etapaInicial)
      setBusqueda('')
      setElegidas([])
    }
  }

  // La base viva (con lo importado, unido o eliminado en la visita). Primero quien se parece a la vacante (comparte
  // etiqueta con ella, o con su área o su ciudad), después el resto. Se busca también por lo que sabe hacer.
  const personas = usePersonasDeLaBase()
  const resultados = useMemo(() => {
    const suyas = [...vacante.etiquetas, vacante.area, vacante.sede.split(' · ')[0].split(' ')[0]]
    const afines = (persona: Persona) => persona.etiquetas.filter((etiqueta) => suyas.includes(etiqueta)).length
    return personas.filter((persona) => coincideTexto(persona, busqueda)).sort((a, b) => afines(b) - afines(a))
  }, [personas, busqueda, vacante.etiquetas, vacante.area, vacante.sede])

  const alternar = (id: string) =>
    setElegidas((antes) => (antes.includes(id) ? antes.filter((otra) => otra !== id) : [...antes, id]))

  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title={`Agregar candidatos a ${vacante.titulo}`}
      sub="Búscalos en tu base. Entran a la etapa que elijas y nadie recibe correo; la IA los compara con la vacante en unos minutos."
      note={
        resultados.length > MOSTRAR
          ? `Se ven ${MOSTRAR} de ${resultados.length}: afina la búsqueda para encontrar a alguien.`
          : `${resultados.length} ${resultados.length === 1 ? 'persona' : 'personas'} en tu base con esa búsqueda.`
      }
      confirmLabel={elegidas.length ? `Agregar ${elegidas.length === 1 ? 'a 1 persona' : `a ${elegidas.length} personas`}` : 'Agregar'}
      confirmDisabled={!elegidas.length}
      pendingLabel="Agregando…"
      onConfirm={() =>
        onAgregar(personas.filter((persona) => elegidas.includes(persona.id)).map((persona) => candidaturaDesdeLaBase(persona, vacante, etapa)))
      }
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
        <Field>
          <FieldLabel>Buscar en Mis candidatos</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre, cargo, ciudad o lo que sabe hacer"
              autoFocus
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel>Entran a</FieldLabel>
          <Select value={etapa} onValueChange={(valor) => setEtapa(valor as string)}>
            <SelectTrigger aria-label="Etapa a la que entran">
              <SelectValue>{(valor: string) => tituloEtapa(valor)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Etapas de esta vacante</SelectLabel>
                {vacante.etapas.map((una, indice) => (
                  <SelectItem key={una.id} value={una.id}>
                    {indice + 1}. {una.titulo}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {resultados.length ? (
        <ItemGroup className="gap-1!">
          {resultados.slice(0, MOSTRAR).map((persona) => {
            const aqui = yaEstan.has(persona.id)
            const elegida = elegidas.includes(persona.id)
            return (
              <Item
                key={persona.id}
                role="listitem"
                size="sm"
                variant={elegida ? 'outline' : 'default'}
                render={<label />}
                className={aqui ? 'cursor-default' : 'cursor-pointer'}
              >
                {/* Centrada con el avatar: una caja de su mismo alto (24px). */}
                <ItemMedia className="h-6">
                  <Checkbox
                    checked={elegida}
                    disabled={aqui}
                    onCheckedChange={() => alternar(persona.id)}
                    aria-label={`Elegir a ${persona.nombre}`}
                  />
                </ItemMedia>
                <ItemContent className="min-w-0!">
                  <ItemTitle className="w-full!">
                    <span className="truncate">{persona.nombre}</span>
                  </ItemTitle>
                  <ItemDescription className="truncate">
                    {persona.cargo} · {persona.empresa} · {persona.ciudad}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="gap-1.5">
                  {persona.etiquetas.includes('Ex empleado') ? (
                    <Badge variant="outline">
                      Ex empleado
                    </Badge>
                  ) : null}
                  {rechazadas?.has(persona.id) ? (
                    <>
                      <Badge variant="secondary">
                        Rechazada aquí
                      </Badge>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(evento) => {
                          evento.preventDefault()
                          onOpenChange(false)
                          rechazadas?.get(persona.id)?.()
                        }}
                      >
                        Volver a considerar
                      </Button>
                    </>
                  ) : aqui ? (
                    <Badge variant="secondary">
                      Ya está en esta vacante
                    </Badge>
                  ) : otroProceso(persona, vacante.id) ? (
                    // Dónde va: «En Oferta · Analista de datos» dice si conviene sumarla o hablar antes con su reclutador.
                    <Badge variant="outline" className="max-w-60 truncate" title={textoOtroProceso(otroProceso(persona, vacante.id)!)}>
                      {textoOtroProceso(otroProceso(persona, vacante.id)!)}
                    </Badge>
                  ) : null}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      ) : (
        <Text as="p" variant="muted" size="sm" className="py-6 text-center">
          Nadie en tu base con «{busqueda}».
        </Text>
      )}

      <Text as="p" variant="muted" size="sm" className="flex flex-wrap items-center gap-x-1.5">
        ¿No está en tu base?
        <Button
          variant="link"
          size="sm"
          className="h-auto! p-0!"
          onClick={() => {
            onOpenChange(false)
            onImportar()
          }}
        >
          <HugeiconsIcon icon={FileImportIcon} size={16} />
          Importa su CV
        </Button>
      </Text>
    </VentanaDeAccion>
  )
}
