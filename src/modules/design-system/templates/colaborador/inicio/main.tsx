import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Clapping01Icon,
  Comment01Icon,
  PlayIcon,
  Target02Icon,
  ThumbsUpIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  Checkbox,
  Heading,
  IconTile,
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
import { FlechasCarrusel } from '@/modules/portal-colaborador/aprendizaje/zona-de-estudio/components/carrusel'

import {
  BASE,
  CONTENIDOS,
  NOTICIAS,
  PAGINAS,
  PAGINAS_COMPLETADAS,
  PENDIENTES_DESEMPENO,
  PERSONA,
  PLANES,
  TAREAS,
  contenidoPorId,
} from '../components/data'
import { EncabezadoPantalla, datosDeTarjeta } from '../components/piezas'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { iniciales } from '../../../patrones/formato'

// Inicio del colaborador. Hoy es el Portal Colaborador (/portal): el nodo con más conexiones del
// grafo del recorrido y donde aterriza todo el mundo después del login. Mantiene sus bloques
// (perfil, tareas, «¿Qué quieres aprender hoy?», recomendados, desempeño y noticias) ordenados
// por lo que hay que hacer primero.

const actual = contenidoPorId('onboarding-comercial')!
const plan = PLANES[0]
const siguiente = PAGINAS[PAGINAS_COMPLETADAS]
const RECOMENDADOS = CONTENIDOS.filter((c) => c.avance === 0 && c.origen === 'UBITS').slice(0, 8)

const ICONO_PENDIENTE = { '360': UserGroupIcon, encuesta: Comment01Icon, objetivos: Target02Icon }

function SeguirAprendiendo() {
  return (
    <Card>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <img src={actual.imagen} alt="" className="aspect-video w-full rounded-lg object-cover md:aspect-auto md:h-full" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text as="span" variant="muted" size="sm">
              ¿Qué quieres aprender hoy?
            </Text>
            <div className="flex flex-col gap-1">
              <Heading as="h2" level={4}>
                Continúa «{actual.titulo}»
              </Heading>
              <Text variant="muted" size="sm">
                Del plan {plan.nombre}. Vas en la página {PAGINAS_COMPLETADAS + 1} de {PAGINAS.length}: {siguiente.titulo}.
              </Text>
            </div>
          </div>
          <Progress value={actual.avance}>
            <ProgressLabel>Tu avance</ProgressLabel>
            <ProgressValue className="ms-auto" />
          </Progress>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link to={`${BASE}/estudio/${actual.id}`} />}>
              <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
              Continuar
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link to={`${BASE}/zona-de-estudio`} />}>
              Ver mis planes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Recomendados() {
  const navigate = useNavigate()
  return (
    <section className="flex flex-col gap-3" aria-labelledby="recomendados">
      <Carousel opts={{ align: 'start' }} className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Heading as="h2" level={5} id="recomendados">
              Recomendados para ti
            </Heading>
            <Text variant="muted" size="sm">
              Según tu área y lo que estudiaste este mes.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`${BASE}/catalogo`} />}>
              Ver catálogo
            </Button>
            {/* Solo si hay algo que desplazar, como en la caja de la zona de estudio: una flecha que no lleva a
                ningún lado no es un control (Dave, 7-oct). */}
            <FlechasCarrusel />
          </div>
        </div>
        <CarouselContent>
          {RECOMENDADOS.map((contenido) => (
            <CarouselItem key={contenido.id} className="basis-full pb-1 sm:basis-1/2 xl:basis-1/3">
              <TarjetaContenido {...datosDeTarjeta(contenido, { conAvance: false, onAbrir: navigate })} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}

function Noticias() {
  const [reacciones, setReacciones] = useState<Record<string, boolean>>({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Noticias y anuncios</CardTitle>
        <CardDescription>Lo que publica Recursos Humanos para toda la empresa.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={() => toast.add({ type: 'info', title: 'Hoy este botón lleva a Comunicaciones del administrador' })}>
            Ver todas
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {NOTICIAS.map((noticia, indice) => (
          <article key={noticia.id} className="flex flex-col gap-3">
            {indice > 0 ? <Separator /> : null}
            <div className="flex items-center gap-2.5">
              <Avatar size="sm">
                <AvatarImage src={noticia.foto} alt="" />
                <AvatarFallback>{iniciales(noticia.autor)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <Text as="span" size="sm" weight="medium">
                  {noticia.autor}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {noticia.rol} · {noticia.hace}
                </Text>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Text weight="semibold">{noticia.titulo}</Text>
              <Text variant="muted" size="sm">
                {noticia.texto}
              </Text>
            </div>
            {noticia.imagen ? <img src={noticia.imagen} alt="" className="aspect-[3/1] w-full rounded-lg object-cover" /> : null}
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant={reacciones[noticia.id] ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={!!reacciones[noticia.id]}
                onClick={() => setReacciones((previas) => ({ ...previas, [noticia.id]: !previas[noticia.id] }))}
              >
                <HugeiconsIcon icon={ThumbsUpIcon} aria-hidden="true" />
                {noticia.meGusta + (reacciones[noticia.id] ? 1 : 0)}
              </Button>
              <Button variant="ghost" size="sm">
                <HugeiconsIcon icon={Clapping01Icon} aria-hidden="true" />
                {noticia.celebrar}
              </Button>
              <Button variant="ghost" size="sm">
                <HugeiconsIcon icon={Comment01Icon} aria-hidden="true" />
                Comentar
              </Button>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}

function Perfil() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <Avatar size="lg">
          <AvatarImage src={PERSONA.foto} alt="" />
          <AvatarFallback>{iniciales(PERSONA.nombre)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <Text weight="semibold">{PERSONA.nombre}</Text>
          <Text variant="muted" size="sm">
            {PERSONA.cargo}
          </Text>
          <Text variant="muted" size="xs">
            {PERSONA.area} · {PERSONA.sede} · {PERSONA.codigo}
          </Text>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <Separator />
        <Item size="sm">
          <ItemMedia>
            <Avatar size="sm">
              <AvatarImage src={PERSONA.lider.foto} alt="" />
              <AvatarFallback>{iniciales(PERSONA.lider.nombre)}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemDescription>Tu líder</ItemDescription>
            <ItemTitle>{PERSONA.lider.nombre}</ItemTitle>
          </ItemContent>
        </Item>
        <Button variant="outline" size="sm" onClick={() => toast.add({ type: 'info', title: 'Organigrama', description: 'Hoy vive en /portal/org-chart; en el nuevo UBITS pasa a Configuración del administrador.' })}>
          Ver organigrama
        </Button>
      </CardFooter>
    </Card>
  )
}

function MisTareas() {
  const [hechas, setHechas] = useState<Set<string>>(new Set())
  const pendientes = TAREAS.filter((t) => !hechas.has(t.id)).length

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Mis tareas pendientes</CardTitle>
        <CardDescription>
          {pendientes ? `${pendientes} por hacer esta semana` : 'Estás al día'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="flex flex-col gap-1">
          {TAREAS.map((tarea) => {
            const hecha = hechas.has(tarea.id)
            return (
              <Item key={tarea.id} size="xs">
                <ItemMedia>
                  <Checkbox
                    checked={hecha}
                    aria-label={`Marcar «${tarea.titulo}» como hecha`}
                    onCheckedChange={(marcada) =>
                      setHechas((previas) => {
                        const nuevas = new Set(previas)
                        if (marcada) nuevas.add(tarea.id)
                        else nuevas.delete(tarea.id)
                        return nuevas
                      })
                    }
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{tarea.titulo}</ItemTitle>
                  <ItemDescription>{tarea.plan}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant={tarea.urgente && !hecha ? 'destructive-outline' : 'outline'} size="sm">
                    {hecha ? 'Hecha' : tarea.vence}
                  </Badge>
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`${BASE}/tareas`} />}>
          Ir a Tareas
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function Desempeno() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Desempeño y cultura</CardTitle>
        <CardDescription>Lo que te piden responder.</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="flex flex-col gap-2">
          {PENDIENTES_DESEMPENO.map((pendiente) => (
            <Item key={pendiente.id} variant="outline" size="sm">
              <ItemMedia>
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={ICONO_PENDIENTE[pendiente.tipo]} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent className="gap-1.5">
                <ItemTitle>{pendiente.titulo}</ItemTitle>
                <ItemDescription>{pendiente.detalle}</ItemDescription>
                <Badge variant={pendiente.tono} size="sm">
                  {pendiente.estado}
                </Badge>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

export function Component() {
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPantalla
        titulo={`Hola, ${PERSONA.corto}`}
        descripcion="Jueves 11 de septiembre. Tienes una tarea que vence hoy y dos evaluaciones por responder."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SeguirAprendiendo />
          <Recomendados />
          <Noticias />
        </div>
        <div className="flex flex-col gap-6">
          <Perfil />
          <MisTareas />
          <Desempeno />
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'TemplateColaboradorInicio'
