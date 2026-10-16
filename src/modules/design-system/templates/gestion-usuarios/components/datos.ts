import { generador, isoHaceDias } from '../../../patrones/formato'
import { GESTION_USUARIOS } from '../../admin-compartido/rutas'

// Template «Gestión de usuarios»: calca /admin-hr/users de la plataforma de hoy (recorrido del
// 2026-09-13) con su lista, «Crear usuario», las acciones masivas por archivo y los recordatorios
// de inicio de sesión. No hay historia de usuario todavía (_pendiente.md): columnas, campos y
// textos salen de la pantalla real. Los roles usan el vocabulario del nuevo UBITS
// (Administrador / Colaborador, no RRHH / Colaborador).

export const BASE = GESTION_USUARIOS
export const ruta = (pantalla = '') => (pantalla ? `${BASE}/${pantalla}` : BASE)

export type EstadoUsuario = 'Activo' | 'Suspendido'
export type Rol = 'Administrador' | 'Colaborador'
// El resultado del alta: la plataforma lo muestra como «Estado del proceso».
export type EstadoProceso = 'Finalizado' | 'En proceso' | 'Con error'

export const NIVELES = ['Estratégico', 'Operativo', 'Táctico con personal a cargo', 'Táctico sin personal a cargo'] as const
export type Nivel = (typeof NIVELES)[number]
export const ROLES: Rol[] = ['Administrador', 'Colaborador']

export type Usuario = {
  id: string
  nombres: string
  apellidos: string
  username: string
  correo: string
  dni: string
  cargo: string
  pais: string
  ciudad: string
  nivel: Nivel
  area: string
  rol: Rol
  lider: string
  columnaA: string
  columnaB: string
  estado: EstadoUsuario
  proceso: EstadoProceso
  creado: string
  // null: nunca ha iniciado sesión. Son quienes reciben el recordatorio.
  ultimoIngreso: string | null
}

export const nombreCompleto = (u: Pick<Usuario, 'nombres' | 'apellidos'>) => `${u.nombres} ${u.apellidos}`

export const PAISES: Record<string, string[]> = {
  Colombia: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'],
  México: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Querétaro'],
  Perú: ['Lima', 'Arequipa', 'Trujillo'],
  Chile: ['Santiago', 'Valparaíso', 'Concepción'],
  Argentina: ['Buenos Aires', 'Córdoba', 'Rosario'],
}

export const AREAS = ['Ventas', 'Operaciones', 'Tecnología', 'Personas', 'Finanzas', 'Marketing', 'Servicio al cliente', 'Legal']

const CARGOS: Record<string, string[]> = {
  Ventas: ['Ejecutivo comercial', 'Key account manager', 'Gerente comercial'],
  Operaciones: ['Analista de operaciones', 'Coordinadora de operaciones', 'Jefe de planta'],
  Tecnología: ['Ingeniero de software', 'Analista de datos', 'Líder técnico'],
  Personas: ['Analista de personas', 'Business partner', 'Coordinadora de formación'],
  Finanzas: ['Analista financiero', 'Contador', 'Tesorera'],
  Marketing: ['Growth marketer', 'Diseñadora visual', 'Community manager'],
  'Servicio al cliente': ['Agente de servicio', 'Supervisora de servicio', 'Analista de calidad'],
  Legal: ['Abogada corporativa', 'Analista de cumplimiento'],
}

const NOMBRES = ['Ana', 'Carlos', 'Lucía', 'Diego', 'Marta', 'Javier', 'Paula', 'Andrés', 'Sofía', 'Tomás', 'Valeria', 'Camila', 'Rodrigo', 'Elena', 'Sebastián', 'Natalia', 'Felipe', 'Daniela', 'Mateo', 'Isabel', 'Nicolás', 'Carolina', 'Emilio', 'Julia', 'Álvaro', 'Renata', 'Óscar', 'Adriana', 'Martín', 'Gabriela', 'María Alejandra', 'Juan Pablo', 'Laura', 'Santiago', 'Mariana']
const APELLIDOS = ['Restrepo', 'Medina', 'Ortega', 'Ferrer', 'Salas', 'Núñez', 'Iglesias', 'Cabrera', 'Duarte', 'Herrera', 'Ponce', 'Bravo', 'Vera', 'Márquez', 'Rojas', 'Vargas', 'Cárdenas', 'Soto', 'Aguirre', 'Fuentes', 'Peña', 'Ríos', 'Castro', 'Moreno', 'Guzmán', 'Lozano', 'Delgado', 'Campos', 'Escobar', 'Nieto', 'Sánchez', 'Pardo', 'Gómez', 'Torres']

const sinTildes = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')

// Quien arma el template: la administradora del Home operativo.
const CAROLINA: Usuario = {
  id: 'u-0',
  nombres: 'Carolina',
  apellidos: 'Vargas',
  username: 'carolina.vargas',
  correo: 'carolina.vargas@google.com',
  dni: '1020304050',
  cargo: 'Directora de personas',
  pais: 'Colombia',
  ciudad: 'Bogotá',
  nivel: 'Estratégico',
  area: 'Personas',
  rol: 'Administrador',
  lider: '',
  columnaA: 'Sede Norte',
  columnaB: '',
  estado: 'Activo',
  proceso: 'Finalizado',
  creado: '2024-02-01',
  ultimoIngreso: '2026-09-11',
}

// 940 usuarios: las licencias en uso de Google en el Home operativo (940/1.000).
function crearUsuarios(total: number): Usuario[] {
  const azar = generador(13092026)
  const elegir = <T,>(lista: readonly T[]) => lista[Math.floor(azar() * lista.length)]
  const usados = new Set<string>([CAROLINA.username])
  const lideres: string[] = [nombreCompleto(CAROLINA)]

  const filas = Array.from({ length: total - 1 }, (_, i): Usuario => {
    const nombres = elegir(NOMBRES)
    const apellidos = `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`
    let username = `${sinTildes(nombres.split(' ')[0])}.${sinTildes(apellidos.split(' ')[0])}`
    for (let n = 2; usados.has(username); n++) username = `${username.replace(/\d+$/, '')}${n}`
    usados.add(username)
    const area = elegir(AREAS)
    const pais = azar() < 0.6 ? 'Colombia' : elegir(Object.keys(PAISES))
    // Más antigüedad hacia atrás y más altas recientes (la cohorte de agosto y septiembre).
    const dias = Math.floor(azar() ** 1.6 * 900)
    const nivel: Nivel = azar() < 0.06 ? 'Estratégico' : azar() < 0.2 ? 'Táctico con personal a cargo' : azar() < 0.45 ? 'Táctico sin personal a cargo' : 'Operativo'
    const suspendido = azar() < 0.05
    // 413 de 940 nunca han iniciado sesión en la plataforma de hoy: aquí la proporción es parecida.
    const nunca = !suspendido && azar() < 0.44
    const proceso: EstadoProceso = dias < 3 && azar() < 0.3 ? 'En proceso' : azar() < 0.012 ? 'Con error' : 'Finalizado'
    const usuario: Usuario = {
      id: `u-${i + 1}`,
      nombres,
      apellidos,
      username,
      correo: `${username}@google.com`,
      dni: azar() < 0.7 ? String(1_000_000_000 + Math.floor(azar() * 90_000_000)) : '',
      cargo: elegir(CARGOS[area]),
      pais,
      ciudad: elegir(PAISES[pais]),
      nivel,
      area,
      rol: azar() < 0.04 ? 'Administrador' : 'Colaborador',
      lider: elegir(lideres),
      columnaA: elegir(['Sede Norte', 'Sede Centro', 'Remoto', '']),
      columnaB: '',
      estado: suspendido ? 'Suspendido' : 'Activo',
      proceso,
      creado: isoHaceDias(dias),
      ultimoIngreso: nunca ? null : isoHaceDias(Math.floor(azar() * Math.min(dias + 1, 60))),
    }
    if (nivel !== 'Operativo' && lideres.length < 60) lideres.push(nombreCompleto(usuario))
    return usuario
  })

  // La lista abre con las altas más recientes, como en la plataforma.
  return [CAROLINA, ...filas].sort((a, b) => b.creado.localeCompare(a.creado))
}

export const USUARIOS_INICIALES = crearUsuarios(940)

export const LICENCIAS_TOTALES = 1000
// Los recordatorios de inicio de sesión se pueden enviar una vez cada 24 horas.
export const HORAS_ENTRE_RECORDATORIOS = 24

export const PANTALLAS: Record<string, string> = {
  crear: 'Crear usuario',
  editar: 'Editar usuario',
  'carga-masiva': 'Acción masiva',
}

// ── Acciones masivas por archivo ──
// Mismo recorrido para las cuatro: plantilla → cargar → revisar → confirmar. Cambian las
// columnas de la plantilla (suspender y activar solo piden username y correo).

export type AccionMasiva = 'crear' | 'editar' | 'suspender' | 'activar'

export const MASIVAS: Record<AccionMasiva, { titulo: string; menu: string; descripcion: string; boton: (n: number) => string; enCurso: (n: number) => string; hecho: (n: number) => string; columnas: string[]; archivo: string }> = {
  crear: {
    titulo: 'Crear varios usuarios',
    menu: 'Crear varios usuarios',
    descripcion:
      'Llena los campos requeridos para crear nuevos usuarios en el sistema, recuerda completar todos los campos para una mejor experiencia. Los campos de área y líder son necesarios para crear tu organigrama.',
    boton: (n) => `Crear ${n} usuarios`,
    enCurso: (n) => `Creando ${n} usuarios`,
    hecho: (n) => `Se crearon ${n} usuarios`,
    columnas: ['Username', 'Nombres', 'Apellidos', 'Correo', 'Área', 'Rol'],
    archivo: 'usuarios-cohorte-septiembre.csv',
  },
  editar: {
    titulo: 'Editar varios usuarios',
    menu: 'Editar varios usuarios',
    descripcion:
      'Edita la información de tus usuarios de forma masiva importando un archivo CSV. Al asignar un área y un líder para cada usuario se creará automáticamente tu organigrama.',
    boton: (n) => `Editar ${n} usuarios`,
    enCurso: (n) => `Editando ${n} usuarios`,
    hecho: (n) => `Se editaron ${n} usuarios`,
    columnas: ['Username', 'Nombres', 'Apellidos', 'Correo', 'Área', 'Rol'],
    archivo: 'edicion-areas-lideres.csv',
  },
  suspender: {
    titulo: 'Suspensión masiva de usuarios',
    menu: 'Suspender varios usuarios',
    descripcion: 'Suspende el acceso de varias personas a la vez importando un archivo CSV con su username y su correo. Todos los campos son obligatorios.',
    boton: (n) => `Suspender ${n} usuarios`,
    enCurso: (n) => `Suspendiendo ${n} usuarios`,
    hecho: (n) => `Se suspendieron ${n} usuarios`,
    columnas: ['Username', 'Correo'],
    archivo: 'retiros-agosto.csv',
  },
  activar: {
    titulo: 'Activación masiva de usuarios',
    menu: 'Activar varios usuarios',
    descripcion: 'Devuelve el acceso a varias personas a la vez importando un archivo CSV con su username y su correo. Todos los campos son obligatorios.',
    boton: (n) => `Activar ${n} usuarios`,
    enCurso: (n) => `Activando ${n} usuarios`,
    hecho: (n) => `Se activaron ${n} usuarios`,
    columnas: ['Username', 'Correo'],
    archivo: 'reintegros-septiembre.csv',
  },
}

export const esAccionMasiva = (valor: string | undefined): valor is AccionMasiva => !!valor && valor in MASIVAS

export function migasDe(pathname: string) {
  const resto = pathname.replace(BASE, '').replace(/^\//, '')
  const inicio = { etiqueta: 'Inicio', ruta: '/design-system/templates/home-operativo' }
  const configuracion = { etiqueta: 'Configuración' }
  if (!resto) return [inicio, configuracion, { etiqueta: 'Gestión de usuarios' }]
  const [pantalla, detalle] = resto.split('/')
  const titulo = pantalla === 'carga-masiva' && esAccionMasiva(detalle) ? MASIVAS[detalle].titulo : (PANTALLAS[pantalla] ?? 'Pantalla no encontrada')
  return [inicio, configuracion, { etiqueta: 'Gestión de usuarios', ruta: BASE }, { etiqueta: titulo }]
}

// Lo que hace una acción masiva sobre la lista cuando termina. Las filas ya vienen revisadas.
export function aplicarMasivo(accion: AccionMasiva, filas: Record<string, string>[], usuarios: Usuario[]): Usuario[] {
  if (accion === 'crear') {
    const nuevos: Usuario[] = filas.map((f, i) => ({
      id: `u-masivo-${Date.now()}-${i}`,
      nombres: f.Nombres,
      apellidos: f.Apellidos,
      username: f.Username,
      correo: f.Correo,
      dni: '',
      cargo: 'Por definir',
      pais: 'Colombia',
      ciudad: 'Bogotá',
      nivel: 'Operativo',
      area: f['Área'],
      rol: f.Rol as Rol,
      lider: '',
      columnaA: '',
      columnaB: '',
      estado: 'Activo',
      // Recién creados: su alta sigue «En proceso» hasta que entran por primera vez.
      proceso: 'En proceso',
      creado: '2026-09-11',
      ultimoIngreso: null,
    }))
    return [...nuevos, ...usuarios]
  }
  const porUsername = new Map(filas.map((f) => [f.Username, f]))
  return usuarios.map((u) => {
    const fila = porUsername.get(u.username)
    if (!fila) return u
    if (accion === 'suspender') return { ...u, estado: 'Suspendido' }
    if (accion === 'activar') return { ...u, estado: 'Activo' }
    return { ...u, nombres: fila.Nombres, apellidos: fila.Apellidos, area: fila['Área'], rol: fila.Rol as Rol }
  })
}
