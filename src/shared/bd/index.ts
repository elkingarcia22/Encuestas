// Bases de datos ficticias del playground. Todo es local: aquí no hay API ni backend.
//
// Portadas del catálogo del playground anterior para que las pantallas cuenten la misma historia
// (mismos contenidos, mismas personas, mismos catálogos) en vez de inventar datos cada una.
//
//   import { CONTENIDOS, nombreNivel } from '@/shared/bd'

// Maestros: los catálogos con que se clasifica todo lo demás.
export * from './aliados'
export * from './categorias'
export * from './competencias'
export * from './habilidades'
export * from './niveles'
export * from './niveles-ingles'
export * from './tipos-contenido'

// Personas.
export * from './colaboradores'

// Contenidos: los de la empresa y los que trae UBITS.
export * from './catalogo-ubits'
export * from './contenidos'
export * from './editor-payload'
export * from './resultados-contenido'

// Formación y seguimiento.
export * from './evaluaciones-360'
export * from './planes-formacion'
export * from './tareas-y-planes'
