import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { CURVA } from '../data-grid/movimiento'

const enPesos = (n: number) => n.toLocaleString('es-CO')

// Una cifra que sube hasta su valor al aparecer y que, si cambia, pasa de la anterior a la nueva (13 oct, PM: «yo quiero
// que esos numeritos se muevan»). El lector de pantalla lee solo el valor final; con «reducir movimiento», no se mueve.
export function CifraAnimada({ valor, formato = enPesos, duracion = 0.9 }: { valor: number; formato?: (n: number) => string; duracion?: number }) {
  const reducir = useReducedMotion()
  const actual = useMotionValue(reducir ? valor : 0)
  const texto = useTransform(actual, (n) => formato(Math.round(n)))
  useEffect(() => {
    if (reducir) {
      actual.set(valor)
      return
    }
    const control = animate(actual, valor, { duration: duracion, ease: CURVA })
    return () => control.stop()
  }, [valor, reducir, actual, duracion])
  return (
    <>
      <span className="sr-only">{formato(valor)}</span>
      <motion.span aria-hidden="true" className="tabular-nums">
        {texto}
      </motion.span>
    </>
  )
}
