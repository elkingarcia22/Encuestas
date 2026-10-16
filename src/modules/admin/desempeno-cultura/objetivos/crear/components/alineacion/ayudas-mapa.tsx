import { HugeiconsIcon } from '@hugeicons/react'
import { Link04Icon, MouseScroll01Icon, Scissor01Icon } from '@hugeicons/core-free-icons'
import { Badge, Text } from '@ubits/flux-ui'
import type { AlignmentLevel } from '../../../modelo/constructor/alignmentGraph'
import { LEYENDA, VISUAL_NODO } from './visual'

// El pie del mapa: la leyenda del nivel (con los mismos iconos e insignias de las tarjetas) y las tres ayudas de los
// gestos. Va debajo del lienzo y no flotando encima, para no tapar tarjetas en la columna de trabajo, que es angosta.

const AYUDAS = [
  { icono: Link04Icon, texto: 'Arrastra el punto azul hasta un objetivo de la empresa' },
  { icono: MouseScroll01Icon, texto: 'Rueda para acercar · arrastra el fondo para moverte' },
  { icono: Scissor01Icon, texto: 'Pasa sobre una flecha para cortarla' },
] as const

export function AyudasMapa({ nivel }: { nivel: AlignmentLevel }) {
  return (
    <div className="flex flex-col gap-2">
      <ul aria-label="Leyenda del mapa" className="flex flex-wrap items-center gap-1.5">
        {LEYENDA[nivel].map((tipo) => (
          <li key={tipo}>
            <Badge variant={VISUAL_NODO[tipo].insignia}>
              <HugeiconsIcon icon={VISUAL_NODO[tipo].icono} aria-hidden="true" />
              {VISUAL_NODO[tipo].etiqueta}
            </Badge>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {AYUDAS.map((ayuda) => (
          <li key={ayuda.texto} className="flex items-center gap-1.5 text-muted-foreground">
            <HugeiconsIcon icon={ayuda.icono} size={14} aria-hidden="true" />
            <Text as="span" size="xs" variant="muted">
              {ayuda.texto}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  )
}
