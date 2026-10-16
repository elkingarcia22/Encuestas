// Catálogos del recurso Video: avatares, voces, estilos, opciones del setup, plantillas de canvas, transiciones, música
// y la biblioteca de «Tus videos». Son los mismos datos y textos del prototipo de referencia (HU-LMS-001, recurso
// Video); los archivos viven en public/ con las mismas rutas.

import { CLASES_COLOR_LIBRE, esColorLibre } from '../color-libre'

// ── Tiempos y costos ─────────────────────────────────────────────────────────────────────────────────────────────

export const TIEMPO = {
  guion: 3000,
  avatarVideo: 15_000,
  borrador: 3000,
  /** «Continuar»: cuenta regresiva de la insignia (18 pasos · 32 ms, mínimo 850 ms) + 1 s. */
  abrirEditor: 1850,
  imagen: 1200,
  canvas: 2500,
  audio: 3000,
  sincronizar: 10_000,
  /** Generar video desde el editor: el render del prototipo nunca baja de 15 s. */
  render: 15_000,
}

export const COSTO_VIDEO = { guion: 80, avatarVideo: 320, editor: 320, imagen: 50, canvas: 50, sincronizar: 100 }

export const PLACEHOLDER_ESCENA = '/images/lms-creator/video-scene-placeholder.jpg'

// ── Sectores y avatares ──────────────────────────────────────────────────────────────────────────────────────────

export type Genero = 'f' | 'm'

export const SECTORES = [
  { id: 'staff', label: 'Staff & Oficina' },
  { id: 'agro', label: 'Agroindustria' },
  { id: 'propiedad', label: 'Construcción' },
  { id: 'consumo', label: 'Consumo Masivo' },
  { id: 'creatividad', label: 'Creatividad' },
  { id: 'energia', label: 'Energía & Minería' },
  { id: 'gobierno', label: 'Gobierno' },
  { id: 'hosteleria', label: 'Hostelería' },
  { id: 'industria', label: 'Industria & Manufactura' },
  { id: 'retail', label: 'Retail' },
  { id: 'salud', label: 'Salud & Farmacéuticos' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'seguros', label: 'Seguros & Finanzas' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'tech', label: 'Tecnología' },
  { id: 'transporte', label: 'Transporte & Logística' },
] as const

export const SECTOR_POR_DEFECTO = 'staff'

/** El campo Sector del setup los muestra en orden alfabético. */
export const SECTORES_ALFABETICO = [...SECTORES].sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))

export const nombreSector = (id: string) => SECTORES.find((s) => s.id === id)?.label ?? 'Staff & Oficina'

const PREFIJO_SECTOR: Record<string, string> = {
  agro: 'agro',
  serv: 'servicios',
  cmas: 'consumo',
  ener: 'energia',
  gob: 'gobierno',
  ind: 'industria',
  cons: 'propiedad',
  ret: 'retail',
  sal: 'salud',
  fin: 'seguros',
  tech: 'tech',
  log: 'transporte',
  sec: 'seguridad',
  host: 'hosteleria',
  staff: 'staff',
  crea: 'creatividad',
}

const ARCHIVOS_AVATAR = [
  'agro_f27_helena', 'agro_f45_marta', 'agro_m27_juan', 'agro_m45_roberto',
  'cmas_f27_sofia', 'cmas_f45_lucia', 'cmas_m27_luis', 'cmas_m45_fernando',
  'cons_f27_mariana', 'cons_f45_patricia', 'cons_f45_paula', 'cons_m27_santiago', 'cons_m45_hugo',
  'crea_f27_lorena', 'crea_m27_oscar', 'crea_m30_enrique', 'crea_m30_julian',
  'ener_f27_valentina', 'ener_f45_gabriela', 'ener_m27_diego', 'ener_m45_javier',
  'fin_f27_andrea', 'fin_f45_beatriz', 'fin_m27_lucas', 'fin_m45_joaquin',
  'gob_f27_isabella', 'gob_f45_carmen', 'gob_m27_mateo', 'gob_m45_francisco',
  'host_f27_blanca', 'host_m27_raul',
  'ind_f27_camila', 'ind_f45_victoria', 'ind_m27_alejandro', 'ind_m45_eduardo',
  'log_f27_julieta', 'log_f45_silvia', 'log_m27_rodrigo', 'log_m45_manuel',
  'ret_f27_martina', 'ret_f27_valeria', 'ret_f45_daniela', 'ret_m27_leonardo', 'ret_m45_miguel',
  'sal_f27_natalia', 'sal_f45_claudia', 'sal_m27_gabriel', 'sal_m45_arturo',
  'sec_f35_rosa', 'sec_m35_alberto',
  'serv_f27_ana', 'serv_m27_carlos', 'serv_m45_ricardo',
  'staff_f23_antonia', 'staff_f30_alicia', 'staff_f30_monica', 'staff_f32_maria', 'staff_f35_graciela',
  'staff_m23_benjamin', 'staff_m30_esteban', 'staff_m30_rafael', 'staff_m32_jorge', 'staff_m35_david',
  'tech_f27_sara', 'tech_f45_fernanda', 'tech_m27_felipe', 'tech_m45_gonzalo',
]

/** Solo estos avatares tienen video de muestra en el tab Video Avatar IA. */
const CON_VIDEO = new Set([
  'staff_f23_antonia', 'staff_f30_alicia', 'staff_f32_maria', 'staff_f30_monica', 'staff_f35_graciela',
  'staff_m23_benjamin', 'staff_m30_rafael', 'staff_m30_esteban', 'staff_m32_jorge', 'staff_m35_david',
  'ret_f27_valeria',
])

export type Avatar = { id: number; base: string; sector: string; nombre: string; genero: Genero }

export const AVATARES: Avatar[] = ARCHIVOS_AVATAR.map((base, i) => {
  const [, prefijo, genero, , nombre] = /^([a-z]+)_([fm])(\d+)_(.+)$/.exec(base) ?? []
  return {
    id: i + 1,
    base,
    sector: PREFIJO_SECTOR[prefijo] ?? 'staff',
    nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
    genero: genero as Genero,
  }
})

export const fotoAvatar = (a: Avatar) => `/images/avatars/${a.base}.jpg`
export const miniaturaAvatar = (a: Avatar) => `/images/avatar-temp-thumbs/thumb_${a.base}.jpg`
export const videoAvatar = (a: Avatar) => (CON_VIDEO.has(a.base) ? `/videos/avatars/${a.base}.mp4` : null)
export const avatarPorId = (id: number | null | undefined) => (id == null ? null : (AVATARES.find((a) => a.id === id) ?? null))

/** Categorías del tab Video Avatar IA: los sectores en el orden del producto y «Todos» al final. */
export const CATEGORIAS_AVATAR = [
  ...SECTORES.map((s) => ({ id: s.id, label: s.label, cantidad: AVATARES.filter((a) => a.sector === s.id).length })),
  { id: 'all', label: 'Todos', cantidad: AVATARES.length },
]

export const avataresDe = (sector: string, genero?: Genero) =>
  AVATARES.filter((a) => (sector === 'all' || a.sector === sector) && (!genero || a.genero === genero))

/** Industrias del modal «Avatar del video»: «Todos» primero y luego las que tienen avatares de ese género. */
export function categoriasPorGenero(genero: Genero) {
  const lista = avataresDe('all', genero)
  return [
    { id: 'all', label: 'Todos', cantidad: lista.length },
    ...SECTORES_ALFABETICO.map((s) => ({ id: s.id, label: s.label, cantidad: lista.filter((a) => a.sector === s.id).length })).filter(
      (c) => c.cantidad > 0,
    ),
  ]
}

/** El primero del sector con el género de la voz (Staff + femenina → Antonia; Staff + masculina → Benjamin). */
export function avatarPorDefecto(sector: string, genero: Genero): Avatar {
  return avataresDe(sector, genero)[0] ?? avataresDe(SECTOR_POR_DEFECTO, genero)[0] ?? AVATARES[0]
}

// ── Voces ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PAISES = [
  { codigo: 'co', pais: 'Colombia', bandera: '🇨🇴', idioma: 'es-CO', muestra: 'colombia' },
  { codigo: 'mx', pais: 'México', bandera: '🇲🇽', idioma: 'es-MX', muestra: 'mexico' },
  { codigo: 'ar', pais: 'Argentina', bandera: '🇦🇷', idioma: 'es-AR', muestra: 'argentina' },
  { codigo: 'cl', pais: 'Chile', bandera: '🇨🇱', idioma: 'es-CL', muestra: 'chile' },
  { codigo: 'pe', pais: 'Perú', bandera: '🇵🇪', idioma: 'es-PE', muestra: 'peru' },
  { codigo: 'do', pais: 'República Dominicana', bandera: '🇩🇴', idioma: 'es-DO', muestra: 'dominicana' },
  { codigo: 'ec', pais: 'Ecuador', bandera: '🇪🇨', idioma: 'es-EC', muestra: 'ecuador' },
  { codigo: 'us', pais: 'Estados Unidos', bandera: '🇺🇸', idioma: 'en-US', muestra: '' },
  { codigo: 'gb', pais: 'Inglaterra', bandera: '🇬🇧', idioma: 'en-GB', muestra: '' },
  { codigo: 'br', pais: 'Brasil', bandera: '🇧🇷', idioma: 'pt-BR', muestra: '' },
] as const

export type Voz = {
  id: string
  pais: string
  /** Código del país (co, mx…): con él sale su bandera redonda (public/images/banderas). */
  codigo: string
  bandera: string
  genero: Genero
  idioma: string
  /** Preescucha corta del selector; sin ella la voz sale como «Próximamente». */
  muestra: string
  disponible: boolean
}

export const VOCES: Voz[] = PAISES.flatMap((p) =>
  (['f', 'm'] as const).map((genero) => ({
    id: `${p.codigo}-${genero}-cercano`,
    pais: p.pais,
    codigo: p.codigo,
    bandera: p.bandera,
    genero,
    idioma: p.idioma,
    muestra: p.muestra ? `/audios/lms-creator/voces/${p.muestra}_${genero === 'f' ? 'femenino' : 'masculino'}.mp3` : '',
    disponible: Boolean(p.muestra),
  })),
)

export const PAISES_VOZ = PAISES.map((p) => p.pais)
export const VOZ_POR_DEFECTO = 'co-f-cercano'
export const vozPorId = (id: string | undefined) => VOCES.find((v) => v.id === id) ?? VOCES[0]
export const tituloVoz = (v: Voz) => (v.genero === 'f' ? 'Voz femenina' : 'Voz masculina')

// ── Estilos visuales ─────────────────────────────────────────────────────────────────────────────────────────────

export type EstiloId = 'corporativa' | 'fotografia' | 'pizarra' | 'comic' | 'origami' | 'videojuego'

export const ESTILOS: { id: EstiloId; label: string; descripcion: string; carpeta: string }[] = [
  { id: 'corporativa', label: 'Corporativo', descripcion: 'Diferentes tipos de escena: avatar, imágenes, canvas.', carpeta: 'fotografia' },
  { id: 'fotografia', label: 'Fotografía Real', descripcion: 'Imágenes fotográficas de alta calidad.', carpeta: 'fotografia' },
  { id: 'pizarra', label: 'Pizarra', descripcion: 'Ilustración tipo pizarra con trazo a mano.', carpeta: 'pizarra' },
  { id: 'comic', label: 'Ilustración vectorial', descripcion: 'Estética gráfica moderna y clara.', carpeta: 'comic' },
  { id: 'origami', label: 'Origami 3D', descripcion: 'Figuras de papel y cartón.', carpeta: 'origami' },
  { id: 'videojuego', label: 'Pixel Art 8-Bits', descripcion: 'Estética retro de videojuego clásico.', carpeta: 'videojuego' },
]

export const estiloPorId = (id: string | undefined) => ESTILOS.find((e) => e.id === id) ?? ESTILOS[0]
export const ESTILO_POR_DEFECTO: EstiloId = 'corporativa'

/** Solo con estas estéticas el avatar realista coincide con el look del video. */
export const admiteAvatar = (id: EstiloId) => id === 'corporativa' || id === 'fotografia'

export const imagenPack = (estilo: EstiloId, n: number) =>
  `/images/lms-creator/video-ia-escenas/${estiloPorId(estilo).carpeta}/escena-${String(((Math.max(1, n) - 1) % 30) + 1).padStart(2, '0')}.png`

// ── Opciones del setup ───────────────────────────────────────────────────────────────────────────────────────────

export const IDEAS_EJEMPLO = [
  {
    label: 'Onboarding 30 días',
    texto:
      'Un video de onboarding para quien entra a un rol nuevo. Cubre los primeros 30 días: qué debe aprender, con quién hablar y cómo pedir ayuda.',
  },
  {
    label: 'Política de compliance',
    texto:
      'Explica una política de compliance con dos casos reales: uno bien resuelto y otro con consecuencias. Cierra con qué debe hacer la persona si tiene dudas.',
  },
  {
    label: 'Capacitación de producto',
    texto: 'Capacitación de producto: presenta el problema del cliente, 3 beneficios concretos y un error frecuente al usarlo.',
  },
  {
    label: 'Feedback difícil',
    texto: 'Entrena a líderes a dar feedback difícil. Muestra una conversación mala, una buena y una lista corta de frases que sí ayudan.',
  },
  {
    label: 'Cambio organizacional',
    texto:
      'Comunica un cambio organizacional al equipo: qué cambia, qué no cambia y qué se espera de cada persona en las próximas 2 semanas.',
  },
]

export type ModoContexto = 'internet' | 'archivos' | 'ambos'

export const CONTEXTOS: { id: ModoContexto; label: string }[] = [
  { id: 'internet', label: 'Información de internet' },
  { id: 'archivos', label: 'Archivos adjuntos' },
  { id: 'ambos', label: 'Archivos e información de internet' },
]

export const OTRO = 'otro'

export const OBJETIVOS = [
  { id: 'comprender', label: 'Comprender un concepto o proceso' },
  { id: 'aplicar', label: 'Aplicar un procedimiento en el trabajo' },
  { id: 'conducta', label: 'Cambiar una conducta o hábito' },
  { id: 'sensibilizar', label: 'Sensibilizar o generar conciencia' },
  { id: 'onboarding', label: 'Onboarding o inducción' },
  { id: 'politica', label: 'Reforzar una política o norma' },
  { id: OTRO, label: 'Otro' },
]

export const AUDIENCIAS = [
  { id: 'empresa', label: 'Toda la empresa' },
  { id: 'liderazgo', label: 'Liderazgo / jefaturas' },
  { id: 'nuevos', label: 'Colaboradores nuevos' },
  { id: 'operativos', label: 'Equipos operativos' },
  { id: 'staff', label: 'Áreas de staff (RR. HH., finanzas, etc.)' },
  { id: 'mixtos', label: 'Públicos mixtos' },
  { id: OTRO, label: 'Otro' },
]

export const TONOS = [
  { id: 'cercano', label: 'Cercano y conversacional' },
  { id: 'formal', label: 'Formal e institucional' },
  { id: 'didactico', label: 'Didáctico y claro' },
  { id: 'motivador', label: 'Motivador' },
  { id: 'directo', label: 'Directo y práctico' },
  { id: OTRO, label: 'Otro' },
]

export type DuracionId = '1-3' | '3-5' | '5-10' | '10-15'

export const DURACIONES: { id: DuracionId; label: string }[] = [
  { id: '1-3', label: '1-3 minutos' },
  { id: '3-5', label: '3-5 minutos' },
  { id: '5-10', label: '5-10 minutos' },
  { id: '10-15', label: '10-15 minutos' },
]

export const MAXIMO_CONTEXTO = 500

// ── Guion del demo «Onboarding comercial — 30 días» ──────────────────────────────────────────────────────────────

export const TITULO_DEMO = 'Onboarding comercial — 30 días'

export const GUIONES = [
  'Bienvenido al equipo comercial. En los próximos treinta días vas a pasar de conocer la empresa a cerrar tus primeras oportunidades con autonomía.',
  'Este onboarding tiene cuatro semanas. Cada una con un objetivo claro, actividades definidas y una forma concreta de medir si vas avanzando bien.',
  'La semana uno es de contexto. Vas a entender qué vendemos, a quién se lo vendemos y por qué nos eligen frente a otros.',
  'Empieza por el producto. No memorices funcionalidades: aprende qué problema resuelve cada una y qué le cuesta al cliente no resolverlo.',
  'Revisa los casos de éxito. Son la prueba de que la promesa se cumple y la fuente de los datos que usarás en cada conversación.',
  'Conoce el mercado. Identifica quiénes son nuestros competidores, en qué ganan, en qué pierden y qué argumentos usan cuando compiten contra nosotros.',
  'Configura tus herramientas. Correo corporativo, calendario, teléfono y sobre todo el CRM: ahí vive tu pipeline y ahí se mide tu trabajo.',
  'Aprende la disciplina del CRM desde el primer día. Una oportunidad que no está registrada, para efectos prácticos, no existe para el equipo.',
  'Cierra la semana uno con una prueba corta de producto. Si algo no te quedó claro, este es el momento de preguntarlo.',
  'La semana dos es de discurso. Aquí conviertes lo que aprendiste en conversaciones que el cliente entiende, valora y recuerda después.',
  'Empieza por el cliente ideal. Sector, tamaño, cargo del decisor y el dolor que hoy le está costando dinero, tiempo o talento.',
  'Construye tu propuesta de valor en tres frases: qué problema atacas, cómo lo resuelves y qué resultado medible obtiene el cliente.',
  'Practica el descubrimiento. Preguntas abiertas primero, silencio después. El vendedor que más escucha es el que mejor califica la oportunidad.',
  'Aprende a calificar. Si no hay dolor, presupuesto, decisor y tiempo definido, no es una oportunidad: es una conversación agradable.',
  'Prepara las objeciones más frecuentes. Precio, tiempo de implementación y comparación con la competencia cubren la mayoría de los casos reales.',
  'Responde con datos, no con adjetivos. Una cifra de un caso de éxito vale más que cinco minutos defendiendo el producto.',
  'Graba tu discurso y escúchalo. Vas a detectar muletillas, prisas y explicaciones largas mucho antes de que las note un cliente.',
  'La semana tres es de práctica real. Sales a prospectar acompañado y empiezas a construir tu propio pipeline desde cero.',
  'Define tu lista de cuentas objetivo. Cincuenta empresas que cumplan el perfil ideal, con el contacto correcto identificado en cada una.',
  'Prospecta por varios canales. Correo, teléfono y red profesional funcionan mucho mejor combinados que cualquiera de los tres por separado.',
  'Acompaña a un vendedor senior en sus reuniones. Observa cómo abre, cómo pregunta, cómo maneja el silencio y cómo cierra el siguiente paso.',
  'Después de cada reunión, escribe qué funcionó y qué no. Ese cuaderno vale más que cualquier manual de ventas genérico.',
  'Haz tus primeras reuniones con apoyo. Tu líder entra como observador y te da retroalimentación específica al terminar, no una semana después.',
  'Registra todo en el CRM el mismo día. La memoria falla, el pipeline desactualizado engaña y las decisiones del equipo dependen de esos datos.',
  'La semana cuatro es de autonomía. Manejas tus reuniones solo y tu líder pasa de acompañarte a revisar resultados contigo.',
  'Tu meta de salida es clara: pipeline construido, reuniones agendadas y al menos una oportunidad avanzada hasta la etapa de propuesta.',
  'Conoce tus números. Cuota, ciclo de venta, ticket promedio y tasa de conversión definen cómo se ve un buen mes para ti.',
  'Usa el uno a uno con tu líder. Llega con preguntas concretas y tu pipeline abierto: esa reunión es tu mejor herramienta de aprendizaje.',
  'Al día treinta hacemos una revisión formal. Producto, discurso, prospección y disciplina de CRM: cuatro criterios, una conversación honesta.',
  'El onboarding termina, el aprendizaje no. Los mejores vendedores del equipo siguen practicando, revisando sus números y ajustando su discurso cada semana.',
]

/** Duración real de cada locución (escena-NN.mp3) por voz, en segundos. */
const DURACION_LOCUCION: Record<string, number[]> = {
  'ar-f-cercano': [8.751, 10.423, 8.046, 8.516, 7.811, 10.083, 9.77, 9.117, 7.445, 8.803, 9.482, 8.333, 8.646, 9.117, 8.646, 7.811, 9.064, 8.751, 8.385, 8.803, 9.221, 7.497, 8.803, 10.083, 8.464, 8.882, 9.3, 8.986, 10.736, 9.587],
  'ar-m-cercano': [8.62, 9.535, 7.575, 8.882, 7.811, 9.3, 10.292, 8.803, 7.445, 9.587, 9.064, 8.751, 9.352, 9.822, 8.464, 7.575, 8.62, 7.967, 8.568, 8.15, 9.717, 6.975, 9.3, 9.822, 8.333, 9.456, 8.15, 9.221, 10.005, 9.456],
  'cl-f-cercano': [8.751, 9.482, 7.68, 8.646, 7.157, 9.3, 9.456, 8.829, 7.21, 8.281, 9.038, 8.568, 9.117, 8.411, 8.411, 7.575, 8.464, 7.497, 8.281, 8.62, 8.986, 6.896, 8.751, 9.77, 7.445, 8.411, 7.784, 8.751, 10.24, 9.9],
  'cl-m-cercano': [7.811, 8.385, 6.713, 7.314, 6.557, 8.202, 8.333, 8.15, 6.06, 7.157, 7.68, 7.262, 7.915, 7.549, 7.314, 6.792, 7.497, 6.713, 7.68, 7.993, 7.811, 5.773, 7.993, 8.202, 7.21, 7.366, 7.079, 7.549, 8.646, 8.411],
  'co-f-cercano': [7.732, 8.646, 7.027, 7.993, 7.079, 9.117, 10.188, 8.281, 7.157, 7.863, 8.229, 7.993, 8.803, 9.117, 8.333, 6.949, 7.68, 7.21, 8.15, 8.15, 8.385, 6.713, 7.915, 8.934, 7.262, 7.967, 7.445, 7.915, 9.3, 9.247],
  'co-m-cercano': [7.915, 8.411, 6.739, 7.575, 7.027, 8.829, 8.699, 7.68, 5.956, 8.15, 7.732, 7.68, 8.385, 8.15, 7.628, 6.713, 6.896, 7.157, 7.68, 7.575, 8.62, 6.53, 7.811, 9.038, 6.896, 7.628, 6.844, 8.202, 8.646, 8.62],
  'do-f-cercano': [8.411, 9.117, 7.967, 8.464, 7.549, 9.404, 9.953, 9.169, 7.079, 8.464, 8.046, 8.803, 8.829, 8.829, 8.829, 7.549, 8.229, 7.967, 8.385, 8.646, 9.117, 7.445, 8.803, 9.874, 8.229, 8.516, 8.098, 8.464, 9.665, 9.665],
  'do-m-cercano': [8.62, 10.292, 8.333, 9.665, 8.646, 10.005, 9.822, 8.568, 7.314, 7.863, 9.3, 8.62, 9.404, 9.064, 8.803, 8.281, 8.646, 7.575, 8.699, 8.516, 9.535, 7.366, 9.77, 9.456, 8.934, 8.803, 8.411, 8.751, 10.919, 9.953],
  'ec-f-cercano': [8.751, 9.665, 7.863, 8.464, 7.732, 9.77, 9.117, 8.803, 7.079, 8.333, 8.62, 8.646, 8.986, 9.038, 8.803, 8.15, 8.464, 8.202, 8.699, 8.516, 9.456, 7.497, 9.456, 10.24, 7.863, 8.62, 8.516, 8.803, 9.717, 10.24],
  'ec-m-cercano': [9.456, 9.3, 7.784, 8.882, 8.229, 9.822, 9.77, 9.3, 7.157, 8.568, 8.803, 8.934, 9.665, 9.77, 9.117, 7.68, 8.281, 7.993, 8.986, 8.934, 9.822, 7.68, 9.535, 9.639, 8.646, 9.169, 8.098, 9.352, 10.318, 10.005],
  'mx-f-cercano': [7.863, 9.3, 7.21, 8.15, 7.157, 9.404, 9.456, 8.281, 6.792, 7.811, 8.333, 8.098, 8.646, 8.803, 7.915, 7.393, 7.732, 7.157, 8.229, 7.863, 9.404, 6.739, 8.229, 8.803, 7.497, 8.15, 8.15, 7.915, 9.221, 9.456],
  'mx-m-cercano': [7.967, 8.15, 6.975, 8.229, 7.131, 8.646, 9.221, 7.915, 6.792, 7.68, 8.098, 7.915, 8.751, 8.934, 7.811, 6.739, 7.628, 7.157, 7.549, 7.811, 8.568, 6.661, 8.229, 8.62, 7.314, 7.863, 7.575, 8.281, 9.352, 8.699],
  'pe-f-cercano': [8.62, 9.77, 8.15, 9.117, 8.202, 10.24, 9.77, 8.934, 7.445, 8.803, 9.665, 9.77, 9.717, 9.77, 8.046, 8.15, 9.064, 8.646, 8.62, 9.169, 9.9, 7.915, 9.3, 10.057, 7.863, 8.986, 8.803, 8.803, 9.77, 10.083],
  'pe-m-cercano': [8.934, 8.62, 7.157, 8.281, 7.262, 9.117, 9.9, 8.699, 6.713, 8.281, 8.15, 7.993, 9.038, 8.15, 8.229, 7.366, 7.915, 7.628, 7.863, 8.411, 8.751, 6.975, 8.699, 9.3, 7.366, 8.464, 7.811, 8.15, 8.803, 9.456],
}

/** Locución real de una escena del demo (un MP3 por escena y por voz), si esa voz tiene pack. */
export function audioLocucion(vozId: string, pack: number) {
  if (!DURACION_LOCUCION[vozId] || pack < 1 || pack > 30) return undefined
  return `/audios/lms-creator/voces-onboarding/${vozId}/escena-${String(pack).padStart(2, '0')}.mp3`
}

export function duracionLocucionPack(vozId: string, pack: number) {
  return (DURACION_LOCUCION[vozId] ?? DURACION_LOCUCION[VOZ_POR_DEFECTO])[pack - 1] ?? 5
}

/** Guion propio (no el del pack): ~2,6 palabras por segundo, mínimo 2 s. */
export const duracionEstimada = (texto: string) => Math.max(2, Math.round((texto.trim().split(/\s+/).filter(Boolean).length / 2.6) * 10) / 10)

// ── Canvas ───────────────────────────────────────────────────────────────────────────────────────────────────────

export type PlantillaCanvas =
  | 'intro'
  | 'split'
  | 'keypoint'
  | 'quote'
  | 'one_column'
  | 'two_columns'
  | 'steps'
  | 'agenda'
  | 'section'
  | 'title_only'

export const PLANTILLAS_CANVAS: { id: PlantillaCanvas; label: string }[] = [
  { id: 'intro', label: 'Portada' },
  { id: 'split', label: 'Texto e imagen' },
  { id: 'keypoint', label: 'Dato clave' },
  { id: 'quote', label: 'Cita' },
  { id: 'one_column', label: 'Una columna' },
  { id: 'two_columns', label: 'Dos columnas' },
  { id: 'steps', label: 'Lista ordenada' },
  { id: 'agenda', label: 'Agenda / Índice' },
  { id: 'section', label: 'Divisor de sección' },
  { id: 'title_only', label: 'Afirmación' },
]

/**
 * Dónde va la foto en una diapositiva. Es el `imagePosition` de playground-react: una misma plantilla sirve con la foto
 * a un lado o a lo alto, y el creador lo decide sin cambiar de plantilla ni perder lo que ya escribió.
 *
 * No aplica a todas. «Portada» y «Texto e imagen» se componen arrastrando las capas —ahí la foto va donde el creador la
 * suelte— y «Divisor de sección» siempre la lleva al fondo, bajo el velo del acento. En el referente pasa lo mismo: esas
 * tres son `position:relative` con capas sueltas y su CSS desactiva la posición en cuanto hay dos capas hermanas.
 */
export type PosicionImagen = 'izquierda' | 'derecha' | 'arriba' | 'abajo'

export const POSICIONES_IMAGEN: { id: PosicionImagen; label: string }[] = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
  { id: 'arriba', label: 'Arriba' },
  { id: 'abajo', label: 'Abajo' },
]

/**
 * Dónde pone la foto cada plantilla mientras el creador no la mueva, y cuánto ocupa. Son las medidas del referente, así
 * que sin tocar nada la diapositiva sale igual que antes.
 *
 * La medida **no cambia** al mover la foto: «Dato clave» la deja en el 42 % esté a la izquierda o arriba. El referente
 * sí reparte 51/49 en cuanto la mueve de lado, pero eso vuelve iguales cuatro plantillas que medimos distintas a
 * propósito; aquí cada una conserva su proporción y la posición decide solo el lado.
 */
export const REPARTO_IMAGEN: Partial<Record<PlantillaCanvas, { posicion: PosicionImagen; medida: number }>> = {
  keypoint: { posicion: 'izquierda', medida: 42 },
  quote: { posicion: 'abajo', medida: 38.4 },
  one_column: { posicion: 'arriba', medida: 42 },
  steps: { posicion: 'derecha', medida: 48.8 },
}

/** Si en esta plantilla se puede elegir dónde va la foto (las demás la tienen fija o la coloca el creador a mano). */
export const puedeMoverImagen = (plantilla: PlantillaCanvas) => plantilla in REPARTO_IMAGEN

/** La posición vigente: la que eligió el creador o, si todavía no elige, la que trae la plantilla. */
export const posicionImagen = (plantilla: PlantillaCanvas, elegida?: PosicionImagen): PosicionImagen =>
  elegida ?? REPARTO_IMAGEN[plantilla]?.posicion ?? 'derecha'

/** Los textos editables de una diapositiva; cada plantilla usa los suyos. */
export type CamposCanvas = {
  titulo?: string
  subtitulo?: string
  cuerpo?: string
  etiqueta?: string
  numero?: string
  dato?: string
  afirmacion?: string
  autor?: string
  destacado?: string
  /** La credencial que va sobre la foto de la portada: nombre y cargo (playground-react: badgeTitle/badgeSubtitle). */
  credencialTitulo?: string
  credencialSubtitulo?: string
  col1Titulo?: string
  col1Cuerpo?: string
  col2Titulo?: string
  col2Cuerpo?: string
  vinetas?: string[]
  items?: { titulo: string; desc: string }[]
}

/**
 * El color de acento del canvas: el de la marca por defecto (un token del tema) o el hex que el creador elige libre con
 * el input de color, como en el prototipo (ver color-libre). `frente` es el texto sobre el fondo de color.
 */
export type Acento = 'primary' | 'focus' | 'info' | 'success' | 'warning' | 'destructive' | (string & {})

export const ACENTOS: { id: Acento; label: string; fondo: string; frente: string; texto: string; borde: string }[] = [
  { id: 'primary', label: 'Azul de la marca', fondo: 'bg-primary', frente: 'text-primary-foreground', texto: 'text-primary', borde: 'border-primary' },
  { id: 'focus', label: 'Violeta', fondo: 'bg-focus', frente: 'text-primary-foreground', texto: 'text-focus', borde: 'border-focus' },
  { id: 'info', label: 'Celeste', fondo: 'bg-info', frente: 'text-primary-foreground', texto: 'text-info', borde: 'border-info' },
  { id: 'success', label: 'Verde', fondo: 'bg-success', frente: 'text-primary-foreground', texto: 'text-success', borde: 'border-success' },
  { id: 'warning', label: 'Ámbar', fondo: 'bg-warning', frente: 'text-primary-foreground', texto: 'text-warning', borde: 'border-warning' },
  { id: 'destructive', label: 'Rojo', fondo: 'bg-destructive', frente: 'text-primary-foreground', texto: 'text-destructive', borde: 'border-destructive' },
]

export const acento = (id: Acento | undefined) =>
  id && esColorLibre(id)
    ? {
        id,
        label: id.toUpperCase(),
        fondo: CLASES_COLOR_LIBRE.fondo,
        frente: CLASES_COLOR_LIBRE.frente,
        texto: CLASES_COLOR_LIBRE.texto,
        borde: CLASES_COLOR_LIBRE.borde,
      }
    : (ACENTOS.find((a) => a.id === id) ?? ACENTOS[0])

/** Los ocho canvas del estilo Corporativo, con su contenido curado. */
export const CANVAS_CORPORATIVO: Record<number, { plantilla: PlantillaCanvas; campos: CamposCanvas }> = {
  1: {
    plantilla: 'intro',
    campos: {
      titulo: 'Onboarding comercial',
      subtitulo: 'Tus primeros treinta días',
      cuerpo: 'De conocer la empresa a cerrar tus primeras oportunidades con autonomía.',
      etiqueta: 'Presentación',
      credencialTitulo: 'Treinta días',
      credencialSubtitulo: 'Cuatro semanas, cuatro objetivos',
    },
  },
  5: {
    plantilla: 'split',
    campos: {
      titulo: 'Los casos de éxito son tu munición',
      cuerpo:
        'Son la prueba de que la promesa se cumple y la fuente de los datos que vas a usar en cada conversación. Estúdialos como estudias el producto: no la historia completa, sino la cifra que la resume.',
      etiqueta: 'Canvas',
    },
  },
  9: {
    plantilla: 'section',
    campos: {
      numero: '02',
      subtitulo: 'Semana dos',
      titulo: 'Discurso',
      cuerpo: 'Cierras la semana uno con el contexto claro. Ahora conviertes lo que aprendiste en conversaciones que el cliente entiende y valora.',
    },
  },
  13: {
    plantilla: 'steps',
    campos: {
      titulo: 'Cómo hacer descubrimiento',
      etiqueta: 'Canvas',
      vinetas: [
        'Preguntas abiertas primero: deja que el cliente defina su propio problema',
        'Silencio después: la pausa incómoda es donde aparece la información real',
        'Escucha más de lo que hablas: quien más escucha es quien mejor califica',
      ],
    },
  },
  17: {
    plantilla: 'title_only',
    campos: {
      titulo: 'Grábate. Vas a oír lo que el cliente oye.',
      cuerpo: 'Muletillas, prisas y explicaciones largas se detectan en la grabación mucho antes de que las note alguien del otro lado de la mesa.',
    },
  },
  21: {
    plantilla: 'agenda',
    campos: {
      titulo: 'Qué observar en el acompañamiento',
      cuerpo: 'Cuando acompañes a un vendedor senior, mira estos cuatro momentos:',
      items: [
        { titulo: 'Cómo abre', desc: 'Qué dice en los primeros dos minutos y qué no dice' },
        { titulo: 'Cómo pregunta', desc: 'El orden de las preguntas y hacia dónde las lleva' },
        { titulo: 'Cómo maneja el silencio', desc: 'Cuánto aguanta sin llenar el vacío' },
        { titulo: 'Cómo cierra', desc: 'Cómo deja acordado el siguiente paso antes de salir' },
      ],
    },
  },
  25: {
    plantilla: 'two_columns',
    campos: {
      titulo: 'De acompañado a autónomo',
      cuerpo: 'Lo que cambia en la semana cuatro no es la reunión: es quién la sostiene.',
      col1Titulo: 'Semana tres · Acompañado',
      col1Cuerpo: 'Tu líder entra como observador, interviene si hace falta y te da retroalimentación específica al terminar cada reunión.',
      col2Titulo: 'Semana cuatro · Autónomo',
      col2Cuerpo: 'Manejas la reunión completa. Tu líder deja de acompañarte y pasa a revisar resultados contigo en el uno a uno.',
    },
  },
  29: {
    plantilla: 'one_column',
    campos: {
      titulo: 'La revisión del día treinta',
      cuerpo:
        'Cuatro criterios, una conversación honesta: producto, discurso, prospección y disciplina de CRM. No es una evaluación sorpresa, es el mismo marco con el que trabajaste las cuatro semanas.',
      destacado: 'Si llegas al día treinta sin saber cómo te va, el problema no fue la revisión: fue no haber preguntado antes.',
    },
  },
}

/** Escenas con presentador en el demo (2, 15 y 30) cuando el avatar está prendido. */
export const ESCENAS_AVATAR = [2, 15, 30]

/** Contenido vacío de cada plantilla: lo que se ve antes de «Generar». */
/**
 * El estado «plantilla» de cada diapositiva: los mismos textos de ejemplo que pone playground-react en
 * `applyPlaceholderSlidesForPreview`. No son textos inventados: si aquí dicen otra cosa, la plantilla que ve el creador
 * deja de parecerse a la del producto.
 */
const EJEMPLO = {
  titulo: 'Título de la diapositiva',
  subtitulo: 'Subtítulo de ejemplo',
  cuerpo: 'Texto de ejemplo sobre el tema para la vista previa.',
  autor: 'Autor de ejemplo',
  vineta: 'Bullet informativo sobre el tema a tratar',
  desc: 'Descripción breve de apoyo.',
  credencialTitulo: 'Tema de la diapositiva',
  credencialSubtitulo: 'Idea clave sobre el contenido',
  destacado: 'Cita destacada sobre el punto principal.',
} as const

export function camposVacios(plantilla: PlantillaCanvas): CamposCanvas {
  const { titulo, subtitulo, cuerpo } = EJEMPLO
  switch (plantilla) {
    case 'intro':
      return {
        titulo,
        subtitulo,
        cuerpo,
        credencialTitulo: EJEMPLO.credencialTitulo,
        credencialSubtitulo: EJEMPLO.credencialSubtitulo,
      }
    case 'split':
      return { titulo, cuerpo }
    case 'keypoint':
      // `stat` del referente: el número del dato clave arranca en «00%».
      return { titulo, dato: '00%', afirmacion: cuerpo, cuerpo: EJEMPLO.desc }
    case 'quote':
      return { cuerpo, autor: EJEMPLO.autor }
    case 'one_column':
      return { titulo, cuerpo, destacado: EJEMPLO.destacado }
    case 'two_columns':
      return { titulo, cuerpo, col1Titulo: 'Columna A', col1Cuerpo: cuerpo, col2Titulo: 'Columna B', col2Cuerpo: cuerpo }
    case 'steps':
      return { titulo, vinetas: [EJEMPLO.vineta, EJEMPLO.vineta, EJEMPLO.vineta] }
    case 'agenda':
      return {
        titulo,
        cuerpo,
        items: [1, 2, 3].map((n) => ({ titulo: `Tema ${n}`, desc: 'Descripción del bloque temático' })),
      }
    case 'section':
      return { numero: '01', subtitulo, titulo, cuerpo }
    case 'title_only':
      return { titulo, cuerpo }
  }
}

/** Tema corto a partir de la idea del modal: nunca se pega el texto completo en la diapositiva. */
function temaDe(idea: string) {
  const limpio = idea
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[¡!¿?\s]+/, '')
    .replace(/^(quiero|necesito|habla(r)?\s+(de|sobre)|sobre|acerca\s+de|tema[:\s]+)\s+/i, '')
    .trim()
  if (!limpio) return 'Tu tema'
  let tema = limpio.split(/\s+/).slice(0, 5).join(' ').split(/[.!?,;:…]/)[0]?.trim() || limpio
  if (tema.length > 42) tema = `${tema.slice(0, 41).trimEnd()}…`
  return tema.charAt(0).toUpperCase() + tema.slice(1)
}

export function camposDesdeIdea(plantilla: PlantillaCanvas, idea: string): CamposCanvas {
  const tema = temaDe(idea)
  switch (plantilla) {
    case 'intro':
      return {
        titulo: tema,
        subtitulo: 'Ideas clave para esta escena',
        cuerpo: 'Una mirada clara al tema para abrir la conversación con tu audiencia.',
        etiqueta: 'Portada',
        credencialTitulo: 'Punto de partida',
        credencialSubtitulo: 'Lo esencial en pocos minutos',
      }
    case 'steps':
      return {
        titulo: `Cómo trabajar ${tema}`,
        etiqueta: 'Pasos',
        vinetas: ['Define el objetivo de esta conversación', 'Prepara el mensaje en un orden simple', 'Comparte un ejemplo concreto', 'Cierra con un siguiente paso claro'],
      }
    case 'quote':
      return { cuerpo: '«Lo esencial no es decir más, sino dejar una idea que se pueda aplicar.»', autor: 'Equipo de formación' }
    case 'keypoint':
      return {
        titulo: tema,
        etiqueta: 'Dato clave',
        // Una cifra de verdad, como la muestra de producción («85%»): «01» se leía como un número de orden.
        dato: '85%',
        afirmacion: 'de los equipos recuerda mejor un solo mensaje claro',
        cuerpo: 'Usa este bloque para anclar la idea principal de la escena.',
      }
    case 'split':
      return { titulo: tema, etiqueta: 'Texto e imagen', cuerpo: 'Texto breve generado para acompañar la imagen: contexto, beneficio y qué recordar.' }
    case 'one_column':
      return { titulo: tema, cuerpo: 'Una idea clara para anclar esta escena, sin transcribir el guion.', destacado: 'El slide ancla; la locución desarrolla.' }
    case 'two_columns':
      return {
        titulo: tema,
        cuerpo: 'Dos lecturas del mismo tema.',
        col1Titulo: 'A favor',
        col1Cuerpo: 'Qué gana el equipo si aplica esta idea.',
        col2Titulo: 'En contra',
        col2Cuerpo: 'Qué se pierde si el tema queda sin nombrar.',
      }
    case 'agenda':
      return {
        titulo: `Agenda: ${tema}`,
        cuerpo: 'Los bloques de esta escena.',
        items: [
          { titulo: 'Contexto', desc: 'Por qué importa ahora' },
          { titulo: 'Idea central', desc: 'Qué debe quedar claro' },
          { titulo: 'Aplicación', desc: 'Qué hacer después' },
        ],
      }
    case 'section':
      return { numero: '01', subtitulo: 'Sección', titulo: tema, cuerpo: 'Cambio de bloque para continuar el recuento.' }
    case 'title_only':
      return { titulo: tema, cuerpo: 'Una frase de apoyo que no compite con la afirmación.' }
  }
}

/**
 * Las plantillas que pintan una foto del pack. Son las siete de playground-react (`CANVAS_TYPES_WITH_IMAGE`): aquí
 * faltaban «Cita», «Lista ordenada» y «Divisor de sección», que salían sin imagen.
 */
export const CANVAS_CON_IMAGEN = new Set<PlantillaCanvas>(['intro', 'split', 'keypoint', 'quote', 'one_column', 'steps', 'section'])

// ── Editor: transiciones, movimiento, tipos, audio ───────────────────────────────────────────────────────────────

export const TRANSICIONES = [
  { id: 'soft-dissolve', label: 'Disolución suave' },
  { id: 'slide-left', label: 'Deslizar izquierda' },
  { id: 'push-h', label: 'Push horizontal' },
  { id: 'push-v', label: 'Push vertical' },
  { id: 'wipe-left', label: 'Barrido izquierda' },
  { id: 'wipe-right', label: 'Barrido derecha' },
  { id: 'wipe-down', label: 'Barrido vertical' },
  { id: 'iris-open', label: 'Iris abrir' },
  { id: 'iris-close', label: 'Iris cerrar' },
  { id: 'zoom-in', label: 'Zoom in' },
  { id: 'zoom-out', label: 'Zoom out' },
  { id: 'zoom-blur', label: 'Zoom blur' },
  { id: 'cube', label: 'Cubo' },
  { id: 'barn', label: 'Puertas' },
  { id: 'split-v', label: 'Split vertical' },
] as const

export type TransicionId = (typeof TRANSICIONES)[number]['id']
export const TRANSICION_POR_DEFECTO: TransicionId = 'soft-dissolve'
export const nombreTransicion = (id: string | undefined) => TRANSICIONES.find((t) => t.id === id)?.label ?? 'Disolución suave'
/** Cuánto dura el cruce entre escenas, en segundos. */
export const CRUCE = 0.52

export const MOVIMIENTOS = [
  { id: 'none', label: 'Sin movimiento' },
  { id: 'fade-in', label: 'Aparecer' },
  { id: 'zoom-in', label: 'Zoom in' },
  { id: 'zoom-out', label: 'Zoom out' },
] as const

export type MovimientoId = (typeof MOVIMIENTOS)[number]['id']
export const MOVIMIENTO_POR_DEFECTO: MovimientoId = 'zoom-in'

export type MezclaAudio = 'both' | 'voice-only' | 'clip-only'

export const MEZCLAS: { id: MezclaAudio; label: string; ayuda: string }[] = [
  { id: 'both', label: 'Voz y video juntos', ayuda: 'Se mezclan la locución y el audio del clip.' },
  { id: 'voice-only', label: 'Solo la voz en off', ayuda: 'Se silencia el sonido del video; se escucha la locución.' },
  { id: 'clip-only', label: 'Solo el audio del video', ayuda: 'Se silencia la voz en off; se escucha el sonido del clip.' },
]

// ── Música de fondo (detrás del interruptor del playground, apagado por defecto) ──────────────────────────────────

export const PISTAS = [
  { id: 'none', label: 'Sin música', descripcion: 'Solo se escucha la locución', src: '' },
  { id: 'groove', label: 'Groove continuo', descripcion: 'Ritmo ligero que no compite con la voz', src: '/audios/lms-creator/musica-de-fondo/Seamless-groove-573931.mp3' },
  { id: 'calm', label: 'Estudio calmado', descripcion: 'Ambiente suave para contenido de formación', src: '/audios/lms-creator/musica-de-fondo/calm-study-551503.mp3' },
  { id: 'neutral', label: 'Ambiente sereno', descripcion: 'Fondo relajado, sin melodía protagonista', src: '/audios/lms-creator/musica-de-fondo/neutral-551263.mp3' },
  { id: 'tech', label: 'Explicación tech', descripcion: 'Acompaña procesos y productos', src: '/audios/lms-creator/musica-de-fondo/tech-explainer-551261.mp3' },
  { id: 'techno', label: 'Pulso electrónico', descripcion: 'Ritmo sintético discreto', src: '/audios/lms-creator/musica-de-fondo/minimal-techno-538526.mp3' },
]

export const VOLUMENES = [
  { id: 'alto', label: 'Alto', db: -12 },
  { id: 'estandar', label: 'Estándar', db: -18 },
  { id: 'discreto', label: 'Discreto', db: -24 },
  { id: 'minimo', label: 'Mínimo', db: -30 },
]

export const gananciaDb = (db: number) => 10 ** (db / 20)

/** La música de fondo del video: elegir pista y volumen en Ajustes, y suena bajo la locución. */
export function musicaHabilitada() {
  // Prendida para todos desde el 14-oct (Dave): en playground-react y aquí estaba oculta detrás de la bandera
  // «musicaFondo» de /feature-flags (o ?musica=1), y la funcionalidad completa ya existía.
  return true
}

// ── Modal «Agregar video» ────────────────────────────────────────────────────────────────────────────────────────

export const GUION_MINIMO = 500
export const GUION_MAXIMO = 1700
export const TEMA_MINIMO = 250
export const TEMA_MAXIMO = 25_000

export const GUION_DEMO = [
  'La forma en que hablas durante un conflicto puede empeorar la situación o ayudarte a resolverla. Hoy veremos cómo desescalar tensiones en el trabajo.',
  'Cuando una conversación se pone tensa, el objetivo no es ganar la discusión. El objetivo es recuperar claridad y mantener el respeto.',
  'El primer paso es regular tu tono. Respira, baja la velocidad y evita responder con la misma intensidad emocional de la otra persona.',
  'En lugar de reaccionar de inmediato, puedes usar una frase simple como: Dame un segundo para entenderte bien antes de responder.',
  'También ayuda describir la situación sin atacar. Habla sobre lo que percibes, no sobre las intenciones o defectos de la otra persona.',
  'Por ejemplo, funciona mejor decir siento tensión en esta conversación, que lanzar acusaciones o usar frases absolutas como tú siempre haces esto.',
  'Otra técnica útil es validar la emoción sin validar el conflicto. Puedes reconocer frustración sin aceptar agresiones o malos tratos.',
  'Una frase sencilla puede cambiar completamente el tono de la conversación. Por ejemplo: entiendo que esto te está frustrando en este momento.',
  'Las preguntas abiertas también ayudan a bajar la tensión porque cambian el enfoque del problema hacia una posible solución compartida.',
  'Puedes preguntar qué es lo más importante para ti ahora, o qué resultado te gustaría lograr con esta conversación.',
  'Finalmente, resume lo que entendiste y propone un siguiente paso pequeño, claro y fácil de ejecutar para ambas personas.',
  'Las conversaciones difíciles no se resuelven con más presión. Se resuelven con claridad, regulación emocional y escucha activa.',
]
  .join('\n\n')
  .slice(0, GUION_MAXIMO)

export const enlaceValido = (url: string) => {
  const v = url.trim()
  return Boolean(v) && ['vimeo.com', 'youtube.com', 'youtu.be', 'drive.google.com', 'onedrive.live.com'].some((h) => v.includes(h))
}

/** Dirección para incrustar: YouTube y Vimeo a su reproductor; Drive y OneDrive a su vista embebida. */
export function enlaceEmbebido(url: string) {
  const v = url.trim()
  if (v.includes('vimeo.com')) {
    const m = v.match(/vimeo\.com\/(\d+)/)
    return m ? `https://player.vimeo.com/video/${m[1]}` : v
  }
  if (v.includes('youtube.com') || v.includes('youtu.be')) {
    const m = v.match(/(?:v=|youtu\.be\/)([^&?]+)/)
    return m ? `https://www.youtube.com/embed/${m[1]}` : v
  }
  if (v.includes('drive.google.com')) return v.replace('/view', '/preview')
  if (v.includes('onedrive.live.com')) return v.replace('view.aspx', 'embed')
  return v
}

export type ItemBiblioteca = { id: string; titulo: string; miniatura: string; estado: 'editando' | 'listo'; src?: string; propio?: boolean }

const DEMO_MP4 = '/videos/preview-video-generado.mp4'

/** «Tus videos recientes»: ejemplos fijos del prototipo; los que crea el usuario van delante. */
export const BIBLIOTECA_RECIENTES: ItemBiblioteca[] = [
  { id: 'lib-pausa', titulo: 'Método P.A.U.S.A. — Solución de conflictos laborales', miniatura: imagenPack('origami', 1), estado: 'editando' },
  { id: 'lib-onboarding', titulo: 'Onboarding comercial Q3', miniatura: imagenPack('origami', 8), estado: 'listo', src: DEMO_MP4 },
  { id: 'lib-feedback', titulo: 'Feedback efectivo en equipos híbridos', miniatura: imagenPack('origami', 16), estado: 'listo', src: DEMO_MP4 },
  { id: 'lib-seguridad', titulo: 'Seguridad de la información — introducción', miniatura: imagenPack('origami', 30), estado: 'listo', src: DEMO_MP4 },
]

const SEMILLAS: [string, string, 'origami' | 'pizarra', number, 'editando' | 'listo'][] = [
  ['lib-escucha', 'Escucha activa para líderes de equipo', 'origami', 3, 'listo'],
  ['lib-clima', 'Cómo leer los resultados de clima laboral', 'pizarra', 5, 'listo'],
  ['lib-metas', 'Definir metas OKR en 15 minutos', 'origami', 11, 'listo'],
  ['lib-reuniones', 'Reuniones que sí valen la pena', 'pizarra', 9, 'editando'],
  ['lib-acoso', 'Prevención del acoso laboral', 'origami', 19, 'listo'],
  ['lib-datos', 'Protección de datos personales — nivel básico', 'pizarra', 14, 'listo'],
  ['lib-phishing', 'Cómo detectar un correo de phishing', 'origami', 24, 'listo'],
  ['lib-diversidad', 'Diversidad e inclusión en la práctica', 'pizarra', 21, 'listo'],
  ['lib-ergonomia', 'Ergonomía en el puesto de trabajo', 'origami', 29, 'editando'],
  ['lib-pausas', 'Pausas activas para jornadas largas', 'pizarra', 26, 'listo'],
  ['lib-servicio', 'Servicio al cliente en canales digitales', 'origami', 34, 'listo'],
  ['lib-ventas', 'Cierre de ventas consultivas', 'pizarra', 31, 'listo'],
  ['lib-objeciones', 'Manejo de objeciones frecuentes', 'origami', 39, 'listo'],
  ['lib-negociacion', 'Negociación colaborativa paso a paso', 'pizarra', 36, 'editando'],
  ['lib-finanzas', 'Finanzas personales para colaboradores', 'origami', 44, 'listo'],
  ['lib-presupuesto', 'Cómo armar un presupuesto de área', 'pizarra', 41, 'listo'],
  ['lib-excel', 'Tablas dinámicas sin morir en el intento', 'origami', 6, 'listo'],
  ['lib-ia-basica', 'Inteligencia artificial para no técnicos', 'pizarra', 2, 'listo'],
  ['lib-prompts', 'Escribir prompts útiles en el trabajo', 'origami', 13, 'editando'],
  ['lib-automatizar', 'Automatiza tareas repetitivas', 'pizarra', 17, 'listo'],
  ['lib-teletrabajo', 'Buenas prácticas de teletrabajo', 'origami', 22, 'listo'],
  ['lib-tiempo', 'Gestión del tiempo y foco', 'pizarra', 25, 'listo'],
  ['lib-delegar', 'Aprender a delegar sin perder control', 'origami', 27, 'listo'],
  ['lib-uno-a-uno', 'Cómo hacer un buen uno a uno', 'pizarra', 30, 'editando'],
  ['lib-desempeno', 'Evaluación de desempeño sin fricción', 'origami', 35, 'listo'],
  ['lib-360', 'Qué esperar de una evaluación 360°', 'pizarra', 38, 'listo'],
  ['lib-carrera', 'Planes de carrera dentro de la empresa', 'origami', 42, 'listo'],
  ['lib-mentoria', 'Programa de mentoría interna', 'pizarra', 45, 'listo'],
  ['lib-primer-dia', 'Tu primer día: todo lo que necesitas saber', 'origami', 4, 'listo'],
  ['lib-cultura', 'Nuestra cultura en cinco principios', 'pizarra', 7, 'editando'],
  ['lib-codigo', 'Código de ética — casos reales', 'origami', 10, 'listo'],
  ['lib-antifraude', 'Antifraude y conflicto de intereses', 'pizarra', 12, 'listo'],
  ['lib-sst', 'Seguridad y salud en el trabajo 2026', 'origami', 15, 'listo'],
  ['lib-emergencias', 'Plan de emergencias y evacuación', 'pizarra', 18, 'listo'],
  ['lib-primeros', 'Primeros auxilios en la oficina', 'origami', 20, 'editando'],
  ['lib-sostenible', 'Sostenibilidad en operaciones diarias', 'pizarra', 23, 'listo'],
  ['lib-residuos', 'Manejo responsable de residuos', 'origami', 28, 'listo'],
  ['lib-marca', 'Cómo hablar de nuestra marca', 'pizarra', 33, 'listo'],
  ['lib-storytelling', 'Storytelling para presentaciones', 'origami', 37, 'listo'],
  ['lib-vocero', 'Ser vocero en medios y redes', 'pizarra', 43, 'editando'],
]

/** «Tus videos»: los recientes y el resto del historial de ejemplo (44 en total). */
export const BIBLIOTECA_COMPLETA: ItemBiblioteca[] = [
  ...BIBLIOTECA_RECIENTES,
  ...SEMILLAS.map(([id, titulo, estilo, escena, estado]) => ({
    id,
    titulo,
    miniatura: imagenPack(estilo, escena),
    estado,
    ...(estado === 'listo' ? { src: DEMO_MP4 } : {}),
  })),
]

export const TANDA_BIBLIOTECA = 20

// ── Formatos ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** 0:07 · 4:02 */
export function minutos(segundos: number) {
  const s = Math.max(0, Math.round(segundos))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const numero = (n: number) => n.toLocaleString('es-CO')
