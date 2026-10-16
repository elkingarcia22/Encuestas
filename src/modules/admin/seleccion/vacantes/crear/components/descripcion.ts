// Las secciones de la descripción de la vacante: el texto que después ve el candidato en el aviso.
// Vienen cuatro por defecto, se pueden reordenar, renombrar, borrar y agregar.

export type SeccionDescripcion = {
  id: string
  titulo: string
  texto: string
}

export const LIMITE_TEXTO = 800

export const SECCIONES_POR_DEFECTO: SeccionDescripcion[] = [
  { id: 'rol', titulo: 'Descripción del rol', texto: '' },
  { id: 'responsabilidades', titulo: 'Responsabilidades principales', texto: '' },
  { id: 'requisitos', titulo: 'Requisitos', texto: '' },
  { id: 'beneficios', titulo: 'Beneficios', texto: '' },
]

// Texto de ejemplo con el que responde «Generar con IA» en la maqueta: cambia según el título de la
// sección para que se note que la IA escribe sobre eso y no siempre lo mismo.
const EJEMPLOS: Record<string, string> = {
  rol: 'Buscamos a alguien que lleve el diseño y la evolución de nuestros servicios de backend, trabajando de cerca con producto y datos para convertir necesidades de negocio en sistemas que aguanten el crecimiento del último año.',
  responsabilidades:
    'Diseñar y mantener servicios y APIs.\nRevisar el código del equipo y acompañar a quienes van empezando.\nParticipar en las decisiones de arquitectura.\nVigilar el rendimiento y la disponibilidad de lo que publicamos.',
  requisitos:
    'Cuatro años o más construyendo servicios en producción.\nSoltura con bases de datos relacionales y con colas de mensajes.\nExperiencia trabajando en equipo con revisión de código.\nInglés para leer documentación técnica.',
  beneficios:
    'Trabajo remoto con encuentros presenciales cada trimestre.\nPresupuesto anual de formación.\nMedicina prepagada para ti y tu familia.\nHorario flexible.',
}

export function textoGenerado(seccion: SeccionDescripcion) {
  return (
    EJEMPLOS[seccion.id] ??
    `Contenido propuesto para «${seccion.titulo}». En el producto real este texto lo escribe la IA a partir del cargo, el área y las habilidades clave de la vacante.`
  )
}

export function seccionNueva(): SeccionDescripcion {
  return { id: `seccion-${Date.now()}`, titulo: 'Nueva sección', texto: '' }
}
