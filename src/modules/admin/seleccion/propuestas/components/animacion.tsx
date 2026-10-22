import { useEffect, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, animate, motion, stagger, useReducedMotion } from 'motion/react'
import { CURVA } from './movimiento'

// El movimiento de Selección, en un solo lugar (15 oct, Nicolás: «un glow up total en la parte de animaciones dentro de
// selección, con framer… componente por componente, interacción por interacción»). Se suma a los tres gestos que ya
// había (`entrada`, `FilaAnimada`, `CifraAnimada`) y habla el mismo idioma: la curva que arranca rápido y se posa
// despacio para lo que aparece, y resortes para lo que se mueve de un lugar a otro, que es lo que hace sentir que las
// cosas tienen peso. Cada gesto tiene una sola razón: decir de dónde viene algo, a dónde se fue o qué acaba de cambiar.
// Con «reducir movimiento» en el sistema no se mueve nada (las páginas van dentro de `MotionConfig reducedMotion="user"`).

// Lo que viaja de un lugar a otro (una tarjeta que cambia de etapa, la barra en lote que sube): firme, sin rebote largo.
export const RESORTE = { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 } as const
// Lo que aparece en su sitio (una insignia, un aviso dentro de la tarjeta): un poco de rebote, como un clic.
export const RESORTE_VIVO = { type: 'spring', stiffness: 620, damping: 26, mass: 0.7 } as const
// Lo que se funde o se desliza (el contenido de una pestaña, la ficha que cambia de persona).
export const SUAVE = { duration: 0.34, ease: CURVA } as const

// Una insignia o un aviso que aparece dentro de algo que ya estaba: crece desde el centro con un pequeño rebote.
export const POP = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.14 } },
  transition: RESORTE_VIVO,
} as const

// El contenido de una pestaña que se acaba de abrir: sube un poco y se posa (las pestañas montan su contenido al abrirse).
export const apareceContenido = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: CURVA },
} as const

// Una sección de la página que aparece cuando llega a la vista, una sola vez: sube 16 px y se posa. Las de arriba entran
// en cascada (`orden`); las de abajo, cuando se baja hasta ellas.
export function Revelar({
  children,
  orden = 0,
  id,
  className,
}: {
  children: ReactNode
  orden?: number
  id?: string
  className?: string
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, delay: orden * 0.07, ease: CURVA }}
    >
      {children}
    </motion.div>
  )
}

// Las celdas de una franja (las condiciones de la vacante, las cifras de Créditos): una tras otra, de izquierda a derecha.
export const celda = (indice: number) =>
  ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.12 + indice * 0.06, ease: CURVA },
  }) as const

// La ilustración de un estado vacío: llega con un pequeño rebote y después flota, despacio, para que el vacío no se vea
// muerto.
export function Flotar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={className ?? 'inline-flex'}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...RESORTE_VIVO, delay: 0.06 }}
    >
      <motion.span className="inline-flex" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}>
        {children}
      </motion.span>
    </motion.span>
  )
}

// El contenido que cambia en el mismo lugar (las pestañas de la ficha, un paso de una ventana): el de antes se va hacia
// arriba y el nuevo sube a su sitio.
export function Fundido({ clave, children, className }: { clave: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={clave}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: CURVA }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Pasar de una persona a la siguiente (o a la anterior) en la ficha: la nueva entra desde el lado hacia donde se avanza,
// como pasar una página.
export function Deslizar({ clave, direccion, children, className }: { clave: string; direccion: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      key={clave}
      className={className}
      initial={direccion ? { opacity: 0, x: direccion * 32 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={SUAVE}
    >
      {children}
    </motion.div>
  )
}

// Las filas de la tabla del sistema entran una tras otra (16 oct, Nicolás: «más wowness, con framer»). TablaDatos dibuja sus
// propias filas, así que se animan desde fuera: cada vez que llega una página, una búsqueda, un filtro o un orden nuevo,
// las filas que se ven suben 8 px y aparecen en cascada. `caja` es el contenedor de la tabla; `listo`, que ya cargó.
export function useFilasQueEntran(caja: RefObject<HTMLElement | null>, clave: unknown, listo: boolean) {
  const quieto = useReducedMotion()
  const texto = JSON.stringify(clave)
  useEffect(() => {
    if (!listo || quieto) return
    const filas = caja.current?.querySelectorAll<HTMLElement>('tbody tr')
    if (!filas?.length) return
    const animacion = animate(filas, { opacity: [0, 1], y: [8, 0] }, { duration: 0.42, delay: stagger(0.035), ease: CURVA })
    return () => animacion.stop()
  }, [caja, texto, listo, quieto])
}
