import { blankRow, dataRow, fileStamp, headRow, hintRow, saveBlob, slugify, titleRow, workbook, XLS_EXTENSION, XLS_MIME, type RowSpec, type SheetSpec, type StyleId } from '../descargas/libro'
import type { ComparativeTreeNode } from './comparativeSectionTree'
import { comentariosPorSeccion, type Comparativo } from './lectura'
import { lecturaIa } from './lectura-ia'

// El Excel del comparativo: el resumen de cada medición, la tabla por sección y pregunta, la
// positividad de los comentarios y la lectura de la IA. Las mismas cifras de la pantalla, con la base
// primero y la diferencia de cada comparada frente a ella.

const estiloDelta = (delta: number | null): StyleId | undefined => (delta === null || Math.abs(delta) < 0.1 ? undefined : delta > 0 ? 'pos' : 'neg')
const redondeo = (valor: number) => Math.round(valor * 10) / 10

function hojaResumen(c: Comparativo): SheetSpec {
  const base = c.titulares[c.olas[0].id]
  const filas: RowSpec[] = [
    titleRow('Comparativo de encuestas'),
    hintRow(`Base: ${c.base.name} · ${c.columnas.length} mediciones · generado el ${new Date().toLocaleDateString('es-CO')}`),
    blankRow,
    headRow(['Medición', 'Favorabilidad', 'Dif. vs base (pp)', 'Participación', 'Dif. vs base (pp)', 'eNPS', 'Dif. vs base (pts)', 'Invitados', 'Respondieron']),
    ...c.columnas.map((columna, indice) => {
      const t = c.titulares[columna.id]
      const dif = (valor: number | null, ref: number | null) => (columna.isBase || valor === null || ref === null ? null : redondeo(valor - ref))
      const dFav = dif(t.favorabilidad, base.favorabilidad)
      const dPart = dif(t.participacion, base.participacion)
      const dNps = dif(t.nps, base.nps)
      return dataRow(indice, [
        { value: `${columna.label}${columna.isBase ? ' (base)' : ''}` },
        { value: t.favorabilidad },
        { value: dFav, style: estiloDelta(dFav) },
        { value: t.participacion },
        { value: dPart, style: estiloDelta(dPart) },
        { value: t.nps },
        { value: dNps, style: estiloDelta(dNps) },
        { value: t.invitados },
        { value: t.respondieron },
      ])
    }),
  ]
  return { name: 'Resumen', columns: [260, 90, 100, 90, 100, 60, 100, 80, 90], rows: filas }
}

function hojaSecciones(c: Comparativo): SheetSpec {
  const baseId = c.olas[0].id
  const filas: RowSpec[] = [titleRow('Favorabilidad por sección y pregunta'), hintRow('En las comparadas, la diferencia frente a la base en puntos porcentuales.'), blankRow]
  filas.push(headRow(['Sección / pregunta', ...c.columnas.flatMap((columna) => (columna.isBase ? [`${columna.shortLabel} (base)`, 'n'] : [columna.shortLabel, 'Dif. (pp)', 'n']))]))
  let indice = 0
  const recorrer = (nodos: readonly ComparativeTreeNode[]) => {
    for (const nodo of nodos) {
      const enBase = nodo.measures[baseId]?.favorability ?? null
      filas.push(
        dataRow(indice++, [
          { value: `${'  '.repeat(nodo.depth - 1)}${nodo.kind === 'question' ? '• ' : `${nodo.numbering} `}${nodo.label}`, style: nodo.depth === 1 ? 'label' : undefined },
          ...c.columnas.flatMap((columna) => {
            const medida = nodo.measures[columna.id]
            const valor = medida?.favorability ?? null
            if (columna.isBase) return [{ value: valor }, { value: medida?.n ?? null }]
            const delta = valor === null || enBase === null ? null : redondeo(valor - enBase)
            return [{ value: valor }, { value: delta, style: estiloDelta(delta) }, { value: medida?.n ?? null }]
          }),
        ]),
      )
      recorrer(nodo.children)
    }
  }
  recorrer(c.arbolConPreguntas)
  return { name: 'Secciones', columns: [360, ...c.columnas.flatMap((columna) => (columna.isBase ? [90, 60] : [90, 70, 60]))], rows: filas }
}

function hojaComentarios(c: Comparativo): SheetSpec {
  const baseId = c.olas[0].id
  const secciones = comentariosPorSeccion(c)
  const filas: RowSpec[] = [titleRow('Positividad de los comentarios por sección'), hintRow('Porcentaje de comentarios positivos, neutrales y negativos según la IA.'), blankRow]
  filas.push(headRow(['Sección', 'Medición', 'Positivos (%)', 'Neutrales (%)', 'Negativos (%)', 'Dif. positivos vs base (pp)', 'Comentarios']))
  let indice = 0
  for (const seccion of secciones) {
    const base = seccion.porColumna[baseId]
    for (const columna of c.columnas) {
      const reparto = seccion.porColumna[columna.id]
      if (!reparto) continue
      const delta = columna.isBase || !base ? null : reparto.positivo - base.positivo
      filas.push(
        dataRow(indice++, [
          { value: `${seccion.numbering}. ${seccion.label}` },
          { value: `${columna.shortLabel}${columna.isBase ? ' (base)' : ''}` },
          { value: reparto.positivo, style: 'pos' },
          { value: reparto.neutral, style: 'neu' },
          { value: reparto.negativo, style: 'neg' },
          { value: delta, style: estiloDelta(delta) },
          { value: reparto.n },
        ]),
      )
    }
  }
  return { name: 'Comentarios', columns: [260, 140, 90, 90, 90, 150, 90], rows: filas }
}

function hojaIa(c: Comparativo): SheetSpec {
  const lectura = lecturaIa(c)
  const filas: RowSpec[] = [titleRow('Lectura de la IA'), dataRow(0, [{ value: lectura.resumen, style: 'wrap' }], { autoFitHeight: true }), blankRow, headRow(['#', 'Hallazgo', 'Tipo', 'Confiabilidad', 'Detalle', 'Evidencia', 'Impacto'])]
  lectura.hallazgos.forEach((hallazgo, indice) =>
    filas.push(
      dataRow(
        indice,
        [
          { value: indice + 1 },
          { value: hallazgo.titulo },
          { value: hallazgo.tipo },
          { value: hallazgo.confianza },
          { value: hallazgo.cuerpo, style: 'wrap' },
          { value: hallazgo.evidencia, style: 'wrap' },
          { value: hallazgo.impacto, style: 'wrap' },
        ],
        { autoFitHeight: true },
      ),
    ),
  )
  return { name: 'Análisis IA', columns: [30, 220, 90, 80, 300, 260, 260], rows: filas }
}

export const nombreLibroComparativo = (c: Comparativo) => `comparativo-${slugify(c.base.name)}-${fileStamp()}.${XLS_EXTENSION}`

export function descargarComparativo(c: Comparativo): string {
  const nombre = nombreLibroComparativo(c)
  saveBlob(nombre, XLS_MIME, workbook([hojaResumen(c), hojaSecciones(c), hojaComentarios(c), hojaIa(c)]))
  return nombre
}
