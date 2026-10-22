import { useCallback, useEffect, useRef, useState } from 'react'
import { notify } from '@/shared/components/notify'
import { publishProcess, removeProcess, setProcessHistory } from '@/shared/components/process-store'
import { XLS_EXTENSION, XLS_MIME, fileStamp, saveBlob, slugify } from '../../../encuestas/modelo/descargas/libro'
import { imprimir } from '../../../encuestas/resultados/descargas/imprimir'
import { resultadosDelPedido, tipoReporte, type Descarga, type PedidoReporte } from '../../modelo/descargas/tipos'
import { libroDetalle, libroEstado } from '../../modelo/resultados/descarga'
import type { ResultadosCiclo } from '../../modelo/resultados/seguimiento'
import { ReporteProgreso, ReportesIndividuales } from './documentos'

// El centro de descargas de un ciclo, con el comportamiento del de Encuestas (21-oct): vive en la pantalla y no en el
// panel (cerrarlo no detiene un reporte a medio preparar), la preparación avanza a saltos desiguales y la entrega es
// real: al terminar se genera el archivo con las mismas cifras de la pantalla. Cada reporte sale también en el Centro de
// procesos del encabezado.

const TICK_MS = 220

export type CentroDescargasCiclo = {
  entradas: readonly Descarga[]
  preparando: number
  iniciar: (pedido: PedidoReporte) => void
  entregar: (id: string) => void
}

function entregaDe(r: ResultadosCiclo, pedido: PedidoReporte, archivo: string): () => boolean {
  const delPedido = resultadosDelPedido(r, pedido)
  const titulo = archivo.replace(/\.pdf$/, '')
  switch (pedido.tipo) {
    case 'detalle':
      return () => (saveBlob(archivo, XLS_MIME, libroDetalle(delPedido)), true)
    case 'estado':
      return () => (saveBlob(archivo, XLS_MIME, libroEstado(delPedido, pedido.corte)), true)
    case 'progreso':
      return () => imprimir(<ReporteProgreso r={delPedido} pedido={pedido} />, titulo)
    case 'individual':
      return () => imprimir(<ReportesIndividuales r={delPedido} pedido={pedido} />, titulo)
  }
}

function entregarSeguro(descarga: Descarga): boolean {
  try {
    return descarga.entregar()
  } catch (error) {
    console.error('No se pudo generar el reporte', descarga.archivo, error)
    return false
  }
}

export function useDescargasCiclo(r: ResultadosCiclo | null): CentroDescargasCiclo {
  const [entradas, setEntradas] = useState<readonly Descarga[]>([])
  const relojes = useRef(new Map<string, ReturnType<typeof setInterval>>())

  useEffect(() => {
    const activos = relojes.current
    return () => {
      activos.forEach((reloj) => clearInterval(reloj))
      activos.clear()
    }
  }, [])

  const cambiar = (id: string, cambio: Partial<Descarga>) => setEntradas((actuales) => actuales.map((entrada) => (entrada.id === id ? { ...entrada, ...cambio } : entrada)))

  const iniciar = useCallback(
    (pedido: PedidoReporte) => {
      if (!r) return
      const tipo = tipoReporte(pedido.tipo)
      const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const archivo = `${tipo.slug}-${slugify(r.ciclo.nombre)}-${fileStamp()}.${tipo.formato === 'PDF' ? 'pdf' : XLS_EXTENSION}`
      const descarga: Descarga = { id, tipo: pedido.tipo, archivo, estado: 'preparando', avance: 0, entregado: false, entregar: entregaDe(r, pedido, archivo), pedido }
      setEntradas((actuales) => [descarga, ...actuales])

      // El azar y la entrega van en el cuerpo del intervalo, no en la función que actualiza el estado: en modo estricto
      // React la corre dos veces y entregaría el archivo doble.
      const paso = (100 * TICK_MS) / tipo.prepararMs
      let avance = 0
      const reloj = setInterval(() => {
        avance = Math.min(100, avance + paso * (0.4 + Math.random() * 1.2))
        if (avance < 100) {
          cambiar(id, { avance })
          return
        }
        clearInterval(reloj)
        relojes.current.delete(id)
        const entregado = entregarSeguro(descarga)
        cambiar(id, { estado: 'lista', avance: 100, entregado })
        if (entregado) notify(tipo.formato === 'PDF' ? 'Reporte listo para guardar' : 'Reporte descargado', tipo.formato === 'PDF' ? 'Elige «Guardar como PDF» en el diálogo de impresión.' : archivo, 'success')
        else notify('No se pudo entregar el reporte', 'Vuelve a intentarlo desde Descargar › Descargas.', 'error')
      }, TICK_MS)
      relojes.current.set(id, reloj)
    },
    [r],
  )

  const entregar = useCallback(
    (id: string) => {
      const descarga = entradas.find((candidata) => candidata.id === id)
      if (!descarga) return
      const entregado = entregarSeguro(descarga)
      cambiar(id, { entregado })
      if (!entregado) notify('No se pudo entregar el reporte', 'Vuelve a intentarlo en unos minutos.', 'error')
    },
    [entradas],
  )

  return { entradas, preparando: entradas.filter((entrada) => entrada.estado === 'preparando').length, iniciar, entregar }
}

/** Cada reporte pedido sale también en el Centro de procesos del encabezado, como en Encuestas. */
export function useDescargasCicloEnProcesos(centro: CentroDescargasCiclo, nombreCiclo: string, onVer: () => void) {
  const { entradas, entregar } = centro
  useEffect(() => {
    for (const entrada of entradas) {
      const tipo = tipoReporte(entrada.tipo)
      const lista = entrada.estado === 'lista'
      publishProcess({
        id: `descarga-${entrada.id}`,
        title: `${tipo.titulo} · ${nombreCiclo}`,
        meta: lista ? (entrada.entregado ? `Listo · ${entrada.archivo}` : 'No se pudo entregar · vuelve a descargarlo') : 'Preparando el reporte',
        progress: lista ? undefined : Math.round(entrada.avance),
        done: lista,
        icon: tipo.icono,
        cta: lista ? 'Descargar' : 'Ver',
        onClick: lista ? () => entregar(entrada.id) : onVer,
      })
    }
  }, [entradas, entregar, nombreCiclo, onVer])

  useEffect(() => {
    setProcessHistory(onVer)
    return () => setProcessHistory(null)
  }, [onVer])
  const vigentes = useRef(entradas)
  vigentes.current = entradas
  useEffect(() => () => vigentes.current.filter((entrada) => entrada.estado === 'preparando').forEach((entrada) => removeProcess(`descarga-${entrada.id}`)), [])
}
