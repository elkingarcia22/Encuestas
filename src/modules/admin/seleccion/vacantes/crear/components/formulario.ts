import { SECCIONES_POR_DEFECTO, type SeccionDescripcion } from './descripcion'
import type { EtapaFlujo } from './etapas'
import { SECCIONES_INFORMACION, completa } from './secciones-informacion'

// Todo lo que se llena al crear una vacante. Los tres pasos escriben sobre el mismo objeto:
// así «Guardar» deja un borrador completo aunque se salga en el paso 1.

export type Modalidad = 'remoto' | 'presencial' | 'hibrido'
export type TipoSalario = 'fijo' | 'rango'

export type VacanteNueva = {
  // Paso 1 · Información general
  nombre: string
  area: string
  pais: string
  ciudad: string
  // Paso 1 · Requisitos del puesto
  contrato: string
  idiomas: string[]
  seniority: string
  // Deslizador de rango (años): siempre trae un valor, no hay «vacío» como con el texto libre.
  experienciaDesde: number
  experienciaHasta: number
  // Vacía hasta que se elija: no se asume ninguna.
  modalidad: Modalidad | ''
  // Paso 1 · Compensación y condiciones
  moneda: string
  tipoSalario: TipoSalario
  salarioFijo: string
  salarioDesde: string
  salarioHasta: string
  equity: boolean
  // Paso 1 · Configuración
  // Publicar en el portal de empleo de UBITS (por ahora el único portal).
  publicarEnBolsas: boolean
  correoRechazo: boolean
  diasRechazo: number | null
  habilidades: string[]
  // Paso 2 · Descripción
  secciones: SeccionDescripcion[]
  // Paso 3 · Proceso de selección
  etapas: EtapaFlujo[]
}

export const VACANTE_VACIA: VacanteNueva = {
  nombre: '',
  area: '',
  pais: '',
  ciudad: '',
  contrato: '',
  idiomas: [],
  seniority: '',
  experienciaDesde: 1,
  experienciaHasta: 3,
  modalidad: '',
  moneda: '',
  tipoSalario: 'rango',
  // Con deslizador siempre hay un valor (no existe «vacío» en un slider): arranca en un punto medio
  // razonable, el mismo rango que usa «Crear con IA» para un cargo de nivel medio.
  salarioFijo: '4000000',
  salarioDesde: '3000000',
  salarioHasta: '6000000',
  equity: false,
  publicarEnBolsas: true,
  correoRechazo: false,
  diasRechazo: 3,
  habilidades: [],
  secciones: SECCIONES_POR_DEFECTO,
  etapas: [],
}

// Cada sección del paso 1 recibe lo mismo: la vacante entera y una forma de aplicarle un cambio parcial.
export type CamposSeccion = {
  vacante: VacanteNueva
  onCambio: (cambio: Partial<VacanteNueva>) => void
}

// La descripción va bajo el título de la pantalla y cambia con el paso: dice qué se decide en él.
export const PASOS = [
  { numero: 1, titulo: 'Información', descripcion: 'Define el cargo, dónde se trabaja, las condiciones y quién lleva el proceso.' },
  { numero: 2, titulo: 'Descripción', descripcion: 'Escribe lo que verá el candidato al postularse: el rol, sus funciones y lo que ofrece la empresa.' },
  { numero: 3, titulo: 'Proceso de selección', descripcion: 'Arma las etapas por las que pasará cada candidato, desde que se postula hasta la oferta.' },
]

// Para pasar del paso 1 tienen que estar completas sus cuatro secciones (lo obligatorio de cada una).
export function informacionCompleta(vacante: VacanteNueva) {
  return SECCIONES_INFORMACION.every((seccion) => completa(seccion.id, vacante))
}
