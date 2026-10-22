import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  PlusSignIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { notify, notifyAction } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Separator,
  Skeleton,
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

import { Demo, EncabezadoPatron, PestanasDePatron, Reglas, SectionIntro, VerEnAccion, type Regla } from '../patrones/piezas'
import { mostrarBanner } from '@/shared/components/banner'
import { iniciales } from '../patrones/formato'
import { ErrorDeCarga } from './carga'
import { EstadosConfirmaciones } from './confirmaciones'
import { PantallaProximamente } from './pantalla-proximamente'
import { EstadosErroresSistema } from './errores-sistema'
import { EstadosProcesos } from './procesos'
import { IconoIA } from '../ia/icono-ia'

/* ---------------------------------------------------------------- vacíos */

// Los botones de las demostraciones hacen lo suyo de verdad (regla «nada-que-finja», 13-oct): limpiar vuelve a la lista y
// reintentar carga, con su espera, en vez de avisar de algo que no pasó.
function SinResultadosVivo() {
  const [limpio, setLimpio] = useState(false)
  if (limpio) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Text variant="muted" size="sm">
          Con la búsqueda y los filtros limpios vuelve la lista completa.
        </Text>
        <Button variant="outline" size="sm" onClick={() => setLimpio(false)}>
          Volver a buscar «onboarding»
        </Button>
      </div>
    )
  }
  return <SinResultados busqueda="onboarding" filtrosActivos={3} onLimpiar={() => setLimpio(true)} />
}

function ErrorDeCargaVivo() {
  const [cargo, setCargo] = useState(false)
  const [cargando, setCargando] = useState(false)
  if (cargo) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Text variant="muted" size="sm">
          La lista cargó. Solo ese bloque se volvió a pedir; el resto de la página no se movió.
        </Text>
        <Button variant="outline" size="sm" onClick={() => setCargo(false)}>
          Volver a fallar
        </Button>
      </div>
    )
  }
  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <Spinner className="size-5" />
        <Text variant="muted" size="sm">
          Cargando la lista…
        </Text>
      </div>
    )
  }
  return (
    <ErrorDeCarga
      que="la lista"
      onReintentar={() => {
        setCargando(true)
        window.setTimeout(() => {
          setCargando(false)
          setCargo(true)
        }, 800)
      }}
    />
  )
}

function EstadosVacios() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Estados vacíos"
        description="Cuatro motivos distintos por los que una pantalla puede no tener nada que mostrar. Cada uno cuenta qué pasó y ofrece la salida correspondiente."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {/* Los cuatro van con ilustración glass (decisión 14, 5-oct: «todo debe ir con las ilustraciones»), con las piezas
            del proyecto y nunca con un Empty armado a mano: PrimeraVez (primera vez y sin permiso), SinResultados y
            ErrorDeCarga (la pieza oficial del error de un bloque: glass-danger y «Reintentar»; 13-oct). */}
        <Demo
          title="Primera vez · PrimeraVez"
          description="No hay error: todavía nadie creó nada. Invita a crear el primero."
          centrado
        >
          <PrimeraVez
            icono="glass-add"
            titulo="Todavía no hay planes de formación"
            descripcion="Cuando crees el primero aparecerá aquí junto a su avance y sus participantes."
            accion={{ texto: 'Crear plan de formación', icono: PlusSignIcon, onClick: () => navigate('/admin/aprendizaje/planes-de-formacion/planes/crear') }}
            className="py-6"
          />
        </Demo>

        <Demo
          title="Sin resultados · SinResultados"
          description="Sí hay datos, pero la búsqueda o los filtros los dejaron fuera. Dice qué se buscó y la salida es aflojar el filtro."
          centrado
        >
          <SinResultadosVivo />
        </Demo>

        <Demo
          title="Error de carga · ErrorDeCarga"
          description="Algo falló del lado del sistema. El usuario no hizo nada mal: se le ofrece reintentar, y lo demás de la página sigue funcionando."
          centrado
        >
          <ErrorDeCargaVivo />
        </Demo>

        <Demo
          title="Sin permiso · PrimeraVez"
          description="El contenido existe pero no es para este usuario. No se ofrece acción, se explica a quién pedirla."
          centrado
        >
          <PrimeraVez
            icono="glass-lock"
            titulo="No tienes acceso a este reporte"
            descripcion="Pídele a un administrador de tu empresa que te habilite el módulo de Métricas."
            className="py-6"
          />
        </Demo>
      </div>

      <Demo
        title="Pantalla que todavía no está maquetada · PantallaProximamente"
        description="Lo que no está maquetado sigue en el menú con la etiqueta «Próximamente» y abre esta pantalla de espera: el título y la bajada que tendrá, una sola ilustración glass y una línea de qué se podrá hacer. Sin rutas ni «Slot». Se registra con crearProximamente(título, descripción, qué tendrá, nombre) en el routes.ts del módulo; ningún botón promete llevar a ella como si existiera."
      >
        <div className="overflow-hidden rounded-2xl border bg-background px-6 pb-6">
          <PantallaProximamente
            titulo="Catálogo de contenidos"
            descripcion="Explora el catálogo de UBITS y agrega contenidos a tus planes."
            queTendra="Aquí vas a buscar cursos, rutas y eventos del catálogo, ver su ficha y agregarlos a un plan de formación."
          />
        </div>
      </Demo>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>El data-grid ya trae estos estados adentro</AlertTitle>
        <AlertDescription>
          En las listas no hay que maquetarlos a mano: la tabla del sistema (TablaDatos) los pinta sola
          según si la lista está vacía, si el filtro no encontró nada o si la carga falló. Fuera de una
          tabla —una cuadrícula, un panel, un buscador— se usan PrimeraVez y SinResultados.
        </AlertDescription>
      </Alert>
    </div>
  )
}

/* ----------------------------------------------------------------- carga */

function EsqueletoDeLista() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

function ContenidoDeLista() {
  const rows = [
    { name: 'Ana Restrepo', role: 'Diseño de producto', state: 'Al día' },
    { name: 'Carlos Medina', role: 'Ingeniería', state: 'Pendiente' },
    { name: 'Lucía Ortega', role: 'Personas', state: 'Al día' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{iniciales(row.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text size="sm" weight="medium" className="truncate">
              {row.name}
            </Text>
            <Text variant="muted" size="sm" className="truncate">
              {row.role}
            </Text>
          </div>
          <Badge variant={row.state === 'Al día' ? 'success-light' : 'warning-light'}>
            {row.state}
          </Badge>
        </div>
      ))}
    </div>
  )
}

const REGLA_CARGA: {
  caso: string
  usar: string
  badge: 'primary-light' | 'info-light' | 'success-light' | 'warning-light' | 'outline'
  como: string
}[] = [
  {
    caso: 'Menos de 300 ms',
    usar: 'Nada',
    badge: 'outline',
    como: 'Un destello de carga se ve como un error. Se muestra el resultado directo.',
  },
  {
    caso: 'Una pantalla o una lista que llega por primera vez',
    usar: 'Skeleton',
    badge: 'primary-light',
    como: 'Con la silueta real: mismas filas, columnas y tarjetas. La tabla del sistema (TablaDatos) ya lo hace sola con isLoading.',
  },
  {
    caso: 'Un bloque que se actualiza (filtro, pestaña, rango de fechas)',
    usar: 'Skeleton',
    badge: 'primary-light',
    como: 'Solo ese bloque; el resto de la pantalla se queda quieto y se puede seguir usando.',
  },
  {
    caso: 'Una acción que la persona disparó (guardar, enviar, reintentar)',
    usar: 'Spinner',
    badge: 'info-light',
    como: 'Dentro del botón, en lugar de su icono; el botón queda deshabilitado y el texto dice qué pasa («Guardando…»).',
  },
  {
    caso: 'Un paso de una secuencia (el agente trabajando, pasos de un proceso)',
    usar: 'Spinner',
    badge: 'info-light',
    como: 'En el paso que está en curso; los hechos llevan su check y los que faltan quedan en gris.',
  },
  {
    caso: 'Algo que se puede medir (subida de archivos, carga masiva)',
    usar: 'Progress',
    badge: 'success-light',
    como: 'Con valor y texto de qué está pasando. Si no se sabe el total, la barra queda sin valor.',
  },
  {
    caso: 'Más de 10 segundos',
    usar: 'Proceso largo',
    badge: 'warning-light',
    como: 'Se va al centro de procesos para que la persona siga trabajando, y un aviso cuando termina (pestaña Procesos largos).',
  },
]

const NUNCA_CARGA: Regla[] = [
  { titulo: 'Spinner a pantalla completa', detalle: 'Tapa todo y no dice qué viene. Para una pantalla, skeleton con su forma.' },
  { titulo: 'Skeleton para una acción', detalle: 'Si la persona tocó un botón, la respuesta va en ese botón, no en la pantalla.' },
  { titulo: 'Dos cargas en el mismo bloque', detalle: 'Un skeleton y un spinner a la vez en la misma tarjeta: se elige uno.' },
  { titulo: 'Skeleton que no se parece', detalle: 'Si al llegar el contenido algo salta de sitio, la silueta está mal.' },
]

// Cómo se aplica en la maqueta (25 sep, Nicolás: «de cada componente construyas su skeleton para que cada que haya una
// acción con este, siempre mostremos las cargas bien»). Primero en Selección, en sus tres exploraciones.
const EN_LA_MAQUETA: Regla[] = [
  {
    titulo: 'Carga el bloque que cambió',
    detalle:
      'Al entrar, filtrar, buscar, cambiar de pestaña o de página, o abrir a otra persona. La cabecera, los filtros, las pestañas y las barras de acciones se quedan quietos y se pueden usar.',
  },
  {
    titulo: 'Rótulos reales, datos en gris',
    detalle:
      'Lo fijo (títulos, rótulos, encabezados de tabla, etapas) se ve de verdad. Lo que viene de los datos va en gris, con la misma cantidad de filas o tarjetas y en su mismo alto.',
  },
  {
    titulo: 'Las acciones, en su botón',
    detalle:
      'Al confirmar, el botón dice qué pasa («Moviendo…», «Guardando…») con su spinner, y la ventana no se cierra ni se confirma dos veces mientras tanto. La ventana del sistema (ActionDialog) ya lo hace sola: solo hay que darle ese texto (pestaña Confirmaciones).',
  },
  {
    titulo: 'La espera se simula en un solo lugar',
    detalle:
      'Sin servidor, la maqueta espera 0,8 s en un bloque y 0,7 s en una acción: más de 300 ms para que se lea como carga y no como un destello.',
  },
  {
    titulo: 'El lector de pantalla',
    detalle: 'Oye una vez «Cargando las vacantes» (o lo que sea), no cada pieza gris.',
  },
]

function EstadosCarga() {
  const [cargando, setCargando] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Estados de carga"
        description="Skeleton cuando ya sabemos la forma de lo que viene. Spinner cuando no. Progress cuando la espera tiene principio y fin medibles."
      />

      {/* Decisión 21 de la auditoría (5-oct): las piezas de carga de Selección se registran aquí para que otros módulos
          copien una sola. */}
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>La espera simulada ya está hecha</AlertTitle>
        <AlertDescription>
          En una maqueta, la carga de una lista se simula con useCarga (la espera al entrar, buscar o filtrar) y useAccion
          (la del botón), y los esqueletos se arman con Esqueleto, LineaEsqueleto, TextoEsqueleto, AvatarEsqueleto,
          InsigniaEsqueleto y BotonEsqueleto, todos de design-system/estados/carga.tsx (nacieron en Selección). No hagas otro hook de
          carga: la cabecera y los filtros se quedan quietos y el vacío espera a que termine.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Qué usar según lo que carga</CardTitle>
          <CardDescription>
            La regla del producto (follow up del 17-sep). Se decide por lo que está esperando la persona, no por la pantalla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Lo que carga</TableHead>
                <TableHead className="w-40">Qué usar</TableHead>
                <TableHead>Cómo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REGLA_CARGA.map((fila) => (
                <TableRow key={fila.caso}>
                  <TableCell className="align-top">
                    <Text as="span" size="sm" className="whitespace-normal">
                      {fila.caso}
                    </Text>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={fila.badge}>{fila.usar}</Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <Text as="span" variant="muted" size="sm" className="whitespace-normal">
                      {fila.como}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Reglas titulo="Nunca" reglas={NUNCA_CARGA} pendiente />

      <Reglas titulo="En la maqueta" reglas={EN_LA_MAQUETA} />

      <Demo
        title="Skeleton: de la espera al contenido"
        description="El esqueleto copia la silueta real de la lista, así nada salta de sitio al terminar de cargar."
        centrado
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCargando(true)
                setTimeout(() => setCargando(false), 1800)
              }}
              disabled={cargando}
            >
              {cargando ? <Spinner /> : <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} aria-hidden="true" />}
              {cargando ? 'Cargando…' : 'Simular carga'}
            </Button>
            <Text variant="muted" size="sm">
              Dura 1,8 segundos
            </Text>
          </div>
          <Separator />
          {cargando ? <EsqueletoDeLista /> : <ContenidoDeLista />}
        </div>
      </Demo>

      <div className="grid gap-4 md:grid-cols-2">
        <Demo
          title="Spinner"
          description="Para esperas cortas y sin forma conocida: dentro de un botón, en un bloque o junto a un texto."
          centrado
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Spinner className="size-4" />
              <Spinner className="size-5" />
              <Spinner className="size-6" />
              <Text variant="muted" size="sm">
                Tres tamaños
              </Text>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled>
                <Spinner />
                Guardando
              </Button>
              <Button variant="outline" disabled>
                <Spinner />
                Publicando
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-center gap-3 py-4">
              <Spinner className="size-5" />
              <Text variant="muted" size="sm">
                Preparando tu diagnóstico…
              </Text>
            </div>
          </div>
        </Demo>

        <Demo
          title="Progress"
          description="Cuando el avance se puede medir. Si no se puede, se deja sin valor y la barra queda en espera."
          centrado
        >
          <div className="flex flex-col gap-6">
            <Progress value={72}>
              <ProgressLabel>Subiendo material del curso</ProgressLabel>
              <ProgressValue className="ms-auto" />
            </Progress>
            <Progress value={30}>
              <ProgressLabel>Evaluación 360 completada</ProgressLabel>
              <ProgressValue className="ms-auto" />
            </Progress>
            <div className="flex flex-col gap-2">
              <Progress value={null}>
                <ProgressLabel>Sin porcentaje conocido</ProgressLabel>
              </Progress>
              <Text variant="muted" size="xs">
                Sin valor la barra se queda quieta: hoy el tema no le da animación de espera. Para
                esperas sin porcentaje conviene un spinner.
              </Text>
            </div>
          </div>
        </Demo>
      </div>

      <Demo
        title="Skeleton de tarjetas"
        description="Mismo principio en una cuadrícula: tres bloques con la proporción de las tarjetas reales."
        centrado
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div key={card} className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </Demo>
    </div>
  )
}

/* -------------------------------------------------------------- feedback */

// El ejemplo de código que se muestra bajo los botones de aviso.
const EJEMPLO_AVISO = "notify('Plan publicado', 'Los 48 participantes ya pueden verlo.', 'success')"

function EstadosFeedback() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Feedback"
        description="Tres alcances distintos: el toast avisa y se va, la alerta en línea explica algo de esa sección, y el banner afecta a toda la aplicación."
      />

      <Demo
        title="Toasts"
        description="Aviso flotante y pasajero, para confirmar que una acción salió bien o mal. Nunca para información que haya que leer con calma. Todos llevan su tipo: el icono de la izquierda dice si salió bien, si es información, una advertencia o un error, y la X de cerrar va siempre a la derecha (con notify, el tipo es el último dato)."
        centrado
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => notify('Plan publicado', 'Los 48 participantes ya pueden verlo.', 'success')}
            >
              Éxito
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notify('Cambios guardados como borrador', 'Se publicarán cuando confirmes.', 'info')}
            >
              Información
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notify('Quedan 3 licencias libres', 'Revisa el plan antes de invitar a más personas.', 'warning')}
            >
              Advertencia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notify('No se pudo guardar', 'Revisa tu conexión e inténtalo otra vez.', 'error')}
            >
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notifyAction(
                  'Curso archivado',
                  'Ya no aparece en el catálogo.',
                  { label: 'Deshacer', onClick: () => notify('Curso restaurado', undefined, 'info') },
                  'success',
                )
              }
            >
              Con acción
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Con espera: el aviso de que empezó y, al terminar, el de que quedó (dos avisos con su tipo; el progreso
                // largo se ve en el Centro de procesos, pestaña «Procesos largos»).
                notify('Generando el reporte…', 'Te avisamos cuando esté listo.', 'info')
                window.setTimeout(() => notify('Reporte listo para descargar', undefined, 'success'), 2000)
              }}
            >
              Con espera
            </Button>
          </div>
          <Text as="p" variant="muted" size="xs">
            Se escriben con <code>notify(título, detalle, tipo)</code>, por ejemplo{' '}
            <code>{EJEMPLO_AVISO}</code>; con «Deshacer», <code>notifyAction(título, detalle, {'{ label, onClick }'}, tipo)</code>.
            Nunca <code>toast.add</code> suelto.
          </Text>
        </div>
      </Demo>

      <Demo
        title="Alertas en línea"
        description="Van dentro de la sección a la que se refieren y se quedan ahí. Seis tonos, uno por tipo de mensaje."
        centrado
      >
        <div className="flex flex-col gap-3">
          <Alert>
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>Neutro</AlertTitle>
            <AlertDescription>Un dato de contexto que no exige nada del usuario.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>Las evaluaciones cierran el 30 de septiembre</AlertTitle>
            <AlertDescription>
              Después de esa fecha los resultados se congelan y no se pueden editar.
            </AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm">
                Ver calendario
              </Button>
            </AlertAction>
          </Alert>
          <Alert variant="success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
            <AlertTitle>Todo el equipo completó su autoevaluación</AlertTitle>
            <AlertDescription>Ya puedes pasar a la fase de calibración.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>12 personas no han iniciado el curso obligatorio</AlertTitle>
            <AlertDescription>El plazo vence en 5 días.</AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm">
                Enviar recordatorio
              </Button>
            </AlertAction>
          </Alert>
          <Alert variant="destructive">
            <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
            <AlertTitle>No se pudo sincronizar con el sistema de nómina</AlertTitle>
            <AlertDescription>
              Los datos que ves son de hace 3 días. Última sincronización correcta: 6 de septiembre.
            </AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm">
                Reintentar
              </Button>
            </AlertAction>
          </Alert>
          <Alert variant="invert">
            {/* El orbe va en el título: la esquina del Alert solo acomoda iconos de trazo. */}
            <AlertTitle className="flex items-center gap-2">
              <IconoIA />
              Modo estudio con IA disponible
            </AlertTitle>
            <AlertDescription>
              Ahora puedes generar preguntas de práctica a partir de cualquier módulo.
            </AlertDescription>
            <AlertAction>
              <Button variant="secondary" size="sm">
                Probarlo
              </Button>
            </AlertAction>
          </Alert>
        </div>
      </Demo>

      <Demo
        title="Banner global"
        description="Habla de toda la plataforma, no de una sección: mantenimiento, fin de la prueba, un incidente. Va debajo del header, fijo arriba del contenido y a todo su ancho."
        centrado
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                mostrarBanner({
                  tipo: 'warning',
                  titulo: 'Mantenimiento programado el domingo de 2:00 a 4:00',
                  descripcion: 'Durante esas dos horas la plataforma no estará disponible.',
                })
              }
            >
              Ver mantenimiento
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                mostrarBanner({
                  tipo: 'invert',
                  titulo: 'Tu prueba gratuita termina en 6 días',
                  descripcion: 'Activa un plan para no perder el historial.',
                  accion: { texto: 'Ver planes' },
                })
              }
            >
              Ver fin de la prueba
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                mostrarBanner({
                  tipo: 'destructive',
                  titulo: 'Los reportes están tardando más de lo normal',
                  descripcion: 'Ya lo estamos revisando. Tus datos no se perdieron.',
                })
              }
            >
              Ver incidente
            </Button>
            <Text as="span" variant="muted" size="xs">
              Aparece arriba, debajo del header, y sigue ahí aunque cambies de pantalla hasta que lo cierres.
            </Text>
          </div>
          <Reglas titulo="Dónde y cómo" reglas={REGLAS_BANNER} />
        </div>
      </Demo>
    </div>
  )
}

const REGLAS_BANNER: Regla[] = [
  { titulo: 'Debajo del header', detalle: 'Nunca encima: el header no se mueve y la persona sigue ubicada. El banner empuja la pantalla hacia abajo, no la tapa.' },
  { titulo: 'Fijo arriba del contenido', detalle: 'No se va con el scroll: es lo más importante de la plataforma en ese momento.' },
  { titulo: 'Uno a la vez', detalle: 'Si llega otro, reemplaza al anterior. Nunca dos banners apilados.' },
  { titulo: 'Se cierra', detalle: '«Entendido» o su acción lo cierra. Vuelve a salir en la siguiente sesión si sigue vigente.' },
  { titulo: 'Color por gravedad', detalle: 'Advertencia para mantenimiento; oscuro para la cuenta (prueba, plan); rojo solo para un incidente en curso.' },
  { titulo: 'No para una sección', detalle: 'Si el aviso es de una pantalla o una tabla, va como alerta en línea dentro de ella.' },
]

/* ------------------------------------------------------------------ page */

const PESTANAS = [
  { valor: 'vacios', etiqueta: 'Vacíos' },
  { valor: 'carga', etiqueta: 'Carga' },
  { valor: 'feedback', etiqueta: 'Feedback' },
  { valor: 'confirmaciones', etiqueta: 'Confirmaciones' },
  { valor: 'errores', etiqueta: 'Errores de sistema' },
  { valor: 'procesos', etiqueta: 'Procesos largos' },
]

// Dónde se ve cada estado dentro de los templates del administrador.
export function Component() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <EncabezadoPatron
          titulo="Estados y avisos"
          acciones={<VerEnAccion pagina="estados" />}
        >
          Qué mostrar cuando no hay nada, cuando algo está cargando, cuando hay que avisar, cuando
          conviene pedir confirmación y cuando la plataforma falla. Los casos salen de pantallas
          reales de UBITS y salen de las piezas del proyecto (PrimeraVez, SinResultados, notify, DialogoConfirmar…) hechas
          sobre la librería.
        </EncabezadoPatron>

        <Tabs defaultValue="vacios">
          <PestanasDePatron items={PESTANAS} />
          <TabsContent value="vacios" className="pt-6">
            <EstadosVacios />
          </TabsContent>
          <TabsContent value="carga" className="pt-6">
            <EstadosCarga />
          </TabsContent>
          <TabsContent value="feedback" className="pt-6">
            <EstadosFeedback />
          </TabsContent>
          <TabsContent value="confirmaciones" className="pt-6">
            <EstadosConfirmaciones />
          </TabsContent>
          <TabsContent value="errores" className="pt-6">
            <EstadosErroresSistema />
          </TabsContent>
          <TabsContent value="procesos" className="pt-6">
            <EstadosProcesos />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

Component.displayName = 'DesignSystemEstadosPage'
