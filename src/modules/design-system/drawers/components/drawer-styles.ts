// Lenguaje visual compartido por los drawers (ver README del handoff: radios y kickers).

// Botones de Workspace: ya NO fuerzan la esquina (18 sep, decisión de Nicolás).
// Este atajo ponía 8px «por el patrón reui», pero se midió y el tema del playground ya da exactamente lo que dice la
// página de Botones del design system: 12px en los normales, 10px en los chicos y 8px en los mini. Es decir, el parche
// no arreglaba nada: rompía la definición en 128 botones de 45 pantallas.
// Se deja vacío en vez de borrarlo de los 45 archivos: el nombre sigue marcando «este es un botón del Workspace» y
// evita un cambio masivo. Si algún día se limpian los archivos, se borra también de aquí.
export const WS = ''

// Botones de superficies de IA: pastilla completa.
export const PILL = 'rounded-full!'

// Pasos con estado por forma (regla del handoff). La librería pinta el pendiente con el acento del tema
// (azulado en UBITS) y número oscuro, sin contraste: pendiente = anillo fino y número gris;
// actual y completado = círculo primario lleno con texto claro.
export const STEP_INDICATOR =
  'data-[state=inactive]:bg-background! data-[state=inactive]:text-muted-foreground! data-[state=inactive]:shadow-[inset_0_0_0_1px_var(--border)] data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=completed]:bg-primary! data-[state=completed]:text-primary-foreground!'

// Línea entre pasos: gris y azul solo en el tramo ya completado.
export const STEP_LINE = 'bg-border! data-[state=completed]:bg-primary!'

// Título de sección pequeño y espaciado.
export const KICKER = 'text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase'
