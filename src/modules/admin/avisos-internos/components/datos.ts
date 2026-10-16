import type { IconSvgElement } from '@hugeicons/react'
import {
  Award01Icon,
  Building03Icon,
  Car01Icon,
  FirstAidKitIcon,
  Megaphone01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'
import bannerAzul from '@/shared/assets/invite-bg.jpg'
import bannerMarca from '@/shared/assets/promo-seleccion.jpg'
import fotoEquipo from '@/shared/assets/invite-teammate.jpg'

// Avisos internos de la empresa demo Meta Colombia. En la plataforma actual la sección se llama
// «Comunicaciones» (/admin-hr/comunications); aquí se ven con el nombre nuevo.

export const RUTA_AVISOS = '/admin/avisos-internos'
export const rutaAviso = (sub = '') => (sub ? `${RUTA_AVISOS}/${sub}` : RUTA_AVISOS)

export const MAX_TITULO = 50
export const MAX_DESCRIPCION = 400

// Personas que ven los avisos publicados (colaboradores con licencia activa).
export const AUDIENCIA = 1240

export const USUARIO_ACTUAL = 'Laura Méndez'

export type EstadoAviso = 'Publicado' | 'Borrador' | 'Programado' | 'Archivado'
export const ESTADOS: EstadoAviso[] = ['Publicado', 'Borrador', 'Programado', 'Archivado']

export type Multimedia =
  // `prompt`: la imagen se generó con IA a partir de esa descripción.
  | { tipo: 'imagen'; src: string; nombre: string; peso: string; prompt?: string }
  | { tipo: 'video'; nombre: string; duracion: string }

export type Cambio = { id: string; fecha: string; autor: string; accion: string; detalle?: string }

export type Aviso = {
  id: string
  titulo: string
  descripcion: string
  link: string
  multimedia: Multimedia | null
  // Icono de la miniatura cuando el aviso no trae imagen.
  icono: IconSvgElement
  // Fecha de publicación (o la programada). Los borradores guardan su última edición.
  fecha: string
  autor: string
  estado: EstadoAviso
  vistas: number
  likes: number
  clics: number
  historial: Cambio[]
}

// Imagen que el agente propone cuando el aviso no trae ninguna, y la que se «sube» en la maqueta.
export const IMAGEN_SUGERIDA: Multimedia = { tipo: 'imagen', src: bannerMarca, nombre: 'banner-meta.jpg', peso: '0,8 MB' }
export const IMAGEN_DE_PRUEBA: Multimedia = { tipo: 'imagen', src: bannerAzul, nombre: 'aviso-octubre.png', peso: '1,2 MB' }
export const VIDEO_DE_PRUEBA: Multimedia = { tipo: 'video', nombre: 'mensaje-gerencia.mp4', duracion: '1:24' }

// Borrador con problemas a propósito: sirve para probar la revisión del agente antes de publicar.
export const DESCRIPCION_CON_ERRORES =
  'Queremos informarles que del 5 al 9 de octubre se realizara la Semana de la Salud en todas las sedes de Meta Colombia. Todos los empleados podran hacer chequeos medicos gratuitos, tomarse la presion y recibir asesoria nutricional. Tambien habra pausas activas guiadas los dias martes y jueves. Para mas informacion pueden escribir a bienestar@meta.com.'

const cambio = (id: string, fecha: string, autor: string, accion: string, detalle?: string): Cambio => ({ id, fecha, autor, accion, detalle })

export const AVISOS_INICIALES: Aviso[] = [
  {
    id: 'av-109',
    titulo: 'Protocolo de seguridad en planta',
    descripcion:
      'Desde el lunes 14 de septiembre es obligatorio el uso de gafas y protección auditiva en las líneas 2 y 3 de la planta de Funza. Tu supervisor te entregará los elementos al inicio del turno. Si tienes dudas, escríbele al equipo de Seguridad y Salud en el Trabajo.',
    link: 'https://intranet.meta.com/sst/protocolo-planta',
    multimedia: null,
    icono: Shield01Icon,
    fecha: '2026-09-09',
    autor: 'Andrés Rojas',
    estado: 'Publicado',
    vistas: 402,
    likes: 51,
    clics: 77,
    historial: [
      cambio('h1', '2026-09-09T08:10:00', 'Andrés Rojas', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h2', '2026-09-08T17:42:00', 'Laura Méndez', 'Editó la descripción', 'Agregó la fecha de inicio'),
      cambio('h3', '2026-09-08T16:05:00', 'Andrés Rojas', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-108',
    titulo: 'Ajuste de horario en diciembre',
    descripcion:
      'Del 15 al 23 de diciembre las oficinas de Bogotá y Medellín atenderán de 8:00 a. m. a 3:00 p. m. El 24 y el 31 no habrá atención presencial. Organiza con tu líder las tareas que requieran estar en sede antes de esas fechas.',
    link: '',
    multimedia: IMAGEN_SUGERIDA,
    icono: Building03Icon,
    fecha: '2026-09-02',
    autor: 'Laura Méndez',
    estado: 'Publicado',
    vistas: 1180,
    likes: 214,
    clics: 96,
    historial: [
      cambio('h1', '2026-09-02T09:00:00', 'Laura Méndez', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h2', '2026-09-01T15:20:00', 'Laura Méndez', 'Cambió la imagen', 'banner-meta.jpg'),
      cambio('h3', '2026-09-01T11:48:00', 'Laura Méndez', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-107',
    titulo: 'Semana de la salud: jornada de chequeos médicos para todos los empleados',
    descripcion: DESCRIPCION_CON_ERRORES,
    link: 'http://meta.com/semana-salud',
    multimedia: null,
    icono: FirstAidKitIcon,
    fecha: '2026-09-15',
    autor: 'Andrés Rojas',
    estado: 'Borrador',
    vistas: 0,
    likes: 0,
    clics: 0,
    historial: [
      cambio('h1', '2026-09-15T10:32:00', 'Andrés Rojas', 'Editó la descripción'),
      cambio('h2', '2026-09-14T18:05:00', 'Andrés Rojas', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-106',
    titulo: 'Convocatoria: programa de líderes 2027',
    descripcion:
      'Abrimos la convocatoria del programa de desarrollo de líderes 2027. Pueden postularse las personas con más de un año en Meta Colombia y el visto bueno de su líder. Las inscripciones cierran el 9 de octubre.',
    link: 'https://meta.com/lideres-2027',
    multimedia: IMAGEN_DE_PRUEBA,
    icono: Megaphone01Icon,
    fecha: '2026-09-21',
    autor: 'Camila Torres',
    estado: 'Programado',
    vistas: 0,
    likes: 0,
    clics: 0,
    historial: [
      cambio('h1', '2026-09-10T14:15:00', 'Camila Torres', 'Programó la publicación', 'Lunes 21 de septiembre, 8:00 a. m.'),
      cambio('h2', '2026-09-10T11:02:00', 'Camila Torres', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-105',
    titulo: 'Nueva política de trabajo híbrido',
    descripcion:
      'A partir de septiembre puedes trabajar desde casa hasta tres días por semana, según lo acuerdes con tu líder. Consulta la política completa, el auxilio de conectividad y las preguntas frecuentes en el portal.',
    link: 'https://intranet.meta.com/politicas/hibrido',
    multimedia: null,
    icono: Building03Icon,
    fecha: '2026-08-14',
    autor: 'Laura Méndez',
    estado: 'Publicado',
    vistas: 1422,
    likes: 256,
    clics: 488,
    historial: [
      cambio('h1', '2026-08-20T09:30:00', 'Laura Méndez', 'Editó el link de redirección'),
      cambio('h2', '2026-08-14T08:00:00', 'Laura Méndez', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h3', '2026-08-13T16:40:00', 'Laura Méndez', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-104',
    titulo: 'Resultados de la encuesta de clima 2026',
    descripcion:
      'Gracias a las 1.068 personas que respondieron la encuesta de clima. El índice general subió a 82 %. En el portal encuentras los resultados por área y los planes de acción que cada equipo presentará en octubre.',
    link: 'https://intranet.meta.com/clima-2026',
    multimedia: null,
    icono: Award01Icon,
    fecha: '2026-07-30',
    autor: 'Camila Torres',
    estado: 'Publicado',
    vistas: 1105,
    likes: 143,
    clics: 390,
    historial: [
      cambio('h1', '2026-07-30T10:00:00', 'Camila Torres', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h2', '2026-07-29T17:10:00', 'Camila Torres', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-103',
    titulo: 'Celebremos el Día de la Familia Meta Colombia',
    descripcion:
      'El sábado 27 de junio te esperamos con tu familia en el Parque Jaime Duque. Habrá transporte desde todas las sedes, almuerzo y actividades para niños. Confirma tu asistencia en el formulario antes del 19 de junio.',
    link: 'https://forms.meta.com/dia-familia',
    multimedia: { tipo: 'imagen', src: fotoEquipo, nombre: 'dia-familia.jpg', peso: '2,1 MB' },
    icono: Megaphone01Icon,
    fecha: '2026-06-10',
    autor: 'Julián Pérez',
    estado: 'Archivado',
    vistas: 1310,
    likes: 402,
    clics: 150,
    historial: [
      cambio('h1', '2026-06-29T08:00:00', 'Julián Pérez', 'Archivó el aviso', 'Ya pasó el evento'),
      cambio('h2', '2026-06-10T09:00:00', 'Julián Pérez', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h3', '2026-06-09T12:30:00', 'Julián Pérez', 'Creó el borrador'),
    ],
  },
  {
    id: 'av-102',
    titulo: 'Cierre temporal del parqueadero de la sede Norte',
    descripcion:
      'Por obras de mantenimiento, el parqueadero de la sede Norte estará cerrado del 18 al 22 de mayo. Durante esos días puedes usar el convenio con el parqueadero de la calle 127 presentando tu carné.',
    link: '',
    multimedia: null,
    icono: Car01Icon,
    fecha: '2026-05-12',
    autor: 'Julián Pérez',
    estado: 'Archivado',
    vistas: 880,
    likes: 35,
    clics: 12,
    historial: [
      cambio('h1', '2026-05-23T08:00:00', 'Julián Pérez', 'Archivó el aviso'),
      cambio('h2', '2026-05-12T07:45:00', 'Julián Pérez', 'Publicó el aviso', 'Visible para 1.240 colaboradores'),
      cambio('h3', '2026-05-11T18:20:00', 'Julián Pérez', 'Creó el borrador'),
    ],
  },
]
