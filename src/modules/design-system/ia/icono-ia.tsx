import { cn } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'

// El icono de IA: marca todo lo que produce o hace la IA dentro de una pantalla normal (una evaluación, un
// puntaje, una lectura, una etapa, una nota del agente). Va antes del texto, en pestañas, títulos, insignias e
// ítems, siempre como <IconoIA />.
//
// Es el orbe, la marca de la IA en todo el producto (botones de IA, selector de espacio, agente). Se probó la
// chispa de Hugeicons (SparklesIcon) y se descartó el 23 sep: «no uses esos iconos de estrellas». Tampoco se usan
// AiMagicIcon ni MagicWand01Icon para esto. Si diseño cambia la marca, se cambia aquí y cambia en todas partes.
export function IconoIA({ className }: { className?: string }) {
  return <Orb className={cn('size-4', className)} />
}
