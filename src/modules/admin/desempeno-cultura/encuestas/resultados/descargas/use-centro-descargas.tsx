import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { notify } from '@/shared/components/notify'
import { publishProcess, removeProcess, setProcessHistory } from '@/shared/components/process-store'
import { XLS_EXTENSION, XLS_MIME, fileStamp, saveBlob, slugify } from '../../modelo/descargas/libro'
import { buildNom035CasesWorkbook, buildNom035RiskWorkbook } from '../../modelo/descargas/libros-nom035'
import { buildAnswersWorkbook, buildQuestionsWorkbook } from '../../modelo/descargas/libros-respuestas'
import { buildCommentsWorkbook, buildResultsWorkbook } from '../../modelo/descargas/libros-resultados'
import { reportTypeFor, type DownloadEntry, type ReportRequest } from '../../modelo/descargas/tipos'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { fallaEnQA } from '../../modelo/surveyCasos'
import type { SurveyResults } from '../../modelo/surveyResults'
import { imprimir } from './imprimir'
import { ReporteGeneral } from './reporte-general'
import { CartasCanalizacion, ReporteRiesgo, ReportesIndividuales } from './reportes-nom035'

// El centro de descargas vive en la pantalla y no en el panel: cerrar el panel no mata un reporte a
// medio preparar. La preparación se simula con un avance (el playground no tiene servidor), pero la
// entrega es real: al terminar se genera el archivo con los mismos datos que dibuja la pantalla.
// Pedir un reporte ya es pedir la descarga, así que la fila que queda en «Descargas» es un recibo.

// Avance en saltos desiguales a propósito: uno perfectamente lineal se lee falso.
const TICK_MS = 220

export type CentroDescargas = {
  entradas: readonly DownloadEntry[]
  preparando: number
  iniciar: (pedido: ReportRequest) => void
  /** Vuelve a entregar un archivo listo (el reintento si el navegador no lo dejó salir). */
  entregar: (id: string) => void
}

function entregaDe(borrador: SurveyDraft, resultados: SurveyResults, pedido: ReportRequest, nombre: string): () => boolean {
  const libro = (contenido: () => string) => () => {
    saveBlob(nombre, XLS_MIME, contenido())
    return true
  }
  // El título del marco es el nombre que propone el «Guardar como PDF».
  const titulo = nombre.replace(/\.pdf$/, '')
  switch (pedido.kind) {
    case 'pdf':
      return () => imprimir(<ReporteGeneral borrador={borrador} resultados={resultados} pedido={pedido} />, titulo)
    case 'xlsx':
      return libro(() => buildResultsWorkbook(borrador, resultados, pedido))
    case 'comments':
      return libro(() => buildCommentsWorkbook(borrador, resultados, pedido))
    case 'questions-csv':
      return libro(() => buildQuestionsWorkbook(borrador, resultados, pedido))
    case 'answers-csv':
      return libro(() => buildAnswersWorkbook(borrador, resultados, pedido))
    case 'nom035-xlsx':
      return libro(() => buildNom035RiskWorkbook(borrador, resultados, pedido))
    case 'nom035-cases':
      return libro(() => buildNom035CasesWorkbook(borrador, resultados))
    case 'nom035-pdf':
      return () => imprimir(<ReporteRiesgo borrador={borrador} resultados={resultados} pedido={pedido} />, titulo)
    case 'nom035-individual':
      return () => imprimir(<ReportesIndividuales borrador={borrador} resultados={resultados} pedido={pedido} />, titulo)
    case 'nom035-letters':
      return () => imprimir(<CartasCanalizacion borrador={borrador} resultados={resultados} pedido={pedido} />, titulo)
  }
}

// Entrega el archivo sin dejar que un error lo tumbe todo: si algo falla, la fila ofrece reintentar.
// Con la encuesta de prueba que falla (fallaEnQA) la entrega falla siempre, también al reintentar.
function entregarSeguro(entrada: DownloadEntry, falla = false): boolean {
  if (falla) return false
  try {
    return entrada.deliver()
  } catch (error) {
    console.error('No se pudo generar el reporte', entrada.fileName, error)
    return false
  }
}

/** Recibe `null` mientras la encuesta no existe: la pantalla llama al hook antes de saberlo. */
export function useCentroDescargas(borrador: SurveyDraft | null, resultados: SurveyResults | null): CentroDescargas {
  const [entradas, setEntradas] = useState<readonly DownloadEntry[]>([])
  // El borrador no trae el id de la encuesta: sale de la ruta (/encuestas/:id/resultados).
  const falla = fallaEnQA(useParams().id)
  const relojes = useRef(new Map<string, ReturnType<typeof setInterval>>())

  useEffect(() => {
    const activos = relojes.current
    return () => {
      activos.forEach((reloj) => clearInterval(reloj))
      activos.clear()
    }
  }, [])

  const cambiar = (id: string, cambio: Partial<DownloadEntry>) => setEntradas((actuales) => actuales.map((entrada) => (entrada.id === id ? { ...entrada, ...cambio } : entrada)))

  const iniciar = useCallback(
    (pedido: ReportRequest) => {
      if (!borrador || !resultados) return
      const tipo = reportTypeFor(pedido.kind)
      const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const nombre = `${tipo.fileSlug}-${slugify(borrador.name)}-${fileStamp()}.${tipo.format === 'PDF' ? 'pdf' : XLS_EXTENSION}`
      const entrada: DownloadEntry = {
        id,
        kind: pedido.kind,
        fileName: nombre,
        format: tipo.format,
        status: 'preparing',
        progress: 0,
        startedAt: Date.now(),
        delivered: false,
        deliver: entregaDe(borrador, resultados, pedido, nombre),
        request: pedido,
      }
      setEntradas((actuales) => [entrada, ...actuales])

      // El azar y la entrega viven en el cuerpo del intervalo, nunca dentro de la función que
      // actualiza el estado: en modo estricto React la corre dos veces y entregaría el archivo doble.
      const paso = (100 * TICK_MS) / tipo.prepareMs
      let avance = 0
      const reloj = setInterval(() => {
        avance = Math.min(100, avance + paso * (0.4 + Math.random() * 1.2))
        if (avance < 100) {
          cambiar(id, { progress: avance })
          return
        }
        clearInterval(reloj)
        relojes.current.delete(id)
        const entregado = entregarSeguro(entrada, falla)
        cambiar(id, { status: 'ready', progress: 100, delivered: entregado })
        if (entregado) notify(tipo.format === 'PDF' ? 'Reporte listo para guardar' : 'Reporte descargado', tipo.format === 'PDF' ? 'Elige «Guardar como PDF» en el diálogo de impresión.' : nombre, 'success')
        else notify('No se pudo entregar el reporte', 'Vuelve a intentarlo desde Descargar › Descargas.', 'error')
      }, TICK_MS)
      relojes.current.set(id, reloj)
    },
    [borrador, resultados, falla],
  )

  const entregar = useCallback(
    (id: string) => {
      const entrada = entradas.find((candidata) => candidata.id === id)
      if (!entrada) return
      const entregado = entregarSeguro(entrada, falla)
      cambiar(id, { delivered: entregado })
      if (!entregado) notify('No se pudo entregar el reporte', 'Vuelve a intentarlo en unos minutos.', 'error')
    },
    [entradas, falla],
  )

  return { entradas, preparando: entradas.filter((entrada) => entrada.status === 'preparing').length, iniciar, entregar }
}

/**
 * Cada reporte pedido se ve también en el Centro de procesos del header, como las cargas de encuestas: mientras se
 * prepara, con su avance y «Ver» (abre el panel en «Descargas»); listo, queda como procesado con «Descargar» para
 * bajarlo de nuevo. Al salir de la pantalla se quitan los que seguían preparándose (esta pantalla era la que los movía).
 */
export function useDescargasEnProcesos(centro: CentroDescargas, nombreEncuesta: string, onVer: () => void) {
  const { entradas, entregar } = centro
  useEffect(() => {
    for (const entrada of entradas) {
      const tipo = reportTypeFor(entrada.kind)
      const listo = entrada.status === 'ready'
      publishProcess({
        id: `descarga-${entrada.id}`,
        title: `${tipo.title} · ${nombreEncuesta}`,
        meta: listo ? (entrada.delivered ? `Listo · ${entrada.fileName}` : 'No se pudo entregar · vuelve a descargarlo') : 'Preparando el reporte',
        progress: listo ? undefined : Math.round(entrada.progress),
        done: listo,
        icon: tipo.icon,
        cta: listo ? 'Descargar' : 'Ver',
        onClick: listo ? () => entregar(entrada.id) : onVer,
      })
    }
  }, [entradas, entregar, nombreEncuesta, onVer])

  // «Historial» del centro de procesos abre este mismo panel en Descargas mientras se esté en la encuesta.
  useEffect(() => {
    setProcessHistory(onVer)
    return () => setProcessHistory(null)
  }, [onVer])
  const vigentes = useRef(entradas)
  vigentes.current = entradas
  useEffect(() => () => vigentes.current.filter((entrada) => entrada.status === 'preparing').forEach((entrada) => removeProcess(`descarga-${entrada.id}`)), [])
}
