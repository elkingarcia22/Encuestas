import { Text } from '@ubits/flux-ui'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { AnilloSegmentado, Tendencia } from '@/modules/design-system/templates/dashboard/components/graficos'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'

// Las métricas de arriba de una pantalla, con el lenguaje del Inicio del admin: etiqueta con su «qué mide esto»,
// la cifra y la figura al lado. (La insignia de variación se retiró el 5-oct, decisión 11 de la auditoría: si el
// cambio importa, se dice con palabras en el detalle.)
//
// Esto **no es una sección aparte**: es la misma fila de indicadores del home de Vacantes y del pulso de Encuestas
// (`FilaIndicadores`), solo que servida por datos en vez de por composición. El marco, las columnas, los divisores y
// el comportamiento por ancho salen de allá, así que lo que se decida sobre esa fila llega solo. Aquí vive únicamente
// la comodidad: pasar una lista y que se arme sola, con su botón de ayuda y su figura ya cableados.
//
// La tendencia no es adorno: una cifra sola no dice si va bien. «44 % de participación» se lee distinto si viene
// subiendo que si viene cayendo, y eso es lo que aporta la línea.
//
// Cada métrica lleva una sola figura, nunca dos, y **siempre en la esquina derecha**: la **línea** cuando lo que
// importa es a dónde va en el tiempo, el **anillo por segmentos** (ReUI chart-8) cuando lo que importa es qué parte de
// un todo ocupa, o el **anillo de avance** cuando la cifra ya es un porcentaje y lo que se quiere ver es cuánto falta
// para el 100 %. Un número que es una porción —«18 publicados de 26»— se entiende mejor con el anillo que con una
// línea que sube y baja.

export type Metrica = {
  id: string
  titulo: string
  valor: string
  /** Qué mide, en una frase. Sale en el globo del botón de información. */
  ayuda: string
  /** Debajo de la cifra: sobre qué se calcula. */
  detalle?: string
  /** La serie de la línea. Sin ella, la métrica se pinta sin tendencia. */
  serie?: number[]
  /** 0–100: qué parte del todo ocupa. Pinta el anillo por segmentos a la izquierda de la cifra, en vez de la línea. */
  anillo?: number
  /**
   * 0–100: cuánto se alcanzó de lo posible. Pinta a la derecha el mismo anillo que «Días abiertas en promedio» del
   * home de Vacantes —el círculo entero es el 100 % y el relleno es lo logrado—, en el lugar donde iría la línea.
   */
  avance?: number
  /** El color del anillo. Por defecto, el primario del tema. */
  color?: string
  /** Si la cifra tiene detalle (las personas detrás de ella), tocar la columna lo abre. */
  onVer?: () => void
  etiquetaVer?: string
}

/**
 * La figura de la esquina. **Siempre va a la derecha**, como en el home de Vacantes y en el pulso de Encuestas: antes
 * el anillo por segmentos se pintaba pegado al número, a la izquierda, y en una misma fila unas lecturas tenían la
 * figura a un lado y otras al otro. Si hay varias, manda el anillo de avance.
 */
function figura(metrica: Metrica) {
  if (metrica.avance != null) {
    return (
      <AnilloAvance
        valor={metrica.avance}
        color={metrica.color ?? 'var(--primary)'}
        etiqueta={metrica.titulo}
        // Sin globo: aquí decía el título y la cifra, que están escritos a su izquierda en la misma columna. Los tres
        // anillos segmentados de al lado nunca lo tuvieron, y la sparkline del Inicio tampoco (Dave, 1-oct).
        globo={false}
        tamano={44}
      />
    )
  }
  if (metrica.anillo != null) {
    return <AnilloSegmentado valor={metrica.anillo} color={metrica.color ?? 'var(--primary)'} tamano={44} />
  }
  if (metrica.serie) {
    return (
      <div className="h-9 w-24">
        <Tendencia datos={metrica.serie} color="var(--primary)" />
      </div>
    )
  }
  return undefined
}

export function MetricasDestacadas({ metricas, etiqueta }: { metricas: Metrica[]; etiqueta: string }) {
  return (
    <FilaIndicadores etiqueta={etiqueta} columnas={metricas.length}>
      {metricas.map((metrica) => (
        <ColumnaIndicador
          key={metrica.id}
          titulo={metrica.titulo}
          ayuda={<BotonAyuda etiqueta={`Qué mide «${metrica.titulo}»`}>{metrica.ayuda}</BotonAyuda>}
          cifra={
            <Text as="span" size="xl" weight="semibold">
              {metrica.valor}
            </Text>
          }
          grafico={figura(metrica)}
          pie={metrica.detalle ? <DetalleIndicador>{metrica.detalle}</DetalleIndicador> : undefined}
          onVer={metrica.onVer}
          etiquetaVer={metrica.etiquetaVer}
        />
      ))}
    </FilaIndicadores>
  )
}
