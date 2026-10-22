import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Clock01Icon, RepeatIcon, ScaleIcon, Task01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Button, Frame, FrameHeader, FramePanel, FrameTitle, Heading, Tabs, TabsContent, TabsList, TabsTrigger, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AnilloAvance, DonaReparto } from '@/modules/design-system/graficos/piezas'
import { ColumnaIndicador } from '@/modules/design-system/graficos/fila-indicadores'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { intentosPorPersona, leerEvaluacion, numero, porcentaje, respuestasDeEvaluacion, type EstadoEvaluacion, type Resultados } from './datos'
import { ESTADO_EVALUACION, ResumenPestana, ordenarFilas, useParametroUrl } from './piezas'
import { ListaRespuestas } from './respuestas'

// Evaluaciones: ¿cuánta gente aprueba, y cuál es la que se atraganta?
//
// La celda no dice solo «Aprobado»: dice con cuánto y sobre cuántas preguntas. Un 60 % de cinco preguntas es una
// pregunta de diferencia, y eso cambia si el problema es la persona o la evaluación.

type Celda = { estado: EstadoEvaluacion; texto: string }
type Fila = { id: string; nombre: string; email: string; celdas: Record<string, Celda>; ponderada: number | null }

const SIN_PRESENTAR: Celda = { estado: 'Pendiente', texto: 'Sin presentar' }

export function Evaluaciones({ resultados }: { resultados: Resultados }) {
  const { evaluaciones, colaboradores } = resultados.datos
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [conPesos, setConPesos] = useState(false)
  // Quién está abierto, en la dirección: `?persona=<correo>` abre su detalle y se puede enlazar.
  const [correoAbierto, setCorreoAbierto] = useParametroUrl('persona')
  const abierta = colaboradores.find((persona) => persona.email === correoAbierto) ?? null

  const filas = useMemo<Fila[]>(
    () =>
      colaboradores.map((persona, indice) => {
        const celdas: Record<string, Celda> = {}
        let suma = 0
        let peso = 0
        for (const evaluacion of evaluaciones) {
          // La misma lectura que usa el análisis con IA: una sola forma de decidir si alguien aprobó.
          const lectura = leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)
          if (lectura.estado === 'Pendiente' || lectura.logrado == null) {
            celdas[evaluacion.id] = SIN_PRESENTAR
            continue
          }
          // El detalle dice con cuántas preguntas se logró: es lo que distingue estar cerca de estar lejos.
          celdas[evaluacion.id] = { estado: lectura.estado, texto: lectura.detalle }
          suma += lectura.logrado * evaluacion.peso
          peso += evaluacion.peso
        }
        return { id: `${persona.email}-${indice}`, nombre: persona.nombre, email: persona.email, celdas, ponderada: peso === 0 ? null : suma / peso }
      }),
    [colaboradores, evaluaciones],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => !texto || fila.nombre.toLowerCase().includes(texto) || fila.email.toLowerCase().includes(texto))
  }, [filas, busqueda])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])

  // Las cifras del encabezado se leen sobre quienes la presentaron: contar a quien no la ha hecho como reprobado
  // mezclaría «no pudo» con «no quiso», que piden cosas distintas.
  const todas = filas.flatMap((fila) => Object.values(fila.celdas)).filter((celda) => celda.estado !== 'Pendiente')
  const aprobadas = todas.filter((celda) => celda.estado === 'Aprobado').length
  const reprobadas = todas.length - aprobadas
  const pendientes = filas.flatMap((fila) => Object.values(fila.celdas)).length - todas.length
  const tasa = todas.length === 0 ? 0 : (aprobadas / todas.length) * 100
  const pesoTotal = evaluaciones.reduce((suma, evaluacion) => suma + evaluacion.peso, 0)
  // Sumadas todas las evaluaciones del contenido: cuántas veces tuvo que volver la gente.
  const intentos = useMemo(
    () =>
      evaluaciones.reduce(
        (suma, evaluacion) => {
          const suyos = intentosPorPersona(resultados.datos, evaluacion)
          return { uno: suma.uno + suyos.uno, dos: suma.dos + suyos.dos, tresOMas: suma.tresOMas + suyos.tresOMas, total: suma.total + suyos.total }
        },
        { uno: 0, dos: 0, tresOMas: 0, total: 0 },
      ),
    [evaluaciones, resultados.datos],
  )

  const limpiar = () => {
    setBusqueda('')
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<Fila>['columns'] = [
    // El nombre se abre, como en Roleplay: la tabla dice quién falló y el panel, en qué (Cristian Niño, 14-oct).
    { accessorKey: 'nombre', header: 'Nombre', size: 230, cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.email} onClick={() => setCorreoAbierto(row.original.email)} /> },
    ...evaluaciones.map((evaluacion) => ({
      id: evaluacion.id,
      // Las condiciones de la evaluación viven en la ayuda de su columna: ahí es donde se preguntan, al leer un resultado raro.
      header: () => (
        <span className="flex items-center gap-1">
          {evaluacion.nombre}
          <BotonAyuda etiqueta={`Condiciones de ${evaluacion.nombre}`}>
            <span className="flex flex-col gap-1">
              <span>Pesa {evaluacion.peso}% de la nota final.</span>
              <span>Aprueba con {evaluacion.porcentajeAprobar == null ? 'cualquier resultado' : `${evaluacion.porcentajeAprobar}%`}.</span>
              <span>{evaluacion.limiteIntentos == null ? 'Intentos sin límite.' : `${evaluacion.limiteIntentos} intentos.`}</span>
              <span>{evaluacion.tiempoLimiteMinutos == null ? 'Sin tiempo límite.' : `${evaluacion.tiempoLimiteMinutos} minutos.`}</span>
              <span>{evaluacion.totalPreguntas} preguntas.</span>
            </span>
          </BotonAyuda>
        </span>
      ),
      size: 220,
      enableSorting: false,
      cell: ({ row }: { row: { original: Fila } }) => {
        const celda = row.original.celdas[evaluacion.id] ?? SIN_PRESENTAR
        return (
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant={ESTADO_EVALUACION[celda.estado]} size="sm">
              {celda.estado}
            </Badge>
            {celda.estado === 'Pendiente' ? null : (
              <Text as="span" size="sm" variant="muted" className="truncate tabular-nums">
                {celda.texto}
              </Text>
            )}
          </div>
        )
      },
    })),
    {
      accessorKey: 'ponderada',
      header: 'Nota final',
      size: 120,
      cell: ({ row }) => (
        <Text as="span" size="sm" weight="semibold" variant={row.original.ponderada == null ? 'muted' : undefined} className="tabular-nums">
          {row.original.ponderada == null ? '—' : porcentaje(row.original.ponderada)}
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
      : { type: 'empty', customComponent: <PrimeraVez icono="glass-profile" titulo="Todavía nadie ha presentado" descripcion="Cuando alguien responda una evaluación de este contenido, su resultado aparecerá aquí." /> },
  }

  return (
    <div className="flex flex-col gap-6">
      <ResumenPestana
        titulo="Aprobación"
        ayuda="Es el porcentaje de evaluaciones aprobadas sobre las presentadas: aprobadas ÷ presentadas. Las que nadie ha presentado se cuentan aparte, en el reparto."
        cifra={porcentaje(tasa)}
        // Sin «Baja», «Regular» ni «Buena»: poner nota a la aprobación es juzgar el contenido con un corte que nadie
        // acordó. El anillo se llena en azul y la cifra habla sola (Dave, 14-oct).
        pie={`${numero(aprobadas)} de ${numero(todas.length)} presentadas`}
        grafico={<AnilloAvance valor={tasa} color="var(--primary)" etiqueta="Aprobación" tamano={48} />}
        tituloReparto="Resultado de las evaluaciones"
        totalReparto={`${numero(todas.length + pendientes)} en total`}
        reparto={[
          { id: 'aprobadas', etiqueta: 'Aprobadas', porcentaje: todas.length + pendientes === 0 ? 0 : (aprobadas / (todas.length + pendientes)) * 100, color: 'var(--chart-1)', cantidad: numero(aprobadas) },
          { id: 'reprobadas', etiqueta: 'Reprobadas', porcentaje: todas.length + pendientes === 0 ? 0 : (reprobadas / (todas.length + pendientes)) * 100, color: 'var(--chart-3)', cantidad: numero(reprobadas) },
          { id: 'pendientes', etiqueta: 'Sin presentar', porcentaje: todas.length + pendientes === 0 ? 0 : (pendientes / (todas.length + pendientes)) * 100, color: 'var(--chart-5)', cantidad: numero(pendientes) },
        ]}
        // La tercera lectura dice si la evaluación está bien calibrada: cuántas vueltas le tuvo que dar la gente.
        tercera={<ColumnaIntentos intentos={intentos} />}
      />

      <PageSection
        title="Resultado por persona"
        description={`${evaluaciones.length === 1 ? 'La evaluación del contenido' : `Las ${evaluaciones.length} evaluaciones del contenido`}, con la nota final ponderada por su peso.`}
        actions={
          <Button variant="outline" onClick={() => setConPesos(true)}>
            <HugeiconsIcon icon={ScaleIcon} aria-hidden="true" />
            Cómo se califica
          </Button>
        }
      >
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="personas"
          singular="persona"
          id="evaluaciones-contenido"
        />
      </PageSection>

      <DrawerShell open={abierta !== null} onOpenChange={(valor) => !valor && setCorreoAbierto('')} title="Respuestas de la persona" size="md">
        {abierta ? <DetallePersona persona={abierta} evaluaciones={evaluaciones} /> : null}
      </DrawerShell>

      {/* Las condiciones de todas las evaluaciones, en su ventana.

          Antes iban como insignias junto al título, y eso solo se sostiene con dos o tres: un contenido con diez
          evaluaciones dejaba la cabecera llena de pastillas. Aquí caben las que haya, con sitio para cada condición y
          no solo para el peso (Dave, 13-oct). La columna sigue teniendo su (i) para consultar una suelta. */}
      <ActionDialog
        open={conPesos}
        onOpenChange={setConPesos}
        title="Cómo se califica este contenido"
        lead={<Heading as="h3" level={6}>{evaluaciones.length === 1 ? 'La evaluación de este contenido' : `Las ${evaluaciones.length} evaluaciones de este contenido`}</Heading>}
        footer={<Button onClick={() => setConPesos(false)}>Entendido</Button>}
      >
        <div className="flex flex-col gap-3">
          {evaluaciones.map((evaluacion) => (
            <Frame key={evaluacion.id}>
              <FrameHeader>
                <FrameTitle>{evaluacion.nombre}</FrameTitle>
                <Badge variant="invert-light" size="sm" className="tabular-nums">
                  {evaluacion.peso}% de la nota
                </Badge>
              </FrameHeader>
              <FramePanel>
                <ListaCondiciones evaluacion={evaluacion} />
              </FramePanel>
            </Frame>
          ))}
          {/* Si los pesos no suman 100 la nota final engaña, y es el tipo de error que solo se ve mirándolos juntos. */}
          {pesoTotal !== 100 ? (
            <Alert variant="warning">
              <AlertDescription>
                Los pesos suman {pesoTotal}%, no 100%. La nota final se calcula repartiendo sobre lo que sí suman.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </ActionDialog>
    </div>
  )
}

/** Las condiciones de una evaluación, una por línea: lo mismo que cuenta la ayuda de su columna. */
function ListaCondiciones({ evaluacion }: { evaluacion: Resultados['datos']['evaluaciones'][number] }) {
  const lineas = [
    { icono: Task01Icon, texto: `${evaluacion.totalPreguntas} ${evaluacion.totalPreguntas === 1 ? 'pregunta' : 'preguntas'}` },
    { icono: CheckmarkCircle02Icon, texto: evaluacion.porcentajeAprobar == null ? 'Aprueba con cualquier resultado' : `Aprueba con ${evaluacion.porcentajeAprobar}% o más` },
    { icono: RepeatIcon, texto: evaluacion.limiteIntentos == null ? 'Intentos sin límite' : `${evaluacion.limiteIntentos} ${evaluacion.limiteIntentos === 1 ? 'intento' : 'intentos'}` },
    { icono: Clock01Icon, texto: evaluacion.tiempoLimiteMinutos == null ? 'Sin tiempo límite' : `${evaluacion.tiempoLimiteMinutos} minutos` },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {lineas.map((linea) => (
        <span key={linea.texto} className="flex items-center gap-2">
          <HugeiconsIcon icon={linea.icono} size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
          <Text as="span" size="sm">
            {linea.texto}
          </Text>
        </span>
      ))}
    </div>
  )
}

/** Los iconos de las condiciones, compartidos con la vista del colaborador. */
export const ICONO_CONDICION = { tiempo: Clock01Icon, intento: RepeatIcon }

/**
 * Cuántas vueltas le dio la gente: la tercera lectura de Evaluaciones y de Roleplay.
 *
 * Dice si lo que se pide está bien calibrado. Si casi todo el mundo lo saca a la primera, sobra; si la mayoría
 * necesita tres, el problema está en lo que se pide o en lo que lo precede, no en las personas (Dave, 14-oct).
 */
export function ColumnaIntentos({ intentos }: { intentos: { uno: number; dos: number; tresOMas: number; total: number } }) {
  const { uno, dos, tresOMas, total } = intentos
  const media = total === 0 ? 0 : (uno + dos * 2 + tresOMas * 3) / total

  return (
    <ColumnaIndicador
      titulo="Intentos por persona"
      ayuda={<BotonAyuda etiqueta="Qué mide los intentos por persona">Cuántas veces, de media, tuvo que presentarse cada persona hasta terminar. Solo cuenta a quienes ya se presentaron.</BotonAyuda>}
      cifra={total === 0 ? '—' : media.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      grafico={
        total === 0 ? undefined : (
          <DonaReparto
            segmentos={[
              { id: 'uno', etiqueta: 'A la primera', valor: (uno / total) * 100, color: 'var(--chart-1)', texto: String(uno) },
              { id: 'dos', etiqueta: 'Dos intentos', valor: (dos / total) * 100, color: 'var(--chart-3)', texto: String(dos) },
              { id: 'tres', etiqueta: 'Tres o más', valor: (tresOMas / total) * 100, color: 'var(--chart-5)', texto: String(tresOMas) },
            ]}
            etiqueta="Intentos por persona"
            tamano={48}
          />
        )
      }
      pie={
        <Text as="span" variant="muted" size="xs" className="truncate">
          {total === 0 ? 'Nadie se ha presentado' : `${numero(uno)} a la primera · ${numero(dos + tresOMas)} tuvieron que repetir`}
        </Text>
      }
    />
  )
}

/**
 * Una persona por dentro: qué sacó en cada evaluación y qué marcó en cada pregunta.
 *
 * Es el mismo panel que ya tenía Roleplay, traído aquí porque la pregunta es la misma: la tabla dice **quién** falló y
 * el panel dice **en qué**, que es lo único que se puede arreglar (Cristian Niño, 14-oct). Con varias evaluaciones van
 * en pestañas, porque verlas seguidas en un panel estrecho hace perder de vista cuál se está leyendo.
 */
function DetallePersona({ persona, evaluaciones }: { persona: Resultados['datos']['colaboradores'][number]; evaluaciones: Resultados['datos']['evaluaciones'] }) {
  const primera = evaluaciones[0]

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

      {evaluaciones.length === 1 ? (
        <BloqueEvaluacion persona={persona} evaluacion={primera} />
      ) : (
        <Tabs defaultValue={primera.id}>
          <TabsList variant="line">
            {evaluaciones.map((evaluacion) => (
              <TabsTrigger key={evaluacion.id} value={evaluacion.id} className="flex-none">
                {evaluacion.nombre}
              </TabsTrigger>
            ))}
          </TabsList>
          {evaluaciones.map((evaluacion) => (
            <TabsContent key={evaluacion.id} value={evaluacion.id}>
              <div className="pt-4">
                <BloqueEvaluacion persona={persona} evaluacion={evaluacion} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

/** Lo que sacó en una evaluación: el resultado arriba y, debajo, pregunta por pregunta. */
function BloqueEvaluacion({ persona, evaluacion }: { persona: Resultados['datos']['colaboradores'][number]; evaluacion: Resultados['datos']['evaluaciones'][number] }) {
  const lectura = leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)
  const respuestas = respuestasDeEvaluacion(persona, evaluacion)

  if (lectura.estado === 'Pendiente') {
    return (
      <PrimeraVez
        icono="glass-document"
        titulo="Todavía no la ha presentado"
        descripcion={`Cuando responda «${evaluacion.nombre}», aquí se verán sus respuestas pregunta por pregunta.`}
      />
    )
  }

  const acertadas = respuestas.filter((respuesta) => respuesta.acertada).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AnilloAvance valor={lectura.logrado ?? 0} color="var(--primary)" etiqueta={`Resultado de ${evaluacion.nombre}`} tamano={44} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <Text as="span" size="sm" weight="semibold" className="tabular-nums">
              {porcentaje(lectura.logrado ?? 0)}
            </Text>
            <Badge variant={ESTADO_EVALUACION[lectura.estado]} size="sm">
              {lectura.estado}
            </Badge>
          </span>
          <Text as="span" size="xs" variant="muted" className="tabular-nums">
            {acertadas} de {respuestas.length} correctas · aprueba con{' '}
            {evaluacion.porcentajeAprobar == null ? 'cualquier resultado' : `${evaluacion.porcentajeAprobar}%`}
          </Text>
        </div>
      </div>

      <ListaRespuestas respuestas={respuestas} />
    </div>
  )
}
