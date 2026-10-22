import { RotateLeft01Icon } from '@hugeicons/core-free-icons'
import { PrimeraVez } from '@/shared/components/PrimeraVez'

// Una sola forma de decir que la IA falló en Encuestas (Elkin, 14-oct): el «Error de carga» del design system
// (Estados › Estados vacíos), con la ilustración glass, qué pasó en una línea y «Reintentar». En su lugar no queda
// nada hecho por la IA —ni la lectura anterior, ni un resumen, ni cifras suyas—: solo el vacío y la salida.
// Se usa en Análisis con IA (IA-031) y en Insights IA del comparativo (IA-039). Es PrimeraVez del sistema con
// glass-danger y «Reintentar», no una copia aparte: solo fija el icono y la acción.

export function FallaIa({
  titulo,
  descripcion,
  onReintentar,
  className,
}: {
  titulo: string
  descripcion: string
  onReintentar: () => void
  className?: string
}) {
  return <PrimeraVez className={className ?? 'py-12'} icono="glass-danger" titulo={titulo} descripcion={descripcion} accion={{ texto: 'Reintentar', icono: RotateLeft01Icon, onClick: onReintentar }} />
}
