import { QUIEN_MUEVE } from './movimientos'
import { comoSimulado } from './simular'
import type { Miembro, VacanteUI } from './datos'

// Qué puede hacer en una vacante la persona que mira (en la maqueta siempre es Laura Martínez), según el equipo que se
// arma en «Compartir» (VA-11). Antes «Solo ver» y «Puede editar» no cambiaban nada en pantalla.
// - Dueña del proceso: todo, también publicar, cerrar, eliminar y cambiar quién tiene acceso.
// - Puede editar: mueve, rechaza, comenta, importa y edita la vacante; no la publica, no la cierra, no la elimina ni
//   cambia el equipo.
// - Solo ver: mira el tablero, las fichas y la vacante; no cambia nada.
// La persona de la maqueta (Laura Martínez) es la administradora de Selección: en las vacantes donde no está en el
// equipo puede todo igual, como admin. Los permisos del equipo aplican a quien se invita desde «Compartir»; para ver la
// vacante como lo vería esa persona, `?como=puede-editar` o `?como=solo-ver` (QA y demos).

export type Nivel = 'duena' | 'puede-editar' | 'solo-ver'

export type PermisoVacante = {
  nivel: Nivel
  // Mover, rechazar, volver a considerar, comentar, importar y agregar gente.
  trabaja: boolean
  // Cambiar la vacante: editar sus secciones y sus etapas.
  edita: boolean
  // Publicar, sacar del portal, cerrar, reabrir, eliminar y cambiar el equipo.
  administra: boolean
  // La dueña del proceso, para decir a quién pedirle más acceso.
  duena?: Miembro
  // Por qué tiene este permiso, en una frase.
  porque: string
}

const NOMBRE: Record<Nivel, string> = { duena: 'Dueña del proceso', 'puede-editar': 'Puede editar', 'solo-ver': 'Solo ver' }
export const nombreDelNivel = (nivel: Nivel) => NOMBRE[nivel]

const DEL_PERMISO: Record<Miembro['permiso'], Nivel> = { 'Dueña del proceso': 'duena', 'Puede editar': 'puede-editar', 'Solo ver': 'solo-ver' }

export function permisoEn(vacante: VacanteUI, quien = QUIEN_MUEVE): PermisoVacante {
  const duena = vacante.equipo.find((miembro) => miembro.permiso === 'Dueña del proceso')
  const miembro = vacante.equipo.find((uno) => uno.nombre === quien)
  const forzado = comoSimulado()
  const nivel: Nivel = forzado ?? (miembro ? DEL_PERMISO[miembro.permiso] : 'duena')
  const porque = forzado
    ? `Estás viendo la vacante como la vería alguien con «${NOMBRE[forzado]}».`
    : !miembro
      ? 'Eres administradora de Selección: puedes hacer todo en cualquier vacante.'
      : nivel === 'duena'
        ? 'Eres la dueña del proceso.'
        : `${duena ? duena.nombre : 'La dueña del proceso'} te dio acceso «${NOMBRE[nivel]}».`
  return { nivel, trabaja: nivel !== 'solo-ver', edita: nivel !== 'solo-ver', administra: nivel === 'duena', duena, porque }
}
