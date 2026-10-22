import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { encuestasDe, fecha, notasDeSatisfaccion, respuestasDeEncuesta, type EncuestaDef, type Resultados } from './datos'
import { ordenarFilas, useParametroUrl } from './piezas'
import { ListaRespuestas } from './respuestas'

// Encuestas: qué dijo la gente del contenido, y quién dijo qué.
//
// La pestaña nace del mismo pedido que el panel de Evaluaciones: que el nombre se abra y se vea respuesta por
// respuesta (Cristian Niño, 14-oct). La diferencia es que aquí **no hay respuesta correcta**, así que la tabla no
// califica a nadie: enseña la nota que puso cada quien y lo que señaló.

type Fila = { id: string; nombre: string; email: string; nota: number; terminó: string | null }

/** El color de la nota: solo tres escalones, y ninguno dice si la persona «acertó». */
const COLOR_NOTA = (nota: number) => (nota >= 4 ? 'success-light' : nota === 3 ? 'warning-light' : 'destructive-light')

export function Encuestas({ resultados }: { resultados: Resultados }) {
  const { satisfaccion, contenido, datos } = resultados
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [correoAbierto, setCorreoAbierto] = useParametroUrl('persona')

  const encuestas = useMemo(() => encuestasDe(contenido, satisfaccion), [contenido, satisfaccion])
  const notas = useMemo(() => notasDeSatisfaccion(datos, satisfaccion), [datos, satisfaccion])

  const filas = useMemo<Fila[]>(
    () =>
      datos.colaboradores
        .filter((persona) => notas.has(persona.email))
        .map((persona) => ({ id: persona.email, nombre: persona.nombre, email: persona.email, nota: notas.get(persona.email) ?? 0, terminó: persona.fechaFin })),
    [datos.colaboradores, notas],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => !texto || fila.nombre.toLowerCase().includes(texto) || fila.email.toLowerCase().includes(texto))
  }, [filas, busqueda])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])
  const abierta = datos.colaboradores.find((persona) => persona.email === correoAbierto && notas.has(persona.email)) ?? null


  const limpiar = () => {
    setBusqueda('')
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<Fila>['columns'] = [
    { accessorKey: 'nombre', header: 'Nombre', size: 260, cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.email} onClick={() => setCorreoAbierto(row.original.email)} /> },
    {
      accessorKey: 'nota',
      header: 'Satisfacción',
      size: 150,
      cell: ({ row }) => (
        <Badge variant={COLOR_NOTA(row.original.nota)} size="sm" className="tabular-nums">
          {row.original.nota} de 5
        </Badge>
      ),
    },
    ...(encuestas.length > 1
      ? [
          {
            id: 'libre',
            header: encuestas[1].nombre,
            size: 220,
            enableSorting: false,
            cell: () => (
              <Text as="span" size="sm" variant="muted">
                Respondida
              </Text>
            ),
          },
        ]
      : []),
    {
      accessorKey: 'terminó',
      header: 'Terminó el contenido',
      size: 170,
      cell: ({ row }) => (
        <Text as="span" size="sm" variant={row.original.terminó ? undefined : 'muted'} className="tabular-nums">
          {row.original.terminó ? fecha(row.original.terminó) : '—'}
        </Text>
      ),
    },
  ]

  const config: DataGridListConfig<Fila> = {
    columns: columnas,
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: {
      placeholder: 'Buscar por nombre o correo',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    emptyState: busqueda.trim()
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={0} onLimpiar={limpiar} /> }
      : { type: 'empty', customComponent: <PrimeraVez icono="glass-message" titulo="Todavía nadie ha respondido" descripcion="La encuesta es la última página del contenido: aparecerá aquí en cuanto alguien lo complete." /> },
  }

  return (
    // **Sin fila de métricas** (Dave, 15-oct): la satisfacción ya se lee en Progreso, y repetirla aquí encima de la
    // tabla de respuestas no añadía nada. Esta pestaña es para leer lo que contestó cada quien.
    <div className="flex flex-col gap-6">

      <PageSection title="Respuestas por persona" description="Selecciona una persona para ver sus respuestas pregunta por pregunta.">
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="personas"
          singular="persona"
          id="encuestas-contenido"
        />
      </PageSection>

      <DrawerShell open={abierta !== null} onOpenChange={(valor) => !valor && setCorreoAbierto('')} title="Respuestas de la persona" size="md">
        {abierta ? <DetalleEncuestas persona={abierta} encuestas={encuestas} nota={notas.get(abierta.email) ?? 0} /> : null}
      </DrawerShell>
    </div>
  )
}

/** Lo que contestó una persona, una pestaña por encuesta. El mismo panel que el de Evaluaciones, sin calificar nada. */
function DetalleEncuestas({ persona, encuestas, nota }: { persona: Resultados['datos']['colaboradores'][number]; encuestas: readonly EncuestaDef[]; nota: number }) {
  const primera = encuestas[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Text as="p" size="sm" weight="semibold">
          {persona.nombre}
        </Text>
        <Text as="p" size="sm" variant="muted">
          {persona.email}
        </Text>
      </div>

      {encuestas.length === 1 ? (
        <ListaRespuestas respuestas={respuestasDeEncuesta(persona, primera, nota)} />
      ) : (
        <Tabs defaultValue={primera.id}>
          <TabsList variant="line">
            {encuestas.map((encuesta) => (
              <TabsTrigger key={encuesta.id} value={encuesta.id} className="flex-none">
                {encuesta.nombre}
              </TabsTrigger>
            ))}
          </TabsList>
          {encuestas.map((encuesta) => (
            <TabsContent key={encuesta.id} value={encuesta.id}>
              <div className="pt-4">
                <ListaRespuestas respuestas={respuestasDeEncuesta(persona, encuesta, nota)} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
