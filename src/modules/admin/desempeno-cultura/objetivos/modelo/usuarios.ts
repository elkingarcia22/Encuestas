// Las personas activas que no tienen objetivos en ningún ciclo en curso: a quién falta asignarle algo.

export interface UsuarioSinObjetivos {
  id: string
  nombre: string
  correo: string
  cargo: string
  area: string
  lider: string | null
}

const persona = (nombre: string, cargo: string, area: string, lider: string | null): UsuarioSinObjetivos => {
  const [primero, apellido] = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')
  const usuario = `${primero}.${apellido}`
  return { id: usuario, nombre, correo: `${usuario}@sedicosa.com.mx`, cargo, area, lider }
}

export const USUARIOS_SIN_OBJETIVOS: readonly UsuarioSinObjetivos[] = [
  persona('Jesús Bautista Popoca', 'Auxiliar de bodega', 'Almacén', null),
  persona('Miguel Hernández Meza', 'Técnico de servicio', 'Servicio', null),
  persona('Daniela Ríos Calderón', 'Ejecutiva de cuenta', 'Comercial', 'Andrea Molina'),
  persona('Óscar Treviño Lara', 'Supervisor de planta', 'Operaciones', 'Luis Carrillo'),
  persona('Mariana Quintero Paz', 'Analista de contenidos', 'Marketing', 'Sofía Arango'),
  persona('Ricardo Salinas Ortiz', 'Montacarguista', 'Almacén', null),
  persona('Paola Fuentes Aguilar', 'Analista de bienestar', 'Gente y cultura', 'Carolina Vélez'),
  persona('Héctor Ibarra Ruiz', 'Desarrollador backend', 'Tecnología', 'Juan Pablo Restrepo'),
  persona('Valeria Montes Ochoa', 'Asesora comercial', 'Comercial', 'Andrea Molina'),
  persona('Andrés Cárdenas Villa', 'Agente de soporte', 'Servicio', 'Natalia Gómez'),
  persona('Lucía Navarro Peña', 'Analista contable', 'Finanzas', null),
  persona('Tomás Herrera Lugo', 'Operario de línea', 'Operaciones', 'Luis Carrillo'),
]
