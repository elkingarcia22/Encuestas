import { createContext, useContext } from 'react'
import type { SectionTreeEntry } from '../../../modelo/sectionTree'
import type { SurveySection } from '../../../modelo/surveyBuilderTypes'

// Lo que comparten todas las filas del árbol del paso 4. Las reglas de la experiencia viven aquí,
// en un solo sitio: una rama abierta por nivel, un solo formulario de pregunta abierto en toda la
// encuesta y un solo borrado pendiente a la vez.

export type PedidoBorrado = { tipo: 'seccion'; id: string } | { tipo: 'pregunta'; id: string; seccionId: string }

export type Arbol = {
  secciones: readonly SurveySection[]
  cambiar: (secciones: SurveySection[]) => void
  /** Ids abiertos, uno por nivel: abrir una rama cierra la que estaba abierta en su nivel. */
  abiertas: readonly string[]
  alternar: (entrada: SectionTreeEntry) => void
  seleccionada: string | null
  seleccionar: (id: string) => void
  editando: string | null
  setEditando: (id: string | null) => void
  /** La pregunta abierta se acaba de crear y todavía no se agregó: el formulario ofrece «Agregar» y «Cancelar» (la descarta). */
  esNueva: boolean
  /** Cierra el formulario de la pregunta abierta. Con `guardar`, se queda; sin él, una nueva se descarta y una existente vuelve a como estaba al abrirla. */
  terminarEdicion: (guardar: boolean) => void
  /** Pide confirmar un borrado: el paso abre un solo diálogo (el del design system) y, al confirmar, borra. */
  pedirBorrado: (pedido: PedidoBorrado) => void
  /** Las preguntas que se marcan en rojo: las que estaban incompletas al intentar avanzar. Una pregunta nueva nace sin marca. */
  marcadas: ReadonlySet<string>
  /** Cuenta los intentos de avanzar, agregar o guardar con algo incompleto. Cada intento vuelve a marcar en rojo lo que falte en ese momento. */
  intento: number
  /** Id recién creado: su título nace en modo edición. */
  recien: string | null
  /** La sección o subsección cuyo título se está editando. Mientras haya una, todo lo demás del paso queda apagado. */
  editandoSeccion: string | null
  setEditandoSeccion: (id: string | null) => void
  crearSubseccion: (padre: SectionTreeEntry) => void
  crearPregunta: (duena: SectionTreeEntry) => void
  /** Una pregunta nueva cuyo enunciado lo redacta la IA: su formulario abre pidiendo el contexto. */
  conIa: string | null
  crearPreguntaConIa: (duena: SectionTreeEntry) => void
  /** La sección que el agente de IA está creando ahora mismo (su etiqueta dice «Creando…»), o null. */
  creandoIa: string | null
  /** La encuesta está en curso: el árbol se ve y se pliega, pero nada se crea, edita, mueve ni elimina. */
  bloqueado: boolean
}

// Lo que queda apagado mientras se edita el título de una sección: no se puede tocar y se ve atenuado.
export const APAGADO = 'pointer-events-none opacity-50'

export const NIVEL: Record<number, string> = { 1: 'Sección', 2: 'Subsección', 3: 'Sub-subsección' }

export const ArbolContexto = createContext<Arbol | null>(null)
export const useArbol = () => useContext(ArbolContexto)!
