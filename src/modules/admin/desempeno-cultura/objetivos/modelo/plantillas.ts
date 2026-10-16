import type { IconSvgElement } from '@hugeicons/react'
import {
  Briefcase01Icon,
  ChartIncreaseIcon,
  ComputerIcon,
  CpuIcon,
  CrownIcon,
  CustomerService01Icon,
  DeliveryTruck01Icon,
  FactoryIcon,
  FirstAidKitIcon,
  Globe02Icon,
  Idea01Icon,
  Megaphone01Icon,
  MoneyBag02Icon,
  PackageIcon,
  Shield01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  WorkflowSquare01Icon,
} from '@hugeicons/core-free-icons'
import type { Tone } from '../../encuestas/modelo/tone'
import type { Periodo } from './ciclos'

// El catálogo de plantillas de ciclo, el mismo del prototipo de Objetivos: 14 plantillas en cuatro categorías. Cada una
// trae tres niveles de objetivos —de empresa, para un grupo y para cada persona— y los de grupo y los individuales se
// alinean uno a uno con los de empresa: el primero de cada nivel contribuye al primero de empresa, y así. Por eso no se
// guarda a cuál contribuye: sale de la posición.

export type Medida = 'Dinero' | 'Numérico' | 'Porcentaje' | 'Hito'
export type Sentido = 'Aumentar' | 'Reducir'

export interface ObjetivoPlantilla {
  nombre: string
  descripcion: string
  /** Peso dentro de su nivel, en %. Los de un nivel suman 100. */
  peso: number
  medida: Medida
  /** Un hito se cumple o no: no tiene sentido, valor actual ni meta. */
  sentido: Sentido | null
  actual: string | null
  meta: string | null
}

export type CategoriaId = 'negocio' | 'operacion' | 'personas' | 'producto'

export interface Categoria {
  id: CategoriaId
  nombre: string
  descripcion: string
  icono: IconSvgElement
  /** El color de los iconos de sus plantillas. */
  tono: Tone
}

export interface PlantillaCiclo {
  id: string
  nombre: string
  descripcion: string
  periodo: Periodo
  categoria: CategoriaId
  icono: IconSvgElement
  empresa: readonly ObjetivoPlantilla[]
  grupo: readonly ObjetivoPlantilla[]
  individual: readonly ObjetivoPlantilla[]
}

export const CATEGORIAS: readonly Categoria[] = [
  { id: 'negocio', nombre: 'Negocio', descripcion: 'Ventas, demanda y rentabilidad: lo que la compañía vende, gana y cobra.', icono: Briefcase01Icon, tono: 'brand' },
  { id: 'operacion', nombre: 'Operación', descripcion: 'Producción, calidad y servicio: cómo se entrega y cómo se atiende.', icono: WorkflowSquare01Icon, tono: 'positive' },
  { id: 'personas', nombre: 'Personas', descripcion: 'Rotación, clima y desarrollo: la gente que hace todo lo anterior.', icono: UserMultiple02Icon, tono: 'violet' },
  { id: 'producto', nombre: 'Producto y tecnología', descripcion: 'Adopción, disponibilidad e innovación: lo que la compañía construye y evoluciona.', icono: CpuIcon, tono: 'warning' },
]

/** Un objetivo medible: con sentido, valor de hoy y meta. */
const m = (nombre: string, descripcion: string, peso: number, medida: Exclude<Medida, 'Hito'>, sentido: Sentido, actual: string, meta: string): ObjetivoPlantilla => ({ nombre, descripcion, peso, medida, sentido, actual, meta })
/** Un hito: se cumple o no se cumple. */
const h = (nombre: string, descripcion: string, peso: number): ObjetivoPlantilla => ({ nombre, descripcion, peso, medida: 'Hito', sentido: null, actual: null, meta: null })

export const PLANTILLAS_CICLO: readonly PlantillaCiclo[] = [
  // Negocio
  {
    id: 'comercial',
    nombre: 'Objetivos comerciales',
    descripcion: 'Ventas, clientes nuevos y retención de cuentas para el equipo comercial.',
    periodo: 'Trimestre',
    categoria: 'negocio',
    icono: ChartIncreaseIcon,
    empresa: [
      m('Aumentar las ventas del trimestre', 'Facturación cerrada del equipo comercial dentro de la ventana del ciclo.', 40, 'Dinero', 'Aumentar', '$500.000.000', '$650.000.000'),
      m('Sumar clientes nuevos', 'Cuentas que firman por primera vez, sin contar renovaciones.', 35, 'Numérico', 'Aumentar', '18', '30'),
      m('Bajar la pérdida de cuentas', 'Porcentaje de clientes activos que no renuevan en el periodo.', 25, 'Porcentaje', 'Reducir', '12 %', '6 %'),
    ],
    grupo: [
      m('Aumentar las ventas del área', 'Facturación cerrada por este equipo dentro de la ventana del ciclo.', 40, 'Dinero', 'Aumentar', '$120.000.000', '$160.000.000'),
      m('Abrir cuentas nuevas en el territorio', 'Clientes de primera vez conseguidos por este equipo.', 35, 'Numérico', 'Aumentar', '6', '12'),
      m('Retener las cuentas del área', 'Clientes del equipo que siguen activos al cierre del ciclo.', 25, 'Porcentaje', 'Aumentar', '82 %', '92 %'),
    ],
    individual: [
      m('Cerrar mi cuota del periodo', 'Facturación firmada a mi nombre dentro del ciclo.', 40, 'Dinero', 'Aumentar', '$25.000.000', '$35.000.000'),
      m('Traer clientes nuevos a mi cartera', 'Cuentas que firmo por primera vez en el periodo.', 35, 'Numérico', 'Aumentar', '2', '5'),
      m('Renovar mis contratos del periodo', 'Contratos a mi nombre que vencen y quedan firmados de nuevo.', 25, 'Porcentaje', 'Aumentar', '80 %', '95 %'),
    ],
  },
  {
    id: 'marketing',
    nombre: 'Objetivos de marketing',
    descripcion: 'Demanda, costo de adquisición y presencia de marca.',
    periodo: 'Trimestre',
    categoria: 'negocio',
    icono: Megaphone01Icon,
    empresa: [
      m('Generar oportunidades calificadas', 'Contactos que el equipo comercial acepta como oportunidad real.', 40, 'Numérico', 'Aumentar', '120', '200'),
      m('Reducir el costo por oportunidad', 'Inversión en pauta y contenidos dividida entre las oportunidades logradas.', 35, 'Dinero', 'Reducir', '$180.000', '$120.000'),
      h('Lanzar la nueva marca de producto', 'Hito de lanzamiento: se cumple cuando la marca sale al mercado.', 25),
    ],
    grupo: [
      m('Aportar oportunidades desde el equipo', 'Oportunidades calificadas atribuidas a las campañas del área.', 40, 'Numérico', 'Aumentar', '45', '75'),
      m('Optimizar el gasto de pauta del área', 'Inversión ejecutada por el equipo frente a la aprobada.', 35, 'Porcentaje', 'Reducir', '108 %', '100 %'),
      m('Ejecutar los lanzamientos del periodo', 'Lanzamientos del área entregados dentro de la fecha comprometida.', 25, 'Porcentaje', 'Aumentar', '70 %', '90 %'),
    ],
    individual: [
      m('Publicar mis piezas del periodo', 'Contenidos que salgo a producir y publicar yo.', 40, 'Numérico', 'Aumentar', '4', '8'),
      h('Cerrar el reporte de inversión a tiempo', 'Hito: se cumple cuando el reporte del periodo queda entregado.', 35),
      h('Entregar mi lanzamiento a tiempo', 'Hito: se cumple cuando la pieza de la que respondo sale publicada.', 25),
    ],
  },
  {
    id: 'financieros',
    nombre: 'Objetivos financieros',
    descripcion: 'Margen, cartera y control del gasto de la compañía.',
    periodo: 'Semestre',
    categoria: 'negocio',
    icono: MoneyBag02Icon,
    empresa: [
      m('Subir el margen bruto', 'Margen sobre ventas del periodo, después de costo directo.', 40, 'Porcentaje', 'Aumentar', '34 %', '42 %'),
      m('Reducir la cartera vencida', 'Saldo por cobrar con más de 60 días de mora.', 35, 'Dinero', 'Reducir', '$320.000.000', '$150.000.000'),
      m('Cumplir el presupuesto de gasto', 'Gasto ejecutado frente al aprobado para el periodo.', 25, 'Porcentaje', 'Reducir', '108 %', '100 %'),
    ],
    grupo: [
      m('Mejorar el margen del área', 'Margen de los negocios cerrados por este equipo.', 40, 'Porcentaje', 'Aumentar', '30 %', '38 %'),
      m('Bajar la mora de las cuentas del área', 'Cartera vencida de los clientes que atiende este equipo.', 35, 'Dinero', 'Reducir', '$80.000.000', '$40.000.000'),
      m('Ejecutar el presupuesto del área sin desviarse', 'Gasto del equipo frente al presupuesto que le fue asignado.', 25, 'Porcentaje', 'Reducir', '112 %', '100 %'),
    ],
    individual: [
      m('Cuidar el margen de mis negocios', 'Margen promedio de los negocios que cierro yo.', 40, 'Porcentaje', 'Aumentar', '29 %', '37 %'),
      m('Bajar la mora de mis clientes', 'Saldo vencido de las cuentas que gestiono.', 35, 'Dinero', 'Reducir', '$18.000.000', '$8.000.000'),
      m('Legalizar mis gastos a tiempo', 'Gastos reportados dentro del plazo establecido.', 25, 'Porcentaje', 'Aumentar', '70 %', '95 %'),
    ],
  },
  {
    id: 'expansion',
    nombre: 'Objetivos de expansión y nuevos mercados',
    descripcion: 'Apertura de mercados, nuevos canales y crecimiento fuera del negocio actual.',
    periodo: 'Año',
    categoria: 'negocio',
    icono: Globe02Icon,
    empresa: [
      m('Abrir nuevas ciudades o países', 'Mercados donde la compañía factura por primera vez en el periodo.', 40, 'Numérico', 'Aumentar', '2', '5'),
      m('Generar ventas del negocio nuevo', 'Facturación proveniente de los mercados o canales abiertos en el periodo.', 35, 'Dinero', 'Aumentar', '$0', '$800.000.000'),
      m('Cumplir el plan de expansión a tiempo', 'Hitos del plan de apertura entregados dentro del cronograma aprobado.', 25, 'Porcentaje', 'Aumentar', '60 %', '90 %'),
    ],
    grupo: [
      m('Abrir el mercado asignado al área', 'Mercado bajo responsabilidad de este equipo que queda habilitado en el periodo.', 40, 'Numérico', 'Aumentar', '0', '1'),
      m('Vender en el mercado nuevo del área', 'Facturación del equipo en el mercado o canal recién abierto.', 35, 'Dinero', 'Aumentar', '$0', '$150.000.000'),
      m('Entregar el plan de apertura del área a tiempo', 'Hitos del área dentro del plan de expansión entregados a tiempo.', 25, 'Porcentaje', 'Aumentar', '65 %', '95 %'),
    ],
    individual: [
      h('Levantar mi mercado asignado', 'Hito: se cumple cuando el mercado bajo mi cargo queda operando.', 40),
      m('Cerrar mis primeras ventas en el mercado nuevo', 'Facturación que consigo yo en el mercado o canal recién abierto.', 35, 'Dinero', 'Aumentar', '$0', '$40.000.000'),
      m('Entregar mis hitos del plan a tiempo', 'Hitos del plan de expansión a mi cargo entregados a tiempo.', 25, 'Porcentaje', 'Aumentar', '60 %', '95 %'),
    ],
  },
  // Operación
  {
    id: 'servicio',
    nombre: 'Objetivos de servicio al cliente',
    descripcion: 'Satisfacción, tiempos de respuesta y resolución en primer contacto.',
    periodo: 'Trimestre',
    categoria: 'operacion',
    icono: CustomerService01Icon,
    empresa: [
      m('Subir la satisfacción del cliente', 'Promedio de la encuesta de satisfacción posterior a cada caso atendido.', 40, 'Porcentaje', 'Aumentar', '78 %', '90 %'),
      m('Reducir el tiempo de primera respuesta', 'Horas promedio entre la llegada de un caso y la primera respuesta real.', 30, 'Numérico', 'Reducir', '8', '3'),
      m('Resolver en el primer contacto', 'Casos cerrados sin necesidad de una segunda interacción.', 30, 'Porcentaje', 'Aumentar', '55 %', '75 %'),
    ],
    grupo: [
      m('Subir la satisfacción de los casos del área', 'Calificación media de los casos atendidos por este equipo.', 40, 'Porcentaje', 'Aumentar', '80 %', '92 %'),
      m('Responder más rápido en el área', 'Horas promedio de primera respuesta de los casos del equipo.', 30, 'Numérico', 'Reducir', '6', '2'),
      m('Subir la resolución del área', 'Casos que el equipo cierra sin escalar a nadie más.', 30, 'Porcentaje', 'Aumentar', '60 %', '80 %'),
    ],
    individual: [
      m('Mantener alta la calificación de mis casos', 'Promedio de las encuestas de los casos que atiendo yo.', 40, 'Porcentaje', 'Aumentar', '82 %', '93 %'),
      m('Responder mis casos el mismo día', 'Casos míos con primera respuesta dentro de la jornada.', 30, 'Porcentaje', 'Aumentar', '75 %', '92 %'),
      m('Resolver sin escalar', 'Casos míos cerrados sin pasar a otro nivel.', 30, 'Porcentaje', 'Aumentar', '65 %', '85 %'),
    ],
  },
  {
    id: 'operaciones',
    nombre: 'Objetivos de operaciones',
    descripcion: 'Productividad, costos y calidad del proceso operativo.',
    periodo: 'Semestre',
    categoria: 'operacion',
    icono: FactoryIcon,
    empresa: [
      m('Reducir el costo por unidad producida', 'Costo directo promedio de cada unidad que sale del proceso.', 35, 'Dinero', 'Reducir', '$12.000', '$9.500'),
      m('Bajar la tasa de reprocesos', 'Órdenes que hay que rehacer sobre el total producido.', 35, 'Porcentaje', 'Reducir', '9 %', '4 %'),
      m('Cumplir las entregas a tiempo', 'Órdenes despachadas dentro de la fecha prometida al cliente.', 30, 'Porcentaje', 'Aumentar', '82 %', '95 %'),
    ],
    grupo: [
      m('Bajar el desperdicio del área', 'Material perdido en el proceso de este equipo.', 35, 'Porcentaje', 'Reducir', '9 %', '5 %'),
      m('Bajar los rechazos del área', 'Unidades rechazadas en control de calidad sobre las entregadas.', 35, 'Porcentaje', 'Reducir', '6 %', '2 %'),
      m('Entregar a tiempo desde el equipo', 'Órdenes del equipo despachadas dentro de la fecha.', 30, 'Porcentaje', 'Aumentar', '85 %', '96 %'),
    ],
    individual: [
      m('Reducir mi desperdicio', 'Material perdido en las unidades que yo proceso.', 35, 'Porcentaje', 'Reducir', '7 %', '3 %'),
      m('Reducir mis unidades rechazadas', 'Unidades mías devueltas por control de calidad.', 35, 'Numérico', 'Reducir', '15', '5'),
      m('Cerrar mis órdenes dentro de la fecha', 'Órdenes a mi cargo terminadas antes del vencimiento.', 30, 'Porcentaje', 'Aumentar', '85 %', '97 %'),
    ],
  },
  {
    id: 'logistica',
    nombre: 'Objetivos de logística y cadena de suministro',
    descripcion: 'Nivel de servicio, costo de transporte y exactitud del inventario.',
    periodo: 'Trimestre',
    categoria: 'operacion',
    icono: DeliveryTruck01Icon,
    empresa: [
      m('Subir el nivel de servicio al cliente', 'Pedidos entregados completos y a tiempo sobre el total despachado.', 40, 'Porcentaje', 'Aumentar', '84 %', '96 %'),
      m('Reducir el costo de transporte', 'Costo de flete sobre el valor de la mercancía despachada.', 30, 'Porcentaje', 'Reducir', '9 %', '6 %'),
      m('Subir la exactitud del inventario', 'Coincidencia entre el inventario físico y el registrado en el sistema.', 30, 'Porcentaje', 'Aumentar', '88 %', '98 %'),
    ],
    grupo: [
      m('Subir el nivel de servicio del área', 'Pedidos del equipo entregados completos y a tiempo.', 40, 'Porcentaje', 'Aumentar', '85 %', '97 %'),
      m('Bajar el costo de transporte del área', 'Costo de flete de las rutas que opera este equipo.', 30, 'Porcentaje', 'Reducir', '10 %', '7 %'),
      m('Subir la exactitud del inventario del área', 'Coincidencia del inventario físico frente al sistema en las bodegas del equipo.', 30, 'Porcentaje', 'Aumentar', '89 %', '98 %'),
    ],
    individual: [
      m('Despachar mis pedidos completos y a tiempo', 'Pedidos a mi cargo entregados completos dentro del plazo.', 40, 'Porcentaje', 'Aumentar', '86 %', '97 %'),
      m('Bajar el costo de mis rutas', 'Costo de flete de las rutas que administro yo.', 30, 'Porcentaje', 'Reducir', '11 %', '7 %'),
      m('Mantener exacto mi inventario asignado', 'Coincidencia del inventario físico frente al sistema en mi bodega.', 30, 'Porcentaje', 'Aumentar', '90 %', '99 %'),
    ],
  },
  {
    id: 'calidad',
    nombre: 'Objetivos de calidad y seguridad industrial',
    descripcion: 'No conformidades, accidentalidad y cumplimiento normativo del proceso.',
    periodo: 'Semestre',
    categoria: 'operacion',
    icono: Shield01Icon,
    empresa: [
      m('Bajar las no conformidades de calidad', 'Hallazgos de auditoría de calidad sobre el total de procesos revisados.', 35, 'Porcentaje', 'Reducir', '14 %', '6 %'),
      m('Bajar la accidentalidad laboral', 'Accidentes de trabajo reportados por cada cien colaboradores.', 35, 'Numérico', 'Reducir', '6', '2'),
      m('Cerrar las auditorías normativas', 'Auditorías de cumplimiento cerradas sin hallazgos abiertos.', 30, 'Porcentaje', 'Aumentar', '70 %', '95 %'),
    ],
    grupo: [
      m('Bajar las no conformidades del área', 'Hallazgos de auditoría sobre los procesos que corren en este equipo.', 35, 'Porcentaje', 'Reducir', '15 %', '7 %'),
      m('Bajar la accidentalidad del área', 'Accidentes de trabajo del equipo por cada cien colaboradores.', 35, 'Numérico', 'Reducir', '5', '1'),
      m('Cerrar las auditorías del área', 'Auditorías del equipo cerradas sin hallazgos abiertos.', 30, 'Porcentaje', 'Aumentar', '72 %', '96 %'),
    ],
    individual: [
      m('Cerrar mis hallazgos de calidad', 'Hallazgos a mi cargo que quedan cerrados dentro del plazo.', 35, 'Porcentaje', 'Aumentar', '60 %', '95 %'),
      h('Trabajar sin accidentes en mi puesto', 'Hito: se cumple cuando cierro el periodo sin accidentes reportados.', 35),
      m('Cerrar mis compromisos de auditoría', 'Compromisos de auditoría a mi cargo cerrados dentro del plazo.', 30, 'Porcentaje', 'Aumentar', '65 %', '97 %'),
    ],
  },
  // Personas
  {
    id: 'gente',
    nombre: 'Objetivos de gente y cultura',
    descripcion: 'Rotación, clima y desarrollo de los equipos de la compañía.',
    periodo: 'Año',
    categoria: 'personas',
    icono: UserGroupIcon,
    empresa: [
      m('Reducir la rotación voluntaria', 'Personas que renuncian sobre la planta promedio del periodo.', 35, 'Porcentaje', 'Reducir', '18 %', '10 %'),
      m('Subir la favorabilidad de clima', 'Resultado de la medición de clima organizacional del periodo.', 35, 'Porcentaje', 'Aumentar', '72 %', '85 %'),
      m('Cerrar los planes de formación', 'Colaboradores que completan la ruta de formación asignada.', 30, 'Porcentaje', 'Aumentar', '45 %', '80 %'),
    ],
    grupo: [
      m('Retener al equipo del área', 'Personas del equipo que siguen al cierre del ciclo.', 35, 'Porcentaje', 'Aumentar', '85 %', '95 %'),
      m('Subir el clima del área', 'Favorabilidad de la medición dentro de este equipo.', 35, 'Porcentaje', 'Aumentar', '70 %', '84 %'),
      m('Completar la ruta del área', 'Personas del equipo que terminan la formación asignada.', 30, 'Porcentaje', 'Aumentar', '50 %', '85 %'),
    ],
    individual: [
      m('Hacer mis conversaciones de seguimiento', 'Reuniones uno a uno sostenidas con cada persona a mi cargo.', 35, 'Numérico', 'Aumentar', '6', '12'),
      h('Cerrar el plan de acción de mi equipo', 'Hito: se cumple cuando los compromisos del plan de clima quedan ejecutados.', 35),
      m('Completar mi ruta de formación', 'Cursos de mi plan terminados dentro del ciclo.', 30, 'Porcentaje', 'Aumentar', '40 %', '100 %'),
    ],
  },
  {
    id: 'liderazgo',
    nombre: 'Objetivos de liderazgo y desarrollo gerencial',
    descripcion: 'Cobertura de sucesión, evaluación de líderes y planes de desarrollo.',
    periodo: 'Año',
    categoria: 'personas',
    icono: CrownIcon,
    empresa: [
      m('Cubrir los cargos críticos con plan de sucesión', 'Cargos clave de la compañía con al menos un sucesor identificado.', 35, 'Porcentaje', 'Aumentar', '40 %', '80 %'),
      m('Subir la favorabilidad de liderazgo', 'Resultado de la medición de liderazgo respondida por los equipos.', 35, 'Porcentaje', 'Aumentar', '68 %', '85 %'),
      m('Cerrar los planes de desarrollo de líderes', 'Líderes que completan el plan de desarrollo asignado en el periodo.', 30, 'Porcentaje', 'Aumentar', '45 %', '85 %'),
    ],
    grupo: [
      m('Cubrir la sucesión de los cargos del área', 'Cargos críticos del equipo con sucesor identificado.', 35, 'Porcentaje', 'Aumentar', '40 %', '85 %'),
      m('Subir la favorabilidad de los líderes del área', 'Resultado de la medición de liderazgo entre los líderes de este equipo.', 35, 'Porcentaje', 'Aumentar', '65 %', '87 %'),
      m('Completar el desarrollo de los líderes del área', 'Líderes del equipo que terminan su plan de desarrollo.', 30, 'Porcentaje', 'Aumentar', '50 %', '90 %'),
    ],
    individual: [
      h('Identificar mi sucesor', 'Hito: se cumple cuando dejo un sucesor identificado y en desarrollo para mi cargo.', 35),
      m('Subir mi favorabilidad como líder', 'Resultado de la medición de liderazgo que recibo de mi equipo.', 35, 'Porcentaje', 'Aumentar', '66 %', '88 %'),
      m('Completar mi plan de desarrollo', 'Actividades de mi plan de desarrollo terminadas en el periodo.', 30, 'Porcentaje', 'Aumentar', '40 %', '100 %'),
    ],
  },
  {
    id: 'sst',
    nombre: 'Objetivos de seguridad y salud en el trabajo',
    descripcion: 'Accidentalidad laboral, ausentismo y cierre del plan SG-SST.',
    periodo: 'Año',
    categoria: 'personas',
    icono: FirstAidKitIcon,
    empresa: [
      m('Bajar la accidentalidad laboral', 'Accidentes de trabajo reportados por cada cien colaboradores en el periodo.', 35, 'Numérico', 'Reducir', '7', '2'),
      m('Bajar el ausentismo por enfermedad', 'Días de incapacidad sobre los días laborados en el periodo.', 35, 'Porcentaje', 'Reducir', '6 %', '3 %'),
      m('Cerrar el plan SG-SST', 'Actividades del plan de seguridad y salud en el trabajo ejecutadas en el periodo.', 30, 'Porcentaje', 'Aumentar', '55 %', '100 %'),
    ],
    grupo: [
      m('Bajar la accidentalidad del área', 'Accidentes de trabajo del equipo por cada cien colaboradores.', 35, 'Numérico', 'Reducir', '6', '1'),
      m('Bajar el ausentismo del área', 'Días de incapacidad del equipo sobre los días laborados.', 35, 'Porcentaje', 'Reducir', '7 %', '3 %'),
      m('Ejecutar el plan SG-SST del área', 'Actividades del plan asignadas a este equipo ya ejecutadas.', 30, 'Porcentaje', 'Aumentar', '60 %', '100 %'),
    ],
    individual: [
      h('Trabajar sin accidentes', 'Hito: se cumple cuando cierro el periodo sin accidentes reportados en mi puesto.', 35),
      m('Bajar mi ausentismo', 'Días de incapacidad míos sobre los días laborados en el periodo.', 35, 'Porcentaje', 'Reducir', '8 %', '3 %'),
      m('Cumplir mis actividades del plan SG-SST', 'Actividades del plan a mi cargo ya ejecutadas en el periodo.', 30, 'Porcentaje', 'Aumentar', '60 %', '100 %'),
    ],
  },
  // Producto y tecnología
  {
    id: 'producto',
    nombre: 'Objetivos de producto',
    descripcion: 'Adopción, retención y velocidad de entrega del producto.',
    periodo: 'Trimestre',
    categoria: 'producto',
    icono: PackageIcon,
    empresa: [
      m('Subir la adopción de la funcionalidad clave', 'Usuarios activos que usan la funcionalidad principal del producto en el periodo.', 35, 'Porcentaje', 'Aumentar', '35 %', '60 %'),
      m('Reducir la fuga de usuarios', 'Usuarios que dejan de usar el producto sobre el total activo al inicio del periodo.', 35, 'Porcentaje', 'Reducir', '8 %', '4 %'),
      m('Entregar el roadmap del trimestre', 'Funcionalidades comprometidas en el roadmap que salen a producción en el periodo.', 30, 'Porcentaje', 'Aumentar', '55 %', '90 %'),
    ],
    grupo: [
      m('Subir la adopción en el módulo del área', 'Usuarios activos del módulo que atiende este equipo.', 35, 'Porcentaje', 'Aumentar', '30 %', '55 %'),
      m('Bajar la fuga en el segmento del área', 'Usuarios del segmento que atiende este equipo que dejan de usar el producto.', 35, 'Porcentaje', 'Reducir', '10 %', '5 %'),
      m('Entregar las funcionalidades del área a tiempo', 'Funcionalidades del roadmap a cargo de este equipo entregadas a tiempo.', 30, 'Porcentaje', 'Aumentar', '60 %', '92 %'),
    ],
    individual: [
      m('Subir la adopción de mis usuarios asignados', 'Cuentas o usuarios que atiendo yo y usan la funcionalidad principal.', 35, 'Porcentaje', 'Aumentar', '32 %', '58 %'),
      m('Retener a mis cuentas asignadas', 'Cuentas bajo mi cargo que dejan de usar el producto.', 35, 'Porcentaje', 'Reducir', '9 %', '4 %'),
      m('Entregar mis historias del periodo', 'Historias de usuario a mi cargo que quedan cerradas en el periodo.', 30, 'Porcentaje', 'Aumentar', '65 %', '95 %'),
    ],
  },
  {
    id: 'tecnologia',
    nombre: 'Objetivos de tecnología',
    descripcion: 'Disponibilidad, incidentes y deuda técnica del equipo de TI.',
    periodo: 'Trimestre',
    categoria: 'producto',
    icono: ComputerIcon,
    empresa: [
      m('Subir la disponibilidad de las plataformas', 'Tiempo en que los sistemas críticos están disponibles para los usuarios.', 40, 'Porcentaje', 'Aumentar', '97 %', '99 %'),
      m('Reducir los incidentes críticos', 'Incidentes de severidad alta reportados en producción durante el periodo.', 30, 'Numérico', 'Reducir', '14', '5'),
      m('Bajar la deuda técnica', 'Tickets de deuda técnica pendientes sobre el total del backlog.', 30, 'Porcentaje', 'Reducir', '25 %', '12 %'),
    ],
    grupo: [
      m('Subir la disponibilidad de los sistemas del área', 'Disponibilidad de los servicios que administra este equipo.', 40, 'Porcentaje', 'Aumentar', '96 %', '99 %'),
      m('Bajar los incidentes del área', 'Incidentes de severidad alta reportados en los sistemas del equipo.', 30, 'Numérico', 'Reducir', '6', '2'),
      m('Bajar la deuda técnica del área', 'Tickets de deuda técnica pendientes en el backlog del equipo.', 30, 'Porcentaje', 'Reducir', '28 %', '14 %'),
    ],
    individual: [
      m('Cumplir mi SLA de disponibilidad', 'Disponibilidad de los servicios que administro yo.', 40, 'Porcentaje', 'Aumentar', '95 %', '99 %'),
      m('Resolver mis incidentes críticos a tiempo', 'Incidentes a mi cargo cerrados dentro del acuerdo de servicio.', 30, 'Porcentaje', 'Aumentar', '70 %', '95 %'),
      m('Cerrar mis tickets de deuda técnica', 'Tickets de deuda técnica a mi cargo que quedan resueltos.', 30, 'Numérico', 'Reducir', '20', '5'),
    ],
  },
  {
    id: 'innovacion',
    nombre: 'Objetivos de innovación',
    descripcion: 'Nuevas iniciativas probadas, ingresos de productos nuevos y cultura de experimentación.',
    periodo: 'Año',
    categoria: 'producto',
    icono: Idea01Icon,
    empresa: [
      m('Probar iniciativas nuevas', 'Experimentos o pilotos completados con un resultado medible en el periodo.', 35, 'Numérico', 'Aumentar', '4', '10'),
      m('Generar ingresos de productos nuevos', 'Facturación de productos o servicios lanzados en los últimos doce meses.', 35, 'Dinero', 'Aumentar', '$0', '$300.000.000'),
      h('Lanzar el laboratorio de innovación', 'Hito: se cumple cuando el espacio de experimentación queda operando.', 30),
    ],
    grupo: [
      m('Probar iniciativas del área', 'Experimentos o pilotos del equipo completados con resultado medible.', 35, 'Numérico', 'Aumentar', '1', '3'),
      m('Vender el producto nuevo del área', 'Facturación del equipo en los productos lanzados en los últimos doce meses.', 35, 'Dinero', 'Aumentar', '$0', '$60.000.000'),
      m('Aportar al laboratorio de innovación', 'Avance del área en los compromisos del laboratorio.', 30, 'Porcentaje', 'Aumentar', '50 %', '100 %'),
    ],
    individual: [
      h('Proponer y probar mi iniciativa', 'Hito: se cumple cuando mi iniciativa queda probada con resultado.', 35),
      m('Vender mi producto nuevo asignado', 'Facturación que consigo yo en el producto nuevo asignado.', 35, 'Dinero', 'Aumentar', '$0', '$15.000.000'),
      m('Cumplir mis compromisos del laboratorio', 'Compromisos del laboratorio a mi cargo cerrados en el periodo.', 30, 'Porcentaje', 'Aumentar', '55 %', '100 %'),
    ],
  },
]

/** Los tres niveles de una plantilla, en el orden en que se leen. */
export const NIVELES = [
  { clave: 'empresa', titulo: 'Objetivos de empresa', descripcion: 'Resultados de toda la compañía. No se asignan a nadie en particular.' },
  { clave: 'grupo', titulo: 'Objetivos para un grupo', descripcion: 'Objetivos propios de equipo, alineados a los de empresa, para el área que elijas.' },
  { clave: 'individual', titulo: 'Objetivos individuales', descripcion: 'Objetivos propios de persona, alineados a los de empresa, para quien elijas.' },
] as const satisfies readonly { clave: 'empresa' | 'grupo' | 'individual'; titulo: string; descripcion: string }[]

export const totalObjetivos = (plantilla: PlantillaCiclo) => plantilla.empresa.length + plantilla.grupo.length + plantilla.individual.length

export const categoriaDe = (plantilla: PlantillaCiclo): Categoria => CATEGORIAS.find((categoria) => categoria.id === plantilla.categoria) ?? CATEGORIAS[0]

/** Otras para comparar: primero las de su misma categoría y, si faltan, la recomendada para empezar (comerciales). */
export function sugerirPlantillas(plantilla: PlantillaCiclo, cuantas: number): readonly PlantillaCiclo[] {
  const misma = PLANTILLAS_CICLO.filter((otra) => otra.categoria === plantilla.categoria && otra.id !== plantilla.id)
  const resto = PLANTILLAS_CICLO.filter((otra) => otra.categoria !== plantilla.categoria)
  return [...misma, ...resto].slice(0, cuantas)
}
