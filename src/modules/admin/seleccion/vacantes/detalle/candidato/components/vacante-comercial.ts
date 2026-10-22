// Cuarta vacante de ejemplo: la única con Pruebas psicométricas y Roleplay AI en su flujo.
// Sigue la plantilla «Comercial con roleplay (6 etapas)» del asistente de crear vacante
// (crear/components/vacante-data.ts). Existe para enseñar el expediente con esas dos evaluaciones.
//
// Solo importa tipos de data.ts: data.ts la importa a ella para sumarla a VACANTES, y un import de
// valores en los dos sentidos dejaría una de las dos listas vacía al cargar.

import type { Candidato, EstadoRequisito, EtapaId, Nota, Origen, Vacante } from '../../components/data'

type Base = {
  id: string
  nombre: string
  origen: Origen
  etapa: EtapaId
  dias: number
  ajuste: number
  cargo: string
  empresa: string
  ciudad: string
  anios: number
  pretension: number
  disponibilidad: number
  habilidades: string[]
  requisitos: EstadoRequisito[]
  resumen: string
  trayectoria: Candidato['trayectoria']
  celular: string
  notas?: Nota[]
  accion?: string
}

const RANGO: [number, number] = [3.8, 4.5]

function candidato(base: Base): Candidato {
  const [nombre, apellido] = base.nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').split(' ')
  const riesgos: Candidato['riesgos'] = []
  if (base.pretension > RANGO[1]) {
    riesgos.push({
      texto: `Pide $${base.pretension.toLocaleString('es-CO')} M: por encima del tope del rango.`,
      fuentes: [{ etiqueta: 'Datos · pretensión', seccion: 'datos' }],
    })
  }
  base.requisitos.forEach((estado) => {
    if (estado === 'Parcial') {
      riesgos.push({ texto: 'Cumple a medias uno de los requisitos del cargo.', fuentes: [{ etiqueta: 'Hoja de vida · requisitos', seccion: 'cv' }] })
    }
  })
  return {
    ...base,
    iniciales: base.nombre
      .split(' ')
      .map((parte) => parte[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    correo: `${nombre}.${apellido}@correo.com`,
    respuestas: [],
    fortalezas: [
      {
        texto: `${base.anios} años en ventas; hoy es ${base.cargo} en ${base.empresa}.`,
        fuentes: [{ etiqueta: `Hoja de vida · ${base.empresa}`, seccion: 'cv' }],
      },
    ],
    riesgos,
    notas: base.notas ?? [],
  }
}

export const REQUISITOS_COMERCIAL = [
  '2 o más años en venta consultiva B2B',
  'Manejo de CRM (Salesforce o HubSpot)',
  'Cartera de clientes en retail o consumo masivo',
  'Disponibilidad para visitar clientes en Bogotá',
]

const CANDIDATOS: Candidato[] = [
  candidato({
    id: 'natalia-gomez',
    nombre: 'Natalia Gómez',
    origen: 'LinkedIn',
    celular: '+57 310 482 1937',
    etapa: 'revision',
    dias: 2,
    ajuste: 84,
    cargo: 'Ejecutiva de cuenta',
    empresa: 'Tecnoquímicas',
    ciudad: 'Bogotá',
    anios: 4,
    pretension: 4.3,
    disponibilidad: 15,
    habilidades: ['Venta consultiva', 'Salesforce', 'Negociación', 'Retail'],
    requisitos: ['Cumple', 'Cumple', 'Parcial', 'Cumple'],
    resumen:
      'Ejecutiva de cuenta con 4 años en consumo masivo. En Tecnoquímicas maneja 38 droguerías independientes y creció su cartera 22 % en 2025.',
    trayectoria: [
      { cargo: 'Ejecutiva de cuenta', empresa: 'Tecnoquímicas', periodo: 'Feb 2023 – hoy' },
      { cargo: 'Asesora comercial', empresa: 'Colsubsidio', periodo: 'Ene 2021 – ene 2023' },
    ],
    notas: [
      {
        id: 1,
        autor: 'Camilo Ríos',
        fecha: '19 sep, 3:40 p. m.',
        texto: 'Muy buen manejo de la objeción de precio: pasó a hablar de tiempos de entrega sin que Camila lo pidiera.',
        etapa: 'roleplay',
      },
    ],
    accion: 'Revisar assessment',
  }),
  candidato({
    id: 'sebastian-vargas',
    nombre: 'Sebastián Vargas',
    origen: 'Portal de empleo',
    celular: '+57 315 907 2264',
    etapa: 'roleplay',
    dias: 1,
    ajuste: 79,
    cargo: 'Asesor comercial',
    empresa: 'Claro',
    ciudad: 'Bogotá',
    anios: 3,
    pretension: 4,
    disponibilidad: 0,
    habilidades: ['Telemercadeo', 'HubSpot', 'Cierre de ventas'],
    requisitos: ['Cumple', 'Cumple', 'Parcial', 'Cumple'],
    resumen: 'Asesor comercial con 3 años en telecomunicaciones: venta empresarial por teléfono y visitas a pymes.',
    trayectoria: [
      { cargo: 'Asesor comercial empresas', empresa: 'Claro', periodo: 'Mar 2023 – hoy' },
      { cargo: 'Agente de telemercadeo', empresa: 'Konecta', periodo: 'Jun 2022 – feb 2023' },
    ],
    accion: 'Revisar la alerta del Roleplay',
  }),
  candidato({
    id: 'paula-herrera',
    nombre: 'Paula Herrera',
    origen: 'Referido',
    celular: '+57 301 226 5580',
    etapa: 'roleplay',
    dias: 3,
    ajuste: 76,
    cargo: 'Representante de ventas',
    empresa: 'Bimbo',
    ciudad: 'Soacha',
    anios: 3,
    pretension: 3.9,
    disponibilidad: 15,
    habilidades: ['Canal tradicional', 'Excel', 'Negociación'],
    requisitos: ['Cumple', 'Parcial', 'Cumple', 'Cumple'],
    resumen: 'Representante de ventas en canal tradicional: 120 tiendas en el sur de Bogotá y Soacha.',
    trayectoria: [{ cargo: 'Representante de ventas', empresa: 'Bimbo', periodo: 'Ago 2022 – hoy' }],
    accion: 'No ha presentado el Roleplay',
  }),
  candidato({
    id: 'diego-cardenas',
    nombre: 'Diego Cárdenas',
    origen: 'LinkedIn',
    celular: '+57 318 640 1172',
    etapa: 'psicometricas',
    dias: 2,
    ajuste: 71,
    cargo: 'Ejecutivo de ventas jr',
    empresa: 'Siesa',
    ciudad: 'Bogotá',
    anios: 2,
    pretension: 3.8,
    disponibilidad: 0,
    habilidades: ['Prospección', 'HubSpot'],
    requisitos: ['Cumple', 'Cumple', 'Por validar', 'Cumple'],
    resumen: 'Ejecutivo de ventas de software para pymes, con 2 años prospectando clientes nuevos.',
    trayectoria: [{ cargo: 'Ejecutivo de ventas jr', empresa: 'Siesa', periodo: 'Jul 2024 – hoy' }],
  }),
  candidato({
    id: 'carolina-beltran',
    nombre: 'Carolina Beltrán',
    origen: 'Computrabajo',
    celular: '+57 304 773 9025',
    etapa: 'cv',
    dias: 4,
    ajuste: 66,
    cargo: 'Asistente comercial',
    empresa: 'Grupo Éxito',
    ciudad: 'Bogotá',
    anios: 2,
    pretension: 4.8,
    disponibilidad: 30,
    habilidades: ['Excel', 'Servicio al cliente', 'SAP'],
    requisitos: ['Parcial', 'Parcial', 'Por validar', 'Cumple'],
    resumen: 'Asistente comercial en la negociación con proveedores de la categoría de aseo.',
    trayectoria: [{ cargo: 'Asistente comercial', empresa: 'Grupo Éxito', periodo: 'Abr 2024 – hoy' }],
    accion: 'Sin revisar hace 4 días',
  }),
]

export const VACANTE_COMERCIAL: Vacante = {
  id: 'ejecutivo-comercial',
  titulo: 'Ejecutivo(a) comercial',
  estado: 'Publicada',
  area: 'Comercial',
  sede: 'Bogotá · Calle 93',
  modalidad: 'Híbrido',
  diasAbierta: 12,
  reclutador: { nombre: 'Camilo Ríos', iniciales: 'CR' },
  contrato: 'Término indefinido',
  seniority: 'Semi senior',
  experiencia: '2 a 4 años',
  idioma: 'No requerido',
  rango: RANGO,
  descripcion: [
    'Abrirás y cuidarás la cartera de droguerías y tiendas de barrio en el norte de Bogotá.',
    'Vas a visitar clientes tres días a la semana y a llevar tu embudo al día en el CRM.',
  ],
  requisitos: REQUISITOS_COMERCIAL,
  descartados: 7,
  candidatos: CANDIDATOS,
  flujo: ['cv', 'psicometricas', 'roleplay', 'revision', 'antecedentes', 'seleccionado'],
}
