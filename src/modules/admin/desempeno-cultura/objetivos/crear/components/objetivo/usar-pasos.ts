import { useEffect, useRef, useState } from 'react'
import { parseAmount, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { resolveStartLine, trackBlockingIssue, type StartLine } from '../../../modelo/constructor/complianceRules'
import type { IaTarjeta } from './usar-ia-tarjeta'

// Todos los campos se muestran a la vez sin pausas.

export interface Pasos {
  medida: boolean
  valores: boolean
  rango: boolean
  peso: boolean
  alineacion: boolean
  acciones: boolean
  prueba: boolean
  salida: StartLine | null
  rangoContestado: boolean
  elegirRango: (activo: boolean) => void
}

export function usePasos({
  objetivo,
  onCambio,
  requierePeso,
  pesoLibre,
  hayAlineables,
  conAcciones,
}: {
  objetivo: Objective
  onCambio: (cambio: Partial<Objective>) => void
  ia: IaTarjeta
  requierePeso: boolean
  pesoLibre: number
  hayAlineables: boolean
  conAcciones: boolean
}): Pasos {
  const { measure, direction } = objetivo
  const booleano = measure === 'boolean'

  // Los campos principales están siempre disponibles o dependen directamente de los datos requeridos.
  const medida = true
  const valores = !booleano

  const meta = parseAmount(objetivo.targetValue ?? '')
  const inicial = parseAmount(objetivo.initialValue ?? '')
  const pistaUsable = meta !== null && direction !== null && trackBlockingIssue(direction, meta, inicial) === null
  const salida = pistaUsable && meta !== null && direction !== null ? resolveStartLine(direction, meta, inicial) : null
  const sePuedeProbar = medida && (booleano || (valores && salida !== null))
  const rango = !booleano

  const [elegido, setElegido] = useState(false)
  const rangoContestado = elegido || objetivo.rangeEnabled || objetivo.minValue !== '' || objetivo.maxValue !== '' || objetivo.createdByAI
  const elegirRango = (activo: boolean) => {
    setElegido(true)
    onCambio({ rangeEnabled: activo })
  }

  // Peso, alineación y acciones se muestran inmediatamente si la configuración del ciclo los requiere.
  const peso = requierePeso
  const alineacion = hayAlineables
  const acciones = conAcciones

  // La IA generó esto: auto-contesta rango, peso y alineación si aplica.
  const pendientes = useRef({ rango: false, peso: false, alineacion: false })
  const generadoAntes = useRef(objetivo.createdByAI)
  useEffect(() => {
    if (!generadoAntes.current && objetivo.createdByAI) pendientes.current = { rango: true, peso: true, alineacion: true }
    generadoAntes.current = objetivo.createdByAI
  }, [objetivo.createdByAI])

  useEffect(() => {
    if (!pendientes.current.rango || !rango) return
    pendientes.current = { ...pendientes.current, rango: false }
    onCambio({ rangeEnabled: false, minValue: '', maxValue: '' })
  }, [rango, onCambio])

  useEffect(() => {
    if (!pendientes.current.peso || !peso) return
    pendientes.current = { ...pendientes.current, peso: false }
    onCambio({ weight: Math.max(0, pesoLibre) })
  }, [peso, pesoLibre, onCambio])

  useEffect(() => {
    if (!pendientes.current.alineacion || !alineacion) return
    pendientes.current = { ...pendientes.current, alineacion: false }
    onCambio({ alignedTo: [] })
  }, [alineacion, onCambio])

  return { medida, valores, rango, peso, alineacion, acciones, prueba: sePuedeProbar, salida, rangoContestado, elegirRango }
}
