import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { TIPOS, itemsPorPersona, nombreAsignacion, personasDelPlan, type Plan } from './planes-datos'

// Qué cambia para las personas entre el plan guardado y el que se está editando. Es lo que dice la barra de abajo («3
// cambios sin guardar») y la ventana «Revisa los cambios» antes de guardar: con un plan que ya corre, cada cambio le
// llega a alguien, y se dice a quién antes de que pase (decisión de diseño del 14-oct).

export type Tono = 'suma' | 'resta' | 'cambio'
export type LineaCambio = { id: string; tono: Tono; texto: string; detalle?: string }

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

// «Ana Restrepo, Diego Soto y 10 más».
const quienes = (nombres: string[]) => `${nombres.slice(0, 2).join(', ')}${nombres.length > 2 ? ` y ${n(nombres.length - 2)} más` : ''}`

export function cambiosEntre(antes: Plan, despues: Plan): LineaCambio[] {
  const lineas: LineaCambio[] = []
  const textos = TIPOS[despues.tipo]

  // Los datos del plan.
  if (antes.nombre.trim() !== despues.nombre.trim()) lineas.push({ id: 'nombre', tono: 'cambio', texto: `El plan pasa a llamarse «${despues.nombre.trim()}»` })
  if (antes.inicio !== despues.inicio || antes.fin !== despues.fin) {
    lineas.push({ id: 'fechas', tono: 'cambio', texto: `Las fechas pasan a ${fechaCorta(despues.inicio)} – ${fechaCorta(despues.fin)}`, detalle: `Antes: ${fechaCorta(antes.inicio)} – ${fechaCorta(antes.fin)}.` })
  }
  if (despues.tipo === 'competencias' && antes.horas !== despues.horas) {
    lineas.push({ id: 'horas', tono: 'cambio', texto: `Cada competencia pasa a ${despues.horas} ${plural(despues.horas ?? 0, 'hora', 'horas')} de estudio` })
  }

  // Quién entra y quién sale.
  const filasAntes = new Map(personasDelPlan(antes).map((p) => [p.usuario, p]))
  const filasDespues = new Map(personasDelPlan(despues).map((p) => [p.usuario, p]))
  const entran = [...filasDespues.values()].filter((p) => !filasAntes.has(p.usuario))
  const salen = [...filasAntes.values()].filter((p) => !filasDespues.has(p.usuario))
  if (entran.length) lineas.push({ id: 'entran', tono: 'suma', texto: `${personas(entran.length)} ${plural(entran.length, 'entra', 'entran')} al plan`, detalle: quienes(entran.map((p) => p.nombre)) })
  if (salen.length) {
    const avanzaron = salen.filter((p) => p.progreso > 0).length
    lineas.push({
      id: 'salen',
      tono: 'resta',
      texto: `${personas(salen.length)} ${plural(salen.length, 'sale', 'salen')} del plan`,
      detalle: `${quienes(salen.map((p) => p.nombre))}.${avanzaron ? ` ${n(avanzaron)} ya ${plural(avanzaron, 'había', 'habían')} avanzado: lo que ${plural(avanzaron, 'hizo', 'hicieron')} se conserva.` : ''}`,
    })
  }

  // Qué recibe y qué deja de ver quien sigue en el plan.
  const itemsAntes = itemsPorPersona(antes)
  const itemsDespues = itemsPorPersona(despues)
  // Por contenido, a quiénes les llega de nuevo y a quiénes se les quita (y cuántos de esos ya lo habían empezado).
  const reciben = new Map<string, string[]>()
  const pierden = new Map<string, { usuarios: string[]; empezado: number }>()
  for (const [usuario, despuesItems] of itemsDespues) {
    const previos = itemsAntes.get(usuario)
    if (!previos) continue
    for (const titulo of despuesItems) if (!previos.includes(titulo)) reciben.set(titulo, [...(reciben.get(titulo) ?? []), usuario])
    const fila = filasAntes.get(usuario)
    previos.forEach((titulo, indice) => {
      if (despuesItems.includes(titulo)) return
      const actual = pierden.get(titulo) ?? { usuarios: [], empezado: 0 }
      // Una persona avanza en orden: lo que va antes de donde va, ya lo empezó.
      const empezo = Boolean(fila && fila.progreso > 0 && indice <= fila.hechos)
      pierden.set(titulo, { usuarios: [...actual.usuarios, usuario], empezado: actual.empezado + Number(empezo) })
    })
  }
  // Los contenidos que ganan o pierden exactamente las mismas personas van en una sola línea: «A», «B» y «C» dejan de
  // llegarle a 4 personas (pasa al quitar un grupo de una asignación).
  const juntar = <T extends { usuarios: string[] }>(porTitulo: Map<string, T>) => {
    const grupos = new Map<string, { titulos: string[]; dato: T }>()
    for (const [titulo, dato] of porTitulo) {
      const clave = [...dato.usuarios].sort().join()
      const grupo = grupos.get(clave)
      if (grupo) grupo.titulos.push(titulo)
      else grupos.set(clave, { titulos: [titulo], dato })
    }
    return [...grupos.values()]
  }
  const lista = (titulos: string[]) => {
    const citados = titulos.map((t) => `«${t}»`)
    return citados.length === 1 ? citados[0] : `${citados.slice(0, -1).join(', ')} y ${citados.at(-1)}`
  }
  for (const { titulos, dato } of juntar(new Map([...reciben].map(([t, usuarios]) => [t, { usuarios }])))) {
    lineas.push({ id: `recibe-${titulos.join()}`, tono: 'suma', texto: `${lista(titulos)} ${plural(titulos.length, 'les llega', 'les llegan')} a ${personas(dato.usuarios.length)} más` })
  }
  for (const { titulos, dato } of juntar(pierden)) {
    lineas.push({
      id: `pierde-${titulos.join()}`,
      tono: 'resta',
      texto: `${lista(titulos)} ${plural(titulos.length, 'deja', 'dejan')} de llegarle a ${personas(dato.usuarios.length)}`,
      detalle: dato.empezado && titulos.length === 1 ? `${n(dato.empezado)} ya lo ${plural(dato.empezado, 'había', 'habían')} empezado: su avance se conserva.` : dato.empezado ? 'Quien ya había avanzado conserva su avance.' : undefined,
    })
  }

  // Quién se pasó de una asignación a otra: salió de una y entró a otra (perder una de dos no es moverse).
  const nombres = new Map(despues.asignaciones.map((a) => [a.id, nombreAsignacion(a)]))
  const movidas = [...filasDespues.values()].filter((p) => {
    const antesFila = filasAntes.get(p.usuario)
    return antesFila && antesFila.asignaciones.some((id) => !p.asignaciones.includes(id)) && p.asignaciones.some((id) => !antesFila.asignaciones.includes(id))
  })
  if (movidas.length === 1) {
    const nueva = movidas[0].asignaciones.find((id) => !filasAntes.get(movidas[0].usuario)?.asignaciones.includes(id))
    lineas.push({ id: 'movidas', tono: 'cambio', texto: `${movidas[0].nombre} pasa a «${(nueva && nombres.get(nueva)) ?? 'otra asignación'}»` })
  } else if (movidas.length) {
    lineas.push({ id: 'movidas', tono: 'cambio', texto: `${personas(movidas.length)} cambian de asignación`, detalle: quienes(movidas.map((p) => p.nombre)) })
  }

  // Lo que no le llega a nadie todavía: no es un cambio, pero se dice antes de guardar.
  despues.asignaciones.forEach((a) => {
    const nueva = !antes.asignaciones.some((x) => x.id === a.id)
    if (nueva && !a.items.length) lineas.push({ id: `vacia-${a.id}`, tono: 'cambio', texto: `«${nombreAsignacion(a)}» todavía no tiene ${textos.items}`, detalle: 'Hasta que le agregues, esas personas no reciben nada por esta asignación.' })
  })

  return lineas
}

// Lo que dice la barra de abajo.
export const resumenCambios = (lineas: LineaCambio[]) => (lineas.length ? `${lineas.length} ${plural(lineas.length, 'cambio sin guardar', 'cambios sin guardar')}` : 'Sin cambios')
