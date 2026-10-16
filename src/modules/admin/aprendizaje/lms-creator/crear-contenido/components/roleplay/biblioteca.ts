import type { RoleplayConfig } from '../borrador'
import { nuevoObjetivo, roleplayVacio } from './modelo'

// **Tus roleplays**: lo que se puede retomar o reusar al agregar un evaluador roleplay, igual que «Tus videos» en
// Video con IA y «Tus presentaciones» en la presentación interactiva. Hasta la v2 el roleplay era el único recurso de
// IA que obligaba a empezar de cero cada vez (Dave, 6-oct).
//
// Dos cosas distintas viven en la misma lista:
// - **Borrador**: se guardó a medias y se retoma donde quedó. Son los propios, de esta sesión.
// - **Listo**: un roleplay ya armado que se reusa tal cual en otra página; se copia, así que ajustarlo aquí no toca
//   el de la otra página.
//
// Como todo en el playground, no hay backend: los propios viven en la sesión del navegador y los de ejemplo son fijos.

export type EstadoRoleplayGuardado = 'borrador' | 'listo'

export type RoleplayGuardado = {
  id: string
  titulo: string
  estado: EstadoRoleplayGuardado
  /** Cuándo se tocó por última vez, ya formateado: «1 ene 2026». */
  actualizado: string
  /** Una línea de contexto para la tarjeta: con quién se habla. */
  personaje: string
  cfg: RoleplayConfig
  /** Lo creó quien está usando el playground, no viene de ejemplo. */
  propio?: boolean
}

const CLAVE = 'ubits-roleplays-v2'

/** «1 ene 2026», como todas las fechas del playground. */
export function fechaCorta(fecha = new Date()) {
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
}

function construir(parcial: Partial<RoleplayConfig>): RoleplayConfig {
  return { ...roleplayVacio(), ...parcial }
}

/** Los de ejemplo: tres listos para reusar y uno a medias, para que se vea cómo se retoma un borrador. */
export const ROLEPLAYS_EJEMPLO: RoleplayGuardado[] = [
  {
    id: 'rp-ej-feedback',
    titulo: 'Feedback difícil a un colaborador',
    estado: 'listo',
    actualizado: '28 sep 2026',
    personaje: 'Andrea Guzmán · Directora de tu área',
    cfg: construir({
      titulo: 'Feedback difícil a un colaborador',
      escenario:
        'Tu colaborador entrega tarde desde hace un mes y el equipo ya lo nota. Tienes la reunión de seguimiento y necesitas señalar el problema con hechos, escuchar su versión y cerrar con un acuerdo concreto.',
      nombrePersonaje: 'Andrea Guzmán',
      identidadPersonaje: 'Directora de tu área',
      personalidad: 'Directa y exigente. Valora los datos y se molesta con los rodeos; si se le acusa sin hechos, se cierra.',
      mensajeBienvenida: 'Hola, gracias por sacar el tiempo. Cuéntame qué está pasando con las entregas.',
      papelColaborador: 'Eres quien lidera el equipo y debe dar la retroalimentación sin romper la relación.',
      objetivos: [
        nuevoObjetivo('Señalar el problema con hechos, no con juicios'),
        nuevoObjetivo('Escuchar la versión de la otra persona antes de concluir'),
        nuevoObjetivo('Cerrar con un acuerdo y una fecha'),
      ],
      objetivosParaAprobar: 3,
    }),
  },
  {
    id: 'rp-ej-cliente',
    titulo: 'Cliente molesto por un incumplimiento',
    estado: 'listo',
    actualizado: '22 sep 2026',
    personaje: 'Marcelo Ruiz · Cliente desde hace tres años',
    cfg: construir({
      titulo: 'Cliente molesto por un incumplimiento',
      escenario:
        'El pedido llegó ocho días tarde y el cliente escribió molesto. Te toca la llamada: reconocer el problema sin excusas, explicar qué se va a hacer y comprometer una fecha realista.',
      nombrePersonaje: 'Marcelo Ruiz',
      identidadPersonaje: 'Cliente desde hace tres años',
      personalidad: 'Impaciente y escéptico. Interrumpe, pide fechas concretas y se calma solo cuando escucha un compromiso claro.',
      mensajeBienvenida: 'Es la tercera vez que llamo por lo mismo. ¿Qué van a hacer?',
      papelColaborador: 'Eres quien atiende la cuenta y responde por el incumplimiento.',
      objetivos: [
        nuevoObjetivo('Reconocer el incumplimiento sin poner excusas'),
        nuevoObjetivo('Explicar qué se va a hacer, paso a paso'),
        nuevoObjetivo('Comprometer una fecha que se pueda cumplir'),
      ],
      objetivosParaAprobar: 2,
    }),
  },
  {
    id: 'rp-ej-direccion',
    titulo: 'Presentar avances a dirección',
    estado: 'listo',
    actualizado: '15 sep 2026',
    personaje: 'Lucía Fernández · Directora general',
    cfg: construir({
      titulo: 'Presentar avances a dirección',
      escenario:
        'Tienes diez minutos en el comité para contar cómo va el proyecto. La dirección pregunta de forma puntual y no tiene tiempo para rodeos.',
      nombrePersonaje: 'Lucía Fernández',
      identidadPersonaje: 'Directora general',
      personalidad: 'Rápida y concreta. Corta las respuestas largas y repregunta cuando algo queda en el aire.',
      mensajeBienvenida: 'Tenemos diez minutos. ¿Cómo vamos?',
      papelColaborador: 'Eres quien lidera el proyecto y responde por sus avances y riesgos.',
      objetivos: [
        nuevoObjetivo('Responder de forma directa, sin divagar'),
        nuevoObjetivo('Nombrar los riesgos sin esconderlos'),
        nuevoObjetivo('Proponer una decisión concreta'),
      ],
      modo: 'practica',
    }),
  },
  {
    id: 'rp-ej-negociacion',
    titulo: 'Negociar un cambio de plazo',
    estado: 'borrador',
    actualizado: '2 oct 2026',
    personaje: 'Personaje sin definir',
    cfg: construir({
      titulo: 'Negociar un cambio de plazo',
      escenario: 'La contraparte presiona por mantener la fecha original y hay que proponer alternativas sin romper el acuerdo.',
    }),
  },
]

type Almacen = Record<string, RoleplayGuardado>

function leerAlmacen(): Almacen {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as Almacen) : {}
  } catch {
    return {}
  }
}

function escribirAlmacen(almacen: Almacen) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(almacen))
  } catch {
    // Sin almacenamiento (ventana privada): los propios no sobreviven a la recarga y ya está.
  }
}

/** Los propios primero —son los que se acaban de tocar— y detrás los de ejemplo. */
export function listarRoleplays(): RoleplayGuardado[] {
  const propios = Object.values(leerAlmacen()).sort((a, b) => b.id.localeCompare(a.id))
  return [...propios, ...ROLEPLAYS_EJEMPLO]
}

export function buscarRoleplay(id: string): RoleplayGuardado | null {
  return leerAlmacen()[id] ?? ROLEPLAYS_EJEMPLO.find((r) => r.id === id) ?? null
}

/** Guarda o actualiza uno propio y devuelve su id; `id` reutiliza el del borrador que se estaba editando. */
export function guardarRoleplay(cfg: RoleplayConfig, estado: EstadoRoleplayGuardado, id?: string): string {
  const almacen = leerAlmacen()
  const suyo = id && almacen[id] ? id : `rp-${Date.now().toString(36)}`
  const personaje = [cfg.nombrePersonaje.trim(), cfg.identidadPersonaje.trim()].filter(Boolean).join(' · ')
  almacen[suyo] = {
    id: suyo,
    titulo: cfg.titulo.trim() || 'Roleplay sin título',
    estado,
    actualizado: fechaCorta(),
    personaje: personaje || 'Personaje sin definir',
    cfg,
    propio: true,
  }
  escribirAlmacen(almacen)
  return suyo
}
