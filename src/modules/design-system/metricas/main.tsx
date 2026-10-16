import type { ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FrameTitle, Text, TrafficLight } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { Ayuda, Cambio, Cifra as CifraConCambio, Pie } from '@/modules/admin/seleccion/propuestas/components/cifras'
import { bolsaDe, useHistorial } from '@/modules/admin/seleccion/propuestas/creditos'
import { TableroCreditos } from '@/modules/admin/seleccion/creditos/uno/components/tablero'
import { ColumnaIndicador, FilaIndicadores } from '../graficos/fila-indicadores'
import { Demo, EncabezadoPatron, Reglas, SectionIntro, VerEnAccion, type Regla } from '../patrones/piezas'
import { Indicadores, TarjetaIndicador, type Cifra } from './cifras'
import { Anillo, BarraSegmentada, Dona, GraficoArea, Sparkline, Tendencia } from './graficos'

// Patrones › Métricas: las cifras y gráficos de los tableros. Hasta el 29-sep vivían en el Dashboard del Archivo y en el
// Inicio; se mudaron a design-system/metricas y aquí se documentan con las mismas piezas que usan las pantallas.
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

const REPARTO = [
  { area: 'Completadas', respuestas: 124, color: 'var(--primary)' },
  { area: 'En curso', respuestas: 58, color: 'var(--chart-2)' },
  { area: 'Sin empezar', respuestas: 31, color: 'var(--muted-foreground)' },
]

const SEGMENTOS = [
  { id: 'activas', etiqueta: 'Activas', valor: 820, color: 'var(--primary)' },
  { id: 'inactivas', etiqueta: 'Inactivas', valor: 180, color: 'var(--chart-2)' },
  { id: 'libres', etiqueta: 'Libres', valor: 248, color: 'var(--muted)' },
]

const SERIE = [42, 45, 44, 48, 51, 50, 55, 58]

const REGLAS: Regla[] = [
  { titulo: 'Las cifras van en una sola tarjeta', detalle: 'Una tarjeta partida con divisores (acuerdo del 14-sep), no tarjetas sueltas por cifra.' },
  { titulo: 'La cifra en seminegrita del tema', detalle: 'Text xl seminegrita; el nombre arriba en gris y el detalle debajo en gris pequeño.' },
  { titulo: 'La comparación, junto a la cifra', detalle: 'Cambio (6-oct, vuelve con la forma de Nicolás): la insignia verde si mejoró, roja si empeoró —con menosEsMejor cuando bajar es bueno— e «Igual que…» si no se movió. Debajo, la línea gris dice contra qué se compara («Frente a 364 el mes pasado»).' },
  { titulo: 'Una sola insignia de comparación', detalle: 'Cambio es la de todo el producto, también en tablas: decimales para los puntos porcentuales («+2,3 pp»), sinColor cuando subir no es bueno ni malo, enCelda para el «0 pp» gris de una celda y ayuda para la nota en el globo. Si le falta algo, se amplía; no se arma otra Variacion.' },
  { titulo: 'La ayuda abre con clic', detalle: 'La «i» junto al nombre de la cifra es BotonAyuda, la ayuda única del sistema: abre al lado el globo oscuro con qué mide. Con clic, con teclado y en pantalla táctil, no solo al pasar el cursor.' },
  { titulo: 'Lo que necesita tu atención, lo primero', detalle: 'El tablero va arriba de la pantalla, con una columna por grupo (Críticas, Necesitan atención, Acción manual, Sugerencias de la IA). Entra recogido con lo más urgente de cada una; «Expandir» muestra más. Cada asunto se resuelve en su panel y lo resuelto sale del tablero.' },
  { titulo: 'Colores solo del tema', detalle: 'Los gráficos se pintan con var(--primary), var(--chart-N) y los grises del tema; nunca colores escritos a mano.' },
  { titulo: 'Leyenda con TrafficLight', detalle: 'Las donas y barras llevan su leyenda con TrafficLight debajo, no una lista armada a mano.' },
]

export function Component() {
  return (
    <div className="flex flex-col gap-10">
      <EncabezadoPatron titulo="Métricas" acciones={<VerEnAccion pagina="metricas" />}>
        Las cifras y gráficos de los tableros: la fila de cifras del Inicio, la fila con comparación y ayuda de Selección,
        el tablero «Lo que necesita tu atención», la tarjeta con minigráfico y los gráficos de área, dona, anillo y barra.
        Son las mismas piezas que usan el Inicio del admin, Tareas, Avisos internos, Selección, Créditos de IA y Home
        operativo.
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
          description="El tablero de Nicolás, el mismo de Créditos de IA y del inicio de Vacantes: una columna por grupo, recogido con lo más urgente y «Expandir» para ver más. Abre un asunto para ver su panel."
        />
        <TableroDeEjemplo />
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Tarjeta con minigráfico" description="La cifra con su tendencia, para un tablero de tarjetas." />
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaIndicador
            titulo="Satisfacción del equipo"
            detalle="Encuesta de pulso"
            valor="4,3 / 5"
            comparacion="3 décimas más que la encuesta anterior"
            serie={SERIE}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIntro title="Gráficos" description="Recharts pintado con los colores del tema. Cada uno con los datos de un tablero real." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Área" description="Series en el tiempo, con su leyenda y el detalle al pasar el cursor.">
            <GraficoArea datos={MESES} eje="mes" alto={220} series={SERIES} />
            <TrafficLight
              className="justify-center"
              data={{ label: 'Septiembre', items: SERIES.map((serie) => ({ label: serie.nombre, value: String(MESES[MESES.length - 1][serie.clave]), color: serie.color })) }}
            />
          </Demo>
          <Demo title="Dona" description="Partes de un todo, con el total en el centro y su leyenda.">
            <Dona datos={REPARTO} total="58 %" alto={170} />
            <TrafficLight
              className="justify-center"
              data={{
                label: 'Estado de las evaluaciones',
                items: REPARTO.map((parte) => ({ label: parte.area, value: String(parte.respuestas), color: parte.color })),
              }}
            />
          </Demo>
          <Demo title="Tendencia y minigráfico" description="La tendencia va junto a una cifra; el minigráfico, dentro de una tarjeta chica.">
            <div className="grid grid-cols-2 gap-6">
              <div className="h-16">
                <Tendencia datos={SERIE} color="var(--primary)" />
              </div>
              <div className="h-16">
                <Sparkline datos={SERIE} />
              </div>
            </div>
          </Demo>
          <Demo title="Anillo y barra segmentada" description="Avance de una sola cifra, y el reparto de un total en una barra.">
            <div className="flex flex-col gap-4">
              <Anillo valor={68} color="var(--primary)" />
              <BarraSegmentada segmentos={SEGMENTOS} />
            </div>
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
        />
        <ColumnaIndicador
          titulo="Libres para postular"
          ayuda={<Ayuda titulo="Libres para postular">Personas que nunca han estado en un proceso: las puedes postular a una vacante. Se compara con las que había hace un mes.</Ayuda>}
          cifra={<CifraConCambio valor="330" cambio={<Cambio valor={0} sufijo="" frente="el mes pasado" />} />}
          pie={<Pie frente="Igual que el mes pasado" significa="Nunca han pasado por un proceso" />}
        />
      </FilaIndicadores>
    </Frame>
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
