import type { ReactNode } from 'react'
import { Text } from '@ubits/flux-ui'
import { BarrasMini, DonaReparto } from '@/modules/design-system/graficos/piezas'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { QueMide } from '../../components/que-mide'

// El resumen de arriba de cada pestaña de Resultados, con la estructura de las métricas del home (Inicio operativo y
// Pulso de encuestas): tres columnas con divisores y, en cada una, el nombre, la cifra, el gráfico pequeño a la derecha
// y el detalle en una línea gris. Sin filtros adentro: filtrar es cosa de la tabla. Y sin insignia de cambio ni curva de
// mediciones: el resumen habla solo de esta encuesta; compararla con otras es cosa del Comparativo.
// - La cifra de la pestaña, con su gráfico (anillo o medidor) sobre esta misma medición.
// - El reparto: el total con su dona (o el gráfico que pida la pestaña) y, en el detalle, cuánto hay de cada tramo.
// - El primero del top 3: su cifra y su nombre; las barras lo comparan con los dos siguientes (el nombre al pasar el cursor).

export type Anillo = {
  id: string
  etiqueta: string
  porcentaje: number
  color: string
  cantidad: string
}

type Props = {
  titulo: string
  ayuda: ReactNode
  cifra: string
  /** La lectura de la cifra («Neutral», «Riesgo alto»): abre la línea del detalle. */
  lectura?: string
  pie: string
  tituloAnillos: string
  /** El total del reparto, con el número primero: «232 en total», «10 preguntas». */
  totalAnillos: string
  /** Los tramos del reparto. Si no suman el 100 %, lo que falta va en gris con `restoAnillos` de nombre. */
  anillos: readonly Anillo[]
  restoAnillos?: string
  /** Reemplaza la dona cuando el dato no es un reparto (el avance de respuestas en Preguntas). */
  graficoReparto?: ReactNode
  /** El detalle del reparto, si no es la lista de tramos. */
  pieAnillos?: string
  /** En singular, porque la cifra es la del primero: «Sección más desfavorable». Sin título no hay tercera columna:
   *  en una encuesta sin datos demográficos no hay grupos que ordenar, y un «—» fijo diría que faltan datos. */
  tituloTop?: string
  top?: readonly { id: string; etiqueta: string; valor: number; texto: string }[]
  /** El texto cuando el top viene vacío. */
  sinTop?: string
  /** El detalle bajo el primero del top; por defecto, su nombre. */
  pieTop?: string
  /** El gráfico de la cifra, a la derecha: cuánto es del total (anillo) o dónde cae en su escala (medidor del eNPS). */
  grafico?: ReactNode
}

const PORCENTAJE_COMPLETO = 99

/** La línea gris del indicador (la de `DetalleIndicador`), que si no cabe se lee completa al pasar el cursor. */
function Detalle({ texto }: { texto: string }) {
  return (
    <TextoCompleto texto={texto}>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {texto}
      </Text>
    </TextoCompleto>
  )
}

/** El total del reparto: el número con la tipografía de cifra y el resto en gris. */
function Total({ texto }: { texto: string }) {
  const espacio = texto.indexOf(' ')
  const cifra = espacio === -1 ? texto : texto.slice(0, espacio)
  const resto = espacio === -1 ? '' : texto.slice(espacio + 1)
  return (
    <div className="flex items-baseline gap-1.5">
      <Text as="span" size="xl" weight="semibold" className="tabular-nums">
        {cifra}
      </Text>
      {resto ? (
        <Text as="span" size="sm" variant="muted">
          {resto}
        </Text>
      ) : null}
    </div>
  )
}

export function TarjetaResumen({
  titulo,
  ayuda,
  cifra,
  lectura,
  pie,
  tituloAnillos,
  totalAnillos,
  anillos,
  restoAnillos,
  graficoReparto,
  pieAnillos,
  tituloTop,
  top = [],
  sinTop = 'Sin datos todavía',
  pieTop,
  grafico,
}: Props) {
  const suma = anillos.reduce((total, anillo) => total + anillo.porcentaje, 0)
  const segmentos = [
    ...anillos.map((anillo) => ({ id: anillo.id, etiqueta: anillo.etiqueta, valor: anillo.porcentaje, color: anillo.color, texto: anillo.cantidad })),
    ...(restoAnillos && suma < PORCENTAJE_COMPLETO ? [{ id: 'resto', etiqueta: restoAnillos, valor: 100 - suma, color: 'var(--muted)' }] : []),
  ]
  const primero = top.at(0)

  return (
    <FilaIndicadores etiqueta={`Resumen: ${titulo.toLowerCase()}`} columnas={tituloTop ? 3 : 2}>
      <ColumnaIndicador
        titulo={titulo}
        ayuda={<QueMide etiqueta={titulo.toLowerCase()} texto={ayuda} />}
        cifra={cifra}
        grafico={grafico}
        pie={<Detalle texto={[lectura, pie].filter(Boolean).join(' · ')} />}
      />
      <ColumnaIndicador
        titulo={tituloAnillos}
        cifra={<Total texto={totalAnillos} />}
        grafico={graficoReparto ?? <DonaReparto segmentos={segmentos} etiqueta={tituloAnillos} tamano={48} />}
        pie={<Detalle texto={pieAnillos ?? anillos.filter((anillo) => anillo.cantidad !== '0').map((anillo) => `${anillo.cantidad} ${anillo.etiqueta.toLowerCase()}`).join(' · ')} />}
      />
      {tituloTop ? (
      <ColumnaIndicador
        titulo={tituloTop}
        cifra={primero ? primero.texto : '—'}
        grafico={
          top.length > 1 ? (
            <div className="h-9 w-24 xl:w-28">
              <BarrasMini barras={top.map((fila) => ({ id: fila.id, nombre: fila.etiqueta, valor: fila.valor }))} etiqueta={tituloTop} color="var(--primary)" formato={(valor) => top.find((fila) => fila.valor === valor)?.texto ?? String(valor)} />
            </div>
          ) : undefined
        }
        pie={<Detalle texto={primero ? (pieTop ?? primero.etiqueta) : sinTop} />}
      />
      ) : null}
    </FilaIndicadores>
  )
}
