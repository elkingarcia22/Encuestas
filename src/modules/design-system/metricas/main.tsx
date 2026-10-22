import type { ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FrameTitle, Text, TrafficLight } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { Ayuda, Cambio, Cifra as CifraConCambio, Pie } from '@/modules/admin/seleccion/propuestas/components/cifras'
import { bolsaDe, useHistorial } from '@/modules/admin/seleccion/propuestas/creditos'
import { TableroCreditos } from '@/modules/admin/seleccion/creditos/uno/components/tablero'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '../graficos/fila-indicadores'
import { AnilloAvance, BarrasMini, DonaReparto, Tendencia as TendenciaConMeta, type SegmentoReparto } from '../graficos/piezas'
import { Demo, EncabezadoPatron, Reglas, SectionIntro, VerEnAccion, type Regla } from '../patrones/piezas'
import { Indicadores, type Cifra } from './cifras'
import { BarraSegmentada, GraficoArea, Tendencia } from './graficos'

// Componentes › Métricas: las cifras y gráficos de los tableros. Hasta el 29-sep vivían en el Dashboard del Archivo y en el
// Inicio; se mudaron a design-system/metricas y aquí se documentan con las mismas piezas que usan las pantallas.
//
// 13-oct (Cristian: «si no se usa hay que eliminarlo»): salieron la tarjeta con minigráfico (TarjetaIndicador), Sparkline,
// Anillo y Dona, que solo usaban las carpetas congeladas del Archivo. En su lugar se muestran las piezas que sí usan
// Vacantes, Encuestas y Objetivos: la fila con un gráfico chico por cifra (DonaReparto, BarrasMini, AnilloAvance) y la
// tendencia con meta.
//
// 6-oct (Cristian: «dejemos lo de Nico», «sí o sí debe estar sincronizado con Nicolás»): la fila con comparación y ayuda
// de Selección y el tablero «Lo que necesita tu atención» se muestran aquí con las piezas reales de Nicolás, importadas
// de sus pantallas, no con copias: si él las cambia, esta página cambia sola.

const CIFRAS: Cifra[] = [
  { etiqueta: 'Colaboradores activos', valor: '1.248', detalle: '4 % más que el mes pasado' },
  { etiqueta: 'Completaron su plan', valor: '68 %', detalle: 'Meta del trimestre: 75 %' },
  { etiqueta: 'Rotación', valor: '3,1 %', detalle: 'Bajó 0,4 puntos' },
  { etiqueta: 'Tareas vencidas', valor: '12', detalle: 'Pasaron su fecha', atencion: true },
]

const MESES = [
  { mes: 'Abr', iniciaron: 320, completaron: 210 },
  { mes: 'May', iniciaron: 380, completaron: 250 },
  { mes: 'Jun', iniciaron: 360, completaron: 290 },
  { mes: 'Jul', iniciaron: 420, completaron: 310 },
  { mes: 'Ago', iniciaron: 460, completaron: 350 },
  { mes: 'Sep', iniciaron: 510, completaron: 400 },
]

const SERIES: { clave: 'iniciaron' | 'completaron'; nombre: string; color: string }[] = [
  { clave: 'iniciaron', nombre: 'Iniciaron', color: 'var(--primary)' },
  { clave: 'completaron', nombre: 'Completaron', color: 'var(--success)' },
]

// Los datos de la fila con gráfico, como en el home de Vacantes.
const ESTADOS: SegmentoReparto[] = [
  { id: 'publicadas', etiqueta: 'Publicadas', valor: 12, color: 'var(--success)' },
  { id: 'pausadas', etiqueta: 'Pausadas', valor: 3, color: 'var(--warning)' },
  { id: 'borradores', etiqueta: 'Borradores', valor: 2, color: 'var(--info)' },
  { id: 'cerradas', etiqueta: 'Cerradas', valor: 5, color: 'var(--muted-foreground)' },
]

const NUEVOS = [
  { id: 'analista', nombre: 'Analista de datos', valor: 18 },
  { id: 'disenadora', nombre: 'Diseñadora de producto', valor: 11 },
  { id: 'comercial', nombre: 'Ejecutivo(a) comercial', valor: 7 },
  { id: 'turno', nombre: 'Coordinador de turno', valor: 4 },
]

// La favorabilidad de las últimas mediciones, como en el home de Encuestas.
const MEDICIONES = [
  { id: 'm1', name: 'Clima Q4 2025', value: 66 },
  { id: 'm2', name: 'Pulso enero', value: 68 },
  { id: 'm3', name: 'Clima Q1', value: 67 },
  { id: 'm4', name: 'Pulso abril', value: 71 },
  { id: 'm5', name: 'Clima Q2', value: 73 },
  { id: 'm6', name: 'Pulso agosto', value: 76 },
]

const SEGMENTOS = [
  { id: 'activas', etiqueta: 'Activas', valor: 820, color: 'var(--primary)' },
  { id: 'inactivas', etiqueta: 'Inactivas', valor: 180, color: 'var(--chart-2)' },
  { id: 'libres', etiqueta: 'Libres', valor: 248, color: 'var(--muted)' },
]

const REGLAS: Regla[] = [
  { titulo: 'Las cifras van en una sola tarjeta', detalle: 'Una tarjeta partida con divisores (acuerdo del 14-sep), no tarjetas sueltas por cifra. La tarjeta con minigráfico (TarjetaIndicador) no la usa ninguna pantalla del producto: queda como referencia hasta decidir si se retira.' },
  { titulo: 'La cifra en seminegrita del tema', detalle: 'Text xl seminegrita; el nombre arriba en gris y el detalle debajo en gris pequeño.' },
  { titulo: 'Si la cifra cuenta personas o cosas, se toca para verlas', detalle: 'ColumnaIndicador (y MetricasDestacadas) con onVer: toda la columna se toca, se marca al pasar el cursor y lleva una flecha junto al nombre; abre un panel con quienes cuenta la cifra. La ayuda sigue abriendo su globo. 15-oct, Planes › Avance. En el ejemplo, «Esperan algo de ti».' },
  { titulo: 'La comparación, junto a la cifra', detalle: 'Cambio (6-oct, vuelve con la forma de Nicolás): la insignia verde si mejoró, roja si empeoró —con menosEsMejor cuando bajar es bueno— e «Igual que…» si no se movió. Debajo, la línea gris dice contra qué se compara («Frente a 364 el mes pasado»).' },
  { titulo: 'Una sola insignia de comparación', detalle: 'Cambio es la de todo el producto, también en tablas: decimales para los puntos porcentuales («+2,3 pp»), sinColor cuando subir no es bueno ni malo, enCelda para el «0 pp» gris de una celda y ayuda para la nota en el globo. Si le falta algo, se amplía; no se arma otra Variacion.' },
  { titulo: 'La ayuda abre con clic', detalle: 'La «i» junto al nombre de la cifra es BotonAyuda, la ayuda única del sistema: abre al lado el globo oscuro con qué mide. Con clic, con teclado y en pantalla táctil, no solo al pasar el cursor.' },
  { titulo: 'Lo que necesita tu atención, en la home y en cada producto', detalle: 'El tablero va arriba de la Super Home (/admin) y también del inicio de cada producto, porque no todos entran por la home ni tienen todos los productos (war room del 8-oct). Es un solo patrón: caja gris con título y descripción, tres columnas con su asunto y su llamado a la acción, sin prioridades. Entra recogido con lo más urgente; «Expandir» muestra más. Cada asunto se resuelve en su panel y lo resuelto sale del tablero.' },
  { titulo: 'Colores solo del tema', detalle: 'Los gráficos se pintan con var(--primary), var(--chart-N) y los grises del tema; nunca colores escritos a mano.' },
  { titulo: 'El gráfico chico, junto a su cifra', detalle: 'En una fila de cifras, cada una lleva el gráfico que pide su lectura en la esquina: dona si es parte de un total, barras si compara elementos, anillo si es un avance contra un límite. Sin leyenda: el nombre de cada tramo sale al pasar el cursor.' },
  { titulo: 'Leyenda con TrafficLight', detalle: 'Los gráficos grandes (área) llevan su leyenda con TrafficLight debajo, no una lista armada a mano.' },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Métricas" antetitulo="Design system · Componentes" acciones={<VerEnAccion pagina="metricas" />}>
        Las cifras y gráficos de los tableros: la fila de cifras del Inicio, la fila con comparación y ayuda de Selección,
        la fila con un gráfico chico por cifra, el tablero «Lo que necesita tu atención» y los gráficos de área, tendencia y
        barra. Son las mismas piezas que usan el Inicio del admin, Tareas, Avisos internos, Selección, Créditos de IA,
        Encuestas, Objetivos y Home operativo.
      </EncabezadoPatron>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Fila de cifras"
          description="Indicadores es la fila en su marco, sola sobre la página. Dentro de una tarjeta que ya tiene marco se usa FilaCifras."
        />
        <Indicadores cifras={CIFRAS} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Fila con comparación y ayuda"
          description="La de Selección («Cómo van los procesos» en Vacantes, «Cómo va tu base» en Mis candidatos): el marco con su título, y en cada cifra la ayuda, hacia dónde va frente al periodo anterior y dos líneas, contra qué se compara y qué significa. Toca la «i» para ver la ayuda."
        />
        <FilaConComparacion />
        <VariantesDeCambio />
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Lo que necesita tu atención"
          description="El tablero de Nicolás: una columna por grupo, recogido con lo más urgente y «Expandir» para ver más. Abre un asunto para ver su panel. Vive en la Super Home (/admin) y en el inicio de cada producto, como Vacantes o Créditos de IA, con el mismo patrón (war room del 8-oct: reemplaza la regla del 5-oct, «solo en la Super Home»)."
        />
        <TableroDeEjemplo />
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro
          title="Fila con un gráfico por cifra"
          description="La del home de Vacantes y de Encuestas: cada cifra con el gráfico chico que pide su lectura en la esquina. Pasa el cursor por cada gráfico para ver su detalle."
        />
        <FilaConGrafico />
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Gráficos" description="Recharts pintado con los colores del tema. Cada uno con los datos de un tablero real." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Área" description="Series en el tiempo, con su leyenda y el detalle al pasar el cursor. Créditos de IA y el tablero de Selección.">
            <GraficoArea datos={MESES} eje="mes" alto={220} series={SERIES} />
            <TrafficLight
              className="justify-center"
              data={{ label: 'Septiembre', items: SERIES.map((serie) => ({ label: serie.nombre, value: String(MESES[MESES.length - 1][serie.clave]), color: serie.color })) }}
            />
          </Demo>
          <Demo title="Tendencia con meta" description="Las últimas mediciones y la meta punteada; al pasar el cursor, el nombre de cada medición. Encuestas y Objetivos.">
            <div className="h-40">
              <TendenciaConMeta puntos={MEDICIONES} meta={70} color="var(--primary)" formato={(valor) => `${Math.round(valor)} %`} etiqueta="Favorabilidad" conEje />
            </div>
          </Demo>
          <Demo title="Tendencia junto a la cifra" description="Solo la línea, al lado de una cifra que ya dice el valor. Tablero de Selección y Home operativo.">
            <div className="h-16">
              <Tendencia datos={[42, 45, 44, 48, 51, 50, 55, 58]} color="var(--primary)" />
            </div>
          </Demo>
          <Demo title="Barra segmentada" description="El reparto de un total en una barra. Créditos de IA y el comparativo de Encuestas.">
            <BarraSegmentada segmentos={SEGMENTOS} />
          </Demo>
        </div>
      </section>

      <Reglas titulo="Reglas" reglas={REGLAS} />
    </div>
  )
}

// La fila de «Cómo va tu base» (Mis candidatos), armada con las piezas de Selección.
function FilaConComparacion() {
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Cómo va tu base</FrameTitle>
        <FrameDescription>Cada cifra, frente al periodo anterior.</FrameDescription>
      </FrameHeader>
      <FilaIndicadores etiqueta="Indicadores de ejemplo" columnas={4} enMarco>
        <ColumnaIndicador
          titulo="Personas en tu base"
          ayuda={<Ayuda titulo="Personas en tu base">Todas las personas de tu base: las que aplicaron, las que importaste y las que agregaste a mano. Se compara con las que había hace un mes.</Ayuda>}
          cifra={<CifraConCambio valor="533" cambio={<Cambio valor={169} sufijo="" frente="el mes pasado" />} />}
          pie={<Pie frente="Frente a 364 el mes pasado" significa="Por dónde más: LinkedIn (45)" />}
        />
        <ColumnaIndicador
          titulo="En algún proceso"
          ayuda={<Ayuda titulo="En algún proceso">Personas que hoy siguen en al menos una vacante abierta. Se compara con las que había hace un mes.</Ayuda>}
          cifra={<CifraConCambio valor="47" cambio={<Cambio valor={5} sufijo="" frente="el mes pasado" />} />}
          pie={<Pie frente="Frente a 42 el mes pasado" significa="Repartidas en 4 vacantes" />}
        />
        <ColumnaIndicador
          titulo="Esperan algo de ti"
          ayuda={<Ayuda titulo="Esperan algo de ti">Personas en un proceso que esperan una acción tuya para seguir. Menos es mejor. Se compara con la semana pasada.</Ayuda>}
          cifra={<CifraConCambio valor="24" cambio={<Cambio valor={4} sufijo="" menosEsMejor frente="la semana pasada" />} />}
          pie={<Pie frente="Frente a 20 la semana pasada" significa="La que más: 12 días" />}
          onVer={() => notify('Aquí se abre el panel con las 24 personas', 'En una pantalla real, la lista de quienes cuenta la cifra.', 'info')}
          etiquetaVer="Ver las 24 personas que esperan algo de ti"
        />
        <ColumnaIndicador
          titulo="Libres para postular"
          ayuda={<Ayuda titulo="Libres para postular">Personas que nunca han estado en un proceso: las puedes postular a una vacante. Se compara con las que había hace un mes.</Ayuda>}
          cifra={<CifraConCambio valor="330" cambio={<Cambio valor={0} sufijo="" frente="el mes pasado" />} />}
          pie={<Pie frente="Frente a 330 el mes pasado" significa="Nunca han pasado por un proceso" />}
        />
      </FilaIndicadores>
    </Frame>
  )
}

// La fila del home de Vacantes, con las mismas piezas: dona para un total, barras para comparar, anillo para un avance.
function FilaConGrafico() {
  return (
    <FilaIndicadores etiqueta="Indicadores de ejemplo">
      <ColumnaIndicador
        titulo="Vacantes publicadas"
        cifra="12"
        grafico={<DonaReparto segmentos={ESTADOS} etiqueta="Vacantes por estado" />}
        pie={<DetalleIndicador>3 pausadas · 2 en borrador</DetalleIndicador>}
      />
      <ColumnaIndicador
        titulo="Candidatos nuevos"
        cifra="40"
        grafico={
          <div className="h-10 w-28">
            <BarrasMini barras={NUEVOS} etiqueta="Candidatos nuevos" color="var(--primary)" />
          </div>
        }
        pie={<DetalleIndicador>Últimos 7 días · repartidos en 4 vacantes</DetalleIndicador>}
      />
      <ColumnaIndicador
        titulo="Días abiertas en promedio"
        cifra="18 días"
        grafico={<AnilloAvance valor={60} color="var(--primary)" etiqueta="Promedio de las publicadas" texto="18 de 30 días" tamano={44} />}
        pie={<DetalleIndicador>Ninguna pasa de 30 días, el límite de estancada</DetalleIndicador>}
      />
    </FilaIndicadores>
  )
}

// Las opciones de Cambio (7-oct), con la pieza real: las usa el comparativo de Encuestas, que dejó su propia Variacion.
const VARIANTES_CAMBIO: { opcion: string; para: string; pieza: ReactNode }[] = [
  {
    opcion: 'decimales',
    para: 'Redondea antes de mostrar: los puntos porcentuales con uno; lo que redondea a 0 se lee como «igual».',
    pieza: <Cambio valor={2.26} decimales={1} sufijo=" pp" frente="la medición anterior" />,
  },
  {
    opcion: 'sinColor',
    para: 'Ni verde ni rojo, para lo que subir no es bueno ni malo (más comentarios neutrales).',
    pieza: <Cambio valor={12} sufijo="" sinColor frente="la medición anterior" />,
  },
  {
    opcion: 'enCelda',
    para: 'En una tabla, «igual» va como insignia gris con el guion, no como la frase «Igual que…».',
    pieza: <Cambio valor={0.02} decimales={1} sufijo=" pp" enCelda frente="la medición anterior" />,
  },
  {
    opcion: 'ayuda',
    para: 'La nota al pasar el cursor o enfocar, en el globo del sistema (Hint).',
    pieza: <Cambio valor={-3} sufijo=" pts" frente="la medición anterior" ayuda="eNPS de la medición anterior: 41 puntos." />,
  },
]

function VariantesDeCambio() {
  return (
    <Demo title="Las opciones de Cambio" description="La misma insignia, con cuatro opciones que no cambian la fila de Selección.">
      <div className="flex flex-col divide-y">
        {VARIANTES_CAMBIO.map((variante) => (
          <div key={variante.opcion} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text as="span" size="sm" weight="medium">
                {variante.opcion}
              </Text>
              <Text as="span" size="sm" variant="muted">
                {variante.para}
              </Text>
            </div>
            <div className="shrink-0">{variante.pieza}</div>
          </div>
        ))}
      </div>
    </Demo>
  )
}

// El tablero real de Créditos de IA, con los datos de la maqueta.
function TableroDeEjemplo() {
  const historial = useHistorial()
  return (
    <TableroCreditos
      bolsa={bolsaDe(historial)}
      historial={historial}
      cargando={false}
      onReasignar={() => notify('Aquí se abre «Reasignar créditos»', 'En Créditos de IA abre el cajón para repartir la bolsa.', 'info')}
      onComprar={() => notify('Aquí se abre «Comprar créditos»', 'En Créditos de IA se elige un paquete y se paga con tarjeta.', 'info')}
    />
  )
}

Component.displayName = 'DesignSystemMetricasPage'
