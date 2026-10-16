// Lenguaje visual del agente contextual (copiado del panel del editor, pantalla «03 Editor + agente»).
// Ojo: no mezclar estas clases con un color dentro de cn(); la librería descarta el tamaño de letra.
// Sumar el color con un template string: `${KICKER} text-muted-foreground`.

// 11px, como estaban antes del 22 sep: el cambio a 13px se revirtió el 23 sep junto con el resto de los pesos de texto
// del agente (Cristian). El saludo de Suite AI sí se queda en 600.
export const KICKER = 'text-[11px] font-medium tracking-[0.12em] uppercase'

// Pedido de la persona: burbuja gris alineada a la derecha.
export const BUBBLE = 'max-w-82.5 rounded-[16px_16px_6px_16px] bg-muted px-4 py-3 text-[15px] leading-normal'

// Acción principal o secundaria del agente.
export const PILL = 'h-9! rounded-full! px-4! text-sm font-medium'

// Atajo sugerido («Resumir en 3 puntos»).
export const PILL_SOFT = 'h-auto! rounded-full! px-4! py-2.25! text-sm font-normal! text-left! whitespace-normal!'

// Chip pequeño (fuentes, opciones de aclaración).
export const PILL_XS = 'h-7! gap-1.5! rounded-full! px-3! text-[13px]! font-normal!'

// Bloque de contenido del agente dentro del panel.
export const AGENT_CARD = 'rounded-[16px] border bg-background px-4 py-3.5'

// Campo o bloque que llenó el agente en la pantalla de trabajo.
export const SUGGESTED = 'rounded-xl bg-primary/5 ring-1 ring-primary/30'
