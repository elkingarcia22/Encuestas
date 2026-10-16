import { BDS_CONTENIDOS_UBITS } from './catalogo-ubits'
import { BD_MASTER_COMPETENCIAS } from './competencias'
import { CONTENIDOS, type Contenido } from './contenidos'

// Los catálogos de contenido de una empresa.
//
// Hoy casi toda empresa tiene **uno solo** y por eso nunca hizo falta nombrarlo. Pero hay empresas que manejan dos
// LMS, y el caso que toca pintar es el de UBITS, que usa su propio producto: tiene el catálogo que le vende a sus
// clientes y, aparte, **Ubits College**, la formación interna de su propio equipo —cosas que no salen para afuera—.
// Mañana otra empresa puede partir el suyo como quiera: por país, por marca, por filial.
//
// La regla que sale de ahí, y que es lo que hay que enseñar: **el selector de catálogo solo aparece cuando la
// empresa tiene más de uno**. Con uno solo no se muestra nada, que es lo que ve hoy el 100 % de los clientes.
//
// No confundir con la **Universidad corporativa**, que es otra cosa: el espacio donde una empresa personaliza cómo
// se le presenta su formación a sus colaboradores. Un catálogo es de dónde sale el contenido; la universidad
// corporativa es el escaparate (Dave, 6-oct).

/**
 * Un contenido de un catálogo. `categoria` viene ya resuelta cuando no sale del catálogo de categorías de la
 * empresa: lo de UBITS se clasifica por **competencia**, que es lo mismo a la hora de buscar y va en el mismo sitio.
 */
export type ContenidoDeCatalogo = Contenido & { categoria?: string }

export type Catalogo = {
  id: string
  nombre: string
  /** Una línea en el selector: para quién es ese catálogo. */
  descripcion: string
  contenidos: ContenidoDeCatalogo[]
}

/**
 * Lo propio de UBITS, escrito para el caso: onboarding, cómo se vende, los rituales. Va **delante** de lo que creó
 * la empresa (`CONTENIDOS`), que también es formación interna —inducción, seguridad y salud, código de conducta— y
 * en el caso de UBITS es exactamente lo que vive en Ubits College. Las portadas se reusan del banco que ya tiene el
 * playground: en un prototipo nadie juzga un selector de catálogo por las fotos (Dave, 6-oct).
 */
const UBITS_COLLEGE: Contenido[] = [
  {
    id: 'uc-001',
    imagen: '/images/cards-learn/U-Corporativa/Inducción-a-la-cultura-y-valores-corporativos.jpg',
    titulo: 'Onboarding UBITS: tus primeras dos semanas',
    descripcion: 'Quiénes somos, cómo trabajamos y qué se espera de ti en tus primeros quince días.',
    tipo: 'Ruta de aprendizaje',
    minutos: 180,
    idioma: 'Español',
    nivelId: 'niv-001',
    categoriaId: 'cfq-001',
    creacion: '2026-02-03',
    visibilidad: 'Publicado',
    conCertificacion: true,
  },
  {
    id: 'uc-002',
    imagen: '/images/cards-learn/abm-marketing-la-mejor-estrategia-para-ventas-b2b.jpeg',
    titulo: 'Cómo vendemos UBITS',
    descripcion: 'El discurso comercial, las objeciones que más salen y cómo se arma una propuesta.',
    tipo: 'Curso',
    minutos: 90,
    idioma: 'Español',
    nivelId: 'niv-002',
    categoriaId: 'cfq-002',
    creacion: '2026-03-18',
    visibilidad: 'Publicado',
    conCertificacion: false,
  },
  {
    id: 'uc-003',
    imagen: '/images/cards-learn/U-Corporativa/Ciberseguridad-y-protección-de-datos.jpg',
    titulo: 'Seguridad de la información y manejo de datos de clientes',
    descripcion: 'Obligatorio para todo el equipo: qué se puede tocar, qué no y qué hacer ante un incidente.',
    tipo: 'Curso',
    minutos: 45,
    idioma: 'Español',
    nivelId: 'niv-001',
    categoriaId: 'cfq-003',
    creacion: '2026-01-15',
    visibilidad: 'Publicado',
    conCertificacion: true,
  },
  {
    id: 'uc-004',
    imagen: '/images/cards-learn/segmenta-la-experiencia-del-cliente.jpg',
    titulo: 'Inducción a Customer Success',
    descripcion: 'Cómo acompañamos a una empresa desde que firma hasta su primera renovación.',
    tipo: 'Curso',
    minutos: 120,
    idioma: 'Español',
    nivelId: 'niv-002',
    categoriaId: 'cfq-002',
    creacion: '2026-04-02',
    visibilidad: 'Publicado',
    conCertificacion: false,
  },
  {
    id: 'uc-005',
    imagen: '/images/cards-learn/U-Corporativa/dar-y-recibir-feedback.jpg',
    titulo: 'Cómo damos feedback en UBITS',
    descripcion: 'Nuestro marco para conversaciones difíciles y para los ciclos de desempeño.',
    tipo: 'Curso',
    minutos: 60,
    idioma: 'Español',
    nivelId: 'niv-002',
    categoriaId: 'cfq-001',
    creacion: '2026-05-21',
    visibilidad: 'Publicado',
    conCertificacion: false,
  },
  {
    id: 'uc-006',
    imagen: '/images/cards-learn/U-Corporativa/Cumplimiento-normativo-y-código-de-conducta.jpg',
    titulo: 'Código de conducta y canal de denuncias',
    descripcion: 'Qué esperamos de cada persona y dónde reportar lo que no cuadra.',
    tipo: 'Curso',
    minutos: 30,
    idioma: 'Español',
    nivelId: 'niv-001',
    categoriaId: 'cfq-003',
    creacion: '2026-01-15',
    visibilidad: 'Publicado',
    conCertificacion: true,
  },
  {
    id: 'uc-007',
    imagen: '/images/cards-learn/la-inteligencia-artificial-como-habilidad-digital-en-los-negocios.jpeg',
    titulo: 'La IA en nuestro producto: qué prometemos y qué no',
    descripcion: 'Para hablar de las funciones con IA sin vender humo delante de un cliente.',
    tipo: 'Curso',
    minutos: 75,
    idioma: 'Español',
    nivelId: 'niv-003',
    categoriaId: 'cfq-002',
    creacion: '2026-06-09',
    visibilidad: 'Borrador',
    conCertificacion: false,
  },
  {
    id: 'uc-008',
    imagen: '/images/cards-learn/U-Corporativa/trabajo-en-equipo.jpg',
    titulo: 'Rituales de equipo: cómo corremos los trimestres',
    descripcion: 'Planeación, seguimiento y cierre. Qué se espera de cada quién en cada ceremonia.',
    tipo: 'Curso',
    minutos: 50,
    idioma: 'Español',
    nivelId: 'niv-002',
    categoriaId: 'cfq-001',
    creacion: '2026-07-14',
    visibilidad: 'Publicado',
    conCertificacion: false,
  },
]

const COMPETENCIAS = (BD_MASTER_COMPETENCIAS as { competencias: { id: string; nombre: string }[] }).competencias
const competencia = (id?: string) => COMPETENCIAS.find((c) => c.id === id)?.nombre ?? ''
const conBarra = (valor?: string | null) => (valor ? (valor.startsWith('/') ? valor : `/${valor}`) : '')

/**
 * El catálogo comercial no guarda cuándo se publicó cada contenido, y la pantalla sí lo usa: para la columna
 * «Creación» y para estimar el consumo, que cuenta los meses que lleva publicado. Se deriva del identificador —el
 * mismo contenido da siempre la misma fecha, así la pantalla no cambia entre recargas— y se reparte entre enero de
 * 2023 y hoy, que es como se ve un catálogo que lleva años creciendo (Dave, 6-oct).
 */
function fechaEstable(id: string) {
  let valor = 0
  for (const letra of id) valor = (valor * 31 + letra.charCodeAt(0)) % 100000
  const fecha = new Date(2023, 0, 1)
  fecha.setMonth(fecha.getMonth() + (valor % 42))
  fecha.setDate(1 + (valor % 27))
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

type ItemUbits = {
  id: string
  titulo: string
  descripcion?: string
  imagen?: string
  tipoContenido?: string
  tiempoValor?: number
  unidadTiempo?: string
  idioma?: string
  nivelId?: string
  competenciaPrincipalId?: string
  conCertificacion?: boolean
}

/**
 * El catálogo que UBITS le vende a sus clientes: los 85 contenidos de `catalogo-ubits`, los mismos que ya se pueden
 * meter en una ruta. No llevan visibilidad —ya vienen publicados, no los creó la empresa— y se clasifican por
 * competencia en vez de por categoría.
 */
const CATALOGO_COMERCIAL: ContenidoDeCatalogo[] = (BDS_CONTENIDOS_UBITS as { contents: ItemUbits[] }).contents.map((c) => ({
  id: c.id,
  imagen: conBarra(c.imagen),
  titulo: c.titulo,
  descripcion: c.descripcion ?? '',
  tipo: c.tipoContenido ?? 'Curso',
  minutos: c.unidadTiempo === 'horas' ? (c.tiempoValor ?? 0) * 60 : (c.tiempoValor ?? 0),
  idioma: c.idioma ?? 'Español',
  nivelId: c.nivelId ?? 'niv-001',
  categoriaId: c.competenciaPrincipalId ?? '',
  categoria: competencia(c.competenciaPrincipalId),
  creacion: fechaEstable(c.id),
  visibilidad: 'Publicado',
  conCertificacion: c.conCertificacion ?? false,
}))

/**
 * Qué catálogos tiene cada empresa. Toda empresa tiene al menos uno; el selector aparece de dos en adelante.
 * Las que no están aquí usan el de por defecto.
 */
const POR_EMPRESA: Record<string, Catalogo[]> = {
  ubits: [
    {
      id: 'ubits-clientes',
      nombre: 'Catálogo UBITS',
      descripcion: 'Lo que ven todas las empresas clientes',
      contenidos: CATALOGO_COMERCIAL,
    },
    {
      id: 'ubits-college',
      nombre: 'Ubits College',
      descripcion: 'Formación interna, solo para el equipo UBITS',
      contenidos: [...UBITS_COLLEGE, ...CONTENIDOS],
    },
  ],
}

const UNICO = (empresaId: string): Catalogo[] => [
  { id: `${empresaId}-general`, nombre: 'Catálogo de la empresa', descripcion: 'Todo el contenido de tu empresa', contenidos: CONTENIDOS },
]

export function catalogosDe(empresaId: string): Catalogo[] {
  return POR_EMPRESA[empresaId] ?? UNICO(empresaId)
}
