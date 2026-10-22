import { Fragment, createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowRight01Icon,
  Briefcase06Icon,
  ChartAverageIcon,
  CircleLock01Icon,
  Database01Icon,
  File01Icon,
  FileImportIcon,
  Mail01Icon,
  MoneyBag02Icon,
  Search01Icon,
  SmartPhone01Icon,
  Tick02Icon,
  UserEdit01Icon,
  UserGroupIcon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  IconTile,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { useAccion } from '@/modules/design-system/estados/carga'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { notify, notifyAction } from '@/shared/components/notify'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import type { ReplySource } from '@/modules/admin/suite-ai/shared/reply-details'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentSuggestions,
  AgentThread,
  ContextPanel,
  OrbeEnRespuesta,
  ProposalCard,
  UndoRow,
  useEstadoDelMensaje,
  useMensajeAgente,
} from '@/modules/design-system/agente-contextual/components/agent-kit'
import { KICKER, PILL, PILL_XS } from '@/modules/design-system/agente-contextual/components/agent-styles'
import styles from '@/modules/design-system/agente-contextual/components/agent.module.css'
import { useAgentThread } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { pesos } from '../../vacantes/detalle/components/data'
import { cumplidosDe, primeraEtapaDe, siguienteEtapaDe, tituloEtapa, type Candidatura, type Rechazada, type VacanteUI } from '../datos'
import { QUIEN_MUEVE, registroDeMovimientos, useTodosLosMovimientos, type Movimiento } from '../movimientos'
import {
  CRITERIOS,
  ENFOQUES,
  MAX_COMPARAR,
  actividadDe,
  afinesEnLaBase,
  borradorDeCorreo,
  cumplenMitad,
  cumplenTodo,
  desgloseDe,
  embudoDe,
  entender,
  entrevistasDe,
  esperanDe,
  exEmpleadosDe,
  filasDeComparacion,
  motivosDeRechazo,
  nombreDelGrupo,
  normalizar,
  loQuePide,
  parecidaA,
  partirPedido,
  personaDeLaBase,
  personasDelGrupo,
  pidenMas,
  porEntrada,
  primerNombre,
  propuestasDe,
  rechazoDe,
  recomendar,
  revisionDeLaVacante,
  sugeridasParaComparar,
  todasDe,
  type ContextoVacante,
  type Criterio,
  type Enfoque,
  type Grupo,
  type Intencion,
  type Propuesta,
  type Tono,
} from '../agente-vacante'
import {
  CAMPOS_EDITABLES,
  actualizadoCampo,
  elCampo,
  elNuevoCampo,
  leerValor,
  nombreDeCampo,
  registroDeCorrecciones,
  textoDeValor,
  valorDe,
  type CampoEditable,
} from '../correcciones'
import { anotarCorreo, baseDeCandidatos, candidaturaDesdeLaBase, usePersonasDeLaBase } from '../base'
import { claveDeComentario, expedienteDeSesion } from '../expediente-sesion'
import { resumenDeLote, cuentasDe, type LoteCvs } from '../importacion'
import { simulado } from '../simular'
import { VistaPreviaCorreo } from './vista-previa-correo'
import { PORTAL } from './dialogos-vacante'
import { noSeGuardo } from '../simular'
import { plural, fechaCorta } from '@/modules/design-system/patrones/formato'

// «Copiloto IA › Gestionar vacante con IA» (25 sep, Nicolás: «ahí deberíamos usar el agente contextual y que pueda
// preguntar cosas y que sea hermoso»). Es el agente contextual del sistema de diseño, a la derecha y debajo del header.
// Pregunta con lo que ya sabe en vez de pedir que se escriba, y desde el 8 oct (casos OF-01 a OF-61):
// 1. **Entiende órdenes**: rechazar, pasar de etapa, recordar la entrevista, volver a considerar, abrir una ficha,
//    escribirle a alguien o anotar algo, también para un grupo («todos los que no cumplen»), con un plan que se aprueba.
// 2. **Responde sobre la vacante**: quién espera, quién cumple, dónde se atasca, por fechas, cómo entró, por etapa, los
//    lotes, la vacante misma (requisitos, rango, descripción, etapas, equipo, enlace) y cómo terminó si está cerrada.
// 3. **Sabe dónde está**: la ficha abierta, lo que marcaste, tus filtros, la pestaña, el estado de la vacante y tu permiso.
// 4. **Responde como el agente del sistema de diseño**: fuentes, copiar, útil o no útil, responder de nuevo, preguntas
//    para seguir, pedido editable, «Detener», y la conversación sigue al cerrar el panel.
// 5. **Tiene reglas**: no responde por la edad, los hijos o el estado civil, no rechaza por eso, avisa del texto escondido
//    en una hoja de vida y deja registrado lo que se aprobó a propuesta suya.
// Nada cambia sin que el equipo lo apruebe (decisión 12).

export type FiltroTablero = { vista?: 'espera' | 'proceso' }
type Cambio = { candidatura: Candidatura; destino: string }

type Agente = {
  ctx: ContextoVacante
  // Lo que pide la persona (su burbuja) y lo que responde el agente después de pensarlo.
  hablar: (pedido: string, respuesta: ReactNode, opciones?: { pensando?: string; espera?: number }) => void
  escribir: (texto: string) => void
  rehacer: (pedidoId: number, pedido: string) => void
  onAbrir: (candidaturaId: string) => void
  onMover: (candidatura: Candidatura, destino: string, porAgente?: string) => void
  onMoverVarias: (cambios: Cambio[], porAgente?: string) => void
  onRechazar: (candidaturas: Candidatura[], porAgente?: string) => void
  onReconsiderar?: (rechazada: Rechazada) => void
  onAgregar?: (candidaturas: Candidatura[]) => void
  onFiltrar?: (filtro: FiltroTablero) => void
  onVerEtapa?: (etapa: string) => void
  onImportar?: () => void
  onVerLote?: (loteId: string) => void
  onEditar?: () => void
  onReabrir?: () => void
  lotes: LoteCvs[]
  hilo: ReturnType<typeof useAgentThread>
}

const AgenteContexto = createContext<Agente | null>(null)

function useAgente() {
  const agente = useContext(AgenteContexto)
  if (!agente) throw new Error('Las respuestas del agente van dentro de AgenteVacante')
  return agente
}

// Las respuestas guardan ids, no personas: así leen siempre lo último (si alguien avanzó o se le corrigió un dato).
// Desde el 8 oct todas leen los datos de ahora (OF-28): antes unas se quedaban como estaban y otras cambiaban solas.
const buscarEn = (ctx: ContextoVacante, id: string) => todasDe(ctx).find((c) => c.id === id)
const vivas = (ctx: ContextoVacante, ids: string[]) => ids.map((id) => buscarEn(ctx, id)).filter((c) => c !== undefined)

const nombres = (lista: string[]) => (lista.length <= 1 ? lista.join('') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`)
const personasTexto = (n: number) => (n === 1 ? '1 persona' : `${n} personas`)
const diasTexto = (dias: number) => (dias === 0 ? 'hoy' : dias === 1 ? '1 día' : `${dias} días`)
const veSalarios = (ctx: ContextoVacante) => ctx.puede?.salarios !== false
const puedeCambiar = (ctx: ContextoVacante) => ctx.puede?.cambiar !== false
const cerrada = (ctx: ContextoVacante) => ctx.vacante.estado === 'Cerrada'

// Por qué se aprobó algo desde el agente: queda en el historial de la persona (OF-55).
const porAgente = (razon: string) => razon

/* Fuentes de cada respuesta (OF-30) ---------------------------------------------------------------------------- */

const F = {
  tablero: (ctx: ContextoVacante): ReplySource => ({ label: 'Tablero de la vacante', detail: `${personasTexto(ctx.dentro.length)} en proceso · al día`, icon: UserGroupIcon }),
  cv: (n: number): ReplySource => ({ label: 'Evaluación de los CVs', detail: `La IA leyó ${n === 1 ? 'un CV' : `${n} CVs`} contra los requisitos`, icon: File01Icon }),
  serena: (n: number): ReplySource => ({ label: 'Entrevistas con Serena AI', detail: n ? `${n} hechas en esta vacante` : 'Ninguna hecha todavía', icon: ChartAverageIcon }),
  vacante: (ctx: ContextoVacante): ReplySource => ({ label: 'La vacante', detail: `${ctx.vacante.titulo} · ${ctx.vacante.requisitos.length} ${plural(ctx.vacante.requisitos.length, 'requisito', 'requisitos')} · ${pesos(ctx.vacante.rango[0])} – ${pesos(ctx.vacante.rango[1])}`, icon: Briefcase06Icon }),
  salario: (): ReplySource => ({ label: 'Lo que pidió cada persona', detail: 'Al aplicar o en la entrevista; lo que alguien no dijo no cuenta', icon: MoneyBag02Icon }),
  rechazos: (ctx: ContextoVacante): ReplySource => ({ label: 'Rechazos de la vacante', detail: `${personasTexto(ctx.rechazadas.length)} con su motivo`, icon: File01Icon }),
  base: (n: number): ReplySource => ({ label: 'Mis candidatos', detail: `${n} ${plural(n, 'persona', 'personas')} en la base de la empresa`, icon: Database01Icon }),
  lotes: (n: number): ReplySource => ({ label: 'CVs importados', detail: `${n === 1 ? 'Un lote' : `${n} lotes`} de esta vacante`, icon: FileImportIcon }),
  actividad: (): ReplySource => ({ label: 'Actividad de la vacante', detail: 'Entradas, cambios de etapa y salidas', icon: UserGroupIcon }),
  persona: (c: Candidatura): ReplySource => ({ label: `CV · ${c.candidato.empresa}`, detail: `${c.candidato.nombre} · ${c.candidato.cargo}`, icon: File01Icon }),
}

/* Piezas ---------------------------------------------------------------------------------------------------------- */

// Una respuesta del agente con todo lo del sistema de diseño: el orbe, lo que dice, de dónde sale (fuentes), copiar,
// útil o no útil, responder de nuevo con los datos de ahora, leer en voz alta y, en la última, preguntas para seguir.
function Respuesta({ fuentes = [], seguir = [], children }: { fuentes?: ReplySource[]; seguir?: string[]; children: ReactNode }) {
  const { escribir, rehacer } = useAgente()
  const mensaje = useMensajeAgente()
  return (
    <AgentMessage
      text=""
      body={<OrbeEnRespuesta.Provider value>{children}</OrbeEnRespuesta.Provider>}
      latest={mensaje?.ultimo ?? false}
      details={{ sources: fuentes, followups: seguir, alternates: [] }}
      onFollowup={escribir}
      onRegenerate={mensaje?.pedidoId && mensaje.pedido ? () => rehacer(mensaje.pedidoId as number, mensaje.pedido as string) : undefined}
    />
  )
}

// Una fila que se toca entera. El marco del agente vuelve píldora todo botón que lleva dentro (`[&_button]:rounded-full!`,
// para los botones de acción); una fila de lista no es un botón de acción y en píldora se veía como una cápsula al pasar
// el cursor. El selector con `[data-slot=item]` le gana en especificidad y la deja con la esquina de las tarjetas.
const FILA_BOTON = 'w-full text-left hover:bg-accent/50 [[data-slot=item]&]:rounded-[12px]!'

const Acciones = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mt-3 flex flex-wrap items-center gap-1.5', className)}>{children}</div>
)

function Persona({ c, children }: { c: Candidatura; children?: ReactNode }) {
  return (
    <>
      <ItemContent className="min-w-0!">
        <ItemTitle className="w-full!">
          <span className="truncate">{c.candidato.nombre}</span>
        </ItemTitle>
        <ItemDescription className="truncate">{children}</ItemDescription>
      </ItemContent>
    </>
  )
}

// Una lista de personas que se abren en la pantalla de trabajo, con lo que importa de cada una a la derecha. `derecha` es
// lo que se lee (una insignia) y va dentro de la fila; `acciones` son botones y van al lado de la fila, no dentro: un botón
// dentro de otro no se puede usar con teclado ni con lector de pantalla.
function ListaPersonas({
  personas,
  detalle,
  derecha,
  acciones,
}: {
  personas: Candidatura[]
  detalle: (c: Candidatura) => ReactNode
  derecha?: (c: Candidatura) => ReactNode
  acciones?: (c: Candidatura) => ReactNode
}) {
  const { onAbrir } = useAgente()
  return (
    <ItemGroup className="mt-3 gap-1!">
      {personas.map((c, indice) => {
        const accion = acciones?.(c)
        const fila = (
          <Item
            key={c.id}
            size="sm"
            render={<button type="button" />}
            onClick={() => onAbrir(c.id)}
            aria-label={`Abrir la ficha de ${c.candidato.nombre}`}
            className={cn(FILA_BOTON, accion ? 'min-w-0 flex-1' : styles.lineIn)}
            style={accion ? undefined : { animationDelay: `${indice * 40}ms` }}
          >
            <Persona c={c}>{detalle(c)}</Persona>
            {derecha ? <ItemActions>{derecha(c)}</ItemActions> : null}
          </Item>
        )
        return accion ? (
          <div key={c.id} role="listitem" className={cn('flex items-center gap-2', styles.lineIn)} style={{ animationDelay: `${indice * 40}ms` }}>
            {fila}
            <div className="shrink-0 pe-2">{accion}</div>
          </div>
        ) : (
          fila
        )
      })}
    </ItemGroup>
  )
}

const TONO_BADGE: Record<Tono, 'success-light' | 'warning-light' | 'destructive-outline' | 'secondary'> = {
  bien: 'success-light',
  medio: 'warning-light',
  mal: 'destructive-outline',
  neutro: 'secondary',
}

const cumpleBadge = (c: Candidatura) => {
  const cumple = cumplidosDe(c.criterios)
  const total = c.criterios.length
  // Recién llegada: la IA todavía no la compara con la vacante (no «0 de 0 requisitos»).
  if (!total)
    return (
      <Badge variant="secondary">
        Sin evaluar
      </Badge>
    )
  return (
    <Badge variant={cumple === total ? 'success-light' : cumple * 2 >= total ? 'warning-light' : 'secondary'} className="tabular-nums">
      {cumple} de {total} {total === 1 ? 'requisito' : 'requisitos'}
    </Badge>
  )
}

// Copiar un texto con su aviso.
async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto)
    notify(aviso, undefined, 'success')
  } catch {
    notify('No pudimos copiar', 'Selecciónalo y cópialo a mano.', 'error')
  }
}

// Sin permiso para cambiar (OF-40): lo dice y deja pedir acceso, como «Sin acceso a un dato» del sistema de diseño.
function SinPermiso({ que }: { que: string }) {
  const { ctx } = useAgente()
  const [pidio, setPidio] = useEstadoDelMensaje('pidio-acceso', false)
  const a = ctx.puede?.pedirA ?? 'la dueña del proceso'
  return (
    <>
      <AgentCard className="mt-3" title="Solo puedes ver esta vacante">
        <div className="flex items-start gap-3">
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={CircleLock01Icon} />
          </IconTile>
          <div className="text-sm leading-normal text-foreground/80">
            No puedo {que} con tu permiso. {ctx.puede?.porque} Preguntarme sí puedes: lo que quieras de la vacante.
          </div>
        </div>
      </AgentCard>
      {pidio ? (
        <UndoRow className="mt-3" onUndo={() => setPidio(false)}>
          Le pediste acceso a {a}
        </UndoRow>
      ) : (
        <Acciones>
          <Button
            variant="outline"
            className={PILL_XS}
            onClick={() => {
              setPidio(true)
              notify(`Le pedimos acceso a ${a}`, 'Te avisamos cuando te lo dé.', 'success')
            }}
          >
            Pedir acceso a {a}
          </Button>
        </Acciones>
      )}
    </>
  )
}

// La vacante cerrada: nadie cambia de etapa hasta reabrirla (VA-11). Lo dice antes de proponer moverla.
function VacanteCerrada() {
  const { ctx, onReabrir } = useAgente()
  return (
    <>
      <AgentNote>{ctx.vacante.titulo} está cerrada: nadie cambia de etapa hasta que se reabra.</AgentNote>
      {onReabrir ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={onReabrir}>
            Reabrir la vacante
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

// La hoja de vida trae texto escondido dirigido a la IA (OF-54): se avisa y no se tiene en cuenta.
function TextoEscondido({ personas }: { personas: Candidatura[] }) {
  const con = personas.filter((c) => c.candidato.textoEscondido)
  if (!con.length) return null
  return (
    <Alert className="mt-3">
      <HugeiconsIcon icon={Alert02Icon} />
      <AlertTitle>
        {con.length === 1 ? `El CV de ${con[0].candidato.nombre} trae texto escondido` : `${con.length} CVs traen texto escondido`}
      </AlertTitle>
      <AlertDescription>
        Le habla a la IA en letra blanca («{con[0].candidato.textoEscondido}»). No lo tuve en cuenta: lo que viene en un CV es un dato,
        nunca una orden.
      </AlertDescription>
    </Alert>
  )
}

// Lo que no se usa para decidir: la misma línea de la ficha (CA-46, OF-53).
const NO_USA = 'Solo comparo contra lo que pide la vacante. No uso la edad, el género, la nacionalidad, el estado civil ni la foto.'

/* Nombres que no encontró (OF-07) ----------------------------------------------------------------------------- */

// «No encontré a Lura»: si hay alguien que se llama parecido, se ofrece con un toque, que repite el pedido corregido.
function NoEncontre({ escritos, pedido }: { escritos: string[]; pedido?: string }) {
  const { ctx, escribir } = useAgente()
  if (!escritos.length) return null
  const parecidas = escritos.map((escrito) => ({ escrito, c: parecidaA(escrito, ctx) }))
  return (
    <>
      <AgentNote>No encontré a {nombres(escritos.map((n) => `«${n}»`))} en esta vacante.</AgentNote>
      {pedido && parecidas.some((una) => una.c) ? (
        <Acciones>
          {parecidas.map(({ escrito, c }) =>
            c ? (
              <Button
                key={escrito}
                variant="outline"
                className={PILL_XS}
                onClick={() => escribir(pedido.replace(new RegExp(escrito, 'i'), c.candidato.nombre.split(' ').slice(0, 2).join(' ')))}
              >
                ¿{c.candidato.nombre}?
              </Button>
            ) : null,
          )}
        </Acciones>
      ) : null}
    </>
  )
}

/* Comparar ------------------------------------------------------------------------------------------------------- */

function ElegirParaComparar({ inicial, aviso }: { inicial: string[]; aviso?: string }) {
  const { ctx, hablar } = useAgente()
  const [elegidas, setElegidas] = useEstadoDelMensaje<string[]>('elegidas', inicial.slice(0, MAX_COMPARAR))
  const [enfoques, setEnfoques] = useEstadoDelMensaje<Enfoque[]>('enfoques', ENFOQUES.map((uno) => uno.id))
  const [busqueda, setBusqueda] = useState('')
  const [listo, setListo] = useEstadoDelMensaje('listo', false)

  // En la lista va la gente en proceso y, si se nombró a alguien que ya salió, también esa persona.
  const fuera = inicial.map((id) => ctx.rechazadas.find((r) => r.candidatura.id === id)?.candidatura).filter((c) => c !== undefined)
  const lista = [...fuera, ...ctx.dentro]
  const texto = normalizar(busqueda.trim())
  const visibles = texto ? lista.filter((c) => normalizar(`${c.candidato.nombre} ${c.candidato.cargo}`).includes(texto)) : lista
  const lleno = elegidas.length >= MAX_COMPARAR

  const alternar = (id: string, marcar: boolean) =>
    setElegidas((antes) => (marcar ? [...antes, id].slice(0, MAX_COMPARAR) : antes.filter((otro) => otro !== id)))

  const comparar = () => {
    setListo(true)
    const personas = vivas(ctx, elegidas)
    const foco = enfoques.length === ENFOQUES.length ? '' : ` en ${nombres(ENFOQUES.filter((uno) => enfoques.includes(uno.id)).map((uno) => uno.nombre.toLowerCase()))}`
    hablar(`Compara a ${nombres(personas.map(primerNombre))}${foco}`, <ComparacionRespuesta ids={elegidas} enfoques={enfoques} />, {
      pensando: `Comparando a ${personas.length} personas…`,
      espera: 1800,
    })
  }

  if (listo) return <AgentNote>Comparo a {nombres(vivas(ctx, elegidas).map(primerNombre))}.</AgentNote>

  if (lista.length < 2)
    return (
      <AgentNote>
        {lista.length ? `Solo hay una persona en el proceso, ${lista[0].candidato.nombre}` : 'Todavía no hay nadie en el proceso'}: para comparar necesito al
        menos dos. Cuando entren más CVs, te los pongo lado a lado.
      </AgentNote>
    )

  return (
    <>
      <AgentNote>{aviso ?? `¿A quiénes comparo? Elige de 2 a ${MAX_COMPARAR}; te dejé marcadas las que más cumplen.`}</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        {lista.length > 6 ? (
          <InputGroup className="mb-2">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </InputGroupAddon>
            <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre o cargo" aria-label="Buscar a quién comparar" />
          </InputGroup>
        ) : null}
        <ItemGroup className="max-h-72 gap-1! overflow-auto">
          {visibles.map((c) => {
            const marcada = elegidas.includes(c.id)
            const rechazo = rechazoDe(ctx, c.id)
            return (
              <Item key={c.id} size="sm" render={<label />} className={cn('cursor-pointer rounded-xl!', marcada && 'bg-primary/7')}>
                {/* Centrada con el avatar: una caja de su mismo alto (24px). */}
                <ItemMedia className="h-6">
                  <Checkbox
                    checked={marcada}
                    disabled={!marcada && lleno}
                    onCheckedChange={(valor) => alternar(c.id, valor === true)}
                    aria-label={`Comparar a ${c.candidato.nombre}`}
                  />
                </ItemMedia>
                <Persona c={c}>{rechazo ? `Fuera del proceso · ${rechazo.motivo}` : `${tituloEtapa(c.etapa)} · ${diasTexto(c.dias)}`}</Persona>
                <ItemActions>{cumpleBadge(c)}</ItemActions>
              </Item>
            )
          })}
          {!visibles.length ? <p className="px-2 py-3 text-sm text-muted-foreground">Nadie se llama así en esta vacante.</p> : null}
        </ItemGroup>

        <div className="mt-3 flex flex-col gap-2 border-t pt-3">
          <span id="enfoques-comparar" className={`${KICKER} text-muted-foreground`}>
            En qué me fijo
          </span>
          <ToggleGroup
            aria-labelledby="enfoques-comparar"
            multiple
            variant="outline"
            size="sm"
            value={enfoques}
            onValueChange={(valor) => valor.length && setEnfoques(valor as Enfoque[])}
            className="flex-wrap"
          >
            {ENFOQUES.map((uno) => (
              <ToggleGroupItem key={uno.id} value={uno.id}>
                {uno.nombre}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground" aria-live="polite">
            {elegidas.length < 2 ? `Elige ${2 - elegidas.length === 1 ? 'una más' : 'dos'}` : lleno ? `Máximo ${MAX_COMPARAR}: quita a alguien para sumar otra` : `${elegidas.length} elegidas`}
          </span>
          <Button className={PILL} disabled={elegidas.length < 2} onClick={comparar}>
            {elegidas.length >= 2 ? `Comparar a ${elegidas.length}` : 'Comparar'}
          </Button>
        </div>
      </AgentCard>
    </>
  )
}

// El nombre de cada columna: el primero, y con el apellido si dos de las comparadas se llaman igual (CA-51): dos
// «Camila» no se distinguían.
const nombreEnColumna = (c: Candidatura, personas: Candidatura[]) =>
  personas.some((otra) => otra.id !== c.id && primerNombre(otra) === primerNombre(c)) ? c.candidato.nombre.split(' ').slice(0, 2).join(' ') : primerNombre(c)

function ComparacionRespuesta({ ids, enfoques, aviso }: { ids: string[]; enfoques: Enfoque[]; aviso?: ReactNode }) {
  const { ctx } = useAgente()
  const personas = vivas(ctx, ids)
  return (
    <Respuesta
      fuentes={[F.cv(personas.length), F.serena(personas.filter((c) => c.candidato.serena !== undefined).length), ...(veSalarios(ctx) ? [F.salario()] : [])]}
      seguir={personas.length >= 2 ? [`¿Cómo va ${primerNombre(personas[0])}?`, '¿Qué me propones hacer hoy?'] : []}
    >
      {aviso}
      <Comparacion ids={ids} enfoques={enfoques} />
    </Respuesta>
  )
}

function Comparacion({ ids, enfoques }: { ids: string[]; enfoques: Enfoque[] }) {
  const { ctx, hablar, onAbrir, onMover, onReconsiderar } = useAgente()
  const [criterio, setCriterio] = useEstadoDelMensaje<Criterio>('criterio', 'equilibrado')
  const [comoDecidi, setComoDecidi] = useEstadoDelMensaje('como-decidi', false)
  const [guardada, setGuardada] = useEstadoDelMensaje('guardada', false)
  const personas = vivas(ctx, ids)
  if (personas.length < 2)
    return <AgentNote>Ya no tengo a dos de esas personas en la vacante para compararlas. Elige otra vez y te las pongo lado a lado.</AgentNote>

  // Sin permiso para ver salarios, esa parte no se compara (OF-43).
  const visibles = veSalarios(ctx) ? enfoques : enfoques.filter((uno) => uno !== 'salario')
  const filas = filasDeComparacion(personas, ctx, visibles.length ? visibles : ['requisitos'])
  const { elegida, razones, noSe, pareja, orden } = recomendar(personas, ctx, veSalarios(ctx) ? criterio : 'sin-salario')
  const siguiente = rechazoDe(ctx, elegida.id) || cerrada(ctx) ? null : siguienteEtapaDe(ctx.vacante.etapas, elegida.etapa)
  const grupos = ENFOQUES.filter((uno) => filas.some((fila) => fila.enfoque === uno.id))
  const fueraDelProceso = personas.map((c) => ({ c, r: rechazoDe(ctx, c.id) })).filter((una) => una.r)

  const volverAElegir = () =>
    hablar('Cambiar a quiénes comparo', <Respuesta><ElegirParaComparar inicial={ids} aviso="Cambia a quién comparo: suma, quita o elige otras." /></Respuesta>, { espera: 600 })
  const soloEn = (enfoque: Enfoque, pedido: string) => hablar(pedido, <ComparacionRespuesta ids={ids} enfoques={[enfoque]} />, { pensando: 'Comparando…', espera: 1200 })

  // La comparación como texto, para pegarla en un correo o un chat, y como nota en la ficha de cada una (OF-25).
  const comoTexto = () =>
    [
      `Comparación para ${ctx.vacante.titulo} (${fechaCorta(new Date().toLocaleDateString('en-CA'))})`,
      ...personas.map((c) => `- ${c.candidato.nombre}: cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length}, ${c.candidato.anios} años${c.candidato.serena !== undefined ? `, Serena ${c.candidato.serena}/100` : ''}${rechazoDe(ctx, c.id) ? ', fuera del proceso' : `, en ${tituloEtapa(c.etapa)}`}.`),
      `Con quién seguiría: ${elegida.candidato.nombre}. ${razones.join(' ')}`,
    ].join('\n')
  const guardar = () => {
    if (noSeGuardo(`comparacion:${personas.map((c) => c.id).join(',')}`, 'No pudimos guardar la comparación', guardar)) return
    const texto = `Orbit comparó a ${nombres(personas.map((c) => c.candidato.nombre))}. Seguiría con ${elegida.candidato.nombre}: ${razones.join(' ')}`
    const deshacer = personas.map((c) =>
      expedienteDeSesion.comentar(
        claveDeComentario(c.candidato.id, c.id, c.etapa),
        { id: Date.now() + Math.random(), autor: 'Orbit', fecha: `Hoy, ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`, texto, agente: true },
        tituloEtapa(c.etapa),
      ),
    )
    setGuardada(true)
    notifyAction(`Guardamos la comparación en ${personas.length} fichas`, 'Queda como nota en su etapa.', { label: 'Deshacer', onClick: () => { deshacer.forEach((uno) => uno()); setGuardada(false) } }, 'success')
  }

  return (
    <>
      <AgentNote>
        Las pongo lado a lado{visibles.length < ENFOQUES.length ? ` en ${nombres(grupos.map((g) => g.nombre.toLowerCase()))}` : ''}. Toca un nombre para abrir su
        ficha.
      </AgentNote>
      <TextoEscondido personas={personas} />

      {/* Con el panel angosto la tabla se desplaza de lado: el desplazamiento va en este marco para que se pueda enfocar y
          mover con las flechas (como en el caso «Comparar opciones» del sistema de diseño). */}
      <div
        role="region"
        aria-label={`Comparación de ${nombres(personas.map((c) => c.candidato.nombre))}`}
        tabIndex={0}
        className={cn(
          'mt-3 overflow-x-auto rounded-[12px] border bg-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_[data-slot=table-container]]:overflow-visible!',
          styles.propIn,
        )}
      >
        {/* Cada criterio es un rótulo a todo el ancho y debajo va lo de cada persona: así caben tres o cuatro columnas en
            el panel sin cortar los textos (con la columna de criterios al lado, la tercera persona quedaba fuera). */}
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {personas.map((c) => (
                <TableHead key={c.id} className="pl-3.5!">
                  <Button variant="link" className="h-auto! max-w-full gap-2! p-0! text-foreground!" onClick={() => onAbrir(c.id)}>
                    <span className="truncate">{nombreEnColumna(c, personas)}</span>
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((grupo) => (
              <Fragment key={grupo.id}>
                {grupos.length > 1 ? (
                  <TableRow className="hover:bg-transparent!">
                    <TableHead colSpan={personas.length} scope="colgroup" className={`h-auto! bg-muted/50 py-1.5! pl-3.5! ${KICKER} text-muted-foreground!`}>
                      {grupo.nombre}
                    </TableHead>
                  </TableRow>
                ) : null}
                {filas
                  .filter((fila) => fila.enfoque === grupo.id)
                  .map((fila) => (
                    <Fragment key={fila.id}>
                      <TableRow className="border-b-0! hover:bg-transparent!">
                        <TableHead colSpan={personas.length} scope="colgroup" className="h-auto! pt-3! pb-1! pl-3.5! text-[13px] font-normal! whitespace-normal! text-muted-foreground!">
                          {fila.nombre}
                        </TableHead>
                      </TableRow>
                      <TableRow className="hover:bg-transparent!">
                        {fila.celdas.map((celda, indice) => (
                          <TableCell key={personas[indice].id} className="pt-0! pb-3! pl-3.5! align-top whitespace-normal!">
                            {/* El lector oye de qué criterio es cada valor, no solo «Cumple». */}
                            <span className="sr-only">{fila.nombre}: </span>
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {fila.id.startsWith('req:') || celda.tono === 'mal' || celda.tono === 'neutro' ? (
                                  <Badge variant={TONO_BADGE[celda.tono ?? 'neutro']}>
                                    {celda.texto}
                                  </Badge>
                                ) : (
                                  <span className={cn('text-sm tabular-nums', celda.mejor ? 'font-medium' : 'text-foreground/80')}>{celda.texto}</span>
                                )}
                                {celda.mejor ? (
                                  <Badge variant="success-light">
                                    Mejor
                                  </Badge>
                                ) : null}
                              </div>
                              {celda.detalle && !fila.id.startsWith('req:') ? (
                                <span className={cn('text-xs leading-snug', celda.tono === 'medio' ? 'text-warning-foreground' : 'text-muted-foreground')}>{celda.detalle}</span>
                              ) : null}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </Fragment>
                  ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {!veSalarios(ctx) && enfoques.includes('salario') ? (
        <p className="mt-2 text-[13px] text-muted-foreground">Lo que pide cada persona no se muestra: tu permiso no deja ver salarios.</p>
      ) : null}

      <AgentCard title="Con quién seguiría" className={cn('mt-3', styles.propIn)}>
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-medium">{elegida.candidato.nombre}</span>
        </div>
        <AgentList className="mt-3" items={razones} />
        {pareja ? (
          <p className="mt-3 text-sm leading-normal text-foreground/80">
            Está pareja con {pareja.candidato.nombre}: antes de descartar a alguien, vería cómo le va a cada una en la siguiente
            etapa.
          </p>
        ) : null}
        {noSe.length ? (
          <div className="mt-4 rounded-[12px] bg-muted px-3.5 py-3">
            <h4 className={`${KICKER} mb-2.5 text-muted-foreground`}>Lo que no sé</h4>
            <AgentList items={noSe} />
          </div>
        ) : null}
        {/* Cómo lo decidí (OF-31): lo que suma cada cosa, para que se pueda discutir. */}
        <div className="mt-4 border-t pt-3">
          <Button variant="link" className="h-auto! p-0! text-[13px]!" aria-expanded={comoDecidi} onClick={() => setComoDecidi(!comoDecidi)}>
            {comoDecidi ? 'Ocultar cómo lo decidí' : 'Cómo lo decidí'}
          </Button>
          {comoDecidi ? (
            <div className="mt-2.5 flex flex-col gap-2 text-[13px] leading-normal text-muted-foreground">
              <p>
                {criterio === 'experiencia'
                  ? 'Ordené primero por años de experiencia y después por requisitos.'
                  : `Pesan más los requisitos (hasta 50 puntos), después la entrevista con Serena AI (suma o resta según el mínimo)${criterio === 'sin-salario' || !veSalarios(ctx) ? '' : ', lo que pide frente al tope (solo resta si pide más)'} y cuánto avanzó (2 por etapa).`}
              </p>
              {orden.map((c) => {
                const d = desgloseDe(c, ctx, veSalarios(ctx) ? criterio : 'sin-salario')
                return (
                  <p key={c.id} className="tabular-nums">
                    <span className="text-foreground">{c.candidato.nombre}</span>: requisitos {d.requisitos}
                    {d.entrevista ? `, entrevista ${d.entrevista > 0 ? '+' : ''}${d.entrevista}` : ''}
                    {d.salario ? `, salario ${d.salario}` : ''}, avance {d.avance}
                    {d.experiencia ? `, experiencia ${d.experiencia}` : ''}
                    {d.fuera ? `, fuera del proceso ${d.fuera}` : ''} · total {d.total}
                  </p>
                )
              })}
              <p>{NO_USA}</p>
            </div>
          ) : (
            <p className="mt-1.5 text-[13px] leading-normal text-muted-foreground">{NO_USA}</p>
          )}
        </div>
      </AgentCard>

      <Acciones>
        {siguiente && puedeCambiar(ctx) ? (
          <Button
            data-undo-focus=""
            className={PILL}
            onClick={() => onMover(elegida, siguiente, porAgente(`la recomendó al comparar a ${nombres(personas.map(primerNombre))}`))}
          >
            Pasar a {primerNombre(elegida)} a {tituloEtapa(siguiente)}
          </Button>
        ) : null}
        <Button variant="outline" className={PILL} onClick={() => onAbrir(elegida.id)}>
          Abrir su ficha
        </Button>
      </Acciones>
      {fueraDelProceso.length && onReconsiderar && puedeCambiar(ctx) ? (
        <Acciones>
          {fueraDelProceso.map(({ c, r }) => (
            <Button key={c.id} variant="outline" className={PILL_XS} onClick={() => r && onReconsiderar(r)}>
              Volver a considerar a {primerNombre(c)}
            </Button>
          ))}
        </Acciones>
      ) : null}
      <Acciones className="gap-1.5">
        {veSalarios(ctx)
          ? CRITERIOS.filter((uno) => uno.id !== criterio).map((uno) => (
              <Button key={uno.id} variant="outline" className={PILL_XS} onClick={() => setCriterio(uno.id)}>
                Ordenar {uno.nombre.toLowerCase()}
              </Button>
            ))
          : null}
        {enfoques.length > 1 ? (
          <>
            <Button variant="outline" className={PILL_XS} onClick={() => soloEn('requisitos', 'Solo en los requisitos')}>
              Solo en los requisitos
            </Button>
            {veSalarios(ctx) ? (
              <Button variant="outline" className={PILL_XS} onClick={() => soloEn('salario', 'Solo en salario y cuándo empiezan')}>
                Solo en salario
              </Button>
            ) : null}
          </>
        ) : (
          <Button
            variant="outline"
            className={PILL_XS}
            onClick={() => hablar('En todo', <ComparacionRespuesta ids={ids} enfoques={ENFOQUES.map((uno) => uno.id)} />, { pensando: 'Comparando…', espera: 1200 })}
          >
            Compararlas en todo
          </Button>
        )}
        <Button variant="outline" className={PILL_XS} onClick={volverAElegir}>
          Cambiar a quiénes comparo
        </Button>
        <Button variant="outline" className={PILL_XS} disabled={guardada} onClick={guardar}>
          {guardada ? 'Guardada en sus fichas' : 'Guardar en sus fichas'}
        </Button>
        <Button variant="outline" className={PILL_XS} onClick={() => void copiar(comoTexto(), 'Copiamos la comparación')}>
          Copiar la comparación
        </Button>
      </Acciones>
    </>
  )
}

/* Actualizar datos ------------------------------------------------------------------------------------------------ */

type Borrador = { opciones?: string[]; campo?: CampoEditable; valor?: string }

// El siguiente paso para cambiar un dato, según lo que ya se sabe: a quién, qué dato y cuál es el nuevo.
function pasoActualizar(ctx: ContextoVacante, id: string | undefined, borrador: Borrador, aviso?: string): ReactNode {
  if (!puedeCambiar(ctx)) return <SinPermiso que="cambiar los datos de una persona" />
  if (!id) return <ElegirPersona {...borrador} aviso={aviso} />
  if (!borrador.campo) return <ElegirCampo id={id} valor={borrador.valor} aviso={aviso} />
  if (!borrador.valor) return <PedirValor id={id} campo={borrador.campo} aviso={aviso} />
  const leido = leerValor(borrador.campo, borrador.valor)
  if (leido.error || leido.valor === undefined) return <PedirValor id={id} campo={borrador.campo} inicial={borrador.valor} error={leido.error} />
  const c = buscarEn(ctx, id)
  if (c && String(valorDe(c, borrador.campo)) === String(leido.valor))
    return (
      <AgentNote>
        {primerNombre(c)} ya tiene {textoDeValor(borrador.campo, leido.valor)} como {nombreDeCampo(borrador.campo).toLowerCase()}: no hay nada que cambiar.
      </AgentNote>
    )
  return <ConfirmarCambio id={id} campo={borrador.campo} valor={leido.valor} />
}

function ElegirPersona({ opciones, campo, valor, aviso }: Borrador & { aviso?: string }) {
  const { ctx, hablar } = useAgente()
  const [busqueda, setBusqueda] = useState('')
  const [elegida, setElegida] = useEstadoDelMensaje<string | null>('elegida', null)
  const lista = opciones ? vivas(ctx, opciones) : todasDe(ctx)
  const texto = normalizar(busqueda.trim())
  const visibles = texto ? lista.filter((c) => normalizar(c.candidato.nombre).includes(texto)) : lista

  if (elegida) return <AgentNote>{buscarEn(ctx, elegida)?.candidato.nombre}.</AgentNote>
  if (!lista.length) return <AgentNote>Todavía no hay nadie en esta vacante a quien cambiarle un dato.</AgentNote>

  const elegir = (c: Candidatura) => {
    setElegida(c.id)
    hablar(c.candidato.nombre, <Respuesta>{pasoActualizar(ctx, c.id, { campo, valor })}</Respuesta>, { espera: 700 })
  }
  return (
    <>
      <AgentNote>{aviso ?? (campo ? `¿A quién le cambio ${elCampo(campo)}?` : '¿A quién le cambio un dato?')}</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        {lista.length > 6 ? (
          <InputGroup className="mb-2">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </InputGroupAddon>
            <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre" aria-label="Buscar a la persona" />
          </InputGroup>
        ) : null}
        <ItemGroup className="max-h-72 gap-1! overflow-auto">
          {visibles.map((c) => (
            <Item key={c.id} size="sm" render={<button type="button" />} onClick={() => elegir(c)} className={FILA_BOTON}>
              <Persona c={c}>
                {rechazoDe(ctx, c.id) ? 'Fuera del proceso' : tituloEtapa(c.etapa)} · {c.candidato.correo}
              </Persona>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
              </ItemActions>
            </Item>
          ))}
          {!visibles.length ? <p className="px-2 py-3 text-sm text-muted-foreground">Nadie se llama así en esta vacante.</p> : null}
        </ItemGroup>
      </AgentCard>
    </>
  )
}

const ICONO_CAMPO: Record<CampoEditable, IconSvgElement> = { correo: Mail01Icon, celular: SmartPhone01Icon, pretension: MoneyBag02Icon }

function ElegirCampo({ id, valor, aviso }: { id: string; valor?: string; aviso?: string }) {
  const { ctx, hablar, onAbrir } = useAgente()
  const [elegido, setElegido] = useEstadoDelMensaje<CampoEditable | null>('campo', null)
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  if (elegido) return <AgentNote>{nombreDeCampo(elegido)}.</AgentNote>
  const elegir = (campo: CampoEditable) => {
    setElegido(campo)
    hablar(nombreDeCampo(campo), <Respuesta>{pasoActualizar(ctx, id, { campo, valor })}</Respuesta>, { espera: 600 })
  }
  // Sin permiso para ver salarios, la expectativa no se ofrece (OF-43).
  const campos = CAMPOS_EDITABLES.filter((campo) => campo.id !== 'pretension' || veSalarios(ctx))
  return (
    <>
      <AgentNote>{aviso ?? `¿Qué cambio de ${primerNombre(c)}? Te dejo lo que tiene hoy.`}</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <ItemGroup className="gap-1!">
          {campos.map((campo) => (
            <Item key={campo.id} size="sm" render={<button type="button" />} onClick={() => elegir(campo.id)} className={FILA_BOTON}>
              <ItemMedia>
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={ICONO_CAMPO[campo.id]} size={16} />
                </IconTile>
              </ItemMedia>
              <ItemContent className="min-w-0!">
                <ItemTitle>{campo.nombre}</ItemTitle>
                <ItemDescription className="truncate">{textoDeValor(campo.id, valorDe(c, campo.id))}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </AgentCard>
      {/* El resto de los datos se cambia en su ficha (OF-21). */}
      <p className="mt-2.5 text-[13px] text-muted-foreground">
        El nombre, la ciudad, el LinkedIn y cuándo puede empezar se cambian en la pestaña «Datos» de su ficha.{' '}
        <Button variant="link" className="h-auto! p-0! text-[13px]!" onClick={() => onAbrir(c.id)}>
          Abrir su ficha
        </Button>
      </p>
    </>
  )
}

function PedirValor({ id, campo, inicial = '', error: errorInicial, aviso }: { id: string; campo: CampoEditable; inicial?: string; error?: string; aviso?: string }) {
  const { ctx, hablar } = useAgente()
  const [texto, setTexto] = useState(inicial)
  const [error, setError] = useState(errorInicial)
  const [listo, setListo] = useEstadoDelMensaje('listo', false)
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  if (listo) return null
  const campoInfo = CAMPOS_EDITABLES.find((uno) => uno.id === campo)
  const seguir = () => {
    const leido = leerValor(campo, texto)
    if (leido.error) {
      setError(leido.error)
      return
    }
    setListo(true)
    hablar(texto.trim(), <Respuesta>{pasoActualizar(ctx, id, { campo, valor: texto })}</Respuesta>, { pensando: 'Revisando el dato…', espera: 900 })
  }
  const campoId = `nuevo-${campo}-${id}`
  return (
    <>
      <AgentNote>
        {aviso ??
          (errorInicial
            ? `Revisa ${elCampo(campo)}: ${errorInicial}`
            : `¿Cuál es ${elNuevoCampo(campo)} de ${primerNombre(c)}? Hoy tiene ${textoDeValor(campo, valorDe(c, campo))}.`)}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(evento) => {
            evento.preventDefault()
            seguir()
          }}
        >
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={campoId}>{campoInfo?.etiqueta}</FieldLabel>
            <Input
              id={campoId}
              value={texto}
              autoFocus
              aria-invalid={error ? true : undefined}
              inputMode={campo === 'correo' ? 'email' : campo === 'celular' ? 'tel' : 'numeric'}
              placeholder={campo === 'correo' ? 'nombre@dominio.com' : campo === 'celular' ? '300 123 4567' : '3.500.000'}
              onChange={(evento) => {
                setTexto(evento.target.value)
                setError(undefined)
              }}
            />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : campo === 'pretension' ? (
              <FieldDescription>
                En pesos al mes. El rango de la vacante es {pesos(ctx.vacante.rango[0])} – {pesos(ctx.vacante.rango[1])}.
              </FieldDescription>
            ) : null}
          </Field>
          <div className="flex justify-end">
            <Button type="submit" className={PILL}>
              Revisar el cambio
            </Button>
          </div>
        </form>
      </AgentCard>
    </>
  )
}

type EstadoCambio = { tipo: 'pendiente' } | { tipo: 'guardado'; deshacer: () => void } | { tipo: 'deshecho' } | { tipo: 'cancelado' }

function ConfirmarCambio({ id, campo, valor }: { id: string; campo: CampoEditable; valor: string | number }) {
  const { ctx } = useAgente()
  const [estado, setEstado] = useEstadoDelMensaje<EstadoCambio>('estado', { tipo: 'pendiente' })
  // Guardar dice «Guardando…» con su spinner un momento, como cualquier acción.
  const accion = useAccion()
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>

  const nombreCampo = nombreDeCampo(campo).toLowerCase()
  // Lo que conviene saber antes de guardar: si el correo ya es de otra persona de la base, o si queda por encima del tope.
  const otra = campo === 'correo' ? baseDeCandidatos.deCorreo(String(valor)) : undefined
  const avisos = [
    otra && otra.id !== c.personaId ? `Ese correo ya lo tiene ${otra.nombre} en tu base. Si es la misma persona, únelas desde «Mis candidatos».` : null,
    campo === 'pretension' && Number(valor) > ctx.vacante.rango[1] ? `Queda por encima del tope de la vacante (${pesos(ctx.vacante.rango[1])}).` : null,
    campo === 'pretension' && Number(valor) <= ctx.vacante.rango[1] && c.candidato.pretension > ctx.vacante.rango[1] ? 'Con esto queda dentro del rango de la vacante.' : null,
  ].filter((uno) => uno !== null)

  if (estado.tipo === 'cancelado') return <AgentNote>Listo, no cambié nada.</AgentNote>
  if (estado.tipo === 'deshecho')
    return (
      <AgentNote>
        Deshice el cambio: {primerNombre(c)} vuelve a tener {textoDeValor(campo, valorDe(c, campo))} como {nombreCampo}.
      </AgentNote>
    )

  return (
    <>
      <AgentNote>
        {estado.tipo === 'pendiente'
          ? `Así quedaría ${elCampo(campo)} de ${c.candidato.nombre}. No se guarda hasta que lo apruebes.`
          : `Guardé ${elNuevoCampo(campo)} de ${primerNombre(c)}. Ya se ve en su ficha${campo === 'pretension' ? '' : ' y en «Mis candidatos»'}.`}
      </AgentNote>
      <ProposalCard
        className="mt-3"
        anim="in"
        currentLabel="Hoy"
        proposalLabel={estado.tipo === 'guardado' ? 'Quedó' : 'Queda'}
        current={estado.tipo === 'guardado' ? undefined : textoDeValor(campo, valorDe(c, campo))}
        proposal={
          <span className="flex flex-col gap-1.5">
            <span className="font-medium text-foreground">{textoDeValor(campo, valor)}</span>
            {avisos.map((aviso) => (
              <span key={aviso} className="text-[13px] text-muted-foreground">
                {aviso}
              </span>
            ))}
          </span>
        }
      />
      {estado.tipo === 'pendiente' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            data-undo-focus=""
            className={PILL}
            disabled={accion.enCurso}
            onClick={() => accion.correr(() => setEstado({ tipo: 'guardado', deshacer: registroDeCorrecciones.guardar(c, campo, valor) }))}
          >
            {accion.enCurso ? <Spinner /> : null}
            {accion.enCurso ? 'Guardando…' : 'Guardar el cambio'}
          </Button>
          <Button variant="outline" className={PILL} disabled={accion.enCurso} onClick={() => setEstado({ tipo: 'cancelado' })}>
            Cancelar
          </Button>
        </div>
      ) : estado.tipo === 'guardado' ? (
        <UndoRow
          className="mt-3"
          onUndo={() => {
            estado.deshacer()
            setEstado({ tipo: 'deshecho' })
          }}
        >
          {nombreDeCampo(campo)} de {primerNombre(c)} {actualizadoCampo(campo)} por {QUIEN_MUEVE.split(' ')[0]}, desde Orbit
        </UndoRow>
      ) : null}
    </>
  )
}

/* Órdenes sobre una persona (OF-01, OF-02, OF-24) ------------------------------------------------------------------ */

// Rechazar a alguien: la misma ventana del tablero, con motivo y correo, que aprueba el equipo.
function Rechazar({ ids }: { ids: string[] }) {
  const { ctx, onRechazar, onAbrir } = useAgente()
  const personas = vivas(ctx, ids)
  if (!puedeCambiar(ctx)) return <SinPermiso que="rechazar a nadie" />
  const fuera = personas.filter((c) => rechazoDe(ctx, c.id))
  const siguen = personas.filter((c) => !rechazoDe(ctx, c.id))
  if (!siguen.length)
    return <AgentNote>{nombres(fuera.map((c) => c.candidato.nombre))} ya {fuera.length === 1 ? 'está' : 'están'} fuera del proceso.</AgentNote>
  return (
    <>
      <AgentNote>
        {siguen.length === 1 ? `¿Rechazo a ${siguen[0].candidato.nombre}?` : `¿Rechazo a ${personasTexto(siguen.length)}?`} En la ventana eliges el motivo y si le
        escribimos; nada pasa hasta que lo confirmes.
      </AgentNote>
      <ListaPersonas
        personas={siguen}
        detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.criterios.length ? `cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length}` : 'sin evaluar'}`}
        derecha={(c) => (c.candidato.accion ? <Badge variant="warning-light">Espera</Badge> : null)}
      />
      <Acciones>
        <Button className={PILL} onClick={() => onRechazar(siguen, porAgente('lo pediste a Orbit'))}>
          {siguen.length === 1 ? `Rechazar a ${primerNombre(siguen[0])}…` : `Rechazar a ${personasTexto(siguen.length)}…`}
        </Button>
        {siguen.length === 1 ? (
          <Button variant="outline" className={PILL} onClick={() => onAbrir(siguen[0].id)}>
            Abrir su ficha
          </Button>
        ) : null}
      </Acciones>
    </>
  )
}

// Pasar a alguien de etapa: una propuesta con «Aprobar», como «¿Qué me propones?». Si algo está pendiente, lo dice.
function Mover({ ids, destino }: { ids: string[]; destino?: string }) {
  const { ctx, onMover, onAbrir } = useAgente()
  const [ahoraNo, setAhoraNo] = useEstadoDelMensaje<string[]>('ahora-no', [])
  const [desde] = useEstadoDelMensaje<Record<string, string>>('desde', () => Object.fromEntries(vivas(ctx, ids).map((c) => [c.id, c.etapa])))
  if (!puedeCambiar(ctx)) return <SinPermiso que="cambiar a nadie de etapa" />
  if (cerrada(ctx)) return <VacanteCerrada />
  const personas = vivas(ctx, ids)
  return (
    <>
      <AgentNote>{personas.length === 1 ? 'Te propongo este paso' : 'Te propongo estos pasos'}; nada se mueve hasta que lo apruebes.</AgentNote>
      <AgentCard title="Cambio de etapa" className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-3">
          {personas.map((c) => {
            const a = destino ?? siguienteEtapaDe(ctx.vacante.etapas, desde[c.id] ?? c.etapa)
            if (rechazoDe(ctx, c.id)) return <p key={c.id} className="text-[13px] text-muted-foreground">{c.candidato.nombre} está fuera del proceso.</p>
            if (!a) return <p key={c.id} className="text-[13px] text-muted-foreground">{c.candidato.nombre} ya está en la última etapa.</p>
            if (c.etapa === a && desde[c.id] !== a)
              return (
                <UndoRow key={c.id} onUndo={() => onMover(c, desde[c.id] ?? c.etapa)}>
                  {c.candidato.nombre} pasó a {tituloEtapa(a)}
                </UndoRow>
              )
            if (c.etapa === a) return <p key={c.id} className="text-[13px] text-muted-foreground">{c.candidato.nombre} ya está en {tituloEtapa(a)}.</p>
            if (ahoraNo.includes(c.id))
              return (
                <UndoRow key={c.id} onUndo={() => setAhoraNo(ahoraNo.filter((otro) => otro !== c.id))}>
                  Dejaste para después pasar a {primerNombre(c)}
                </UndoRow>
              )
            return (
              <div key={c.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Button variant="link" className="h-auto! w-fit justify-start! p-0!" onClick={() => onAbrir(c.id)}>
                      {c.candidato.nombre}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      De {tituloEtapa(c.etapa)} a {tituloEtapa(a)}. {c.criterios.length ? `Cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length}.` : 'La IA todavía no la evalúa.'}
                    </span>
                    {/* Lo pendiente primero (CA-12): no se esconde, se dice al lado del botón. */}
                    {c.candidato.accion ? <span className="text-[13px] text-warning-foreground">Antes tenías pendiente: {c.candidato.accion.toLowerCase()}.</span> : null}
                  </div>
                </div>
                <div className="flex gap-2 pl-8.5">
                  <Button size="sm" onClick={() => onMover(c, a, porAgente('lo pediste a Orbit'))}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAhoraNo([...ahoraNo, c.id])}>
                    Ahora no
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </AgentCard>
    </>
  )
}

function Reconsiderar({ ids }: { ids: string[] }) {
  const { ctx, onReconsiderar } = useAgente()
  if (!puedeCambiar(ctx)) return <SinPermiso que="volver a considerar a nadie" />
  const fuera = vivas(ctx, ids)
    .map((c) => ctx.rechazadas.find((r) => r.candidatura.id === c.id))
    .filter((r) => r !== undefined)
  if (!fuera.length) return <AgentNote>{nombres(vivas(ctx, ids).map((c) => c.candidato.nombre))} sigue en el proceso: no hay nada que volver a considerar.</AgentNote>
  return (
    <>
      <AgentNote>
        {fuera[0].candidatura.candidato.nombre} salió por «{fuera[0].motivo}». En la ventana eliges a qué etapa vuelve y si le escribimos.
      </AgentNote>
      <Acciones>
        {onReconsiderar ? (
          <Button className={PILL} onClick={() => onReconsiderar(fuera[0])}>
            Volver a considerar a {primerNombre(fuera[0].candidatura)}…
          </Button>
        ) : null}
      </Acciones>
    </>
  )
}

/* Para un grupo: el plan (OF-03, OF-20) ------------------------------------------------------------------------- */

const ASUNTO_RECORDAR = 'Te recordamos tu entrevista con Serena AI'
const TEXTO_RECORDAR =
  'Hola, {nombre}:\n\nTe recordamos que tienes pendiente la entrevista con Serena AI para «{vacante}». Dura unos 15 minutos y la haces cuando quieras desde el enlace de la invitación.'

// Lo mismo para varias personas: a quiénes afecta (se puede quitar a alguien), qué pasa con el correo, si se deshace,
// y una sola confirmación. Es el «Plan de aprobación» del sistema de diseño.
function Plan({ accion, grupo, destino }: { accion: 'rechazar' | 'mover' | 'recordar'; grupo: Grupo; destino?: string }) {
  const { ctx, onRechazar, onMoverVarias } = useAgente()
  const [ids] = useEstadoDelMensaje<string[]>('ids', () => personasDelGrupo(grupo, ctx).map((c) => c.id))
  const [quitadas, setQuitadas] = useEstadoDelMensaje<string[]>('quitadas', [])
  const [hecho, setHecho] = useEstadoDelMensaje('hecho', false)
  const [escribiendo, setEscribiendo] = useState(false)
  const quien = nombreDelGrupo(grupo, ctx)
  if (!puedeCambiar(ctx)) return <SinPermiso que={accion === 'rechazar' ? 'rechazar a nadie' : accion === 'mover' ? 'cambiar a nadie de etapa' : 'escribirle a nadie'} />
  if (accion === 'mover' && cerrada(ctx)) return <VacanteCerrada />
  const personas = vivas(ctx, ids).filter((c) => !rechazoDe(ctx, c.id))
  if (!personas.length) return <AgentNote>No hay nadie entre {quien} ahora mismo.</AgentNote>
  const elegidas = personas.filter((c) => !quitadas.includes(c.id))
  const destinoDe = (c: Candidatura) => destino ?? siguienteEtapaDe(ctx.vacante.etapas, c.etapa)
  const movibles = elegidas.filter((c) => destinoDe(c) && destinoDe(c) !== c.etapa)
  const verbo = accion === 'rechazar' ? 'Rechazar' : accion === 'mover' ? 'Pasar' : 'Recordarles la entrevista'
  const cuantas = accion === 'mover' ? movibles.length : elegidas.length

  const aprobar = () => {
    if (accion === 'rechazar') onRechazar(elegidas, porAgente(`lo propuso Orbit para ${quien}`))
    if (accion === 'mover') onMoverVarias(movibles.map((c) => ({ candidatura: c, destino: destinoDe(c) as string })), porAgente(`lo propuso Orbit para ${quien}`))
    if (accion === 'recordar') setEscribiendo(true)
    if (accion !== 'recordar') setHecho(true)
  }

  // El recordatorio se ve antes de enviarlo y queda en la historia de cada persona, con «Deshacer» (como en la ficha).
  const enviarRecordatorio = () => {
    if (noSeGuardo(`recordar:${elegidas.map((c) => c.id).join(',')}`, 'No pudimos enviar el recordatorio', enviarRecordatorio, 'No salió ningún correo.')) {
      setEscribiendo(false)
      return
    }
    const ahora = Date.now()
    const nuevos: Movimiento[] = elegidas.map((c, indice) => ({
      id: `agente-recordar-${c.id}-${ahora}-${indice}`,
      tipo: 'correo',
      candidaturaId: c.id,
      desde: c.etapa,
      hacia: c.etapa,
      cuando: ahora,
      dias: c.dias,
      quien: QUIEN_MUEVE,
      saltadas: [],
      aviso: ASUNTO_RECORDAR,
      porAgente: porAgente(`lo propuso Orbit para ${quien}`),
    }))
    const reciben = elegidas.filter((c) => !baseDeCandidatos.deId(c.personaId)?.noContactar)
    registroDeMovimientos.agregar(nuevos.filter((m) => reciben.some((c) => c.id === m.candidaturaId)))
    const deshacerCorreo = anotarCorreo(reciben.map((c) => c.personaId), ASUNTO_RECORDAR)
    setEscribiendo(false)
    setHecho(true)
    notifyAction(
      `Le recordamos la entrevista a ${personasTexto(reciben.length)}`,
      elegidas.length - reciben.length ? `${personasTexto(elegidas.length - reciben.length)} no recibe correos.` : 'Sale en unos segundos.',
      {
        label: 'Deshacer',
        onClick: () => {
          registroDeMovimientos.quitar(nuevos.map((m) => m.id))
          deshacerCorreo()
          setHecho(false)
        },
      },
      'success',
    )
  }

  return (
    <>
      <AgentNote>
        Este es el plan para {quien}. Puedes quitar a alguien antes de aprobar; nada pasa hasta que lo confirmes.
      </AgentNote>
      <AgentCard title={`Plan · ${verbo}${accion === 'recordar' ? '' : ` a ${personasTexto(cuantas)}`}`} className={cn('mt-3', styles.propIn)}>
        <ItemGroup className="gap-1!">
          {personas.map((c) => (
            <Item key={c.id} size="sm" render={<label />} className="cursor-pointer rounded-xl!">
              <ItemMedia className="h-6">
                <Checkbox
                  checked={!quitadas.includes(c.id)}
                  disabled={hecho}
                  onCheckedChange={(valor) => setQuitadas(valor === true ? quitadas.filter((otro) => otro !== c.id) : [...quitadas, c.id])}
                  aria-label={`Incluir a ${c.candidato.nombre}`}
                />
              </ItemMedia>
              <Persona c={c}>
                {accion === 'mover' ? (destinoDe(c) ? `${tituloEtapa(c.etapa)} → ${tituloEtapa(destinoDe(c) as string)}` : 'Ya está en la última etapa') : `${tituloEtapa(c.etapa)} · ${diasTexto(c.dias)}`}
              </Persona>
              {baseDeCandidatos.deId(c.personaId)?.noContactar ? (
                <ItemActions>
                  <Badge variant="secondary">
                    No recibe correos
                  </Badge>
                </ItemActions>
              ) : null}
            </Item>
          ))}
        </ItemGroup>
        <div className="mt-3 flex flex-col gap-1.5 border-t pt-3 text-[13px] leading-normal text-muted-foreground">
          <span>
            <span className="text-foreground">A quién le llega correo: </span>
            {accion === 'recordar' ? 'a cada una, el recordatorio que ves antes de enviarlo.' : accion === 'rechazar' ? 'lo eliges en la ventana de rechazo, con el motivo.' : 'si la etapa invita a una entrevista con IA, le llega la invitación; lo ves en la ventana.'}
          </span>
          <span>
            <span className="text-foreground">Se puede deshacer: </span>sí, con «Deshacer» en el aviso que sale al terminar.
          </span>
          <span>Queda en la historia de cada persona que lo propuso Orbit y lo aprobaste tú.</span>
        </div>
      </AgentCard>
      {hecho ? (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <HugeiconsIcon icon={Tick02Icon} size={14} aria-hidden="true" />
          Aprobado. {accion === 'recordar' ? 'El recordatorio salió.' : 'Lo ves pasar en el tablero.'}
        </p>
      ) : (
        <Acciones>
          <Button className={PILL} disabled={!cuantas} onClick={aprobar}>
            {accion === 'recordar' ? `Ver el correo y enviarlo a ${personasTexto(cuantas)}` : `${verbo} a ${personasTexto(cuantas)}${accion === 'rechazar' ? '…' : ''}`}
          </Button>
        </Acciones>
      )}
      {escribiendo ? (
        <VentanaDeAccion
          open
          onOpenChange={setEscribiendo}
          title={`Recordarles la entrevista a ${personasTexto(elegidas.length)}`}
          sub="Le llega a cada una con su nombre."
          note="Queda en la historia de cada persona, con tu nombre."
          confirmLabel="Enviar el recordatorio"
          pendingLabel="Enviando…"
          onConfirm={enviarRecordatorio}
        >
          <VistaPreviaCorreo
            texto={TEXTO_RECORDAR}
            asunto={ASUNTO_RECORDAR}
            datos={{ nombre: primerNombre(elegidas[0]), vacante: ctx.vacante.titulo, etapa: tituloEtapa(elegidas[0].etapa) }}
            varias={elegidas.length - 1}
          />
        </VentanaDeAccion>
      ) : null}
    </>
  )
}

/* Preguntas sobre la vacante -------------------------------------------------------------------------------------- */

function Propuestas() {
  const { ctx, onMover, onMoverVarias, onRechazar, onAbrir } = useAgente()
  // Se calculan al abrir la respuesta y se quedan quietas: si se recalcularan con cada movimiento, la lista saltaría
  // mientras se aprueba. Lo que ya pasó se lee de los datos vivos.
  const [propuestas] = useEstadoDelMensaje<Propuesta[]>('propuestas', () => propuestasDe(ctx.vacante, ctx.dentro))
  const [ahoraNo, setAhoraNo] = useEstadoDelMensaje<string[]>('ahora-no', [])
  if (!propuestas.length) return <AgentNote>No veo pasos pendientes: nadie cumple lo suficiente y lleva días quieto, ni hay a quien rechazar por no cumplir nada.</AgentNote>
  if (!puedeCambiar(ctx)) return <SinPermiso que="aprobar cambios de etapa ni rechazos" />
  if (cerrada(ctx)) return <VacanteCerrada />
  const pendientes = propuestas.filter((p) => {
    const viva = buscarEn(ctx, p.candidatura.id)
    return viva && !ahoraNo.includes(viva.id) && !rechazoDe(ctx, viva.id) && (p.destino === 'rechazo' || viva.etapa !== p.destino)
  })
  const avances = pendientes.filter((p) => p.destino !== 'rechazo')
  return (
    <>
      <AgentNote>Te propongo estos pasos; nada se mueve hasta que lo apruebes.</AgentNote>
      <AgentCard title="Siguiente paso" className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-3">
          {propuestas.map((p) => {
            const viva = buscarEn(ctx, p.candidatura.id)
            if (!viva) return null
            if (ahoraNo.includes(viva.id))
              return (
                <UndoRow key={p.candidatura.id} onUndo={() => setAhoraNo(ahoraNo.filter((id) => id !== viva.id))}>
                  Dejaste para después a {viva.candidato.nombre}
                </UndoRow>
              )
            if (rechazoDe(ctx, viva.id))
              return (
                <p key={p.candidatura.id} className="text-[13px] text-muted-foreground">
                  Rechazaste a {viva.candidato.nombre}.
                </p>
              )
            if (p.destino !== 'rechazo' && viva.etapa === p.destino)
              return (
                <UndoRow key={p.candidatura.id} onUndo={() => onMover(viva, p.candidatura.etapa)}>
                  {viva.candidato.nombre} pasó a {tituloEtapa(p.destino)}
                </UndoRow>
              )
            return (
              <div key={p.candidatura.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Button variant="link" className="h-auto! w-fit justify-start! p-0!" onClick={() => onAbrir(viva.id)}>
                      {viva.candidato.nombre}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {p.destino === 'rechazo' ? 'Rechazar' : `Pasar a ${tituloEtapa(p.destino)}`}. {p.porque}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pl-8.5">
                  <Button
                    size="sm"
                    variant={p.destino === 'rechazo' ? 'outline' : 'default'}
                    onClick={() => (p.destino === 'rechazo' ? onRechazar([viva], porAgente(p.porque)) : onMover(viva, p.destino, porAgente(p.porque)))}
                  >
                    {p.destino === 'rechazo' ? 'Rechazar…' : 'Aprobar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAhoraNo([...ahoraNo, viva.id])}>
                    Ahora no
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </AgentCard>
      {avances.length > 1 ? (
        <Acciones>
          <Button
            className={PILL}
            onClick={() =>
              onMoverVarias(
                avances.map((p) => ({ candidatura: buscarEn(ctx, p.candidatura.id) as Candidatura, destino: p.destino })),
                porAgente('lo propuso Orbit en «¿Qué me propones hacer hoy?»'),
              )
            }
          >
            Aprobar los {avances.length} avances
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Embudo() {
  const { ctx, onVerEtapa } = useAgente()
  const { porEtapa, acumula, empatadas } = embudoDe(ctx)
  const mayor = Math.max(1, ...porEtapa.map((una) => una.cuantos))
  if (!ctx.dentro.length) return <AgentNote>Todavía no hay gente en el proceso.</AgentNote>
  return (
    <>
      <AgentNote>
        {acumula
          ? `Se acumula en ${acumula.etapa.titulo}: ${acumula.cuantos} de ${ctx.dentro.length} personas están ahí.`
          : empatadas.length
            ? `${nombres(empatadas.map((una) => una.etapa.titulo))} tienen ${empatadas[0].cuantos} personas cada una; ninguna etapa se destaca.`
            : 'La gente está repartida entre las etapas.'}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-3">
          {porEtapa.map(({ etapa, cuantos }) => (
            <div key={etapa.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5">
                  {etapa.titulo}
                  {acumula?.etapa.id === etapa.id ? (
                    <Badge variant="warning-light">
                      Aquí se acumula
                    </Badge>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{cuantos}</span>
                  {onVerEtapa && cuantos ? (
                    <Button variant="link" className="h-auto! p-0! text-[13px]!" onClick={() => onVerEtapa(etapa.id)}>
                      Ver
                    </Button>
                  ) : null}
                </span>
              </div>
              <Progress value={(cuantos / mayor) * 100} aria-label={`${etapa.titulo}: ${cuantos} ${plural(cuantos, 'persona', 'personas')}`} />
            </div>
          ))}
        </div>
      </AgentCard>
    </>
  )
}

// Fortalezas y riesgos con de dónde salen, y lo que conviene preguntarle en la entrevista: lo que falta validar.
function ResumenParaComite({ c }: { c: Candidatura }) {
  const { onAbrir } = useAgente()
  const [guardada, setGuardada] = useEstadoDelMensaje('guardada', false)
  const preguntas = c.criterios
    .filter((criterio) => criterio.veredicto === 'por-validar' || criterio.veredicto === 'parcial')
    .slice(0, 3)
    .map((criterio) => `¿Me cuentas un caso reciente en el que hayas usado «${criterio.requisito.toLowerCase()}»?`)
  const lineas = [
    ...c.candidato.fortalezas.map((una) => `Destaca: ${una.texto}`),
    ...c.candidato.riesgos.map((uno) => `Riesgo: ${uno.texto}`),
    ...preguntas.map((pregunta) => `Preguntarle: ${pregunta}`),
  ]
  if (!lineas.length) return null
  const guardar = () => {
    if (noSeGuardo(`resumen:${c.id}`, 'No pudimos guardar el resumen', guardar)) return
    const deshacer = expedienteDeSesion.comentar(
      claveDeComentario(c.candidato.id, c.id, c.etapa),
      { id: Date.now(), autor: 'Orbit', fecha: `Hoy, ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`, texto: lineas.join(' · '), agente: true },
      tituloEtapa(c.etapa),
    )
    setGuardada(true)
    notifyAction(`Guardamos el resumen en la ficha de ${primerNombre(c)}`, `En ${tituloEtapa(c.etapa)}.`, { label: 'Deshacer', onClick: () => { deshacer(); setGuardada(false) } }, 'success')
  }
  return (
    <AgentCard className="mt-3">
      <AgentList
        items={[
          ...c.candidato.fortalezas.map((una) => `Destaca: ${una.texto}${una.fuentes[0] ? ` (${una.fuentes[0].etiqueta})` : ''}`),
          ...c.candidato.riesgos.map((uno) => `Riesgo: ${uno.texto}${uno.fuentes[0] ? ` (${uno.fuentes[0].etiqueta})` : ''}`),
          ...preguntas.map((pregunta) => `Para la entrevista: ${pregunta}`),
        ]}
      />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button variant="outline" className={PILL_XS} disabled={guardada} onClick={guardar}>
          {guardada ? 'Guardado en su ficha' : 'Guardar como nota'}
        </Button>
        <Button variant="ghost" className={PILL_XS} onClick={() => onAbrir(c.id)}>
          Ver las fuentes en su ficha
        </Button>
      </div>
    </AgentCard>
  )
}

function ResumenPersona({ id }: { id: string }) {
  const { ctx, hablar, onAbrir, onReconsiderar } = useAgente()
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  const rechazo = rechazoDe(ctx, c.id)
  return (
    <>
      <AgentNote>
        {rechazo
          ? `${c.candidato.nombre} ya no está en el proceso: salió en ${tituloEtapa(c.etapa)} por «${rechazo.motivo}».`
          : `${c.candidato.nombre} va en ${tituloEtapa(c.etapa)} desde hace ${diasTexto(c.dias)}${c.candidato.accion ? ` y espera una respuesta tuya: ${c.candidato.accion.toLowerCase()}` : ''}.`}
      </AgentNote>
      <TextoEscondido personas={[c]} />
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{c.candidato.nombre}</span>
            <span className="truncate text-[13px] text-muted-foreground">
              {c.candidato.cargo} · {c.candidato.empresa}
            </span>
          </div>
          <span className="ml-auto">{cumpleBadge(c)}</span>
        </div>
        <AgentList
          className="mt-3"
          items={[
            `${c.candidato.anios} ${c.candidato.anios === 1 ? 'año' : 'años'} de experiencia.`,
            veSalarios(ctx) ? loQuePide(c, ctx.vacante) : 'Lo que pide no se muestra: tu permiso no deja ver salarios.',
            c.candidato.serena === undefined ? 'Todavía no hace la entrevista con Serena AI.' : `Serena AI le dio ${c.candidato.serena}/100.`,
          ]}
        />
      </AgentCard>
      {/* Lo que hacía el agente del expediente viejo (CA-51): fortalezas y riesgos con su fuente, qué preguntarle y
          guardarlo como nota. */}
      <ResumenParaComite c={c} />
      <Acciones>
        <Button variant="outline" className={PILL_XS} onClick={() => onAbrir(c.id)}>
          Abrir su ficha
        </Button>
        {rechazo && onReconsiderar && puedeCambiar(ctx) ? (
          <Button variant="outline" className={PILL_XS} onClick={() => onReconsiderar(rechazo)}>
            Volver a considerarla
          </Button>
        ) : null}
        <Button
          variant="outline"
          className={PILL_XS}
          onClick={() =>
            hablar(
              `Comparar a ${primerNombre(c)}`,
              <Respuesta>
                <ElegirParaComparar inicial={[c.id, ...sugeridasParaComparar(ctx, 3).map((o) => o.id).filter((o) => o !== c.id)].slice(0, 2)} aviso={`¿Con quién comparo a ${primerNombre(c)}?`} />
              </Respuesta>,
              { espera: 600 },
            )
          }
        >
          Comparar con alguien
        </Button>
        {puedeCambiar(ctx) ? (
          <Button variant="outline" className={PILL_XS} onClick={() => hablar(`Actualizar los datos de ${primerNombre(c)}`, <Respuesta>{pasoActualizar(ctx, c.id, {})}</Respuesta>, { espera: 600 })}>
            Actualizar sus datos
          </Button>
        ) : null}
      </Acciones>
    </>
  )
}

// Un dato de contacto (OF-04): el que se pidió, con copiar. Si pidió no recibir correos, se dice.
function Dato({ id, campo }: { id: string; campo: CampoEditable }) {
  const { ctx, onAbrir } = useAgente()
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  if (campo === 'pretension' && !veSalarios(ctx)) return <AgentNote>Lo que pide {primerNombre(c)} no te lo puedo mostrar: tu permiso no deja ver salarios.</AgentNote>
  const valor = textoDeValor(campo, valorDe(c, campo))
  const noContactar = baseDeCandidatos.deId(c.personaId)?.noContactar
  return (
    <>
      <AgentNote>
        {campo === 'pretension' ? `${primerNombre(c)} pide` : `${nombreDeCampo(campo)} de ${c.candidato.nombre}:`}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex items-center gap-3">
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={ICONO_CAMPO[campo]} />
          </IconTile>
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium tabular-nums">{valor}</span>
          <Button variant="outline" size="sm" className={PILL_XS} onClick={() => void copiar(valor, `Copiamos ${elCampo(campo)} de ${primerNombre(c)}`)}>
            Copiar
          </Button>
        </div>
        {noContactar && campo !== 'pretension' ? (
          <p className="mt-2.5 text-[13px] text-warning-foreground">Pidió no recibir correos de la empresa: no le escribas por aquí.</p>
        ) : null}
      </AgentCard>
      <Acciones>
        <Button variant="outline" className={PILL_XS} onClick={() => onAbrir(c.id)}>
          Abrir su ficha
        </Button>
      </Acciones>
    </>
  )
}

// Escribirle a alguien (OF-15): el borrador listo para revisar y enviar desde su ficha. El agente no envía correos.
function Redactar({ id }: { id: string }) {
  const { ctx, onAbrir } = useAgente()
  const c = buscarEn(ctx, id)
  const [texto, setTexto] = useEstadoDelMensaje('texto', () => (c ? borradorDeCorreo(c, ctx.vacante).cuerpo : ''))
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  const { asunto } = borradorDeCorreo(c, ctx.vacante)
  const noContactar = baseDeCandidatos.deId(c.personaId)?.noContactar
  return (
    <>
      <AgentNote>
        Te dejo un borrador para {c.candidato.nombre}. Yo no envío correos: revísalo, cópialo y envíalo desde su ficha, donde queda en su
        historia.
      </AgentNote>
      {noContactar ? (
        <Alert className="mt-3">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle>{primerNombre(c)} pidió no recibir correos</AlertTitle>
          <AlertDescription>Si le escribes, que sea por un motivo del proceso y no una invitación.</AlertDescription>
        </Alert>
      ) : null}
      <AgentCard className={cn('mt-3', styles.propIn)} title={`Asunto: ${asunto}`}>
        <Textarea aria-label="Borrador del correo" value={texto} onChange={(evento) => setTexto(evento.target.value)} className="min-h-40 text-sm" />
      </AgentCard>
      <Acciones>
        <Button className={PILL} onClick={() => void copiar(`${asunto}\n\n${texto}`, 'Copiamos el borrador')}>
          Copiar el borrador
        </Button>
        <Button variant="outline" className={PILL} onClick={() => onAbrir(c.id)}>
          Abrir su ficha para enviarlo
        </Button>
      </Acciones>
    </>
  )
}

// Anotar algo en la ficha (OF-16): se ve antes de guardar, va en la etapa en que está y se deshace.
function Nota({ id, inicial }: { id: string; inicial?: string }) {
  const { ctx } = useAgente()
  const [texto, setTexto] = useEstadoDelMensaje('texto', inicial ?? '')
  const [guardada, setGuardada] = useEstadoDelMensaje<'no' | 'si' | 'deshecha'>('guardada', 'no')
  const [deshacer, setDeshacer] = useState<(() => void) | null>(null)
  const c = buscarEn(ctx, id)
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  if (!puedeCambiar(ctx)) return <SinPermiso que="dejar notas" />
  const guardar = () => {
    const quitar = expedienteDeSesion.comentar(
      claveDeComentario(c.candidato.id, c.id, c.etapa),
      { id: Date.now(), autor: QUIEN_MUEVE, fecha: `Hoy, ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`, texto: texto.trim() },
      tituloEtapa(c.etapa),
    )
    setDeshacer(() => quitar)
    setGuardada('si')
  }
  if (guardada === 'si')
    return (
      <>
        <AgentNote>Guardé la nota en la ficha de {primerNombre(c)}, en {tituloEtapa(c.etapa)}, con tu nombre.</AgentNote>
        <UndoRow
          className="mt-3"
          onUndo={() => {
            deshacer?.()
            setGuardada('deshecha')
          }}
        >
          Nota guardada en {tituloEtapa(c.etapa)}
        </UndoRow>
      </>
    )
  return (
    <>
      <AgentNote>{guardada === 'deshecha' ? 'Quité la nota. Puedes corregirla y guardarla otra vez.' : `Así queda la nota en la ficha de ${c.candidato.nombre}, en ${tituloEtapa(c.etapa)}:`}</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <Field>
          <FieldLabel htmlFor={`nota-${c.id}`}>La nota</FieldLabel>
          <Textarea id={`nota-${c.id}`} value={texto} placeholder="Lo que quieres que el equipo sepa" onChange={(evento) => setTexto(evento.target.value)} className="min-h-24 text-sm" />
          <FieldDescription>La ve todo el equipo de la vacante, firmada por ti.</FieldDescription>
        </Field>
      </AgentCard>
      <Acciones>
        <Button className={PILL} disabled={!texto.trim()} onClick={guardar}>
          Guardar la nota
        </Button>
      </Acciones>
    </>
  )
}

function Lotes() {
  const { lotes, onVerLote, onImportar } = useAgente()
  if (!lotes.length)
    return (
      <>
        <AgentNote>No has importado CVs a esta vacante.</AgentNote>
        {onImportar ? (
          <Acciones>
            <Button variant="outline" className={PILL_XS} onClick={onImportar}>
              Importar CVs
            </Button>
          </Acciones>
        ) : null}
      </>
    )
  const leyendo = lotes.filter((lote) => lote.estado === 'leyendo' || lote.estado === 'en-cola')
  const fallidas = lotes.reduce((suma, lote) => suma + cuentasDe(lote).fallidos, 0)
  return (
    <>
      <AgentNote>
        {leyendo.length ? `Hay ${leyendo.length === 1 ? 'un lote' : `${leyendo.length} lotes`} leyéndose. ` : 'Todos los lotes terminaron. '}
        {fallidas ? `${fallidas === 1 ? 'Un CV no se pudo leer' : `${fallidas} CVs no se pudieron leer`}.` : 'Ningún CV falló.'}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-3">
          {lotes.map((lote) => {
            const cuentas = cuentasDe(lote)
            return (
              <div key={lote.id} className="flex flex-col gap-1.5 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{lote.nombre}</span>
                  <Badge variant={lote.estado === 'terminado' ? 'secondary' : 'warning-light'}>
                    {lote.estado === 'terminado' ? 'Terminado' : lote.estado === 'detenido' ? 'Detenido' : lote.estado === 'en-cola' ? 'En cola' : 'Leyendo'}
                  </Badge>
                </div>
                {lote.estado === 'leyendo' ? <Progress value={(cuentas.leidos / Math.max(1, cuentas.total)) * 100} aria-label={`${lote.nombre}: ${cuentas.leidos} de ${cuentas.total} leídas`} /> : null}
                <span className="text-[13px] leading-normal text-muted-foreground">{resumenDeLote(lote)}</span>
                {onVerLote ? (
                  <Button variant="link" className="h-auto! w-fit p-0! text-[13px]!" onClick={() => onVerLote(lote.id)}>
                    Ver el lote
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      </AgentCard>
    </>
  )
}

// Quién de la base sirve (OF-22), con «Agregar a la vacante» (el mismo camino de «Agregar candidatos»).
function DeLaBase() {
  const { ctx, onAgregar } = useAgente()
  const base = usePersonasDeLaBase()
  const [agregadas, setAgregadas] = useEstadoDelMensaje<string[]>('agregadas', [])
  const afines = afinesEnLaBase(ctx, base)
  if (!afines.length) return <AgentNote>No encontré en tu base a nadie que comparta lo que pide {ctx.vacante.titulo} y no esté ya en ella.</AgentNote>
  const agregar = (ids: string[]) => {
    const personas = base.filter((persona) => ids.includes(persona.id))
    onAgregar?.(personas.map((persona) => candidaturaDesdeLaBase(persona, ctx.vacante, primeraEtapaDe(ctx.vacante.etapas))))
    setAgregadas([...agregadas, ...ids])
  }
  const faltan = afines.filter((una) => !agregadas.includes(una.persona.id))
  return (
    <>
      <AgentNote>
        En tu base hay {personasTexto(afines.length)} que {afines.length === 1 ? 'comparte' : 'comparten'} lo que pide la vacante y no {afines.length === 1 ? 'está' : 'están'} en
        ella. Entran a {tituloEtapa(primeraEtapaDe(ctx.vacante.etapas))} sin recibir correo; la IA las compara con la vacante.
      </AgentNote>
      <ItemGroup className="mt-3 gap-1!">
        {afines.map(({ persona, comunes }) => (
          <Item key={persona.id} size="sm" className="rounded-[12px]!">
            <ItemContent className="min-w-0!">
              <ItemTitle className="w-full!">
                <span className="truncate">{persona.nombre}</span>
              </ItemTitle>
              <ItemDescription className="truncate">
                {persona.cargo} · {persona.ciudad} · comparte {nombres(comunes.slice(0, 3))}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              {agregadas.includes(persona.id) ? (
                <Badge variant="success-light">
                  Agregada
                </Badge>
              ) : puedeCambiar(ctx) && onAgregar ? (
                <Button variant="outline" size="sm" className={PILL_XS} onClick={() => agregar([persona.id])}>
                  Agregar
                </Button>
              ) : null}
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {faltan.length > 1 && puedeCambiar(ctx) && onAgregar ? (
        <Acciones>
          <Button className={PILL} onClick={() => agregar(faltan.map((una) => una.persona.id))}>
            Agregar a las {faltan.length}
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

// Agregar a alguien de la base por su nombre (OF-23).
function AgregarDeLaBase({ nombre }: { nombre: string }) {
  const { ctx, onAgregar } = useAgente()
  const base = usePersonasDeLaBase()
  const [hecho, setHecho] = useEstadoDelMensaje<string | null>('hecho', null)
  if (!puedeCambiar(ctx)) return <SinPermiso que="agregar a nadie a la vacante" />
  const encontradas = personaDeLaBase(nombre, base)
  const ya = new Set(todasDe(ctx).map((c) => c.personaId))
  if (!encontradas.length) return <AgentNote>No encontré a «{nombre}» en tu base. Si tienes su CV, súbelo con el «+» de abajo.</AgentNote>
  const etapa = primeraEtapaDe(ctx.vacante.etapas)
  return (
    <>
      <AgentNote>
        {encontradas.length === 1 ? `Encontré a ${encontradas[0].nombre} en tu base.` : `Hay ${encontradas.length} personas que se llaman así en tu base.`} Entra a{' '}
        {tituloEtapa(etapa)} sin recibir correo.
      </AgentNote>
      <ItemGroup className="mt-3 gap-1!">
        {encontradas.map((persona) => (
          <Item key={persona.id} size="sm" className="rounded-[12px]!">
            <ItemContent className="min-w-0!">
              <ItemTitle>{persona.nombre}</ItemTitle>
              <ItemDescription className="truncate">
                {persona.cargo} · {persona.empresa} · {persona.ciudad}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              {ya.has(persona.id) || hecho === persona.id ? (
                <Badge variant="secondary">
                  Ya está en la vacante
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className={PILL_XS}
                  onClick={() => {
                    onAgregar?.([candidaturaDesdeLaBase(persona, ctx.vacante, etapa)])
                    setHecho(persona.id)
                  }}
                >
                  Agregar
                </Button>
              )}
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </>
  )
}

// Lo que no se responde ni se hace (OF-51, OF-52).
function Sensible({ que, pide }: { que: string; pide: boolean }) {
  return (
    <>
      <AgentNote>
        {pide
          ? `Eso no lo hago: decidir por ${que} es discriminar, y en una contratación no puede pesar.`
          : `Eso no te lo respondo: ${que} no puede pesar en una decisión de contratación, aunque aparezca en el CV.`}{' '}
        Si quieres saber si alguien encaja, pregúntame por los requisitos de la vacante.
      </AgentNote>
      <p className="mt-2.5 text-[13px] text-muted-foreground">{NO_USA}</p>
    </>
  )
}

// Qué datos usa y si gasta créditos (OF-56, OF-57).
function AcercaDe() {
  return (
    <>
      <AgentNote>Esto es lo que conviene saber de mí:</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <AgentList
          items={[
            'Sé comparar personas, pasarlas de etapa, rechazarlas o volver a considerarlas (siempre con tu aprobación), cambiar su correo, celular o expectativa, escribirles un borrador, anotar en su ficha, buscar en tu base y responder sobre la vacante: quién espera, quién cumple, dónde se atasca, por fechas, cómo entró cada persona y los lotes.',
            'Uso los datos de esta vacante: los CVs, lo que concluyó la IA de cada requisito, las entrevistas, lo que pide cada persona y el historial. Nada que tu permiso no deje ver.',
            'No uso la edad, el género, la nacionalidad, el estado civil ni la foto, y no respondo por ellos.',
            'Nada cambia sin que lo apruebes, y queda en la historia de cada persona que lo propuse yo.',
            'Esta conversación la ves solo tú. Se guarda mientras dure tu visita a Selección y se elimina al cerrar la sesión.',
            'Preguntarme no gasta créditos de IA. Gastan las etapas con IA (Serena AI, las pruebas) cuando alguien entra a ellas.',
          ]}
        />
      </AgentCard>
    </>
  )
}

/* Respuestas por intención ---------------------------------------------------------------------------------------- */

const SUGERENCIAS_VACANTE = ['¿Quién espera una respuesta mía?', '¿Quién cumple todos los requisitos?', '¿Dónde se está atascando el proceso?', '¿Qué me propones hacer hoy?']

function NoSe({ texto }: { texto?: string }) {
  const { escribir, ctx } = useAgente()
  // Lo que sí se entendió: a quién nombra o de qué etapa habla (OF-18).
  const nombradas = texto ? todasDe(ctx).filter((c) => normalizar(texto).includes(normalizar(primerNombre(c)))) : []
  const entendido = nombradas.length ? `Entendí que hablas de ${nombres(nombradas.slice(0, 2).map((c) => c.candidato.nombre))}, pero no qué necesitas.` : 'Todavía no sé responder eso.'
  const opciones = nombradas.length
    ? [`¿Cómo va ${primerNombre(nombradas[0])}?`, `Compara a ${primerNombre(nombradas[0])} con alguien`, `¿Cuál es el correo de ${primerNombre(nombradas[0])}?`]
    : ['Comparar candidatos', 'Actualizar datos de un candidato', ...SUGERENCIAS_VACANTE.slice(0, 2)]
  return (
    <>
      <AgentNote>
        {entendido} Sobre {ctx.vacante.titulo} te puedo ayudar con esto:
      </AgentNote>
      <Acciones>
        {opciones.map((pedido) => (
          <Button key={pedido} variant="outline" className={PILL_XS} onClick={() => escribir(pedido)}>
            {pedido}
          </Button>
        ))}
        <Button variant="outline" className={PILL_XS} onClick={() => escribir('¿Qué sabes hacer?')}>
          Todo lo que sé hacer
        </Button>
      </Acciones>
    </>
  )
}

function Esperan() {
  const { ctx, onFiltrar } = useAgente()
  const esperan = esperanDe(ctx)
  if (!esperan.length) return <AgentNote>Nadie está esperando una respuesta tuya ahora mismo.</AgentNote>
  return (
    <>
      <AgentNote>
        {esperan.length === 1 ? 'Una persona espera' : `${esperan.length} personas esperan`} una respuesta tuya. Quien más lleva es {esperan[0].candidato.nombre}, con{' '}
        {diasTexto(esperan[0].dias)}.
      </AgentNote>
      <ListaPersonas
        personas={esperan}
        detalle={(c) => c.candidato.accion}
        derecha={(c) => (
          <Badge variant={c.dias > 5 ? 'warning-light' : 'secondary'} className="tabular-nums">
            {diasTexto(c.dias)}
          </Badge>
        )}
      />
      {onFiltrar ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={() => onFiltrar({ vista: 'espera' })}>
            Ver solo a ellas en el tablero
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Cumplen() {
  const { ctx, hablar } = useAgente()
  const todo = cumplenTodo(ctx)
  const mitad = cumplenMitad(ctx)
  if (!todo.length && !mitad.length) return <AgentNote>Nadie en proceso cumple ni la mitad de los requisitos. Quizá valga la pena revisar lo que pide la vacante.</AgentNote>
  return (
    <>
      <AgentNote>
        {todo.length
          ? `${todo.length === 1 ? 'Una persona cumple' : `${todo.length} personas cumplen`} todos los requisitos, según su CV${mitad.length ? `; ${mitad.length} más cumplen la mitad o más` : ''}.`
          : 'Nadie cumple todos los requisitos; las que más se acercan cumplen la mitad o más.'}
      </AgentNote>
      <ListaPersonas personas={[...todo, ...mitad]} detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.candidato.cargo}`} derecha={cumpleBadge} />
      <Acciones>
        {todo.length >= 2 ? (
          <Button
            variant="outline"
            className={PILL_XS}
            onClick={() => hablar('Compara a las que cumplen todo', <ComparacionRespuesta ids={todo.slice(0, MAX_COMPARAR).map((c) => c.id)} enfoques={ENFOQUES.map((uno) => uno.id)} />, { pensando: 'Comparando…', espera: 1400 })}
          >
            Comparar a las que cumplen todo
          </Button>
        ) : null}
        {todo.length && puedeCambiar(ctx) && !cerrada(ctx) ? (
          <Button
            variant="outline"
            className={PILL_XS}
            onClick={() =>
              hablar('Pasa a la siguiente etapa a las que cumplen todo', <Respuesta fuentes={[F.cv(todo.length)]}><Plan accion="mover" grupo={{ tipo: 'cumplen-todo' }} /></Respuesta>, { espera: 1000 })
            }
          >
            Pasarlas a la siguiente etapa
          </Button>
        ) : null}
      </Acciones>
    </>
  )
}

function Salario() {
  const { ctx } = useAgente()
  const piden = pidenMas(ctx)
  const [minimo, tope] = ctx.vacante.rango
  if (!veSalarios(ctx)) return <AgentNote>El rango de la vacante es {pesos(minimo)} – {pesos(tope)}. Lo que pide cada persona no te lo puedo mostrar: tu permiso no deja ver salarios.</AgentNote>
  if (!piden.length) return <AgentNote>El rango de la vacante es {pesos(minimo)} – {pesos(tope)}, y todas las personas en proceso piden dentro de él.</AgentNote>
  return (
    <>
      <AgentNote>
        El rango de la vacante es {pesos(minimo)} – {pesos(tope)}. {piden.length === 1 ? 'Una persona pide' : `${piden.length} personas piden`} más del tope.
      </AgentNote>
      <ListaPersonas
        personas={piden}
        detalle={(c) => `${tituloEtapa(c.etapa)} · ${cumplidosDe(c.criterios)} de ${c.criterios.length} ${plural(c.criterios.length, 'requisito', 'requisitos')}`}
        derecha={(c) => (
          <Badge variant="warning-light" className="tabular-nums">
            {pesos(c.candidato.pretension)}
          </Badge>
        )}
      />
    </>
  )
}

function Rechazos() {
  const { ctx, onReconsiderar } = useAgente()
  const [ver, setVer] = useEstadoDelMensaje('ver', false)
  const motivos = motivosDeRechazo(ctx)
  if (!ctx.rechazadas.length) return <AgentNote>Todavía no has rechazado a nadie en esta vacante.</AgentNote>
  // Si varios motivos empatan arriba, se dicen todos: nombrar uno solo sería inventar cuál pesa más.
  const empatados = motivos.filter(([, cuantas]) => cuantas === motivos[0][1])
  const cualesMotivos =
    empatados.length === 1
      ? `El motivo que más se repite es «${motivos[0][0]}», con ${motivos[0][1]}.`
      : empatados.length <= 3
        ? `Los que más se repiten son ${nombres(empatados.map(([motivo]) => `«${motivo}»`))}, con ${motivos[0][1]} cada uno.`
        : `Los motivos están repartidos: ninguno pasa de ${motivos[0][1]}.`
  return (
    <>
      <AgentNote>
        Salieron {ctx.rechazadas.length} personas. {cualesMotivos}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-2.5">
          {motivos.slice(0, 5).map(([motivo, cuantas]) => (
            <div key={motivo} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{motivo}</span>
                <span className="text-muted-foreground tabular-nums">{cuantas}</span>
              </div>
              {/* Contra el total de rechazos, no contra el más alto: con motivos empatados, todas las barras llenas no
                  decían nada. */}
              <Progress value={(cuantas / ctx.rechazadas.length) * 100} aria-label={`${motivo}: ${cuantas} de ${ctx.rechazadas.length}`} />
            </div>
          ))}
          {motivos.length > 5 ? (
            <span className="text-[13px] text-muted-foreground">
              Y {motivos.length - 5 === 1 ? 'un motivo más' : `${motivos.length - 5} motivos más`}.
            </span>
          ) : null}
        </div>
      </AgentCard>
      <Acciones>
        <Button variant="outline" className={PILL_XS} aria-expanded={ver} onClick={() => setVer(!ver)}>
          {ver ? 'Ocultar a quienes salieron' : `Ver a las ${ctx.rechazadas.length} personas`}
        </Button>
      </Acciones>
      {ver ? (
        <ListaPersonas
          personas={ctx.rechazadas.map((r) => r.candidatura)}
          detalle={(c) => `${tituloEtapa(c.etapa)} · ${rechazoDe(ctx, c.id)?.motivo ?? ''}`}
          acciones={(c) =>
            onReconsiderar && puedeCambiar(ctx) ? (
              <Button
                variant="outline"
                size="sm"
                className={PILL_XS}
                onClick={(evento) => {
                  evento.stopPropagation()
                  const r = rechazoDe(ctx, c.id)
                  if (r) onReconsiderar(r)
                }}
              >
                Volver a considerar
              </Button>
            ) : null
          }
        />
      ) : null}
    </>
  )
}

function Entrevistas() {
  const { ctx, hablar } = useAgente()
  const { etapaIA, hechas, bajas, sinAgendar, promedio } = entrevistasDe(ctx)
  if (!etapaIA) return <AgentNote>Esta vacante no tiene una etapa de entrevista con IA.</AgentNote>
  return (
    <>
      <AgentNote>
        {hechas.length
          ? `${hechas.length === 1 ? 'Una persona hizo' : `${hechas.length} personas hicieron`} la entrevista con ${etapaIA.titulo}, con ${promedio}/100 en promedio${bajas.length ? `; ${bajas.length} quedaron por debajo de 70` : ''}.`
          : `Nadie ha hecho todavía la entrevista con ${etapaIA.titulo}.`}
        {sinAgendar.length ? ` ${sinAgendar.length === 1 ? 'Una persona no la ha' : `${sinAgendar.length} personas no la han`} presentado.` : ''}
      </AgentNote>
      {hechas.length || sinAgendar.length ? (
        <ListaPersonas
          personas={[...hechas].sort((a, b) => (b.candidato.serena ?? 0) - (a.candidato.serena ?? 0)).concat(sinAgendar)}
          detalle={(c) => (c.candidato.serena === undefined ? 'Sin presentarla' : tituloEtapa(c.etapa))}
          derecha={(c) =>
            c.candidato.serena === undefined ? (
              <Badge variant="secondary">
                Pendiente
              </Badge>
            ) : (
              <Badge variant={c.candidato.serena < 70 ? 'destructive-outline' : 'success-light'} className="tabular-nums">
                {c.candidato.serena}/100
              </Badge>
            )
          }
        />
      ) : null}
      {sinAgendar.length && puedeCambiar(ctx) ? (
        <Acciones>
          <Button
            variant="outline"
            className={PILL_XS}
            onClick={() => hablar('Recuérdales la entrevista', <Respuesta fuentes={[F.serena(hechas.length)]}><Plan accion="recordar" grupo={{ tipo: 'sin-entrevista' }} /></Respuesta>, { espera: 1000 })}
          >
            {sinAgendar.length === 1 ? 'Recordarle la entrevista' : 'Recordarles la entrevista'}
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Resumen() {
  const { ctx } = useAgente()
  const esperan = esperanDe(ctx)
  const { acumula, empatadas } = embudoDe(ctx)
  const destacada = ctx.dentro.length >= 2 ? recomendar(ctx.dentro, ctx).elegida : ctx.dentro[0]
  return (
    <>
      <AgentNote>Así va {ctx.vacante.titulo}:</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <AgentList
          items={[
            `${ctx.vacante.estado === 'Borrador' ? 'Todavía sin publicar' : ctx.vacante.estado === 'Cerrada' ? 'Cerrada' : ctx.vacante.diasAbierta === 0 ? 'Se abrió hoy' : `Lleva ${ctx.vacante.diasAbierta} ${ctx.vacante.diasAbierta === 1 ? 'día abierta' : 'días abierta'}`}, con ${ctx.vacante.aplicaciones} aplicaciones (${ctx.vacante.ultimaSemana} esta semana).`,
            `${ctx.dentro.length} ${ctx.dentro.length === 1 ? 'persona sigue' : 'personas siguen'} en el proceso y ${ctx.rechazadas.length} ${ctx.rechazadas.length === 1 ? 'salió' : 'salieron'}.`,
            esperan.length ? `${esperan.length} ${esperan.length === 1 ? 'espera' : 'esperan'} una respuesta tuya; quien más lleva, ${diasTexto(esperan[0].dias)}.` : 'Nadie espera una respuesta tuya.',
            acumula
              ? `Se acumula en ${acumula.etapa.titulo} (${acumula.cuantos}).`
              : empatadas.length
                ? `${nombres(empatadas.map((una) => una.etapa.titulo))} tienen ${empatadas[0].cuantos} cada una.`
                : 'Ninguna etapa se está acumulando.',
            ...(destacada ? [`Quien mejor va: ${destacada.candidato.nombre}, que cumple ${cumplidosDe(destacada.criterios)} de ${destacada.criterios.length}.`] : []),
          ]}
        />
      </AgentCard>
    </>
  )
}

function PorEtapa({ etapa }: { etapa: string }) {
  const { ctx, onVerEtapa } = useAgente()
  const aqui = ctx.dentro.filter((c) => c.etapa === etapa)
  if (!aqui.length) return <AgentNote>No hay nadie en {tituloEtapa(etapa)} ahora mismo.</AgentNote>
  return (
    <>
      <AgentNote>
        En {tituloEtapa(etapa)} {aqui.length === 1 ? 'está una persona' : `están ${aqui.length} personas`}. Quien más lleva,{' '}
        {[...aqui].sort((a, b) => b.dias - a.dias)[0].candidato.nombre}.
      </AgentNote>
      <ListaPersonas personas={[...aqui].sort((a, b) => b.dias - a.dias)} detalle={(c) => `${diasTexto(c.dias)} aquí${c.candidato.accion ? ` · ${c.candidato.accion.toLowerCase()}` : ''}`} derecha={cumpleBadge} />
      {onVerEtapa ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={() => onVerEtapa(etapa)}>
            Ver la columna en el tablero
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Actividad({ dias, cuando }: { dias: number; cuando: string }) {
  const { ctx } = useAgente()
  const movimientos = useTodosLosMovimientos()
  const { llegaron, avanzaron, salieron } = actividadDe(ctx, dias, movimientos)
  if (!llegaron.length && !avanzaron.length && !salieron.length) return <AgentNote>No hubo movimiento {cuando}: nadie llegó, nadie cambió de etapa y nadie salió.</AgentNote>
  return (
    <>
      <AgentNote>
        {cuando.charAt(0).toUpperCase() + cuando.slice(1)}: {[llegaron.length ? `${llegaron.length === 1 ? 'llegó 1 persona' : `llegaron ${llegaron.length}`}` : null, avanzaron.length ? `${avanzaron.length === 1 ? '1 cambió de etapa' : `${avanzaron.length} cambiaron de etapa`}` : null, salieron.length ? `${salieron.length === 1 ? '1 salió' : `${salieron.length} salieron`}` : null].filter(Boolean).join(', ')}.
      </AgentNote>
      {llegaron.length ? (
        <>
          <h4 className={`${KICKER} mt-4 text-muted-foreground`}>Llegaron</h4>
          <ListaPersonas personas={llegaron} detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.candidato.cargo}`} derecha={cumpleBadge} />
        </>
      ) : null}
      {avanzaron.length ? (
        <>
          <h4 className={`${KICKER} mt-4 text-muted-foreground`}>Cambiaron de etapa</h4>
          <ListaPersonas personas={avanzaron} detalle={(c) => `Ahora en ${tituloEtapa(c.etapa)} · hace ${diasTexto(c.dias)}`} />
        </>
      ) : null}
      {salieron.length ? (
        <>
          <h4 className={`${KICKER} mt-4 text-muted-foreground`}>Salieron</h4>
          <ListaPersonas personas={salieron.map((r) => r.candidatura)} detalle={(c) => rechazoDe(ctx, c.id)?.motivo ?? ''} />
        </>
      ) : null}
    </>
  )
}

// «¿De dónde vienen?» o «¿Quién llegó por LinkedIn?»: el canal no se sabe (todos aplican por el portal de empleo, 8 oct,
// VP de producto). Se dice eso y lo que sí se sabe: cómo entró cada persona.
const CANAL: Record<string, string> = { linkedin: 'LinkedIn', computrabajo: 'Computrabajo', referido: 'un referido', feria: 'una feria', magneto: 'Magneto' }

function Origen({ origen }: { origen?: string }) {
  const { ctx } = useAgente()
  const grupos = porEntrada(ctx)
  return (
    <>
      <AgentNote>
        {origen ? `No sé quién llegó por ${CANAL[origen] ?? origen}: ` : 'No sé por qué canal vio cada persona la vacante: '}
        todas aplican por el portal de empleo, y de dónde venían antes no queda registro. Lo que sí sé es cómo entró cada una:
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-2.5">
          {grupos.map(([nombre, gente]) => (
            <div key={nombre} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{nombre}</span>
                <span className="text-muted-foreground tabular-nums">{gente.length}</span>
              </div>
              <Progress value={(gente.length / Math.max(1, ctx.dentro.length)) * 100} aria-label={`${nombre}: ${gente.length} de ${ctx.dentro.length}`} />
            </div>
          ))}
        </div>
      </AgentCard>
    </>
  )
}

function ExEmpleados() {
  const { ctx } = useAgente()
  const ex = exEmpleadosDe(ctx)
  if (!ex.length) return <AgentNote>Nadie en proceso trabajó antes en la empresa.</AgentNote>
  return (
    <>
      <AgentNote>{ex.length === 1 ? 'Una persona en proceso ya trabajó' : `${ex.length} personas en proceso ya trabajaron`} en la empresa. Su ficha dice cuándo y por qué salió.</AgentNote>
      {/* Sin «Ver solo a ellas en el tablero»: el tablero ya no filtra por ex empleados (13 oct, PM). */}
      <ListaPersonas personas={ex} detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.candidato.cargo}`} derecha={cumpleBadge} />
    </>
  )
}

function RequisitosDeLaVacante() {
  const { ctx, onEditar } = useAgente()
  return (
    <>
      <AgentNote>
        {ctx.vacante.titulo} pide {ctx.vacante.requisitos.length} {plural(ctx.vacante.requisitos.length, 'requisito', 'requisitos')}. Con ellos la IA lee cada CV:
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <AgentList items={ctx.vacante.requisitos} />
        <p className="mt-3 text-[13px] text-muted-foreground">
          Además: {ctx.vacante.experiencia} de experiencia, {ctx.vacante.idioma}, {ctx.vacante.modalidad.toLowerCase()} en {ctx.vacante.sede}.
        </p>
      </AgentCard>
      {onEditar && puedeCambiar(ctx) ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={onEditar}>
            Editar la vacante
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Descripcion() {
  const { ctx, onEditar } = useAgente()
  const revision = revisionDeLaVacante(ctx.vacante)
  const faltan = revision.filter((una) => !una.ok)
  return (
    <>
      <AgentNote>
        {faltan.length
          ? `Le veo ${faltan.length === 1 ? 'una cosa por mejorar' : `${faltan.length} cosas por mejorar`}${ctx.vacante.estado === 'Borrador' ? ' antes de publicarla' : ''}:`
          : `${ctx.vacante.titulo} está completa${ctx.vacante.estado === 'Borrador' ? ': la puedes publicar' : ''}.`}
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex flex-col gap-2.5">
          {revision.map((una) => (
            <div key={una.texto} className="flex items-start gap-2.5">
              <HugeiconsIcon icon={una.ok ? Tick02Icon : Alert02Icon} size={16} aria-hidden="true" className={cn('mt-0.5 shrink-0', una.ok ? 'text-primary' : 'text-warning-foreground')} />
              <span className="text-sm leading-normal text-foreground/80">
                <span className="sr-only">{una.ok ? 'Bien: ' : 'Por mejorar: '}</span>
                {una.texto}
              </span>
            </div>
          ))}
        </div>
      </AgentCard>
      {onEditar && puedeCambiar(ctx) ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={onEditar}>
            Editar la vacante
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function EtapasDeLaVacante() {
  const { ctx } = useAgente()
  return (
    <>
      <AgentNote>El proceso de {ctx.vacante.titulo} tiene {ctx.vacante.etapas.length} {plural(ctx.vacante.etapas.length, 'etapa', 'etapas')}:</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <ol className="flex flex-col gap-2">
          {ctx.vacante.etapas.map((etapa, indice) => (
            <li key={etapa.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {indice + 1}. {etapa.titulo}
                {etapa.ia ? <span className="text-muted-foreground"> · con IA</span> : null}
              </span>
              <span className="text-muted-foreground tabular-nums">{ctx.dentro.filter((c) => c.etapa === etapa.id).length}</span>
            </li>
          ))}
        </ol>
      </AgentCard>
    </>
  )
}

function Equipo() {
  const { ctx } = useAgente()
  return (
    <>
      <AgentNote>
        En {ctx.vacante.titulo} {ctx.vacante.equipo.length === 1 ? 'trabaja una persona' : `trabajan ${ctx.vacante.equipo.length} personas`}:
      </AgentNote>
      <ItemGroup className="mt-3 gap-1!">
        {ctx.vacante.equipo.map((miembro) => (
          <Item key={miembro.nombre} size="sm" className="rounded-[12px]!">
            <ItemMedia>
              <Avatar size="sm">
                <AvatarFallback>{miembro.iniciales}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{miembro.nombre}</ItemTitle>
              <ItemDescription>{miembro.permiso}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </>
  )
}

function Enlace() {
  const { ctx } = useAgente()
  const enlace = `${PORTAL}/${ctx.vacante.id}`
  if (ctx.vacante.estado !== 'Publicada')
    return <AgentNote>{ctx.vacante.titulo} {ctx.vacante.estado === 'Borrador' ? 'todavía no está publicada' : 'está cerrada'}: su enlace no recibe aplicaciones.</AgentNote>
  return (
    <>
      <AgentNote>{ctx.vacante.oculta ? 'Está publicada pero oculta del portal: solo entra quien tenga este enlace.' : 'Este es el enlace para aplicar:'}</AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-sm select-all">{enlace}</span>
          <Button variant="outline" size="sm" className={PILL_XS} onClick={() => void copiar(enlace, 'Copiamos el enlace de la vacante')}>
            Copiar
          </Button>
        </div>
      </AgentCard>
    </>
  )
}

function Desenlace() {
  const { ctx, onReabrir } = useAgente()
  const motivos = motivosDeRechazo(ctx)
  if (ctx.vacante.estado !== 'Cerrada')
    return <AgentNote>{ctx.vacante.titulo} sigue abierta: todavía no se ha contratado a nadie. {ctx.dentro.length ? `Hay ${personasTexto(ctx.dentro.length)} en proceso.` : ''}</AgentNote>
  return (
    <>
      <AgentNote>
        {ctx.vacante.desenlace ?? 'Está cerrada.'} Estuvo abierta {ctx.vacante.diasAbierta} {plural(ctx.vacante.diasAbierta, 'día', 'días')}.
      </AgentNote>
      <AgentCard className={cn('mt-3', styles.propIn)}>
        <AgentList
          items={[
            `${ctx.vacante.aplicaciones} personas aplicaron.`,
            ctx.rechazadas.length ? `${personasTexto(ctx.rechazadas.length)} salieron; el motivo que más se repite es «${motivos[0]?.[0]}».` : 'Nadie salió con un motivo registrado.',
            ...(ctx.vacante.historial?.length ? [`Antes se cerró así: ${ctx.vacante.historial.join(' · ')}.`] : []),
          ]}
        />
      </AgentCard>
      {onReabrir ? (
        <Acciones>
          <Button variant="outline" className={PILL_XS} onClick={onReabrir}>
            Reabrir la vacante
          </Button>
        </Acciones>
      ) : null}
    </>
  )
}

function Conversaciones() {
  const { hilo } = useAgente()
  if (!hilo.archivadas.length) return <AgentNote>No hay conversaciones anteriores en esta vacante.</AgentNote>
  return (
    <>
      <AgentNote>Estas son las conversaciones anteriores de esta vacante. Al abrir una, la de ahora se guarda.</AgentNote>
      <ItemGroup className="mt-3 gap-1!">
        {hilo.archivadas.map((una) => {
          const primero = una.msgs.find((msg) => msg.role === 'user')
          return (
            <Item key={una.id} size="sm" render={<button type="button" />} onClick={() => hilo.retomar(una.id)} className={FILA_BOTON}>
              <ItemContent className="min-w-0!">
                <ItemTitle className="w-full!">
                  <span className="truncate">{typeof primero?.content === 'string' ? primero.content : 'Conversación'}</span>
                </ItemTitle>
                <ItemDescription>
                  Hoy, {new Date(una.cuando).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })} · {una.msgs.filter((msg) => msg.role === 'user').length} pedidos
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </>
  )
}

// Lo que responde el agente a una intención, con sus fuentes y sus preguntas para seguir, y de quiénes habló (para
// entender «compáralas» después). Los pedidos escritos y los atajos pasan por aquí.
function armar(intencion: Intencion, ctx: ContextoVacante, pedido: string): { nodo: ReactNode; personas?: string[] } {
  const r = (contenido: ReactNode, fuentes: ReplySource[] = [], seguir: string[] = []) => (
    <Respuesta fuentes={fuentes} seguir={seguir}>
      {contenido}
    </Respuesta>
  )
  const ids = (lista: Candidatura[]) => lista.map((c) => c.id)
  switch (intencion.tipo) {
    case 'comparar': {
      const { personas, dudas, sinEncontrar } = intencion
      const noEncontre = <NoEncontre escritos={sinEncontrar} pedido={pedido} />
      if (dudas.length)
        return {
          nodo: r(
            <>
              {noEncontre}
              <ElegirParaComparar
                inicial={ids(personas)}
                aviso={`Hay ${dudas[0].opciones.length} personas que se llaman «${dudas[0].opciones[0].candidato.nombre.split(' ')[0]}»: marca a cuál te refieres.`}
              />
            </>,
          ),
        }
      if (personas.length > MAX_COMPARAR)
        return { nodo: r(<ElegirParaComparar inicial={ids(personas)} aviso={`Comparo de a ${MAX_COMPARAR} como máximo: te dejé marcadas las primeras.`} />) }
      if (personas.length >= 2)
        return { nodo: <ComparacionRespuesta ids={ids(personas)} enfoques={ENFOQUES.map((uno) => uno.id)} aviso={sinEncontrar.length ? noEncontre : undefined} />, personas: ids(personas) }
      const inicial = personas.length === 1 ? [personas[0].id] : ids(sugeridasParaComparar(ctx))
      return {
        nodo: r(
          <>
            {noEncontre}
            <ElegirParaComparar inicial={inicial} aviso={personas.length === 1 ? `¿Con quién comparo a ${primerNombre(personas[0])}? Marca a una o más personas.` : undefined} />
          </>,
        ),
      }
    }
    case 'actualizar': {
      const { personas, dudas, campo, valor, sinEncontrar } = intencion
      const noEncontre = <NoEncontre escritos={sinEncontrar} pedido={pedido} />
      if (dudas.length)
        return { nodo: r(<>{noEncontre}{pasoActualizar(ctx, undefined, { opciones: ids(dudas[0].opciones), campo, valor }, `Hay ${dudas[0].opciones.length} personas con ese nombre: ¿a cuál le cambio el dato?`)}</>) }
      if (personas.length > 1)
        return { nodo: r(pasoActualizar(ctx, undefined, { opciones: ids(personas), campo, valor }, 'Nombraste a varias personas: ¿a cuál le cambio el dato?')) }
      return { nodo: r(<>{noEncontre}{pasoActualizar(ctx, personas[0]?.id, { campo, valor }, sinEncontrar.length ? '¿A quién le cambio el dato?' : undefined)}</>), personas: ids(personas) }
    }
    case 'persona': {
      const { personas, dudas } = intencion
      if (dudas.length && !personas.length)
        return {
          nodo: r(
            <>
              <AgentNote>Hay {dudas[0].opciones.length} personas con ese nombre. ¿De cuál te cuento?</AgentNote>
              <ListaPersonas personas={dudas[0].opciones} detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.candidato.cargo}`} />
            </>,
          ),
          personas: ids(dudas[0].opciones),
        }
      const c = personas[0]
      return {
        nodo: r(<ResumenPersona id={c.id} />, [F.persona(c), ...(c.candidato.serena !== undefined ? [F.serena(1)] : [])], [`Compara a ${primerNombre(c)} con alguien`, `¿Cuál es el correo de ${primerNombre(c)}?`]),
        personas: [c.id],
      }
    }
    case 'rechazar':
    case 'mover':
    case 'reconsiderar':
    case 'abrir':
    case 'redactar':
    case 'nota':
    case 'dato':
    case 'otro-dato': {
      const { personas, dudas, sinEncontrar } = intencion
      const noEncontre = <NoEncontre escritos={sinEncontrar} pedido={pedido} />
      if (dudas.length && !personas.length)
        return {
          nodo: r(
            <>
              {noEncontre}
              <AgentNote>Hay {dudas[0].opciones.length} personas que se llaman «{dudas[0].escrito}». Toca a quién te refieres y te lo preparo.</AgentNote>
              <ListaPersonas personas={dudas[0].opciones} detalle={(c) => `${tituloEtapa(c.etapa)} · ${c.candidato.cargo}`} />
            </>,
          ),
          personas: ids(dudas[0].opciones),
        }
      if (!personas.length) {
        if (intencion.tipo === 'redactar' || intencion.tipo === 'nota')
          return {
            nodo: r(
              <>
                <AgentNote>¿Para quién es? Escríbeme su nombre o toca a alguien:</AgentNote>
                <ListaPersonas personas={ctx.dentro.slice(0, 6)} detalle={(c) => tituloEtapa(c.etapa)} />
              </>,
            ),
          }
        return { nodo: r(sinEncontrar.length ? noEncontre : <AgentNote>¿De quién hablas? Escríbeme su nombre.</AgentNote>) }
      }
      const c = personas[0]
      const lista = ids(personas)
      if (intencion.tipo === 'rechazar') return { nodo: r(<>{noEncontre}<Rechazar ids={lista} /></>, [F.cv(personas.length)]), personas: lista }
      if (intencion.tipo === 'mover') return { nodo: r(<>{noEncontre}<Mover ids={lista} destino={intencion.destino} /></>, [F.tablero(ctx)]), personas: lista }
      if (intencion.tipo === 'reconsiderar') return { nodo: r(<Reconsiderar ids={lista} />, [F.rechazos(ctx)]), personas: lista }
      if (intencion.tipo === 'redactar') return { nodo: r(<Redactar id={c.id} />, [F.persona(c)]), personas: [c.id] }
      if (intencion.tipo === 'nota') return { nodo: r(<Nota id={c.id} inicial={intencion.texto} />), personas: [c.id] }
      if (intencion.tipo === 'dato') return { nodo: r(<Dato id={c.id} campo={intencion.campo} />, [F.persona(c)]), personas: [c.id] }
      if (intencion.tipo === 'otro-dato')
        return {
          nodo: r(
            <>
              <AgentNote>
                {intencion.campo.charAt(0).toUpperCase() + intencion.campo.slice(1)} no lo cambio desde aquí: se cambia en la pestaña «Datos» de la ficha de{' '}
                {c.candidato.nombre}. Yo cambio el correo, el celular y la expectativa salarial.
              </AgentNote>
              <OtroDato id={c.id} />
            </>,
          ),
          personas: [c.id],
        }
      return { nodo: r(<Abrir id={c.id} />), personas: [c.id] }
    }
    case 'lote':
      return {
        nodo: r(<Plan accion={intencion.accion} grupo={intencion.grupo} destino={intencion.destino} />, [F.tablero(ctx), F.cv(ctx.dentro.length)]),
        personas: ids(personasDelGrupo(intencion.grupo, ctx)),
      }
    case 'esperan':
      return { nodo: r(<Esperan />, [F.tablero(ctx)], ['¿Qué me propones hacer hoy?', '¿Dónde se está atascando el proceso?']), personas: ids(esperanDe(ctx)) }
    case 'cumplen':
      return { nodo: r(<Cumplen />, [F.cv(ctx.dentro.length), F.vacante(ctx)], ['¿Cuáles son los requisitos de la vacante?', '¿Quién pide más del tope?']), personas: ids([...cumplenTodo(ctx), ...cumplenMitad(ctx)]) }
    case 'embudo':
      return { nodo: r(<Embudo />, [F.tablero(ctx)], ['¿Quién espera una respuesta mía?', '¿Qué me propones hacer hoy?']) }
    case 'salario':
      return { nodo: r(<Salario />, [F.vacante(ctx), ...(veSalarios(ctx) ? [F.salario()] : [])], ['¿Quién cumple todos los requisitos?']), personas: ids(pidenMas(ctx)) }
    case 'rechazos':
      return { nodo: r(<Rechazos />, [F.rechazos(ctx)], ['¿Dónde se está atascando el proceso?']) }
    case 'entrevistas': {
      const { hechas, sinAgendar } = entrevistasDe(ctx)
      return { nodo: r(<Entrevistas />, [F.serena(hechas.length)], ['¿Quién cumple todos los requisitos?']), personas: ids([...hechas, ...sinAgendar]) }
    }
    case 'propuestas':
      return { nodo: r(<Propuestas />, [F.tablero(ctx), F.cv(ctx.dentro.length)], ['¿Quién espera una respuesta mía?']) }
    case 'resumen':
      return { nodo: r(<Resumen />, [F.tablero(ctx), F.vacante(ctx)], ['¿Qué me propones hacer hoy?', '¿Dónde se está atascando el proceso?']) }
    case 'etapa':
      return { nodo: r(<PorEtapa etapa={intencion.etapa} />, [F.tablero(ctx)]), personas: ids(ctx.dentro.filter((c) => c.etapa === intencion.etapa)) }
    case 'actividad':
      return { nodo: r(<Actividad dias={intencion.dias} cuando={intencion.cuando} />, [F.actividad()], ['¿Quién espera una respuesta mía?']) }
    case 'origen':
      return { nodo: r(<Origen origen={intencion.origen} />, [F.tablero(ctx)]) }
    case 'exempleados':
      return { nodo: r(<ExEmpleados />, [F.tablero(ctx)]), personas: ids(exEmpleadosDe(ctx)) }
    case 'lotes':
      return { nodo: r(<Lotes />, [F.lotes(0)]) }
    case 'requisitos-vacante':
      return { nodo: r(<RequisitosDeLaVacante />, [F.vacante(ctx)], ['¿Quién cumple todos los requisitos?', '¿Qué le falta a la descripción?']) }
    case 'descripcion':
      return { nodo: r(<Descripcion />, [F.vacante(ctx)], ['¿Cuáles son los requisitos de la vacante?']) }
    case 'etapas-vacante':
      return { nodo: r(<EtapasDeLaVacante />, [F.vacante(ctx)], ['¿Dónde se está atascando el proceso?']) }
    case 'equipo':
      return { nodo: r(<Equipo />, [F.vacante(ctx)]) }
    case 'enlace':
      return { nodo: r(<Enlace />, [F.vacante(ctx)]) }
    case 'desenlace':
      return { nodo: r(<Desenlace />, [F.vacante(ctx), F.rechazos(ctx)], ['¿Por qué salió la gente?']) }
    case 'base':
      return { nodo: r(<DeLaBase />, [F.base(baseDeCandidatos.leer().length), F.vacante(ctx)]) }
    case 'agregar-base':
      return { nodo: r(<AgregarDeLaBase nombre={intencion.nombre} />, [F.base(baseDeCandidatos.leer().length)]) }
    case 'sensible':
      return { nodo: r(<Sensible que={intencion.que} pide={intencion.pide} />) }
    case 'idioma':
      return {
        nodo: r(
          <AgentNote>
            For now I only answer in Spanish. Por ahora respondo en español: escríbeme tu pregunta así, por ejemplo «¿Quién es el mejor candidato?».
          </AgentNote>,
          [],
          ['¿Quién cumple todos los requisitos?', 'Comparar candidatos'],
        ),
      }
    case 'nueva-conversacion':
      return { nodo: r(<AgentNote>Listo. Guardé la conversación anterior: la encuentras si me pides «conversaciones anteriores».</AgentNote>) }
    case 'anteriores':
      return { nodo: r(<Conversaciones />) }
    case 'acerca':
      return { nodo: r(<AcercaDe />) }
    case 'saludo':
      return { nodo: r(<AgentNote>Hola. Pregúntame lo que quieras de {ctx.vacante.titulo}, o pídeme comparar a alguien, moverla de etapa o actualizar sus datos.</AgentNote>) }
    case 'gracias':
      return { nodo: r(<AgentNote>Con gusto. Aquí sigo si necesitas algo más de la vacante.</AgentNote>) }
    case 'no-hago':
      return {
        nodo: r(
          <AgentNote>
            Eso no lo hago yo: no puedo {intencion.que}. Se hace en {intencion.donde}
          </AgentNote>,
        ),
      }
    default:
      return { nodo: r(<NoSe texto={intencion.texto} />) }
  }
}

function OtroDato({ id }: { id: string }) {
  const { onAbrir } = useAgente()
  return (
    <Acciones>
      <Button variant="outline" className={PILL_XS} onClick={() => onAbrir(id)}>
        Abrir su ficha
      </Button>
    </Acciones>
  )
}

function Abrir({ id }: { id: string }) {
  const { ctx, onAbrir } = useAgente()
  const c = buscarEn(ctx, id)
  // Se abre una sola vez, al llegar la respuesta; volver a ver la conversación no la abre de nuevo.
  const [abierta, setAbierta] = useEstadoDelMensaje('abierta', false)
  useEffect(() => {
    if (abierta || !c) return
    setAbierta(true)
    onAbrir(c.id)
  }, [abierta, c, onAbrir, setAbierta])
  if (!c) return <AgentNote>Esa persona ya no está en la vacante.</AgentNote>
  return <AgentNote>Abrí la ficha de {c.candidato.nombre} a la izquierda.</AgentNote>
}

// El error de la IA (OF-35), como en los estados del sistema de diseño: qué pasó, que no se perdió nada, y reintentar.
function ErrorDeLaIA({ pedido }: { pedido: string }) {
  const { escribir } = useAgente()
  const [codigo] = useState(() => `ORB-${Math.floor(500 + Math.random() * 99)}`)
  return (
    <>
      <Alert variant="destructive">
        <HugeiconsIcon icon={Alert02Icon} />
        <AlertTitle>No pude responder ahora</AlertTitle>
        <AlertDescription>Se cortó la conexión con la IA. Tu pedido no se perdió; suele resolverse en unos segundos.</AlertDescription>
      </Alert>
      <Acciones>
        <Button variant="outline" className={PILL_XS} onClick={() => escribir(pedido)}>
          Reintentar
        </Button>
        <Button variant="outline" className={PILL_XS} onClick={() => notify('Enviamos el reporte', `Código ${codigo}.`, 'success')}>
          Reportar el problema
        </Button>
      </Acciones>
      <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">Código {codigo}</div>
    </>
  )
}

const PENSANDO: Partial<Record<Intencion['tipo'], string>> = {
  comparar: 'Comparando…',
  esperan: 'Revisando quién espera…',
  cumplen: 'Revisando los requisitos…',
  embudo: 'Contando por etapa…',
  salario: 'Revisando lo que piden…',
  rechazos: 'Revisando los rechazos…',
  entrevistas: 'Revisando las entrevistas…',
  propuestas: 'Pensando qué harías hoy…',
  resumen: 'Revisando la vacante…',
  lote: 'Armando el plan…',
  base: 'Buscando en tu base…',
  actividad: 'Revisando la actividad…',
  lotes: 'Revisando los lotes…',
  redactar: 'Escribiendo el borrador…',
}

/* El panel ------------------------------------------------------------------------------------------------------- */

const CAPACIDADES: { pedido: string; titulo: string; descripcion: string; icono: IconSvgElement; cambia?: boolean; vacia?: boolean }[] = [
  { pedido: 'Comparar candidatos', titulo: 'Comparar candidatos', descripcion: 'Lado a lado y con quién seguiría', icono: ArrowDataTransferHorizontalIcon },
  { pedido: 'Actualizar datos de un candidato', titulo: 'Actualizar datos de un candidato', descripcion: 'Correo, celular o expectativa salarial', icono: UserEdit01Icon, cambia: true },
]

// Sin nadie en el proceso (borrador o recién publicada), lo que sirve es traer gente (OF-42).
const CAPACIDADES_VACIA: typeof CAPACIDADES = [
  { pedido: '¿Hay alguien en mi base para esta vacante?', titulo: 'Buscar en Mis candidatos', descripcion: 'Quién de tu base encaja con la vacante', icono: UserSearch01Icon, cambia: true },
  { pedido: '¿Qué le falta a la descripción?', titulo: 'Revisar la vacante', descripcion: 'Descripción, requisitos, rango y equipo', icono: Briefcase06Icon },
]

// Los atajos de cada pestaña (OF-38).
const SUGERENCIAS_PESTANA: Record<'vacante' | 'cvs' | 'actividad', string[]> = {
  vacante: ['¿Cuáles son los requisitos de la vacante?', '¿Qué le falta a la descripción?', '¿Cuánto paga la vacante?', '¿Quién está en el equipo de la vacante?'],
  cvs: ['¿Cómo va la importación de CVs?', '¿Quién entró esta semana?', '¿Cuántos ex empleados hay?'],
  actividad: ['¿Qué pasó esta semana?', '¿Quién entró hoy?', '¿Por qué salió la gente?'],
}

// De quiénes se acaba de hablar en cada vacante (OF-10): vive con la conversación.
const recientesDe = new Map<string, string[]>()

export function AgenteVacante({
  vacante,
  dentro,
  rechazadas,
  onClose,
  onAbrir,
  onMover,
  onRechazar,
  revisando,
  marcadas,
  filtradas,
  pestana,
  puede,
  lotes = [],
  onMoverVarias,
  onReconsiderar,
  onAgregar,
  onFiltrar,
  onVerEtapa,
  onImportar,
  onVerLote,
  onEditar,
  onReabrir,
}: {
  vacante: VacanteUI
  // Quien sigue en el proceso de esta vacante y quien salió (con su motivo), al día.
  dentro: Candidatura[]
  rechazadas: Rechazada[]
  onClose: () => void
  // Abrir a una persona en la pantalla de trabajo (su fila en la bandeja, su ficha en el tablero o la revisión).
  onAbrir: (candidaturaId: string) => void
  onMover: (candidatura: Candidatura, destino: string, porAgente?: string) => void
  onRechazar: (candidaturas: Candidatura[], porAgente?: string) => void
  // La ficha abierta: el agente la tiene presente y ofrece compararla con quien sigue.
  revisando?: { actual: Candidatura; siguiente?: Candidatura | null } | null
  marcadas?: Candidatura[]
  filtradas?: { ids: string[]; texto: string } | null
  pestana?: ContextoVacante['pestana']
  puede?: ContextoVacante['puede']
  lotes?: LoteCvs[]
  onMoverVarias?: (cambios: Cambio[], porAgente?: string) => void
  onReconsiderar?: (rechazada: Rechazada) => void
  onAgregar?: (candidaturas: Candidatura[]) => void
  onFiltrar?: (filtro: FiltroTablero) => void
  onVerEtapa?: (etapa: string) => void
  onImportar?: () => void
  onVerLote?: (loteId: string) => void
  onEditar?: () => void
  onReabrir?: () => void
}) {
  // La conversación es de la vacante: sigue al cerrar y abrir el panel, al cambiar de pestaña o de ficha (OF-44).
  const hilo = useAgentThread([], { clave: `vacante:${vacante.id}` })
  const [pensando, setPensando] = useState('Revisando la vacante…')
  const [, setRecientes] = useState(0)
  const ctx: ContextoVacante = {
    vacante,
    dentro,
    rechazadas: rechazadas.filter((r) => r.candidatura.vacante.id === vacante.id),
    enFoco: revisando?.actual,
    marcadas,
    filtradas,
    pestana,
    puede,
    recientes: recientesDe.get(vacante.id) ?? [],
  }
  const esperan = esperanDe(ctx)
  const lento = simulado('agente-lento')

  // Con la IA lenta (OF-35), a los cuatro segundos el «Razonando…» dice que está tardando; «Detener» sigue ahí.
  useEffect(() => {
    if (!hilo.thinking || !lento) return
    const id = window.setTimeout(() => setPensando('Está tardando más de lo normal…'), 4000)
    return () => window.clearTimeout(id)
  }, [hilo.thinking, lento])

  const hablar: Agente['hablar'] = (pedido, respuesta, opciones) => {
    setPensando(opciones?.pensando ?? 'Revisando la vacante…')
    // Con `?simular=agente-error`, cada pedido falla la primera vez y el reintento responde.
    const falla = simulado('agente-error') && !fallados.has(pedido)
    if (falla) fallados.add(pedido)
    hilo.ask(pedido, falla ? <ErrorDeLaIA pedido={pedido} /> : respuesta, lento ? 9000 : (opciones?.espera ?? 1400))
  }
  const responder = (texto: string) => {
    const intencion = entender(texto, ctx)
    if (intencion.tipo === 'nueva-conversacion') hilo.nueva()
    const { nodo, personas } = armar(intencion, ctx, texto)
    if (personas?.length) {
      recientesDe.set(vacante.id, personas)
      setRecientes((n) => n + 1)
    }
    return { nodo, pensando: PENSANDO[intencion.tipo] }
  }
  const escribir = (texto: string) => {
    // Dos pedidos en un mensaje (OF-09): se responden los dos, uno detrás del otro.
    const partes = partirPedido(texto)
    const primera = responder(partes[0])
    hablar(texto, primera.nodo, { pensando: primera.pensando })
    partes.slice(1).forEach((parte, indice) => {
      window.setTimeout(() => {
        const otra = responder(parte)
        hilo.push('agent', otra.nodo)
      }, (lento ? 9000 : 1400) + 900 * (indice + 1))
    })
  }
  const rehacer = (pedidoId: number, pedido: string) => {
    const { nodo, pensando: etiqueta } = responder(pedido)
    setPensando(etiqueta ?? 'Revisando la vacante…')
    hilo.rehacerDesde(pedidoId, pedido, nodo, 1200)
  }
  const atajo = (pedido: string) => {
    const intencion: Intencion | null =
      pedido === 'Comparar candidatos'
        ? { tipo: 'comparar', personas: [], dudas: [], sinEncontrar: [] }
        : pedido === 'Actualizar datos de un candidato'
          ? { tipo: 'actualizar', personas: [], dudas: [], sinEncontrar: [] }
          : null
    if (!intencion) return escribir(pedido)
    hablar(pedido, armar(intencion, ctx, pedido).nodo, { espera: 900 })
  }

  const primero = QUIEN_MUEVE.split(' ')[0]
  const vacia = !dentro.length
  const soloVer = puede?.cambiar === false
  const masUrgente = esperan.find((c) => c.dias >= 5)

  // Los atajos: los de la ficha abierta, los de la selección, los de la pestaña o los de la vacante.
  const sugerencias: string[] = revisando
    ? [`¿Cómo va ${primerNombre(revisando.actual)}?`, ...(revisando.siguiente ? [`Compara a ${primerNombre(revisando.actual)} con ${primerNombre(revisando.siguiente)}`] : []), ...SUGERENCIAS_VACANTE.slice(0, 2)]
    : vacante.estado === 'Cerrada'
      ? ['¿A quién contratamos?', '¿Por qué salió la gente?', '¿Cómo va la vacante?']
      : pestana && pestana !== 'candidatos'
        ? SUGERENCIAS_PESTANA[pestana]
        : vacia
          ? [vacante.estado === 'Borrador' ? '¿Qué le falta para publicarla?' : '¿Qué le falta a la descripción?', '¿Cuáles son los requisitos de la vacante?', '¿Hay alguien en mi base para esta vacante?']
          : marcadas && marcadas.length >= 2
            ? [`Compara a las ${Math.min(marcadas.length, MAX_COMPARAR)} que marqué`, ...SUGERENCIAS_VACANTE.slice(0, 3)]
            : SUGERENCIAS_VACANTE
  const capacidades = (vacia ? CAPACIDADES_VACIA : CAPACIDADES).filter((capacidad) => !(soloVer && capacidad.cambia))

  const contexto = (
    <>
      <span className="text-foreground">Vacante {vacante.titulo}</span>
      {revisando ? (
        <>
          {' '}
          · revisando a <span className="text-foreground">{revisando.actual.candidato.nombre}</span>
        </>
      ) : (
        ` · ${dentro.length} en proceso`
      )}
      {filtradas && !revisando ? ` · ves ${filtradas.ids.length} con tus filtros` : ''}
    </>
  )

  return (
    <AgenteContexto.Provider
      value={{
        ctx,
        hablar,
        escribir,
        rehacer,
        onAbrir,
        onMover,
        onMoverVarias: onMoverVarias ?? ((cambios, razon) => cambios.forEach(({ candidatura, destino }) => onMover(candidatura, destino, razon))),
        onRechazar,
        onReconsiderar,
        onAgregar,
        onFiltrar,
        onVerEtapa,
        onImportar,
        onVerLote,
        onEditar,
        onReabrir,
        lotes,
        hilo,
      }}
    >
      <ContextPanel
        context={contexto}
        contextIcon={Briefcase06Icon}
        onClose={onClose}
        placeholder="Pregunta o pide algo sobre esta vacante"
        onSend={escribir}
        scrollKey={hilo.msgs.length ? hilo.scrollKey : undefined}
        onAttach={onImportar && !soloVer ? onImportar : undefined}
        attachLabel="Agregar CVs"
        attach={Boolean(onImportar) && !soloVer}
        dictar
      >
        <AgentNote>
          Hola, {primero}.{' '}
          {vacante.estado === 'Cerrada'
            ? `${vacante.titulo} está cerrada: ${(vacante.desenlace ?? 'ya terminó').replace(/^Cerrada el/, 'se cerró el')}.`
            : vacia
              ? `${vacante.titulo} ${vacante.estado === 'Borrador' ? 'todavía está en borrador y' : 'todavía'} no tiene a nadie en el proceso.`
              : `Estoy mirando ${vacante.titulo}: ${dentro.length === 1 ? 'una persona' : `${dentro.length} personas`} en proceso${esperan.length ? ` y ${esperan.length === 1 ? 'una espera' : `${esperan.length} esperan`} una respuesta tuya` : ''}.`}
          {revisando ? ` Estás revisando a ${revisando.actual.candidato.nombre}.` : ''}
          {marcadas && marcadas.length && !revisando ? ` Tienes ${marcadas.length === 1 ? 'una marcada' : `${marcadas.length} marcadas`} en el tablero.` : ''}
          {filtradas && !revisando ? ` Con tus filtros ves ${filtradas.ids.length} de ${dentro.length}.` : ''}
          {masUrgente && !revisando && vacante.estado !== 'Cerrada' ? ` Lo más urgente: ${masUrgente.candidato.nombre} lleva ${diasTexto(masUrgente.dias)} esperando.` : ''}
          {soloVer ? ` Puedes preguntarme lo que quieras; para cambiar algo, pídele acceso a ${puede?.pedirA ?? 'la dueña del proceso'}.` : ' Pregúntame lo que quieras o empieza por aquí.'}
        </AgentNote>

        {/* Los atajos del producto de hoy, en una sola tarjeta del agente con una fila cada uno (como «Sin acceso a un
            dato» en los estados del panel). Antes eran dos tarjetas en píldora con dos líneas de texto: pesaban más que
            la conversación (25 sep, Nicolás: «esto quedó horrible»). */}
        {vacante.estado !== 'Cerrada' && capacidades.length ? (
          <AgentCard className="mt-4 px-1.5! py-1.5!">
            <ItemGroup className="gap-0!">
              {capacidades.map((capacidad, indice) => (
                <Fragment key={capacidad.pedido}>
                  {/* La línea va de borde a borde de la tarjeta: se come el relleno lateral de la tarjeta (px-1.5). */}
                  {indice ? (
                    <div className="-mx-1.5 py-1.5">
                      <ItemSeparator />
                    </div>
                  ) : null}
                  <Item size="sm" render={<button type="button" />} onClick={() => atajo(capacidad.pedido)} className={FILA_BOTON}>
                    <ItemMedia>
                      <IconTile variant="soft" size="sm">
                        <HugeiconsIcon icon={capacidad.icono} size={16} />
                      </IconTile>
                    </ItemMedia>
                    <ItemContent className="min-w-0! gap-0!">
                      <ItemTitle>{capacidad.titulo}</ItemTitle>
                      <ItemDescription className="truncate">{capacidad.descripcion}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          </AgentCard>
        ) : null}
        {vacante.estado === 'Cerrada' && onReabrir && !soloVer ? (
          <Acciones className="mt-4">
            <Button variant="outline" className={PILL_XS} onClick={onReabrir}>
              Reabrir la vacante
            </Button>
          </Acciones>
        ) : null}

        <AgentSuggestions
          title={revisando ? 'Sobre esta revisión' : vacante.estado === 'Cerrada' ? 'Sobre cómo terminó' : pestana === 'vacante' ? 'Sobre la vacante' : pestana === 'cvs' ? 'Sobre los CVs importados' : pestana === 'actividad' ? 'Sobre la actividad' : 'Pregúntame sobre la vacante'}
          className="mt-6"
          items={sugerencias.map((pedido) => ({ label: pedido, onClick: () => escribir(pedido) }))}
        />

        {/* Qué datos uso, quién ve esto y si gasta créditos (OF-56, OF-57): a un clic, sin ocupar el saludo. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <Popover>
            <PopoverTrigger render={<Button variant="link" className="h-auto! p-0! text-[13px]! text-muted-foreground!" />}>Qué datos uso y quién ve esto</PopoverTrigger>
            <PopoverContent align="start" className="w-80 text-[13px] leading-normal">
              Uso los datos de esta vacante que tu permiso deja ver. No uso la edad, el género, la nacionalidad, el estado civil ni la foto. Esta
              conversación la ves solo tú y se guarda mientras dure tu visita. Preguntarme no gasta créditos de IA.
            </PopoverContent>
          </Popover>
          {hilo.msgs.length ? (
            <Button
              variant="link"
              className="h-auto! p-0! text-[13px]! text-muted-foreground!"
              onClick={() => {
                const deshacer = hilo.nueva()
                notifyAction('Empezamos una conversación nueva', 'La anterior quedó guardada.', { label: 'Deshacer', onClick: deshacer }, 'success')
              }}
            >
              Nueva conversación
            </Button>
          ) : null}
          {hilo.archivadas.length ? (
            <Button variant="link" className="h-auto! p-0! text-[13px]! text-muted-foreground!" onClick={() => escribir('Conversaciones anteriores')}>
              Conversaciones anteriores ({hilo.archivadas.length})
            </Button>
          ) : null}
        </div>

        <AgentThread
          msgs={hilo.msgs}
          thinking={hilo.thinking}
          thinkingLabel={hilo.pendientes > 1 ? `Respondiendo ${hilo.pendientes} pedidos…` : pensando}
          clave={hilo.clave}
          onEditar={(id, texto) => {
            const { nodo, pensando: etiqueta } = responder(texto)
            setPensando(etiqueta ?? 'Revisando la vacante…')
            hilo.rehacerDesde(id, texto, nodo, lento ? 9000 : 1400)
          }}
          onDetener={() => hilo.detener()}
        />
      </ContextPanel>
    </AgenteContexto.Provider>
  )
}

// Pedidos que ya fallaron con `?simular=agente-error`: el reintento sí responde.
const fallados = new Set<string>()
