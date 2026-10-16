import { useSyncExternalStore } from 'react'
import { pesos, type EstadoRequisito } from '../vacantes/detalle/components/data'
import { ajusteDe, type Candidatura, type Veredicto } from './datos'
import { baseDeCandidatos } from './base'
import { QUIEN_MUEVE, marcaDeTiempo } from './movimientos'

// Corregir los datos de una persona desde el agente de la vacante (25 sep, «Copiloto IA › Gestionar vacante con IA»:
// hoy el producto deja actualizar correo, teléfono o expectativa salarial pidiéndoselo al chat). Aquí vive lo que se
// corrigió en la sesión: la vacante lo aplica a su lista (`use-proceso`), así la ficha, la bandeja y la comparación
// dicen lo mismo, y el correo y el celular pasan también a la base global. Cada corrección se deshace.

export type CampoEditable = 'correo' | 'celular' | 'pretension'

// Con su artículo, porque el agente habla de ellos en frases: «el nuevo correo», «la nueva expectativa salarial».
export const CAMPOS_EDITABLES: { id: CampoEditable; nombre: string; etiqueta: string; femenino?: boolean }[] = [
  { id: 'correo', nombre: 'Correo', etiqueta: 'El nuevo correo' },
  { id: 'celular', nombre: 'Celular', etiqueta: 'El nuevo celular' },
  { id: 'pretension', nombre: 'Expectativa salarial', etiqueta: 'Lo que pide ahora, al mes', femenino: true },
]

const campoDe = (campo: CampoEditable) => CAMPOS_EDITABLES.find((uno) => uno.id === campo) ?? CAMPOS_EDITABLES[0]
export const nombreDeCampo = (campo: CampoEditable) => campoDe(campo).nombre
// «el correo» · «la expectativa salarial»
export const elCampo = (campo: CampoEditable) => `${campoDe(campo).femenino ? 'la' : 'el'} ${campoDe(campo).nombre.toLowerCase()}`
// «el nuevo correo» · «la nueva expectativa salarial»
export const elNuevoCampo = (campo: CampoEditable) =>
  `${campoDe(campo).femenino ? 'la nueva' : 'el nuevo'} ${campoDe(campo).nombre.toLowerCase()}`
// «actualizado» · «actualizada»
export const actualizadoCampo = (campo: CampoEditable) => (campoDe(campo).femenino ? 'actualizada' : 'actualizado')

export type Correccion = {
  id: string
  personaId: string
  nombre: string
  campo: CampoEditable
  antes: string | number
  despues: string | number
  quien: string
  cuando: number
}

let registro: Correccion[] = []
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

// El correo y el celular también son de la base: se cambian allá para que «Mis candidatos» diga lo mismo.
function pasarALaBase(personaId: string, campo: CampoEditable, valor: string | number) {
  if (campo === 'pretension') return
  baseDeCandidatos.cambiar((todas) => todas.map((persona) => (persona.id === personaId ? { ...persona, [campo]: String(valor) } : persona)))
}

export const registroDeCorrecciones = {
  leer: () => registro,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  // Guarda la corrección y devuelve cómo deshacerla.
  guardar(candidatura: Candidatura, campo: CampoEditable, despues: string | number) {
    const antes = valorDe(candidatura, campo)
    const correccion: Correccion = {
      id: `${candidatura.personaId}:${campo}@${marcaDeTiempo()}`,
      personaId: candidatura.personaId,
      nombre: candidatura.candidato.nombre,
      campo,
      antes,
      despues,
      quien: QUIEN_MUEVE,
      cuando: marcaDeTiempo(),
    }
    registro = [...registro, correccion]
    pasarALaBase(candidatura.personaId, campo, despues)
    avisar()
    return () => {
      registro = registro.filter((una) => una.id !== correccion.id)
      pasarALaBase(candidatura.personaId, campo, antes)
      avisar()
    }
  },
}

export const useCorrecciones = () => useSyncExternalStore(registroDeCorrecciones.suscribir, registroDeCorrecciones.leer)

// La candidatura con lo último que se corrigió de su persona.
export function conCorrecciones(candidatura: Candidatura, correcciones: Correccion[]): Candidatura {
  const suyas = correcciones.filter((una) => una.personaId === candidatura.personaId)
  if (!suyas.length) return candidatura
  const candidato = { ...candidatura.candidato }
  for (const una of suyas) {
    if (una.campo === 'pretension') candidato.pretension = Number(una.despues)
    else candidato[una.campo] = String(una.despues)
  }
  return { ...candidatura, candidato }
}

export function valorDe(candidatura: Candidatura, campo: CampoEditable): string | number {
  return candidatura.candidato[campo]
}

export const textoDeValor = (campo: CampoEditable, valor: string | number) => (campo === 'pretension' ? pesos(Number(valor)) : String(valor))

/* Requisitos corregidos a mano --------------------------------------------------------------------------------- */

// Cuando el equipo no está de acuerdo con lo que concluyó la IA de un requisito, lo corrige (CA-02, CA-03, CA-35). La
// corrección queda guardada para todo el equipo con quién, cuándo y por qué, y cambia todo lo que sale de los
// requisitos: el veredicto en la ficha, el puntaje de la hoja de vida, el «N de M requisitos» de la tarjeta y lo que
// lee el agente. Lo que dijo la IA no se borra: se sigue viendo y se puede volver a ello.

export type CorreccionRequisito = {
  id: string
  candidaturaId: string
  indice: number
  requisito: string
  antes: Veredicto
  despues: Veredicto
  motivo?: string
  quien: string
  cuando: number
}

const ESTADO_DE: Record<Veredicto, EstadoRequisito> = {
  cumple: 'Cumple',
  parcial: 'Parcial',
  'por-validar': 'Por validar',
  'no-cumple': 'No cumple',
}

let requisitos: CorreccionRequisito[] = []
const oyentesRequisitos = new Set<() => void>()
const avisarRequisitos = () => oyentesRequisitos.forEach((oyente) => oyente())

export const registroDeRequisitos = {
  leer: () => requisitos,
  suscribir: (oyente: () => void) => {
    oyentesRequisitos.add(oyente)
    return () => {
      oyentesRequisitos.delete(oyente)
    }
  },
  // Guarda la corrección y devuelve cómo deshacerla.
  guardar(candidatura: Candidatura, indice: number, despues: Veredicto, motivo?: string) {
    const criterio = candidatura.criterios[indice]
    const correccion: CorreccionRequisito = {
      id: `${candidatura.id}#${indice}@${marcaDeTiempo()}`,
      candidaturaId: candidatura.id,
      indice,
      requisito: criterio?.requisito ?? '',
      antes: criterio?.veredicto ?? 'por-validar',
      despues,
      motivo: motivo?.trim() || undefined,
      quien: QUIEN_MUEVE,
      cuando: marcaDeTiempo(),
    }
    requisitos = [...requisitos, correccion]
    avisarRequisitos()
    return () => {
      requisitos = requisitos.filter((una) => una.id !== correccion.id)
      avisarRequisitos()
    }
  },
}

export const useRequisitosCorregidos = () => useSyncExternalStore(registroDeRequisitos.suscribir, registroDeRequisitos.leer)

// La última corrección de cada requisito de una candidatura (la que manda) y lo que había dicho la IA antes de todas.
export function correccionesDe(candidaturaId: string, todas: CorreccionRequisito[]) {
  const suyas = todas.filter((una) => una.candidaturaId === candidaturaId)
  const ultima = new Map<number, CorreccionRequisito>()
  const deLaIA = new Map<number, Veredicto>()
  for (const una of suyas) {
    if (!deLaIA.has(una.indice)) deLaIA.set(una.indice, una.antes)
    ultima.set(una.indice, una)
  }
  return { ultima, deLaIA }
}

// La candidatura con los requisitos que corrigió el equipo.
export function conRequisitosCorregidos(candidatura: Candidatura, todas: CorreccionRequisito[]): Candidatura {
  const { ultima } = correccionesDe(candidatura.id, todas)
  if (!ultima.size) return candidatura
  const criterios = candidatura.criterios.map((criterio, indice) => {
    const una = ultima.get(indice)
    return una ? { ...criterio, veredicto: una.despues } : criterio
  })
  const estados = candidatura.criterios.map((_, indice) => {
    const una = ultima.get(indice)
    return una ? ESTADO_DE[una.despues] : candidatura.candidato.requisitos[indice]
  })
  return { ...candidatura, criterios, ajuste: ajusteDe(criterios), candidato: { ...candidatura.candidato, requisitos: estados } }
}

/* Leer lo que se escribió -------------------------------------------------------------------------------------- */

export const PATRON_CORREO = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/

// Un teléfono (CA-32). Sin indicativo, se lee como de Colombia: un celular (10 dígitos que empiezan por 3, «+57 300 123
// 4567») o un fijo (con su indicativo de ciudad, «+57 601 234 5678»). Con «+» y el indicativo de otro país, se acepta
// como viene, si tiene entre 8 y 15 dígitos: «+58 412 555 1234».
function leerCelular(texto: string): { valor?: string; error?: string } {
  const limpio = texto.trim()
  const digitos = limpio.replace(/\D/g, '')
  if (limpio.startsWith('+') && !digitos.startsWith('57')) {
    if (digitos.length < 8 || digitos.length > 15) return { error: 'Revisa el número: con el indicativo del país tiene entre 8 y 15 dígitos.' }
    return { valor: `+${digitos.slice(0, digitos.length - 10 > 0 ? digitos.length - 10 : 2)} ${digitos.slice(-10, -7)} ${digitos.slice(-7, -4)} ${digitos.slice(-4)}`.replace(/\s+/g, ' ') }
  }
  const locales = digitos.replace(/^57(?=\d{10}$)/, '')
  if (locales.length !== 10) return { error: 'Escribe el número con 10 dígitos (300 123 4567, o un fijo con indicativo: 601 234 5678). De otro país, con + y su indicativo.' }
  if (!/^[36]/.test(locales)) return { error: 'Un celular empieza por 3 y un fijo por 60 (con el indicativo de la ciudad). De otro país, escríbelo con + y su indicativo.' }
  return { valor: `+57 ${locales.slice(0, 3)} ${locales.slice(3, 6)} ${locales.slice(6)}` }
}

// Lo que pide al mes, en millones: «3500000», «3.500.000», «3,5 millones», «$7,8 M» o «7.8».
function leerPretension(texto: string): { valor?: number; error?: string } {
  const limpio = texto.toLowerCase().replace(/\$|cop|pesos|al mes|mensual(es)?/g, '').trim()
  const enMillones = /m(illones?)?\b|\bm$/.test(limpio)
  const numero = limpio.replace(/[a-záéíóú\s]/g, '')
  // Con puntos de miles («3.500.000») los puntos sobran; con coma o un solo punto, es decimal.
  const normal = /^\d{1,3}(\.\d{3})+$/.test(numero) ? numero.replace(/\./g, '') : numero.replace(',', '.')
  const valor = Number(normal)
  if (!normal || Number.isNaN(valor) || valor <= 0) return { error: 'Escríbelo en pesos al mes, por ejemplo 3.500.000 o 3,5 millones.' }
  const millones = enMillones || valor < 1000 ? valor : valor / 1_000_000
  if (millones < 0.5 || millones > 100) return { error: 'Parece fuera de lo normal: revisa los ceros (en pesos al mes).' }
  return { valor: Math.round(millones * 10) / 10 }
}

export function leerValor(campo: CampoEditable, texto: string): { valor?: string | number; error?: string } {
  const limpio = texto.trim()
  if (!limpio) return { error: 'Escribe el dato nuevo.' }
  if (campo === 'correo') {
    // Un solo correo, sin espacios ni nada más alrededor (se perdonan las comillas y el punto final).
    const solo = limpio.replace(/^[«"']+|[«»"'.]+$/g, '')
    const correo = solo.match(PATRON_CORREO)?.[0]
    return correo && correo === solo ? { valor: correo.toLowerCase() } : { error: 'Ese correo no parece completo (nombre@dominio.com).' }
  }
  if (campo === 'celular') return leerCelular(limpio)
  return leerPretension(limpio)
}
