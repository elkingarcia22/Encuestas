import { CATALOGO_COMPETENCIAS, CONTENIDOS, duracionTexto } from './catalogo'
import { ACTIVOS, nombreCompleto } from './grupos-datos'
import { TIPOS, itemsDe, personasDelPlan, type Plan, type TipoPlan } from './planes-datos'

// Reportes del detalle (HU-LMS-016 competencias y HU-LMS-022 contenidos). Solo con el plan Vigente o No vigente
// (RN-05, RN-06), desde Acciones. Dos archivos distintos, para no exportar datos ambiguos:
// - «Reporte por colaborador»: una fila por persona del plan, con su resumen y su avance total (RN-02).
// - «Reporte detallado»: una fila por cada par persona–ítem; quien no tiene ítems no aporta filas (RN-03, RN-04).

type Tipo = 'por-colaborador' | 'detallado'

export const NOMBRE_REPORTE: Record<Tipo, string> = { 'por-colaborador': 'Reporte por colaborador', detallado: 'Reporte detallado' }

// Nombre de archivo en sentence case neutro (RN-08): reporte-por-colaborador-{nombre-plan}.csv.
const enSlug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const celda = (valor: string | number) => {
  const texto = String(valor)
  return /[",\n;]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto
}

// Avance de una persona en uno de sus ítems: los primeros `hechos` están terminados; el siguiente, a medias si ya entró.
function avanceDelItem(indice: number, hechos: number, entro: boolean, semilla: string) {
  if (indice < hechos) return 100
  if (indice === hechos && entro) return 20 + (semilla.length * 7 + indice * 13) % 60
  return 0
}

export function filasReporte(plan: Plan, tipo: Tipo): (string | number)[][] {
  const textos = TIPOS[plan.tipo]
  const personas = personasDelPlan(plan)
  if (tipo === 'por-colaborador') {
    return [
      ['Nombre', 'Área', 'Último acceso', 'Último avance', `${textos.items.charAt(0).toUpperCase() + textos.items.slice(1)}`, 'Terminados', 'Progreso total (%)'],
      ...personas.map((p) => [p.nombre, p.area, p.ultimoAcceso ?? 'Sin acceso', p.ultimoProgreso ?? '—', itemsDe(plan, p.id).join(' | '), `${p.hechos} de ${p.total}`, p.progreso]),
    ]
  }
  return [
    ['Nombre', 'Área', textos.item.charAt(0).toUpperCase() + textos.item.slice(1), 'Progreso (%)', 'Estado'],
    ...personas.flatMap((p) =>
      itemsDe(plan, p.id).map((titulo, indice) => {
        const avance = avanceDelItem(indice, p.hechos, Boolean(p.ultimoAcceso), p.id)
        return [p.nombre, p.area, titulo, avance, avance === 100 ? 'Completado' : avance > 0 ? 'En curso' : 'Sin iniciar']
      }),
    ),
  ]
}

// Un CSV separado por comas, con BOM para que Excel abra bien las tildes.
function descargarCsv(nombre: string, filas: (string | number)[][]) {
  const csv = filas.map((fila) => fila.map(celda).join(',')).join('\n')
  const archivo = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(archivo)
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

export function descargarReporte(plan: Plan, tipo: Tipo) {
  descargarCsv(`reporte-${tipo}-${enSlug(plan.nombre)}.csv`, filasReporte(plan, tipo))
}

// Quiénes terminaron todo, del primero al último (hay empresas que premian a quien termina primero; war room del 14-oct).
// La última fecha de progreso de quien terminó es cuándo terminó: «hace 9 días» terminó antes que «hace 2 días».
const diasDe = (texto: string | null) => Number(texto?.match(/(\d+)/)?.[1] ?? 0)
export const enOrdenDeLlegada = <T extends { ultimoProgreso: string | null }>(personas: T[]) => [...personas].sort((a, b) => diasDe(b.ultimoProgreso) - diasDe(a.ultimoProgreso))

export function descargarTerminaron(plan: Plan) {
  const terminaron = enOrdenDeLlegada(personasDelPlan(plan).filter((p) => p.progreso === 100))
  descargarCsv(`terminaron-${enSlug(plan.nombre)}.csv`, [
    ['Puesto', 'Nombre', 'Área', 'Terminó', `${TIPOS[plan.tipo].items.charAt(0).toUpperCase() + TIPOS[plan.tipo].items.slice(1)} terminados`],
    ...terminaron.map((p, i) => [i + 1, p.nombre, p.area, p.ultimoProgreso ?? '—', p.total]),
  ])
}

// ── «Importar participantes» (paso «Cargar archivo»): lo que hace falta para armar el CSV ──
// En UBITS el archivo trae a la vez a quién y qué: una fila por persona y contenido (username, content_id). Los tres
// botones de arriba bajan los usernames, los códigos del catálogo y una plantilla con ese formato.

export const COLUMNA_ITEM: Record<TipoPlan, string> = { contenidos: 'content_id', competencias: 'competence_id' }
const codigo = (tipo: TipoPlan, indice: number) => `${tipo === 'competencias' ? 'CP' : 'CT'}-${String(indice + 1).padStart(4, '0')}`

export function descargarColaboradores() {
  descargarCsv('colaboradores.csv', [['username', 'Nombre', 'Correo', 'Área'], ...ACTIVOS.map((u) => [u.username, nombreCompleto(u), u.correo, u.area])])
}

export function descargarListaItems(tipo: TipoPlan) {
  descargarCsv(
    `lista-de-${TIPOS[tipo].items}.csv`,
    tipo === 'competencias'
      ? [[COLUMNA_ITEM[tipo], 'Competencia', 'Habilidades'], ...CATALOGO_COMPETENCIAS.map((c, i) => [codigo(tipo, i), c.titulo, c.habilidades.join(' | ')])]
      : [[COLUMNA_ITEM[tipo], 'Contenido', 'Tipo', 'Duración', 'Idioma'], ...CONTENIDOS.map((c, i) => [codigo(tipo, i), c.titulo, c.tipo, duracionTexto(c.minutos), c.idioma])],
  )
}

export function descargarPlantilla(tipo: TipoPlan) {
  const [a, b] = ACTIVOS
  descargarCsv(`plantilla-${enSlug(TIPOS[tipo].singular)}.csv`, [
    ['username', COLUMNA_ITEM[tipo]],
    [a.username, codigo(tipo, 0)],
    [a.username, codigo(tipo, 1)],
    [b.username, codigo(tipo, 0)],
  ])
}
