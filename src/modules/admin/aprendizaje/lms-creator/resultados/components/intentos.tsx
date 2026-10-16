import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, SquareUnlock01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Button, Text, type BulkAction, type DataGridListConfig } from '@ubits/flux-ui'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { notify } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { fecha, numero, type Resultados } from './datos'
import { ordenarFilas } from './piezas'

// Gestión de intentos: quién se quedó sin intentos y no puede avanzar.
//
// No lleva resumen de tres columnas como las demás: aquí no hay nada que medir, hay una lista de personas trabadas y
// una sola cosa que hacer con ellas. Un encabezado con cifras sobre cinco filas sería relleno.

type Fila = { id: string; nombre: string; email: string; evaluacion: string; bloqueo: string }

export function Intentos({ resultados }: { resultados: Resultados }) {
  const [busqueda, setBusqueda] = useState('')
  const [liberados, setLiberados] = useState<ReadonlySet<string>>(() => new Set())
  const [marcadas, setMarcadas] = useState<readonly Fila[]>([])
  const [orden, setOrden] = useState<string | undefined>()
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)

  const filas = useMemo<Fila[]>(
    () => resultados.datos.bloqueos.filter((bloqueo) => !liberados.has(bloqueo.id)).map((bloqueo) => ({ id: bloqueo.id, nombre: bloqueo.nombre, email: bloqueo.email, evaluacion: bloqueo.evaluacionNombre, bloqueo: bloqueo.fechaBloqueo })),
    [resultados.datos.bloqueos, liberados],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => !texto || fila.nombre.toLowerCase().includes(texto) || fila.email.toLowerCase().includes(texto))
  }, [filas, busqueda])

  const ordenados = useMemo(() => ordenarFilas(visibles, orden), [visibles, orden])

  const desbloquear = (lista: readonly Fila[]) => {
    if (lista.length === 0) return
    setLiberados((previos) => new Set([...previos, ...lista.map((fila) => fila.id)]))
    setMarcadas([])
    notify(
      lista.length === 1 ? `${lista[0].nombre} tiene un intento más` : `${numero(lista.length)} personas tienen un intento más`,
      lista.length === 1 ? `Ya puede volver a presentar «${lista[0].evaluacion}».` : 'Ya pueden volver a presentar la evaluación que las tenía bloqueadas.',
      'success',
    )
  }

  const limpiar = () => {
    setBusqueda('')
    setPagina(1)
    setVersion((previa) => previa + 1)
  }

  const columnas: DataGridListConfig<Fila>['columns'] = [
    { accessorKey: 'nombre', header: 'Nombre', size: 240, cell: ({ row }) => <CeldaTitulo titulo={row.original.nombre} detalle={row.original.email} /> },
    { accessorKey: 'evaluacion', header: 'Evaluación', size: 230, cell: ({ row }) => <Text as="span" size="sm">{row.original.evaluacion}</Text> },
    { accessorKey: 'bloqueo', header: 'Se bloqueó el', size: 150, cell: ({ row }) => <Text as="span" size="sm" className="tabular-nums">{fecha(row.original.bloqueo)}</Text> },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 150,
      enableSorting: false,
      enableResizing: false,
      ...SIN_ARRASTRE,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => desbloquear([row.original])}>
          <HugeiconsIcon icon={SquareUnlock01Icon} aria-hidden="true" />
          Desbloquear
        </Button>
      ),
    },
  ]

  const acciones: BulkAction<Fila>[] = [
    {
      id: 'desbloquear',
      label: `Desbloquear ${numero(marcadas.length)} ${marcadas.length === 1 ? 'persona' : 'personas'}`,
      icon: <HugeiconsIcon icon={SquareUnlock01Icon} aria-hidden="true" />,
      visibility: 'always',
      onClick: () => desbloquear(marcadas),
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
    // La tabla avisa lo marcado en **cada** pintada, con un arreglo nuevo cada vez: guardarlo sin comparar antes
    // vuelve a pintar, que vuelve a avisar, y la pantalla se cae. Se compara y solo se guarda si de verdad cambió.
    selection: {
      onSelectionChange: (ahora: readonly Fila[]) => {
        if (ahora.length === marcadas.length && ahora.every((fila, indice) => fila.id === marcadas[indice]?.id)) return
        setMarcadas(ahora)
      },
    },
    bulkActions: acciones,
    emptyState: busqueda.trim()
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={0} onLimpiar={limpiar} /> }
      : // Que esté vacío es la buena noticia, y el vacío tiene que decirlo: si no, se lee como que falta cargar algo.
        { type: 'empty', customComponent: <PrimeraVez icono="glass-tick" titulo="Nadie está bloqueado" descripcion="Cuando alguien agote los intentos de una evaluación, aparecerá aquí para darle uno más." /> },
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSection title="Personas sin intentos" description="Agotaron los intentos de una evaluación y no pueden seguir hasta que les des uno más.">
        {filas.length > 0 ? (
          <Alert variant="info" className="mb-4">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertDescription>Desbloquear otorga un intento más a cada persona. Si son varias en la misma evaluación, suele ser la evaluación y no las personas.</AlertDescription>
          </Alert>
        ) : null}
        <TablaDatos
          key={version}
          config={config}
          data={ordenados.slice((pagina - 1) * porPagina, pagina * porPagina)}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: ordenados.length }}
          nombre="personas"
          singular="persona"
          id="intentos-contenido"
        />
      </PageSection>
    </div>
  )
}
