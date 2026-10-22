import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUp02Icon,
  Cancel01Icon,
  File01Icon,
  FlashIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Field,
  FieldLabel,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIa } from '@/shared/components/BotonIa'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { notify } from '@/shared/components/notify'
import { AgentCard, AgentThread } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import type { TipoBanco } from '../banco-preguntas'
import { COSTO, actualizarPagina, gastarTokens, getBorrador, setBorrador, useBorrador } from '../borrador'
import { ETIQUETA_DIFICULTAD, TEMA_IA, type Dificultad } from './logica'
import { TokenBadge, TokenCost } from '../tokens'
import { plural } from '@/modules/design-system/patrones/formato'
import { AvisoOrbit } from '@/modules/design-system/ia/aviso-orbit'

// «Orbit» en una evaluación (antes «Agente de evaluaciones»): la conversación guiada que arma una evaluación con IA. Dos caminos (configuración estándar
// o desde cero), el material del tema, los tipos de pregunta y la confirmación, que gasta los tokens y le pasa el
// pedido al editor para que genere. Cada vez que se abre empieza de cero.

export type PedidoGeneracion = { dificultad: Dificultad; cantidad: number; tipos: TipoBanco[] }

type Props = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** Cambia en cada apertura: reinicia la conversación. */
  sesion: number
  paginaId: string
  onGenerar: (pedido: PedidoGeneracion) => void
  /**
   * El agente se abre al lado de la evaluación, no encima: sin fondo oscurecido y sin cerrarse al tocar fuera, para que
   * se puedan seguir tocando las preguntas mientras conversa. Es como lo abre la columna «Vista previa» del paso 2.
   */
  junto?: boolean
}

type Paso = 'inicio' | 'sin_tokens' | 'camino' | 'nombre' | 'pasos' | 'material' | 'analizando' | 'tipos' | 'confirmar' | 'generando' | 'listo'

type Estado = PedidoGeneracion & { paso: Paso; largo: boolean }

const COSTO_IA = COSTO.evaluacion
const PENSANDO = 1000

const estadoInicial = (): Estado => ({
  paso: 'inicio',
  largo: false,
  dificultad: 'intermediate',
  cantidad: 10,
  tipos: ['multiple_choice_single_answer'],
})

const TIPOS_AGENTE: { etiqueta: string; tipo: TipoBanco }[] = [
  { etiqueta: 'Múltiple, una correcta', tipo: 'multiple_choice_single_answer' },
  { etiqueta: 'Múltiple, varias correctas', tipo: 'multiple_choice_multiple_answers' },
  { etiqueta: 'Verdadero / Falso', tipo: 'binary' },
  { etiqueta: 'Texto cerrado', tipo: 'closed_text' },
  { etiqueta: 'Ensayo', tipo: 'essay' },
  { etiqueta: 'Emparejamiento', tipo: 'matching' },
]

export function AgenteEvaluaciones({ abierto, onAbiertoChange, sesion, paginaId, onGenerar, junto }: Props) {
  const { tokens } = useBorrador()
  const hilo = useAgentThread()
  const { push, setThinking, reset } = hilo
  const estado = useRef<Estado>(estadoInicial())
  const vigente = useRef(0)
  const tiempos = useRef<number[]>([])
  // Las piezas del hilo se crean una vez y llaman a esto después: leen siempre las props de ahora.
  const props = useRef({ paginaId, onGenerar, onAbiertoChange })
  props.current = { paginaId, onGenerar, onAbiertoChange }

  const [borrador, setBorradorTexto] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => () => tiempos.current.forEach((t) => window.clearTimeout(t)), [])

  // Programa algo de esta conversación: si se reabrió el agente entretanto, ya no pasa.
  const luego = (fn: () => void, ms: number) => {
    const deEsta = vigente.current
    tiempos.current.push(window.setTimeout(() => deEsta === vigente.current && fn(), ms))
  }

  const conPensando = (fn: () => void, ms = PENSANDO) => {
    setThinking(true)
    luego(() => {
      setThinking(false)
      fn()
    }, ms)
  }

  const decir = (contenido: ReactNode) => push('agent', typeof contenido === 'string' ? <Mensaje>{contenido}</Mensaje> : contenido)

  // ── Conversación ─────────────────────────────────────────────────────────────────────────────────────────────

  const empezar = () => {
    if (getBorrador().tokens < COSTO_IA) {
      estado.current.paso = 'sin_tokens'
      notify(`No tienes suficientes tokens (${COSTO_IA} requeridos).`, undefined, 'warning')
      decir(
        `Se agotaron tus tokens para generar la evaluación con IA. Necesitas al menos ${COSTO_IA} tokens para continuar. Recarga saldo cuando esté disponible o vuelve a intentarlo más tarde.`,
      )
      return
    }
    estado.current.paso = 'camino'
    decir('¿Cómo quieres crear la evaluación?')
    luego(() => push('agent', <OpcionesCamino onElegir={elegirCamino} />), 300)
  }

  const elegirCamino = (camino: 'estandar' | 'cero', titulo: string) => {
    push('user', titulo)
    if (camino === 'estandar') {
      Object.assign(estado.current, {
        paso: 'material',
        largo: false,
        cantidad: 10,
        dificultad: 'intermediate',
        tipos: ['multiple_choice_single_answer', 'binary'],
      })
      setBorrador((b) => ({
        configEvaluacion: {
          ...b.configEvaluacion,
          aprobacion: 70,
          tiempoLimite: false,
          limitarIntentos: false,
          preguntasAleatorias: true,
          opcionesAleatorias: true,
        },
      }))
      conPensando(() =>
        decir('¡Perfecto! Cuéntame sobre el tema de la evaluación. Escribe el contenido directamente o adjunta un archivo (doc, pdf, txt).'),
      )
    } else {
      Object.assign(estado.current, { paso: 'nombre', largo: true })
      conPensando(() => decir('¿Cómo se llamará la evaluación?'))
    }
  }

  const terminarPasos = (respuestas: string[]) => {
    const puntaje = parseInt(respuestas[0].replace('%', ''), 10)
    const tiempo = ['30', '45', '60', '90'].find((m) => respuestas[1].includes(m))
    const cantidad = parseInt(respuestas[2].replace(/\D/g, ''), 10)
    const dificultad: Dificultad = respuestas[3] === 'Básico' ? 'basic' : respuestas[3] === 'Avanzado' ? 'advanced' : 'intermediate'
    const aprobacion = Number.isNaN(puntaje) ? 70 : puntaje
    const total = Number.isNaN(cantidad) || cantidad < 1 ? 10 : Math.min(cantidad, 20)

    Object.assign(estado.current, { paso: 'material', cantidad: total, dificultad })
    setBorrador((b) => ({
      configEvaluacion: {
        ...b.configEvaluacion,
        aprobacion,
        tiempoLimite: Boolean(tiempo),
        minutos: tiempo ? Number(tiempo) : b.configEvaluacion.minutos,
        limitarIntentos: false,
        preguntasAleatorias: true,
        opcionesAleatorias: true,
      },
    }))

    const resumen =
      `Configuración seleccionada:\n✓ ${aprobacion} % mínimo` +
      (tiempo ? ` · ${tiempo} min` : '') +
      ` · ${total} ${plural(total, 'pregunta', 'preguntas')} · ${ETIQUETA_DIFICULTAD[dificultad]}`
    conPensando(() => {
      decir(resumen)
      luego(() => decir('Ahora cuéntame sobre el tema de la evaluación. Escribe el contenido o adjunta un archivo.'), 400)
    })
  }

  const preguntarTipos = () => {
    estado.current.paso = 'tipos'
    conPensando(() => {
      decir('¿Qué tipos de pregunta quieres incluir? Elige uno o varios.')
      luego(() => push('agent', <SeleccionTipos onListo={elegirTipos} />), 300)
    })
  }

  const elegirTipos = (etiquetas: string[]) => {
    push('user', etiquetas.join(', '))
    estado.current.tipos = etiquetas.map((e) => TIPOS_AGENTE.find((t) => t.etiqueta === e)?.tipo ?? 'multiple_choice_single_answer')
    estado.current.paso = 'confirmar'
    conPensando(confirmar)
  }

  const confirmar = () => {
    estado.current.paso = 'confirmar'
    push('agent', <Confirmacion cantidad={estado.current.cantidad} onGenerar={generar} />)
  }

  const generar = () => {
    if (estado.current.paso === 'generando') return false
    if (!gastarTokens(COSTO_IA)) {
      notify(`No tienes suficientes tokens (${COSTO_IA} requeridos).`, undefined, 'warning')
      return false
    }
    estado.current.paso = 'generando'
    const { dificultad, cantidad, tipos } = estado.current
    // Se ve bajar el saldo y luego el panel se cierra para dejar ver el editor generando.
    luego(() => {
      estado.current.paso = 'listo'
      props.current.onAbiertoChange(false)
      props.current.onGenerar({ dificultad, cantidad, tipos })
    }, 1850)
    return true
  }

  const procesar = (texto: string, contenido: string) => {
    const e = estado.current
    if (e.paso === 'sin_tokens') {
      decir('Sigo sin poder generar la evaluación: el saldo es insuficiente. Cuando tengas tokens, cierra y vuelve a abrir el agente para empezar de nuevo.')
      return
    }
    if (e.paso === 'inicio' || e.paso === 'listo') {
      empezar()
      return
    }
    if (e.paso === 'nombre') {
      if (!texto) {
        decir('Necesito un nombre para continuar. ¿Cómo se llamará la evaluación?')
        return
      }
      // El nombre de la evaluación también es el título de la página.
      actualizarPagina(props.current.paginaId, { titulo: texto })
      e.paso = 'pasos'
      conPensando(() => push('agent', <PasosConfiguracion onListo={terminarPasos} />), 500)
      return
    }
    if (e.paso === 'material' && contenido) {
      e.paso = 'analizando'
      conPensando(() => (e.largo ? preguntarTipos() : confirmar()), 1800)
    }
  }

  const enviar = () => {
    const texto = borrador.trim()
    const contenido = texto || archivo?.name || ''
    if (!contenido || hilo.thinking) return
    push(
      'user',
      archivo ? (
        <span className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className="gap-1">
            <HugeiconsIcon icon={File01Icon} size={12} aria-hidden="true" />
            {archivo.name}
          </Badge>
          {texto || null}
        </span>
      ) : (
        texto
      ),
    )
    setBorradorTexto('')
    setArchivo(null)
    conPensando(() => procesar(texto, contenido))
  }

  // Al abrir: conversación nueva.
  useEffect(() => {
    if (!sesion) return
    vigente.current += 1
    tiempos.current.forEach((t) => window.clearTimeout(t))
    tiempos.current = []
    estado.current = estadoInicial()
    reset()
    setBorradorTexto('')
    setArchivo(null)
    push('agent', <Mensaje>¡Hola! Soy Orbit. Voy a ayudarte a crear preguntas sobre el tema de tu contenido.</Mensaje>)
    luego(empezar, 400)
    // Solo al cambiar de sesión: `empezar` y los demás leen su estado por referencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion])

  // Baja hasta lo último cada vez que llega algo.
  useEffect(() => {
    const id = window.setTimeout(() => fin.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 40)
    return () => window.clearTimeout(id)
  }, [hilo.scrollKey])

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      modal={!junto}
      disablePointerDismissal={junto}
      ai
      // El panel del agente contextual se llama como él, «Orbit» (decisión 9 de la auditoría, 5-oct).
      title="Orbit"
      badge={<TokenBadge tokens={tokens} />}
      // Desde 640 px manda el ancho «md» del panel (30rem); por debajo, el panel ocupa todo el ancho de la pantalla
      // (la librería lo deja en 75 %, que en el celular no alcanza para conversar).
      style={{ ['--drawer-content-width' as string]: 'calc(100vw - 1.5rem)' }}
      footerClassName="px-4!"
      footer={
        // El pie del DrawerShell es una fila: la caja y el aviso van en una columna propia, a todo el ancho.
        <div className="flex w-full min-w-0 flex-col gap-2">
          {archivo ? (
            <Attachment size="xs" className="max-w-full self-start">
              <AttachmentMedia>
                <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
              </AttachmentMedia>
              <AttachmentContent className="min-w-0">
                <AttachmentTitle>{archivo.name}</AttachmentTitle>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label="Quitar archivo" onClick={() => setArchivo(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={12} />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ) : null}
          {/* La caja para escribirle al agente es la del chat de Suite AI (Design system › Suite AI chat). */}
          <Composer
            value={borrador}
            onChange={setBorradorTexto}
            onSend={enviar}
            canSend={Boolean(borrador.trim() || archivo)}
            onVoice={() => undefined}
            rows={1}
            placeholder="Escribe aquí…"
            ariaLabel="Escribe aquí…"
            onAttach={() => entrada.current?.click()}
            attachLabel="Adjuntar"
            voice={false}
            // Enviar con el primario de IA del DS (BotonIa, el degradado de marca en círculo), no el botón azul metálico
            // de Suite AI.
            action={
              <BotonIa aria-label="Enviar" disabled={!(borrador.trim() || archivo)} onClick={enviar} className="size-9 px-0!">
                <HugeiconsIcon icon={ArrowUp02Icon} size={16} aria-hidden="true" />
              </BotonIa>
            }
          />
          <Input
            ref={entrada}
            type="file"
            accept=".doc,.docx,.pdf,.txt"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
          <AvisoOrbit />
        </div>
      }
    >
      <div role="log" aria-label="Conversación con el agente" aria-relevant="additions">
        <AgentThread msgs={hilo.msgs} thinking={hilo.thinking} thinkingLabel="Pensando" />
        <div ref={fin} />
      </div>
    </DrawerShell>
  )
}

// ── Piezas del hilo ──────────────────────────────────────────────────────────────────────────────────────────────

function Mensaje({ children }: { children: ReactNode }) {
  return (
    <Text as="p" size="sm" className="whitespace-pre-line">
      {children}
    </Text>
  )
}

function OpcionesCamino({ onElegir }: { onElegir: (camino: 'estandar' | 'cero', titulo: string) => void }) {
  const [elegido, setElegido] = useState<string | null>(null)
  const opciones = [
    {
      valor: 'estandar' as const,
      icono: FlashIcon,
      titulo: 'Configuración estándar',
      descripcion: '70 % para aprobar, sin límite de tiempo ni de intentos.',
    },
    {
      valor: 'cero' as const,
      icono: Settings02Icon,
      titulo: 'Configurar desde cero',
      descripcion: 'Personaliza nombre, puntaje mínimo, tiempo, número de preguntas y tipos.',
    },
  ]
  return (
    <div className="flex flex-col gap-2">
      {opciones.map((o) => (
        <Item
          key={o.valor}
          variant={elegido === o.valor ? 'muted' : 'outline'}
          render={<button type="button" disabled={Boolean(elegido)} />}
          aria-pressed={elegido === o.valor}
          className="w-full text-left"
          onClick={() => {
            if (elegido) return
            setElegido(o.valor)
            onElegir(o.valor, o.titulo)
          }}
        >
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={o.icono} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{o.titulo}</ItemTitle>
            <ItemDescription>{o.descripcion}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  )
}

type PasoConfig = { pregunta: string; opciones: string[]; libre: string | false }

const PASOS: PasoConfig[] = [
  {
    pregunta: '¿Puntaje mínimo de aprobación?',
    opciones: ['60 % — Aprobación básica', '70 % — Estándar recomendado', '80 % — Nivel intermedio', '90 % — Alto desempeño'],
    libre: 'Otro',
  },
  {
    pregunta: '¿Límite de tiempo?',
    opciones: ['Sin límite de tiempo', '30 minutos', '45 minutos', '60 minutos', '90 minutos'],
    libre: 'Otro',
  },
  {
    pregunta: '¿Cuántas preguntas quieres generar?',
    opciones: ['5 preguntas', '10 preguntas', '15 preguntas', '20 preguntas'],
    libre: 'Otra cantidad',
  },
  { pregunta: '¿Nivel de dificultad?', opciones: ['Básico', 'Intermedio', 'Avanzado'], libre: false },
]

// Los cuatro ajustes del camino «desde cero», uno por pantalla: elegir una opción o escribir otra.
function PasosConfiguracion({ onListo }: { onListo: (respuestas: string[]) => void }) {
  const [indice, setIndice] = useState(0)
  const [elegidas, setElegidas] = useState<string[]>(() => PASOS.map(() => ''))
  const [libres, setLibres] = useState<string[]>(() => PASOS.map(() => ''))
  const [terminado, setTerminado] = useState(false)
  if (terminado) return null

  const paso = PASOS[indice]
  const ultimo = indice === PASOS.length - 1
  const respuesta = elegidas[indice] || libres[indice].trim()
  const poner = (lista: string[], valor: string) => lista.map((v, i) => (i === indice ? valor : v))

  const seguir = () => {
    if (!respuesta) return
    if (!ultimo) {
      setIndice(indice + 1)
      return
    }
    setTerminado(true)
    onListo(PASOS.map((_, i) => elegidas[i] || libres[i].trim()))
  }

  return (
    <AgentCard>
      <div className="flex items-start justify-between gap-3">
        <Text as="p" size="sm" weight="semibold">
          {paso.pregunta}
        </Text>
        <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
          {indice + 1} de {PASOS.length}
        </Text>
      </div>
      <RadioGroup
        key={indice}
        value={elegidas[indice] || null}
        onValueChange={(v) => {
          setElegidas(poner(elegidas, String(v)))
          setLibres(poner(libres, ''))
        }}
        aria-label={paso.pregunta}
        className="mt-3"
      >
        {paso.opciones.map((opcion, i) => (
          <Field key={opcion} orientation="horizontal">
            <RadioGroupItem value={opcion} id={`paso-${indice}-${i}`} />
            <FieldLabel htmlFor={`paso-${indice}-${i}`}>
              {opcion}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      {paso.libre ? (
        <Input
          className="mt-3"
          value={libres[indice]}
          placeholder={paso.libre}
          aria-label={paso.libre}
          onChange={(e) => {
            setLibres(poner(libres, e.target.value))
            if (e.target.value.trim()) setElegidas(poner(elegidas, ''))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              seguir()
            }
          }}
        />
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        {indice > 0 ? (
          <Button variant="outline" size="sm" aria-label="Paso anterior" onClick={() => setIndice(indice - 1)}>
            Anterior
          </Button>
        ) : null}
        <Button size="sm" disabled={!respuesta} aria-label={ultimo ? 'Enviar respuestas' : 'Ir al siguiente paso'} onClick={seguir}>
          {ultimo ? 'Enviar' : 'Siguiente'}
        </Button>
      </div>
    </AgentCard>
  )
}

function SeleccionTipos({ onListo }: { onListo: (etiquetas: string[]) => void }) {
  const [valores, setValores] = useState<string[]>([])
  const [listo, setListo] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        multiple
        variant="outline"
        size="sm"
        value={valores}
        onValueChange={(v) => setValores(v as string[])}
        disabled={listo}
        aria-label="Tipos de pregunta"
        className="flex-wrap justify-start"
      >
        {TIPOS_AGENTE.map((t) => (
          <ToggleGroupItem key={t.tipo} value={t.etiqueta}>
            {t.etiqueta}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={listo || !valores.length}
          onClick={() => {
            setListo(true)
            // En el orden de la lista, no en el orden en que se marcaron.
            onListo(TIPOS_AGENTE.map((t) => t.etiqueta).filter((e) => valores.includes(e)))
          }}
        >
          Listo →
        </Button>
      </div>
    </div>
  )
}

function Confirmacion({ cantidad, onGenerar }: { cantidad: number; onGenerar: () => boolean }) {
  const [usado, setUsado] = useState(false)
  return (
    <div className="flex flex-col items-start gap-3">
      <Text as="p" size="sm">
        Voy a generar{' '}
        <Text as="span" size="sm" weight="semibold">
          {cantidad} {plural(cantidad, 'pregunta', 'preguntas')}
        </Text>{' '}
        sobre el tema{' '}
        <Text as="span" size="sm" weight="semibold">
          &quot;{getBorrador().portada.titulo.trim() || TEMA_IA}&quot;
        </Text>
        .
      </Text>
      <BotonIaSecundario size="sm" disabled={usado} onClick={() => onGenerar() && setUsado(true)}>
        Generar evaluación
        <TokenCost cost={COSTO_IA} />
      </BotonIaSecundario>
    </div>
  )
}
