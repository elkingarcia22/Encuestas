import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowReloadHorizontalIcon,
  BookOpen01Icon,
  Camera01Icon,
  CloudUploadIcon,
  Exchange01Icon,
  FlowchartIcon,
  LinkSquare02Icon,
  PuzzleIcon,
  SearchVisualIcon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'

import { IconoIA } from '../ia/icono-ia'
import { EncabezadoPatron, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Empezar › Trabajar con la IA: qué sabe la IA de este proyecto y de dónde lo saca. Es la cara visible de lo que
// vive en ai-tools/ (catálogo, skills y avisos), en docs/plataforma-ubits/ (el producto y su mapa) y en las reglas
// del repo. Las cifras salen de esos mismos archivos; si cambian, se actualizan aquí.

type Skill = { nombre: string; icono: IconSvgElement; hace: string; cuando: string }

const SKILLS: Skill[] = [
  {
    nombre: 'Elegir componentes',
    icono: PuzzleIcon,
    hace: 'Busca en el catálogo qué pieza de la librería resuelve cada cosa y abre su ficha del Storybook antes de escribir nada.',
    cuando: 'Al maquetar cualquier pantalla. Es obligatoria.',
  },
  {
    nombre: 'Traer un bloque de ReUI',
    icono: Exchange01Icon,
    hace: 'Toma la composición de un bloque de reui.io como plantilla y cambia todas sus piezas por las nuestras.',
    cuando: 'Cuando pasas un enlace de reui.io o pides «esto, pero con nuestra librería».',
  },
  {
    nombre: 'Mantener el sistema al día',
    icono: ArrowReloadHorizontalIcon,
    hace: 'Cuando cambia una pieza general o una regla, actualiza la página del sistema que la documenta.',
    cuando: 'Al tocar el marco, los menús, el chat de Orbit o los tokens.',
  },
  {
    nombre: 'Revisar contra ReUI',
    icono: SearchVisualIcon,
    hace: 'Busca lo que se dibujó a mano pudiendo salir de la librería y documenta lo que sí hubo que forzar.',
    cuando: 'Antes de entregar una pantalla, o cuando pides «revisa esto».',
  },
  {
    nombre: 'Capturar pantallas',
    icono: Camera01Icon,
    hace: 'Levanta la vista previa, abre menús y diálogos, recorta solo la parte que importa y te manda las imágenes.',
    cuando: 'Cuando pides «muéstrame cómo quedó» o comparar antes y después.',
  },
  {
    nombre: 'Publicar en Vercel',
    icono: CloudUploadIcon,
    hace: 'Compila, publica y comprueba que el sitio responda, siempre en el mismo enlace público.',
    cuando: 'Cuando pides «subamos esto» o «pásame el enlace».',
  },
]

const AVISOS: Regla[] = [
  { titulo: 'Al abrir la sesión', detalle: 'Se revisa que el catálogo de la librería esté al día y que el acceso no haya caducado (dura unas 12 horas).' },
  { titulo: 'En cada pedido', detalle: 'Se le recuerda a la IA que toda la interfaz sale de la librería y que los colores son tokens del tema.' },
  { titulo: 'Antes de escribir un archivo', detalle: 'Se bloquea la escritura si aparece otra librería de interfaz o un icono que no sea de Hugeicons.' },
  { titulo: 'Al terminar', detalle: 'Se repasan los cambios de src/ y se avisa lo que quedó fuera de las reglas.' },
]

const REGLAS_REPO: Regla[] = [
  { titulo: 'AGENTS.md', detalle: 'Las reglas de la maqueta: qué librería, qué iconos, qué colores, qué no se toca y cómo se entrega. Las leen Cursor, Codex, Gemini y Claude.' },
  { titulo: 'CLAUDE.md', detalle: 'Además, para Claude: el mapa del repo, dónde está cada cosa, las trampas que ya nos costaron una tarde y cómo cerrar un trabajo.' },
  { titulo: 'Si algo no responde', detalle: 'Casi siempre caducó el acceso a la librería: se corre npm run aws-login y se reinicia el editor.' },
]

const DOCUMENTOS = [
  { titulo: 'Cómo funciona UBITS hoy', detalle: 'Los cinco marcos del producto, la navegación, la IA y los flujos de datos, escritos desde la plataforma real.' },
  { titulo: 'Historias de usuario', detalle: '42 historias con sus reglas de negocio y los textos literales de cada pantalla.' },
  { titulo: 'Hoy frente a lo especificado', detalle: 'Qué cambia entre la plataforma actual y el nuevo UBITS, y los hallazgos de cada revisión.' },
  { titulo: 'Recorridos', detalle: 'Los caminos completos de una persona por el producto, que son los que copiamos en las pantallas.' },
]

function TarjetaFuente({
  titulo,
  descripcion,
  cifras,
  accion,
  nota,
}: {
  titulo: string
  descripcion: string
  cifras: { valor: string; etiqueta: string }[]
  accion?: { texto: string; url: string }
  nota: string
}) {
  return (
    <Frame className="h-full">
      <FrameHeader>
        <FrameTitle>{titulo}</FrameTitle>
        <FrameDescription>{descripcion}</FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {cifras.map((cifra) => (
            <div key={cifra.etiqueta} className="flex flex-col gap-1">
              <Text as="span" size="xl" weight="semibold">
                {cifra.valor}
              </Text>
              <Text as="span" variant="muted" size="sm">
                {cifra.etiqueta}
              </Text>
            </div>
          ))}
        </div>
        <Text as="p" variant="muted" size="sm">
          {nota}
        </Text>
        {accion ? (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            nativeButton={false}
            render={<a href={accion.url} target="_blank" rel="noreferrer" />}
          >
            {accion.texto}
            <HugeiconsIcon icon={LinkSquare02Icon} aria-hidden="true" />
          </Button>
        ) : null}
      </FramePanel>
    </Frame>
  )
}

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron
        titulo="Trabajar con la IA"
        antetitulo="Design system · Empezar"
        etiqueta={<Badge variant="info-light">Cómo trabajamos</Badge>}
      >
        Las pantallas de este playground se arman con ayuda de la IA, y la IA no adivina: lee el catálogo de la
        librería, los documentos del producto y las reglas del equipo. Esto es todo lo que tiene a mano y de dónde
        sale cada cosa.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Lo que ya sabe hacer"
          description="Seis procedimientos escritos, que se activan solos según lo que pidas. No hay que nombrarlos."
        />
        <ItemGroup className="grid gap-3 md:grid-cols-2">
          {SKILLS.map((skill) => (
            <Item key={skill.nombre} variant="outline" className="items-start">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={skill.icono} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{skill.nombre}</ItemTitle>
                <ItemDescription>{skill.hace}</ItemDescription>
                <Text as="span" variant="muted" size="xs">
                  {skill.cuando}
                </Text>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="De dónde saca la información"
          description="Tres fuentes, todas dentro del repo: la librería, el producto y el mapa que las une."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <TarjetaFuente
            titulo="El catálogo de la librería"
            descripcion="Los componentes con los que se arma cualquier pantalla."
            cifras={[
              { valor: '89', etiqueta: 'componentes' },
              { valor: '0.5.5', etiqueta: 'versión de flux-ui' },
            ]}
            nota="Cada uno con sus variantes permitidas, para qué sirve en español y su ficha del Storybook. Se consulta sin conexión, así que funciona aunque el acceso a la librería esté caído."
            accion={{ texto: 'Abrir el Storybook', url: 'https://libraries-ui.dev.sandteck.com/flux-ui' }}
          />
          <TarjetaFuente
            titulo="El producto, escrito"
            descripcion="Cómo funciona UBITS hoy y qué se espera del nuevo."
            cifras={[
              { valor: '15', etiqueta: 'documentos' },
              { valor: '42', etiqueta: 'historias de usuario' },
            ]}
            nota="De aquí salen los textos, las columnas y las reglas de negocio de las pantallas: por eso una tabla dice lo mismo que la plataforma real y no algo inventado."
          />
          <TarjetaFuente
            titulo="El mapa del producto"
            descripcion="Las pantallas y piezas de UBITS y cómo se enlazan entre sí."
            cifras={[
              { valor: '362', etiqueta: 'pantallas y piezas' },
              { valor: '928', etiqueta: 'enlaces entre ellas' },
            ]}
            nota="Se armó leyendo los 15 documentos. Sirve para ver de dónde viene y a dónde lleva cada pantalla antes de maquetar un recorrido."
            accion={{ texto: 'Abrir el mapa', url: '/grafo/mapa-del-producto.html' }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Qué hay en los documentos del producto"
          description="Lo que conviene abrir antes de pedir una pantalla nueva."
        />
        <ItemGroup className="grid gap-3 md:grid-cols-2">
          {DOCUMENTOS.map((documento) => (
            <Item key={documento.titulo} variant="outline" className="items-start">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={BookOpen01Icon} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{documento.titulo}</ItemTitle>
                <ItemDescription>{documento.detalle}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reglas titulo="Los avisos automáticos" reglas={AVISOS} />
        <Reglas titulo="Dónde están las reglas" reglas={REGLAS_REPO} />
      </div>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Dónde vive todo esto"
          description="Por si alguien de ingeniería lo busca en el repositorio."
        />
        <ItemGroup className="grid gap-3 md:grid-cols-3">
          <Item variant="outline" className="items-start">
            <ItemMedia variant="icon">
              <IconoIA />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>ai-tools/</ItemTitle>
              <ItemDescription>El catálogo de la librería, los seis procedimientos y los avisos automáticos.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" className="items-start">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={BookOpen01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>docs/plataforma-ubits/</ItemTitle>
              <ItemDescription>Los documentos del producto y las historias de usuario.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" className="items-start">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={FlowchartIcon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>graphify-out/</ItemTitle>
              <ItemDescription>El mapa del producto, dentro de la misma carpeta de documentos.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </section>
    </div>
  )
}

Component.displayName = 'DesignSystemTrabajarConIaPage'
