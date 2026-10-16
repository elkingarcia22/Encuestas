// Listas del formulario de creación de vacante. Salen de la pantalla real de Selección:
// los mismos textos y el mismo orden, para que la maqueta se pueda comparar de frente con producto.

export const AREAS = ['Tecnología', 'Ventas', 'Marketing', 'Producto', 'Diseño', 'Recursos Humanos', 'Operaciones', 'Finanzas']

// La bandera va como emoji (es texto, no un icono): así la lista se lee de un vistazo sin pedirle
// a la librería un componente de bandera que no tiene.
export const PAISES = [
  { valor: 'colombia', nombre: 'Colombia', bandera: '🇨🇴' },
  { valor: 'mexico', nombre: 'México', bandera: '🇲🇽' },
  { valor: 'espana', nombre: 'España', bandera: '🇪🇸' },
  { valor: 'argentina', nombre: 'Argentina', bandera: '🇦🇷' },
  { valor: 'chile', nombre: 'Chile', bandera: '🇨🇱' },
  { valor: 'peru', nombre: 'Perú', bandera: '🇵🇪' },
  { valor: 'ecuador', nombre: 'Ecuador', bandera: '🇪🇨' },
  { valor: 'brasil', nombre: 'Brasil', bandera: '🇧🇷' },
]

// Ciudades principales de cada país: el desplegable de ciudad solo ofrece las del país elegido.
export const CIUDADES: Record<string, string[]> = {
  colombia: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales'],
  mexico: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro', 'Tijuana', 'Mérida', 'León'],
  espana: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'],
  argentina: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'],
  chile: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Viña del Mar', 'Temuco'],
  peru: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Chiclayo', 'Piura'],
  ecuador: ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato'],
  brasil: ['São Paulo', 'Río de Janeiro', 'Brasilia', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Recife'],
}

export const CONTRATOS = ['Término indefinido', 'Término fijo', 'Por obra o labor', 'Ocasional, accidental o transitorio', 'Aprendizaje']

export const IDIOMAS = ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Chino', 'Japonés']

export const SENIORITY = [
  '0 - Becario',
  '1B - Junior',
  '1A - Mid',
  '2B - Senior',
  '2A - Lead',
  '3B - Manager',
  '3A - Director',
  '4 - VP',
]

// Límites de la experiencia (en años). En el tope no hay «techo»: se lee como «o más» («Sin máximo» en el campo).
export const EXPERIENCIA_MIN = 0
export const EXPERIENCIA_MAX = 15
export const EXPERIENCIA_PASO = 1

export function etiquetaExperiencia(desde: number, hasta: number) {
  if (desde === 0 && hasta === 0) return 'Sin experiencia'
  if (hasta >= EXPERIENCIA_MAX) return `${desde} años o más`
  if (desde === hasta) return `${desde} ${desde === 1 ? 'año' : 'años'}`
  return `${desde} a ${hasta} años`
}

// «COP · Peso colombiano»: la moneda elegida se lee completa, no solo su código (29 sep, reunión con Elkin).
export const etiquetaMoneda = (valor: string) => {
  const moneda = MONEDAS.find((opcion) => opcion.valor === valor)
  return moneda ? moneda.nombre.replace(' - ', ' · ') : valor
}

export const MONEDAS = [
  { valor: 'COP', nombre: 'COP - Peso colombiano' },
  { valor: 'USD', nombre: 'USD - Dólar estadounidense' },
  { valor: 'MXN', nombre: 'MXN - Peso mexicano' },
  { valor: 'EUR', nombre: 'EUR - Euro' },
  { valor: 'ARS', nombre: 'ARS - Peso argentino' },
  { valor: 'CLP', nombre: 'CLP - Peso chileno' },
  { valor: 'PEN', nombre: 'PEN - Sol peruano' },
  { valor: 'BRL', nombre: 'BRL - Real brasileño' },
]

// Sugerencias del campo de habilidades: se pueden elegir de la lista o escribir una nueva.
export const HABILIDADES_SUGERIDAS = [
  'Comunicación',
  'Trabajo en equipo',
  'Liderazgo',
  'AWS',
  'SQL',
  'Python',
  'React',
  'Gestión de proyectos',
  'Pensamiento analítico',
  'Negociación',
]
