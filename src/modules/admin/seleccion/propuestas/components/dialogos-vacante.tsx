import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Copy01Icon, Delete02Icon, Link01Icon, Linkedin01Icon, Mail01Icon, Tick02Icon, WhatsappIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  RadioGroup,
  RadioGroupItem,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { ESPERA_RESPUESTA, esUltimaEtapa, type EstadoPublicacion, type VacanteUI } from '../datos'
import { esperasDe } from '../movimientos'
import { COMO_TERMINO, desenlaceDe, faltaParaPublicar, type ComoTermino, type Falta } from '../publicar'
import { enProcesoDe } from './editar-vacante'

// Las ventanas de una vacante que se abren desde su cabecera y desde la lista del inicio: cambiar su estado y eliminarla,
// y el enlace para candidatos de la de compartir. Antes la lista tenía las suyas —publicaba de un clic, compartía en otra
// ventana que no guardaba nada y eliminaba avisando menos— (IN-04, IN-05, IN-06): ahora las dos usan estas, con las
// mismas preguntas y los mismos datos.
//
// La regla de siempre: se confirma lo que sale de la empresa o lo que no se puede deshacer; el resto se hace y se ofrece
// «Deshacer». Quien abre la ventana aplica el cambio y pone el aviso.

const personas = (n: number) => `${n} ${plural(n, 'persona', 'personas')}`
const vacantesTexto = (n: number) => `${n} ${plural(n, 'vacante', 'vacantes')}`

/* Cambiar el estado ------------------------------------------------------------------------------------------------ */

export type CambioDeEstado = {
  vacante: VacanteUI
  cambio: Partial<VacanteUI>
}

export function DialogoEstadoVacante({
  vacantes,
  destino,
  onCerrar,
  onAplicar,
  onTerminar,
}: {
  // Una o varias (desde la barra de la lista). Vacío = cerrada.
  vacantes: VacanteUI[]
  destino: EstadoPublicacion | null
  onCerrar: () => void
  // Los cambios de cada vacante; `avisar` son las personas a las que se les escribe (al reabrir).
  onAplicar: (cambios: CambioDeEstado[], avisar: string[]) => void
  // Llevar a terminar la creación en el paso pendiente (un borrador al que le falta algo).
  onTerminar?: (vacante: VacanteUI, paso: number) => void
}) {
  const abierto = destino !== null && vacantes.length > 0
  // La clave rehace el contenido al abrir otra vez, para que las elecciones de la vez anterior no se queden.
  return abierto ? (
    <ContenidoEstado
      key={`${destino}-${vacantes.map((vacante) => vacante.id).join(',')}`}
      vacantes={vacantes}
      destino={destino}
      onCerrar={onCerrar}
      onAplicar={onAplicar}
      onTerminar={onTerminar}
    />
  ) : null
}

function ContenidoEstado({
  vacantes,
  destino,
  onCerrar,
  onAplicar,
  onTerminar,
}: {
  vacantes: VacanteUI[]
  destino: EstadoPublicacion
  onCerrar: () => void
  onAplicar: (cambios: CambioDeEstado[], avisar: string[]) => void
  onTerminar?: (vacante: VacanteUI, paso: number) => void
}) {
  const una = vacantes.length === 1 ? vacantes[0] : null
  const [como, setComo] = useState<ComoTermino>('contrato')
  const [avisar, setAvisar] = useState(true)
  const idComo = useId()

  const enProceso = vacantes.flatMap((vacante) => enProcesoDe(vacante.id))
  const esperan = enProceso.filter(ESPERA_RESPUESTA).length

  /* Publicar o reabrir */
  if (destino === 'Publicada') {
    const reabrir = vacantes.every((vacante) => vacante.estado === 'Cerrada')
    // Las que tienen algo pendiente no se publican (IN-04): la creación no las dejaría.
    const conFalta = vacantes.map((vacante) => ({ vacante, faltas: vacante.estado === 'Borrador' ? faltaParaPublicar(vacante) : [] as Falta[] }))
    const listas = conFalta.filter(({ faltas }) => faltas.length === 0).map(({ vacante }) => vacante)
    const bloqueadas = conFalta.filter(({ faltas }) => faltas.length > 0)

    // Una sola, incompleta: no hay nada que publicar; se lleva a terminarla.
    if (una && bloqueadas.length) {
      const faltas = bloqueadas[0].faltas
      return (
        <DialogoConfirmar
          abierto
          onAbiertoChange={(abrir) => (abrir ? undefined : onCerrar())}
          icono={Alert02Icon}
          titulo={`«${una.titulo}» todavía no se puede publicar`}
          descripcion="Le falta lo mismo que pide la creación antes de publicar. Termínala y la publicas desde ahí."
          accion="Terminarla"
          onConfirmar={() => onTerminar?.(una, faltas[0].paso)}
        >
          <ul className="flex list-disc flex-col gap-1 ps-5">
            {faltas.map((falta) => (
              <li key={falta.paso}>
                <Text size="sm">
                  Paso {falta.paso}: {falta.texto}
                </Text>
              </li>
            ))}
          </ul>
        </DialogoConfirmar>
      )
    }

    const reabiertas = listas.filter((vacante) => vacante.estado === 'Cerrada')
    const esperan = listas.flatMap((vacante) => (vacante.estado === 'Borrador' ? (esperasDe(vacante.id) ?? []) : []))
    const invitaciones = esperan.reduce((suma, cada) => suma + cada.personas, 0)
    const quienSigue = reabiertas.flatMap((vacante) => enProcesoDe(vacante.id))
    return (
      <DialogoConfirmar
        abierto
        onAbiertoChange={(abrir) => (abrir ? undefined : onCerrar())}
        titulo={
          una
            ? reabrir
              ? `¿Reabrir «${una.titulo}»?`
              : `¿Publicar «${una.titulo}»?`
            : listas.length
              ? `¿${reabrir ? 'Reabrir' : 'Publicar'} ${vacantesTexto(listas.length)}?`
              : 'Ninguna se puede publicar todavía'
        }
        descripcion={
          reabrir
            ? `${una ? 'Vuelve' : 'Vuelven'} al portal como una publicación nueva: los días abierta empiezan otra vez en cero. Cómo terminó la vez anterior queda en su historial.`
            : una
              ? `Va a quedar visible en el portal de empleo: cualquiera la encuentra y puede aplicar.${una.oculta ? ' Hoy está publicada pero escondida; al confirmar vuelve al portal.' : ''}`
              : 'Van a quedar visibles en el portal de empleo: cualquiera las encuentra y puede aplicar.'
        }
        accion={reabrir ? 'Reabrir' : 'Publicar'}
        deshabilitada={listas.length === 0}
        onConfirmar={() =>
          onAplicar(
            listas.map((vacante) => ({
              vacante,
              cambio:
                vacante.estado === 'Cerrada'
                  ? {
                      estado: 'Publicada',
                      oculta: false,
                      diasAbierta: 0,
                      ultimaSemana: 0,
                      desenlace: undefined,
                      historial: [...(vacante.historial ?? []), ...(vacante.desenlace ? [vacante.desenlace] : [])],
                    }
                  : { estado: 'Publicada', oculta: false },
            })),
            avisar ? [...new Set(quienSigue.map((c) => c.personaId))] : [],
          )
        }
      >
        {reabrir && una?.desenlace ? (
          <Text as="p" variant="muted" size="sm">
            La vez anterior: {una.desenlace}.
          </Text>
        ) : null}
        {/* Lo que sale al publicar: las invitaciones de IA que esperaban en el borrador (VA-45). */}
        {esperan.length ? (
          <Alert variant="info">
            <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
            <AlertTitle>
              {invitaciones === 1 ? 'Sale 1 invitación que esperaba' : `Salen ${invitaciones} invitaciones que esperaban`}
            </AlertTitle>
            <AlertDescription>
              Quien agregaste en el borrador a {esperan[0].etapa} recibe la invitación a la entrevista al publicar.
            </AlertDescription>
          </Alert>
        ) : null}
        {bloqueadas.length ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" />
            <AlertTitle>
              {bloqueadas.length === 1 ? '1 no se publica' : `${bloqueadas.length} no se publican`}: les falta algo
            </AlertTitle>
            <AlertDescription>{bloqueadas.map(({ vacante, faltas }) => `${vacante.titulo} (${faltas[0].texto.toLowerCase()})`).join(' · ')}</AlertDescription>
          </Alert>
        ) : null}
        {quienSigue.length ? (
          <Label className="flex items-start gap-2.5 text-sm font-normal">
            <Checkbox checked={avisar} onCheckedChange={(valor) => setAvisar(valor === true)} className="mt-0.5" />
            <span>
              Avisarles a {plural(quienSigue.length, 'la persona que sigue', `las ${quienSigue.length} personas que siguen`)} en el proceso que la vacante se
              reabrió
            </span>
          </Label>
        ) : null}
      </DialogoConfirmar>
    )
  }

  /* Cerrar */
  if (destino === 'Cerrada') {
    // A quién se contrató, si alguien llegó a la última etapa (solo con una vacante: en lote cada una es distinta).
    const finalistas = una ? enProcesoDe(una.id).filter((c) => esUltimaEtapa(una.etapas, c.etapa)) : []
    const contratada = finalistas.length === 1 ? finalistas[0].candidato.nombre : undefined
    return (
      <DialogoConfirmar
        abierto
        onAbiertoChange={(abrir) => (abrir ? undefined : onCerrar())}
        titulo={una ? `¿Cerrar «${una.titulo}»?` : `¿Cerrar ${vacantesTexto(vacantes.length)}?`}
        descripcion={`${una ? 'Deja' : 'Dejan'} de recibir aplicaciones y ${una ? 'desaparece' : 'desaparecen'} del portal de empleo. Se puede reabrir después.`}
        accion={una ? 'Cerrar la vacante' : `Cerrar ${vacantesTexto(vacantes.length)}`}
        destructiva
        onConfirmar={() => onAplicar(vacantes.map((vacante) => ({ vacante, cambio: { estado: 'Cerrada', desenlace: desenlaceDe(como, una ? contratada : undefined) } })), [])}
      >
        <Field>
          <FieldLabel id={idComo}>¿Cómo terminó?</FieldLabel>
          <RadioGroup aria-labelledby={idComo} value={como} onValueChange={(valor) => setComo(valor as ComoTermino)} className="grid gap-2">
            {COMO_TERMINO.map((opcion) => (
              <FieldLabel key={opcion.valor} htmlFor={`${idComo}-${opcion.valor}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{opcion.valor === 'contrato' && contratada ? `Se contrató a ${contratada}` : opcion.texto}</FieldTitle>
                    <FieldDescription>{opcion.detalle}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={opcion.valor} id={`${idComo}-${opcion.valor}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </Field>
        {enProceso.length ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" />
            <AlertTitle>
              {personas(enProceso.length)} {plural(enProceso.length, 'sigue', 'siguen')} en el proceso
            </AlertTitle>
            <AlertDescription>
              No se mueven ni reciben ningún correo: quedan esperando, y el inicio te lo recuerda hasta que les respondas.
              {esperan ? ` ${esperan} ${plural(esperan, 'espera', 'esperan')} respuesta tuya desde hace días.` : ''}
            </AlertDescription>
          </Alert>
        ) : null}
      </DialogoConfirmar>
    )
  }

  /* Volver a borrador */
  const conAplicaciones = vacantes.reduce((suma, vacante) => suma + vacante.aplicaciones, 0)
  return (
    <DialogoConfirmar
      abierto
      onAbiertoChange={(abrir) => (abrir ? undefined : onCerrar())}
      titulo={una ? `¿Sacar «${una.titulo}» del portal y volverla a borrador?` : `¿Volver ${vacantesTexto(vacantes.length)} a borrador?`}
      descripcion="Deja de estar en el portal de empleo y no recibe aplicaciones nuevas."
      accion="Volver a borrador"
      destructiva
      onConfirmar={() => onAplicar(vacantes.map((vacante) => ({ vacante, cambio: { estado: 'Borrador' } })), [])}
    >
      {conAplicaciones ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" />
          <AlertTitle>Ya {conAplicaciones === 1 ? 'aplicó 1 persona' : `aplicaron ${conAplicaciones} personas`}</AlertTitle>
          <AlertDescription>
            Nada se borra, pero el aviso se cae del portal y quien lo tenía guardado ve un enlace roto. Si es para dejar de
            recibir CVs un rato, sale más barato ocultarla del portal: sigue publicada y el enlace aguanta.
          </AlertDescription>
        </Alert>
      ) : null}
    </DialogoConfirmar>
  )
}

/* Compartir -------------------------------------------------------------------------------------------------------- */

// Cuánto se queda «Copiado» en el botón antes de volver a «Copiar».
const MS_COPIADO = 2000

// El enlace público de la vacante con el botón de copiar pegado al campo. Fuera del portal, el enlace existe pero no
// recibe a nadie: se dice.
//
// 7 oct (VA-32): el enlace va por el id de la vacante, no por su nombre: renombrarla no rompe los que ya se compartieron
// y dos vacantes con el mismo nombre no comparten enlace. Cada canal (LinkedIn, WhatsApp, correo) abre el mismo enlace:
// el origen no se mapea (8 oct, VP de producto), todos aplican por el portal de empleo.
export const PORTAL = 'https://empleos.ubits.com/vacantes'
const CANALES = [
  { origen: 'linkedin', texto: 'LinkedIn', icono: Linkedin01Icon, abrir: (enlace: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(enlace)}` },
  { origen: 'whatsapp', texto: 'WhatsApp', icono: WhatsappIcon, abrir: (enlace: string, titulo: string) => `https://wa.me/?text=${encodeURIComponent(`${titulo}: ${enlace}`)}` },
  { origen: 'correo', texto: 'Correo', icono: Mail01Icon, abrir: (enlace: string, titulo: string) => `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(enlace)}` },
]

export function EnlaceParaCandidatos({ id, titulo, oculta }: { id: string; titulo: string; oculta: boolean }) {
  const enlace = `${PORTAL}/${id}`
  const [copiado, setCopiado] = useState(false)
  const campo = useId()

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), MS_COPIADO)
      notify('Copiamos el enlace de la vacante', undefined, 'success')
    } catch {
      notify('No pudimos copiar el enlace', 'Selecciónalo y cópialo a mano.', 'error')
    }
  }
  const compartirEn = (canal: (typeof CANALES)[number]) => {
    // Sin marcar el canal en el enlace: el origen no se mapea (8 oct, VP de producto); todos aplican por el portal.
    window.open(canal.abrir(enlace, titulo), '_blank', 'noopener')
    notify(`Abrimos ${canal.texto} con el enlace`, undefined, 'success')
  }

  return (
    <Field className="pb-2">
      <FieldLabel htmlFor={campo}>Enlace para candidatos</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput id={campo} readOnly value={enlace} onFocus={(evento) => evento.target.select()} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary" size="xs" onClick={copiar}>
            <HugeiconsIcon icon={copiado ? Tick02Icon : Copy01Icon} aria-hidden="true" />
            {copiado ? 'Copiado' : 'Copiar'}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>
        {oculta
          ? 'Está oculta del portal: quien abra el enlace no puede postularse hasta que la vuelvas a mostrar.'
          : 'Compártelo para que los candidatos se postulen directamente. No cambia aunque renombres la vacante.'}
      </FieldDescription>
      {oculta ? null : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Text as="span" size="sm" variant="muted">
            Compartir en
          </Text>
          {CANALES.map((canal) => (
            <Button key={canal.origen} variant="outline" size="sm" onClick={() => compartirEn(canal)}>
              <HugeiconsIcon icon={canal.icono} aria-hidden="true" />
              {canal.texto}
            </Button>
          ))}
        </div>
      )}
    </Field>
  )
}

// La ventana de «Compartir» es una sola, la del sistema: `DialogoCompartirVacante` en `acciones-vacante.tsx` (auditoría del
// 8-oct, H-220 y H-248; decisión 4a de Cristian el 9-oct). Aquí queda el enlace y los canales, que son lo suyo.

/* Eliminar --------------------------------------------------------------------------------------------------------- */

export function DialogoEliminarVacantes({
  vacantes,
  onCerrar,
  onConfirmar,
  onCerrarEnSuLugar,
}: {
  // Vacío = cerrada.
  vacantes: VacanteUI[]
  onCerrar: () => void
  onConfirmar: () => void
  // Si alguna sigue viva, cerrarla guarda su historia y su gente: se ofrece en lugar de eliminar (IN-05).
  onCerrarEnSuLugar?: () => void
}) {
  const una = vacantes.length === 1 ? vacantes[0] : null
  const enProceso = vacantes.reduce((suma, vacante) => suma + enProcesoDe(vacante.id).length, 0)
  const aplicaciones = vacantes.reduce((suma, vacante) => suma + vacante.aplicaciones, 0)
  const publicadas = vacantes.filter((vacante) => vacante.estado === 'Publicada').length
  const vivas = vacantes.filter((vacante) => vacante.estado !== 'Cerrada').length
  const otros = una ? una.equipo.length - 1 : new Set(vacantes.flatMap((vacante) => vacante.equipo.slice(1).map((miembro) => miembro.correo))).size

  const cuantoSeVa = enProceso
    ? `Se ${una ? 'va' : 'van'} con ${personas(enProceso)} en proceso y ${aplicaciones} ${plural(aplicaciones, 'aplicación recibida', 'aplicaciones recibidas')}, con sus notas, entrevistas y evaluaciones.`
    : aplicaciones
      ? `Se van con ${una ? 'ella' : 'ellas'} ${aplicaciones} ${plural(aplicaciones, 'aplicación recibida', 'aplicaciones recibidas')}, con sus notas y evaluaciones.`
      : `Todavía no ${una ? 'tiene' : 'tienen'} a nadie: no se pierde ningún proceso.`
  const portal = publicadas ? ` ${publicadas === 1 && una ? 'El aviso desaparece' : `${publicadas === 1 ? 'El aviso' : `Los ${publicadas} avisos`} desaparecen`} del portal de empleo y ${publicadas === 1 ? 'su enlace deja' : 'sus enlaces dejan'} de funcionar.` : ''

  return (
    <DialogoConfirmar
      abierto={vacantes.length > 0}
      onAbiertoChange={(abrir) => (abrir ? undefined : onCerrar())}
      icono={Delete02Icon}
      titulo={una ? `¿Eliminar «${una.titulo}»?` : `¿Eliminar ${vacantesTexto(vacantes.length)}?`}
      // Nada de «¿estás seguro?»: lo que hay que leer es qué se lleva por delante.
      descripcion={`${cuantoSeVa}${portal}`}
      otra={onCerrarEnSuLugar && vivas ? { texto: vivas === 1 ? 'Cerrarla en su lugar' : 'Cerrarlas en su lugar', onClick: onCerrarEnSuLugar } : undefined}
      accion={
        <>
          <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
          {una ? 'Eliminar la vacante' : `Eliminar ${vacantesTexto(vacantes.length)}`}
        </>
      }
      destructiva
      enCurso="Eliminando…"
      onConfirmar={onConfirmar}
    >
      {enProceso ? (
        <Alert variant="info">
          <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
          <AlertTitle>A quienes seguían en proceso no les llega ningún correo</AlertTitle>
          <AlertDescription>
            En Mis candidatos quedan descartadas con el motivo «Se eliminó la vacante». Si el proceso solo terminó, cerrarla
            guarda su historia y deja responderles.
          </AlertDescription>
        </Alert>
      ) : null}
      {otros > 0 ? (
        <Text as="p" variant="muted" size="sm">
          {otros} {otros === 1 ? 'persona más tiene' : 'personas más tienen'} acceso y la{una ? '' : 's'} van a dejar de ver.
        </Text>
      ) : null}
      {/* No se pide escribir el nombre, como en Ashby: queda «Deshacer» en el aviso. */}
      <Text as="p" variant="muted" size="sm">
        Queda un momento para deshacerlo desde el aviso.
      </Text>
    </DialogoConfirmar>
  )
}
