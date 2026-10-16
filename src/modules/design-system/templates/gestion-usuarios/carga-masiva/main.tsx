import { createContext, useContext, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  LogoutSquare01Icon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Text,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PageActionBar } from '@/shared/components/PageShell'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'

import { DialogoConfirmar, RegistroConfirmar } from '../../../estados/confirmaciones'
import { AdjuntoCsv, ProcesoEnCurso, type Subida } from '../../../estados/procesos'
import { useTemporizadores } from '../../../estados/temporizadores'
import { PantallaDeError } from '../../../estados/errores-sistema'
import { ERRORES } from '../../../estados/errores-sistema-datos'
import { plural } from '../../../patrones/formato'
import { pagina, type Filtro } from '../../admin-compartido/lista'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import {
  AREAS,
  LICENCIAS_TOTALES,
  MASIVAS,
  ROLES,
  esAccionMasiva,
  ruta,
  type AccionMasiva,
  type Rol,
  type Usuario,
} from '../components/datos'
import { useGestion } from '../components/estado'

// Acciones masivas por archivo (/admin-hr/users/bulk-user-*). La plataforma las hace en una
// planilla con «Importar archivo CSV» en cuatro pasos: plantilla → carga tu plantilla → revisar →
// confirmar. Aquí se recorren los mismos pasos con el adjunto y el aviso de avance de «Procesos
// largos»; las filas con error se corrigen en la tabla de revisión, como en la planilla real.

type Fila = { n: number; valores: Record<string, string> }
type Revisada = Fila & { errores: Record<string, string> }

const PASOS = [
  { numero: 1, titulo: 'Plantilla' },
  { numero: 2, titulo: 'Carga tu plantilla' },
  { numero: 3, titulo: 'Revisión' },
  { numero: 4, titulo: 'Confirmación' },
]

const OBLIGATORIAS = new Set(['Username', 'Nombres', 'Apellidos', 'Correo', 'Área', 'Rol'])
const correoValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)

// El archivo de ejemplo: filas que salen bien y unas pocas mal llenadas, como pasa siempre.
function filasDelArchivo(accion: AccionMasiva, usuarios: Usuario[]): Fila[] {
  if (accion === 'crear' || accion === 'editar') {
    const base =
      accion === 'crear'
        ? Array.from({ length: 48 }, (_, i) => {
            const nombres = ['Valentina', 'Samuel', 'Luciana', 'Emiliano', 'Antonia', 'Joaquín', 'Isidora', 'Benjamín'][i % 8]
            const apellidos = ['Arango Mejía', 'Quintero Ruiz', 'Zapata León', 'Montoya Gil', 'Ospina Rey', 'Correa Díaz'][i % 6]
            const username = `${nombres.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${apellidos.split(' ')[0].toLowerCase()}${i + 1}`
            return { Username: username, Nombres: nombres, Apellidos: apellidos, Correo: `${username}@google.com`, Área: AREAS[i % AREAS.length], Rol: 'Colaborador' }
          })
        : usuarios.slice(10, 34).map((u, i) => ({
            Username: u.username,
            Nombres: u.nombres,
            Apellidos: u.apellidos,
            Correo: u.correo,
            Área: AREAS[(AREAS.indexOf(u.area) + 1 + i) % AREAS.length],
            Rol: u.rol,
          }))
    // Tres filas mal llenadas: sin correo, un correo roto y un username que ya existe.
    base[6] = { ...base[6], Correo: '' }
    base[17] = { ...base[17], Correo: base[17].Correo.replace('@', '') }
    if (accion === 'crear') base[29] = { ...base[29], Username: usuarios[3].username }
    else base[20] = { ...base[20], Área: 'Comercial Norte' }
    return base.map((valores, i) => ({ n: i + 1, valores }))
  }

  const estado = accion === 'suspender' ? 'Activo' : 'Suspendido'
  const candidatos = usuarios.filter((u) => u.estado === estado).slice(0, 12)
  const filas = candidatos.map((u) => ({ Username: u.username, Correo: u.correo }))
  // Dos filas mal llenadas: un username que no existe y un correo que no coincide.
  if (filas[3]) filas[3] = { ...filas[3], Username: `${filas[3].Username}x` }
  if (filas[8]) filas[8] = { ...filas[8], Correo: `otro.${filas[8].Correo}` }
  return filas.map((valores, i) => ({ n: i + 1, valores }))
}

function revisar(accion: AccionMasiva, filas: Fila[], usuarios: Usuario[]): Revisada[] {
  const porUsername = new Map(usuarios.map((u) => [u.username, u]))
  const vistos = new Map<string, number>()
  for (const fila of filas) vistos.set(fila.valores.Username, (vistos.get(fila.valores.Username) ?? 0) + 1)

  return filas.map((fila) => {
    const v = fila.valores
    const errores: Record<string, string> = {}
    for (const columna of MASIVAS[accion].columnas) {
      if (OBLIGATORIAS.has(columna) && !v[columna]?.trim()) errores[columna] = `Falta ${columna === 'Área' ? 'el área' : columna === 'Rol' ? 'el rol' : `el ${columna.toLowerCase()}`}`
    }
    if (v.Correo && !errores.Correo && !correoValido(v.Correo)) errores.Correo = 'El correo no es válido'
    const existente = porUsername.get(v.Username)
    if (accion === 'crear') {
      if (v.Username && existente) errores.Username = 'El username ya existe'
      else if (v.Username && (vistos.get(v.Username) ?? 0) > 1) errores.Username = 'El username está repetido en el archivo'
    } else if (v.Username && !existente) {
      errores.Username = 'No hay nadie con ese username'
    } else if (existente && v.Correo && !errores.Correo && existente.correo !== v.Correo && accion !== 'editar') {
      errores.Correo = 'El correo no coincide con el del usuario'
    }
    if ('Área' in v && v['Área'] && !AREAS.includes(v['Área'])) errores['Área'] = 'El área no existe en tu empresa'
    if ('Rol' in v && v.Rol && !ROLES.includes(v.Rol as Rol)) errores.Rol = 'El rol no existe'
    return { ...fila, errores }
  })
}

// ── Tabla de la revisión (decisión 1 de la auditoría: la tabla del sistema, TablaDatos) ──
// Conteo, buscador, orden y filtro por columna y paginación en español. El filtro de estado vive en su columna (antes
// era un interruptor «Ver solo filas con error» encima de la tabla). Las celdas con error siguen siendo editables.

type EstadoFila = 'Correcto' | 'Con error'
type FilaRevision = Revisada & { estado: EstadoFila; descripcion: string }

// Las columnas se arman una vez por acción y leen de aquí la función para corregir: si se armaran en cada tecla, la
// celda se volvería a montar y el campo perdería el foco.
const CorregirContexto = createContext<(n: number, columna: string, valor: string) => void>(() => undefined)

function CeldaEditable({ fila, columna }: { fila: FilaRevision; columna: string }) {
  const corregir = useContext(CorregirContexto)
  return fila.errores[columna] ? (
    <Field className="min-w-44">
      <Input
        aria-label={`${columna} de la fila ${fila.n}`}
        aria-invalid
        value={fila.valores[columna] ?? ''}
        placeholder={columna}
        onChange={(e) => corregir(fila.n, columna, e.target.value)}
      />
    </Field>
  ) : (
    <Text as="span" size="sm" className="truncate">
      {fila.valores[columna]}
    </Text>
  )
}

function columnasDeRevision(columnas: string[]): DataGridListConfig<FilaRevision>['columns'] {
  return [
    {
      accessorKey: 'n',
      header: '#',
      size: 72,
      cell: ({ row }) => (
        <Text as="span" variant="muted" size="sm" className="tabular-nums">
          {row.original.n}
        </Text>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 130,
      cell: ({ row }) => (
        <Badge variant={row.original.estado === 'Con error' ? 'destructive-outline' : 'success-light'} size="sm">
          {row.original.estado}
        </Badge>
      ),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción de errores',
      size: 260,
      cell: ({ row }) => (
        <Text as="span" size="sm" variant={row.original.descripcion ? undefined : 'muted'}>
          {row.original.descripcion || '—'}
        </Text>
      ),
    },
    ...columnas.map(
      (columna): DataGridListConfig<FilaRevision>['columns'][number] => ({
        id: columna,
        accessorFn: (fila) => fila.valores[columna] ?? '',
        header: OBLIGATORIAS.has(columna) ? `${columna}*` : columna,
        size: 200,
        cell: ({ row }) => <CeldaEditable fila={row.original} columna={columna} />,
      }),
    ),
  ]
}

const FILTROS_REVISION: DataGridListConfig<FilaRevision>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: (['Correcto', 'Con error'] as EstadoFila[]).map((v) => ({ label: v, value: v })) },
]

const valorDe = (fila: FilaRevision, campo: string) =>
  campo === 'n' ? fila.n : campo === 'estado' ? fila.estado : campo === 'descripcion' ? fila.descripcion : (fila.valores[campo] ?? '')

// Busca en los datos de la fila, filtra por estado y ordena por cualquier columna (lo que en producto haría el servidor).
function resolverRevision(filas: FilaRevision[], busqueda: string, filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  const estados = (filtros.find((f) => f.id === 'estado')?.value as string[] | undefined) ?? []
  const resultado = filas.filter(
    (fila) =>
      (!q || Object.values(fila.valores).some((valor) => valor.toLowerCase().includes(q))) &&
      (!estados.length || estados.includes(fila.estado)),
  )
  if (!orden) return resultado
  const desc = orden.startsWith('-')
  const campo = desc ? orden.slice(1) : orden
  return [...resultado].sort((a, b) => {
    const va = valorDe(a, campo)
    const vb = valorDe(b, campo)
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
    return desc ? -r : r
  })
}

export function Component() {
  const { accion: parametro } = useParams()
  const navigate = useNavigate()
  const { usuarios, masivo, iniciarMasivo, cerrarMasivo } = useGestion()
  const despues = useTemporizadores()
  const accion: AccionMasiva = esAccionMasiva(parametro) ? parametro : 'crear'
  const textos = MASIVAS[accion]

  // Si se vuelve a la pantalla con la acción en curso o terminada, se abre en la confirmación.
  const [paso, setPaso] = useState(() => (masivo?.accion === accion ? 4 : 1))
  const [alcanzado, setAlcanzado] = useState(paso)
  const [subida, setSubida] = useState<Subida>('idle')
  const [porcentaje, setPorcentaje] = useState(0)
  const [filas, setFilas] = useState<Fila[]>([])
  // Búsqueda, filtro, orden y página de la tabla de revisión.
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [saliendo, setSaliendo] = useState(false)
  // El proceso vive en el layout; esta pantalla solo lo muestra si es el de su misma acción.
  const propio = masivo?.accion === accion ? masivo : null
  const proceso = propio?.estado ?? 'quieto'
  const otroEnCurso = masivo?.estado === 'corriendo' && masivo.accion !== accion

  // La revisión se hace contra la foto de usuarios de cuando se cargó el archivo.
  const [foto] = useState(usuarios)
  const revisadas = useMemo(() => revisar(accion, filas, foto), [accion, filas, foto])
  const correctas = revisadas.filter((f) => !Object.keys(f.errores).length)
  const conError = revisadas.length - correctas.length
  const columnasRevision = useMemo(() => columnasDeRevision(MASIVAS[accion].columnas), [accion])
  const filasRevision = useMemo<FilaRevision[]>(
    () =>
      revisadas.map((fila) => {
        const mensajes = Object.values(fila.errores)
        return { ...fila, estado: mensajes.length ? 'Con error' : 'Correcto', descripcion: mensajes.join(' · ') }
      }),
    [revisadas],
  )
  const resultadoRevision = useMemo(() => resolverRevision(filasRevision, busqueda, filtros, orden), [filasRevision, busqueda, filtros, orden])
  const visiblesRevision = useMemo(() => pagina(resultadoRevision, actual, porPagina), [resultadoRevision, actual, porPagina])
  const activos = usuarios.filter((u) => u.estado === 'Activo').length
  const disponibles = LICENCIAS_TOTALES - activos
  const faltanLicencias = (accion === 'crear' || accion === 'activar') && correctas.length > disponibles

  if (!esAccionMasiva(parametro)) {
    return (
      <div className="flex flex-1 flex-col pt-2">
        <PantallaDeError
          error={{ ...ERRORES[0], accion: { ...ERRORES[0].accion!, etiqueta: 'Volver a Gestión de usuarios' } }}
          onAccion={() => navigate(ruta())}
        />
      </div>
    )
  }

  const ir = (siguiente: number) => {
    setPaso(siguiente)
    setAlcanzado((previo) => Math.max(previo, siguiente))
  }

  const subir = () => {
    setSubida('uploading')
    setPorcentaje(0)
    ;[25, 55, 80, 100].forEach((valor, i) => despues(() => setPorcentaje(valor), 300 * (i + 1)))
    despues(() => setSubida('processing'), 1400)
    despues(() => {
      const leidas = filasDelArchivo(accion, foto)
      setFilas(leidas)
      setSubida(revisar(accion, leidas, foto).some((f) => Object.keys(f.errores).length) ? 'error' : 'done')
    }, 2400)
  }

  const quitar = () => {
    setSubida('idle')
    setFilas([])
    setAlcanzado(2)
  }

  const corregir = (n: number, columna: string, valor: string) =>
    setFilas((previas) => previas.map((f) => (f.n === n ? { ...f, valores: { ...f.valores, [columna]: valor } } : f)))

  const ejecutar = () => {
    iniciarMasivo(
      accion,
      correctas.map((f) => f.valores),
      conError,
    )
  }

  // Hay avance si ya pasó del primer paso o subió el archivo; quien solo entró a mirar se va de una.
  const hayAvance = proceso === 'quieto' && (paso > 1 || subida !== 'idle')
  const pedirSalir = () => (hayAvance ? setSaliendo(true) : navigate(ruta()))

  const reiniciar = () => {
    cerrarMasivo()
    setPaso(1)
    setAlcanzado(1)
    setSubida('idle')
    setFilas([])
  }

  const configRevision: DataGridListConfig<FilaRevision> = {
    columns: columnasRevision,
    columnFilters: FILTROS_REVISION,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setActual(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar en las filas del archivo',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron filas',
      description: 'Prueba con otro dato o quita el filtro de estado.',
      action: {
        id: 'limpiar',
        label: 'Limpiar filtros',
        variant: 'outline',
        onClick: () => {
          setBusqueda('')
          setFiltros([])
        },
      },
    },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla titulo={textos.titulo} descripcion={textos.descripcion} acciones={<BotonSalirCreacion onClick={pedirSalir} />} />

      <Card>
        <CardContent className="flex flex-col gap-8">
          <Stepper value={paso} onValueChange={(valor) => (valor <= alcanzado && proceso === 'quieto' ? setPaso(valor) : undefined)}>
            <StepperNav>
              {PASOS.map((item, indice) => (
                <StepperItem key={item.numero} step={item.numero} completed={paso > item.numero} disabled={item.numero > alcanzado || proceso !== 'quieto'}>
                  <StepperTrigger>
                    <StepperIndicator>
                      {paso > item.numero ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" /> : item.numero}
                    </StepperIndicator>
                    <StepperTitle>{item.titulo}</StepperTitle>
                  </StepperTrigger>
                  {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="pt-8">
              {/* 1 · Plantilla */}
              <StepperContent value={1}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <Text weight="semibold">Plantilla de {accion === 'crear' ? 'creación' : accion === 'editar' ? 'edición' : accion === 'suspender' ? 'suspensión' : 'activación'} de usuarios</Text>
                    <Text variant="muted" size="sm">
                      ¡Tenemos un formato de Excel para hacer tu proceso más sencillo! Descárgalo, llénalo y guárdalo como CSV.
                    </Text>
                  </div>
                  <ItemGroup className="grid gap-3 md:grid-cols-2">
                    <Item variant="outline">
                      <ItemMedia variant="icon">
                        <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>Plantilla CSV</ItemTitle>
                        <ItemDescription>Columnas en el orden correcto. Hasta 3.000 filas.</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button variant="outline" size="sm" onClick={() => toast.add({ type: 'success', title: 'Se descargó la plantilla' })}>
                          Descargar plantilla
                        </Button>
                      </ItemActions>
                    </Item>
                    <Item variant="outline">
                      <ItemMedia variant="icon">
                        <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>Documento instructivo</ItemTitle>
                        <ItemDescription>Cómo llenar cada columna y los errores más comunes.</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button variant="ghost" size="sm" onClick={() => toast.add({ type: 'info', title: 'Se abriría el instructivo en otra pestaña' })}>
                          Ver
                        </Button>
                      </ItemActions>
                    </Item>
                  </ItemGroup>
                  <div className="flex flex-col gap-2">
                    <Text size="sm" weight="medium">
                      Columnas de la plantilla
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {textos.columnas.map((columna) => (
                        <Badge key={columna} variant="outline">
                          {columna}
                          {OBLIGATORIAS.has(columna) ? ' *' : ''}
                        </Badge>
                      ))}
                    </div>
                    <Text variant="muted" size="xs">
                      * Obligatorias. {accion === 'crear' ? 'Los campos de área y líder son necesarios para crear tu organigrama.' : 'Todos los campos son obligatorios.'}
                    </Text>
                  </div>
                </div>
              </StepperContent>

              {/* 2 · Carga tu plantilla */}
              <StepperContent value={2}>
                <div className="flex flex-col gap-4">
                  <Text variant="muted" size="sm">
                    Selecciona o arrastra la plantilla que llenaste para validar la información.
                  </Text>
                  <AdjuntoCsv
                    estado={subida}
                    vacio={{ titulo: 'Arrastra aquí la plantilla CSV', descripcion: 'O elígela desde tu equipo · Máx. 1 MB' }}
                    nombre={textos.archivo}
                    descripcion={
                      {
                        idle: '',
                        uploading: `Subiendo · ${porcentaje} %`,
                        processing: 'Validando la información…',
                        done: `${filas.length} filas correctas`,
                        error: `${filas.length} filas · ${conError} ${plural(conError, 'tiene', 'tienen')} errores que puedes corregir en la revisión`,
                      }[subida]
                    }
                    porcentaje={porcentaje}
                    onElegir={subir}
                    onQuitar={quitar}
                    onDescargarErrores={() => toast.add({ type: 'info', title: 'Se descargó el detalle de errores' })}
                  />
                </div>
              </StepperContent>

              {/* 3 · Revisión */}
              <StepperContent value={3}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {accion === 'crear' || accion === 'activar' ? (
                      <Badge variant="outline">
                        Licencias disponibles: {disponibles.toLocaleString('es-CO')}/{LICENCIAS_TOTALES.toLocaleString('es-CO')}
                      </Badge>
                    ) : null}
                    <Badge variant="success-light">Usuarios correctos: {correctas.length}</Badge>
                    <Badge variant={conError ? 'destructive-outline' : 'secondary'}>Usuarios con error: {conError}</Badge>
                  </div>

                  {conError ? (
                    <Alert variant="warning">
                      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                      <AlertTitle>
                        {conError} {plural(conError, 'fila tiene', 'filas tienen')} errores
                      </AlertTitle>
                      <AlertDescription>
                        <p>Corrígelas aquí mismo o continúa sin ellas: solo se procesan las filas correctas.</p>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="success">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                      <AlertTitle>Todas las filas están correctas</AlertTitle>
                    </Alert>
                  )}

                  <CorregirContexto.Provider value={corregir}>
                    <TablaDatos
                      config={configRevision}
                      data={visiblesRevision}
                      paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultadoRevision.length }}
                      nombre="filas"
                      singular="fila"
                      id="revision-carga"
                    />
                  </CorregirContexto.Provider>
                </div>
              </StepperContent>

              {/* 4 · Confirmación */}
              <StepperContent value={4}>
                <div className="flex flex-col gap-4">
                  {proceso === 'quieto' ? (
                    <>
                      <Text variant="muted" size="sm">
                        Revisa y confirma. El proceso sigue en segundo plano y el resultado llega también por correo.
                      </Text>
                      <ItemGroup className="flex flex-col gap-2">
                        <Item variant="outline">
                          <ItemMedia variant="icon">
                            <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{textos.boton(correctas.length)}</ItemTitle>
                            <ItemDescription>
                              {accion === 'crear'
                                ? 'A cada persona le llega un correo para crear su contraseña.'
                                : accion === 'suspender'
                                  ? 'Dejan de poder entrar a UBITS y sus licencias quedan libres.'
                                  : accion === 'activar'
                                    ? 'Vuelven a entrar con su usuario de siempre y ocupan una licencia.'
                                    : 'Se actualizan sus datos y el organigrama.'}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                        {conError ? (
                          <Item variant="outline">
                            <ItemMedia variant="icon">
                              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>
                                {conError} {plural(conError, 'fila queda', 'filas quedan')} por fuera
                              </ItemTitle>
                              <ItemDescription>Tienen errores. Puedes volver a la revisión y corregirlas.</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              <Button variant="ghost" size="sm" onClick={() => setPaso(3)}>
                                Corregir
                              </Button>
                            </ItemActions>
                          </Item>
                        ) : null}
                      </ItemGroup>
                      {otroEnCurso ? (
                        <Alert variant="info">
                          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                          <AlertTitle>Hay otra acción masiva en curso</AlertTitle>
                          <AlertDescription>
                            <p>Podrás confirmar esta cuando termine; el avance se ve en la lista de usuarios.</p>
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      {faltanLicencias ? (
                        <Alert variant="warning">
                          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                          <AlertTitle>No te alcanzan las licencias</AlertTitle>
                          <AlertDescription>
                            <p>
                              Quedan {disponibles} licencias y el archivo trae {correctas.length} personas. Compra más licencias o quita filas del
                              archivo.
                            </p>
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </>
                  ) : null}

                  {propio?.estado === 'corriendo' ? <ProcesoEnCurso titulo={textos.enCurso(propio.total)} hechos={propio.hechos} total={propio.total} /> : null}

                  {proceso === 'listo' ? (
                    <Alert variant="success">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
                      <AlertTitle>{textos.hecho(propio?.total ?? 0)}</AlertTitle>
                      <AlertDescription>
                        <p>
                          {propio?.omitidas
                            ? `${propio.omitidas} ${plural(propio.omitidas, 'fila con error no se procesó', 'filas con error no se procesaron')}. El detalle también llegó a tu correo.`
                            : 'El detalle también llegó a tu correo.'}
                        </p>
                      </AlertDescription>
                      <AlertAction className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={reiniciar}>
                          Hacer otra carga
                        </Button>
                        <Button size="sm" nativeButton={false} render={<Link to={ruta()} />}>
                          Ver usuarios
                        </Button>
                      </AlertAction>
                    </Alert>
                  ) : null}
                </div>
              </StepperContent>
            </StepperPanel>
          </Stepper>
        </CardContent>
      </Card>

      {/* Barra fija abajo, como el patrón Navegación › Pasos: el estado del guardado a la izquierda (informa, no se pulsa),
          «Atrás» con contorno y seguir a la derecha, a la vista aunque la tabla de revisión sea larga. Sin «Cancelar»: la
          única salida es la de junto al título (regla de creación, 6-oct). Con un paso corto baja hasta el final. */}
      <PageActionBar className="mt-auto justify-between">
        {proceso === 'quieto' ? (
          <>
            <ChipGuardado estado={hayAvance ? 'editando' : 'guardado'} />
            <div className="ml-auto flex items-center gap-2">
              {paso > 1 ? (
                <Button variant="outline" onClick={() => setPaso(paso - 1)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
                  Atrás
                </Button>
              ) : null}
              {paso === 1 ? <Button onClick={() => ir(2)}>Continuar</Button> : null}
              {paso === 2 ? (
                <Button onClick={() => ir(3)} disabled={subida !== 'done' && subida !== 'error'}>
                  Validar información
                </Button>
              ) : null}
              {paso === 3 ? (
                <Button onClick={() => ir(4)} disabled={!correctas.length}>
                  Continuar con {correctas.length} {plural(correctas.length, 'fila correcta', 'filas correctas')}
                </Button>
              ) : null}
              {paso === 4 ? (
                <Button onClick={ejecutar} disabled={!correctas.length || faltanLicencias || otroEnCurso}>
                  {textos.boton(correctas.length)}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <Text variant="muted" size="sm">
            {proceso === 'corriendo' ? 'En proceso: puedes volver a la lista y seguir trabajando.' : 'Proceso terminado.'}
          </Text>
        )}
      </PageActionBar>

      {/* Salir con avance es preguntar antes de hacer algo: DialogoConfirmar con sus tres salidas y en su tamaño normal. */}
      <DialogoConfirmar
        abierto={saliendo}
        onAbiertoChange={setSaliendo}
        icono={LogoutSquare01Icon}
        titulo="¿Salir de la creación?"
        descripcion="Tienes una carga sin terminar. Si sales ahora sin guardar, el archivo y las correcciones se pierden."
        cancelar="Seguir editando"
        otra={{
          texto: 'Salir sin guardar',
          onClick: () => {
            setSaliendo(false)
            navigate(ruta())
          },
        }}
        accion="Guardar y salir"
        onConfirmar={() => {
          setSaliendo(false)
          toast.add({ type: 'info', title: 'Avance guardado', description: 'Puedes retomar la carga cuando quieras.' })
          navigate(ruta())
        }}
      >
        <RegistroConfirmar nombre={textos.titulo} detalle={`Carga masiva · paso ${paso} de ${PASOS.length}`} estado="Cambios sin guardar" />
      </DialogoConfirmar>
    </div>
  )
}

Component.displayName = 'GestionUsuariosCargaMasiva'
