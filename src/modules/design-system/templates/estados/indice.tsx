import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge, Card, CardContent, Heading, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { MarcoAdmin } from '../admin-compartido/marco-admin'
import { EncabezadoPantalla } from '../admin-compartido/piezas'
import { DENTRO, FUERA, rutaCaso, type CasoDeEstado } from './casos'

// Índice de los estados a pantalla completa. Cada uno se abre en su propia dirección, así que se
// puede compartir el enlace de un estado concreto sin explicar cómo llegar hasta él.

function Grupo({ titulo, descripcion, casos }: { titulo: string; descripcion: string; casos: CasoDeEstado[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Heading as="h2" level={5}>
          {titulo}
        </Heading>
        <Text variant="muted">{descripcion}</Text>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {casos.map((caso) => (
          <Card key={caso.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Text weight="medium">{caso.nombre}</Text>
                  <Badge variant={caso.tipo === 'carga' ? 'info-light' : 'warning-light'} size="xs">
                    {caso.tipo === 'carga' ? 'Carga' : 'Error'}
                  </Badge>
                </div>
                <Text variant="muted" size="sm">
                  {caso.cuando}
                </Text>
              </div>

              {/* La flecha al final de la fila es el botón de solo icono del sistema: redondo y sin borde. */}
              <BotonIcono aria-label={`Abrir ${caso.nombre}`} nativeButton={false} render={<Link to={rutaCaso(caso.id)} />}>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </BotonIcono>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function Component() {
  return (
    <MarcoAdmin migas={[{ etiqueta: 'Estados' }]}>
      <div className="flex flex-col gap-8">
      <EncabezadoPantalla
        titulo="Estados a pantalla completa"
        descripcion="Los errores de sistema y las cargas tal como ocupan la pantalla, sin tener que provocarlos. Cada uno abre en su propia dirección."
      />

      <Grupo
        titulo="Dentro del producto"
        descripcion="Pasan estando dentro, así que conservan la barra lateral y el encabezado: se puede seguir navegando a otro sitio."
        casos={DENTRO}
      />

      <Grupo
        titulo="Fuera del producto"
        descripcion="La sesión, la conexión o el servidor dejaron a la persona fuera. Van sin marco: ese menú no respondería."
          casos={FUERA}
        />
      </div>
    </MarcoAdmin>
  )
}

Component.displayName = 'DesignSystemTemplateEstadosIndice'
