import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Text } from '@ubits/flux-ui'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { BarrasMini, DonaReparto } from '@/modules/design-system/graficos/piezas'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Las piezas que comparten las pestañas de Resultados, para que todas se lean igual.
//
// El resumen se compone con `FilaIndicadores` y `ColumnaIndicador` del design system, que es lo que hacen las demás
// pantallas del admin con sus cifras —Selección, Objetivos, el comparativo de Encuestas—: cada una monta sus columnas
// encima de la misma fila. Resultados de encuestas tiene su propia composición (`TarjetaResumen`) con sus tres
// lecturas fijas; **esta es la nuestra**, con las de un contenido. Lo compartido es la fila, no la composición
// (Dave, 14-oct).

export type TramoReparto = { id: string; etiqueta: string; porcentaje: number; color: string; cantidad: string }

/** La línea gris de una lectura, que si no cabe se lee entera al pasar el cursor. */
function Detalle({ texto }: { texto: string }) {
  return (
    <TextoCompleto texto={texto}>
      <Text as="span" variant="muted" size="xs" className="truncate">
        {texto}
      </Text>
    </TextoCompleto>
  )
}

/** El total de un reparto: el número con la tipografía de cifra y lo que lo acompaña en gris. */
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

/**
 * El encabezado de una pestaña: tres lecturas en una fila, con divisores.
 *
 * 1. **La cifra de la pestaña**, con su gráfico a la derecha y una línea de detalle.
 * 2. **El reparto**: en qué se divide el total, con su dona.
 * 3. **La tercera**, que cambia según la pestaña: la satisfacción, los intentos por persona o un top 3. Con `tercera`
 *    en `null` la fila se queda en dos columnas, para lo que un contenido no tiene (una encuesta que no existe).
 */
export function ResumenPestana({
  titulo,
  ayuda,
  cifra,
  pie,
  grafico,
  tituloReparto,
  totalReparto,
  reparto,
  pieReparto,
  tituloTop,
  top,
  pieTop,
  sinTop = 'Sin datos todavía',
  tercera,
}: {
  titulo: string
  ayuda: ReactNode
  cifra: ReactNode
  pie: string
  grafico?: ReactNode
  tituloReparto: string
  totalReparto: string
  reparto: readonly TramoReparto[]
  pieReparto?: string
  /** El top 3, la tercera lectura por defecto. No hace falta cuando se pasa `tercera`. */
  tituloTop?: string
  top?: readonly { id: string; etiqueta: string; valor: number; texto: string }[]
  pieTop?: string
  sinTop?: string
  /** Sustituye la tercera lectura; con `null`, el resumen se queda en dos columnas. */
  tercera?: ReactNode | null
}) {
  const conTercera = tercera !== null
  const primero = top?.at(0)
  const segmentos = reparto.map((tramo) => ({ id: tramo.id, etiqueta: tramo.etiqueta, valor: tramo.porcentaje, color: tramo.color, texto: tramo.cantidad }))

  return (
    <FilaIndicadores etiqueta={`Resumen: ${titulo.toLowerCase()}`} columnas={conTercera ? 3 : 2}>
      <ColumnaIndicador
        titulo={titulo}
        ayuda={<BotonAyuda etiqueta={`Qué mide ${titulo.toLowerCase()}`}>{ayuda}</BotonAyuda>}
        cifra={cifra}
        grafico={grafico}
        pie={<Detalle texto={pie} />}
      />
      <ColumnaIndicador
        titulo={tituloReparto}
        cifra={<Total texto={totalReparto} />}
        grafico={<DonaReparto segmentos={segmentos} etiqueta={tituloReparto} tamano={48} />}
        pie={<Detalle texto={pieReparto ?? reparto.filter((tramo) => tramo.cantidad !== '0').map((tramo) => `${tramo.cantidad} ${tramo.etiqueta.toLowerCase()}`).join(' · ')} />}
      />
      {tercera ??
        (conTercera && tituloTop ? (
          <ColumnaIndicador
            titulo={tituloTop}
            cifra={primero ? primero.texto : '—'}
            grafico={
              top && top.length > 1 ? (
                <div className="h-9 w-24 xl:w-28">
                  <BarrasMini
                    barras={top.map((fila) => ({ id: fila.id, nombre: fila.etiqueta, valor: fila.valor }))}
                    etiqueta={tituloTop}
                    color="var(--primary)"
                    formato={(valor) => top.find((fila) => fila.valor === valor)?.texto ?? String(valor)}
                  />
                </div>
              ) : undefined
            }
            pie={<Detalle texto={primero ? (pieTop ?? primero.etiqueta) : sinTop} />}
          />
        ) : null)}
    </FilaIndicadores>
  )
}

/**
 * Ordena las filas por lo que pide el encabezado de la tabla: `'campo'` o `'-campo'` para descendente.
 *
 * Se ordena **sobre el total y antes de paginar**: ordenar la página que ya se recortó solo reacomoda esas diez filas
 * y deja la flecha mintiendo. `numeric` hace que «100» vaya después de «45» y no antes, y las fechas en ISO ya se
 * comparan solas en el orden correcto.
 */
export function ordenarFilas<T extends Record<string, unknown>>(filas: readonly T[], orden: string | undefined): T[] {
  if (!orden) return [...filas]
  const descendente = orden.startsWith('-')
  const campo = descendente ? orden.slice(1) : orden
  return [...filas].sort((a, b) => {
    const uno = a[campo]
    const otro = b[campo]
    // Los nulos al final en los dos sentidos: «No ha finalizado» no es una fecha temprana, es la ausencia de fecha.
    if (uno == null && otro == null) return 0
    if (uno == null) return 1
    if (otro == null) return -1
    const comparacion =
      typeof uno === 'number' && typeof otro === 'number' ? uno - otro : String(uno).localeCompare(String(otro), 'es', { numeric: true })
    return descendente ? -comparacion : comparacion
  })
}

// ── Los estados que se repiten en varias pestañas ────────────────────────────────────────────────────────────────

export type EstadoPersona = 'Completado' | 'En progreso' | 'Sin empezar'

/** Los colores de estado del design system: hecho en verde, en curso en amarillo, lo que no arrancó en rojo. */
export const ESTADO_PERSONA: Record<EstadoPersona, 'success-light' | 'warning-light' | 'destructive-outline'> = {
  Completado: 'success-light',
  'En progreso': 'warning-light',
  'Sin empezar': 'destructive-outline',
}

export const estadoDePersona = (avance: number): EstadoPersona => (avance >= 100 ? 'Completado' : avance > 0 ? 'En progreso' : 'Sin empezar')

export type EstadoEvaluacion = 'Aprobado' | 'Reprobado' | 'Pendiente'

export const ESTADO_EVALUACION: Record<EstadoEvaluacion, 'success-light' | 'destructive-light' | 'secondary'> = {
  Aprobado: 'success-light',
  Reprobado: 'destructive-light',
  Pendiente: 'secondary',
}

// ── La dirección como estado de la pantalla ──────────────────────────────────────────────────────────────────────

/**
 * Un trozo del estado de la pantalla guardado en la dirección.
 *
 * Todo lo que se ve —la pestaña abierta, el panel, de quién es el detalle— vive en la URL, para que cualquier cosa
 * que haya en pantalla se pueda **pasar por un enlace**: es un playground de diseño, y enseñar algo aquí es mandar una
 * dirección (Dave, 13-oct).
 *
 * Reemplaza la entrada del historial en vez de apilar una nueva: si no, salir de la pantalla pediría tantos «atrás»
 * como pestañas se hubieran mirado.
 */
export function useParametroUrl(nombre: string, porDefecto = ''): [string, (valor: string) => void] {
  const [parametros, setParametros] = useSearchParams()
  const valor = parametros.get(nombre) ?? porDefecto

  const poner = useCallback(
    (siguiente: string) => {
      setParametros(
        (previos) => {
          const copia = new URLSearchParams(previos)
          // Un parámetro vacío no se escribe: una dirección con `?persona=` colgando no dice nada y se comparte peor.
          if (!siguiente || siguiente === porDefecto) copia.delete(nombre)
          else copia.set(nombre, siguiente)
          return copia
        },
        { replace: true },
      )
    },
    [nombre, porDefecto, setParametros],
  )

  return [valor, poner]
}

/**
 * Deja la pantalla arriba del todo al entrar.
 *
 * El marco conserva el desplazamiento entre pantallas, así que abrir el último contenido de una lista larga dejaba
 * Resultados empezada por la mitad, sin título ni pestañas a la vista (Dave, 13-oct). Sube el primer contenedor con
 * desplazamiento que encuentre por encima, que es el del marco.
 */
export function useVolverArriba(clave: string) {
  const ancla = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    // Sube **todos** los contenedores de encima que estén desplazados, no solo el primero: el marco tiene varios
    // anidados y el que guarda la posición no siempre es el mismo.
    const subir = () => {
      for (let nodo = ancla.current?.parentElement; nodo; nodo = nodo.parentElement) {
        if (nodo.scrollTop > 0) nodo.scrollTop = 0
      }
      window.scrollTo(0, 0)
    }
    subir()
    // Y otra vez en el siguiente fotograma: la primera vez corre antes de que la tabla ocupe su alto, y el navegador
    // restauraba la posición justo después.
    const fotograma = requestAnimationFrame(subir)
    return () => cancelAnimationFrame(fotograma)
  }, [clave])

  return ancla
}
