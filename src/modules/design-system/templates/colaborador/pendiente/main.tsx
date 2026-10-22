import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Route01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

import { BASE, MENU, PENDIENTES } from '../components/data'
import { EncabezadoPantalla } from '../components/piezas'

// Entradas del menú que todavía no tienen template. En vez de una página en blanco, se muestra
// lo que el grafo de la plataforma sabe de la pantalla que existe hoy.

function tituloDe(ruta: string) {
  for (const seccion of MENU) for (const grupo of seccion.grupos) {
    const hijo = grupo.hijos.find((h) => h.ruta === ruta)
    if (hijo) return { titulo: hijo.titulo, grupo: grupo.titulo }
  }
  return null
}

export function Component() {
  const { pantalla = '' } = useParams()
  const menu = tituloDe(pantalla)
  const hoy = PENDIENTES[pantalla]

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPantalla titulo={menu?.titulo ?? 'Pantalla no encontrada'} descripcion={menu ? menu.grupo : undefined} />
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              {/* Ilustración del sistema (decisión 14 de la auditoría): el reloj para «pendiente», la lupa para «no existe». */}
              <EmptyMedia variant="default">
                <ImagenGlass nombre={menu ? 'glass-clock' : 'glass-search'} />
              </EmptyMedia>
              <EmptyTitle>{menu ? 'Esta pantalla todavía no tiene template' : 'No encontramos esta página'}</EmptyTitle>
              <EmptyDescription>
                {menu
                  ? 'Está en el menú del nuevo UBITS, pero aún no se maquetó. Esto es lo que existe hoy en la plataforma:'
                  : 'Revisa que la dirección esté bien escrita.'}
              </EmptyDescription>
            </EmptyHeader>
            {hoy ? (
              <EmptyContent className="w-full max-w-lg">
                <ItemGroup className="flex w-full flex-col gap-2 text-left">
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={Route01Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {hoy.hoy}
                        <Badge variant="outline" size="xs">
                          {hoy.ruta}
                        </Badge>
                      </ItemTitle>
                      <ItemDescription>
                        {hoy.que}
                        {hoy.estado ? ` ${hoy.estado}` : ''}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                  {hoy.recorrido ? (
                    <Item variant="muted" size="sm">
                      <ItemContent>
                        <ItemDescription>Aparece en el recorrido «{hoy.recorrido}».</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : null}
                </ItemGroup>
                <Button variant="outline" nativeButton={false} render={<Link to={BASE} />}>
                  Volver al inicio
                </Button>
              </EmptyContent>
            ) : (
              <EmptyContent>
                <Button variant="outline" nativeButton={false} render={<Link to={BASE} />}>
                  Volver al inicio
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}

Component.displayName = 'TemplateColaboradorPendiente'
