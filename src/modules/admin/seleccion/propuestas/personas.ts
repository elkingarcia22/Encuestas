import { CANDIDATURAS, RECHAZADAS, fueEmpleado, tituloEtapa } from './datos'
import { familiaDe } from './familias'
import { VACANTES, type Origen } from '../vacantes/detalle/components/data'
import { fechaCorta } from '@/modules/design-system/patrones/formato'

// La base global de candidatos: «Mis candidatos», 533 personas.
//
// Es la otra mitad de Selección. Una vacante es un proceso que empieza y termina; la base es lo que queda después:
// todo el que alguna vez aplicó, se importó o se agregó a mano. Nicolás decidió que sean dos pantallas separadas,
// pero por debajo **una persona es un solo registro**: la misma ficha aparece en las vacantes donde está.
//
// Las 24 primeras son las personas que ya están en proceso (salen de las vacantes de verdad). Las demás se generan
// con una secuencia fija —siempre la misma lista, sin sorpresas entre recargas— para que la búsqueda, los filtros
// y la paginación tengan con qué trabajar.

export type EstadoProceso = 'En proceso' | 'Descartado' | 'Contratado'

// `candidaturaId` y `etapaId` solo en los procesos vivos de estas vacantes: con ellos la base sigue lo que pasa en la
// vacante (si se mueve o se rechaza a la persona, aquí se ve). `motivo`, cuando se descartó.
export type Proceso = {
  vacanteId: string
  vacante: string
  etapa: string
  estado: EstadoProceso
  candidaturaId?: string
  etapaId?: string
  motivo?: string
}

export type Persona = {
  id: string
  nombre: string
  iniciales: string
  correo: string
  cargo: string
  empresa: string
  ciudad: string
  anios: number
  // Por dónde llegó: los de siempre (LinkedIn, Referido…) o el origen de un lote («Feria de empleo», «Correo»).
  origen: Origen | string
  // Cómo entró a la base y hace cuántos días.
  entrada: 'Aplicó a una vacante' | 'Importada en un lote' | 'Agregada a mano' | 'Vino de otra vacante'
  dias: number
  // Llegó sin años de experiencia: no se muestran como «0 años» ni cae en «Hasta 2 años» (MC-15).
  aniosDesconocidos?: boolean
  etiquetas: string[]
  procesos: Proceso[]
  celular: string
  // Lo que sabe hacer: lo de su hoja de vida y lo de su oficio. Se busca por aquí («SQL», «Figma»).
  habilidades: string[]
  // Pidió no recibir más correos: los envíos a varias la dejan fuera y su ficha lo dice.
  noContactar?: boolean
  // Al unir dos fichas, el correo que no quedó como principal; y con quién se unió.
  otrosCorreos?: string[]
  unidaCon?: string
  // El último correo que se le escribió desde la base.
  contacto?: { asunto: string; cuando: number }
  // Entró con un lote (hojas de vida u hoja de cálculo): se ve filtrando por ese lote.
  loteId?: string
}

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')

// Lo que sabe hacer: lo de su hoja de vida primero y después lo de su oficio, sin repetir.
const habilidadesDe = (propias: string[], cargo: string) => [...new Set([...propias, ...familiaDe(cargo).habilidades])]

// ── Las que ya están en proceso ──

const PERSONAS_EN_PROCESO: Persona[] = [...new Map(CANDIDATURAS.map((c) => [c.personaId, c])).values()].map((c) => {
  const suyas = CANDIDATURAS.filter((otra) => otra.personaId === c.personaId)
  return {
    celular: c.candidato.celular,
    habilidades: habilidadesDe(c.candidato.habilidades, c.candidato.cargo),
    id: c.personaId,
    nombre: c.candidato.nombre,
    iniciales: c.candidato.iniciales,
    correo: c.candidato.correo,
    cargo: c.candidato.cargo,
    empresa: c.candidato.empresa,
    ciudad: c.candidato.ciudad,
    anios: c.candidato.anios,
    origen: c.candidato.origen,
    entrada: c.candidato.origen === 'Agregado a mano' ? 'Agregada a mano' : 'Aplicó a una vacante',
    // Desde que aplicó, no desde que llegó a su etapa (MC-12): quien lleva meses en proceso no «entró hoy».
    dias: c.aplico ?? (c.importada || c.postulada ? 0 : c.dias + 6),
    etiquetas: [c.vacante.area, c.candidato.ciudad.split(' ')[0], ...(fueEmpleado(c) ? ['Ex empleado'] : [])],
    procesos: suyas.map((otra) => ({
      vacanteId: otra.vacante.id,
      vacante: otra.vacante.titulo,
      etapa: tituloEtapa(otra.etapa),
      estado: 'En proceso' as EstadoProceso,
      candidaturaId: otra.id,
      etapaId: otra.etapa,
    })),
  }
})

// ── Las que se rechazaron en las vacantes vivas ──
//
// Quien se rechaza no desaparece: sigue en la base, con el proceso «Descartado» y su motivo. Antes no estaban y la base
// no cuadraba con los «Rechazados · N» de cada vacante.
const yaEnProceso = new Set(PERSONAS_EN_PROCESO.map((p) => p.id))
const PERSONAS_RECHAZADAS: Persona[] = [...new Map(RECHAZADAS.map((r) => [r.candidatura.personaId, r])).values()]
  .filter((r) => !yaEnProceso.has(r.candidatura.personaId))
  .map((r) => {
    const c = r.candidatura
    return {
      id: c.personaId,
      nombre: c.candidato.nombre,
      iniciales: c.candidato.iniciales,
      correo: c.candidato.correo,
      celular: c.candidato.celular,
      cargo: c.candidato.cargo,
      empresa: c.candidato.empresa,
      ciudad: c.candidato.ciudad,
      anios: c.candidato.anios,
      origen: c.candidato.origen,
      entrada: 'Aplicó a una vacante' as const,
      dias: c.dias + 3,
      etiquetas: [c.vacante.area, c.candidato.ciudad.split(' ')[0], ...(fueEmpleado(c) ? ['Ex empleado'] : [])],
      habilidades: habilidadesDe(c.candidato.habilidades, c.candidato.cargo),
      procesos: [
        {
          vacanteId: c.vacante.id,
          vacante: c.vacante.titulo,
          etapa: tituloEtapa(c.etapa),
          estado: 'Descartado' as EstadoProceso,
          candidaturaId: c.id,
          etapaId: c.etapa,
          motivo: r.motivo,
        },
      ],
    }
  })

// ── El resto de la base ──

const NOMBRES = [
  'María', 'Juan', 'Camila', 'Andrés', 'Valentina', 'Santiago', 'Daniela', 'Sebastián', 'Laura', 'Nicolás',
  'Paula', 'David', 'Sofía', 'Felipe', 'Mariana', 'Carlos', 'Isabella', 'Diego', 'Juliana', 'Miguel',
  'Catalina', 'Alejandro', 'Ana', 'Ricardo', 'Manuela', 'Óscar', 'Natalia', 'Julián', 'Carolina', 'Esteban',
]

const APELLIDOS = [
  'Gómez', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'Pérez', 'Ramírez', 'Torres', 'Sánchez', 'Vargas',
  'Castro', 'Moreno', 'Jiménez', 'Rojas', 'Álvarez', 'Ospina', 'Cárdenas', 'Mejía', 'Restrepo', 'Quintero',
  'Salazar', 'Duarte', 'Navarro', 'Peña', 'Zapata', 'Bermúdez', 'Guerrero', 'Arango', 'Franco', 'Beltrán',
]

const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Cartagena', 'Manizales']

const EMPRESAS = [
  'Bancolombia', 'Rappi', 'Grupo Éxito', 'Sura', 'Nutresa', 'Tecnoglass', 'Alpina', 'Postobón', 'Corona',
  'Davivienda', 'Claro', 'Avianca', 'Falabella', 'Cementos Argos', 'Terpel', 'Quala',
]

// Cada familia de cargos trae su etiqueta: es lo que Nicolás eligió en vez de carpetas.
const FAMILIAS = [
  { etiqueta: 'Analítica', cargos: ['Analista de datos', 'Ingeniero de datos', 'Analista de BI', 'Científico de datos'] },
  { etiqueta: 'Producto', cargos: ['Diseñador de producto', 'Product owner', 'Investigador de usuarios', 'Diseñador UX'] },
  { etiqueta: 'Operaciones', cargos: ['Coordinador de turno', 'Jefe de planta', 'Auxiliar logístico', 'Supervisor de bodega'] },
  { etiqueta: 'Comercial', cargos: ['Ejecutivo comercial', 'Key account manager', 'Asesor de ventas', 'Gerente de cuenta'] },
  { etiqueta: 'Administración', cargos: ['Asistente de gerencia', 'Analista financiero', 'Auxiliar contable', 'Analista de nómina'] },
  { etiqueta: 'Tecnología', cargos: ['Desarrollador backend', 'Desarrollador frontend', 'QA automatizador', 'Ingeniero de soporte'] },
]

const ORIGENES_BASE: Origen[] = ['LinkedIn', 'Portal de empleo', 'Referido', 'Computrabajo', 'Agregado a mano']

const ENTRADAS: Persona['entrada'][] = ['Aplicó a una vacante', 'Importada en un lote', 'Agregada a mano', 'Vino de otra vacante']

// Secuencia fija: la base es siempre la misma, así se puede hablar de «la persona de la fila 40» sin que cambie.
function secuencia(semilla: number) {
  let estado = semilla
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648
    return estado / 2147483648
  }
}

const TOTAL = 533

// Lo que no estaba en la base de antes (celular, habilidades, «no contactar») sale de otra secuencia, propia de cada
// persona: si saliera de la misma, cambiaría a toda la gente que viene detrás.
function extrasDe(id: string, cargo: string) {
  let h = 0
  for (const letra of id) h = (h * 31 + letra.charCodeAt(0)) % 2147483647
  const azar = secuencia(h || 1)
  azar()
  const celular = `+57 3${10 + Math.floor(azar() * 89)} ${100 + Math.floor(azar() * 899)} ${1000 + Math.floor(azar() * 8999)}`
  const familia = familiaDe(cargo).habilidades
  const cuantas = 3 + Math.floor(azar() * 3)
  const inicio = Math.floor(azar() * familia.length)
  const habilidades = Array.from({ length: cuantas }, (_, n) => familia[(inicio + n) % familia.length])
  return { celular, habilidades: [...new Set(habilidades)], noContactar: azar() > 0.96 }
}

function generar(): Persona[] {
  const azar = secuencia(97)
  const personas: Persona[] = []
  const usados = new Set([...PERSONAS_EN_PROCESO, ...PERSONAS_RECHAZADAS].map((p) => p.correo))
  const cuantas = TOTAL - PERSONAS_EN_PROCESO.length - PERSONAS_RECHAZADAS.length - DUPLICADOS

  for (let i = 0; personas.length < cuantas; i += 1) {
    const nombre = `${NOMBRES[Math.floor(azar() * NOMBRES.length)]} ${APELLIDOS[Math.floor(azar() * APELLIDOS.length)]} ${
      APELLIDOS[Math.floor(azar() * APELLIDOS.length)]
    }`
    const familia = FAMILIAS[Math.floor(azar() * FAMILIAS.length)]
    const ciudad = CIUDADES[Math.floor(azar() * CIUDADES.length)]
    const partes = sinTildes(nombre).toLowerCase().split(' ')
    const correo = `${partes[0][0]}${partes[1]}${i}@correo.com`
    if (usados.has(correo)) continue
    usados.add(correo)

    const anios = 1 + Math.floor(azar() * 12)
    const dias = 1 + Math.floor(azar() * 400)
    const entrada = ENTRADAS[Math.floor(azar() * ENTRADAS.length)]
    const etiquetas = [familia.etiqueta, ciudad]
    if (anios >= 8) etiquetas.push('Senior')
    if (azar() > 0.85) etiquetas.push('Ex empleado')

    // Una de cada seis personas de la base estuvo en un proceso que ya terminó: por eso está aquí y no en la vacante.
    const cerrado = azar()
    // La vacante y su nombre salen del mismo sorteo: antes eran dos y no cuadraban (el nombre decía una vacante y el
    // enlace llevaba a otra). El segundo número se sigue sacando para que el resto de la base no cambie.
    const pasada = cerrado > 0.82 ? VACANTES[Math.floor(azar() * VACANTES.length)] : undefined
    if (pasada) azar()
    const procesos: Proceso[] = pasada
      ? [{ vacanteId: pasada.id, vacante: pasada.titulo, etapa: 'Proceso terminado', estado: cerrado > 0.97 ? 'Contratado' : 'Descartado' }]
      : []

    const cargo = familia.cargos[Math.floor(azar() * familia.cargos.length)]
    personas.push({
      id: `persona-${i}`,
      nombre,
      iniciales: iniciales(nombre),
      correo,
      ...extrasDe(`persona-${i}`, cargo),
      cargo,
      empresa: EMPRESAS[Math.floor(azar() * EMPRESAS.length)],
      ciudad,
      anios,
      origen: ORIGENES_BASE[Math.floor(azar() * ORIGENES_BASE.length)],
      entrada,
      dias,
      etiquetas,
      procesos,
    })
  }

  return personas
}

// ── Posibles duplicados ──
//
// Tres personas que entraron dos veces: con otro correo (el personal y el del trabajo) y el nombre escrito distinto. Es
// lo que pasa de verdad al importar hojas de vida; la base las marca como «Posible duplicado» y se unen en una ficha.
const DUPLICADOS = 3
function duplicadosDe(personas: Persona[]): Persona[] {
  return [40, 95, 160].map((n, indice) => {
    const original = personas[n]
    const [nombre, apellido] = original.nombre.split(' ')
    const usuario = sinTildes(`${nombre}.${apellido}`).toLowerCase()
    return {
      ...original,
      id: `persona-duplicada-${indice + 1}`,
      nombre: `${nombre} ${apellido}`,
      iniciales: iniciales(`${nombre} ${apellido}`),
      correo: `${usuario}@gmail.com`,
      entrada: 'Importada en un lote' as const,
      origen: 'Referido' as Origen,
      dias: 4 + indice * 9,
      etiquetas: original.etiquetas.slice(0, 1),
      procesos: [],
      habilidades: original.habilidades.slice(0, 2),
    }
  })
}

const GENERADAS = generar()

// Las que están en proceso van primero: son las que uno busca de verdad.
export const PERSONAS: Persona[] = [...PERSONAS_EN_PROCESO, ...PERSONAS_RECHAZADAS, ...GENERADAS, ...duplicadosDe(GENERADAS)]

export const ETIQUETAS_PERSONA = [...new Set(PERSONAS.flatMap((p) => p.etiquetas))].sort((a, b) => a.localeCompare(b, 'es'))

export const CIUDADES_PERSONA = [...new Set(PERSONAS.map((p) => p.ciudad))].sort((a, b) => a.localeCompare(b, 'es'))

export const ORIGENES_PERSONA = [...new Set(PERSONAS.map((p) => p.origen))]

// Hace cuánto entró, dicho como se dice en voz alta.
export const hace = (dias: number) => {
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 30) return Math.round(dias / 7) === 1 ? 'hace 1 semana' : `hace ${Math.round(dias / 7)} semanas`
  if (dias < 365) return Math.round(dias / 30) === 1 ? 'hace 1 mes' : `hace ${Math.round(dias / 30)} meses`
  // Con el año (MC-50): «hace más de un año» juntaba a quien entró hace 13 meses con quien entró hace 5 años.
  const anios = Math.floor(dias / 365)
  return anios === 1 ? 'hace 1 año' : `hace ${anios} años`
}

// La fecha en que entró, para el globo de «En la base».
export const fechaDeEntrada = (dias: number) => fechaCorta(new Date(Date.now() - dias * 86_400_000).toLocaleDateString('en-CA'))

export const enProceso = (persona: Persona) => persona.procesos.some((p) => p.estado === 'En proceso')

// El origen tal como lo guarda la ficha de una candidatura (que solo conoce los de siempre): lo de un lote cuenta como
// «Agregado a mano».
export const origenDeFicha = (origen: string): Origen =>
  (ORIGENES_BASE as string[]).includes(origen) ? (origen as Origen) : 'Agregado a mano'
