// Tipos de contenido publicables.

export type TipoContenido = { id: string; nombre: string }

export const TIPOS_CONTENIDO: TipoContenido[] = [
    {
      "id": "tct-001",
      "nombre": "Curso"
    },
    {
      "id": "tct-002",
      "nombre": "Short"
    },
    {
      "id": "tct-003",
      "nombre": "Charla"
    },
    {
      "id": "tct-004",
      "nombre": "Artículo"
    },
    {
      "id": "tct-005",
      "nombre": "Podcast"
    },
    {
      "id": "tct-006",
      "nombre": "Libro"
    },
    {
      "id": "tct-007",
      "nombre": "Ideas de libro"
    },
    {
      "id": "tct-008",
      "nombre": "Caso de estudio"
    },
    {
      "id": "tct-009",
      "nombre": "Documento técnico"
    },
    {
      "id": "tct-010",
      "nombre": "Ejercicios de práctica"
    },
    {
      "id": "tct-011",
      "nombre": "Ruta de aprendizaje"
    },
    {
      "id": "tct-012",
      "nombre": "Programa"
    }
  ]

export const NOMBRES_TIPO = TIPOS_CONTENIDO.map((t) => t.nombre)
