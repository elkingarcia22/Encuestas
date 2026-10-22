import { CANDIDATURAS, VACANTES_UI, agregarVacante, etapaDe, type Candidatura, type VacanteUI } from '../../../propuestas/datos'
import { QUIEN_MUEVE, marcaDeTiempo, nombreDeLista, registroDeMovimientos, soltarEsperas, type Movimiento } from '../../../propuestas/movimientos'
import { anotarCorreo, baseDeCandidatos, normalizarEtiqueta } from '../../../propuestas/base'
import { diasDesdeQueAplico } from '../../../propuestas/perfil-candidato'
import { simulado } from '../../../propuestas/simular'
import { creditosDeCambios } from '../../../propuestas/invitaciones'
import { estadoInicio } from './estado'

// Lo que el inicio cambia de verdad, sobre las mismas listas que leen la vacante, su tablero y la ficha: mover a alguien
// de etapa (la sugerencia de la IA), devolver una vacante al portal, publicarla, reabrirla, duplicarla o eliminarla.
// Cada una devuelve cómo deshacerla, porque el aviso trae «Deshacer» y tiene que dejarlo todo como estaba.

let contador = 0

// Las vacantes de la sesión. Con `?simular=vacio`, ninguna: la empresa recién empieza (IN-24).
export const vacantesDeLaSesion = () => (simulado('vacio') ? [] : VACANTES_UI)

// Lo que se le dice a alguien desde el inicio queda en el rastro de su ficha («Etapas»), como un correo que se le
// escribió sin moverla, y en Mis candidatos como su último contacto (IN-16). Su «Espera» se apaga: ya se le respondió.
function anotarEnFicha(candidaturas: Candidatura[], tipo: 'correo' | 'rechazo', aviso: string, motivo?: string) {
  const movimientos = candidaturas.map<Movimiento>((c) => {
    contador += 1
    return {
      id: `inicio-${tipo}-${contador}-${c.id}`,
      tipo,
      ...(motivo ? { motivo } : {}),
      candidaturaId: c.id,
      desde: c.etapa,
      hacia: c.etapa,
      cuando: marcaDeTiempo(),
      dias: c.dias,
      quien: QUIEN_MUEVE,
      saltadas: [],
      aviso,
    }
  })
  registroDeMovimientos.agregar(movimientos)
  const deshacerCorreo = anotarCorreo([...new Set(candidaturas.map((c) => c.personaId))], aviso)
  estadoInicio.tocar()
  return () => {
    registroDeMovimientos.quitar(movimientos.map((movimiento) => movimiento.id))
    deshacerCorreo()
    estadoInicio.tocar()
  }
}

export const escribirDesdeInicio = (candidaturas: Candidatura[], asunto: string) => anotarEnFicha(candidaturas, 'correo', asunto)

// Reenviar la invitación a Serena: el plazo vuelve a empezar en su candidatura (IN-16).
export function reenviarInvitacion(candidaturas: Candidatura[]) {
  const antes = candidaturas.map((c) => ({ indice: CANDIDATURAS.findIndex((una) => una.id === c.id), c })).filter(({ indice }) => indice >= 0)
  antes.forEach(({ indice, c }) => (CANDIDATURAS[indice] = { ...CANDIDATURAS[indice], dias: 0, candidato: { ...c.candidato, accion: undefined } }))
  const deshacerFicha = anotarEnFicha(candidaturas, 'correo', 'Te reenviamos la invitación a la entrevista con Serena AI')
  return () => {
    antes.forEach(({ indice, c }) => (CANDIDATURAS[indice] = c))
    deshacerFicha()
  }
}

// Quien seguía en una vacante cerrada sale del proceso con el correo de cierre (IN-30).
export const rechazarCerradas = (candidaturas: Candidatura[]) => anotarEnFicha(candidaturas, 'rechazo', 'Cerramos la vacante', 'Se cerró la vacante')

// Pasar a alguien a otra etapa desde el inicio: queda en el registro de la sesión (la ficha lo cuenta en «Cambios de
// etapa») y en la lista de candidaturas, así que al abrir la vacante ya está en su columna nueva y sin «Espera».
export function moverDesdeInicio(candidatura: Candidatura, hacia: string) {
  const indice = CANDIDATURAS.findIndex((una) => una.id === candidatura.id)
  if (indice < 0) return () => {}
  const antes = CANDIDATURAS[indice]
  contador += 1
  const movimiento: Movimiento = {
    id: `inicio-${contador}-${antes.id}`,
    candidaturaId: antes.id,
    desde: antes.etapa,
    hacia,
    cuando: marcaDeTiempo(),
    dias: antes.dias,
    quien: QUIEN_MUEVE,
    saltadas: [],
    ...(etapaDe(antes.vacante.etapas, hacia)?.ia ? { ia: 'invitada' as const } : {}),
  }
  CANDIDATURAS[indice] = { ...antes, etapa: hacia, dias: 0, aplico: diasDesdeQueAplico(antes), candidato: { ...antes.candidato, accion: undefined } }
  registroDeMovimientos.agregar([movimiento])
  estadoInicio.tocar()
  return () => {
    CANDIDATURAS[indice] = antes
    registroDeMovimientos.quitar([movimiento.id])
    estadoInicio.tocar()
  }
}

// Un cambio de la vacante misma (estado, portal). Se hace sobre el objeto compartido: la vacante abierta, su cabecera y
// las candidaturas que la nombran ven lo mismo.
export function cambiarVacantes(vacantes: VacanteUI[], cambio: Partial<VacanteUI>) {
  const antes = vacantes.map((vacante) => ({ vacante, copia: { ...vacante } }))
  // Publicar un borrador suelta las invitaciones de IA que esperaban; deshacer las vuelve a retener (VA-45).
  const soltadas =
    cambio.estado === 'Publicada' ? vacantes.filter((vacante) => vacante.estado === 'Borrador').flatMap((vacante) => soltarEsperas(vacante.id) ?? []) : []
  // Las invitaciones que salen apartan sus créditos, como al mover (13 oct, PM).
  const deshacerCreditos = creditosDeCambios(soltadas.flatMap((soltada) => soltada.soltadas))
  vacantes.forEach((vacante) => Object.assign(vacante, cambio))
  estadoInicio.tocar()
  return () => {
    antes.forEach(({ vacante, copia }) => Object.assign(vacante, copia))
    soltadas.forEach((soltada) => soltada.deshacer())
    deshacerCreditos()
    estadoInicio.tocar()
  }
}

// Las etiquetas de las vacantes (las carpetas del producto). Como una carpeta, una etiqueta existe aunque ninguna vacante
// la lleve: se crea vacía desde «Etiquetas» y sigue ahí si se le quitan todas, hasta que se elimina.
const conocidas = new Set<string>()
export const etiquetasDeVacantes = () => {
  vacantesDeLaSesion().forEach((vacante) => vacante.etiquetas.forEach((etiqueta) => conocidas.add(etiqueta)))
  return [...conocidas].sort((a, b) => a.localeCompare(b, 'es'))
}

export const vacantesConEtiqueta = (etiqueta: string) => vacantesDeLaSesion().filter((vacante) => vacante.etiquetas.includes(etiqueta))

// Otra etiqueta que ya se llama así (sin importar mayúsculas ni tildes): dos casi iguales se confunden en el filtro.
export function etiquetaQueYaExiste(nombre: string, menos?: string) {
  const otras = etiquetasDeVacantes().filter((una) => una !== menos)
  const igual = normalizarEtiqueta(nombre, otras)
  return otras.includes(igual) ? igual : undefined
}

// Cómo estaban todas antes de un cambio, para «Deshacer».
function fotoDeEtiquetas() {
  const vacantes = vacantesDeLaSesion().map((vacante) => ({ vacante, etiquetas: vacante.etiquetas }))
  const antes = new Set(conocidas)
  return () => {
    vacantes.forEach(({ vacante, etiquetas }) => (vacante.etiquetas = etiquetas))
    conocidas.clear()
    antes.forEach((etiqueta) => conocidas.add(etiqueta))
    estadoInicio.tocar()
  }
}

// Crear una etiqueta, sola o ya puesta en algunas vacantes.
export function crearEtiqueta(nombre: string, vacantes: VacanteUI[]) {
  const deshacer = fotoDeEtiquetas()
  const limpia = nombre.trim()
  conocidas.add(limpia)
  vacantes.forEach((vacante) => {
    if (!vacante.etiquetas.includes(limpia)) vacante.etiquetas = [...vacante.etiquetas, limpia]
  })
  estadoInicio.tocar()
  return deshacer
}

// Guardar una etiqueta abierta: su nombre (renombrarla la cambia en todas las vacantes que la llevan) y cuáles la llevan.
export function guardarEtiqueta(anterior: string, nombre: string, ids: string[]) {
  const deshacer = fotoDeEtiquetas()
  const limpia = nombre.trim()
  conocidas.delete(anterior)
  conocidas.add(limpia)
  vacantesDeLaSesion().forEach((vacante) => {
    const sin = vacante.etiquetas.filter((una) => una !== anterior && una !== limpia)
    // Donde estaba, ahí queda: el orden de las etiquetas de la vacante no salta al renombrar.
    const donde = vacante.etiquetas.indexOf(anterior)
    if (!ids.includes(vacante.id)) vacante.etiquetas = sin
    else if (donde >= 0) vacante.etiquetas = [...sin.slice(0, donde), limpia, ...sin.slice(donde)]
    else vacante.etiquetas = [...sin, limpia]
  })
  estadoInicio.tocar()
  return deshacer
}

// Eliminar una etiqueta: sale de todas las vacantes; las vacantes no cambian en nada más.
export function eliminarEtiqueta(nombre: string) {
  const deshacer = fotoDeEtiquetas()
  conocidas.delete(nombre)
  vacantesDeLaSesion().forEach((vacante) => {
    if (vacante.etiquetas.includes(nombre)) vacante.etiquetas = vacante.etiquetas.filter((una) => una !== nombre)
  })
  estadoInicio.tocar()
  return deshacer
}

// Poner y quitar etiquetas a una o a varias. Lo escrito se escribe como la que ya existe («comercial» es «Comercial»):
// así no salen dos casi iguales en el filtro.
export function etiquetarVacantes(vacantes: VacanteUI[], ponerEscritas: string[], quitar: string[]) {
  const existentes = etiquetasDeVacantes()
  const poner = [...new Set(ponerEscritas.map((etiqueta) => normalizarEtiqueta(etiqueta, existentes)).filter(Boolean))]
  const nuevas = poner.filter((etiqueta) => !existentes.includes(etiqueta))
  const deshacer = fotoDeEtiquetas()
  poner.forEach((etiqueta) => conocidas.add(etiqueta))
  vacantes.forEach((vacante) => {
    vacante.etiquetas = [...new Set([...vacante.etiquetas.filter((una) => !quitar.includes(una)), ...poner])]
  })
  estadoInicio.tocar()
  return { poner, nuevas, deshacer }
}

// El aviso de etiquetar: qué se puso o se quitó, y si nació una etiqueta, que ya se puede filtrar por ella.
export function avisoDeEtiquetas(vacantes: VacanteUI[], poner: string[], quitar: string[], nuevas: string[]): [string, string] {
  const comillas = (lista: string[]) => nombreDeLista(lista.map((una) => `«${una}»`))
  const cuales = vacantes.length === 1 ? `«${vacantes[0].titulo}»` : `${vacantes.length} vacantes`
  const enFiltros = nuevas.length ? ` ${nuevas.length === 1 ? 'La nueva ya sale' : 'Las nuevas ya salen'} en «Filtros».` : ''
  if (poner.length && quitar.length) return [`Cambiaste las carpetas de ${cuales}`, `Entró en ${comillas(poner)} y salió de ${comillas(quitar)}.${enFiltros}`]
  if (poner.length) return [`Pusiste ${cuales} en ${comillas(poner)}`, `Ya ${vacantes.length === 1 ? 'aparece' : 'aparecen'} en esa carpeta.${enFiltros}`]
  return [`Sacaste ${cuales} de ${comillas(quitar)}`, `Siguen en sus demás carpetas.`]
}

// El nombre de una copia, sin repetir ninguno: «X (copia)», «X (copia 2)»… y la copia de una copia no suma otro
// «(copia)» (IN-21). El enlace público sale del título: nombres distintos, enlaces distintos.
export function nombreDeCopia(titulo: string) {
  const base = titulo.replace(/ \(copia(?: \d+)?\)$/, '')
  const usados = new Set(VACANTES_UI.map((vacante) => vacante.titulo))
  if (!usados.has(`${base} (copia)`)) return `${base} (copia)`
  let n = 2
  while (usados.has(`${base} (copia ${n})`)) n += 1
  return `${base} (copia ${n})`
}

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')

// Una copia queda en borrador, sin gente ni aplicaciones, a nombre de quien la duplicó (no del dueño del original).
export function duplicarVacantes(vacantes: VacanteUI[]) {
  const copias = vacantes.map((vacante) => {
    contador += 1
    const yo = { nombre: QUIEN_MUEVE, iniciales: iniciales(QUIEN_MUEVE) }
    return agregarVacante({
      ...vacante,
      id: `${vacante.id}-copia-${contador}`,
      titulo: nombreDeCopia(vacante.titulo),
      reclutador: yo,
      equipo: [{ ...yo, correo: `${QUIEN_MUEVE.split(' ')[0].toLowerCase()}@ubits.com`, permiso: 'Dueña del proceso' }],
      historial: undefined,
      estado: 'Borrador',
      oculta: false,
      diasAbierta: 0,
      aplicaciones: 0,
      ultimaSemana: 0,
      descartados: 0,
      candidatos: [],
      desenlace: undefined,
    })
  })
  estadoInicio.tocar()
  return {
    copias,
    deshacer: () => {
      copias.forEach((copia) => {
        const indice = VACANTES_UI.indexOf(copia)
        if (indice >= 0) VACANTES_UI.splice(indice, 1)
      })
      estadoInicio.tocar()
    },
  }
}

// Eliminar saca la vacante de la lista de la sesión; «Deshacer» la devuelve al mismo lugar. Quien seguía en su proceso
// deja de estar «En proceso» en Mis candidatos: queda «Descartada» con el motivo «Se eliminó la vacante» (IN-22).
export function eliminarVacantes(vacantes: VacanteUI[]) {
  const sacadas = vacantes
    .map((vacante) => ({ vacante, indice: VACANTES_UI.indexOf(vacante) }))
    .filter(({ indice }) => indice >= 0)
    .sort((a, b) => b.indice - a.indice)
  sacadas.forEach(({ indice }) => VACANTES_UI.splice(indice, 1))
  const ids = new Set(sacadas.map(({ vacante }) => vacante.id))
  baseDeCandidatos.cambiar((todas) =>
    todas.map((persona) =>
      persona.procesos.some((proceso) => ids.has(proceso.vacanteId) && proceso.estado === 'En proceso')
        ? {
            ...persona,
            procesos: persona.procesos.map((proceso) =>
              ids.has(proceso.vacanteId) && proceso.estado === 'En proceso'
                ? { ...proceso, estado: 'Descartado' as const, motivo: 'Se eliminó la vacante' }
                : proceso,
            ),
          }
        : persona,
    ),
  )
  estadoInicio.tocar()
  return () => {
    ;[...sacadas].reverse().forEach(({ vacante, indice }) => VACANTES_UI.splice(indice, 0, vacante))
    // Solo vuelve lo que cambió al eliminar: lo que se hizo después en la base se queda.
    baseDeCandidatos.cambiar((todas) =>
      todas.map((persona) =>
        persona.procesos.some((proceso) => ids.has(proceso.vacanteId) && proceso.motivo === 'Se eliminó la vacante')
          ? {
              ...persona,
              procesos: persona.procesos.map((proceso) =>
                ids.has(proceso.vacanteId) && proceso.motivo === 'Se eliminó la vacante'
                  ? { ...proceso, estado: 'En proceso' as const, motivo: undefined }
                  : proceso,
              ),
            }
          : persona,
      ),
    )
    estadoInicio.tocar()
  }
}
