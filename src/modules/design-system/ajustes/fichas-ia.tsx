import { useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
  Text,
} from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import { AiCard } from '@/shared/components/AiCard'
import { AiThinking } from '@/shared/components/AiThinking'
import { IconoIA } from '../ia/icono-ia'
import { EtiquetaIA } from '../ia/etiqueta-ia'
import { IssueCard, ResolvedRow, type IssueState } from '../agente-contextual/revision/components/issue-card'
import { ISSUES } from '../agente-contextual/revision/components/data'
import type { Ajuste } from './main'

// Fichas de las piezas de IA (7-oct): el orbe, la marca de IA, la tarjeta de IA, «Razonando» y la tarjeta de
// incidencia del agente. Mismo formato que Ajustes propios: a la izquierda lo que trae la librería para la misma
// necesidad y a la derecha la pieza real del equipo, importada, no redibujada.

// ── Demos ──────────────────────────────────────────────────────────────────────────────────────────────────

const orbLibreria = (
  <div className="flex flex-col items-center gap-2">
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>IA</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>IA</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>IA</AvatarFallback>
      </Avatar>
    </div>
    <Text as="p" variant="muted" size="sm" className="text-center">
      La librería no trae orbe: lo más cercano es un avatar con iniciales.
    </Text>
  </div>
)

const orbUbits = (
  <div className="flex flex-col items-center gap-2">
    <div className="flex items-end gap-4">
      <Orb className="size-4" />
      <Orb className="size-6" />
      <Orb className="size-10" />
      <Orb className="size-16" />
    </div>
    <Text as="p" variant="muted" size="sm" className="text-center">
      16, 24, 40 y 64 px: la misma imagen en todos los tamaños.
    </Text>
  </div>
)

const marcaLibreria = (
  <div className="flex flex-wrap items-center justify-center gap-3">
    <Badge variant="info-light">IA</Badge>
    <Badge variant="info-light">Entrevista con IA</Badge>
    <Badge variant="outline">Serena AI 88/100</Badge>
  </div>
)

const marcaUbits = (
  <div className="flex flex-col items-center gap-3">
    <Text as="span" size="sm" weight="medium" className="flex items-center gap-2">
      <IconoIA />
      Compatibilidad de la hoja de vida
    </Text>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <EtiquetaIA size="xs">IA</EtiquetaIA>
      <EtiquetaIA>Entrevista con IA</EtiquetaIA>
      <EtiquetaIA>Serena AI 88/100</EtiquetaIA>
    </div>
  </div>
)

const tarjetaIaLibreria = (
  <Card size="sm" className="w-72">
    <CardHeader>
      <CardTitle>Crear un curso</CardTitle>
      <CardDescription>Genera contenido de aprendizaje apoyado en IA en minutos.</CardDescription>
    </CardHeader>
    <CardFooter>
      <Button size="sm">Crear ahora</Button>
    </CardFooter>
  </Card>
)

const tarjetaIaUbits = (
  <AiCard
    compact
    className="w-72"
    title="Crear un curso"
    description="Genera contenido de aprendizaje apoyado en IA en minutos."
    action="Crear ahora"
    onAction={() => undefined}
  />
)

const razonandoLibreria = (
  <div className="flex items-center gap-2.5">
    <Spinner />
    <Text as="span" variant="muted" size="sm">
      Cargando…
    </Text>
  </div>
)

const razonandoUbits = (
  <div className="flex flex-col items-start gap-4">
    <AiThinking />
    <AiThinking label="Generando el video…" progreso={42} />
  </div>
)

const incidenciaLibreria = (
  <Card size="sm" className="w-80">
    <CardHeader>
      <CardTitle>Auxilio sin monto</CardTitle>
      <CardDescription>Promete un auxilio mensual pero no dice cuánto es.</CardDescription>
    </CardHeader>
    <CardFooter className="gap-2">
      <Button size="sm" variant="outline">
        Corregir
      </Button>
      <Button size="sm" variant="ghost">
        Ignorar
      </Button>
    </CardFooter>
  </Card>
)

function IncidenciaUbits() {
  const issue = ISSUES[1]
  const [state, setState] = useState<IssueState>('open')
  return (
    <div className="w-80">
      {state === 'fixed' || state === 'ignored' ? (
        <ResolvedRow issue={issue} state={state} onRevert={() => setState('open')} />
      ) : (
        <IssueCard
          issue={issue}
          state={state}
          onView={() => undefined}
          onFix={() => setState('fixing')}
          onApply={() => setState('fixed')}
          onCancel={() => setState('open')}
          onIgnore={() => setState('ignored')}
        />
      )}
    </div>
  )
}

// ── Fichas ─────────────────────────────────────────────────────────────────────────────────────────────────

export const FICHAS_IA: Ajuste[] = [
  {
    id: 'pieza-orb',
    titulo: 'Orbe del agente',
    estado: 'variante',
    resumen: 'La esfera de color que representa a la IA en todo el producto, de 16 a 180 px.',
    piezas: [],
    hechoAMano: 'Es una imagen que entregó diseño (orb.png), recortada en círculo. No hay ningún componente de la librería detrás.',
    libreria: orbLibreria,
    ubits: orbUbits,
    cambia: [
      'Imagen con el degradado de marca en lugar de iniciales',
      'Siempre redonda, de 16 a 180 px; por defecto, 40 px',
      'Decorativa: los lectores de pantalla la saltan, el texto de al lado dice qué es',
    ],
    porque: 'Es la marca de la IA: tiene que verse igual en el botón, en el selector de espacio, en el agente y en el chat. Dibujarla con degradados en cada pantalla daba orbes distintos.',
    donde: [
      'Orb (src/shared/components/Orb.tsx)',
      'Por dentro de IconoIA, EtiquetaIA, AiCard, AiThinking y el agente contextual',
      'Chat y voz de Suite AI, barra lateral de Orbit, Crear vacante, copiloto de Selección, editor de contenidos',
    ],
    usar: 'Cuando la IA habla o es protagonista: el agente, el chat, una tarjeta o un estado de IA. Para marcar algo pequeño dentro de un texto, IconoIA.',
    evitar: 'Dibujarlo con círculos y degradados, cambiarle el color, o usarlo en algo que no sea de IA.',
  },
  {
    id: 'pieza-icono-ia',
    titulo: 'Marca de IA: icono e insignia',
    estado: 'variante',
    resumen: 'El orbe a 16 px antes del texto (IconoIA) y su versión en insignia (EtiquetaIA) para todo lo que hizo la IA.',
    piezas: [{ nombre: 'Badge', slug: 'badge' }],
    hechoAMano: 'El icono es el orbe (una imagen), no un icono de Hugeicons. La insignia es la Badge de la librería con el orbe adentro, ajustado a cada tamaño.',
    libreria: marcaLibreria,
    ubits: marcaUbits,
    cambia: [
      'El orbe en lugar de estrellas o chispas',
      'Insignia gris en pastilla: el color lo pone el orbe y no compite con las de estado',
      'El orbe se achica con la insignia para no salirse en los tamaños chicos',
    ],
    porque: 'Cada pantalla marcaba la IA a su manera (azul, gris, con contorno, con la chispa). El 23-sep se descartaron las estrellas («no uses esos iconos de estrellas») y el 25-sep diseño eligió la insignia gris: la azul de marca no se lee en modo oscuro.',
    donde: [
      'IconoIA (design-system/ia/icono-ia.tsx) y EtiquetaIA (design-system/ia/etiqueta-ia.tsx)',
      'Selección: Crear vacante, detalle de la vacante, tablero y expediente del candidato',
      'Encuestas, Objetivos, Crear contenido y las acciones rápidas del Inicio',
    ],
    usar: 'Marcar lo que produjo o hace la IA dentro de una pantalla normal: una pestaña, un título, un ítem, un puntaje. Si la tarjeta entera es de IA, el orbe va solo en su título.',
    evitar: 'SparklesIcon, AiMagicIcon, varitas o estrellas, y una Badge de color con «IA» escrita a mano.',
  },
  {
    id: 'pieza-ai-card',
    titulo: 'Tarjeta de IA',
    estado: 'variante',
    resumen: 'La tarjeta que invita a que la IA haga el trabajo desde una pantalla normal, como «Crear un curso» en el Inicio.',
    piezas: [
      { nombre: 'Button', slug: 'button' },
      { nombre: 'Badge', slug: 'badge' },
    ],
    hechoAMano: 'El halo de color en las esquinas y el degradado del botón son CSS propio (tarjeta-ia.module.css); el botón se fuerza a pastilla.',
    libreria: tarjetaIaLibreria,
    ubits: tarjetaIaUbits,
    cambia: [
      'Orbe grande arriba, que dice «esto lo hace la IA»',
      'Color difuminado en las esquinas, sin rellenar la tarjeta',
      'Botón con el degradado de marca y en pastilla',
      'Versión compacta para columnas estrechas y sin borde dentro de un marco',
    ],
    porque: 'Una Card normal con un botón azul no se distingue del resto de la pantalla; con un degradado pintado a mano cada pantalla quedaba distinta. El halo se apaga si la pantalla ya tiene otra pieza de IA, para que no haya dos focos.',
    donde: [
      'AiCard (src/shared/components/AiCard.tsx)',
      'Inicio operativo del administrador (template home-operativo)',
      'Design system › Tarjeta de IA, IA › Superficies y Color',
    ],
    usar: 'Ofrecer que la IA haga una tarea completa desde una pantalla que no es de IA. Una por vista.',
    evitar: 'Usarla para contenido que no es de IA, ponerle dos botones, o armar una Card con degradado a mano.',
  },
  {
    id: 'pieza-ai-thinking',
    titulo: 'Estado «Razonando»',
    estado: 'variante',
    resumen: 'La única forma de decir que la IA está trabajando: el orbe respira, el texto brilla y corren los segundos.',
    piezas: [],
    hechoAMano: 'La respiración del orbe y el brillo del texto son animaciones propias (ai-thinking.module.css); el contador de segundos o de porcentaje también.',
    libreria: razonandoLibreria,
    ubits: razonandoUbits,
    cambia: [
      'El orbe que respira en lugar de la rueda que gira',
      'Texto con brillo de izquierda a derecha («Razonando…» o lo que esté haciendo)',
      'Al lado, los segundos que lleva o el porcentaje si el avance se conoce',
      'Dos tamaños: el del chat y el de paneles laterales',
    ],
    porque: 'Esperar a la IA no es lo mismo que esperar una carga: la persona necesita saber que la IA está trabajando y cuánto lleva. Antes cada pantalla usaba su propio indicador.',
    donde: [
      'AiThinking (src/shared/components/AiThinking.tsx)',
      'Chat de Suite AI y el agente contextual (Orbit Flow)',
      'Editor de contenidos de Aprendizaje (video, imagen, roleplay, evaluación), Encuestas, Objetivos y Crear vacante',
    ],
    usar: 'Solo mientras la IA de verdad prepara una respuesta o genera algo.',
    evitar: 'Cargas normales (ahí va el esqueleto de lo que va a aparecer) y la espera de un botón (va en el propio botón).',
  },
  {
    id: 'pieza-issue-card',
    titulo: 'Tarjeta de incidencia del agente',
    estado: 'variante',
    resumen: 'Cada hallazgo que encuentra el agente al revisar un documento, con su número, el porqué y las acciones para corregirlo.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    hechoAMano: 'El marco de la tarjeta (esquinas de 16 px), el número con anillo y los botones en pastilla son clases propias del agente (agent-styles); al corregir, muestra la tarjeta de propuesta del agente (ProposalCard).',
    libreria: incidenciaLibreria,
    ubits: <IncidenciaUbits />,
    cambia: [
      'Número del hallazgo en círculo: con anillo amarillo si es importante, gris si es sugerencia',
      'Botones pequeños en pastilla: Ver, Corregir e Ignorar',
      'Al corregir, muestra el antes y el después y pide aplicar o cancelar',
      'Resuelta, queda como una fila corta con «Deshacer» o «Reabrir»',
    ],
    porque: 'La revisión del agente es una conversación: las tarjetas tienen que verse como el resto del panel del agente y no como tarjetas de una pantalla. Pruébala: corrígela, aplícala y deshazla.',
    donde: [
      'IssueCard y ResolvedRow (design-system/agente-contextual/revision/components/issue-card.tsx)',
      'Agente contextual › Revisar un documento (/design-system/agente-contextual/revision)',
    ],
    usar: 'Los hallazgos de una revisión del agente dentro de su panel.',
    evitar: 'Avisos o errores de un formulario (ahí va Alert) y armar una Card a mano para un hallazgo.',
  },
]
