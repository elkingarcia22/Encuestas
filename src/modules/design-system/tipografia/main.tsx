import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { Demo, EncabezadoPatron, VerEnAccion, Reglas, SectionIntro, type Regla } from '../patrones/piezas'
import { Resaltado, TextoResaltado } from './texto-resaltado'

// Fundamentos › Tipografía: Inter y las escalas de Heading y Text de flux-ui, con dónde se usa cada nivel en
// las pantallas. Todo son componentes de la librería con sus propiedades, sin tamaños escritos a mano.

type NivelTitulo = { nivel: 1 | 2 | 3 | 4 | 5 | 6; medida: string; uso: string }

const TITULOS: NivelTitulo[] = [
  { nivel: 1, medida: '36 px (48 px en pantallas anchas) · negrita extra', uso: 'Portadas y piezas de marketing. Casi nunca dentro del producto.' },
  { nivel: 2, medida: '30 px · seminegrita', uso: 'Título de la página (lo pone la cabecera de página).' },
  { nivel: 3, medida: '24 px · seminegrita', uso: 'Título de una sección grande o de un paso.' },
  { nivel: 4, medida: '20 px · seminegrita', uso: 'Título de un bloque o de un caso dentro de la página.' },
  { nivel: 5, medida: '18 px · seminegrita', uso: 'Título de sección dentro del contenido.' },
  { nivel: 6, medida: '16 px · seminegrita', uso: 'Subtítulo pequeño o grupo dentro de una tarjeta.' },
]

type TamanoTexto = { size: 'xs' | 'sm' | 'base' | 'lg' | 'xl'; medida: string; uso: string }

const TEXTOS: TamanoTexto[] = [
  { size: 'xl', medida: '20 px', uso: 'Cifras destacadas de indicadores.' },
  { size: 'lg', medida: '18 px', uso: 'Entradillas cortas.' },
  { size: 'base', medida: '16 px', uso: 'Texto de lectura y descripciones de página.' },
  { size: 'sm', medida: '14 px', uso: 'Texto de interfaz: tablas, tarjetas, formularios.' },
  { size: 'xs', medida: '12 px', uso: 'Datos secundarios, fechas y ayudas.' },
]

const PESOS: { weight: 'normal' | 'medium' | 'semibold' | 'bold'; medida: string; uso: string }[] = [
  { weight: 'normal', medida: '400', uso: 'Texto corrido.' },
  { weight: 'medium', medida: '500', uso: 'Etiquetas y opciones seleccionadas.' },
  { weight: 'semibold', medida: '600', uso: 'Títulos, nombres y cifras.' },
  { weight: 'bold', medida: '700', uso: 'Énfasis puntual, como en marketing.' },
]

const REGLAS: Regla[] = [
  { titulo: 'Una sola familia: Inter', detalle: 'La pone el tema en todo el producto. No se cargan otras fuentes ni monoespaciadas para números.' },
  { titulo: 'Heading por nivel, Text por tamaño', detalle: 'Nunca tamaños escritos a mano (text-[13px]) ni pesos por clase (font-light): se usan level, size y weight.' },
  { titulo: 'Títulos y cifras en seminegrita', detalle: 'Como en marketing: el peso marca la jerarquía, no el tamaño gigante.' },
  { titulo: 'Gris para lo secundario', detalle: 'Descripciones y datos de apoyo con variant="muted"; no con un gris propio.' },
  { titulo: 'Un título principal por página', detalle: 'El de la cabecera de página. Los demás bajan de nivel en orden, sin saltarse niveles.' },
  {
    titulo: 'Resaltado en texto grande',
    detalle: 'Lo normal en medium y lo resaltado en negrita: con el degradado de la IA si habla de la IA, con el azul de UBITS si no. Siempre con TextoResaltado.',
  },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Tipografía" antetitulo="Design system · Fundamentos" etiqueta={<Badge variant="success-light">Del tema</Badge>} acciones={<VerEnAccion pagina="tipografia" />}>
        Inter en toda la plataforma, con dos escalas de la librería: títulos (Heading, del nivel 1 al 6) y texto (Text, de
        12 a 20 px). Cada ejemplo de esta página es el componente tal como viene.
      </EncabezadoPatron>

      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="sm">
              Familia
            </Text>
            <Heading as="h2" level={1}>
              Inter
            </Heading>
            <Text variant="muted">Variable, del 100 al 900. Hecha para pantallas y con cifras que se alinean en columnas.</Text>
          </div>
          <Heading as="h2" level={1} aria-hidden="true">
            Aa 0123
          </Heading>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Títulos" description="Heading, del nivel 1 al 6. En las pantallas, la página empieza en el nivel 2." />
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Ejemplo</TableHead>
                  <TableHead>Medida</TableHead>
                  <TableHead>Cuándo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TITULOS.map((titulo) => (
                  <TableRow key={titulo.nivel}>
                    <TableCell className="align-middle whitespace-normal">
                      {/* Muestra visual: se oculta a lectores de pantalla para no sumar títulos falsos a la página. */}
                      <Heading as="h6" level={titulo.nivel} aria-hidden="true">
                        Nivel {titulo.nivel}
                      </Heading>
                    </TableCell>
                    <TableCell className="align-middle whitespace-normal">
                      <Text as="span" variant="muted" size="sm">
                        {titulo.medida}
                      </Text>
                    </TableCell>
                    <TableCell className="align-middle whitespace-normal">{titulo.uso}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Texto" description="Text, en cinco tamaños y cuatro pesos. El tamaño de la interfaz es 14 px." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Tamaños" description="size en Text.">
            <div className="flex flex-col gap-3">
              {TEXTOS.map((texto) => (
                <div key={texto.size} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Text as="span" size={texto.size}>
                    Plan de formación · {texto.medida}
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    size=&quot;{texto.size}&quot; · {texto.uso}
                  </Text>
                </div>
              ))}
            </div>
          </Demo>
          <Demo title="Pesos" description="weight en Text.">
            <div className="flex flex-col gap-3">
              {PESOS.map((peso) => (
                <div key={peso.weight} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Text as="span" weight={peso.weight}>
                    Usuarios con ingreso · {peso.medida}
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    weight=&quot;{peso.weight}&quot; · {peso.uso}
                  </Text>
                </div>
              ))}
            </div>
          </Demo>
        </div>
        <Demo title="Estilos listos" description="variant en Text: combinaciones que ya trae la librería.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Text variant="lead">Esto es lo que pasa hoy en tu empresa.</Text>
              <Text as="span" variant="muted" size="xs">
                variant=&quot;lead&quot; · entradilla bajo un título
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text variant="muted">268 de 444 usuarios registrados.</Text>
              <Text as="span" variant="muted" size="xs">
                variant=&quot;muted&quot; · dato de apoyo
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text variant="large">Tasa de terminación</Text>
              <Text as="span" variant="muted" size="xs">
                variant=&quot;large&quot; · nombre destacado
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text variant="small">Campo obligatorio</Text>
              <Text as="span" variant="muted" size="xs">
                variant=&quot;small&quot; · etiqueta corta
              </Text>
            </div>
          </div>
        </Demo>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Texto resaltado"
          description="Una frase grande con una parte que se destaca: lo normal en medium y lo resaltado en negrita. TextoResaltado y Resaltado, en tipografia/texto-resaltado.tsx."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="De la IA" description="Resaltado ia: el degradado de la IA de UBITS.">
            <TextoResaltado className="text-center">
              Tú lo imaginas, nosotros <Resaltado ia>lo generamos</Resaltado>
            </TextoResaltado>
          </Demo>
          <Demo title="Sin IA" description="Resaltado: el azul de UBITS.">
            <TextoResaltado className="text-center">
              Sube el <Resaltado>archivo PDF</Resaltado> que quieres añadir
            </TextoResaltado>
          </Demo>
        </div>
        <Demo title="Grande" description='size="2xl": la lectura de AI Insights. Text llega hasta xl, así que desde tableta sube un paso de la escala.'>
          <TextoResaltado size="2xl">
            Llegaron <Resaltado ia>563 candidatos</Resaltado> a tus 10 vacantes publicadas y contrataste a <Resaltado>6 personas</Resaltado>.
          </TextoResaltado>
        </Demo>
      </section>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>El marco tiene tamaños propios</AlertTitle>
        <AlertDescription>
          <p>
            La barra lateral, el pie y los menús flotantes usan 13, 11 y 15 px, que no están en esta escala. Están
            documentados en Patrones › Marco › Medidas. En las pantallas se usa esta escala.
          </p>
        </AlertDescription>
      </Alert>

      <Reglas titulo="Reglas" reglas={REGLAS} />
    </div>
  )
}

Component.displayName = 'DesignSystemTipografiaPage'
