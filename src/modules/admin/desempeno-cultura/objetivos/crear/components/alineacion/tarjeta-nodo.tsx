import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link04Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, cn, IconTile, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Popover, PopoverContent, PopoverTrigger, Text } from '@ubits/flux-ui'
import type { AlignmentNode } from '../../../modelo/constructor/alignmentGraph'
import { OpcionesEmpresa, type OpcionEmpresa } from './opciones-empresa'
import { VISUAL_NODO } from './visual'

// Una tarjeta del mapa. La tarjeta en sí es un Item de la librería; lo único propio es su marco en el lienzo (la
// posición, el anillo de selección o de error) y los dos puntos de los bordes, que son parte del conector:
//
//   · a la izquierda, el punto azul de salida: de ahí se arrastra la flecha hasta un objetivo de la empresa;
//   · a la derecha, en los objetivos de la empresa, el punto de llegada, que se enciende cuando hay una flecha en el aire.
//
// El punto solo sirve con ratón o dedo. Todo lo que hace ese gesto se puede hacer también desde «Alinear», que abre la
// lista de objetivos de la empresa: arrastrar con precisión no puede ser el único camino a una decisión del ciclo.
// «Alinear» aparece con el cursor encima, con el foco dentro, con la tarjeta elegida y siempre en pantallas táctiles.

const AL_PASAR = 'hidden group-hover/tarjeta:inline-flex group-focus-within/tarjeta:inline-flex has-[[aria-expanded=true]]:inline-flex pointer-coarse:inline-flex'

export interface EstadoTarjeta {
  seleccionada: boolean
  /** Hay algo elegido y esta tarjeta no participa: se apaga. */
  apagada: boolean
  /** Hay una flecha en el aire y esta tarjeta la puede recibir. */
  candidata: boolean
  /** La flecha en el aire está justo encima. */
  bajoFlecha: boolean
  /** Por qué esta tarjeta se marca en rojo («2 sin alinear»), o null. */
  error: string | null
}

export function TarjetaNodo({
  nodo,
  estado,
  opciones,
  onSeleccionar,
  onAgarrar,
  onIniciarFlecha,
  onAlinear,
  onQuitar,
}: {
  nodo: AlignmentNode
  estado: EstadoTarjeta
  opciones: readonly OpcionEmpresa[]
  onSeleccionar: () => void
  /** Empieza a mover la tarjeta por el lienzo. */
  onAgarrar: (evento: PointerEvent) => void
  /** Empieza a arrastrar una flecha desde el punto azul. */
  onIniciarFlecha: (evento: PointerEvent) => void
  onAlinear: (companyObjectiveId: string) => void
  onQuitar: () => void
}) {
  const [menu, setMenu] = useState(false)
  const visual = VISUAL_NODO[nodo.kind]
  const esEmpresa = nodo.kind === 'company'
  const alineable = nodo.objectiveRefs.length > 0 && opciones.length > 0

  const alTeclado = (evento: KeyboardEvent) => {
    if (evento.target !== evento.currentTarget || (evento.key !== 'Enter' && evento.key !== ' ')) return
    evento.preventDefault()
    onSeleccionar()
  }

  return (
    <div
      data-node-id={nodo.id}
      className={cn(
        'group/tarjeta absolute rounded-md bg-card select-none motion-safe:transition-[opacity,transform] motion-safe:duration-200',
        estado.apagada && !estado.seleccionada && 'opacity-30',
        estado.seleccionada && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        estado.error && 'ring-2 ring-destructive ring-offset-2 ring-offset-background',
        estado.candidata && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
        estado.bajoFlecha && 'ring-primary motion-safe:scale-[1.03]',
      )}
      style={{ left: nodo.x, top: nodo.y, width: nodo.width, height: nodo.height }}
    >
      <Item
        variant="outline"
        size="xs"
        role="button"
        tabIndex={0}
        aria-pressed={estado.seleccionada}
        aria-label={`${visual.etiqueta}: ${nodo.title}`}
        onPointerDown={(evento) => {
          // El menú de «Alinear» se pinta en un portal, pero en React sigue siendo hijo de la tarjeta: sin este corte,
          // elegir una opción agarraría la tarjeta y el clic nunca llegaría a la lista.
          if (evento.target instanceof Node && evento.currentTarget.contains(evento.target)) onAgarrar(evento)
        }}
        onKeyDown={alTeclado}
        className="size-full cursor-grab items-center overflow-hidden active:cursor-grabbing"
      >
        <ItemMedia>
          <IconTile variant="soft" size="xs" className={`shrink-0 ${visual.tono}`}>
            <HugeiconsIcon icon={visual.icono} aria-hidden="true" />
          </IconTile>
        </ItemMedia>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full">
            <span className="truncate">{nodo.title}</span>
          </ItemTitle>
          <ItemDescription className="truncate">{nodo.subtitle}</ItemDescription>
          <div className="flex min-w-0 items-center gap-1.5">
            {nodo.badge !== null ? (
              <Badge variant={visual.insignia} size="xs" className="shrink-0 tabular-nums">
                {nodo.badge}
              </Badge>
            ) : null}
            {estado.error ? (
              <Badge variant="destructive-light" size="xs" className="shrink-0">
                {estado.error}
              </Badge>
            ) : nodo.note !== null ? (
              <Text as="span" size="xs" variant="muted" className="min-w-0 truncate">
                {nodo.note}
              </Text>
            ) : null}
            {alineable ? (
              <Popover open={menu} onOpenChange={setMenu}>
                <PopoverTrigger
                  render={<Button variant="outline" size="xs" className={cn('ml-auto shrink-0', estado.seleccionada || menu ? 'inline-flex' : AL_PASAR)} />}
                  onPointerDown={(evento) => evento.stopPropagation()}
                  aria-label={`Alinear ${nodo.title}`}
                >
                  <HugeiconsIcon icon={Link04Icon} aria-hidden="true" />
                  Alinear
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-72 p-0">
                  <OpcionesEmpresa
                    opciones={opciones}
                    alineadoA={nodo.alignedTo}
                    onElegir={(id) => {
                      setMenu(false)
                      onAlinear(id)
                    }}
                    onQuitar={() => {
                      setMenu(false)
                      onQuitar()
                    }}
                  />
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </ItemContent>
      </Item>

      {/* Punto de salida (parte del conector): se arrastra hasta un objetivo de la empresa. Sin teclado a propósito:
          el camino accesible es «Alinear». */}
      {alineable ? (
        <span
          aria-hidden="true"
          onPointerDown={onIniciarFlecha}
          className="absolute top-1/2 -left-[9px] z-10 size-[18px] -translate-y-1/2 cursor-crosshair rounded-full border-2 border-background bg-primary motion-safe:transition-transform hover:scale-125"
        />
      ) : null}

      {/* Punto de llegada de los objetivos de la empresa: solo señal, no se arrastra desde aquí. */}
      {esEmpresa ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 -right-[7px] size-[14px] -translate-y-1/2 rounded-full border-2 border-background motion-safe:transition-transform',
            estado.candidata || estado.bajoFlecha ? 'scale-125 bg-primary' : 'bg-primary/30',
          )}
        />
      ) : null}
    </div>
  )
}
