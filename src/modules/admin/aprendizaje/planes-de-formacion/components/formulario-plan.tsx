import { useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, CheckListIcon, UserAdd01Icon, Delete02Icon, Edit02Icon, Logout01Icon, Logout03Icon, MoreHorizontalIcon, PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
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
  ItemGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { ConfirmarEliminar, Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { HOY, diasDesde, fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { AgentePlanes, useAgente, type Borrador } from './agente-aprendizaje'
import { AgregarAsignacion, ICONO_ALCANCE } from './agregar-asignacion'
import { CampoFecha, RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import { CATALOGO_COMPETENCIAS, CONTENIDOS, fichaDe } from './catalogo'
import { PanelIntegrantes } from './panel-integrantes'
import { PanelCatalogo } from './panel-catalogo'
import { ResumenPlan } from './resumen-plan'
import {
  MAXIMO_COMPETENCIAS,
  NOMBRE_ALCANCE,
  TIPOS,
  aQuien,
  aplicarUsuarios,
  eliminarItem,
  enfoqueDe,
  reemplazarItem,
  usuarioIdDe,
  buscarPlan,
  cambiarPlanes,
  itemsDe,
  itemsDelPlan,
  personasDelPlan,
  rutaPlan,
  usePlanes,
  type Asignacion,
  type Plan,
  type TipoPlan,
} from './planes-datos'

// Crear y editar un plan (/…/planes/crear?tipo=… y /…/planes/:id/editar), en UNA página como en UBITS
// (/creator/training-plan/content-plan/form): la tarjeta con el nombre y las fechas, y debajo dos tabs (HU-LMS-015/021):
// «Colaboradores», una fila por persona con su menú «Gestionar contenidos» y «Eliminar usuario del plan», y «Contenidos» o
// «Competencias», una fila por ítem con las acciones masivas (Agregar usuario, Reemplazar, Eliminar). «Agregar
// asignación» va una sola vez, en la fila de los tabs (RN-01b).
// Crear guarda con «Guardar» (RN-11: fechas + al menos una asignación; nace Planeado, RN-04). Editar es esta MISMA
// página con los datos del plan cargados (auditoría del 5-oct, decisión 5: el panel de edición del 30-sep se retiró), con
// «Guardar» y «Cancelar» como pidió diseño el 30-sep y el estado del guardado a la izquierda de la barra de abajo.
//
// Mejoras sin salirse del patrón: la columna «Asignado por» dice de dónde le llegó el plan a cada persona; las
// asignaciones completas se ven y se quitan arriba de la tabla; y el agente contextual sugiere y revisa el plan ahí mismo.

const HORAS = Array.from({ length: 12 }, (_, i) => i + 1)
const aFecha = (iso: string) => new Date(`${iso}T00:00:00`)
const aIso = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

// La asignación en una línea, como la lee UBITS en «Nuevas asignaciones»: «12 colaboradores», «Toda la empresa».
const resumenAsignacion = (a: Asignacion) =>
  a.alcance === 'empresa'
    ? NOMBRE_ALCANCE.empresa
    : a.alcance === 'grupos'
      ? `${a.destinatarios.length} ${plural(a.destinatarios.length, 'grupo', 'grupos')} · ${a.personas.toLocaleString('es-CO')} ${plural(a.personas, 'colaborador', 'colaboradores')}`
      : `${a.personas.toLocaleString('es-CO')} ${plural(a.personas, 'colaborador', 'colaboradores')}${a.alcance === 'archivo' ? ' del archivo' : ''}`

// «Nuevas asignaciones» al crear, como en UBITS: una fila por asignación, pendiente hasta que se guarda el plan, con ⋮
// Editar (vuelve a abrir el asistente con todo marcado) y Eliminar.
const columnasNuevas = (tipo: TipoPlan): DataGridListConfig<Asignacion>['columns'] => [
  {
    accessorKey: 'alcance',
    header: 'Tipo de asignación',
    size: 640,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <IconTile variant="soft" size="sm">
          <HugeiconsIcon icon={ICONO_ALCANCE[row.original.alcance]} aria-hidden="true" />
        </IconTile>
        <div className="flex min-w-0 flex-col gap-1">
          <Text as="span" size="sm" weight="medium" className="truncate">
            {resumenAsignacion(row.original)}
          </Text>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {row.original.alcance === 'empresa' ? 'También a quien entre mientras el plan esté vigente' : aQuien(row.original)}
          </Text>
        </div>
      </div>
    ),
  },
  {
    id: 'items',
    header: `${TIPOS[tipo].items.charAt(0).toUpperCase() + TIPOS[tipo].items.slice(1)} asignados`,
    size: 220,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums" title={row.original.items.join(', ')}>
        {row.original.items.length} {plural(row.original.items.length, TIPOS[tipo].item, TIPOS[tipo].items)}
      </Text>
    ),
  },
]
const COLUMNAS_NUEVAS: Record<TipoPlan, DataGridListConfig<Asignacion>['columns']> = {
  contenidos: columnasNuevas('contenidos'),
  competencias: columnasNuevas('competencias'),
}

export function FormularioPlan() {
  const { id } = useParams()
  usePlanes()
  const navigate = useNavigate()
  const plan = id ? buscarPlan(id) : undefined

  // «Plan no encontrado» (el 404 del plan).
  if (id && !plan) {
    return (
      <PageShell>
        <PageContent>
          <PantallaDeError error={registroQueNoExiste('este plan', 'planes')} onAccion={() => navigate(rutaPlan())} />
        </PageContent>
      </PageShell>
    )
  }
  return <Formulario key={plan?.id ?? 'nuevo'} plan={plan} />
}

function Formulario({ plan }: { plan?: Plan }) {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  // `volverA`: desde el detalle del plan, al guardar o cancelar se vuelve a él; si no, a la lista.
  const estado = useLocation().state as { borrador?: Borrador; volverA?: string } | null
  const borrador = estado?.borrador
  const tipo: TipoPlan = plan?.tipo ?? (parametros.get('tipo') === 'competencias' ? 'competencias' : 'contenidos')
  const textos = TIPOS[tipo]
  const lista = tipo === 'competencias' ? `${rutaPlan()}?tipo=competencias` : rutaPlan()
  const volver = estado?.volverA ?? lista
  const agente = useAgente()

  const [nombre, setNombre] = useState(plan?.nombre ?? borrador?.nombre ?? '')
  const [inicio, setInicio] = useState<Date | undefined>(plan ? aFecha(plan.inicio) : borrador ? aFecha(borrador.inicio) : undefined)
  const [fin, setFin] = useState<Date | undefined>(plan ? aFecha(plan.fin) : borrador ? aFecha(borrador.fin) : undefined)
  const [horas, setHoras] = useState(plan?.horas ?? 1)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(plan?.asignaciones ?? borrador?.asignaciones ?? [])
  const [quitados, setQuitados] = useState<string[]>(plan?.quitados ?? [])
  const [itemsPersona, setItemsPersona] = useState<Record<string, string[]>>(plan?.itemsPersona ?? {})
  const [extras, setExtras] = useState<NonNullable<Plan['extras']>>(plan?.extras ?? [])
  const [sinGuardar, setSinGuardar] = useState(Boolean(borrador))
  const [intento, setIntento] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [agregando, setAgregando] = useState<number | null>(null)
  const [editandoAsignacion, setEditandoAsignacion] = useState<{ asignacion: Asignacion; vez: number } | null>(null)
  const [paginaNuevas, setPaginaNuevas] = useState(1)
  const [porPaginaNuevas, setPorPaginaNuevas] = useState(10)
  const [quitandoAsignacion, setQuitandoAsignacion] = useState<Asignacion | null>(null)
  const [agregandoUsuario, setAgregandoUsuario] = useState<{ titulo: string; vez: number } | null>(null)
  const [reemplazando, setReemplazando] = useState<{ de: string; a: string } | null>(null)
  const [eliminandoItem, setEliminandoItem] = useState<string | null>(null)
  const [eliminandoPlan, setEliminandoPlan] = useState(false)
  // Editar por persona, como en UBITS (⋮ de cada persona: «Gestionar contenidos» y «Eliminar usuario del plan»).
  const [gestionando, setGestionando] = useState<{ id: string; nombre: string; vez: number } | null>(null)
  const [quitandoPersona, setQuitandoPersona] = useState<{ id: string; nombre: string } | null>(null)
  const [buscandoPersona, setBuscandoPersona] = useState('')


  // En edición, un plan que ya empezó no cambia su fecha de inicio (como en UBITS): por eso, solo entonces, las fechas
  // van en dos campos (el de inicio, bloqueado) en vez del rango de Crear.
  const empezo = plan ? diasDesde(plan.inicio) >= 0 && plan.estado !== 'Planeado' : false
  const tocar = () => setSinGuardar(true)

  // El plan tal como va quedando: lo que ven la tabla y el agente.
  const borradorPlan: Plan = {
    id: plan?.id ?? 'nuevo',
    nombre,
    tipo,
    estado: plan?.estado ?? 'Planeado',
    inicio: inicio ? aIso(inicio) : aIso(HOY),
    fin: fin ? aIso(fin) : aIso(HOY),
    horas,
    asignaciones,
    quitados,
    itemsPersona,
    extras,
    tocado: 0,
  }
  const personas = personasDelPlan(borradorPlan)

  const Items = textos.items.charAt(0).toUpperCase() + textos.items.slice(1)
  const itemsPlan = itemsDelPlan(borradorPlan)

  // Como en UBITS: en cuanto se toca un campo, los obligatorios que faltan se marcan con su mensaje (no se espera a
  // «Guardar»). El nombre es obligatorio en el producto.
  const validando = intento || sinGuardar
  const errorNombre = nombre.trim() ? undefined : 'El nombre es obligatorio.'
  const errorInicio = inicio ? undefined : 'La fecha de inicio es obligatoria.'
  const errorFin = !fin ? 'La fecha de finalización es obligatoria.' : inicio && fin < inicio ? 'Tiene que ser igual o posterior a la fecha de inicio.' : undefined
  const sinAsignaciones = personas.length ? undefined : `Agrega al menos una asignación con ${tipo === 'competencias' ? 'una competencia' : 'un contenido'}.`
  const falta = [...(errorNombre ? ['El nombre'] : []), ...(errorInicio ? ['La fecha de inicio'] : []), ...(errorFin ? ['La fecha de finalización'] : []), ...(sinAsignaciones ? ['Al menos una asignación'] : [])]

  // Crear y editar preguntan antes de salir si hay algo sin guardar.
  const salir = () => (sinGuardar ? setSaliendo(true) : navigate(volver))

  const guardar = () => {
    if (falta.length || !inicio || !fin) {
      setIntento(true)
      return
    }
    const datos = {
      nombre: nombre.trim(),
      inicio: aIso(inicio),
      fin: aIso(fin),
      horas: tipo === 'competencias' ? horas : undefined,
      asignaciones,
      quitados,
      itemsPersona,
      extras,
      tocado: Date.now(),
    }
    if (plan) {
      cambiarPlanes((todos) => todos.map((p) => (p.id === plan.id ? { ...p, ...datos } : p)))
      notify(`${textos.singular} actualizado.`, plan.estado === 'Vigente' ? `Los cambios ya llegan a las ${personas.length.toLocaleString('es-CO')} personas.` : undefined)
    } else {
      cambiarPlanes((todos) => [{ id: `p-${Date.now()}`, tipo, estado: 'Planeado', ...datos }, ...todos])
      notify(`${textos.singular} guardado correctamente.`, `Queda Planeado y llega a ${personas.length.toLocaleString('es-CO')} personas el ${fechaCorta(datos.inicio)}.`)
    }
    navigate(volver)
  }

  const agregarAsignacion = (asignacion: Asignacion) => {
    setAsignaciones((todas) => [...todas, asignacion])
    tocar()
    setIntento(false)
  }

  const editarAsignacion = (nueva: Asignacion) => {
    setAsignaciones((todas) => todas.map((a) => (a.id === nueva.id ? nueva : a)))
    tocar()
    notify('Asignación actualizada', `${aQuien(nueva)} · ${nueva.items.length} ${plural(nueva.items.length, textos.item, textos.items)}.`)
  }

  const quitarAsignacion = (idAsignacion: string) => {
    setAsignaciones((todas) => todas.filter((a) => a.id !== idAsignacion))
    tocar()
  }

  // ── Acciones masivas del tab Contenidos / Competencias (HU-LMS-015/021) ──
  const conQuienes = (titulo: string) => itemsDelPlan(borradorPlan).find((i) => i.titulo === titulo)?.personas.map((p) => usuarioIdDe(p.id)) ?? []
  const aplicarCambios = (cambios: Pick<Plan, 'asignaciones' | 'itemsPersona' | 'extras'>) => {
    setAsignaciones(cambios.asignaciones)
    setItemsPersona(cambios.itemsPersona ?? {})
    setExtras(cambios.extras ?? [])
    tocar()
  }
  const aplicarUsuariosA = (titulo: string, usuarios: string[]) => {
    const { bloqueados, ...cambios } = aplicarUsuarios(borradorPlan, titulo, usuarios, tipo === 'competencias' ? MAXIMO_COMPETENCIAS : undefined)
    aplicarCambios(cambios)
    if (bloqueados.length) {
      notify('Máximo 8 competencias por asignación.', `${bloqueados.slice(0, 3).join(', ')}${bloqueados.length > 3 ? ` y ${bloqueados.length - 3} más` : ''} ya ${plural(bloqueados.length, 'tiene', 'tienen')} 8 y no ${plural(bloqueados.length, 'recibió', 'recibieron')} «${titulo}».`)
    } else notify(`«${titulo}» actualizado`, `Lo ${plural(usuarios.length, 'tiene', 'tienen')} ${usuarios.length.toLocaleString('es-CO')} ${plural(usuarios.length, 'persona', 'personas')}.`)
    setAgregandoUsuario(null)
  }
  const opcionesReemplazo = (de: string) => {
    const enElPlan = new Set(itemsDelPlan(borradorPlan).map((i) => i.titulo))
    // RN-07: el selector excluye el ítem actual.
    return (tipo === 'competencias' ? CATALOGO_COMPETENCIAS : CONTENIDOS).map((c) => c.titulo).filter((t) => t !== de).sort((a, b) => Number(enElPlan.has(a)) - Number(enElPlan.has(b)))
  }

  // Quienes ya tienen el plan, sin contar la asignación que se está editando (sus personas se vuelven a ofrecer).
  const yaAsignados = (sin?: string) =>
    asignaciones.filter((a) => a.id !== sin).flatMap((a) => (a.alcance === 'empresa' ? ['Toda la empresa'] : a.alcance === 'colaboradores' ? a.destinatarios : []))

  const configNuevas: DataGridListConfig<Asignacion> = {
    columns: COLUMNAS_NUEVAS[tipo],
    actions: {
      item: [
        {
          id: 'editar',
          label: 'Editar',
          icon: <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />,
          onClick: (filas) => filas[0] && setEditandoAsignacion({ asignacion: filas[0], vez: Date.now() }),
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />,
          onClick: (filas) => filas[0] && setQuitandoAsignacion(filas[0]),
        },
      ],
      primary: { id: 'agregar', label: 'Agregar asignación', icon: <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />, onClick: () => setAgregando(Date.now()) },
    },
    frame: {
      title: plan ? 'Asignaciones' : 'Nuevas asignaciones',
      description: plan
        ? `${personas.length.toLocaleString('es-CO')} ${plural(personas.length, 'persona', 'personas')} en ${asignaciones.length} ${plural(asignaciones.length, 'asignación', 'asignaciones')}`
        : 'Asignaciones pendientes, selecciona «Guardar» para completar.',
      toolbar: 'header',
    },
  }

  const botonAgregar = (principal: boolean) => (
    <Button variant={principal ? 'default' : 'outline'} onClick={() => setAgregando(Date.now())}>
      <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
      Agregar asignación
    </Button>
  )

  // ── Los datos del plan ──
  // Las fechas van en un solo rango, como al crear, salvo al editar un plan que ya empezó: ahí la de inicio se bloquea y
  // van en dos campos.
  const fechasSeparadas = Boolean(plan) && empezo

  const campos = (separadas: boolean) => (
    <div
      className={
        // Al crear, en dos filas (1 oct): el nombre arriba y las fechas debajo; en competencias, o con las fechas en dos
        // campos, la segunda fila se reparte en dos columnas.
        separadas || tipo === 'competencias'
          ? 'grid items-start gap-5 @2xl:grid-cols-2 [&>*:first-child]:@2xl:col-span-2'
          : 'grid items-start gap-5'
      }
    >
      <Field data-invalid={validando && errorNombre ? 'true' : undefined}>
        <FieldLabel htmlFor="plan-nombre">{tipo === 'competencias' ? 'Nombre del plan' : 'Nombre'}</FieldLabel>
        <Input
          id="plan-nombre"
          value={nombre}
          maxLength={120}
          aria-invalid={validando && errorNombre ? true : undefined}
          placeholder={tipo === 'competencias' ? 'Ej.: Liderazgo para mandos medios' : 'Ej.: Inducción cohorte octubre'}
          onChange={(evento) => {
            setNombre(evento.target.value)
            tocar()
          }}
        />
        {validando && errorNombre ? <FieldError>{errorNombre}</FieldError> : null}
      </Field>
      {separadas ? (
        <>
          <Field data-invalid={validando && errorInicio ? 'true' : undefined}>
            <FieldLabel htmlFor="plan-inicio">Fecha de inicio</FieldLabel>
            <CampoFecha
              id="plan-inicio"
              valor={inicio}
              desde={HOY}
              deshabilitado={empezo}
              invalido={validando && Boolean(errorInicio)}
              onCambio={(fecha) => {
                setInicio(fecha)
                tocar()
              }}
            />
            {validando && errorInicio ? (
              <FieldError>{errorInicio}</FieldError>
            ) : (
              <FieldDescription>{empezo ? 'No cambia: el plan ya inició.' : 'Igual o mayor a hoy.'}</FieldDescription>
            )}
          </Field>
          <Field data-invalid={validando && errorFin ? 'true' : undefined}>
            <FieldLabel htmlFor="plan-fin">{tipo === 'competencias' ? 'Fecha de cierre' : 'Fecha de finalización'}</FieldLabel>
            <CampoFecha
              id="plan-fin"
              valor={fin}
              desde={inicio ?? HOY}
              invalido={validando && Boolean(errorFin)}
              onCambio={(fecha) => {
                setFin(fecha)
                tocar()
              }}
            />
            {validando && errorFin ? <FieldError>{errorFin}</FieldError> : <FieldDescription>Mayor o igual a la de inicio.</FieldDescription>}
          </Field>
        </>
      ) : (
        // Las dos fechas de una vez (revisión de David, 30 sep: «el que tiene para seleccionar las dos fechas»). Al
        // editar un plan que ya empezó van separadas: la de inicio se bloquea.
        <Field data-invalid={validando && (errorInicio || errorFin) ? 'true' : undefined}>
          <FieldLabel htmlFor="plan-fechas">Fechas del plan</FieldLabel>
          <RangoDeFechas
            id="plan-fechas"
            valor={inicio ? { from: inicio, to: fin } : undefined}
            desde={HOY}
            placeholder="Elige inicio y fin"
            invalido={validando && Boolean(errorInicio || errorFin)}
            onCambio={(rango) => {
              setInicio(rango?.from)
              setFin(rango?.to)
              tocar()
            }}
          />
          {validando && (errorInicio || errorFin) ? (
            <FieldError>{errorInicio ? 'Elige las fechas de inicio y fin.' : errorFin}</FieldError>
          ) : (
            <FieldDescription>Desde hoy. La de fin, igual o posterior a la de inicio.</FieldDescription>
          )}
        </Field>
      )}
      {tipo === 'competencias' ? (
        <Field>
          <FieldLabel htmlFor="plan-horas">Horas de estudio por competencia</FieldLabel>
          {/* RN-02: un solo valor para todo el plan. En UBITS se elige de 1 a 12 horas. */}
          <Select
            value={String(horas)}
            onValueChange={(valor) => {
              setHoras(Number(valor))
              tocar()
            }}
          >
            <SelectTrigger id="plan-horas" className="w-full">
              <SelectValue>{(valor: string) => `${valor} ${plural(Number(valor), 'hora', 'horas')}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {HORAS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h} {plural(h, 'hora', 'horas')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Vale para todas las competencias del plan.</FieldDescription>
        </Field>
      ) : null}
    </div>
  )

  // Cada contenido o competencia del plan en la tarjeta de contenido del equipo (decisión 17 de la auditoría, 5-oct), con
  // a cuántas personas les llega en la esquina de la portada. Con `conAcciones`, su menú: las acciones masivas de
  // HU-LMS-015/021.
  const tarjetas = (columnas: string, conAcciones: boolean) => (
    <div className={`grid gap-3 ${columnas}`}>
      {itemsPlan.map((item) => (
        <TarjetaContenido
          key={item.titulo}
          {...fichaDe(tipo, item.titulo, { horas: tipo === 'competencias' ? horas : undefined, enfoque: enfoqueDe(borradorPlan, item.titulo) })}
          className="h-full"
          encimaIzquierda={
            <span className="inline-flex rounded-sm bg-card">
              <Badge variant="secondary" size="xs" className="font-normal tabular-nums">
                {item.personas.length.toLocaleString('es-CO')} {plural(item.personas.length, 'persona', 'personas')}
              </Badge>
            </span>
          }
          acciones={
            conAcciones ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${item.titulo}`} />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setAgregandoUsuario({ titulo: item.titulo, vez: Date.now() })}>
                      <HugeiconsIcon icon={UserAdd01Icon} aria-hidden="true" />
                      Agregar usuario
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setReemplazando({ de: item.titulo, a: '' })}>
                      <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} aria-hidden="true" />
                      Reemplazar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setEliminandoItem(item.titulo)}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : undefined
          }
        />
      ))}
    </div>
  )

  const vacioAsignaciones = (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={CheckListIcon} size={20} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Sin asignaciones</EmptyTitle>
        <EmptyDescription>
          Aún no has asignado {textos.items}. Agrega una asignación para elegir a quién le llega el plan y con qué {textos.items}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {botonAgregar(true)}
        {intento && sinAsignaciones ? (
          <Text as="p" size="sm" variant="destructive" role="alert">
            {sinAsignaciones}
          </Text>
        ) : null}
      </EmptyContent>
    </Empty>
  )

  const q = buscandoPersona.trim().toLowerCase()
  const personasEncontradas = personas.filter((p) => !q || `${p.nombre} ${p.area}`.toLowerCase().includes(q))
  const listaPersonas = (
    <div className="flex flex-col gap-3">
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput value={buscandoPersona} onChange={(evento) => setBuscandoPersona(evento.target.value)} placeholder="Buscar persona o área" aria-label="Buscar persona o área" />
      </InputGroup>
      <ItemGroup className="gap-1">
        {personasEncontradas.slice(0, 50).map((p) => (
          <Item key={p.id} size="xs">
            {/* La fila de persona del sistema (decisión 21 de la auditoría, 5-oct). */}
            <ItemContent className="min-w-0">
              <Persona nombre={p.nombre} detalle={`${p.area} · ${p.total} ${plural(p.total, textos.item, textos.items)}${itemsPersona[p.id] ? ' · propios' : ''}`} />
            </ItemContent>
            <ItemActions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${p.nombre}`} />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setGestionando({ id: p.id, nombre: p.nombre, vez: Date.now() })}>
                      <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                      Gestionar {textos.items}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setQuitandoPersona({ id: p.id, nombre: p.nombre })}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Eliminar usuario del plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {personasEncontradas.length > 50 ? (
        <Text as="p" variant="muted" size="sm">
          Viendo 50 de {personasEncontradas.length.toLocaleString('es-CO')}. Busca para acotar.
        </Text>
      ) : !personasEncontradas.length ? (
        <Text as="p" variant="muted" size="sm">
          Nadie del plan coincide con «{buscandoPersona.trim()}».
        </Text>
      ) : null}
    </div>
  )

  const dialogos = (
    <>
        {gestionando ? (
          <PanelCatalogo
            key={gestionando.vez}
            abierto
            onAbiertoChange={(abierto) => (abierto ? undefined : setGestionando(null))}
            tipo={tipo}
            para={`Solo para ${gestionando.nombre}. Las demás personas de su asignación no cambian.`}
            elegidos={itemsDe(borradorPlan, gestionando.id)}
            onGuardar={(items) => {
              setItemsPersona((actuales) => ({ ...actuales, [gestionando.id]: items }))
              tocar()
              notify(`${Items} de ${gestionando.nombre} actualizados`, `${items.length} ${plural(items.length, textos.item, textos.items)}. Se aplican al guardar el plan.`)
              setGestionando(null)
            }}
          />
        ) : null}

        <DialogoConfirmar
          abierto={quitandoPersona !== null}
          onAbiertoChange={(abierto) => (abierto ? undefined : setQuitandoPersona(null))}
          size="sm"
          icono={Delete02Icon}
          titulo="Eliminar usuario del plan"
          descripcion={quitandoPersona ? `¿Deseas eliminar a ${quitandoPersona.nombre} del plan? Deja de verlo en su Zona de estudio; lo que ya avanzó se conserva.` : ''}
          accion="Eliminar"
          destructiva
          onConfirmar={() => {
            if (quitandoPersona) setQuitados((actuales) => [...actuales, quitandoPersona.id])
            tocar()
            setQuitandoPersona(null)
          }}
        />

        {agregando !== null ? (
          <AgregarAsignacion
            key={agregando}
            abierto
            onAbiertoChange={(abierto) => (abierto ? undefined : setAgregando(null))}
            tipo={tipo}
            yaAsignados={yaAsignados()}
            onAgregar={agregarAsignacion}
          />
        ) : null}

        {editandoAsignacion ? (
          <AgregarAsignacion
            key={editandoAsignacion.vez}
            abierto
            onAbiertoChange={(abierto) => (abierto ? undefined : setEditandoAsignacion(null))}
            tipo={tipo}
            yaAsignados={yaAsignados(editandoAsignacion.asignacion.id)}
            inicial={editandoAsignacion.asignacion}
            onAgregar={editarAsignacion}
          />
        ) : null}

        {/* Quitar una asignación completa se confirma: se pierden todas sus personas. */}
        <DialogoConfirmar
          abierto={quitandoAsignacion !== null}
          onAbiertoChange={(abierto) => (abierto ? undefined : setQuitandoAsignacion(null))}
          size="sm"
          icono={Delete02Icon}
          titulo="Eliminar asignación"
          descripcion={
            quitandoAsignacion
              ? `¿Deseas eliminar esta asignación? Tipo de asignación: ${resumenAsignacion(quitandoAsignacion)}${quitandoAsignacion.alcance === 'empresa' ? '' : ` (${aQuien(quitandoAsignacion)})`}. ${textos.items.charAt(0).toUpperCase() + textos.items.slice(1)} asignados: ${quitandoAsignacion.items.length}.${plan ? ' Esas personas dejan de recibir el plan.' : ''}`
              : ''
          }
          accion="Eliminar"
          destructiva
          onConfirmar={() => {
            if (quitandoAsignacion) quitarAsignacion(quitandoAsignacion.id)
            setQuitandoAsignacion(null)
          }}
        />

        {/* Salir con cambios: tres salidas, en el tamaño normal y con el mismo texto que Nuevo grupo (reglas vigentes, 5-oct). */}
        <DialogoConfirmar
          abierto={saliendo}
          onAbiertoChange={setSaliendo}
          icono={Logout03Icon}
          titulo="¿Salir sin guardar los cambios?"
          descripcion="Si sales ahora, se pierde lo que cambiaste. Puedes guardarlo antes de salir."
          cancelar="Seguir editando"
          otra={{
            texto: 'Salir sin guardar',
            onClick: () => {
              setSaliendo(false)
              navigate(volver)
            },
          }}
          accion="Guardar y salir"
          onConfirmar={() => {
            setSaliendo(false)
            guardar()
          }}
        >
          <RegistroConfirmar nombre={nombre.trim() || `${textos.singular} sin nombre`} detalle={plan ? `${textos.singular} · en edición` : `${textos.singular} · nuevo`} estado="Cambios sin guardar" />
        </DialogoConfirmar>

        {/* RN-04: «Agregar usuario» de un ítem. Quienes ya lo tienen salen marcados; desmarcarlos se lo quita. */}
        {agregandoUsuario ? (
          <PanelIntegrantes
            key={agregandoUsuario.vez}
            abierto
            onAbiertoChange={(abierto) => (abierto ? undefined : setAgregandoUsuario(null))}
            titulo="Agregar usuario"
            grupo=""
            descripcion={`Quienes tienen «${agregandoUsuario.titulo}». Quien no está en el plan entra con este ${textos.item}.`}
            elegidos={conQuienes(agregandoUsuario.titulo)}
            accion="Aplicar"
            onGuardar={(usuarios) => aplicarUsuariosA(agregandoUsuario.titulo, usuarios)}
          />
        ) : null}

        {/* RN-06 y RN-07: reemplazar es 1→1, para todas las personas que lo tenían; el ítem actual no se ofrece. */}
        <DialogoConfirmar
          abierto={reemplazando !== null}
          onAbiertoChange={(abierto) => (abierto ? undefined : setReemplazando(null))}
          icono={ArrowDataTransferHorizontalIcon}
          titulo={`Reemplazar ${textos.item}`}
          descripcion={reemplazando ? `«${reemplazando.de}» se cambia por el que elijas en todas las personas que lo tienen. Quien ya tenía el nuevo no lo recibe dos veces.` : ''}
          accion="Reemplazar"
          deshabilitada={!reemplazando?.a}
          onConfirmar={() => {
            if (!reemplazando?.a) return
            aplicarCambios(reemplazarItem(borradorPlan, reemplazando.de, reemplazando.a))
            notify(`${textos.item.charAt(0).toUpperCase() + textos.item.slice(1)} reemplazado`, `«${reemplazando.de}» ahora es «${reemplazando.a}».`)
            setReemplazando(null)
          }}
        >
          {reemplazando ? (
            <Field>
              <FieldLabel htmlFor="reemplazo">{`Nuevo ${textos.item}`}</FieldLabel>
              <Select value={reemplazando.a || null} onValueChange={(valor) => setReemplazando({ ...reemplazando, a: String(valor ?? '') })}>
                <SelectTrigger id="reemplazo" className="w-full">
                  <SelectValue placeholder={`Elige un ${textos.item}`} />
                </SelectTrigger>
                <SelectContent>
                  {opcionesReemplazo(reemplazando.de).map((titulo) => (
                    <SelectItem key={titulo} value={titulo}>
                      {titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </DialogoConfirmar>

        {/* RN-08: eliminar un ítem se confirma; se quita a todas las personas del plan. */}
        <DialogoConfirmar
          abierto={eliminandoItem !== null}
          onAbiertoChange={(abierto) => (abierto ? undefined : setEliminandoItem(null))}
          size="sm"
          icono={Delete02Icon}
          titulo={`¿Eliminar este ${textos.item} del plan?`}
          descripcion={eliminandoItem ? `«${eliminandoItem}» se quita a las ${conQuienes(eliminandoItem).length.toLocaleString('es-CO')} personas que lo tienen. Lo que ya avanzaron se conserva.` : ''}
          accion="Eliminar"
          destructiva
          onConfirmar={() => {
            if (!eliminandoItem) return
            aplicarCambios(eliminarItem(borradorPlan, eliminandoItem))
            notify(`${textos.item.charAt(0).toUpperCase() + textos.item.slice(1)} eliminado del plan`, `«${eliminandoItem}» ya no le llega a nadie.`)
            setEliminandoItem(null)
          }}
        />

        {plan ? (
          <ConfirmarEliminar
            abierto={eliminandoPlan}
            onAbiertoChange={setEliminandoPlan}
            cantidad={1}
            sustantivo={['plan', 'planes']}
            titulo="Eliminar plan de formación"
            descripcion={`¿Deseas eliminar «${plan.nombre}»? ${personas.length.toLocaleString('es-CO')} ${plural(personas.length, 'persona lo pierde', 'personas lo pierden')} de su Zona de estudio. Su avance se conserva, pero el plan no se puede recuperar.`}
            accion="Eliminar plan"
            onConfirmar={() => {
              cambiarPlanes((todos) => todos.filter((p) => p.id !== plan.id))
              notify('Plan eliminado', `«${plan.nombre}» ya no aparece en la Zona de estudio de nadie.`)
              navigate(lista)
            }}
          />
        ) : null}
    </>
  )

  // ── Crear y editar: una sola pantalla (1 oct: «simplifiquemos la creación en una sola pantalla sin pasos») ──
  // Arriba los datos, debajo las asignaciones y lo que reciben; «Así va el plan» a la derecha dice qué falta y
  // «Guardar» valida todo de una vez. Editar es esta misma página con el plan cargado (decisión 5 de la auditoría, 5-oct).
  return (
    <PageShell>
      {/* Como el asistente de referencia (Crear vacante; reglas vigentes del 5-oct): sin flecha junto al título, un solo
          «Salir de la creación» a su derecha, que pasa por el mismo freno de cambios sin guardar, y Orbit Flow de último. */}
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Aprendizaje' },
          { label: 'Planes de formación', path: lista },
          { label: `${plan ? 'Editar' : 'Crear'} ${textos.singular.toLowerCase()}` },
        ]}
        title={plan ? `Editar ${textos.singular.toLowerCase()}` : textos.singular}
        description={plan ? 'Al guardar, los cambios llegan a las personas del plan.' : 'Ponle nombre y fechas, y asígnalo a quienes lo van a tomar.'}
        actions={
          <>
            {/* Al editar, «⋯» primero con «Eliminar plan» (decisión 15 de la auditoría, 5-oct); el agente, de último. */}
            {plan ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del plan" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem variant="destructive" onClick={() => setEliminandoPlan(true)}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Eliminar plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button variant="outline" onClick={salir}>
              <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
              {plan ? 'Salir de la edición' : 'Salir de la creación'}
            </Button>
            {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent className="@container">
        {/* La anatomía de Crear contenido y Diagnóstico (David, staging): cada bloque en su marco gris con el título afuera
            y el panel «Vista previa» a la derecha. La tabla de asignaciones ya trae ese marco de fábrica. */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <Frame>
              <FrameHeader>
                <FrameTitle>Datos del plan</FrameTitle>
                <FrameDescription>Las fechas se gestionan según la zona horaria de tu compañía: America/Bogota.</FrameDescription>
              </FrameHeader>
              <FramePanel>{campos(fechasSeparadas)}</FramePanel>
            </Frame>

            {asignaciones.length ? (
              // Como en UBITS: las asignaciones quedan pendientes en su tabla hasta «Guardar».
              <TablaDatos
                config={configNuevas}
                data={asignaciones.slice((paginaNuevas - 1) * porPaginaNuevas, paginaNuevas * porPaginaNuevas)}
                paginacion={{ pagina: paginaNuevas, setPagina: setPaginaNuevas, porPagina: porPaginaNuevas, setPorPagina: setPorPaginaNuevas, total: asignaciones.length }}
                nombre="asignaciones"
                id="asignaciones-plan"
                pieSoloSiHaceFalta
              />
            ) : (
              <Frame>
                <FrameHeader>
                  <FrameTitle>Asignaciones</FrameTitle>
                  <FrameDescription>A quién le llega el plan y con qué {textos.items}.</FrameDescription>
                </FrameHeader>
                <FramePanel>{vacioAsignaciones}</FramePanel>
              </Frame>
            )}

            {itemsPlan.length ? (
              <Frame>
                <FrameHeader>
                  <FrameTitle>
                    {Items}: {itemsPlan.length}
                  </FrameTitle>
                  <FrameDescription>Lo que recibe cada persona del plan.</FrameDescription>
                </FrameHeader>
                <FramePanel>{tarjetas('@xl:grid-cols-2 @3xl:grid-cols-3', true)}</FramePanel>
              </Frame>
            ) : null}

            {/* Al editar, cada persona del plan (revisión de David, 30 sep; así lo hace UBITS al editar): al guardar, el
                plan convierte cada asignación en personas, y a cada una se le pueden cambiar sus contenidos o sacarla. */}
            {plan && personas.length ? (
              <Frame>
                <FrameHeader>
                  <FrameTitle>Personas: {personas.length.toLocaleString('es-CO')}</FrameTitle>
                  <FrameDescription>A quién le llega el plan. Cambia los {textos.items} de una persona o sácala del plan.</FrameDescription>
                </FrameHeader>
                <FramePanel>{listaPersonas}</FramePanel>
              </Frame>
            ) : null}
          </div>
          <aside aria-label="Vista previa del plan" className="lg:sticky lg:top-6">
            <ResumenPlan
              nombre={nombre.trim()}
              tipo={textos.singular}
              filas={[
                ...(inicio && fin && !errorFin ? [{ termino: 'Fechas', valor: `${fechaCorta(aIso(inicio))} – ${fechaCorta(aIso(fin))}` }] : []),
                ...(tipo === 'competencias' ? [{ termino: 'Horas por competencia', valor: `${horas} ${plural(horas, 'hora', 'horas')}` }] : []),
                ...(asignaciones.length
                  ? [
                      { termino: 'Asignaciones', valor: asignaciones.length.toLocaleString('es-CO') },
                      { termino: 'Personas', valor: personas.length.toLocaleString('es-CO') },
                      { termino: Items, valor: itemsPlan.length.toLocaleString('es-CO') },
                    ]
                  : []),
              ]}
              falta={[...(errorNombre ? ['Nombre del plan'] : []), ...(errorInicio || errorFin ? ['Fechas del plan'] : []), ...(sinAsignaciones ? ['Al menos una asignación'] : [])]}
              total={3}
            />
          </aside>
        </div>

        {/* La barra fija de abajo (war room, 28 sep): se guarda con «Guardar». A la izquierda, el estado del guardado
            con la pieza del sistema (ChipGuardado): «Cambios sin guardar» en cuanto se toca algo; al editar, «Guardado»
            mientras no se haya cambiado nada. Sin «Cancelar»: se sale con «Salir de la creación», arriba. */}
        <PageActionBar>
          <span role="status" className="flex items-center gap-2">
            {sinGuardar ? <ChipGuardado estado="editando" /> : plan ? <ChipGuardado estado="guardado" /> : null}
          </span>
          <Button className="ml-auto" onClick={guardar}>
            Guardar
          </Button>
        </PageActionBar>
      </PageContent>

      {dialogos}

      {agente.portal(
        <AgentePlanes
          pantalla="formulario"
          tipo={tipo}
          nombre={nombre}
          asignaciones={asignaciones}
          falta={falta}
          onAgregar={agregarAsignacion}
          onQuitar={quitarAsignacion}
          onClose={agente.cerrar}
        />,
      )}
    </PageShell>
  )
}
