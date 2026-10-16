import type { VacanteNueva } from './formulario'

// Las cuatro secciones del paso 1 se ven todas a la vez, sin plegarse. Aquí vive qué pide cada una
// para darse por completa: lo leen la marca de cada sección, el panel «Así va la vacante» y la barra.

// Largo máximo del nombre de la vacante: es el título que ven los candidatos y el de la pantalla.
// Con 50 cabe en una sola línea del encabezado incluso escrito todo en mayúsculas.
export const MAX_NOMBRE = 50

export type IdSeccion = 'general' | 'requisitos' | 'compensacion' | 'configuracion'

export const SECCIONES_INFORMACION: { id: IdSeccion; titulo: string }[] = [
  { id: 'general', titulo: 'Información general' },
  { id: 'requisitos', titulo: 'Requisitos del puesto' },
  { id: 'compensacion', titulo: 'Compensación y condiciones' },
  { id: 'configuracion', titulo: 'Configuración' },
]

type Obligatorio = { campo: string; listo: boolean }

// Los campos obligatorios de cada sección, con el nombre que se lee en pantalla. La experiencia y el
// salario no están: salen de un deslizador, que siempre tiene un valor.
function obligatorios(id: IdSeccion, v: VacanteNueva): Obligatorio[] {
  switch (id) {
    case 'general':
      return [
        { campo: 'Nombre de la vacante', listo: Boolean(v.nombre.trim()) },
        { campo: 'Área', listo: Boolean(v.area) },
      ]
    case 'requisitos':
      return [
        { campo: 'Tipo de contrato', listo: Boolean(v.contrato) },
        { campo: 'Modalidad', listo: Boolean(v.modalidad) },
        { campo: 'Idiomas', listo: v.idiomas.length > 0 },
        { campo: 'Seniority', listo: Boolean(v.seniority) },
        { campo: 'Al menos una habilidad', listo: v.habilidades.length > 0 },
      ]
    case 'compensacion':
      return [{ campo: 'Moneda', listo: Boolean(v.moneda) }]
    case 'configuracion':
      return [...(v.correoRechazo ? [{ campo: 'Días del correo de rechazo', listo: Boolean(v.diasRechazo) }] : [])]
  }
}

export function faltantes(id: IdSeccion, v: VacanteNueva): string[] {
  return obligatorios(id, v)
    .filter((obligatorio) => !obligatorio.listo)
    .map((obligatorio) => obligatorio.campo)
}

export function completa(id: IdSeccion, v: VacanteNueva) {
  return faltantes(id, v).length === 0
}

// Lo que falta en todo el paso, en el orden en que aparece en pantalla, y cuántos obligatorios hay.
export function avanceInformacion(v: VacanteNueva) {
  const todos = SECCIONES_INFORMACION.flatMap(({ id }) => obligatorios(id, v))
  return { falta: todos.filter((obligatorio) => !obligatorio.listo).map((obligatorio) => obligatorio.campo), total: todos.length }
}

const LISTA = new Intl.ListFormat('es', { type: 'conjunction' })

export function enLista(partes: string[]) {
  return LISTA.format(partes)
}
