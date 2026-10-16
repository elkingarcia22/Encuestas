export type Borrador = {
  titulo: string
  correo: string
  area: string
  vacantes: number | null
  descripcion: string
  condiciones: boolean
}

export type Errores = Partial<Record<keyof Borrador, string>>

export const AREAS: Record<string, string> = {
  producto: 'Producto',
  ingenieria: 'Ingeniería',
  personas: 'Personas',
  comercial: 'Comercial',
  operaciones: 'Operaciones',
  marketing: 'Marketing',
}

export const MAXIMO_DESCRIPCION = 200

export const BORRADOR_VACIO: Borrador = {
  titulo: '',
  correo: '',
  area: '',
  vacantes: 1,
  descripcion: '',
  condiciones: false,
}

// Una regla por campo. Devuelve el mensaje de error o undefined si está bien.
// El mensaje dice qué hacer, no solo qué falló: "escribe al menos 3 letras",
// no "campo inválido".
const REGLAS: {
  [K in keyof Borrador]: (valor: Borrador[K], borrador: Borrador) => string | undefined
} = {
  titulo: (valor) => {
    if (!valor.trim()) return 'Escribe el nombre del cargo.'
    if (valor.trim().length < 3) return 'Con al menos 3 letras se entiende mejor.'
    return undefined
  },
  correo: (valor) => {
    if (!valor.trim()) return 'Necesitamos un correo para avisarte de las postulaciones.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) {
      return 'Revisa el correo: parece que le falta algo.'
    }
    return undefined
  },
  area: (valor) => (valor ? undefined : 'Elige a qué área pertenece la vacante.'),
  vacantes: (valor) => {
    if (valor === null) return 'Indica cuántas personas necesitas.'
    if (valor < 1) return 'Tiene que ser al menos 1.'
    if (valor > 50) return 'Para más de 50 hay que hablar con Personas.'
    return undefined
  },
  descripcion: (valor) =>
    valor.length > MAXIMO_DESCRIPCION
      ? `Te pasaste por ${valor.length - MAXIMO_DESCRIPCION} caracteres.`
      : undefined,
  condiciones: (valor) =>
    valor ? undefined : 'Hay que aceptar la política de contratación para publicar.',
}

export function validarCampo<K extends keyof Borrador>(campo: K, borrador: Borrador) {
  return REGLAS[campo](borrador[campo], borrador)
}

export function validarTodo(borrador: Borrador): Errores {
  const errores: Errores = {}

  for (const campo of Object.keys(REGLAS) as (keyof Borrador)[]) {
    const error = validarCampo(campo, borrador)
    if (error) errores[campo] = error
  }

  return errores
}

export const ETIQUETAS: Record<keyof Borrador, string> = {
  titulo: 'Nombre del cargo',
  correo: 'Correo de contacto',
  area: 'Área',
  vacantes: 'Personas que necesitas',
  descripcion: 'Descripción',
  condiciones: 'Política de contratación',
}
