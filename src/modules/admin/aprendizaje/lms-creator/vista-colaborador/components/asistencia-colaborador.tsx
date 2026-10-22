import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, CalendarAdd01Icon, CheckmarkCircle02Icon, Clock01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Heading,
  Separator,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { opcionesCalendario } from '@/modules/portal-colaborador/aprendizaje/zona-de-estudio/components/pestana-eventos'
import { textoPlano, type DatosAsistencia, type SesionAsistencia } from '../../crear-contenido/components/borrador'
import { diaDeSesion, horarioDeSesion, nombrePorDefecto } from '../../crear-contenido/components/asistencia/sesiones'
import { estadoDeSesion, useAhora, ventanaDeSesion, type Confirmaciones, type EstadoSesion } from './asistencia-estado'

// La página de asistencia **como la ve quien estudia** (HU-APR-009, «Asistir a sesión»; la regla de que sea el
// creador quien confirma sale de HU-LMS-025 RN-02d). No es la ficha del creador de `VistaAsistencia`: aquí hay una
// tarjeta por sesión con su estado —en curso, futura, expirada o confirmada— y lo que se puede hacer con cada una.
//
// - «Confirmar» solo está en la sesión que está ocurriendo, y solo si el recurso tiene Autoasistencia (RN-02, RN-07).
// - Con Autoasistencia apagada no hay botón: un aviso dice que el administrador confirma esa asistencia, y la página
//   sigue bloqueando el avance hasta que la cargue (RN-05b y RN-05c).
// - Una sesión que aún no empieza no lleva «Pendiente»: lleva «Agregar a mi calendario» (RN-08).
// - Una sesión cerrada sin confirmar dice «Expirado» y no ofrece nada (RN-09).
// - Confirmada: «Confirmado» con la fecha y la hora al pasar el cursor (RN-03).

const dos = (n: number) => String(n).padStart(2, '0')

const cuentaRegresiva = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return h ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`
}

const FECHA_CONFIRMACION = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' })
const HORA_CONFIRMACION = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })

export function AsistenciaColaborador({
  datos,
  contenido,
  confirmaciones,
  onConfirmar,
}: {
  datos: DatosAsistencia
  /** El título del contenido: lleva el evento que se añade al calendario. */
  contenido: string
  confirmaciones: Confirmaciones
  onConfirmar: (sesionId: string) => void
}) {
  // Cada segundo, para que corra la cuenta regresiva de la sesión que está ocurriendo.
  const ahora = useAhora(1000)
  const conInstrucciones = Boolean(textoPlano(datos.instrucciones))

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        {conInstrucciones ? (
          <>
            <section className="flex flex-col gap-2">
              <Heading as="h3" level={6}>
                Instrucciones
              </Heading>
              {/* HTML del editor de texto del asistente. */}
              <Text
                as="div"
                size="sm"
                className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: datos.instrucciones }}
              />
            </section>
            <Separator />
          </>
        ) : null}

        {/* RN-05b: sin Autoasistencia, quien estudia no puede marcarse presente; el aviso dice quién lo hace. */}
        {!datos.autoasistencia ? (
          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>Tu administrador confirma esta asistencia</AlertTitle>
            <AlertDescription>
              Tú no la puedes marcar. Cuando la cargue, esta página queda completada y podrás continuar con el contenido.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Heading as="h3" level={6}>
              Sesiones
            </Heading>
            {datos.sesiones.length ? (
              <Badge variant="secondary" size="xs" className="font-normal">
                {datos.sesiones.length}
              </Badge>
            ) : null}
          </div>
          {datos.sesiones.length ? (
            <ul className="flex flex-col gap-2">
              {datos.sesiones.map((s, i) => (
                <li key={s.id}>
                  <TarjetaDeSesion
                    sesion={s}
                    indice={i}
                    contenido={contenido}
                    autoasistencia={datos.autoasistencia}
                    confirmadaA={confirmaciones[s.id]}
                    estado={estadoDeSesion(s, confirmaciones, ahora)}
                    ahora={ahora}
                    onConfirmar={() => onConfirmar(s.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Text as="p" size="sm" variant="muted">
              Esta página aún no tiene sesiones.
            </Text>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

function TarjetaDeSesion({
  sesion,
  indice,
  contenido,
  autoasistencia,
  confirmadaA,
  estado,
  ahora,
  onConfirmar,
}: {
  sesion: SesionAsistencia
  indice: number
  contenido: string
  autoasistencia: boolean
  confirmadaA?: number
  estado: EstadoSesion
  ahora: number
  onConfirmar: () => void
}) {
  const { dia, mes } = diaDeSesion(sesion)
  const nombre = sesion.nombre.trim() || nombrePorDefecto(indice)
  const descripcion = sesion.descripcion.trim()
  const ventana = ventanaDeSesion(sesion)

  return (
    // RN-07: la sesión que está ocurriendo se destaca; el azul lo usa el índice para «la elegida» y aquí dice «ahora».
    <Card size="sm" className={cn(estado === 'en-curso' && 'bg-primary/5! ring-primary/40!')}>
      <CardContent className="flex items-start gap-3">
        <div className="flex min-w-13 shrink-0 flex-col items-center rounded-lg border bg-muted px-2 py-1.5">
          {dia ? (
            <>
              <Text as="span" size="lg" weight="semibold" className="leading-tight tabular-nums">
                {dia}
              </Text>
              <Text as="span" size="xs" variant="muted" className="uppercase">
                {mes}
              </Text>
            </>
          ) : (
            <HugeiconsIcon icon={Calendar03Icon} size={18} className="my-1.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text as="p" size="sm" weight="medium" className="break-words">
              {nombre}
            </Text>
            {estado === 'en-curso' ? (
              <Badge variant="success-light" size="xs">
                {/* El punto de «ahora», el mismo del «En vivo» del índice: la insignia le pisa la esquina, de ahí el «!». */}
                <span className="size-1.25 rounded-full! bg-[currentColor]" />
                Está ocurriendo
              </Badge>
            ) : null}
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" className="shrink-0" />
            <span className="tabular-nums">{horarioDeSesion(sesion)}</span>
            {estado === 'en-curso' && ventana ? (
              <span className="tabular-nums">· Termina en {cuentaRegresiva(ventana.hasta.getTime() - ahora)}</span>
            ) : null}
          </span>
          {descripcion ? (
            <Text as="p" size="sm" variant="muted" className="whitespace-pre-line">
              {descripcion}
            </Text>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {estado === 'confirmada' && confirmadaA ? (
              // RN-03: «Confirmado» y, al pasar el cursor, cuándo se confirmó.
              <Hint label={`Confirmaste el ${FECHA_CONFIRMACION.format(confirmadaA)} a las ${HORA_CONFIRMACION.format(confirmadaA)}`}>
                <span tabIndex={0} className="inline-flex rounded-sm">
                  <Badge variant="success-light" size="sm">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                    Confirmado
                  </Badge>
                </span>
              </Hint>
            ) : null}
            {estado === 'en-curso' && autoasistencia ? (
              <Button
                size="sm"
                onClick={() => {
                  onConfirmar()
                  const hora = HORA_CONFIRMACION.format(Date.now())
                  notify('Asistencia confirmada', `${nombre} · ${hora}`, 'success')
                }}
              >
                Confirmar
              </Button>
            ) : null}
            {estado === 'futura' && ventana ? (
              <AnadirAlCalendario sesion={sesion} contenido={contenido} desde={ventana.desde} hasta={ventana.hasta} nombre={nombre} />
            ) : null}
            {estado === 'expirada' ? (
              <Badge variant="destructive-light" size="sm">
                Expirado
              </Badge>
            ) : null}
            {estado === 'por-definir' ? (
              <Text as="span" size="sm" variant="muted">
                El horario de esta sesión aún no está definido.
              </Text>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** RN-08: Google Calendar, Outlook, Apple Calendar u otro archivo de calendario; las mismas opciones de la zona de estudio. */
function AnadirAlCalendario({ sesion, contenido, nombre, desde, hasta }: { sesion: SesionAsistencia; contenido: string; nombre: string; desde: Date; hasta: Date }) {
  const opciones = opcionesCalendario({ clave: sesion.id, titulo: nombre, evento: contenido.trim() || 'Contenido', imagen: '', inicio: desde, fin: hasta, enVivo: false })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={CalendarAdd01Icon} aria-hidden="true" />
        Agregar a mi calendario
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          {opciones.map((o) => (
            <DropdownMenuItem key={o.etiqueta} onClick={o.accion}>
              <HugeiconsIcon icon={o.icono} size={16} aria-hidden="true" />
              {o.etiqueta}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
