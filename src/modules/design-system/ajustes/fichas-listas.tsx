import { useState, type ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FrameTitle, Text, type DataGridListConfig } from '@ubits/flux-ui'
import type { Ajuste } from './main'
import { ConNota } from './demos'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { FilaElegible, ListaElegible } from '@/modules/design-system/listas/lista-elegible'

// Ficha de la lista para elegir (Elkin, 9-oct). Del lado de la librería, lo que salía al poner la tabla del sistema dentro
// de un acordeón de Participantes; del lado de UBITS, la pieza real importada. Datos de mentira y cortos.

const GRUPOS_DEMO = [
  { grupo: 'Comercial', personas: 637, porcentaje: '9,4 %' },
  { grupo: 'Finanzas', personas: 692, porcentaje: '10,2 %' },
  { grupo: 'Legal', personas: 656, porcentaje: '9,7 %' },
]

type FilaDemo = (typeof GRUPOS_DEMO)[number] & { id: string }

const COLUMNAS_DEMO: DataGridListConfig<FilaDemo>['columns'] = [
  { accessorKey: 'grupo', header: 'Grupo', size: 220 },
  { accessorKey: 'porcentaje', header: 'Del total', size: 120 },
]

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Por grupos</FrameTitle>
        <FrameDescription>Áreas, líderes u otros grupos.</FrameDescription>
      </FrameHeader>
      <div className="flex flex-col gap-2 px-(--frame-panel-header-px) pb-(--frame-panel-header-py)">{children}</div>
    </Frame>
  )
}

function ListaLibreria() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  return (
    <ConNota nota="TablaDatos dentro de un acordeón: el marco del acordeón, el de la tabla y la tabla blanca. Tres cajas una dentro de otra.">
      <Contenedor>
        <TablaDatos
          config={{ columns: COLUMNAS_DEMO }}
          data={GRUPOS_DEMO.map((fila) => ({ ...fila, id: fila.grupo }))}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: GRUPOS_DEMO.length }}
          nombre="grupos"
          singular="grupo"
          id="ficha-lista-libreria"
          pieSoloSiHaceFalta
        />
      </Contenedor>
    </ConNota>
  )
}

function ListaUbits() {
  const [busqueda, setBusqueda] = useState('')
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(() => new Set(['Finanzas']))
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const visibles = GRUPOS_DEMO.filter((fila) => fila.grupo.toLowerCase().includes(busqueda.trim().toLowerCase()))
  const alternar = (grupo: string) => setMarcados((previos) => (previos.has(grupo) ? new Set([...previos].filter((otro) => otro !== grupo)) : new Set([...previos, grupo])))
  const todos = visibles.length > 0 && visibles.every((fila) => marcados.has(fila.grupo))
  return (
    <ConNota nota="ListaElegible: el acordeón y, dentro, un solo panel con las filas. Buscador y herramientas encima, sueltos.">
      <Contenedor>
        <ListaElegible
          id="ficha-lista-ubits"
          nombre="grupos"
          buscador={{ valor: busqueda, onValor: setBusqueda, placeholder: 'Busca un grupo' }}
          casillaPagina={{
            marcada: todos,
            parcial: !todos && visibles.some((fila) => marcados.has(fila.grupo)),
            onCambio: () => setMarcados(todos ? new Set() : new Set(visibles.map((fila) => fila.grupo))),
            etiqueta: 'Marcar los grupos de esta página',
          }}
          paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: visibles.length }}
          vacio={
            <Text as="p" size="sm" variant="muted" className="px-4 py-6 text-center">
              Ningún grupo se llama así.
            </Text>
          }
        >
          {visibles.map((fila) => (
            <FilaElegible
              key={fila.grupo}
              marcada={marcados.has(fila.grupo)}
              onCambio={() => alternar(fila.grupo)}
              etiqueta={`Marcar el grupo ${fila.grupo}`}
              titulo={fila.grupo}
              detalle={`${fila.personas} personas`}
              lateral={
                <Text as="span" size="sm" variant="muted" className="tabular-nums">
                  {fila.porcentaje}
                </Text>
              }
            />
          ))}
        </ListaElegible>
      </Contenedor>
    </ConNota>
  )
}

export const FICHAS_LISTAS: Ajuste[] = [
  {
    id: 'pieza-lista-elegible',
    titulo: 'Lista para elegir',
    estado: 'variante',
    resumen: 'Una lista con casillas para marcar grupos, personas o cosas dentro de un contenedor: buscador encima y un solo panel blanco con las filas.',
    piezas: [
      { nombre: 'Frame', slug: 'frame' },
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Checkbox', slug: 'checkbox' },
      { nombre: 'Input Group', slug: 'input-group' },
      { nombre: 'Pagination', slug: 'pagination' },
    ],
    libreria: <ListaLibreria />,
    ubits: <ListaUbits />,
    cambia: [
      'Dos niveles y no tres: el contenedor y, dentro, un panel con las filas',
      'Buscador y herramientas sobre el fondo del contenedor, no en una cabecera de tabla',
      'Sin columnas, orden ni cambio de ancho: cada fila es casilla, título y detalle, y lo de apoyo a la derecha',
      'El pie en español (PiePaginacion) solo cuando hay más filas que las de una página',
    ],
    porque: 'En Participantes cada acordeón traía una TablaDatos con su propio marco: se leía como tabla dentro de contenedor dentro de contenedor (Elkin, 9-oct). Para elegir no hace falta una tabla.',
    donde: ['ListaElegible y FilaElegible: src/modules/design-system/listas/lista-elegible.tsx', 'Encuestas y Objetivos › Crear › Participantes («Por grupos» y «Por persona»)'],
    usar: 'Marcar a quién o qué entra en algo, dentro de un acordeón, un panel lateral o una sección con marco.',
    evitar: 'Datos que se comparan, se ordenan por columna o llevan un «⋯» por fila: eso es TablaDatos, en su propia página y sin otro marco encima.',
  },
]
