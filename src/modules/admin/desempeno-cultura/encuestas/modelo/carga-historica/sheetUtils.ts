/**
 * Utilidades para leer las hojas de un libro ya convertido a texto por `leerLibro`.
 *
 * Reemplazan a las de SheetJS del prototipo: allí las celdas numéricas llegaban como número y
 * aquí todo llega como texto, así que las cuentas pasan por `cellNumber`.
 */
import type { Filas, Hoja } from '../planilla'

/** Un libro: todas sus hojas con su nombre real. */
export type Workbook = readonly Hoja[]

/** Filas de la hoja con ese nombre exacto, o null si el libro no la trae. */
export function sheetRows(workbook: Workbook, name: string): Filas | null {
  return workbook.find((sheet) => sheet.nombre === name)?.filas ?? null
}

export function hasSheet(workbook: Workbook, name: string): boolean {
  return workbook.some((sheet) => sheet.nombre === name)
}

export function cellText(value: string | undefined): string {
  return value === undefined ? '' : value.trim()
}

/**
 * Número de una celda. Una celda vacía es NaN (no 0), para que no cuente como puntaje ni como
 * porcentaje. Acepta la coma decimal de los CSV exportados en español («82,9»).
 */
export function cellNumber(value: string | undefined): number {
  const text = cellText(value).replace(/%$/, '').trim()
  if (text === '') return Number.NaN
  const normalized = /^-?\d+,\d+$/.test(text) ? text.replace(',', '.') : text
  return Number(normalized)
}

/** Finds the first row index whose column A (and, if given, column B) matches the expected text. */
export function findRowIndex(rows: Filas, colA: string, colB?: string): number {
  for (let i = 0; i < rows.length; i++) {
    const a = cellText(rows[i]?.[0])
    if (a !== colA) continue
    if (colB !== undefined && cellText(rows[i]?.[1]) !== colB) continue
    return i
  }
  return -1
}

export function extractYear(text: string): number | null {
  const match = text.match(/20\d{2}/)
  return match ? parseInt(match[0], 10) : null
}

const SPANISH_MONTH_ABBR: Record<string, number> = {
  ENE: 0,
  FEB: 1,
  MAR: 2,
  ABR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DIC: 11,
}

// Excel cuenta los días desde el 30 de diciembre de 1899. Solo se aceptan números en un rango de
// fechas plausibles (1954–2119) para no confundir un conteo con una fecha.
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const MS_PER_DAY = 86_400_000
const MIN_EXCEL_SERIAL = 20000
const MAX_EXCEL_SERIAL = 80000

function fromExcelSerial(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < MIN_EXCEL_SERIAL || serial > MAX_EXCEL_SERIAL) return null
  const utc = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * MS_PER_DAY)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

/**
 * Parses report-header dates into a real Date. Accepts the export's own text («Fecha: 26-MAR-2026»),
 * a date cell read as an Excel serial number («46107» or «Fecha: 46107»), ISO («2026-03-26») and
 * day-first dates («26/03/2026»).
 */
export function parseSpanishReportDate(text: string): Date | null {
  const spanish = text.match(/(\d{1,2})-([A-Za-zÁÉÍÓÚáéíóú]{3})-(\d{4})/)
  if (spanish) {
    const month = SPANISH_MONTH_ABBR[spanish[2].toUpperCase()]
    return month === undefined ? null : new Date(parseInt(spanish[3], 10), month, parseInt(spanish[1], 10))
  }

  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10))

  const dayFirst = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dayFirst) return new Date(parseInt(dayFirst[3], 10), parseInt(dayFirst[2], 10) - 1, parseInt(dayFirst[1], 10))

  const serial = text.match(/(?:^|\s|:)(\d{5}(?:\.\d+)?)\s*$/)
  return serial ? fromExcelSerial(Number(serial[1])) : null
}

export function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))
}

/** Title-cases a label so the same demographic/dimension name matches across files regardless of source casing (e.g. "RANGO EDAD" vs "Rango Edad"). */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/** Dedupes strings case-insensitively, keeping a single title-cased form per value. */
export function dedupeStringsCaseInsensitive(values: string[]): string[] {
  const seen = new Map<string, string>()
  values.forEach((v) => {
    const trimmed = v.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) seen.set(key, titleCase(trimmed))
  })
  return Array.from(seen.values())
}
