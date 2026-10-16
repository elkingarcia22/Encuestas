// Datos de ejemplo del menú Empresa (Meta Colombia), tomados del admin real el 2026-09-16.

export const EMPRESA = {
  nombre: 'Meta Colombia',
  alias: 'Tech',
  estado: 'Activo',
  enlaceIngreso: 'https://ubitslearning.com/login/meta-colombia',
}

export type Dato = {
  etiqueta: string
  valor?: string
  // Ayuda bajo la etiqueta («Tiempo en minutos»).
  ayuda?: string
  // Texto que se muestra en gris cuando no hay valor.
  vacio?: string
  // Valor como insignia (estado, plan).
  insignia?: 'success' | 'outline'
}

export const DATOS_GENERALES: Dato[] = [
  { etiqueta: 'Estado de la empresa', valor: 'Activo', insignia: 'success' },
  { etiqueta: 'Nombre de la empresa', valor: 'Meta Colombia' },
  { etiqueta: 'Alias de la empresa', valor: 'Tech' },
  { etiqueta: 'Tiempo de estudio', valor: '1.440 minutos', ayuda: 'Tiempo en minutos' },
  { etiqueta: 'Link Novasoft Colaborador', vacio: 'Sin configurar' },
]

export const DATOS_CURSOS_PROPIOS: Dato[] = [
  { etiqueta: 'Número de cursos propios permitidos', valor: '100' },
  { etiqueta: 'Espacio de almacenamiento', valor: '10 GB', ayuda: 'Tamaño en GB (Gigabytes)' },
  { etiqueta: 'Tipo de autenticación', valor: 'Manual' },
  { etiqueta: 'Link Novasoft Admin', vacio: 'Sin configurar' },
  { etiqueta: 'Integración Buk', vacio: 'No se ha configurado la integración con Buk' },
]

export const LICENCIAS = { total: 5000, activas: 646, inactivas: 4354 }

export const DATOS_SUSCRIPCION: Dato[] = [
  { etiqueta: 'Tipo de suscripción', valor: 'Paga' },
  { etiqueta: 'Tipo de plan', valor: 'MAX + LMS', insignia: 'outline' },
  { etiqueta: 'Fecha de inicio', valor: '1 jul 2026' },
  { etiqueta: 'Fecha de finalización', valor: '2 jul 2027' },
]

export const numero = (n: number) => n.toLocaleString('es-CO')

// Zonas de carga de imagen: requisitos literales de la plataforma.
export type TipoImagen = 'logo' | 'logoCelular' | 'fondo'

export const REQUISITOS: Record<TipoImagen, { titulo: string; formatos: string; medida: string; peso: string; recomendacion: string; archivo: string; tamano: string }> = {
  logo: {
    titulo: 'Logo Horizontal',
    formatos: 'Arrastra aquí una imagen JPG, JPEG',
    medida: 'Medida mínima: No menos de 60 píxeles de alto',
    peso: 'Peso máximo: 200 KB',
    recomendacion: 'Recomendaciones de uso para tu logo',
    archivo: 'logo.jpeg',
    tamano: '18,22 KB',
  },
  logoCelular: {
    titulo: 'Logo horizontal para celular',
    formatos: 'Arrastra aquí una imagen JPG, JPEG',
    medida: 'Medida mínima: No menos de 60 píxeles de alto',
    peso: 'Peso máximo: 200 KB',
    recomendacion: 'Recomendaciones de uso para tu logo',
    archivo: 'logo-celular.jpeg',
    tamano: '12,40 KB',
  },
  fondo: {
    titulo: 'Imagen de fondo',
    formatos: 'Arrastra aquí una imagen JPG, JPEG, PNG',
    medida: 'Medidas obligatorias: ancho 960, alto 1080 (píxeles)',
    peso: 'Peso máximo: 500 KB',
    recomendacion: 'Recomendaciones de uso para tus imágenes',
    archivo: 'fondo-inicio-sesion.jpg',
    tamano: '412,60 KB',
  },
}

export type Archivo =
  | { estado: 'vacio' }
  | { estado: 'cargando'; nombre: string; progreso: number }
  | { estado: 'listo'; nombre: string; tamano: string }

export const VACIO: Archivo = { estado: 'vacio' }

export const listo = (tipo: TipoImagen): Archivo => ({ estado: 'listo', nombre: REQUISITOS[tipo].archivo, tamano: REQUISITOS[tipo].tamano })

export const mismoArchivo = (a: Archivo, b: Archivo) =>
  a.estado === b.estado && (a.estado !== 'listo' || (b.estado === 'listo' && a.nombre === b.nombre))
