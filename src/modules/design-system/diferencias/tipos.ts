// Diferencias con la librería: lo que el playground hace distinto de @ubits/flux-ui (lo que muestra el Storybook), en
// un solo formato para el dev que mantiene la librería. Los datos viven en ai-tools/flux-ui/diferencias.json; este
// archivo solo los describe. Lo usan la pestaña /design-system/componentes/dev y el exportador del documento para el dev
// (ai-tools/flux-ui/exportar-diferencias.mjs), así la pantalla y el documento dicen siempre lo mismo.
//
// Sin imports ni sintaxis que Node no sepa quitar: el exportador lo carga con Node tal cual.

export type Tipo = 'error' | 'defecto' | 'falta' | 'textos' | 'tema' | 'variante'
export type Estado = 'pedido' | 'propuesta' | 'decidir'
export type Prioridad = 'alta' | 'media' | 'baja'

export type Diferencia = {
  id: string
  // El nombre del export de flux-ui (DataGridList, Badge…) o «Tema» cuando no es de un solo componente.
  pieza: string
  slug: string
  tipo: Tipo
  estado: Estado
  prioridad: Prioridad
  titulo: string
  hoy: string
  esperado: string
  pedido: string
  reproducir: { storybook: string | null; props: string | null; reui: string | null }
  nosotros: { como: string; donde: string[]; pantallas: number | null }
  // La ficha de Ajustes propios que lo muestra lado a lado (librería contra UBITS).
  ajuste: string | null
  // La entrada de «Instalación» que lo explica de fondo, cuando es síntoma de una causa común.
  causa: string | null
  fuentes: string[]
  verificado: string
  revisado: string
}

export type Diferencias = {
  libreria: string
  storybook: string
  revisado: string
  entradas: Diferencia[]
}

export const TIPOS: Record<Tipo, { etiqueta: string; ayuda: string }> = {
  error: { etiqueta: 'Error', ayuda: 'Algo de la librería no funciona o no se lee (contraste, comportamiento).' },
  defecto: { etiqueta: 'Valor por defecto', ayuda: 'Funciona, pero lo que trae por defecto no sirve y hay que pedirle otra cosa.' },
  falta: { etiqueta: 'Falta', ayuda: 'No existe la opción, la variante o el componente.' },
  textos: { etiqueta: 'Textos', ayuda: 'Textos o nombres para lectores de pantalla en inglés, o que no se pueden cambiar.' },
  tema: { etiqueta: 'Tema', ayuda: 'Colores, radios, alturas o letra del tema de UBITS distintos a los de la librería.' },
  variante: { etiqueta: 'Variante UBITS', ayuda: 'Una decisión de marca que usamos y proponemos adoptar como variante oficial.' },
}

export const ESTADOS: Record<Estado, { etiqueta: string; ayuda: string }> = {
  pedido: { etiqueta: 'Pedido', ayuda: 'La librería tiene que cambiarlo; mientras tanto lo resolvemos nosotros.' },
  propuesta: { etiqueta: 'Propuesta', ayuda: 'Se la proponemos a la librería como variante; decide el equipo de librería.' },
  decidir: { etiqueta: 'Por decidir', ayuda: 'Falta una decisión nuestra antes de pedirlo.' },
}

export const PRIORIDADES: Record<Prioridad, { etiqueta: string; orden: number }> = {
  alta: { etiqueta: 'Alta', orden: 0 },
  media: { etiqueta: 'Media', orden: 1 },
  baja: { etiqueta: 'Baja', orden: 2 },
}

// Ordena por prioridad y, a igual prioridad, por pieza.
export function ordenar(entradas: Diferencia[]) {
  return [...entradas].sort(
    (a, b) => PRIORIDADES[a.prioridad].orden - PRIORIDADES[b.prioridad].orden || a.pieza.localeCompare(b.pieza, 'es'),
  )
}

// Las causas de fondo van primero: explican muchas de las demás entradas.
export const PRIMERO = ['Instalación', 'Storybook']

// Agrupa por pieza: primero las causas de fondo y después las piezas con algo de prioridad alta.
export function porPieza(entradas: Diferencia[]) {
  const grupos = new Map<string, Diferencia[]>()
  for (const entrada of ordenar(entradas)) grupos.set(entrada.pieza, [...(grupos.get(entrada.pieza) ?? []), entrada])
  return [...grupos.entries()]
    .map(([pieza, lista]) => ({ pieza, slug: lista[0].slug, entradas: lista }))
    .sort(
      (a, b) =>
        rango(a.pieza) - rango(b.pieza) ||
        PRIORIDADES[a.entradas[0].prioridad].orden - PRIORIDADES[b.entradas[0].prioridad].orden ||
        a.pieza.localeCompare(b.pieza, 'es'),
    )
}

function rango(pieza: string) {
  const i = PRIMERO.indexOf(pieza)
  return i === -1 ? PRIMERO.length : i
}
