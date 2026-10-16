import type { AlignmentEdge, AlignmentNode } from '../../../../modelo/constructor/alignmentGraph'
import { curva, llegadaA, salidaDe, type Punto, type Vista } from './geometria'

// EXCEPCIÓN AUTORIZADA (lienzo de alineación): flux-ui no tiene un lienzo de nodos con conectores, y el dueño de la
// librería autorizó dibujarlo en este repositorio. Este archivo es lo único hecho a mano del paso: las flechas curvas
// entre tarjetas, con `<svg>` porque una curva con punta no se puede armar con componentes. Reglas de la excepción:
// colores solo por tokens del tema (`var(--primary)`, `var(--border)`…), nada de texto ni botones aquí dentro (la cifra
// y el botón de cortar de cada flecha son Badge y Button, en la capa de tarjetas) y nada fuera de esta carpeta.
//
// La capa va debajo de las tarjetas y comparte su transformación, así que flecha y tarjeta nunca se separan. Encima de
// cada flecha hay una franja invisible de 18 px: acertarle con el ratón a una línea de 2 px no es una interacción, es
// puntería.

interface Props {
  vista: Vista
  aristas: readonly AlignmentEdge[]
  nodoPorId: ReadonlyMap<string, AlignmentNode>
  /** La flecha bajo el cursor: se engrosa y muestra su botón de cortar. */
  resaltada: string | null
  /** Con una tarjeta elegida, las flechas ajenas a ella se apagan. */
  relacionados: ReadonlySet<string> | null
  /** La flecha que se está arrastrando desde una tarjeta, punteada hasta el cursor. */
  enElAire: { desde: AlignmentNode; hasta: Punto } | null
  onResaltar: (id: string | null) => void
}

export function Conectores({ vista, aristas, nodoPorId, resaltada, relacionados, enElAire, onResaltar }: Props) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <marker id="alineacion-punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
        </marker>
        <marker id="alineacion-punta-gris" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
        </marker>
      </defs>
      <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.k})`}>
        {aristas.map((arista) => {
          const desde = nodoPorId.get(arista.from)
          const hasta = nodoPorId.get(arista.to)
          if (!desde || !hasta) return null
          const d = curva(salidaDe(desde), llegadaA(hasta))
          const grosor = 1.4 + Math.min(arista.strength, 8) * 0.35
          const encima = resaltada === arista.id
          const apagada = relacionados !== null && !(relacionados.has(arista.from) && relacionados.has(arista.to))
          return (
            <g key={arista.id} opacity={apagada ? 0.12 : 1}>
              {/* Una alineación (se puede cortar) va en el color de marca; una pertenencia a un grupo, gris y punteada:
                  es un hecho del directorio, no una decisión del ciclo. */}
              <path
                d={d}
                fill="none"
                stroke={arista.removable ? 'var(--primary)' : 'var(--muted-foreground)'}
                strokeOpacity={arista.removable ? (encima ? 1 : 0.55) : 0.45}
                strokeWidth={encima ? grosor + 1 : grosor}
                strokeDasharray={arista.removable ? undefined : '5 5'}
                strokeLinecap="round"
                markerEnd={`url(#${arista.removable ? 'alineacion-punta' : 'alineacion-punta-gris'})`}
              />
              {arista.removable ? (
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={18}
                  style={{ pointerEvents: 'stroke' }}
                  onPointerEnter={() => onResaltar(arista.id)}
                  onPointerLeave={() => onResaltar(null)}
                  onPointerDown={(evento) => evento.stopPropagation()}
                />
              ) : null}
            </g>
          )
        })}
        {enElAire ? (
          <path
            d={curva(salidaDe(enElAire.desde), enElAire.hasta)}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5 / vista.k}
            strokeDasharray={`${6 / vista.k} ${5 / vista.k}`}
            strokeLinecap="round"
          />
        ) : null}
      </g>
    </svg>
  )
}
