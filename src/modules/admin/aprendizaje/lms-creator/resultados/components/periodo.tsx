import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { RangoDeFechas, type Rango } from '@/modules/design-system/formularios/rango-de-fechas'

// Desde cuándo se está mirando.
//
// Sin esto la pantalla decía «22 personas» sin decir nunca «22 desde cuándo», y las cifras de un contenido de hace dos
// años no se parecen en nada a las de este mes (Cristian Niño, 14-oct).
//
// **Un solo control: el rango de fechas, con el último mes ya puesto dentro.** Es lo que hace producción, y es lo que
// quedó después de probar la otra forma —un selector de atajos («Últimos 30 días», «Último año»…) con el rango a mano
// escondido detrás de «Personalizado»—: dos controles para una sola pregunta, y el de atajos tapaba al que de verdad
// responde «¿cómo le fue la semana del lanzamiento?» (Dave, 15-oct).

/** Cuántos días trae puesto al entrar: la pregunta que se trae quien abre Resultados. */
const DIAS_POR_DEFECTO = 30

/**
 * **Hasta un año atrás, y nada del futuro.**
 *
 * Más de un año no se puede pedir: ni el informe tendría sentido ni el sistema lo serviría en un tiempo razonable. Y
 * una fecha futura no existe todavía, así que ofrecerla solo sirve para que alguien se pregunte por qué sale vacío
 * (Dave, 15-oct).
 */
const DIAS_ATRAS_MAXIMO = 365

/** Cuánto tarda el análisis: de dos segundos a quince, según lo largo que sea el periodo. */
const SEGUNDOS_MINIMO = 2
const SEGUNDOS_MAXIMO = 15

const milisegundosDeAnalisis = (dias: number) => {
  const proporcion = Math.min(1, Math.max(0, dias / DIAS_ATRAS_MAXIMO))
  return Math.round((SEGUNDOS_MINIMO + proporcion * (SEGUNDOS_MAXIMO - SEGUNDOS_MINIMO)) * 1000)
}

// El día de hoy de verdad, no el `HOY` fijo del design system: los datos de este contenido se generan contando días
// hacia atrás desde la fecha del sistema, así que con el otro el filtro y los datos hablarían de semanas distintas.
const aIso = (dia: Date) => {
  const copia = new Date(dia)
  copia.setHours(12, 0, 0, 0)
  return `${copia.getFullYear()}-${String(copia.getMonth() + 1).padStart(2, '0')}-${String(copia.getDate()).padStart(2, '0')}`
}

const deIso = (iso: string) => new Date(`${iso}T12:00:00`)

const DIA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })

export type Periodo = {
  rango: Rango
  /** Mientras se relee el periodo recién elegido. La pantalla se tapa y no se puede tocar. */
  analizando: boolean
  setRango: (rango: Rango) => void
  /** Si una fecha entra en el periodo. Lo que no tiene fecha se queda: no es «de fuera», es que no la tiene. */
  dentro: (iso?: string | null) => boolean
  /** «Del 16 sept 2026 al 15 oct 2026»: para el nombre de los archivos y la cabecera de sus hojas. */
  etiqueta: string
  /** Si de verdad recorta algo. Con un rango a medias la pantalla enseña todo lo que vaya desde ese día. */
  activo: boolean
}

/**
 * El periodo elegido, guardado en la dirección (`?desde=2026-10-01&hasta=2026-10-14`), para que un enlace a «la semana
 * del lanzamiento» se pegue en un chat y abra exactamente eso.
 *
 * Los dos parámetros se escriben **en una sola llamada**. Antes iban en dos seguidas y la segunda pisaba a la primera
 * —leía la dirección antes de que la primera se aplicara—, así que al elegir el primer día del rango se guardaba
 * `hasta` y se perdía `desde`: el campo se quedaba en «Elige desde y hasta» y no filtraba nada (Dave, 15-oct).
 */
export function usePeriodo(): Periodo {
  const [parametros, setParametros] = useSearchParams()
  const desde = parametros.get('desde') ?? ''
  const hasta = parametros.get('hasta') ?? ''

  /**
   * **Cada cambio de fechas se relee, y se ve que se está releyendo.**
   *
   * En el producto, cambiar el periodo es volver a pedir todo a la base; aquí el dato ya está en memoria y el cambio
   * sería instantáneo, y entonces la maqueta prometería algo que el sistema real no puede dar. Tarda lo que tardaría:
   * de dos segundos a quince, según lo largo que sea el periodo (Dave, 15-oct).
   *
   * Solo con el rango completo: entre el primer y el segundo clic del calendario no hay nada que releer todavía.
   */
  const [analizando, setAnalizando] = useState(false)
  const primera = useRef(true)
  const espera = desde && hasta ? milisegundosDeAnalisis(Math.round((deIso(hasta).getTime() - deIso(desde).getTime()) / 86_400_000) + 1) : 0

  useEffect(() => {
    // Al entrar no se analiza nada: el periodo por defecto llega con la pantalla.
    if (primera.current) {
      primera.current = false
      return
    }
    if (espera === 0) return
    setAnalizando(true)
    const reloj = window.setTimeout(() => setAnalizando(false), espera)
    return () => window.clearTimeout(reloj)
  }, [desde, hasta, espera])

  const setRango = useCallback(
    (nuevo: Rango) => {
      setParametros(
        (previos) => {
          const copia = new URLSearchParams(previos)
          if (nuevo?.from) copia.set('desde', aIso(nuevo.from))
          else copia.delete('desde')
          if (nuevo?.to) copia.set('hasta', aIso(nuevo.to))
          else copia.delete('hasta')
          return copia
        },
        // Reemplaza la entrada del historial: si no, salir de la pantalla pediría tantos «atrás» como días se hubieran
        // probado en el calendario.
        { replace: true },
      )
    },
    [setParametros],
  )

  // Las dependencias son textos, no fechas ya armadas: un objeto nuevo en cada pintado haría recalcular la pantalla
  // entera —y `useResultados` cuelga de esto— aunque las fechas fueran las mismas.
  return useMemo(() => {
    // Sin nada en la dirección, el último mes, y **se ve puesto en el campo**: así se sabe desde cuándo se está
    // mirando sin tener que abrir el calendario.
    if (!desde && !hasta) {
      const fin = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - (DIAS_POR_DEFECTO - 1))
      const limiteBajo = aIso(inicio)
      const limiteAlto = aIso(fin)
      return {
        rango: { from: deIso(limiteBajo), to: deIso(limiteAlto) },
        setRango,
        analizando,
        activo: true,
        etiqueta: `Del ${DIA.format(deIso(limiteBajo))} al ${DIA.format(deIso(limiteAlto))}`,
        dentro: (iso?: string | null) => (iso ? iso.slice(0, 10) >= limiteBajo && iso.slice(0, 10) <= limiteAlto : true),
      }
    }

    // A medio elegir —solo el primer día— se enseña de ese día en adelante, no se vacía la pantalla.
    if (desde && !hasta) {
      return {
        rango: { from: deIso(desde), to: undefined },
        setRango,
        analizando,
        activo: true,
        etiqueta: `Desde el ${DIA.format(deIso(desde))}`,
        dentro: (iso?: string | null) => (iso ? iso.slice(0, 10) >= desde : true),
      }
    }

    const limiteBajo = desde || hasta
    const limiteAlto = hasta || desde
    return {
      rango: { from: deIso(limiteBajo), to: deIso(limiteAlto) },
      setRango,
      analizando,
      activo: true,
      etiqueta: `Del ${DIA.format(deIso(limiteBajo))} al ${DIA.format(deIso(limiteAlto))}`,
      dentro: (iso?: string | null) => (iso ? iso.slice(0, 10) >= limiteBajo && iso.slice(0, 10) <= limiteAlto : true),
    }
  }, [desde, hasta, setRango, analizando])
}

/**
 * El periodo: **su propia fila, encima de las pestañas y a la derecha.**
 *
 * Manda sobre la pantalla entera, así que no puede vivir dentro del contenido de una pestaña —ahí parece el filtro de
 * la pestaña abierta—, ni en la fila de acciones del contenido —ahí parece una acción sobre el contenido, y no lo es—.
 * Encima de las pestañas es el único sitio que dice las dos cosas: está por encima de todo y no es de nadie en
 * particular (Dave, 15-oct).
 *
 * Es `RangoDeFechas`, la pieza del design system que ya usan el filtro de Tareas y los formularios de planes y
 * objetivos. Al ser una fila de campos mide lo que tiene que medir, sin tocar nada de nadie.
 */
export function FiltroPeriodo({ periodo }: { periodo: Periodo }) {
  // Un año atrás como suelo y hoy como techo: el calendario los apaga y ni siquiera se pueden intentar.
  const { suelo, hoy } = useMemo(() => {
    const tope = new Date()
    tope.setHours(12, 0, 0, 0)
    const inicio = new Date(tope)
    inicio.setDate(inicio.getDate() - (DIAS_ATRAS_MAXIMO - 1))
    return { suelo: inicio, hoy: tope }
  }, [])

  return (
    // 230 px: lo que ocupa «16 sept 2026 – 15 oct 2026» con su icono, sin dejar medio campo vacío a la derecha.
    <div className="w-[230px]">
      <RangoDeFechas
        valor={periodo.rango}
        onCambio={periodo.setRango}
        placeholder="Elige desde y hasta"
        desde={suelo}
        deshabilitar={(fecha) => fecha > hoy}
      />
    </div>
  )
}
