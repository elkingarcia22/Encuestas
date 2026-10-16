import { createContext, useContext } from 'react'
import { cn, Text } from '@ubits/flux-ui'
import paleta from '@/shared/components/tarjeta-ia.module.css'
import styles from './texto-resaltado.module.css'

// Texto grande con una parte resaltada (Dave, 23 sep): lo normal en medium y lo resaltado en negrita. Si lo resaltado
// habla de la IA lleva el degradado de la IA de UBITS; si no, el azul de UBITS (`primary`). Sirve para frases como
// «Tú lo imaginas, nosotros lo generamos» o «Sube el archivo PDF que quieres añadir». Heading no deja cambiar el peso,
// por eso va con Text.

// '2xl' es la lectura grande de AI Insights (8 oct): Text llega hasta xl, así que desde tableta sube un paso de la escala.
type Tamano = 'lg' | 'xl' | '2xl'
const MEDIDA: Record<Tamano, { size: 'lg' | 'xl'; clase?: string }> = { lg: { size: 'lg' }, xl: { size: 'xl' }, '2xl': { size: 'xl', clase: 'sm:text-2xl' } }

// El resaltado repite el tamaño de su frase: Text sin `size` pone el suyo por defecto y lo encogería.
const TamanoFrase = createContext<Tamano>('xl')

export function TextoResaltado({ children, size = 'xl', className }: { children: React.ReactNode; size?: Tamano; className?: string }) {
  return (
    <TamanoFrase.Provider value={size}>
      <Text as="p" size={MEDIDA[size].size} weight="medium" className={cn('text-balance', MEDIDA[size].clase, className)}>
        {children}
      </Text>
    </TamanoFrase.Provider>
  )
}

export function Resaltado({ children, ia = false }: { children: React.ReactNode; ia?: boolean }) {
  const size = useContext(TamanoFrase)
  return (
    <Text as="span" size={MEDIDA[size].size} weight="bold" className={cn(MEDIDA[size].clase, ia ? cn(paleta.vars, styles.ia) : 'text-primary')}>
      {children}
    </Text>
  )
}
