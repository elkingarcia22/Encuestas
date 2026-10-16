import type { EtapaFlujo } from '../crear/components/etapas'
import { resumenEtapa } from '../crear/components/etapas'
import { CATALOGO_PLANTILLAS, CATEGORIAS_PLANTILLA, type PlantillaCatalogo } from './datos'
import { categoriaPropiaPorId, esPropia } from './plantillas-propias'

// Etapas del flujo del candidato que arma cada plantilla. Salen de la biblioteca de etapas real
// (docs/plataforma-ubits/06-marco-d-reclutamiento.md): Evaluación CV, Serena AI, Para revisión,
// Antecedentes judiciales y Seleccionado, más la prueba práctica y la entrevista con el líder.

export type TipoEtapa = 'Filtro inicial' | 'Assessment' | 'Entrevista' | 'Verificación' | 'Oferta'

export type AjusteEtapa = { etiqueta: string; valor: string }

export type EtapaPlantilla = {
  id: string
  nombre: string
  detalle: string
  tipo: TipoEtapa
  conIA?: boolean
  // Días hábiles que suele tomar; la suma da la duración estimada del proceso.
  dias: number
  ajustes: AjusteEtapa[]
  preguntas?: string[]
  // Cómo se llama la lista de preguntas; por defecto son las de Serena.
  tituloPreguntas?: string
}

const PREGUNTAS_SERENA: Record<string, string[]> = {
  comercial: [
    'Cuéntame de una venta difícil que hayas cerrado y cómo lo lograste.',
    '¿Cómo organizas tu semana para cumplir la meta del mes?',
    '¿Qué haces cuando un cliente te dice que no?',
  ],
  servicio: [
    'Describe una ocasión en la que calmaste a un cliente molesto.',
    '¿Cómo priorizas cuando tienes varios casos abiertos al mismo tiempo?',
    '¿Qué significa para ti resolver en el primer contacto?',
  ],
  operaciones: [
    '¿Qué turnos puedes cubrir y desde cuándo estás disponible?',
    'Cuéntame de una vez que detectaste un riesgo de seguridad en tu trabajo.',
    '¿Cómo te aseguras de no cometer errores en tareas repetitivas?',
  ],
  tecnologia: [
    'Cuéntame de un problema técnico que resolviste y cómo lo abordaste.',
    '¿Cómo explicas algo técnico a alguien que no lo es?',
    '¿Qué herramientas usas en tu día a día y por qué?',
  ],
  gente: [
    '¿Cómo manejas la información confidencial de las personas?',
    'Cuéntame de un proceso que mejoraste en tu área.',
    '¿Cómo acompañas a alguien que está pasando un mal momento en el trabajo?',
  ],
}

const PRUEBA_POR_CATEGORIA: Record<string, { nombre: string; formato: string }> = {
  comercial: { nombre: 'Simulación de venta', formato: 'Juego de roles con un cliente ficticio' },
  servicio: { nombre: 'Caso de atención', formato: 'Respuesta escrita a tres casos reales' },
  operaciones: { nombre: 'Prueba práctica', formato: 'Ejercicio en planta con el supervisor' },
  tecnologia: { nombre: 'Prueba técnica', formato: 'Reto para resolver en casa' },
  gente: { nombre: 'Caso práctico', formato: 'Análisis de un caso del área' },
}

function evaluacionCv(): EtapaPlantilla {
  return {
    id: 'evaluacion-cv',
    nombre: 'Evaluación CV',
    detalle: 'Filtro inicial de los CVs que llegan.',
    tipo: 'Filtro inicial',
    dias: 2,
    ajustes: [
      { etiqueta: 'Puntaje mínimo', valor: '70 de 100' },
      { etiqueta: 'Aspiración salarial', valor: 'Hasta 10 % por encima del rango' },
      { etiqueta: 'Ex empleados', valor: 'Se aceptan' },
    ],
  }
}

function serena(categoriaId: string): EtapaPlantilla {
  return {
    id: 'serena',
    nombre: 'Serena AI',
    detalle: 'Entrevistadora de IA que hace la primera conversación.',
    tipo: 'Filtro inicial',
    conIA: true,
    dias: 1,
    ajustes: [
      { etiqueta: 'Duración', valor: '15 minutos' },
      { etiqueta: 'Canal', valor: 'Enlace por correo y WhatsApp' },
    ],
    preguntas: PREGUNTAS_SERENA[categoriaId],
  }
}

function prueba(categoriaId: string): EtapaPlantilla {
  const { nombre, formato } = PRUEBA_POR_CATEGORIA[categoriaId]
  return {
    id: 'prueba',
    nombre,
    detalle: 'Muestra en la práctica lo que sabe hacer.',
    tipo: 'Assessment',
    dias: 3,
    ajustes: [
      { etiqueta: 'Formato', valor: formato },
      { etiqueta: 'Quién califica', valor: 'El líder del área' },
      { etiqueta: 'Nota para pasar', valor: '3,5 de 5' },
    ],
  }
}

function revision(): EtapaPlantilla {
  return {
    id: 'revision',
    nombre: 'Para revisión',
    detalle: 'El reclutador revisa el perfil completo y decide.',
    tipo: 'Assessment',
    dias: 3,
    ajustes: [
      { etiqueta: 'Responsable', valor: 'Reclutador de la vacante' },
      { etiqueta: 'Plazo', valor: '3 días hábiles' },
    ],
  }
}

function entrevistaLider(): EtapaPlantilla {
  return {
    id: 'entrevista-lider',
    nombre: 'Entrevista con el líder',
    detalle: 'Conversación con quien será su jefe directo.',
    tipo: 'Entrevista',
    dias: 4,
    ajustes: [
      { etiqueta: 'Duración', valor: '45 minutos' },
      { etiqueta: 'Modalidad', valor: 'Videollamada' },
      { etiqueta: 'Guía', valor: 'Preguntas por competencias del cargo' },
    ],
  }
}

function antecedentes(): EtapaPlantilla {
  return {
    id: 'antecedentes',
    nombre: 'Antecedentes judiciales',
    detalle: 'Verificación de antecedentes antes de la oferta.',
    tipo: 'Verificación',
    dias: 2,
    ajustes: [
      { etiqueta: 'Qué se revisa', valor: 'Antecedentes judiciales y disciplinarios' },
      { etiqueta: 'Autorización', valor: 'El candidato la firma en línea' },
    ],
  }
}

function seleccionado(): EtapaPlantilla {
  return {
    id: 'seleccionado',
    nombre: 'Seleccionado',
    detalle: 'Se envía la oferta y se cierra el proceso.',
    tipo: 'Oferta',
    dias: 2,
    ajustes: [
      { etiqueta: 'Carta de oferta', valor: 'Plantilla del área' },
      { etiqueta: 'Resto de candidatos', valor: 'Correo de rechazo a los 5 días' },
    ],
  }
}

// En operaciones y tecnología pesa más demostrar lo que se sabe hacer: la prueba reemplaza la revisión.
const CON_PRUEBA = new Set(['operaciones', 'tecnologia'])

// Una plantilla propia guarda su flujo tal como se armó en «Crear vacante»: cada etapa se muestra con lo que
// se le configuró. Los días son una estimación por tipo, porque ahí no se piden.
const TIPO_POR_CATEGORIA: Record<string, TipoEtapa> = {
  'Filtro inicial': 'Filtro inicial',
  'Entrevista con liderazgo': 'Entrevista',
  'Prueba técnica': 'Assessment',
  'Antecedentes judiciales': 'Verificación',
  Contratación: 'Oferta',
  Oferta: 'Oferta',
}
const DIAS_POR_TIPO: Record<TipoEtapa, number> = { 'Filtro inicial': 2, Assessment: 3, Entrevista: 3, Verificación: 4, Oferta: 2 }

function deLaVacante(etapa: EtapaFlujo): EtapaPlantilla {
  const tipo = TIPO_POR_CATEGORIA[etapa.categoria] ?? 'Filtro inicial'
  const ajustes: AjusteEtapa[] = []
  if (etapa.cv) {
    ajustes.push({ etiqueta: 'Puntaje mínimo', valor: `${etapa.cv.puntajeMinimo} de 100` })
    ajustes.push({ etiqueta: 'Ex empleados', valor: etapa.cv.exEmpleados ? 'Se aceptan' : 'No se aceptan' })
  }
  etapa.pruebas?.forEach((prueba) => ajustes.push({ etiqueta: prueba.tipo, valor: `${prueba.idioma} · mínimo ${prueba.puntajeMinimo}` }))
  if (etapa.agente) {
    ajustes.push({ etiqueta: 'Agente', valor: etapa.agente.nombre.trim() || 'Sin nombre' })
    ajustes.push({ etiqueta: 'Duración', valor: etapa.agente.duracion })
    ajustes.push({ etiqueta: 'Puntaje mínimo', valor: `${etapa.agente.puntajeMinimo} de 100` })
  }
  if (etapa.entrevista) {
    ajustes.push({ etiqueta: 'Modalidad', valor: etapa.entrevista.modalidad === 'virtual' ? 'Virtual' : 'Telefónica' })
    ajustes.push({ etiqueta: 'Puntaje mínimo', valor: `${etapa.entrevista.puntajeMinimo} de 100` })
  }
  const preguntas = etapa.entrevista?.preguntas.map((pregunta) => pregunta.texto).filter(Boolean)
  return {
    id: etapa.clave,
    nombre: etapa.nombre,
    detalle: resumenEtapa(etapa) ?? etapa.categoria,
    tipo,
    conIA: etapa.conIa,
    dias: DIAS_POR_TIPO[tipo],
    ajustes,
    preguntas: preguntas && preguntas.length > 0 ? preguntas : undefined,
    tituloPreguntas: 'Preguntas de la entrevista',
  }
}

export function etapasDe(plantilla: PlantillaCatalogo): EtapaPlantilla[] {
  if (esPropia(plantilla)) return plantilla.vacante.etapas.map(deLaVacante)
  const c = plantilla.categoriaId
  const evaluar = CON_PRUEBA.has(c) ? prueba(c) : revision()
  switch (plantilla.etapas) {
    case 3:
      return [evaluacionCv(), evaluar, seleccionado()]
    case 4:
      return [evaluacionCv(), serena(c), evaluar, seleccionado()]
    case 5:
      return [evaluacionCv(), serena(c), evaluar, antecedentes(), seleccionado()]
    default:
      return [evaluacionCv(), serena(c), prueba(c), entrevistaLider(), antecedentes(), seleccionado()]
  }
}

export function categoriaDe(plantilla: PlantillaCatalogo) {
  return CATEGORIAS_PLANTILLA.find((categoria) => categoria.id === plantilla.categoriaId) ?? categoriaPropiaPorId(plantilla.categoriaId)
}

// Primero las de su misma categoría; si no alcanzan, se completa con el resto del catálogo.
// Las propias (tuyas o de una compañera) entran también, primero, si son de la misma categoría (IN-49).
export function relacionadasCon(plantilla: PlantillaCatalogo, cuantas = 3, propias: readonly PlantillaCatalogo[] = []): PlantillaCatalogo[] {
  const otras = [...propias, ...CATALOGO_PLANTILLAS].filter((otra) => otra.id !== plantilla.id)
  const misma = otras.filter((otra) => otra.categoriaId === plantilla.categoriaId)
  const resto = otras.filter((otra) => otra.categoriaId !== plantilla.categoriaId)
  return [...misma, ...resto].slice(0, cuantas)
}
