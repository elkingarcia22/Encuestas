import type { ReactNode } from 'react'
import { Heading, Text } from '@ubits/flux-ui'
import metaLogo from '@/shared/assets/meta.png'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Cabecera de cada paso del acceso: marca o icono glass, título y descripción, todo centrado.
// Va un solo <h1> por paso: el lector anuncia el cambio de pantalla aunque la URL no cambie.
export function AuthHeader({
  media,
  title,
  description,
}: {
  media: 'marca' | { glass: string }
  title: string
  description?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {media === 'marca' ? (
        // La marca es la del cliente que compró UBITS (Meta Colombia, la misma del menú de empresa); UBITS va al pie.
        <img src={metaLogo} alt="Meta Colombia" className="h-10 w-auto" />
      ) : (
        <ImagenGlass nombre={media.glass} tamano={80} />
      )}
      <div className="flex flex-col gap-1.5">
        <Heading as="h1" level={4}>
          {title}
        </Heading>
        {description ? (
          <Text variant="muted" size="sm" className="text-pretty">
            {description}
          </Text>
        ) : null}
      </div>
    </div>
  )
}
