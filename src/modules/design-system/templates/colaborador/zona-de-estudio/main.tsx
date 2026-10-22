import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Cancel01Icon,
  Certificate01Icon,
  Download01Icon,
  Search01Icon,
  Target02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
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
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  toast,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'

import {
  BASE,
  EXCLUSIVO,
  HISTORIAL,
  PLANES,
  avanceDePlan,
  contenidoPorId,
  type Contenido,
} from '../components/data'
import { EncabezadoPantalla, datosDeTarjeta } from '../components/piezas'
import { diasDesde, fechaCorta, fechaSinAnio, plural } from '../../../patrones/formato'

// Zona de estudio. Hoy: /learn/study-zone/assigned-content, assigned-competences y history.
// HU «Zona de estudio» (RN-01 a RN-05): cuatro pestañas literales, búsqueda en la lista visible,
// vacío de búsqueda y contador que nombra «contenidos».

function filtrar(lista: Contenido[], q: string) {
  const texto = q.trim().toLowerCase()
  if (!texto) return lista
  return lista.filter((c) => [c.titulo, c.tipo, c.proveedor].some((campo) => campo.toLowerCase().includes(texto)))
}

function Buscador({ valor, onCambio, total }: { valor: string; onCambio: (v: string) => void; total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <Text weight="semibold">Lista de contenidos</Text>
        {/* RN-05: el contador nombra lo que cuenta. */}
        <Text as="span" variant="muted" size="sm">
          {total} {plural(total, 'contenido', 'contenidos')}
        </Text>
      </div>
      <InputGroup className="w-full sm:w-72">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput aria-label="Buscar en la lista" placeholder="Buscar contenido…" value={valor} onChange={(e) => onCambio(e.target.value)} />
        {valor ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Limpiar búsqueda" onClick={() => onCambio('')}>
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  )
}

// El vacío de búsqueda es el «Sin resultados» del sistema (decisión 14 de la auditoría): ilustración, lo buscado entre
// comillas y el botón para limpiar. Antes había aquí una copia con lupa y texto fijo.
function Rejilla({ lista, busqueda, onLimpiar }: { lista: Contenido[]; busqueda: string; onLimpiar: () => void }) {
  const navigate = useNavigate()
  if (!lista.length) return <SinResultados busqueda={busqueda} onLimpiar={onLimpiar} />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map((contenido) => (
        <TarjetaContenido key={contenido.id} {...datosDeTarjeta(contenido, { onAbrir: navigate })} />
      ))}
    </div>
  )
}

function PlanDeContenidos({ busqueda, onBusqueda }: { busqueda: string; onBusqueda: (v: string) => void }) {
  const [elegido, setElegido] = useState(PLANES[0].id)
  const plan = PLANES.find((p) => p.id === elegido) ?? PLANES[0]
  const { items } = avanceDePlan(plan)
  const visibles = filtrar(items, busqueda)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {PLANES.map((p) => {
          const { hechos, total, promedio } = avanceDePlan(p)
          const dias = -diasDesde(p.cierre)
          const activo = p.id === elegido
          return (
            <Card key={p.id} size="sm">
              <CardHeader>
                <CardTitle>{p.nombre}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <HugeiconsIcon icon={UserIcon} size={14} aria-hidden="true" />
                  Asignado por {p.asignadoPor}
                </CardDescription>
                <CardAction>
                  <Badge variant="success-light" size="sm">
                    Vigente
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Text as="span" variant="muted" size="sm" className="flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden="true" />
                  {fechaSinAnio(p.inicio)} – {fechaCorta(p.cierre)} · cierra en {dias} días
                </Text>
                <Progress value={promedio}>
                  <ProgressLabel>
                    {hechos} de {total} contenidos terminados
                  </ProgressLabel>
                  <ProgressValue className="ms-auto" />
                </Progress>
              </CardContent>
              <CardFooter>
                <Button
                  variant={activo ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={activo}
                  onClick={() => setElegido(p.id)}
                >
                  {activo ? 'Viendo sus contenidos' : 'Ver sus contenidos'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      <div className="flex flex-col gap-4">
        <Buscador valor={busqueda} onCambio={onBusqueda} total={visibles.length} />
        <Rejilla lista={visibles} busqueda={busqueda} onLimpiar={() => onBusqueda('')} />
      </div>
    </div>
  )
}

function Historial({ busqueda, onBusqueda }: { busqueda: string; onBusqueda: (v: string) => void }) {
  const filas = HISTORIAL.map((h) => ({ ...h, contenido: contenidoPorId(h.id)! })).filter((h) =>
    filtrar([h.contenido], busqueda).length,
  )

  return (
    <div className="flex flex-col gap-4">
      <Buscador valor={busqueda} onCambio={onBusqueda} total={filas.length} />
      {filas.length ? (
        <ItemGroup className="flex flex-col gap-2">
          {filas.map(({ contenido, terminado, nota, certificado }) => (
            <Item key={contenido.id} variant="outline">
              <ItemMedia variant="image">
                <img src={contenido.imagen} alt="" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <Link to={`${BASE}/contenido/${contenido.id}`}>{contenido.titulo}</Link>
                </ItemTitle>
                <ItemDescription>
                  {contenido.tipo} · terminado el {fechaCorta(terminado)}
                  {nota !== null ? ` · nota final ${nota} %` : ''}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {certificado ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.promise(new Promise((resolver) => setTimeout(resolver, 1200)), {
                        loading: 'Preparando tu certificado…',
                        success: 'Certificado descargado',
                        error: 'No pudimos generar el certificado',
                      })
                    }
                  >
                    <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                    Certificado
                  </Button>
                ) : (
                  <Text as="span" variant="muted" size="xs">
                    Sin certificado
                  </Text>
                )}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <SinResultados busqueda={busqueda} onLimpiar={() => onBusqueda('')} />
      )}
    </div>
  )
}

export function Component() {
  const navigate = useNavigate()
  const [pestana, setPestana] = useState('contenidos')
  const [busqueda, setBusqueda] = useState('')
  const exclusivos = EXCLUSIVO.map((id) => contenidoPorId(id)).filter((c): c is Contenido => !!c)

  return (
    <div className="flex flex-col gap-6">
      {/* Las pestañas van dentro de la cabecera (`pestanas`), como en las demás pantallas: el Tabs envuelve la cabecera
          y el contenido de cada pestaña. */}
      <Tabs
        value={pestana}
        onValueChange={(valor) => {
          setPestana(String(valor))
          setBusqueda('')
        }}
      >
        <EncabezadoPantalla
          titulo="Zona de estudio"
          descripcion="Lo que tu empresa te asignó, lo que es solo para ti y lo que ya terminaste."
          acciones={
            <Button variant="outline" nativeButton={false} render={<Link to={`${BASE}/progreso`} />}>
              <HugeiconsIcon icon={Target02Icon} aria-hidden="true" />
              Ver mi progreso
            </Button>
          }
          pestanas={
            // RN-02: las cuatro pestañas literales de la historia. En pantallas angostas se deslizan.
            <ScrollArea className="w-full">
              <TabsList variant="line" className="w-max min-w-full">
                <TabsTrigger value="contenidos" className="flex-none">
                  Plan de contenidos
                </TabsTrigger>
                <TabsTrigger value="competencias" className="flex-none">
                  Plan de competencias
                </TabsTrigger>
                <TabsTrigger value="exclusivo" className="flex-none">
                  Exclusivo para mí
                  <Badge variant="secondary" size="xs">
                    {exclusivos.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="historial" className="flex-none">
                  Historial y certificados
                  <Badge variant="secondary" size="xs">
                    {HISTORIAL.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          }
        />

        <TabsContent value="contenidos" className="pt-6">
          <PlanDeContenidos busqueda={busqueda} onBusqueda={setBusqueda} />
        </TabsContent>

        <TabsContent value="competencias" className="pt-6">
          {/* Estado observado en la cuenta recorrida: vacío. Es el «Primera vez» del sistema, con ilustración (decisión 14
              de la auditoría), como en la Zona de estudio real. */}
          <PrimeraVez
            icono="glass-star"
            titulo="Aún no tienes un plan de competencias asignado"
            descripcion="Cuando Recursos Humanos te asigne horas por competencia, las verás aquí con su avance."
            accion={{ texto: 'Explorar catálogo', icono: Search01Icon, onClick: () => navigate(`${BASE}/catalogo`) }}
          />
        </TabsContent>

        <TabsContent value="exclusivo" className="flex flex-col gap-4 pt-6">
          <Text variant="muted" size="sm">
            Contenidos que te asignaron directamente por tu rol de líder, fuera de un plan.
          </Text>
          <Buscador valor={busqueda} onCambio={setBusqueda} total={filtrar(exclusivos, busqueda).length} />
          <Rejilla lista={filtrar(exclusivos, busqueda)} busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
        </TabsContent>

        <TabsContent value="historial" className="flex flex-col gap-4 pt-6">
          <Text variant="muted" size="sm" className="flex items-center gap-1">
            <HugeiconsIcon icon={Certificate01Icon} size={16} aria-hidden="true" />
            Descarga el certificado de los contenidos que lo otorgan.
          </Text>
          <Historial busqueda={busqueda} onBusqueda={setBusqueda} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'TemplateColaboradorZonaDeEstudio'
