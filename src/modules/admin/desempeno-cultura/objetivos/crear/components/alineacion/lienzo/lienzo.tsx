import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CenterFocusIcon, MinusSignIcon, PlusSignIcon, RotateLeft01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, ButtonGroup, ButtonGroupText } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { companyIdOfNode, type AlignmentGraph, type AlignmentNode, type ObjectiveRef } from '../../../../modelo/constructor/alignmentGraph'
import type { OpcionEmpresa } from '../opciones-empresa'
import { TarjetaNodo } from '../tarjeta-nodo'
import { Conectores } from './conectores'
import { empresaEn, encuadrar, llegadaA, puntoMedio, REJILLA, salidaDe, VISTA_INICIAL, zoomEn, type Posiciones, type Punto, type Vista } from './geometria'

// El lienzo del mapa (parte de la EXCEPCIÓN AUTORIZADA, ver conectores.tsx): un plano con las tarjetas encima y las
// flechas debajo. Se mueve arrastrando el fondo, se acerca con la rueda o con los controles, y se alinea arrastrando el
// punto azul de una tarjeta hasta un objetivo de la empresa. Las dos capas comparten la misma transformación, así que
// nunca se separan. Lo propio es solo el plano (su marco, la retícula y los gestos); las tarjetas, la cifra y el botón
// de cortar de cada flecha y el control de zoom son de la librería.
//
// Mover una tarjeta no es un cambio del ciclo, es una preferencia de lectura: se avisa al soltar (`onPosiciones`) y no
// toca el borrador.

type Gesto =
  | { tipo: 'mover'; inicioX: number; inicioY: number; origenX: number; origenY: number }
  | { tipo: 'tarjeta'; id: string; agarreX: number; agarreY: number; movida: boolean }
  | { tipo: 'flecha'; desde: string }

/** Margen para pasar del trazo de la flecha a su botón de cortar sin que el botón desaparezca por el camino. */
const ESPERA_SALIDA_FLECHA = 160

interface Props {
  grafo: AlignmentGraph
  opciones: readonly OpcionEmpresa[]
  /** Lo que el autor movió a mano en visitas anteriores al paso. */
  posicionesIniciales: Posiciones
  onPosiciones: (posiciones: Posiciones) => void
  seleccionada: string | null
  onSeleccionar: (id: string | null) => void
  /** Alinea (o suelta, con `null`) los objetivos que lleva una tarjeta o una flecha. */
  onAlinear: (refs: readonly ObjectiveRef[], companyObjectiveId: string | null) => void
  /** Por qué una tarjeta va en rojo, o null. */
  errorDe: (nodo: AlignmentNode) => string | null
  /** Cambia cuando el mapa pasa a ser otro: reencuadra. */
  claveEncuadre: string
}

export function Lienzo({ grafo, opciones, posicionesIniciales, onPosiciones, seleccionada, onSeleccionar, onAlinear, errorDe, claveEncuadre }: Props) {
  const marco = useRef<HTMLDivElement | null>(null)
  const gesto = useRef<Gesto | null>(null)
  const salida = useRef<number | undefined>(undefined)
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL)
  const [posiciones, setPosiciones] = useState<Posiciones>(posicionesIniciales)
  const [resaltada, setResaltada] = useState<string | null>(null)
  const [flecha, setFlecha] = useState<{ desde: string; hasta: Punto } | null>(null)
  const [destino, setDestino] = useState<string | null>(null)

  // Cada tarjeta en la posición por defecto del grafo, salvo que el autor la haya movido.
  const nodos = useMemo(() => grafo.nodes.map((nodo) => (posiciones[nodo.id] ? { ...nodo, ...posiciones[nodo.id] } : nodo)), [grafo.nodes, posiciones])
  const nodoPorId = useMemo(() => new Map(nodos.map((nodo) => [nodo.id, nodo])), [nodos])

  const alPlano = useCallback(
    (clienteX: number, clienteY: number): Punto => {
      const caja = marco.current?.getBoundingClientRect()
      if (!caja) return { x: 0, y: 0 }
      return { x: (clienteX - caja.left - vista.x) / vista.k, y: (clienteY - caja.top - vista.y) / vista.k }
    },
    [vista],
  )

  const ajustar = useCallback(() => {
    const caja = marco.current?.getBoundingClientRect()
    const siguiente = caja ? encuadrar(nodos, caja.width, caja.height) : null
    if (siguiente) setVista(siguiente)
  }, [nodos])

  // Un nivel nuevo es un mapa nuevo: se encuadra solo. `ajustar` queda fuera de las dependencias a propósito: cambia
  // con cada arrastre de tarjeta, y reencuadrar a mitad de un arrastre movería el suelo bajo los pies del autor.
  const ajustarActual = useRef(ajustar)
  useEffect(() => {
    ajustarActual.current = ajustar
  })
  useEffect(() => {
    const cuadro = requestAnimationFrame(() => ajustarActual.current())
    return () => cancelAnimationFrame(cuadro)
  }, [claveEncuadre])

  const zoomCentro = (factor: number) => {
    const caja = marco.current?.getBoundingClientRect()
    if (caja) setVista((actual) => zoomEn(actual, factor, caja.width / 2, caja.height / 2))
  }

  // La rueda se tiene que poder cancelar para que la página no se lleve el scroll, y React solo registra escuchas
  // pasivas: va a mano.
  useEffect(() => {
    const elemento = marco.current
    if (!elemento) return
    const alGirar = (evento: WheelEvent) => {
      evento.preventDefault()
      const caja = elemento.getBoundingClientRect()
      const factor = Math.exp(-evento.deltaY * 0.0016)
      setVista((actual) => zoomEn(actual, factor, evento.clientX - caja.left, evento.clientY - caja.top))
    }
    elemento.addEventListener('wheel', alGirar, { passive: false })
    return () => elemento.removeEventListener('wheel', alGirar)
  }, [])

  useEffect(() => () => window.clearTimeout(salida.current), [])

  const resaltar = (id: string | null) => {
    window.clearTimeout(salida.current)
    if (id !== null) setResaltada(id)
    else salida.current = window.setTimeout(() => setResaltada(null), ESPERA_SALIDA_FLECHA)
  }

  const empezar = (evento: PointerEvent, siguiente: Gesto) => {
    gesto.current = siguiente
    marco.current?.setPointerCapture(evento.pointerId)
  }

  const alPresionarFondo = (evento: PointerEvent) => {
    if (evento.button !== 0 && evento.button !== 1) return
    // Un Popover de una tarjeta se pinta en un portal, fuera de este div, pero sigue siendo su hijo en el árbol de
    // React y su `pointerdown` llega hasta aquí. Sin este corte el lienzo captura el puntero y el menú deja de responder.
    const elemento = marco.current
    if (elemento && evento.target instanceof Node && !elemento.contains(evento.target)) return
    empezar(evento, { tipo: 'mover', inicioX: evento.clientX, inicioY: evento.clientY, origenX: vista.x, origenY: vista.y })
    onSeleccionar(null)
  }

  const alMover = (evento: PointerEvent) => {
    const activo = gesto.current
    if (!activo) return
    if (activo.tipo === 'mover') {
      setVista((actual) => ({ ...actual, x: activo.origenX + (evento.clientX - activo.inicioX), y: activo.origenY + (evento.clientY - activo.inicioY) }))
      return
    }
    const punto = alPlano(evento.clientX, evento.clientY)
    if (activo.tipo === 'tarjeta') {
      activo.movida = true
      const x = Math.round((punto.x - activo.agarreX) / REJILLA) * REJILLA
      const y = Math.round((punto.y - activo.agarreY) / REJILLA) * REJILLA
      setPosiciones((actual) => ({ ...actual, [activo.id]: { x, y } }))
      return
    }
    setFlecha({ desde: activo.desde, hasta: punto })
    setDestino(empresaEn(nodos, punto))
  }

  const alSoltar = (evento: PointerEvent) => {
    const activo = gesto.current
    gesto.current = null
    if (marco.current?.hasPointerCapture(evento.pointerId)) marco.current.releasePointerCapture(evento.pointerId)
    if (!activo || activo.tipo === 'mover') return
    if (activo.tipo === 'tarjeta') {
      if (activo.movida) onPosiciones(posiciones)
      else onSeleccionar(seleccionada === activo.id ? null : activo.id)
      return
    }
    const nodoDestino = empresaEn(nodos, alPlano(evento.clientX, evento.clientY))
    const companyId = nodoDestino === null ? null : companyIdOfNode(nodoDestino)
    const origen = nodoPorId.get(activo.desde)
    if (companyId !== null && origen) onAlinear(origen.objectiveRefs, companyId)
    setFlecha(null)
    setDestino(null)
    // Al soltar se devuelve el mapa entero: dejar la tarjeta resaltada apaga todo lo demás justo cuando el autor va a
    // por la siguiente.
    onSeleccionar(null)
  }

  /** Con algo elegido, el mapa se queda en su vecindario. */
  const relacionados = useMemo(() => {
    if (seleccionada === null) return null
    const cerca = new Set([seleccionada])
    grafo.edges.forEach((arista) => {
      if (arista.from === seleccionada) cerca.add(arista.to)
      if (arista.to === seleccionada) cerca.add(arista.from)
    })
    return cerca
  }, [seleccionada, grafo.edges])

  const origenFlecha = flecha ? nodoPorId.get(flecha.desde) : undefined
  const transformacion = `translate(${vista.x}px, ${vista.y}px) scale(${vista.k})`

  return (
    <div
      ref={marco}
      onPointerDown={alPresionarFondo}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      className="relative size-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted/40 active:cursor-grabbing"
    >
      {/* Retícula: se mueve con el plano, así el desplazamiento se ve. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: `${24 * vista.k}px ${24 * vista.k}px`,
          backgroundPosition: `${vista.x}px ${vista.y}px`,
        }}
      />

      <Conectores
        vista={vista}
        aristas={grafo.edges}
        nodoPorId={nodoPorId}
        resaltada={resaltada}
        relacionados={relacionados}
        enElAire={flecha && origenFlecha ? { desde: origenFlecha, hasta: flecha.hasta } : null}
        onResaltar={resaltar}
      />

      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: transformacion }}>
        {nodos.map((nodo) => (
          <TarjetaNodo
            key={nodo.id}
            nodo={nodo}
            opciones={opciones}
            estado={{
              seleccionada: seleccionada === nodo.id,
              apagada: relacionados !== null && !relacionados.has(nodo.id),
              candidata: flecha !== null && nodo.kind === 'company',
              bajoFlecha: destino === nodo.id,
              error: errorDe(nodo),
            }}
            onSeleccionar={() => onSeleccionar(seleccionada === nodo.id ? null : nodo.id)}
            onAgarrar={(evento) => {
              if (evento.button !== 0) return
              evento.stopPropagation()
              const punto = alPlano(evento.clientX, evento.clientY)
              empezar(evento, { tipo: 'tarjeta', id: nodo.id, agarreX: punto.x - nodo.x, agarreY: punto.y - nodo.y, movida: false })
            }}
            onIniciarFlecha={(evento) => {
              if (evento.button !== 0) return
              evento.stopPropagation()
              empezar(evento, { tipo: 'flecha', desde: nodo.id })
              setFlecha({ desde: nodo.id, hasta: alPlano(evento.clientX, evento.clientY) })
              onSeleccionar(nodo.id)
            }}
            onAlinear={(id) => onAlinear(nodo.objectiveRefs, id)}
            onQuitar={() => onAlinear(nodo.objectiveRefs, null)}
          />
        ))}

        {/* Sobre cada flecha: cuántos objetivos la sostienen (si son varios) y, con el cursor encima, el botón de cortarla. */}
        {grafo.edges.map((arista) => {
          const desde = nodoPorId.get(arista.from)
          const hasta = nodoPorId.get(arista.to)
          if (!desde || !hasta) return null
          const medio = puntoMedio(salidaDe(desde), llegadaA(hasta))
          const cortar = resaltada === arista.id && arista.removable
          if (arista.strength <= 1 && !cortar) return null
          return (
            <div key={arista.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: medio.x, top: medio.y }}>
              {cortar ? (
                <Hint label="Cortar alineación" side="top">
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    aria-label="Cortar alineación"
                    onPointerEnter={() => resaltar(arista.id)}
                    onPointerLeave={() => resaltar(null)}
                    onPointerDown={(evento) => evento.stopPropagation()}
                    onClick={() => {
                      setResaltada(null)
                      onAlinear(arista.refs, null)
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                  </Button>
                </Hint>
              ) : null}
              {arista.strength > 1 ? (
                <Badge variant="secondary" size="xs" className="pointer-events-none tabular-nums">
                  {arista.strength}
                </Badge>
              ) : null}
            </div>
          )
        })}
      </div>

      <ButtonGroup aria-label="Zoom del mapa" className="absolute bottom-3 left-3" onPointerDown={(evento) => evento.stopPropagation()}>
        <ControlZoom etiqueta="Alejar" icono={MinusSignIcon} onClick={() => zoomCentro(1 / 1.25)} />
        <ButtonGroupText className="min-w-14 justify-center tabular-nums">{Math.round(vista.k * 100)} %</ButtonGroupText>
        <ControlZoom etiqueta="Acercar" icono={PlusSignIcon} onClick={() => zoomCentro(1.25)} />
        <ControlZoom etiqueta="Ajustar a la pantalla" icono={CenterFocusIcon} onClick={ajustar} />
        <ControlZoom
          etiqueta="Reorganizar tarjetas"
          icono={RotateLeft01Icon}
          onClick={() => {
            setPosiciones({})
            onPosiciones({})
            requestAnimationFrame(() => ajustarActual.current())
          }}
        />
      </ButtonGroup>
    </div>
  )
}

function ControlZoom({ etiqueta, icono, onClick }: { etiqueta: string; icono: typeof MinusSignIcon; onClick: () => void }) {
  return (
    <Hint label={etiqueta} side="top">
      <Button variant="outline" size="icon-sm" aria-label={etiqueta} onClick={onClick}>
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </Button>
    </Hint>
  )
}
