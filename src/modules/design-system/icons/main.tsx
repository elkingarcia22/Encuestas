import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Copy01Icon, Delete02Icon, Download01Icon, InformationCircleIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Tabs,
  TabsContent,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  toast,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { SinResultados } from '@/shared/components/SinResultados'

import { IconoIA } from '../ia/icono-ia'
import { EncabezadoPatron, PestanasDePatron, VerEnAccion } from '../patrones/piezas'
import { CATEGORIAS_GLASS, ICONOS_GLASS, rutaGlass, type CategoriaGlass, type IconoGlass } from './glass'

// Iconos del design system. Glass: 50 ilustraciones pequeñas de Iconly (Figma) en PNG transparente,
// para atajos, indicadores y vacíos. Hugeicons: los iconos de interfaz, como siempre.

type Fondo = 'tarjeta' | 'gris' | 'oscuro'

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// En una pantalla, la pieza ImagenGlass: busca el icono en el catálogo, arma las tres densidades y, si el nombre no
// existe, no pinta nada. Nada de armar la ruta del PNG a mano (había cuatro copias; decisión 21 de la auditoría, 5-oct).
const EJEMPLO_GLASS = `import { ImagenGlass } from '@/shared/components/ImagenGlass'

<ImagenGlass nombre="glass-chart" tamano={64} />`

const EJEMPLO_HUGEICONS = `import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'

<HugeiconsIcon icon={Delete02Icon} size={20} />`

function TarjetaIcono({ icono }: { icono: IconoGlass }) {
  const copiar = async () => {
    const nombre = `${icono.nombre}@2x.png`
    try {
      await navigator.clipboard.writeText(nombre)
      toast.add({ type: 'success', title: 'Nombre copiado', description: nombre })
    } catch {
      toast.add({ type: 'info', title: nombre, description: 'Cópialo a mano: el navegador no dejó usar el portapapeles.' })
    }
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col items-center gap-2">
        <img src={rutaGlass(icono)} srcSet={`${rutaGlass(icono)} 1x, ${rutaGlass(icono, '2x')} 2x`} width={80} height={80} alt="" loading="lazy" />
        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          <Text as="span" size="sm" weight="medium">
            {icono.nombreEs}
          </Text>
          <Text as="span" variant="muted" size="xs" className="max-w-full truncate">
            {icono.nombre}
          </Text>
        </div>
        <div className="flex gap-1">
          <Hint label="Copiar nombre" side="top">
            <BotonIcono size="icon-xs" aria-label={`Copiar el nombre de ${icono.nombreEs}`} onClick={copiar}>
              <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
            </BotonIcono>
          </Hint>
          <Hint label="Descargar 576 px" side="top">
            <BotonIcono
              size="icon-xs"
              aria-label={`Descargar ${icono.nombreEs} en 576 px`}
              nativeButton={false}
              render={<a href={rutaGlass(icono, '4x')} download={`${icono.nombre}@4x.png`} />}
            >
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
            </BotonIcono>
          </Hint>
        </div>
      </CardContent>
    </Card>
  )
}

function CatalogoGlass() {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<CategoriaGlass | 'todas'>('todas')
  const [fondo, setFondo] = useState<Fondo>('tarjeta')

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim())
    return ICONOS_GLASS.filter(
      (i) => (categoria === 'todas' || i.categoria === categoria) && (!q || [i.nombre, i.nombreEs, ...i.buscar].some((t) => sinTildes(t).includes(q))),
    )
  }, [busqueda, categoria])

  const grupos = CATEGORIAS_GLASS.map((c) => ({ ...c, iconos: visibles.filter((i) => i.categoria === c.id) })).filter((g) => g.iconos.length)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>Ilustraciones, no iconos de interfaz</AlertTitle>
          <AlertDescription>
            <p>
              Úsalos en tarjetas de atajos, indicadores y vacíos, a 48, 64 o 96 px, con un texto al lado que diga lo mismo. Botones, menús y
              campos siguen con Hugeicons.
            </p>
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>Pendiente: licencia y flux-ui</AlertTitle>
          <AlertDescription>
            <p>
              Son de Iconly Pro (comunidad de Figma). Hay que confirmar que se pueden usar en UBITS y si piden crédito. Mientras flux-ui no los
              publique, se usan como imagen desde <code>/iconos-glass/</code>.
            </p>
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="min-w-60 flex-1">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="buscar-glass"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca en español: certificado, fecha, usuario…"
            aria-label="Buscar iconos Glass"
          />
        </InputGroup>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[fondo]}
          onValueChange={(valor) => (valor[0] ? setFondo(valor[0] as Fondo) : undefined)}
          aria-label="Fondo de prueba"
        >
          <ToggleGroupItem value="tarjeta">Tarjeta</ToggleGroupItem>
          <ToggleGroupItem value="gris">Gris</ToggleGroupItem>
          <ToggleGroupItem value="oscuro">Oscuro</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ToggleGroup
        variant="outline"
        size="sm"
        value={[categoria]}
        onValueChange={(valor) => setCategoria((valor[0] as CategoriaGlass | undefined) ?? 'todas')}
        aria-label="Categoría"
        className="flex-wrap"
      >
        <ToggleGroupItem value="todas">Todas · {ICONOS_GLASS.length}</ToggleGroupItem>
        {CATEGORIAS_GLASS.map((c) => (
          <ToggleGroupItem key={c.id} value={c.id}>
            {c.nombre} · {ICONOS_GLASS.filter((i) => i.categoria === c.id).length}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* El vidrio cambia según lo que tiene detrás: el fondo de prueba cambia el de toda la rejilla.
          «Oscuro» usa la clase del tema oscuro solo en esta zona. */}
      <div className={fondo === 'oscuro' ? 'dark bg-background rounded-xl p-4' : fondo === 'gris' ? 'bg-muted rounded-xl p-4' : ''}>
        {grupos.length ? (
          <div className="flex flex-col gap-8">
            {grupos.map((grupo) => (
              <section key={grupo.id} aria-labelledby={`glass-${grupo.id}`} className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <Heading as="h3" level={5} id={`glass-${grupo.id}`}>
                    {grupo.nombre}
                  </Heading>
                  <Text as="span" variant="muted" size="sm">
                    {grupo.iconos.length}
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {grupo.iconos.map((icono) => (
                    <TarjetaIcono key={icono.nombre} icono={icono} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          // La búsqueda no encontró nada: la pieza del sistema, con su ilustración (decisión 14 de la auditoría, 5-oct).
          <SinResultados
            busqueda={busqueda}
            filtrosActivos={categoria === 'todas' ? 0 : 1}
            onLimpiar={() => {
              setBusqueda('')
              setCategoria('todas')
            }}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cómo usarlos en una pantalla</CardTitle>
          <CardDescription>
            Con ImagenGlass, la única pieza para estas ilustraciones: basta el nombre del icono y el tamaño (72 px si no se dice). Ya trae
            las versiones @2x y @4x para pantallas de alta densidad; cada PNG es un lienzo cuadrado de 144 px (@1x), 288 px (@2x) y 576 px
            (@4x). No se arma la ruta del PNG a mano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={EJEMPLO_GLASS} language="tsx" />
        </CardContent>
      </Card>
    </div>
  )
}

function Hugeicons() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hugeicons para la interfaz</CardTitle>
        <CardDescription>
          Botones, menús, campos y encabezados usan Hugeicons. El icono es un dato: siempre va dentro de HugeiconsIcon. Se buscan por concepto
          en español con el catálogo de flux-ui.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CodeBlock code={EJEMPLO_HUGEICONS} language="tsx" />
        {/* La chispa que ilustraba Hugeicons se cambió por el mismo icono del ejemplo: la estrella no se usa en el producto
            (decisión 8 de la auditoría, 5-oct). La IA tiene su propia marca, el orbe, en la tercera fila. */}
        <ItemGroup className="grid gap-2 md:grid-cols-3">
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Hugeicons: acciones y controles</ItemTitle>
              <ItemDescription>De 16 a 24 px, en el color del texto.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" size="sm">
            <ItemMedia>
              <img src={rutaGlass(ICONOS_GLASS[0])} width={32} height={32} alt="" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Glass: ilustraciones</ItemTitle>
              <ItemDescription>De 48 a 96 px, junto a un título que diga lo mismo.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <IconoIA />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>IA: el orbe</ItemTitle>
              <ItemDescription>Lo que hace la IA lleva el orbe (IconoIA), nunca estrellas, chispas ni varitas.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

export function Component() {
  return (
    <>
      <div className="flex flex-col gap-8">
        <EncabezadoPatron
          titulo="Iconos"
          antetitulo="Design system · Fundamentos"
          etiqueta={<Badge variant="warning-light">Glass aún no está en la librería</Badge>}
          acciones={<VerEnAccion pagina="icons" />}
        >
          Dos familias: Hugeicons para la interfaz y Glass, 50 ilustraciones pequeñas exportadas de Figma, para darle imagen a atajos,
          indicadores y vacíos.
        </EncabezadoPatron>
        <Tabs defaultValue="glass">
          <PestanasDePatron
            items={[
              { valor: 'glass', etiqueta: `Glass · ${ICONOS_GLASS.length}` },
              { valor: 'hugeicons', etiqueta: 'Hugeicons' },
            ]}
          />
          <TabsContent value="glass" className="pt-6">
            <CatalogoGlass />
          </TabsContent>
          <TabsContent value="hugeicons" className="pt-6">
            <Hugeicons />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

Component.displayName = 'DesignSystemIconsPage'
