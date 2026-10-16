import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon, Route01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
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
  Text,
} from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { PageHeader } from '@/shared/components/PageShell'

import { BASE, PENDIENTES, ubicacionDe } from '../components/data'

// Destinos del menú, de «Necesita tu atención» y de «Quick actions» que todavía no tienen
// template. El enlace existe aunque la pantalla esté vacía (HU-INI-001, RN-04): en vez de una
// página en blanco, se muestra lo que existe hoy en UBITS y qué historia la especifica.

export function Component() {
  const { pantalla = '' } = useParams()
  const donde = ubicacionDe(pantalla)
  const hoy = PENDIENTES[pantalla]

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <PageHeader kicker={donde?.camino.length ? donde.camino.join(' · ') : undefined} title={donde?.titulo ?? 'Pantalla no encontrada'} />

      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              {/* Ilustración del sistema (decisión 14 de la auditoría): el reloj para «pendiente», la lupa para «no existe». */}
              <EmptyMedia variant="default">
                <ImagenGlass nombre={donde ? 'glass-clock' : 'glass-search'} />
              </EmptyMedia>
              <EmptyTitle>{donde ? 'Esta pantalla todavía no tiene template' : 'No encontramos esta página'}</EmptyTitle>
              <EmptyDescription>
                {donde
                  ? 'Está en el nuevo UBITS y el Home operativo ya enlaza aquí. Esto es lo que existe hoy en la plataforma:'
                  : 'Revisa que la dirección esté bien escrita.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="w-full max-w-lg">
              {hoy ? (
                <ItemGroup className="flex w-full flex-col gap-2 text-left">
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={Route01Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {hoy.hoy}
                        {hoy.ruta !== '—' ? (
                          <Badge variant="outline" size="xs">
                            {hoy.ruta}
                          </Badge>
                        ) : null}
                      </ItemTitle>
                      <Text variant="muted" size="sm">
                        {hoy.que}
                        {hoy.estado ? ` ${hoy.estado}` : ''}
                      </Text>
                    </ItemContent>
                  </Item>
                  <Item variant="muted" size="sm">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>
                        {/* Guion que no parte línea, para que «HU-LMS-004» no quede cortado. */}
                        {hoy.hu ? `En el nuevo UBITS la especifica ${hoy.hu.replace(/-/g, '‑')}.` : 'Su historia de usuario todavía está pendiente.'}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                </ItemGroup>
              ) : null}
              <Button variant="outline" nativeButton={false} render={<Link to={BASE} />}>
                Volver al inicio
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>

    </div>
  )
}

Component.displayName = 'TemplateHomeOperativoPendiente'
