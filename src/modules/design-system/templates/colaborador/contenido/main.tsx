import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Bookmark01Icon,
  Certificate01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Globe02Icon,
  PlayIcon,
  Route01Icon,
  Share08Icon,
  SignalIcon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Separator,
  Text,
  toast,
} from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { PageHeader } from '@/shared/components/PageShell'

import {
  APRENDERAS,
  BASE,
  ICONO_TIPO,
  PLANES,
  contenidoPorId,
  estadoDe,
  estadoPagina,
  paginasDe,
} from '../components/data'
import { IconoEstado, Valoracion } from '../components/piezas'
import { fechaCorta } from '../../../patrones/formato'

// Ficha de contenido. Hoy: /learner/content/:id con tipo, nivel, duración, idioma, descripción,
// temario y «Comenzar ahora». En la especificación es la portada de la Experiencia de estudio
// (HU-APR-004): el badge replica el tipo del catálogo y un id desconocido no inventa páginas.

export function Component() {
  const { id } = useParams()
  const contenido = contenidoPorId(id)

  if (!contenido) {
    // HU experiencia de estudio, RN-04. Con la ilustración del sistema, la misma de «No encontramos este registro»
    // (decisión 14 de la auditoría).
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <ImagenGlass nombre="glass-document" />
          </EmptyMedia>
          <EmptyTitle>No se encontró el contenido «{id}».</EmptyTitle>
          <EmptyDescription>Puede que lo hayan archivado o que el enlace esté incompleto.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" nativeButton={false} render={<Link to={`${BASE}/catalogo`} />}>
            Ir al catálogo
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { paginas, completadas } = paginasDe(contenido)
  const estado = estadoDe(contenido)
  const plan = PLANES.find((p) => p.contenidos.includes(contenido.id))
  const secciones = [...new Set(paginas.map((p) => p.seccion))]
  const cta = estado === 'Sin iniciar' ? 'Comenzar ahora' : estado === 'En progreso' ? 'Continuar' : 'Volver a ver'

  const detalles = [
    { etiqueta: 'Tipo', valor: contenido.tipo, icono: Route01Icon },
    { etiqueta: 'Nivel', valor: contenido.nivel, icono: SignalIcon },
    { etiqueta: 'Duración', valor: contenido.duracion, icono: Clock01Icon },
    { etiqueta: 'Idioma', valor: contenido.idioma, icono: Globe02Icon },
    { etiqueta: 'Certificado', valor: contenido.certificado ? 'Sí, al terminar' : 'No otorga', icono: Certificate01Icon },
  ]

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Patrón Detalle (auditoría, 5-oct): la cabecera de página con la flecha de volver, el título, la descripción y
          las acciones a la derecha (terciario · secundario · primario); la imagen y los datos van debajo, como contenido. */}
      <PageHeader
        back={{ label: 'Zona de estudio', to: `${BASE}/zona-de-estudio` }}
        title={contenido.titulo}
        description={contenido.descripcion}
        meta={
          <>
            {/* RN-08: el badge replica el tipo del catálogo. */}
            <Badge variant="info-light">{contenido.tipo}</Badge>
            <Badge variant="outline">{contenido.origen === 'Google' ? 'Universidad Google' : contenido.proveedor}</Badge>
            {plan ? <Badge variant="warning-light">Obligatorio · {plan.nombre}</Badge> : null}
            <Valoracion valor={contenido.valoracion} />
            <Text as="span" variant="muted" size="sm" className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={16} aria-hidden="true" />
              {contenido.duracion}
            </Text>
            <Text as="span" variant="muted" size="sm">
              {paginas.length} páginas · {contenido.nivel}
            </Text>
          </>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => toast.add({ type: 'success', title: 'Enlace copiado' })}>
              <HugeiconsIcon icon={Share08Icon} aria-hidden="true" />
              Compartir
            </Button>
            <Button variant="outline" onClick={() => toast.add({ type: 'success', title: 'Guardado para después' })}>
              <HugeiconsIcon icon={Bookmark01Icon} aria-hidden="true" />
              Guardar
            </Button>
            <Button nativeButton={false} render={<Link to={`${BASE}/estudio/${contenido.id}`} />}>
              <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
              {cta}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <img src={contenido.imagen} alt="" className="aspect-video w-full rounded-xl object-cover" />
          {estado === 'En progreso' ? (
            <Progress value={contenido.avance}>
              <ProgressLabel>
                Vas en la página {completadas + 1} de {paginas.length}
              </ProgressLabel>
              <ProgressValue className="ms-auto" />
            </Progress>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Qué vas a aprender</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemGroup className="grid gap-2 sm:grid-cols-2">
                {(contenido.id === 'onboarding-comercial' ? APRENDERAS : [contenido.descripcion]).map((texto) => (
                  <Item key={texto} size="xs" className="items-start">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>{texto}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temario</CardTitle>
              <CardDescription>
                {paginas.length} páginas en {secciones.length} {secciones.length === 1 ? 'sección' : 'secciones'} · navegación lineal: se avanza en orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion defaultValue={[paginas[Math.min(completadas, paginas.length - 1)].seccion]}>
                {secciones.map((seccion) => (
                  <AccordionItem key={seccion} value={seccion}>
                    <AccordionTrigger>{seccion}</AccordionTrigger>
                    <AccordionContent>
                      <ItemGroup className="flex flex-col gap-1">
                        {paginas.map((pagina, indice) =>
                          pagina.seccion === seccion ? (
                            <Item key={pagina.titulo} size="sm">
                              <ItemMedia variant="icon">
                                <HugeiconsIcon icon={ICONO_TIPO[pagina.tipo]} aria-hidden="true" />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>
                                  {indice + 1}. {pagina.titulo}
                                </ItemTitle>
                                <ItemDescription>
                                  {pagina.tipo === 'Fin' ? 'Cierre' : pagina.tipo} · {pagina.duracion}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <IconoEstado estado={estadoPagina(indice, completadas)} />
                              </ItemActions>
                            </Item>
                          ) : null,
                        )}
                      </ItemGroup>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
              <CardDescription>{contenido.proveedor}</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="flex flex-col gap-1">
                {detalles.map((detalle) => (
                  <Item key={detalle.etiqueta} size="xs">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={detalle.icono} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemDescription>{detalle.etiqueta}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Text as="span" size="sm" weight="medium">
                        {detalle.valor}
                      </Text>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>

          {plan ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Parte de tu plan</CardTitle>
                <CardDescription>{plan.nombre}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Text as="span" variant="muted" size="sm">
                  Asignado por {plan.asignadoPor}. Cierra el {fechaCorta(plan.cierre)}.
                </Text>
                <Separator />
                <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`${BASE}/zona-de-estudio`} />}>
                  Ver el plan en Zona de estudio
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'TemplateColaboradorContenido'
