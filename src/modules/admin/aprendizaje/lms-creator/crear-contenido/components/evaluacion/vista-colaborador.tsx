import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckListIcon, InformationCircleIcon, RepeatIcon, SecurityLockIcon, Target02Icon, Timer02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Heading,
  RadioGroup,
  Input,
  RadioGroupItem,
  Select,
  Separator,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import type { ConfigEvaluacion, Pregunta, TipoPregunta } from '../borrador'
import { TextoEnriquecido } from '../editor-texto'
import { enunciadoDe } from './logica'
import { entradasDe, esListaSimple, type SeccionPreguntas } from './secciones'
import { EscalaCaras, EscalaEstrellas, EscalaNps, EscalaNumerica } from './tarjeta-pregunta'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { Condicion, Condiciones } from '../condicion'

// La evaluación como la responde el colaborador (Vista del colaborador): el recordatorio de cómo se aprueba, el
// cronómetro si tiene tiempo límite, las preguntas para responder y, al enviar, el resultado. «Enviar respuestas»,
// «Reintentar» e «Ir al inicio» van en la barra inferior del colaborador, no aquí. Solo se califican las preguntas de
// opción (única, múltiple y verdadero o falso); las abiertas se responden pero no suman.

export type Respuestas = Record<string, string[]>
export type ResultadoEvaluacion = { correctas: number; total: number; porcentaje: number; aprobado: boolean }

const CALIFICABLES = new Set<Pregunta['tipo']>(['multiple_choice_single', 'multiple_choice_multiple', 'true_false'])

export const preguntasCalificables = (preguntas: Pregunta[]) => preguntas.filter((p) => CALIFICABLES.has(p.tipo))

/**
 * ¿Respondió todo lo que hay que responder? **Todas menos la instrucción**, que no es una pregunta sino un cartel.
 *
 * Antes solo frenaban las de opción y verdadero/falso, así que una parte formada solo por un emparejamiento —o por
 * una pregunta abierta— dejaba continuar en blanco: el botón salía activo sin haber tocado nada (Dave, 8-oct). Se usa
 * `cumplida`, que para las de varios huecos pide **todos**, no el primero.
 */
export const todasRespondidas = (preguntas: Pregunta[], respuestas: Respuestas) =>
  preguntas.filter((p) => p.tipo !== 'instruction').every((p) => cumplida(p, respuestas[p.id] ?? []))

const correctasDe = (p: Pregunta) =>
  p.tipo === 'true_false' ? [p.verdaderoFalso] : p.opciones.map((o, i) => (o.correcta ? String(i) : null)).filter((x): x is string => x !== null)


// ── El orden en el que se responde ───────────────────────────────────────────────────────────────────────────────

/**
 * **El orden aleatorio es cosa del colaborador, no del editor.** En el Creator las preguntas se quedan donde el creador
 * las dejó; lo que cambia, si los interruptores están encendidos, es el orden en el que **las recibe quien responde**:
 * las preguntas entre sí y las opciones dentro de cada una. Así dos personas sentadas juntas no ven lo mismo en el
 * mismo sitio (Dave, 7-oct).
 *
 * Se baraja **una vez por intento** y con esa misma lista se pinta y se califica: las respuestas se guardan por la
 * posición de la opción, así que barajar al pintar y calificar con el orden original daría notas mal puestas.
 */
export function prepararIntento(
  preguntas: Pregunta[],
  config: ConfigEvaluacion,
  semilla: number,
  secciones?: SeccionPreguntas[],
): Pregunta[] {
  let lista = preguntas
  if (config.preguntasAleatorias) {
    /* **Con secciones, el azar se queda dentro de cada una.** Mezclarlas entre sí desharía la agrupación que armó
       quien la escribió, que es justo lo que le da sentido: una pregunta de «Fundamentos» no puede aparecer en medio
       de «Casos prácticos» solo porque tocó (Dave, 8-oct). */
    const agrupadas = secciones && !esListaSimple(secciones)
    lista = agrupadas
      ? entradasDe(secciones).flatMap((entrada, i) => {
          const suyas = lista.filter((p) => entrada.section.questions.some((q) => q.id === p.id))
          return barajar(suyas, semilla + i)
        })
      : barajar(lista, semilla)
  }
  if (config.opcionesAleatorias)
    lista = lista.map((p, i) =>
      p.opciones.length > 1 && (p.tipo === 'multiple_choice_single' || p.tipo === 'multiple_choice_multiple')
        ? { ...p, opciones: barajar(p.opciones, semilla + i + 1) }
        : p,
    )
  // El recorte por intento va **después** de barajar: si no, siempre saldrían las mismas primeras preguntas.
  return config.limitarPreguntas ? lista.slice(0, config.preguntasPorIntento) : lista
}

/** Barajado repetible: con la misma semilla sale el mismo orden, así no cambia en cada repintado. */
function barajar<T>(lista: T[], semilla: number): T[] {
  const salida = [...lista]
  let estado = semilla || 1
  for (let i = salida.length - 1; i > 0; i--) {
    // Generador congruente lineal: basta para una maqueta y no depende de `Math.random`, que daría un orden nuevo
    // en cada pintada.
    estado = (estado * 1664525 + 1013904223) % 4294967296
    const j = estado % (i + 1)
    ;[salida[i], salida[j]] = [salida[j], salida[i]]
  }
  return salida
}

export function calificar(preguntas: Pregunta[], respuestas: Respuestas, config: ConfigEvaluacion): ResultadoEvaluacion {
  const calificables = preguntasCalificables(preguntas)
  const correctas = calificables.filter((p) => {
    const elegidas = [...(respuestas[p.id] ?? [])].sort().join(',')
    return elegidas === [...correctasDe(p)].sort().join(',')
  }).length
  const porcentaje = calificables.length ? Math.round((correctas / calificables.length) * 100) : 100
  return { correctas, total: calificables.length, porcentaje, aprobado: porcentaje >= config.aprobacion }
}

/** «70 % para aprobar · sin límite de tiempo · 3 intentos». */
/**
 * Lo que queda, no lo que había. En el primer intento lo útil es cuántos hay en total; a partir del segundo, cuántos
 * le quedan —incluido este—, que es la pregunta que de verdad se hace quien va a reintentar (Dave, 8-oct).
 */
export function intentosQueQuedan(total: number, intento: number) {
  if (intento <= 1) return total === 1 ? 'Tienes 1 intento.' : `Tienes ${total} intentos.`
  const quedan = Math.max(1, total - intento + 1)
  return quedan === 1 ? 'Te queda 1 intento, este.' : `Te quedan ${quedan} intentos, contando este.`
}

/**
 * Una evaluación **no es solo responder**: tiene un antes y un después, como en la experiencia de estudio de
 * producción (Dave, 8-oct).
 *
 * - `bienvenida`: lo que hay que saber antes de empezar —cuánto tiempo, cuántos intentos—, porque una vez dentro el
 *   reloj ya corre.
 * - `retomar`: se fue a medias y vuelve; lo respondido sigue ahí.
 * - `intento`: las preguntas.
 * - `resultado`: cómo le fue.
 *
 * Las encuestas no tienen nada de esto: ni se aprueban, ni se cronometran, ni se reintentan. Van siempre en
 * `intento`.
 */
export type FaseEvaluacion = 'bienvenida' | 'retomar' | 'intento' | 'resultado'

type Props = {
  titulo: string
  preguntas: Pregunta[]
  config: ConfigEvaluacion
  respuestas: Respuestas
  resultado?: ResultadoEvaluacion
  onResponder: (preguntaId: string, valores: string[]) => void
  fase?: FaseEvaluacion
  /** En cuál va, contando desde 1. */
  intento?: number
  /** El resultado llegó porque se acabó el tiempo, no porque enviara. */
  porTiempo?: boolean
  /** Ya gastó todos los intentos: el resultado deja de ser «no aprobaste» y pasa a ser el final del camino. */
  sinIntentos?: boolean
  /** Segundos que quedan, para el reloj de la cabecera. */
  restante?: number
  /** La estructura de la página: es la que parte la evaluación en partes. */
  secciones?: SeccionPreguntas[]
  /** En qué parte va, contando desde 0. */
  paso?: number
}

export function EvaluacionColaborador({
  titulo,
  preguntas,
  config,
  respuestas,
  resultado,
  onResponder,
  encuesta = false,
  fase = 'intento',
  intento = 1,
  porTiempo = false,
  sinIntentos = false,
  restante,
  secciones,
  paso = 0,
}: Props & { encuesta?: boolean }) {
  // Ya viene preparada (barajada y recortada) por quien la monta: ver `prepararIntento`.
  const lista = preguntas
  const reloj = restante == null ? null : `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`

  /**
   * **Lo que no está ya en el encabezado.** Ahí arriba están el porcentaje para aprobar, el tiempo límite y cuántos
   * intentos hay, así que repetirlos aquí era leer dos veces lo mismo (Dave, 8-oct). Queda lo que esa línea no puede
   * decir: que el reloj arranca al abrirla, y **cuántos intentos quedan**, que solo aporta a partir del segundo
   * —en el primero «tienes 3» ya está arriba—. Cuando no hay nada que avisar, no se pinta ninguna lista.
   */
  /** El intento que está a punto de hacer es el último que le queda. */
  const ultimoIntento = !encuesta && config.limitarIntentos && intento >= config.intentos

  const avisos = [
    config.tiempoLimite ? 'El tiempo empieza a correr cuando la abres.' : null,
    config.limitarIntentos && intento > 1 ? intentosQueQuedan(config.intentos, intento) : null,
  ].filter((x): x is string => Boolean(x))

  const pasosDelIntento = pasosDeIntento(lista, secciones)
  const indicePaso = Math.min(paso, Math.max(0, pasosDelIntento.length - 1))
  const partes = pasosDelIntento.length
  const parte = indicePaso + 1

  return (
    // 12 px entre pregunta y pregunta, los mismos que deja la vista previa de Encuestas (Elkin, `gap-3` en su Frame): con
    // los 3 px de la librería las cajas se leían pegadas (Dave, 14-oct).
    <Frame className="gap-3">
      {/* Cómo se llama la evaluación y sus reglas, en el marco gris; el panel blanco es lo que se responde (Dave, 9-oct). */}
      <FrameHeader className="gap-2">
        <FrameTitle>{titulo}</FrameTitle>
        {/**
         * **Las condiciones, en insignias y debajo del título.** Antes eran una línea de texto apagado —«5 preguntas ·
         * 70 % para aprobar · sin límite de tiempo»— que se leía como letra pequeña justo donde está lo que más hay
         * que tener claro antes de empezar. En insignias cada dato se lee solo, y como viven en el marco gris siguen
         * ahí **mientras se responde**: son el recordatorio de arriba (Dave, 13-oct).
         *
         * Van en `invert-light`, la misma que la insignia de navegación del índice: sobre el gris, una de color
         * pasaría por un estado o por algo que se pulsa. Las dos que **sí** cambian de color son las que avisan:
         * el último intento y el último minuto.
         */}
        <Condiciones>
          <Condicion icono={CheckListIcon}>{lista.length === 1 ? '1 pregunta' : `${lista.length} preguntas`}</Condicion>
          {encuesta ? (
            <Condicion icono={SecurityLockIcon}>Tus respuestas son anónimas</Condicion>
          ) : (
            <>
              <Condicion icono={Target02Icon}>{`${config.aprobacion} % para aprobar`}</Condicion>
              {config.tiempoLimite ? (
                // Respondiendo, este sitio lo ocupa la cuenta regresiva; antes de empezar dice cuánto va a durar.
                <Condicion
                  icono={Timer02Icon}
                  alerta={fase === 'intento' && restante != null && restante <= 60}
                  aria-label={fase === 'intento' && reloj ? `Tiempo restante: ${reloj}` : undefined}
                >
                  {fase === 'intento' && reloj ? reloj : `${config.minutos} min`}
                </Condicion>
              ) : null}
              {config.limitarIntentos ? (
                /* **El último intento se pone en rojo.** No es lo mismo fallar el primero que el último, y es
                   justo cuando hay que saberlo: antes de responder, no después (Dave, 13-oct). */
                <Condicion icono={RepeatIcon} alerta={ultimoIntento}>
                  {`Intento ${Math.min(intento, config.intentos)} de ${config.intentos}`}
                </Condicion>
              ) : null}
            </>
          )}
        </Condiciones>
      </FrameHeader>
      {/* **Respondiendo, el marco gris es el lienzo**: la cabecera de la parte y las cajas de pregunta cuelgan
          directamente de él. El panel blanco se reserva para lo que es una sola pieza —la bienvenida, el resultado,
          el vacío— (Dave, 9-oct). */}
      <ContenedorEvaluacion respondiendo={fase === 'intento' && lista.length > 0}>

        {/* **Antes de empezar.** Lo que hay que saber ahora, porque una vez dentro el reloj ya corre: cuánto tiempo
            hay, cuántos intentos quedan y con cuánto se aprueba. */}
        {fase === 'bienvenida' || fase === 'retomar' ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre={fase === 'retomar' ? 'glass-clock' : 'glass-paper'} tamano={112} />
              </EmptyMedia>
              <EmptyTitle>
                {fase === 'retomar' ? 'Continúa tu evaluación' : intento > 1 ? 'Vas a intentarlo de nuevo' : 'Vas a iniciar una evaluación'}
              </EmptyTitle>
              <EmptyDescription>
                {fase === 'retomar'
                  ? config.tiempoLimite
                    ? 'Lo que respondiste se guardó. El tiempo vuelve a correr cuando continúes.'
                    : 'Puedes retomarla donde la dejaste: lo que respondiste se guardó.'
                  : avisos.length > 0
                    ? 'Antes de empezar, ten en cuenta:'
                    : 'Cuando estés listo, empieza.'}
              </EmptyDescription>
            </EmptyHeader>
            {fase === 'bienvenida' && avisos.length > 0 ? (
              <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                {avisos.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
              </ul>
            ) : null}
          </Empty>
        ) : resultado ? (
          /* Sin borde: el del componente es punteado y en una pantalla de resultado se lee como una zona donde se
             arrastra y se suelta algo, que aquí no es el caso (Dave, 6-oct). */
          <div className="flex flex-col gap-4">
            {/* El tiempo se acabó: se dice **encima** del resultado, porque explica por qué llegó solo. El resultado
                en sí es el mismo de siempre, aprobado o no. */}
            {porTiempo ? (
              <Alert variant="info">
                <HugeiconsIcon icon={Timer02Icon} aria-hidden="true" />
                <AlertTitle>Se acabó el tiempo</AlertTitle>
                <AlertDescription>
                  <p>Calificamos lo que alcanzaste a responder.</p>
                </AlertDescription>
              </Alert>
            ) : null}
            <Empty className="border-0">
              <EmptyHeader>
                {/* Icono glass, no uno de línea: el resultado es un momento con sitio para una ilustración, y es lo
                    que usan los demás estados vacíos del design system (Dave, 6-oct). */}
                <EmptyMedia variant="default">
                  <ImagenGlass
                    nombre={resultado.aprobado ? 'glass-tick' : sinIntentos ? 'glass-lock' : 'glass-close-square'}
                    tamano={112}
                  />
                </EmptyMedia>
                <Heading as="h3" level={2} className="tabular-nums">
                  {resultado.porcentaje} %
                </Heading>
                {/* Sin intentos no es «no aprobaste esta vez»: no hay otra vez, y decirlo así sería engañar. */}
                <EmptyTitle>
                  {resultado.aprobado ? 'Aprobaste la evaluación' : sinIntentos ? 'Usaste todos tus intentos' : 'No aprobaste esta vez'}
                </EmptyTitle>
                <EmptyDescription>
                  {resultado.correctas} de {resultado.total} respuestas correctas · se aprueba con {config.aprobacion} %
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : lista.length && pasosDelIntento[indicePaso] ? (
          <Preguntas paso={pasosDelIntento[indicePaso]} cual={parte} total={partes} respuestas={respuestas} onResponder={onResponder} />
        ) : (
          /* Publicada sin preguntas: no gasta intento ni pide nota, y se puede continuar. No es un error de quien
             estudia, así que se cuenta sin alarma. */
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre="glass-info-circle" tamano={112} />
              </EmptyMedia>
              <EmptyTitle>Esta evaluación no tiene preguntas</EmptyTitle>
              <EmptyDescription>Puedes continuar a la siguiente página.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </ContenedorEvaluacion>
    </Frame>
  )
}

/**
 * **Qué hay que hacer con esta pregunta**, en una línea bajo el enunciado. Cada tipo se responde a su manera —elegir
 * una, elegir varias, emparejar, escribir— y eso no siempre se adivina mirando los controles; es la misma ayuda que
 * ve quien la crea en el editor, pero dicha en corto.
 *
 * **Se va en cuanto está cumplida**: una vez respondida ya no dice nada que la persona no sepa, y en una evaluación
 * larga diez instrucciones repetidas son ruido.
 */
/**
 * El texto de una opción de respuesta va en peso normal y con su interlineado, no en el medio pegado que `FieldLabel`
 * trae del tema. Con cuatro opciones seguidas, todas en peso medio y casi negras, el bloque se lee como un muro y le
 * compite al enunciado; así el enunciado manda y las opciones se leen de corrido (Dave, 9-oct).
 */
const TEXTO_OPCION = 'font-normal! leading-snug!'

const INSTRUCCIONES: Partial<Record<TipoPregunta, string>> = {
  multiple_choice_single: 'Selecciona una opción',
  multiple_choice_multiple: 'Selecciona una o varias opciones',
  true_false: 'Elige verdadero o falso',
  matching: 'Completa los pares',
  fill_blank: 'Completa los espacios',
  short_answer: 'Escribe tu respuesta',
  essay: 'Escribe tu respuesta',
  rating_scale: 'Elige un número',
  rating_stars: 'Elige una calificación',
  nps: 'Elige un número del 0 al 10',
  emoji: 'Elige la cara que mejor te represente',
  dropdown: 'Elige una opción de la lista',
}

/** Si ya se hizo lo que pedía la instrucción. En las de varios huecos cuenta cuando están **todos**, no el primero. */
function cumplida(pregunta: Pregunta, valores: string[]): boolean {
  const lleno = (v?: string) => Boolean(v && v.trim())
  if (pregunta.tipo === 'matching') return pregunta.parejas.length > 0 && pregunta.parejas.every((_, i) => lleno(valores[i]))
  if (pregunta.tipo === 'fill_blank') {
    const huecos = trozosConHuecos(pregunta.enunciado).filter((x) => typeof x !== 'string').length
    return huecos > 0 && Array.from({ length: huecos }).every((_, i) => lleno(valores[i]))
  }
  return valores.some(lleno)
}

/**
 * **No se va al responder** (Dave, 14-oct). Antes desaparecía al cumplirse, y como vive entre el enunciado y las opciones,
 * todo lo de abajo subía justo bajo el clic. El aviso de «ya respondiste» lo da el número, que se pone azul.
 */
function Instruccion({ pregunta }: { pregunta: Pregunta }) {
  const texto = INSTRUCCIONES[pregunta.tipo]
  if (!texto) return null
  return (
    <Text as="p" size="xs" variant="muted" className="flex items-center gap-1.5">
      <HugeiconsIcon icon={InformationCircleIcon} size={14} aria-hidden="true" className="shrink-0" />
      {texto}
    </Text>
  )
}

/**
 * Una pregunta como la responde quien estudia. **Cada tipo se responde a su manera**: hasta ahora emparejamiento,
 * palabra faltante y las escalas caían todas en un cuadro de texto, que no es forma de responderlas (Dave, 7-oct).
 */
/**
 * Las preguntas del intento, agrupadas por la sección a la que pertenecen. El título de la sección va **encima de sus
 * preguntas**, como un rótulo: no es una pantalla aparte ni un paso, solo dice de qué va lo que viene. Una sección que
 * en este intento se quedó sin preguntas —porque se recortó— no se pinta: un título suelto sin nada debajo se lee como
 * un error.
 *
 * **La numeración es continua en toda la página**, no por sección: quien responde cuenta «voy por la 7 de 12», y
 * reiniciar en cada rótulo le quitaría esa referencia.
 */
/**
 * **Un paso por sección.** Cuando la evaluación está dividida, el colaborador ve **una sección a la vez**: su título
 * en grande arriba y debajo solo sus preguntas. Es como se recorre en el creador de encuestas, y es lo que de verdad
 * se entiende: con todo en una misma pantalla, la cabecera de una sección y la de su subsección quedaban pegadas,
 * compitiendo entre ellas y con los enunciados, y no se sabía qué colgaba de qué (Dave, 8-oct).
 *
 * Los pasos son las secciones **que traen preguntas propias**. Una sección que solo reparte subsecciones no tiene
 * paso: su nombre aparece encima del de la subsección, diciendo de dónde cuelga.
 */
export type PasoSeccion = {
  id: string
  titulo: string
  descripcion?: string
  preguntas: Pregunta[]
}

export function pasosDeIntento(lista: Pregunta[], secciones?: SeccionPreguntas[]): PasoSeccion[] {
  if (!secciones || esListaSimple(secciones)) return [{ id: 'todo', titulo: '', preguntas: lista }]
  return entradasDe(secciones)
    .map((entrada) => ({
      id: entrada.section.id,
      titulo: entrada.section.title.trim(),
      descripcion: entrada.section.description.trim() || undefined,
      preguntas: lista.filter((p) => entrada.section.questions.some((q) => q.id === p.id)),
    }))
    .filter((paso) => paso.preguntas.length > 0)
}

/** Respondiendo, los hijos van sueltos sobre el gris; en cualquier otro momento, dentro de un panel blanco. */
function ContenedorEvaluacion({ respondiendo, children }: { respondiendo: boolean; children: ReactNode }) {
  if (respondiendo) return <>{children}</>
  return <FramePanel className="flex flex-col gap-5">{children}</FramePanel>
}

function Preguntas({
  paso,
  cual,
  total,
  respuestas,
  onResponder,
}: {
  paso: PasoSeccion
  /** Qué parte es, contando desde 1, y cuántas hay. */
  cual: number
  total: number
  respuestas: Respuestas
  onResponder: (preguntaId: string, valores: string[]) => void
}) {
  /**
   * **El gris es el lienzo y cada pregunta es una caja blanca encima**, como en la vista previa del creador de
   * encuestas. Antes todo vivía dentro de un mismo panel blanco —cabecera y preguntas—, así que las tarjetas de
   * pregunta quedaban blancas sobre blanco y la pantalla se leía como un documento corrido (Dave, 9-oct).
   *
   * Por eso esto devuelve **hermanos del marco**, no un bloque: la cabecera de la parte va en lo gris, encima de
   * las cajas, igual que los datos de la evaluación van encima de todo.
   */
  return (
    <>
      {/* Sin título no hay partes: una evaluación sin secciones va directo a sus preguntas. */}
      {paso.titulo ? (
        /**
         * **La portada de la parte, debajo de una línea.** Arriba quedan los datos de la evaluación, que no cambian;
         * la línea marca dónde empieza lo que sí cambia al avanzar. Después, en este orden: la insignia azul con la
         * parte, el título, la descripción y cuántas preguntas trae (Dave, 9-oct).
         */
        <>
          <Separator className="mx-5 w-auto!" />
          <FrameHeader className="gap-2 pt-3">
            {total > 1 ? (
              <Badge variant="primary-light" size="sm" className="w-fit tabular-nums">
                Parte {cual} de {total}
              </Badge>
            ) : null}
            <Heading as="h2" level={4}>
              {paso.titulo}
            </Heading>
            {paso.descripcion ? (
              <Text as="p" size="sm" variant="muted">
                {paso.descripcion}
              </Text>
            ) : null}
            <Text as="span" size="xs" variant="muted" className="inline-flex items-center gap-1.5 tabular-nums">
              <HugeiconsIcon icon={CheckListIcon} size={14} aria-hidden="true" />
              {paso.preguntas.length === 1 ? '1 pregunta' : `${paso.preguntas.length} preguntas`}
            </Text>
          </FrameHeader>
        </>
      ) : null}

      {/* **Cada pregunta, su caja**, con el número en un círculo a la izquierda del enunciado. La numeración vuelve
          a empezar en cada parte: con una sola sección a la vista, «la 7 de 12» no dice nada. */}
      {paso.preguntas.map((p, i) => (
        <FramePanel key={p.id} className="flex gap-3">
          {/* **El número se pone azul al responder.** Da el avance sin ocupar sitio: al bajar por la lista se ve de
              un vistazo qué queda suelto, que es justo lo que uno busca antes de enviar (Dave, 9-oct). Es el mismo
              gesto de la vista previa del creador de encuestas. Una instrucción no se responde, así que no cambia. */}
          <Badge
            variant={p.tipo !== 'instruction' && cumplida(p, respuestas[p.id] ?? []) ? 'default' : 'secondary'}
            size="sm"
            className="mt-0.5 size-6 shrink-0 justify-center rounded-full! p-0 tabular-nums"
          >
            {i + 1}
          </Badge>
          <div className="min-w-0 flex-1">
            <PreguntaColaborador numero={i + 1} sinNumero pregunta={p} valores={respuestas[p.id] ?? []} onResponder={(v) => onResponder(p.id, v)} />
          </div>
        </FramePanel>
      ))}
    </>
  )
}

/** Una pregunta tal y como la responde el colaborador. */
function PreguntaColaborador({
  numero,
  sinNumero = false,
  pregunta,
  valores,
  onResponder,
}: {
  numero: number
  /** El número ya va fuera, en la insignia de la tarjeta: no se repite delante del enunciado. */
  sinNumero?: boolean
  pregunta: Pregunta
  valores: string[]
  onResponder: (v: string[]) => void
}) {
  const id = `est-${pregunta.id}`
  const t = pregunta.tipo
  const enunciado = enunciadoDe(pregunta) || 'Pregunta sin enunciado'
  const escalaMin = Number(pregunta.escala.minimo) || 1
  const escalaMax = Number(pregunta.escala.maximo) || 5

  // La instrucción no se responde: es un cartel en medio de la evaluación.
  if (t === 'instruction')
    return (
      <div className="flex flex-col gap-2">
        <TextoEnriquecido html={pregunta.instruccion} />
      </div>
    )

  return (
    <FieldSet className="gap-3">
      <FieldLegend>{sinNumero ? enunciado : `${numero}. ${enunciado}`}</FieldLegend>
      <Instruccion pregunta={pregunta} />

      {t === 'multiple_choice_single' || t === 'true_false' ? (
        <RadioGroup value={valores[0] ?? ''} onValueChange={(v) => onResponder([String(v)])} aria-label={enunciado} className="gap-2">
          {(t === 'true_false'
            ? [
                { valor: 'true', texto: 'Verdadero' },
                { valor: 'false', texto: 'Falso' },
              ]
            : pregunta.opciones.map((o, i) => ({ valor: String(i), texto: o.texto.trim() || `Opción ${i + 1}` }))
          ).map((o) => (
            <Field key={o.valor} orientation="horizontal">
              <RadioGroupItem value={o.valor} id={`${id}-${o.valor}`} />
              <FieldLabel htmlFor={`${id}-${o.valor}`} className={TEXTO_OPCION}>
                {o.texto}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      ) : null}

      {t === 'multiple_choice_multiple' ? (
        <div className="flex flex-col gap-2">
          {pregunta.opciones.map((o, i) => {
            const valor = String(i)
            const marcada = valores.includes(valor)
            return (
              <Field key={valor} orientation="horizontal">
                <Checkbox
                  id={`${id}-${valor}`}
                  checked={marcada}
                  onCheckedChange={(v) => onResponder(v ? [...valores, valor] : valores.filter((x) => x !== valor))}
                />
                <FieldLabel htmlFor={`${id}-${valor}`} className={TEXTO_OPCION}>
                  {o.texto.trim() || `Opción ${i + 1}`}
                </FieldLabel>
              </Field>
            )
          })}
        </div>
      ) : null}

      {/* Pregunta corta y texto abierto: una línea. El ensayo, varias, y se dice cuánto hay que escribir. */}
      {t === 'short_answer' ? (
        <Input
          aria-label={`Respuesta a la pregunta ${numero}`}
          placeholder="Escribe tu respuesta"
          value={valores[0] ?? ''}
          onChange={(e) => onResponder(e.target.value ? [e.target.value] : [])}
        />
      ) : null}

      {t === 'essay' ? (
        <div className="flex flex-col gap-1.5">
          <Textarea
            rows={5}
            aria-label={`Respuesta a la pregunta ${numero}`}
            placeholder="Escribe tu respuesta"
            value={valores[0] ?? ''}
            onChange={(e) => onResponder(e.target.value ? [e.target.value] : [])}
          />
          {pregunta.ensayo.minimoPalabras.trim() ? (
            <Text as="p" size="xs" variant="muted" className="tabular-nums">
              {`${palabrasDe(valores[0] ?? '')} de ${pregunta.ensayo.minimoPalabras.trim()} palabras mínimo`}
            </Text>
          ) : null}
        </div>
      ) : null}

      {/* Emparejamiento: a cada enunciado se le elige su par de una lista. Los pares van mezclados, si no se adivina solo. */}
      {t === 'matching' ? (
        <div className="flex flex-col gap-3">
          {pregunta.parejas.map((par, i) => (
            <Field key={i} orientation="responsive">
              <FieldLabel htmlFor={`${id}-par-${i}`}>{par.a.trim() || `Elemento ${i + 1}`}</FieldLabel>
              <Select
                value={valores[i] || null}
                onValueChange={(v) => {
                  const siguiente = [...valores]
                  siguiente[i] = String(v ?? '')
                  onResponder(siguiente)
                }}
              >
                {/* Los pares son frases, no palabras sueltas: el desplegable toma todo el ancho y cada opción se
                    parte en varias líneas. Con el ancho fijo del principio se recortaban a media frase y había que
                    adivinar cuál era cuál (Dave, 7-oct). */}
                <SelectTrigger id={`${id}-par-${i}`} className="h-auto! min-h-(--alto-campo) w-full py-2! [&>span]:whitespace-normal">
                  <SelectValue placeholder="Elige su par" />
                </SelectTrigger>
                {/* El desplegable mide lo mismo que el campo: el popover publica el ancho del disparador en
                    `--anchor-width`, así que con él va alineado en escritorio y en el teléfono por igual. */}
                <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) max-w-[calc(100vw-2rem)]">
                  {paresMezclados(pregunta).map((opcion) => (
                    <SelectItem
                      key={opcion}
                      value={opcion}
                      // El texto del ítem viene del tema con `shrink-0 whitespace-nowrap`, así que una frase larga se
                      // sale de la caja; hay que anularlo con `!` para que se parta en varias líneas.
                      className="items-start! [&_.cn-select-item-text]:shrink! [&_.cn-select-item-text]:whitespace-normal!"
                    >
                      {opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
      ) : null}

      {/* Palabra faltante: la oración con un campo en cada hueco, en su sitio. */}
      {t === 'fill_blank' ? (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          {trozosConHuecos(pregunta.enunciado).map((trozo, i) =>
            typeof trozo === 'string' ? (
              <Text key={`t-${i}`} as="span" size="base">
                {trozo}
              </Text>
            ) : (
              <Input
                key={`h-${trozo.hueco}`}
                aria-label={`Palabra ${trozo.hueco}`}
                className="w-40"
                value={valores[trozo.hueco - 1] ?? ''}
                onChange={(e) => {
                  const siguiente = [...valores]
                  siguiente[trozo.hueco - 1] = e.target.value
                  onResponder(siguiente)
                }}
              />
            ),
          )}
        </div>
      ) : null}

      {t === 'rating_scale' ? (
        <EscalaNumerica minimo={escalaMin} maximo={escalaMax} escala={pregunta.escala} valor={valores[0] ?? ''} onElegir={(v) => onResponder([v])} />
      ) : null}

      {t === 'rating_stars' ? (
        <EscalaEstrellas cantidad={escalaMax} escala={pregunta.escala} valor={valores[0] ?? ''} onElegir={(v) => onResponder([v])} />
      ) : null}


      {t === 'nps' ? <EscalaNps escala={pregunta.escala} valor={valores[0] ?? ''} onElegir={(v) => onResponder([v])} /> : null}

      {t === 'emoji' ? <EscalaCaras escala={pregunta.escala} valor={valores[0] ?? ''} onElegir={(v) => onResponder([v])} /> : null}

      {t === 'dropdown' ? (
        <Select value={valores[0] || null} onValueChange={(v) => onResponder(v ? [String(v)] : [])}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Elige una opción">
            {/* Sin responder, `valor` llega vacío y `Number('')` es 0: así se pintaba la **primera opción** como si
                estuviera elegida, y el estudiante veía una respuesta que no dio (Dave, 13-oct). */}
            <SelectValue placeholder="Elige una opción">
              {(valor: string | null) =>
                valor === null || valor === '' ? 'Elige una opción' : pregunta.opciones[Number(valor)]?.texto || `Opción ${Number(valor) + 1}`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {pregunta.opciones.map((o, i) => (
              <SelectItem key={i} value={String(i)}>
                {o.texto.trim() || `Opción ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </FieldSet>
  )
}

/** Cuántas palabras lleva escritas, para el contador del ensayo. */
const palabrasDe = (texto: string) => texto.trim().split(/\s+/).filter(Boolean).length

/** Los pares de un emparejamiento, mezclados siempre igual: si siguieran el orden de la izquierda, no habría nada que resolver. */
function paresMezclados(pregunta: Pregunta) {
  const pares = pregunta.parejas.map((p) => p.b.trim()).filter(Boolean)
  // Orden estable por texto: no cambia en cada repintado (que movería las opciones mientras se responde).
  return [...pares].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Parte la oración por los marcadores `{{n}}`, para poner un campo donde va cada hueco. */
function trozosConHuecos(oracion: string): (string | { hueco: number })[] {
  const salida: (string | { hueco: number })[] = []
  const patron = /\{\{(\d+)\}\}/g
  let ultimo = 0
  let encontrado: RegExpExecArray | null
  while ((encontrado = patron.exec(oracion))) {
    if (encontrado.index > ultimo) salida.push(oracion.slice(ultimo, encontrado.index))
    salida.push({ hueco: Number(encontrado[1]) })
    ultimo = encontrado.index + encontrado[0].length
  }
  if (ultimo < oracion.length) salida.push(oracion.slice(ultimo))
  return salida.length ? salida : [oracion]
}
