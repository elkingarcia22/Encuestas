import { createContext, useContext, useEffect, useRef } from 'react'

// «Configuración» y «Orbit» son de la evaluación entera, no de una pregunta, así que van en la barra del recurso
// principal —junto a «Reemplazar»—, con el resto de lo que se puede hacer con el recurso. Pero quien sabe abrirlos es el
// editor, que se pinta debajo: el editor los publica aquí y la barra los rinde.

export type AccionesEvaluacion = {
  /** Sin esto no se ofrece «Configuración»: la encuesta de satisfacción no se ajusta. */
  abrirConfiguracion?: () => void
  /** Sin esto no se ofrece el agente: en una encuesta no hay preguntas que generar con respuesta correcta. */
  abrirAgente?: () => void
  /** Mientras la IA escribe las preguntas, el botón del agente se apaga. */
  generando: boolean
}

const Contexto = createContext<((acciones: AccionesEvaluacion | null) => void) | null>(null)

export const ProveedorAccionesEvaluacion = Contexto.Provider

/**
 * Lo llama el editor de la evaluación. Las funciones se guardan en una referencia y lo que se publica son dos envoltorios
 * estables: así la barra no se vuelve a pintar en cada tecla, y aun así llama siempre a la versión de ahora.
 */
export function usePublicarAccionesEvaluacion(acciones: AccionesEvaluacion) {
  const publicar = useContext(Contexto)
  const vigentes = useRef(acciones)
  useEffect(() => {
    vigentes.current = acciones
  })
  const { generando } = acciones
  const hayConfiguracion = Boolean(acciones.abrirConfiguracion)
  const hayAgente = Boolean(acciones.abrirAgente)
  useEffect(() => {
    if (!publicar) return
    publicar({
      abrirConfiguracion: acciones.abrirConfiguracion ? () => vigentes.current.abrirConfiguracion?.() : undefined,
      abrirAgente: acciones.abrirAgente ? () => vigentes.current.abrirAgente?.() : undefined,
      generando,
    })
    return () => publicar(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicar, generando, hayConfiguracion, hayAgente])
}
