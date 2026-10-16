// Política de ejemplo y los problemas que encuentra el agente al revisarla.

export type Block = { id: string; title: string; text: string }

export type Severity = 'importante' | 'sugerencia'

export type Issue = {
  id: string
  n: number
  block: string
  severity: Severity
  title: string
  reason: string
  // Fragmento del bloque que cambia y cómo queda.
  before: string
  after: string
}

export const BLOCKS: Block[] = [
  {
    id: 'proposito',
    title: 'Propósito',
    text: 'Esta política define cómo se organiza el trabajo remoto en Meta Colombia para que cada equipo mantenga su productividad y las personas tengan claridad sobre sus derechos y responsabilidades.',
  },
  {
    id: 'alcance',
    title: 'Alcance',
    text: 'Aplica a los empleados con contrato a término indefinido que lleven al menos tres meses en la compañía, a partir del 1 de enero de 2026.',
  },
  {
    id: 'vigencia',
    title: 'Vigencia',
    text: 'La política entra en vigor el 15 de enero de 2026 y se revisa cada año con el Comité de Gestión Humana.',
  },
  {
    id: 'modalidades',
    title: 'Modalidades',
    text: 'Existen tres modalidades: presencial, híbrida (hasta tres días remotos por semana) y remota. La modalidad de cada cargo la define el líder del área junto con Gestión Humana.',
  },
  {
    id: 'horario',
    title: 'Horario y disponibilidad',
    text: 'Las personas en modalidad remota o híbrida deben estar disponibles en el horario núcleo de 9:00 a. m. a 4:00 p. m., responder los mensajes del equipo en un tiempo razonable, asistir con cámara encendida a las reuniones que así lo requieran, registrar sus pausas activas en la plataforma y avisar a su líder con anticipación cuando necesiten ausentarse durante ese horario por cualquier motivo personal o médico.',
  },
  {
    id: 'auxilio',
    title: 'Auxilio de conectividad',
    text: 'Quienes trabajen de forma remota o híbrida reciben un auxilio mensual de conectividad que se paga con la nómina.',
  },
  {
    id: 'equipos',
    title: 'Equipos y seguridad',
    text: 'La compañía entrega portátil y diadema. Está prohibido conectarse a redes públicas sin la VPN corporativa y compartir el equipo con otras personas.',
  },
  {
    id: 'excepciones',
    title: 'Excepciones',
    text: 'Las solicitudes que no se ajusten a esta política se evalúan caso por caso.',
  },
]

export const ISSUES: Issue[] = [
  {
    id: 'fecha',
    n: 1,
    block: 'vigencia',
    severity: 'importante',
    title: 'Fechas de inicio que no coinciden',
    reason: 'El alcance dice 1 de enero y la vigencia dice 15 de enero.',
    before: 'el 15 de enero de 2026',
    after: 'el 1 de enero de 2026',
  },
  {
    id: 'monto',
    n: 2,
    block: 'auxilio',
    severity: 'importante',
    title: 'Auxilio sin monto',
    reason: 'Promete un auxilio mensual pero no dice cuánto es.',
    before: 'un auxilio mensual de conectividad',
    after: 'un auxilio mensual de conectividad de $120.000',
  },
  {
    id: 'aprobacion',
    n: 3,
    block: 'excepciones',
    severity: 'importante',
    title: 'Nadie aprueba las excepciones',
    reason: 'No dice quién decide ni en cuánto tiempo responde.',
    before: 'se evalúan caso por caso.',
    after: 'se evalúan caso por caso y las aprueba la Dirección de Gestión Humana en máximo 5 días hábiles.',
  },
  {
    id: 'inclusivo',
    n: 4,
    block: 'alcance',
    severity: 'sugerencia',
    title: 'Lenguaje inclusivo',
    reason: '«Los empleados» se puede cambiar por «las personas colaboradoras».',
    before: 'Aplica a los empleados',
    after: 'Aplica a las personas colaboradoras',
  },
  {
    id: 'lectura',
    n: 5,
    block: 'horario',
    severity: 'sugerencia',
    title: 'Frase demasiado larga',
    reason: 'Son 66 palabras en una sola frase; cuesta leerla.',
    before:
      'Las personas en modalidad remota o híbrida deben estar disponibles en el horario núcleo de 9:00 a. m. a 4:00 p. m., responder los mensajes del equipo en un tiempo razonable, asistir con cámara encendida a las reuniones que así lo requieran, registrar sus pausas activas en la plataforma y avisar a su líder con anticipación cuando necesiten ausentarse durante ese horario por cualquier motivo personal o médico.',
    after:
      'El horario núcleo es de 9:00 a. m. a 4:00 p. m. En ese horario, responde al equipo en un tiempo razonable, enciende la cámara cuando la reunión lo pida y registra tus pausas activas. Si necesitas ausentarte, avisa antes a tu líder.',
  },
]
