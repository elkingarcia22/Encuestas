// Datos del caso «Comparar opciones»: tres finalistas para Analista de datos.

export type CandidateId = 'laura' | 'andres' | 'camila'

export type Candidate = {
  id: CandidateId
  name: string
  first: string
  initials: string
  role: string
  fit: number
  facts: { label: string; value: string }[]
}

export const CANDIDATES: Candidate[] = [
  {
    id: 'laura',
    name: 'Laura Méndez',
    first: 'Laura',
    initials: 'LM',
    role: 'Analista de producto sr · Rappi',
    fit: 82,
    facts: [
      { label: 'Entrevista técnica', value: '4,6 / 5' },
      { label: 'Disponibilidad', value: '15 días' },
    ],
  },
  {
    id: 'andres',
    name: 'Andrés Castaño',
    first: 'Andrés',
    initials: 'AC',
    role: 'Analista de BI · Nequi',
    fit: 76,
    facts: [
      { label: 'Entrevista técnica', value: '4,1 / 5' },
      { label: 'Disponibilidad', value: '30 días' },
    ],
  },
  {
    id: 'camila',
    name: 'Camila Rojas',
    first: 'Camila',
    initials: 'CR',
    role: 'Científica de datos jr · Globant',
    fit: 71,
    facts: [
      { label: 'Entrevista técnica', value: '4,3 / 5' },
      { label: 'Disponibilidad', value: 'Inmediata' },
    ],
  },
]

// score: más alto es mejor; con él se marca «Mejor» entre las finalistas que se estén comparando.
export const ROWS: { label: string; values: Record<CandidateId, { text: string; score: number }> }[] = [
  {
    label: 'Experiencia',
    values: { laura: { text: '4 años', score: 4 }, andres: { text: '5 años', score: 5 }, camila: { text: '2 años', score: 2 } },
  },
  {
    label: 'SQL y Power BI',
    values: { laura: { text: '9/10', score: 9 }, andres: { text: '8/10', score: 8 }, camila: { text: '7/10', score: 7 } },
  },
  {
    label: 'Entrevista técnica',
    values: { laura: { text: '4,6 / 5', score: 4.6 }, andres: { text: '4,1 / 5', score: 4.1 }, camila: { text: '4,3 / 5', score: 4.3 } },
  },
  {
    label: 'Pretensión salarial',
    values: { laura: { text: '$7,8 M', score: -7.8 }, andres: { text: '$8,2 M', score: -8.2 }, camila: { text: '$6,5 M', score: -6.5 } },
  },
  {
    label: 'Disponibilidad',
    values: { laura: { text: '15 días', score: -15 }, andres: { text: '30 días', score: -30 }, camila: { text: 'Inmediata', score: 0 } },
  },
  {
    label: 'Referencias',
    values: { laura: { text: '2 verificadas', score: 2 }, andres: { text: 'Sin verificar', score: 0 }, camila: { text: '1 verificada', score: 1 } },
  },
]

export function replyFor(question: string) {
  const q = question.toLowerCase()
  if (q.includes('salari') || q.includes('presupuesto') || q.includes('rango')) {
    return 'El rango aprobado es de $6,5 M a $7 M. Solo Camila queda dentro; Laura pide 11% más y Andrés 17% más.'
  }
  if (q.includes('referenc')) {
    return 'Laura tiene 2 verificadas (Rappi y Bancolombia) y Camila 1 (Globant). Los dos contactos de Andrés no han respondido; puedo escribirles hoy.'
  }
  if (q.includes('camila')) {
    return 'Camila es la opción de menor costo y puede empezar ya, pero tiene 2 años de experiencia y le falta la evaluación cultural.'
  }
  if (q.includes('andr')) {
    return 'Andrés tiene más experiencia (5 años), pero su entrevista fue la más baja y sus referencias siguen sin verificar.'
  }
  return 'Con lo que tengo, Laura sigue primera. Si me dices qué pesa más para el equipo —costo, experiencia o disponibilidad— recalculo la recomendación.'
}
