import { useEffect, useRef, useState, type RefObject } from 'react'
import { generateObjectiveFromContext, refineObjectiveWording } from '../../../modelo/constructor/aiObjectiveGenerator'
import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { PAUSA_PASO } from './usar-diferido'

// La IA de la tarjeta: el botón al final de la fila del título (`useCardAi` del prototipo, con sus tiempos).
//
// · En blanco, «Generar con IA» primero pide una frase de contexto en el mismo campo (Enter genera, Escape cancela).
// · Con texto y sin medida, ese texto ya es el contexto: genera el objetivo entero.
// · Con la medida ya elegida, «Mejorar con IA» solo pule título y descripción: no le pisa al autor lo que ya decidió.
//
// Espera 1,1 s con el título vacío (para que lo nuevo no aparezca encima de lo viejo) y rellena en cascada: título y
// descripción → 450 ms → medida y dirección → 450 ms → valores. Rango, peso y alineación los contesta la tarjeta cuando
// sus pasos aparecen. Cada etapa repite lo anterior por si el cambio se mezcla contra una copia vieja del objetivo.

export type FaseIa = 'quieta' | 'contexto' | 'trabajando'

const TRABAJO_IA = 1100

const esperar = (ms: number) => new Promise((resolver) => window.setTimeout(resolver, ms))

export interface IaTarjeta {
  fase: FaseIa
  /** Ocupado más allá de «trabajando»: cubre también la cascada que llena medida y valores. */
  ocupada: boolean
  etiqueta: string
  /** Cómo lo anuncia un lector de pantalla. */
  descripcion: string
  disparar: () => void
  cancelarContexto: () => void
}

export function useIaTarjeta(objetivo: Objective, onCambio: (cambio: Partial<Objective>) => void, campo: RefObject<HTMLInputElement | null>): IaTarjeta {
  const [fase, setFase] = useState<FaseIa>('quieta')
  const [llenando, setLlenando] = useState(false)

  // La IA tarda y se puede seguir escribiendo mientras: al terminar se lee el objetivo de ese momento.
  const actual = useRef({ objetivo, onCambio })
  useEffect(() => {
    actual.current = { objetivo, onCambio }
  })
  const vivo = useRef(true)
  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])

  const correr = async (modo: 'generar' | 'mejorar') => {
    const base = actual.current.objetivo
    const contexto = base.title.trim()
    if (contexto === '') return
    setFase('trabajando')
    actual.current.onCambio({ title: '', description: '' })
    await esperar(TRABAJO_IA)
    if (!vivo.current) return

    if (modo === 'generar') {
      const generado = generateObjectiveFromContext(contexto)
      const etapa1 = { title: generado.title, description: generado.description, createdByAI: true }
      actual.current.onCambio(etapa1)
      setFase('quieta')
      setLlenando(true)
      await esperar(PAUSA_PASO)
      if (!vivo.current) return
      const etapa2 = { ...etapa1, measure: generado.measure, direction: generado.direction }
      actual.current.onCambio(etapa2)
      await esperar(PAUSA_PASO)
      if (!vivo.current) return
      actual.current.onCambio({ ...etapa2, initialValue: generado.initialValue, targetValue: generado.targetValue })
      setLlenando(false)
      return
    }

    // Mejorar parte del objetivo de cuando se pulsó (el título se acaba de vaciar para la espera).
    actual.current.onCambio(refineObjectiveWording(base))
    setFase('quieta')
    setLlenando(true)
    await esperar(PAUSA_PASO)
    if (vivo.current) setLlenando(false)
  }

  const ocupada = fase === 'trabajando' || llenando
  const generar = objetivo.title.trim() === '' || fase === 'contexto' || objetivo.measure === null

  const disparar = () => {
    if (ocupada) return
    if (fase === 'quieta' && objetivo.title.trim() === '') {
      setFase('contexto')
      requestAnimationFrame(() => campo.current?.focus())
      return
    }
    void correr(generar ? 'generar' : 'mejorar')
  }

  return {
    fase,
    ocupada,
    etiqueta: ocupada ? 'Redactando…' : generar ? 'Generar con IA' : 'Mejorar con IA',
    descripcion: generar ? 'Generar el objetivo con IA a partir del contexto' : 'Mejorar la redacción del objetivo con IA',
    disparar,
    cancelarContexto: () => setFase('quieta'),
  }
}
