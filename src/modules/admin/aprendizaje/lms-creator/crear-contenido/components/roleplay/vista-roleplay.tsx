import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import type { ReactNode } from 'react'
import { Avatar, AvatarImage, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import orbeVoz from '@/shared/assets/orbe-voz.webp'
import type { RoleplayConfig } from '../borrador'
import { nombreModo, objetivosConTexto } from './modelo'

// Ficha del evaluador roleplay montada en Recursos: la cara del personaje (o el orbe del agente), la llamada, el
// escenario, los objetivos y el resumen de una línea. Los botones («Editar roleplay») los pone el bloque de recursos.
//
// Aquí **no se recorta nada**: el título, el escenario y los objetivos son lo que el creador escribió y se leen
// enteros. Cuando no caben, el que se desplaza es su contenedor —en el asistente, la columna de la vista previa—.

/**
 * La cara del personaje: la imagen que subió el creador o, si no hay, **el orbe de voz** (RN-07).
 *
 * Es el mismo que lleva la tarjeta del Evaluador roleplay en «Agregar página», y no el orbe del agente: el de la
 * chispa dice «esto lo hace la IA», que vale para cualquier recurso, mientras que el de la onda dice **que aquí se
 * habla**, que es de lo que va este. Así el recurso se reconoce igual desde que se elige hasta que se contesta
 * (Dave, 13-oct).
 */
export function CaraPersonaje({ imagen, className = 'size-12' }: { imagen: string; className?: string }) {
  return (
    <Avatar size="lg" aria-hidden="true" className={`${className} shrink-0 select-none`}>
      <AvatarImage src={imagen || orbeVoz} alt="" draggable={false} />
    </Avatar>
  )
}

/**
 * `resumen`: la versión corta, para la columna de la derecha del paso a paso. Sin el escenario —que ahí está entero en
 * el campo de al lado, así que repetirlo estiraba la columna hasta dejar lo demás fuera de pantalla— y con los
 * objetivos **contados**, no listados uno a uno (Dave, 7-oct). La ficha de la página sí los enseña enteros: ahí es lo
 * único que hay del roleplay.
 */
export function VistaRoleplay({ config, pie, resumen = false }: { config: RoleplayConfig; pie?: ReactNode; resumen?: boolean }) {
  const titulo = config.titulo.trim() || 'Reunión sin título'
  const personaje = [config.nombrePersonaje.trim(), config.identidadPersonaje.trim()].filter(Boolean).join(' · ') || 'Personaje sin definir'
  const objetivos = objetivosConTexto(config)
  const evaluacion = config.modo === 'evaluacion'


  return (
    // Estructura de los paneles de Vacantes: marco gris con el título arriba y cada bloque de datos en su tarjeta
    // blanca. Menos relleno que una Card suelta, y el título con el peso y el color del marco.
    <Frame>
      <FrameHeader>
        <div className="flex min-w-0 items-start gap-3">
          <CaraPersonaje imagen={config.imagen} className="size-10" />
          <div className="flex min-w-0 flex-col gap-1">
            <FrameTitle className="min-w-0">{titulo}</FrameTitle>
            <FrameDescription>{personaje}</FrameDescription>
          </div>
        </div>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-3">
        {config.escenario.trim() && !resumen ? (
          <Text as="p" size="sm" variant="muted" className="whitespace-pre-line">
            {config.escenario.trim()}
          </Text>
        ) : null}
        <dl className="flex flex-col gap-2.5">
          <Fila termino="Modo">
            <Badge variant={evaluacion ? 'warning-light' : 'info-light'} size="sm">
              {nombreModo(config.modo)}
            </Badge>
          </Fila>
          <Fila termino="Duración">{config.duracionMin} min</Fila>
          <Fila termino="Intentos">{config.intentos}</Fila>
          {resumen ? <Fila termino="Objetivos">{objetivos.length}</Fila> : null}
          {evaluacion && objetivos.length ? (
            <Fila termino="Aprueba con">
              {config.objetivosParaAprobar} de {objetivos.length}
            </Fila>
          ) : null}
        </dl>
      </FramePanel>

      {objetivos.length && !resumen ? (
        <FramePanel className="flex flex-col gap-2">
          <Text as="div" variant="muted" size="xs" weight="medium">
            Objetivos de aprendizaje
          </Text>
          <ul className="flex flex-col gap-1.5" aria-label="Objetivos de aprendizaje">
            {objetivos.map((o) => (
              <li key={o.id} className="flex items-start gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
                <Text as="span" size="sm">
                  {o.texto.trim()}
                </Text>
              </li>
            ))}
          </ul>
        </FramePanel>
      ) : null}

      {/* Lo que falta cierra el marco, como en el resumen de Crear contenido. */}
      {pie ? <FramePanel className="flex flex-col gap-2">{pie}</FramePanel> : null}
    </Frame>
  )
}

/** Fila de dato del panel: el nombre a la izquierda y el valor a la derecha, como en los paneles de Vacantes. */
function Fila({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Text as="span" variant="muted" size="sm" className="shrink-0">
        {termino}
      </Text>
      <Text as="span" size="sm" className="min-w-0 text-right">
        {children}
      </Text>
    </div>
  )
}
