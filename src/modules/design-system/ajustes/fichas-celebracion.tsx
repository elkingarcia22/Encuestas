import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PartyIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { Button, IconTile, Text } from '@ubits/flux-ui'
import { LluviaConfeti } from '@/shared/components/Confeti'
import { ConNota } from './demos'
import type { Ajuste } from './main'

// Fichas de lo que celebra un cierre. La primera es la lluvia de confeti (14-oct): había dos casi iguales, la de las
// piezas compartidas y la de la vista previa de Encuestas; se compararon cayendo y Dave se quedó con la compartida.

function ConfetiLibreria() {
  return (
    <ConNota nota="La librería no trae confeti: lo más cercano es una baldosa con un icono.">
      <IconTile variant="soft" size="lg">
        <HugeiconsIcon icon={PartyIcon} aria-hidden="true" />
      </IconTile>
    </ConNota>
  )
}

function ConfetiUbits() {
  // Cada «Lanzar» monta otra vez la lluvia: cae una sola vez por montaje, como en los cierres. Cae sobre toda la
  // pantalla, no sobre esta caja.
  const [vez, setVez] = useState(0)
  return (
    <div className="flex h-40 w-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card">
      {vez ? <LluviaConfeti key={vez} /> : null}
      <Text weight="semibold">¡Terminaste!</Text>
      <Button variant="outline" size="sm" onClick={() => setVez((v) => v + 1)}>
        <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" aria-hidden="true" />
        Lanzar confeti
      </Button>
    </div>
  )
}

export const FICHAS_CELEBRACION: Ajuste[] = [
  {
    id: 'pieza-confeti',
    titulo: 'Confeti de cierre',
    estado: 'pedido',
    resumen: 'Una lluvia de papelitos sobre toda la pantalla para celebrar que se terminó algo grande, como completar un contenido.',
    piezas: [],
    hechoAMano:
      'Todo: es un lienzo con 150 papelitos que entran poco a poco desde arriba, se mecen al caer y se van desvaneciendo en 3,6 s. La librería no trae confeti y el proyecto no admite librerías de animación.',
    libreria: <ConfetiLibreria />,
    ubits: <ConfetiUbits />,
    cambia: [
      'Cae sobre toda la pantalla, por encima de todo: se monta en el body, así que da igual dentro de qué caja se ponga',
      'Los papelitos entran escalonados, no de golpe, y la lluvia se desvanece desde el principio hasta irse sola',
      'Los colores salen del tema al dispararse —primario, éxito, advertencia, error, info y foco—, así que cambian con la marca y con el modo oscuro',
      'Cae una sola vez, al aparecer',
      'Con «reducir movimiento» no aparece',
      'No atrapa clics y el lector de pantalla no lo anuncia: es decoración',
    ],
    porque:
      'Había dos lluvias casi iguales: esta, en las piezas compartidas (7-oct), y la de la vista previa de Encuestas (Elkin, 30-sep). Se compararon cayendo el 14-oct y Dave se quedó con esta: entra de a poco y se desvanece más suave.',
    donde: [
      'LluviaConfeti (src/shared/components/Confeti.tsx)',
      'Cierre del contenido en la vista del colaborador (LMS Creator)',
      'La vista previa de Encuestas todavía usa su propia lluvia (encuestas/components/vista-previa/confeti.tsx)',
    ],
    usar: 'Al terminar algo grande, una sola vez: completar un contenido, enviar una encuesta. Se pone en cualquier sitio de la pantalla que se celebra; ella sola cubre todo.',
    evitar:
      'Acciones pequeñas o que se repiten (guardar, enviar feedback): ahí basta un aviso. Para acertar algo puntual va la explosión desde un punto (Confeti, en el mismo archivo), no la lluvia. Y no se arma otra lluvia aparte.',
  },
]
