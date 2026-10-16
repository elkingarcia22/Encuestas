import { Link } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Cursor01Icon,
  PaintBoardIcon,
  PaletteIcon,
  PuzzleIcon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { EncabezadoPatron, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Empezar › Cómo usar el sistema: las reglas del playground (AGENTS.md / CLAUDE.md) contadas para diseño, con
// enlaces a la página del sistema que resuelve cada una.

type Regla5 = { titulo: string; detalle: string; icono: IconSvgElement; enlace: { texto: string; ruta: string } }

const CINCO: Regla5[] = [
  { titulo: 'Todo sale de flux-ui', detalle: 'Botones, tablas, formularios, avisos: todo es de la librería. Si algo no existe, se pregunta antes de inventarlo.', icono: PuzzleIcon, enlace: { texto: 'Ver todos los componentes', ruta: '/design-system/componentes' } },
  { titulo: 'Iconos de Hugeicons', detalle: 'Se buscan por concepto en español y van dentro de HugeiconsIcon. Nada de SVG pegados ni iconos de Figma.', icono: PaintBoardIcon, enlace: { texto: 'Ver iconos', ruta: '/design-system/icons' } },
  { titulo: 'Colores y letra del tema', detalle: 'Solo clases del tema (bg-primary, text-muted-foreground) y la tipografía que ya trae la librería.', icono: PaletteIcon, enlace: { texto: 'Ver color', ruta: '/design-system/color' } },
  { titulo: 'Las piezas se ven como vienen', detalle: 'Las clases sirven para acomodar (ancho, márgenes, orden), no para cambiar colores, bordes ni esquinas.', icono: Cursor01Icon, enlace: { texto: 'Ver botones', ruta: '/design-system/botones' } },
  { titulo: 'Se cierra con la validación', detalle: 'Antes de decir que algo está listo se corre npm run check. Si falla, se arregla; no se desactiva.', icono: TaskDone01Icon, enlace: { texto: 'Ver el flujo', ruta: '/design-system/flujo-de-trabajo' } },
]

const DONDE: Regla[] = [
  { titulo: 'Tu pantalla, libre', detalle: 'Todo lo que está en src/modules/<módulo>/<pantalla>/ se crea y se edita sin pedir permiso.' },
  { titulo: 'El menú, con cuidado', detalle: 'src/shared/layouts/nav-config.ts se toca solo para sumar una pantalla a la barra lateral.' },
  { titulo: 'El resto, con ingeniería', detalle: 'Router, marco, tema (index.css), configuración y scripts. La validación avisa si se tocaron.' },
]

const IA: Regla[] = [
  { titulo: 'Pídelo en español y por lo que se ve', detalle: '«Una tabla de usuarios con filtro por área y acciones masivas», no «un DataGrid con columnas».' },
  { titulo: 'La IA ya conoce las reglas', detalle: 'Claude, Cursor, Gemini y Codex leen las mismas reglas y la lista de componentes del proyecto.' },
  { titulo: 'Si la librería no responde', detalle: 'Casi siempre caducó el acceso (dura unas 12 horas): corre npm run aws-login y reinicia el editor.' },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Cómo usar el sistema" antetitulo="Design system · Empezar" etiqueta={<Badge variant="info-light">Primera vez</Badge>}>
        El playground sirve para armar pantallas rápido con la librería interna (flux-ui, basada en ReUI). Estas son las cinco
        reglas que sostienen todo, y dónde encontrar cada cosa en este sistema.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Las cinco reglas" description="Si una pantalla las cumple, se ve y se comporta como el resto del producto." />
        <ItemGroup className="grid gap-3 md:grid-cols-2">
          {CINCO.map((regla) => (
            <Item key={regla.titulo} variant="outline" className="items-start" render={<Link to={regla.enlace.ruta} />}>
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={regla.icono} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{regla.titulo}</ItemTitle>
                <ItemDescription>{regla.detalle}</ItemDescription>
                <Text as="span" size="sm" weight="medium">
                  {regla.enlace.texto}
                </Text>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reglas titulo="Dónde se trabaja" reglas={DONDE} />
        <Reglas titulo="Trabajar con la IA" reglas={IA} />
      </div>

    </div>
  )
}

Component.displayName = 'DesignSystemGetStartedPage'
