import { ICONOS_GLASS, rutaGlass } from '@/modules/design-system/icons/glass'

// Los iconos «glass» del design system (Design system › Iconos › Glass): ilustraciones en PNG con tres densidades,
// más cálidas que un icono de línea. Se usan donde el espacio da para una imagen y no para un símbolo pequeño —los
// estados vacíos, sobre todo—, no dentro de botones ni de filas de tabla.

export function ImagenGlass({ nombre, tamano = 72, className }: { nombre: string; tamano?: number; className?: string }) {
  const glass = ICONOS_GLASS.find((uno) => uno.nombre === nombre)
  // Un nombre que no está en el catálogo no rompe la pantalla: simplemente no se pinta nada.
  if (!glass) return null
  return (
    <img
      src={rutaGlass(glass, '1x')}
      srcSet={`${rutaGlass(glass, '1x')} 1x, ${rutaGlass(glass, '2x')} 2x, ${rutaGlass(glass, '4x')} 4x`}
      width={tamano}
      height={tamano}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  )
}
