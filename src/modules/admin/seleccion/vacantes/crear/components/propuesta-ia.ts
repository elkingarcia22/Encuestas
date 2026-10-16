import { EXPERIENCIA_MAX } from './datos'
import { SECCIONES_POR_DEFECTO } from './descripcion'
import { flujoPropuesto } from './flujo-ia'
import type { VacanteNueva } from './formulario'

// «Crear con IA» junto al nombre: arma toda la vacante (los tres pasos) a partir del cargo escrito.
// La IA de la maqueta no piensa de verdad: lee palabras clave del nombre para que la propuesta cambie
// según el cargo (área, nivel, salario, habilidades) y no sea siempre la misma.

type Area = 'Tecnología' | 'Ventas' | 'Marketing' | 'Producto' | 'Diseño' | 'Recursos Humanos' | 'Operaciones' | 'Finanzas'

const PISTAS_AREA: [Area, RegExp][] = [
  ['Tecnología', /desarroll|ingenier|backend|frontend|software|datos|data|devops|qa|soporte t|analista de sistemas|programador/],
  ['Ventas', /venta|comercial|ejecutivo de cuenta|account|asesor comercial|key account/],
  ['Marketing', /marketing|mercadeo|contenido|community|seo|growth|marca/],
  ['Diseño', /diseñ|ux|ui|gráfic|creativ/],
  ['Producto', /producto|product|scrum|owner/],
  ['Recursos Humanos', /recursos humanos|rrhh|talento|selección|reclut|nómina|cultura/],
  ['Operaciones', /operaci|bodega|planta|logíst|almac|producción|turno|supervisor/],
  ['Finanzas', /finanz|contab|tesor|financier|auditor|costos/],
]

// expDesde/expHasta: años de experiencia, para el deslizador de rango. desde/hasta: salario mensual.
type Nivel = { seniority: string; expDesde: number; expHasta: number; desde: number; hasta: number }

// Rangos mensuales en COP por nivel: referencia para la maqueta, no una tabla salarial real.
const NIVELES: [RegExp, Nivel][] = [
  [/practicante|pasante|becari|aprendiz/, { seniority: '0 - Becario', expDesde: 0, expHasta: 1, desde: 1_300_000, hasta: 1_800_000 }],
  [/junior|\bjr\b|auxiliar|asistente/, { seniority: '1B - Junior', expDesde: 0, expHasta: 1, desde: 2_000_000, hasta: 3_200_000 }],
  [/senior|\bsr\b|especialista/, { seniority: '2B - Senior', expDesde: 6, expHasta: 7, desde: 7_000_000, hasta: 10_000_000 }],
  [/lead|líder|lider|coordinador/, { seniority: '2A - Lead', expDesde: 6, expHasta: 7, desde: 8_500_000, hasta: 12_000_000 }],
  [/gerente|manager|jefe/, { seniority: '3B - Manager', expDesde: 8, expHasta: 9, desde: 12_000_000, hasta: 18_000_000 }],
  [/director/, { seniority: '3A - Director', expDesde: 10, expHasta: EXPERIENCIA_MAX, desde: 18_000_000, hasta: 28_000_000 }],
]

const NIVEL_MEDIO: Nivel = { seniority: '1A - Mid', expDesde: 2, expHasta: 3, desde: 4_000_000, hasta: 6_500_000 }

const HABILIDADES: Record<Area, string[]> = {
  Tecnología: ['SQL', 'Python', 'Pensamiento analítico', 'Trabajo en equipo'],
  Ventas: ['Negociación', 'Comunicación', 'Orientación a resultados'],
  Marketing: ['Comunicación', 'Analítica digital', 'Creatividad'],
  Diseño: ['Diseño de interfaces', 'Investigación con usuarios', 'Comunicación'],
  Producto: ['Gestión de proyectos', 'Pensamiento analítico', 'Liderazgo'],
  'Recursos Humanos': ['Comunicación', 'Entrevistas por competencias', 'Confidencialidad'],
  Operaciones: ['Gestión de proyectos', 'Trabajo en equipo', 'Seguridad industrial'],
  Finanzas: ['Excel avanzado', 'Pensamiento analítico', 'Normas contables'],
}

export function propuestaIa(nombre: string): Partial<VacanteNueva> {
  const cargo = nombre.trim()
  const texto = cargo.toLowerCase()
  const area = PISTAS_AREA.find(([, pista]) => pista.test(texto))?.[0] ?? 'Operaciones'
  const nivel = NIVELES.find(([pista]) => pista.test(texto))?.[1] ?? NIVEL_MEDIO
  const conIngles = area === 'Tecnología' || area === 'Producto' || area === 'Diseño'

  return {
    // Paso 1 · Información general.
    area,
    pais: 'colombia',
    ciudad: 'Bogotá',
    // Paso 1 · Requisitos
    contrato: 'Término indefinido',
    idiomas: conIngles ? ['Español', 'Inglés'] : ['Español'],
    seniority: nivel.seniority,
    experienciaDesde: nivel.expDesde,
    experienciaHasta: nivel.expHasta,
    modalidad: area === 'Operaciones' ? 'presencial' : 'hibrido',
    // Paso 1 · Compensación
    moneda: 'COP',
    tipoSalario: 'rango',
    salarioDesde: String(nivel.desde),
    salarioHasta: String(nivel.hasta),
    // Paso 1 · Configuración
    publicarEnBolsas: true,
    correoRechazo: true,
    diasRechazo: 5,
    habilidades: HABILIDADES[area],
    // Paso 2 · Descripción
    secciones: SECCIONES_POR_DEFECTO.map((seccion) => ({ ...seccion, texto: textoSeccion(seccion.id, cargo, area) })),
    // Paso 3 · Proceso: el flujo recomendado más las etapas con IA del cargo, ya configuradas.
    etapas: flujoPropuesto({
      cargo,
      area,
      conIngles,
      conRolePlay: area === 'Ventas',
      exigente: nivel.expDesde >= 6,
    }),
  }
}

function textoSeccion(id: string, cargo: string, area: Area) {
  switch (id) {
    case 'rol':
      return `Buscamos a una persona para el cargo de ${cargo} en el equipo de ${area}. Trabajará de cerca con las demás áreas para cumplir los objetivos del equipo y proponer mejoras a la forma en que trabajamos.`
    case 'responsabilidades':
      return `Hacerse cargo de las tareas propias del cargo de ${cargo}.\nReportar avances y resultados a su líder.\nColaborar con otros equipos en los proyectos del área.\nProponer mejoras a los procesos del día a día.`
    case 'requisitos':
      return `Experiencia previa en un cargo similar.\nManejo de ${HABILIDADES[area].slice(0, 2).join(' y ')}.\nBuena comunicación y trabajo en equipo.\nGanas de aprender y crecer con la empresa.`
    case 'beneficios':
      return 'Esquema híbrido y horario flexible.\nPresupuesto anual de formación en UBITS.\nMedicina prepagada.\nDía libre en tu cumpleaños.'
    default:
      return ''
  }
}
