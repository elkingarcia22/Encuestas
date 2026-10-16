import type { Tone } from '../../../../encuestas/modelo/tone'

// Lo que comparten las piezas de la tarjeta y no es un componente (va aparte para que la recarga en caliente funcione).

// Mismos colores que TEXTO_POR_TONO, con «!» para que le ganen al color propio del IconTile (como en paso-general).
export const TEXTO_FIJO_POR_TONO: Record<Tone, string> = {
  brand: 'text-primary!',
  positive: 'text-success!',
  warning: 'text-warning!',
  neutral: 'text-muted-foreground!',
  ai: 'text-primary!',
  violet: 'text-info!',
}

/** Deja solo lo que puede ser una cifra mientras se escribe: dígitos, punto, coma y el «-» del principio. */
export const soloCifra = (texto: string, conNegativo = true) => {
  const negativo = conNegativo && texto.trimStart().startsWith('-')
  const digitos = texto.replace(/[^0-9.,]/g, '')
  return negativo ? `-${digitos}` : digitos
}
