import { BD_MASTER_COMPETENCIAS, BD_MASTER_HABILIDADES } from '@/shared/bd'
import type { TarjetaContenidoProps } from '@/shared/components/TarjetaContenido'
import { CATALOGO, type TipoPlan } from './planes-datos'

// Lo que se puede asignar en un plan: el catálogo de contenidos (UBITS y la universidad corporativa de la empresa) y
// el de competencias. Los tipos y los aliados salen del catálogo del colaborador de hoy (/catalog: curso, short,
// charla, artículo, podcast, ruta…; Harvard, TED, Wobi, AWS, Microsoft).

export type TipoContenido = 'Curso' | 'Ruta' | 'Evento' | 'Charla' | 'Short' | 'Podcast' | 'Artículo'
export type Origen = 'UBITS' | 'Universidad corporativa'
export type Idioma = 'Español' | 'Inglés' | 'Portugués'

export type Contenido = {
  titulo: string
  tipo: TipoContenido
  origen: Origen
  // Quién lo produce: un aliado de UBITS o el área de la empresa que lo creó.
  autor: string
  minutos: number
  idioma: Idioma
}

export const TIPOS_CONTENIDO: TipoContenido[] = ['Curso', 'Ruta', 'Evento', 'Charla', 'Short', 'Podcast', 'Artículo']
export const ORIGENES: Origen[] = ['UBITS', 'Universidad corporativa']
export const IDIOMAS: Idioma[] = ['Español', 'Inglés', 'Portugués']

export const DURACIONES = [
  { id: 'corto', etiqueta: 'Menos de 30 min', cumple: (m: number) => m < 30 },
  { id: 'medio', etiqueta: 'De 30 min a 2 h', cumple: (m: number) => m >= 30 && m <= 120 },
  { id: 'largo', etiqueta: 'Más de 2 h', cumple: (m: number) => m > 120 },
] as const
export type Duracion = (typeof DURACIONES)[number]['id']

// Los contenidos que ya usan los planes de ejemplo van primero, con sus datos; después, el resto del catálogo.
const DATOS: Record<string, Omit<Contenido, 'titulo'>> = {
  'Onboarding comercial Q3': { tipo: 'Ruta', origen: 'Universidad corporativa', autor: 'Equipo comercial', minutos: 240, idioma: 'Español' },
  'Seguridad de la información 2026': { tipo: 'Curso', origen: 'Universidad corporativa', autor: 'Tecnología', minutos: 45, idioma: 'Español' },
  'Inducción corporativa': { tipo: 'Ruta', origen: 'Universidad corporativa', autor: 'Personas', minutos: 180, idioma: 'Español' },
  'Ruta para nuevos líderes': { tipo: 'Ruta', origen: 'UBITS', autor: 'Harvard ManageMentor', minutos: 360, idioma: 'Español' },
  'Ventas consultivas': { tipo: 'Curso', origen: 'UBITS', autor: 'Wobi', minutos: 95, idioma: 'Español' },
  'Bienestar y pausas activas': { tipo: 'Short', origen: 'UBITS', autor: 'UBITS', minutos: 12, idioma: 'Español' },
  'Atención al cliente omnicanal': { tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 80, idioma: 'Español' },
  'Protocolos en sitio': { tipo: 'Evento', origen: 'Universidad corporativa', autor: 'Operaciones', minutos: 120, idioma: 'Español' },
  'Excel intermedio': { tipo: 'Curso', origen: 'UBITS', autor: 'Microsoft', minutos: 150, idioma: 'Español' },
  'Normativa SST 2026': { tipo: 'Curso', origen: 'Universidad corporativa', autor: 'Personas', minutos: 60, idioma: 'Español' },
  'Negociación para compras': { tipo: 'Curso', origen: 'UBITS', autor: 'Harvard ManageMentor', minutos: 70, idioma: 'Español' },
  'IA generativa para el trabajo': { tipo: 'Curso', origen: 'UBITS', autor: 'AWS', minutos: 110, idioma: 'Español' },
  'Liderazgo ágil': { tipo: 'Curso', origen: 'UBITS', autor: 'Wobi', minutos: 85, idioma: 'Español' },
  'Comunicación efectiva': { tipo: 'Charla', origen: 'UBITS', autor: 'TED', minutos: 18, idioma: 'Inglés' },
  'Presentaciones de alto impacto': { tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 65, idioma: 'Español' },
}

const MAS: Contenido[] = [
  { titulo: 'Feedback que sí sirve', tipo: 'Charla', origen: 'UBITS', autor: 'TED', minutos: 14, idioma: 'Inglés' },
  { titulo: 'Gestión del tiempo en equipos remotos', tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 55, idioma: 'Español' },
  { titulo: 'Fundamentos de la nube', tipo: 'Ruta', origen: 'UBITS', autor: 'AWS', minutos: 420, idioma: 'Inglés' },
  { titulo: 'Power BI desde cero', tipo: 'Curso', origen: 'UBITS', autor: 'Microsoft', minutos: 190, idioma: 'Español' },
  { titulo: 'Liderar en tiempos de cambio', tipo: 'Podcast', origen: 'UBITS', autor: 'Wobi', minutos: 32, idioma: 'Español' },
  { titulo: 'Diversidad e inclusión en el trabajo', tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 40, idioma: 'Español' },
  { titulo: 'Pensamiento crítico', tipo: 'Short', origen: 'UBITS', autor: 'UBITS', minutos: 9, idioma: 'Español' },
  { titulo: 'Negociación en inglés', tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 75, idioma: 'Inglés' },
  { titulo: 'Atendimento ao cliente', tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 60, idioma: 'Portugués' },
  { titulo: 'Cómo leer un estado financiero', tipo: 'Artículo', origen: 'UBITS', autor: 'Harvard Business Review', minutos: 15, idioma: 'Español' },
  { titulo: 'Código de ética Meta Colombia', tipo: 'Curso', origen: 'Universidad corporativa', autor: 'Legal', minutos: 30, idioma: 'Español' },
  { titulo: 'Manejo de montacargas', tipo: 'Evento', origen: 'Universidad corporativa', autor: 'Operaciones', minutos: 240, idioma: 'Español' },
  { titulo: 'Producto y portafolio 2026', tipo: 'Ruta', origen: 'Universidad corporativa', autor: 'Marketing', minutos: 150, idioma: 'Español' },
  { titulo: 'Primeros auxilios en planta', tipo: 'Evento', origen: 'Universidad corporativa', autor: 'Personas', minutos: 180, idioma: 'Español' },
  { titulo: 'Scrum para equipos de negocio', tipo: 'Curso', origen: 'UBITS', autor: 'UBITS', minutos: 100, idioma: 'Español' },
]

export const CONTENIDOS: Contenido[] = [...CATALOGO.map((titulo) => ({ titulo, ...DATOS[titulo] })), ...MAS]

export const contenidoDe = (titulo: string) => CONTENIDOS.find((c) => c.titulo === titulo)

export const duracionTexto = (minutos: number) =>
  minutos < 60 ? `${minutos} min` : minutos % 60 ? `${Math.floor(minutos / 60)} h ${minutos % 60} min` : `${minutos / 60} h`

// ── Competencias ──
// Las del catálogo de UBITS (src/shared/bd: 35 competencias y sus 156 habilidades), no una lista inventada. Cada
// competencia es un grupo de habilidades (Comunicación tiene 7): en un plan de competencias se asigna la competencia
// y, si se quiere, se enfoca en algunas de sus habilidades (revisión de David, 30 sep).

type FilaBd = { id: string; nombre: string; archivoImagen?: string; competenciaId?: string }
const COMPETENCIAS_BD = (BD_MASTER_COMPETENCIAS as { competencias: FilaBd[] }).competencias
const HABILIDADES_BD = (BD_MASTER_HABILIDADES as { habilidades: FilaBd[] }).habilidades

export type Competencia = { id: string; titulo: string; habilidades: string[]; imagen?: string }

export const CATALOGO_COMPETENCIAS: Competencia[] = COMPETENCIAS_BD.map((c) => ({
  id: c.id,
  titulo: c.nombre,
  habilidades: HABILIDADES_BD.filter((h) => h.competenciaId === c.id).map((h) => h.nombre),
  imagen: c.archivoImagen ? encodeURI(`/images/imagenes competencias/${c.archivoImagen}`) : undefined,
}))

export const competenciaDe = (titulo: string) => CATALOGO_COMPETENCIAS.find((c) => c.titulo === titulo)

// ── Portadas ──
// El banner de cada contenido y de cada competencia, como los muestra UBITS en sus tarjetas. Son las portadas reales
// que ya trae el playground (public/images/cards-learn y public/images/imagenes competencias).

const C = '/images/cards-learn/'
const U = `${C}U-Corporativa/`
const PORTADA_CONTENIDO: Record<string, string> = {
  'Onboarding comercial Q3': `${C}abm-marketing-la-mejor-estrategia-para-ventas-b2b.jpeg`,
  'Seguridad de la información 2026': `${U}Ciberseguridad-y-protección-de-datos.jpg`,
  'Inducción corporativa': `${U}Inducción-a-la-cultura-y-valores-corporativos.jpg`,
  'Ruta para nuevos líderes': `${C}ruta-desarrollo-de-habilidades-de-liderazgo.jpeg`,
  'Ventas consultivas': `${C}analisis-de-mercado.jpeg`,
  'Bienestar y pausas activas': `${U}manejo-del-estres-laboral.jpg`,
  'Atención al cliente omnicanal': `${C}segmenta-la-experiencia-del-cliente.jpg`,
  'Protocolos en sitio': `${U}seguridad-y-salud-en-el-trabajo.jpg`,
  'Excel intermedio': `${U}Uso-eficiente-del-correo-electrónico-y-calendarios.jpg`,
  'Normativa SST 2026': `${U}Cumplimiento-normativo-y-código-de-conducta.jpg`,
  'Negociación para compras': `${C}lean-startup-emprendimiento-agil.jpeg`,
  'IA generativa para el trabajo': `${C}apps-para-acelerar-tu-productividad-con-ia.jpeg`,
  'Liderazgo ágil': `${C}liderazgo-en-planeacion-estrategica.jpeg`,
  'Comunicación efectiva': `${U}Comunicación-efectiva-en-el-trabajo.jpg`,
  'Presentaciones de alto impacto': `${U}presentaciones-de-alto-impacto.jpg`,
  'Feedback que sí sirve': `${U}dar-y-recibir-feedback.jpg`,
  'Gestión del tiempo en equipos remotos': `${U}gestion-equipos-remotos.jpg`,
  'Fundamentos de la nube': `${C}introduccion-al-backend-node-js.jpeg`,
  'Power BI desde cero': `${C}la-inteligencia-artificial-como-habilidad-digital-en-los-negocios.jpeg`,
  'Liderar en tiempos de cambio': `${C}liderazgo-en-tiempos-de-crisi.jpeg`,
  'Diversidad e inclusión en el trabajo': `${C}como-ejercer-el-liderazgo-inclusivo.jpeg`,
  'Pensamiento crítico': `${U}Pensamiento-crítico-y-toma-de-decisiones.jpg`,
  'Negociación en inglés': `${C}comunicacion-efectiva-para-lideres.jpeg`,
  'Atendimento ao cliente': `${C}comunicacion-y-empatia-claves-para-el-exito-en-equipo.jpeg`,
  'Cómo leer un estado financiero': `${C}el-producto-interior-bruto-pib.jpeg`,
  'Código de ética Meta Colombia': `${U}prevencion-acoso-laboral.jpg`,
  'Manejo de montacargas': `${C}portadas-ia/01-personas-en-oficina.jpg`,
  'Producto y portafolio 2026': `${C}disena-el-modelo-de-negocio-de-tu-producto.jpeg`,
  'Primeros auxilios en planta': `${C}portadas-ia/02-personas-en-oficina.jpg`,
  'Scrum para equipos de negocio': `${U}Gestión-de-proyectos-con-metodologías-ágiles.jpg`,
}


// La portada de un contenido o de una competencia, si la tiene (los nombres de archivo llevan tildes y espacios).
export function portadaDe(titulo: string, competencia = false) {
  if (competencia) return competenciaDe(titulo)?.imagen
  const ruta = PORTADA_CONTENIDO[titulo]
  return ruta ? encodeURI(ruta) : undefined
}

// ── Ficha para la tarjeta de contenido ──
// Lo que la tarjeta de contenido del equipo (TarjetaContenido) necesita de cada ítem del plan: portada, tipo, proveedor
// con su logo y ficha técnica. Antes cada tarjeta del plan lo armaba en su propia versión (TarjetaItem), retirada en la
// auditoría del 5-oct (decisión 17: una sola tarjeta de contenido).

const LOGOS = '/images/Favicons/'
const LOGO_PROVEEDOR: Record<string, string> = {
  UBITS: 'UBITS.jpg',
  Wobi: 'WOBI.jpg',
  TED: 'TED.jpg',
  AWS: 'AWS.jpg',
  Microsoft: 'Microsoft.jpg',
  'Harvard ManageMentor': 'Harvard-Business-Publishing.jpg',
  'Harvard Business Review': 'Harvard-Business-Publishing.jpg',
}
// Lo que creó un área de la empresa lleva el logo de la empresa.
const LOGO_EMPRESA = 'meta-colombia.jpg'

export function fichaDe(tipo: TipoPlan, titulo: string, { horas, enfoque }: { horas?: number; enfoque?: string[] } = {}): TarjetaContenidoProps {
  if (tipo === 'competencias') {
    const total = competenciaDe(titulo)?.habilidades.length ?? 0
    return {
      titulo,
      imagen: portadaDe(titulo, true),
      tipo: 'Competencia',
      // En competencias: las habilidades en que se enfoca el plan (sin enfoque, todas).
      competencia: total ? (enfoque ? `Enfocada en ${enfoque.length} de ${total} habilidades` : `${total} ${total === 1 ? 'habilidad' : 'habilidades'}`) : undefined,
      duracion: horas ? `${horas} h de estudio` : undefined,
    }
  }
  const contenido = contenidoDe(titulo)
  return {
    titulo,
    imagen: portadaDe(titulo),
    tipo: contenido?.tipo ?? 'Contenido',
    proveedor: contenido?.autor,
    logoProveedor: contenido ? `${LOGOS}${LOGO_PROVEEDOR[contenido.autor] ?? LOGO_EMPRESA}` : undefined,
    duracion: contenido ? duracionTexto(contenido.minutos) : undefined,
    // Como antes: el español no se dice; solo se marca lo que está en otro idioma.
    idioma: contenido && contenido.idioma !== 'Español' ? contenido.idioma : undefined,
  }
}
