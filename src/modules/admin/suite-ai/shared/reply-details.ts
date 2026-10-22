import type { IconSvgElement } from '@hugeicons/react'
import {
  Briefcase06Icon,
  ChartAverageIcon,
  Database01Icon,
  File01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

export type ReplySource = { label: string; detail: string; icon: IconSvgElement }

export type ReplyDetails = {
  // De dónde sale el dato: da confianza en un producto de RH.
  sources: ReplySource[]
  // Sugerencias para seguir la conversación (solo bajo la última respuesta).
  followups: string[]
  // Otras versiones que aparecen al pedir «Regenerar».
  alternates: string[]
}

const SRC = {
  pulso: { label: 'Encuesta de pulso Q3', detail: 'Cerró el 5 sept · 1.240 respuestas', icon: ChartAverageIcon },
  eval360: { label: 'Evaluaciones 360', detail: 'Ciclo 2026-1 · 312 evaluados', icon: File01Icon },
  nomina: { label: 'Novedades de nómina', detail: 'Actualizado hoy 8:00 · solo tu alcance', icon: Database01Icon },
  clima: { label: 'Encuesta de clima 2026', detail: 'Cerró el 30 ago · 76 % de participación', icon: ChartAverageIcon },
  estructura: { label: 'Estructura organizacional', detail: 'Actualizada el 1 sept · 1.630 colaboradores', icon: UserGroupIcon },
  satisfaccion: { label: 'Encuestas de satisfacción', detail: 'Últimos 90 días · 1.860 respuestas', icon: ChartAverageIcon },
  catalogo: { label: 'Catálogo de cursos', detail: 'Actualizado el 10 sept · 214 cursos', icon: File01Icon },
  matriz: { label: 'Matriz de talento 2026', detail: 'Calibrada el 22 ago · 32 líderes', icon: UserGroupIcon },
  vacantes: { label: 'Selección · Vacantes', detail: '12 vacantes abiertas · hace 5 min', icon: Briefcase06Icon },
  politica: { label: 'Política de vacaciones v3', detail: 'Borrador del 12 sept', icon: File01Icon },
} satisfies Record<string, ReplySource>

const GENERIC: ReplyDetails = {
  sources: [],
  followups: [],
  alternates: [
    'Revisé de nuevo con los datos disponibles de Meta Colombia. La conclusión se mantiene; puedo convertirla en un plan asignable o profundizar en un equipo concreto.',
    'Otra forma de verlo: con lo que tengo a mano no hay un cambio fuerte frente a la respuesta anterior. Si me dices el equipo o la sede, te doy el detalle.',
  ],
}

// Detalles de una respuesta del agente según su contenido (datos de ejemplo del playground).
export function detailsFor(text: string): ReplyDetails {
  const t = text.toLowerCase()

  if (t.includes('rotación')) {
    return {
      sources: [SRC.pulso, SRC.eval360, SRC.nomina],
      followups: ['Prepara el plan de retención', 'Muéstrame las 18 personas', 'Compara con el Q2'],
      alternates: [
        'Ventas Bogotá concentra el riesgo de rotación del Q3: 18 personas acumulan dos señales o más, como baja en el pulso y ningún ascenso en 18 meses. Te sugiero empezar por los 6 líderes de ese equipo.',
        'Si miras el Q3 por sede, Bogotá pesa el 61 % del riesgo, y dentro de ella Ventas: 18 personas con dos señales o más. Operaciones Medellín sigue con 7. ¿Armo un plan de retención por líder?',
      ],
    }
  }
  // «Encuesta de clima» va antes que «participación»: el resumen del clima también menciona la participación.
  if (t.includes('encuesta de clima')) {
    return {
      sources: [SRC.clima, SRC.estructura],
      followups: ['¿Qué dijeron en reconocimiento?', 'Arma un plan para Operaciones', 'Compara con el año pasado'],
      alternates: [
        'Clima 2026 cerró con 76 % de participación. El punto más débil es «reconocimiento», con 3,1 de 5 en Operaciones; el más fuerte, «trabajo en equipo», con 4,3.',
      ],
    }
  }
  if (t.includes('participación')) {
    return {
      sources: [SRC.clima, SRC.estructura],
      followups: ['Prepara el aviso para el turno tarde', '¿Qué dijeron en reconocimiento?'],
      alternates: [
        'La participación de Ventas Bogotá quedó en 58 %, nueve puntos bajo el promedio. El turno de la tarde explica casi toda la diferencia: 46 % frente a 71 % en la mañana.',
      ],
    }
  }
  if (t.includes('satisfacción') || t.includes('cursos están')) {
    return {
      sources: [SRC.satisfaccion, SRC.catalogo],
      followups: ['Propón un reemplazo para Excel intermedio', '¿Qué comentarios dejaron?', 'Avisa a los responsables'],
      alternates: [
        'Los tres cursos con peor satisfacción son Excel intermedio (3,1), Atención al cliente (3,3) y Normativa laboral (3,4). Todos superan las 40 respuestas, así que no es un dato aislado.',
      ],
    }
  }
  if (t.includes('cuadrante') || t.includes('sucesión')) {
    return {
      sources: [SRC.matriz, SRC.eval360],
      followups: ['Arma el plan de sucesión', 'Muéstrame los 4 a revisar', '¿Quiénes están listos para ascender?'],
      alternates: [
        'En la matriz de liderazgo, 9 de 32 líderes combinan alto desempeño y alto potencial. Antes del ciclo de sucesión revisaría a los 4 que rinden alto pero muestran potencial bajo.',
      ],
    }
  }
  if (t.includes('terminación') || t.includes('vencidas') || t.includes('recordatorio')) {
    return {
      sources: [SRC.eval360, SRC.estructura],
      followups: ['Programa el recordatorio para mañana', 'Compara con Operaciones'],
      alternates: [
        'Hay 24 evaluaciones vencidas en Ventas. El recordatorio va a los líderes, no a los evaluados, y lo puedo programar para mañana a las 8:00.',
      ],
    }
  }
  if (t.includes('vacantes') || t.includes('candidatos')) {
    return {
      sources: [SRC.vacantes],
      followups: ['Abre Analista de datos', '¿Cuánto llevan abiertas?'],
      alternates: [
        'De las vacantes de analista, dos avanzan: Analista de datos en entrevistas con 12 candidatos y Analista financiero en filtro inicial con 28. Analista de calidad sigue en borrador.',
      ],
    }
  }
  if (t.includes('dos acciones')) {
    return {
      sources: [SRC.politica, SRC.estructura],
      followups: [],
      alternates: [
        'Separé la tarea en dos pasos porque ambos tienen efecto real: publicar el aviso y asignar el curso. La audiencia y el borrador están listos; el correo no sale sin tu confirmación.',
      ],
    }
  }
  return GENERIC
}
