import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, MoreHorizontalIcon, ViewIcon } from '@hugeicons/core-free-icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Progress, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AnilloAvance, DonaReparto } from '@/modules/design-system/graficos/piezas'
import { ColumnaIndicador } from '@/modules/design-system/graficos/fila-indicadores'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { SinResultados } from '@/shared/components/SinResultados'
import { fecha, leerEvaluacion, numero, porcentaje, type Resultados } from './datos'
import { ordenarFilas, ResumenPestana, estadoDePersona, ESTADO_PERSONA, useParametroUrl, type EstadoPersona } from './piezas'
import { TemarioPersona, TOTAL_RECURSOS } from './temario'

// Progreso: ¿quién empezó, quién va a medias y quién terminó? Es la pestaña que se abre primero porque responde la
// pregunta que trae a esta pantalla casi siempre: «¿ya lo hicieron?».
//
// Cada fila abre el panel con el temario de esa persona, que es donde se ve **en qué recurso se quedó**: el número de
// la tabla dice cuánto le falta, el panel dice qué le falta.

type Fila = {
  id: string
  nombre: string
  email: string
  inicio: string
  fin: string | null
  avance: number
  estado: EstadoPersona
  /** Recursos del contenido que ya completó: de aquí sale el avance, para que tabla y panel cuenten lo mismo. */
  hechos: number
  /** La nota final ponderada, o `null` si no ha presentado ninguna evaluación. */
  nota: number | null
}

/** El recordatorio siempre va a quien todavía no ha terminado: a quien ya lo hizo no hay nada que recordarle. */
function recordar(lista: readonly Fila[]) {
  const quedan = lista.filter((fila) => fila.estado !== 'Completado')
  if (quedan.length === 0) return notify('Nadie por recordar', 'Todas las personas que marcaste ya finalizaron el contenido.', 'info')
  // Un aviso corto, como el de Resultados de encuestas: qué pasó y por dónde les llega. Nada más.
  notify(
    quedan.length === 1 ? 'Recordatorio enviado' : `Recordatorio enviado a ${numero(quedan.length)} personas`,
    'Les llega por correo y en su inicio de UBITS.',
    'success',
  )
}

function MenuFila({ fila, onVer }: { fila: Fila; onVer: () => void }) {
  return (
    <div onClick={(evento) => evento.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.nombre}`} />}>
          <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onVer}>
              <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
              Ver progreso
            </DropdownMenuItem>
            {/* A quien ya terminó no se le recuerda nada. */}
            <DropdownMenuItem disabled={fila.estado === 'Completado'} onClick={() => recordar([fila])}>
              <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
              Enviar recordatorio
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Progreso({ resultados }: { resultados: Resultados }) {
  // Quién tiene el panel abierto, en la dirección: `?persona=<correo>` abre su detalle.
  const [correoAbierto, setCorreoAbierto] = useParametroUrl('persona')
  const [busqueda, setBusqueda] = useState('')
  const [estados, setEstados] = useState<string[]>([])
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [marcadas, setMarcadas] = useState<readonly Fila[]>([])

  const filas = useMemo<Fila[]>(
    () =>
      resultados.datos.colaboradores.map((uno, indice) => {
        // El avance se ajusta al recurso completo más cercano: un «45 %» en un temario de ocho recursos no existe.
        const hechos = Math.round((uno.progresoPercent / 100) * TOTAL_RECURSOS)
        const avance = TOTAL_RECURSOS === 0 ? 0 : (hechos / TOTAL_RECURSOS) * 100
        // La misma nota que enseña Evaluaciones, con la misma lectura: si las dos pestañas la calcularan por su
        // cuenta, acabarían discrepando, que es justo lo que ya pasó con la aprobación.
        let suma = 0
        let peso = 0
        for (const evaluacion of resultados.datos.evaluaciones) {
          const lectura = leerEvaluacion(uno.evaluaciones[evaluacion.id], evaluacion)
          if (lectura.logrado == null) continue
          suma += lectura.logrado * evaluacion.peso
          peso += evaluacion.peso
        }
        return {
          id: `${uno.email}-${indice}`,
          nombre: uno.nombre,
          email: uno.email,
          inicio: uno.fechaInicio,
          fin: uno.fechaFin,
          avance,
          hechos,
          nota: peso === 0 ? null : suma / peso,
          estado: estadoDePersona(avance),
        }
      }),
    [resultados.datos.colaboradores, resultados.datos.evaluaciones],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => (!texto || fila.nombre.toLowerCase().includes(texto) || fila.email.toLowerCase().includes(texto)) && (estados.length === 0 || estados.includes(fila.estado)))
  }, [filas, busqueda, estados])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])
  const persona = filas.find((fila) => fila.email === correoAbierto) ?? null
  // El recordatorio nunca cuenta a quien ya terminó.
  const porRecordar = marcadas.filter((fila) => fila.estado !== 'Completado').length

  const { iniciaron, completaron, finalizacion, alcance } = resultados
  // Qué parte de la gente a la que le llega el contenido lo ha abierto.
  const tasaInicio = alcance.total === 0 ? 0 : (alcance.iniciaron / alcance.total) * 100

  const limpiar = () => {
    setBusqueda('')
    setEstados([])
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<Fila>['columns'] = [
    // El correo va bajo el nombre y no en su propia columna: con columna, la tabla se comía el «⋯» de la fila a
    // 1366. Además es como se ven las otras cuatro tablas de la pantalla (13-oct).
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      size: 260,
      cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.email} onClick={() => setCorreoAbierto(row.original.email)} />,
    },
    { accessorKey: 'inicio', header: 'Inicio', size: 120, cell: ({ row }) => <Text as="span" size="sm" className="tabular-nums">{fecha(row.original.inicio)}</Text> },
    {
      accessorKey: 'fin',
      header: 'Finalización',
      size: 145,
      // Sin fecha no se deja la celda en blanco: una celda vacía se lee como un dato que falta, no como que no terminó.
      cell: ({ row }) => (
        <Text as="span" size="sm" variant={row.original.fin ? undefined : 'muted'} className="tabular-nums">
          {row.original.fin ? fecha(row.original.fin) : 'No ha finalizado'}
        </Text>
      ),
    },
    // El estado va **antes** del avance: primero en qué anda y después cuánto lleva (Dave, 13-oct).
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 135,
      cell: ({ row }) => (
        <Badge variant={ESTADO_PERSONA[row.original.estado]} size="sm">
          {row.original.estado}
        </Badge>
      ),
    },
    {
      accessorKey: 'avance',
      header: 'Avance',
      size: 165,
      cell: ({ row }) => (
        <div className="flex w-full items-center gap-2">
          <Progress value={row.original.avance} aria-label={`Avance de ${row.original.nombre}`} className="flex-1" />
          <Text as="span" size="sm" weight="semibold" className="w-10 text-right tabular-nums">
            {porcentaje(row.original.avance)}
          </Text>
        </div>
      ),
    },
    // La nota final también aquí, aunque viva en Evaluaciones: quien mira el progreso quiere las dos cosas juntas
    // —cuánto lleva y cómo le fue— sin cambiar de pestaña (pedido del PM, 13-oct).
    {
      accessorKey: 'nota',
      header: 'Nota final',
      size: 110,
      cell: ({ row }) => (
        <Text as="span" size="sm" weight="semibold" variant={row.original.nota == null ? 'muted' : undefined} className="tabular-nums">
          {row.original.nota == null ? '—' : porcentaje(row.original.nota)}
        </Text>
      ),
    },
    { id: 'acciones', header: 'Acciones', size: 90, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuFila fila={row.original} onVer={() => setCorreoAbierto(row.original.email)} /> },
  ]

  const config: DataGridListConfig<Fila> = {
    columns: columnas,
    columnFilters: [{ id: 'estado', label: 'Estado', type: 'select', multiple: true, options: (['Completado', 'En progreso', 'Sin empezar'] as const).map((valor) => ({ label: valor, value: valor })) }],
    onColumnFiltersChange: (nuevos) => {
      const valor = nuevos.find((filtro) => filtro.id === 'estado')?.value
      setEstados(Array.isArray(valor) ? valor.map(String) : [])
      setPagina(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    // La tabla avisa lo marcado en **cada** pintada, con un arreglo nuevo cada vez: guardarlo sin comparar antes
    // vuelve a pintar, que vuelve a avisar, y la pantalla se cae.
    selection: {
      onSelectionChange: (ahora: readonly Fila[]) => {
        if (ahora.length === marcadas.length && ahora.every((fila, indice) => fila.id === marcadas[indice]?.id)) return
        setMarcadas(ahora)
      },
    },
    bulkActions: [
      {
        id: 'recordar',
        label: porRecordar === 0 ? 'Lo marcado ya terminó' : `Enviar recordatorio a ${numero(porRecordar)} ${porRecordar === 1 ? 'persona' : 'personas'}`,
        icon: <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />,
        visibility: 'always',
        disabled: porRecordar === 0,
        onClick: () => recordar(marcadas),
      },
    ],
    search: {
      placeholder: 'Buscar por nombre o correo',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={estados.length > 0 ? 1 : 0} onLimpiar={limpiar} /> },
  }

  return (
    <div className="flex flex-col gap-6">
      <ResumenPestana
        titulo="Finalización"
        ayuda="Es el porcentaje de quienes iniciaron el contenido y llegaron al final: personas que lo finalizaron ÷ personas que lo iniciaron."
        cifra={porcentaje(finalizacion)}
        // Sin «Baja», «Regular» ni «Buena»: poner nota a la finalización de un contenido es juzgar el contenido con
        // un corte que nadie acordó, y eso se nos devuelve. El anillo se llena en azul y la cifra habla sola.
        // Se nombra el denominador: al lado está «Lo han iniciado · 15 de 55», y un «de 15» suelto se podía leer
        // contra el otro número (Dave, 15-oct). Y «finalizaron», la misma palabra que el título de la lectura.
        pie={`${numero(completaron)} finalizaron de ${numero(iniciaron)} que lo iniciaron`}
        grafico={<AnilloAvance valor={finalizacion} color="var(--primary)" etiqueta="Finalización" tamano={48} />}
        // **Cuántos de los que podían, lo abrieron.** Antes aquí estaba el reparto de estados, que no decía nada que
        // la tabla no dijera. Saber que lo iniciaron 22 personas no significa nada sin saber cuántas podían: 22 de 25
        // es un éxito y 22 de toda la empresa, un problema de difusión (Cristian Niño, 14-oct).
        tituloReparto="Lo han iniciado"
        totalReparto={`${numero(alcance.iniciaron)} de ${numero(alcance.total)}`}
        reparto={[
          { id: 'iniciaron', etiqueta: 'Lo iniciaron', porcentaje: tasaInicio, color: 'var(--chart-1)', cantidad: numero(alcance.iniciaron) },
          { id: 'noLoAbrieron', etiqueta: 'No lo han abierto', porcentaje: 100 - tasaInicio, color: 'var(--chart-4)', cantidad: numero(alcance.total - alcance.iniciaron) },
        ]}
        // El porqué del denominador: sin esto, «de 55» no se sabe de dónde sale.
        pieReparto={`${porcentaje(tasaInicio)} · ${alcance.motivo}`}
        tituloTop="Satisfacción"
        top={[]}
        // La satisfacción sale de la encuesta del contenido. Si no la tiene, el resumen se queda en dos lecturas: no
        // es lo mismo «nadie ha respondido» que «aquí no se preguntó nada».
        tercera={resultados.satisfaccion ? <ColumnaSatisfaccion satisfaccion={resultados.satisfaccion} /> : null}
      />

      <PageSection title="Detalle por persona" description="Selecciona una persona para ver dónde se detuvo su avance.">
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="personas"
          singular="persona"
          id="progreso-contenido"
        />
      </PageSection>

      <DrawerShell open={persona !== null} onOpenChange={(abierto) => !abierto && setCorreoAbierto('')} title="Detalle del progreso" size="md">
        {persona ? <TemarioPersona nombre={persona.nombre} email={persona.email} hechos={persona.hechos} inicio={persona.inicio} fin={persona.fin} /> : null}
      </DrawerShell>
    </div>
  )
}

/**
 * Un color por nota, los cinco distintos: con dos verdes y dos rojos, dos tramos del círculo se leían como uno solo
 * y no se sabía cuál era cuál (Dave, 14-oct). Van de la nota más baja a la más alta, por la escala de gráficos del
 * tema, que es la que ya usa el resto del admin.
 */
const COLOR_NOTA = ['var(--chart-5)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)']

/**
 * La satisfacción del contenido: la nota media que le puso la gente en la encuesta.
 *
 * El gráfico es **la misma dona** que «Estado de los inscritos», con un tramo por nota: así las tres lecturas de la
 * fila se leen igual y se ve de un vistazo si las notas se amontonan arriba o están repartidas. Un anillo de avance
 * contaría qué parte de «cinco sobre cinco» se alcanzó, que no significa nada (Dave, 14-oct).
 */
function ColumnaSatisfaccion({ satisfaccion }: { satisfaccion: NonNullable<Resultados['satisfaccion']> }) {
  const { promedio, respuestas, reparto } = satisfaccion
  // Contentos son el 4 y el 5, como la favorabilidad de Encuestas.
  const contentos = reparto[3] + reparto[4]

  return (
    <ColumnaIndicador
      titulo="Satisfacción"
      ayuda={<BotonAyuda etiqueta="Qué mide la satisfacción">Es la nota media de la encuesta de satisfacción del contenido, en una escala de 1 a 5. La responde todo el que termina el contenido.</BotonAyuda>}
      cifra={
        respuestas === 0 ? (
          '—'
        ) : (
          // La nota con su escala: «4,3» a secas se lee como un porcentaje a medias.
          <span className="flex items-baseline gap-1.5">
            <Text as="span" size="xl" weight="semibold" className="tabular-nums">
              {promedio.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </Text>
            <Text as="span" size="sm" variant="muted">
              de 5
            </Text>
          </span>
        )
      }
      grafico={
        respuestas === 0 ? undefined : (
          <DonaReparto
            segmentos={reparto.map((cuantos, indice) => ({
              id: `nota-${indice + 1}`,
              etiqueta: `${indice + 1} de 5`,
              valor: respuestas === 0 ? 0 : (cuantos / respuestas) * 100,
              color: COLOR_NOTA[indice],
              texto: String(cuantos),
            }))}
            etiqueta="Reparto de las notas"
            tamano={48}
          />
        )
      }
      pie={
        <Text as="span" variant="muted" size="xs" className="truncate">
          {respuestas === 0 ? 'Nadie ha respondido todavía' : `${numero(contentos)} de ${numero(respuestas)} la puntuaron con 4 o 5`}
        </Text>
      }
    />
  )
}
