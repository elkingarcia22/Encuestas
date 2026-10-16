// Las personas de la empresa: sirven de autores, responsables y participantes.
// Portado del catálogo del playground anterior; los datos no se editan a mano.

export type Colaborador = {
  id: string
  nombre: string
  cargo: string
  area: string
  esJefe: boolean
}

// Vista corta, la que usan las pantallas.
export const COLABORADORES: Colaborador[] = [
    {
      "id": "1011000001",
      "nombre": "Patricia Elena Bermúdez Ríos",
      "cargo": "Gerente General",
      "area": "Gerencia General",
      "esJefe": true
    },
    {
      "id": "1011000002",
      "nombre": "Ricardo Ospina Duque",
      "cargo": "Director Comercial",
      "area": "Ventas",
      "esJefe": true
    },
    {
      "id": "1011000003",
      "nombre": "Fernando Castro Restrepo",
      "cargo": "Líder de Instalaciones",
      "area": "Instalaciones",
      "esJefe": true
    },
    {
      "id": "1011000004",
      "nombre": "Claudia Vargas Mendoza",
      "cargo": "Líder de Servicio Técnico",
      "area": "Reparaciones",
      "esJefe": true
    },
    {
      "id": "1011000005",
      "nombre": "Andrea Suárez Gómez",
      "cargo": "Coordinadora de Atención al Cliente",
      "area": "Atención al Cliente",
      "esJefe": true
    },
    {
      "id": "1011000006",
      "nombre": "María Alejandra Sánchez Pardo",
      "cargo": "Líder de Logística",
      "area": "Logística",
      "esJefe": true
    },
    {
      "id": "1011000007",
      "nombre": "Mónica Jiménez Pérez",
      "cargo": "Gerente Administrativa",
      "area": "Administración",
      "esJefe": true
    },
    {
      "id": "1011000008",
      "nombre": "Alejandro Moreno Ruiz",
      "cargo": "Director de Marketing",
      "area": "Marketing",
      "esJefe": true
    },
    {
      "id": "1011000052",
      "nombre": "Carmen Rosa Díaz Herrera",
      "cargo": "Líder de Recursos Humanos",
      "area": "Recursos Humanos",
      "esJefe": true
    },
    {
      "id": "1011000009",
      "nombre": "Carlos Andrés García López",
      "cargo": "Asesor Comercial Senior",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000010",
      "nombre": "Laura Valentina Rodríguez Martínez",
      "cargo": "Asesora Comercial",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000011",
      "nombre": "Miguel Ángel Hernández Díaz",
      "cargo": "Asesor Comercial",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000012",
      "nombre": "Natalia Sofía Torres Sánchez",
      "cargo": "Asesora Comercial",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000013",
      "nombre": "Sebastián Felipe Gómez Álvarez",
      "cargo": "Ejecutivo de Cuenta Corporativa",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000014",
      "nombre": "Juliana Andrea Pérez Castro",
      "cargo": "Ejecutiva de Cuenta Corporativa",
      "area": "Ventas",
      "esJefe": false
    },
    {
      "id": "1011000015",
      "nombre": "Juan David López González",
      "cargo": "Técnico Instalador de Persianas",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000016",
      "nombre": "Diego Alejandro Martínez Romero",
      "cargo": "Técnico Instalador de Pérgolas",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000017",
      "nombre": "Camilo Ernesto Sánchez Vargas",
      "cargo": "Técnico Instalador de Toldos",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000018",
      "nombre": "Andrés Felipe Ruiz Mendoza",
      "cargo": "Técnico Instalador de Polarizados",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000019",
      "nombre": "Santiago José Díaz Suárez",
      "cargo": "Técnico Instalador de Grama Sintética",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000020",
      "nombre": "Daniel Esteban Ortiz Restrepo",
      "cargo": "Técnico Instalador de Papel de Colgadura",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000021",
      "nombre": "Carolina María Álvarez Torres",
      "cargo": "Coordinadora de Instalaciones",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000022",
      "nombre": "Iván Mauricio Romero Jiménez",
      "cargo": "Auxiliar de Instalaciones",
      "area": "Instalaciones",
      "esJefe": false
    },
    {
      "id": "1011000023",
      "nombre": "José Luis González Pérez",
      "cargo": "Técnico de Reparación de Persianas",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000024",
      "nombre": "Diana Patricia Morales Herrera",
      "cargo": "Técnica de Reparación de Cortinas",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000025",
      "nombre": "Pablo Antonio Castro Ríos",
      "cargo": "Técnico de Reparación de Toldos",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000026",
      "nombre": "Sandra Milena Rojas Pineda",
      "cargo": "Técnica de Reparación de Pérgolas",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000027",
      "nombre": "Gustavo Hernán Mejía López",
      "cargo": "Técnico Senior de Mantenimiento",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000028",
      "nombre": "Marcela Isabel Duque Vásquez",
      "cargo": "Coordinadora de Garantías",
      "area": "Reparaciones",
      "esJefe": false
    },
    {
      "id": "1011000029",
      "nombre": "Paola Andrea Hernández Gil",
      "cargo": "Agente de Servicio al Cliente",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000030",
      "nombre": "Nicolás Esteban Vargas Quintero",
      "cargo": "Agente de Servicio al Cliente",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000031",
      "nombre": "Valentina Isabel Ospina Mejía",
      "cargo": "Especialista en Seguimiento Postventa",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000032",
      "nombre": "Óscar Eduardo Restrepo Cárdenas",
      "cargo": "Especialista en Quejas y Reclamos",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000033",
      "nombre": "Isabella Sofía Muñoz Arias",
      "cargo": "Agente de Cotizaciones",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000034",
      "nombre": "Camila Andrea Cárdenas Lozano",
      "cargo": "Recepcionista",
      "area": "Atención al Cliente",
      "esJefe": false
    },
    {
      "id": "1011000035",
      "nombre": "Luis Fernando Giraldo Ochoa",
      "cargo": "Coordinador de Bodega",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000036",
      "nombre": "Lina María Salazar Bedoya",
      "cargo": "Auxiliar de Inventarios",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000037",
      "nombre": "Hernán Darío Zapata Monsalve",
      "cargo": "Conductor de Entregas",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000038",
      "nombre": "Ángela Patricia Londoño Henao",
      "cargo": "Auxiliar de Despachos",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000039",
      "nombre": "Eduardo José Arango Uribe",
      "cargo": "Conductor de Entregas",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000040",
      "nombre": "Vanessa Alejandra Botero Ríos",
      "cargo": "Coordinadora de Rutas",
      "area": "Logística",
      "esJefe": false
    },
    {
      "id": "1011000041",
      "nombre": "Lucía Fernanda Correa Marín",
      "cargo": "Contadora",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000042",
      "nombre": "Felipe Andrés Montoya Jaramillo",
      "cargo": "Auxiliar Contable",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000043",
      "nombre": "Daniela Cristina Velásquez Parra",
      "cargo": "Analista de Recursos Humanos",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000044",
      "nombre": "Mauricio Alberto Escobar Flórez",
      "cargo": "Analista de Compras",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000045",
      "nombre": "Paula Alejandra Naranjo Galeano",
      "cargo": "Asistente Administrativa",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000046",
      "nombre": "Catalina María Hoyos Rendón",
      "cargo": "Tesorera",
      "area": "Administración",
      "esJefe": false
    },
    {
      "id": "1011000047",
      "nombre": "Alejandra María Saldarriaga Tobón",
      "cargo": "Diseñadora Gráfica",
      "area": "Marketing",
      "esJefe": false
    },
    {
      "id": "1011000048",
      "nombre": "David Santiago Gutiérrez Ossa",
      "cargo": "Community Manager",
      "area": "Marketing",
      "esJefe": false
    },
    {
      "id": "1011000049",
      "nombre": "Sara Valentina Castaño Sierra",
      "cargo": "Fotógrafa de Producto",
      "area": "Marketing",
      "esJefe": false
    },
    {
      "id": "1011000050",
      "nombre": "Mateo José Gómez Cardona",
      "cargo": "Especialista en Pauta Digital",
      "area": "Marketing",
      "esJefe": false
    },
    {
      "id": "1011000051",
      "nombre": "María José Aristizábal Correa",
      "cargo": "Analista de Contenidos",
      "area": "Marketing",
      "esJefe": false
    },
    {
      "id": "1011000053",
      "nombre": "Roberto Carlos Méndez Soto",
      "cargo": "Encargado de Objetivos y OKRs",
      "area": "Recursos Humanos",
      "esJefe": false
    },
    {
      "id": "1011000054",
      "nombre": "Adriana Lucía Ríos Calle",
      "cargo": "Encargada de Encuestas (Cultura, Salud, 360)",
      "area": "Recursos Humanos",
      "esJefe": false
    },
    {
      "id": "1011000055",
      "nombre": "Martín Andrés Soto Vega",
      "cargo": "Encargado de Nómina",
      "area": "Recursos Humanos",
      "esJefe": false
    }
  ]

export const AREAS = [...new Set(COLABORADORES.map((c) => c.area))].sort()

// Registro completo, con jefes, avatares y usuarios: lo piden planes de formación y tareas.
export const BD_MASTER_COLABORADORES = {
    "version": "1.0",
    "empresaReferencia": {
      "id": "emp-fi-001",
      "nombreLegal": "Meta Colombia S.A.S.",
      "descripcion": "Empresa colombiana de venta, reparación e instalación de productos decorativos."
    },
    "nivelesEmpresa": [
      "Estratégico",
      "Operativo",
      "Táctico con personal a cargo",
      "Táctico sin personal a cargo"
    ],
    "ciudadesColombia": [
      "Bogotá",
      "Barranquilla",
      "Medellín",
      "Cali",
      "Pereira"
    ],
    "nota": "Lista canónica de los 55 colaboradores de la empresa (misma forma que EMPLEADOS_EJEMPLO en tareas). bd-tareas-y-planes.js clona colaboradores en EMPLEADOS_EJEMPLO, GERENTE_EJEMPLO y JEFES_EJEMPLO. API: TAREAS_PLANES_DB.getEmpleadosEjemplo().",
    "ejemploRegistro": {
      "id": "E001",
      "idColaborador": "1011000001",
      "username": "pateleber@meta.com",
      "nombreCompleto": "Patricia Elena Bermúdez Ríos",
      "correoElectronico": "pateleber@meta.com",
      "area": "Gerencia General",
      "lider": null,
      "dni": "5298765432",
      "fechaCreacionUsuario": "2025-03-12",
      "antiguedadMesesEnEmpresa": 48,
      "pais": "Colombia",
      "ciudad": "Medellín",
      "nivelEnEmpresa": "Estratégico",
      "cargoEnEmpresa": "Gerente General",
      "columnaA": "Centro de costos: GG-01",
      "columnaB": "Modalidad: Presencial híbrido"
    },
    "colaboradores": [
      {
        "id": "E001",
        "idColaborador": "1011000001",
        "nombre": "Patricia Elena Bermúdez Ríos",
        "cargo": "Gerente General",
        "area": "Gerencia General",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop",
        "username": "pateleber@meta.com",
        "jefe": null,
        "esJefe": true,
        "esGerenteGeneral": true
      },
      {
        "id": "E002",
        "idColaborador": "1011000002",
        "nombre": "Ricardo Ospina Duque",
        "cargo": "Director Comercial",
        "area": "Ventas",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
        "username": "rospid@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E003",
        "idColaborador": "1011000003",
        "nombre": "Fernando Castro Restrepo",
        "cargo": "Líder de Instalaciones",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        "username": "fcastr@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E004",
        "idColaborador": "1011000004",
        "nombre": "Claudia Vargas Mendoza",
        "cargo": "Líder de Servicio Técnico",
        "area": "Reparaciones",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
        "username": "cvargm@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E005",
        "idColaborador": "1011000005",
        "nombre": "Andrea Suárez Gómez",
        "cargo": "Coordinadora de Atención al Cliente",
        "area": "Atención al Cliente",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
        "username": "asuarg@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E006",
        "idColaborador": "1011000006",
        "nombre": "María Alejandra Sánchez Pardo",
        "cargo": "Líder de Logística",
        "area": "Logística",
        "genero": "F",
        "avatar": "../../images/Profile-image.jpg",
        "username": "masanchez@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E007",
        "idColaborador": "1011000007",
        "nombre": "Mónica Jiménez Pérez",
        "cargo": "Gerente Administrativa",
        "area": "Administración",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        "username": "mjimep@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E008",
        "idColaborador": "1011000008",
        "nombre": "Alejandro Moreno Ruiz",
        "cargo": "Director de Marketing",
        "area": "Marketing",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        "username": "amorer@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E052",
        "idColaborador": "1011000052",
        "nombre": "Carmen Rosa Díaz Herrera",
        "cargo": "Líder de Recursos Humanos",
        "area": "Recursos Humanos",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop",
        "username": "crdiaz@meta.com",
        "jefe": "Patricia Elena Bermúdez Ríos",
        "esJefe": true
      },
      {
        "id": "E009",
        "idColaborador": "1011000009",
        "username": "cgarcl@meta.com",
        "nombre": "Carlos Andrés García López",
        "cargo": "Asesor Comercial Senior",
        "area": "Ventas",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E010",
        "idColaborador": "1011000010",
        "username": "lrodrm@meta.com",
        "nombre": "Laura Valentina Rodríguez Martínez",
        "cargo": "Asesora Comercial",
        "area": "Ventas",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E011",
        "idColaborador": "1011000011",
        "username": "mhernd@meta.com",
        "nombre": "Miguel Ángel Hernández Díaz",
        "cargo": "Asesor Comercial",
        "area": "Ventas",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E012",
        "idColaborador": "1011000012",
        "username": "ntorrs@meta.com",
        "nombre": "Natalia Sofía Torres Sánchez",
        "cargo": "Asesora Comercial",
        "area": "Ventas",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E013",
        "idColaborador": "1011000013",
        "username": "sgomea@meta.com",
        "nombre": "Sebastián Felipe Gómez Álvarez",
        "cargo": "Ejecutivo de Cuenta Corporativa",
        "area": "Ventas",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E014",
        "idColaborador": "1011000014",
        "username": "jperec@meta.com",
        "nombre": "Juliana Andrea Pérez Castro",
        "cargo": "Ejecutiva de Cuenta Corporativa",
        "area": "Ventas",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        "jefe": "Ricardo Ospina Duque",
        "esJefe": false
      },
      {
        "id": "E015",
        "idColaborador": "1011000015",
        "username": "jlopeg@meta.com",
        "nombre": "Juan David López González",
        "cargo": "Técnico Instalador de Persianas",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E016",
        "idColaborador": "1011000016",
        "username": "dmartr@meta.com",
        "nombre": "Diego Alejandro Martínez Romero",
        "cargo": "Técnico Instalador de Pérgolas",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E017",
        "idColaborador": "1011000017",
        "username": "csancv@meta.com",
        "nombre": "Camilo Ernesto Sánchez Vargas",
        "cargo": "Técnico Instalador de Toldos",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E018",
        "idColaborador": "1011000018",
        "username": "aruizm@meta.com",
        "nombre": "Andrés Felipe Ruiz Mendoza",
        "cargo": "Técnico Instalador de Polarizados",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E019",
        "idColaborador": "1011000019",
        "username": "sdiazs@meta.com",
        "nombre": "Santiago José Díaz Suárez",
        "cargo": "Técnico Instalador de Grama Sintética",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E020",
        "idColaborador": "1011000020",
        "username": "dortir@meta.com",
        "nombre": "Daniel Esteban Ortiz Restrepo",
        "cargo": "Técnico Instalador de Papel de Colgadura",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1557862921-37829c790f19?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E021",
        "idColaborador": "1011000021",
        "username": "calvat@meta.com",
        "nombre": "Carolina María Álvarez Torres",
        "cargo": "Coordinadora de Instalaciones",
        "area": "Instalaciones",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E022",
        "idColaborador": "1011000022",
        "username": "iromej@meta.com",
        "nombre": "Iván Mauricio Romero Jiménez",
        "cargo": "Auxiliar de Instalaciones",
        "area": "Instalaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop",
        "jefe": "Fernando Castro Restrepo",
        "esJefe": false
      },
      {
        "id": "E023",
        "idColaborador": "1011000023",
        "username": "jgonzp@meta.com",
        "nombre": "José Luis González Pérez",
        "cargo": "Técnico de Reparación de Persianas",
        "area": "Reparaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E024",
        "idColaborador": "1011000024",
        "username": "dmorah@meta.com",
        "nombre": "Diana Patricia Morales Herrera",
        "cargo": "Técnica de Reparación de Cortinas",
        "area": "Reparaciones",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E025",
        "idColaborador": "1011000025",
        "username": "pcastr@meta.com",
        "nombre": "Pablo Antonio Castro Ríos",
        "cargo": "Técnico de Reparación de Toldos",
        "area": "Reparaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E026",
        "idColaborador": "1011000026",
        "username": "srojap@meta.com",
        "nombre": "Sandra Milena Rojas Pineda",
        "cargo": "Técnica de Reparación de Pérgolas",
        "area": "Reparaciones",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E027",
        "idColaborador": "1011000027",
        "username": "gmejil@meta.com",
        "nombre": "Gustavo Hernán Mejía López",
        "cargo": "Técnico Senior de Mantenimiento",
        "area": "Reparaciones",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E028",
        "idColaborador": "1011000028",
        "username": "mduquv@meta.com",
        "nombre": "Marcela Isabel Duque Vásquez",
        "cargo": "Coordinadora de Garantías",
        "area": "Reparaciones",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop",
        "jefe": "Claudia Vargas Mendoza",
        "esJefe": false
      },
      {
        "id": "E029",
        "idColaborador": "1011000029",
        "username": "pherng@meta.com",
        "nombre": "Paola Andrea Hernández Gil",
        "cargo": "Agente de Servicio al Cliente",
        "area": "Atención al Cliente",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E030",
        "idColaborador": "1011000030",
        "username": "nvargq@meta.com",
        "nombre": "Nicolás Esteban Vargas Quintero",
        "cargo": "Agente de Servicio al Cliente",
        "area": "Atención al Cliente",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E031",
        "idColaborador": "1011000031",
        "username": "vospim@meta.com",
        "nombre": "Valentina Isabel Ospina Mejía",
        "cargo": "Especialista en Seguimiento Postventa",
        "area": "Atención al Cliente",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E032",
        "idColaborador": "1011000032",
        "username": "orestc@meta.com",
        "nombre": "Óscar Eduardo Restrepo Cárdenas",
        "cargo": "Especialista en Quejas y Reclamos",
        "area": "Atención al Cliente",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E033",
        "idColaborador": "1011000033",
        "username": "imunoa@meta.com",
        "nombre": "Isabella Sofía Muñoz Arias",
        "cargo": "Agente de Cotizaciones",
        "area": "Atención al Cliente",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E034",
        "idColaborador": "1011000034",
        "username": "ccardl@meta.com",
        "nombre": "Camila Andrea Cárdenas Lozano",
        "cargo": "Recepcionista",
        "area": "Atención al Cliente",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop",
        "jefe": "Andrea Suárez Gómez",
        "esJefe": false
      },
      {
        "id": "E035",
        "idColaborador": "1011000035",
        "username": "lgirao@meta.com",
        "nombre": "Luis Fernando Giraldo Ochoa",
        "cargo": "Coordinador de Bodega",
        "area": "Logística",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E036",
        "idColaborador": "1011000036",
        "username": "lsalab@meta.com",
        "nombre": "Lina María Salazar Bedoya",
        "cargo": "Auxiliar de Inventarios",
        "area": "Logística",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E037",
        "idColaborador": "1011000037",
        "username": "hzapam@meta.com",
        "nombre": "Hernán Darío Zapata Monsalve",
        "cargo": "Conductor de Entregas",
        "area": "Logística",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E038",
        "idColaborador": "1011000038",
        "username": "alondh@meta.com",
        "nombre": "Ángela Patricia Londoño Henao",
        "cargo": "Auxiliar de Despachos",
        "area": "Logística",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E039",
        "idColaborador": "1011000039",
        "username": "earanu@meta.com",
        "nombre": "Eduardo José Arango Uribe",
        "cargo": "Conductor de Entregas",
        "area": "Logística",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E040",
        "idColaborador": "1011000040",
        "username": "vboter@meta.com",
        "nombre": "Vanessa Alejandra Botero Ríos",
        "cargo": "Coordinadora de Rutas",
        "area": "Logística",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=100&h=100&fit=crop",
        "jefe": "María Alejandra Sánchez Pardo",
        "esJefe": false
      },
      {
        "id": "E041",
        "idColaborador": "1011000041",
        "username": "lcorrm@meta.com",
        "nombre": "Lucía Fernanda Correa Marín",
        "cargo": "Contadora",
        "area": "Administración",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E042",
        "idColaborador": "1011000042",
        "username": "fmontj@meta.com",
        "nombre": "Felipe Andrés Montoya Jaramillo",
        "cargo": "Auxiliar Contable",
        "area": "Administración",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E043",
        "idColaborador": "1011000043",
        "username": "dvelap@meta.com",
        "nombre": "Daniela Cristina Velásquez Parra",
        "cargo": "Analista de Recursos Humanos",
        "area": "Administración",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1629747490241-624f07d70e1e?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E044",
        "idColaborador": "1011000044",
        "username": "mescof@meta.com",
        "nombre": "Mauricio Alberto Escobar Flórez",
        "cargo": "Analista de Compras",
        "area": "Administración",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E045",
        "idColaborador": "1011000045",
        "username": "pnarag@meta.com",
        "nombre": "Paula Alejandra Naranjo Galeano",
        "cargo": "Asistente Administrativa",
        "area": "Administración",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E046",
        "idColaborador": "1011000046",
        "username": "choyor@meta.com",
        "nombre": "Catalina María Hoyos Rendón",
        "cargo": "Tesorera",
        "area": "Administración",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=100&h=100&fit=crop",
        "jefe": "Mónica Jiménez Pérez",
        "esJefe": false
      },
      {
        "id": "E047",
        "idColaborador": "1011000047",
        "username": "asaldt@meta.com",
        "nombre": "Alejandra María Saldarriaga Tobón",
        "cargo": "Diseñadora Gráfica",
        "area": "Marketing",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        "jefe": "Alejandro Moreno Ruiz",
        "esJefe": false
      },
      {
        "id": "E048",
        "idColaborador": "1011000048",
        "username": "dgutio@meta.com",
        "nombre": "David Santiago Gutiérrez Ossa",
        "cargo": "Community Manager",
        "area": "Marketing",
        "genero": "M",
        "avatar": null,
        "jefe": "Alejandro Moreno Ruiz",
        "esJefe": false
      },
      {
        "id": "E049",
        "idColaborador": "1011000049",
        "username": "scasts@meta.com",
        "nombre": "Sara Valentina Castaño Sierra",
        "cargo": "Fotógrafa de Producto",
        "area": "Marketing",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1508243771214-6e95d137426b?w=100&h=100&fit=crop",
        "jefe": "Alejandro Moreno Ruiz",
        "esJefe": false
      },
      {
        "id": "E050",
        "idColaborador": "1011000050",
        "username": "mgomec@meta.com",
        "nombre": "Mateo José Gómez Cardona",
        "cargo": "Especialista en Pauta Digital",
        "area": "Marketing",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?w=100&h=100&fit=crop",
        "jefe": "Alejandro Moreno Ruiz",
        "esJefe": false
      },
      {
        "id": "E051",
        "idColaborador": "1011000051",
        "username": "marisc@meta.com",
        "nombre": "María José Aristizábal Correa",
        "cargo": "Analista de Contenidos",
        "area": "Marketing",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
        "jefe": "Alejandro Moreno Ruiz",
        "esJefe": false
      },
      {
        "id": "E053",
        "idColaborador": "1011000053",
        "username": "rmends@meta.com",
        "nombre": "Roberto Carlos Méndez Soto",
        "cargo": "Encargado de Objetivos y OKRs",
        "area": "Recursos Humanos",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
        "jefe": "Carmen Rosa Díaz Herrera",
        "esJefe": false
      },
      {
        "id": "E054",
        "idColaborador": "1011000054",
        "username": "ariosc@meta.com",
        "nombre": "Adriana Lucía Ríos Calle",
        "cargo": "Encargada de Encuestas (Cultura, Salud, 360)",
        "area": "Recursos Humanos",
        "genero": "F",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        "jefe": "Carmen Rosa Díaz Herrera",
        "esJefe": false
      },
      {
        "id": "E055",
        "idColaborador": "1011000055",
        "username": "msotov@meta.com",
        "nombre": "Martín Andrés Soto Vega",
        "cargo": "Encargado de Nómina",
        "area": "Recursos Humanos",
        "genero": "M",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        "jefe": "Carmen Rosa Díaz Herrera",
        "esJefe": false
      }
    ]
  }
