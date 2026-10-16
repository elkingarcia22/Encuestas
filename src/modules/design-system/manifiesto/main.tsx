import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  AspectRatio,
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import heroImage from './assets/hero.webp'
import { EncabezadoPatron, SectionIntro } from '../patrones/piezas'

const VIDEO_ID = 'GLvFTMtw4Jk'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const VIDEO_THUMBNAIL = `https://img.youtube.com/vi/${VIDEO_ID}/mqdefault.jpg`

// Empezar › Manifiesto: por qué existe Bold+, el sistema de diseño de UBITS, y los cuatro principios que guían
// cómo el equipo (y la IA) diseña y construye interfaces.

const PRINCIPIOS = [
  {
    titulo: 'Ten un punto de vista',
    detalle:
      'Definimos qué es bueno para nuestros usuarios; la IA lo ejecuta, no lo decide. Es demasiado fácil delegarle las decisiones: reflexiona sobre los detalles grandes y pequeños.',
  },
  {
    titulo: 'El objetivo no es la pantalla, es el sistema',
    detalle:
      'Evitamos la degradación del sistema construyendo y escalando con intención, esto significa no dejar todo a la IA, es tomar decisiones en conjunto.',
  },
  {
    titulo: 'Terminado no es lo mismo que bueno',
    detalle:
      'El filtro de calidad debe ser constante y pasar por una revisión minuciosa del equipo. Cuidar los pequeños detalles es lo que determina un nivel de calidad alto.',
  },
  {
    titulo: 'Desata la creatividad y la maestría',
    detalle: 'Todo el mundo construye muy rápido; el reto es diferenciarse, no ser paisaje. Que las interfaces se sientan dinámicas y con alma.',
  },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Manifiesto" antetitulo="Design system · Empezar" etiqueta={<Badge variant="info-light">Manifiesto</Badge>}>
        Por qué existe BOLD+ y los cuatro principios que guían cómo diseñamos y construimos.
      </EncabezadoPatron>

      <AspectRatio ratio={21 / 9} className="max-h-[289px] overflow-hidden rounded-xl bg-muted">
        <img src={heroImage} alt="" className="size-full object-cover" />
      </AspectRatio>

      <div className="flex flex-col items-center gap-8 lg:flex-row">
        <section className="flex max-w-3xl flex-none flex-col gap-4">
          <Text variant="muted">
            Hoy cualquiera puede construir una interfaz en minutos. Esa facilidad trae un riesgo: productos que se ven iguales, que parecen
            terminados antes de estar bien resueltos y que no muestran interés por quien los usa.
          </Text>
          <Text variant="muted">
            BOLD+ es nuestra respuesta. Es el sistema de diseño que traduce el criterio de UBITS en reglas, patrones y flujos que pueden
            usar las personas, la IA y los agentes. Su objetivo es escalar nuestra intención, no solo mantener la consistencia: que cada
            pantalla, generada o diseñada, responda a una misma idea de lo que significa hacer una interfaz memorable para la compañía y
            para el usuario final.
          </Text>
        </section>

        <Separator orientation="vertical" className="hidden self-stretch lg:block" />

        <blockquote className="flex-1 scroll-m-20 text-2xl font-bold tracking-tight text-foreground">
          “Reflexiona sobre los detalles grandes y pequeños.”
        </blockquote>
      </div>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Nuestros 4 principios" description="Cada pantalla, flujo e interacción debe reflejarlos." />
        <div className="grid gap-4 md:grid-cols-2">
          {PRINCIPIOS.map((principio) => (
            <Card key={principio.titulo}>
              <CardHeader>
                <CardTitle>{principio.titulo}</CardTitle>
                <CardDescription>{principio.detalle}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Item variant="outline" render={<a href={VIDEO_URL} target="_blank" rel="noreferrer" />}>
        <ItemMedia
          variant="image"
          className="-my-3.5 -ml-4 h-22! w-40! shrink-0 self-stretch overflow-hidden rounded-md! bg-transparent p-2"
        >
          <img src={VIDEO_THUMBNAIL} alt="" className="size-full rounded-sm object-cover" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Cómo escalar la intención, la calidad y el arte con IA</ItemTitle>
          <ItemDescription>Nuestro manifiesto es inspirado del pitch de Katie Dill, Head of Design, Stripe.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </ItemActions>
      </Item>
    </div>
  )
}

Component.displayName = 'DesignSystemManifiestoPage'
