// Las familias de cargo: qué sabe hacer, cómo se describe su trabajo y qué estudió cada oficio. Salen del perfil del
// candidato (`perfil-candidato.ts`) y las usa también la base global («Mis candidatos»), que busca por lo que la
// persona sabe hacer: así lo que se encuentra buscando «SQL» es lo mismo que dice su ficha.

export type Familia = {
  prueba: RegExp
  habilidades: string[]
  descripciones: string[]
  titulos: string[]
  anterior: string[]
  especializacion: string
}

export const FAMILIAS: Familia[] = [
  {
    prueba: /datos|bi\b|anal[ií]tica|cient[ií]fico|financiero|inventario|growth|reporter/i,
    habilidades: ['SQL', 'Power BI', 'Excel avanzado', 'Python', 'Estadística', 'Tableau', 'Modelado de datos', 'Storytelling con datos'],
    descripciones: [
      'Construyó los tableros de seguimiento del área comercial en Power BI y automatizó el cierre mensual, que antes tomaba tres días.',
      'Responsable de la calidad de los datos de ventas: definió las validaciones antes de cada publicación y bajó los reprocesos a la mitad.',
      'Apoyó a gerencia con análisis de rentabilidad por canal; sus cortes semanales se volvieron la fuente oficial del comité.',
    ],
    titulos: ['Ingeniería industrial', 'Estadística', 'Economía', 'Ingeniería de sistemas'],
    anterior: ['Analista junior de datos', 'Auxiliar de información', 'Practicante de analítica'],
    especializacion: 'Especialización en Analítica de datos',
  },
  {
    // «ux» y «ui» como palabra: «auxiliar» contiene «ux» y caía en Diseño (MC-01).
    prueba: /dise[ñn]|\bux\b|\bui\b|usuario|product owner/i,
    habilidades: ['Figma', 'Investigación con usuarios', 'Prototipado', 'Design systems', 'Accesibilidad', 'Pruebas de usabilidad', 'Maze'],
    descripciones: [
      'Rediseñó el flujo de registro de la app con pruebas de usabilidad cada dos semanas; la conversión subió 9 puntos.',
      'Mantuvo la librería de componentes del producto y la documentó para cuatro equipos de desarrollo.',
      'Lideró entrevistas con clientes para priorizar el roadmap del trimestre junto a producto.',
    ],
    titulos: ['Diseño industrial', 'Diseño gráfico', 'Diseño de interacción', 'Comunicación visual'],
    anterior: ['Diseñador junior', 'Diseñador gráfico', 'Practicante de diseño'],
    especializacion: 'Especialización en Experiencia de usuario',
  },
  {
    prueba: /turno|planta|bodega|log[ií]stic|producci[oó]n|l[ií]nea|operari|operativ/i,
    habilidades: ['Manejo de personal', 'Seguridad industrial', 'Lean manufacturing', 'SAP', 'Control de inventarios', 'Indicadores de producción', '5S'],
    descripciones: [
      'Coordinó un turno de 24 operarios en línea de envasado; cerró el año sin incidentes con incapacidad.',
      'Implementó 5S en la bodega de despachos y redujo los tiempos de alistamiento en 18 %.',
      'Llevó el control de inventarios en SAP y los reportes diarios de producción a la jefatura de planta.',
    ],
    titulos: ['Tecnología en producción industrial', 'Ingeniería industrial', 'Tecnología en logística', 'Técnico en seguridad industrial'],
    anterior: ['Auxiliar de producción', 'Operario líder', 'Auxiliar de bodega'],
    especializacion: 'Especialización en Gerencia de operaciones',
  },
  {
    prueba: /comercial|ventas|cuenta|asesor|key account|mercadeo/i,
    habilidades: ['Negociación', 'CRM Salesforce', 'Prospección', 'Manejo de objeciones', 'Presupuesto comercial', 'Excel'],
    descripciones: [
      'Manejó una cartera de 40 clientes corporativos y cumplió la meta anual en 112 %.',
      'Abrió la zona norte de la ciudad: 18 clientes nuevos en el primer semestre.',
      'Negoció la renovación de los contratos grandes de la regional y redujo la cartera vencida.',
    ],
    titulos: ['Mercadeo y publicidad', 'Administración de empresas', 'Negocios internacionales', 'Técnico en ventas'],
    anterior: ['Asesor comercial', 'Auxiliar de ventas', 'Agente de telemercadeo'],
    especializacion: 'Especialización en Gerencia comercial',
  },
  {
    prueba: /desarroll|software|backend|frontend|qa\b|soporte|ingenier[oa] de (software|datos)|java|node/i,
    habilidades: ['Node.js', 'Java', 'SQL', 'Docker', 'AWS', 'Git', 'Pruebas automatizadas', 'APIs REST'],
    descripciones: [
      'Construyó los servicios de pagos en Node.js y los llevó a producción con pruebas automatizadas.',
      'Migró la aplicación de facturación a contenedores en AWS sin caídas para los clientes.',
      'Atendió los incidentes de producción del equipo y documentó cada causa para que no se repitiera.',
    ],
    titulos: ['Ingeniería de sistemas', 'Ingeniería de software', 'Tecnología en desarrollo de software'],
    anterior: ['Desarrollador junior', 'Practicante de desarrollo', 'Analista de soporte'],
    especializacion: 'Especialización en Arquitectura de software',
  },
  {
    prueba: /.*/,
    habilidades: ['Excel avanzado', 'Office 365', 'Gestión de agenda', 'Nómina electrónica', 'SIIGO', 'Conciliaciones'],
    descripciones: [
      'Llevó la agenda de la gerencia, las compras del área y la relación con los proveedores.',
      'Preparó los informes mensuales para la junta y la conciliación de cuentas con contabilidad.',
    ],
    titulos: ['Administración de empresas', 'Contaduría pública', 'Tecnología en gestión administrativa'],
    anterior: ['Auxiliar administrativo', 'Asistente', 'Practicante'],
    especializacion: 'Especialización en Gerencia de proyectos',
  },
]

export const familiaDe = (cargo: string) => FAMILIAS.find((familia) => familia.prueba.test(cargo)) ?? FAMILIAS[FAMILIAS.length - 1]
