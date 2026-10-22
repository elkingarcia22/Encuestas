import { createContext, useContext, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  Folder01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  Share08Icon,
  SquareLock02Icon,
  UserSwitchIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
  type DataGridListConfig,
  type ListColumnFilter,
} from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify, notifyAction } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { CarpetasDeFila } from '@/modules/design-system/data-grid/partes-tabla'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import type { EstadoPublicacion, VacanteUI } from '../../../propuestas/datos'
import { QUIEN_MUEVE } from '../../../propuestas/movimientos'
import { anotarCorreo } from '../../../propuestas/base'
import { fechaCortaHace } from '../../../propuestas/publicar'
import { useCarga } from '@/modules/design-system/estados/carga'
import { CampoFiltro } from '../../../propuestas/components/filtros-base'
import {
  DialogoCompartirVacante,
  DialogoEliminarVacantes,
  DialogoEstadoVacante,
  type CambioDeEstado,
} from '../../../propuestas/components/dialogos-vacante'
import { VentanaEtiquetas } from '../../../propuestas/components/dialogos-base'
import { PanelEtiquetas } from './etiquetas-vacantes'
import { avisoDeEtiquetas, cambiarVacantes, duplicarVacantes, eliminarVacantes, etiquetarVacantes, etiquetasDeVacantes, vacantesDeLaSesion } from './acciones'
import { DIAS_ESTANCADA } from './atencion'
import { estadoInicio, useEstadoInicio, type Lectura } from './estado'
import { noSeGuardo } from '../../../propuestas/simular'
import { CifraAnimada } from '../../../propuestas/components/cifra-animada'
import { useFilasQueEntran } from '../../../propuestas/components/animacion'

// La lista de vacantes del inicio, en la tabla del sistema (16 oct, Nicolás: «no veo aún que en vacantes o candidatos
// estén las tablas como deben ser»). Es TablaDatos, la de Planes de formación y la de «Tablero con vistas» de Cristian:
// arriba, en lo gris, el conteo a la izquierda y a la derecha el buscador, «Personalizar columnas» y «Carpetas»; cada
// columna ordena y se filtra desde su encabezado; el «⋯» de cada fila en «Acciones», y el pie de páginas en español.
// Del 7 al 15 oct fue una tabla armada a mano (el marco de Selección y la tabla de la librería) con su buscador y
// «Filtros» arriba: eso se fue con la decisión de que la tabla del sistema es una sola.
//
// Lo que se filtra, desde su columna: el estado (con «Estancadas», que se lee igual: en qué va la vacante), las carpetas
// (desde «Vacante», donde se ven) y el reclutador. El área se encuentra con el buscador, junto al cargo y al reclutador.
// Las columnas (13 oct, reunión con la PM y el TL): nombre con su área y sus carpetas, estado, candidatos, días abierta y
// reclutador. Sin sede ni «Avance del proceso» (el embudo irá a AI Insights), sin «Exportar» y sin «Esperan»: quién
// espera está en «Lo que necesita tu atención». Ocultarla del portal es un ajuste de la vacante, no un estado.

type Estado = EstadoPublicacion

const ESTADO_INSIGNIA: Record<Estado, 'success-light' | 'secondary' | 'outline'> = {
  Publicada: 'success-light',
  Borrador: 'secondary',
  Cerrada: 'outline',
}
const estancada = (vacante: VacanteUI) => vacante.estado === 'Publicada' && vacante.diasAbierta >= DIAS_ESTANCADA

// Buscar sin tildes ni mayúsculas, como el catálogo de plantillas y Mis candidatos (IN-18).
const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const SIN_ASIGNAR = 'Sin asignar'
const reclutadorDe = (vacante: VacanteUI) => vacante.reclutador.nombre.trim() || SIN_ASIGNAR

/* Las filas ---------------------------------------------------------------------------------------------------------- */

// `id` es lo que la tabla usa para recordar qué fila está elegida, también al cambiar de página.
type Fila = {
  id: string
  titulo: string
  estado: Estado
  aplicaciones: number
  diasAbierta: number
  reclutador: string
  vacante: VacanteUI
}

// Con `?simular=vacio` (una empresa que empieza) no hay ninguna: la tabla muestra su estado vacío (IN-24).
const filasDe = (): Fila[] =>
  vacantesDeLaSesion().map((vacante) => ({
    id: vacante.id,
    titulo: vacante.titulo,
    estado: vacante.estado,
    aplicaciones: vacante.aplicaciones,
    diasAbierta: vacante.diasAbierta,
    reclutador: reclutadorDe(vacante),
    vacante,
  }))

const ORDEN_ESTADO: Record<Estado, number> = { Publicada: 0, Borrador: 1, Cerrada: 2 }

// El orden que pide el encabezado: «titulo» de la A a la Z, «-titulo» al revés. En «Días abierta», las cerradas y los
// borradores no están abiertas y van siempre al final (IN-33).
const COMPARAR: Record<string, (a: Fila, b: Fila) => number> = {
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
  estado: (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado],
  aplicaciones: (a, b) => a.aplicaciones - b.aplicaciones,
  diasAbierta: (a, b) => a.diasAbierta - b.diasAbierta,
  reclutador: (a, b) => a.reclutador.localeCompare(b.reclutador, 'es'),
}
function ordenar(filas: Fila[], orden: string | undefined) {
  if (!orden) return filas
  const alReves = orden.startsWith('-')
  const campo = alReves ? orden.slice(1) : orden
  const comparar = COMPARAR[campo]
  if (!comparar) return filas
  const abierta = (fila: Fila) => (fila.estado === 'Publicada' ? 0 : 1)
  return [...filas].sort((a, b) => (campo === 'diasAbierta' ? abierta(a) - abierta(b) : 0) || (alReves ? -comparar(a, b) : comparar(a, b)))
}

/* Los filtros de cada columna ---------------------------------------------------------------------------------------- */

type Filtro = { id: string; value: unknown }
// Lo marcado en un filtro de la tabla (se guarda con el nombre de su columna).
const marcadosEn = (filtros: Filtro[], columna: string) => {
  const valor = filtros.find((filtro) => filtro.id === columna)?.value
  return Array.isArray(valor) ? valor.map(String) : []
}

const ESTANCADA = 'estancada'
const pasaEstado = (fila: Fila, marcados: string[]) =>
  marcados.some((valor) => (valor === ESTANCADA ? estancada(fila.vacante) : fila.estado === valor))

// Fuera del componente: si los filtros cambian en cada pintada, el globo del filtro se cierra al marcar.
const FILTRO_ESTADO: ListColumnFilter = {
  id: 'estado',
  label: 'Estado',
  type: 'select',
  multiple: true,
  options: [
    { label: 'Publicada', value: 'Publicada' },
    { label: `Estancada (más de ${DIAS_ESTANCADA} días)`, value: ESTANCADA },
    { label: 'Borrador', value: 'Borrador' },
    { label: 'Cerrada', value: 'Cerrada' },
  ],
}

/* Lo que necesitan las celdas ---------------------------------------------------------------------------------------- */

type AccionesFila = {
  abrir: (vacante: VacanteUI) => void
  editar: (vacante: VacanteUI) => void
  duplicar: (vacante: VacanteUI) => void
  compartir: (vacante: VacanteUI) => void
  portal: (vacante: VacanteUI) => void
  estado: (vacante: VacanteUI, destino: EstadoPublicacion) => void
  reclutador: (vacante: VacanteUI) => void
  etiquetas: (vacante: VacanteUI) => void
  eliminar: (vacante: VacanteUI) => void
}

// Las columnas viven fuera del componente; lo que necesitan de la pantalla (a dónde lleva cada vacante, qué está leyendo
// la IA y qué hace el «⋯») les llega por contexto.
const nada = () => undefined
const ContextoTabla = createContext<{ ruta: string; lecturas: Record<string, Lectura>; acciones: AccionesFila }>({
  ruta: '',
  lecturas: {},
  acciones: { abrir: nada, editar: nada, duplicar: nada, compartir: nada, portal: nada, estado: nada, reclutador: nada, etiquetas: nada, eliminar: nada },
})

const columnasVacantes: DataGridListConfig<Fila>['columns'] = [
  { accessorKey: 'titulo', header: 'Vacante', size: 300, cell: ({ row }) => <CeldaVacante fila={row.original} /> },
  { accessorKey: 'estado', header: 'Estado', size: 150, cell: ({ row }) => <CeldaEstado vacante={row.original.vacante} /> },
  {
    accessorKey: 'aplicaciones',
    header: 'Candidatos',
    size: 140,
    cell: ({ row }) => {
      const vacante = row.original.vacante
      return (
        <span className="flex min-w-0 flex-col gap-0.5">
          <Text as="span" size="sm" className="tabular-nums">
            <CifraAnimada valor={vacante.aplicaciones} duracion={0.7} />
          </Text>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {vacante.estado === 'Cerrada' ? 'Ya no recibe' : vacante.ultimaSemana > 0 ? `${vacante.ultimaSemana} esta semana` : 'Nadie esta semana'}
          </Text>
        </span>
      )
    },
  },
  { accessorKey: 'diasAbierta', header: 'Días abierta', size: 150, cell: ({ row }) => <CeldaDias vacante={row.original.vacante} /> },
  {
    accessorKey: 'reclutador',
    header: 'Reclutador',
    size: 160,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.reclutador === SIN_ASIGNAR ? 'muted' : undefined} className="block truncate">
        {row.original.reclutador}
      </Text>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuDeFila vacante={row.original.vacante} /> },
]

// Toda la fila abre la vacante (1 oct, Nicolás: «la card en sí debería poderse dar clic»), salvo lo que ya hace algo: la
// tabla no avisa del clic en una fila, así que el contenedor se lo pasa al enlace del nombre.
const abrirFila = (evento: MouseEvent<HTMLElement>) => {
  const tocado = evento.target as HTMLElement
  if (tocado.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
  if (window.getSelection()?.toString()) return
  tocado.closest('tbody tr')?.querySelector<HTMLElement>('td a')?.click()
}

/* La tabla ----------------------------------------------------------------------------------------------------------- */

type Ventana =
  | { tipo: 'estado'; vacantes: VacanteUI[]; destino: EstadoPublicacion }
  | { tipo: 'eliminar'; vacantes: VacanteUI[] }
  | { tipo: 'compartir'; vacante: VacanteUI }
  | { tipo: 'reclutador'; vacantes: VacanteUI[] }
  | { tipo: 'etiquetas'; vacantes: VacanteUI[] }

export function TablaVacantes({ ruta }: { ruta: string }) {
  const navigate = useNavigate()
  // Se suscribe para volver a leer la lista cuando se duplica, elimina o cambia una vacante (la lista compartida no avisa).
  const estadoActual = useEstadoInicio()
  const { lecturas } = estadoActual
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Se sube para volver a montar la tabla vacía de búsqueda y filtros («Limpiar»).
  const [version, setVersion] = useState(0)
  // Lo elegido lo lleva la tabla; un objeto nuevo aquí lo suelta (después de una acción con varias).
  const [sinSeleccion, setSinSeleccion] = useState<Record<string, boolean>>({})
  const [ventana, setVentana] = useState<Ventana | null>(null)
  const [etiquetasAbierto, setEtiquetasAbierto] = useState(false)
  // «Ver en la tabla» desde el panel de Carpetas: solo las de esa carpeta, con «Ver todas» para volver.
  const [carpeta, setCarpeta] = useState<string | null>(null)

  // `revision` sube cada vez que se duplica, elimina o cambia una vacante: entonces se vuelve a leer la lista.
  const { version: revision } = estadoActual
  const filas = useMemo(() => (revision >= 0 ? filasDe() : []), [revision])

  const reclutadores = useMemo(() => [...new Set(filas.map((fila) => fila.reclutador))].sort((a, b) => a.localeCompare(b, 'es')), [filas])
  // Los filtros de «Vacante» (las carpetas) y «Reclutador» salen de lo que hay: todas las carpetas que existen, también las
  // vacías (VP: «que te aparezcan todas las carpetas»), y quien lleva alguna. Las suyas se reconocen con «(tú)».
  // Las carpetas cambian cuando se crea, renombra o elimina una: el filtro se rehace solo si cambian sus nombres.
  const carpetas = etiquetasDeVacantes().join('\n')
  const columnFilters = useMemo<ListColumnFilter[]>(
    () => [
      FILTRO_ESTADO,
      { id: 'carpetas', columnId: 'titulo', label: 'Carpeta', type: 'select', multiple: true, options: carpetas.split('\n').filter(Boolean).map((nombre) => ({ label: nombre, value: nombre })) },
      { id: 'reclutador', label: 'Reclutador', type: 'select', multiple: true, options: reclutadores.map((nombre) => ({ label: nombre === QUIEN_MUEVE ? `${nombre} (tú)` : nombre, value: nombre })) },
    ],
    [reclutadores, carpetas],
  )

  const resultado = useMemo(() => {
    const texto = normal(busqueda)
    const estados = marcadosEn(filtros, 'estado')
    const enCarpetas = marcadosEn(filtros, 'titulo')
    const quienes = marcadosEn(filtros, 'reclutador')
    return ordenar(
      filas.filter(
        (fila) =>
          (!carpeta || fila.vacante.etiquetas.includes(carpeta)) &&
          // También por área y por reclutador: buscar «Laura» trae las suyas (IN-08).
          (!texto || normal(`${fila.titulo} ${fila.vacante.area} ${fila.reclutador}`).includes(texto)) &&
          (!estados.length || pasaEstado(fila, estados)) &&
          (!enCarpetas.length || fila.vacante.etiquetas.some((una) => enCarpetas.includes(una))) &&
          (!quienes.length || quienes.includes(fila.reclutador)),
      ),
      orden,
    )
  }, [filas, busqueda, filtros, orden, carpeta])

  const paginas = Math.max(1, Math.ceil(resultado.length / porPagina))
  const enPagina = useMemo(() => resultado.slice((Math.min(pagina, paginas) - 1) * porPagina, Math.min(pagina, paginas) * porPagina), [resultado, pagina, paginas, porPagina])
  const cargando = useCarga({ busqueda, filtros, orden, pagina, porPagina, carpeta })
  // Las filas entran en cascada cada vez que llega algo nuevo (y al volver de una acción).
  const caja = useRef<HTMLDivElement>(null)
  useFilasQueEntran(caja, { busqueda, filtros, orden, pagina, porPagina, carpeta, revision }, !cargando)

  const [elegidas, setElegidas] = useState<Fila[]>([])
  const filtrosPuestos = filtros.filter((filtro) => (Array.isArray(filtro.value) ? filtro.value.length > 0 : filtro.value !== undefined)).length

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setCarpeta(null)
    setPagina(1)
    setVersion((antes) => antes + 1)
  }
  // Después de actuar sobre las elegidas, la tabla las suelta.
  const soltar = () => setSinSeleccion({})

  /* Lo que se hace con una o varias ----------------------------------------------------------------------------------- */

  const cuantas = (n: number) => `${n} ${plural(n, 'vacante', 'vacantes')}`

  const duplicar = (vacantes: VacanteUI[]) => {
    if (noSeGuardo(`duplicar:${vacantes.map((vacante) => vacante.id).join(',')}`, `No pudimos duplicar ${vacantes.length === 1 ? `«${vacantes[0].titulo}»` : cuantas(vacantes.length)}`, () => duplicar(vacantes))) return
    const { copias, deshacer } = duplicarVacantes(vacantes)
    notifyAction(
      vacantes.length === 1 ? `Duplicamos «${vacantes[0].titulo}»` : `Duplicamos ${cuantas(vacantes.length)}`,
      vacantes.length === 1 ? `La copia, «${copias[0].titulo}», quedó en borrador.` : 'Las copias quedaron en borrador.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
    soltar()
  }

  // Sacar del portal o devolver: solo cambian las publicadas; el aviso dice cuáles no y por qué (IN-39).
  const cambiarPortal = (vacantes: VacanteUI[], sacar: boolean) => {
    const cuales = vacantes.filter((vacante) => vacante.estado === 'Publicada' && vacante.oculta !== sacar)
    const otras = vacantes.filter((vacante) => !cuales.includes(vacante))
    if (!cuales.length) {
      notify(sacar ? 'Ninguna está visible en el portal' : 'Ninguna está oculta del portal', 'Solo cambian las publicadas.', 'info')
      return
    }
    if (noSeGuardo(`portal:${cuales.map((vacante) => vacante.id).join(',')}:${sacar}`, sacar ? 'No pudimos ocultarlas del portal' : 'No pudimos mostrarlas en el portal', () => cambiarPortal(vacantes, sacar), 'Siguen como estaban.')) return
    const deshacer = cambiarVacantes(cuales, { oculta: sacar })
    notifyAction(
      sacar
        ? `${cuales.length === 1 ? `«${cuales[0].titulo}» quedó oculta` : `${cuantas(cuales.length)} quedaron ocultas`} del portal`
        : `${cuales.length === 1 ? `«${cuales[0].titulo}» vuelve a verse` : `${cuantas(cuales.length)} vuelven a verse`} en el portal`,
      otras.length
        ? `${otras.length === 1 ? `«${otras[0].titulo}» no cambió` : `${cuantas(otras.length)} no cambiaron`}: no ${otras.length === 1 ? 'estaba' : 'estaban'} publicada${otras.length === 1 ? '' : 's'}.`
        : sacar
          ? 'Nadie nuevo puede aplicar.'
          : 'Cualquiera puede verlas y aplicar.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
    soltar()
  }

  // Cambios de estado desde su ventana (publicar, reabrir, cerrar, volver a borrador): cada vacante con su cambio.
  const aplicarEstado = (cambios: CambioDeEstado[], avisar: string[], destino: EstadoPublicacion, todas: VacanteUI[]) => {
    if (noSeGuardo(`estado:${cambios.map(({ vacante }) => vacante.id).join(',')}:${destino}`, 'No pudimos cambiar el estado', () => aplicarEstado(cambios, avisar, destino, todas), 'Siguen como estaban.')) {
      setVentana(null)
      return
    }
    const deshacer = cambios.map(({ vacante, cambio }) => cambiarVacantes([vacante], cambio))
    const deshacerCorreo = avisar.length ? anotarCorreo(avisar, 'Reabrimos la vacante') : null
    const hechas = cambios.map(({ vacante }) => vacante)
    const sinCambio = todas.filter((vacante) => !hechas.includes(vacante))
    const una = hechas.length === 1 ? hechas[0] : null
    const reabiertas = cambios.filter(({ cambio }) => cambio.diasAbierta === 0)
    notifyAction(
      destino === 'Publicada'
        ? reabiertas.length
          ? una ? `Reabrimos «${una.titulo}»` : `Reabrimos ${cuantas(hechas.length)}`
          : una ? `Publicamos «${una.titulo}»` : `Publicamos ${cuantas(hechas.length)}`
        : destino === 'Cerrada'
          ? una ? `Cerramos «${una.titulo}»` : `Cerramos ${cuantas(hechas.length)}`
          : una ? `«${una.titulo}» volvió a borrador` : `${cuantas(hechas.length)} volvieron a borrador`,
      // Una línea: lo que no cambió, si algo quedó igual; si no, lo que pasa ahora.
      sinCambio.length
        ? `${sinCambio.length === 1 ? `«${sinCambio[0].titulo}» no cambió` : `${cuantas(sinCambio.length)} no cambiaron`}.`
        : destino === 'Publicada'
          ? avisar.length
            ? `Les escribimos a ${avisar.length} ${plural(avisar.length, 'persona', 'personas')} del proceso.`
            : 'Ya reciben aplicaciones.'
          : destino === 'Cerrada'
            ? 'Ya no reciben aplicaciones.'
            : 'Nadie las ve fuera del equipo.',
      {
        label: 'Deshacer',
        onClick: () => {
          deshacer.forEach((uno) => uno())
          deshacerCorreo?.()
        },
      },
      'success',
    )
    setVentana(null)
    soltar()
  }

  // Quién lleva cada vacante (o nadie).
  const reasignar = (vacantes: VacanteUI[], nombre: string) => {
    setVentana(null)
    if (noSeGuardo(`reclutador:${vacantes.map((vacante) => vacante.id).join(',')}:${nombre}`, 'No pudimos cambiar quién la lleva', () => reasignar(vacantes, nombre), 'Sigue con quien estaba.')) return
    const iniciales = nombre ? nombre.split(' ').map((parte) => parte[0]).slice(0, 2).join('') : ''
    const deshacer = cambiarVacantes(vacantes, { reclutador: { nombre, iniciales } })
    notifyAction(
      vacantes.length === 1 ? `«${vacantes[0].titulo}» ${nombre ? `ahora la lleva ${nombre}` : 'quedó sin asignar'}` : `${cuantas(vacantes.length)} ${nombre ? `ahora las lleva ${nombre}` : 'quedaron sin asignar'}`,
      nombre ? `${nombre} ve sus pendientes en el inicio.` : 'Quedan como «Sin asignar».',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
    soltar()
  }

  // Poner, crear o quitar carpetas. Una nueva sale de una vez en el filtro de «Vacante».
  const etiquetar = (vacantes: VacanteUI[], poner: string[], quitar: string[]) => {
    setVentana(null)
    if (noSeGuardo(`etiquetas:${vacantes.map((vacante) => vacante.id).join(',')}:${poner.join('|')}:${quitar.join('|')}`, 'No pudimos guardar las carpetas', () => etiquetar(vacantes, poner, quitar), 'Siguen en las que estaban.')) return
    const hecho = etiquetarVacantes(vacantes, poner, quitar)
    const [titulo, detalle] = avisoDeEtiquetas(vacantes, hecho.poner, quitar, hecho.nuevas)
    notifyAction(titulo, detalle, { label: 'Deshacer', onClick: hecho.deshacer }, 'success')
    soltar()
  }

  const eliminar = (vacantes: VacanteUI[]) => {
    if (noSeGuardo(`eliminar:${vacantes.map((vacante) => vacante.id).join(',')}`, `No pudimos eliminar ${vacantes.length === 1 ? `«${vacantes[0].titulo}»` : cuantas(vacantes.length)}`, () => eliminar(vacantes), 'Siguen con su proceso.')) {
      setVentana(null)
      return
    }
    // Sin «Deshacer»: eliminar cancela entrevistas y devuelve créditos; por eso se confirma escribiendo la palabra.
    eliminarVacantes(vacantes)
    notify(vacantes.length === 1 ? `«${vacantes[0].titulo}» eliminada` : `Eliminamos ${cuantas(vacantes.length)}`, 'Con su proceso y sus aplicaciones.', 'success')
    setVentana(null)
    soltar()
  }

  const abrir = (vacante: VacanteUI) => navigate(`${ruta}/${vacante.id}`)
  const editar = (vacante: VacanteUI, paso?: number) => navigate(`${ruta}/${vacante.id}/editar`, { state: { volverA: ruta, ...(paso ? { paso } : {}) } })

  const acciones: AccionesFila = {
    abrir,
    editar,
    duplicar: (vacante) => duplicar([vacante]),
    compartir: (vacante) => setVentana({ tipo: 'compartir', vacante }),
    portal: (vacante) => cambiarPortal([vacante], !vacante.oculta),
    estado: (vacante, destino) => setVentana({ tipo: 'estado', vacantes: [vacante], destino }),
    reclutador: (vacante) => setVentana({ tipo: 'reclutador', vacantes: [vacante] }),
    etiquetas: (vacante) => setVentana({ tipo: 'etiquetas', vacantes: [vacante] }),
    eliminar: (vacante) => setVentana({ tipo: 'eliminar', vacantes: [vacante] }),
  }

  const vacantesElegidas = elegidas.map((fila) => fila.vacante)
  const icono = (forma: typeof Folder01Icon) => <HugeiconsIcon icon={forma} aria-hidden="true" />

  const config: DataGridListConfig<Fila> = {
    columns: columnasVacantes,
    columnFilters,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Cargo, área o reclutador',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: setElegidas },
    // La librería trae en inglés el nombre del asa de cada columna para los lectores de pantalla.
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    // Lo que se hace con las elegidas (13 oct, PM: «yo dejaría poner carpeta, duplicar, cerrar o eliminar»), en la cabecera
    // de la tabla junto al buscador. Sin publicar, ocultar del portal, cambiar el reclutador ni exportar en lote: eso se
    // hace vacante por vacante. «Cerrar» solo sirve si alguna está publicada (IN-39).
    bulkActions: [
      { id: 'carpetas', label: 'Poner en carpeta', icon: icono(Folder01Icon), visibility: 'always', onClick: (filas) => setVentana({ tipo: 'etiquetas', vacantes: filas.map((fila) => fila.vacante) }) },
      { id: 'duplicar', label: 'Duplicar', icon: icono(Copy01Icon), visibility: 'always', onClick: (filas) => duplicar(filas.map((fila) => fila.vacante)) },
      {
        id: 'cerrar',
        label: 'Cerrar',
        icon: icono(SquareLock02Icon),
        visibility: 'always',
        disabled: !vacantesElegidas.some((vacante) => vacante.estado === 'Publicada'),
        onClick: (filas) => setVentana({ tipo: 'estado', vacantes: filas.map((fila) => fila.vacante), destino: 'Cerrada' }),
      },
      { id: 'eliminar', label: 'Eliminar', variant: 'destructive', icon: icono(Delete02Icon), visibility: 'always', onClick: (filas) => setVentana({ tipo: 'eliminar', vacantes: filas.map((fila) => fila.vacante) }) },
    ],
    // Las carpetas de la empresa (verlas, crearlas, meter vacantes, renombrarlas y eliminarlas) junto a los controles de la
    // tabla; mirando una sola carpeta, «Ver todas» al lado.
    actions: {
      secondary: [
        ...(carpeta ? [{ id: 'ver-todas', label: 'Ver todas', icon: icono(Cancel01Icon), onClick: () => setCarpeta(null) }] : []),
        ...(filas.length ? [{ id: 'carpetas', label: 'Carpetas', icon: icono(Folder01Icon), onClick: () => setEtiquetasAbierto(true) }] : []),
      ],
    },
    frame: carpeta ? { description: `${cuantas(resultado.length)} en «${carpeta}»` } : undefined,
    // Los dos estados vacíos del design system: «Sin resultados» cuando la búsqueda o los filtros dejan fuera todo, y
    // «Primera vez» cuando todavía no hay ninguna vacante (IN-24).
    emptyState: filas.length
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos + (carpeta ? 1 : 0)} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay vacantes"
              descripcion="Crea la primera: aquí la encuentras con sus candidatos y lo que espera una acción tuya."
              accion={{ texto: 'Crear vacante', icono: PlusSignIcon, onClick: () => navigate(`${ruta}/crear`) }}
            />
          ),
        },
  }

  return (
    <section aria-label="Tus vacantes">
      <ContextoTabla.Provider value={{ ruta, lecturas, acciones }}>
        <div ref={caja} onClick={abrirFila} className="[&_tbody_tr]:cursor-pointer">
          <TablaDatos
            key={version}
            config={config}
            data={enPagina}
            isLoading={cargando}
            initialRowSelection={sinSeleccion}
            titulo="Tus vacantes"
            paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }}
            nombre="vacantes"
            singular="vacante"
            id="tus-vacantes"
          />
        </div>
      </ContextoTabla.Provider>

      <DialogoEstadoVacante
        vacantes={ventana?.tipo === 'estado' ? ventana.vacantes : []}
        destino={ventana?.tipo === 'estado' ? ventana.destino : null}
        onCerrar={() => setVentana(null)}
        onAplicar={(cambios, avisar) => ventana?.tipo === 'estado' && aplicarEstado(cambios, avisar, ventana.destino, ventana.vacantes)}
        onTerminar={(vacante, paso) => {
          setVentana(null)
          editar(vacante, paso)
        }}
      />

      <DialogoEliminarVacantes
        vacantes={ventana?.tipo === 'eliminar' ? ventana.vacantes : []}
        onCerrar={() => setVentana(null)}
        onConfirmar={() => ventana?.tipo === 'eliminar' && eliminar(ventana.vacantes)}
        onCerrarEnSuLugar={() =>
          ventana?.tipo === 'eliminar' &&
          setVentana({ tipo: 'estado', vacantes: ventana.vacantes.filter((vacante) => vacante.estado !== 'Cerrada'), destino: 'Cerrada' })
        }
      />

      <DialogoCompartirVacante
        vacante={ventana?.tipo === 'compartir' ? ventana.vacante : null}
        abierto={ventana?.tipo === 'compartir'}
        onAbierto={(abierto) => (abierto ? undefined : setVentana(null))}
        onEquipo={(equipo) => {
          if (ventana?.tipo !== 'compartir') return
          cambiarVacantes([ventana.vacante], { equipo })
          estadoInicio.tocar()
        }}
      />

      <DialogoReclutador
        vacantes={ventana?.tipo === 'reclutador' ? ventana.vacantes : []}
        reclutadores={reclutadores.filter((nombre) => nombre !== SIN_ASIGNAR)}
        onCerrar={() => setVentana(null)}
        onConfirmar={(nombre) => ventana?.tipo === 'reclutador' && reasignar(ventana.vacantes, nombre)}
      />

      <PanelEtiquetas
        abierto={etiquetasAbierto}
        onAbierto={setEtiquetasAbierto}
        onVerEnTabla={(etiqueta) => {
          setEtiquetasAbierto(false)
          setCarpeta(etiqueta)
          setPagina(1)
        }}
      />

      {ventana?.tipo === 'etiquetas' ? (
        <VentanaEtiquetas
          titulo={ventana.vacantes.length === 1 ? `Carpetas de «${ventana.vacantes[0].titulo}»` : `Carpetas de ${cuantas(ventana.vacantes.length)}`}
          sub="Agrupan las vacantes y sirven para filtrar la lista. Una vacante puede estar en varias."
          deCada={ventana.vacantes.map((vacante) => vacante.etiquetas)}
          disponibles={etiquetasDeVacantes()}
          onOpenChange={(abierto) => (abierto ? undefined : setVentana(null))}
          onConfirmar={(poner, quitar) => etiquetar(ventana.vacantes, poner, quitar)}
        />
      ) : null}
    </section>
  )
}

/* Las celdas --------------------------------------------------------------------------------------------------------- */

// La celda que nombra algo en la tabla del sistema: el puesto, que abre la vacante, y debajo su área y sus carpetas.
// Mientras la IA lee sus CVs (pedido desde el tablero), la línea gris lo dice (IN-32).
function CeldaVacante({ fila }: { fila: Fila }) {
  const { ruta, lecturas } = useContext(ContextoTabla)
  const lectura = lecturas[fila.id]
  return (
    <CeldaTitulo
      titulo={fila.titulo}
      to={`${ruta}/${fila.id}`}
      detalle={
        lectura?.estado === 'leyendo' ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <IconoIA />
            La IA está leyendo {lectura.cuantos} CVs…
          </span>
        ) : (
          // Las carpetas viven en la tabla (8 oct, Nicolás: «deben estar afuera de crear una vacante y más atadas a la
          // tabla»): se ven en la fila, se ponen desde su «⋯» o con las elegidas y se filtran desde «Vacante». Se llaman
          // «Carpetas», como en el producto (13 oct, PM). La primera y «+N» con las demás al pasar el cursor.
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {fila.vacante.area}
            <CarpetasDeFila carpetas={fila.vacante.etiquetas} />
          </span>
        )
      }
    />
  )
}

// Los días y, debajo, desde cuándo (IN-38). En una cerrada no cuentan días: dice cuándo cerró (IN-33).
function CeldaDias({ vacante }: { vacante: VacanteUI }) {
  if (vacante.estado === 'Borrador') {
    return (
      <Text as="span" variant="muted" size="sm">
        Sin publicar
      </Text>
    )
  }
  if (vacante.estado === 'Cerrada') {
    const cuando = vacante.desenlace?.split(' · ')[0].replace(/^Cerrada /, '') ?? ''
    return (
      <span className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" variant="muted" size="sm">
          Cerrada
        </Text>
        {cuando ? (
          <Text as="span" variant="muted" size="xs" className="truncate">
            {cuando}
          </Text>
        ) : null}
      </span>
    )
  }
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <Text as="span" size="sm" className="tabular-nums">
          {vacante.diasAbierta}
        </Text>
        {estancada(vacante) ? <Badge variant="warning-light">Estancada</Badge> : null}
      </span>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {vacante.diasAbierta === 0 ? (vacante.historial?.length ? 'Reabierta hoy' : 'Desde hoy') : `Desde el ${fechaCortaHace(vacante.diasAbierta)}`}
      </Text>
    </span>
  )
}

// El estado: publicada, borrador o cerrada. Ocultarla del portal no es un estado (13 oct, PM: «eso es una configuración de
// la vacante, un switch»): la insignia sigue diciendo «Publicada» y al lado un ojo tachado avisa que no sale en el portal.
function CeldaEstado({ vacante }: { vacante: VacanteUI }) {
  const oculta = vacante.estado === 'Publicada' && vacante.oculta
  return (
    <span className="flex items-center gap-1.5">
      <Badge variant={ESTADO_INSIGNIA[vacante.estado]}>{vacante.estado}</Badge>
      {oculta ? (
        <Hint label="No sale en el portal de empleo" side="top">
          <HugeiconsIcon icon={ViewOffSlashIcon} size={16} className="text-muted-foreground" aria-label="No sale en el portal de empleo" />
        </Hint>
      ) : null}
    </span>
  )
}

// El «⋯» de cada fila: lo mismo que la cabecera de la vacante, con sus mismas ventanas (IN-04, IN-05, IN-06, IN-09).
function MenuDeFila({ vacante }: { vacante: VacanteUI }) {
  const { acciones } = useContext(ContextoTabla)
  const publicada = vacante.estado === 'Publicada'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${vacante.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => acciones.abrir(vacante)}>
            <HugeiconsIcon icon={EyeIcon} aria-hidden="true" />
            Ver candidatos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => acciones.editar(vacante)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Editar vacante
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => acciones.duplicar(vacante)}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => acciones.compartir(vacante)}>
            <HugeiconsIcon icon={Share08Icon} aria-hidden="true" />
            Compartir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => acciones.reclutador(vacante)}>
            <HugeiconsIcon icon={UserSwitchIcon} aria-hidden="true" />
            Cambiar reclutador
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => acciones.etiquetas(vacante)}>
            <HugeiconsIcon icon={Folder01Icon} aria-hidden="true" />
            Carpetas
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {vacante.estado === 'Borrador' ? (
            <DropdownMenuItem onClick={() => acciones.estado(vacante, 'Publicada')}>
              <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
              Publicar
            </DropdownMenuItem>
          ) : null}
          {publicada ? (
            <DropdownMenuItem onClick={() => acciones.portal(vacante)}>
              <HugeiconsIcon icon={vacante.oculta ? ViewIcon : PauseIcon} aria-hidden="true" />
              {vacante.oculta ? 'Mostrar en el portal' : 'Ocultar del portal'}
            </DropdownMenuItem>
          ) : null}
          {publicada ? (
            <DropdownMenuItem onClick={() => acciones.estado(vacante, 'Cerrada')}>
              <HugeiconsIcon icon={SquareLock02Icon} aria-hidden="true" />
              Cerrar la vacante
            </DropdownMenuItem>
          ) : null}
          {vacante.estado === 'Cerrada' ? (
            <DropdownMenuItem onClick={() => acciones.estado(vacante, 'Publicada')}>
              <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
              Reabrir
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => acciones.eliminar(vacante)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar vacante
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* Cambiar el reclutador ---------------------------------------------------------------------------------------------- */

// Reasignar una o varias, o dejarlas «Sin asignar» (IN-40).
function DialogoReclutador({
  vacantes,
  reclutadores,
  onCerrar,
  onConfirmar,
}: {
  vacantes: VacanteUI[]
  reclutadores: string[]
  onCerrar: () => void
  onConfirmar: (nombre: string) => void
}) {
  const una = vacantes.length === 1 ? vacantes[0] : null
  const actual = una ? una.reclutador.nombre : ''
  const [elegido, setElegido] = useState<string | null>(null)
  const valor = elegido ?? (actual || 'sin-asignar')
  return (
    <VentanaDeAccion
      open={vacantes.length > 0}
      onOpenChange={(abierto) => {
        if (abierto) return
        setElegido(null)
        onCerrar()
      }}
      title={una ? `¿Quién lleva «${una.titulo}»?` : `¿Quién lleva estas ${vacantes.length} vacantes?`}
      sub="Quien la lleve ve sus pendientes en el inicio y recibe los avisos del proceso."
      confirmLabel="Guardar"
      onConfirm={() => {
        onConfirmar(valor === 'sin-asignar' ? '' : valor)
        setElegido(null)
      }}
    >
      <CampoFiltro
        id="reasignar-reclutador"
        nombre="Reclutador"
        valor={valor}
        opciones={[...reclutadores.map((nombre) => ({ value: nombre, label: nombre })), { value: 'sin-asignar', label: SIN_ASIGNAR }]}
        onCambiar={setElegido}
      />
    </VentanaDeAccion>
  )
}
