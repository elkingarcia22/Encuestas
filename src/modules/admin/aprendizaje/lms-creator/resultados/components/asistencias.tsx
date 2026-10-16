import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, UserCheck01Icon } from '@hugeicons/core-free-icons'
import { Button, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { notify } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { fechaHora, numero, porcentaje, type Resultados } from './datos'
import { ResumenPestana, ordenarFilas } from './piezas'

// Asistencias: quién estuvo en cada sesión de un evento.
//
// Es la única pestaña con una acción que **mete** datos en vez de leerlos: cargar la lista de quienes firmaron en papel.
// Por eso su primario no es «Descargar» como en las demás, sino «Cargar asistencias».

type Fila = { id: string; nombre: string; usuario: string; sesion: string; modo: string; confirmado: string | null }

export function Asistencias({ resultados }: { resultados: Resultados }) {
  const asistencias = resultados.datos.asistencias ?? []
  // La sesión **se filtra desde su columna**, no desde un selector encima de la tabla: es un filtro más, como los
  // de cualquier otra columna, y así se empieza viéndolas todas (Dave, 14-oct).
  const [sesionesElegidas, setSesionesElegidas] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)

  const sesiones = useMemo(() => [...new Set(asistencias.map((una) => una.sesion))].sort((a, b) => a.localeCompare(b, 'es')), [asistencias])

  const filas = useMemo<Fila[]>(
    () => asistencias.map((una, indice) => ({ id: una.id ?? `asistencia-${indice}`, nombre: una.usuario, usuario: una.username, sesion: una.sesion, modo: una.modo, confirmado: una.confirmadoAt ?? null })),
    [asistencias],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => (sesionesElegidas.length === 0 || sesionesElegidas.includes(fila.sesion)) && (!texto || fila.nombre.toLowerCase().includes(texto) || fila.usuario.toLowerCase().includes(texto)))
  }, [filas, sesionesElegidas, busqueda])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])

  // **Personas, no filas.** Una fila es una persona en una sesión, y quien fue a dos sesiones tiene dos filas: contar
  // filas daba «10 de 10 inscritos · 100 %» en un evento donde una persona repetía y otra no había ido nunca (13-oct).
  const personas = useMemo(() => new Set(filas.filter((fila) => fila.confirmado != null).map((fila) => fila.usuario)), [filas])
  const confirmadas = personas.size
  const automaticas = new Set(filas.filter((fila) => fila.confirmado != null && fila.modo === 'Autoconfirmación').map((fila) => fila.usuario)).size
  const manuales = confirmadas - automaticas
  const inscritos = resultados.inscritos
  const cobertura = inscritos === 0 ? 0 : (confirmadas / inscritos) * 100

  // Las sesiones con más gente: dicen qué horario funciona, que es lo que se usa para programar la siguiente.
  const porSesion = useMemo(
    () =>
      sesiones
        .map((nombre) => ({ id: nombre, etiqueta: nombre, valor: filas.filter((fila) => fila.sesion === nombre && fila.confirmado != null).length }))
        .map((fila) => ({ ...fila, texto: `${numero(fila.valor)} ${fila.valor === 1 ? 'asistente' : 'asistentes'}` }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3),
    [sesiones, filas],
  )

  const limpiar = () => {
    setBusqueda('')
    setSesionesElegidas([])
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<Fila>['columns'] = [
    { accessorKey: 'nombre', header: 'Nombre', size: 240, cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.usuario} /> },
    { accessorKey: 'sesion', header: 'Sesión', size: 280, cell: ({ row }) => <Text as="span" size="sm">{row.original.sesion}</Text> },
    {
      accessorKey: 'modo',
      header: 'Cómo se confirmó',
      size: 170,
      cell: ({ row }) => (
        // Quién confirmó la asistencia cambia cuánto se puede confiar en el dato: la persona o quien cargó la lista.
        <Badge variant={row.original.modo === 'Autoconfirmación' ? 'info-light' : 'secondary'} size="sm">
          {row.original.modo === 'Autoconfirmación' ? 'La persona' : 'Carga manual'}
        </Badge>
      ),
    },
    {
      accessorKey: 'confirmado',
      header: 'Fecha',
      size: 190,
      cell: ({ row }) => (
        <Text as="span" size="sm" variant={row.original.confirmado ? undefined : 'muted'} className="tabular-nums">
          {row.original.confirmado ? fechaHora(row.original.confirmado) : 'Sin confirmar'}
        </Text>
      ),
    },
  ]

  const config: DataGridListConfig<Fila> = {
    columns: columnas,
    columnFilters: [{ id: 'sesion', label: 'Sesión', type: 'select', multiple: true, searchable: true, options: sesiones.map((nombre) => ({ label: nombre, value: nombre })) }],
    onColumnFiltersChange: (nuevos) => {
      const valor = nuevos.find((filtro) => filtro.id === 'sesion')?.value
      setSesionesElegidas(Array.isArray(valor) ? valor.map(String) : [])
      setPagina(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: {
      placeholder: 'Buscar por nombre o usuario',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    emptyState:
      busqueda.trim() || sesionesElegidas.length > 0
        ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={sesionesElegidas.length > 0 ? 1 : 0} onLimpiar={limpiar} /> }
        : // El vacío dice qué hacer, no solo que está vacío: sin una página de asistencia esta pestaña no se puede llenar.
          {
            type: 'empty',
            customComponent: <PrimeraVez icono="glass-calendar" titulo="Todavía no hay asistencias" descripcion="Añade una página de asistencia en los recursos del evento para que la gente confirme, o carga aquí la lista de quienes firmaron." />,
          },
  }

  return (
    <div className="flex flex-col gap-6">
      <ResumenPestana
        titulo="Asistencia"
        ayuda="Es el porcentaje de personas inscritas que confirmaron su asistencia a alguna sesión: personas que confirmaron ÷ personas inscritas."
        cifra={porcentaje(cobertura)}
        // Sin clasificación, por lo mismo que en las otras pestañas: la cifra habla sola y poner nota es juzgar con
        // un corte que nadie acordó (Dave, 14-oct).
        pie={`${numero(confirmadas)} de ${numero(inscritos)} inscritos · ${numero(filas.length)} ${filas.length === 1 ? 'asistencia' : 'asistencias'}`}
        grafico={<AnilloAvance valor={cobertura} color="var(--primary)" etiqueta="Asistencia" tamano={48} />}
        tituloReparto="Cómo se confirmó"
        totalReparto={`${numero(confirmadas)} ${confirmadas === 1 ? 'persona' : 'personas'}`}
        reparto={[
          { id: 'auto', etiqueta: 'La persona', porcentaje: confirmadas === 0 ? 0 : (automaticas / confirmadas) * 100, color: 'var(--chart-1)', cantidad: numero(automaticas) },
          { id: 'manual', etiqueta: 'Carga manual', porcentaje: confirmadas === 0 ? 0 : (manuales / confirmadas) * 100, color: 'var(--chart-4)', cantidad: numero(manuales) },
        ]}
        tituloTop="Sesión más concurrida"
        top={porSesion}
        pieTop={porSesion.length > 0 ? porSesion[0].etiqueta : undefined}
        sinTop="Ninguna sesión con asistentes"
      />

      <PageSection
        title="Detalle de asistencia"
        description="Una fila por persona y sesión."
        actions={
          <Button onClick={() => notify('Carga de asistencias', 'Sube el archivo con quienes firmaron y se cruzarán con los inscritos.', 'info')}>
            <HugeiconsIcon icon={UserCheck01Icon} aria-hidden="true" />
            Cargar asistencias
          </Button>
        }
      >
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="asistencias"
          singular="asistencia"
          id="asistencias-contenido"
        />
      </PageSection>
    </div>
  )
}

/** El icono de la pestaña, compartido con la barra. */
export const ICONO_ASISTENCIA = Calendar03Icon
