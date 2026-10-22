import { HugeiconsIcon } from '@hugeicons/react'
import { IconTile, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { CATEGORIAS, INSIGNIA_VISIBILIDAD, TIPOS_PAGINA, type Contenido, type Portada, type TipoPagina, type TonoPortada, type Visibilidad } from './datos'
import { useCreditos } from './store'
import { plural } from '@/modules/design-system/patrones/formato'

// Las piezas pequeñas que repiten las tres exploraciones: la portada, la insignia de visibilidad, el icono de cada tipo
// de página y el saldo de créditos de IA.

// La ilustración de vidrio es la compartida (src/shared/components/ImagenGlass): aquí había una copia y se retiró
// (decisión 21 de la auditoría, 5-oct).

/* Portada ------------------------------------------------------------------------------------------------------- */

// Cada tono es un degradado suave con tokens del tema (nada de colores sueltos). Funciona en claro y en oscuro porque
// todo va con opacidad sobre la tarjeta.
export const TONOS_PORTADA: Record<TonoPortada, string> = {
  azul: 'bg-linear-to-br from-primary/25 via-primary/10 to-info/20',
  cielo: 'bg-linear-to-br from-info/30 via-info/10 to-primary/15',
  verde: 'bg-linear-to-br from-success/30 via-success/10 to-info/15',
  indigo: 'bg-linear-to-br from-chart-4/35 via-chart-2/15 to-chart-1/25',
  marino: 'bg-linear-to-br from-chart-5/45 via-chart-4/20 to-chart-2/20',
  rosa: 'bg-linear-to-br from-destructive/25 via-destructive/8 to-primary/15',
}
export const TONOS: TonoPortada[] = ['azul', 'cielo', 'verde', 'indigo', 'marino', 'rosa']

const ALTO_GLASS = { mini: 30, tarjeta: 96, grande: 150 } as const

// La portada de un contenido. `mini` es la miniatura cuadrada de una fila; `tarjeta`, 16:9 a todo el ancho de su caja;
// `grande`, la de la cabecera o la vista previa. Sin portada, un marco punteado con el tipo de contenido: se nota que falta.
export function PortadaContenido({
  portada,
  tamano = 'tarjeta',
  className,
  children,
}: {
  portada: Portada | null
  tamano?: 'mini' | 'tarjeta' | 'grande'
  className?: string
  // Lo que va encima (la insignia de visibilidad en una tarjeta, por ejemplo).
  children?: React.ReactNode
}) {
  const forma = tamano === 'mini' ? 'size-12 rounded-lg' : 'aspect-video w-full rounded-xl'
  if (!portada)
    return (
      <div className={cn('relative flex items-center justify-center overflow-hidden border border-dashed bg-muted/40', forma, className)}>
        <ImagenGlass nombre="glass-gallery" tamano={ALTO_GLASS[tamano] * 0.7} className="shrink-0 opacity-45 grayscale" />
        {children}
      </div>
    )
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', TONOS_PORTADA[portada.tono], forma, className)}>
      {portada.imagen ? (
        <img src={portada.imagen} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
      ) : (
        <ImagenGlass nombre={portada.icono} tamano={ALTO_GLASS[tamano]} className="shrink-0 drop-shadow-xl" />
      )}
      {children}
    </div>
  )
}

// Las cuatro portadas que «propone la IA» para un contenido: la ilustración que va con su categoría en cuatro tonos, y
// otras tres ilustraciones cercanas. Siempre las mismas para el mismo contenido (no cambian al volver a abrir).
const GLASS_POR_CATEGORIA: Record<string, string[]> = {
  Cumplimiento: ['glass-shield-done', 'glass-document', 'glass-lock', 'glass-tick'],
  'Habilidades blandas': ['glass-chat', 'glass-heart', 'glass-profile', 'glass-star'],
  Liderazgo: ['glass-ticket-star', 'glass-chat', 'glass-activity', 'glass-star'],
  Onboarding: ['glass-home', 'glass-discovery', 'glass-paper-plus', 'glass-play'],
  'Seguridad y salud': ['glass-danger', 'glass-shield-done', 'glass-heart', 'glass-activity'],
  'Servicio al cliente': ['glass-heart', 'glass-chat', 'glass-message', 'glass-star'],
  Tecnología: ['glass-chart', 'glass-graph', 'glass-setting', 'glass-search'],
  Ventas: ['glass-buy', 'glass-discount', 'glass-wallet', 'glass-graph'],
}
export function portadasSugeridas(contenido: Pick<Contenido, 'categoria' | 'titulo'>, vuelta = 0): Portada[] {
  const iconos = GLASS_POR_CATEGORIA[contenido.categoria ?? ''] ?? ['glass-play', 'glass-paper', 'glass-star', 'glass-discovery']
  const desde = (contenido.titulo.length + vuelta * 2) % TONOS.length
  return iconos.map((icono, i) => ({ icono: iconos[(i + vuelta) % iconos.length] ?? icono, tono: TONOS[(desde + i) % TONOS.length], conIa: true }))
}

export const CATEGORIAS_CON_ICONO = CATEGORIAS.map((categoria) => ({ categoria, glass: GLASS_POR_CATEGORIA[categoria]?.[0] ?? 'glass-play' }))

/* Insignias e iconos -------------------------------------------------------------------------------------------- */

export function InsigniaVisibilidad({ visibilidad, size = 'sm', className }: { visibilidad: Visibilidad; size?: 'xs' | 'sm' | 'default'; className?: string }) {
  return (
    <Badge variant={INSIGNIA_VISIBILIDAD[visibilidad]} size={size} className={className}>
      {visibilidad}
    </Badge>
  )
}

// El icono de un tipo de página en su baldosa suave: el mismo en el índice, en el selector y en la vista previa.
export function IconoPagina({ tipo, size = 'sm', className }: { tipo: TipoPagina; size?: 'xs' | 'sm' | 'default'; className?: string }) {
  return (
    <IconTile variant="soft" size={size} className={cn('shrink-0', className)}>
      <HugeiconsIcon icon={TIPOS_PAGINA[tipo].icono} aria-hidden="true" />
    </IconTile>
  )
}

/* Créditos ------------------------------------------------------------------------------------------------------ */

// El saldo de créditos de IA: el orbe y el número, con su explicación al pasar el cursor. Va donde se gasta (el diálogo
// de la portada, el panel del agente, la propuesta de la exploración 3).
export function SaldoCreditos({ className }: { className?: string }) {
  const saldo = useCreditos()
  return (
    <Hint label="Créditos de IA de tu empresa para LMS Creator. Subir archivos y pegar enlaces no gasta créditos." side="bottom">
      <Badge variant="outline" size="default" className={cn('gap-1.5 tabular-nums', className)}>
        <IconoIA />
        {saldo.toLocaleString('es-CO')} {plural(saldo, 'crédito', 'créditos')}
      </Badge>
    </Hint>
  )
}

// «50 créditos» junto a un botón de IA: lo que cuesta antes de pulsarlo.
export function Costo({ creditos, className }: { creditos: number; className?: string }) {
  return (
    <span className={cn('text-xs tabular-nums text-muted-foreground', className)}>{creditos ? `${creditos} ${plural(creditos, 'crédito', 'créditos')}` : 'Gratis'}</span>
  )
}
