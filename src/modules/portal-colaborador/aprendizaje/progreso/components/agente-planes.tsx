import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon, Target02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Text, toast } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { AgentThread, ContextPanel } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { TokenBadge, TokenCost } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/tokens'
import { HOY, type Registro } from '../../zona-de-estudio/components/datos'
import {
  avisoGenerado,
  borradorVacio,
  enLista,
  fechaLarga,
  guardar,
  leerBrief,
  leerCompetencias,
  leerContenidos,
  leerFecha,
  leerHoras,
  leerPersonas,
  listo,
  pareceBrief,
  quienes,
  resumen,
  type Borrador,
  type TipoPlanIA,
} from './agente-logica'

// El agente de planes de Progreso (HU-progreso, RN-05): la conversación guiada con que la líder arma un plan de formación
// para su equipo. Tipo de plan → título → personas → fechas → contenidos, o competencias y horas → resumen y «Generar
// plan», que gasta 80 tokens y guarda el plan. También acepta todo en un solo mensaje (un «brief»). Cada vez que se
// abre empieza de cero. Desde la auditoría del 5-oct (decisión 9) va en el panel contextual Orbit Flow del agent-kit,
// acoplado a la derecha como en Planes de formación del admin, y no en un panel propio.

export const COSTO_PLAN = 80
const PENSANDO = 1000

type Paso =
  | 'inicio'
  | 'tipo'
  | 'titulo'
  | 'personas'
  | 'inicio_fecha'
  | 'fin_fecha'
  | 'contenidos'
  | 'competencias'
  | 'horas'
  | 'confirmar'
  | 'listo'
  | 'sin_tokens'

type Props = {
  /** Cierra el panel. */
  onClose: () => void
  /** Cambia en cada apertura: reinicia la conversación. */
  sesion: number
  equipo: Registro[]
  tokens: number
  gastar: (n: number) => boolean
  onGenerado: (personaIds: string[]) => void
}

export function AgentePlanes({ onClose, sesion, equipo, tokens, gastar, onGenerado }: Props) {
  const hilo = useAgentThread()
  const { push, setThinking, reset } = hilo
  const paso = useRef<Paso>('inicio')
  const borrador = useRef<Borrador>(borradorVacio())
  const vigente = useRef(0)
  const tiempos = useRef<number[]>([])
  const props = useRef({ equipo, tokens, gastar, onGenerado, onClose })
  props.current = { equipo, tokens, gastar, onGenerado, onClose }

  useEffect(() => () => tiempos.current.forEach((t) => window.clearTimeout(t)), [])

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
  const preguntar = (siguiente: Paso, pregunta: string) => {
    paso.current = siguiente
    conPensando(() => decir(pregunta))
  }

  // ── Preguntas ────────────────────────────────────────────────────────────────────────────────────────────────

  const pedirTitulo = () => preguntar('titulo', '¿Cuál será el título del plan?')
  const pedirPersonas = () =>
    preguntar(
      'personas',
      '¿Para quiénes de tu equipo quieres crear el plan? Puedes nombrar a una o varias personas (nombre y apellido), incluirte a ti, o escribir «todos».',
    )
  const pedirInicio = () =>
    preguntar(
      'inicio_fecha',
      `¿Cuál es la fecha de inicio? Puedes decir «hoy» (${fechaLarga(HOY)} en este playground), o escribirla con naturalidad, por ejemplo: «el 20 de junio de 2026».`,
    )
  const pedirFin = () => preguntar('fin_fecha', '¿Y la fecha de finalización? Por ejemplo: «me gustaría el 30 de septiembre de 2026» o «30/09/2026».')
  const pedirContenidos = () =>
    preguntar('contenidos', '¿Qué contenidos del catálogo quieres asignar? Escribe uno o varios títulos (uno por línea o separados por coma).')
  const pedirCompetencias = () =>
    preguntar('competencias', '¿Qué competencias oficiales de UBITS quieres asignar? Pueden ser una o varias (por ejemplo: Comunicación, Agilidad).')
  const pedirHoras = () =>
    preguntar(
      'horas',
      '¿Cuántas horas de estudio asignas por competencia? Puedes indicar un número para todas (ej. 2) o detallar: «Comunicación: 3, Agilidad: 2».',
    )

  const confirmar = () => {
    paso.current = 'confirmar'
    push('agent', <Resumen borrador={{ ...borrador.current }} onGenerar={generar} />)
  }

  // Lo primero que falte, en orden; si no falta nada, el resumen.
  const seguirConLoQueFalta = () => {
    const b = borrador.current
    if (!b.tipo) return
    if (!b.titulo.trim()) return pedirTitulo()
    if (!b.personas.length) return pedirPersonas()
    if (!b.inicio) return pedirInicio()
    if (!b.fin || b.fin < b.inicio) return pedirFin()
    if (b.tipo === 'contenidos' && !b.contenidos.length) return pedirContenidos()
    if (b.tipo === 'competencias' && !b.competencias.length) return pedirCompetencias()
    if (b.tipo === 'competencias' && !b.competencias.every((c) => (b.horas[c.id] ?? 0) > 0)) return pedirHoras()
    confirmar()
  }

  const empezar = () => {
    borrador.current = borradorVacio()
    if (props.current.tokens < COSTO_PLAN) {
      paso.current = 'sin_tokens'
      conPensando(() => decir(`No tienes tokens suficientes para generar un plan (${COSTO_PLAN} requeridos). Recarga saldo e inténtalo de nuevo.`))
      return
    }
    paso.current = 'tipo'
    conPensando(() => {
      decir('¿Qué tipo de plan quieres crear? Elige una opción para continuar.')
      luego(() => push('agent', <OpcionesTipo onElegir={elegirTipo} />), 300)
    })
  }

  const elegirTipo = (tipo: TipoPlanIA, titulo: string) => {
    push('user', titulo)
    borrador.current.tipo = tipo
    if (borrador.current.titulo) seguirConLoQueFalta()
    else pedirTitulo()
  }

  const generar = () => {
    if (paso.current !== 'confirmar') return false
    if (!props.current.gastar(COSTO_PLAN)) {
      toast.add({ type: 'warning', title: `No tienes suficientes tokens (${COSTO_PLAN} requeridos).` })
      return false
    }
    const b = borrador.current
    const plan = guardar(b)
    if (!plan) {
      toast.add({ type: 'error', title: 'No se pudo guardar el plan. Intenta de nuevo.' })
      return false
    }
    paso.current = 'listo'
    // Se ve bajar el saldo y luego el panel se cierra.
    luego(() => {
      props.current.onClose()
      props.current.onGenerado(b.personas.map((p) => p.id))
      toast.add({ type: 'success', title: avisoGenerado(b), timeout: 10000 })
    }, 900)
    return true
  }

  // ── Respuestas ───────────────────────────────────────────────────────────────────────────────────────────────

  const aplicarBrief = (mensaje: string) => {
    const r = leerBrief(mensaje, props.current.equipo)
    const b = borrador.current
    if (r.tipo) b.tipo = r.tipo
    if (r.titulo) b.titulo = r.titulo
    if (r.personas?.length) {
      b.personas = r.personas
      b.todos = Boolean(r.todos)
    }
    if (r.inicio) b.inicio = r.inicio
    if (r.fin) b.fin = r.fin
    if (r.contenidos?.length) b.contenidos = r.contenidos
    if (r.competencias?.length) b.competencias = r.competencias
    if (r.horas) b.horas = r.horas
    if (r.desconocidos?.length && !r.personas?.length) {
      paso.current = 'personas'
      conPensando(() => decir(fueraDelEquipo(r.desconocidos![0], [])))
      return
    }
    if (listo(b)) {
      conPensando(() => {
        decir('Perfecto, armé el plan con lo que me compartiste. Confirma para generarlo:')
        luego(confirmar, 300)
      })
      return
    }
    conPensando(() => {
      decir('Recibí parte del plan. Completemos lo que falta.')
      luego(seguirConLoQueFalta, 400)
    })
  }

  const responder = (mensaje: string) => {
    const b = borrador.current
    const p = paso.current
    if (p === 'inicio' || p === 'listo') return empezar()
    if (p === 'sin_tokens')
      return decir('Sigo sin poder generar el plan: el saldo es insuficiente. Cuando tengas tokens, cierra y vuelve a abrir el agente.')
    if (p === 'confirmar') return
    if (pareceBrief(mensaje)) return aplicarBrief(mensaje)
    if (p === 'tipo') return

    if (p === 'titulo') {
      const titulo = mensaje.replace(/^["«]+|["»]+$/g, '').trim()
      if (!titulo) return decir('Necesito un título para el plan. ¿Cómo lo llamamos?')
      b.titulo = titulo
      return pedirPersonas()
    }
    if (p === 'personas') {
      if (!mensaje.trim()) return decir('Indica al menos una persona de tu equipo, o escribe «todos».')
      const r = leerPersonas(mensaje, props.current.equipo)
      if (r.desconocidos.length)
        return decir(
          fueraDelEquipo(
            r.desconocidos[0],
            r.personas.map((x) => x.nombre),
          ),
        )
      if (!r.personas.length) return decir('No reconocí a nadie de tu equipo. Escribe un nombre y apellido, varios nombres, o «todos».')
      b.personas = r.personas
      b.todos = r.todos
      const confirmacion = r.todos
        ? `Perfecto. Crearé el plan para todo tu equipo (${r.personas.length} personas).`
        : `Listo. El plan será para ${quienes(r)}.`
      return conPensando(() => {
        decir(confirmacion)
        luego(pedirInicio, 350)
      }, 500)
    }
    if (p === 'inicio_fecha') {
      const f = leerFecha(mensaje)
      if (!f) return decir('No pude identificar una fecha en tu mensaje. Prueba con «hoy», «20 de junio de 2026» o «20/06/2026».')
      if (f < HOY) return decir(`La fecha de inicio no puede ser anterior a hoy (${fechaLarga(HOY)}). Prueba con «hoy» o una fecha posterior.`)
      b.inicio = f
      return pedirFin()
    }
    if (p === 'fin_fecha') {
      const f = leerFecha(mensaje)
      if (!f)
        return decir(
          'No pude identificar una fecha en tu mensaje. Prueba algo como «30 de septiembre de 2026», «el 30 de sept de 2026» o «30/09/2026».',
        )
      if (f < b.inicio) return decir('La fecha de finalización debe ser igual o posterior a la de inicio. ¿Cuál es la fecha de fin?')
      b.fin = f
      return b.tipo === 'competencias' ? pedirCompetencias() : pedirContenidos()
    }
    if (p === 'contenidos') {
      const r = leerContenidos(mensaje)
      if (!r.encontrados.length)
        return decir('No encontré esos títulos en el catálogo. Escribe el nombre exacto o muy parecido de uno o más contenidos.')
      b.contenidos = r.encontrados
      return conPensando(() => {
        if (r.faltan.length) decir(`Tomé ${r.encontrados.length} contenido(s). No encontré: ${r.faltan.join(', ')}.`)
        confirmar()
      })
    }
    if (p === 'competencias') {
      const r = leerCompetencias(mensaje)
      if (!r.encontradas.length)
        return decir('No coinciden con las competencias oficiales de UBITS. Prueba con nombres como Comunicación, Agilidad o Gestión de proyectos.')
      b.competencias = r.encontradas
      return conPensando(() => {
        if (r.faltan.length) decir(`Asigné: ${r.encontradas.map((c) => c.nombre).join(', ')}. No reconocí: ${r.faltan.join(', ')}.`)
        pedirHoras()
      })
    }
    if (p === 'horas') {
      const r = leerHoras(mensaje, b.competencias)
      if ('error' in r) return decir(r.error)
      b.horas = r.horas
      return conPensando(confirmar)
    }
  }

  // La caja de escribir es la del panel: llega el texto ya recortado.
  const enviar = (mensaje: string) => {
    if (!mensaje || hilo.thinking) return
    push('user', mensaje)
    conPensando(() => responder(mensaje))
  }

  // Al abrir: conversación nueva.
  useEffect(() => {
    if (!sesion) return
    vigente.current += 1
    tiempos.current.forEach((t) => window.clearTimeout(t))
    tiempos.current = []
    paso.current = 'inicio'
    borrador.current = borradorVacio()
    reset()
    push(
      'agent',
      <Mensaje>
        ¡Hola! Te ayudo a generar un plan de formación para tu equipo con IA. También puedes pegar un brief completo en un solo
        mensaje.
      </Mensaje>,
    )
    luego(empezar, 400)
    // Solo al cambiar de sesión: lo demás se lee por referencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion])

  return (
    // El panel Orbit Flow del agent-kit: cabecera con el orbe y la X, franja de contexto, hilo y su caja de escribir.
    // El panel ya es el registro de la conversación y baja solo con cada mensaje nuevo.
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Progreso de tu equipo</span> · {equipo.length} {equipo.length === 1 ? 'persona' : 'personas'}
        </>
      }
      contextIcon={UserGroupIcon}
      onClose={onClose}
      placeholder="Escribe aquí…"
      onSend={enviar}
      scrollKey={hilo.msgs.length ? hilo.scrollKey : undefined}
    >
      {/* El saldo que gasta «Generar plan»: el panel no tiene sitio en su cabecera para la insignia. */}
      <div className="mb-3 flex justify-end">
        <TokenBadge tokens={tokens} />
      </div>
      <AgentThread msgs={hilo.msgs} thinking={hilo.thinking} thinkingLabel="Pensando" />
    </ContextPanel>
  )
}

const fueraDelEquipo = (quien: string, validas: string[]) =>
  `${quien || 'Esa persona'} no está bajo tu supervisión en el organigrama, así que no puedes crear un plan para ella. Elige a alguien de tu equipo (o escribe «todos»).` +
  (validas.length ? ` Las personas válidas que detecté son: ${enLista(validas)}.` : '')

// ── Piezas del hilo ──────────────────────────────────────────────────────────────────────────────────────────────

function Mensaje({ children }: { children: ReactNode }) {
  return (
    <Text as="p" size="sm" className="whitespace-pre-line">
      {children}
    </Text>
  )
}

function OpcionesTipo({ onElegir }: { onElegir: (tipo: TipoPlanIA, titulo: string) => void }) {
  const [elegido, setElegido] = useState<TipoPlanIA | null>(null)
  const opciones = [
    {
      valor: 'contenidos' as const,
      icono: BookOpen01Icon,
      titulo: 'Plan por contenidos',
      descripcion: 'Arma un plan con cursos y recursos del catálogo.',
    },
    {
      valor: 'competencias' as const,
      icono: Target02Icon,
      titulo: 'Plan por competencias',
      descripcion: 'Define competencias y habilidades a desarrollar.',
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

function Resumen({ borrador, onGenerar }: { borrador: Borrador; onGenerar: () => boolean }) {
  const [usado, setUsado] = useState(false)
  const { lineas, incluye, items, nota } = resumen(borrador)
  return (
    <div className="flex flex-col items-start gap-3">
      {lineas.map((l) => (
        <Text key={l} as="p" size="sm">
          {l}
        </Text>
      ))}
      <Text as="p" size="sm">
        {incluye}
      </Text>
      <ul className="-mt-1 flex list-disc flex-col gap-1 pl-5">
        {items.map((i) => (
          <Text key={i} as="li" size="sm">
            {i}
          </Text>
        ))}
      </ul>
      {nota ? (
        <Text as="p" size="sm" variant="muted">
          {nota}
        </Text>
      ) : null}
      <BotonIaSecundario size="sm" disabled={usado} onClick={() => onGenerar() && setUsado(true)}>
        Generar plan
        <TokenCost cost={COSTO_PLAN} />
      </BotonIaSecundario>
    </div>
  )
}
