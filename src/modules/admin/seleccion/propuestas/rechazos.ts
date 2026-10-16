import { pesos } from '../vacantes/detalle/components/data'
import { cumplidosDe, esUltimaEtapa, tituloEtapa, type Candidatura, type EtapaVacante, type Rechazada } from './datos'

// Rechazar a alguien: las reglas de lo que pasa alrededor (25 sep, Nicolás: «ahora hagamos lo mismo para "Rechazar
// candidato", que quede bien completo para las 3 exploraciones»). La ventana (`dialogo-rechazo.tsx`), la de volver a
// considerar (`dialogo-reconsiderar.tsx`) y el proceso (`use-proceso.tsx`) leen de aquí.
//
// 1. **Motivo obligatorio**, en dos niveles (lo decidimos nosotros / se retiró la persona), como Greenhouse, Lever y
//    Ashby; «Otro motivo» se escribe. Los de «Lo decidimos nosotros» son los de UBITS hoy, iguales en todas las etapas;
//    los de «Se retiró» cambian en la oferta.
// 2. **La IA sugiere el motivo** cuando los datos lo dicen (bajo puntaje en la entrevista, no cumple, le falta la
//    experiencia o la disponibilidad que se pide, pide más del tope). No decide: se ve marcado como sugerencia y se cambia.
// 3. **Se retiró** no es lo mismo que rechazar: otro título, otros motivos, sin correo de rechazo y queda «Se retiró».
// 4. **El correo**: plantilla según dónde iba, texto editable. Sale al instante y no se retira (decisión 4).
// 5. **Nota para el equipo**, que la persona no ve.
// 6. **Entrevista de IA sin terminar**: se cancela.
// 7. **Está en otras vacantes**: allá sigue; se puede rechazar también allá con el mismo motivo.
// 8. **Varias a la vez**: qué le pasa a cada una; «recordar el motivo»; desde 25 hay que escribir RECHAZAR (Ashby).
// 9. **Deshacer** en el aviso (ningún ATS lo tiene): la persona vuelve; el correo, si salió, ya llegó.
// 10. **Volver a considerar**: a qué etapa y, si ya le llegó el correo de rechazo, escribirle.
// 11. **Cuando no se guarda**: nadie sale del proceso y el correo no sale; «Reintentar».

export type Quien = 'nosotros' | 'candidato'

export const QUIEN_TEXTO: Record<Quien, string> = {
  nosotros: 'Lo decidimos nosotros',
  candidato: 'La persona se retiró',
}

// Los motivos de rechazo de UBITS hoy, con sus palabras y en su orden (25 sep, Nicolás los pasó de la plataforma):
// quien ya la usa los reconoce y los reportes siguen contando lo mismo. Son los mismos en todas las etapas, como allá.
const MOTIVOS_UBITS = [
  'No cumple requisitos',
  'No encaja con cultura',
  'Proceso abandonado',
  'Rechazo de CV',
  'Alta expectativa salarial',
  'Entrevista expirada',
  'Bajo puntaje AI',
  'Falta de experiencia clave',
  'Soft skills débiles',
  'Sin disponibilidad',
  'No se presentó',
  'Falta de documentación',
  // Para quien sigue en el proceso cuando la plaza se cubre con otra persona (VA-27).
  'Posición cubierta',
]

// Cuando se retira la persona. En la oferta (la última etapa) se retira por otras razones.
const MOTIVOS_RETIRO = ['Aceptó otra oferta', 'No le sirve el salario', 'No le sirve la modalidad o la sede', 'Ya no está buscando']
const MOTIVOS_RETIRO_OFERTA = ['Rechazó la oferta', 'Aceptó otra oferta', 'No le sirve el salario']

export const OTRO_MOTIVO = 'Otro motivo'

export function motivosPara(quien: Quien, etapas: EtapaVacante[], candidaturas: Candidatura[]) {
  if (quien === 'nosotros') return [...MOTIVOS_UBITS, OTRO_MOTIVO]
  const enOferta = candidaturas.length > 0 && candidaturas.every((c) => esUltimaEtapa(etapas, c.etapa))
  return [...(enOferta ? MOTIVOS_RETIRO_OFERTA : MOTIVOS_RETIRO), OTRO_MOTIVO]
}

// Quién decidió un rechazo sembrado (los de antes no lo guardan): se deduce del motivo.
export const quienDe = (rechazada: Rechazada): Quien =>
  rechazada.quien ?? ([...MOTIVOS_RETIRO, ...MOTIVOS_RETIRO_OFERTA].includes(rechazada.motivo) ? 'candidato' : 'nosotros')

// El motivo que la IA sugiere, con la razón en una frase. Solo cuando los datos lo dicen claro, y siempre uno de la
// lista de UBITS.
export function motivoSugerido(candidatura: Candidatura): { motivo: string; razon: string } | null {
  const { candidato, vacante, criterios, etapa } = candidatura
  // La plaza ya se cubrió: el motivo no es la persona (VA-27).
  if (vacante.estado === 'Cerrada' && vacante.desenlace?.includes('seleccion'))
    return { motivo: 'Posición cubierta', razon: 'la vacante se cerró con otra persona seleccionada.' }
  // La invitación a Serena se venció sin que la presentara (VA-27).
  if (etapa === 'serena' && candidato.serena === undefined && candidato.accion?.includes('Serena') && candidatura.dias >= 7)
    return { motivo: 'Entrevista expirada', razon: `lleva ${candidatura.dias} días sin presentar la entrevista con Serena AI y el plazo es de 7.` }
  if (etapa === 'serena' && candidato.serena !== undefined && candidato.serena < 70)
    return { motivo: 'Bajo puntaje AI', razon: `Serena AI le dio ${candidato.serena}/100 y el mínimo es 70.` }
  const cumple = cumplidosDe(criterios)
  if (criterios.length && cumple * 2 < criterios.length)
    return { motivo: 'No cumple requisitos', razon: `cumple ${cumple} de ${criterios.length} requisitos, según su CV.` }
  // Cumple la mitad o más, pero le falta lo que más pesa: los años o la experiencia que se piden (tenerlos a medias ya
  // es que le faltan), o la disponibilidad (esa, solo si no la tiene).
  const experiencia = criterios.find((c) => (c.veredicto === 'no-cumple' || c.veredicto === 'parcial') && /experiencia|años/i.test(c.requisito))
  if (experiencia)
    return {
      motivo: 'Falta de experiencia clave',
      razon: `${experiencia.veredicto === 'parcial' ? 'cumple a medias' : 'no cumple'} «${experiencia.requisito}», según su CV.`,
    }
  const disponibilidad = criterios.find((c) => c.veredicto === 'no-cumple' && /disponibilidad/i.test(c.requisito))
  if (disponibilidad) return { motivo: 'Sin disponibilidad', razon: `no cumple «${disponibilidad.requisito}», según su CV.` }
  if (candidato.pretension > vacante.rango[1])
    return { motivo: 'Alta expectativa salarial', razon: `pide ${pesos(candidato.pretension)} y el tope es ${pesos(vacante.rango[1])}.` }
  return null
}

/* El correo ------------------------------------------------------------------------------------------------------ */

export type PlantillaRechazo = { id: string; titulo: string; texto: string }

export const PLANTILLAS_RECHAZO: PlantillaRechazo[] = [
  {
    id: 'postulacion',
    titulo: 'Gracias por postularte',
    texto:
      'Hola {nombre}, gracias por tu interés en la vacante de {vacante}. Revisamos tu perfil con cuidado y esta vez decidimos seguir con otras personas. Guardamos tus datos para próximas vacantes.',
  },
  {
    id: 'entrevista',
    titulo: 'Después de la entrevista',
    texto:
      'Hola {nombre}, gracias por el tiempo que le dedicaste al proceso de {vacante}. Después de las entrevistas decidimos seguir con otras personas. Nos gustaría tenerte en cuenta para próximas vacantes.',
  },
  {
    id: 'oferta',
    titulo: 'Sobre la oferta',
    texto:
      'Hola {nombre}, gracias por llegar hasta el final del proceso de {vacante}. Esta vez no vamos a seguir con la oferta. Fue un gusto conocerte y te tendremos en cuenta más adelante.',
  },
  {
    id: 'cubierta',
    titulo: 'La vacante ya se cubrió',
    texto:
      'Hola {nombre}, gracias por participar en el proceso de {vacante}. Te contamos que ya cubrimos la vacante con otra persona. Guardamos tus datos y te escribiremos cuando abramos algo parecido.',
  },
  {
    id: 'retiro',
    titulo: 'Confirmación de retiro',
    texto: 'Hola {nombre}, confirmamos que retiraste tu postulación a {vacante}. Gracias por avisarnos; las puertas siguen abiertas.',
  },
]

export function plantillaDeRechazo(quien: Quien, candidaturas: Candidatura[], etapas: EtapaVacante[]) {
  if (quien === 'candidato') return 'retiro'
  // Cerrada con otra persona seleccionada: a quien seguía se le dice que la vacante se cubrió (VA-10, VA-27).
  if (candidaturas[0]?.vacante.estado === 'Cerrada' && candidaturas[0].vacante.desenlace?.includes('seleccion')) return 'cubierta'
  if (candidaturas.length && candidaturas.every((c) => esUltimaEtapa(etapas, c.etapa))) return 'oferta'
  const serena = etapas.findIndex((etapa) => etapa.ia)
  const pasaron = candidaturas.some((c) => etapas.findIndex((etapa) => etapa.id === c.etapa) > serena && serena >= 0)
  return pasaron ? 'entrevista' : 'postulacion'
}

// Volver a considerar a alguien que ya recibió el correo de rechazo.
export const TEXTO_RETOMAR =
  'Hola {nombre}, te escribimos porque queremos retomar tu proceso en {vacante}: sigues en la etapa «{etapa}». Pronto te contamos los siguientes pasos.'

/* Cuando no se guarda -------------------------------------------------------------------------------------------- */

// La misma persona de cada vacante que no se deja mover la primera vez tampoco se deja rechazar la primera vez: el
// rechazo «no se guarda», el correo no sale y se reintenta.
const FALLAN = new Set([
  'mateo-salazar@analista-de-datos',
  'tomas-restrepo@disenadora-de-producto',
  'oscar-guerrero@coordinador-de-turno',
  'alejandro-alvarez-desarrollador-backend-1@desarrollador-backend',
])
const yaFallaron = new Set<string>()

export function fallaAlRechazar(candidaturaId: string) {
  if (!FALLAN.has(candidaturaId) || yaFallaron.has(candidaturaId)) return false
  yaFallaron.add(candidaturaId)
  return true
}

// «Rechazada en Para revisión» / «Se retiró en Para revisión».
export const dondeSeQuedo = (rechazada: Rechazada) =>
  `${quienDe(rechazada) === 'candidato' ? 'Se retiró' : 'Rechazada'} en ${tituloEtapa(rechazada.candidatura.etapa)}`
