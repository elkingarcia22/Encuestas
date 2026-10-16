import { Text } from '@ubits/flux-ui'
import type { Ajuste } from './main'
import { NotaLibreria } from './vacantes-demos'
import { MedidorEnps } from '@/modules/admin/desempeno-cultura/encuestas/components/graficos'
import { AnilloAvance, Tendencia } from '@/modules/design-system/graficos/piezas'

// Ajustes propios de Desempeño y cultura › Encuestas (rama elkin, 25-sep): los gráficos del home y de los
// resultados, armados con el marco de gráficos de la librería (ChartContainer y ChartTooltipContent, los mismos de
// los bloques «chart» de ReUI) sobre recharts 3. Lo único que se fuerza es cómo se mide el gráfico, y está aquí
// con el porqué.


const PUNTOS = [
  { id: 'q1', name: 'Clima Q1 2026', value: 62 },
  { id: 'q2', name: 'Clima Q2 2026', value: 66 },
  { id: 'q3', name: 'Clima Q3 2026', value: 71 },
]

function GraficosUbits() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      <AnilloAvance valor={81} color="var(--primary)" etiqueta="Participación" tamano={56} />
      <div className="h-12 w-32">
        <Tendencia puntos={PUNTOS} meta={70} color="var(--primary)" formato={(valor) => `${Math.round(valor)}%`} etiqueta="Favorabilidad" />
      </div>
      <MedidorEnps valor={15} reparto={{ promotores: 51, neutros: 4, detractores: 37 }} ancho={140} />
      <Text as="p" variant="muted" size="xs" className="w-full text-center">
        Pasa el cursor: el tooltip es el de la librería.
      </Text>
    </div>
  )
}

export const AJUSTES_ENCUESTAS: Ajuste[] = [
  {
    id: 'encuestas-graficos',
    titulo: 'Gráficos con el marco de la librería',
    estado: 'pedido',
    resumen: 'El anillo, la dona, las barras, la línea con meta y el medidor de eNPS de Encuestas y de los indicadores de Vacantes.',
    piezas: [{ nombre: 'Chart', slug: 'chart' }],
    libreria: <NotaLibreria>Con ChartContainer tal cual (su ResponsiveContainer por dentro) el gráfico sale vacío: la librería trae su propia copia de recharts y la medida no llega al gráfico del proyecto.</NotaLibreria>,
    ubits: <GraficosUbits />,
    cambia: [
      'El gráfico recibe su ancho y alto en números: los fijos (anillo, medidor) directo y la línea midiendo el marco con un ResizeObserver',
      'El Tooltip se importa de recharts (la copia del proyecto) y solo su contenido es ChartTooltipContent de la librería; ChartTooltip de flux-ui no se abre',
      'Los colores entran por el config del marco como variables --color-* y salen de los tokens del tema; la cifra del medidor va encima con Text, no dibujada en el SVG',
      'El proyecto sube a recharts 3, la versión que usa la librería (antes iba en 2)',
    ],
    porque:
      'flux-ui empaqueta recharts 3 dentro de dist en vez de tomarlo del proyecto, y su ResponsiveContainer pasa la medida por un contexto que otra copia de recharts no ve. Sin esto, el marco de gráficos de la librería no se podía usar en el playground.',
    donde: ['piezas.tsx (design-system/graficos/piezas.tsx): Tendencia, AnilloAvance, DonaReparto y BarrasMini; el medidor de eNPS en encuestas/components/graficos.tsx', 'Home de Selección › Vacantes: los tres indicadores', 'Home de Encuestas, tarjeta de arriba de Participación, Favorabilidad, eNPS, Preguntas y Análisis con IA, y el resumen del comparativo'],
    usar: 'Cualquier gráfico nuevo del playground: ChartContainer con config, medida en números y Tooltip de recharts con ChartTooltipContent. Pedir a la librería que tome recharts del proyecto (peerDependency) para quitar el ajuste.',
    evitar: 'ChartContainer con ResponsiveContainer dentro, ChartTooltip de flux-ui, o gráficos sueltos de recharts sin el marco: se ven distintos entre pantallas.',
  },
]

