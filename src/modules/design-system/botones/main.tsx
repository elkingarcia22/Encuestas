import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Download04Icon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
  Tabs,
  TabsContent,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ubits/flux-ui'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { Demo, EncabezadoPatron, VerEnAccion, PestanasDePatron, Reglas, SectionIntro, type Regla } from '../patrones/piezas'

// Componentes › Botones: la jerarquía de botones del producto sobre el Button de flux-ui tal como viene (sin
// clases que cambien su aspecto). Los de IA son los del proyecto: BotonIa, el único primario de IA (el degradado), y
// BotonIaSecundario (decisión 10 de la auditoría, 5-oct). El «⋯» es BotonIcono y la X de cerrar, CloseButton.

const PESTANAS = [
  { valor: 'jerarquia', etiqueta: 'Jerarquía' },
  { valor: 'variantes', etiqueta: 'Todas las variantes' },
  { valor: 'tamanos', etiqueta: 'Tamaños' },
  { valor: 'icono-estados', etiqueta: 'Con icono y estados' },
  { valor: 'reglas', etiqueta: 'Reglas' },
]

type Nivel = {
  nombre: string
  variante: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  uso: string
  ejemplo: string
  porDecidir?: boolean
}

const NIVELES: Nivel[] = [
  { nombre: 'Primario', variante: 'default', uso: 'La acción principal de la vista. Uno por pantalla, por tarjeta o por diálogo.', ejemplo: 'Crear encuesta' },
  { nombre: 'Secundario', variante: 'outline', uso: 'Acciones de apoyo junto al primario: cancelar, exportar, ver el detalle.', ejemplo: 'Exportar' },
  { nombre: 'Terciario', variante: 'ghost', uso: 'Acciones de poco peso dentro de tablas, tarjetas y barras, y los botones de solo icono.', ejemplo: 'Ver más' },
  { nombre: 'Enlace', variante: 'link', uso: 'Para navegar dentro de un texto o al final de una lista: «Ver todo», enlaces legales.', ejemplo: 'Ver todo' },
  { nombre: 'Peligro', variante: 'destructive', uso: 'Solo para borrar o suspender, y siempre después de pedir confirmación.', ejemplo: 'Eliminar' },
  { nombre: 'Relleno gris', variante: 'secondary', uso: 'Todavía sin uso definido en UBITS. No lo uses hasta que el equipo lo decida.', ejemplo: 'Filtrar', porDecidir: true },
]

const REGLAS: Regla[] = [
  { titulo: 'Un solo primario', detalle: 'El primario se reserva para cuando hay una sola acción principal. Con dos llamados a la acción del mismo nivel, los dos van como secundarios (regla del 1-oct). Varios azules juntos no dicen cuál es la principal.' },
  { titulo: 'El primario va al final', detalle: 'En encabezados, pies de tarjeta y diálogos, primero los secundarios y a la derecha el primario.' },
  {
    titulo: 'El «⋯» va primero',
    detalle: 'El menú de más acciones es el primero de la fila, a la izquierda de todo: ⋯ · terciario · secundario · primario · IA.',
  },
  { titulo: 'Verbo y objeto', detalle: '«Crear encuesta», «Guardar cambios», «Enviar invitación». Nunca «Aceptar» u «OK» si se puede decir qué pasa.' },
  { titulo: 'Peligro con confirmación', detalle: 'El botón rojo abre un diálogo que dice qué se borra y si se puede deshacer; el rojo del diálogo repite el verbo.' },
  { titulo: 'Esquinas de la librería', detalle: '12 px en los normales y grandes, 10 px en los chicos y 8 px en los mini. La pastilla (radio completo) es solo para IA.' },
  { titulo: 'Iconos de Hugeicons', detalle: 'Al inicio si describen la acción (+ Crear) o al final si anuncian que se va a otro lado (Continuar ›).' },
  { titulo: 'Terciario de solo icono, redondo', detalle: 'Filas de tabla y más opciones: BotonIcono (el ghost de la librería en círculo). Nunca el riel de la barra lateral, que tiene su propia forma.' },
  { titulo: 'Cerrar es CloseButton', detalle: 'La X de ventanas, paneles, tarjetas y avisos: un círculo claro de 32 px con un filo fino, siempre arriba a la derecha. No se arma con otro botón y una X.' },
  { titulo: 'Solo icono, con nombre', detalle: 'Un botón de solo icono lleva su nombre para lectores de pantalla y una ayuda flotante al pasar el cursor.' },
]

// Los pendientes del botón de IA pasaron a Orbit › Piezas de IA › Pendientes (13-oct). El del terciario de IA se quitó:
// ese botón se retiró el 5-oct.
const PENDIENTES: Regla[] = [
  { titulo: 'Uso del relleno gris', detalle: 'Definir si la variante secondary tiene un lugar en UBITS o se deja fuera.' },
]

function Jerarquia() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="De más a menos peso"
        description="Seis variantes del Button de flux-ui. Cada nivel responde a cuánta atención merece la acción."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {NIVELES.map((nivel) => (
          <Demo key={nivel.nombre} title={nivel.nombre} description={nivel.uso} centrado>
            <div className="flex flex-col items-center gap-3 py-4">
              <Button variant={nivel.variante}>{nivel.ejemplo}</Button>
              <div className="flex items-center gap-2">
                <Text as="span" variant="muted" size="xs">
                  variant=&quot;{nivel.variante}&quot;
                </Text>
                {nivel.porDecidir ? <Badge variant="warning-light">Por decidir</Badge> : null}
              </div>
            </div>
          </Demo>
        ))}
      </div>

      <SectionIntro title="Así se combinan" description="Los mismos niveles en los lugares que más se repiten en el producto." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pie de una ventana</CardTitle>
            <CardDescription>Cancelar como secundario y el primario al final. «Cancelar» es de las ventanas y los paneles: crear o editar en una página no lo lleva en la barra.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text variant="muted" size="sm">
              Los cambios se aplican a los 48 participantes del plan.
            </Text>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar cambios</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fila de una tabla</CardTitle>
            <CardDescription>Acciones de la fila en terciario, de solo icono, con el «⋯» primero.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Text as="span" size="sm" weight="medium">
                Onboarding comercial Q3
              </Text>
              <Text as="span" variant="muted" size="xs">
                Vigente · 48 participantes
              </Text>
            </div>
            {/* El «⋯» va el primero de la fila (decisión 15 de la auditoría, 5-oct). */}
            <div className="flex items-center gap-1">
              <BotonIcono aria-label="Más acciones">
                <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
              </BotonIcono>
              <BotonIcono aria-label="Editar">
                <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
              </BotonIcono>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cabecera de una pantalla</CardTitle>
            <CardDescription>De izquierda a derecha: «⋯» · terciario · secundario · primario · IA.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-end gap-2">
            <BotonIcono aria-label="Más acciones">
              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
            </BotonIcono>
            <Button variant="ghost">Historial</Button>
            <Button variant="outline">Exportar</Button>
            <Button>Crear plan</Button>
            <BotonIa>Con IA</BotonIa>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cabecera de una ventana o un panel</CardTitle>
            <CardDescription>La X de cerrar es CloseButton, siempre arriba a la derecha.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Text as="span" size="sm" weight="medium">
                Detalles de la evaluación
              </Text>
              <Text as="span" variant="muted" size="xs">
                Lo que se evaluó y cómo, solo para consultar.
              </Text>
            </div>
            <CloseButton label="Cerrar" />
          </CardContent>
        </Card>
      </div>

      {/* La pestaña «Botón de IA» repetía Orbit › Piezas de IA › Botones; desde el 13-oct solo se enlaza. */}
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>Los botones de IA viven en Orbit</AlertTitle>
        <AlertDescription>
          <p>
            Los de IA (el degradado, el secundario con el orbe y «Orbit Flow») tienen su propia jerarquía y sus reglas en{' '}
            <Link to="/design-system/ia/botones">Orbit › Piezas de IA › Botones</Link>. Aquí solo importa que van al final de
            la fila y no se mezclan con esta jerarquía: si la acción no la hace la IA, usa primario, secundario o terciario.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

function Tamanos() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Tamaños"
        description="Cuatro tamaños con texto y cuatro de solo icono. Las alturas son las de la librería con el tema del proyecto."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Demo title="Con texto" description="Normal en formularios y encabezados; chico en tablas y tarjetas; mini en filas densas." centrado>
          <div className="flex flex-wrap items-end justify-center gap-3 py-4">
            <Button size="xs">Mini · 24 px</Button>
            <Button size="sm">Chico · 32 px</Button>
            <Button>Normal · 36 px</Button>
            <Button size="lg">Grande · 40 px</Button>
          </div>
        </Demo>
        <Demo title="Solo icono" description="Siempre con su nombre (aria-label) y una ayuda flotante." centrado>
          <div className="flex flex-wrap items-end justify-center gap-3 py-4">
            <Button variant="outline" size="icon-xs" aria-label="Configuración">
              <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Configuración">
              <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Configuración">
              <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon-lg" aria-label="Configuración">
              <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
            </Button>
          </div>
        </Demo>
        {/* Decisión 21 de la auditoría (5-oct): hay un solo icono de ayuda que abre con clic, y se muestra aquí. */}
        <Demo
          title="Ayuda que abre con clic · BotonAyuda"
          description="El círculo de información junto a un rótulo: abre con clic, teclado o al pasar el cursor, con el globo oscuro de todas las ayudas. Es el único: nada de copias con otro globo."
          centrado
        >
          <div className="flex items-center justify-center gap-1.5 py-4">
            <Text as="span" size="sm" weight="medium">
              Tasa de finalización
            </Text>
            <BotonAyuda etiqueta="Qué mide «Tasa de finalización»">De todo lo que se empezó, cuánto se terminó en el periodo.</BotonAyuda>
          </div>
        </Demo>
      </div>
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>El marco usa medidas propias</AlertTitle>
        <AlertDescription>
          <p>
            Los botones de la barra superior miden 32 px (la foto de perfil, 34 px) y el de la empresa, con el plan bajo el nombre, cerca de 50 px. Son parte del estilo del marco (ver
            Patrones › Marco › Medidas). En las pantallas se usan los tamaños de esta página.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Primario, secundario y terciario × con texto, con icono y solo icono × chico, normal y grande (follow up del 17-sep:
// «que el secundario sea igual en todos lados, el terciario es el secundario sin borde y el de solo icono redondo»).
const FILAS_VARIANTES = [
  { nombre: 'Primario', variante: 'default' },
  { nombre: 'Secundario', variante: 'outline' },
  { nombre: 'Terciario', variante: 'ghost' },
] as const
const TAMANOS_VARIANTES = [
  { texto: 'sm', icono: 'icon-sm' },
  { texto: 'default', icono: 'icon' },
  { texto: 'lg', icono: 'icon-lg' },
] as const

function Variantes() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Todas las variantes"
        description="Cada nivel con texto, con icono y solo icono, en chico, normal y grande. Todos con la esquina de la librería; solo el terciario de solo icono va en círculo."
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Nivel</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead>Icono y texto</TableHead>
                <TableHead>Solo icono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FILAS_VARIANTES.map((fila) => (
                <TableRow key={fila.nombre}>
                  <TableCell className="align-middle">
                    <Text as="span" size="sm" weight="medium">
                      {fila.nombre}
                    </Text>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2 py-2">
                      {TAMANOS_VARIANTES.map((tamano) => (
                        <Button key={tamano.texto} variant={fila.variante} size={tamano.texto}>
                          Exportar
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2 py-2">
                      {TAMANOS_VARIANTES.map((tamano) => (
                        <Button key={tamano.texto} variant={fila.variante} size={tamano.texto}>
                          <HugeiconsIcon icon={Download04Icon} aria-hidden="true" data-icon="inline-start" />
                          Exportar
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2 py-2">
                      {TAMANOS_VARIANTES.map((tamano) =>
                        fila.variante === 'ghost' ? (
                          <BotonIcono key={tamano.icono} size={tamano.icono} aria-label="Más opciones">
                            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                          </BotonIcono>
                        ) : (
                          <Button key={tamano.icono} variant={fila.variante} size={tamano.icono} aria-label="Exportar">
                            <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
                          </Button>
                        ),
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Reglas
        titulo="Cómo se leen"
        reglas={[
          { titulo: 'Terciario = secundario sin borde', detalle: 'Mismo tamaño, misma esquina y mismo texto; solo pierde el contorno.' },
          { titulo: 'Una sola esquina', detalle: 'La de la librería en todo el producto, también en drawers y patrones (antes forzaban 8 px).' },
          { titulo: 'Solo icono redondo solo en terciario', detalle: 'Primario y secundario de solo icono mantienen la esquina; el terciario va en círculo con BotonIcono.' },
        ]}
      />
    </div>
  )
}

function IconoYEstados() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro title="Con icono y estados" description="Dónde va el icono y cómo se ve un botón que no se puede usar o que está trabajando." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Demo title="Icono al inicio" description="Describe la acción." centrado>
          <div className="flex justify-center py-4">
            <Button>
              <HugeiconsIcon icon={Add01Icon} aria-hidden="true" data-icon="inline-start" />
              Crear plan
            </Button>
          </div>
        </Demo>
        <Demo title="Icono al final" description="Anuncia que lleva a otro lugar." centrado>
          <div className="flex justify-center py-4">
            <Button variant="outline">
              Continuar
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </Demo>
        <Demo title="Deshabilitado" description="Cuando falta algo para poder usarlo; dilo cerca del botón." centrado>
          <div className="flex justify-center py-4">
            <Button disabled>
              <HugeiconsIcon icon={Download04Icon} aria-hidden="true" data-icon="inline-start" />
              Descargar
            </Button>
          </div>
        </Demo>
        <Demo title="Trabajando" description="Mientras guarda: el verbo en gerundio y sin poder volver a tocarlo." centrado>
          <div className="flex justify-center py-4">
            <Button disabled>
              <Spinner data-icon="inline-start" />
              Guardando…
            </Button>
          </div>
        </Demo>
      </div>
      <Demo title="Peligro, de principio a fin" description="El botón rojo no borra: abre la confirmación, y ahí el rojo repite el verbo." centrado>
        <div className="flex flex-wrap items-center justify-center gap-3 py-4">
          <Button variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" data-icon="inline-start" />
            Eliminar encuesta
          </Button>
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          <Text as="span" variant="muted" size="sm">
            «¿Eliminar la encuesta?», con «Clima laboral Q3» en el cuerpo · Cancelar · Eliminar encuesta
          </Text>
        </div>
      </Demo>
    </div>
  )
}

export function Component() {
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPatron titulo="Botones" antetitulo="Design system · Componentes" acciones={<VerEnAccion pagina="botones" />}>
        Qué botón usar en cada caso: cuánto pesa la acción, qué tamaño lleva y dónde va el icono. Todo es el Button de
        flux-ui tal como viene; los botones de IA están en Orbit.
      </EncabezadoPatron>

      <Tabs defaultValue="jerarquia">
        <PestanasDePatron items={PESTANAS} />
        <TabsContent value="jerarquia" className="pt-6">
          <Jerarquia />
        </TabsContent>
        <TabsContent value="variantes" className="pt-6">
          <Variantes />
        </TabsContent>
        <TabsContent value="tamanos" className="pt-6">
          <Tamanos />
        </TabsContent>
        <TabsContent value="icono-estados" className="pt-6">
          <IconoYEstados />
        </TabsContent>
        <TabsContent value="reglas" className="pt-6">
          <div className="flex flex-col gap-6">
            <Reglas titulo="Reglas" reglas={REGLAS} />
            <Reglas titulo="Por resolver" reglas={PENDIENTES} pendiente />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'DesignSystemBotonesPage'
