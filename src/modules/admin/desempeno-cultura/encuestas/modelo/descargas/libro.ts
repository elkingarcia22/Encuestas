import { paletaExcel, type PaletaExcel } from './paleta-excel'

/**
 * Workbook builders for the download center.
 *
 * Every non-PDF report is a styled SpreadsheetML workbook (Excel 2003 XML):
 * multi-sheet, no dependency, and Excel, Numbers and Sheets all open it. The
 * styling matters as much as the data — a report lands on someone's desk as a
 * spreadsheet, and an unstyled wall of cells reads as a data dump, not a
 * deliverable. So the sheets carry the product's own vocabulary: brand-blue
 * headers, the five favorability bands as cell fills, sentiment colors on
 * comments, sized columns and zebra rows.
 *
 * Everything is pure string assembly from the same aggregate the screen
 * renders — the files must say exactly what the report says, or the first
 * person who cross-checks a cell concludes one of the two is lying.
 */

/** El libro se guarda como .xls: es SpreadsheetML, y así lo abre Excel sin preguntar. */
export const XLS_EXTENSION = 'xls'
export const XLS_MIME = 'application/vnd.ms-excel'

export const fileStamp = (): string => new Date().toISOString().slice(0, 10)

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

export function saveBlob(fileName: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

// --- SpreadsheetML core -----------------------------------------------------

/** Una fuente: tamaño, negrita y color de la paleta. */
const font = (color: string, size?: number, bold?: boolean): string => `<Font ss:FontName="Calibri"${size ? ` ss:Size="${size}"` : ''}${bold ? ' ss:Bold="1"' : ''} ss:Color="${color}"/>`

const fill = (color: string): string => `<Interior ss:Color="${color}" ss:Pattern="Solid"/>`

const bottomBorder = (color: string, weight = 1): string => `<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="${weight}" ss:Color="${color}"/></Borders>`

const CENTERED = '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>'

/** Una celda de banda o de lectura: texto en negrita sobre su fondo, centrado. */
const chip = (id: string, text: string, background: string, size = 10): string => `<Style ss:ID="${id}">${font(text, size, true)}${fill(background)}${CENTERED}</Style>`

/**
 * The style palette every sheet draws from. Los colores salen del tema en el
 * momento de generar el archivo (ver `paletaExcel`): SpreadsheetML solo habla
 * hexadecimal, y así el libro sigue a los tokens en vez de repetirlos a mano.
 */
const stylesXml = (p: PaletaExcel): string => `
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    ${font(p.tinta, 10)}
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="title">${font(p.marca, 15, true)}</Style>
  <Style ss:ID="hint">${font(p.pista, 9)}</Style>
  <Style ss:ID="head">
    ${font(p.sobreMarca, 9, true)}
    ${fill(p.marca)}
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
    ${bottomBorder(p.marcaOscura, 2)}
  </Style>
  <Style ss:ID="label">
    ${font(p.tinta, 10, true)}
    ${bottomBorder(p.borde)}
  </Style>
  <Style ss:ID="cell">
    ${bottomBorder(p.borde)}
  </Style>
  <Style ss:ID="alt">
    ${fill(p.cebra)}
    ${bottomBorder(p.borde)}
  </Style>
  <Style ss:ID="wrap">
    <Alignment ss:Vertical="Top" ss:WrapText="1"/>
    ${bottomBorder(p.borde)}
  </Style>
  ${chip('b1', p.b1Texto, p.b1Fondo)}
  ${chip('b2', p.b2Texto, p.b2Fondo)}
  ${chip('b3', p.b3Texto, p.b3Fondo)}
  ${chip('b4', p.b4Texto, p.b4Fondo)}
  ${chip('b5', p.b5Texto, p.b5Fondo)}
  <Style ss:ID="bx">${font(p.nsnrTexto, 9)}${fill(p.nsnrFondo)}${CENTERED}</Style>
  ${chip('pos', p.positivoTexto, p.positivoFondo, 9)}
  ${chip('neu', p.neutroTexto, p.neutroFondo, 9)}
  ${chip('neg', p.negativoTexto, p.negativoFondo, 9)}
</Styles>`

export type StyleId = 'title' | 'hint' | 'head' | 'label' | 'cell' | 'alt' | 'wrap' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'bx' | 'pos' | 'neu' | 'neg'

export interface XmlCell {
  value: string | number | null
  style?: StyleId
}

export interface RowSpec {
  cells: readonly XmlCell[]
  height?: number
  autoFitHeight?: boolean
}

export interface SheetSpec {
  name: string
  /** Column widths in points, left to right. Missing entries autofit. */
  columns?: readonly number[]
  rows: readonly RowSpec[]
}

const xmlEscape = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const cellXml = (cell: XmlCell): string => {
  const style = cell.style ? ` ss:StyleID="${cell.style}"` : ''
  if (cell.value === null || cell.value === '') return `<Cell${style}/>`
  const type = typeof cell.value === 'number' ? 'Number' : 'String'
  const data = typeof cell.value === 'number' ? String(cell.value) : xmlEscape(cell.value)
  return `<Cell${style}><Data ss:Type="${type}">${data}</Data></Cell>`
}

const rowXml = (row: RowSpec): string => {
  const height = row.height ? ` ss:Height="${row.height}"` : ''
  const autoFit = row.autoFitHeight ? ' ss:AutoFitHeight="1"' : ''
  return `<Row${height}${autoFit}>${row.cells.map(cellXml).join('')}</Row>`
}

const sheetXml = ({ name, columns = [], rows }: SheetSpec): string => {
  const safeName = xmlEscape(name.slice(0, 31))
  const cols = columns.map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`).join('')
  return `<Worksheet ss:Name="${safeName}"><Table>${cols}${rows.map(rowXml).join('')}</Table></Worksheet>`
}

export const workbook = (sheets: readonly SheetSpec[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<?mso-application progid="Excel.Sheet"?>` +
  `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
  ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
  stylesXml(paletaExcel()) +
  sheets.map(sheetXml).join('') +
  `</Workbook>`

// --- Row helpers ---------------------------------------------------------------

export const titleRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: 'title' }],
  height: 24,
})

export const hintRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: 'hint' }],
  height: 14,
})

export const blankRow: RowSpec = { cells: [] }

export const headRow = (labels: readonly string[]): RowSpec => ({
  cells: labels.map((value) => ({ value, style: 'head' as const })),
  height: 26,
})

/** A data row: zebra base per index, per-cell styles win over the base. */
export const dataRow = (index: number, cells: readonly { value: string | number | null; style?: StyleId }[], options?: { autoFitHeight?: boolean }): RowSpec => ({
  cells: cells.map((cell) => ({
    value: cell.value,
    style: cell.style ?? (index % 2 === 1 ? 'alt' : 'cell'),
  })),
  height: options?.autoFitHeight ? undefined : 18,
  autoFitHeight: options?.autoFitHeight,
})

/** The band style a 1–5 score falls into — same cuts as `FAVORABILITY_BANDS`. */
export const bandStyle = (score: number | null): StyleId => {
  if (score === null) return 'bx'
  if (score <= 1.9) return 'b1'
  if (score <= 2.9) return 'b2'
  if (score <= 3.9) return 'b3'
  if (score <= 4.9) return 'b4'
  return 'b5'
}

/** The eNPS reading of a −100..100 result — same cuts as `NPS_SCORE_BANDS`. */
export const npsScoreStyle = (score: number | null): StyleId => {
  if (score === null) return 'bx'
  if (score >= 20) return 'pos'
  if (score >= 0) return 'neu'
  return 'neg'
}

/** A part of `n` as a one-decimal percentage, or null when there is no base. */
export const share = (part: number, n: number): number | null => (n > 0 ? Math.round((part / n) * 1000) / 10 : null)

/** A block heading inside a sheet that holds several tables. */
export const blockRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: 'title' }],
  height: 22,
})

export const paragraphRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: 'wrap' }],
  autoFitHeight: true,
})

/**
 * Excel caps a tab name at 31 characters, rejects `[]:*?/\` and refuses two
 * tabs with the same name — a survey can ask two sections the same question,
 * so the collision has to be resolved rather than trusted away.
 */
export const sheetNamer = () => {
  const used = new Set<string>()
  return (base: string): string => {
    const clean =
      base
        .replace(/[[\]:*?/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 31)
        .trim() || 'Hoja'
    let name = clean
    let attempt = 2
    while (used.has(name.toLowerCase())) {
      const tail = ` (${attempt})`
      name = `${clean.slice(0, 31 - tail.length).trim()}${tail}`
      attempt += 1
    }
    used.add(name.toLowerCase())
    return name
  }
}
