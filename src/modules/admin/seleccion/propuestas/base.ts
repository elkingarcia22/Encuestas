import { useSyncExternalStore } from 'react'
import type { Candidato } from '../vacantes/detalle/components/data'
import {
  CANDIDATURAS,
  ESPERANDO_ACCION,
  VACANTES_UI,
  ajusteDe,
  cumplidosDe,
  primeraEtapaDe,
  tituloEtapa,
  type Candidatura,
  type Criterio,
  type VacanteUI,
  type Veredicto,
} from './datos'
import { notify } from '@/shared/components/notify'
import { familiaDe } from './familias'
import { QUIEN_MUEVE, nombreDeLista, registroDeMovimientos, type Movimiento } from './movimientos'
import { PERSONAS, hace, origenDeFicha, type EstadoProceso, type Persona, type Proceso } from './personas'

// La base global de candidatos («Mis candidatos»): las reglas y el almacén que comparten las tres exploraciones (25
// sep, Nicolás: «hagamos lo mismo con "Mis candidatos › Consultar base global de candidatos" y "Mis candidatos ›
// Importar candidatos a la base global", que quede todo completo y casos de uso»). Cada exploración la consulta a su
// manera (la 1 como bandeja con la ficha al lado, la 2 como tabla con segmentos, la 3 buscando para una vacante con la
// IA); lo que pasa con la gente es lo mismo en las tres.
//
// Consultar:
// 1. **Buscar** por nombre, correo, cargo, empresa, ciudad y **lo que sabe hacer** («SQL», «Figma»). Varias palabras
//    se suman: «SQL Medellín» es quien sabe SQL y vive en Medellín.
// 2. **Filtrar** por situación (en proceso · libre · se descartó · contratada · posible duplicado), etiquetas, ciudad,
//    experiencia, origen y si entró hace poco.
// 3. **Ordenar** por lo más reciente, la experiencia, el nombre o **qué tanto sirve para una vacante**: la IA compara
//    a cada persona con los requisitos de esa vacante y dice por qué.
// 4. **Búsquedas guardadas**, con su cuenta y «avisarme cuando entre alguien así».
// 5. **Una persona, un registro**: en qué anda en todas las vacantes, al día con lo que se mueve o se rechaza en ellas.
//    Quien entró dos veces sale como **posible duplicado** y se une en una sola ficha.
// 6. **Postular** a una o varias a una vacante abierta: entran de verdad a la vacante (se ven en la bandeja, el
//    pipeline o la cola), a la etapa que se elija. Quien ya está, se descartó ahí o ya la contrataron no entra, y se
//    dice por qué. Si la etapa es de IA, le escribe; si se quiere, se le avisa. Se deshace.
// 7. **Etiquetas** a una o a varias (reemplazan a las carpetas, decisión 8); se crean nuevas al vuelo.
// 8. **Escribirles** con una plantilla. Quien pidió no recibir correos queda fuera, y se dice.
// 9. **Exportar** a CSV.
// 10. **Eliminar sus datos** (derecho de supresión, Ley 1581): dice de qué procesos sale; el aviso trae «Deshacer»
//     unos segundos y después se borra para siempre.
//
// Importar a la base (`importacion-base.ts` y `importacion.ts`): hojas de vida, hoja de cálculo o una persona a mano.

/* El almacén ----------------------------------------------------------------------------------------------------- */

// Vive fuera de las pantallas: lo que se hace en una exploración se ve en las otras dos y al volver.
let personas: Persona[] = PERSONAS
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

export const baseDeCandidatos = {
  leer: () => personas,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  cambiar(cambio: (todas: Persona[]) => Persona[]) {
    personas = cambio(personas)
    avisar()
  },
  // Las nuevas van arriba: es donde se buscan al terminar de importar. Quien no estaba y cumple una búsqueda guardada
  // con el aviso prendido sale en un aviso.
  agregar(nuevas: Persona[]) {
    const ids = new Set(nuevas.map((persona) => persona.id))
    const antes = new Set(personas.map((persona) => persona.id))
    personas = [...nuevas, ...personas.filter((persona) => !ids.has(persona.id))]
    avisar()
    anunciarEnBusquedas(nuevas.filter((persona) => !antes.has(persona.id)))
  },
  quitar(ids: string[]) {
    const fuera = new Set(ids)
    personas = personas.filter((persona) => !fuera.has(persona.id))
    avisar()
  },
  deId: (id: string) => personas.find((persona) => persona.id === id),
  deCorreo: (correo: string) => personas.find((persona) => persona.correo.toLowerCase() === correo.trim().toLowerCase()),
}

export const usePersonasDeLaBase = () => useSyncExternalStore(baseDeCandidatos.suscribir, baseDeCandidatos.leer)

/* En qué anda: al día con las vacantes --------------------------------------------------------------------------- */

// Lo que se movió o se rechazó en una vacante durante la visita se ve aquí: una persona es un solo registro.
export function procesosVivos(persona: Persona, registro: Movimiento[]): Proceso[] {
  return persona.procesos.map((proceso) => {
    if (!proceso.candidaturaId || proceso.estado === 'Contratado') return proceso
    const suyos = registro.filter((movimiento) => movimiento.candidaturaId === proceso.candidaturaId)
    const ultimo = suyos[suyos.length - 1]
    if (!ultimo) return proceso
    if (ultimo.tipo === 'rechazo' || ultimo.tipo === 'retiro')
      return { ...proceso, estado: 'Descartado' as EstadoProceso, etapa: tituloEtapa(ultimo.desde), etapaId: ultimo.desde, motivo: ultimo.motivo }
    return { ...proceso, estado: 'En proceso' as EstadoProceso, etapa: tituloEtapa(ultimo.hacia), etapaId: ultimo.hacia, motivo: undefined }
  })
}

export type Situacion = 'proceso' | 'libre' | 'descartada' | 'contratada'

export function situacionDe(procesos: Proceso[]): Situacion {
  if (procesos.some((proceso) => proceso.estado === 'En proceso')) return 'proceso'
  if (procesos.some((proceso) => proceso.estado === 'Contratado')) return 'contratada'
  if (procesos.some((proceso) => proceso.estado === 'Descartado')) return 'descartada'
  return 'libre'
}

export const SITUACION_TEXTO: Record<Situacion, string> = {
  proceso: 'En proceso',
  libre: 'Libre',
  descartada: 'Se descartó',
  contratada: 'Contratada',
}

export const SITUACION_BADGE: Record<Situacion, 'info-light' | 'secondary' | 'destructive-outline' | 'success-light'> = {
  proceso: 'info-light',
  libre: 'secondary',
  // `destructive-light` queda blanco sobre rosa en el tema claro; el contorno sí se lee.
  descartada: 'destructive-outline',
  contratada: 'success-light',
}

// La línea que dice en qué anda, para las filas: «En Analista de datos · Para revisión», «Libre · entró hace 3 meses».
export function lineaDeSituacion(persona: Persona, procesos: Proceso[]) {
  const vivos = procesos.filter((proceso) => proceso.estado === 'En proceso')
  if (vivos.length > 1) return `En ${vivos.length} procesos: ${vivos.map((proceso) => proceso.vacante).join(' y ')}`
  if (vivos.length) return `En ${vivos[0].vacante} · ${vivos[0].etapa}`
  const contratada = procesos.find((proceso) => proceso.estado === 'Contratado')
  if (contratada) return `La contrataron en ${contratada.vacante}`
  const descartada = procesos.find((proceso) => proceso.estado === 'Descartado')
  if (descartada) return `Se descartó en ${descartada.vacante}${descartada.motivo ? ` · ${descartada.motivo.toLowerCase()}` : ''}`
  return `Libre · entró ${hace(persona.dias)}`
}

/* Posibles duplicados ------------------------------------------------------------------------------------------ */

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
// Sin cargo no se compara: dos personas sin cargo y con el mismo nombre no son por eso la misma (MC-15).
const claveDeDuplicado = (persona: Persona) =>
  persona.cargo ? `${sinTildes(persona.nombre).split(' ').slice(0, 2).join(' ')}|${sinTildes(persona.cargo)}` : persona.id

// La misma persona dos veces: mismo nombre y apellido y mismo cargo, aunque el correo sea otro. Devuelve con quién.
export function posiblesDuplicados(todas: Persona[]): Map<string, string> {
  const grupos = new Map<string, Persona[]>()
  todas.forEach((persona) => {
    const clave = claveDeDuplicado(persona)
    grupos.set(clave, [...(grupos.get(clave) ?? []), persona])
  })
  const pares = new Map<string, string>()
  grupos.forEach((grupo) => {
    if (grupo.length < 2) return
    grupo.forEach((persona) => pares.set(persona.id, grupo.find((otra) => otra.id !== persona.id)!.id))
  })
  return pares
}

/* Qué tanto sirve para una vacante --------------------------------------------------------------------------- */

function semilla(texto: string) {
  let h = 2166136261
  for (const letra of texto) h = Math.imul(h ^ letra.charCodeAt(0), 16777619)
  let t = h >>> 0
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export type Ajuste = { criterios: Criterio[]; cumple: number; total: number; razones: string[] }

const minimoDeAnios = (experiencia: string) => Number(experiencia.match(/\d+/)?.[0] ?? 0)
const viveCerca = (persona: Persona, vacante: VacanteUI) =>
  vacante.modalidad === 'Remoto' || sinTildes(vacante.sede).includes(sinTildes(persona.ciudad))

// La IA compara a la persona con los requisitos de la vacante (con lo que dice su hoja de vida). Si ya está en esa
// vacante, manda lo que se concluyó allá. Fijo por persona y vacante: el mismo resultado cada vez.
export function ajusteParaVacante(persona: Persona, vacante: VacanteUI): Ajuste {
  const mismoOficio = familiaDe(persona.cargo) === familiaDe(vacante.titulo)
  const minimo = minimoDeAnios(vacante.experiencia)
  const cerca = viveCerca(persona, vacante)
  const razones = [
    mismoOficio ? `${persona.cargo}: el mismo oficio` : `Viene de otro oficio (${persona.cargo})`,
    persona.anios >= minimo ? `${persona.anios} años de experiencia (pide ${vacante.experiencia})` : `${persona.anios} años; pide ${vacante.experiencia}`,
    cerca ? (vacante.modalidad === 'Remoto' ? 'La vacante es remota' : `Vive en ${persona.ciudad}`) : `Vive en ${persona.ciudad}; la vacante es en ${vacante.sede}`,
  ]
  const viva = CANDIDATURAS.find((c) => c.personaId === persona.id && c.vacante.id === vacante.id)
  if (viva) return { criterios: viva.criterios, cumple: cumplidosDe(viva.criterios), total: viva.criterios.length, razones }

  const azar = semilla(`${persona.id}|${vacante.id}`)
  // Del mismo oficio casi siempre sirve; de otro, rara vez cumple más de uno.
  const nivel = mismoOficio ? 0.62 + (persona.anios >= minimo ? 0.14 : 0) + (cerca ? 0.08 : 0) + azar() * 0.18 : 0.04 + azar() * 0.16
  const trabajo = `${persona.cargo} en ${persona.empresa}`
  const criterios = vacante.requisitos.map((requisito, indice): Criterio => {
    const r = azar()
    const sorteo: Veredicto = r < nivel ? 'cumple' : r < nivel + 0.22 ? 'parcial' : 'no-cumple'
    // Quien viene de otro oficio no cumple del todo el primer requisito, que es el del oficio: nunca sale «4 de 4».
    const veredicto: Veredicto = !mismoOficio && indice === 0 && sorteo === 'cumple' ? 'parcial' : sorteo
    const evidencia =
      veredicto === 'cumple'
        ? `CV · ${trabajo}, ${persona.anios} ${persona.anios === 1 ? 'año' : 'años'}`
        : veredicto === 'parcial'
          ? `Lo menciona sin detalle · ${trabajo}`
          : 'No aparece en su CV'
    return { requisito, veredicto, evidencia }
  })
  return { criterios, cumple: cumplidosDe(criterios), total: criterios.length, razones }
}

// Las vacantes a las que se puede postular: publicadas (también las que están fuera del portal). Las cerradas y los
// borradores no reciben gente.
export const vacantesAbiertas = () => VACANTES_UI.filter((vacante) => vacante.estado === 'Publicada')

/* Postular a una vacante ---------------------------------------------------------------------------------------- */

// Por qué alguien no puede entrar a una vacante, o qué hay que saber antes.
export type Cupo =
  | { puede: true; tambien?: string[] }
  | { puede: false; por: 'ya-esta' | 'descartada' | 'contratada'; texto: string }

export function cupoEn(procesos: Proceso[], vacante: VacanteUI): Cupo {
  const aqui = procesos.find((proceso) => proceso.vacanteId === vacante.id)
  if (aqui?.estado === 'En proceso') return { puede: false, por: 'ya-esta', texto: `Ya está, en ${aqui.etapa}` }
  if (aqui?.estado === 'Contratado') return { puede: false, por: 'contratada', texto: 'Ya la contrataron en esta vacante' }
  if (aqui?.estado === 'Descartado')
    return {
      puede: false,
      por: 'descartada',
      texto: `Se descartó aquí${aqui.motivo ? ` («${aqui.motivo}»)` : ''}: se vuelve a considerar desde la vacante`,
    }
  const otras = procesos.filter((proceso) => proceso.estado === 'En proceso').map((proceso) => proceso.vacante)
  return { puede: true, tambien: otras.length ? otras : undefined }
}

// Una persona de la base convertida en candidatura. Si ya tiene ficha completa (está en otro proceso), se reusa: es
// la misma persona. Si no, se arma con lo que sabe la base. Entra ya comparada con los requisitos.
export function candidaturaDesdeLaBase(persona: Persona, vacante: VacanteUI, etapa: string): Candidatura {
  const existente = CANDIDATURAS.find((c) => c.personaId === persona.id)?.candidato
  const { criterios } = ajusteParaVacante(persona, vacante)
  const candidato: Candidato = existente ?? {
    id: persona.id,
    nombre: persona.nombre,
    iniciales: persona.iniciales,
    correo: persona.correo,
    celular: persona.celular,
    origen: origenDeFicha(persona.origen),
    etapa: 'cv',
    dias: 0,
    ajuste: 0,
    cargo: persona.cargo,
    empresa: persona.empresa,
    ciudad: persona.ciudad,
    anios: persona.anios,
    // Lo que pide y cuándo puede empezar no lo dijo: se pregunta (CA-25). Los números solo sirven para ordenar.
    pretension: vacante.rango[1],
    disponibilidad: 30,
    sinDeclarar: ['pretension', 'disponibilidad'],
    resumen: `${persona.cargo} en ${persona.empresa}, con ${persona.anios} años de experiencia. Vino de tu base de candidatos.`,
    trayectoria: [{ cargo: persona.cargo, empresa: persona.empresa, periodo: `${2026 - Math.min(persona.anios, 3)} – hoy` }],
    habilidades: persona.habilidades.slice(0, 4),
    respuestas: [],
    requisitos: criterios.map((criterio) =>
      criterio.veredicto === 'cumple' ? 'Cumple' : criterio.veredicto === 'parcial' ? 'Parcial' : criterio.veredicto === 'no-cumple' ? 'No cumple' : 'Por validar',
    ),
    fortalezas: [],
    riesgos: [],
    notas: [],
  }
  return {
    id: `${persona.id}@${vacante.id}`,
    personaId: persona.id,
    candidato,
    vacante,
    etapa,
    dias: 0,
    ajuste: ajusteDe(criterios),
    criterios,
    postulada: { quien: QUIEN_MUEVE, cuando: Date.now() },
  }
}

// Las candidaturas que entraron desde la base en esta visita. Como las de los lotes, viven aquí: el proceso de cada
// vacante las suma a su lista aunque la vacante no esté abierta cuando se postula.
export type EventoPostuladas = { tipo: 'entraron'; candidaturas: Candidatura[] } | { tipo: 'salieron'; ids: string[] }
let postuladas: Candidatura[] = []
const oyentesPostuladas = new Set<(evento: EventoPostuladas) => void>()

export const registroDePostuladas = {
  todas: () => postuladas,
  escuchar: (oyente: (evento: EventoPostuladas) => void) => {
    oyentesPostuladas.add(oyente)
    return () => {
      oyentesPostuladas.delete(oyente)
    }
  },
}
const avisarPostuladas = (evento: EventoPostuladas) => oyentesPostuladas.forEach((oyente) => oyente(evento))

// Entran a la vacante. Devuelve cómo deshacerlo.
export function postular(elegidas: Persona[], vacante: VacanteUI, etapa = primeraEtapaDe(vacante.etapas)) {
  const nuevas = elegidas.map((persona) => candidaturaDesdeLaBase(persona, vacante, etapa))
  postuladas = [...nuevas, ...postuladas]
  const ids = new Set(elegidas.map((persona) => persona.id))
  baseDeCandidatos.cambiar((todas) =>
    todas.map((persona) =>
      ids.has(persona.id)
        ? {
            ...persona,
            procesos: [
              ...persona.procesos,
              {
                vacanteId: vacante.id,
                vacante: vacante.titulo,
                etapa: tituloEtapa(etapa),
                etapaId: etapa,
                estado: 'En proceso',
                candidaturaId: `${persona.id}@${vacante.id}`,
              },
            ],
          }
        : persona,
    ),
  )
  avisarPostuladas({ tipo: 'entraron', candidaturas: nuevas })
  return () => {
    const fuera = new Set(nuevas.map((c) => c.id))
    postuladas = postuladas.filter((c) => !fuera.has(c.id))
    baseDeCandidatos.cambiar((todas) =>
      todas.map((persona) =>
        ids.has(persona.id) ? { ...persona, procesos: persona.procesos.filter((proceso) => !fuera.has(proceso.candidaturaId ?? '')) } : persona,
      ),
    )
    avisarPostuladas({ tipo: 'salieron', ids: [...fuera] })
  }
}

// Quien queda seleccionada al cerrar una vacante pasa a «Contratada» en la base (MC-26). Devuelve cómo deshacerlo.
export function marcarContratadas(candidaturaIds: string[]) {
  if (!candidaturaIds.length) return () => {}
  const ids = new Set(candidaturaIds)
  const cambiarA = (estado: EstadoProceso) =>
    baseDeCandidatos.cambiar((todas) =>
      todas.map((persona) =>
        persona.procesos.some((proceso) => ids.has(proceso.candidaturaId ?? ''))
          ? { ...persona, procesos: persona.procesos.map((proceso) => (ids.has(proceso.candidaturaId ?? '') ? { ...proceso, estado } : proceso)) }
          : persona,
      ),
    )
  cambiarA('Contratado')
  return () => cambiarA('En proceso')
}

// Quien se suma desde una vacante («Agregar candidatos») también queda anotado en su registro de la base.
export function anotarProcesos(candidaturas: Candidatura[]) {
  const por = new Map(candidaturas.map((c) => [c.personaId, c]))
  baseDeCandidatos.cambiar((todas) =>
    todas.map((persona) => {
      const c = por.get(persona.id)
      if (!c || persona.procesos.some((proceso) => proceso.candidaturaId === c.id)) return persona
      return {
        ...persona,
        procesos: [
          ...persona.procesos,
          { vacanteId: c.vacante.id, vacante: c.vacante.titulo, etapa: tituloEtapa(c.etapa), etapaId: c.etapa, estado: 'En proceso', candidaturaId: c.id },
        ],
      }
    }),
  )
}

/* Etiquetas ---------------------------------------------------------------------------------------------------- */

export const etiquetasDeLaBase = (todas: Persona[]) => [...new Set(todas.flatMap((persona) => persona.etiquetas))].sort((a, b) => a.localeCompare(b, 'es'))

// Poner y quitar a varias a la vez. Devuelve cómo deshacerlo.
export function etiquetar(ids: string[], ponerEscritas: string[], quitar: string[]) {
  const existentes = etiquetasDeLaBase(baseDeCandidatos.leer())
  const poner = ponerEscritas.map((etiqueta) => normalizarEtiqueta(etiqueta, existentes))
  const antes = new Map(baseDeCandidatos.leer().filter((persona) => ids.includes(persona.id)).map((persona) => [persona.id, persona.etiquetas]))
  baseDeCandidatos.cambiar((todas) =>
    todas.map((persona) =>
      antes.has(persona.id)
        ? { ...persona, etiquetas: [...new Set([...persona.etiquetas.filter((una) => !quitar.includes(una)), ...poner])] }
        : persona,
    ),
  )
  return () => baseDeCandidatos.cambiar((todas) => todas.map((persona) => (antes.has(persona.id) ? { ...persona, etiquetas: antes.get(persona.id)! } : persona)))
}

/* Escribirles ---------------------------------------------------------------------------------------------------- */

export type PlantillaBase = { id: string; titulo: string; asunto: string; texto: string }

export const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    id: 'interes',
    titulo: '¿Sigues buscando?',
    asunto: '¿Sigues buscando nuevas oportunidades?',
    texto: 'Hola {nombre}, hace un tiempo nos compartiste tu CV. ¿Sigues buscando? Si es así, cuéntanos y te tenemos en cuenta para las vacantes que vienen.',
  },
  {
    id: 'vacante',
    titulo: 'Una vacante para ti',
    asunto: 'Tenemos una vacante que te puede interesar',
    texto: 'Hola {nombre}, abrimos una vacante que encaja con tu experiencia como {cargo}. Si te interesa, responde este correo y te contamos los detalles.',
  },
  {
    id: 'datos',
    titulo: 'Actualiza tus datos',
    asunto: 'Actualiza tu CV',
    texto: 'Hola {nombre}, queremos tener tu información al día. Si cambiaste de trabajo o de ciudad, responde este correo con tu CV más reciente.',
  },
]

// Quién recibe y quién no: quien pidió no recibir correos queda fuera, y quien no tiene correo también (MC-21).
export const destinatarios = <T extends Persona>(elegidas: T[]) => ({
  reciben: elegidas.filter((persona) => !persona.noContactar && persona.correo),
  fuera: elegidas.filter((persona) => persona.noContactar),
  sinCorreo: elegidas.filter((persona) => !persona.noContactar && !persona.correo),
})

// Devuelve cómo deshacerlo: el correo sale con el aviso, así que «Deshacer» lo frena y la ficha vuelve a lo de antes.
export function anotarCorreo(ids: string[], asunto: string) {
  const cuando = Date.now()
  const antes = new Map(baseDeCandidatos.leer().filter((persona) => ids.includes(persona.id)).map((persona) => [persona.id, persona.contacto]))
  baseDeCandidatos.cambiar((todas) => todas.map((persona) => (ids.includes(persona.id) ? { ...persona, contacto: { asunto, cuando } } : persona)))
  return () => baseDeCandidatos.cambiar((todas) => todas.map((persona) => (antes.has(persona.id) ? { ...persona, contacto: antes.get(persona.id) } : persona)))
}

/* Exportar ----------------------------------------------------------------------------------------------------- */

export function exportarCsv(elegidas: Persona[], registro: Movimiento[], nombre = 'mis-candidatos') {
  const celda = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`
  // El celular va como texto: «+57 …» Excel lo leía como una fórmula (MC-22).
  const comoTexto = (valor: string) => (valor ? `="${valor}"` : '')
  const filas = [
    ['Nombre', 'Correo', 'Celular', 'Cargo', 'Empresa', 'Ciudad', 'Años de experiencia', 'Etiquetas', 'En qué anda', 'Pidió no recibir correos'],
    ...elegidas.map((persona) => [
      persona.nombre,
      persona.correo,
      comoTexto(persona.celular),
      persona.cargo,
      persona.empresa,
      persona.ciudad,
      persona.anios,
      persona.etiquetas.join(' · '),
      lineaDeSituacion(persona, procesosVivos(persona, registro)),
      persona.noContactar ? 'Sí' : 'No',
    ]),
  ]
  // Punto y coma: es lo que espera Excel en español (con coma, todo caía en una columna).
  const csv = filas.map((fila) => fila.map((valor) => (String(valor).startsWith('="') ? valor : celda(valor))).join(';')).join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `${nombre}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

/* Eliminar sus datos ----------------------------------------------------------------------------------------- */

export const MOTIVOS_ELIMINAR = [
  'La persona pidió que borremos sus datos',
  'Está repetida o los datos están mal',
  'Pasó el tiempo que guardamos los datos',
  'Otro motivo',
]

// Se quita de la base y de los procesos donde está. Devuelve cómo deshacerlo mientras el aviso sigue a la vista.
export function eliminar(ids: string[]) {
  const quitadas = baseDeCandidatos.leer().filter((persona) => ids.includes(persona.id))
  const candidaturas = quitadas.flatMap((persona) => persona.procesos.map((proceso) => proceso.candidaturaId).filter((id): id is string => Boolean(id)))
  const lugares = baseDeCandidatos.leer().flatMap((persona, indice) => (ids.includes(persona.id) ? [{ persona, indice }] : []))
  baseDeCandidatos.quitar(ids)
  if (candidaturas.length) avisarPostuladas({ tipo: 'salieron', ids: candidaturas })
  // Deshacer devuelve solo a quienes se eliminaron, a su lugar: lo que se hizo después en la base se queda (MC-23).
  return () => {
    baseDeCandidatos.cambiar((todas) => {
      const copia = [...todas]
      lugares.forEach(({ persona, indice }) => {
        if (!copia.some((una) => una.id === persona.id)) copia.splice(Math.min(indice, copia.length), 0, persona)
      })
      return copia
    })
    const vuelven = [...CANDIDATURAS, ...postuladas].filter((c) => candidaturas.includes(c.id))
    if (vuelven.length) avisarPostuladas({ tipo: 'entraron', candidaturas: vuelven })
  }
}

/* Unir dos fichas ------------------------------------------------------------------------------------------------ */

export type CampoUnible = 'nombre' | 'correo' | 'celular' | 'cargo' | 'ciudad'
export const CAMPOS_UNIBLES: { campo: CampoUnible; texto: string }[] = [
  { campo: 'nombre', texto: 'Nombre' },
  { campo: 'correo', texto: 'Correo' },
  { campo: 'celular', texto: 'Celular' },
  { campo: 'cargo', texto: 'Cargo actual' },
  { campo: 'ciudad', texto: 'Ciudad' },
]

// Queda una ficha con los datos que se eligieron, todas las etiquetas, habilidades y procesos de las dos, y el otro
// correo como correo alterno. Devuelve cómo deshacerlo.
export function unir(principal: Persona, otra: Persona, elegido: Record<CampoUnible, 'principal' | 'otra'>) {
  const antes = baseDeCandidatos.leer()
  const dato = (campo: CampoUnible) => (elegido[campo] === 'otra' ? otra[campo] : principal[campo])
  const correo = dato('correo')
  const unida: Persona = {
    ...principal,
    nombre: dato('nombre'),
    iniciales: elegido.nombre === 'otra' ? otra.iniciales : principal.iniciales,
    correo,
    celular: dato('celular'),
    cargo: dato('cargo'),
    ciudad: dato('ciudad'),
    otrosCorreos: [...new Set([principal.correo, otra.correo, ...(principal.otrosCorreos ?? []), ...(otra.otrosCorreos ?? [])])].filter((uno) => uno !== correo),
    etiquetas: [...new Set([...principal.etiquetas, ...otra.etiquetas])],
    habilidades: [...new Set([...principal.habilidades, ...otra.habilidades])],
    procesos: [...principal.procesos, ...otra.procesos.filter((proceso) => !principal.procesos.some((uno) => uno.vacanteId === proceso.vacanteId))],
    dias: Math.max(principal.dias, otra.dias),
    unidaCon: otra.nombre,
  }
  const lugarDeLaOtra = antes.findIndex((persona) => persona.id === otra.id)
  const original = antes.find((persona) => persona.id === principal.id) ?? principal
  baseDeCandidatos.cambiar((todas) => todas.filter((persona) => persona.id !== otra.id).map((persona) => (persona.id === principal.id ? unida : persona)))
  // Deshacer separa solo estas dos fichas; lo demás que pasó en la base se queda (MC-23).
  return () =>
    baseDeCandidatos.cambiar((todas) => {
      const copia = todas.map((persona) => (persona.id === principal.id ? original : persona))
      if (!copia.some((persona) => persona.id === otra.id)) copia.splice(Math.max(0, Math.min(lugarDeLaOtra, copia.length)), 0, otra)
      return copia
    })
}

/* Buscar y filtrar ------------------------------------------------------------------------------------------ */

export type Experiencia = 'todas' | '0-2' | '3-5' | '6-9' | '10+'
export const EXPERIENCIAS: { valor: Experiencia; texto: string }[] = [
  { valor: 'todas', texto: 'Cualquier experiencia' },
  { valor: '0-2', texto: 'Hasta 2 años' },
  { valor: '3-5', texto: 'De 3 a 5 años' },
  { valor: '6-9', texto: 'De 6 a 9 años' },
  { valor: '10+', texto: '10 años o más' },
]
const enRango = (anios: number, experiencia: Experiencia) =>
  experiencia === 'todas' ||
  (experiencia === '0-2' && anios <= 2) ||
  (experiencia === '3-5' && anios >= 3 && anios <= 5) ||
  (experiencia === '6-9' && anios >= 6 && anios <= 9) ||
  (experiencia === '10+' && anios >= 10)

export type Orden = 'recientes' | 'experiencia' | 'nombre' | 'ajuste'
export const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'recientes', texto: 'Lo más reciente' },
  { valor: 'experiencia', texto: 'Más experiencia' },
  { valor: 'nombre', texto: 'Por nombre' },
  { valor: 'ajuste', texto: 'Qué tanto sirve' },
]

export type FiltroSituacion = 'todas' | Situacion | 'duplicados'
export type Sentido = 'normal' | 'inverso'

export type FiltrosBase = {
  texto: string
  situacion: FiltroSituacion
  etiquetas: string[]
  ciudad: string
  experiencia: Experiencia
  origen: string
  // Entró en los últimos 30 días.
  recientes: boolean
  // Espera algo de quien recluta en alguna vacante (la «acción requerida» del producto): «Esperando acción».
  esperan: boolean
  // 13 oct (reunión con la PM y el TL): la ubicación es país y ciudad, en ese orden; y en vez de los grupos de abajo
  // (libres, descartadas, contratadas), dos casillas en «Filtros»: en algún proceso y posibles duplicados.
  pais: string
  enProceso: boolean
  duplicados: boolean
  // Compararlas con una vacante: la IA dice qué tanto sirve cada una.
  paraVacante: string | null
  orden: Orden
  sentido: Sentido
}

export const SIN_FILTROS: FiltrosBase = {
  texto: '',
  situacion: 'todas',
  etiquetas: [],
  ciudad: 'todas',
  experiencia: 'todas',
  origen: 'todas',
  recientes: false,
  esperan: false,
  pais: 'todas',
  enProceso: false,
  duplicados: false,
  paraVacante: null,
  orden: 'recientes',
  sentido: 'normal',
}

export const hayFiltros = (filtros: FiltrosBase) =>
  Boolean(filtros.texto.trim()) ||
  filtros.situacion !== 'todas' ||
  filtros.etiquetas.length > 0 ||
  filtros.pais !== 'todas' ||
  filtros.ciudad !== 'todas' ||
  filtros.experiencia !== 'todas' ||
  filtros.origen !== 'todas' ||
  filtros.recientes ||
  filtros.esperan ||
  filtros.enProceso ||
  filtros.duplicados ||
  Boolean(filtros.paraVacante)

// Las palabras que no buscan nada en una frase: «Analista con SQL en Medellín» busca «analista», «sql» y «medellín» (MC-29).
const RELLENO = new Set(['con', 'que', 'sepa', 'sepan', 'sabe', 'saben', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'a', 'para', 'persona', 'personas', 'gente', 'alguien', 'busco', 'quien', 'quienes', 'un', 'una', 'unos', 'unas'])
export const palabrasDe = (texto: string) =>
  sinTildes(texto)
    .split(/\s+/)
    .filter((palabra) => palabra && !RELLENO.has(palabra))

// Cada palabra tiene que estar en algún dato de la persona: su nombre, correo, cargo, empresa, ciudad, lo que sabe, sus
// etiquetas o su celular, escrito como sea («300 555 1289», «+57 3005551289») (MC-28).
export function coincideTexto(persona: Persona, texto: string) {
  const palabras = palabrasDe(texto)
  if (!palabras.length) return true
  const digitos = persona.celular.replace(/\D/g, '')
  const donde = sinTildes(
    [persona.nombre, persona.correo, persona.cargo, persona.empresa, persona.ciudad, ...persona.habilidades, ...persona.etiquetas, ...(persona.otrosCorreos ?? []), digitos, digitos.slice(-10)].join(' '),
  )
  return palabras.every((palabra) => donde.includes(/^\+?[\d-]+$/.test(palabra) ? palabra.replace(/\D/g, '') : palabra))
}

// Si lo que se escribe es un nombre —cada palabra empieza un nombre o un apellido—, se busca por nombre (MC-13): «Ana»
// traía a media base porque «Analista» contiene «ana».
export function coincideNombre(persona: Persona, texto: string) {
  const palabras = palabrasDe(texto)
  const partes = sinTildes(persona.nombre).split(/\s+/)
  return palabras.length > 0 && palabras.every((palabra) => partes.some((parte) => parte.startsWith(palabra)))
}
export const buscaPorNombre = (todas: Persona[], texto: string) => Boolean(palabrasDe(texto).length) && todas.some((persona) => coincideNombre(persona, texto))

// Lo que sabe hacer que coincide con la búsqueda: se resalta en la fila para que se vea por qué salió.
export const habilidadesQueCoinciden = (persona: Persona, texto: string) => {
  const palabras = sinTildes(texto).split(/\s+/).filter((palabra) => palabra.length > 1)
  return persona.habilidades.filter((habilidad) => palabras.some((palabra) => sinTildes(habilidad).includes(palabra)))
}

export type PersonaViva = Persona & {
  vivos: Proceso[]
  situacion: Situacion
  duplicadoDe?: string
  ajuste?: Ajuste
  // Lo que espera de quien recluta en una vacante donde sigue en proceso («acción requerida»): lo mismo que dice
  // «Espera» en la bandeja de esa vacante.
  espera?: { accion: string; vacante: string; candidaturaId: string }
}

// Lo que cada candidatura espera del equipo, leído al momento; si después se la movió o se le escribió, ya se atendió y
// deja de esperar (MC-19).
// Solo lo que espera al equipo («Esperando acción»): lo que le falta hacer a la persona, como agendar con Serena, no.
function esperaDe(vivos: Proceso[], registro: Movimiento[]): PersonaViva['espera'] {
  for (const proceso of vivos) {
    if (proceso.estado !== 'En proceso' || !proceso.candidaturaId) continue
    const candidatura = CANDIDATURAS.find((c) => c.id === proceso.candidaturaId)
    const accion = candidatura && ESPERANDO_ACCION(candidatura) ? candidatura.candidato.accion : undefined
    if (accion && !registro.some((movimiento) => movimiento.candidaturaId === proceso.candidaturaId))
      return { accion, vacante: proceso.vacante, candidaturaId: proceso.candidaturaId }
  }
  return undefined
}

// El país de una ciudad: la ubicación se filtra por país y después por ciudad (13 oct, PM). Lo que no está en la lista
// es de Colombia, donde vive casi toda la base de la maqueta.
const PAISES: Record<string, string> = { 'ciudad de mexico': 'México', monterrey: 'México', guadalajara: 'México', lima: 'Perú', santiago: 'Chile', quito: 'Ecuador' }
export const paisDe = (ciudad: string) => PAISES[sinTildes(ciudad)] ?? 'Colombia'

// Dónde vive, con su país, para la cabecera de la ficha: «Bogotá, Colombia».
export const ubicacionDe = (ciudad: string) => (ciudad ? `${ciudad}, ${paisDe(ciudad)}` : 'Sin ciudad registrada')

// Las personas con lo que hace falta para mostrarlas: sus procesos al día, su situación, si parece duplicada y, si se
// está comparando con una vacante, qué tanto sirve.
export function vivas(todas: Persona[], registro: Movimiento[], paraVacante: VacanteUI | null): PersonaViva[] {
  const duplicados = posiblesDuplicados(todas)
  return todas.map((persona) => {
    const vivos = procesosVivos(persona, registro)
    return {
      ...persona,
      vivos,
      situacion: situacionDe(vivos),
      espera: esperaDe(vivos, registro),
      duplicadoDe: duplicados.get(persona.id),
      ajuste: paraVacante ? ajusteParaVacante(persona, paraVacante) : undefined,
    }
  })
}

// `enTodo`: buscar el texto en todos los datos aunque coincida con nombres (MC-13).
export function filtrarBase(todas: PersonaViva[], filtros: FiltrosBase, sin?: keyof FiltrosBase, opciones: { enTodo?: boolean } = {}): PersonaViva[] {
  const pasa = (campo: keyof FiltrosBase) => campo !== sin
  const porNombre = pasa('texto') && !opciones.enTodo && buscaPorNombre(todas, filtros.texto)
  return todas.filter((persona) => {
    if (pasa('texto') && !(porNombre ? coincideNombre(persona, filtros.texto) : coincideTexto(persona, filtros.texto))) return false
    if (pasa('situacion') && filtros.situacion === 'duplicados' && !persona.duplicadoDe) return false
    if (pasa('situacion') && filtros.situacion !== 'todas' && filtros.situacion !== 'duplicados' && persona.situacion !== filtros.situacion) return false
    if (pasa('etiquetas') && filtros.etiquetas.length && !filtros.etiquetas.every((etiqueta) => persona.etiquetas.includes(etiqueta))) return false
    if (pasa('pais') && filtros.pais !== 'todas' && paisDe(persona.ciudad) !== filtros.pais) return false
    if (pasa('ciudad') && filtros.ciudad !== 'todas' && persona.ciudad !== filtros.ciudad) return false
    if (pasa('enProceso') && filtros.enProceso && persona.situacion !== 'proceso') return false
    if (pasa('duplicados') && filtros.duplicados && !persona.duplicadoDe) return false
    // Sin años registrados no cae en «Hasta 2 años» (MC-15).
    if (pasa('experiencia') && (filtros.experiencia === 'todas' ? false : persona.aniosDesconocidos || !enRango(persona.anios, filtros.experiencia))) return false
    if (pasa('origen') && filtros.origen !== 'todas' && persona.origen !== filtros.origen) return false
    if (pasa('recientes') && filtros.recientes && persona.dias > 30) return false
    if (pasa('esperan') && filtros.esperan && !persona.espera) return false
    return true
  })
}

// `inverso`: el otro sentido de la misma columna (MC-51): de la Z a la A, menos experiencia, lo más antiguo, lo que menos sirve.
export function ordenarBase(lista: PersonaViva[], orden: Orden, sentido: Sentido = 'normal'): PersonaViva[] {
  const copia = [...lista]
  const ordenada =
    orden === 'nombre'
      ? copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      : orden === 'experiencia'
        ? copia.sort((a, b) => b.anios - a.anios)
        : orden === 'ajuste'
          ? copia.sort((a, b) => (b.ajuste ? b.ajuste.cumple / (b.ajuste.total || 1) : 0) - (a.ajuste ? a.ajuste.cumple / (a.ajuste.total || 1) : 0) || a.dias - b.dias)
          : copia.sort((a, b) => a.dias - b.dias)
  return sentido === 'inverso' ? ordenada.reverse() : ordenada
}

/* Buscar como se pregunta (la exploración 3) --------------------------------------------------------------------- */

// «Analista con SQL en Medellín, libre, más de 5 años»: lo que la IA entiende se vuelve filtros que se ven y se quitan.
// Lo que no reconoce queda como texto a buscar.
export type Entendido = { etiqueta: string; aplica: Partial<FiltrosBase> }

export function interpretarBusqueda(frase: string, ciudades: string[], habilidades: string[]): { filtros: Partial<FiltrosBase>; entendido: Entendido[] } {
  // Las comas y los puntos separan ideas («…en Medellín, libre»): se vuelven espacios para reconocer cada parte.
  let resto = ` ${sinTildes(frase).replace(/[,.;:]/g, ' ')} `
  const entendido: Entendido[] = []
  const filtros: Partial<FiltrosBase> = {}
  const quitar = (patron: RegExp) => {
    resto = resto.replace(patron, ' ')
  }

  const ciudad = ciudades.find((una) => resto.includes(` ${sinTildes(una)} `))
  if (ciudad) {
    filtros.ciudad = ciudad
    entendido.push({ etiqueta: `Vive en ${ciudad}`, aplica: { ciudad } })
    quitar(new RegExp(`\\s(en\\s)?${sinTildes(ciudad)}\\s`))
  }
  const anios = resto.match(/(?:mas de|minimo|al menos|\+)\s*(\d+)\s*anos?|(\d+)\s*\+?\s*anos?/)
  if (anios) {
    const n = Number(anios[1] ?? anios[2])
    const experiencia: Experiencia = n >= 10 ? '10+' : n >= 6 ? '6-9' : n >= 3 ? '3-5' : '0-2'
    filtros.experiencia = experiencia
    entendido.push({ etiqueta: EXPERIENCIAS.find((una) => una.valor === experiencia)!.texto, aplica: { experiencia } })
    quitar(/(?:con\s)?(?:mas de|minimo|al menos|\+)?\s*\d+\s*\+?\s*anos?(?:\sde experiencia)?/)
  }
  if (/\slibres?\s|\ssin proceso\s|\sdisponibles?\s/.test(resto)) {
    filtros.situacion = 'libre'
    entendido.push({ etiqueta: 'Libres', aplica: { situacion: 'libre' } })
    quitar(/\s(libres?|sin proceso|disponibles?)\s/)
  } else if (/\sen proceso\s/.test(resto)) {
    filtros.situacion = 'proceso'
    entendido.push({ etiqueta: 'En proceso', aplica: { situacion: 'proceso' } })
    quitar(/\sen proceso\s/)
  } else if (/\sdescartad[oa]s?\s/.test(resto)) {
    filtros.situacion = 'descartada'
    entendido.push({ etiqueta: 'Se descartaron antes', aplica: { situacion: 'descartada' } })
    quitar(/\sdescartad[oa]s?\s/)
  }
  if (/\sex ?emplead[oa]s?\s/.test(resto)) {
    filtros.etiquetas = [...(filtros.etiquetas ?? []), 'Ex empleado']
    entendido.push({ etiqueta: 'Ex empleados', aplica: { etiquetas: ['Ex empleado'] } })
    quitar(/\sex ?emplead[oa]s?\s/)
  }
  const sabe = habilidades.filter((habilidad) => resto.includes(` ${sinTildes(habilidad)} `))
  sabe.forEach((habilidad) => {
    entendido.push({ etiqueta: `Sabe ${habilidad}`, aplica: {} })
  })
  // Palabras de relleno que no buscan nada.
  const texto = resto
    .replace(/\s(con|que|sepa|sepan|sabe|saben|de|del|la|el|los|las|y|en|a|para|personas?|gente|alguien|busco|buscame|quien|quienes|un|una|unos|unas)\s/g, ' ')
    .replace(/\s(con|que|sepa|de|y|en|para)\s/g, ' ')
    .replace(/[,.;]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  filtros.texto = texto
  if (texto && !sabe.length) entendido.push({ etiqueta: `«${texto}»`, aplica: {} })
  return { filtros, entendido }
}

/* Búsquedas guardadas ------------------------------------------------------------------------------------------ */

export type Busqueda = { id: string; nombre: string; filtros: FiltrosBase; avisar: boolean }

let busquedas: Busqueda[] = [
  { id: 'b1', nombre: 'Analítica libre en Bogotá', filtros: { ...SIN_FILTROS, texto: 'SQL', situacion: 'libre', ciudad: 'Bogotá' }, avisar: true },
  { id: 'b2', nombre: 'Ex empleados con experiencia', filtros: { ...SIN_FILTROS, etiquetas: ['Ex empleado'], experiencia: '6-9' }, avisar: false },
]
const oyentesBusquedas = new Set<() => void>()
const avisarBusquedas = () => oyentesBusquedas.forEach((oyente) => oyente())
let siguienteBusqueda = 3

export const busquedasGuardadas = {
  leer: () => busquedas,
  suscribir: (oyente: () => void) => {
    oyentesBusquedas.add(oyente)
    return () => {
      oyentesBusquedas.delete(oyente)
    }
  },
  guardar(nombre: string, filtros: FiltrosBase, avisar: boolean) {
    const nueva = { id: `b${siguienteBusqueda++}`, nombre, filtros, avisar }
    busquedas = [nueva, ...busquedas]
    avisarBusquedas()
    return nueva
  },
  quitar(id: string) {
    busquedas = busquedas.filter((una) => una.id !== id)
    avisarBusquedas()
  },
  alternarAviso(id: string) {
    busquedas = busquedas.map((una) => (una.id === id ? { ...una, avisar: !una.avisar } : una))
    avisarBusquedas()
  },
}

export const useBusquedasGuardadas = () => useSyncExternalStore(busquedasGuardadas.suscribir, busquedasGuardadas.leer)

// «Avisarme cuando entre alguien así»: al sumar gente a la base (un lote de hojas de vida, una hoja de cálculo, a mano),
// quien cumple una búsqueda guardada con el aviso prendido sale en un aviso, venga de la pantalla que venga. Cada persona
// se anuncia una vez por búsqueda: si sale y vuelve a entrar (se deshizo un lote), no se repite. Va un momento después
// del aviso de la importación, para que se lean en orden.
const anunciadas = new Set<string>()
function anunciarEnBusquedas(nuevas: Persona[]) {
  const conAviso = busquedas.filter((busqueda) => busqueda.avisar)
  if (!nuevas.length || !conAviso.length) return
  const ids = new Set(nuevas.map((persona) => persona.id))
  // Con toda la base: un duplicado solo se reconoce comparando con los demás.
  const recien = vivas(personas, registroDeMovimientos.leer(), null).filter((persona) => ids.has(persona.id))
  conAviso.forEach((busqueda) => {
    const cumplen = filtrarBase(recien, busqueda.filtros).filter((persona) => !anunciadas.has(`${busqueda.id}|${persona.id}`))
    if (!cumplen.length) return
    cumplen.forEach((persona) => anunciadas.add(`${busqueda.id}|${persona.id}`))
    const [una] = cumplen
    const nombres = cumplen.slice(0, 3).map((persona) => persona.nombre)
    window.setTimeout(
      () =>
        notify(
          cumplen.length === 1 ? `Entró alguien para «${busqueda.nombre}»` : `Entraron ${cumplen.length} personas para «${busqueda.nombre}»`,
          cumplen.length === 1
            ? `${una.nombre} · ${una.cargo}.`
            : `${nombreDeLista(cumplen.length > 3 ? [...nombres, `${cumplen.length - 3} más`] : nombres)}.`, 'info',
        ),
      700,
    )
  })
}

// Cómo se describe una búsqueda en una línea: «SQL · Libres · Bogotá».
export function describirFiltros(filtros: FiltrosBase) {
  const partes = [
    filtros.texto.trim() ? `«${filtros.texto.trim()}»` : null,
    filtros.situacion !== 'todas' ? (filtros.situacion === 'duplicados' ? 'Posibles duplicados' : SITUACION_TEXTO[filtros.situacion]) : null,
    ...filtros.etiquetas,
    filtros.ciudad !== 'todas' ? filtros.ciudad : filtros.pais !== 'todas' ? filtros.pais : null,
    filtros.experiencia !== 'todas' ? EXPERIENCIAS.find((una) => una.valor === filtros.experiencia)?.texto : null,
    filtros.origen !== 'todas' ? filtros.origen : null,
    filtros.recientes ? 'Entraron este mes' : null,
    filtros.esperan ? 'Esperando acción' : null,
    filtros.enProceso ? 'En algún proceso' : null,
    filtros.duplicados ? 'Posibles duplicados' : null,
    filtros.paraVacante ? `Para ${VACANTES_UI.find((una) => una.id === filtros.paraVacante)?.titulo ?? 'una vacante'}` : null,
  ].filter(Boolean)
  return partes.length ? partes.join(' · ') : 'Toda la base'
}

/* Etiquetas y ciudades sin repetirse por tildes ---------------------------------------------------------------- */

// «analítica», «Analitica» y «Analítica» son la misma etiqueta (MC-48); «Bogota» y «Bogotá D.C.», la misma ciudad (MC-57).
export function normalizarEtiqueta(etiqueta: string, existentes: string[]) {
  const limpia = etiqueta.trim()
  return existentes.find((una) => sinTildes(una) === sinTildes(limpia)) ?? limpia
}
export function normalizarCiudad(ciudad: string, conocidas: string[]) {
  const limpia = ciudad.replace(/,?\s*d\.?\s*c\.?$/i, '').trim()
  return conocidas.find((una) => sinTildes(una) === sinTildes(limpia)) ?? limpia
}
