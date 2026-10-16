import { createContext, useContext, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent, type SetStateAction } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  Edit02Icon,
  EyeIcon,
  FilterIcon,
  FilterResetIcon,
  Location01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  Search01Icon,
  Share08Icon,
  SquareLock02Icon,
  Tag01Icon,
  UserIcon,
  UserSwitchIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Text,
  TooltipProvider,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { plural } from '@/modules/design-system/patrones/formato'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { CANDIDATURAS, ESPERA_RESPUESTA, type Candidatura, type EstadoPublicacion, type VacanteUI } from '../../../propuestas/datos'
import { QUIEN_MUEVE, registroDeMovimientos } from '../../../propuestas/movimientos'
import { anotarCorreo } from '../../../propuestas/base'
import { fechaCortaHace } from '../../../propuestas/publicar'
import { useCarga } from '../../../propuestas/components/carga'
import { FiltroChip } from '../../../propuestas/components/filtro-chip'
import { CampoFiltro } from '../../../propuestas/components/filtros-base'
import { DialogoCompartirVacante } from '../../../propuestas/components/acciones-vacante'
import { DialogoEliminarVacantes, DialogoEstadoVacante, type CambioDeEstado } from '../../../propuestas/components/dialogos-vacante'
import { VentanaEtiquetas } from '../../../propuestas/components/dialogos-base'
import { PanelEtiquetas } from './etiquetas-vacantes'
import { avisoDeEtiquetas, cambiarVacantes, duplicarVacantes, eliminarVacantes, etiquetarVacantes, etiquetasDeVacantes, vacantesDeLaSesion } from './acciones'
import { DIAS_ESTANCADA } from './atencion'
import { estadoInicio, useEstadoInicio, type Lectura } from './estado'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { noSeGuardo } from '../../../propuestas/simular'

// «Tus vacantes»: la tabla del inicio. Es la tabla del sistema (`TablaDatos`): el 9 oct, decisión 4a de Cristian (H-248,
// H-250), volvió a ella desde la `MarcoTabla` propia que traía desde el 7 oct, con todo lo que esa había sumado. Arriba, en
// lo gris, el conteo a la izquierda y «Etiquetas», «Exportar» y «Personalizar columnas» a la derecha; en los encabezados,
// el orden de cada columna; las acciones de lo elegido salen en esa misma cabecera, como iconos con su nombre al pasar el
// cursor; y abajo, el paginador del sistema en español.
//
// Encima de la tabla van el buscador, «Filtros» con su globo y lo puesto con su «x» (los grupos por estado viven dentro de
// «Filtros»). No van en la cabecera de la tabla porque la de la librería no deja leerlos ni escribirlos desde fuera, y aquí
// se leen y se limpian desde el vacío y desde la dirección. `DataGridList` guarda su búsqueda, su filtro y su selección
// por dentro: tras una acción con varias el buscador quedaba en blanco y la lista seguía filtrada (IN-03), el filtro de
// estado iba en la cabecera de la columna (IN-19) y la selección se perdía al cambiar de página (IN-34). Por eso lo
// elegido se guarda por vacante en la pantalla y se le devuelve a la tabla (`initialRowSelection`).
//
// Las columnas son las que pidió Elkin (29 sep) —nombre y área, estado, sede, aplicaciones, días abierta, quién espera y
// reclutador— más el «⋯» de cada fila, que no se va de la vista. Lo que se mira (búsqueda, grupo, filtros y página) va en la
// dirección: al volver de una vacante o al compartir el enlace se ve lo mismo (IN-35). El orden por columna no: la tabla del
// sistema guarda su flecha por dentro y no deja ponerla desde fuera, así que al volver de una vacante parte sin orden.

type Estado = 'Publicada' | 'Oculta del portal' | 'Borrador' | 'Cerrada'

const ESTADO_INSIGNIA: Record<Estado, 'success-light' | 'warning-light' | 'secondary' | 'outline'> = {
  Publicada: 'success-light',
  'Oculta del portal': 'warning-light',
  Borrador: 'secondary',
  Cerrada: 'outline',
}

const estadoDe = (vacante: VacanteUI): Estado => (vacante.estado === 'Publicada' && vacante.oculta ? 'Oculta del portal' : vacante.estado)
const estancada = (vacante: VacanteUI) => vacante.estado === 'Publicada' && vacante.diasAbierta >= DIAS_ESTANCADA

// Buscar sin tildes ni mayúsculas, como el catálogo de plantillas y Mis candidatos (IN-18).
const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const SIN_ASIGNAR = 'Sin asignar'
const reclutadorDe = (vacante: VacanteUI) => vacante.reclutador.nombre.trim() || SIN_ASIGNAR
const ciudadDe = (vacante: VacanteUI) => vacante.sede.split(' · ')[0]

/* Lo que se mira, en la dirección --------------------------------------------------------------------------------- */

// Los estados: uno a la vez. Sin ninguno se ven todas. Viven dentro de «Filtros», no en chips sueltos bajo el buscador
// (8 oct, VP de producto: «quitaría esos quick links; todo sea por filtros, de lo más general a lo más a detalle, en vez
// de que todo quede por ahí regado»). «Estancadas» va con los estados porque se lee igual: en qué va la vacante.
const GRUPOS = [
  { valor: 'publicadas', texto: 'Publicadas', es: (v: VacanteUI) => v.estado === 'Publicada' && !v.oculta },
  { valor: 'fuera', texto: 'Ocultas del portal', es: (v: VacanteUI) => v.estado === 'Publicada' && v.oculta },
  { valor: 'estancadas', texto: `Estancadas (más de ${DIAS_ESTANCADA} días)`, es: estancada },
  { valor: 'borradores', texto: 'Borradores', es: (v: VacanteUI) => v.estado === 'Borrador' },
  { valor: 'cerradas', texto: 'Cerradas', es: (v: VacanteUI) => v.estado === 'Cerrada' },
] as const

type Orden = 'titulo' | 'aplicaciones' | 'dias' | 'esperan'

// El orden de cada columna de la tabla, y si va, de por sí, de mayor a menor (el nombre, de la A a la Z; lo demás, de más a
// menos): la flecha del encabezado da la vuelta a lo que va al revés.
const ORDEN_DE_COLUMNA: Record<string, Orden> = { titulo: 'titulo', aplicaciones: 'aplicaciones', diasAbierta: 'dias', esperan: 'esperan' }
const DE_MAYOR_A_MENOR: Record<Orden, boolean> = { titulo: false, aplicaciones: true, dias: true, esperan: true }

type Vista = {
  q: string
  grupo: string
  etiqueta: string
  reclutador: string
  area: string
  sede: string
  pagina: number
  porPagina: number
}

const vistaDe = (parametros: URLSearchParams): Vista => ({
  q: parametros.get('q') ?? '',
  grupo: parametros.get('estado') ?? '',
  etiqueta: parametros.get('etiqueta') ?? '',
  reclutador: parametros.get('reclutador') ?? '',
  area: parametros.get('area') ?? '',
  sede: parametros.get('sede') ?? '',
  pagina: Math.max(1, Number(parametros.get('pagina') ?? 1) || 1),
  porPagina: Number(parametros.get('filas') ?? 10) || 10,
})

function useVista() {
  const [parametros, setParametros] = useSearchParams()
  const vista = vistaDe(parametros)
  // Dos cambios seguidos en el mismo clic (el pie de página cambia las filas y después vuelve a la página 1) tienen que
  // sumarse: el segundo parte del primero y no de lo que había al dibujar.
  const pendiente = useRef<URLSearchParams | null>(null)
  // Cambiar lo que se mira vuelve a la primera página, salvo que se esté cambiando de página.
  const cambiar = (cambio: Partial<Vista>) => {
    const base = pendiente.current ?? parametros
    const siguiente = { ...vistaDe(base), ...('pagina' in cambio ? {} : { pagina: 1 }), ...cambio }
    const nuevos = new URLSearchParams(base)
    const poner = (clave: string, valor: string, vacio = '') => (valor && valor !== vacio ? nuevos.set(clave, valor) : nuevos.delete(clave))
    poner('q', siguiente.q)
    poner('estado', siguiente.grupo)
    poner('etiqueta', siguiente.etiqueta)
    poner('reclutador', siguiente.reclutador)
    poner('area', siguiente.area)
    poner('sede', siguiente.sede)
    poner('pagina', String(siguiente.pagina), '1')
    poner('filas', String(siguiente.porPagina), '10')
    pendiente.current = nuevos
    queueMicrotask(() => {
      pendiente.current = null
    })
    setParametros(nuevos, { replace: true, preventScrollReset: true })
  }
  return { vista, cambiar }
}

/* Las filas ---------------------------------------------------------------------------------------------------------- */

// La tabla lee cada fila por su `id` y ordena por el nombre de cada columna: por eso la fila lleva sus datos sueltos.
type Fila = {
  id: string
  vacante: VacanteUI
  estado: Estado
  esperan: Candidatura[]
  titulo: string
  sede: string
  aplicaciones: number
  diasAbierta: number
  masViejo: number
  reclutador: string
}

function filasDe(registro: readonly { candidaturaId: string }[]): Fila[] {
  const movidas = new Set(registro.map((movimiento) => movimiento.candidaturaId))
  // Con `?simular=vacio` (una empresa que empieza) no hay ninguna: la tabla muestra su estado vacío (IN-24).
  return vacantesDeLaSesion().map((vacante) => {
    // En una cerrada también se cuenta: esa gente sigue esperando una respuesta (IN-30).
    const esperan = CANDIDATURAS.filter((c) => c.vacante.id === vacante.id && ESPERA_RESPUESTA(c) && !movidas.has(c.id)).sort((a, b) => b.dias - a.dias)
    return {
      id: vacante.id,
      vacante,
      estado: estadoDe(vacante),
      esperan,
      titulo: vacante.titulo,
      sede: vacante.sede,
      aplicaciones: vacante.aplicaciones,
      diasAbierta: vacante.diasAbierta,
      masViejo: esperan[0]?.dias ?? 0,
      reclutador: reclutadorDe(vacante),
    }
  })
}

const ORDENAR: Record<Orden, (a: Fila, b: Fila) => number> = {
  titulo: (a, b) => a.vacante.titulo.localeCompare(b.vacante.titulo, 'es'),
  aplicaciones: (a, b) => b.vacante.aplicaciones - a.vacante.aplicaciones,
  // Las cerradas y los borradores no están «abiertas»: van al final, y entre ellas las más recientes primero (IN-33).
  dias: (a, b) => {
    const abierta = (fila: Fila) => (fila.vacante.estado === 'Publicada' ? 1 : 0)
    return abierta(b) - abierta(a) || b.vacante.diasAbierta - a.vacante.diasAbierta
  },
  esperan: (a, b) => b.esperan.length - a.esperan.length || (b.esperan[0]?.dias ?? 0) - (a.esperan[0]?.dias ?? 0),
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
  const registro = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  // Se suscribe para volver a leer la lista cuando se duplica, elimina o cambia una vacante (la lista compartida no avisa).
  const { lecturas } = useEstadoInicio()
  const { vista, cambiar } = useVista()
  const [orden, setOrden] = useState<{ clave: Orden; inverso: boolean } | null>(null)
  const [marcadas, setMarcadasLibre] = useState<string[]>([])
  // Cuando lo elegido cambia por fuera de las casillas (quitar la selección, «Elegir las N…», al terminar una acción), la
  // tabla tarda una pintada en enterarse y, mientras, avisa lo que tenía marcado antes. Esos avisos se ignoran hasta que
  // la tabla dice lo mismo que la pantalla; si no, cada una corrige a la otra sin fin.
  const esperandoTabla = useRef(false)
  const setMarcadas = (siguientes: string[] | ((antes: string[]) => string[])) =>
    setMarcadasLibre((antes) => {
      const despues = typeof siguientes === 'function' ? siguientes(antes) : siguientes
      if (despues.length === antes.length && despues.every((id, i) => id === antes[i])) return antes
      esperandoTabla.current = true
      return despues
    })
  const [ventana, setVentana] = useState<Ventana | null>(null)
  const [etiquetasAbierto, setEtiquetasAbierto] = useState(false)

  const filas = filasDe(registro)

  // Las opciones de «Filtros» salen de las vacantes que hay.
  const opciones = useMemo(() => {
    const unicas = (lista: string[]) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'es'))
    return {
      estados: GRUPOS.filter((grupo) => filas.some((fila) => grupo.es(fila.vacante))).map((grupo) => grupo.valor as string),
      // Todas las que existen, también las que todavía no lleva ninguna (VP: «que te aparezcan todas las carpetas»).
      etiquetas: etiquetasDeVacantes(),
      reclutadores: unicas(filas.map((fila) => reclutadorDe(fila.vacante))),
      areas: unicas(filas.map((fila) => fila.vacante.area)),
      sedes: unicas(filas.map((fila) => ciudadDe(fila.vacante))),
    }
  }, [filas])

  const resultado = useMemo(() => {
    let lista = [...filas]
    const texto = normal(vista.q)
    // También por reclutador: buscar «Laura» trae las suyas (IN-08).
    if (texto) lista = lista.filter((fila) => normal(`${fila.vacante.titulo} ${fila.vacante.area} ${fila.vacante.sede} ${reclutadorDe(fila.vacante)}`).includes(texto))
    const grupo = GRUPOS.find((uno) => uno.valor === vista.grupo)
    if (grupo) lista = lista.filter((fila) => grupo.es(fila.vacante))
    if (vista.etiqueta) lista = lista.filter((fila) => fila.vacante.etiquetas.includes(vista.etiqueta))
    if (vista.reclutador) lista = lista.filter((fila) => reclutadorDe(fila.vacante) === vista.reclutador)
    if (vista.area) lista = lista.filter((fila) => fila.vacante.area === vista.area)
    if (vista.sede) lista = lista.filter((fila) => ciudadDe(fila.vacante) === vista.sede)
    if (orden) {
      lista.sort(ORDENAR[orden.clave])
      if (orden.inverso) lista.reverse()
    }
    return lista
  }, [filas, vista, orden])

  // La paginación, también en la dirección.
  const paginas = Math.max(1, Math.ceil(resultado.length / vista.porPagina))
  const pagina = Math.min(vista.pagina, paginas)
  const enPagina = resultado.slice((pagina - 1) * vista.porPagina, pagina * vista.porPagina)
  const paginacion = {
    porPagina: vista.porPagina,
    setPorPagina: (valor: SetStateAction<number>) => cambiar({ porPagina: typeof valor === 'function' ? valor(vista.porPagina) : valor }),
    pagina,
    setPagina: (valor: SetStateAction<number>) => cambiar({ pagina: typeof valor === 'function' ? valor(pagina) : valor }),
    total: resultado.length,
  }

  const cargando = useCarga({ q: vista.q, grupo: vista.grupo, e: vista.etiqueta, r: vista.reclutador, a: vista.area, s: vista.sede, o: orden, pagina, f: vista.porPagina })

  // Lo elegido se guarda por vacante, no por página: sigue elegido al cambiar de página o de filtro (IN-34).
  const porId = new Map(filas.map((fila) => [fila.vacante.id, fila]))
  const elegidas = marcadas.map((id) => porId.get(id)).filter((fila): fila is Fila => Boolean(fila))
  const marcadasSet = new Set(elegidas.map((fila) => fila.vacante.id))
  const paginaEntera = enPagina.length > 0 && enPagina.every((fila) => marcadasSet.has(fila.vacante.id))
  const todasElegidas = resultado.length > 0 && resultado.every((fila) => marcadasSet.has(fila.vacante.id))
  const marcar = (ids: string[], si: boolean) => setMarcadas((antes) => (si ? [...new Set([...antes, ...ids])] : antes.filter((id) => !ids.includes(id))))
  // Las casillas de la tabla: quien está marcada en cualquier página sigue marcada al volver a ella.
  const seleccion = useMemo(() => Object.fromEntries(marcadas.map((id) => [id, true])), [marcadas])

  const puestos = [vista.grupo, vista.etiqueta, vista.reclutador, vista.area, vista.sede].filter(Boolean).length
  const hayFiltros = Boolean(vista.q || puestos)
  const limpiar = () => cambiar({ q: '', ...SIN_FILTROS })

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
    setMarcadas([])
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
    setMarcadas([])
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
    setMarcadas([])
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
    setMarcadas([])
  }

  // Poner, crear o quitar etiquetas (las carpetas del producto). Una nueva sale de una vez en «Filtros».
  const etiquetar = (vacantes: VacanteUI[], poner: string[], quitar: string[]) => {
    setVentana(null)
    if (noSeGuardo(`etiquetas:${vacantes.map((vacante) => vacante.id).join(',')}:${poner.join('|')}:${quitar.join('|')}`, 'No pudimos guardar las etiquetas', () => etiquetar(vacantes, poner, quitar), 'Siguen con las que tenían.')) return
    const hecho = etiquetarVacantes(vacantes, poner, quitar)
    const [titulo, detalle] = avisoDeEtiquetas(vacantes, hecho.poner, quitar, hecho.nuevas)
    notifyAction(titulo, detalle, { label: 'Deshacer', onClick: hecho.deshacer }, 'success')
    setMarcadas([])
  }

  const eliminar = (vacantes: VacanteUI[]) => {
    if (noSeGuardo(`eliminar:${vacantes.map((vacante) => vacante.id).join(',')}`, `No pudimos eliminar ${vacantes.length === 1 ? `«${vacantes[0].titulo}»` : cuantas(vacantes.length)}`, () => eliminar(vacantes), 'Siguen con su proceso.')) {
      setVentana(null)
      return
    }
    const deshacer = eliminarVacantes(vacantes)
    notifyAction(vacantes.length === 1 ? `«${vacantes[0].titulo}» eliminada` : `Eliminamos ${cuantas(vacantes.length)}`, 'Con su proceso y sus aplicaciones.', { label: 'Deshacer', onClick: deshacer }, 'success')
    setVentana(null)
    setMarcadas((antes) => antes.filter((id) => !vacantes.some((vacante) => vacante.id === id)))
  }

  // La lista filtrada, o lo elegido, a un CSV para llevarlo al comité (IN-37).
  const exportar = (lista: Fila[], nombre: string) => {
    const celda = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`
    const csv = [
      ['Vacante', 'Área', 'Estado', 'Sede', 'Modalidad', 'Aplicaciones', 'Esta semana', 'Días abierta', 'Esperan respuesta', 'Reclutador', 'Cómo terminó'],
      ...lista.map(({ vacante, estado, esperan }) => [
        vacante.titulo,
        vacante.area,
        estado,
        vacante.sede,
        vacante.modalidad,
        vacante.aplicaciones,
        vacante.ultimaSemana,
        vacante.estado === 'Borrador' ? '' : vacante.diasAbierta,
        esperan.length,
        reclutadorDe(vacante),
        vacante.desenlace ?? '',
      ]),
    ]
      .map((fila) => fila.map(celda).join(','))
      .join('\n')
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    enlace.download = `${nombre}.csv`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
    const titulo = `Exportaste ${cuantas(lista.length)}`
    notify(titulo, 'El archivo CSV quedó en tus descargas.', 'success')
  }

  const abrir = (vacante: VacanteUI) => navigate(`${ruta}/${vacante.id}`)
  const editar = (vacante: VacanteUI, paso?: number) => navigate(`${ruta}/${vacante.id}/editar`, { state: { volverA: `${ruta}${window.location.search}`, ...(paso ? { paso } : {}) } })

  // Toda la fila abre la vacante (1 oct, Nicolás: «la card en sí debería poderse dar clic»), salvo lo que ya hace algo.
  // `DataGridList` no deja pasar el clic por fila a su grilla, así que se escucha en el marco y se busca la vacante de la
  // fila tocada. Lo que ya hace algo propio —el nombre, la casilla, el menú «⋯», los botones— se queda con su clic, y
  // seleccionar texto tampoco abre nada. Con teclado se entra por el enlace del nombre, como siempre.
  const abrirDesdeFila = (evento: MouseEvent<HTMLDivElement>) => {
    const destino = evento.target as HTMLElement
    if (destino.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
    const celda = destino.closest('td')
    if (!celda || celda.querySelector('[role="checkbox"], [aria-haspopup]')) return
    if (window.getSelection()?.toString()) return
    const id = celda.closest('tr')?.querySelector<HTMLElement>('[data-vacante]')?.dataset.vacante
    if (id) navigate(`${ruta}/${id}`)
  }

  const acciones: AccionesFila = {
    abrir,
    editar,
    duplicar: (vacante: VacanteUI) => duplicar([vacante]),
    compartir: (vacante: VacanteUI) => setVentana({ tipo: 'compartir', vacante }),
    portal: (vacante: VacanteUI) => cambiarPortal([vacante], !vacante.oculta),
    estado: (vacante: VacanteUI, destino: EstadoPublicacion) => setVentana({ tipo: 'estado', vacantes: [vacante], destino }),
    reclutador: (vacante: VacanteUI) => setVentana({ tipo: 'reclutador', vacantes: [vacante] }),
    etiquetas: (vacante: VacanteUI) => setVentana({ tipo: 'etiquetas', vacantes: [vacante] }),
    eliminar: (vacante: VacanteUI) => setVentana({ tipo: 'eliminar', vacantes: [vacante] }),
  }

  const elegidasVacantes = elegidas.map((fila) => fila.vacante)

  // Lo que se hace con las elegidas, con su nombre y en el orden de siempre (como en Mis candidatos): iconos en la cabecera
  // de la tabla. Solo salen las que aplican a alguna de las elegidas (IN-39).
  const enPortal = elegidasVacantes.filter((vacante) => vacante.estado === 'Publicada' && !vacante.oculta).length
  const fuera = elegidasVacantes.filter((vacante) => vacante.estado === 'Publicada' && vacante.oculta).length
  const publicadas = enPortal + fuera
  const porPublicar = elegidasVacantes.filter((vacante) => vacante.estado !== 'Publicada').length
  const sonTodasCerradas = elegidasVacantes.every((vacante) => vacante.estado === 'Cerrada')
  const icono = (algo: typeof PauseIcon) => <HugeiconsIcon icon={algo} size={16} aria-hidden="true" />
  const accionesDeLasElegidas: NonNullable<DataGridListConfig<Fila>['bulkActions']> = [
    { id: 'reclutador', label: 'Cambiar reclutador', icon: icono(UserSwitchIcon), visibility: 'always', onClick: () => setVentana({ tipo: 'reclutador', vacantes: elegidasVacantes }) },
    { id: 'etiquetas', label: 'Etiquetas', icon: icono(Tag01Icon), visibility: 'always', onClick: () => setVentana({ tipo: 'etiquetas', vacantes: elegidasVacantes }) },
    { id: 'duplicar', label: 'Duplicar', icon: icono(Copy01Icon), visibility: 'always', onClick: () => duplicar(elegidasVacantes) },
    ...(enPortal ? [{ id: 'ocultar', label: 'Ocultar del portal', icon: icono(PauseIcon), visibility: 'always' as const, onClick: () => cambiarPortal(elegidasVacantes, true) }] : []),
    ...(fuera ? [{ id: 'mostrar', label: 'Mostrar en el portal', icon: icono(ViewIcon), visibility: 'always' as const, onClick: () => cambiarPortal(elegidasVacantes, false) }] : []),
    ...(publicadas ? [{ id: 'cerrar', label: 'Cerrar', icon: icono(SquareLock02Icon), visibility: 'always' as const, onClick: () => setVentana({ tipo: 'estado', vacantes: elegidasVacantes, destino: 'Cerrada' }) }] : []),
    ...(porPublicar
      ? [{ id: 'publicar', label: sonTodasCerradas ? 'Reabrir' : 'Publicar', icon: icono(PlayIcon), visibility: 'always' as const, onClick: () => setVentana({ tipo: 'estado', vacantes: elegidasVacantes, destino: 'Publicada' }) }]
      : []),
    { id: 'exportar', label: 'Exportar a CSV', icon: icono(Download04Icon), visibility: 'always', onClick: () => exportar(elegidas, `vacantes-elegidas-${elegidas.length}`) },
    { id: 'quitar', label: 'Quitar la selección', icon: icono(Cancel01Icon), visibility: 'always', onClick: () => setMarcadas([]) },
    {
      id: 'eliminar',
      label: elegidas.length === 1 ? 'Eliminar la vacante' : 'Eliminar las vacantes',
      variant: 'destructive',
      icon: icono(Delete02Icon),
      visibility: 'always',
      onClick: () => setVentana({ tipo: 'eliminar', vacantes: elegidasVacantes }),
    },
  ]

  // El conteo de arriba: cuántas se ven de las que hay y, si hay elegidas, cuántas.
  const conteo = resultado.length === filas.length ? cuantas(filas.length) : `${resultado.length} de ${cuantas(filas.length)}`
  const config: Omit<DataGridListConfig<Fila>, 'pagination'> = {
    columns: COLUMNAS,
    // Sin cambiar el ancho a mano ni mover las columnas: con ocho columnas, el asidero y el borde de cada encabezado piden
    // más de lo que cabe en el marco (1.104 px con la barra lateral abierta) y el nombre de la vacante quedaba en 150 px.
    layout: { resizable: false, reorderable: false },
    frame: { description: elegidas.length ? `${conteo} · ${elegidas.length} ${plural(elegidas.length, 'elegida', 'elegidas')}` : conteo },
    sort: {
      onSortChange: (nuevo) => {
        const clave = nuevo ? ORDEN_DE_COLUMNA[nuevo.replace(/^-/, '')] : undefined
        // Al revés cuando la flecha pide lo contrario de lo que el orden hace de por sí.
        setOrden(clave && nuevo ? { clave, inverso: nuevo.startsWith('-') !== DE_MAYOR_A_MENOR[clave] } : null)
        cambiar({})
      },
    },
    // Las casillas eligen en la página que se ve; lo elegido en las otras páginas se queda.
    selection: {
      onSelectionChange: (enLaPagina) => {
        const ids = enLaPagina.map((fila) => fila.id)
        const esperadas = enPagina.filter((fila) => marcadasSet.has(fila.id))
        // Ya dice lo mismo que la pantalla: no hay nada que cambiar, y si se esperaba a la tabla, ya se puso al día.
        if (ids.length === esperadas.length && esperadas.every((fila) => ids.includes(fila.id))) {
          esperandoTabla.current = false
          return
        }
        if (esperandoTabla.current) return
        const deLaPagina = new Set(enPagina.map((fila) => fila.id))
        setMarcadasLibre((antes) => [...antes.filter((id) => !deLaPagina.has(id)), ...ids])
      },
    },
    bulkActions: accionesDeLasElegidas,
    // Las etiquetas de la empresa (verlas, crearlas, ponerlas en vacantes, renombrarlas y eliminarlas) y el CSV de lo que se
    // ve: a la derecha del conteo, junto a «Personalizar columnas».
    actions: filas.length
      ? {
          secondary: [
            { id: 'etiquetas', label: 'Etiquetas', variant: 'outline', icon: icono(Tag01Icon), onClick: () => setEtiquetasAbierto(true) },
            {
              id: 'exportar',
              label: 'Exportar',
              variant: 'outline',
              icon: icono(Download04Icon),
              onClick: () => exportar(resultado, hayFiltros ? `vacantes-filtradas-${resultado.length}` : 'vacantes'),
            },
          ],
        }
      : undefined,
    // Los vacíos del sistema, con su ilustración: sin resultados dice qué se buscó y deja limpiar; sin vacantes, crear (IN-24).
    emptyState: filas.length
      ? { type: 'no-results', customComponent: <SinResultados busqueda={vista.q} filtrosActivos={puestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay vacantes"
              descripcion="Crea la primera desde cero o parte de una plantilla: quedan aquí, con quién espera respuesta en cada una."
              accion={{ texto: 'Crear vacante', icono: PlusSignIcon, onClick: () => navigate(`${ruta}/crear`) }}
            />
          ),
        },
  }

  return (
    <ContextoTabla.Provider value={{ ruta, lecturas, acciones }}>
      {/* Los globos de las acciones de lo elegido salen a los 200 ms, como en el resto del playground. */}
      <TooltipProvider delay={200}>
        <PageSection title="Tus vacantes">
          <div className="flex flex-col gap-3">
            {/* Cómo se busca, encima de la tabla: escribir y filtrar a fondo; debajo, lo puesto en «Filtros» con su «x». */}
            {filas.length ? (
              <>
                <div className="flex w-full flex-wrap items-center gap-2">
                  <InputGroup className="w-72 max-w-full">
                    <InputGroupAddon>
                      <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={vista.q}
                      onChange={(evento) => cambiar({ q: evento.target.value })}
                      placeholder="Cargo, área, sede o reclutador"
                      aria-label="Buscar vacantes por cargo, área, sede o reclutador"
                    />
                    {vista.q ? (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton size="icon-xs" aria-label="Borrar la búsqueda" onClick={() => cambiar({ q: '' })}>
                          <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden="true" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    ) : null}
                  </InputGroup>
                  <BotonFiltros vista={vista} cambiar={cambiar} opciones={opciones} puestos={puestos} />
                </div>
                <FiltrosPuestos vista={vista} cambiar={cambiar} hayFiltros={hayFiltros} limpiar={limpiar} />
              </>
            ) : null}

            {/* Con la página entera elegida, se ofrece elegir todo lo que coincide (como en Mis candidatos). */}
            {paginaEntera && resultado.length > enPagina.length ? (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-primary/7 px-3 py-2" role="status">
                <Text as="span" size="sm" className="tabular-nums">
                  {todasElegidas ? `Elegiste las ${resultado.length} que coinciden.` : `Elegiste las ${enPagina.length} de esta página.`}
                </Text>
                <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => (todasElegidas ? setMarcadas([]) : marcar(resultado.map((fila) => fila.vacante.id), true))}>
                  {todasElegidas ? 'Quitar la selección' : `Elegir las ${resultado.length} que coinciden`}
                </Button>
              </div>
            ) : null}

            <div className="[&_tbody_tr]:cursor-pointer" onClick={abrirDesdeFila}>
              <TablaDatos
                id="tus-vacantes"
                nombre="vacantes"
                singular="vacante"
                config={config}
                data={enPagina}
                isLoading={cargando}
                initialRowSelection={seleccion}
                paginacion={paginacion}
              />
            </div>
          </div>
        </PageSection>
      </TooltipProvider>

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

      {/* La única ventana de Compartir del sistema (H-220, H-248): la misma de la cabecera de la vacante, con el equipo de la
          vacante y el enlace para candidatos con sus canales. */}
      {ventana?.tipo === 'compartir' ? (
        <DialogoCompartirVacante
          abierto
          onAbiertoChange={(abierto) => !abierto && setVentana(null)}
          id={ventana.vacante.id}
          titulo={ventana.vacante.titulo}
          conEnlace={ventana.vacante.estado === 'Publicada'}
          oculta={ventana.vacante.oculta}
          equipo={ventana.vacante.equipo}
          onEquipo={(equipo) => {
            if (ventana?.tipo !== 'compartir') return
            cambiarVacantes([ventana.vacante], { equipo })
            estadoInicio.tocar()
          }}
        />
      ) : null}

      <DialogoReclutador
        vacantes={ventana?.tipo === 'reclutador' ? ventana.vacantes : []}
        reclutadores={opciones.reclutadores.filter((nombre) => nombre !== SIN_ASIGNAR)}
        onCerrar={() => setVentana(null)}
        onConfirmar={(nombre) => ventana?.tipo === 'reclutador' && reasignar(ventana.vacantes, nombre)}
      />

      <PanelEtiquetas
        abierto={etiquetasAbierto}
        onAbierto={setEtiquetasAbierto}
        onVerEnTabla={(etiqueta) => {
          setEtiquetasAbierto(false)
          cambiar({ etiqueta })
        }}
      />

      {ventana?.tipo === 'etiquetas' ? (
        <VentanaEtiquetas
          titulo={ventana.vacantes.length === 1 ? `Etiquetas de «${ventana.vacantes[0].titulo}»` : `Etiquetas de ${cuantas(ventana.vacantes.length)}`}
          sub="Agrupan las vacantes y sirven para filtrar la lista."
          deCada={ventana.vacantes.map((vacante) => vacante.etiquetas)}
          disponibles={etiquetasDeVacantes()}
          onOpenChange={(abierto) => (abierto ? undefined : setVentana(null))}
          onConfirmar={(poner, quitar) => etiquetar(ventana.vacantes, poner, quitar)}
        />
      ) : null}
    </ContextoTabla.Provider>
  )
}

/* Las piezas de la tabla -------------------------------------------------------------------------------------------- */

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

// Lo que las columnas necesitan de la pantalla (van fuera del componente, y las columnas de la librería no deben cambiar de
// identidad en cada dibujo): a dónde llevan las filas, qué lee la IA ahora y qué se hace con cada vacante desde su «⋯».
const ContextoTabla = createContext<{ ruta: string; lecturas: Readonly<Record<string, Lectura>>; acciones: AccionesFila | null }>({ ruta: '', lecturas: {}, acciones: null })

// El nombre entero (se corta solo si de verdad no cabe) y debajo el área con sus etiquetas (IN-36, IN-42). Mientras la IA lee
// sus hojas de vida (pedido desde el tablero), la fila lo dice (IN-32). El `data-vacante` es para abrirla al tocar la fila.
// El «w-0 min-w-full»: la tabla mide cada columna por lo que lleva y, sin esto, un nombre largo la ensancha en vez de cortarse.
function CeldaVacante({ fila }: { fila: Fila }) {
  const { ruta, lecturas } = useContext(ContextoTabla)
  const lectura = lecturas[fila.id]
  return (
    <div className="w-0 min-w-full" data-vacante={fila.id}>
      <CeldaTitulo
        titulo={fila.vacante.titulo}
        to={`${ruta}/${fila.id}`}
        detalle={
          <span className="flex min-w-0 flex-col gap-0.5">
            {lectura?.estado === 'leyendo' ? (
              <Text as="span" size="xs" className="flex min-w-0 items-center gap-1">
                <IconoIA />
                <span className="truncate">La IA está leyendo {lectura.cuantos} CVs…</span>
              </Text>
            ) : null}
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{fila.vacante.area}</span>
              <EtiquetasDeFila etiquetas={fila.vacante.etiquetas} />
            </span>
          </span>
        }
      />
    </div>
  )
}

// Las etiquetas viven en la tabla (8 oct, Nicolás: «deben estar afuera de crear una vacante y más atadas a la tabla»):
// se ven en la fila, se ponen desde su «⋯» o la barra de las elegidas y se filtran en «Filtros». La primera y «+N» con
// las demás al pasar el cursor, para que la fila no crezca.
function EtiquetasDeFila({ etiquetas }: { etiquetas: string[] }) {
  if (!etiquetas.length) return null
  const [primera, ...resto] = etiquetas
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span className="sr-only">Etiquetas: {etiquetas.join(', ')}</span>
      <Badge variant="secondary" aria-hidden="true">
        <HugeiconsIcon icon={Tag01Icon} size={10} aria-hidden="true" />
        {primera}
      </Badge>
      {resto.length ? (
        <Hint label={resto.join(', ')} side="top">
          <Badge variant="outline" aria-hidden="true" className="tabular-nums">
            +{resto.length}
          </Badge>
        </Hint>
      ) : null}
    </span>
  )
}

function CeldaSede({ vacante }: { vacante: VacanteUI }) {
  const [ciudad, ...lugar] = vacante.sede.split(' · ')
  const debajo = [...lugar, vacante.modalidad !== vacante.sede ? vacante.modalidad : null].filter(Boolean).join(' · ')
  return (
    <span className="flex w-0 min-w-full flex-col gap-0.5">
      <Text as="span" size="sm" className="truncate">
        {ciudad}
      </Text>
      {debajo ? (
        <Text as="span" variant="muted" size="xs" className="truncate">
          {debajo}
        </Text>
      ) : null}
    </span>
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
      <span className="flex w-0 min-w-full flex-col gap-0.5">
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
    <span className="flex w-0 min-w-full flex-col gap-0.5">
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

// Cuántos esperan y desde cuándo, y quiénes, a la vista: sin pasar el cursor (IN-36).
function CeldaEsperan({ fila }: { fila: Fila }) {
  const n = fila.esperan.length
  if (!n) {
    return (
      <Text as="span" variant="muted" size="sm">
        Nadie
      </Text>
    )
  }
  const primeros = fila.esperan.slice(0, 2).map((c) => c.candidato.nombre.split(' ').slice(0, 2).join(' '))
  return (
    <span className="flex w-0 min-w-full flex-col gap-0.5">
      <Text as="span" size="sm" className="truncate tabular-nums">
        {n} {plural(n, 'espera', 'esperan')} · hasta {fila.esperan[0].dias} {plural(fila.esperan[0].dias, 'día', 'días')}
      </Text>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {primeros.join(', ')}
        {n > 2 ? ` y ${n - 2} más` : ''}
      </Text>
    </span>
  )
}

// El «⋯» de cada fila: lo mismo que la cabecera de la vacante, con sus mismas ventanas (IN-04, IN-05, IN-06, IN-09).
function MenuDeFila({ vacante }: { vacante: VacanteUI }) {
  const { acciones } = useContext(ContextoTabla)
  if (!acciones) return null
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
            <HugeiconsIcon icon={Tag01Icon} aria-hidden="true" />
            Etiquetas
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

// Las columnas son las que pidió Elkin. Van fuera del componente (si no, la librería rehace los encabezados en cada dibujo).
// Solo ordenan el nombre, las aplicaciones, los días y quién espera: el estado, la sede y el reclutador se buscan en
// «Filtros». El «⋯» se queda quieto al final: no es un dato que se reordene.
const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  { accessorKey: 'titulo', header: 'Vacante', size: 240, cell: ({ row }) => <CeldaVacante fila={row.original} /> },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <Badge variant={ESTADO_INSIGNIA[row.original.estado]}>{row.original.estado}</Badge>,
  },
  { accessorKey: 'sede', header: 'Sede', size: 120, enableSorting: false, cell: ({ row }) => <CeldaSede vacante={row.original.vacante} /> },
  {
    accessorKey: 'aplicaciones',
    header: 'Aplicaciones',
    size: 120,
    cell: ({ row }) => (
      <span className="flex w-0 min-w-full flex-col gap-0.5">
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.vacante.aplicaciones}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.vacante.estado === 'Cerrada'
            ? 'Ya no recibe'
            : row.original.vacante.ultimaSemana > 0
              ? `${row.original.vacante.ultimaSemana} esta semana`
              : 'Nadie esta semana'}
        </Text>
      </span>
    ),
  },
  { accessorKey: 'diasAbierta', header: 'Días abierta', size: 120, cell: ({ row }) => <CeldaDias vacante={row.original.vacante} /> },
  { id: 'esperan', accessorKey: 'masViejo', header: 'Esperan', size: 170, cell: ({ row }) => <CeldaEsperan fila={row.original} /> },
  {
    accessorKey: 'reclutador',
    header: 'Reclutador',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.reclutador === SIN_ASIGNAR ? 'muted' : undefined} className="block w-0 min-w-full truncate">
        {row.original.reclutador}
      </Text>
    ),
  },
  {
    id: 'acciones',
    header: '',
    size: 48,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuDeFila vacante={row.original.vacante} />,
  },
]

/* Filtros ------------------------------------------------------------------------------------------------------------ */

type Opciones = { estados: string[]; etiquetas: string[]; reclutadores: string[]; areas: string[]; sedes: string[] }

// De lo más general a lo más a detalle (8 oct, VP de producto): en qué va, qué etiquetas lleva, de qué área y sede, y
// quién la lleva. Las carpetas que crea la empresa son las etiquetas: aquí salen todas las que existen.
const CAMPOS = [
  {
    clave: 'grupo',
    nombre: 'Estado',
    icono: CheckmarkCircle02Icon,
    todas: 'Todos los estados',
    de: (o: Opciones) => o.estados,
    texto: (valor: string) => GRUPOS.find((grupo) => grupo.valor === valor)?.texto ?? valor,
  },
  { clave: 'etiqueta', nombre: 'Etiqueta', icono: Tag01Icon, todas: 'Todas las etiquetas', de: (o: Opciones) => o.etiquetas, texto: (valor: string) => valor },
  { clave: 'area', nombre: 'Área', icono: Briefcase01Icon, todas: 'Todas las áreas', de: (o: Opciones) => o.areas, texto: (valor: string) => valor },
  { clave: 'sede', nombre: 'Sede', icono: Location01Icon, todas: 'Todas las sedes', de: (o: Opciones) => o.sedes, texto: (valor: string) => valor },
  {
    clave: 'reclutador',
    nombre: 'Reclutador',
    icono: UserIcon,
    todas: 'Todos los reclutadores',
    de: (o: Opciones) => o.reclutadores,
    // Las suyas primero se encuentran por su nombre, con «(tú)»: antes eran el chip «Las mías».
    texto: (valor: string) => (valor === QUIEN_MUEVE ? `${valor} (tú)` : valor),
  },
] as const

const SIN_FILTROS = { grupo: '', etiqueta: '', reclutador: '', area: '', sede: '' }

// «Filtros» con su globo, como Mis candidatos y el Dashboard (IN-19, IN-08).
function BotonFiltros({ vista, cambiar, opciones, puestos }: { vista: Vista; cambiar: (cambio: Partial<Vista>) => void; opciones: Opciones; puestos: number }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <HugeiconsIcon icon={FilterIcon} size={16} aria-hidden="true" />
        Filtros
        {puestos ? (
          <Badge variant="invert" className="tabular-nums">
            {puestos}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem]">
        <PopoverHeader>
          <PopoverTitle>Filtrar las vacantes</PopoverTitle>
          <PopoverDescription>Se suman a lo que buscas.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          {CAMPOS.map((campo) => (
            <CampoFiltro
              key={campo.clave}
              id={`vacantes-${campo.clave}`}
              nombre={campo.nombre}
              valor={vista[campo.clave] || 'todas'}
              opciones={[{ value: 'todas', label: campo.todas }, ...campo.de(opciones).map((valor) => ({ value: valor, label: campo.texto(valor) }))]}
              onCambiar={(valor) => cambiar({ [campo.clave]: valor === 'todas' ? '' : valor })}
            />
          ))}
          {puestos ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => cambiar(SIN_FILTROS)}>
              <HugeiconsIcon icon={FilterResetIcon} size={16} aria-hidden="true" />
              Quitar estos filtros
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Lo puesto en «Filtros», con su «x», y «Limpiar filtros» solo si hay algo.
function FiltrosPuestos({ vista, cambiar, hayFiltros, limpiar }: { vista: Vista; cambiar: (cambio: Partial<Vista>) => void; hayFiltros: boolean; limpiar: () => void }) {
  const puestos = CAMPOS.filter((campo) => vista[campo.clave])
  if (!puestos.length && !hayFiltros) return null
  return (
    <div role="group" aria-label="Filtros puestos" className="flex w-full flex-wrap items-center gap-2">
      {puestos.map((campo) => (
        <FiltroChip
          key={campo.clave}
          activo
          onCambiar={() => cambiar({ [campo.clave]: '' })}
          icono={campo.icono}
          texto={`${campo.nombre}: ${campo.texto(vista[campo.clave])}`}
          ayuda={`Quitar el filtro de ${campo.nombre.toLowerCase()}`}
        />
      ))}
      <Button variant="ghost" size="sm" onClick={limpiar}>
        <HugeiconsIcon icon={FilterResetIcon} size={16} aria-hidden="true" />
        Limpiar filtros
      </Button>
    </div>
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
