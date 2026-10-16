// Niveles de dificultad de un contenido.

export type Nivel = { id: string; nombre: string }

export const NIVELES: Nivel[] = [
    {
      "id": "niv-001",
      "nombre": "Básico"
    },
    {
      "id": "niv-002",
      "nombre": "Intermedio"
    },
    {
      "id": "niv-003",
      "nombre": "Avanzado"
    }
  ]

export const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? 'Básico'
