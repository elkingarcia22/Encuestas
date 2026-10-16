import { useState } from 'react'

// Reglas de /design-system/formularios › Validación: el mensaje dice qué hacer, no qué falló.
export type Regla = (valor: string) => string | undefined

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// El campo acepta correo o usuario: sin «@» es un usuario; con «@» tiene que ser un correo completo.
export const reglaIdentificador: Regla = (valor) => {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu correo o tu usuario.'
  if (limpio.includes('@') && !FORMATO_CORREO.test(limpio)) return 'Revisa el correo: parece que le falta algo.'
  return undefined
}

export const reglaContrasena: Regla = (valor) => (valor ? undefined : 'Escribe tu contraseña.')

export const reglaCorreoEmpresa: Regla = (valor) => {
  if (!valor.trim()) return 'Escribe el correo de tu empresa.'
  if (!FORMATO_CORREO.test(valor.trim())) return 'Revisa el correo: parece que le falta algo.'
  return undefined
}

// Mientras escribe solo se limpia el error (nunca se añade uno); al salir del campo y al enviar, sí se valida.
// Un campo vacío no se marca al salir: si no ha escrito nada, no hay nada que corregir (el botón ya está
// deshabilitado hasta que lo llene).
export function useCampo(regla: Regla, inicial = '') {
  const [valor, setValor] = useState(inicial)
  const [error, setError] = useState<string | undefined>()

  return {
    valor,
    error,
    cambiar(siguiente: string) {
      setValor(siguiente)
      if (error && !regla(siguiente)) setError(undefined)
    },
    salir() {
      setError(valor.trim() ? regla(valor) : undefined)
    },
    validar() {
      const encontrado = regla(valor)
      setError(encontrado)
      return encontrado
    },
  }
}
