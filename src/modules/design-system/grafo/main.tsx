import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Copy01Icon, LinkSquare02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Indicadores } from '../metricas/cifras'
import { EncabezadoPatron, SectionIntro } from '../patrones/piezas'
import datos from '../../../../ai-tools/grafo/grafo.json'

// Empezar › Grafo (7-oct, Cristian: «un grafo dentro del producto para que una IA pueda analizar rápido los componentes
// que tenemos, el contexto del producto etc»). La página explora ai-tools/grafo/grafo.json, que genera
// ai-tools/grafo/generar-grafo.mjs al abrir la sesión: componentes de flux, piezas del equipo y sus fichas, pantallas
// y qué usa cada una, trampas, diferencias y el producto real enlazado por historias de usuario.

type Nodo = { id: string; tipo: string; nombre: string; descripcion?: string; ruta?: string; archivo?: string; estado?: string; storybook?: string }
type Arista = { de: string; a: string; relacion: string }

const NODOS = datos.nodos as Nodo[]
const ARISTAS = datos.aristas as Arista[]
const TIPOS = datos.tipos as Record<string, string>
const POR_ID = new Map(NODOS.map((n) => [n.id, n]))
const SALEN = new Map<string, Arista[]>()
const ENTRAN = new Map<string, Arista[]>()
for (const e of ARISTAS) {
  SALEN.set(e.de, [...(SALEN.get(e.de) ?? []), e])
  ENTRAN.set(e.a, [...(ENTRAN.get(e.a) ?? []), e])
}

const ETIQUETA_TIPO: Record<string, string> = {
  'componente-flux': 'Flux',
  pieza: 'Pieza del equipo',
  ficha: 'Ficha',
  'regla-global': 'Regla global',
  pantalla: 'Pantalla',
  plantilla: 'Plantilla',
  'pagina-ds': 'Página del DS',
  trampa: 'Trampa',
  diferencia: 'Diferencia',
  historia: 'Historia de usuario',
  producto: 'Producto real',
  'producto-documento': 'Documento',
}

const FILTROS = [
  { valor: 'todo', etiqueta: 'Todo', tipos: [] as string[] },
  { valor: 'piezas', etiqueta: 'Piezas y fichas', tipos: ['pieza', 'ficha', 'regla-global'] },
  { valor: 'flux', etiqueta: 'Flux', tipos: ['componente-flux'] },
  { valor: 'pantallas', etiqueta: 'Pantallas', tipos: ['pantalla', 'plantilla', 'pagina-ds'] },
  { valor: 'producto', etiqueta: 'Producto real', tipos: ['historia', 'producto', 'producto-documento'] },
  { valor: 'avisos', etiqueta: 'Trampas y diferencias', tipos: ['trampa', 'diferencia'] },
]

// Por dónde empezar cuando no hay nada elegido: lo más conectado de cada tipo útil.
const conexiones = (id: string) => (SALEN.get(id)?.length ?? 0) + (ENTRAN.get(id)?.length ?? 0)

const INSTRUCCION = [
  'Antes de maquetar o responder sobre el playground, lee ai-tools/grafo/GRAFO.md: el resumen del grafo con las piezas del equipo (de más a menos usada), los componentes de flux más usados y las pantallas con sus piezas e historias de usuario.',
  'Si necesitas más detalle, usa ai-tools/grafo/grafo.json: «nodos» (id, tipo, nombre, descripcion, ruta, archivo) y «aristas» (de, a, relacion).',
  'Para saber qué pieza usar, busca nodos «pieza» y su «tiene ficha»; para copiar cómo se resolvió algo, sigue «usa» hacia atrás hasta una pantalla; para el contexto del producto, sigue «implementa» hasta la historia de usuario y de ahí el producto real.',
].join('\n')

function ChipTipo({ tipo }: { tipo: string }) {
  return (
    <Badge variant={tipo === 'pieza' || tipo === 'ficha' ? 'info-light' : tipo === 'trampa' || tipo === 'diferencia' ? 'warning-light' : 'secondary'} size="sm">
      {ETIQUETA_TIPO[tipo] ?? tipo}
    </Badge>
  )
}

// Cómo se lee una relación desde el otro lado: si Vacantes «usa» la tabla, en la tabla dice «La usan».
const INVERSA: Record<string, string> = {
  usa: 'La usan',
  'hecha con': 'Forma parte de',
  'tiene ficha': 'Es la ficha de',
  'parte de': 'Contiene',
  implementa: 'La implementan',
  sobre: 'Trampas y diferencias',
  'se ve en': 'Diferencias que la tocan',
}
const primeraMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Las relaciones de un nodo, agrupadas: «Usa: Frame», «La usan: Vacantes»…
function Conexiones({ nodo, elegir }: { nodo: Nodo; elegir: (id: string) => void }) {
  const grupos = new Map<string, Nodo[]>()
  for (const e of SALEN.get(nodo.id) ?? []) {
    const otro = POR_ID.get(e.a)
    const clave = primeraMayuscula(e.relacion)
    if (otro) grupos.set(clave, [...(grupos.get(clave) ?? []), otro])
  }
  for (const e of ENTRAN.get(nodo.id) ?? []) {
    const otro = POR_ID.get(e.de)
    const clave = INVERSA[e.relacion] ?? `← ${e.relacion}`
    if (otro) grupos.set(clave, [...(grupos.get(clave) ?? []), otro])
  }
  if (!grupos.size) return <Text variant="muted" size="sm">Sin relaciones.</Text>
  return (
    <div className="flex flex-col gap-5">
      {[...grupos].map(([relacion, otros]) => (
        <div key={relacion} className="flex flex-col gap-2">
          <Text as="span" size="sm" weight="medium">
            {relacion} · {otros.length}
          </Text>
          <div className="flex flex-wrap gap-1.5">
            {otros.slice(0, 60).map((otro) => (
              <Button key={otro.id} variant="outline" size="sm" onClick={() => elegir(otro.id)} title={otro.ruta ?? ETIQUETA_TIPO[otro.tipo]}>
                {otro.nombre.length > 48 ? `${otro.nombre.slice(0, 47)}…` : otro.nombre}
              </Button>
            ))}
            {otros.length > 60 ? (
              <Text as="span" variant="muted" size="sm" className="self-center">
                y {otros.length - 60} más
              </Text>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Component() {
  const [params, setParams] = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todo')
  const elegido = POR_ID.get(params.get('nodo') ?? '')
  const elegir = (id: string) => setParams({ nodo: id })

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es')
    const tipos = FILTROS.find((f) => f.valor === filtro)?.tipos ?? []
    return NODOS.filter(
      (n) => (!tipos.length || tipos.includes(n.tipo)) && (!q || `${n.nombre} ${n.descripcion ?? ''} ${n.ruta ?? ''}`.toLocaleLowerCase('es').includes(q)),
    )
      .sort((a, b) => conexiones(b.id) - conexiones(a.id))
      .slice(0, 40)
  }, [busqueda, filtro])

  const copiar = async () => {
    await navigator.clipboard.writeText(INSTRUCCION)
    notify('Instrucción copiada', 'Pégala al empezar una conversación con la IA sobre el playground.', 'success')
  }

  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron
        antetitulo="Design system · Empezar"
        titulo="Grafo"
        etiqueta={<Badge variant="info-light">Para la IA</Badge>}
        acciones={
          <Button variant="outline" onClick={copiar}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" data-icon="inline-start" />
            Copiar instrucción para la IA
          </Button>
        }
      >
        Todo el playground conectado en un solo mapa: los componentes de la librería, las piezas que customizó el equipo y
        sus fichas, las pantallas y qué usa cada una, las trampas conocidas y el producto real, enlazado por las historias
        de usuario. Se regenera solo al abrir la sesión; una IA lo lee en segundos.
      </EncabezadoPatron>

      <Indicadores
        cifras={[
          { etiqueta: 'Nodos', valor: datos.totales.nodos.toLocaleString('es'), detalle: `${Object.keys(datos.totales.por_tipo).length} tipos` },
          { etiqueta: 'Relaciones', valor: datos.totales.aristas.toLocaleString('es'), detalle: 'usa, hecha con, implementa…' },
          { etiqueta: 'Pantallas', valor: String(datos.totales.por_tipo.pantalla ?? 0), detalle: 'del admin y del colaborador' },
          { etiqueta: 'Historias enlazadas', valor: String(ARISTAS.filter((e) => e.relacion === 'implementa').length), detalle: 'pantallas que citan una HU' },
        ]}
      />

      <section className="flex flex-col gap-4">
        <SectionIntro title="Explorar" description="Busca cualquier cosa y abre sus relaciones: qué usa, quién la usa, de qué está hecha y a qué historia responde." />
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Frame>
            <FramePanel className="flex flex-col gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="buscar-grafo"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Tabla, vacantes, HU-LMS-001…"
                  aria-label="Buscar en el grafo"
                />
              </InputGroup>
              <ToggleGroup variant="outline" size="sm" value={[filtro]} onValueChange={(v) => v[0] && setFiltro(v[0])} aria-label="Filtrar por tipo" className="flex-wrap">
                {FILTROS.map((f) => (
                  <ToggleGroupItem key={f.valor} value={f.valor}>
                    {f.etiqueta}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {resultados.length ? (
                <ItemGroup className="gap-1">
                  {resultados.map((n) => (
                    <Item
                      key={n.id}
                      size="xs"
                      variant={elegido?.id === n.id ? 'muted' : 'default'}
                      render={<button type="button" />}
                      className="cursor-pointer text-left"
                      onClick={() => elegir(n.id)}
                    >
                      <ItemContent>
                        <ItemTitle className="flex-wrap">
                          {n.nombre}
                          <ChipTipo tipo={n.tipo} />
                        </ItemTitle>
                        <ItemDescription>{conexiones(n.id)} relaciones</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <SinResultados busqueda={busqueda} filtrosActivos={filtro === 'todo' ? 0 : 1} onLimpiar={() => (setBusqueda(''), setFiltro('todo'))} />
              )}
            </FramePanel>
          </Frame>

          {elegido ? (
            <Frame>
              <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <FrameTitle className="flex flex-wrap items-center gap-2">
                    {elegido.nombre}
                    <ChipTipo tipo={elegido.tipo} />
                    {elegido.estado ? (
                      <Badge variant="outline" size="sm">
                        {elegido.estado}
                      </Badge>
                    ) : null}
                  </FrameTitle>
                  <FrameDescription>{TIPOS[elegido.tipo]}</FrameDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {elegido.ruta ? (
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link to={elegido.ruta} />}>
                      Abrir
                      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
                    </Button>
                  ) : null}
                  {elegido.storybook ? (
                    <Button variant="outline" size="sm" nativeButton={false} render={<a href={elegido.storybook} target="_blank" rel="noreferrer" />}>
                      <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" data-icon="inline-start" />
                      Storybook
                    </Button>
                  ) : null}
                </div>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-6">
                {elegido.descripcion || elegido.archivo ? (
                  <div className="flex flex-col gap-1">
                    {elegido.descripcion ? <Text size="sm">{elegido.descripcion}</Text> : null}
                    {elegido.archivo ? (
                      <Text variant="muted" size="xs" className="break-all">
                        {elegido.archivo}
                      </Text>
                    ) : null}
                  </div>
                ) : null}
                <Conexiones nodo={elegido} elegir={elegir} />
              </FramePanel>
            </Frame>
          ) : (
            <Frame>
              <FramePanel>
                <PrimeraVez icono="glass-discovery" titulo="Elige algo de la lista" descripcion="Verás sus relaciones aquí. Cada relación se puede abrir para seguir el camino." />
              </FramePanel>
            </Frame>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Para la IA" description="Dónde está el grafo y cómo pedirle a una IA que lo use." />
        <Frame>
          <FramePanel className="flex flex-col gap-2">
            <Text size="sm">
              <strong>ai-tools/grafo/GRAFO.md</strong>: el resumen que se lee primero (piezas del equipo por uso, flux más usado, pantallas con sus piezas e historias).
            </Text>
            <Text size="sm">
              <strong>ai-tools/grafo/grafo.json</strong>: el grafo completo, con nodos y relaciones.
            </Text>
            <Text size="sm">
              <strong>ai-tools/grafo/generar-grafo.mjs</strong>: lo genera a partir del catálogo, las fichas, las pantallas y docs/plataforma-ubits. Se corre solo al abrir la sesión.
            </Text>
            <Text variant="muted" size="xs">
              Generado el {datos.generado}.
            </Text>
          </FramePanel>
        </Frame>
      </section>
    </div>
  )
}

Component.displayName = 'DesignSystemGrafoPage'
