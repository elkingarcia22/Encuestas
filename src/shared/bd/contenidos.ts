// Catálogo de contenidos de la empresa.
// Los publicados se ven en la universidad corporativa; los demás solo en LMS Creator.

export type Visibilidad = 'Publicado' | 'Privado' | 'Borrador' | 'Oculto' | 'Archivado'

export const VISIBILIDADES: Visibilidad[] = ['Publicado', 'Privado', 'Borrador', 'Oculto', 'Archivado']

export type Contenido = {
  id: string
  /** Ruta desde la raíz del sitio: las imágenes viven en public/images/. */
  imagen: string
  titulo: string
  descripcion: string
  tipo: string
  minutos: number
  idioma: string
  nivelId: string
  categoriaId: string
  creacion: string
  visibilidad: Visibilidad
  /** Migrado del LMS anterior: no se creó con el creador de hoy. */
  antiguoLms?: boolean
  conCertificacion: boolean
}

export const CONTENIDOS: Contenido[] = [
    {
      "id": "f021",
      "imagen": "/images/cards-learn/U-Corporativa/protocolos-de-supervivencia-y-seguridad-ante-sismos.jpg",
      "titulo": "Protocolos de Supervivencia y Seguridad ante Sismos",
      "descripcion": "Aprende los protocolos esenciales para actuar antes, durante y después de un sismo en el entorno laboral: protección personal, evacuación segura y prevención de riesgos.",
      "tipo": "Evento",
      "minutos": 30,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-003",
      "creacion": "2026-08-12",
      "visibilidad": "Publicado",
      "conCertificacion": false
    },
    {
      "id": "f001",
      "imagen": "/images/cards-learn/U-Corporativa/Inducción-a-la-cultura-y-valores-corporativos.jpg",
      "titulo": "Inducción a la cultura y valores corporativos",
      "descripcion": "Curso corporativo: Inducción a la cultura y valores corporativos. Categoría Cultura y valores.",
            "antiguoLms": true,
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-001",
      "creacion": "2026-05-02",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f002",
      "imagen": "/images/cards-learn/U-Corporativa/prevencion-acoso-laboral.jpg",
      "titulo": "Prevención del acoso laboral",
      "descripcion": "Curso corporativo: Prevención del acoso laboral. Categoría Cumplimiento y ética.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-002",
      "creacion": "2026-04-24",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f003",
      "imagen": "/images/cards-learn/U-Corporativa/seguridad-y-salud-en-el-trabajo.jpg",
      "titulo": "Seguridad y salud en el trabajo 2025",
      "descripcion": "Curso corporativo: Seguridad y salud en el trabajo 2025. Categoría Seguridad y salud.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-003",
      "creacion": "2026-04-16",
      "visibilidad": "Publicado",
      "conCertificacion": false
    },
    {
      "id": "f004",
      "imagen": "/images/cards-learn/U-Corporativa/Cumplimiento-normativo-y-código-de-conducta.jpg",
      "titulo": "Cumplimiento normativo y código de conducta",
      "descripcion": "Curso corporativo: Cumplimiento normativo y código de conducta. Categoría Cumplimiento y ética.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-002",
      "creacion": "2026-04-08",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f005",
      "imagen": "/images/cards-learn/U-Corporativa/Comunicación-efectiva-en-el-trabajo.jpg",
      "titulo": "Comunicación efectiva en el trabajo",
      "descripcion": "Curso corporativo: Comunicación efectiva en el trabajo. Categoría Comunicación.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-004",
      "creacion": "2026-03-31",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f006",
      "imagen": "/images/cards-learn/U-Corporativa/gestion-del-tiempo-y-productividad.jpg",
      "titulo": "Gestión del tiempo y productividad",
      "descripcion": "Curso corporativo: Gestión del tiempo y productividad. Categoría Productividad.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-005",
      "creacion": "2026-03-23",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f007",
      "imagen": "/images/cards-learn/portadas-ia/02-personas-en-oficina.jpg",
      "titulo": "Resolución efectiva de conflictos en equipos de trabajo",
      "descripcion": "Aprende a identificar las causas del conflicto en equipos, comunicarte con calma y aplicar herramientas prácticas para transformar tensiones en acuerdos sostenibles.",
      "tipo": "Curso",
      "minutos": 30,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-006",
      "creacion": "2025-12-01",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f008",
      "imagen": "/images/cards-learn/U-Corporativa/Pensamiento-crítico-y-toma-de-decisiones.jpg",
      "titulo": "Pensamiento crítico y toma de decisiones",
      "descripcion": "Curso corporativo: Pensamiento crítico y toma de decisiones. Categoría Pensamiento crítico.",
      "tipo": "Curso",
      "minutos": 90,
      "idioma": "Español",
      "nivelId": "niv-003",
      "categoriaId": "cfq-007",
      "creacion": "2026-03-15",
      "visibilidad": "Publicado",
      "conCertificacion": false
    },
    {
      "id": "f009",
      "imagen": "/images/cards-learn/U-Corporativa/creatividad-e-innovacion.jpg",
      "titulo": "Creatividad e innovación",
      "descripcion": "Curso corporativo: Creatividad e innovación. Categoría Creatividad e innovación.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-008",
      "creacion": "2026-03-07",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f010",
      "imagen": "/images/cards-learn/U-Corporativa/presentaciones-de-alto-impacto.jpg",
      "titulo": "Presentaciones de alto impacto",
      "descripcion": "Curso corporativo: Presentaciones de alto impacto. Categoría Comunicación ejecutiva.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-009",
      "creacion": "2026-02-27",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f011",
      "imagen": "/images/cards-learn/U-Corporativa/manejo-del-estres-laboral.jpg",
      "titulo": "Manejo del estrés laboral",
      "descripcion": "Curso corporativo: Manejo del estrés laboral. Categoría Bienestar.",
      "tipo": "Curso",
      "minutos": 30,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-010",
      "creacion": "2026-02-19",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f012",
      "imagen": "/images/cards-learn/U-Corporativa/trabajo-en-equipo.jpg",
      "titulo": "Trabajo en equipo y colaboración",
      "descripcion": "Curso corporativo: Trabajo en equipo y colaboración. Categoría Trabajo en equipo.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-011",
      "creacion": "2026-02-11",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f013",
      "imagen": "/images/cards-learn/U-Corporativa/gestion-equipos-remotos.jpg",
      "titulo": "Gestión de equipos remotos e híbridos",
      "descripcion": "Curso corporativo: Gestión de equipos remotos e híbridos. Categoría Trabajo remoto.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-003",
      "categoriaId": "cfq-012",
      "creacion": "2026-02-03",
      "visibilidad": "Publicado",
      "conCertificacion": false
    },
    {
      "id": "f014",
      "imagen": "/images/cards-learn/U-Corporativa/delegacion-efectiva.jpg",
      "titulo": "Delegación efectiva",
      "descripcion": "Curso corporativo: Delegación efectiva. Categoría Delegación.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-013",
      "creacion": "2026-01-26",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f015",
      "imagen": "/images/cards-learn/U-Corporativa/dar-y-recibir-feedback.jpg",
      "titulo": "Cómo dar y recibir feedback",
      "descripcion": "Curso corporativo: Cómo dar y recibir feedback. Categoría Feedback.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-014",
      "creacion": "2026-01-18",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f016",
      "imagen": "/images/cards-learn/U-Corporativa/Comunicación-asertiva-para-líderes.jpg",
      "titulo": "Comunicación asertiva para líderes",
      "descripcion": "Curso corporativo: Comunicación asertiva para líderes. Categoría Comunicación para líderes.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-003",
      "categoriaId": "cfq-015",
      "creacion": "2026-01-10",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f017",
      "imagen": "/images/cards-learn/U-Corporativa/Ciberseguridad-y-protección-de-datos.jpg",
      "titulo": "Ciberseguridad y protección de datos",
      "descripcion": "Curso corporativo: Ciberseguridad y protección de datos. Categoría Seguridad digital.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-003",
      "categoriaId": "cfq-016",
      "creacion": "2026-01-02",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f018",
      "imagen": "/images/cards-learn/U-Corporativa/Gestión-de-proyectos-con-metodologías-ágiles.jpg",
      "titulo": "Gestión de proyectos con metodologías ágiles",
      "descripcion": "Curso corporativo: Gestión de proyectos con metodologías ágiles. Categoría Gestión de proyectos.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-017",
      "creacion": "2025-12-25",
      "visibilidad": "Publicado",
      "conCertificacion": false
    },
    {
      "id": "f019",
      "imagen": "/images/cards-learn/U-Corporativa/Uso-eficiente-del-correo-electrónico-y-calendarios.jpg",
      "titulo": "Uso eficiente del correo electrónico y calendarios",
      "descripcion": "Curso corporativo: Uso eficiente del correo electrónico y calendarios. Categoría Productividad digital.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-018",
      "creacion": "2025-12-17",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "f020",
      "imagen": "/images/cards-learn/U-Corporativa/motivacion-y-reconocimiento-del-talento.jpg",
      "titulo": "Programa integral de liderazgo consciente, comunicación asertiva y gestión del cambio para líderes que acompañan procesos de transformación cultural en organizaciones grandes",
      "descripcion": "Curso corporativo: Motivación y reconocimiento del talento. Categoría Talento y reconocimiento.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-019",
      "creacion": "2025-12-09",
      "visibilidad": "Publicado",
      "conCertificacion": true
    },
    {
      "id": "24000",
      "imagen": "/images/cards-learn/U-Corporativa/delegacion-efectiva.jpg",
      "titulo": "Desarrollo de habilidades de persuasión",
      "descripcion": "Contenido no publicado (privado). Solo listado en LMS Creator — Contenidos.",
            "antiguoLms": true,
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-013",
      "creacion": "2026-05-28",
      "visibilidad": "Privado",
      "conCertificacion": true
    },
    {
      "id": "24001",
      "imagen": "/images/cards-learn/U-Corporativa/Comunicación-efectiva-en-el-trabajo.jpg",
      "titulo": "Comunicación efectiva con el cliente",
      "descripcion": "Borrador en LMS Creator; editor fullscreen al abrir la tarjeta.",
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-004",
      "creacion": "2026-05-22",
      "visibilidad": "Borrador",
      "conCertificacion": true
    },
    {
      "id": "24002",
      "imagen": "/images/cards-learn/U-Corporativa/Inducción-a-la-cultura-y-valores-corporativos.jpg",
      "titulo": "Un gran liderazgo es una red, no una jerarquía",
      "descripcion": "Contenido oculto; Antiguo LMS.",
            "antiguoLms": true,
      "tipo": "Curso",
      "minutos": 60,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-001",
      "creacion": "2026-05-18",
      "visibilidad": "Oculto",
      "conCertificacion": true
    },
    {
      "id": "24003",
      "imagen": "/images/cards-learn/U-Corporativa/Cumplimiento-normativo-y-código-de-conducta.jpg",
      "titulo": "Conocimiento de políticas y procedimientos internos",
      "descripcion": "Libro archivado; solo inventario creator.",
      "tipo": "Libro",
      "minutos": 45,
      "idioma": "Español",
      "nivelId": "niv-001",
      "categoriaId": "cfq-002",
      "creacion": "2026-05-10",
      "visibilidad": "Archivado",
      "conCertificacion": false
    },
    {
      "id": "24004",
      "imagen": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
      "titulo": "Ruta de liderazgo para equipos de alto rendimiento",
      "descripcion": "Ruta de aprendizaje creada en LMS Creator; agrupa contenidos de liderazgo inclusivo y estratégico.",
      "tipo": "Ruta de aprendizaje",
      "minutos": 255,
      "idioma": "Español",
      "nivelId": "niv-002",
      "categoriaId": "cfq-015",
      "creacion": "2025-10-15",
      "visibilidad": "Borrador",
      "conCertificacion": true
    }
  ]

export const IDIOMAS = [...new Set(CONTENIDOS.map((c) => c.idioma))].sort()
