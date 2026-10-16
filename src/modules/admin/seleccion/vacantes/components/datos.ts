import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon,
  ChartUpIcon,
  ComputerIcon,
  Crown02Icon,
  CustomerSupportIcon,
  FactoryIcon,
  FavouriteIcon,
  HeadsetIcon,
  PackageIcon,
  Settings02Icon,
  SourceCodeIcon,
  Store01Icon,
  UserAdd01Icon,
  UserMultiple02Icon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'

// Datos del listado de vacantes. Los estados y el tono riman con el detalle
// (`detalle/components/data.ts`): las tres vacantes con `id` de esa lista abren su ficha.

export type EstadoVacante = 'Publicada' | 'Pausada' | 'Borrador' | 'Cerrada'

export const ESTADOS: EstadoVacante[] = ['Publicada', 'Pausada', 'Borrador', 'Cerrada']

export const ESTADO_BADGE: Record<EstadoVacante, 'success-light' | 'warning-light' | 'outline' | 'secondary'> = {
  Publicada: 'success-light',
  Pausada: 'warning-light',
  Borrador: 'outline',
  Cerrada: 'secondary',
}

export type VacanteLista = {
  id: string
  titulo: string
  area: string
  estado: EstadoVacante
  sede: string
  modalidad: string
  aplicaciones: number
  // Candidatos que llegaron en los últimos siete días.
  nuevos: number
  diasAbierta: number
  // Candidatos de esta vacante esperando una acción: revisar su hoja de vida, agendarles
  // entrevista o enviarles la oferta.
  porRevisar: number
  // Días desde que se creó. Solo importa para saber si un borrador lleva mucho tiempo sin publicarse.
  diasDesdeCreacion: number
  reclutador: string
  // Solo las que tienen ficha armada abren el detalle.
  conDetalle: boolean
}

// Lo que «Crear vacante» le pasa al listado al publicar: ahí la vacante aparece arriba y se abre «Compartir».
export type VacantePublicada = { titulo: string; area: string; sede: string; modalidad: string }

// Quien crea una vacante en la maqueta queda como su reclutador.
export const RECLUTADOR_ACTUAL = 'Laura Martínez'

// La parte de la dirección que nombra la vacante: sin tildes, en minúsculas y con guiones.
export const slugVacante = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const enlaceVacante = (titulo: string) => `https://empleos.ubits.com/vacantes/${slugVacante(titulo)}`

export function filaPublicada(publicada: VacantePublicada): VacanteLista {
  return {
    // Con sufijo: el nombre puede repetir el de una vacante que ya está en la lista.
    id: `${slugVacante(publicada.titulo)}-${Date.now().toString(36)}`,
    titulo: publicada.titulo,
    area: publicada.area,
    estado: 'Publicada',
    sede: publicada.sede,
    modalidad: publicada.modalidad,
    aplicaciones: 0,
    nuevos: 0,
    diasAbierta: 0,
    porRevisar: 0,
    diasDesdeCreacion: 0,
    reclutador: RECLUTADOR_ACTUAL,
    conDetalle: false,
  }
}

// Umbrales de las alertas de arriba.
export const DIAS_ESTANCADA = 30
export const DIAS_SIN_CANDIDATOS = 10
export const DIAS_BORRADOR_OLVIDADO = 7

export const VACANTES: VacanteLista[] = [
  {
    id: 'analista-de-datos',
    titulo: 'Analista de datos',
    area: 'Analítica y BI',
    estado: 'Publicada',
    sede: 'Bogotá',
    modalidad: 'Híbrido',
    aplicaciones: 86,
    nuevos: 12,
    diasAbierta: 18,
    porRevisar: 3,
    diasDesdeCreacion: 18,
    reclutador: 'Laura Martínez',
    conDetalle: true,
  },
  {
    id: 'disenadora-de-producto',
    titulo: 'Diseñador(a) de producto',
    area: 'Producto',
    estado: 'Publicada',
    sede: 'Medellín',
    modalidad: 'Remoto',
    aplicaciones: 54,
    nuevos: 9,
    diasAbierta: 9,
    porRevisar: 0,
    diasDesdeCreacion: 9,
    reclutador: 'Andrés Pardo',
    conDetalle: true,
  },
  {
    id: 'coordinador-de-turno',
    titulo: 'Coordinador de turno',
    area: 'Operaciones',
    estado: 'Pausada',
    sede: 'Planta Funza',
    modalidad: 'Presencial',
    aplicaciones: 41,
    nuevos: 0,
    diasAbierta: 27,
    porRevisar: 0,
    diasDesdeCreacion: 27,
    reclutador: 'Sara Gómez',
    conDetalle: true,
  },
  {
    id: 'ejecutivo-comercial',
    titulo: 'Ejecutivo comercial',
    area: 'Comercial',
    estado: 'Publicada',
    sede: 'Bogotá',
    modalidad: 'Híbrido',
    aplicaciones: 132,
    nuevos: 24,
    diasAbierta: 34,
    porRevisar: 5,
    diasDesdeCreacion: 34,
    reclutador: 'Laura Martínez',
    conDetalle: false,
  },
  {
    id: 'asesor-de-servicio',
    titulo: 'Asesor de servicio al cliente',
    area: 'Servicio al cliente',
    estado: 'Publicada',
    sede: 'Lima',
    modalidad: 'Remoto',
    aplicaciones: 210,
    nuevos: 38,
    diasAbierta: 12,
    porRevisar: 8,
    diasDesdeCreacion: 12,
    reclutador: 'Andrés Pardo',
    conDetalle: false,
  },
  {
    id: 'coordinador-de-seleccion',
    titulo: 'Coordinador de selección',
    area: 'Gente y cultura',
    estado: 'Publicada',
    sede: 'Ciudad de México',
    modalidad: 'Híbrido',
    aplicaciones: 47,
    nuevos: 6,
    diasAbierta: 41,
    porRevisar: 0,
    diasDesdeCreacion: 41,
    reclutador: 'Sara Gómez',
    conDetalle: false,
  },
  {
    id: 'auxiliar-de-bodega',
    titulo: 'Auxiliar de bodega',
    area: 'Operaciones',
    estado: 'Publicada',
    sede: 'Planta Funza',
    modalidad: 'Presencial',
    aplicaciones: 168,
    nuevos: 31,
    diasAbierta: 7,
    porRevisar: 0,
    diasDesdeCreacion: 7,
    reclutador: 'Sara Gómez',
    conDetalle: false,
  },
  {
    id: 'supervisor-de-calidad',
    titulo: 'Supervisor de calidad',
    area: 'Operaciones',
    estado: 'Publicada',
    sede: 'Planta Funza',
    modalidad: 'Presencial',
    aplicaciones: 0,
    nuevos: 0,
    diasAbierta: 16,
    porRevisar: 0,
    diasDesdeCreacion: 16,
    reclutador: 'Sara Gómez',
    conDetalle: false,
  },
  {
    id: 'analista-financiero',
    titulo: 'Analista financiero',
    area: 'Finanzas',
    estado: 'Borrador',
    sede: 'Bogotá',
    modalidad: 'Híbrido',
    aplicaciones: 0,
    nuevos: 0,
    diasAbierta: 0,
    porRevisar: 0,
    diasDesdeCreacion: 12,
    reclutador: 'Laura Martínez',
    conDetalle: false,
  },
  {
    id: 'desarrollador-backend',
    titulo: 'Desarrollador backend',
    area: 'Tecnología',
    estado: 'Publicada',
    sede: 'Santiago de Chile',
    modalidad: 'Remoto',
    aplicaciones: 73,
    nuevos: 15,
    diasAbierta: 22,
    porRevisar: 2,
    diasDesdeCreacion: 22,
    reclutador: 'Andrés Pardo',
    conDetalle: false,
  },
  {
    id: 'jefe-de-planta',
    titulo: 'Jefe de planta',
    area: 'Operaciones',
    estado: 'Cerrada',
    sede: 'Planta Funza',
    modalidad: 'Presencial',
    aplicaciones: 58,
    nuevos: 0,
    diasAbierta: 46,
    porRevisar: 0,
    diasDesdeCreacion: 46,
    reclutador: 'Sara Gómez',
    conDetalle: false,
  },
  {
    id: 'key-account-manager',
    titulo: 'Key account manager',
    area: 'Comercial',
    estado: 'Pausada',
    sede: 'Medellín',
    modalidad: 'Híbrido',
    aplicaciones: 29,
    nuevos: 0,
    diasAbierta: 38,
    porRevisar: 0,
    diasDesdeCreacion: 38,
    reclutador: 'Laura Martínez',
    conDetalle: false,
  },
  {
    id: 'practicante-de-marketing',
    titulo: 'Practicante de marketing',
    area: 'Marketing',
    estado: 'Borrador',
    sede: 'Bogotá',
    modalidad: 'Híbrido',
    aplicaciones: 0,
    nuevos: 0,
    diasAbierta: 0,
    porRevisar: 0,
    diasDesdeCreacion: 3,
    reclutador: 'Andrés Pardo',
    conDetalle: false,
  },
]

// ── Plantillas de vacante: el catálogo completo, agrupado por categoría ──

// El tono tiñe el IconTile (variant="soft" toma el color de esta clase de texto):
// cada plantilla se distingue con un token del tema, no con un color inventado.
export type TonoCatalogo = 'text-primary' | 'text-success' | 'text-warning' | 'text-info' | 'text-destructive'

// Cada categoría tiene su color, y todas sus plantillas lo comparten: el icono de una plantilla dice de qué
// categoría es. Son los cinco tonos del tema, así que las categorías que crea la persona (áreas nuevas) repiten
// el ciclo. El rojo se usa aquí como un color más, no como aviso de error.
export const TONOS_CATEGORIA: TonoCatalogo[] = ['text-primary', 'text-info', 'text-success', 'text-warning', 'text-destructive']

const TONO_DE_SISTEMA: Record<string, TonoCatalogo> = {
  comercial: TONOS_CATEGORIA[0],
  servicio: TONOS_CATEGORIA[1],
  operaciones: TONOS_CATEGORIA[2],
  tecnologia: TONOS_CATEGORIA[3],
  gente: TONOS_CATEGORIA[4],
}

/** El color de una categoría: fijo para las del sistema; las creadas por la persona siguen el ciclo por su orden de creación. */
export function tonoDeCategoria(categoriaId: string, creadas: readonly { id: string }[] = []): TonoCatalogo {
  const fijo = TONO_DE_SISTEMA[categoriaId]
  if (fijo) return fijo
  const posicion = creadas.findIndex((categoria) => categoria.id === categoriaId)
  return TONOS_CATEGORIA[(Math.max(posicion, 0) + Object.keys(TONO_DE_SISTEMA).length) % TONOS_CATEGORIA.length]
}

// La categoría solo encabeza su grupo: sin icono, para que se distinga de las plantillas.
export type CategoriaPlantilla = {
  id: string
  nombre: string
  detalle: string
}

export const CATEGORIAS_PLANTILLA: CategoriaPlantilla[] = [
  { id: 'comercial', nombre: 'Comercial', detalle: 'Ventas, cuentas y crecimiento comercial.' },
  { id: 'servicio', nombre: 'Servicio al cliente', detalle: 'Atención, soporte y experiencia del cliente.' },
  { id: 'operaciones', nombre: 'Operaciones', detalle: 'Planta, bodega y logística del día a día.' },
  { id: 'tecnologia', nombre: 'Tecnología y datos', detalle: 'Desarrollo, analítica y soporte técnico.' },
  { id: 'gente', nombre: 'Gente y cultura', detalle: 'Selección, bienestar y desarrollo de las personas.' },
]

// Cada plantilla es un cargo: lo que cambia entre una y otra es el proceso (sus etapas).
export type PlantillaCatalogo = {
  id: string
  categoriaId: string
  nombre: string
  detalle: string
  etapas: number
  icono: IconSvgElement
  tono: TonoCatalogo
  // Se destaca arriba del catálogo, además de aparecer en su categoría.
  recomendada?: boolean
  // Las más usadas: son las que aparecen en la fila de la pantalla de Vacantes.
  destacada?: boolean
}

const CATALOGO_BASE: PlantillaCatalogo[] = [
  // Comercial
  {
    id: 'ejecutivo-comercial',
    categoriaId: 'comercial',
    nombre: 'Ejecutivo comercial',
    detalle: 'Ventas, clientes nuevos y cuentas para el equipo comercial.',
    etapas: 5,
    icono: ChartUpIcon,
    tono: 'text-primary',
    recomendada: true,
    destacada: true,
  },
  {
    id: 'key-account-manager',
    categoriaId: 'comercial',
    nombre: 'Key account manager',
    detalle: 'Cuentas grandes, renovación y crecimiento de cartera.',
    etapas: 5,
    icono: Crown02Icon,
    tono: 'text-info',
  },
  {
    id: 'representante-de-ventas',
    categoriaId: 'comercial',
    nombre: 'Representante de ventas',
    detalle: 'Prospección y cierre para el equipo de campo.',
    etapas: 4,
    icono: Store01Icon,
    tono: 'text-success',
  },
  // Servicio al cliente
  {
    id: 'asesor-de-servicio',
    categoriaId: 'servicio',
    nombre: 'Asesor de servicio al cliente',
    detalle: 'Atención, tiempos de respuesta y resolución en el primer contacto.',
    etapas: 4,
    icono: HeadsetIcon,
    tono: 'text-success',
    destacada: true,
  },
  {
    id: 'agente-bilingue',
    categoriaId: 'servicio',
    nombre: 'Agente bilingüe',
    detalle: 'Soporte en inglés y español para cuentas internacionales.',
    etapas: 4,
    icono: CustomerSupportIcon,
    tono: 'text-info',
  },
  {
    id: 'lider-de-servicio',
    categoriaId: 'servicio',
    nombre: 'Líder de servicio',
    detalle: 'Coordina el equipo de atención y sus indicadores de calidad.',
    etapas: 6,
    icono: FavouriteIcon,
    tono: 'text-primary',
  },
  // Operaciones
  {
    id: 'auxiliar-de-bodega',
    categoriaId: 'operaciones',
    nombre: 'Auxiliar de bodega',
    detalle: 'Recepción, alistamiento y despacho de mercancía.',
    etapas: 3,
    icono: PackageIcon,
    tono: 'text-warning',
    destacada: true,
  },
  {
    id: 'coordinador-de-turno',
    categoriaId: 'operaciones',
    nombre: 'Coordinador de turno',
    detalle: 'Supervisa la línea de producción durante su turno.',
    etapas: 5,
    icono: Settings02Icon,
    tono: 'text-primary',
  },
  {
    id: 'jefe-de-planta',
    categoriaId: 'operaciones',
    nombre: 'Jefe de planta',
    detalle: 'Responde por la productividad y seguridad de la planta.',
    etapas: 6,
    icono: FactoryIcon,
    tono: 'text-warning',
  },
  // Tecnología y datos
  {
    id: 'desarrollador-backend',
    categoriaId: 'tecnologia',
    nombre: 'Desarrollador backend',
    detalle: 'Servicios, integraciones y mantenimiento de la plataforma.',
    etapas: 5,
    icono: SourceCodeIcon,
    tono: 'text-info',
  },
  {
    id: 'analista-de-datos',
    categoriaId: 'tecnologia',
    nombre: 'Analista de datos',
    detalle: 'Tableros y reportes para que las áreas decidan con datos.',
    etapas: 4,
    icono: Analytics01Icon,
    tono: 'text-success',
  },
  {
    id: 'soporte-tecnico',
    categoriaId: 'tecnologia',
    nombre: 'Soporte técnico',
    detalle: 'Primera línea de atención a incidentes de la plataforma.',
    etapas: 3,
    icono: ComputerIcon,
    tono: 'text-primary',
  },
  // Gente y cultura
  {
    id: 'coordinador-de-seleccion',
    categoriaId: 'gente',
    nombre: 'Coordinador de selección',
    detalle: 'Lleva los procesos de selección de principio a fin.',
    etapas: 5,
    icono: UserSearch01Icon,
    tono: 'text-info',
  },
  {
    id: 'generalista-de-rrhh',
    categoriaId: 'gente',
    nombre: 'Generalista de RRHH',
    detalle: 'Nómina, contratos y bienestar del equipo.',
    etapas: 4,
    icono: UserAdd01Icon,
    tono: 'text-success',
  },
  {
    id: 'lider-de-cultura',
    categoriaId: 'gente',
    nombre: 'Líder de cultura',
    detalle: 'Clima, comunicación interna y experiencia del colaborador.',
    etapas: 5,
    icono: UserMultiple02Icon,
    tono: 'text-warning',
  },
]

// Cada plantilla toma el color de su categoría (el `tono` de arriba queda como valor de partida).
export const CATALOGO_PLANTILLAS: PlantillaCatalogo[] = CATALOGO_BASE.map((plantilla) => ({ ...plantilla, tono: tonoDeCategoria(plantilla.categoriaId) }))

// Las tres que se ven en la fila de la pantalla, sin tener que abrir el catálogo.
export const PLANTILLAS_DESTACADAS = CATALOGO_PLANTILLAS.filter((plantilla) => plantilla.destacada)
