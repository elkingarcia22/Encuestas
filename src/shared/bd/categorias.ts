// Categorías con las que la empresa organiza su universidad corporativa.

export type Categoria = { id: string; nombre: string }

export const CATEGORIAS: Categoria[] = [
    {
      "id": "cfq-001",
      "nombre": "Cultura y valores"
    },
    {
      "id": "cfq-002",
      "nombre": "Cumplimiento y ética"
    },
    {
      "id": "cfq-003",
      "nombre": "Seguridad y salud"
    },
    {
      "id": "cfq-004",
      "nombre": "Comunicación"
    },
    {
      "id": "cfq-005",
      "nombre": "Productividad"
    },
    {
      "id": "cfq-006",
      "nombre": "Gestión de conflictos"
    },
    {
      "id": "cfq-007",
      "nombre": "Pensamiento crítico"
    },
    {
      "id": "cfq-008",
      "nombre": "Creatividad e innovación"
    },
    {
      "id": "cfq-009",
      "nombre": "Comunicación ejecutiva"
    },
    {
      "id": "cfq-010",
      "nombre": "Bienestar"
    },
    {
      "id": "cfq-011",
      "nombre": "Trabajo en equipo"
    },
    {
      "id": "cfq-012",
      "nombre": "Trabajo remoto"
    },
    {
      "id": "cfq-013",
      "nombre": "Delegación"
    },
    {
      "id": "cfq-014",
      "nombre": "Feedback"
    },
    {
      "id": "cfq-015",
      "nombre": "Comunicación para líderes"
    },
    {
      "id": "cfq-016",
      "nombre": "Seguridad digital"
    },
    {
      "id": "cfq-017",
      "nombre": "Gestión de proyectos"
    },
    {
      "id": "cfq-018",
      "nombre": "Productividad digital"
    },
    {
      "id": "cfq-019",
      "nombre": "Talento y reconocimiento"
    }
  ]

export const nombreCategoria = (id: string) => CATEGORIAS.find((c) => c.id === id)?.nombre ?? ''
