// Las cuatro vacantes abiertas del shell básico, con lo que se ve en su ficha.

export type Candidate = { name: string; role: string; stage: string; score: number }
export type Activity = { date: string; title: string; text: string }

export type Vacancy = {
  name: string
  area: string
  owner: string
  location: string
  published: string
  status: string
  progress: number
  salary: string
  mode: string
  openings: number
  closing: string
  description: string
  skills: string[]
  stages: { label: string; count: number }[]
  candidates: Candidate[]
  activity: Activity[]
  team: { name: string; role: string }[]
}

export const VACANCIES: Vacancy[] = [
  {
    name: 'Analista de datos',
    area: 'Analítica',
    owner: 'Laura Méndez',
    location: 'Bogotá · híbrido',
    published: 'Publicada el 2 sept',
    status: 'En entrevistas',
    progress: 62,
    salary: '$6,5 – 8 M',
    mode: 'Híbrido, 3 días en oficina',
    openings: 2,
    closing: '30 sept',
    description:
      'Construirá los tableros de talento y formación con el equipo de Gestión humana: modelos de rotación, seguimiento de planes de carrera y reportes mensuales para la gerencia.',
    skills: ['SQL', 'Power BI', 'Python', 'Estadística', 'Comunicación'],
    stages: [
      { label: 'Filtro inicial', count: 18 },
      { label: 'Prueba técnica', count: 9 },
      { label: 'Entrevistas', count: 5 },
      { label: 'Oferta', count: 1 },
    ],
    candidates: [
      { name: 'Valentina Rojas', role: 'Analista BI en Rappi', stage: 'Entrevista final', score: 91 },
      { name: 'Julián Castro', role: 'Científico de datos junior', stage: 'Entrevista con el área', score: 86 },
      { name: 'Mariana López', role: 'Analista de riesgo en Bancolombia', stage: 'Prueba técnica', score: 78 },
      { name: 'Santiago Herrera', role: 'Ingeniero industrial', stage: 'Prueba técnica', score: 74 },
      { name: 'Camila Torres', role: 'Analista de datos freelance', stage: 'Filtro inicial', score: 69 },
    ],
    activity: [
      { date: '2 sept', title: 'Vacante publicada', text: 'En el portal de empleo y LinkedIn.' },
      { date: '6 sept', title: 'Filtro inicial cerrado', text: '18 personas pasaron a la prueba técnica.' },
      { date: '10 sept', title: 'Prueba técnica calificada', text: 'Andrés Pardo evaluó 9 pruebas.' },
      { date: '12 sept', title: 'Entrevistas agendadas', text: '5 entrevistas con Laura Méndez.' },
      { date: 'Hoy', title: 'Oferta en preparación', text: 'Valentina Rojas es la candidata recomendada.' },
    ],
    team: [
      { name: 'Laura Méndez', role: 'Responsable' },
      { name: 'Andrés Pardo', role: 'Evaluador técnico' },
      { name: 'Sara Gómez', role: 'Gestión humana' },
    ],
  },
  {
    name: 'Ejecutivo comercial B2B',
    area: 'Ventas',
    owner: 'Andrés Pardo',
    location: 'Medellín · presencial',
    published: 'Publicada el 8 sept',
    status: 'Filtro inicial',
    progress: 24,
    salary: '$4 M + comisiones',
    mode: 'Presencial',
    openings: 3,
    closing: '15 oct',
    description:
      'Abrirá cuentas nuevas de empresas medianas en Antioquia y acompañará la renovación de los clientes actuales junto al equipo de preventa.',
    skills: ['Negociación', 'CRM', 'Prospección', 'Presentaciones'],
    stages: [
      { label: 'Filtro inicial', count: 42 },
      { label: 'Prueba técnica', count: 0 },
      { label: 'Entrevistas', count: 0 },
      { label: 'Oferta', count: 0 },
    ],
    candidates: [
      { name: 'Laura Vargas', role: 'Ejecutiva de cuenta en Siigo', stage: 'Filtro inicial', score: 82 },
      { name: 'Daniel Moreno', role: 'Asesor comercial', stage: 'Filtro inicial', score: 77 },
      { name: 'Natalia Pineda', role: 'Key account manager', stage: 'Filtro inicial', score: 75 },
      { name: 'Felipe Duarte', role: 'Vendedor corporativo', stage: 'Filtro inicial', score: 64 },
    ],
    activity: [
      { date: '8 sept', title: 'Vacante publicada', text: 'En el portal de empleo, LinkedIn y Computrabajo.' },
      { date: '11 sept', title: '42 postulaciones', text: 'Orbit ordenó las hojas de vida por afinidad.' },
      { date: 'Ayer', title: 'Filtro inicial en curso', text: 'Andrés Pardo revisó 20 perfiles.' },
    ],
    team: [
      { name: 'Andrés Pardo', role: 'Responsable' },
      { name: 'Sara Gómez', role: 'Gestión humana' },
    ],
  },
  {
    name: 'Coordinador de bodega',
    area: 'Operaciones',
    owner: 'Sara Gómez',
    location: 'Cali · presencial',
    published: 'Publicada el 20 ago',
    status: 'Oferta enviada',
    progress: 88,
    salary: '$5,2 M',
    mode: 'Presencial, turnos rotativos',
    openings: 1,
    closing: '20 sept',
    description:
      'Liderará el equipo de 14 operarios del centro de distribución de Cali: inventarios, despachos y cumplimiento de los indicadores de seguridad.',
    skills: ['Inventarios', 'Liderazgo', 'WMS', 'Seguridad industrial'],
    stages: [
      { label: 'Filtro inicial', count: 7 },
      { label: 'Prueba técnica', count: 4 },
      { label: 'Entrevistas', count: 2 },
      { label: 'Oferta', count: 1 },
    ],
    candidates: [
      { name: 'Andrés Gil', role: 'Jefe de turno en Éxito', stage: 'Oferta enviada', score: 89 },
      { name: 'Paula Ramírez', role: 'Coordinadora logística', stage: 'Entrevista final', score: 84 },
      { name: 'Sebastián Ortiz', role: 'Supervisor de bodega', stage: 'Prueba técnica', score: 71 },
    ],
    activity: [
      { date: '20 ago', title: 'Vacante publicada', text: 'Solo en el portal interno durante la primera semana.' },
      { date: '28 ago', title: 'Entrevistas en planta', text: 'Visita guiada con el gerente de operaciones.' },
      { date: '11 sept', title: 'Oferta enviada', text: 'Andrés Gil tiene hasta el viernes para responder.' },
    ],
    team: [
      { name: 'Sara Gómez', role: 'Responsable' },
      { name: 'Laura Méndez', role: 'Entrevistadora' },
    ],
  },
  {
    name: 'Diseñador de producto',
    area: 'Tecnología',
    owner: 'Laura Méndez',
    location: 'Remoto · Colombia',
    published: 'Publicada el 11 sept',
    status: 'Publicada',
    progress: 8,
    salary: '$9 – 11 M',
    mode: 'Remoto',
    openings: 1,
    closing: '31 oct',
    description:
      'Diseñará las experiencias de Orbit para administradores de talento: investigación con clientes, prototipos y acompañamiento al equipo de ingeniería.',
    skills: ['Figma', 'Investigación', 'Prototipado', 'Sistemas de diseño'],
    stages: [
      { label: 'Filtro inicial', count: 3 },
      { label: 'Prueba técnica', count: 0 },
      { label: 'Entrevistas', count: 0 },
      { label: 'Oferta', count: 0 },
    ],
    candidates: [
      { name: 'Isabela Cárdenas', role: 'Diseñadora UX en Addi', stage: 'Filtro inicial', score: 88 },
      { name: 'Mateo Suárez', role: 'Diseñador de interacción', stage: 'Filtro inicial', score: 80 },
      { name: 'Sofía Mejía', role: 'Product designer', stage: 'Filtro inicial', score: 76 },
    ],
    activity: [
      { date: '11 sept', title: 'Vacante publicada', text: 'En el portal de empleo y comunidades de diseño.' },
      { date: 'Hace 3 días', title: 'Primeras postulaciones', text: '3 portafolios por revisar.' },
    ],
    team: [
      { name: 'Laura Méndez', role: 'Responsable' },
      { name: 'Tomás Rincón', role: 'Líder de diseño' },
    ],
  },
]

export const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
