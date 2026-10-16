import type { Collaborator } from './collaborators'
import { DEMOGRAPHIC_COLUMN_LABELS, humanizeColumn, resolveImportedRows } from './participants'
import type { Filas } from './planilla'
import type { ImportedDemographic, ImportedUser, ParticipantsSelection } from './surveyBuilderTypes'

/**
 * Participantes desde una planilla (portado del prototipo). La primera fila nombra las columnas
 * («username», «name», «email», «area», «leader»…); cada fila siguiente es una persona, y cuenta
 * solo si trae al menos nombre o username.
 *
 * Toda columna fuera de las de identidad (username, name, email) es un demográfico detectado: su
 * encabezado se vuelve un filtro que se puede activar y sus valores distintos, las opciones. Una
 * columna sin un solo valor se ignora: no hay nada por qué segmentar.
 */

/** Hasta cuánto pesa un archivo de participantes. */
export const TAMANO_MAXIMO_PARTICIPANTES = 5 * 1024 * 1024

export const EXTENSIONES_PARTICIPANTES = ['.csv', '.xlsx']

const IDENTIDAD = new Set(['username', 'name', 'email'])

/** Por qué una fila del archivo no se carga (IA-020). */
export type MotivoDescarte = 'sin-nombre' | 'correo' | 'repetida'

/** Una fila que no entra, con su número tal como se ve en la planilla (el encabezado es la fila 1). */
export type FilaDescartada = { fila: number; motivo: MotivoDescarte; detalle: string }

export const MOTIVOS_DESCARTE: Record<MotivoDescarte, { uno: string; varios: string }> = {
  correo: { uno: 'con el correo inválido', varios: 'con el correo inválido' },
  'sin-nombre': { uno: 'sin nombre ni username', varios: 'sin nombre ni username' },
  repetida: { uno: 'repetida', varios: 'repetidas' },
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function participantesDeFilas(filas: Filas): { usuarios: ImportedUser[]; demograficos: ImportedDemographic[]; descartadas: FilaDescartada[] } {
  // Si la planilla trae sus filas vacías en su sitio, el encabezado es la primera con datos y cada fila conserva su número real.
  const inicio = filas.findIndex((fila) => fila.some((valor) => (valor ?? '').trim() !== ''))
  const encabezado = inicio >= 0 ? filas[inicio] : undefined
  const cuerpo = filas.slice(inicio + 1)
  if (!encabezado) return { usuarios: [], demograficos: [], descartadas: [] }
  const indice = (nombre: string) => encabezado.findIndex((valor) => valor.trim().toLowerCase() === nombre)
  const celda = (fila: string[], posicion: number) => (posicion >= 0 ? (fila[posicion] ?? '').trim() : '')
  const en = { username: indice('username'), name: indice('name'), email: indice('email'), area: indice('area'), leader: indice('leader') }

  // Cada fila se revisa antes de cargar: sin nombre ni username, con un correo que no lo es, o una persona que ya apareció
  // más arriba (mismo username o mismo correo) no entran, y se cuentan con su motivo. Una persona repetida entra una sola vez.
  // Las filas del todo vacías (las que dejan las planillas al final) no son un problema y se ignoran sin contarlas.
  const usuarios: ImportedUser[] = []
  const descartadas: FilaDescartada[] = []
  const vistas = new Map<string, number>()
  cuerpo.forEach((fila, posicion) => {
    const numero = inicio + posicion + 2
    if (fila.every((valor) => (valor ?? '').trim() === '')) return
    const username = celda(fila, en.username)
    const name = celda(fila, en.name)
    const email = celda(fila, en.email)
    if (username === '' && name === '') return void descartadas.push({ fila: numero, motivo: 'sin-nombre', detalle: email || 'Sin datos de identidad' })
    if (email !== '' && !CORREO_VALIDO.test(email)) return void descartadas.push({ fila: numero, motivo: 'correo', detalle: `${name || username} · ${email}` })
    const claves = [username && `u:${username.toLowerCase()}`, email && `e:${email.toLowerCase()}`].filter(Boolean) as string[]
    const primera = claves.map((clave) => vistas.get(clave)).find((previa) => previa !== undefined)
    if (primera !== undefined) return void descartadas.push({ fila: numero, motivo: 'repetida', detalle: `${name || username} · ya está en la fila ${primera}` })
    claves.forEach((clave) => vistas.set(clave, numero))
    usuarios.push({ username, name, email, area: celda(fila, en.area), leader: celda(fila, en.leader) })
  })

  const demograficos: ImportedDemographic[] = encabezado.flatMap((crudo, posicion) => {
    const columna = crudo.trim().toLowerCase()
    if (columna === '' || IDENTIDAD.has(columna)) return []
    const valores = [...new Set(cuerpo.map((fila) => celda(fila, posicion)).filter((valor) => valor !== ''))]
    if (valores.length === 0) return []
    return [{ key: columna, label: DEMOGRAPHIC_COLUMN_LABELS[columna] ?? humanizeColumn(crudo), optionLabels: valores }]
  })

  return { usuarios, demograficos, descartadas }
}

/** La clave con que se reconoce a una persona importada: no se carga dos veces. */
export const claveImportado = (usuario: ImportedUser): string => `${usuario.username}|${usuario.email}`

// Las columnas de dos archivos se juntan: las opciones de una misma columna se suman.
function unirDemograficos(actuales: readonly ImportedDemographic[], nuevos: readonly ImportedDemographic[]): ImportedDemographic[] {
  const porClave = new Map(actuales.map((entrada) => [entrada.key, entrada]))
  for (const entrada of nuevos) {
    const previa = porClave.get(entrada.key)
    porClave.set(entrada.key, previa ? { ...previa, optionLabels: [...new Set([...previa.optionLabels, ...entrada.optionLabels])] } : entrada)
  }
  return [...porClave.values()]
}

/** Los campos de importación que se recalculan a partir de la lista de personas cargadas. */
function camposDeImportados(usuarios: readonly ImportedUser[], collaborators: readonly Collaborator[]): Partial<ParticipantsSelection> {
  return {
    importedUsers: usuarios,
    importedCount: usuarios.length,
    importedNewCount: resolveImportedRows(usuarios, collaborators).filter((fila) => fila.person === null).length,
    importedFailed: false,
  }
}

/**
 * Suma un lote cargado desde un archivo a lo que ya había, sin repetir a nadie. Devuelve el cambio a
 * aplicar y cuántas personas de verdad entraron (las repetidas no cuentan).
 */
export function sumarImportados(
  seleccion: ParticipantsSelection,
  lote: { usuarios: readonly ImportedUser[]; demograficos: readonly ImportedDemographic[]; archivo: string },
  collaborators: readonly Collaborator[],
): { cambio: Partial<ParticipantsSelection>; agregados: number } {
  const conocidos = new Set(seleccion.importedUsers.map(claveImportado))
  const nuevos = lote.usuarios.filter((usuario) => !conocidos.has(claveImportado(usuario)))
  const todos = [...seleccion.importedUsers, ...nuevos]
  const archivos = seleccion.importedFileName ? seleccion.importedFileName.split(' + ') : []
  return {
    agregados: nuevos.length,
    cambio: {
      ...camposDeImportados(todos, collaborators),
      importedFileName: [...new Set([...archivos, lote.archivo])].join(' + '),
      importedDemographics: unirDemograficos(seleccion.importedDemographics, lote.demograficos),
    },
  }
}

/** Quita personas cargadas; si no queda nadie, se va también el nombre del archivo y sus columnas. */
export function quitarImportados(seleccion: ParticipantsSelection, claves: ReadonlySet<string>, collaborators: readonly Collaborator[]): Partial<ParticipantsSelection> {
  const quedan = seleccion.importedUsers.filter((usuario) => !claves.has(claveImportado(usuario)))
  if (quedan.length === 0) return { ...camposDeImportados([], collaborators), importedFileName: null, importedDemographics: [] }
  return camposDeImportados(quedan, collaborators)
}
