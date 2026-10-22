import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Coins01Icon,
  Csv01Icon,
  Download01Icon,
  Image01Icon,
  InformationCircleIcon,
  Mail01Icon,
  RefreshIcon,
  Upload01Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
  Progress,
  ProgressLabel,
  ProgressValue,
  Separator,
  Spinner,
  Switch,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { useNavigate } from 'react-router'
import { notify } from '@/shared/components/notify'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { CloseButton } from '@/shared/components/CloseButton'
import { HintContent } from '@/shared/components/Hint'
import { IconoIA } from '../ia/icono-ia'

import { Demo, SectionIntro } from '../patrones/piezas'
import { useTemporizadores } from './temporizadores'
import logoDemo from '@/shared/assets/meta.png'

// Esperas largas de UBITS: cargas masivas que siguen en segundo plano, recursos que genera la IA
// y datos que no están en vivo. Todo se simula con temporizadores.

// ── 1. Carga masiva por archivo ──

export type Subida = 'idle' | 'uploading' | 'processing' | 'error' | 'done'
type Masivo = 'quieto' | 'corriendo' | 'listo'

// Un CSV en sus estados de subida: vacío con el botón para elegirlo, subiendo con su barra,
// revisando, con errores (descargar el detalle o subir otro) o listo (quitarlo). Lo usan esta
// demo y los templates que cargan archivos (Gestión de usuarios, Planes de formación).
// También sirve para otros archivos (PDF, SCORM, imagen, video en LMS Creator y Avisos internos):
// `icono` o `imagen` cambian lo que se ve del archivo, `className` le da el ancho del campo y
// `zona` recibe los eventos de arrastrar y soltar. Sin `onDescargarErrores` el error solo ofrece
// subir otro.
export function AdjuntoCsv({
  estado,
  vacio,
  nombre,
  descripcion,
  porcentaje = 0,
  onElegir,
  onQuitar,
  onReintentar,
  onDescargarErrores,
  bloqueado = false,
  icono = Csv01Icon,
  imagen,
  className,
  zona,
  etiquetaElegir = 'Elegir archivo',
}: {
  estado: Subida
  vacio: { titulo: string; descripcion: string }
  nombre: string
  descripcion: string
  porcentaje?: number
  onElegir: () => void
  onQuitar: () => void
  onReintentar?: () => void
  onDescargarErrores?: () => void
  bloqueado?: boolean
  icono?: IconSvgElement
  /** Miniatura del archivo (imágenes). */
  imagen?: string
  className?: string
  /** Arrastrar y soltar en el estado vacío (los manejadores del hook useFileUpload). */
  zona?: Pick<React.HTMLAttributes<HTMLDivElement>, 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'>
  /** Nombre del botón de elegir para lectores de pantalla (p. ej. «Seleccionar logo horizontal»). */
  etiquetaElegir?: string
}) {
  if (estado === 'idle') {
    return (
      <Attachment state="idle" className={className} {...zona}>
        <AttachmentMedia>
          <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{vacio.titulo}</AttachmentTitle>
          <AttachmentDescription>{vacio.descripcion}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger aria-label={etiquetaElegir} onClick={onElegir} />
      </Attachment>
    )
  }

  return (
    <Attachment state={estado} className={className}>
      <AttachmentMedia variant={imagen ? 'image' : undefined}>
        {imagen ? <img src={imagen} alt="" /> : <HugeiconsIcon icon={icono} aria-hidden="true" />}
      </AttachmentMedia>
      <AttachmentContent className="flex flex-col gap-1">
        <AttachmentTitle>{nombre}</AttachmentTitle>
        <AttachmentDescription>{descripcion}</AttachmentDescription>
        {estado === 'uploading' ? <Progress value={porcentaje} /> : null}
      </AttachmentContent>
      <AttachmentActions>
        {estado === 'error' ? (
          <>
            {onDescargarErrores ? (
              <AttachmentAction aria-label="Descargar el detalle de errores" onClick={onDescargarErrores}>
                <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
              </AttachmentAction>
            ) : null}
            <AttachmentAction aria-label="Subir otro archivo" onClick={onReintentar ?? onQuitar}>
              <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
            </AttachmentAction>
          </>
        ) : (
          <AttachmentAction aria-label="Quitar archivo" onClick={onQuitar} disabled={bloqueado}>
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
          </AttachmentAction>
        )}
      </AttachmentActions>
    </Attachment>
  )
}

// Aviso de un proceso masivo en segundo plano, con cuántos van de cuántos.
export function ProcesoEnCurso({
  titulo,
  hechos,
  total,
  detalle = 'Puedes seguir trabajando: esto continúa aunque salgas de la pantalla.',
}: {
  titulo: string
  hechos: number
  total: number
  detalle?: string
}) {
  return (
    <Alert variant="info">
      <Spinner />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>{detalle}</span>
        <Progress value={Math.round((hechos / total) * 100)}>
          <ProgressLabel>
            Van {hechos} de {total}
          </ProgressLabel>
          <ProgressValue className="ms-auto" />
        </Progress>
      </AlertDescription>
    </Alert>
  )
}

function CargaMasiva() {
  const despues = useTemporizadores()
  const [subida, setSubida] = useState<Subida>('idle')
  const [porcentaje, setPorcentaje] = useState(0)
  const [conError, setConError] = useState(false)
  const [masivo, setMasivo] = useState<Masivo>('quieto')
  const [creados, setCreados] = useState(0)

  const subir = () => {
    setSubida('uploading')
    setPorcentaje(0)
    ;[20, 45, 70, 100].forEach((valor, i) => despues(() => setPorcentaje(valor), 350 * (i + 1)))
    despues(() => setSubida('processing'), 1600)
    despues(() => setSubida(conError ? 'error' : 'done'), 2800)
  }

  const crear = () => {
    setMasivo('corriendo')
    setCreados(0)
    ;[18, 42, 77, 104, 118].forEach((valor, i) => despues(() => setCreados(valor), 900 * (i + 1)))
    despues(() => {
      setMasivo('listo')
      notify('Carga masiva terminada', 'También te enviamos el resultado por correo.', 'success')
    }, 5000)
  }

  const reiniciar = () => {
    setSubida('idle')
    setMasivo('quieto')
    setPorcentaje(0)
  }

  return (
    <Demo
      title="Carga masiva de usuarios"
      description="Gestión de usuarios crea, edita o suspende a muchas personas con un archivo. La subida se ve en el propio adjunto; el proceso sigue en segundo plano y el resultado llega también por correo."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Switch id="archivo-con-error" checked={conError} onCheckedChange={setConError} disabled={subida !== 'idle'} />
          <Label htmlFor="archivo-con-error">Simular un archivo con filas mal llenadas</Label>
        </div>

        <AdjuntoCsv
          estado={subida}
          vacio={{ titulo: 'Elige el archivo de la plantilla', descripcion: 'CSV con la plantilla de carga masiva · hasta 5 MB' }}
          nombre="usuarios-septiembre.csv"
          descripcion={
            {
              idle: '',
              uploading: `Subiendo · ${porcentaje} %`,
              processing: 'Revisando las 120 filas…',
              done: '120 filas correctas · 48 KB',
              error: '3 filas tienen errores: a la fila 12 le falta el correo',
            }[subida]
          }
          porcentaje={porcentaje}
          onElegir={subir}
          onQuitar={reiniciar}
          onDescargarErrores={() => notify('Se descargó el detalle de errores', undefined, 'info')}
          bloqueado={masivo === 'corriendo'}
        />

        {masivo === 'corriendo' ? <ProcesoEnCurso titulo="Creando 120 usuarios" hechos={creados} total={120} /> : null}

        {masivo === 'listo' ? (
          <Alert variant="success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
            <AlertTitle>Se crearon 118 de 120 usuarios</AlertTitle>
            <AlertDescription>
              2 no se pudieron crear porque su correo ya existe. El detalle también llegó a tu correo.
            </AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm" onClick={reiniciar}>
                Hacer otra carga
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={crear} disabled={subida !== 'done' || masivo !== 'quieto'}>
            <HugeiconsIcon icon={UserAdd01Icon} aria-hidden="true" />
            Crear 120 usuarios
          </Button>
          <Text variant="muted" size="sm">
            {masivo === 'corriendo'
              ? 'En proceso; puedes seguir en otra pantalla.'
              : masivo === 'listo'
                ? 'Carga terminada.'
                : subida === 'done'
                  ? 'El archivo está listo.'
                  : 'Se habilita cuando el archivo no tiene errores.'}
          </Text>
        </div>
      </div>
    </Demo>
  )
}

// El mismo cargador para una imagen, como lo usa Configuración › Personalización (CampoImagen): icono de imagen,
// miniatura al terminar y el botón con su nombre para lectores de pantalla (etiquetaElegir).
function CargaImagen() {
  const despues = useTemporizadores()
  const [subida, setSubida] = useState<Subida>('idle')
  const [porcentaje, setPorcentaje] = useState(0)

  const subir = () => {
    setSubida('uploading')
    setPorcentaje(0)
    ;[40, 80, 100].forEach((valor, i) => despues(() => setPorcentaje(valor), 400 * (i + 1)))
    despues(() => setSubida('done'), 1400)
  }

  return (
    <Demo
      title="Una imagen (logo o fondo)"
      description="El mismo adjunto con icono de imagen y miniatura al terminar. El botón de elegir lleva el nombre del campo para quien usa lector de pantalla."
    >
      <AdjuntoCsv
        estado={subida}
        vacio={{ titulo: 'Selecciona un archivo', descripcion: 'Arrastra aquí una imagen JPG o PNG' }}
        nombre="logo.png"
        descripcion={subida === 'uploading' ? `Cargando… ${porcentaje} %` : subida === 'done' ? 'Completado (18 KB)' : ''}
        porcentaje={porcentaje}
        icono={Image01Icon}
        imagen={subida === 'done' ? logoDemo : undefined}
        etiquetaElegir="Seleccionar logo horizontal"
        className="w-full!"
        onElegir={subir}
        onQuitar={() => {
          setSubida('idle')
          setPorcentaje(0)
        }}
      />
    </Demo>
  )
}

// ── 2. Recursos que genera la IA ──

const COSTO_VIDEO = 320
const PASOS_IA = ['Guion', 'Escenas', 'Voz del video', 'Video'] as const

function GeneracionIA() {
  const navigate = useNavigate()
  const despues = useTemporizadores()
  const [saldoBajo, setSaldoBajo] = useState(false)
  const [saldo, setSaldo] = useState(500_000)
  const [paso, setPaso] = useState(-1)
  const [panelAbierto, setPanelAbierto] = useState(true)
  const [sinCreditos, setSinCreditos] = useState(false)
  const disponible = saldoBajo ? 120 : saldo
  const generando = paso >= 0 && paso < PASOS_IA.length
  const terminado = paso === PASOS_IA.length

  const generar = () => {
    // RN-05: sin saldo suficiente la acción no se ejecuta y se avisa.
    if (disponible < COSTO_VIDEO) {
      setSinCreditos(true)
      return
    }
    setSinCreditos(false)
    setSaldo((actual) => actual - COSTO_VIDEO)
    setPanelAbierto(true)
    setPaso(0)
    PASOS_IA.forEach((_, i) => despues(() => setPaso(i + 1), 1100 * (i + 1)))
  }

  return (
    <Demo
      title="Generar un video con IA"
      description="Mientras la IA trabaja, un panel cuenta qué va listo. Al terminar aparece una sola alerta con «Ver página», esté el panel abierto o cerrado, y ningún aviso flotante extra."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Switch id="saldo-bajo" checked={saldoBajo} onCheckedChange={setSaldoBajo} disabled={generando} />
            <Label htmlFor="saldo-bajo">Simular saldo bajo</Label>
          </div>
          <Badge variant="outline">
            <HugeiconsIcon icon={Coins01Icon} aria-hidden="true" />
            {disponible.toLocaleString('es-CO')} créditos
          </Badge>
        </div>

        {sinCreditos ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>No te alcanzan los créditos</AlertTitle>
            <AlertDescription>
              Generar el video cuesta {COSTO_VIDEO} créditos y te quedan {disponible}. Pídele más a tu
              administrador; no se descontó nada.
            </AlertDescription>
          </Alert>
        ) : null}

        {paso >= 0 && panelAbierto ? (
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{terminado ? 'Recursos generados' : 'Generando recursos'}</CardTitle>
                <CloseButton label="Cerrar panel" onClick={() => setPanelAbierto(false)} />
              </div>
              <CardDescription>Video con IA · Onboarding comercial Q3</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="flex flex-col gap-1">
                {PASOS_IA.map((nombre, i) => (
                  <Item key={nombre} size="xs">
                    <ItemMedia variant="icon">
                      {i < paso ? <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" /> : i === paso ? <Spinner /> : <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{nombre}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Text as="span" variant="muted" size="xs">
                        {i < paso ? 'Listo' : i === paso ? 'En curso' : 'En espera'}
                      </Text>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>
        ) : null}

        {terminado ? (
          <Alert variant="success">
            {/* El orbe va en el título: la esquina del Alert solo acomoda iconos de trazo. */}
            <AlertTitle className="flex items-center gap-2">
              <IconoIA />
              Tu video está listo
            </AlertTitle>
            <AlertDescription>La página «Video» ya está en Recursos.</AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/aprendizaje/lms-creator/contenidos')}>
                Ver página
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          {terminado ? (
            <Text variant="muted" size="sm">
              Regenerar vuelve a cobrar los créditos.
            </Text>
          ) : null}
          {generando && !panelAbierto ? (
            <Button variant="ghost" size="sm" onClick={() => setPanelAbierto(true)}>
              Ver avance
            </Button>
          ) : null}
          <BotonIaSecundario onClick={generar} disabled={generando}>
            {generando ? 'Generando…' : `${terminado ? 'Regenerar' : 'Generar video'} · ${COSTO_VIDEO} créditos`}
          </BotonIaSecundario>
        </div>
      </div>
    </Demo>
  )
}

// ── 3. Datos que no están en vivo ──

// Cuándo se calculó un dato y cada cuánto se recalcula, al lado del dato. La usan esta demo y el
// detalle de un plan en el template Planes de formación.
export function ActualizadoHace({ texto, ayuda }: { texto: string; ayuda: string }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" />
      <Text as="span" variant="muted" size="xs">
        {texto}
      </Text>
      {/* Icono de ayuda: el tooltip se controla para que también abra con clic (solo abre con el cursor). */}
      <Tooltip open={abierta} onOpenChange={setAbierta}>
        <TooltipTrigger
          render={<BotonIcono size="icon-xs" aria-label="Cada cuánto se actualiza" onClick={() => setAbierta((v) => !v)} />}
        >
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        </TooltipTrigger>
        <HintContent>{ayuda}</HintContent>
      </Tooltip>
    </div>
  )
}

function DatoNoEnVivo() {
  return (
    <Demo
      title="Datos que no están en vivo"
      description="Si un número se recalcula cada cierto tiempo, se dice al lado del número. Así nadie cree que el sistema falló porque su avance de hace un minuto aún no aparece."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Progress value={64}>
            <ProgressLabel>Onboarding comercial Q3 · personas al 100 %</ProgressLabel>
            <ProgressValue className="ms-auto" />
          </Progress>
          <ActualizadoHace texto="Actualizado hace 12 minutos" ayuda="El progreso del plan se actualiza cada 30 minutos, no en tiempo real." />
        </div>
        <Separator />
        <ItemGroup className="flex flex-col gap-2">
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Planes de formación · cada 30 minutos</ItemTitle>
              <ItemDescription>Se dice en un globo de ayuda junto a la barra de progreso.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Resultados de un contenido · cada 3 horas</ItemTitle>
              <ItemDescription>Se dice debajo del título de la sección, siempre visible.</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Descarga masiva de certificados · por correo</ItemTitle>
              <ItemDescription>El enlace llega por correo y dura 2 días. Está en Formularios.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </div>
    </Demo>
  )
}

export function EstadosProcesos() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Procesos largos"
        description="Cuando la espera dura más que un clic: se muestra el avance donde ocurre, se deja seguir trabajando y el resultado llega aunque la persona se haya ido de la pantalla."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CargaMasiva />
        <GeneracionIA />
        <CargaImagen />
      </div>
      <DatoNoEnVivo />
    </div>
  )
}
