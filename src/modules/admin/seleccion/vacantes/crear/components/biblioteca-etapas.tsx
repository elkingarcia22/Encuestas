import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CATEGORIAS, type EtapaCatalogo } from './etapas'
import { iconoDeCategoria } from './iconos-etapas'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

type Props = {
  // Solo las etapas que todavía no están en el flujo.
  catalogo: EtapaCatalogo[]
  todasEnElFlujo: boolean
  onAgregar: (etapa: EtapaCatalogo) => void
  onCrear: () => void
  // Solo las que creó el equipo (propia): las del sistema no se tocan.
  onEditar: (etapa: EtapaCatalogo) => void
  onEliminar: (etapa: EtapaCatalogo) => void
}

const TODAS = 'todas'
// Además de las categorías, se pueden ver solo las que lleva la IA.
const CON_IA = 'con-ia'

// De dónde se sacan las etapas. Antes era una columna fija junto al flujo; ahora es un botón al final
// del flujo (el siguiente paso de la lista misma) que abre la biblioteca en un globo, con el mismo
// buscador, el filtro por categoría y las etapas propias que se editan o eliminan. Una sola lista,
// manuales y con IA juntas (las de IA llevan su insignia); las que creó el equipo van primero. Cada
// etapa lleva el icono y el color de su categoría, los mismos que luego se ven en el flujo.
export function AgregarEtapa({ catalogo, todasEnElFlujo, onAgregar, onCrear, onEditar, onEliminar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(TODAS)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return catalogo.filter(
      (etapa) =>
        (categoria === TODAS || (categoria === CON_IA ? etapa.conIa : etapa.categoria === categoria)) &&
        (!texto || etapa.nombre.toLowerCase().includes(texto) || etapa.categoria.toLowerCase().includes(texto)),
    )
  }, [catalogo, busqueda, categoria])

  // Crear y editar abren un diálogo: el globo se cierra antes para no quedar uno encima del otro. Al
  // crear se limpian los filtros, así la nueva se ve al comienzo de la lista la próxima vez.
  const crear = () => {
    setAbierto(false)
    setBusqueda('')
    setCategoria(TODAS)
    onCrear()
  }
  const editar = (etapa: EtapaCatalogo) => {
    setAbierto(false)
    onEditar(etapa)
  }
  // Eliminar abre la ventana de confirmar: el globo se cierra antes, como al crear y editar.
  const eliminar = (etapa: EtapaCatalogo) => {
    setAbierto(false)
    onEliminar(etapa)
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      {/* El botón va a la derecha del pie del flujo, como «Crear un dato para esta encuesta» en Encuestas. */}
      <PopoverTrigger render={<Button variant="outline" className="shrink-0" />}>
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
        Agregar etapa
      </PopoverTrigger>
      {/* Se queda abierto al agregar: lo normal es sumar varias etapas seguidas. */}
      <PopoverContent align="end" className="w-[min(28rem,calc(100vw-2rem))]">
        <PopoverHeader>
          <PopoverTitle>Biblioteca de etapas</PopoverTitle>
          <PopoverDescription>Cada etapa va una sola vez en el flujo; si la quitas, vuelve aquí.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Buscar una etapa"
              placeholder="Buscar por nombre o categoría…"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
            {busqueda ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Borrar la búsqueda" onClick={() => setBusqueda('')}>
                  <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          <div className="flex items-center justify-between gap-3">
            <Select value={categoria} onValueChange={(valor) => setCategoria((valor as string | null) ?? TODAS)}>
              <SelectTrigger aria-label="Filtrar por categoría" size="sm" className="min-w-0 flex-1">
                <SelectValue>
                  {(valor: string) => (valor === TODAS ? 'Todas las categorías' : valor === CON_IA ? 'Con IA' : valor)}
                </SelectValue>
              </SelectTrigger>
              {/* Todas las categorías siempre, aunque sus etapas ya estén en el flujo: el filtro no cambia según lo que se agrega. */}
              <SelectContent>
                <SelectItem value={TODAS}>Todas las categorías</SelectItem>
                <SelectItem value={CON_IA}>
                  <IconoIA />
                  Con IA
                </SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Categorías</SelectLabel>
                  {CATEGORIAS.map((nombre) => (
                    <SelectItem key={nombre} value={nombre}>
                      {nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Text as="span" variant="muted" size="sm" className="shrink-0 tabular-nums">
              {visibles.length} {plural(visibles.length, 'etapa', 'etapas')}
            </Text>
          </div>

          {/* Lo que se desplaza es la lista; el buscador y el filtro quedan fijos arriba. */}
          <div className="max-h-80 overflow-y-auto">
            <ListaEtapas
              etapas={visibles}
              filtrando={busqueda.trim() !== '' || categoria !== TODAS}
              todasEnElFlujo={todasEnElFlujo}
              onAgregar={onAgregar}
              onEditar={editar}
              onEliminar={eliminar}
            />
          </div>

          <Separator />
          <Button variant="ghost" className="justify-start gap-2" onClick={crear}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} aria-hidden="true" />
            Crear una etapa nueva
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type PropsLista = {
  etapas: EtapaCatalogo[]
  filtrando: boolean
  todasEnElFlujo: boolean
  onAgregar: (etapa: EtapaCatalogo) => void
  onEditar: (etapa: EtapaCatalogo) => void
  onEliminar: (etapa: EtapaCatalogo) => void
}

function ListaEtapas({ etapas, filtrando, todasEnElFlujo, onAgregar, onEditar, onEliminar }: PropsLista) {
  if (etapas.length === 0) {
    // Vacía por la búsqueda o el filtro, o porque todas ya están en el flujo: cada caso se explica distinto.
    const porFiltro = filtrando && !todasEnElFlujo
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <ImagenGlass nombre={porFiltro ? 'glass-search' : 'glass-tick'} tamano={56} />
          </EmptyMedia>
          <EmptyTitle>{porFiltro ? 'No hay etapas disponibles con este filtro' : 'Ya están todas en el flujo'}</EmptyTitle>
          <EmptyDescription>
            {porFiltro
              ? 'Puede que ya estén en el flujo: si quitas una, vuelve aquí. También puedes crear la que te falta.'
              : 'Si quitas una etapa del flujo, vuelve a aparecer aquí.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    // El scroll lo pone el contenedor: la lista solo apila las etapas.
    <div className="flex flex-col gap-2 pr-1">
      {etapas.map((etapa) => {
        const { icono, tono } = iconoDeCategoria(etapa.categoria)
        return (
          <Item key={etapa.id} variant="outline" size="sm">
            <ItemMedia>
              <IconTile variant="soft" size="sm" className={tono}>
                <HugeiconsIcon icon={icono} aria-hidden="true" />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{etapa.nombre}</ItemTitle>
              <ItemDescription className="flex flex-wrap items-center gap-1.5">
                {etapa.categoria}
                {etapa.propia ? (
                  <Badge variant="secondary">
                    Creada por ti
                  </Badge>
                ) : null}
                {etapa.conIa ? (
                  <EtiquetaIA size="xs">IA</EtiquetaIA>
                ) : null}
              </ItemDescription>
            </ItemContent>
            <ItemActions className="gap-1">
              {etapa.propia ? (
                <>
                  <BotonIcono aria-label={`Editar ${etapa.nombre}`} onClick={() => onEditar(etapa)}>
                    <HugeiconsIcon icon={PencilEdit02Icon} size={18} />
                  </BotonIcono>
                  <BotonIcono
                    aria-label={`Eliminar ${etapa.nombre} de la biblioteca`}
                    className="text-destructive!"
                    onClick={() => onEliminar(etapa)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </BotonIcono>
                </>
              ) : null}
              <BotonIcono aria-label={`Agregar ${etapa.nombre} al flujo`} onClick={() => onAgregar(etapa)}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              </BotonIcono>
            </ItemActions>
          </Item>
        )
      })}
    </div>
  )
}
