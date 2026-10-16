import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  InformationCircleIcon,
  Pdf01Icon,
  PlayIcon,
  RepeatIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Heading,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  RadioGroup,
  RadioGroupItem,
  Rating,
  ScrollArea,
  Separator,
  Text,
  toast,
} from '@ubits/flux-ui'

import {
  BASE,
  ICONO_TIPO,
  PERSONA,
  PREGUNTAS,
  contenidoPorId,
  estadoPagina,
  paginasDe,
  type Contenido,
  type Pagina,
} from '../components/data'
import { IconoEstado } from '../components/piezas'
import { FullscreenTemplate } from '../../fullscreen-template'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { PageHeader } from '@/shared/components/PageShell'
import { PAGE_WIDTH } from '@/shared/components/page-width'

// Experiencia de estudio. Hoy es el Reproductor (/learner/content/:id/page/:pagina): video,
// adjuntos, temario lateral, Regresar / Continuar y barra de progreso. Va a pantalla completa,
// fuera del menú (HU-APR-004, RN-02). Navegación lineal (HU-APR-007): lo hecho se reabre, lo
// siguiente se desbloquea al completar la página actual.

const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

type EstadoEvaluacion = 'inicio' | 'respondiendo' | 'aprobada' | 'reprobada'

function Evaluacion({ pagina, onAprobar }: { pagina: Pagina; onAprobar: () => void }) {
  const [estado, setEstado] = useState<EstadoEvaluacion>('inicio')
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [intentos, setIntentos] = useState(0)
  const correctas = PREGUNTAS.filter((p, i) => respuestas[i] === String(p.correcta)).length
  const nota = Math.round((correctas / PREGUNTAS.length) * 100)

  if (estado === 'inicio') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vas a iniciar una evaluación</CardTitle>
          <CardDescription>{pagina.titulo}</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="grid gap-2 sm:grid-cols-3">
            {[
              ['Preguntas', String(PREGUNTAS.length)],
              ['Para aprobar', '70 %'],
              ['Intentos', `${3 - intentos} de 3`],
            ].map(([etiqueta, valor]) => (
              <Item key={etiqueta} variant="muted" size="sm">
                <ItemContent>
                  <ItemDescription>{etiqueta}</ItemDescription>
                  <ItemTitle>{valor}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setEstado('respondiendo')}>Comenzar evaluación</Button>
        </CardFooter>
      </Card>
    )
  }

  if (estado === 'aprobada' || estado === 'reprobada') {
    const aprobo = estado === 'aprobada'
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              {/* El resultado lleva la ilustración del sistema, no un icono de línea (decisión 14 de la auditoría). */}
              <EmptyMedia variant="default">
                <ImagenGlass nombre={aprobo ? 'glass-tick' : 'glass-close-square'} />
              </EmptyMedia>
              <EmptyTitle>{aprobo ? '¡Aprobaste!' : '¡No aprobaste!'}</EmptyTitle>
              <EmptyDescription>
                Respondiste bien {correctas} de {PREGUNTAS.length} preguntas ({nota} %).{' '}
                {aprobo ? 'Ya puedes continuar.' : `Necesitas 70 %. Te quedan ${3 - intentos} intentos.`}
              </EmptyDescription>
            </EmptyHeader>
            {!aprobo ? (
              <EmptyContent>
                <Button
                  variant="outline"
                  disabled={intentos >= 3}
                  onClick={() => {
                    setRespuestas({})
                    setEstado('respondiendo')
                  }}
                >
                  <HugeiconsIcon icon={RepeatIcon} aria-hidden="true" />
                  Intentar de nuevo
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {PREGUNTAS.map((pregunta, i) => (
        <Card key={pregunta.enunciado} size="sm">
          <CardContent>
            <FieldSet>
              <FieldLegend>
                {i + 1}. {pregunta.enunciado}
              </FieldLegend>
              <RadioGroup value={respuestas[i] ?? ''} onValueChange={(v) => setRespuestas((previas) => ({ ...previas, [i]: String(v) }))}>
                {pregunta.opciones.map((opcion, j) => (
                  <Field key={opcion} orientation="horizontal">
                    <RadioGroupItem value={String(j)} id={`p${i}-o${j}`} />
                    {/* Etiqueta asociada: se puede elegir la opción tocando su texto. */}
                    <FieldLabel htmlFor={`p${i}-o${j}`}>{opcion}</FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={Object.keys(respuestas).length < PREGUNTAS.length}
          onClick={() => {
            setIntentos((n) => n + 1)
            const aprobo = nota >= 70
            setEstado(aprobo ? 'aprobada' : 'reprobada')
            if (aprobo) onAprobar()
          }}
        >
          Enviar respuestas
        </Button>
        <Text variant="muted" size="sm">
          {Object.keys(respuestas).length} de {PREGUNTAS.length} respondidas
        </Text>
      </div>
    </div>
  )
}

function ContenidoDePagina({
  contenido,
  pagina,
  onCompletar,
}: {
  contenido: Contenido
  pagina: Pagina
  onCompletar: () => void
}) {
  const [calificacion, setCalificacion] = useState(0)

  if (pagina.tipo === 'Video') {
    return (
      <div className="flex flex-col gap-4">
        {/* El reproductor es el del navegador; el video de muestra es de dominio público. */}
        <video controls poster={contenido.imagen} src={VIDEO} className="aspect-video w-full rounded-xl" />
        <Text variant="muted">
          Un recorrido corto por lo que vas a ver en esta sección y por qué importa en tu día a día.
        </Text>
        <Attachment>
          <AttachmentMedia>
            <HugeiconsIcon icon={Pdf01Icon} aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Guía de la sección.pdf</AttachmentTitle>
            <AttachmentDescription>Material descargable · 1,2 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Descargar guía" onClick={() => toast.add({ type: 'success', title: 'Guía descargada' })}>
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    )
  }

  if (pagina.tipo === 'PDF') {
    return (
      <div className="flex flex-col gap-4">
        <img src={`https://picsum.photos/seed/ubits-pdf-${contenido.id}/960/540`} alt="" className="aspect-video w-full rounded-xl object-cover" />
        <Attachment>
          <AttachmentMedia>
            <HugeiconsIcon icon={Pdf01Icon} aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{pagina.titulo}.pdf</AttachmentTitle>
            <AttachmentDescription>18 páginas · 3,4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Descargar PDF" onClick={() => toast.add({ type: 'success', title: 'PDF descargado' })}>
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    )
  }

  if (pagina.tipo === 'Presentación') {
    return (
      <Card className="overflow-hidden py-0">
        <img src={`https://picsum.photos/seed/ubits-scorm-${contenido.id}/960/540`} alt="" className="aspect-video w-full object-cover" />
        <CardHeader className="pt-6">
          <CardTitle>Presentación interactiva</CardTitle>
          <CardDescription>12 diapositivas con actividades. Se abre en esta misma ventana.</CardDescription>
        </CardHeader>
        <CardFooter className="pb-6">
          <Button onClick={onCompletar}>
            <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
            Iniciar presentación
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (pagina.tipo === 'Evaluación') {
    return <Evaluacion key={pagina.titulo} pagina={pagina} onAprobar={onCompletar} />
  }

  if (pagina.tipo === 'Texto') {
    const casos = [
      ['Cadena de tiendas en Bogotá', 'Pasó de 12 a 31 visitas agendadas al mes con el guion de la etapa 2.'],
      ['Distribuidora en Medellín', 'Cerró un contrato anual respondiendo la objeción de precio con el caso comparativo.'],
      ['Clínica en Cali', 'Redujo el ciclo de venta de 60 a 38 días registrando cada paso en el CRM.'],
    ]
    return (
      <div className="flex flex-col gap-4">
        <Text>
          Estos tres casos muestran el proceso comercial funcionando de principio a fin. Léelos pensando en qué etapa
          se destrabó cada venta.
        </Text>
        <ItemGroup className="flex flex-col gap-2">
          {casos.map(([titulo, detalle]) => (
            <Item key={titulo} variant="outline">
              <ItemMedia>
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{titulo}</ItemTitle>
                <ItemDescription>{detalle}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    )
  }

  // Fin del contenido: certificado (RN-05) y valoración.
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-ticket-star" />
            </EmptyMedia>
            <EmptyTitle>¡Terminaste «{contenido.titulo}»!</EmptyTitle>
            <EmptyDescription>
              {contenido.certificado
                ? `Tu certificado está a nombre de ${PERSONA.nombre} y queda guardado en Historial y certificados.`
                : 'Este contenido no otorga certificado; queda en tu historial.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {contenido.certificado ? (
                <Button onClick={() => toast.add({ type: 'success', title: 'Certificado descargado' })}>
                  <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                  Descargar certificado
                </Button>
              ) : null}
              <Button variant="outline" nativeButton={false} render={<Link to={`${BASE}/zona-de-estudio`} />}>
                Volver a Zona de estudio
              </Button>
            </div>
            <Separator />
            <Text size="sm" weight="medium">
              ¿Qué te pareció?
            </Text>
            <Rating rating={calificacion} editable onRatingChange={setCalificacion} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}

export function Component() {
  const { id } = useParams()
  const contenido = contenidoPorId(id)
  const inicial = contenido ? paginasDe(contenido) : { paginas: [], completadas: 0 }
  const [completadas, setCompletadas] = useState(inicial.completadas)
  const [actual, setActual] = useState(Math.min(inicial.completadas, Math.max(inicial.paginas.length - 1, 0)))

  if (!contenido) {
    return (
      <FullscreenTemplate>
        <div className="flex h-full items-center justify-center p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre="glass-document" />
              </EmptyMedia>
              <EmptyTitle>No se encontró el contenido «{id}».</EmptyTitle>
              <EmptyDescription>No inventamos páginas de un contenido que no existe.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" nativeButton={false} render={<Link to={`${BASE}/catalogo`} />}>
                Ir al catálogo
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </FullscreenTemplate>
    )
  }

  const { paginas } = inicial
  const pagina = paginas[actual]
  const hecha = actual < completadas
  const esFin = pagina.tipo === 'Fin'
  const secciones = [...new Set(paginas.map((p) => p.seccion))]
  const avance = Math.round((Math.min(completadas, paginas.length) / paginas.length) * 100)

  const completarActual = () => setCompletadas((n) => Math.max(n, actual + 1))

  const continuar = () => {
    // Las evaluaciones se completan al aprobar; el resto, al pasar de página.
    if (pagina.tipo !== 'Evaluación') completarActual()
    const siguiente = Math.min(actual + 1, paginas.length - 1)
    // Llegar al cierre termina el contenido: el avance queda en 100 %.
    if (paginas[siguiente].tipo === 'Fin') setCompletadas(paginas.length)
    setActual(siguiente)
  }

  return (
    // Pantalla completa del equipo (FullscreenTemplate): deja inerte el menú de fondo, como las demás pantallas
    // completas, y la cabecera es la del sistema: flecha de volver a la ficha, título y el avance a la derecha.
    <FullscreenTemplate>
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b px-4 py-3">
          <PageHeader
            breadcrumbs={false}
            back={{ label: 'la ficha del contenido', to: `${BASE}/contenido/${contenido.id}` }}
            title={contenido.titulo}
            titleSize="sm"
            description={`${contenido.tipo} · navegación lineal`}
            actions={
              <Progress value={avance} className="w-56">
                <ProgressLabel>
                  {Math.min(completadas, paginas.length)} de {paginas.length} páginas
                </ProgressLabel>
                <ProgressValue className="ms-auto" />
              </Progress>
            }
          />
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Índice del contenido (temario lateral). */}
          <aside className="hidden min-h-0 border-e lg:block">
            <ScrollArea className="h-full">
              <nav aria-label="Índice del contenido" className="flex flex-col gap-4 p-4">
                {secciones.map((seccion) => (
                  <div key={seccion} className="flex flex-col gap-1">
                    <Text as="span" variant="muted" size="xs" weight="medium">
                      {seccion}
                    </Text>
                    {paginas.map((p, indice) => {
                      if (p.seccion !== seccion) return null
                      const estado = estadoPagina(indice, completadas)
                      return (
                        <div key={p.titulo} className="flex items-center gap-1">
                          <Button
                            variant={indice === actual ? 'secondary' : 'ghost'}
                            size="sm"
                            disabled={estado === 'Bloqueado'}
                            aria-current={indice === actual ? 'step' : undefined}
                            onClick={() => setActual(indice)}
                            className="min-w-0 flex-1 justify-start"
                          >
                            <HugeiconsIcon icon={ICONO_TIPO[p.tipo]} aria-hidden="true" />
                            <span className="min-w-0 truncate">
                              {indice + 1}. {p.titulo}
                            </span>
                          </Button>
                          <IconoEstado estado={estado} />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          <ScrollArea className="min-h-0">
            {/* Columna de lectura con el ancho angosto del marco (720 px), no con un max-w propio. */}
            <main className={`mx-auto flex w-full flex-col gap-6 px-6 py-8 ${PAGE_WIDTH.narrow}`}>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="sm">
                    {pagina.tipo === 'Fin' ? 'Cierre' : pagina.tipo}
                  </Badge>
                  <Text as="span" variant="muted" size="sm">
                    Página {actual + 1} de {paginas.length} · {pagina.seccion}
                  </Text>
                </div>
                <Heading as="h1" level={3}>
                  {pagina.titulo}
                </Heading>
              </div>

              {actual === 0 && completadas === 0 ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
                  <AlertTitle>Este contenido se recorre en orden</AlertTitle>
                  <AlertDescription>Cada página se desbloquea al terminar la anterior.</AlertDescription>
                </Alert>
              ) : null}

              <ContenidoDePagina key={pagina.titulo} contenido={contenido} pagina={pagina} onCompletar={completarActual} />

              {!esFin ? (
                <>
                  <Separator />
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" disabled={actual === 0} onClick={() => setActual((n) => Math.max(n - 1, 0))}>
                      <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                      Regresar
                    </Button>
                    <Button onClick={continuar} disabled={pagina.tipo === 'Evaluación' && !hecha}>
                      Continuar
                      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                    </Button>
                  </div>
                </>
              ) : null}
            </main>
          </ScrollArea>
        </div>
      </div>
    </FullscreenTemplate>
  )
}

Component.displayName = 'TemplateColaboradorEstudio'
