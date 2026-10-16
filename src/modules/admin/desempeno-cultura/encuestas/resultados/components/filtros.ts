import { useState } from 'react'
import { FAVORABILITY_BANDS } from '../../modelo/favorabilityScale'
import type { SegmentDefinition, SegmentFilter } from '../../modelo/surveyResults'

// El estado de filtros y resaltado que comparten las vistas de una pestaña (hoy, «Secciones» y el
// mapa de calor de Favorabilidad). Vive arriba de las dos: estrechar a «País: Colombia» o resaltar
// una banda en una sigue así al pasar a la otra. Portado del prototipo.

export type Nivel = 'section' | 'subsection2' | 'subsection3' | 'question'

export const NIVELES: readonly { id: Nivel; etiqueta: string }[] = [
  { id: 'section', etiqueta: 'Secciones' },
  { id: 'subsection2', etiqueta: 'Subsecciones' },
  { id: 'subsection3', etiqueta: 'Sub-subsecciones' },
  { id: 'question', etiqueta: 'Preguntas' },
]

/** El nivel de una sección según su profundidad: 1 es una sección raíz. */
export const nivelDe = (profundidad: number): Nivel => (profundidad === 1 ? 'section' : profundidad === 2 ? 'subsection2' : 'subsection3')

const BANDAS = FAVORABILITY_BANDS.map((banda) => banda.id)
const TODOS_LOS_NIVELES = NIVELES.map((nivel) => nivel.id)

const alternar = <T,>(conjunto: ReadonlySet<T>, valor: T): ReadonlySet<T> => {
  const siguiente = new Set(conjunto)
  if (siguiente.has(valor)) siguiente.delete(valor)
  else siguiente.add(valor)
  return siguiente
}

/** `idsBandas`: las bandas que se pueden resaltar; las de favorabilidad por defecto, las de riesgo en NOM 035.
 *  Sin `segmentoActivo` (la encuesta no recogió datos demográficos) no hay desglose ni nada por qué filtrar. */
export function useFiltrosResultados(segmentoActivo: SegmentDefinition | undefined, segmentos: readonly SegmentDefinition[], onSegmento: (clave: string) => void, idsBandas: readonly string[] = BANDAS) {
  const [filtros, setFiltros] = useState<readonly SegmentFilter[]>([])
  const [niveles, setNiveles] = useState<ReadonlySet<Nivel>>(() => new Set(TODOS_LOS_NIVELES))
  // Resaltar en el mapa de calor: las cinco bandas del 1 al 5, todas encendidas al empezar.
  const [bandas, setBandas] = useState<ReadonlySet<string>>(() => new Set(idsBandas))
  // Resaltar en «Secciones»: favorables, neutrales, desfavorables y NS/NR; vacío es «sin resaltar».
  const [grupos, setGrupos] = useState<ReadonlySet<string>>(() => new Set())
  const [filasResaltadas, setFilasResaltadas] = useState<ReadonlySet<string>>(() => new Set())

  const aplicarFiltro = (clave: string, opcion: string) =>
    setFiltros((actuales) => {
      const resto = actuales.filter((filtro) => filtro.key !== clave)
      return opcion === '' ? resto : [...resto, { key: clave, optionId: opcion }]
    })

  return {
    filtros,
    // Se filtra por cualquier demográfico menos el que ya forma las columnas o las filas.
    filtrables: segmentos.filter((segmento) => segmento.key !== segmentoActivo?.key),
    aplicarFiltro,
    quitarFiltro: (clave: string) => aplicarFiltro(clave, ''),
    limpiarFiltros: () => setFiltros([]),
    // Al cambiar «Ver por» se cae el filtro sobre ese mismo demográfico: ya es el desglose.
    cambiarSegmento: (clave: string) => {
      setFiltros((actuales) => actuales.filter((filtro) => filtro.key !== clave))
      onSegmento(clave)
    },
    niveles,
    nivelesOcultos: niveles.size < TODOS_LOS_NIVELES.length,
    alternarNivel: (nivel: Nivel) => setNiveles((actuales) => alternar(actuales, nivel)),
    restablecerNiveles: () => setNiveles(new Set(TODOS_LOS_NIVELES)),
    bandas,
    bandasOcultas: bandas.size < idsBandas.length,
    alternarBanda: (banda: string) => setBandas((actuales) => alternar(actuales, banda)),
    restablecerBandas: () => setBandas(new Set(idsBandas)),
    grupos,
    alternarGrupo: (grupo: string) => setGrupos((actuales) => alternar(actuales, grupo)),
    restablecerGrupos: () => setGrupos(new Set()),
    filasResaltadas,
    // Resalta una fila con todo lo que cuelga de ella (los ids los junta quien la dibuja).
    alternarFila: (ids: readonly string[]) =>
      setFilasResaltadas((actuales) => {
        const [id] = ids
        if (id === undefined) return actuales
        const siguiente = new Set(actuales)
        if (siguiente.has(id)) ids.forEach((fila) => siguiente.delete(fila))
        else ids.forEach((fila) => siguiente.add(fila))
        return siguiente
      }),
    restablecerResaltado: () => {
      setFilasResaltadas(new Set())
      setBandas(new Set(idsBandas))
    },
  }
}

export type FiltrosResultados = ReturnType<typeof useFiltrosResultados>
