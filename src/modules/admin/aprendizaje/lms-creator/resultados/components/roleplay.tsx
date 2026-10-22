import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Copy01Icon, Download04Icon, UnavailableIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameHeader, FramePanel, FrameTitle, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { fechaHora, numero, porcentaje, type IntentoRoleplay, type Resultados } from './datos'
import { ColumnaIntentos } from './evaluaciones'
import { ResumenPestana, ordenarFilas, useParametroUrl } from './piezas'

// Roleplay: cómo le fue a la gente practicando la conversación.
//
// Una fila por **intento**, no por persona: quien repitió sale dos veces, y comparar su primer intento con el segundo
// es justo lo que dice si el roleplay enseña algo. Por eso la tabla se ordena por fecha y no por nombre.

export function Roleplay({ resultados }: { resultados: Resultados }) {
  // Qué roleplay se está viendo **se filtra desde su columna**, no desde un selector encima de la tabla: así se
  // empieza viéndolos todos y se filtra como cualquier otra columna (Dave, 14-oct). Sigue en la dirección, para poder
  // enlazar uno concreto.
  const [elegido, setElegido] = useParametroUrl('roleplay')
  // El intento abierto, en la dirección: `?intento=<id>` lo abre.
  const [idAbierto, setIdAbierto] = useParametroUrl('intento')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)

  // Sin filtro, todos: un contenido con dos roleplay se lee entero de entrada.
  const intentos = useMemo(() => (elegido ? resultados.intentos.filter((uno) => uno.roleplayId === elegido) : resultados.intentos), [resultados.intentos, elegido])
  const nombreRoleplay = (id: string) => resultados.roleplays.find((uno) => uno.id === id)?.nombre ?? '—'

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return intentos.filter((uno) => !texto || uno.nombre.toLowerCase().includes(texto) || uno.email.toLowerCase().includes(texto))
  }, [intentos, busqueda])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])
  const abierto = resultados.intentos.find((uno) => uno.id === idAbierto) ?? null

  const logrados = (uno: IntentoRoleplay) => uno.objetivos.filter((objetivo) => objetivo.alcanzado).length
  const personas = new Set(intentos.map((uno) => uno.email)).size
  // **Por persona, no por intento**: lo que se quiere saber es si acabaron lográndolo, no cuántas veces fallaron por
  // el camino. Quien aprueba al tercer intento aprobó (Dave, 14-oct).
  const personasAprobadas = new Set(intentos.filter((uno) => uno.aprobado).map((uno) => uno.email)).size
  const tasaPersonas = personas === 0 ? 0 : (personasAprobadas / personas) * 100

  // Cuántos intentos gastó cada quien, para la tercera lectura.
  const porPersona = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const uno of intentos) cuenta.set(uno.email, (cuenta.get(uno.email) ?? 0) + 1)
    const valores = [...cuenta.values()]
    return {
      uno: valores.filter((cuantos) => cuantos === 1).length,
      dos: valores.filter((cuantos) => cuantos === 2).length,
      tresOMas: valores.filter((cuantos) => cuantos >= 3).length,
      total: valores.length,
    }
  }, [intentos])

  const limpiar = () => {
    setBusqueda('')
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<IntentoRoleplay>['columns'] = [
    { accessorKey: 'nombre', header: 'Nombre', size: 230, cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.email} onClick={() => setIdAbierto(row.original.id)} /> },
    // La columna va **siempre** que haya roleplay, tenga el contenido uno o cinco: una columna que aparece y
    // desaparece entre contenidos hace que nadie sepa dónde buscar, igual que pasaba con las pestañas (Dave, 14-oct).
    // Lo que sí depende de cuántos hay es el **filtro**: con uno solo no hay nada que acotar.
    {
      accessorKey: 'roleplayId',
      header: 'Roleplay',
      size: 230,
      enableSorting: false,
      cell: ({ row }) => (
        <Text as="span" size="sm" className="truncate">
          {nombreRoleplay(row.original.roleplayId)}
        </Text>
      ),
    },
    { accessorKey: 'fecha', header: 'Fecha del intento', size: 190, cell: ({ row }) => <Text as="span" size="sm" className="tabular-nums">{fechaHora(row.original.fecha)}</Text> },
    {
      accessorKey: 'intento',
      header: 'Intento',
      size: 100,
      cell: ({ row }) => (
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.intento}
        </Text>
      ),
    },
    {
      id: 'objetivos',
      header: 'Objetivos alcanzados',
      size: 200,
      enableSorting: false,
      cell: ({ row }) => {
        const hechos = logrados(row.original)
        const total = row.original.objetivos.length
        return (
          <div className="flex w-full items-center gap-2">
            <Progress value={total === 0 ? 0 : (hechos / total) * 100} aria-label={`Objetivos de ${row.original.nombre}`} className="flex-1" />
            <Text as="span" size="sm" weight="semibold" className="w-12 text-right tabular-nums">
              {hechos} de {total}
            </Text>
          </div>
        )
      },
    },
    {
      accessorKey: 'aprobado',
      header: 'Resultado',
      size: 130,
      cell: ({ row }) => (
        <Badge variant={row.original.aprobado ? 'success-light' : 'destructive-light'} size="sm">
          {row.original.aprobado ? 'Aprobado' : 'No aprobado'}
        </Badge>
      ),
    },
  ]

  const config: DataGridListConfig<IntentoRoleplay> = {
    columns: columnas,
    // El filtro vive en el encabezado de la columna, como el de Estado en Progreso.
    columnFilters:
      resultados.roleplays.length > 1
        ? [{ id: 'roleplayId', label: 'Roleplay', type: 'select', options: resultados.roleplays.map((uno) => ({ label: uno.nombre, value: uno.id })) }]
        : [],
    onColumnFiltersChange: (nuevos) => {
      const valor = nuevos.find((filtro) => filtro.id === 'roleplayId')?.value
      setElegido(Array.isArray(valor) ? String(valor[0] ?? '') : valor == null ? '' : String(valor))
      setPagina(1)
    },
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
      : { type: 'empty', customComponent: <PrimeraVez icono="glass-profile" titulo="Nadie lo ha practicado todavía" descripcion="Cuando alguien haga el roleplay, cada intento aparecerá aquí con sus objetivos y su conversación." /> },
  }

  return (
    <div className="flex flex-col gap-6">
      <ResumenPestana
        titulo="Personas que aprobaron"
        ayuda="Es el porcentaje de personas que llegaron a aprobar el roleplay, aunque les costara varios intentos: personas que aprobaron ÷ personas que lo practicaron. Se cuenta por persona, no por intento: lo que importa es si acabaron lográndolo."
        cifra={porcentaje(tasaPersonas)}
        // Sin «Baja», «Regular» ni «Buena»: poner nota aquí es juzgar el roleplay con un corte que nadie acordó.
        pie={`${numero(personasAprobadas)} de ${numero(personas)} ${personas === 1 ? 'persona' : 'personas'}`}
        grafico={<AnilloAvance valor={tasaPersonas} color="var(--primary)" etiqueta="Personas que aprobaron" tamano={48} />}
        // Sin «Resultado de los intentos» (Dave, 15-oct): repartir los intentos en aprobados y no aprobados decía lo
        // mismo que la cifra de al lado, que ya cuenta por persona y es la lectura que importa.
        // Cuántas vueltas le dio cada quien: es lo que dice si el roleplay está bien calibrado.
        tercera={<ColumnaIntentos intentos={porPersona} />}
      />

      <PageSection
        title="Intentos"
        description="Una fila por intento: quien repitió aparece varias veces. Selecciona una persona para ver sus objetivos y la conversación."
      >
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="intentos"
          singular="intento"
          id="roleplay-contenido"
        />
      </PageSection>

      <DrawerShell open={abierto !== null} onOpenChange={(valor) => !valor && setIdAbierto('')} title="Detalle del intento" size="md">
        {abierto ? <DetalleIntento intento={abierto} /> : null}
      </DrawerShell>
    </div>
  )
}

/**
 * El intento por dentro: qué logró y qué dijo.
 *
 * Las dos pestañas vienen de producción, donde el panel separa el **resultado** (qué logró) de la **conversación**
 * (cómo llegó ahí). El playground React solo muestra lo primero, y entonces no hay forma de saber por qué la IA
 * calificó así: la transcripción es la evidencia.
 */
function DetalleIntento({ intento }: { intento: IntentoRoleplay }) {
  const hechos = intento.objetivos.filter((objetivo) => objetivo.alcanzado).length
  const total = intento.objetivos.length

  const copiar = () => {
    const texto = intento.conversacion.map((mensaje) => `${mensaje.hora} ${mensaje.de === 'estudiante' ? intento.nombre : 'Personaje'}: ${mensaje.texto}`).join('\n')
    void navigator.clipboard?.writeText(texto).then(() => notify('Conversación copiada', 'Ya la puedes pegar donde la necesites.', 'success'))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Text as="p" size="sm" weight="semibold">
          {intento.nombre}
        </Text>
        <Text as="p" size="sm" variant="muted">
          {intento.email}
        </Text>
        <Text as="p" size="xs" variant="muted" className="tabular-nums">
          {fechaHora(intento.fecha)} · Intento {intento.intento}
        </Text>
      </div>

      <Tabs defaultValue="resultado">
        <TabsList variant="line">
          <TabsTrigger value="resultado">Resultado</TabsTrigger>
          <TabsTrigger value="conversacion">Conversación</TabsTrigger>
        </TabsList>

        <TabsContent value="resultado">
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3">
              <AnilloAvance valor={total === 0 ? 0 : (hechos / total) * 100} color="var(--primary)" etiqueta="Objetivos alcanzados" tamano={44} />
              <div className="flex min-w-0 flex-col">
                <Text as="span" size="sm" weight="semibold">
                  {hechos} de {total} objetivos alcanzados
                </Text>
                <Text as="span" size="xs" variant="muted">
                  {intento.aprobado ? 'Suficiente para aprobar el roleplay.' : 'No alcanza para aprobar: necesita al menos 3.'}
                </Text>
              </div>
            </div>

            {intento.objetivos.map((objetivo) => (
              <Frame key={objetivo.titulo}>
                <FrameHeader>
                  <FrameTitle>
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon icon={objetivo.alcanzado ? CheckmarkCircle02Icon : UnavailableIcon} size={16} className={objetivo.alcanzado ? 'text-success' : 'text-destructive'} aria-hidden="true" />
                      {objetivo.titulo}
                    </span>
                  </FrameTitle>
                  <Badge variant={objetivo.alcanzado ? 'success-light' : 'destructive-light'} size="sm">
                    {objetivo.alcanzado ? 'Alcanzado' : 'No alcanzado'}
                  </Badge>
                </FrameHeader>
                <FramePanel className="flex flex-col gap-3">
                  {objetivo.positivos.length > 0 ? <ListaNotas titulo="Lo que hizo bien" notas={objetivo.positivos} /> : null}
                  {objetivo.mejoras.length > 0 ? <ListaNotas titulo="Qué puede mejorar" notas={objetivo.mejoras} /> : null}
                </FramePanel>
              </Frame>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conversacion">
          <div className="flex flex-col gap-4 pt-4">
            {/* Las acciones de la transcripción viven en su pestaña: en «Resultado» no habría nada que descargar. */}
            <div className="flex items-center justify-end gap-2">
              <BotonIcono aria-label="Copiar la conversación" onClick={copiar}>
                <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
              </BotonIcono>
              <Button variant="outline" size="sm" onClick={() => notify('Así se descargaría la transcripción', `${intento.nombre} · intento ${intento.intento}. En el playground no se genera el archivo de verdad.`, 'info')}>
                <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
                Descargar transcripción
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {intento.conversacion.map((mensaje, indice) => (
                <Burbuja key={indice} mensaje={mensaje} nombre={intento.nombre} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ListaNotas({ titulo, notas }: { titulo: string; notas: readonly string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* El rótulo no va en mayúsculas sostenidas, aunque producción lo use así. */}
      <Text as="span" size="xs" weight="semibold" variant="muted">
        {titulo}
      </Text>
      {notas.map((nota) => (
        <Text key={nota} as="p" size="sm">
          {nota}
        </Text>
      ))}
    </div>
  )
}

function Burbuja({ mensaje, nombre }: { mensaje: { de: 'estudiante' | 'personaje'; texto: string; hora: string }; nombre: string }) {
  const esEstudiante = mensaje.de === 'estudiante'
  return (
    <div className={`flex flex-col gap-1 ${esEstudiante ? 'items-end' : 'items-start'}`}>
      <Text as="span" size="xs" variant="muted">
        {esEstudiante ? nombre : 'Personaje'} · {mensaje.hora}
      </Text>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 ${esEstudiante ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <Text as="p" size="sm" className={esEstudiante ? 'text-primary-foreground' : undefined}>
          {mensaje.texto}
        </Text>
      </div>
    </div>
  )
}
