import { AiThinking } from '@/shared/components/AiThinking'

/**
 * Lo que el asistente muestra en el área del recurso mientras `recurso.generando`: el cargador de IA del playground
 * (AiThinking, el orbe con el texto), a todo el ancho y en 16:9 como el video que va a ocupar su lugar. Antes era un
 * loop grabado con estrellitas traído del otro playground; el design system ya no usa estrellas para la IA (28 sep).
 */
/** `progreso`: el avance de la generación (0–100), el mismo que muestra el panel «Generando recursos». */
export function CargandoVideo({ progreso }: { progreso?: number }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted" aria-busy="true">
      <AiThinking label="Generando video" size="md" progreso={progreso} />
    </div>
  )
}
