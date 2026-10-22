import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Progress,
  Text,
  Heading,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Mic01Icon,
  MicOff01Icon,
  Message01Icon,
  RefreshIcon,
  RepeatIcon,
  Timer02Icon,
  Target02Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { AiThinking } from '@/shared/components/AiThinking'
import type { RoleplayConfig } from '../borrador'
import { nombreModo, COSTO_CREDITOS } from './modelo'
import { Condicion, Condiciones } from '../condicion'
import { CaraPersonaje } from './vista-roleplay'
import { LlamadaRoleplay } from './llamada-roleplay'
import { useMicrofono } from './microfono'
import {
  ESTADO_INICIAL,
  evaluarIntento,
  type CanalRoleplay,
  type EstadoRoleplay,
  type FaseRoleplay,
  type ResultadoRoleplay,
} from './estudio'
import { plural } from '@/modules/design-system/patrones/formato'

// ── El roleplay desde el lado del colaborador ─────────────────────────────────────────────────────────────────────
//
// Cuatro fases: **antes → llamada → analizando → resultado**. La llamada se va a pantalla completa (está en
// `llamada-roleplay.tsx`); aquí viven las otras tres, que sí son parte de la página del contenido.
//
// Lo que el colaborador **no** ve, aunque esté configurado: **con cuántos objetivos aprueba**. Saber que le bastan 3
// de 4 lo invita a soltar uno, y lo que se le pide es ir por todos. Tampoco aparece al fallar un intento.
//
// Lo que sí se le dice antes de empezar, y no se suaviza: que lo evalúa una IA que puede equivocarse y que **la
// conversación queda registrada**, porque quien creó el contenido puede consultarla y descargarla. Prometerle que
// no se guarda sería venderle una privacidad que el producto no cumple. Lo único que de verdad no se guarda es la
// prueba de micrófono, donde solo se mide nivel: esa distinción se mantiene en el texto de las dos pantallas.

/**
 * Lo que la llamada le pide a la **barra de navegación del contenido**: iniciar. Se empieza desde el mismo sitio que
 * una evaluación —abajo a la derecha— en vez de desde un botón en medio del panel (Dave, 13-oct). La barra la monta
 * la vista del colaborador, que no sabe del micrófono ni de los intentos, así que es la llamada la que le dice qué
 * poner; mientras no haya nada que iniciar manda `null` y la barra vuelve a lo suyo.
 */
export type AccionLlamada = { texto: string; deshabilitado: boolean; mensaje?: string; onIniciar: () => void }

type Props = {
  /** El título de la página, para la cabecera gris. Lo pone quien monta el recurso, como en los demás. */
  titulo?: string
  /** Qué debe ofrecer la barra del contenido en este momento. */
  onAccion?: (accion: AccionLlamada | null) => void
  config: RoleplayConfig
  estado: EstadoRoleplay
  onEstado: (estado: EstadoRoleplay) => void
  /** Créditos de la organización. Por debajo del costo de un intento no se puede iniciar. */
  creditos?: number
  /** Vista previa del creador: se ve la pantalla pero la llamada no corre. */
  soloLectura?: boolean
  /** Dentro de la vista de móvil: la llamada se queda en el teléfono en vez de ocupar toda la ventana. */
  enTelefono?: boolean
}

export function EstudioRoleplay({ titulo, onAccion, config, estado = ESTADO_INICIAL, onEstado, creditos = 10_000, soloLectura, enTelefono }: Props) {
  const [fase, setFase] = useState<FaseRoleplay>(estado.resultado ? 'resultado' : 'intro')
  /**
   * **El reintento lo manda el contenido, no esta pantalla.** «Reintentar» vive en la barra y lo único que hace es
   * borrar el resultado; la fase de aquí dentro se queda en `resultado` y pasa a mentir. Antes daba igual —la
   * pantalla de inicio se pintaba igual porque su condición mira el resultado, no la fase—, pero desde que la barra
   * ofrece **iniciar la llamada** sí importa: con la fase mintiendo, el segundo intento se quedaba sin su botón
   * (Dave, 13-oct). Se corrige aquí, de una vez, en lugar de repetir «y además no hay resultado» en cada sitio.
   */
  const faseReal: FaseRoleplay = fase === 'resultado' && !estado.resultado ? 'intro' : fase
  const [canal, setCanal] = useState<CanalRoleplay>('voz')
  const mic = useMicrofono()

  const personaje = config.nombrePersonaje.trim() || 'el personaje'
  const intentosRestantes = Math.max(0, config.intentos - estado.intentosUsados)
  const sinCreditos = creditos < COSTO_CREDITOS
  // Sin micrófono y sin respaldo por escrito no hay salida dentro de esta pantalla: la llamada no puede empezar.
  const bloqueadoPorMic = mic.sirve === false && !config.modoTexto

  // ── Lo que la barra del contenido debe ofrecer ahora ──
  //
  // Solo hay algo que ofrecer antes de la llamada: en cuanto arranca, la barra vuelve a lo suyo (reintentar,
  // continuar). Se avisa en un efecto con **dependencias primitivas**, no con el objeto, que sería nuevo en cada
  // render y dejaría a los dos componentes pintándose en bucle.
  const puedeIniciar = !soloLectura && !bloqueadoPorMic && !sinCreditos && intentosRestantes > 0 && mic.sirve !== null
  const porEscrito = mic.sirve === false && config.modoTexto
  const ofreceIniciar = faseReal === 'intro'
  const textoIniciar = porEscrito ? 'Iniciar por escrito' : 'Iniciar llamada'
  const motivo = !ofreceIniciar || puedeIniciar
    ? undefined
    : intentosRestantes === 0
      ? 'Ya usaste todos los intentos de esta llamada.'
      : sinCreditos
        ? 'Tu organización no tiene créditos para esta llamada.'
        : bloqueadoPorMic
          ? 'Esta llamada necesita micrófono.'
          : 'Prueba tu micrófono para continuar.'

  useEffect(() => {
    if (!onAccion) return
    onAccion(
      ofreceIniciar
        ? {
            texto: textoIniciar,
            deshabilitado: !puedeIniciar,
            mensaje: motivo,
            onIniciar: () => {
              setCanal(porEscrito ? 'texto' : 'voz')
              setFase('llamada')
            },
          }
        : null,
    )
    // Al irse de la página, la barra se queda con lo que dejó la llamada si no se limpia.
    return () => onAccion(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofreceIniciar, textoIniciar, puedeIniciar, motivo, porEscrito])

  // Analizar la conversación tarda; el resultado llega solo.
  useEffect(() => {
    if (fase !== 'evaluando') return
    const id = window.setTimeout(() => {
      const resultado = evaluarIntento(config, estado.intentosUsados)
      onEstado({ intentosUsados: estado.intentosUsados + 1, resultado })
      setFase('resultado')
    }, 2600)
    return () => window.clearTimeout(id)
  }, [fase, config, estado.intentosUsados, onEstado])

  if (faseReal === 'llamada') {
    return <LlamadaRoleplay config={config} canal={canal} enTelefono={enTelefono} onTerminar={() => setFase('evaluando')} />
  }

  if (faseReal === 'evaluando') {
    return (
      <Frame>
        {/* La cabecera también aquí: era la **única** pantalla del roleplay sin ella, y el título y las condiciones
            desaparecían dos segundos para volver con el resultado. El intento es el que se acaba de hacer, y no hay
            nada que alertar todavía: el veredicto aún no está (Dave, 13-oct). */}
        <CabeceraRoleplay titulo={titulo} config={config} intento={Math.min(estado.intentosUsados + 1, config.intentos)} />
        {/* **16:9, el alto de un recurso.** El panel se queda con la misma caja que acaba de tener la llamada, así
            que la pantalla no se encoge mientras se analiza y vuelve a estirarse con el resultado (Dave, 13-oct). */}
        <FramePanel className="flex aspect-video flex-col items-center justify-center gap-3">
          <AiThinking size="md" label="Analizando tu conversación" />
          <Text as="p" size="sm" variant="muted">
            Estamos revisando qué objetivos alcanzaste.
          </Text>
        </FramePanel>
      </Frame>
    )
  }

  if (faseReal === 'resultado' && estado.resultado) {
    return (
      <Resultado
        titulo={titulo}
        config={config}
        intentoHecho={Math.min(estado.intentosUsados, config.intentos)}
        resultado={estado.resultado}
        intentosRestantes={intentosRestantes}
      />
    )
  }

  // ── Antes de la llamada ────────────────────────────────────────────────────────────────────────────────────────
  const intentoActual = Math.min(estado.intentosUsados + 1, config.intentos)

  return (
    <div className="flex flex-col gap-4">
      <Frame>
        <CabeceraRoleplay titulo={titulo} config={config} intento={intentoActual} alerta={intentoActual >= config.intentos} />
        <FramePanel className="flex flex-col gap-5">
          {/* Con quién se habla. El **título ya no se repite aquí**: es el de la página y vive en el gris, como en
              todos los demás recursos. Lo que se queda es lo que esta caja sí aporta: la cara, el nombre y el papel
              de la persona con la que vas a hablar (Dave, 13-oct). */}
          <div className="flex flex-wrap items-center gap-3">
            <CaraPersonaje imagen={config.imagen} className="size-14" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Heading as="h2" level={5}>
                {personaje}
              </Heading>
              <Text as="p" size="sm" variant="muted">
                {config.identidadPersonaje.trim() || 'Personaje sin definir'}
              </Text>
            </div>
          </div>

          {config.escenario.trim() ? (
            <Text as="p" className="whitespace-pre-line">
              {config.escenario.trim()}
            </Text>
          ) : null}

          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertDescription>
              Vas a hablar con un evaluador de inteligencia artificial: puede equivocarse. La conversación queda registrada y quien creó
              este contenido puede consultarla, así que no compartas datos personales ni información confidencial.
            </AlertDescription>
          </Alert>

          <PruebaMicrofono mic={mic} bloqueado={bloqueadoPorMic} />

          {porEscrito ? (
            <Alert variant="warning">
              <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
              <AlertDescription>Sin micrófono puedes responder por escrito. La conversación y la evaluación son las mismas.</AlertDescription>
            </Alert>
          ) : null}

          {/* Un callejón sin salida sin instrucción deja al colaborador atascado en el contenido: se le dice qué hacer. */}
          {bloqueadoPorMic ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              <AlertDescription>
                Esta llamada necesita micrófono y no se puede hacer por escrito. Conecta un micrófono, o entra a este contenido desde otro
                dispositivo que tenga uno —por ejemplo tu celular— para poder continuar.
              </AlertDescription>
            </Alert>
          ) : null}

          {sinCreditos ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              <AlertDescription>Tu organización no tiene créditos suficientes para esta llamada. Habla con tu administrador.</AlertDescription>
            </Alert>
          ) : null}

          {intentosRestantes === 0 ? (
            <Alert variant="warning">
              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              <AlertDescription>Ya usaste los {config.intentos} intentos de esta llamada. Habla con tu administrador.</AlertDescription>
            </Alert>
          ) : null}

          {/* **El botón de iniciar vive en la barra del contenido**, no aquí: así se empieza desde el mismo sitio que
              una evaluación. Lo que queda es por qué no se puede todavía, que sí pertenece a esta caja. */}
          {soloLectura ? (
            <Text as="span" size="sm" variant="muted">
              Vista previa: la llamada solo corre en la vista del colaborador.
            </Text>
          ) : null}
        </FramePanel>
      </Frame>
    </div>
  )
}

/**
 * **La cabecera del roleplay**: el título de la página y, debajo, sus condiciones. Las mismas insignias que la
 * evaluación —un roleplay en modo Evaluación también se califica y también gasta intentos—, así que las dos
 * pantallas se leen igual antes de empezar (Dave, 13-oct).
 *
 * El modo entra aquí como una condición más. Antes era una insignia de color suelta a la derecha del título, y
 * `warning-outline` no llega al contraste mínimo.
 */
function CabeceraRoleplay({
  titulo,
  config,
  intento,
  alerta = false,
}: {
  titulo?: string
  config: RoleplayConfig
  /** Antes de la llamada, el que va a hacer; en el resultado, el que acaba de hacer. */
  intento: number
  /** Solo cuando de verdad avisa: es el último y todavía no aprueba. */
  alerta?: boolean
}) {
  return (
    <FrameHeader className="gap-2">
      {/* El título no se recorta: es el nombre de la página y recortarlo se come información para saber dónde se está. */}
      <FrameTitle>{titulo || config.titulo.trim() || 'Llamada de práctica'}</FrameTitle>
      <Condiciones>
        <Condicion icono={config.modo === 'evaluacion' ? Target02Icon : Message01Icon}>{nombreModo(config.modo)}</Condicion>
        <Condicion icono={Timer02Icon}>{`${config.duracionMin} min`}</Condicion>
        <Condicion icono={RepeatIcon} alerta={alerta}>{`Intento ${intento} de ${config.intentos}`}</Condicion>
      </Condiciones>
    </FrameHeader>
  )
}

/**
 * La prueba del micrófono. **Mide de verdad**: pide permiso, enseña el nivel y confirma solo si captó voz. Un botón
 * que diga «todo bien» sin medir no descubre el problema que viene a descubrir —el micrófono silenciado, el del
 * monitor en vez del de los audífonos—.
 *
 * Mientras dura la muestra se ve cuánto falta y la confirmación llega **en vivo**, apenas se capta la voz: cuatro
 * segundos hablándole a una tarjeta quieta se leen como que algo falló.
 */
function PruebaMicrofono({ mic, bloqueado }: { mic: ReturnType<typeof useMicrofono>; bloqueado: boolean }) {
  const titulo = mic.midiendo
    ? mic.vozDetectada
      ? 'Te escuchamos'
      : 'Di algo en voz alta'
    : mic.sirve === true
      ? 'Tu micrófono funciona'
      : mic.sirve === false
        ? // Sin respaldo por escrito no «va a responder» nada: la tarjeta no promete lo que no puede cumplir.
          bloqueado
          ? 'Necesitas un micrófono'
          : 'Vas a responder por escrito'
        : 'Prueba tu micrófono'

  const apoyo = mic.midiendo
    ? `Lo que digas no se guarda: solo medimos el nivel · ${mic.restante} s`
    : mic.sirve === true
      ? 'Ya puedes iniciar la llamada.'
      : mic.sirve === false
        ? (mic.error ?? (bloqueado ? 'Esta llamada no se puede hacer por escrito.' : 'La conversación y la evaluación son las mismas.'))
        : 'Necesitamos comprobarlo antes de empezar.'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border p-3',
        mic.midiendo && 'border-primary/40',
        mic.sirve === true && 'border-success/40',
        mic.sirve === false && 'border-destructive/40',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          mic.sirve === true ? 'bg-success/15 text-success' : mic.sirve === false ? 'bg-destructive/15 text-destructive' : 'bg-muted',
        )}
      >
        <HugeiconsIcon
          icon={mic.sirve === false ? MicOff01Icon : mic.sirve === true ? CheckmarkCircle02Icon : Mic01Icon}
          size={18}
          aria-hidden="true"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="sm" weight="medium">
          {titulo}
        </Text>
        <Text as="span" size="xs" variant="muted">
          {apoyo}
        </Text>
      </div>
      {mic.midiendo ? (
        <Medidor nivel={mic.nivel} oye={mic.vozDetectada} restante={mic.restante} />
      ) : (
        <div className="flex shrink-0 flex-wrap gap-2">
          {mic.sirve !== false ? (
            <Button variant="outline" size="sm" onClick={mic.sinMicrofono}>
              No tengo micrófono
            </Button>
          ) : null}
          {/* Probar es lo que toca hacer aquí, así que va de último y en primario. Cuando ya está comprobado deja de
              serlo: ahí el primario es iniciar la llamada. */}
          <Button variant={mic.sirve === true ? 'ghost' : 'default'} size="sm" onClick={() => void mic.probar()}>
            <HugeiconsIcon icon={Mic01Icon} size={16} aria-hidden="true" />
            {mic.sirve === true ? 'Probar de nuevo' : 'Probar'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Perfil fijo por barra, para que el medidor tenga silueta y no suba como un bloque. La altura la manda el nivel real. */
const PERFIL = [0.45, 0.75, 1, 0.8, 1, 0.65, 0.4]

function Medidor({ nivel, oye, restante }: { nivel: number; oye: boolean; restante: number }) {
  return (
    <div
      className="flex h-10 shrink-0 items-center gap-1"
      role="img"
      aria-label={oye ? `Te escuchamos. Faltan ${restante} segundos` : `Esperando tu voz. Faltan ${restante} segundos`}
    >
      {PERFIL.map((factor, i) => (
        <span
          key={i}
          className={cn('w-1.5 rounded-full transition-[height] duration-75', oye ? 'bg-success' : 'bg-muted-foreground/40')}
          style={{ height: `${6 + nivel * 30 * factor}px` }}
        />
      ))}
    </div>
  )
}

/**
 * El resultado llega **objetivo por objetivo**, no como una nota: en una conversación lo útil es saber qué hiciste
 * bien y qué te faltó, no un 60 %.
 *
 * El reintento **no** vive aquí: va en la barra de navegación del contenido, igual que en las evaluaciones, para no
 * tener dos botones primarios compitiendo en la misma pantalla.
 */
function Resultado({
  titulo,
  config,
  intentoHecho,
  resultado,
  intentosRestantes,
}: {
  titulo?: string
  config: RoleplayConfig
  /** El intento que se acaba de terminar, no el siguiente: aquí se mira hacia atrás. */
  intentoHecho: number
  resultado: ResultadoRoleplay
  intentosRestantes: number
}) {
  const total = resultado.objetivos.length
  const practica = config.modo === 'practica'
  const bien = practica || resultado.aprobado

  return (
    <div className="flex flex-col gap-4">
      <Frame>
        {/* **El resultado también lleva la cabecera gris**, como el de la evaluación: el título dice en qué página
            se está y las condiciones siguen a mano. Sin ella, acabar una llamada te dejaba en una caja blanca suelta
            sin saber de qué recurso venía (Dave, 13-oct). El chip del intento **avisa solo cuando toca**: no aprobó
            y era el último. Tras aprobar no hay nada que alertar. */}
        <CabeceraRoleplay
          titulo={titulo}
          config={config}
          intento={intentoHecho}
          alerta={!bien && intentosRestantes === 0}
        />
        <FramePanel className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* El mismo icono con el que cierra una evaluación, para que los dos finales se lean igual. */}
            <ImagenGlass nombre={bien ? 'glass-tick' : 'glass-close-square'} tamano={72} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Heading as="h2" level={4}>
                {practica ? 'Práctica completada' : resultado.aprobado ? '¡Aprobaste!' : 'No alcanzaste los objetivos'}
              </Heading>
              <Text as="p" size="sm" variant="muted">
                {resultado.alcanzados} de {total} {plural(total, 'objetivo alcanzado', 'objetivos alcanzados')}
              </Text>
            </div>
          </div>

          <Progress value={(resultado.alcanzados / Math.max(1, total)) * 100} />

          {/* Qué puede hacer ahora va pegado al resultado, no al final de la lista: es su conclusión. Y nunca se le
              dice cuántos objetivos necesitaba. */}
          {!practica && !resultado.aprobado ? (
            <Alert variant={intentosRestantes > 0 ? 'warning' : 'destructive'}>
              <HugeiconsIcon icon={intentosRestantes > 0 ? RefreshIcon : Alert02Icon} aria-hidden="true" />
              <AlertTitle>
                {intentosRestantes > 0
                  ? `Todavía no alcanzas los objetivos. Te ${intentosRestantes === 1 ? 'queda 1 intento' : `quedan ${intentosRestantes} intentos`}.`
                  : 'Usaste todos tus intentos y no alcanzaste los objetivos.'}
              </AlertTitle>
              {intentosRestantes === 0 ? (
                <AlertDescription>Habla con tu administrador si necesitas otra oportunidad.</AlertDescription>
              ) : null}
            </Alert>
          ) : null}

          {/* **El marcador completo, y el detalle a un toque.** Con cuatro o cinco objetivos, la lista entera con sus
              dos lecturas abiertas obligaba a bajar para saber cómo fue; así se ve de un vistazo cuántos hay y cuáles
              se alcanzaron, y se abre el que interese. La fila va en gris muy suave y lo que se abre son dos tarjetas
              blancas: el mismo reparto del marco de los resúmenes, y las lecturas se despegan en vez de hundirse
              (Dave, 7-oct). */}
          <Accordion className="flex flex-col gap-2">
            {resultado.objetivos.map((o, i) => (
              <AccordionItem
                key={i}
                value={String(i)}
                /* Borde neutro: si lo alcanzó o no ya lo dice su insignia, y dos colores de marco por tarjeta
                   convertían la lista en un semáforo (Dave, 8-oct). */
                className="bg-muted/40 rounded-xl border px-4"
              >
                {/* `items-center!`: el trigger del tema alinea arriba y la insignia con el chevron quedaban tres
                    píxeles más altos que el número y el enunciado. Las clases no le ganan al tema, de ahí el `!`. */}
                <AccordionTrigger className="items-center! gap-3">
                  <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-semibold tabular-nums',
                        o.alcanzado ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                      )}
                    >
                      {i + 1}
                    </span>
                    <Text as="span" weight="medium" className="min-w-0">
                      {o.texto}
                    </Text>
                  </span>
                  {/* Sin punto: el color de la insignia ya dice el estado y la palabra lo confirma (Dave, 8-oct). */}
                  <Badge variant={o.alcanzado ? 'success-light' : 'destructive-light'} size="sm">
                    {o.alcanzado ? 'Alcanzado' : 'No alcanzado'}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 pb-4">
                  <Detalle icono={CheckmarkCircle02Icon} titulo="Lo que hiciste bien" tono="bien">
                    {o.fortalezas}
                  </Detalle>
                  <Detalle icono={ArrowUpRight01Icon} titulo="Para la próxima" tono="mejora">
                    {o.mejora}
                  </Detalle>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FramePanel>
      </Frame>
    </div>
  )
}


/**
 * Una lectura del objetivo, en su propia tarjeta blanca sobre el gris de la fila. La ficha del icono a la izquierda
 * deja claro dónde empieza cada una: sueltas, una debajo de otra, se leían como un solo párrafo largo.
 */
function Detalle({
  icono,
  titulo,
  tono,
  children,
}: {
  icono: typeof CheckmarkCircle02Icon
  titulo: string
  tono: 'bien' | 'mejora'
  children: React.ReactNode
}) {
  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg',
          tono === 'bien' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary',
        )}
      >
        <HugeiconsIcon icon={icono} size={16} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" size="xs" weight="medium" variant="muted">
          {titulo}
        </Text>
        <Text as="p" size="sm">
          {children}
        </Text>
      </div>
    </div>
  )
}
