import type { ReactNode } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger, Frame, FrameDescription, FrameHeader, FrameTitle } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'

// «Por grupos» y «Por persona»: acordeones normales, sin interruptor. Abrirlos o cerrarlos solo muestra u oculta la lista; lo
// elegido se queda como está.
export function ContenedorDesplegable({ id, titulo, detalle, conteo, children }: { id: string; titulo: string; detalle: string; conteo?: string; children: ReactNode }) {
  return (
    // Los «!» son los mismos de los acordeones del banco de preguntas (Encuestas): el tema pone borde al ítem y relleno al
    // encabezado y al contenido, y dentro de un Frame eso duplica el marco y el aire. Sin capa, las clases no le ganan.
    <Frame>
      <AccordionItem value={id} className="border-0!">
        <FrameHeader className="py-0!">
          <AccordionTrigger>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pe-2 text-left">
              <div className="flex min-w-0 flex-col gap-1">
                <FrameTitle>{titulo}</FrameTitle>
                <FrameDescription>{detalle}</FrameDescription>
              </div>
              {conteo ? (
                <Badge variant="outline" size="sm" className="shrink-0 tabular-nums">
                  {conteo}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
        </FrameHeader>
        {/* «!»: el relleno de abajo lo pone el contenido (pb-(--frame-py)), no el del tema. */}
        <AccordionContent className="pb-0!">
          {/* La lista va casi de borde a borde, con el mismo margen corto que el marco deja a sus paneles (como «Así va la
              vacante»); lo que se lee como texto, por ejemplo «Sincronizar», se alinea con el título por su cuenta. */}
          <div className="flex flex-col gap-2 pb-(--frame-py)">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Frame>
  )
}
