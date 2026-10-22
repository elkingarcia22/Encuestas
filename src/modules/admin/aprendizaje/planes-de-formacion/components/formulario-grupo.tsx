import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Logout03Icon, MoreHorizontalIcon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  Text,
  Textarea,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { SinResultados } from '@/shared/components/SinResultados'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { ConfirmarEliminar } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { HOY, plural } from '@/modules/design-system/patrones/formato'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { buscarGrupo, cambiarGrupos, nombreCompleto, useGrupos, usuarioDe, type Grupo, type Usuario } from './grupos-datos'
import { AgenteGrupos, useAgente } from './agente-aprendizaje'
import { planesConGrupo, rutaGrupo } from './lista-grupos'
import { PanelIntegrantes } from './panel-integrantes'
import { cambiarPlanes, ordenarPor, usePlanes } from './planes-datos'

// Nuevo grupo (/…/grupos/crear) y «Edición de grupo» (/…/grupos/:id), como en UBITS (/creator/groups/form): no hay
// detalle aparte, la página del grupo es su edición, con «Gestionar integrantes» arriba y «Guardar» abajo. HU-LMS-006: nombre (máximo 250), descripción
// opcional e integrantes elegidos en un panel. Un grupo puede guardarse sin integrantes (RN-02).
//
// Cambio frente a hoy: el nombre es obligatorio. Hoy «Guardar» confirma siempre, aun vacío, y un grupo sin nombre no
// se puede encontrar después al asignar un plan.

const MAXIMO_NOMBRE = 250

type FilaUsuario = Usuario & { nombre: string }

// Los textos largos (un líder con cuatro nombres, «Táctico sin personal a cargo») bajan de línea: así la tabla no se
// estira más allá de su ancho.
const texto = (valor: string, apagado = false) => (
  <Text as="span" size="sm" variant={apagado ? 'muted' : undefined} className="block whitespace-normal">
    {valor}
  </Text>
)

const COLUMNAS_USUARIOS: DataGridListConfig<FilaUsuario>['columns'] = [
  { accessorKey: 'nombre', header: 'Nombre', size: 250, ...SIN_ARRASTRE, cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.username} /> },
  { accessorKey: 'correo', header: 'Correo', size: 210, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.correo) },
  { accessorKey: 'area', header: 'Área', size: 120, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.area) },
  { accessorKey: 'lider', header: 'Líder', size: 160, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.lider || '—', !row.original.lider) },
  { accessorKey: 'nivel', header: 'Nivel', size: 150, ...SIN_ARRASTRE, cell: ({ row }) => texto(row.original.nivel) },
]

export function FormularioGrupo() {
  const { id } = useParams()
  useGrupos()
  const navigate = useNavigate()
  const grupo = id ? buscarGrupo(id) : undefined

  if (id && !grupo) {
    return (
      <PageShell>
        <PageContent>
          <PantallaDeError error={registroQueNoExiste('este grupo', 'grupos')} onAccion={() => navigate(rutaGrupo())} />
        </PageContent>
      </PageShell>
    )
  }
  return <Formulario key={grupo?.id ?? 'nuevo'} grupo={grupo} />
}

function Formulario({ grupo }: { grupo?: Grupo }) {
  const navigate = useNavigate()
  const volver = rutaGrupo()
  const [nombre, setNombre] = useState(grupo?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(grupo?.descripcion ?? '')
  const [integrantes, setIntegrantes] = useState<string[]>(grupo?.integrantes ?? [])
  const [sinGuardar, setSinGuardar] = useState(false)
  const [intento, setIntento] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [panel, setPanel] = useState<{ vez: number } | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [eliminando, setEliminando] = useState(false)
  const planes = usePlanes()
  const grupos = useGrupos()
  const agente = useAgente()

  const errorNombre = nombre.trim() ? undefined : 'Ponle un nombre para encontrarlo al asignar un plan.'
  const q = busqueda.trim().toLowerCase()
  const resultadoUsuarios = ordenarPor(
    integrantes
      .map((idUsuario) => usuarioDe(idUsuario))
      .filter((u) => u !== undefined)
      .map((u) => ({ ...u, nombre: nombreCompleto(u) }))
      .filter((u) => !q || `${u.nombre} ${u.cargo} ${u.area}`.toLowerCase().includes(q)),
    orden,
  )
  const visiblesUsuarios = resultadoUsuarios.slice((pagina - 1) * porPagina, pagina * porPagina)
  const quitarIntegrantes = (ids: string[]) => {
    setIntegrantes((todos) => todos.filter((x) => !ids.includes(x)))
    setSinGuardar(true)
  }

  const config: DataGridListConfig<FilaUsuario> = {
    columns: COLUMNAS_USUARIOS,
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar integrante',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    // Quitar a una persona desde su menú, o a varias eligiéndolas: nada se guarda hasta «Guardar».
    selection: { onSelectionChange: () => undefined },
    actions: {
      item: [
        {
          id: 'quitar',
          label: 'Quitar del grupo',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />,
          onClick: (filas) => quitarIntegrantes(filas.map((f) => f.id)),
        },
      ],
      bulk: [
        {
          id: 'quitar',
          label: 'Quitar del grupo',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />,
          onClick: (filas) => {
            quitarIntegrantes(filas.map((f) => f.id))
            setVersion((v) => v + 1)
          },
        },
      ],
    },
    emptyState: {
      type: 'no-results',
      customComponent: (
        <SinResultados
          busqueda={busqueda}
          onLimpiar={() => {
            setBusqueda('')
            setVersion((v) => v + 1)
          }}
        />
      ),
    },
    // «Integrantes» en todo Grupos, como en la HU (war room, 28 sep: la lista decía «Integrantes» y la edición «Lista de
    // usuarios · N resultados»).
    frame: { title: 'Integrantes', toolbar: 'header' },
    labels: { resultCount: (_visibles, total) => `${total} ${plural(total, 'integrante', 'integrantes')}` },
  }

  const salir = () => (sinGuardar ? setSaliendo(true) : navigate(volver))

  const cerrarPanel = () => {
    setCerrando(true)
    window.setTimeout(() => {
      setPanel(null)
      setCerrando(false)
    }, 250)
  }

  const guardar = () => {
    if (errorNombre) {
      setIntento(true)
      return
    }
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim(), integrantes, actualizado: HOY.toISOString().slice(0, 10), tocado: Date.now() }
    if (grupo) {
      cambiarGrupos((todos) => todos.map((g) => (g.id === grupo.id ? { ...g, ...datos } : g)))
      // Los planes guardan el grupo por su nombre: si cambia, se cambia también allá.
      if (datos.nombre !== grupo.nombre) {
        cambiarPlanes((planes) =>
          planes.map((p) => ({
            ...p,
            asignaciones: p.asignaciones.map((a) =>
              a.alcance === 'grupos' ? { ...a, destinatarios: a.destinatarios.map((d) => (d === grupo.nombre ? datos.nombre : d)) } : a,
            ),
          })),
        )
      }
      const detalle = `«${datos.nombre}» · ${integrantes.length} ${plural(integrantes.length, 'integrante', 'integrantes')}.`
      notify('Grupo actualizado.', detalle, 'success')
      navigate(volver)
    } else {
      const nuevo: Grupo = { id: `g-${Date.now()}`, ...datos }
      cambiarGrupos((todos) => [nuevo, ...todos])
      // RN-03: el texto de la historia.
      notify('Grupo creado correctamente.', `«${nuevo.nombre}» ya se puede elegir al asignar un plan.`, 'success')
      navigate(rutaGrupo())
    }
  }

  const gestionar = (principal: boolean) => (
    <Button variant={principal ? 'default' : 'outline'} onClick={() => setPanel({ vez: Date.now() })}>
      <HugeiconsIcon icon={UserAdd01Icon} size={16} aria-hidden="true" />
      Gestionar integrantes
    </Button>
  )
  const enPlanes = grupo ? planesConGrupo(planes, grupo).length : 0

  return (
    <PageShell>
      {/* Como el asistente de referencia (Crear vacante; reglas vigentes del 5-oct): sin flecha junto al título, un solo
          «Salir de la creación» en la fila de acciones, que pasa por el mismo freno de cambios sin guardar. */}
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Aprendizaje' },
          { label: 'Grupos', path: rutaGrupo() },
          { label: grupo ? grupo.nombre : 'Nuevo grupo' },
        ]}
        title={grupo ? 'Edición de grupo' : 'Nuevo grupo'}
        description={
          grupo
            ? enPlanes
              ? `Está en ${enPlanes} ${plural(enPlanes, 'plan', 'planes')}: quien entre o salga del grupo, entra o sale de ${plural(enPlanes, 'él', 'ellos')}.`
              : 'Todavía no está en ningún plan.'
            : 'Un grupo se arma una vez y se reutiliza en todos los planes que quieras.'
        }
        actions={
          <>
            {/* «⋯» primero, con su menú abierto hacia el inicio (decisión 15 de la auditoría, 5-oct). */}
            {grupo ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del grupo" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem variant="destructive" onClick={() => setEliminando(true)}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Eliminar grupo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {gestionar(false)}
            <BotonSalirCreacion texto={grupo ? 'Salir de la edición' : 'Salir de la creación'} onClick={salir} />
            {/* Lo de IA va de último y se abre al lado: no es otra página. */}
            {agente.disponible ? <ReopenAgentButton compact onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent>
        {/* La anatomía de bloque del formulario del plan (decisión 5 de la auditoría, 5-oct): cada bloque en su marco gris
            con el título afuera, no tarjetas blancas con el título adentro. */}
        <Frame>
          <FrameHeader>
            <FrameTitle>Datos del grupo</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <FieldGroup>
              <Field data-invalid={intento && errorNombre ? 'true' : undefined}>
                <FieldLabel htmlFor="grupo-nombre">
                  Nombre
                  <Text as="span" variant="muted" aria-hidden="true">
                    *
                  </Text>
                </FieldLabel>
                <Input
                  id="grupo-nombre"
                  value={nombre}
                  maxLength={MAXIMO_NOMBRE}
                  placeholder="Ej.: Logística Q3"
                  aria-invalid={intento && errorNombre ? true : undefined}
                  onChange={(evento) => {
                    setNombre(evento.target.value)
                    setSinGuardar(true)
                  }}
                />
                {intento && errorNombre ? (
                  <FieldError>{errorNombre}</FieldError>
                ) : (
                  <FieldDescription className="tabular-nums">
                    {nombre.length} de {MAXIMO_NOMBRE} caracteres
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="grupo-descripcion">
                  Descripción
                  <Badge variant="secondary" size="xs">
                    Opcional
                  </Badge>
                </FieldLabel>
                <Textarea
                  id="grupo-descripcion"
                  value={descripcion}
                  rows={3}
                  placeholder="Para qué se usa o quién entra: «Operaciones de bodega y distribución»."
                  onChange={(evento) => {
                    setDescripcion(evento.target.value)
                    setSinGuardar(true)
                  }}
                />
              </Field>
            </FieldGroup>
          </FramePanel>
        </Frame>

        {integrantes.length ? (
          <TablaDatos key={version} config={config} data={visiblesUsuarios} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultadoUsuarios.length }} nombre="integrantes" id="integrantes" />
        ) : (
          <Frame>
            <FrameHeader>
              <FrameTitle>Integrantes</FrameTitle>
              <FrameDescription>Puedes guardarlo sin integrantes y sumarlos después.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              {/* RN-02: el vacío con el texto de la historia. */}
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={UserGroupIcon} size={20} aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Aún no hay integrantes</EmptyTitle>
                  <EmptyDescription>Busca a las personas por nombre, cargo o área y agrégalas de una vez.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>{gestionar(true)}</EmptyContent>
              </Empty>
            </FramePanel>
          </Frame>
        )}

        {/* Guardar va en la barra fija de abajo, con el estado del guardado (acuerdo del 28-sep), con la pieza del
            sistema como en el formulario del plan (decisión 5 de la auditoría, 5-oct). Sin «Cancelar»: se sale arriba. */}
        <PageActionBar>
          <span role="status" className="flex items-center gap-2">
            {sinGuardar ? <ChipGuardado estado="editando" /> : grupo ? <ChipGuardado estado="guardado" /> : null}
          </span>
          <Button className="ml-auto" onClick={guardar}>
            Guardar
          </Button>
        </PageActionBar>
      </PageContent>

      {panel ? (
        <PanelIntegrantes
          key={panel.vez}
          abierto={!cerrando}
          onAbiertoChange={(abierto) => (abierto ? undefined : cerrarPanel())}
          titulo={integrantes.length ? 'Edición de integrantes' : 'Selección de colaboradores'}
          grupo={nombre.trim()}
          elegidos={integrantes}
          onGuardar={(ids) => {
            setIntegrantes(ids)
            setSinGuardar(true)
            cerrarPanel()
          }}
        />
      ) : null}

      {/* Salir con cambios: tres salidas, en el tamaño normal y con el mismo texto que Crear plan (reglas vigentes, 5-oct). */}
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
        <RegistroConfirmar nombre={nombre.trim() || 'Grupo sin nombre'} detalle={grupo ? 'Grupo · en edición' : 'Grupo · nuevo'} estado="Cambios sin guardar" />
      </DialogoConfirmar>
      {grupo ? (
        // RN-05: eliminar un grupo se confirma escribiendo «eliminar».
        <ConfirmarEliminar
          abierto={eliminando}
          onAbiertoChange={setEliminando}
          cantidad={1}
          sustantivo={['grupo', 'grupos']}
          titulo="Eliminar grupo"
          descripcion={`¿Deseas eliminar «${grupo.nombre}»? Sus ${grupo.integrantes.length} integrantes no se borran de la empresa${enPlanes ? `, y los ${enPlanes} ${plural(enPlanes, 'plan que lo tenía asignado conserva', 'planes que lo tenían asignado conservan')} a sus personas` : ''}.`}
          accion="Eliminar grupo"
          onConfirmar={() => {
            cambiarGrupos((todos) => todos.filter((g) => g.id !== grupo.id))
            notify('Grupo eliminado', `«${grupo.nombre}» ya no aparece al asignar planes.`, 'success')
            navigate(rutaGrupo())
          }}
        />
      ) : null}

      {agente.portal(<AgenteGrupos grupo={grupo} grupos={grupos} onClose={agente.cerrar} />)}
    </PageShell>
  )
}
