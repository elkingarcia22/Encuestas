import { useSyncExternalStore } from 'react'
import type { Nota } from '../vacantes/detalle/components/data'
import type { DocumentoCandidato } from './perfil-candidato'
import { QUIEN_MUEVE } from './movimientos'

// Lo que el equipo agrega a la ficha de una persona mientras dura la sesión: los comentarios de cada etapa y los
// documentos que se suben, se reemplazan o se eliminan (CA-04). Antes vivían dentro de la ficha abierta y se perdían
// al cerrarla; aquí quedan para todo el equipo y se ven igual desde la vacante, desde «Mis candidatos» y desde «Lo
// último del equipo» (CA-22).
//
// Los documentos se guardan como cambios sobre los de la persona (agregados, reemplazos y eliminados), no como una
// copia: si después llega una hoja de vida nueva por un lote, se suma sin pisar lo que hizo el equipo.

type CambiosDocumentos = { agregados: DocumentoCandidato[]; reemplazos: Map<string, DocumentoCandidato>; quitados: Set<string> }

const documentos = new Map<string, CambiosDocumentos>()
// Por persona, vacante (postulación) y etapa: `${personaId}|${postulacionId}|${etapaId}`.
const comentarios = new Map<string, Nota[]>()

// Todo lo que el equipo hizo con la persona, con quién y cuándo (CA-49): se suma a su historia en la ficha.
export type Evento = { id: string; personaId: string; titulo: string; detalle?: string; quien: string; cuando: number; postulacionId?: string }
let eventos: Evento[] = []
let contador = 0
function anotar(personaId: string, titulo: string, extra: { detalle?: string; postulacionId?: string } = {}) {
  contador += 1
  const evento: Evento = { id: `evento-${contador}`, personaId, titulo, quien: QUIEN_MUEVE, cuando: Date.now(), ...extra }
  eventos = [...eventos, evento]
  return () => {
    eventos = eventos.filter((uno) => uno.id !== evento.id)
  }
}

// Lo que el equipo no comparte de lo que concluyó la IA (CA-36): el veredicto de la hoja de vida, el puntaje de una
// entrevista, un factor de personalidad. Lo de la IA no se borra; lo del equipo queda al lado, con quién, cuándo y por
// qué, y llega a quienes entrenan a la IA. Por persona, vacante y conclusión: `${personaId}|${postulacionId}|${conclusion}`.
export type Discusion = { conclusion: string; laIADijo: string; queEstaMal: string; porque: string; puntaje?: number; quien: string; cuando: number }
const discusiones = new Map<string, Discusion>()
export const claveDeDiscusion = (personaId: string, postulacionId: string, conclusion: string) => `${personaId}|${postulacionId}|${conclusion}`

// Por dónde se la contactó desde la ficha (CA-19).
export type Canal = 'llamada' | 'whatsapp' | 'correo'
const TITULO_CANAL: Record<Canal, string> = { llamada: 'La llamaste', whatsapp: 'Le escribiste por WhatsApp', correo: 'Le escribiste un correo' }
let version = 0
const oyentes = new Set<() => void>()
const avisar = () => {
  version += 1
  oyentes.forEach((oyente) => oyente())
}

const cambiosDe = (personaId: string) => {
  let cambios = documentos.get(personaId)
  if (!cambios) {
    cambios = { agregados: [], reemplazos: new Map(), quitados: new Set() }
    documentos.set(personaId, cambios)
  }
  return cambios
}

export const claveDeComentario = (personaId: string, postulacionId: string, etapaId: string) => `${personaId}|${postulacionId}|${etapaId}`

export const expedienteDeSesion = {
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  version: () => version,

  // Los documentos de la persona con lo que hizo el equipo: lo nuevo primero.
  documentosDe(personaId: string, base: DocumentoCandidato[]): DocumentoCandidato[] {
    const cambios = documentos.get(personaId)
    if (!cambios) return base
    return [...cambios.agregados, ...base]
      .map((documento) => cambios.reemplazos.get(documento.id) ?? documento)
      .filter((documento) => !cambios.quitados.has(documento.id))
  },
  agregar(personaId: string, documento: DocumentoCandidato) {
    const cambios = cambiosDe(personaId)
    cambios.agregados = [documento, ...cambios.agregados]
    const quitar = anotar(personaId, `Subiste «${documento.nombre}»`, { detalle: documento.clase })
    avisar()
    return () => {
      cambios.agregados = cambios.agregados.filter((uno) => uno.id !== documento.id)
      quitar()
      avisar()
    }
  },
  eliminar(personaId: string, documento: DocumentoCandidato) {
    const cambios = cambiosDe(personaId)
    cambios.quitados.add(documento.id)
    const quitar = anotar(personaId, `Eliminaste «${documento.nombre}»`, { detalle: documento.clase })
    avisar()
    return () => {
      cambios.quitados.delete(documento.id)
      quitar()
      avisar()
    }
  },
  reemplazar(personaId: string, anterior: DocumentoCandidato, nuevo: DocumentoCandidato) {
    const cambios = cambiosDe(personaId)
    const original = [...cambios.reemplazos].find(([, uno]) => uno.id === anterior.id)?.[0] ?? anterior.id
    const antes = cambios.reemplazos.get(original)
    cambios.reemplazos.set(original, nuevo)
    const quitar = anotar(personaId, `Reemplazaste el CV por «${nuevo.nombre}»`)
    avisar()
    return () => {
      if (antes) cambios.reemplazos.set(original, antes)
      else cambios.reemplazos.delete(original)
      quitar()
      avisar()
    }
  },

  comentariosDe: (clave: string) => comentarios.get(clave) ?? [],
  comentar(clave: string, nota: Nota, etapa: string) {
    comentarios.set(clave, [...(comentarios.get(clave) ?? []), nota])
    const [personaId, postulacionId] = clave.split('|')
    const quitar = anotar(personaId, `Comentaste en ${etapa}`, { detalle: nota.texto, postulacionId })
    avisar()
    return () => {
      comentarios.set(
        clave,
        (comentarios.get(clave) ?? []).filter((una) => una.id !== nota.id),
      )
      quitar()
      avisar()
    }
  },
  // Editar o borrar un comentario propio de la sesión (CA-42): queda el rastro en su historia.
  esDeLaSesion: (id: number) => [...comentarios.values()].some((notas) => notas.some((nota) => nota.id === id)),
  editarNota(id: number, texto: string) {
    const clave = [...comentarios].find(([, notas]) => notas.some((nota) => nota.id === id))?.[0]
    if (!clave) return () => {}
    const antes = comentarios.get(clave) ?? []
    comentarios.set(clave, antes.map((nota) => (nota.id === id ? { ...nota, texto, editada: true } : nota)))
    const quitar = anotar(clave.split('|')[0], 'Editaste un comentario', { detalle: texto, postulacionId: clave.split('|')[1] })
    avisar()
    return () => {
      comentarios.set(clave, antes)
      quitar()
      avisar()
    }
  },
  borrarNota(id: number) {
    const clave = [...comentarios].find(([, notas]) => notas.some((nota) => nota.id === id))?.[0]
    if (!clave) return () => {}
    const antes = comentarios.get(clave) ?? []
    const borrada = antes.find((nota) => nota.id === id)
    comentarios.set(clave, antes.filter((nota) => nota.id !== id))
    const quitar = anotar(clave.split('|')[0], 'Borraste un comentario', { detalle: borrada?.texto, postulacionId: clave.split('|')[1] })
    avisar()
    return () => {
      comentarios.set(clave, antes)
      quitar()
      avisar()
    }
  },
  // Avisarle a alguien que se mencionó en una nota (CA-42).
  mencionar(personaId: string, postulacionId: string, nombres: string[]) {
    anotar(personaId, `Mencionaste a ${nombres.join(' y ')}`, { detalle: 'Le llegó un aviso con el enlace a la ficha.', postulacionId })
    avisar()
  },
  // Llamarla o escribirle desde la ficha queda en su historia (CA-19).
  contactar(personaId: string, canal: Canal, dato: string) {
    anotar(personaId, TITULO_CANAL[canal], { detalle: dato })
    avisar()
  },
  discusionDe: (clave: string) => discusiones.get(clave),
  discutir(clave: string, discusion: Omit<Discusion, 'quien' | 'cuando'>) {
    const antes = discusiones.get(clave)
    discusiones.set(clave, { ...discusion, quien: QUIEN_MUEVE, cuando: Date.now() })
    const [personaId, postulacionId] = clave.split('|')
    const quitar = anotar(personaId, `No estuviste de acuerdo con la IA en ${discusion.conclusion}`, {
      detalle: `La IA decía ${discusion.laIADijo}. ${discusion.queEstaMal}${discusion.puntaje !== undefined ? ` (le darías ${discusion.puntaje}/100)` : ''}: ${discusion.porque}`,
      postulacionId,
    })
    avisar()
    return () => {
      if (antes) discusiones.set(clave, antes)
      else discusiones.delete(clave)
      quitar()
      avisar()
    }
  },
  // «Volver a lo de la IA»: se quita lo del equipo y queda anotado que se quitó.
  retirarDiscusion(clave: string) {
    const antes = discusiones.get(clave)
    if (!antes) return () => {}
    discusiones.delete(clave)
    const [personaId, postulacionId] = clave.split('|')
    const quitar = anotar(personaId, `Volviste a lo que concluyó la IA en ${antes.conclusion}`, { postulacionId })
    avisar()
    return () => {
      discusiones.set(clave, antes)
      quitar()
      avisar()
    }
  },
  // Lo que se anotó de la persona: lo de todas sus vacantes y lo de esta.
  eventosDe: (personaId: string, postulacionId?: string) =>
    eventos.filter((evento) => evento.personaId === personaId && (!evento.postulacionId || evento.postulacionId === postulacionId)),
  // Lo que comentó el equipo en una vacante de la persona, en todas sus etapas: para «Lo último del equipo».
  comentariosDePostulacion(personaId: string, postulacionId: string): { nota: Nota; etapa: string }[] {
    const prefijo = `${personaId}|${postulacionId}|`
    return [...comentarios]
      .filter(([clave]) => clave.startsWith(prefijo))
      .flatMap(([clave, notas]) => notas.map((nota) => ({ nota, etapa: clave.slice(prefijo.length) })))
  },
}

// Para que la ficha se vuelva a pintar cuando cambia algo de lo de arriba.
export const useExpedienteDeSesion = () => useSyncExternalStore(expedienteDeSesion.suscribir, expedienteDeSesion.version)
