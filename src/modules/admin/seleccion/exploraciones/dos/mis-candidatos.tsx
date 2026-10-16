import { createPortal } from 'react-dom'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { AgenteBase } from '../../propuestas/components/agente-seleccion'
import { useHuecoDerecho } from '../../vacantes/detalle/components/agente-acoplado'
import { createContext, useContext, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, ButtonGroup, Progress, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { PageContent, PageShell } from '@/shared/components/PageShell'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { useVentanasEnPanel } from '@/modules/design-system/drawers/components/drawer-anidado'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { VACANTES_UI, siguienteEtapaDe } from '../../propuestas/datos'
import { fechaDeEntrada, hace } from '../../propuestas/personas'
import {
  SIN_FILTROS,
  SITUACION_BADGE,
  SITUACION_TEXTO,
  cupoEn,
  habilidadesQueCoinciden,
  type Orden,
  type PersonaViva,
  type Sentido,
} from '../../propuestas/base'
import { AccionesBase, CabeceraCandidatos, PulsoBase } from '../../propuestas/components/cabecera-seleccion'
import { FichaPersona } from '../../propuestas/components/ficha-persona'
import { AccionesFicha, EnQueAnda, FichaBase } from '../../propuestas/components/ficha-base'
import { BarraBase } from '../../propuestas/components/barra-base'
import {
  BotonFiltros,
  BuscadorBase,
  BusquedasGuardadas,
  ChipsSituacion,
  CompararConVacante,
  FiltrosPuestos,
  InsigniaEspera,
  VaciaBase,
} from '../../propuestas/components/filtros-base'
import { useBase, type Base } from '../../propuestas/components/use-base'
import { useCarga } from '../../propuestas/components/carga'

// Exploración 2 · «Pipeline» — Mis candidatos: la base global de la empresa como la trabaja esta exploración (25 sep).
//
// Denso y en volumen, como el pipeline de una vacante: arriba los segmentos de la base (en qué anda la gente) con su
// cuenta, igual que la barra de etapas de la vacante; debajo, buscar, filtrar y comparar con una vacante; y una tabla
// donde se marcan varias y se postulan, se etiquetan o se les escribe de una vez. La ficha sale en panel lateral y se
// pasa a la siguiente sin cerrarla. Lo que se le hace a la gente es lo mismo en las tres exploraciones (`use-base.tsx`).
//
// Desde el 27 sep es su propia sección del menú, «Candidatos 2» (`/admin/seleccion/candidatos/dos`): su cabecera, sus
// cifras y su botón lleno, «Importar candidatos».

// A dónde llevan las vacantes que se nombran en una ficha: dentro de la vacante, en la lista de vacantes de la 2.
// Las vacantes de la 2 se borraron el 1 oct: las personas de aquí llevan a las de Vacantes (la 1), que tienen los mismos ids.
const RUTA = '/admin/seleccion/exploraciones/uno'
const RUTA_BASE = '/admin/seleccion/candidatos/dos'

// ── El orden ──
//
// Solo Persona, Experiencia, En la base y la vacante comparada ordenan: son los órdenes de la base (`ORDENES`). Cada uno
// va en una dirección —la A a la Z, más experiencia, lo más reciente, lo que más sirve—, que es lo que se busca; la
// flecha contraria del encabezado le da la vuelta (MC-51: el otro sentido de la misma columna).
const ORDEN_DE_COLUMNA: Record<string, Orden> = { nombre: 'nombre', anios: 'experiencia', dias: 'recientes', ajuste: 'ajuste' }
// Si cada orden va, de por sí, de mayor a menor en su columna («En la base» cuenta días: lo más reciente es lo menor).
const DE_MAYOR_A_MENOR: Record<Orden, boolean> = { nombre: false, experiencia: true, recientes: false, ajuste: true }

// Lo que las celdas necesitan de la pantalla (las columnas van fuera del componente, y las de la librería no deben cambiar de
// identidad en cada dibujo): la base con lo que se busca, cuál ficha está abierta y cómo se abre.
const ContextoBase = createContext<{ base: Base | null; abiertaId: string | null; onAbrir: (persona: PersonaViva) => void }>({
  base: null,
  abiertaId: null,
  onAbrir: () => {},
})

// ── Las celdas ──
//
// El «w-0 min-w-full» de cada una: la tabla mide cada columna por lo que lleva y, sin esto, un texto largo la ensancha en
// vez de cortarse con «…».

// La celda que nombra a la persona: el nombre (abre su ficha) con lo que pide atención al lado, el correo en la línea gris y,
// si se buscó algo que sabe hacer, por qué salió. El `data-persona` es para abrirla al tocar la fila; el `data-abierta`, para
// pintar la fila de la ficha que está abierta.
function CeldaPersona({ persona }: { persona: PersonaViva }) {
  const { base, abiertaId, onAbrir } = useContext(ContextoBase)
  const sabe = base?.filtros.texto.trim() ? habilidadesQueCoinciden(persona, base.filtros.texto) : []
  return (
    // Sin círculo de iniciales (5 oct, Nicolás: «no deberíamos tener esos avatares en las tablas porque no las podemos sacar
    // de ningún lado»): el producto no tiene fotos de los candidatos.
    <span className="flex w-0 min-w-full flex-col gap-0.5" data-persona={persona.id} data-abierta={abiertaId === persona.id ? '' : undefined}>
      <span className="flex min-w-0 items-center gap-1.5">
        {/* Botón: la fila abre con el ratón, y el nombre se alcanza con Tab y abre con Enter. */}
        <Button variant="link" size="sm" className="h-auto! min-w-0 shrink justify-start! p-0!" onClick={() => onAbrir(persona)}>
          <span className="truncate">{persona.nombre}</span>
        </Button>
        <InsigniaEspera persona={persona} />
        {persona.duplicadoDe ? (
          <Badge variant="warning-light" className="shrink-0">
            Posible duplicado
          </Badge>
        ) : null}
      </span>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {persona.correo}
      </Text>
      {/* Por qué salió: lo que sabe hacer que coincide con la búsqueda. */}
      {sabe.length ? (
        <span className="flex flex-wrap gap-1 pt-0.5">
          {sabe.slice(0, 3).map((habilidad) => (
            <Badge key={habilidad} variant="info-light">
              Sabe {habilidad}
            </Badge>
          ))}
        </span>
      ) : null}
    </span>
  )
}

// Qué tanto sirve para la vacante comparada y, si no se la puede postular ahí, por qué.
function CeldaAjuste({ persona }: { persona: PersonaViva }) {
  const { base } = useContext(ContextoBase)
  const paraVacante = base?.paraVacante
  if (!paraVacante || !persona.ajuste) return null
  const cupo = cupoEn(persona.vivos, paraVacante)
  // La barra encima de su cuenta y no al lado: así la columna mide lo que la cuenta y la tabla cabe sin moverse de lado.
  return (
    <span className="flex w-0 min-w-full flex-col gap-1">
      <Progress
        value={persona.ajuste.total ? (persona.ajuste.cumple / persona.ajuste.total) * 100 : 0}
        aria-label={`Cumple ${persona.ajuste.cumple} de ${persona.ajuste.total} requisitos de ${paraVacante.titulo}`}
        className="w-full"
      />
      {/* La cuenta es de la IA (Orbit Flow compara con los requisitos de la vacante): lleva el orbe. */}
      <span className="flex items-center gap-1.5">
        <IconoIA />
        <Text as="span" size="sm" className="truncate tabular-nums">
          {persona.ajuste.cumple} de {persona.ajuste.total} {persona.ajuste.total === 1 ? 'requisito' : 'requisitos'}
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

// Qué pasa si se la postula a la vacante comparada, dicho corto para la celda.
const YA_EN_LA_VACANTE = { 'ya-esta': 'Ya está ahí', descartada: 'Se descartó ahí', contratada: 'La contrataron ahí' } as const

// Las columnas de la tabla del sistema (`TablaDatos`, decisión 1 de la auditoría, 5-oct; el 9 oct, decisión 4a de Cristian,
// vuelve a ella desde la `MarcoTabla` propia). Fuera del componente, en dos juegos: las etiquetas se van al comparar con una
// vacante (su columna deja sitio al ajuste, que con «Para Analista de datos» en el encabezado hacía que la tabla se saliera:
// la vacante ya se lee arriba, en «Comparar con una vacante»).
const COLUMNAS_INICIO: DataGridListConfig<PersonaViva>['columns'] = [
  { accessorKey: 'nombre', header: 'Persona', size: 230, cell: ({ row }) => <CeldaPersona persona={row.original} /> },
  {
    accessorKey: 'cargo',
    header: 'Cargo actual',
    size: 170,
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
  },
  {
    accessorKey: 'anios',
    header: 'Experiencia',
    size: 120,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {row.original.aniosDesconocidos ? '—' : row.original.anios === 1 ? '1 año' : `${row.original.anios} años`}
      </Text>
    ),
  },
  {
    accessorKey: 'situacion',
    header: 'En qué anda',
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="w-0 min-w-full">
        <EnQueAnda persona={row.original} ruta={RUTA} />
      </div>
    ),
  },
]
const COLUMNA_ETIQUETAS: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'etiquetas',
  header: 'Etiquetas',
  size: 160,
  enableSorting: false,
  cell: ({ row }) => (
    <div className="flex w-0 min-w-full flex-wrap items-center gap-1">
      {row.original.etiquetas.slice(0, 2).map((una) => (
        <Badge key={una} variant="secondary" className="max-w-full truncate">
          {una}
        </Badge>
      ))}
      {row.original.etiquetas.length > 2 ? (
        <Badge variant="outline" className="tabular-nums">
          y {row.original.etiquetas.length - 2} más
        </Badge>
      ) : null}
      {row.original.etiquetas.length ? null : (
        <Text as="span" variant="muted" size="xs">
          Sin etiquetas
        </Text>
      )}
    </div>
  ),
}
const COLUMNA_EN_LA_BASE: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'dias',
  header: 'En la base',
  size: 130,
  cell: ({ row }) => (
    // Con la fecha al pasar el cursor (MC-50).
    <Hint label={`Entró el ${fechaDeEntrada(row.original.dias)}`}>
      <Text as="span" variant="muted" size="sm">
        {hace(row.original.dias)}
      </Text>
    </Hint>
  ),
}
// «Ajuste», como «Ver su ajuste» en la ficha.
const COLUMNA_AJUSTE: DataGridListConfig<PersonaViva>['columns'][number] = {
  accessorKey: 'ajuste',
  header: 'Ajuste',
  size: 170,
  cell: ({ row }) => <CeldaAjuste persona={row.original} />,
}
const COLUMNAS_NORMAL = [...COLUMNAS_INICIO, COLUMNA_ETIQUETAS, COLUMNA_EN_LA_BASE]
const COLUMNAS_COMPARANDO = [...COLUMNAS_INICIO, COLUMNA_EN_LA_BASE, COLUMNA_AJUSTE]

export function Component() {
  const [marcadas, setMarcadasLibre] = useState<string[]>([])
  // `?persona=<id>` abre su ficha al llegar: desde la vacante se trae aquí para borrar sus datos (CA-18).
  const [parametros] = useSearchParams()
  const [abiertaId, setAbiertaId] = useState<string | null>(() => parametros.get('persona'))
  const [agente, setAgente] = useState(false)
  const hueco = useHuecoDerecho()
  // Segundo nivel del panel: su candidatura en una vacante («Ver su ajuste»), guardada por la vacante.
  const [ajusteEn, setAjusteEn] = useState<string | null>(null)
  // Cuando lo elegido cambia por fuera de las casillas (la «x» de la barra, «Elegir las N…», al terminar una acción), la
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

  const base = useBase({
    ruta: RUTA,
    onVerFicha: (id) => {
      setAjusteEn(null)
      setAbiertaId(id)
    },
    // Solo se limpia la selección si la acción fue sobre las marcadas; una acción desde la ficha la deja como estaba (MC-14).
    alTerminar: (ids) => setMarcadas((antes) => (ids.length && ids.every((id) => antes.includes(id)) ? antes.filter((id) => !ids.includes(id)) : antes)),
  })
  const { filtradas, paginacion, paraVacante } = base

  // Lo que la tabla dejó puesto con sus encabezados: qué orden y en qué sentido. Si el orden cambia por fuera (las cifras
  // de arriba limpian todo; comparar con una vacante ordena por lo que más sirve), la tabla se vuelve a montar para que
  // su flecha no diga otra cosa.
  const para = base.filtros.paraVacante
  const [tabla, setTabla] = useState({ orden: null as Orden | null, sentido: 'normal' as Sentido, para, montaje: 0 })
  if ((tabla.orden !== null && (tabla.orden !== base.filtros.orden || tabla.sentido !== base.filtros.sentido)) || tabla.para !== para) {
    setTabla({ orden: null, sentido: 'normal', para, montaje: tabla.montaje + 1 })
  }

  const porId = useMemo(() => new Map(base.todas.map((persona) => [persona.id, persona])), [base.todas])
  const marcadasSet = useMemo(() => new Set(marcadas), [marcadas])
  // Quien se eliminó o se unió deja de estar elegida sola: se leen de la base de hoy.
  const elegidas = marcadas.map((id) => porId.get(id)).filter((persona): persona is PersonaViva => Boolean(persona))
  const abierta = abiertaId ? (porId.get(abiertaId) ?? null) : null
  const candidatura = abierta && ajusteEn ? base.candidaturaDe(abierta, ajusteEn) : null
  // Lo que se pide desde la ficha (postular, escribir, rechazar, eliminar…) se abre dentro de ella, como drawer anidado;
  // desde la tabla o la barra, en la ventana de siempre (8 oct: desde un panel no se abre una ventana encima).
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
  // Elegidas que no se ven con lo que está puesto (MC-02): la barra lo dice.
  const visibles = useMemo(() => new Set(filtradas.map((persona) => persona.id)), [filtradas])
  const ocultas = marcadas.filter((id) => !visibles.has(id))

  const paginaEntera = paginacion.filas.length > 0 && paginacion.filas.every((persona) => marcadasSet.has(persona.id))
  const todasElegidas = filtradas.length > 0 && filtradas.every((persona) => marcadasSet.has(persona.id))
  const marcar = (ids: string[], si: boolean) => setMarcadas((antes) => (si ? [...new Set([...antes, ...ids])] : antes.filter((id) => !ids.includes(id))))
  // Las casillas de la tabla: quien está marcada en cualquier página sigue marcada al volver a ella.
  const seleccion = useMemo(() => Object.fromEntries(marcadas.map((id) => [id, true])), [marcadas])

  // Abrir la ficha; con las flechas del panel la tabla acompaña y pasa a la página de quien se está viendo.
  const abrir = (persona: PersonaViva, lista?: string[]) => {
    setAjusteEn(null)
    setAbiertaId(persona.id)
    setRecorrido(lista ?? filtradas.map((una) => una.id))
    const donde = filtradas.indexOf(persona)
    if (donde >= 0) paginacion.setPagina(Math.floor(donde / paginacion.porPagina) + 1)
  }

  // Toda la fila abre la ficha, no solo el nombre. `DataGridList` no deja pasar el clic por fila a su grilla, así que se
  // escucha en el marco y se busca la persona de la fila tocada. Lo que ya hace algo propio —el nombre, la casilla, los
  // enlaces de «En qué anda», los botones— se queda con su clic, y seleccionar texto tampoco abre nada.
  const abrirDesdeFila = (evento: MouseEvent<HTMLDivElement>) => {
    const destino = evento.target as HTMLElement
    if (destino.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
    const celda = destino.closest('td')
    if (!celda || celda.querySelector('[role="checkbox"], [aria-haspopup]')) return
    if (window.getSelection()?.toString()) return
    const id = celda.closest('tr')?.querySelector<HTMLElement>('[data-persona]')?.dataset.persona
    const persona = id ? porId.get(id) : undefined
    if (persona) abrir(persona)
  }

  // La tabla carga al entrar y cada vez que cambia lo que se consulta: los chips, la búsqueda, los filtros, el orden, la
  // vacante con que se compara, el lote o la página (25 sep, las cargas de Selección). Los filtros de encima y la cabecera
  // de la tabla se quedan quietos; las filas, mientras, son el esqueleto de la tabla del sistema.
  const cargando = useCarga({ filtros: base.filtros, lote: base.loteVisto?.id ?? null, pagina: paginacion.pagina, porPagina: paginacion.porPagina })

  // La tabla del sistema: el conteo a la izquierda, «Personalizar columnas» a la derecha, el orden en los encabezados, las
  // casillas de la librería y el pie de páginas en español dentro del marco.
  const config: Omit<DataGridListConfig<PersonaViva>, 'pagination'> = {
    frame: { description: filtradas.length === base.todas.length ? undefined : `${filtradas.length} de ${base.todas.length} personas` },
    columns: paraVacante ? COLUMNAS_COMPARANDO : COLUMNAS_NORMAL,
    sort: {
      onSortChange: (nuevo) => {
        const columna = nuevo?.replace(/^-/, '')
        const orden = columna ? ORDEN_DE_COLUMNA[columna] : paraVacante ? 'ajuste' : SIN_FILTROS.orden
        // Al revés cuando la flecha pide lo contrario de lo que el orden hace de por sí.
        const baja = Boolean(nuevo?.startsWith('-'))
        const sentido: Sentido = columna && baja !== DE_MAYOR_A_MENOR[orden] ? 'inverso' : 'normal'
        setTabla((antes) => ({ ...antes, orden: columna ? orden : null, sentido }))
        base.cambiar({ orden, sentido })
      },
    },
    // Las casillas eligen en la página que se ve; lo elegido en las otras páginas se queda.
    selection: {
      onSelectionChange: (enLaPagina) => {
        const ids = enLaPagina.map((persona) => persona.id)
        const esperadas = paginacion.filas.filter((persona) => marcadasSet.has(persona.id))
        // Ya dice lo mismo que la pantalla: no hay nada que cambiar, y si se esperaba a la tabla, ya se puso al día.
        if (ids.length === esperadas.length && esperadas.every((persona) => ids.includes(persona.id))) {
          esperandoTabla.current = false
          return
        }
        if (esperandoTabla.current) return
        const deLaPagina = new Set(paginacion.filas.map((persona) => persona.id))
        setMarcadasLibre((antes) => [...antes.filter((id) => !deLaPagina.has(id)), ...ids])
      },
    },
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    // Sus vacíos, con su salida propia (importar, quitar el filtro que más deja fuera, buscar lo que se le parece).
    emptyState: { type: base.todas.length ? 'no-results' : 'empty', customComponent: <VaciaBase base={base} /> },
  }

  return (
    <PageShell>
      {/* «Mis candidatos» es su propia sección (27 sep): su título, su frase y lo principal que se hace aquí, importar. */}
      <CabeceraCandidatos
        ruta={RUTA_BASE}
        acciones={
          <>
            <AccionesBase base={base} />
            {/* Orbit Flow sobre la base (OF-59), al final de la fila. */}
            {agente ? null : <ReopenAgentButton onClick={() => setAgente(true)} />}
          </>
        }
      />

      <PageContent>
        {/* Cómo va la base, con la forma de las cifras del inicio de Vacantes (5 oct): cada cifra deja la tabla mostrando eso mismo. */}
        <PulsoBase base={base} />

        {/* Cómo se busca, encima de la tabla: escribir, filtrar a fondo, volver a una búsqueda de antes y, al final por ser
            de IA, comparar con una vacante; debajo los grupos de la base y lo que se puso en «Filtros». No van en la cabecera
            de la tabla porque la de la librería no deja poner nada propio, y el buscador tampoco va en el suyo: las búsquedas
            guardadas y las sugerencias del vacío escriben en él, y el de la tabla no se deja escribir desde fuera. Todo
            alineado a la izquierda (2 oct, Nicolás: «¿cosas alineadas a la derecha y otras a la izquierda? eso se ve
            rarísimo»). */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <BuscadorBase base={base} className="w-72" />
            <BotonFiltros base={base} />
            <BusquedasGuardadas base={base} />
            <CompararConVacante base={base} />
          </div>
          <ChipsSituacion base={base} />
          <FiltrosPuestos base={base} />

          {/* Lo escrito es un nombre: se buscó por nombre, y se ofrece buscarlo en todo (MC-13). Va aquí y no en el conteo de
              la tabla, que es solo texto. */}
          {base.porNombre && base.enTodoCuantas > filtradas.length ? (
            <div role="status" className="flex flex-wrap items-center gap-x-2 tabular-nums">
              <Text as="span" variant="muted" size="sm">
                Buscando por nombre.
              </Text>
              <Button variant="link" size="sm" className="h-auto! p-0!" onClick={base.buscarEnTodo}>
                Buscar «{base.filtros.texto.trim()}» también en cargos y en lo que saben ({base.enTodoCuantas})
              </Button>
            </div>
          ) : null}

          {/* Con la página entera elegida, se ofrece elegir todo lo que coincide (como en el correo). */}
          {paginaEntera && filtradas.length > paginacion.filas.length ? (
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-primary/7 px-3 py-2" role="status">
              <Text as="span" size="sm" className="tabular-nums">
                {todasElegidas ? `Elegiste las ${filtradas.length} que coinciden.` : `Elegiste las ${paginacion.filas.length} de esta página.`}
              </Text>
              <Button
                variant="link"
                size="sm"
                className="h-auto! p-0!"
                onClick={() => (todasElegidas ? setMarcadas([]) : marcar(filtradas.map((persona) => persona.id), true))}
              >
                {todasElegidas ? 'Quitar la selección' : `Elegir las ${filtradas.length} que coinciden`}
              </Button>
            </div>
          ) : null}

          {/* La fila de la ficha abierta, en azul suave (la elegida ya la pinta la tabla), y toda la fila abre la ficha. */}
          <div className="[&_tbody_tr]:cursor-pointer [&_tbody_tr:has([data-abierta])]:bg-primary/7" onClick={abrirDesdeFila}>
            <ContextoBase.Provider value={{ base, abiertaId: abierta?.id ?? null, onAbrir: abrir }}>
              <TablaDatos
                key={`${para ?? 'sin-comparar'}-${tabla.montaje}`}
                id="base-dos"
                nombre="personas"
                singular="persona"
                config={config}
                data={paginacion.filas}
                isLoading={cargando}
                initialRowSelection={seleccion}
                paginacion={paginacion}
              />
            </ContextoBase.Provider>
          </div>
        </div>

        {/* Las acciones sobre las elegidas: pegada abajo mientras se recorre la tabla. */}
        {elegidas.length ? (
          <BarraBase
            elegidas={elegidas}
            base={base}
            onLimpiar={() => setMarcadas([])}
            ocultas={ocultas.length}
            onQuitarOcultas={() => setMarcadas((antes) => antes.filter((id) => visibles.has(id)))}
          />
        ) : null}
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
        title={candidatura ? 'Candidatura' : (abierta?.nombre ?? '')}
        description={candidatura ? candidatura.vacante.titulo : abierta ? [abierta.cargo, abierta.empresa].filter(Boolean).join(' · ') || 'Sin cargo registrado' : undefined}
        badge={
          abierta && !candidatura ? (
            <span className="flex items-center gap-1.5">
              <Badge variant={SITUACION_BADGE[abierta.situacion]}>
                {SITUACION_TEXTO[abierta.situacion]}
              </Badge>
              <InsigniaEspera persona={abierta} />
            </span>
          ) : undefined
        }
        navigation={
          abierta && candidatura ? (
            <div className="flex items-center border-b px-3 py-1.5">
              <Button data-region="Volver" variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setAjusteEn(null)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                Volver a {abierta.nombre}
              </Button>
            </div>
          ) : abierta && indice >= 0 ? (
            <div className="flex items-center justify-end border-b px-4 py-1.5">
              <div data-region="Anterior / siguiente" className="flex items-center gap-2.5">
                <Text as="span" variant="muted" size="sm" className="tabular-nums">
                  {indice + 1} de {enRecorrido.length}
                </Text>
                <ButtonGroup>
                  <Button variant="outline" size="icon-xs" aria-label="Persona anterior" disabled={indice <= 0} onClick={() => irA(enRecorrido[indice - 1])}>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label="Persona siguiente"
                    disabled={indice >= enRecorrido.length - 1}
                    onClick={() => irA(enRecorrido[indice + 1])}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
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
              onIrA={(id) => setAjusteEn(abierta.vivos.find((proceso) => proceso.candidaturaId === id)?.vacanteId ?? null)}
            />
          </div>
        ) : abierta ? (
          // El perfil trae su propio aire y sus pestañas pegadas arriba: se anula el relleno del cuerpo del panel.
          <div className="-mx-5 -my-4 h-[calc(100%+2rem)]">
            <FichaBase key={abierta.id} persona={abierta} ruta={RUTA} base={base} onVerCandidatura={(una) => setAjusteEn(una.vacante.id)} />
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
  )
}

Component.displayName = 'SeleccionExploracionDosMisCandidatosPage'
