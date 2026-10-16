import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Heading, Tabs, TabsContent, TabsList, TabsTrigger, TrafficLight } from '@ubits/flux-ui'

import {
  AZUL,
  AZUL_CLARO,
  CURSOR_LINEA,
  EJE,
  Formacion,
  ListaAvance,
  Programas,
  TarjetaCifrasGrafica,
  TOOLTIP,
  VacantesLista,
  type Cifra,
} from './bloques'

// Cómo va cada producto: las tres pestañas se leen igual (idea de Carlos, 17-sep): a la izquierda las cifras que
// importan con su gráfica, a la derecha una lista con avance. No va toda la información de los tableros: solo lo que
// se entiende de un vistazo. La anatomía sale del bloque chart-16 de ReUI (cifras divididas + gráfica).

// ── Selección ───────────────────────────────────────────────────────────────────────────────────
const SELECCION: Cifra[] = [
  { etiqueta: 'Tiempo de contratación', valor: '32 días', detalle: 'Promedio actual' },
  { etiqueta: 'Tasa de éxito', valor: '18,03 %', detalle: 'De candidato a contratado' },
  { etiqueta: 'Candidatos por vacante', valor: '4,5', detalle: '825 candidatos · 183 vacantes' },
]

// Embudo del proceso: cuánta gente queda en cada etapa del flujo (las cinco etapas del producto).
// Cada barra lleva al lado cuánta gente queda y qué parte del total es, para no depender del tooltip.
const ETAPAS = [
  { etapa: 'Candidatos', personas: 825 },
  { etapa: 'Evaluación CV', personas: 312 },
  { etapa: 'Serena AI', personas: 140 },
  { etapa: 'Para revisión', personas: 62 },
  { etapa: 'Antecedentes', personas: 24 },
  { etapa: 'Seleccionados', personas: 9 },
]

const numero = (valor: number) => valor.toLocaleString('es-CO')

const EMBUDO = ETAPAS.map((etapa, indice) => ({
  ...etapa,
  // Del claro al azul pleno: la última etapa es la que importa. Va por transparencia para que el
  // degradado se vea igual en claro y en oscuro.
  color: `color-mix(in oklab, var(--primary) ${55 + indice * 9}%, transparent)`,
  etiqueta: `${numero(etapa.personas)} · ${((etapa.personas / ETAPAS[0].personas) * 100).toFixed(1).replace('.', ',')} %`,
}))

function Seleccion() {
  return (
    <TarjetaCifrasGrafica
      titulo="Contrataciones"
      descripcion="Cuánta gente queda en cada etapa y qué parte del total es"
      cifras={SELECCION}
      leyenda={
        <TrafficLight
          data={{
            label: 'Resumen del embudo',
            items: [
              { label: 'Entran', value: '825', color: AZUL_CLARO },
              { label: 'Se seleccionan', value: '9 · 1,1 %', color: AZUL },
            ],
          }}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={EMBUDO} layout="vertical" barCategoryGap="20%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="etapa" width={118} {...EJE} />
          {/* Las cifras van en columna a la derecha, alineadas entre sí: pegadas a la barra se partían
              en varias líneas cuando la barra era corta. */}
          <YAxis
            yAxisId="cifras"
            orientation="right"
            type="category"
            dataKey="etiqueta"
            width={104}
            {...EJE}
          />
          <Tooltip {...TOOLTIP} formatter={(valor) => numero(Number(valor))} />
          <Bar dataKey="personas" name="Personas" radius={[0, 6, 6, 0]} isAnimationActive={false}>
            {EMBUDO.map((etapa) => (
              <Cell key={etapa.etapa} fill={etapa.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaCifrasGrafica>
  )
}

// ── Desempeño y cultura ─────────────────────────────────────────────────────────────────────────
const DESEMPENO: Cifra[] = [
  { etiqueta: 'Resultado promedio', valor: '28,56', detalle: 'Sobre 100' },
  { etiqueta: 'Sin autoevaluación', valor: '26,58', detalle: 'El promedio que ven los líderes' },
  { etiqueta: 'Participación', valor: '84 %', detalle: '117 de 140 evaluaciones' },
]

const POR_TIPO = [
  { tipo: 'Ascendente', valor: 26.22 },
  { tipo: 'Descendente', valor: 15.54 },
  { tipo: 'Paralela', valor: 24.04 },
  { tipo: 'Cliente', valor: 15.06 },
  { tipo: 'Autoevaluación', valor: 23.3 },
]

function Evaluaciones360() {
  return (
    <TarjetaCifrasGrafica
      titulo="Evaluaciones 360"
      descripcion="Desde dónde califican más alto · promedio por tipo, sobre 100 (la telaraña llega a 30)"
      cifras={DESEMPENO}
      leyenda={
        <TrafficLight
          data={{
            label: 'La telaraña llega a 30 de 100',
            items: [
              { label: 'Más alto · Ascendente', value: '26,22', color: AZUL },
              { label: 'Más bajo · Descendente', value: '15,54', color: AZUL_CLARO },
            ],
          }}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* Telaraña: es la forma habitual de leer una evaluación 360, porque se ve de un vistazo desde
            qué lado califican más alto. La escala llega a 30 porque ningún tipo pasa de ahí. */}
        <RadarChart data={POR_TIPO} outerRadius="82%" margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="tipo" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          {/* Sin números en el centro: ensuciaban la figura. La escala va en la leyenda de abajo. */}
          <PolarRadiusAxis angle={90} domain={[0, 30]} axisLine={false} tick={false} />
          <Tooltip {...TOOLTIP} cursor={CURSOR_LINEA} />
          <Radar
            dataKey="valor"
            name="Resultado"
            stroke={AZUL}
            strokeWidth={2}
            fill={AZUL}
            fillOpacity={0.22}
            dot={{ r: 3, fill: 'var(--card)', stroke: AZUL, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </TarjetaCifrasGrafica>
  )
}

// Assessment como lista con avance, igual que Programas activos y Vacantes.
function AssessmentLista() {
  return (
    <ListaAvance
      titulo="Assessment"
      descripcion="Cómo va la medición de competencias"
      filas={[
        { titulo: 'Acierto en assessment inicial', detalle: '90 assessments completados', pct: 39.23, valor: '39,23 %' },
        { titulo: 'Acierto en assessment de seguimiento', detalle: '50 assessments completados', pct: 31.2, valor: '31,20 %' },
        { titulo: 'Usuarios que lo terminaron', detalle: '82 de 746 con assessment asignado', pct: 10.99, valor: '10,99 %' },
        { titulo: 'Usuarios con assessment asignado', detalle: '746 de 940 colaboradores', pct: 79, valor: '746' },
        { titulo: 'Competencias asignadas', detalle: '34 de 40 del catálogo', pct: 85, valor: '34' },
      ]}
    />
  )
}

export function ResultadosPorProducto() {
  return (
    <section aria-labelledby="por-producto">
      {/* Título y pestañas en la misma fila. Pestañas subrayadas, como el periodo de las métricas y la pestaña maestra
          del sistema (auditoría, decisión 13); la pastilla gris queda para casos especiales. */}
      <Tabs defaultValue="aprendizaje" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading as="h2" level={5} id="por-producto">
            Cómo va cada producto
          </Heading>
          <TabsList variant="line" aria-label="Producto">
            <TabsTrigger value="aprendizaje">Aprendizaje</TabsTrigger>
            <TabsTrigger value="seleccion">Selección</TabsTrigger>
            <TabsTrigger value="desempeno">Desempeño y cultura</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="aprendizaje" className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
          <Formacion />
          <Programas />
        </TabsContent>

        <TabsContent value="seleccion" className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
          <Seleccion />
          <VacantesLista />
        </TabsContent>

        <TabsContent value="desempeno" className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
          <Evaluaciones360 />
          <AssessmentLista />
        </TabsContent>
      </Tabs>
    </section>
  )
}
