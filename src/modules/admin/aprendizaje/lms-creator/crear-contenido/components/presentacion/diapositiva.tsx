import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Image01Icon,
  MapsLocation01Icon,
  QuoteDownIcon,
  RefreshIcon,
  Timer02Icon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AspectRatio,
  Button,
  Card,
  CardContent,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Confeti } from '@/shared/components/Confeti'
import { estiloColorLibre } from '../color-libre'
import { acento as buscarAcento, type Acento, type DatosDiapositiva, type OpcionReto } from './datos'

// ── Diapositiva ──────────────────────────────────────────────────────────────────────────────────────────────────
//
// Cada tipo del catálogo se arma con piezas de la librería (Heading, Text, Card, Accordion, Tabs, RadioGroup, Table,
// Timeline, Slider, Popover…) sobre un lienzo fijo de 720 × 450 px (16:10) que se escala al ancho disponible: así la
// miniatura del rail, la vista previa del editor y el reproductor del asistente muestran exactamente lo mismo.
//
// Tres modos: `miniatura` (estática, fuera del tabulador), `edicion` (los textos se editan con un clic) y `vista`
// (lo que ve el colaborador: acordeones, pestañas, quiz y retos funcionan).

export const ANCHO_LIENZO = 720
export const ALTO_LIENZO = 450

export type ModoDiapositiva = 'miniatura' | 'edicion' | 'vista'

type Ruta = (string | number)[]

type Contexto = {
  d: DatosDiapositiva
  a: Acento
  modo: ModoDiapositiva
  logo: string | null
  cambiar: (ruta: Ruta, valor: unknown) => void
  irA?: (indice: number) => void
}

const Ctx = createContext<Contexto | null>(null)
const useDiapo = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Pieza de diapositiva fuera de <Diapositiva>')
  return ctx
}

/** Copia la diapositiva con un valor cambiado en una ruta (`['items', 2, 'title']`). */
function conValor(objeto: unknown, ruta: Ruta, valor: unknown): unknown {
  if (!ruta.length) return valor
  const [clave, ...resto] = ruta
  const copia = (Array.isArray(objeto) ? [...objeto] : { ...(objeto as object) }) as Record<string | number, unknown>
  copia[clave] = conValor((objeto as Record<string | number, unknown> | undefined)?.[clave], resto, valor)
  return copia
}

// ── Lienzo escalado ──────────────────────────────────────────────────────────────────────────────────────────────

/** Marco 16:10 que escala el lienzo de la diapositiva al ancho que tenga. */
export function LienzoDiapositiva({ children, className, etiqueta }: { children: ReactNode; className?: string; etiqueta?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0)

  useLayoutEffect(() => {
    const nodo = caja.current
    if (!nodo) return
    const medir = () => setEscala(nodo.clientWidth / ANCHO_LIENZO)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return (
    <AspectRatio ratio={16 / 10} className={cn('relative w-full overflow-hidden rounded-xl border bg-card', className)} aria-label={etiqueta}>
      <div ref={caja} className="absolute inset-0">
        {escala > 0 ? (
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: ANCHO_LIENZO, height: ALTO_LIENZO, transform: `scale(${escala})` }}>
            {children}
          </div>
        ) : null}
      </div>
    </AspectRatio>
  )
}

// ── Piezas comunes ───────────────────────────────────────────────────────────────────────────────────────────────

type PropsTexto = {
  ruta: Ruta
  v: string | undefined
  /** Encabezado (Heading) en vez de texto. */
  h?: 1 | 2 | 3 | 4 | 5 | 6
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  as?: 'p' | 'span' | 'div'
  className?: string
}

/** Un texto de la diapositiva. En modo edición se edita en el sitio (clic, escribir, Enter o clic fuera para guardar). */
function T({ ruta, v, h, size, weight, as = 'p', className }: PropsTexto) {
  const { modo, cambiar } = useDiapo()
  const texto = v ?? ''
  if (v == null || (!texto && modo !== 'edicion')) return null

  const edicion =
    modo === 'edicion'
      ? {
          contentEditable: true,
          suppressContentEditableWarning: true,
          spellCheck: false,
          role: 'textbox',
          'aria-label': 'Texto de la diapositiva',
          onBlur: (e: { currentTarget: HTMLElement }) => {
            const nuevo = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim()
            if (nuevo !== texto) cambiar(ruta, nuevo)
          },
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
            e.stopPropagation()
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              e.currentTarget.textContent = texto
              e.currentTarget.blur()
            }
          },
          onPaste: (e: ClipboardEvent<HTMLElement>) => {
            // Solo texto plano: nada de formato pegado de otra parte.
            e.preventDefault()
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
          },
          onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
        }
      : {}
  // Un texto en línea (span) va en bloque al editarse: así el borde rodea todo el párrafo y no cada línea.
  const clases = cn(
    modo === 'edicion' && 'min-w-4 cursor-text rounded-sm outline-none hover:ring-1 hover:ring-ring/50 focus:ring-2 focus:ring-ring',
    modo === 'edicion' && as === 'span' && !h && 'inline-block max-w-full',
    className,
  )

  if (h)
    return (
      <Heading key={texto} as={h <= 2 ? 'h2' : 'h3'} level={h} className={clases} {...edicion}>
        {texto}
      </Heading>
    )
  return (
    <Text key={texto} as={as} size={size} weight={weight} className={clases} {...edicion}>
      {texto}
    </Text>
  )
}

/** Imagen de la diapositiva; sin imagen, un recuadro gris con el icono. */
function Foto({ src, className, alt = '' }: { src?: string; className?: string; alt?: string }) {
  if (!src)
    return (
      <div className={cn('flex size-full items-center justify-center bg-muted text-muted-foreground', className)}>
        <HugeiconsIcon icon={Image01Icon} size={40} aria-hidden="true" />
      </div>
    )
  return <img src={src} alt={alt} draggable={false} className={cn('size-full object-cover select-none', className)} />
}

/** Texto a un lado e imagen al otro (izquierda o derecha), o banda de imagen arriba o abajo. */
function ConImagen({ children, posicion, defecto = 'right', ancho = 'w-[42%]' }: { children: ReactNode; posicion?: string; defecto?: string; ancho?: string }) {
  const { d } = useDiapo()
  const pos = posicion ?? d.imagePosition ?? defecto
  if (!d.image) return <div className="flex size-full flex-col justify-center gap-4 p-12">{children}</div>
  if (pos === 'top' || pos === 'bottom')
    return (
      <div className={cn('flex size-full', pos === 'top' ? 'flex-col' : 'flex-col-reverse')}>
        <div className="h-[36%] shrink-0 overflow-hidden">
          <Foto src={d.image} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 px-12 py-6">{children}</div>
      </div>
    )
  return (
    <div className={cn('flex size-full', pos === 'left' && 'flex-row-reverse')}>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-11">{children}</div>
      <div className={cn('shrink-0 overflow-hidden', ancho)}>
        <Foto src={d.image} />
      </div>
    </div>
  )
}

function Titulo({ nivel = 3, className }: { nivel?: 2 | 3 | 4; className?: string }) {
  const { d } = useDiapo()
  return <T ruta={['title']} v={d.title} h={nivel} className={className} />
}

/** Pie de las actividades: la instrucción (solo para el colaborador) y el resultado. */
function Instruccion({ children }: { children: ReactNode }) {
  const { modo } = useDiapo()
  if (modo !== 'vista') return null
  return (
    <Text size="sm" className="text-muted-foreground">
      {children}
    </Text>
  )
}

function Resultado({ bien, titulo, children, onReintentar }: { bien: boolean; titulo: string; children?: ReactNode; onReintentar?: () => void }) {
  return (
    <Alert variant={bien ? 'success' : 'destructive'}>
      <HugeiconsIcon icon={bien ? CheckmarkCircle02Icon : Alert02Icon} aria-hidden="true" />
      <AlertTitle>{titulo}</AlertTitle>
      {children ? (
        <AlertDescription>
          <p>{children}</p>
        </AlertDescription>
      ) : null}
      {onReintentar ? (
        <div className="col-start-2 mt-2">
          <Button variant="outline" size="xs" onClick={onReintentar}>
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            Intentar de nuevo
          </Button>
        </div>
      ) : null}
    </Alert>
  )
}

/** Orden mezclado pero siempre el mismo para una diapositiva (el del prototipo). */
function mezclar<X>(lista: X[], semilla: number) {
  const a = [...lista]
  let s = semilla * 1103515245 + 12345
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Tipos: estructura y navegación ───────────────────────────────────────────────────────────────────────────────

function Portada() {
  const { d, a, logo } = useDiapo()
  return (
    <div className={cn('flex size-full', a.fondo)}>
      <div className="flex w-[56%] flex-col justify-center gap-4 p-12">
        {logo ? <img src={logo} alt="Logo de la empresa" className="h-9 w-auto self-start object-contain" /> : null}
        <T ruta={['subtitle']} v={d.subtitle} size="sm" weight="semibold" className={cn('tracking-wide uppercase opacity-80', a.frente)} />
        <T ruta={['title']} v={d.title} h={2} className={a.frente} />
        <T ruta={['body']} v={d.body} size="lg" className={cn('opacity-85', a.frente)} />
      </div>
      <div className="relative flex-1 py-8 pr-8">
        <div className="size-full overflow-hidden rounded-2xl">
          <Foto src={d.image} />
        </div>
        {d.badgeTitle ? (
          <Card size="sm" className="absolute bottom-14 -left-10 w-60">
            <CardContent className="flex flex-col gap-0.5">
              <T ruta={['badgeTitle']} v={d.badgeTitle} weight="semibold" />
              <T ruta={['badgeSubtitle']} v={d.badgeSubtitle} size="sm" className="text-muted-foreground" />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Seccion() {
  const { d, a } = useDiapo()
  return (
    <div className={cn('relative flex size-full items-center overflow-hidden', a.fondo)}>
      {d.image ? (
        <div className="absolute inset-y-0 right-0 w-[45%] opacity-30">
          <Foto src={d.image} />
        </div>
      ) : null}
      <div className="relative flex w-[68%] flex-col gap-3 p-14">
        <T ruta={['number']} v={d.number} h={1} className={cn('opacity-60', a.frente)} />
        <T ruta={['subtitle']} v={d.subtitle} size="sm" weight="semibold" className={cn('tracking-wide uppercase opacity-80', a.frente)} />
        <T ruta={['title']} v={d.title} h={2} className={a.frente} />
        <T ruta={['body']} v={d.body} size="lg" className={cn('opacity-85', a.frente)} />
      </div>
    </div>
  )
}

function Afirmacion() {
  const { d, a } = useDiapo()
  return (
    <div className="flex size-full flex-col justify-center gap-5 p-16">
      <div className={cn('h-1.5 w-16 rounded-full', a.fondo)} />
      <Titulo nivel={2} />
      <T ruta={['body']} v={d.body} size="xl" className="text-muted-foreground" />
    </div>
  )
}

function PuntoPrincipal() {
  const { d, a } = useDiapo()
  return (
    <ConImagen defecto="left">
      <T ruta={['subtitle']} v={d.subtitle} size="sm" weight="semibold" className={cn('tracking-wide uppercase', a.texto)} />
      <Titulo nivel={2} />
      <T ruta={['body']} v={d.body} size="lg" className="text-muted-foreground" />
    </ConImagen>
  )
}

function Agenda() {
  const { d, a, modo, irA } = useDiapo()
  const items = d.items ?? []
  return (
    <div className="flex size-full flex-col gap-4 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} className="text-muted-foreground" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        {items.map((item, i) => {
          const navegable = modo === 'vista' && irA && item.targetSlide != null
          return (
            <Card
              key={i}
              size="sm"
              className={cn('justify-center', navegable && 'cursor-pointer transition-colors hover:bg-muted/60')}
              role={navegable ? 'button' : undefined}
              tabIndex={navegable ? 0 : undefined}
              onClick={navegable ? () => irA(item.targetSlide as number) : undefined}
              onKeyDown={
                navegable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        irA(item.targetSlide as number)
                      }
                    }
                  : undefined
              }
            >
              <CardContent className="flex items-start gap-3">
                <T ruta={['items', i, 'num']} v={item.num} h={4} className={cn('shrink-0 whitespace-nowrap', a.texto)} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <T ruta={['items', i, 'title']} v={item.title} weight="semibold" />
                  <T ruta={['items', i, 'desc']} v={item.desc} size="sm" className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Instruccion>Haz clic en cualquier sección para navegar a ella.</Instruccion>
    </div>
  )
}

function Resumen() {
  const { d, a } = useDiapo()
  return (
    <ConImagen>
      <Titulo nivel={2} />
      <div className="flex flex-col gap-3">
        {(d.bullets ?? []).map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className={cn('mt-0.5 shrink-0', a.texto)} aria-hidden="true" />
            <T ruta={['bullets', i]} v={b} size="lg" />
          </div>
        ))}
      </div>
    </ConImagen>
  )
}

// ── Tipos: contenido textual ─────────────────────────────────────────────────────────────────────────────────────

function Vinetas() {
  const { d, a } = useDiapo()
  return (
    <ConImagen>
      <div className="flex flex-col gap-1.5">
        <Titulo />
        <T ruta={['body']} v={d.body} className="text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2.5">
        {(d.bullets ?? []).map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={cn('mt-2.5 size-2 shrink-0 rounded-full', a.fondo)} aria-hidden="true" />
            <T ruta={['bullets', i]} v={b} />
          </div>
        ))}
      </div>
    </ConImagen>
  )
}

function ListaOrdenada() {
  const { d, a } = useDiapo()
  return (
    <ConImagen>
      <Titulo />
      <div className="flex flex-col gap-3">
        {(d.bullets ?? []).map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', a.fondo)}>
              <Text as="span" size="sm" weight="semibold" className={a.frente}>
                {i + 1}
              </Text>
            </span>
            <T ruta={['bullets', i]} v={b} className="pt-0.5" />
          </div>
        ))}
      </div>
    </ConImagen>
  )
}

function UnaColumna() {
  const { d, a } = useDiapo()
  return (
    <ConImagen defecto="top">
      <Titulo />
      <T ruta={['body']} v={d.body} className="text-muted-foreground" />
      {d.quoteHighlight ? (
        <div className={cn('border-l-4 pl-4', a.borde)}>
          <T ruta={['quoteHighlight']} v={d.quoteHighlight} size="lg" weight="medium" className="italic" />
        </div>
      ) : null}
      {(d.bullets ?? []).length ? (
        <div className="flex flex-col gap-1.5">
          {(d.bullets ?? []).map((b, i) => (
            <T key={i} ruta={['bullets', i]} v={`• ${b}`} />
          ))}
        </div>
      ) : null}
    </ConImagen>
  )
}

function DosColumnas() {
  const { d, a } = useDiapo()
  const columnas = [
    { t: 'col1Title', b: 'col1Body' },
    { t: 'col2Title', b: 'col2Body' },
  ] as const
  return (
    <div className="flex size-full flex-col gap-6 p-12">
      <Titulo nivel={2} />
      <div className="grid flex-1 grid-cols-2 gap-4">
        {columnas.map((c) => (
          <Card key={c.t}>
            <CardContent className="flex flex-col gap-3">
              <div className={cn('h-1 w-10 rounded-full', a.fondo)} />
              <T ruta={[c.t]} v={d[c.t]} h={4} />
              <T ruta={[c.b]} v={d[c.b]} className="text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Cita() {
  const { d, a } = useDiapo()
  return (
    <ConImagen defecto="bottom">
      <T ruta={['title']} v={d.title} size="sm" weight="semibold" className="tracking-wide text-muted-foreground uppercase" />
      <HugeiconsIcon icon={QuoteDownIcon} size={40} className={a.texto} aria-hidden="true" />
      <T ruta={['body']} v={d.body} h={2} className="italic" />
      <T ruta={['author']} v={d.author ? d.author : undefined} className="text-muted-foreground" />
    </ConImagen>
  )
}

function DatoClave() {
  const { d, a } = useDiapo()
  return (
    <ConImagen>
      <T ruta={['title']} v={d.title} size="sm" weight="semibold" className="tracking-wide text-muted-foreground uppercase" />
      <T ruta={['stat']} v={d.stat} h={1} className={a.texto} />
      <T ruta={['statement']} v={d.statement} size="xl" weight="semibold" />
      <T ruta={['desc']} v={d.desc} className="text-muted-foreground" />
    </ConImagen>
  )
}

function NumeroGrande() {
  const { d, a } = useDiapo()
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 p-14 text-center">
      <T ruta={['title']} v={d.title} size="sm" weight="semibold" className="tracking-wide text-muted-foreground uppercase" />
      <T ruta={['number']} v={d.number} h={1} className={a.texto} />
      <T ruta={['label']} v={d.label} size="xl" weight="semibold" />
      <T ruta={['body']} v={d.body} size="lg" className="text-muted-foreground" />
      <T ruta={['source']} v={d.source} size="xs" className="text-muted-foreground" />
    </div>
  )
}

// ── Tipos: contenido mixto ───────────────────────────────────────────────────────────────────────────────────────

function TextoImagen() {
  const { d } = useDiapo()
  return (
    <ConImagen defecto="left" ancho="w-1/2">
      <Titulo nivel={2} />
      <T ruta={['body']} v={d.body} size="lg" className="text-muted-foreground" />
    </ConImagen>
  )
}

function ImagenLeyenda() {
  const { d, a } = useDiapo()
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <Titulo />
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
        <Foto src={d.image} />
      </div>
      <div className={cn('border-l-4 pl-3', a.borde)}>
        <T ruta={['caption']} v={d.caption} size="sm" className="text-muted-foreground" />
      </div>
    </div>
  )
}

function Comparativa() {
  const { d } = useDiapo()
  const lados = [
    { tag: 'leftTag', t: 'leftTitle', b: 'leftBody' },
    { tag: 'rightTag', t: 'rightTitle', b: 'rightBody' },
  ] as const
  return (
    <div className="flex size-full flex-col gap-4 p-10">
      <Titulo />
      <div className="grid grid-cols-2 gap-3">
        {lados.map((l, i) => (
          <Card key={l.t} size="sm">
            <CardContent className="flex flex-col gap-1.5">
              <Badge variant={i === 0 ? 'primary-light' : 'secondary'} className="self-start">
                {d[l.tag] || (i === 0 ? 'Opción A' : 'Opción B')}
              </Badge>
              <T ruta={[l.t]} v={d[l.t]} weight="semibold" />
              <T ruta={[l.b]} v={d[l.b]} size="sm" className="text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
      {(d.rows ?? []).length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{d.leftTag || 'Opción A'}</TableHead>
              <TableHead>{d.rightTag || 'Opción B'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(d.rows ?? []).map((fila, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-normal">
                  <T ruta={['rows', i, 'left']} v={fila.left} as="span" size="sm" />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <T ruta={['rows', i, 'right']} v={fila.right} as="span" size="sm" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  )
}

// ── Tipos: exploración visual ────────────────────────────────────────────────────────────────────────────────────

function ImagenInteractiva() {
  const { d, modo } = useDiapo()
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
        <Foto src={d.image} />
        {(d.hotspots ?? []).map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {modo === 'miniatura' ? (
              <Button size="icon-sm" className="rounded-full!" aria-label={p.title}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
              </Button>
            ) : (
              <Popover>
                <PopoverTrigger render={<Button size="icon-sm" className="rounded-full!" aria-label={`Ver: ${p.title}`} />}>
                  <HugeiconsIcon icon={Add01Icon} size={16} />
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64">
                  <PopoverHeader>
                    <PopoverTitle>{p.title}</PopoverTitle>
                    <PopoverDescription>{p.body}</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
      </div>
      <Instruccion>Pulsa los puntos sobre la imagen para leer una nota breve.</Instruccion>
    </div>
  )
}

function AntesDespues() {
  const { d } = useDiapo()
  const [pos, setPos] = useState(50)
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
        <Foto src={d.imageAfter} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Foto src={d.imageBefore} />
        </div>
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background" style={{ left: `${pos}%` }} aria-hidden="true" />
        <Badge variant="secondary" className="absolute top-3 left-3">
          {d.labelBefore || 'Antes'}
        </Badge>
        <Badge variant="secondary" className="absolute top-3 right-3">
          {d.labelAfter || 'Después'}
        </Badge>
      </div>
      <Slider
        value={[pos]}
        min={0}
        max={100}
        aria-label="Comparar antes y después"
        onValueChange={(valor) => setPos(Array.isArray(valor) ? (valor[0] ?? 50) : (valor as number))}
      />
    </div>
  )
}

function MapaInteractivo() {
  const { d, modo } = useDiapo()
  const regiones = d.regions ?? []
  const [activa, setActiva] = useState(0)
  const actual = regiones[activa] ?? regiones[0]
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_210px] gap-3">
        <div className="relative overflow-hidden rounded-xl border bg-muted">
          {regiones.map((r, i) => (
            <div key={r.id || i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.x}%`, top: `${r.y}%` }}>
              <Button size="sm" variant={i === activa ? 'default' : 'outline'} onClick={modo === 'miniatura' ? undefined : () => setActiva(i)} aria-pressed={i === activa}>
                <HugeiconsIcon icon={MapsLocation01Icon} size={14} />
                {r.title}
              </Button>
            </div>
          ))}
        </div>
        {actual ? (
          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              <T ruta={['regions', activa, 'title']} v={actual.title} weight="semibold" />
              <T ruta={['regions', activa, 'body']} v={actual.body} size="sm" className="text-muted-foreground" />
            </CardContent>
          </Card>
        ) : null}
      </div>
      <Instruccion>Haz clic en cada región del mapa para explorar sus detalles.</Instruccion>
    </div>
  )
}

// ── Tipos: organización del contenido ────────────────────────────────────────────────────────────────────────────

function Acordeon() {
  const { d } = useDiapo()
  return (
    <div className="flex size-full flex-col gap-4 p-10">
      <Titulo />
      <Accordion defaultValue={['0']} className="min-h-0 flex-1">
        {(d.items ?? []).map((item, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>
              <T ruta={['items', i, 'body']} v={item.body} size="sm" className="text-muted-foreground" />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Instruccion>Pulsa cada encabezado para expandir o colapsar el contenido.</Instruccion>
    </div>
  )
}

function Pestanas() {
  const { d } = useDiapo()
  const pestanas = d.tabs ?? []
  return (
    <div className="flex size-full flex-col gap-4 p-10">
      <Titulo />
      <Tabs defaultValue="0" className="min-h-0 flex-1">
        <TabsList>
          {pestanas.map((p, i) => (
            <TabsTrigger key={i} value={String(i)}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {pestanas.map((p, i) => (
          <TabsContent key={i} value={String(i)} className="pt-3">
            <T ruta={['tabs', i, 'body']} v={p.body} size="lg" className="text-muted-foreground" />
          </TabsContent>
        ))}
      </Tabs>
      <Instruccion>Usa las pestañas superiores para cambiar de vista.</Instruccion>
    </div>
  )
}

function Tarjetas() {
  const { d, a, modo } = useDiapo()
  const [volteadas, setVolteadas] = useState<number[]>([])
  const alternar = (i: number) => setVolteadas((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))
  return (
    <div className="flex size-full flex-col gap-4 p-10">
      <Titulo />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {(d.cards ?? []).map((c, i) => {
          const volteada = volteadas.includes(i)
          const interactiva = modo !== 'miniatura'
          return (
            // La tarjeta **gira de verdad**: antes solo se cambiaba el contenido de la caja, así que no se percibía
            // ningún volteo y además la caja crecía o se encogía con el largo del texto de cada cara. Ahora las dos
            // caras se apilan ocupando lo mismo —el alto lo manda la cuadrícula, no el texto— y lo que se mueve es
            // la tarjeta entera (Dave, 7-oct).
            //
            // **La perspectiva va en cada tarjeta, no en la cuadrícula.** Puesta en el contenedor, el punto de fuga
            // queda en su centro y las tarjetas de los lados se proyectan torcidas al girar: se salen de su sitio y
            // cambian de tamaño. Con una perspectiva por tarjeta, cada una gira sobre su propio eje.
            <div
              key={i}
              role={interactiva ? 'button' : undefined}
              tabIndex={interactiva ? 0 : undefined}
              aria-pressed={interactiva ? volteada : undefined}
              aria-label={interactiva ? `Voltear la tarjeta ${i + 1}` : undefined}
              onClick={
                interactiva
                  ? (e) => {
                      // Editando, el clic sobre el texto es para escribir, no para voltear: si no, la tarjeta se da
                      // la vuelta y esconde justo lo que se estaba escribiendo.
                      if ((e.target as HTMLElement).closest('[contenteditable]')) return
                      alternar(i)
                    }
                  : undefined
              }
              onKeyDown={
                interactiva
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        alternar(i)
                      }
                    }
                  : undefined
              }
              className={cn(
                'relative min-h-0 rounded-xl perspective-[900px] outline-none',
                interactiva && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <div
                className={cn(
                  'relative size-full transform-3d transition-transform duration-500 ease-out',
                  volteada && 'rotate-y-180',
                )}
              >
                {/* Cada cara tapa a la otra: `backface-hidden` esconde la que queda de espaldas a mitad del giro. */}
                <Cara>
                  {/* Sin pista por tarjeta: la instrucción de abajo ya dice que se voltean, y repetirla en cada una
                      sobraba (Dave, 7-oct). */}
                  <T ruta={['cards', i, 'front']} v={c.front} h={4} className={a.texto} />
                </Cara>
                {/* El reverso con otro fondo —el acento suave— para que se note de un vistazo cuál ya se volteó. */}
                <Cara className={cn('rotate-y-180', a.suave, a.borde)}>
                  <T ruta={['cards', i, 'back']} v={c.back} size="sm" />
                </Cara>
              </div>
            </div>
          )
        })}
      </div>
      <Instruccion>Toca cada tarjeta para voltearla y ver la respuesta.</Instruccion>
    </div>
  )
}

/** Una cara de la tarjeta: ocupa toda la caja y se esconde cuando queda de espaldas. */
function Cara({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-card absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-4 text-center backface-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

function LineaTiempo() {
  const { d } = useDiapo()
  const items = d.items ?? []
  return (
    <div className="flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-10 pt-9 pb-6">
        <Titulo />
        <Timeline orientation="horizontal" value={items.length} className="mt-2">
          {items.map((item, i) => (
            <TimelineItem key={i} step={i + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{item.label}</TimelineDate>
                <TimelineTitle>{item.title}</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>
                <T ruta={['items', i, 'body']} v={item.body} size="sm" className="text-muted-foreground" />
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
      {d.image ? (
        <div className="h-[28%] shrink-0 overflow-hidden">
          <Foto src={d.image} />
        </div>
      ) : null}
    </div>
  )
}

// ── Tipos: evaluación y gamificación ─────────────────────────────────────────────────────────────────────────────

/** A partir de aquí se da por buena la tanda y sale el confeti; por debajo se invita a repasar. */
const QUIZ_APRUEBA = 80

function QuizOpciones() {
  const { d, modo } = useDiapo()
  const preguntas = d.questions ?? []
  const [indice, setIndice] = useState(0)
  const [elegida, setElegida] = useState<string>('')
  const [revisada, setRevisada] = useState(false)
  const [aciertos, setAciertos] = useState(0)
  const [fin, setFin] = useState(false)
  const pregunta = preguntas[indice]

  const reiniciar = () => {
    setIndice(0)
    setElegida('')
    setRevisada(false)
    setAciertos(0)
    setFin(false)
  }

  if (!pregunta) return null
  const correcta = Number(elegida) === pregunta.correctIndex

  // **El creador no juega al quiz, lo escribe.** En el editor se ven **todas** las preguntas a la vez, con sus
  // opciones y cuál es la correcta; el recorrido de una en una, con su veredicto, es lo que vive el colaborador
  // (Dave, 7-oct).
  if (modo === 'edicion') return <QuizEditor />

  // **El quiz no retiene a nadie.** Se responde, se ve el resultado y se sigue adelante con la navegación de la
  // presentación —o se repite—. Nada de aquí bloquea el avance (Dave, 7-oct).
  if (fin) return <ResultadoQuiz aciertos={aciertos} total={preguntas.length} onReintentar={reiniciar} />

  return (
    // Una pregunta a la vez y **todo el lienzo para ella**: antes ocupaba media diapositiva, con el texto pequeño
    // arriba y un claro enorme debajo. Ahora la pregunta va centrada y en grande, y las opciones son tarjetas que se
    // pueden tocar, no un radio diminuto con su etiqueta al lado (Dave, 7-oct).
    <div className="flex size-full flex-col gap-3 px-10 py-7">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Titulo nivel={4} className="text-muted-foreground" />
        <Badge variant="secondary">{`Pregunta ${Math.min(indice + 1, preguntas.length)} de ${preguntas.length}`}</Badge>
      </div>

      {/* `overflow-y-auto`: con una pregunta larga y varias opciones, el bloque se desplaza por dentro en vez de
          salirse por arriba y por abajo, que era lo que lo hacía pisar el título y el botón (Dave, 7-oct). */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto">
        <T ruta={['questions', indice, 'question']} v={pregunta.question} h={3} className="text-balance" />
        <div className="flex shrink-0 flex-col gap-2" role="group" aria-label="Opciones de respuesta">
          {pregunta.options.map((opcion, i) => {
            const esta = Number(elegida) === i
            const esCorrecta = i === pregunta.correctIndex
            return (
              <button
                key={i}
                type="button"
                disabled={revisada || modo === 'miniatura'}
                aria-pressed={esta}
                onClick={() => setElegida(String(i))}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
                  'disabled:cursor-default',
                  !revisada && 'hover:border-primary/60 cursor-pointer',
                  esta && !revisada && 'border-primary bg-primary/5',
                  !esta && !revisada && 'border-border bg-card',
                  // Al comprobar se marca la correcta siempre, y en rojo solo la que se eligió por error: así se
                  // aprende cuál era, no solo que se falló.
                  revisada && esCorrecta && 'border-success bg-success/10',
                  revisada && esta && !esCorrecta && 'border-destructive bg-destructive/10',
                  revisada && !esCorrecta && !esta && 'border-border bg-card opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-medium',
                    esta && !revisada ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    revisada && esCorrecta && 'bg-success text-background',
                    revisada && esta && !esCorrecta && 'bg-destructive text-background',
                  )}
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <Text as="span">{opcion}</Text>
                {revisada && esCorrecta ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} aria-hidden="true" className="text-success ml-auto shrink-0" />
                ) : null}
              </button>
            )
          })}
        </div>
        {revisada ? (
          <Text size="sm" className={cn('font-medium', correcta ? 'text-success' : 'text-destructive')} role="status">
            {correcta ? '¡Correcto!' : `La respuesta correcta es: ${pregunta.options[pregunta.correctIndex]}`}
          </Text>
        ) : null}
      </div>

      <div className="flex shrink-0 justify-end">
        {revisada ? (
          <Button
            onClick={() => {
              if (indice + 1 >= preguntas.length) setFin(true)
              else {
                setIndice(indice + 1)
                setElegida('')
                setRevisada(false)
              }
            }}
          >
            {indice + 1 >= preguntas.length ? 'Ver resultado' : 'Siguiente pregunta'}
          </Button>
        ) : (
          <Button
            disabled={elegida === ''}
            onClick={() => {
              setRevisada(true)
              if (correcta) setAciertos((n) => n + 1)
            }}
          >
            Comprobar
          </Button>
        )}
      </div>
    </div>
  )
}

/** Una pregunta recién creada: la estructura puesta, el contenido lo escribe quien crea. */
function preguntaNueva() {
  return { question: 'Escribe aquí la pregunta', options: ['Primera opción', 'Segunda opción', 'Tercera opción'], correctIndex: 0 }
}

/**
 * El quiz **en el editor**: la lista completa de preguntas, cada una con su enunciado, sus opciones y el punto que
 * marca cuál es la correcta. Nada de comprobar ni de puntuación: aquí no se responde, se arma.
 */
function QuizEditor() {
  const { d, cambiar } = useDiapo()
  const preguntas = d.questions ?? []

  return (
    <div className="flex size-full flex-col gap-3 px-10 py-7">
      <Titulo nivel={4} />
      {/* La lista se desplaza dentro de la diapositiva: un quiz puede tener más preguntas de las que caben. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {preguntas.map((pregunta, qi) => (
          <section key={qi} className={cn('flex flex-col gap-2', qi > 0 && 'border-t pt-4')}>
            <div className="flex items-center justify-between gap-2">
              <Text as="span" size="xs" weight="medium" variant="muted">
                Pregunta {qi + 1} de {preguntas.length}
              </Text>
              {preguntas.length > 1 ? (
                <BotonIcono
                  aria-label={`Eliminar la pregunta ${qi + 1}`}
                  onClick={() => cambiar(['questions'], preguntas.filter((_, i) => i !== qi))}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </BotonIcono>
              ) : null}
            </div>
            <T ruta={['questions', qi, 'question']} v={pregunta.question} weight="medium" />
            {/* El punto marca la respuesta correcta; el texto de al lado se edita como cualquier otro de la
                diapositiva. Así se ve de un vistazo cuál es, sin abrir ningún panel. */}
            <RadioGroup
              value={String(pregunta.correctIndex)}
              onValueChange={(v) => cambiar(['questions', qi, 'correctIndex'], Number(v))}
              className="gap-1.5"
            >
              {pregunta.options.map((opcion, oi) => (
                <div key={oi} className="flex items-center gap-2.5">
                  <RadioGroupItem value={String(oi)} id={`${d.id}-e${qi}-o${oi}`} aria-label={`Marcar como correcta la opción ${oi + 1}`} />
                  <T ruta={['questions', qi, 'options', oi]} v={opcion} as="span" size="sm" />
                </div>
              ))}
            </RadioGroup>
          </section>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 self-start"
        onClick={() => cambiar(['questions'], [...preguntas, preguntaNueva()])}
      >
        <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
        Agregar pregunta
      </Button>
    </div>
  )
}

/**
 * El cierre del quiz: la puntuación en grande, qué significa y cómo seguir. **No es una evaluación**: no aprueba ni
 * reprueba nada, así que lo único que hace es decirle cómo le fue y recordarle que puede repetirlo o seguir con la
 * presentación. Con una buena tanda sale confeti, que es la celebración que ya usa el playground.
 */
function ResultadoQuiz({ aciertos, total, onReintentar }: { aciertos: number; total: number; onReintentar: () => void }) {
  const { modo } = useDiapo()
  const porcentaje = total > 0 ? Math.round((aciertos * 100) / total) : 0
  const bien = porcentaje >= QUIZ_APRUEBA
  const regular = porcentaje >= 60
  const marca = useRef<HTMLDivElement>(null)

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 px-10 py-8 text-center" role="status">
      <div ref={marca} className="flex flex-col items-center gap-1">
        <Text as="span" size="xs" weight="medium" variant="muted">
          Puntuación
        </Text>
        <Text
          as="span"
          className={cn('text-6xl leading-none font-bold tabular-nums', bien ? 'text-success' : regular ? 'text-warning' : 'text-destructive')}
        >
          {aciertos}/{total}
        </Text>
      </div>
      <Heading as="h3" level={4}>
        {bien ? '¡Buen resultado!' : regular ? 'Vas por buen camino' : 'Revisa las preguntas'}
      </Heading>
      <Text size="sm" variant="muted" className="max-w-[40ch] text-balance">
        Acertaste el {porcentaje} %. Puedes repetir el quiz o seguir con la presentación: esto no te detiene.
      </Text>
      <Button variant="outline" className="mt-1" onClick={onReintentar}>
        <HugeiconsIcon icon={RefreshIcon} size={16} aria-hidden="true" />
        Repetir el quiz
      </Button>
      {/* Solo para quien estudia: en el editor, repasando diapositivas, la celebración sobraría. */}
      {bien && modo === 'vista' ? <Confeti ancla={marca} /> : null}
    </div>
  )
}

function VerdaderoFalso() {
  const { d } = useDiapo()
  const [respuesta, setRespuesta] = useState<boolean | null>(null)
  const bien = respuesta === Boolean(d.isTrue)
  return (
    <div className="flex size-full flex-col justify-center gap-5 p-12">
      <Titulo />
      <T ruta={['statement']} v={d.statement} h={4} className="font-medium" />
      <div className="flex gap-3">
        {[true, false].map((valor) => (
          <Button
            key={String(valor)}
            variant={respuesta === valor ? 'default' : 'outline'}
            className="flex-1"
            disabled={respuesta !== null}
            onClick={() => setRespuesta(valor)}
          >
            {valor ? 'Verdadero' : 'Falso'}
          </Button>
        ))}
      </div>
      {respuesta !== null ? (
        <Resultado bien={bien} titulo={bien ? '¡Correcto!' : 'Respuesta incorrecta'} onReintentar={() => setRespuesta(null)}>
          {d.explanation}
        </Resultado>
      ) : null}
      <Instruccion>Selecciona Verdadero o Falso para comprobar tu respuesta.</Instruccion>
    </div>
  )
}

function RellenarEspacios() {
  const { d } = useDiapo()
  const palabras = (d.options ?? []).filter((o): o is string => typeof o === 'string')
  const [elegida, setElegida] = useState<string | null>(null)
  const [revisada, setRevisada] = useState(false)
  const bien = elegida === d.blankValue
  return (
    <div className="flex size-full flex-col justify-center gap-5 p-12">
      <Titulo />
      <Text size="xl" className="leading-relaxed">
        <T ruta={['textBefore']} v={d.textBefore} as="span" size="xl" />{' '}
        <Badge variant={elegida ? 'primary-light' : 'outline'} size="lg" className="mx-1 min-w-28 justify-center align-middle">
          {elegida ?? '________'}
        </Badge>{' '}
        <T ruta={['textAfter']} v={d.textAfter} as="span" size="xl" />
      </Text>
      <div className="flex flex-wrap gap-2">
        {palabras.map((p) => (
          <Button key={p} size="sm" variant={elegida === p ? 'secondary' : 'outline'} disabled={revisada} onClick={() => setElegida(p)}>
            {p}
          </Button>
        ))}
      </div>
      {revisada ? (
        <Resultado
          bien={bien}
          titulo={bien ? '¡Correcto!' : 'Respuesta incorrecta'}
          onReintentar={() => {
            setElegida(null)
            setRevisada(false)
          }}
        >
          {d.explanation}
        </Resultado>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" disabled={!elegida} onClick={() => setRevisada(true)}>
            Comprobar
          </Button>
        </div>
      )}
    </div>
  )
}

function Emparejamiento() {
  const { d } = useDiapo()
  const izquierda = d.left ?? []
  const derecha = useMemo(() => d.right ?? [], [d.right])
  const orden = useMemo(() => mezclar(derecha.map((_, i) => i), 7), [derecha])
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [parejas, setParejas] = useState<Record<number, number>>({})
  const [revisada, setRevisada] = useState(false)
  const correctas = (d.pairs ?? []).filter(([l, r]) => parejas[l] === r).length
  const numeroDe = (r: number) => {
    const l = Object.entries(parejas).find(([, v]) => v === r)?.[0]
    return l == null ? null : Number(l) + 1
  }
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <Titulo />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex flex-col gap-2">
          {izquierda.map((texto, l) => (
            <Button
              key={l}
              size="sm"
              variant={seleccion === l ? 'default' : parejas[l] != null ? 'secondary' : 'outline'}
              className="h-auto! justify-start py-1.5 text-left whitespace-normal"
              disabled={revisada}
              onClick={() => setSeleccion(l)}
            >
              <Badge variant="outline" size="xs">
                {l + 1}
              </Badge>
              {texto}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {orden.map((r) => {
            const n = numeroDe(r)
            return (
              <Button
                key={r}
                size="sm"
                variant={n != null ? 'secondary' : 'outline'}
                className="h-auto! justify-start py-1.5 text-left whitespace-normal"
                disabled={revisada || seleccion == null}
                onClick={() => {
                  if (seleccion == null) return
                  setParejas((p) => {
                    const sin = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== r)) as Record<number, number>
                    return { ...sin, [seleccion]: r }
                  })
                  setSeleccion(null)
                }}
              >
                {n != null ? (
                  <Badge variant="primary-light" size="xs">
                    {n}
                  </Badge>
                ) : null}
                {derecha[r]}
              </Button>
            )
          })}
        </div>
      </div>
      {revisada ? (
        <Resultado
          bien={correctas === izquierda.length}
          titulo={`${correctas} de ${izquierda.length} parejas correctas`}
          onReintentar={() => {
            setParejas({})
            setRevisada(false)
          }}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Instruccion>Selecciona un concepto a la izquierda y luego su pareja a la derecha.</Instruccion>
          <Button size="sm" className="ml-auto" disabled={Object.keys(parejas).length < izquierda.length} onClick={() => setRevisada(true)}>
            Verificar
          </Button>
        </div>
      )}
    </div>
  )
}

function OrdenarSecuencia() {
  const { d } = useDiapo()
  const items = useMemo(() => d.items ?? [], [d.items])
  const inicial = useMemo(() => mezclar(items.map((_, i) => i), 11), [items])
  // La diapositiva se remonta al cambiar de tipo o de id, así que el orden inicial basta.
  const [orden, setOrden] = useState(inicial)
  const [revisada, setRevisada] = useState(false)
  const bien = orden.every((idx, pos) => idx === pos)
  const mover = (pos: number, paso: number) =>
    setOrden((o) => {
      const siguiente = [...o]
      ;[siguiente[pos], siguiente[pos + paso]] = [siguiente[pos + paso], siguiente[pos]]
      return siguiente
    })
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {orden.map((idx, pos) => (
          <Item key={idx} variant="outline" size="xs">
            <ItemMedia>
              <Badge variant="secondary" size="xs">
                {pos + 1}
              </Badge>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="font-normal">{items[idx]?.text}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <BotonIcono size="icon-xs" aria-label="Subir" disabled={revisada || pos === 0} onClick={() => mover(pos, -1)}>
                <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
              </BotonIcono>
              <BotonIcono size="icon-xs" aria-label="Bajar" disabled={revisada || pos === orden.length - 1} onClick={() => mover(pos, 1)}>
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </BotonIcono>
            </ItemActions>
          </Item>
        ))}
      </div>
      {revisada ? (
        <Resultado
          bien={bien}
          titulo={bien ? '¡Secuencia correcta!' : 'La secuencia no es correcta'}
          onReintentar={() => {
            setOrden(inicial)
            setRevisada(false)
          }}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Instruccion>Usa las flechas para reordenar los elementos y luego verifica la secuencia.</Instruccion>
          <Button size="sm" className="ml-auto" onClick={() => setRevisada(true)}>
            Verificar
          </Button>
        </div>
      )}
    </div>
  )
}

function Clasificar() {
  const { d, a, modo } = useDiapo()
  const items = d.items ?? []
  const categorias = d.categories ?? []
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [ubicados, setUbicados] = useState<Record<number, string>>({})
  const [revisada, setRevisada] = useState(false)
  const correctos = items.filter((it, i) => ubicados[i] === it.category).length
  const sueltos = items.map((_, i) => i).filter((i) => ubicados[i] == null)
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex flex-col gap-1">
        <Titulo />
        <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-2">
        {sueltos.map((i) => (
          <Button key={i} size="xs" variant={seleccion === i ? 'default' : 'outline'} className="h-auto! py-1 whitespace-normal" onClick={() => setSeleccion(i)}>
            {items[i]?.text}
          </Button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        {categorias.map((c) => {
          const activa = seleccion != null && modo !== 'miniatura'
          return (
            <Card
              key={c.id}
              size="sm"
              role={activa ? 'button' : undefined}
              tabIndex={activa ? 0 : undefined}
              aria-label={activa ? `Ubicar en ${c.label}` : undefined}
              className={cn('gap-2!', activa && cn('cursor-pointer border-dashed', a.borde))}
              onClick={
                activa
                  ? () => {
                      setUbicados((u) => ({ ...u, [seleccion]: c.id }))
                      setSeleccion(null)
                    }
                  : undefined
              }
            >
              <CardContent className="flex flex-col gap-2">
                <Text weight="semibold">{c.label}</Text>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((it, i) =>
                    ubicados[i] === c.id ? (
                      <Badge
                        key={i}
                        variant={revisada ? (it.category === c.id ? 'success-light' : 'destructive-outline') : 'secondary'}
                        className="h-auto! py-0.5 whitespace-normal"
                      >
                        {it.text}
                      </Badge>
                    ) : null,
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {revisada ? (
        <Resultado
          bien={correctos === items.length}
          titulo={`${correctos} de ${items.length} elementos bien clasificados`}
          onReintentar={() => {
            setUbicados({})
            setRevisada(false)
          }}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Instruccion>Haz clic en un elemento y luego en la categoría donde debe ir.</Instruccion>
          <Button size="sm" className="ml-auto" disabled={sueltos.length > 0} onClick={() => setRevisada(true)}>
            Verificar
          </Button>
        </div>
      )}
    </div>
  )
}

function EscenarioRamificado() {
  const { d } = useDiapo()
  const opciones = d.choices ?? []
  const [elegida, setElegida] = useState<number | null>(null)
  const resultado = elegida != null ? opciones[elegida] : undefined
  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <Titulo />
      <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      {resultado ? (
        <Alert variant={resultado.isOptimal ? 'success' : 'warning'}>
          <HugeiconsIcon icon={resultado.isOptimal ? CheckmarkCircle02Icon : Alert02Icon} aria-hidden="true" />
          <AlertTitle>{resultado.outcomeTitle}</AlertTitle>
          <AlertDescription>
            <p>{resultado.outcomeBody}</p>
          </AlertDescription>
          <div className="col-start-2 mt-2">
            <Button variant="outline" size="xs" onClick={() => setElegida(null)}>
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              Probar otra opción
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="flex flex-col gap-2">
          {opciones.map((o, i) => (
            <Button key={i} variant="outline" className="h-auto! justify-start py-2.5 text-left whitespace-normal" onClick={() => setElegida(i)}>
              <T ruta={['choices', i, 'text']} v={o.text} as="span" size="sm" />
            </Button>
          ))}
        </div>
      )}
      <Instruccion>Elige una opción para ver la consecuencia de tu decisión.</Instruccion>
    </div>
  )
}

function RetoGamificado() {
  const { d, modo } = useDiapo()
  const total = d.timeSeconds ?? 30
  const opciones = (d.options ?? []).filter((o): o is OpcionReto => typeof o === 'object' && o != null)
  const [jugada, setJugada] = useState<'inicio' | 'jugando' | 'bien' | 'mal'>('inicio')
  const [quedan, setQuedan] = useState(total)
  // Sin tiempo, la jugada se da por perdida.
  const estado = jugada === 'jugando' && quedan === 0 ? 'tiempo' : jugada

  useEffect(() => {
    if (estado !== 'jugando') return
    const id = window.setInterval(() => setQuedan((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [estado])

  const empezar = () => {
    setQuedan(total)
    setJugada('jugando')
  }

  return (
    <div className="flex size-full flex-col gap-3 p-10">
      <div className="flex items-center justify-between gap-3">
        <Titulo />
        <div className="flex shrink-0 gap-2">
          <Badge variant="secondary" className="gap-1 tabular-nums">
            <HugeiconsIcon icon={Timer02Icon} size={12} aria-hidden="true" />
            {`${estado === 'jugando' ? quedan : total} s`}
          </Badge>
          <Badge variant="primary-light">{`${d.scorePoints ?? 100} puntos`}</Badge>
        </div>
      </div>
      <T ruta={['body']} v={d.body} size="sm" className="text-muted-foreground" />
      {estado === 'jugando' ? <Progress value={(quedan / total) * 100} aria-label="Tiempo restante" /> : null}
      <T ruta={['challenge']} v={d.challenge} h={4} />
      {estado === 'inicio' ? (
        <div className="flex flex-col items-start gap-2">
          {modo === 'edicion' ? (
            <div className="flex w-full flex-col gap-1.5">
              {opciones.map((o, i) => (
                <T key={i} ruta={['options', i, 'text']} v={`${o.correct ? '✓' : '•'} ${o.text}`} size="sm" className="text-muted-foreground" />
              ))}
            </div>
          ) : null}
          <Button size="sm" onClick={empezar}>
            Empezar reto
          </Button>
        </div>
      ) : estado === 'jugando' ? (
        <div className="flex flex-col gap-2">
          {opciones.map((o, i) => (
            <Button key={i} variant="outline" className="h-auto! justify-start py-2 text-left whitespace-normal" onClick={() => setJugada(o.correct ? 'bien' : 'mal')}>
              {o.text}
            </Button>
          ))}
        </div>
      ) : (
        <Resultado
          bien={estado === 'bien'}
          titulo={estado === 'bien' ? `¡Reto superado! +${d.scorePoints ?? 100} puntos` : estado === 'tiempo' ? 'Se acabó el tiempo' : 'Respuesta incorrecta'}
          onReintentar={empezar}
        >
          {estado === 'bien' ? null : `La respuesta correcta es: ${opciones.find((o) => o.correct)?.text ?? ''}`}
        </Resultado>
      )}
    </div>
  )
}

// ── Tipo: lienzo libre ───────────────────────────────────────────────────────────────────────────────────────────

function LienzoLibre() {
  const { d, a } = useDiapo()
  return (
    <ConImagen>
      <T ruta={['subtitle']} v={d.subtitle} size="sm" weight="semibold" className={cn('tracking-wide uppercase', a.texto)} />
      <Titulo nivel={2} />
      <T ruta={['body']} v={d.body} size="lg" className="text-muted-foreground" />
    </ConImagen>
  )
}

const POR_TIPO: Record<string, () => ReactNode> = {
  intro: Portada,
  section: Seccion,
  title_only: Afirmacion,
  main_point: PuntoPrincipal,
  agenda: Agenda,
  summary: Resumen,
  content: Vinetas,
  steps: ListaOrdenada,
  one_column: UnaColumna,
  two_columns: DosColumnas,
  quote: Cita,
  keypoint: DatoClave,
  big_number: NumeroGrande,
  split: TextoImagen,
  caption: ImagenLeyenda,
  compare: Comparativa,
  media: ImagenInteractiva,
  slider: AntesDespues,
  map: MapaInteractivo,
  accordion: Acordeon,
  tabs: Pestanas,
  flashcards: Tarjetas,
  timeline: LineaTiempo,
  quiz_mc: QuizOpciones,
  quiz_tf: VerdaderoFalso,
  quiz_fill: RellenarEspacios,
  match: Emparejamiento,
  sort: OrdenarSecuencia,
  dragdrop: Clasificar,
  branching: EscenarioRamificado,
  game: RetoGamificado,
  blank: LienzoLibre,
}

// ── Diapositiva ──────────────────────────────────────────────────────────────────────────────────────────────────

type Props = {
  diapositiva: DatosDiapositiva
  /** Color de la presentación: un token del tema (ACENTOS) o un hex libre. */
  acento?: string
  logo?: string | null
  modo?: ModoDiapositiva
  /** Edición en el sitio: la diapositiva con el texto cambiado. */
  onCambio?: (siguiente: DatosDiapositiva) => void
  /** Agenda: saltar a otra diapositiva (índice desde 0). */
  onIrA?: (indice: number) => void
}

/** El contenido de una diapositiva sobre el lienzo de 720 × 450. Va dentro de `LienzoDiapositiva`. */
export function Diapositiva({ diapositiva, acento, logo = null, modo = 'vista', onCambio, onIrA }: Props) {
  const Tipo = POR_TIPO[diapositiva.type] ?? LienzoLibre
  const valor = useMemo<Contexto>(
    () => ({
      d: diapositiva,
      a: buscarAcento(acento),
      modo,
      logo,
      irA: onIrA,
      cambiar: (ruta, valor) => onCambio?.(conValor(diapositiva, ruta, valor) as DatosDiapositiva),
    }),
    [diapositiva, acento, modo, logo, onIrA, onCambio],
  )
  return (
    <Ctx.Provider value={valor}>
      <div
        className={cn('size-full overflow-hidden bg-card text-card-foreground', modo === 'miniatura' && 'pointer-events-none select-none')}
        // Con un color libre, sus variables: las clases del acento las leen (ver color-libre).
        style={estiloColorLibre(acento)}
        inert={modo === 'miniatura' || undefined}
        aria-hidden={modo === 'miniatura' || undefined}
      >
        {/* La clave remonta las actividades (quiz, retos…) cuando cambia de diapositiva o de tipo. */}
        <Tipo key={`${diapositiva.id ?? ''}-${diapositiva.type}`} />
      </div>
    </Ctx.Provider>
  )
}

/** Miniatura estática de una diapositiva (rail del editor, borrador de estructura). */
export function MiniaturaDiapositiva({ diapositiva, acento, logo, className }: { diapositiva: DatosDiapositiva; acento?: string; logo?: string | null; className?: string }) {
  return (
    <LienzoDiapositiva className={cn('rounded-lg', className)}>
      <Diapositiva diapositiva={diapositiva} acento={acento} logo={logo} modo="miniatura" />
    </LienzoDiapositiva>
  )
}
