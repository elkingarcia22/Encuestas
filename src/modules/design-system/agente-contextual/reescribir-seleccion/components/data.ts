// Aviso interno de ejemplo y las versiones que propone el agente para cada párrafo.

export type RewriteKind = 'mejorar' | 'acortar' | 'formal' | 'cercano' | 'directo'

export const TONES: { kind: Extract<RewriteKind, 'formal' | 'cercano' | 'directo'>; label: string }[] = [
  { kind: 'formal', label: 'Formal' },
  { kind: 'cercano', label: 'Cercano' },
  { kind: 'directo', label: 'Directo' },
]

export const REQUESTS: Record<RewriteKind, string> = {
  mejorar: 'Mejora este párrafo para que se entienda a la primera.',
  acortar: 'Acórtalo a la mitad sin perder lo importante.',
  formal: 'Pásalo a un tono formal.',
  cercano: 'Pásalo a un tono cercano.',
  directo: 'Pásalo a un tono directo.',
}

export const PARAGRAPHS = [
  'Queremos contarles que durante el mes de diciembre vamos a tener algunos cambios en el horario de las oficinas de Bogotá y Medellín, esto debido a la temporada de fin de año y a que muchas personas del equipo toman sus vacaciones colectivas en esas fechas.',
  'Del 15 al 23 de diciembre las oficinas van a abrir de 8:00 a. m. a 3:00 p. m. y los dias 24 y 31 no va a haber atención presencial, por lo que les pedimos que organicen con su líder las tareas que requieran estar en sede antes de esas fechas.',
  'Las personas que trabajan en turnos de planta mantienen su horario normal, excepto el 24 y el 31, cuando el turno de la tarde termina a las 2:00 p. m. Los supervisores ya tienen el detalle de cada línea y lo van a compartir en la reunión de inicio de turno.',
  'Si tienes dudas sobre tu caso particular puedes escribirle a tu líder o al equipo de Gestión Humana por el canal de ayuda del portal del colaborador, donde también vas a encontrar el calendario completo de diciembre.',
]

// Tres versiones de «Mejorar», dos de «Acortar» y una por tono; «Otra versión» recorre las del mismo tipo
// (en tono, recorre los tres tonos).
export const VERSIONS: Record<'mejorar' | 'acortar' | 'tono', string[]>[] = [
  {
    mejorar: [
      'En diciembre cambia el horario de las oficinas de Bogotá y Medellín. Lo ajustamos porque buena parte del equipo toma vacaciones colectivas a fin de año.',
      'Por la temporada de fin de año y las vacaciones colectivas, en diciembre las oficinas de Bogotá y Medellín tendrán un horario distinto. Aquí te contamos cómo queda.',
      'Las oficinas de Bogotá y Medellín tendrán horario especial en diciembre, porque muchas personas del equipo salen a vacaciones colectivas en esas fechas.',
    ],
    acortar: [
      'En diciembre cambia el horario de las oficinas de Bogotá y Medellín por las vacaciones colectivas.',
      'Por fin de año, las oficinas de Bogotá y Medellín tendrán horario especial en diciembre.',
    ],
    tono: [
      'Les informamos que, con ocasión de la temporada de fin de año y de las vacaciones colectivas, el horario de las sedes de Bogotá y Medellín se modificará durante diciembre.',
      '¡Se viene fin de año! En diciembre las oficinas de Bogotá y Medellín cambian de horario, porque muchos nos vamos de vacaciones colectivas.',
      'En diciembre las oficinas de Bogotá y Medellín cambian de horario por las vacaciones colectivas.',
    ],
  },
  {
    mejorar: [
      'Del 15 al 23 de diciembre las oficinas abren de 8:00 a. m. a 3:00 p. m. El 24 y el 31 no hay atención presencial: acuerda con tu líder, antes de esas fechas, las tareas que necesites hacer en sede.',
      'Horario del 15 al 23 de diciembre: de 8:00 a. m. a 3:00 p. m. Los días 24 y 31 las sedes estarán cerradas, así que planea con tu líder lo que requiera ir a la oficina.',
      'Entre el 15 y el 23 de diciembre las oficinas atienden de 8:00 a. m. a 3:00 p. m.; el 24 y el 31 permanecen cerradas. Organiza con tu líder, con tiempo, lo que debas hacer en sede.',
    ],
    acortar: [
      'Del 15 al 23 de diciembre, horario de 8:00 a. m. a 3:00 p. m. El 24 y el 31, sedes cerradas.',
      'Del 15 al 23 de diciembre abrimos de 8:00 a. m. a 3:00 p. m.; el 24 y el 31 no hay atención presencial.',
    ],
    tono: [
      'Entre el 15 y el 23 de diciembre el horario de atención será de 8:00 a. m. a 3:00 p. m. Los días 24 y 31 no habrá atención presencial, por lo cual solicitamos coordinar previamente con su líder las actividades que requieran presencia en sede.',
      'Del 15 al 23 de diciembre abrimos de 8:00 a. m. a 3:00 p. m., y el 24 y el 31 descansamos de la oficina. Si tienes algo pendiente en sede, cuádralo antes con tu líder.',
      'Del 15 al 23 de diciembre: de 8:00 a. m. a 3:00 p. m. El 24 y el 31: sin atención presencial. Coordina antes con tu líder lo que debas hacer en sede.',
    ],
  },
  {
    mejorar: [
      'Si trabajas en turnos de planta, tu horario no cambia, salvo el 24 y el 31: ese día el turno de la tarde termina a las 2:00 p. m. Tu supervisor compartirá el detalle de tu línea en la reunión de inicio de turno.',
      'Los turnos de planta siguen igual, con una excepción: el 24 y el 31 el turno de la tarde sale a las 2:00 p. m. El detalle por línea lo comparte cada supervisor al iniciar el turno.',
      'En planta, el horario de turnos se mantiene. Solo el 24 y el 31 el turno de la tarde termina a las 2:00 p. m.; tu supervisor te dará el detalle de tu línea al inicio del turno.',
    ],
    acortar: [
      'Los turnos de planta no cambian, salvo el 24 y el 31: el turno de la tarde termina a las 2:00 p. m.',
      'En planta todo sigue igual; el 24 y el 31 el turno de la tarde sale a las 2:00 p. m.',
    ],
    tono: [
      'El personal de planta conservará su horario habitual, con excepción de los días 24 y 31, en los cuales el turno de la tarde finalizará a las 2:00 p. m. Los supervisores comunicarán el detalle por línea en la reunión de inicio de turno.',
      'Si estás en planta, tu turno sigue igual. Eso sí: el 24 y el 31 el turno de la tarde sale temprano, a las 2:00 p. m. Tu supervisor te cuenta los detalles al arrancar el turno.',
      'Planta: horario normal. 24 y 31: el turno de la tarde termina a las 2:00 p. m. Tu supervisor da el detalle al inicio del turno.',
    ],
  },
  {
    mejorar: [
      '¿Tienes dudas sobre tu caso? Escríbele a tu líder o a Gestión Humana por el canal de ayuda del portal del colaborador. Allí también está el calendario completo de diciembre.',
      'Para cualquier duda sobre tu caso, habla con tu líder o con Gestión Humana en el canal de ayuda del portal. El calendario completo de diciembre también está ahí.',
      'Si tu caso es distinto, consulta a tu líder o a Gestión Humana desde el canal de ayuda del portal del colaborador, donde además encuentras el calendario de diciembre.',
    ],
    acortar: [
      'Dudas: tu líder o Gestión Humana, por el canal de ayuda del portal. Allí está el calendario de diciembre.',
      'Resuelve tus dudas en el canal de ayuda del portal, donde también está el calendario de diciembre.',
    ],
    tono: [
      'Para inquietudes sobre casos particulares, puede comunicarse con su líder o con el equipo de Gestión Humana a través del canal de ayuda del portal del colaborador, donde también se encuentra publicado el calendario de diciembre.',
      '¿Tu caso es especial? Cuéntale a tu líder o escríbenos por el canal de ayuda del portal. Ahí también dejamos el calendario completo de diciembre.',
      'Dudas sobre tu caso: escribe a tu líder o a Gestión Humana por el canal de ayuda del portal. Calendario de diciembre: en el mismo portal.',
    ],
  },
]
