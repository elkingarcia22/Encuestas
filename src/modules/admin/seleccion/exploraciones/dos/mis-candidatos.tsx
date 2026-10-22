import { MotionConfig } from 'motion/react'
import { createPortal } from 'react-dom'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { AgenteBase } from '../../propuestas/components/agente-seleccion'
import { useHuecoDerecho } from '../../vacantes/detalle/components/agente-acoplado'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Delete02Icon,
  FileImportIcon,
  Mail01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  UserIcon,
  UserSharingIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  Text,
  type DataGridListConfig,
  type ListColumnFilter,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PageContent, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { useVentanasEnPanel } from '@/modules/design-system/drawers/components/drawer-anidado'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { NavegarRegistros } from '@/modules/design-system/data-grid/partes-tabla'
import { VACANTES_UI, siguienteEtapaDe } from '../../propuestas/datos'
import { fechaDeEntrada, hace } from '../../propuestas/personas'
import { SIN_FILTROS, cupoEn, habilidadesQueCoinciden, paisDe, ubicacionDe, type FiltrosBase, type PersonaViva } from '../../propuestas/base'
import { CaraCandidato } from '../../propuestas/components/cara-candidato'
import { Revelar, useFilasQueEntran } from '../../propuestas/components/animacion'
import { AccionesBase, CabeceraCandidatos, PulsoBase } from '../../propuestas/components/cabecera-seleccion'
import { FichaPersona } from '../../propuestas/components/ficha-persona'
import { AccionesFicha, EnQueAnda, FichaBase } from '../../propuestas/components/ficha-base'
import { InsigniaEspera } from '../../propuestas/components/filtros-base'
import { useBase, type Base } from '../../propuestas/components/use-base'
import { useCarga } from '@/modules/design-system/estados/carga'
import { SaldoCreditos } from '../../propuestas/components/saldo-creditos'

// Exploración 2 · «Pipeline» — Mis candidatos: la base global de la empresa como la trabaja esta exploración (25 sep).
//
// Arriba cómo va la base y, debajo, la tabla del sistema (16 oct, Nicolás: «no veo aún que en vacantes o candidatos estén
// las tablas como deben ser»): TablaDatos, como Planes de formación y Vacantes. En lo gris, el conteo a la izquierda y a
// la derecha el buscador y «Personalizar columnas»; cada columna ordena y se filtra desde su encabezado; las acciones con
// las elegidas salen junto al buscador, y el «⋯» de cada persona en «Acciones». La ficha sale en panel lateral y se pasa
// a la siguiente sin cerrarla. Lo que se le hace a la gente es lo mismo en todas partes (`use-base.tsx`).
//
// Desde el 27 sep es su propia sección del menú (`/admin/seleccion/candidatos/dos`): su cabecera, sus cifras y su botón
// lleno, «Importar candidatos».

// A dónde llevan las vacantes que se nombran en una ficha: las de Vacantes (la 1), que tienen los mismos ids.
const RUTA = '/admin/seleccion/exploraciones/uno'
const RUTA_BASE = '/admin/seleccion/candidatos/dos'
const BUSCAR = 'Nombre, cargo o lo que sabe'

// Qué pasa si se la postula a la vacante comparada, dicho corto para la celda.
const YA_EN_LA_VACANTE = { 'ya-esta': 'Ya está ahí', descartada: 'Se descartó ahí', contratada: 'La contrataron ahí' } as const

/* Lo que necesitan las celdas ---------------------------------------------------------------------------------------- */

const ContextoBase = createContext<{ base: Base | null; abiertaId: string | null; onAbrir: (persona: PersonaViva) => void }>({
  base: null,
  abiertaId: null,
  onAbrir: () => undefined,
})

// Sin círculo de iniciales (5 oct, Nicolás: «no deberíamos tener esos avatares en las tablas»): el nombre, que abre la
// ficha, y debajo lo que pide atención y el correo (en la misma línea del nombre lo cortaban); si la búsqueda coincide
// con lo que sabe, lo dice.
function CeldaPersona({ persona }: { persona: PersonaViva }) {
  const { base, abiertaId, onAbrir } = useContext(ContextoBase)
  const texto = base?.filtros.texto.trim() ?? ''
  const sabe = texto ? habilidadesQueCoinciden(persona, texto) : []
  return (
    <span className="flex w-0 min-w-full flex-col gap-0.5" data-abierta={abiertaId === persona.id || undefined}>
      {/* El nombre como enlace dentro de la celda, sin el alto ni el relleno de botón (diferencias.json › button-enlace-en-linea). */}
      <Button variant="link" size="sm" className="h-auto! min-w-0 shrink justify-start! p-0!" onClick={() => onAbrir(persona)}>
        <span className="truncate">{persona.nombre}</span>
      </Button>
      <span className="flex min-w-0 items-center gap-1.5">
        <InsigniaEspera persona={persona} />
        {persona.duplicadoDe ? (
          <Badge variant="warning-light" className="shrink-0">
            Posible duplicado
          </Badge>
        ) : null}
        <Text as="span" variant="muted" size="xs" className="truncate">
          {sabe.length ? `Sabe ${sabe.slice(0, 2).join(', ')}` : persona.correo}
        </Text>
      </span>
    </span>
  )
}

// La vacante con que Orbit Flow la compara: qué tanto encaja y, si no puede entrar, por qué.
function CeldaPara({ persona }: { persona: PersonaViva }) {
  const { base } = useContext(ContextoBase)
  const vacante = base?.paraVacante
  if (!vacante || !persona.ajuste) return null
  const cupo = cupoEn(persona.vivos, vacante)
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <Progress
          value={persona.ajuste.total ? (persona.ajuste.cumple / persona.ajuste.total) * 100 : 0}
          aria-label={`Cumple ${persona.ajuste.cumple} de ${persona.ajuste.total} requisitos de ${vacante.titulo}`}
          className="w-12"
        />
        <Text as="span" size="sm" className="whitespace-nowrap tabular-nums">
          {persona.ajuste.cumple} de {persona.ajuste.total}
        </Text>
      </span>
      {cupo && !cupo.puede ? (
        <Text as="span" variant="muted" size="xs">
          {YA_EN_LA_VACANTE[cupo.por]}
        </Text>
      ) : null}
    </span>
  )
}

// El «⋯» de cada persona: lo mismo que el pie de su ficha.
function MenuPersona({ persona }: { persona: PersonaViva }) {
  const { base, onAbrir } = useContext(ContextoBase)
  if (!base) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${persona.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAbrir(persona)}>
            <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
            Ver ficha
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => base.postular([persona])}>
            <HugeiconsIcon icon={UserSharingIcon} aria-hidden="true" />
            Postular a una vacante
          </DropdownMenuItem>
          {/* Apagado y con el porqué: si se escondiera, parecería que falta. */}
          <DropdownMenuItem disabled={persona.noContactar} onClick={() => base.escribir([persona])}>
            <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
            <span className="flex flex-col">
              Escribirle
              {persona.noContactar ? (
                <Text as="span" variant="muted" size="xs">
                  Pidió no recibir correos
                </Text>
              ) : null}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => base.eliminar([persona])}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar candidato
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* Las columnas ------------------------------------------------------------------------------------------------------- */

// La celda toma el ancho de su columna sin empujarla: lo largo se corta con «…» y la tabla cabe con el «⋯» a la vista
// (regla tabla-cabe). Es lo mismo que hace `CeldaTitulo`.
const Ajustada = ({ children }: { children: ReactNode }) => <div className="w-0 min-w-full">{children}</div>

// Fuera del componente: si cambian en cada pintada, el globo del filtro se cierra al marcar. Con la vacante comparada se
// suma su columna y se va «Experiencia» (sigue en la ficha) para que la tabla quepa con el «⋯» a la vista.
const COLUMNA_PERSONA: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'nombre',
  header: 'Persona',
  size: 250,
  cell: ({ row }) => <CeldaPersona persona={row.original} />,
}
const COLUMNA_CARGO: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'cargo',
  header: 'Cargo actual',
  size: 190,
  enableSorting: false,
  cell: ({ row }) => (
    <span className="flex w-0 min-w-full flex-col gap-0.5">
      {/* Lo que no vino se dice así, no como un dato (MC-15). */}
      <Text as="span" size="sm" variant={row.original.cargo ? undefined : 'muted'} className="truncate">
        {row.original.cargo || 'Sin cargo registrado'}
      </Text>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {[row.original.empresa, row.original.ciudad].filter(Boolean).join(' · ') || 'Sin empresa ni ciudad'}
      </Text>
    </span>
  ),
}
const COLUMNA_EXPERIENCIA: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'anios',
  header: 'Experiencia',
  size: 130,
  cell: ({ row }) => (
    <Text as="span" size="sm" className="tabular-nums">
      {row.original.aniosDesconocidos ? '—' : row.original.anios === 1 ? '1 año' : `${row.original.anios} años`}
    </Text>
  ),
}
const COLUMNA_PROCESOS: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'procesos',
  header: 'En qué anda',
  size: 230,
  enableSorting: false,
  cell: ({ row }) => (
    <Ajustada>
      <EnQueAnda persona={row.original} ruta={RUTA} />
    </Ajustada>
  ),
}
const COLUMNA_EN_LA_BASE: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'dias',
  header: 'En la base',
  size: 130,
  // Con la fecha al pasar el cursor (MC-50).
  cell: ({ row }) => (
    <Hint label={`Entró el ${fechaDeEntrada(row.original.dias)}`}>
      <Text as="span" variant="muted" size="sm">
        {hace(row.original.dias)}
      </Text>
    </Hint>
  ),
}
const COLUMNA_PARA: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'ajuste',
  header: 'Para la vacante',
  size: 150,
  cell: ({ row }) => <CeldaPara persona={row.original} />,
}
const COLUMNA_ACCIONES: DataGridListConfig<PersonaViva>['columns'][number] = {
  id: 'acciones',
  header: 'Acciones',
  size: 96,
  enableSorting: false,
  enableResizing: false,
  ...SIN_ARRASTRE,
  cell: ({ row }) => <MenuPersona persona={row.original} />,
}
const COLUMNAS = [COLUMNA_PERSONA, COLUMNA_CARGO, COLUMNA_EXPERIENCIA, COLUMNA_PROCESOS, COLUMNA_EN_LA_BASE, COLUMNA_ACCIONES]
const COLUMNAS_PARA = [COLUMNA_PERSONA, COLUMNA_CARGO, COLUMNA_PROCESOS, COLUMNA_EN_LA_BASE, COLUMNA_PARA, COLUMNA_ACCIONES]

// El orden que pide el encabezado, en el idioma de la base: cada columna tiene su sentido de siempre (la A a la Z, más
// experiencia, lo más reciente, lo que más sirve) y el otro es «inverso» (MC-51).
const ORDEN_DE: Record<string, { orden: FiltrosBase['orden']; normal: 'asc' | 'desc' }> = {
  nombre: { orden: 'nombre', normal: 'asc' },
  anios: { orden: 'experiencia', normal: 'desc' },
  dias: { orden: 'recientes', normal: 'asc' },
  ajuste: { orden: 'ajuste', normal: 'desc' },
}

// 13 oct (reunión con la PM y el TL): la bolsa es para buscar gente. Se filtra quién pide atención (esperando acción,
// posibles duplicados) desde «Persona», dónde vive (país o ciudad: «si me pones ciudad, me tienes que poner país») desde
// «Cargo actual», quién está en algún proceso desde «En qué anda» y quién entró este mes desde «En la base».
type Filtro = { id: string; value: unknown }
const valorDe = (filtros: Filtro[], columna: string) => filtros.find((filtro) => filtro.id === columna)?.value
const filtrosDeLaBase = (filtros: Filtro[]): Partial<FiltrosBase> => {
  const persona = valorDe(filtros, 'nombre')
  const marcados = Array.isArray(persona) ? persona.map(String) : []
  const lugar = String(valorDe(filtros, 'cargo') ?? '')
  const [tipo, nombre] = lugar.split(':')
  return {
    esperan: marcados.includes('esperan'),
    duplicados: marcados.includes('duplicados'),
    pais: tipo === 'pais' ? nombre : tipo === 'ciudad' ? paisDe(nombre) : SIN_FILTROS.pais,
    ciudad: tipo === 'ciudad' ? nombre : SIN_FILTROS.ciudad,
    enProceso: valorDe(filtros, 'procesos') === true,
    recientes: valorDe(filtros, 'dias') === true,
  }
}

// La tabla no avisa del clic en una fila: el contenedor se lo pasa al nombre, que abre la ficha.
const abrirFila = (evento: MouseEvent<HTMLElement>) => {
  const tocado = evento.target as HTMLElement
  if (tocado.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
  if (window.getSelection()?.toString()) return
  tocado.closest('tbody tr')?.querySelector<HTMLElement>('td button:not([role="checkbox"])')?.click()
}

export function Component() {
  // `?persona=<id>` abre su ficha al llegar: desde la vacante se trae aquí para borrar sus datos (CA-18).
  const [parametros] = useSearchParams()
  const [abiertaId, setAbiertaId] = useState<string | null>(() => parametros.get('persona'))
  const [agente, setAgente] = useState(false)
  const hueco = useHuecoDerecho()
  // Segundo nivel del panel: su candidatura en una vacante («Ver su ajuste»), guardada por la vacante.
  const [ajusteEn, setAjusteEn] = useState<string | null>(null)
  // Lo elegido lo lleva la tabla; un objeto nuevo aquí lo suelta.
  const [elegidas, setElegidas] = useState<PersonaViva[]>([])
  const [sinSeleccion, setSinSeleccion] = useState<Record<string, boolean>>({})
  // Se sube para volver a montar la tabla sin búsqueda ni filtros («Limpiar»).
  const [version, setVersion] = useState(0)
  const elegidasAhora = useRef<PersonaViva[]>([])
  useEffect(() => {
    elegidasAhora.current = elegidas
  }, [elegidas])

  const base = useBase({
    ruta: RUTA,
    onVerFicha: (id) => {
      setAjusteEn(null)
      setAbiertaId(id)
    },
    // Solo se sueltan las elegidas si la acción fue sobre ellas; una acción desde la ficha las deja como estaban (MC-14).
    alTerminar: (ids) => {
      if (ids.length && ids.every((id) => elegidasAhora.current.some((persona) => persona.id === id))) setSinSeleccion({})
    },
  })
  const { filtradas, paginacion, paraVacante } = base

  const porId = useMemo(() => new Map(base.todas.map((persona) => [persona.id, persona])), [base.todas])
  const abierta = abiertaId ? (porId.get(abiertaId) ?? null) : null
  const candidatura = abierta && ajusteEn ? base.candidaturaDe(abierta, ajusteEn) : null
  // Lo que se pide desde la ficha (postular, escribir, rechazar, eliminar…) se abre dentro de ella, como drawer anidado;
  // desde la tabla, en la ventana de siempre (8 oct: desde un panel no se abre una ventana encima).
  const ventanasEnFicha = useVentanasEnPanel(base.ocupado, abierta !== null)
  // El recorrido de la ficha queda fijo al abrirla (MC-49): postular a alguien de «Libres» la saca de la lista, pero las
  // flechas siguen con quien venía.
  const [recorrido, setRecorrido] = useState<string[]>([])
  const enRecorrido = recorrido.length ? recorrido : filtradas.map((persona) => persona.id)
  const indice = abierta ? enRecorrido.indexOf(abierta.id) : -1
  const irA = (id: string | undefined) => {
    const persona = id ? porId.get(id) : undefined
    if (persona) abrir(persona, enRecorrido)
  }

  // Abrir la ficha; con las flechas del panel la tabla acompaña y pasa a la página de quien se está viendo.
  const abrir = (persona: PersonaViva, lista?: string[]) => {
    setAjusteEn(null)
    setAbiertaId(persona.id)
    setRecorrido(lista ?? filtradas.map((una) => una.id))
    const donde = filtradas.indexOf(persona)
    if (donde >= 0) paginacion.setPagina(Math.floor(donde / paginacion.porPagina) + 1)
  }

  // La página que se ve, la misma lista mientras nada cambie: la tabla vuelve a contar lo elegido cada vez que cambia.
  const { pagina, porPagina } = paginacion
  const enPagina = useMemo(() => filtradas.slice((pagina - 1) * porPagina, pagina * porPagina), [filtradas, pagina, porPagina])

  // La tabla carga al entrar y cada vez que cambia lo que se consulta (25 sep, las cargas de Selección).
  const cargando = useCarga({ filtros: base.filtros, lote: base.loteVisto?.id ?? null, pagina, porPagina })

  // Orbit Flow también busca (OF-59): lo que pone se ve en el buscador de la tabla, que solo avisa lo que se escribe en
  // él. Si el texto cambió por otro lado, se escribe en el campo.
  const envoltura = useRef<HTMLDivElement>(null)
  const escrito = useRef(base.filtros.texto)
  // Las filas entran en cascada cada vez que llega una página, una búsqueda, un filtro o un orden nuevo.
  useFilasQueEntran(envoltura, { filtros: base.filtros, lote: base.loteFiltro, pagina, porPagina }, !cargando)
  useEffect(() => {
    if (base.filtros.texto === escrito.current) return
    escrito.current = base.filtros.texto
    const campo = envoltura.current?.querySelector<HTMLInputElement>(`input[placeholder="${BUSCAR}"]`)
    if (campo) campo.value = base.filtros.texto
  }, [base.filtros.texto])

  const limpiar = () => {
    base.limpiar()
    escrito.current = ''
    setVersion((antes) => antes + 1)
  }

  // Las opciones de ubicación salen de quien hay en la base: cada país y, debajo, sus ciudades.
  const { paises, ciudades } = base
  const columnFilters = useMemo<ListColumnFilter[]>(
    () => [
      {
        id: 'nombre',
        label: 'Persona',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Esperando acción', value: 'esperan' },
          { label: 'Posibles duplicados', value: 'duplicados' },
        ],
      },
      {
        id: 'cargo',
        label: 'Ubicación',
        type: 'select',
        options: paises.flatMap((pais) => [
          { label: `${pais} (todo el país)`, value: `pais:${pais}` },
          ...ciudades.filter((ciudad) => paisDe(ciudad) === pais).map((ciudad) => ({ label: `${ciudad}, ${pais}`, value: `ciudad:${ciudad}` })),
        ]),
      },
      { id: 'procesos', label: 'En algún proceso', type: 'boolean' },
      { id: 'dias', label: 'Entraron este mes', type: 'boolean' },
    ],
    [paises, ciudades],
  )

  // Lo que la tabla no puede decir con sus controles va en la línea del conteo y, para quitarlo, junto al buscador: la
  // gente de un lote (al llegar desde una importación), la vacante con que Orbit Flow compara y, si se buscó un nombre,
  // buscarlo también en cargos y en lo que saben (MC-13).
  const personas = (n: number) => `${n.toLocaleString('es-CO')} ${n === 1 ? 'persona' : 'personas'}`
  const conteo = [
    personas(filtradas.length),
    base.loteFiltro ? `del lote «${base.loteVisto?.nombre ?? 'importado'}»` : null,
    paraVacante ? `ordenadas para ${paraVacante.titulo}` : null,
    base.porNombre && base.enTodoCuantas > filtradas.length ? 'buscando por nombre' : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const icono = (forma: typeof UserIcon) => <HugeiconsIcon icon={forma} aria-hidden="true" />
  // Cuántos filtros están puestos, para la salida de «Sin resultados» (también los que puso Orbit Flow).
  const { filtros } = base
  const filtrosPuestos = [
    filtros.esperan,
    filtros.duplicados,
    filtros.pais !== SIN_FILTROS.pais || filtros.ciudad !== SIN_FILTROS.ciudad,
    filtros.enProceso,
    filtros.recientes,
    filtros.etiquetas.length > 0,
    filtros.experiencia !== SIN_FILTROS.experiencia,
    base.loteFiltro !== null,
  ].filter(Boolean).length

  const config: DataGridListConfig<PersonaViva> = {
    columns: paraVacante ? COLUMNAS_PARA : COLUMNAS,
    columnFilters,
    onColumnFiltersChange: (nuevos) => base.cambiar(filtrosDeLaBase(nuevos)),
    sort: {
      onSortChange: (orden) => {
        const campo = orden?.replace(/^-/, '') ?? ''
        const como = ORDEN_DE[campo]
        if (!orden || !como) return base.cambiar({ orden: paraVacante ? 'ajuste' : SIN_FILTROS.orden, sentido: 'normal' })
        const pedido = orden.startsWith('-') ? 'desc' : 'asc'
        base.cambiar({ orden: como.orden, sentido: pedido === como.normal ? 'normal' : 'inverso' })
      },
    },
    search: {
      placeholder: BUSCAR,
      onSearch: (texto) => {
        escrito.current = texto
        base.cambiar({ texto })
      },
    },
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    selection: { onSelectionChange: setElegidas },
    // Con las elegidas: postularlas a una vacante, escribirles o eliminarlas (13 oct, PM: sin exportar ni etiquetas).
    bulkActions: [
      { id: 'postular', label: 'Postular a una vacante', icon: icono(UserSharingIcon), visibility: 'always', onClick: (filas) => base.postular(filas) },
      { id: 'escribir', label: 'Escribirles', icon: icono(Mail01Icon), visibility: 'always', onClick: (filas) => base.escribir(filas) },
      { id: 'eliminar', label: 'Eliminar candidatos', variant: 'destructive', icon: icono(Delete02Icon), visibility: 'always', onClick: (filas) => base.eliminar(filas) },
    ],
    actions: {
      secondary: [
        ...(base.porNombre && base.enTodoCuantas > filtradas.length
          ? [{ id: 'en-todo', label: `Buscar también en cargos (${base.enTodoCuantas})`, icon: icono(Search01Icon), onClick: base.buscarEnTodo }]
          : []),
        ...(paraVacante ? [{ id: 'sin-comparar', label: 'Dejar de comparar', icon: icono(Cancel01Icon), onClick: () => base.cambiar({ paraVacante: null }) }] : []),
        ...(base.loteFiltro ? [{ id: 'sin-lote', label: 'Ver toda la base', icon: icono(Cancel01Icon), onClick: () => base.setLoteFiltro(null) }] : []),
      ],
    },
    frame: { description: conteo },
    // Los dos vacíos del design system: la base sin nadie (importar) y nadie con esa búsqueda (limpiar).
    emptyState: base.todas.length
      ? {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={base.filtros.texto}
              filtrosActivos={filtrosPuestos}
              onLimpiar={limpiar}
            />
          ),
        }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-profile"
              titulo="Tu base de candidatos está vacía"
              descripcion="Aquí queda todo el que pasa por Selección: quien aplica a una vacante, quien llega en un lote de CVs y quien agregas a mano."
              accion={{ texto: 'Importar candidatos', icono: FileImportIcon, onClick: base.importar.abrir }}
            />
          ),
        },
  }

  return (
    // Con «reducir movimiento» en el sistema, las animaciones de Selección se quedan quietas.
    <MotionConfig reducedMotion="user">
    <PageShell>
      {/* «Mis candidatos» es su propia sección (27 sep): su título, su frase y lo principal que se hace aquí, importar. */}
      <CabeceraCandidatos
        ruta={RUTA_BASE}
        acciones={
          <>
            {/* Los créditos de Selección, a la vista en todo el producto (16 oct). */}
            <SaldoCreditos />
            <AccionesBase base={base} />
            {/* Orbit Flow sobre la base (OF-59), al final de la fila. Con los dos de importar son tres llamados a la
                acción: va solo con el orbe (regla orbit-flow-compacto). */}
            {agente ? null : <ReopenAgentButton compact onClick={() => setAgente(true)} />}
          </>
        }
      />

      <PageContent>
        {/* Cómo va la base, con la forma de las cifras del inicio de Vacantes (5 oct). Las secciones entran en cascada. */}
        <Revelar>
          <PulsoBase base={base} />
        </Revelar>

        <Revelar orden={1}>
          <ContextoBase.Provider value={{ base, abiertaId: abierta?.id ?? null, onAbrir: (persona) => abrir(persona) }}>
            {/* La persona abierta en la ficha, en azul suave en la tabla: nada de gris para marcar. */}
            <div ref={envoltura} onClick={abrirFila} className="[&_tbody_tr]:cursor-pointer [&_tbody_tr:has([data-abierta])]:bg-primary/7">
              <TablaDatos
                key={version}
                config={config}
                data={enPagina}
                isLoading={cargando}
                initialRowSelection={sinSeleccion}
                paginacion={{ pagina, setPagina: paginacion.setPagina, porPagina, setPorPagina: paginacion.setPorPagina, total: filtradas.length }}
                titulo="Tus candidatos"
                nombre="personas"
                singular="persona"
                id="base-dos"
              />
            </div>
          </ContextoBase.Provider>
        </Revelar>
      </PageContent>

      {/* La ficha en panel lateral: se mira a alguien sin perder la tabla y se pasa a la siguiente con las flechas. Con
          «Ver su ajuste» se entra a su candidatura en esa vacante y arriba queda la fila de volver. */}
      <DrawerShell
        open={abierta !== null}
        onOpenChange={(abiertoAhora) => {
          if (abiertoAhora) return
          if (ventanasEnFicha) base.cerrarVentanas()
          setAbiertaId(null)
          setAjusteEn(null)
          setRecorrido([])
        }}
        size="lg"
        // En el celular, todo el ancho menos el margen, como la ficha de la vacante (CA-33).
        style={{ '--drawer-content-width': 'calc(100vw - 1.5rem)' } as CSSProperties}
        // Quién es: la cara, el nombre y dónde vive (13 oct, reunión con la PM y el TL). Sin «Libre» ni ningún estado de la
        // persona (tiene uno en cada proceso) y sin cargo, empresa ni años de experiencia, que no dicen en qué. Dentro de
        // una de sus vacantes, debajo va esa vacante: aquí no se está en ella.
        media={abierta ? <CaraCandidato nombre={abierta.nombre} /> : undefined}
        title={abierta?.nombre ?? ''}
        description={candidatura ? candidatura.vacante.titulo : abierta ? ubicacionDe(abierta.ciudad) : undefined}
        badge={abierta && !candidatura ? <InsigniaEspera persona={abierta} /> : undefined}
        navigation={
          abierta && candidatura ? (
            <div className="flex items-center border-b px-3 py-1.5">
              {/* «Volver» en gris, como lo secundario del panel: el fantasma del tema lo pinta en negro (diferencias.json › button-ghost-tonos). */}
              <Button data-region="Volver" variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setAjusteEn(null)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                Volver a {abierta.nombre}
              </Button>
            </div>
          ) : abierta && indice >= 0 ? (
            <NavegarRegistros indice={indice} total={enRecorrido.length} nombre="Persona" onIr={(destino) => irA(enRecorrido[destino])} />
          ) : undefined
        }
        // La candidatura trae su propio pie; la ficha, el de la base.
        footer={abierta && !candidatura ? <AccionesFicha persona={abierta} base={base} /> : undefined}
      >
        {abierta && candidatura ? (
          // La ficha de la candidatura trae su propio aire y su pie fijo: se anula el relleno del cuerpo del panel
          // (solo posición), igual que en el pipeline.
          <div className="-mx-5 -my-4 h-[calc(100%+2rem)]">
            <FichaPersona
              key={candidatura.id}
              candidatura={candidatura}
              etapas={candidatura.vacante.etapas}
              onAvanzar={() => {
                const destino = siguienteEtapaDe(candidatura.vacante.etapas, candidatura.etapa)
                if (destino) base.mover(candidatura, destino)
              }}
              onRechazar={() => base.rechazar(candidatura, () => setAjusteEn(null))}
              // Si entró a una etapa con IA sin invitación, se la envía desde aquí (13 oct, PM).
              onInvitar={candidatura.vacante.estado === 'Cerrada' ? undefined : () => base.invitar(candidatura)}
              onIrA={(id) => setAjusteEn(abierta.vivos.find((proceso) => proceso.candidaturaId === id)?.vacanteId ?? null)}
            />
          </div>
        ) : abierta ? (
          // El perfil trae su propio aire y sus pestañas pegadas arriba: se anula el relleno del cuerpo del panel.
          <div className="-mx-5 -my-4 h-[calc(100%+2rem)]">
            <FichaBase key={abierta.id} persona={abierta} base={base} onVerCandidatura={(una) => setAjusteEn(una.vacante.id)} />
          </div>
        ) : null}
        {ventanasEnFicha ? base.dialogos : null}
      </DrawerShell>

      {ventanasEnFicha ? null : base.dialogos}

      {hueco
        ? createPortal(
            <AgentDock open={agente}>
              <AgenteBase
                personas={base.todas}
                vacantes={VACANTES_UI}
                onClose={() => setAgente(false)}
                onAbrir={(id) => setAbiertaId(id)}
                onBuscar={(texto) => base.cambiar({ texto })}
                onCompararCon={(vacanteId) => base.cambiar({ paraVacante: vacanteId })}
              />
            </AgentDock>,
            hueco,
          )
        : null}
    </PageShell>
    </MotionConfig>
  )
}

Component.displayName = 'SeleccionExploracionDosMisCandidatosPage'
