import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  Edit02Icon,
  FileEditIcon,
  LockPasswordIcon,
  Mail01Icon,
  PlusSignIcon,
  UserAdd01Icon,
  UserBlock01Icon,
  UserCheck01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  DrawerClose,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify, notifyAction } from '@/shared/components/notify'
import { SinResultados } from '@/shared/components/SinResultados'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'

import { DialogoConfirmar } from '../../../estados/confirmaciones'
import { ProcesoEnCurso } from '../../../estados/procesos'
import { Indicadores } from '../../../data-grid/casos/seguimiento'
import { fechaCorta, plural } from '../../../patrones/formato'
import { pagina, resolver, useCargaInicial, type Filtro } from '../../admin-compartido/lista'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import {
  MASIVAS,
  nombreCompleto,
  ruta,
  type AccionMasiva,
  type EstadoUsuario,
  type Usuario,
} from '../components/datos'
import { useGestion } from '../components/estado'
import {
  AccionContexto,
  BADGE_ESTADO,
  BADGE_ROL,
  BUSCAR_USUARIOS,
  COLUMNAS_USUARIOS,
  FILTROS_USUARIOS,
  type AccionFila,
} from '../components/tabla-usuarios'

// Lista de usuarios (/admin-hr/users). Columnas, búsqueda por nombre / apellido / username, menú
// por fila (Ver, Editar, Cambiar contraseña, Suspender), acciones masivas y recordatorios de
// inicio de sesión, como en la plataforma. El vacío usa el copy real («Nada por aquí»).

// El menú de cada fila, las columnas y los filtros viven en components/tabla-usuarios.tsx: la carga de pantalla de
// Estados muestra la misma tabla.

const icono = (i: typeof UserBlock01Icon) => <HugeiconsIcon icon={i} aria-hidden="true" />

// ── Ficha del usuario (Ver usuario) ──

function FichaUsuario({ usuario, onCerrar }: { usuario: Usuario | null; onCerrar: () => void }) {
  const datos: [string, string][] = usuario
    ? [
        ['Username', usuario.username],
        ['Correo electrónico', usuario.correo],
        ['DNI', usuario.dni || '—'],
        ['Cargo en la compañía', usuario.cargo],
        ['Área', usuario.area],
        ['Nivel en la empresa', usuario.nivel],
        ['Líder', usuario.lider || 'Es su propio líder'],
        ['País y ciudad', `${usuario.ciudad}, ${usuario.pais}`],
        ['Fecha de creación', fechaCorta(usuario.creado)],
        ['Último inicio de sesión', usuario.ultimoIngreso ? fechaCorta(usuario.ultimoIngreso) : 'Nunca ha iniciado sesión'],
      ]
    : []

  return (
    <DrawerShell
      open={usuario !== null}
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      title={usuario ? nombreCompleto(usuario) : ''}
      description={usuario ? `${usuario.cargo} · ${usuario.area}` : undefined}
      badge={
        usuario ? (
          <span className="flex flex-wrap gap-2">
            <Badge variant={BADGE_ESTADO[usuario.estado]} size="sm">
              {usuario.estado}
            </Badge>
            <Badge variant={BADGE_ROL[usuario.rol]} size="sm">
              {usuario.rol}
            </Badge>
          </span>
        ) : null
      }
      footer={
        <>
          <DrawerClose render={<Button variant="outline" />}>Cerrar</DrawerClose>
          {usuario ? (
            <Button nativeButton={false} render={<Link to={ruta(`editar/${usuario.id}`)} />}>
              <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
              Editar usuario
            </Button>
          ) : null}
        </>
      }
    >
      <ItemGroup className="flex flex-col gap-1">
        {datos.map(([etiqueta, valor]) => (
          <Item key={etiqueta} size="xs">
            <ItemContent>
              <ItemDescription>{etiqueta}</ItemDescription>
              <ItemTitle>{valor}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </DrawerShell>
  )
}

// ── Pantalla ──

export function Component() {
  const navigate = useNavigate()
  const { usuarios, setUsuarios, recordatorioEnviado, setRecordatorioEnviado, masivo, cerrarMasivo } = useGestion()
  const [cargando] = useCargaInicial()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(20)
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})
  const [viendo, setViendo] = useState<Usuario | null>(null)
  const [contrasena, setContrasena] = useState<Usuario | null>(null)
  const [recordando, setRecordando] = useState(false)

  const resultado = useMemo(
    () => resolver(usuarios, busqueda, ['nombres', 'apellidos', 'username', 'correo'], filtros, orden),
    [usuarios, busqueda, filtros, orden],
  )
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])
  const sinSesion = usuarios.filter((u) => u.estado === 'Activo' && !u.ultimoIngreso).length

  // Suspender y activar se revierten con un clic: se hacen sin preguntar y el aviso trae
  // «Deshacer» (primer escalón de Confirmaciones).
  const cambiarEstado = (afectados: Usuario[], estado: EstadoUsuario) => {
    const ids = new Set(afectados.filter((u) => u.estado !== estado).map((u) => u.id))
    if (!ids.size) {
      notify(estado === 'Suspendido' ? 'Ya estaban suspendidos' : 'Ya estaban activos', undefined, 'info')
      return
    }
    const anterior: EstadoUsuario = estado === 'Suspendido' ? 'Activo' : 'Suspendido'
    setUsuarios((todos) => todos.map((u) => (ids.has(u.id) ? { ...u, estado } : u)))
    setLimpiarSeleccion({})
    const uno = afectados.find((u) => ids.has(u.id))
    const n = ids.size
    notifyAction(
      estado === 'Suspendido'
        ? n === 1 ? 'Usuario suspendido' : `${n} usuarios suspendidos`
        : n === 1 ? 'Usuario activado' : `${n} usuarios activados`,
      estado === 'Suspendido'
        ? `${n === 1 && uno ? nombreCompleto(uno) : `${n} personas`} ya no ${plural(n, 'puede', 'pueden')} entrar a UBITS y ${plural(n, 'su licencia quedó libre', 'sus licencias quedaron libres')}.`
        : `${n === 1 && uno ? nombreCompleto(uno) : `${n} personas`} ya ${plural(n, 'puede', 'pueden')} entrar de nuevo.`,
      {
        label: 'Deshacer',
        onClick: () => setUsuarios((todos) => todos.map((u) => (ids.has(u.id) ? { ...u, estado: anterior } : u))),
      },
      'success',
    )
  }

  const ejecutar = (accion: AccionFila, usuario: Usuario) => {
    if (accion === 'ver') setViendo(usuario)
    if (accion === 'editar') navigate(ruta(`editar/${usuario.id}`))
    if (accion === 'contrasena') setContrasena(usuario)
    if (accion === 'suspender') cambiarEstado([usuario], 'Suspendido')
    if (accion === 'activar') cambiarEstado([usuario], 'Activo')
  }

  const config: DataGridListConfig<Usuario> = {
    columns: COLUMNAS_USUARIOS,
    columnFilters: FILTROS_USUARIOS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setActual(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: BUSCAR_USUARIOS,
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      bulk: [
        { id: 'suspender', label: 'Suspender', icon: icono(UserBlock01Icon), onClick: (filas) => cambiarEstado(filas, 'Suspendido') },
        { id: 'activar', label: 'Activar', icon: icono(UserCheck01Icon), onClick: (filas) => cambiarEstado(filas, 'Activo') },
        {
          id: 'exportar',
          label: 'Exportar',
          icon: icono(Download01Icon),
          onClick: (filas) =>
            toast.promise(new Promise((listo) => setTimeout(listo, 1600)), {
              loading: `Preparando el archivo de ${filas.length} ${plural(filas.length, 'usuario', 'usuarios')}…`,
              success: 'Archivo listo: también lo enviamos a tu correo',
              error: 'No pudimos preparar el archivo',
            }),
        },
      ],
    },
    // Sin resultados con la ilustración glass del sistema, lo buscado entre comillas y «Limpiar» (13-oct, I-182).
    emptyState: {
      type: 'no-results',
      customComponent: (
        <SinResultados
          busqueda={busqueda}
          filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length}
          onLimpiar={() => {
            setBusqueda('')
            setFiltros([])
          }}
        />
      ),
    },
    // La cabecera es la de la tabla del sistema: el conteo a la izquierda, sin título dentro del marco (el título es el
    // de la página) y encabezados de 40 px con asidero.
  }

  const cuenta = (estado: EstadoUsuario) => resultado.filter((u) => u.estado === estado).length

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo="Gestión de usuarios"
        descripcion="Ten el control de tus usuarios, realizando acciones masivas o individuales."
        acciones={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast.promise(new Promise((listo) => setTimeout(listo, 2000)), {
                  loading: `Exportando ${usuarios.length.toLocaleString('es-CO')} usuarios…`,
                  success: 'Exportación lista: te enviamos el archivo a tu correo',
                  error: 'No pudimos exportar los usuarios',
                })
              }
            >
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
              Exportar usuarios
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                Acciones masivas
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Con un archivo de plantilla</DropdownMenuLabel>
                  {(Object.keys(MASIVAS) as AccionMasiva[]).map((accion) => (
                    <DropdownMenuItem key={accion} render={<Link to={ruta(`carga-masiva/${accion}`)} />}>
                      <HugeiconsIcon icon={accion === 'crear' ? UserAdd01Icon : accion === 'editar' ? FileEditIcon : accion === 'suspender' ? UserBlock01Icon : UserCheck01Icon} aria-hidden="true" />
                      {MASIVAS[accion].menu}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRecordando(true)} disabled={recordatorioEnviado !== null || sinSesion === 0}>
                  <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
                  Recordatorios de inicio de sesión
                  <Badge variant="primary-light" size="xs" className="ml-auto">
                    Nuevo
                  </Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button nativeButton={false} render={<Link to={ruta('crear')} />}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear usuario
            </Button>
          </>
        }
      />

      {/* Los indicadores cuentan lo que queda en la tabla con la búsqueda y los filtros de ahora. */}
      <Indicadores
        items={[
          { titulo: 'Usuarios', valor: resultado.length, detalle: 'Con los filtros de ahora' },
          { titulo: 'Activos', valor: cuenta('Activo'), detalle: 'Ocupan una licencia' },
          { titulo: 'Suspendidos', valor: cuenta('Suspendido'), detalle: 'Sin acceso a la plataforma' },
          {
            titulo: 'Sin iniciar sesión',
            valor: resultado.filter((u) => u.estado === 'Activo' && !u.ultimoIngreso).length,
            detalle: 'Nunca han entrado',
            atencion: true,
          },
        ]}
      />

      {/* La acción masiva sigue en segundo plano aunque se haya salido de su pantalla. */}
      {masivo?.estado === 'corriendo' ? (
        <ProcesoEnCurso titulo={MASIVAS[masivo.accion].enCurso(masivo.total)} hechos={masivo.hechos} total={masivo.total} />
      ) : null}
      {masivo?.estado === 'listo' ? (
        <Alert variant="success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
          <AlertTitle>{MASIVAS[masivo.accion].hecho(masivo.total)}</AlertTitle>
          <AlertDescription>
            <p>
              {masivo.omitidas
                ? `${masivo.omitidas} ${plural(masivo.omitidas, 'fila con error no se procesó', 'filas con error no se procesaron')}. El detalle llegó a tu correo.`
                : 'Ya se ven en la lista. El detalle llegó a tu correo.'}
            </p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={cerrarMasivo}>
              Entendido
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {recordatorioEnviado !== null ? (
        <Alert variant="success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
          <AlertTitle>Recordatorio enviado a {recordatorioEnviado.toLocaleString('es-CO')} personas</AlertTitle>
          <AlertDescription>
            <p>Podrás enviar otro en 24 horas. Quienes inicien sesión dejan de contarse aquí.</p>
          </AlertDescription>
        </Alert>
      ) : sinSesion > 0 ? (
        <Alert variant="info">
          <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
          <AlertTitle>{sinSesion.toLocaleString('es-CO')} personas aún no han iniciado sesión</AlertTitle>
          <AlertDescription>
            <p>Envíales un recordatorio por correo con su usuario y el enlace de entrada. Solo puedes enviarlo una vez cada 24 horas.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => setRecordando(true)}>
              Enviar recordatorios
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <AccionContexto.Provider value={ejecutar}>
        <TablaDatos config={config} data={visibles} isLoading={cargando} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: actual, setPagina: setActual, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="usuarios" singular="usuario" id="usuarios" />
      </AccionContexto.Provider>

      <FichaUsuario usuario={viendo} onCerrar={() => setViendo(null)} />

      {/* Le llega a otras personas: el diálogo dice a cuántas y qué pasa después (escalón 3). */}
      <DialogoConfirmar
        abierto={recordando}
        onAbiertoChange={setRecordando}
        icono={Mail01Icon}
        titulo="Enviar recordatorios"
        descripcion={`Enviaremos un correo electrónico a ${sinSesion.toLocaleString('es-CO')} personas que aún no han iniciado sesión. Ten presente que solo puedes enviarlo una vez cada 24 horas.`}
        accion={`Enviar a ${sinSesion.toLocaleString('es-CO')} personas`}
        onConfirmar={() => {
          setRecordatorioEnviado(sinSesion)
          setRecordando(false)
          notify('Recordatorios enviados', `Van en camino a ${sinSesion.toLocaleString('es-CO')} personas.`, 'success')
        }}
      />

      <DialogoConfirmar
        abierto={contrasena !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setContrasena(null))}
        icono={LockPasswordIcon}
        titulo="Cambiar contraseña"
        descripcion={
          contrasena
            ? `Le enviaremos a ${contrasena.correo} un enlace para crear una contraseña nueva. La actual deja de funcionar cuando la cambie.`
            : ''
        }
        accion="Enviar enlace"
        onConfirmar={() => {
          notify('Enlace enviado', `${contrasena?.correo} tiene 24 horas para usarlo.`, 'success')
          setContrasena(null)
        }}
      />

    </div>
  )
}

Component.displayName = 'GestionUsuariosLista'
