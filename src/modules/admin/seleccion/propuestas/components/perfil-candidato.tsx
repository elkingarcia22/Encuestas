import { createContext, useContext, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  WhatsappIcon,
  MailBlock01Icon,
  Copy01Icon,
  Call02Icon,
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  BirthdayCakeIcon,
  Briefcase01Icon,
  BubbleChatIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CloudUploadIcon,
  DashedLineCircleIcon,
  Delete02Icon,
  Download04Icon,
  File01Icon,
  FileSyncIcon,
  Flag02Icon,
  Globe02Icon,
  Home01Icon,
  IdentityCardIcon,
  Linkedin01Icon,
  Location01Icon,
  Logout03Icon,
  Mail01Icon,
  MinusSignCircleIcon,
  MinusSignIcon,
  Money03Icon,
  Mortarboard02Icon,
  NextIcon,
  NoteAddIcon,
  PauseIcon,
  PlayIcon,
  SecurityCheckIcon,
  SmartPhone01Icon,
  Tick02Icon,
  Undo02Icon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Bubble,
  BubbleContent,
  Button,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Frame,
  FrameHeader,
  FramePanel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
  MessageHeader,
  Progress,
  ProgressLabel,
  ProgressValue,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Switch,
  Textarea,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify, notifyAction } from '@/shared/components/notify'
import { Orb } from '@/shared/components/Orb'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { CeldaCifra } from '@/modules/admin/inicio/components/bloques'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import { ListaNotas } from '../../vacantes/detalle/candidato/components/notas'
import { Marco, Rotulo } from '../../vacantes/detalle/candidato/components/piezas'
import { pesos, type Nota } from '../../vacantes/detalle/components/data'
import { ErrorDeCarga, Esqueleto, LineaEsqueleto, useCargaConError } from './carga'
import { QUIEN_MUEVE, type CambioEtapa, type MarcaCambio } from '../movimientos'
import { claveDeComentario, expedienteDeSesion, useExpedienteDeSesion, type Canal } from '../expediente-sesion'
import { baseDeCandidatos } from '../base'
import { permisoEn } from '../permisos'
import { useRequisitosCorregidos } from '../correcciones'
import { noSeGuardo } from '../simular'
import { PERSONAS_EMPRESA, PLAZO_ENTREVISTA, VEREDICTO_TEXTO, type Candidatura } from '../datos'
import { CampoNumero } from '../../vacantes/crear/components/piezas'
import { VisorPdf } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/visor-pdf'
import { InvitarATerminar, useInvitacionATerminar } from './invitar-a-terminar'
import {
  contenidoDe,
  esHojaDeVida,
  pdfDe,
  type DocumentoCandidato,
  type EstadoEtapa,
  type EstadoPostulacion,
  type EtapaPostulacion,
  type EvaluacionEtapa,
  type PerfilCompleto,
  type Postulacion,
} from '../perfil-candidato'

// El perfil completo de la persona, el mismo en las tres exploraciones y en «Mis candidatos» (24 sep, Nicolás: «mira
// toda la información que se puede ver de un candidato… hay que dejar bien toda la información, en las 3
// exploraciones, y que no se pierda ningún flujo»).
//
// Es lo que muestra el cajón del producto de hoy, ordenado en pestañas porque aquí vive en paneles angostos (la ficha
// al lado de la bandeja, el panel del tablero, el cajón lateral):
// - arriba, el contacto en una línea: celular y correo que se copian, LinkedIn, dónde vive y su nacionalidad;
// - «Resumen» es lo que cada exploración ya mostraba (su evaluación y sus decisiones) y viene abierta. Desde el 8 oct
//   también es lo que era «Etapas» (VP de producto: «resumen y etapas, una sola»): la línea de etapas arriba y, al tocar
//   una, su detalle dentro del mismo panel con «Volver» (un clic más, pero limpio), en vez de una lista larga debajo;
// - «Información», «Experiencia», «Educación» y «Documentos», lo de la persona, separado como en el expediente
//   original (29 sep, reunión con Elkin: lo probó con usuarios así; en cada etapa se consulta una parte distinta y la
//   encuentran más rápido si está segmentada). Antes Experiencia y Educación iban dentro de «Perfil»;
// - «Postulaciones» (antes «Historial»), las vacantes en las que ha estado: cada una con su línea de etapas y nada más.
// Sin candidatura (desde la base) no hay «Resumen».
//
// Las pestañas se quedan pegadas arriba al bajar: el contenido es largo y cambiar de pestaña no puede obligar a volver
// al principio.

export type PestanaFicha = 'vacante' | 'etapas' | 'informacion' | 'experiencia' | 'educacion' | 'documentos' | 'vacantes'

// Con qué abre la ficha: una pestaña, o «Documentos» con la hoja de vida ya abierta para leerla. «etapas» ya no es una
// pestaña: lleva a «Resumen» y, con una etapa, abre su detalle.
export type PestanaInicial = PestanaFicha | 'hoja-de-vida'

type Pestana = Exclude<PestanaFicha, 'etapas'>

// Lo de dentro de una pestaña (la alerta de lo pendiente, los puntajes del Resumen) lleva a otra sin que cada
// exploración tenga que saber cómo: a una pestaña, y en «Etapas» con una etapa abierta.
// «3:40 p. m.»: la hora de lo que pasó hoy.
const horaCorta = (ms: number) => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

const NavegarFicha = createContext<(destino: PestanaInicial, etapa?: string) => void>(() => {})
// Quien mira con «Solo ver» (CA-43): no comenta ni ve las notas privadas.
const SoloVerFicha = createContext(false)
// Se reemplazó su hoja de vida en la sesión: la evaluación que se ve es de la versión anterior (CA-16).
const HojaReemplazada = createContext<string | null>(null)
// Lo demás que pasó con la persona en una vacante, además de los cambios de etapa (CA-49): lo pone la ficha.
const ActividadExtra = createContext<(postulacionId: string) => CambioEtapa[]>(() => [])
// De quién y de qué vacante son las conclusiones de la IA que se muestran: `${personaId}|${postulacionId}` (CA-36).
const ClaveDiscusion = createContext<string | null>(null)
export const useNavegarFicha = () => useContext(NavegarFicha)

// Las flechas mueven entre pestañas y entre etapas. En la bandeja y en «Revisar» las flechas también cambian de
// persona: aquí se quedan, para que elegir una pestaña con el teclado no salte a la siguiente persona.
const retenerFlechas = (event: KeyboardEvent) => {
  if (event.key.startsWith('Arrow')) event.stopPropagation()
}

const copiar = (texto: string, aviso: string) => {
  void navigator.clipboard?.writeText(texto)
  notify(aviso, texto, 'success')
}

const millonesAPesos = (millones: number) => `$${Math.round(millones * 1_000_000).toLocaleString('es-CO')}`

// «Bogotá, D.C.» ya dice la ciudad; «Medellín, Antioquia» necesita las dos.
const lugarDe = (perfil: PerfilCompleto) => (perfil.region.startsWith(perfil.ciudad) ? perfil.region : `${perfil.ciudad}, ${perfil.region}`)

// Las fechas de este año se dicen sin el año («3 sept»); las de antes, completas.
const cuando = (iso: string) => (iso.startsWith('2026') ? fechaSinAnio(iso) : fechaCorta(iso))

const ahora = () => `Hoy, ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`

/* Estados de postulación y de etapa ------------------------------------------------------------------ */

// Color solo donde informa: verde lo que salió bien, rojo el rechazo, azul lo que está en curso y gris lo demás.
const BADGE_POSTULACION: Record<EstadoPostulacion, 'info-outline' | 'destructive-outline' | 'success-light' | 'secondary'> = {
  'En curso': 'info-outline',
  Rechazado: 'destructive-outline',
  Contratado: 'success-light',
  'Retiró su postulación': 'secondary',
}

const TEXTO_ETAPA: Record<EstadoEtapa, string> = {
  completada: 'Completada',
  actual: 'En curso',
  pendiente: 'Pendiente',
  rechazada: 'Rechazado aquí',
  retiro: 'Se retiró aquí',
  saltada: 'Se saltó',
  'sin-terminar': 'Sin terminar',
}

const BADGE_ETAPA: Record<EstadoEtapa, 'success-light' | 'info-outline' | 'outline' | 'destructive-outline' | 'secondary'> = {
  completada: 'success-light',
  actual: 'info-outline',
  pendiente: 'outline',
  rechazada: 'destructive-outline',
  retiro: 'secondary',
  saltada: 'secondary',
  'sin-terminar': 'secondary',
}

const ICONO_ETAPA: Record<EstadoEtapa, IconSvgElement> = {
  completada: Tick02Icon,
  actual: Clock01Icon,
  pendiente: DashedLineCircleIcon,
  rechazada: Cancel01Icon,
  retiro: Logout03Icon,
  saltada: NextIcon,
  'sin-terminar': MinusSignCircleIcon,
}

const COLOR_ETAPA: Record<EstadoEtapa, string> = {
  completada: 'text-success',
  actual: 'text-primary',
  pendiente: 'text-muted-foreground',
  rechazada: 'text-destructive',
  retiro: 'text-muted-foreground',
  saltada: 'text-muted-foreground',
  'sin-terminar': 'text-warning-foreground',
}

/* Piezas pequeñas ------------------------------------------------------------------------------------ */

// Un dato del perfil: icono, rótulo y valor. Sin valor dice «No registrado» en gris: se ve qué falta sin inventarlo.
function Dato({ icono, rotulo, children, extra }: { icono: IconSvgElement; rotulo: string; children?: ReactNode; extra?: ReactNode }) {
  const vacio = children === undefined || children === null || children === ''
  return (
    <div className="flex min-w-0 items-start gap-3">
      <HugeiconsIcon icon={icono} size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" variant="muted" size="xs">
          {rotulo}
        </Text>
        <Text as="span" size="sm" variant={vacio ? 'muted' : undefined} className="break-words">
          {vacio ? 'No registrado' : children}
        </Text>
        {extra}
      </div>
    </div>
  )
}

function Lista({ items }: { items: string[] }) {
  return (
    <Text as="ul" size="sm" className="ml-5 flex list-disc flex-col gap-1.5">
      {/* Por posición: dos lecturas pueden decir lo mismo. */}
      {items.map((item, indice) => (
        <li key={indice}>{item}</li>
      ))}
    </Text>
  )
}

// Lo que se concluyó, con la raya a la izquierda que la ficha ya usa para la lectura de la IA (un contenedor, no un
// estilo sobre el texto).
function Lectura({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 pl-3">
      <Text as="span" variant="muted" size="sm">
        {children}
      </Text>
    </div>
  )
}

/* Contacto ------------------------------------------------------------------------------------------- */

// El contacto como botones, en una sola fila bajo el nombre (25 sep, Nicolás: la tarjeta con rótulos «no me
// convence», y arriba quedaban «unas cosas como sí y otras no»). Celular y correo se copian al tocarlos; LinkedIn se
// abre. Dónde vive y la nacionalidad están en «Perfil», y la ciudad en la línea de quién es.
function Contacto({ perfil }: { perfil: PerfilCompleto }) {
  // Llamarla o escribirle desde aquí, no solo copiar el dato (CA-19). Cada contacto queda en su historia, con quién y
  // cuándo. Si pidió no recibir correos, el correo no se ofrece (CA-05).
  const noContactar = Boolean(baseDeCandidatos.deId(perfil.id)?.noContactar)
  const abrirCanal = (canal: Canal, url: string, dato: string) => {
    expedienteDeSesion.contactar(perfil.id, canal, dato)
    window.open(url, '_blank', 'noopener')
  }
  const digitos = (perfil.celular ?? '').replace(/\D/g, '')
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {perfil.celular ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" aria-label={`Celular ${perfil.celular}: llamar, WhatsApp o copiar`}>
                <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                <span className="tabular-nums">{perfil.celular}</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => abrirCanal('llamada', `tel:+${digitos}`, perfil.celular ?? '')}>
              <HugeiconsIcon icon={Call02Icon} size={16} />
              Llamar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirCanal('whatsapp', `https://wa.me/${digitos}`, perfil.celular ?? '')}>
              <HugeiconsIcon icon={WhatsappIcon} size={16} />
              Escribirle por WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copiar(perfil.celular ?? '', 'Celular copiado')}>
              <HugeiconsIcon icon={Copy01Icon} size={16} />
              Copiar el número
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Text as="span" variant="muted" size="sm">
          Celular: no registrado
        </Text>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="max-w-full min-w-0" aria-label={`Correo ${perfil.correo}: escribirle o copiar`}>
              <HugeiconsIcon icon={Mail01Icon} size={14} />
              <span className="min-w-0 truncate">{perfil.correo}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled={noContactar} onClick={() => abrirCanal('correo', `mailto:${perfil.correo}`, perfil.correo)}>
            <HugeiconsIcon icon={noContactar ? MailBlock01Icon : Mail01Icon} size={16} />
            {noContactar ? 'Pidió no recibir correos' : 'Escribirle un correo'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copiar(perfil.correo, 'Correo copiado')}>
            <HugeiconsIcon icon={Copy01Icon} size={16} />
            Copiar el correo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {perfil.linkedin ? (
        <Hint label="El perfil que dejó en su postulación">
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={perfil.linkedin} target="_blank" rel="noreferrer" />}>
            <HugeiconsIcon icon={Linkedin01Icon} size={14} />
            LinkedIn
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
          </Button>
        </Hint>
      ) : null}
    </div>
  )
}

/* Información general -------------------------------------------------------------------------------- */

function PestanaInformacion({ perfil, rango, soloVer = false }: { perfil: PerfilCompleto; rango?: [number, number]; soloVer?: boolean }) {
  const salario = perfil.salario
  // Los datos personales (edad, nacimiento, nacionalidad, documento) no sirven para decidir y facilitan el sesgo (CA-17):
  // van aparte, ocultos hasta que se piden, y con «Solo ver» no se muestran.
  const [verPersonales, setVerPersonales] = useState(false)
  // El salario se compara con el rango de la vacante que se está mirando: por encima es un dato para la
  // conversación, y va en ámbar; dentro del rango no necesita color.
  const comparacion =
    salario !== undefined && rango ? (
      salario > rango[1] ? (
        <Badge variant="warning-light" className="w-fit">
          {Math.round((salario / rango[1] - 1) * 100)} % sobre el tope del rango ({pesos(rango[0])} – {pesos(rango[1])})
        </Badge>
      ) : (
        <Text as="span" variant="muted" size="xs">
          {salario < rango[0] ? 'Por debajo' : 'Dentro'} del rango de la vacante ({pesos(rango[0])} – {pesos(rango[1])})
        </Text>
      )
    ) : undefined

  return (
    <div className="flex flex-col gap-4">
      <Marco titulo="Habilidades" descripcion={plural(perfil.habilidades.length, '1 habilidad', `${perfil.habilidades.length} habilidades`)}>
        <FramePanel className="flex flex-wrap gap-1.5">
          {perfil.habilidades.length ? (
            perfil.habilidades.map((habilidad) => (
              <Badge key={habilidad} variant="secondary">
                {habilidad}
              </Badge>
            ))
          ) : (
            <Text as="span" variant="muted" size="sm">
              No registró habilidades.
            </Text>
          )}
        </FramePanel>
      </Marco>

      <Marco titulo="Información de contacto">
        <FramePanel className="grid gap-4 @md:grid-cols-2">
          <Dato icono={UserIcon} rotulo="Nombre">
            {perfil.nombre}
          </Dato>
          <Dato icono={UserIcon} rotulo="Apellido">
            {perfil.apellido}
          </Dato>
          <Dato icono={Mail01Icon} rotulo="Correo electrónico">
            {perfil.correo}
          </Dato>
          <Dato icono={SmartPhone01Icon} rotulo="Teléfono">
            {perfil.celular}
          </Dato>
        </FramePanel>
      </Marco>

      <Marco titulo="Ubicación">
        <FramePanel className="grid gap-4 @md:grid-cols-2">
          <Dato icono={Location01Icon} rotulo="Ciudad">
            {lugarDe(perfil)}
          </Dato>
          <Dato icono={Globe02Icon} rotulo="País">
            {perfil.pais}
          </Dato>
          <Dato icono={Home01Icon} rotulo="Disponible para reubicarse">
            {perfil.reubicacion === undefined ? undefined : perfil.reubicacion ? 'Sí' : 'No'}
          </Dato>
        </FramePanel>
      </Marco>

      <Marco titulo="Información adicional">
        <FramePanel className="grid gap-4 @md:grid-cols-2">
          <Dato icono={Briefcase01Icon} rotulo="Años de experiencia">
            {plural(perfil.anios, '1 año', `${perfil.anios} años`)}
          </Dato>
          <Dato icono={Clock01Icon} rotulo="Disponibilidad">
            {perfil.disponibilidad}
          </Dato>
          <Dato icono={Calendar03Icon} rotulo="Preaviso">
            {perfil.preaviso}
          </Dato>
          <Dato icono={Money03Icon} rotulo="Salario esperado al mes" extra={comparacion}>
            {salario !== undefined ? millonesAPesos(salario) : undefined}
          </Dato>
          <Dato icono={Wallet01Icon} rotulo="Moneda">
            {perfil.moneda}
          </Dato>
          <Dato icono={Globe02Icon} rotulo="Cómo llegó">
            {perfil.origen}
          </Dato>
        </FramePanel>
      </Marco>

      <Marco
        titulo="Datos personales"
        descripcion="Para la contratación. No se usan para evaluar: la IA no los ve."
        accion={
          soloVer ? null : (
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setVerPersonales((antes) => !antes)}>
              <HugeiconsIcon icon={verPersonales ? ViewOffIcon : ViewIcon} size={16} />
              {verPersonales ? 'Ocultar' : 'Mostrar'}
            </Button>
          )
        }
      >
        <FramePanel className={soloVer || !verPersonales ? undefined : 'grid gap-4 @md:grid-cols-2'}>
          {soloVer ? (
            <Text as="p" variant="muted" size="sm">
              Con «Solo ver» no se muestran. Los ve quien trabaja la vacante, cuando los necesita para contratar.
            </Text>
          ) : verPersonales ? (
            <>
              <Dato icono={Calendar03Icon} rotulo="Fecha de nacimiento">
                {perfil.nacimiento ? fechaCorta(perfil.nacimiento) : undefined}
              </Dato>
              <Dato icono={BirthdayCakeIcon} rotulo="Edad">
                {perfil.edad !== undefined ? `${perfil.edad} años` : undefined}
              </Dato>
              <Dato icono={Flag02Icon} rotulo="Nacionalidad">
                {perfil.nacionalidad}
              </Dato>
              <Dato icono={IdentityCardIcon} rotulo="Número de identificación">
                {perfil.identificacion}
              </Dato>
            </>
          ) : (
            <Text as="p" variant="muted" size="sm">
              Fecha de nacimiento, edad, nacionalidad y documento de identidad. Ocultos para que no pesen en la decisión.
            </Text>
          )}
        </FramePanel>
      </Marco>
    </div>
  )
}

/* Experiencia y educación: cada una en su pestaña, como en el expediente original --------------------- */

function ExperienciaLaboral({ perfil }: { perfil: PerfilCompleto }) {
  const n = perfil.experiencia.length
  return (
    <Marco
      titulo="Experiencia laboral"
      descripcion={`${plural(n, '1 posición', `${n} posiciones`)} · ${plural(perfil.anios, '1 año', `${perfil.anios} años`)} de experiencia`}
    >
      <FramePanel>
        {n ? (
          <Timeline orientation="vertical" value={perfil.experiencia[0]?.actual ? 1 : 0}>
            {perfil.experiencia.map((paso, indice) => (
              <TimelineItem key={`${paso.cargo}-${paso.empresa}-${indice}`} step={indice + 1}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineDate>
                    {paso.desde} – {paso.hasta}
                    {paso.duracion ? ` · ${paso.duracion}` : ''}
                  </TimelineDate>
                  <TimelineTitle>{paso.cargo}</TimelineTitle>
                  <TimelineIndicator />
                </TimelineHeader>
                <TimelineContent className="flex flex-col gap-1.5">
                  <Text as="span" size="sm">
                    {paso.empresa}
                  </Text>
                  <Text as="span" variant="muted" size="sm">
                    {paso.descripcion ?? 'No se encontró descripción para esta experiencia.'}
                  </Text>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Briefcase01Icon} />
              </EmptyMedia>
              <EmptyTitle>No registró experiencia</EmptyTitle>
              <EmptyDescription>Su CV no trae puestos anteriores.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </FramePanel>
    </Marco>
  )
}

function Estudios({ perfil }: { perfil: PerfilCompleto }) {
  const n = perfil.educacion.length
  return (
    <Marco titulo="Educación" descripcion={n ? plural(n, '1 título', `${n} títulos`) : 'Sin títulos registrados'}>
      <FramePanel>
        {n ? (
          <ItemGroup className="gap-2">
            {perfil.educacion.map((estudio) => (
              <Item key={`${estudio.titulo}-${estudio.periodo}`} variant="muted" size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={Mortarboard02Icon} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{estudio.titulo}</ItemTitle>
                  <ItemDescription>
                    {estudio.institucion} · {estudio.periodo}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Mortarboard02Icon} />
              </EmptyMedia>
              <EmptyTitle>No registró estudios</EmptyTitle>
              <EmptyDescription>Se le puede pedir el diploma o el acta de grado en «Documentos».</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </FramePanel>
    </Marco>
  )
}

/* Documentos ----------------------------------------------------------------------------------------- */

const CLASES_DOCUMENTO = ['CV', 'Certificado laboral', 'Diploma o acta de grado', 'Carta de recomendación', 'Documento de identidad', 'Otro']

const pesoDe = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`)

function descargar(documento: DocumentoCandidato, perfil: PerfilCompleto) {
  const archivo = documento.archivo ?? pdfDe(contenidoDe(perfil, documento))
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = documento.nombre
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  notify('Descargando', documento.nombre, 'info')
}

// La hoja de vida no se elimina, solo se reemplaza; los demás documentos sí se eliminan (29 sep, reunión con Elkin: así
// funciona el producto: una vez subida, la hoja de vida no se puede perder). Con `abrirHojaDeVida` la pestaña abre ya
// leyéndola: la ficha llega así desde una etapa de revisar hojas de vida.
function PestanaDocumentos({
  perfil,
  documentos,
  yo,
  abrirHojaDeVida = false,
  onHojaAbierta,
  onAgregar,
  onReemplazar,
  onEliminar,
}: {
  perfil: PerfilCompleto
  documentos: DocumentoCandidato[]
  yo: string
  abrirHojaDeVida?: boolean
  onHojaAbierta?: () => void
  onAgregar: (documento: DocumentoCandidato) => void
  onReemplazar: (anterior: DocumentoCandidato, nuevo: DocumentoCandidato) => void
  onEliminar: (documento: DocumentoCandidato) => void
}) {
  const hoja = documentos.find(esHojaDeVida)
  const [viendo, setViendo] = useState<DocumentoCandidato | null>(() => (abrirHojaDeVida ? (hoja ?? null) : null))
  const [subiendo, setSubiendo] = useState<'agregar' | 'reemplazar' | null>(null)
  const [porEliminar, setPorEliminar] = useState<DocumentoCandidato | null>(null)

  // Ya se abrió: al volver a la pestaña no se abre otra vez.
  useEffect(() => {
    if (abrirHojaDeVida) onHojaAbierta?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Marco
        titulo="Documentos"
        descripcion={documentos.length ? plural(documentos.length, '1 documento', `${documentos.length} documentos`) : 'Todavía no hay documentos'}
        accion={
          <Button variant="outline" size="sm" onClick={() => setSubiendo('agregar')}>
            <HugeiconsIcon icon={Add01Icon} />
            Agregar documento
          </Button>
        }
      >
        <FramePanel>
          {documentos.length ? (
            <AttachmentGroup className="flex-col! items-stretch! gap-2 overflow-visible!">
              {documentos.map((documento) => (
                <Attachment key={documento.id} className="w-full! min-w-0!">
                  <AttachmentMedia>
                    <HugeiconsIcon icon={File01Icon} size={18} />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{documento.nombre}</AttachmentTitle>
                    <AttachmentDescription>
                      {documento.clase} · {documento.tipo} · {documento.peso}
                    </AttachmentDescription>
                    <AttachmentDescription>
                      {documento.reemplazaA ? `Reemplazó a «${documento.reemplazaA}» · ` : 'Subido por '}
                      {documento.reemplazaA ? `lo hizo ${documento.subidoPor}` : documento.subidoPor} · {cuando(documento.fecha)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {/* Descargar y el tercer botón en icono, con su globo; «Ver», con nombre y al final, es lo que más se usa.
                      El tercero es «Reemplazar» en el CV y «Eliminar» en los demás: el mismo lugar en todas las
                      filas. Con «Reemplazar» escrito, en el panel lateral se cortaba el nombre del archivo. */}
                  <AttachmentActions className="gap-1">
                    <Hint label="Descargar">
                      <BotonIcono aria-label={`Descargar ${documento.nombre}`} onClick={() => descargar(documento, perfil)}>
                        <HugeiconsIcon icon={Download04Icon} size={16} />
                      </BotonIcono>
                    </Hint>
                    {esHojaDeVida(documento) ? (
                      <Hint label="Reemplazar: el CV no se elimina, se cambia por uno más reciente">
                        <BotonIcono aria-label={`Reemplazar ${documento.nombre}`} onClick={() => setSubiendo('reemplazar')}>
                          <HugeiconsIcon icon={FileSyncIcon} size={16} />
                        </BotonIcono>
                      </Hint>
                    ) : (
                      <Hint label="Eliminar">
                        <BotonIcono aria-label={`Eliminar ${documento.nombre}`} onClick={() => setPorEliminar(documento)}>
                          <HugeiconsIcon icon={Delete02Icon} size={16} />
                        </BotonIcono>
                      </Hint>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setViendo(documento)}>
                      <HugeiconsIcon icon={ViewIcon} />
                      Ver
                    </Button>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={File01Icon} />
                </EmptyMedia>
                <EmptyTitle>Sin documentos</EmptyTitle>
                <EmptyDescription>El CV y los certificados que suba el equipo quedan aquí.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </FramePanel>
      </Marco>

      <VistaPrevia perfil={perfil} documento={viendo} onCerrar={() => setViendo(null)} />
      <AgregarDocumento
        abierto={subiendo !== null}
        onOpenChange={(abierto) => !abierto && setSubiendo(null)}
        reemplazando={subiendo === 'reemplazar'}
        hojaActual={hoja}
        perfil={perfil}
        yo={yo}
        onAgregar={onAgregar}
        onReemplazar={onReemplazar}
      />
      <DialogoConfirmar
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => !abierto && setPorEliminar(null)}
        icono={Delete02Icon}
        titulo={`¿Eliminar «${porEliminar?.nombre ?? ''}»?`}
        descripcion={`Sale del perfil de ${perfil.nombreCompleto} para todo el equipo de selección. Queda un momento para deshacerlo desde el aviso.`}
        accion="Eliminar documento"
        destructiva
        onConfirmar={() => {
          if (porEliminar) onEliminar(porEliminar)
          setPorEliminar(null)
        }}
      />
    </>
  )
}

// La vista previa: el archivo tal como llegó (CA-45), en el mismo visor de PDF del LXP: páginas, zoom, descargar e imprimir. Antes «Ver»
// mostraba un texto armado con los datos del perfil, que siempre coincidía con la ficha. Lo que se sube en la sesión se
// ve igual si es PDF; lo demás (una imagen, un Word) se abre con el visor del navegador.
function VistaPrevia({ perfil, documento, onCerrar }: { perfil: PerfilCompleto; documento: DocumentoCandidato | null; onCerrar: () => void }) {
  const url = useMemo(() => {
    if (!documento) return null
    if (documento.archivo) return documento.archivo.type === 'application/pdf' ? URL.createObjectURL(documento.archivo) : null
    return URL.createObjectURL(pdfDe(contenidoDe(perfil, documento)))
  }, [documento, perfil])
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return (
    <VentanaDeAccion
      open={documento !== null}
      onOpenChange={(abierto) => !abierto && onCerrar()}
      size="wide"
      // Desde la ficha: el documento se lee mejor más ancho que el panel.
      anchoEnPanel
      title={documento?.nombre ?? ''}
      sub={documento ? `${documento.clase} · ${documento.tipo} · ${documento.peso} · subido por ${documento.subidoPor}` : undefined}
      footer={
        documento ? (
          <>
            <Button variant="outline" onClick={onCerrar}>
              Cerrar
            </Button>
            {url ? null : (
              <Button onClick={() => descargar(documento, perfil)}>
                <HugeiconsIcon icon={Download04Icon} />
                Descargar
              </Button>
            )}
          </>
        ) : null
      }
    >
      {documento && url ? (
        <div className="flex flex-col gap-2">
          <Text as="p" variant="muted" size="xs">
            {esHojaDeVida(documento)
              ? 'Así llegó, sin cambios. Lo que dice la ficha sale de la lectura que hizo la IA de este archivo.'
              : 'Así llegó, sin cambios.'}
          </Text>
          <VisorPdf src={url} archivo={documento.nombre} className="h-[min(68vh,720px)]" />
        </div>
      ) : documento?.archivo ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={File01Icon} />
            </EmptyMedia>
            <EmptyTitle>Lo subiste en esta sesión</EmptyTitle>
            <EmptyDescription>No es un PDF: ábrelo en otra pestaña para verlo con el visor del navegador, o descárgalo.</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => {
              const enlace = URL.createObjectURL(documento.archivo as File)
              window.open(enlace, '_blank', 'noopener')
            }}
          >
            <HugeiconsIcon icon={ViewIcon} />
            Abrir en otra pestaña
          </Button>
        </Empty>
      ) : null}
    </VentanaDeAccion>
  )
}

type Subida = { nombre: string; peso: string; tipo: string; archivo: File; avance: number }

// «Agregar documento»: se elige un archivo (o se suelta encima), se ve subir y queda en la lista. Como en «Importar
// CVs», la subida es de mentira; el archivo es de verdad y se descarga tal cual. (8 oct: sin «Usar uno de ejemplo»; no
// estamos probando y no debe llegar a producción.)
//
// La misma ventana reemplaza la hoja de vida (`reemplazando`), y si al agregar se elige «Hoja de vida» y ya hay una,
// también la reemplaza: una persona tiene una sola hoja de vida, la más reciente.
function AgregarDocumento({
  abierto,
  onOpenChange,
  reemplazando = false,
  hojaActual,
  perfil,
  yo,
  onAgregar,
  onReemplazar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  reemplazando?: boolean
  hojaActual?: DocumentoCandidato
  perfil: PerfilCompleto
  yo: string
  onAgregar: (documento: DocumentoCandidato) => void
  onReemplazar: (anterior: DocumentoCandidato, nuevo: DocumentoCandidato) => void
}) {
  // Sin tipo elegido de entrada (CA-54): se elige qué es lo que se sube.
  const [elegida, setClase] = useState<string | null>(null)
  const clase = reemplazando ? CLASES_DOCUMENTO[0] : (elegida ?? '')
  // Lo que no se acepta (tamaño o formato) no se sube; una imagen como hoja de vida se avisa: la IA no la lee (CA-54).
  const [problema, setProblema] = useState<string | null>(null)
  const [subida, setSubida] = useState<Subida | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  const reemplaza = clase === CLASES_DOCUMENTO[0] && hojaActual ? hojaActual : undefined

  const cerrar = (abiertoAhora: boolean) => {
    onOpenChange(abiertoAhora)
    if (!abiertoAhora) {
      setSubida(null)
      setClase(null)
      setProblema(null)
    }
  }

  // La barra avanza sola hasta terminar; mientras sube, el título brilla (estado «uploading» de Attachment).
  useEffect(() => {
    if (!subida || subida.avance >= 100) return
    const reloj = window.setTimeout(() => setSubida((actual) => (actual ? { ...actual, avance: Math.min(100, actual.avance + 20) } : actual)), 220)
    return () => window.clearTimeout(reloj)
  }, [subida])

  const recibir = (archivo: File | undefined) => {
    if (!archivo) return
    if (!/\.(pdf|docx?|jpe?g|png)$/i.test(archivo.name)) {
      setProblema(`«${archivo.name}» no se puede subir: solo PDF, Word o imagen (JPG o PNG).`)
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setProblema(`«${archivo.name}» pesa ${pesoDe(archivo.size)}: el máximo es 10 MB.`)
      return
    }
    setProblema(null)
    setSubida({
      nombre: archivo.name,
      peso: pesoDe(archivo.size),
      tipo: archivo.name.includes('.') ? (archivo.name.split('.').pop()?.toUpperCase() ?? 'PDF') : 'PDF',
      archivo,
      avance: 0,
    })
  }

  const soltar = (event: DragEvent) => {
    event.preventDefault()
    recibir(event.dataTransfer.files[0])
  }

  const listo = subida !== null && subida.avance >= 100

  const agregar = () => {
    if (!subida) return
    // Si no se guarda, la ventana sigue abierta con el archivo y el aviso deja reintentar.
    if (noSeGuardo(`documento:${subida.nombre}`, `No pudimos ${reemplaza ? 'reemplazar' : 'agregar'} «${subida.nombre}»`, agregar, 'El archivo sigue aquí.')) return
    const nuevo: DocumentoCandidato = {
      id: `subido-${Date.now()}`,
      nombre: subida.nombre,
      clase,
      tipo: subida.tipo,
      peso: subida.peso,
      // La fecha de hoy en la hora local (en UTC, de noche ya sería mañana).
      fecha: new Date().toLocaleDateString('en-CA'),
      subidoPor: yo,
      archivo: subida.archivo,
    }
    if (reemplaza) onReemplazar(reemplaza, { ...nuevo, reemplazaA: reemplaza.nombre })
    else {
      onAgregar(nuevo)
      notify('Documento agregado', `${subida.nombre} · ${clase}`, 'success')
    }
    cerrar(false)
  }

  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={cerrar}
      title={reemplazando ? 'Reemplazar el CV' : 'Agregar documento'}
      sub={
        reemplazando && hojaActual
          ? `El nuevo queda en lugar de «${hojaActual.nombre}». El CV no se elimina: siempre queda el más reciente.`
          : `Queda en el perfil de ${perfil.nombreCompleto} y lo ve todo el equipo de selección.`
      }
      confirmLabel={reemplaza ? 'Reemplazar el CV' : 'Agregar documento'}
      confirmDisabled={!listo || !clase}
      onConfirm={agregar}
    >
      <div className="flex flex-col gap-5">
        {reemplazando ? null : (
          <Field>
            <FieldLabel id="documento-clase">Tipo de documento</FieldLabel>
            <Select value={clase} onValueChange={(valor) => setClase(String(valor))} items={CLASES_DOCUMENTO.map((una) => ({ value: una, label: una }))}>
              <SelectTrigger aria-labelledby="documento-clase" className="w-full">
                <SelectValue>{(valor: string) => valor || 'Elige qué es'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CLASES_DOCUMENTO.map((una) => (
                  <SelectItem key={una} value={una}>
                    {una}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reemplaza ? <FieldDescription>Ya tiene un CV: este lo reemplaza.</FieldDescription> : null}
          </Field>
        )}

        <Field>
          <FieldLabel>Archivo</FieldLabel>
          {/* El selector de archivos del sistema: escondido, lo abre la zona de abajo. */}
          <Input ref={campo} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(event) => recibir(event.target.files?.[0])} />
          {subida ? (
            <Attachment state={listo ? 'done' : 'uploading'} className="w-full! min-w-0!">
              <AttachmentMedia>
                <HugeiconsIcon icon={File01Icon} size={18} />
              </AttachmentMedia>
              <AttachmentContent className="flex flex-col gap-1.5">
                <AttachmentTitle>{subida.nombre}</AttachmentTitle>
                {listo ? (
                  <AttachmentDescription>
                    {subida.tipo} · {subida.peso} · {reemplaza ? 'listo para reemplazar la anterior' : 'listo para agregar'}
                  </AttachmentDescription>
                ) : (
                  <Progress value={subida.avance} aria-label="Avance de la subida">
                    <ProgressLabel>Subiendo…</ProgressLabel>
                    <ProgressValue />
                  </Progress>
                )}
              </AttachmentContent>
              <AttachmentActions>
                <Button variant="ghost" size="sm" onClick={() => setSubida(null)}>
                  Cambiar
                </Button>
              </AttachmentActions>
            </Attachment>
          ) : (
            <Attachment state="idle" className="w-full! min-w-0!" onDragOver={(event) => event.preventDefault()} onDrop={soltar}>
              <AttachmentMedia>
                <HugeiconsIcon icon={CloudUploadIcon} size={18} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>Elige un archivo o suéltalo aquí</AttachmentTitle>
                <AttachmentDescription>PDF, Word o imagen · hasta 10 MB</AttachmentDescription>
              </AttachmentContent>
              <AttachmentTrigger aria-label="Elegir un archivo" onClick={() => campo.current?.click()} />
            </Attachment>
          )}
          {problema ? <FieldError>{problema}</FieldError> : null}
          {subida && clase === CLASES_DOCUMENTO[0] && /\.(jpe?g|png)$/i.test(subida.nombre) ? (
            <FieldDescription>Es una foto: la IA la lee con lectura de texto y puede equivocarse. Revisa lo que concluya, o pídele un PDF.</FieldDescription>
          ) : null}
        </Field>
      </div>
    </VentanaDeAccion>
  )
}

// Qué se hace cuando la IA no tiene qué leer: subir la hoja (o una versión que sí se lea) y, mientras tanto, decidir
// los requisitos a mano en «Resumen».
function SalidaSinLectura({ salida }: { salida: 'sin-hoja' | 'ilegible' }) {
  const navegar = useNavegarFicha()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => navegar('documentos')}>
        <HugeiconsIcon icon={CloudUploadIcon} size={16} />
        {salida === 'sin-hoja' ? 'Subir su CV' : 'Subir otra versión'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navegar('vacante')}>
        Evaluar los requisitos a mano
      </Button>
    </div>
  )
}

/* Comentarios de una etapa --------------------------------------------------------------------------- */

function Comentarios({ notas, etapa, onAgregar }: { notas: Nota[]; etapa: string; onAgregar: (texto: string, privada: boolean) => void }) {
  // Con «Solo ver» no se comenta y no se ven las notas privadas del equipo de selección (CA-43).
  const soloVer = useContext(SoloVerFicha)
  useExpedienteDeSesion()
  const [escribiendo, setEscribiendo] = useState(false)
  const [texto, setTexto] = useState('')
  const [privada, setPrivada] = useState(false)
  // El comentario propio que se está editando (CA-42).
  const [editando, setEditando] = useState<number | null>(null)
  const visibles = soloVer ? notas.filter((nota) => !nota.privada) : notas

  const cerrar = () => {
    setTexto('')
    setPrivada(false)
    setEditando(null)
    setEscribiendo(false)
  }
  const publicar = () => {
    if (editando !== null) {
      // Si no se guarda, la caja sigue abierta con lo que escribiste.
      if (noSeGuardo(`editar-nota:${editando}:${texto.trim()}`, 'No pudimos guardar tu cambio', publicar, 'Tu texto sigue aquí.')) return
      const deshacer = expedienteDeSesion.editarNota(editando, texto.trim())
      notifyAction('Editaste el comentario', undefined, { label: 'Deshacer', onClick: deshacer }, 'success')
    } else onAgregar(texto.trim(), privada)
    cerrar()
  }
  // Solo lo propio y de la sesión se edita o se borra; lo demás es de otra persona.
  const acciones = (nota: Nota) =>
    !soloVer && nota.autor === QUIEN_MUEVE && expedienteDeSesion.esDeLaSesion(nota.id) ? (
      <span className="flex items-center gap-3">
        <Button
          variant="link"
          size="xs"
          className="h-auto! p-0!"
          onClick={() => {
            setEditando(nota.id)
            setTexto(nota.texto)
            setEscribiendo(true)
          }}
        >
          Editar
        </Button>
        <Button
          variant="link"
          size="xs"
          className="h-auto! p-0!"
          onClick={function borrar() {
            if (noSeGuardo(`borrar-nota:${nota.id}`, 'No pudimos borrar el comentario', borrar)) return
            const deshacer = expedienteDeSesion.borrarNota(nota.id)
            notifyAction('Borraste el comentario', undefined, { label: 'Deshacer', onClick: deshacer }, 'success')
          }}
        >
          Borrar
        </Button>
      </span>
    ) : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="div" size="sm" weight="medium">
          {visibles.length ? `Comentarios · ${visibles.length}` : 'Comentarios'}
        </Text>
        {escribiendo || soloVer ? null : (
          <Button variant="outline" size="sm" onClick={() => setEscribiendo(true)}>
            <HugeiconsIcon icon={NoteAddIcon} />
            Agregar comentario
          </Button>
        )}
      </div>
      {visibles.length ? (
        <ListaNotas notas={visibles} vacia="" acciones={acciones} />
      ) : escribiendo ? null : (
        <Text as="span" variant="muted" size="sm">
          Sin comentarios aún en esta etapa.
        </Text>
      )}
      {escribiendo ? (
        <div className="flex flex-col gap-2">
          <Textarea
            aria-label={`Comentario sobre ${etapa}`}
            autoFocus
            rows={3}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Qué viste en esta etapa y por qué importa para la decisión. Con @ y su nombre le avisas a alguien del equipo."
            className="min-h-20 resize-none"
          />
          {editando === null ? (
            <Field orientation="horizontal">
              <Switch id={`privada-${etapa}`} checked={privada} onCheckedChange={setPrivada} />
              <FieldLabel htmlFor={`privada-${etapa}`} className="font-normal">
                Solo el equipo de selección
              </FieldLabel>
            </Field>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <Text as="span" variant="muted" size="xs" className="mr-auto">
              {privada ? 'No la ve quien tiene «Solo ver» (por ejemplo, el jefe que contrata).' : 'La ve todo el equipo de la vacante, también quien tiene «Solo ver».'}
            </Text>
            <Button variant="outline" size="sm" onClick={cerrar}>
              Cancelar
            </Button>
            <Button size="sm" disabled={!texto.trim()} onClick={publicar}>
              {editando !== null ? 'Guardar' : 'Publicar'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// La transcripción en texto plano, con quién habló, en qué minuto y las alertas en su frase (CA-40). Sirve igual para
// la entrevista con Serena y para el roleplay, donde la IA hace de otra persona (CA-41).
type Turno = { quien: string; momento: string; texto: string; alerta?: string }
const textoDeTranscripcion = (turnos: Turno[], nombre: string, agente: string) =>
  turnos
    .map((turno) => `[${turno.momento}] ${turno.quien === 'agente' ? agente : nombre}: ${turno.texto}${turno.alerta ? `\n  ⚠ ${turno.alerta}` : ''}`)
    .join('\n\n')
function descargarTexto(texto: string, archivo: string) {
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }))
  enlace.download = archivo
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
function imprimirTexto(texto: string, titulo: string) {
  const ventana = window.open('', '_blank', 'noopener')
  if (!ventana) return
  ventana.document.title = titulo
  const pre = ventana.document.createElement('pre')
  pre.style.whiteSpace = 'pre-wrap'
  pre.style.font = '14px/1.5 system-ui'
  pre.textContent = texto
  ventana.document.body.appendChild(pre)
  ventana.print()
}

// «mm:ss» a segundos, para saltar a ese momento de la grabación.
const segundosDe = (momento: string) => {
  const [minutos, segundos] = momento.split(':').map(Number)
  return minutos * 60 + segundos
}
const minutoDe = (segundos: number) => `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`

// La conversación turno por turno: la IA a la izquierda con el orbe, la persona a la derecha con sus alertas debajo de
// la frase. Con `onEscuchar`, cada respuesta de la persona trae «Escuchar» desde su minuto (CA-39).
function Turnos({ turnos, agente, nombre, onEscuchar }: { turnos: Turno[]; agente: string; nombre: string; onEscuchar?: (segundos: number) => void }) {
  return (
    <MessageGroup className="gap-5">
      {turnos.map((turno) =>
        turno.quien === 'agente' ? (
          <Message key={turno.momento} className="gap-3">
            <MessageAvatar>
              <Orb className="size-7" />
            </MessageAvatar>
            <MessageContent className="gap-1">
              <MessageHeader className="gap-2">
                <Text as="span" size="sm" weight="medium">
                  {agente}
                </Text>
                <Text as="span" variant="muted" size="xs" className="tabular-nums">
                  {turno.momento}
                </Text>
              </MessageHeader>
              <Bubble variant="secondary">
                <BubbleContent>{turno.texto}</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ) : (
          <Message key={turno.momento} align="end">
            <MessageContent className="items-end gap-1">
              <MessageHeader className="gap-2">
                <Text as="span" variant="muted" size="xs" className="tabular-nums">
                  {turno.momento}
                </Text>
                <Text as="span" size="sm" weight="medium">
                  {nombre}
                </Text>
              </MessageHeader>
              <Bubble align="end">
                <BubbleContent>{turno.texto}</BubbleContent>
              </Bubble>
              {turno.alerta ? (
                <Badge variant="warning-light">
                  <HugeiconsIcon icon={Alert02Icon} size={12} aria-hidden />
                  {turno.alerta}
                </Badge>
              ) : null}
              {onEscuchar ? (
                <Button variant="link" size="xs" className="h-auto! p-0!" onClick={() => onEscuchar(segundosDe(turno.momento))}>
                  <HugeiconsIcon icon={PlayIcon} size={12} />
                  Escuchar desde aquí
                </Button>
              ) : null}
            </MessageContent>
          </Message>
        ),
      )}
    </MessageGroup>
  )
}

// La grabación de la llamada (CA-39). Serena llama por teléfono y la llamada se graba: lo dice al empezar, porque la
// persona tiene que saberlo, y la grabación se guarda con su hoja de vida. Se escucha aquí, completa o desde una
// respuesta. En la maqueta avanza sin sonido.
function Grabacion({ total, posicion, sonando, onPosicion, onSonando }: { total: number; posicion: number; sonando: boolean; onPosicion: (segundos: number) => void; onSonando: (sonando: boolean) => void }) {
  useEffect(() => {
    if (!sonando) return
    const reloj = window.setInterval(() => onPosicion(Math.min(total, posicion + 1)), 1000)
    if (posicion >= total) onSonando(false)
    return () => window.clearInterval(reloj)
  }, [sonando, posicion, total, onPosicion, onSonando])
  return (
    <div className="flex items-center gap-3">
      <Hint label={sonando ? 'Pausar' : 'Escuchar la grabación'}>
        <BotonIcono size="icon" aria-label={sonando ? 'Pausar la grabación' : 'Escuchar la grabación'} onClick={() => onSonando(!sonando)}>
          <HugeiconsIcon icon={sonando ? PauseIcon : PlayIcon} size={18} aria-hidden="true" />
        </BotonIcono>
      </Hint>
      <Progress value={Math.round((posicion / total) * 100)} aria-label="Grabación de la llamada" className="min-w-0 flex-1">
        <ProgressLabel>Grabación de la llamada</ProgressLabel>
        <ProgressValue className="ms-auto tabular-nums">{() => `${minutoDe(posicion)} / ${minutoDe(total)}`}</ProgressValue>
      </Progress>
    </div>
  )
}

// «No estoy de acuerdo» con lo que concluyó la IA (CA-36): el veredicto de la hoja de vida, el puntaje de la entrevista
// o del roleplay, lo que destaca de las pruebas. Antes solo se podían corregir los requisitos. Lo de la IA no se borra:
// lo del equipo queda al lado, con quién, cuándo y por qué, entra a su historia y llega a quienes entrenan a la IA. Con
// «Solo ver» se lee, pero no se discute.
function DiscutirIA({ conclusion, laIADijo, opciones, puntaje }: { conclusion: string; laIADijo: string; opciones: string[]; puntaje?: number }) {
  const prefijo = useContext(ClaveDiscusion)
  const soloVer = useContext(SoloVerFicha)
  useExpedienteDeSesion()
  const [abierta, setAbierta] = useState(false)
  const [que, setQue] = useState('')
  const [porque, setPorque] = useState('')
  const [suyo, setSuyo] = useState(puntaje ?? 0)
  if (!prefijo) return null
  const clave = `${prefijo}|${conclusion}`
  const discusion = expedienteDeSesion.discusionDe(clave)
  const guardar = () => {
    if (noSeGuardo(`discutir:${clave}:${que}`, 'No pudimos guardar tu lectura', guardar, 'Lo que escribiste sigue aquí.')) return
    const deshacer = expedienteDeSesion.discutir(clave, {
      conclusion,
      laIADijo,
      queEstaMal: que,
      porque: porque.trim(),
      ...(puntaje !== undefined && suyo !== puntaje ? { puntaje: suyo } : {}),
    })
    setAbierta(false)
    notifyAction('Tu lectura quedó junto a la de la IA', 'La ve todo el equipo.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }
  const volver = () => {
    if (noSeGuardo(`retirar-discusion:${clave}`, 'No pudimos quitar tu lectura', volver)) return
    const deshacer = expedienteDeSesion.retirarDiscusion(clave)
    notifyAction('Quitaste tu lectura', 'Vuelve a contar lo que concluyó la IA.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }
  const abrir = () => {
    setQue('')
    setPorque('')
    setSuyo(puntaje ?? 0)
    setAbierta(true)
  }
  return (
    <>
      {discusion ? (
        <div className="flex flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2">
            <Text as="span" variant="muted" size="xs">
              {discusion.quien === QUIEN_MUEVE ? 'No estuviste de acuerdo' : `${discusion.quien} no estuvo de acuerdo`}, hoy a las {horaCorta(discusion.cuando)} · la IA
              decía {discusion.laIADijo}
            </Text>
            {!soloVer ? (
              <Button variant="link" size="xs" className="h-auto! p-0!" onClick={volver}>
                <HugeiconsIcon icon={Undo02Icon} size={12} />
                Volver a lo de la IA
              </Button>
            ) : null}
          </span>
          <Text as="span" size="xs">
            {discusion.queEstaMal}
            {discusion.puntaje !== undefined ? ` · le darías ${discusion.puntaje}/100` : ''}: «{discusion.porque}»
          </Text>
        </div>
      ) : !soloVer ? (
        <Button variant="ghost" size="xs" className="w-fit" onClick={abrir}>
          No estoy de acuerdo
        </Button>
      ) : null}
      {abierta ? (
        <VentanaDeAccion
          open
          onOpenChange={setAbierta}
          title="No estás de acuerdo con la IA"
          sub={`En ${conclusion}, la IA dijo ${laIADijo}.`}
          note="Lo de la IA no se borra: tu lectura queda al lado, con tu nombre, y le llega al equipo que entrena a la IA."
          confirmLabel="Guardar mi lectura"
          confirmDisabled={!que || !porque.trim()}
          onConfirm={guardar}
        >
          <Field>
            <FieldLabel>Qué está mal</FieldLabel>
            <RadioGroup value={que} onValueChange={(valor) => setQue(String(valor))} aria-label="Qué está mal" className="flex flex-col gap-2">
              {opciones.map((opcion, indice) => (
                <Field key={opcion} orientation="horizontal">
                  <RadioGroupItem value={opcion} id={`discutir-${indice}`} />
                  <FieldLabel htmlFor={`discutir-${indice}`} className="font-normal">
                    {opcion}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </Field>
          {puntaje !== undefined ? (
            <CampoNumero
              id="discutir-puntaje"
              etiqueta="Puntaje que le darías"
              descripcion={`La IA le dio ${puntaje}. Si no lo cambias, no se guarda un puntaje tuyo.`}
              valor={suyo}
              onCambio={setSuyo}
              min={0}
              max={100}
              unidad="/100"
            />
          ) : null}
          <Field>
            <FieldLabel htmlFor="discutir-porque">Por qué</FieldLabel>
            <Textarea id="discutir-porque" value={porque} onChange={(evento) => setPorque(evento.target.value)} placeholder="Lo que viste tú y la IA no: una respuesta, un dato del CV, algo de la entrevista." />
            <FieldDescription>Lo lee el equipo junto a lo de la IA.</FieldDescription>
          </Field>
        </VentanaDeAccion>
      ) : null}
    </>
  )
}

const QUE_ESTA_MAL_PUNTAJE = ['El puntaje está muy alto', 'El puntaje está muy bajo', 'Leyó mal lo que dijo o lo que trae su CV', 'Otra cosa']

/* Evaluaciones --------------------------------------------------------------------------------------- */

function Cifras({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 @lg:grid-cols-3">{children}</div>
}

// La lectura de la hoja de vida, en texto: lo que tiene a favor y lo que hay que mirar (8 oct, VP de producto: «el texto
// normal en donde te está diciendo lo bueno, lo malo»). Sin barras por requisito ni un «cumple / no cumple» que se
// corrige a mano: con una vacante escrita de corrido, partir los requisitos se vuelve ambiguo para la IA, y el equipo no
// debería tener que volver a revisar lo que ya leyó Serena.
function EvaluacionCVVista({ evaluacion }: { evaluacion: Extract<EvaluacionEtapa, { tipo: 'cv' }> }) {
  const { cv } = evaluacion
  const reemplazada = useContext(HojaReemplazada)
  // Cada frase dice de qué habla: la evidencia sola («Aparece en su experiencia en Rappi») no decía qué.
  const aFavor = cv.criterios.filter((criterio) => (criterio.puntaje ?? 0) >= 70).map((criterio) => `${criterio.nombre}: ${criterio.evidencia}`)
  const porMirar = [
    ...cv.criterios
      .filter((criterio) => (criterio.puntaje ?? 0) < 70)
      .map((criterio) => (criterio.puntaje === null ? `${criterio.nombre}: no aparece en el CV.` : `${criterio.nombre}: ${criterio.evidencia}`)),
    ...cv.filtros.filter((filtro) => !filtro.cumple).map((filtro) => `${filtro.nombre}: ${filtro.detalle}`),
  ]
  return (
    <div className="flex flex-col gap-4">
      {reemplazada ? (
        <Alert variant="info">
          <HugeiconsIcon icon={FileSyncIcon} size={16} />
          <AlertTitle>Esta lectura es del CV anterior</AlertTitle>
          <AlertDescription>
            {reemplazada}. La IA lee la nueva y actualiza el puntaje; mientras tanto, esto es lo que dijo de la anterior.
          </AlertDescription>
        </Alert>
      ) : null}
      <Cifras>
        <CeldaCifra cifra={{ etiqueta: 'Puntaje', valor: `${cv.match}/100`, detalle: 'contra lo que pide la vacante' }} />
        <CeldaCifra cifra={{ etiqueta: 'Umbral mínimo', valor: `${cv.umbral}/100`, detalle: 'para pasar la etapa' }} />
        <CeldaCifra cifra={{ etiqueta: 'Confianza', valor: cv.confianza, detalle: cv.motivoConfianza }} />
      </Cifras>
      {aFavor.length ? (
        <div className="flex flex-col gap-2">
          <Rotulo>A favor</Rotulo>
          <Lista items={aFavor} />
        </div>
      ) : null}
      {porMirar.length ? (
        <div className="flex flex-col gap-2">
          <Rotulo>Por mirar</Rotulo>
          <Lista items={porMirar} />
        </div>
      ) : null}
      {/* Qué no tiene en cuenta (CA-46). */}
      <Text as="p" variant="muted" size="xs">
        La IA lee el CV solo contra lo que pide la vacante. No usa la edad, el género, la nacionalidad, el estado
        civil ni la foto.
      </Text>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge variant={cv.pasa ? 'success-light' : 'destructive-outline'}>{cv.pasa ? 'Válida' : 'No válida (no alcanza el umbral)'}</Badge>
          <Text as="span" variant="muted" size="xs">
            Umbral mínimo: {cv.umbral}/100
          </Text>
        </div>
        <DiscutirIA
          conclusion="la evaluación del CV"
          laIADijo={`${cv.match}/100, ${cv.pasa ? 'válida' : 'no válida'}`}
          opciones={QUE_ESTA_MAL_PUNTAJE}
          puntaje={cv.match}
        />
      </div>
    </div>
  )
}

// La entrevista que se cortó a la mitad (CA-37): lo que alcanzó a responder, sin puntaje total, y la salida: invitarla a
// terminarla desde donde iba. Antes toda entrevista decía «todas respondidas».
function SerenaSinTerminar({ evaluacion, candidaturaId }: { evaluacion: Extract<EvaluacionEtapa, { tipo: 'serena-sin-terminar' }>; candidaturaId?: string }) {
  const enviada = useInvitacionATerminar(candidaturaId ?? '')
  const siguiente = evaluacion.respondidas + 1
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <Text as="div" size="sm" weight="medium" className="flex items-center gap-2">
          <IconoIA />
          Entrevista con Serena AI · sin terminar
        </Text>
        <Text as="span" variant="muted" size="xs">
          Llamada telefónica · se cortó en el minuto {evaluacion.minuto} · {fechaSinAnio(evaluacion.fecha)}
        </Text>
      </div>
      <Cifras>
        <CeldaCifra cifra={{ etiqueta: 'Puntaje', valor: 'Sin puntaje', detalle: 'una entrevista a medias no se califica' }} />
        <CeldaCifra cifra={{ etiqueta: 'Preguntas', valor: `${evaluacion.respondidas} de ${evaluacion.de}`, detalle: 'respondidas antes del corte' }} />
        <CeldaCifra
          cifra={{
            etiqueta: 'Qué sigue',
            valor: enviada ? 'Invitada' : 'Invitarla',
            detalle: enviada ? `a terminarla, hoy a las ${horaCorta(enviada.cuando)}` : `a terminarla desde la pregunta ${siguiente}`,
          }}
        />
      </Cifras>
      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} size={16} />
        <AlertTitle>{evaluacion.motivo}</AlertTitle>
        <AlertDescription>
          Lo que respondió queda guardado. Si la invitas a terminarla, retoma en la pregunta {siguiente} con {PLAZO_ENTREVISTA} días para
          presentarla; al terminar, Serena la califica completa. Si no la termina, la invitación vence como cualquier otra.
        </AlertDescription>
      </Alert>
      {evaluacion.preguntas.map((pregunta) => (
        <div key={pregunta.numero} className="flex flex-col gap-2">
          <Text as="span" variant="muted" size="xs">
            Pregunta {pregunta.numero} de {evaluacion.de} · respondida
          </Text>
          <Text as="div" size="sm" weight="medium">
            {pregunta.pregunta}
          </Text>
          <Lectura>{pregunta.lectura}</Lectura>
          <Text as="span" variant="muted" size="xs">
            Respondió: «{pregunta.respuesta}»
          </Text>
        </div>
      ))}
      <Text as="span" variant="muted" size="xs">
        Pregunta {siguiente} de {evaluacion.de}: se cortó antes de responderla.
      </Text>
      {candidaturaId ? <InvitarATerminar candidaturaId={candidaturaId} desde={siguiente} /> : null}
    </div>
  )
}

// La entrevista de Serena en un diálogo ancho, encima de las etapas: los puntajes por pregunta con su lectura, el
// feedback, la transcripción con su grabación y los comentarios de la etapa. Antes reemplazaba la pestaña con un
// «Volver» y no se entendía dónde se estaba (24 sep, Nicolás): ahora se abre y se cierra, y las etapas quedan donde estaban.
// La entrevista con Serena, entera dentro de la ficha (8 oct, VP de producto: «todo este modal que tienes a la derecha se
// vuelve enfocado en esa partecita específica, con un volver»): puntajes, el feedback de Serena y la transcripción con
// el audio. Antes era un resumen con «Ver la entrevista», que abría otra ventana encima. Los comentarios van aparte,
// debajo, como en cualquier etapa.
function SerenaDetalle({ evaluacion, nombre }: { evaluacion: Extract<EvaluacionEtapa, { tipo: 'serena' }>; nombre: string }) {
  const { serena, preguntas, intentos } = evaluacion
  const aprobo = serena.puntaje >= serena.minimo
  const anterior = intentos?.[intentos.length - 1]
  const [pestana, setPestana] = useState('puntajes')
  const [posicion, setPosicion] = useState(0)
  const [sonando, setSonando] = useState(false)
  const total = serena.duracion * 60
  const escuchar = (segundos: number) => {
    setPosicion(Math.min(total, segundos))
    setSonando(true)
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="span" variant="muted" size="sm">
          {serena.canal} · {serena.duracion} min · {fechaSinAnio(serena.fecha)}
          {intentos?.length ? ` · intento ${intentos.length + 1}, el que cuenta` : ''}
        </Text>
        <Badge variant={aprobo ? 'success-light' : 'warning-light'}>{aprobo ? 'Aprobó' : 'No alcanza el mínimo'}</Badge>
      </div>
      {/* Si la repitió, cada vez con su fecha y por qué; cuenta la última completa (CA-38). */}
      {intentos?.length ? (
        <ItemGroup className="gap-2">
          <Item variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>
                Intento {intentos.length + 1} · {serena.puntaje}/100 · {fechaSinAnio(serena.fecha)}
              </ItemTitle>
              <ItemDescription>
                {anterior ? `${serena.puntaje >= anterior.puntaje ? 'Subió' : 'Bajó'} ${Math.abs(serena.puntaje - anterior.puntaje)} puntos frente al intento ${anterior.numero}.` : null}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant="success-light">
                Cuenta para la decisión
              </Badge>
            </ItemActions>
          </Item>
          {[...intentos].reverse().map((intento) => (
            <Item key={intento.numero} variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>
                  Intento {intento.numero} · {intento.puntaje}/100 · {fechaSinAnio(intento.fecha)}
                </ItemTitle>
                <ItemDescription>{intento.motivo}.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">
                  No cuenta
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : null}

      <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))} className="gap-4">
        <div onKeyDown={retenerFlechas}>
          <ScrollArea className="w-full">
            <TabsList variant="line" className="w-max min-w-full">
              <TabsTrigger value="puntajes" className="flex-none">
                Puntajes
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex-none">
                Feedback de Serena
              </TabsTrigger>
              <TabsTrigger value="transcripcion" className="flex-none">
                Transcripción y audio
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="puntajes" className="flex flex-col gap-5">
          <Cifras>
            <CeldaCifra cifra={{ etiqueta: 'Puntaje', valor: `${serena.puntaje}/100`, detalle: `aprueba con ${serena.minimo}` }} />
            <CeldaCifra cifra={{ etiqueta: 'Preguntas', valor: String(preguntas.length), detalle: 'respondidas' }} />
            <CeldaCifra
              cifra={{
                etiqueta: 'Resultado',
                valor: aprobo ? 'Aprobó' : 'No alcanza',
                detalle: aprobo ? `${serena.puntaje - serena.minimo} sobre el mínimo` : `le faltan ${serena.minimo - serena.puntaje} puntos`,
              }}
            />
          </Cifras>
          <div className="flex flex-col gap-4">
            {preguntas.map((pregunta, indice) => (
              <div key={pregunta.numero} className="flex flex-col gap-4">
                {indice ? <Separator /> : null}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <Text as="span" variant="muted" size="xs">
                      Pregunta {pregunta.numero}
                    </Text>
                    <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                      {pregunta.puntaje}/100
                    </Text>
                  </div>
                  <Text as="div" size="sm" weight="medium">
                    {pregunta.pregunta}
                  </Text>
                  <Lectura>{pregunta.lectura}</Lectura>
                  <Text as="span" variant="muted" size="xs">
                    {nombre} respondió: «{pregunta.respuesta}»
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="flex flex-col gap-4">
          <Lectura>{serena.feedback.resumen}</Lectura>
          <div className="grid gap-5 @lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Rotulo>A favor</Rotulo>
              <Lista items={serena.feedback.fortalezas} />
            </div>
            <div className="flex flex-col gap-2">
              <Rotulo>Por mejorar</Rotulo>
              <Lista items={serena.feedback.mejorar} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcripcion" className="flex flex-col gap-4">
          {/* Se escucha mientras se lee (CA-39). Para el comité, la transcripción se descarga o se imprime tal cual, con
              las alertas en su frase (CA-40). */}
          <div className="flex flex-col gap-3">
            <Grabacion total={total} posicion={posicion} sonando={sonando} onPosicion={setPosicion} onSonando={setSonando} />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => descargarTexto(textoDeTranscripcion(serena.transcripcion, nombre, 'Serena'), `Entrevista Serena AI - ${nombre}.txt`)}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={() => imprimirTexto(textoDeTranscripcion(serena.transcripcion, nombre, 'Serena'), `Entrevista Serena AI - ${nombre}`)}>
                Imprimir
              </Button>
            </div>
          </div>
          <Turnos turnos={serena.transcripcion} agente="Serena" nombre={nombre} onEscuchar={escuchar} />
        </TabsContent>
      </Tabs>
      <DiscutirIA conclusion="la entrevista con Serena AI" laIADijo={`${serena.puntaje}/100`} opciones={QUE_ESTA_MAL_PUNTAJE} puntaje={serena.puntaje} />
    </div>
  )
}

// El informe de las pruebas en texto, para descargarlo o guardarlo con su hoja de vida (CA-41).
const informePsicometrico = (psicometrica: Extract<EvaluacionEtapa, { tipo: 'psicometricas' }>['psicometrica'], nombre: string) =>
  [
    `Informe psicométrico · ${nombre}`,
    `${psicometrica.pruebas.length} pruebas · ${psicometrica.minutos} min · presentadas el ${fechaSinAnio(psicometrica.fecha)}`,
    'Apoya la decisión; no es un diagnóstico. No usa la edad, el género, la nacionalidad ni la foto.',
    '',
    ...psicometrica.pruebas.map((prueba) => `${prueba.prueba}: ${prueba.nivel} · percentil ${prueba.percentil}\n  ${prueba.lectura}`),
    '',
    'Factores que destaca la IA',
    ...psicometrica.factores.map((factor) => `${factor.tipo === 'fortaleza' ? 'A favor' : 'Para revisar'} · ${factor.titulo}: ${factor.texto}`),
  ].join('\n')

function PsicometricaVista({ evaluacion, nombre }: { evaluacion: Extract<EvaluacionEtapa, { tipo: 'psicometricas' }>; nombre: string }) {
  const { psicometrica } = evaluacion
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <Text as="div" size="sm" weight="medium">
            Pruebas psicométricas
          </Text>
          <Text as="span" variant="muted" size="xs">
            {plural(psicometrica.pruebas.length, '1 prueba', `${psicometrica.pruebas.length} pruebas`)} · {psicometrica.minutos} min · presentadas el{' '}
            {fechaSinAnio(psicometrica.fecha)}
          </Text>
        </div>
        {/* El informe completo, como en el expediente de antes (CA-41). */}
        <Button variant="outline" size="sm" onClick={() => descargarTexto(informePsicometrico(psicometrica, nombre), psicometrica.informe.replace(/\.pdf$/, '.txt'))}>
          <HugeiconsIcon icon={Download04Icon} size={16} />
          Descargar informe
        </Button>
      </div>
      {psicometrica.pruebas.map((prueba) => (
        <div key={prueba.prueba} className="flex flex-col gap-2">
          <Progress value={prueba.percentil} aria-label={prueba.prueba}>
            <ProgressLabel>{prueba.prueba}</ProgressLabel>
            <ProgressValue className="ms-auto">{() => `${prueba.nivel} · percentil ${prueba.percentil}`}</ProgressValue>
          </Progress>
          <Lectura>{prueba.lectura}</Lectura>
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Text as="div" size="sm" weight="medium" className="flex items-center gap-2">
          <IconoIA />
          Factores que destaca la IA
        </Text>
        {/* Lo que la IA no hace (CA-46): apoya la decisión, no la toma ni diagnostica. */}
        <Text as="p" variant="muted" size="xs">
          Apoya la decisión; no es un diagnóstico. No usa la edad, el género, la nacionalidad ni la foto.
        </Text>
        {psicometrica.factores.map((factor) => (
          <div key={factor.titulo} className="flex items-start gap-2">
            <HugeiconsIcon
              icon={factor.tipo === 'fortaleza' ? CheckmarkCircle02Icon : Alert02Icon}
              size={16}
              className={cn('mt-0.5 shrink-0', factor.tipo === 'fortaleza' ? 'text-success' : 'text-warning')}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text as="span" size="sm" weight="medium">
                {factor.titulo}
              </Text>
              <Text as="span" variant="muted" size="xs">
                {factor.texto}
              </Text>
            </div>
          </div>
        ))}
        <DiscutirIA
          conclusion="lo que destaca de las pruebas psicométricas"
          laIADijo={psicometrica.factores.map((factor) => `«${factor.titulo}»`).join(', ')}
          opciones={['No coincide con lo que vimos de la persona', 'Le falta el contexto del cargo', 'Otra cosa']}
        />
      </div>
    </div>
  )
}

function RoleplayVista({ evaluacion, nombre }: { evaluacion: Extract<EvaluacionEtapa, { tipo: 'roleplay' }>; nombre: string }) {
  const { roleplay, puntaje } = evaluacion
  const aprobo = puntaje >= roleplay.minimo
  const [viendo, setViendo] = useState(false)
  const texto = textoDeTranscripcion(roleplay.transcripcion, nombre, roleplay.agente)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <Text as="div" size="sm" weight="medium" className="flex items-center gap-2">
          <IconoIA />
          Roleplay AI con {roleplay.agente}
        </Text>
        <Text as="span" variant="muted" size="xs">
          {roleplay.escenario}
        </Text>
      </div>
      <Cifras>
        <CeldaCifra cifra={{ etiqueta: 'Puntaje', valor: `${puntaje}/100`, detalle: `aprueba con ${roleplay.minimo}` }} />
        <CeldaCifra cifra={{ etiqueta: 'Resultado', valor: aprobo ? 'Aprobó' : 'No alcanza', detalle: `intento ${roleplay.intento} · ${roleplay.duracion} min` }} />
      </Cifras>
      {roleplay.criterios.map((criterio) => (
        <Progress key={criterio.nombre} value={criterio.puntaje} aria-label={criterio.nombre}>
          <ProgressLabel>{criterio.nombre}</ProgressLabel>
          <ProgressValue className="ms-auto">{() => `${criterio.puntaje} · pesa ${criterio.peso} %`}</ProgressValue>
        </Progress>
      ))}
      {roleplay.alertas.length ? (
        roleplay.alertas.map((alerta) => (
          <Alert key={alerta.momento} variant="warning">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <AlertTitle>
              {alerta.tipo} en el minuto {alerta.momento}
            </AlertTitle>
            <AlertDescription>{alerta.detalle}</AlertDescription>
          </Alert>
        ))
      ) : (
        <Text as="span" variant="muted" size="sm" className="flex items-center gap-2">
          <HugeiconsIcon icon={SecurityCheckIcon} size={16} className="shrink-0 text-success" aria-hidden />
          Sin intentos de trampa ni de prompt injection.
        </Text>
      )}
      <Lista items={roleplay.fortalezas} />
      <div className="flex flex-wrap items-center gap-2">
        {/* La conversación completa, con las alertas en su frase (CA-41): antes el dato existía y no se veía. */}
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setViendo(true)}>
          Ver la simulación
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
        <DiscutirIA conclusion="el roleplay" laIADijo={`${puntaje}/100`} opciones={QUE_ESTA_MAL_PUNTAJE} puntaje={puntaje} />
      </div>
      <VentanaDeAccion
        open={viendo}
        onOpenChange={setViendo}
        size="wide"
        title={`Roleplay de ${nombre} con ${roleplay.agente}`}
        sub={`${roleplay.escenario} · ${roleplay.duracion} min · ${fechaSinAnio(roleplay.fecha)}`}
        cancelLabel="Cerrar"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => descargarTexto(texto, `Roleplay - ${nombre}.txt`)}>
            <HugeiconsIcon icon={Download04Icon} size={16} />
            Descargar
          </Button>
          <Button variant="outline" size="sm" onClick={() => imprimirTexto(texto, `Roleplay - ${nombre}`)}>
            Imprimir
          </Button>
        </div>
        <Turnos turnos={roleplay.transcripcion} agente={roleplay.agente} nombre={nombre} />
      </VentanaDeAccion>
    </div>
  )
}

/* Etapas de una postulación -------------------------------------------------------------------------- */

// Dónde va, dicho con palabras: «Rechazado en la etapa 2 de 5 · Serena AI».
function resumenProgreso(postulacion: Postulacion) {
  const total = postulacion.etapas.length
  const indice = postulacion.etapas.findIndex((etapa) => etapa.estado === 'actual' || etapa.estado === 'rechazada' || etapa.estado === 'retiro')
  const etapa = postulacion.etapas[indice]
  if (postulacion.estado === 'Contratado') return `Completó las ${total} etapas y fue contratado`
  if (!etapa) return `${total} etapas`
  if (etapa.estado === 'rechazada') return `Rechazado en la etapa ${indice + 1} de ${total} · ${etapa.titulo}`
  if (etapa.estado === 'retiro') return `Se retiró en la etapa ${indice + 1} de ${total} · ${etapa.titulo}`
  return `Etapa ${indice + 1} de ${total} · ${etapa.titulo}`
}

// La línea de etapas de una postulación, la misma en «Resumen» y en «Postulaciones» (8 oct, VP de producto: «los
// timelines para mí son bien importantes… summarize y después entras a los detalles»). Lo hecho con visto, lo saltado
// con la flecha de saltar, la entrevista cancelada con un guion y donde se quedó con una «x». Con `abrir`, tocar una
// etapa abre su detalle en la misma ficha, con «Volver»; el cambio de etapa se hace con los botones de abajo.
export function LineaDeEtapas({ postulacion, abrir = false }: { postulacion: Postulacion; abrir?: boolean }) {
  const navegar = useContext(NavegarFicha)
  const { etapas } = postulacion
  const donde = etapas.findIndex((etapa) => etapa.estado === 'actual' || etapa.estado === 'rechazada' || etapa.estado === 'retiro')
  const valor = donde >= 0 ? donde + 1 : etapas.length
  return (
    <Stepper value={valor} onValueChange={abrir ? (paso) => navegar('etapas', etapas[paso - 1]?.id) : undefined}>
      {/* Nombre debajo de cada paso, como el ejemplo «titles below» de ReUI: el punto y su línea se colocan a mano (solo
          posición) y la línea de lo ya recorrido se pinta como el paso hecho. */}
      <StepperNav className="items-start">
        {etapas.map((etapa, indice) => {
          const dice = `${TEXTO_ETAPA[etapa.estado]}${abrir ? '. Ver lo que pasó' : ''}`
          const icono =
            etapa.estado === 'completada'
              ? Tick02Icon
              : etapa.estado === 'saltada'
                ? NextIcon
                : etapa.estado === 'sin-terminar'
                  ? MinusSignIcon
                  : etapa.estado === 'rechazada'
                    ? Cancel01Icon
                    : etapa.estado === 'retiro'
                      ? Logout03Icon
                      : null
          return (
            <StepperItem key={etapa.id} step={indice + 1} completed={etapa.estado === 'completada'} className="relative flex-1 flex-col! items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <StepperTrigger
                      // Sin paneles: el recorrido indica y abre, no cambia de contenido debajo. Sin esto, cada paso
                      // apunta a un panel que no existe y el lector de pantalla lo marca como error.
                      aria-controls={undefined}
                      className={cn('flex-col gap-2', !abrir && 'cursor-default')}
                      aria-label={`${etapa.titulo}: ${dice}`}
                    >
                      <StepperIndicator>
                        {icono ? <HugeiconsIcon icon={icono} size={14} strokeWidth={2.5} aria-hidden="true" /> : indice + 1}
                      </StepperIndicator>
                      <StepperTitle
                        className={cn('line-clamp-2 px-1 text-center text-xs leading-tight', indice === donde ? 'text-foreground' : 'font-normal text-muted-foreground')}
                      >
                        {etapa.titulo}
                      </StepperTitle>
                    </StepperTrigger>
                  }
                />
                <TooltipContent>{dice}</TooltipContent>
              </Tooltip>
              {indice < etapas.length - 1 ? (
                <StepperSeparator className="absolute top-3 right-[calc(-50%+1rem)] left-[calc(50%+1rem)] m-0! -translate-y-1/2 group-data-[state=completed]/step:bg-primary" />
              ) : null}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Stepper>
  )
}

const TONO_MARCA: Record<MarcaCambio['tono'], 'warning-light' | 'info-light' | 'secondary'> = {
  aviso: 'warning-light',
  info: 'info-light',
  neutro: 'secondary',
}

// El rastro de la vacante: cada cambio de etapa con quién lo hizo, cuándo, qué pasó (se saltó, se canceló la
// entrevista, se le escribió) y el comentario que dejó. Lo de esta sesión arriba, marcado «Ahora».
function CambiosDeEtapa({ cambios: deEtapa, postulacionId }: { cambios: CambioEtapa[]; postulacionId: string }) {
  // Con todo lo demás que se hizo con ella, en orden de lo más nuevo a lo más viejo; lo reconstruido de antes de la
  // sesión (sin hora) queda al final, como estaba.
  const extra = useContext(ActividadExtra)(postulacionId)
  const conHora = [...deEtapa, ...extra].filter((cambio) => cambio.ms !== undefined).sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0))
  const cambios = [...conHora, ...deEtapa.filter((cambio) => cambio.ms === undefined)]
  return (
    <Marco titulo="Lo que pasó en esta vacante" descripcion="Cambios de etapa, correos, contactos, documentos, comentarios y correcciones a la IA: quién y cuándo.">
      <FramePanel>
        <Timeline orientation="vertical" value={0}>
          {cambios.map((cambio, indice) => (
            <TimelineItem key={cambio.id} step={indice + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>
                  {cambio.quien} · {cambio.cuando}
                </TimelineDate>
                <TimelineTitle className="flex flex-wrap items-center gap-2">
                  {cambio.titulo}
                  {cambio.ahora ? (
                    <Badge variant="primary-light">
                      Ahora
                    </Badge>
                  ) : null}
                </TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              {cambio.marcas.length || cambio.comentario ? (
                <TimelineContent className="flex flex-col gap-2">
                  {cambio.marcas.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {cambio.marcas.map((marca) => (
                        <Badge key={marca.texto} variant={TONO_MARCA[marca.tono]}>
                          {marca.texto}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                  {cambio.comentario ? (
                    <Text as="p" size="sm" className="flex items-start gap-1.5">
                      <HugeiconsIcon icon={BubbleChatIcon} size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />«{cambio.comentario}»
                    </Text>
                  ) : null}
                </TimelineContent>
              ) : null}
            </TimelineItem>
          ))}
        </Timeline>
      </FramePanel>
    </Marco>
  )
}

type ComentariosDe = (postulacion: Postulacion, etapa: EtapaPostulacion) => Nota[]
type Comentar = (postulacion: Postulacion, etapa: EtapaPostulacion, texto: string, privada?: boolean) => void

// Una etapa por dentro, en la misma ficha y con «Volver» (8 oct, VP de producto): lo que pasó con ella (se saltó, se
// rechazó aquí), su evaluación entera y los comentarios del equipo. Se llega tocando la etapa en la línea de «Resumen»
// o desde lo que la nombra (la alerta de lo pendiente, la última nota).
function EtapaDetalle({
  postulacion,
  etapaId,
  nombre,
  comentariosDe,
  onComentar,
  onVolver,
}: {
  postulacion: Postulacion
  etapaId: string
  nombre: string
  comentariosDe: ComentariosDe
  onComentar: Comentar
  onVolver: () => void
}) {
  const indice = postulacion.etapas.findIndex((una) => una.id === etapaId)
  const etapa = postulacion.etapas[indice]
  if (!etapa) return null
  const notas = comentariosDe(postulacion, etapa)
  const evaluacion = etapa.evaluacion
  const sinNada = !etapa.nota && !etapa.motivo && !evaluacion && !etapa.sinResultado && !etapa.salida
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ms-2 w-fit" onClick={onVolver}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
        Volver al resumen
      </Button>
      <Marco
        titulo={`${indice + 1}. ${etapa.titulo}`}
        // La lectura de la hoja de vida también es de la IA, aunque la etapa no se llame así.
        ia={etapa.ia || evaluacion?.tipo === 'cv'}
        descripcion={etapa.descripcion}
        accion={
          <Badge variant={BADGE_ETAPA[etapa.estado]} className="shrink-0">
            {TEXTO_ETAPA[etapa.estado]}
          </Badge>
        }
      >
        <FramePanel className="@container flex flex-col gap-5">
          {/* Lo que pasó con esta etapa al mover a la persona: se saltó, se canceló su entrevista, volvió… */}
          {etapa.nota ? (
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={ICONO_ETAPA[etapa.estado]} size={16} className={cn('mt-0.5 shrink-0', COLOR_ETAPA[etapa.estado])} aria-hidden />
              <Text as="span" size="sm">
                {etapa.nota}
              </Text>
            </div>
          ) : null}
          {etapa.motivo ? (
            <div className="flex items-start gap-2">
              <HugeiconsIcon
                icon={etapa.estado === 'retiro' ? Logout03Icon : Cancel01Icon}
                size={16}
                className={cn('mt-0.5 shrink-0', etapa.estado === 'retiro' ? 'text-muted-foreground' : 'text-destructive')}
                aria-hidden
              />
              <Text as="span" size="sm">
                {etapa.estado === 'retiro' ? 'Se retiró en esta etapa' : 'Se rechazó en esta etapa'}. Motivo: {etapa.motivo}.
              </Text>
            </div>
          ) : null}
          {evaluacion?.tipo === 'cv' ? <EvaluacionCVVista evaluacion={evaluacion} /> : null}
          {evaluacion?.tipo === 'serena' ? <SerenaDetalle evaluacion={evaluacion} nombre={nombre} /> : null}
          {evaluacion?.tipo === 'serena-sin-terminar' ? <SerenaSinTerminar evaluacion={evaluacion} candidaturaId={postulacion.candidaturaId} /> : null}
          {evaluacion?.tipo === 'psicometricas' ? <PsicometricaVista evaluacion={evaluacion} nombre={nombre} /> : null}
          {evaluacion?.tipo === 'roleplay' ? <RoleplayVista evaluacion={evaluacion} nombre={nombre} /> : null}
          {etapa.sinResultado ? (
            <Text as="span" variant="muted" size="sm">
              {etapa.sinResultado}
            </Text>
          ) : null}
          {/* Sin hoja de vida, o sin poder leerla: la salida está aquí mismo (CA-14, CA-44). */}
          {etapa.salida ? <SalidaSinLectura salida={etapa.salida} /> : null}
          {sinNada ? (
            <Text as="span" variant="muted" size="sm">
              {etapa.estado === 'pendiente' ? 'Todavía no llega a esta etapa.' : 'Esta etapa no deja evaluación: lo que pasó queda en los comentarios del equipo.'}
            </Text>
          ) : null}
        </FramePanel>
        {/* Los comentarios del equipo, aparte de la evaluación (8 oct, VP de producto: «prefiero por fuera»). */}
        <FramePanel>
          <Comentarios notas={notas} etapa={etapa.titulo} onAgregar={(texto, privada) => onComentar(postulacion, etapa, texto, privada)} />
        </FramePanel>
      </Marco>
    </div>
  )
}

/* Vacantes: el historial ----------------------------------------------------------------------------- */

// Las postulaciones: un acordeón con una fila por vacante. Abierta, cada una trae su línea de etapas y sus acciones, y
// nada más (8 oct, VP de producto: «mataría los de abajo, los que tienen los números; dejaría solamente el timeline y el
// ver detalle»). En la de esta vacante, tocar una etapa abre su detalle, como en «Resumen».
function PestanaVacantes({
  perfil,
  acciones,
  onVerEtapas,
}: {
  perfil: PerfilCompleto
  acciones?: (postulacion: Postulacion) => ReactNode
  // Vuelve a «Resumen» (solo con la vacante de la ficha).
  onVerEtapas?: () => void
}) {
  const actuales = perfil.historial.filter((postulacion) => postulacion.estado === 'En curso').length
  // Abierta de entrada: la de esta ficha, o la primera en curso, o la primera.
  const [abiertas, setAbiertas] = useState<string[]>(() => {
    const inicial =
      perfil.historial.find((postulacion) => postulacion.actual) ??
      perfil.historial.find((postulacion) => postulacion.estado === 'En curso') ??
      perfil.historial[0]
    return inicial ? [inicial.id] : []
  })

  return (
    <Marco titulo="Postulaciones" descripcion="Las vacantes de la empresa en las que ha estado y hasta dónde llegó.">
      <FramePanel>
        <div className="grid grid-cols-2 gap-4">
          <CeldaCifra cifra={{ etiqueta: 'Vacantes actuales', valor: String(actuales), detalle: 'en las que sigue en proceso' }} />
          <CeldaCifra cifra={{ etiqueta: 'En total', valor: String(perfil.historial.length), detalle: 'vacantes en las que ha estado' }} />
        </div>
      </FramePanel>
      {/* Sin relleno propio arriba y abajo: el de cada fila (16 px) ya iguala al de los lados (8 oct, Nicolás). */}
      <FramePanel className={perfil.historial.length ? 'py-0!' : undefined} onKeyDown={retenerFlechas}>
        {perfil.historial.length ? (
          <Accordion multiple value={abiertas} onValueChange={(valor) => setAbiertas(valor as string[])}>
            {perfil.historial.map((postulacion) => {
              const extra = acciones?.(postulacion)
              const verEtapas = postulacion.actual && onVerEtapas
              return (
                <AccordionItem key={postulacion.id} value={postulacion.id}>
                  <AccordionTrigger className="gap-3">
                    <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Text as="span" size="sm" weight="medium">
                          {postulacion.vacante}
                        </Text>
                        <Badge variant={BADGE_POSTULACION[postulacion.estado]}>
                          {postulacion.estado}
                        </Badge>
                        {postulacion.actual ? (
                          <Badge variant="secondary">
                            Esta vacante
                          </Badge>
                        ) : null}
                      </span>
                      <Text as="span" variant="muted" size="xs">
                        Se postuló el {cuando(postulacion.fecha)} · {resumenProgreso(postulacion)}
                      </Text>
                      {postulacion.motivo ? (
                        <Text as="span" variant="muted" size="xs">
                          Motivo: {postulacion.motivo}
                        </Text>
                      ) : null}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <LineaDeEtapas postulacion={postulacion} abrir={Boolean(verEtapas)} />
                      {extra || verEtapas ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {extra}
                          {verEtapas ? (
                            <Button variant="outline" size="sm" onClick={onVerEtapas}>
                              Ver el resumen
                              <HugeiconsIcon icon={ArrowRight01Icon} />
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Briefcase01Icon} />
              </EmptyMedia>
              <EmptyTitle>No ha estado en ninguna vacante</EmptyTitle>
              <EmptyDescription>Cuando se postule o la postules, aquí queda su recorrido.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </FramePanel>
    </Marco>
  )
}

/* El perfil ------------------------------------------------------------------------------------------ */

// Lo que se ve mientras llega una pestaña: sus primeras secciones, con el título de verdad y el contenido en gris. Lo de
// arriba (quién es, su contacto y las pestañas) ya se sabe al abrir a la persona, así que se queda quieto. «Resumen» lo
// pone cada exploración, así que va sin título.
const SECCIONES_CARGANDO: Record<Pestana, { titulo?: string; forma: 'lineas' | 'filas' | 'chips'; cuantas: number }[]> = {
  vacante: [
    { forma: 'lineas', cuantas: 3 },
    { forma: 'filas', cuantas: 4 },
  ],
  informacion: [
    { titulo: 'Habilidades', forma: 'chips', cuantas: 6 },
    { titulo: 'Información de contacto', forma: 'filas', cuantas: 3 },
  ],
  experiencia: [{ titulo: 'Experiencia laboral', forma: 'filas', cuantas: 3 }],
  educacion: [{ titulo: 'Educación', forma: 'filas', cuantas: 2 }],
  documentos: [{ titulo: 'Documentos', forma: 'filas', cuantas: 3 }],
  vacantes: [{ titulo: 'Postulaciones', forma: 'filas', cuantas: 3 }],
}

function PestanaCargando({ pestana, falla = false, onReintentar }: { pestana: Pestana; falla?: boolean; onReintentar?: () => void }) {
  if (falla && onReintentar) return <ErrorDeCarga que="su ficha" onReintentar={onReintentar} />
  return (
    <Esqueleto etiqueta="Cargando la ficha" className="flex flex-col gap-4">
      {SECCIONES_CARGANDO[pestana].map((seccion, i) => {
        const piezas = Array.from({ length: seccion.cuantas }, (_, j) =>
          seccion.forma === 'chips' ? (
            <Skeleton key={j} className="h-5 w-20" />
          ) : seccion.forma === 'filas' ? (
            <div key={j} className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <LineaEsqueleto ancho="w-1/2" />
                <LineaEsqueleto tamano="chico" ancho="w-3/4" />
              </div>
            </div>
          ) : (
            <LineaEsqueleto key={j} ancho={j === seccion.cuantas - 1 ? 'w-2/3' : 'w-full'} />
          ),
        )
        const cuerpo = <FramePanel className={seccion.forma === 'chips' ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-3'}>{piezas}</FramePanel>
        return seccion.titulo ? (
          <Marco key={i} titulo={seccion.titulo}>
            {cuerpo}
          </Marco>
        ) : (
          <Frame key={i}>
            <FrameHeader>
              <LineaEsqueleto tamano="titulo" ancho="w-1/3" />
            </FrameHeader>
            {cuerpo}
          </Frame>
        )
      })}
    </Esqueleto>
  )
}

export function PerfilCandidato({
  perfil,
  candidatura,
  cabecera,
  children,
  pie,
  accionesPostulacion,
  pestanaInicial,
}: {
  perfil: PerfilCompleto
  // Con candidatura aparecen «Resumen» (el `children`) y «Etapas».
  candidatura?: Candidatura
  // Quién es: lo pone cada exploración, con su propia cara.
  cabecera?: ReactNode
  // La evaluación propia de cada exploración para esta vacante.
  children?: ReactNode
  // Lo que queda fijo abajo en todas las pestañas (la barra de decisión de la exploración 3).
  pie?: ReactNode
  // Acciones extra en cada vacante del historial («Ver su ajuste», «Ir a la vacante» en «Mis candidatos»).
  accionesPostulacion?: (postulacion: Postulacion) => ReactNode
  // Con qué abre (la exploración la elige según la etapa de la persona: `pestanaParaEtapa` en ficha-persona.tsx).
  pestanaInicial?: PestanaInicial
}) {
  const actual = perfil.historial.find((postulacion) => postulacion.actual)
  // Una pestaña que esta ficha no tiene (las de la vacante, sin candidatura) abre en la primera que sí tiene.
  const [pestana, setPestana] = useState<Pestana>(() => {
    const pedida: Pestana | undefined = pestanaInicial === 'hoja-de-vida' ? 'documentos' : pestanaInicial === 'etapas' ? 'vacante' : pestanaInicial
    const existe = pedida && (pedida === 'vacante' ? Boolean(candidatura) : true)
    return existe && pedida ? pedida : candidatura ? 'vacante' : 'informacion'
  })
  // La hoja de vida que se abre sola al llegar a «Documentos» (desde una etapa de revisarla o desde la alerta).
  const [hojaPorAbrir, setHojaPorAbrir] = useState(pestanaInicial === 'hoja-de-vida')
  // La etapa abierta por dentro, en la misma ficha y con «Volver» (8 oct).
  const [detalle, setDetalle] = useState<string | null>(null)
  // Carga al abrir a la persona, no al cambiar de pestaña: en el celular se veía cargando a cada rato (CA-33). Si no
  // carga (`?simular=error`), lo dice en el lugar de la pestaña y se reintenta.
  const carga = useCargaConError(perfil.id)
  const cargando = carga.cargando || carga.falla
  // Los documentos y los comentarios quedan guardados para el equipo aunque se cierre la ficha (CA-04).
  useExpedienteDeSesion()
  const documentos = expedienteDeSesion.documentosDe(perfil.id, perfil.documentos)
  // Quien escribe es quien está usando la plataforma, no la dueña de la vacante (CA-23).
  const yo = QUIEN_MUEVE
  const soloVer = candidatura ? permisoEn(candidatura.vacante).nivel === 'solo-ver' : false
  const reemplazo = [...expedienteDeSesion.eventosDe(perfil.id)].reverse().find((evento) => evento.titulo.startsWith('Reemplazaste el CV'))
  const hojaReemplazada = reemplazo ? `${reemplazo.quien === QUIEN_MUEVE ? 'Reemplazaste' : `${reemplazo.quien} reemplazó`} el CV hoy a las ${horaCorta(reemplazo.cuando)}` : null
  // La historia de la persona en la vacante suma lo que se hizo en la sesión (CA-49).
  const corregidas = useRequisitosCorregidos()
  const actividadExtra = (postulacionId: string): CambioEtapa[] => [
    ...expedienteDeSesion.eventosDe(perfil.id, postulacionId).map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      quien: evento.quien === QUIEN_MUEVE ? 'Tú' : evento.quien,
      cuando: `Hoy, ${horaCorta(evento.cuando)}`,
      marcas: [],
      comentario: evento.detalle,
      ahora: true,
      ms: evento.cuando,
    })),
    ...(candidatura && postulacionId === actual?.id
      ? corregidas
          .filter((una) => una.candidaturaId === candidatura.id)
          .map((una) => ({
            id: una.id,
            titulo: `Corregiste «${una.requisito}»: ${VEREDICTO_TEXTO[una.despues].toLowerCase()}`,
            quien: una.quien === QUIEN_MUEVE ? 'Tú' : una.quien,
            cuando: `Hoy, ${horaCorta(una.cuando)}`,
            marcas: [{ texto: `La IA decía «${VEREDICTO_TEXTO[una.antes].toLowerCase()}»`, tono: 'neutro' as const }],
            comentario: una.motivo,
            ahora: true,
            ms: una.cuando,
          }))
      : []),
  ]

  // Eliminar y reemplazar se deshacen desde el aviso: el documento vuelve a su lugar.
  const eliminarDocumento = (documento: DocumentoCandidato) => {
    if (noSeGuardo(`eliminar-documento:${documento.id}`, `No pudimos eliminar «${documento.nombre}»`, () => eliminarDocumento(documento), 'Sigue en su ficha.')) return
    const deshacer = expedienteDeSesion.eliminar(perfil.id, documento)
    notifyAction(`Eliminamos «${documento.nombre}»`, undefined, { label: 'Deshacer', onClick: deshacer }, 'success')
  }
  const reemplazarDocumento = (anterior: DocumentoCandidato, nuevo: DocumentoCandidato) => {
    const deshacer = expedienteDeSesion.reemplazar(perfil.id, anterior, nuevo)
    notifyAction('Reemplazamos el CV', 'La IA lo vuelve a leer.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  const comentariosDe: ComentariosDe = (postulacion, etapa) => [
    ...etapa.comentarios,
    ...expedienteDeSesion.comentariosDe(claveDeComentario(perfil.id, postulacion.id, etapa.id)),
  ]
  const comentar: Comentar = (postulacion, etapa, texto, privada = false) => {
    // Si no se guarda, el aviso deja reintentar con el mismo texto: no se pierde.
    if (noSeGuardo(`comentar:${postulacion.id}:${etapa.id}:${texto}`, 'No pudimos guardar tu comentario', () => comentar(postulacion, etapa, texto, privada), 'Tu texto no se perdió.')) return
    const deshacer = expedienteDeSesion.comentar(
      claveDeComentario(perfil.id, postulacion.id, etapa.id),
      { id: Date.now(), autor: yo, fecha: ahora(), texto, privada: privada || undefined },
      etapa.titulo,
    )
    // «@Nombre» le avisa a esa persona del equipo (CA-42).
    const equipo = [...PERSONAS_EMPRESA.map((una) => una.nombre), ...(candidatura?.vacante.equipo.map((una) => una.nombre) ?? [])]
    const mencionadas = [...new Set(equipo.filter((nombre) => new RegExp(`@${nombre.split(' ')[0]}\\b`, 'i').test(texto)))].filter((nombre) => nombre !== QUIEN_MUEVE)
    if (mencionadas.length) expedienteDeSesion.mencionar(perfil.id, postulacion.id, mencionadas)
    // Un solo aviso: a quién se le avisó o, si no, dónde quedó.
    notifyAction(
      'Comentario agregado',
      mencionadas.length ? `Le avisamos a ${mencionadas.join(' y ')}.` : `En ${etapa.titulo} · ${postulacion.vacante}.`,
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  // Al cambiar de pestaña con la ficha ya bajada, el contenido nuevo empieza justo debajo de las pestañas pegadas, no
  // a media altura del anterior.
  const caja = useRef<HTMLDivElement>(null)
  const ancla = useRef<HTMLDivElement>(null)
  const cambiarA = (valor: Pestana) => {
    setDetalle(null)
    setPestana(valor)
    const tope = ancla.current?.offsetTop ?? 0
    if (caja.current && caja.current.scrollTop > tope) caja.current.scrollTop = tope
  }
  const navegar = (destino: PestanaInicial, etapa?: string) => {
    // A una etapa: su detalle, arriba de la ficha. Sin etapa (o una que no es de esta vacante), al «Resumen».
    if (destino === 'etapas') {
      if (etapa && actual?.etapas.some((una) => una.id === etapa)) {
        setPestana('vacante')
        setDetalle(etapa)
        caja.current?.scrollTo({ top: 0 })
      } else cambiarA('vacante')
      return
    }
    if (destino === 'hoja-de-vida') setHojaPorAbrir(true)
    cambiarA(destino === 'hoja-de-vida' ? 'documentos' : destino)
  }

  const pestanas: { valor: Pestana; titulo: string }[] = [
    // «Resumen» y no «Esta vacante» (25 sep, Nicolás): la ficha ya vive dentro de la vacante, que tiene arriba su
    // propia pestaña; el nombre hacía pensar que ahí se repetía la vacante en cada persona, y es la persona frente a ella.
    // «Etapas» ya no es pestaña (8 oct, VP de producto): su línea está en «Resumen» y cada etapa se abre desde ahí.
    ...(candidatura ? [{ valor: 'vacante' as const, titulo: 'Resumen' }] : []),
    // Nombres cortos: en el panel lateral (36rem) los largos no caben. Cada uno dice lo mismo que el título de lo que
    // abre: «Empleos», su experiencia laboral; «Estudios», su educación; «Postulaciones» (antes «Historial», que no
    // decía de qué), las vacantes en las que ha estado.
    { valor: 'informacion', titulo: 'Datos' },
    { valor: 'experiencia', titulo: 'Empleos' },
    { valor: 'educacion', titulo: 'Estudios' },
    { valor: 'documentos', titulo: 'Documentos' },
    { valor: 'vacantes', titulo: 'Postulaciones' },
  ]

  return (
    <NavegarFicha.Provider value={navegar}>
    <ClaveDiscusion.Provider value={candidatura && actual ? `${perfil.id}|${actual.id}` : null}>
    <ActividadExtra.Provider value={actividadExtra}>
    <HojaReemplazada.Provider value={hojaReemplazada}>
    <SoloVerFicha.Provider value={soloVer}>
    <div className="flex h-full min-h-0 flex-col">
      {/* `[&>*]:shrink-0`: con poco alto los bloques se encogían en vez de hacer scroll. */}
      <div ref={caja} className="relative flex min-h-0 flex-1 flex-col overflow-auto px-5 pb-8 [&>*]:shrink-0">
        {cabecera ? <div className="pt-5">{cabecera}</div> : null}
        {detalle && actual ? (
          <div className="pt-4">
            <EtapaDetalle
              postulacion={actual}
              etapaId={detalle}
              nombre={perfil.nombre}
              comentariosDe={comentariosDe}
              onComentar={comentar}
              onVolver={() => setDetalle(null)}
            />
          </div>
        ) : (
          <>
            <div className="pt-4">
              <Contacto perfil={perfil} />
            </div>
            <div ref={ancla} />
            <Tabs value={pestana} onValueChange={(valor) => cambiarA(valor as Pestana)} className="gap-0">
              {/* Pegadas arriba al bajar. El fondo es el de donde vive la ficha: la tarjeta, o el panel lateral, que en
                  oscuro es otro gris. */}
              <div className="sticky top-0 z-10 bg-card pt-5 in-data-[slot=drawer-popup]:bg-popover" onKeyDown={retenerFlechas}>
                <ScrollArea className="w-full">
                  {/* Sin espacio entre pestañas: cada una ya trae su aire por dentro, y así las siete caben en el panel. */}
                  <TabsList variant="line" className="w-max min-w-full gap-0">
                    {pestanas.map((una) => (
                      <TabsTrigger key={una.valor} value={una.valor} className="flex-none">
                        {una.titulo}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {candidatura ? (
                <TabsContent value="vacante" className="pt-5">
                  {cargando ? (
                    <PestanaCargando pestana="vacante" falla={carga.falla} onReintentar={carga.reintentar} />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {children}
                      {/* Lo que el equipo anotó de la persona, no de una etapa: queda fijo aunque se la mueva (CA-24). */}
                      {actual?.generales?.length ? (
                        <Marco titulo="Notas generales" descripcion="Sobre la persona, no sobre una etapa: no cambian de lugar cuando se la mueve.">
                          <FramePanel>
                            <ListaNotas notas={actual.generales} vacia="Sin notas generales." />
                          </FramePanel>
                        </Marco>
                      ) : null}
                      {/* La bitácora de la persona en esta vacante, al final: quién hizo qué y cuándo. */}
                      {actual?.cambios?.length ? <CambiosDeEtapa cambios={actual.cambios} postulacionId={actual.id} /> : null}
                    </div>
                  )}
                </TabsContent>
              ) : null}
              <TabsContent value="informacion" className="@container pt-5">
                {cargando ? <PestanaCargando pestana="informacion" falla={carga.falla} onReintentar={carga.reintentar} /> : <PestanaInformacion perfil={perfil} rango={candidatura?.vacante.rango} soloVer={soloVer} />}
              </TabsContent>
              <TabsContent value="experiencia" className="@container pt-5">
                {cargando ? <PestanaCargando pestana="experiencia" falla={carga.falla} onReintentar={carga.reintentar} /> : <ExperienciaLaboral perfil={perfil} />}
              </TabsContent>
              <TabsContent value="educacion" className="@container pt-5">
                {cargando ? <PestanaCargando pestana="educacion" falla={carga.falla} onReintentar={carga.reintentar} /> : <Estudios perfil={perfil} />}
              </TabsContent>
              <TabsContent value="documentos" className="@container pt-5">
                {cargando ? (
                  <PestanaCargando pestana="documentos" falla={carga.falla} onReintentar={carga.reintentar} />
                ) : (
                  <PestanaDocumentos
                    perfil={perfil}
                    documentos={documentos}
                    yo={yo}
                    abrirHojaDeVida={hojaPorAbrir}
                    onHojaAbierta={() => setHojaPorAbrir(false)}
                    onAgregar={(documento) => expedienteDeSesion.agregar(perfil.id, documento)}
                    onReemplazar={reemplazarDocumento}
                    onEliminar={eliminarDocumento}
                  />
                )}
              </TabsContent>
              <TabsContent value="vacantes" className="@container pt-5">
                {cargando ? (
                  <PestanaCargando pestana="vacantes" falla={carga.falla} onReintentar={carga.reintentar} />
                ) : (
                  <PestanaVacantes
                    perfil={perfil}
                    acciones={accionesPostulacion}
                    onVerEtapas={candidatura && actual ? () => cambiarA('vacante') : undefined}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      {pie}
    </div>
    </SoloVerFicha.Provider>
    </HojaReemplazada.Provider>
    </ActividadExtra.Provider>
    </ClaveDiscusion.Provider>
    </NavegarFicha.Provider>
  )
}
