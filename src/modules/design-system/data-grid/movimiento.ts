import { motion } from 'motion/react'
import { TableRow } from '@ubits/flux-ui'

// El movimiento de las tablas y los tableros. Nació en Selección (13 oct, reunión con la PM y el TL: «quiero ver más interacción, más movimiento… sin
// saturar al usuario, que no sea una página estática»; 14 oct, Nicolás: con Framer Motion, `motion`, la que ya trae
// flux-ui). Tres gestos, siempre cortos y siempre los mismos, para que la pantalla se sienta viva sin distraer:
// - las cifras suben hasta su valor al llegar (`CifraAnimada`);
// - las filas de una tabla y las tarjetas del tablero entran una tras otra, subiendo un poco (`entrada`);
// - lo que cambia (un aviso dentro de la tarjeta) aparece con un pulso suave, como ya hacía la tarjeta movida.
// Quien pidió reducir el movimiento en su sistema no ve ninguno (`MotionConfig reducedMotion="user"` y
// `useReducedMotion`).

// La fila de una tabla de flux-ui que se puede animar: la librería pasa todo (también `ref` y `style`) a su `<tr>`.
export const FilaAnimada = motion.create(TableRow)

// La curva de todo el movimiento: arranca rápido y se posa despacio.
export const CURVA = [0.22, 1, 0.36, 1] as const

// La entrada de una lista: cada elemento aparece y sube 6 px, uno tras otro (30 ms entre uno y el siguiente, con tope
// para que una página larga no tarde). Va en `initial`/`animate`/`transition` de un `motion.*`.
export const entrada = (indice: number, desde = 6) =>
  ({
    initial: { opacity: 0, y: desde },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay: Math.min(indice, 12) * 0.03, ease: CURVA },
  }) as const
