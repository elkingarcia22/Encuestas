// Lo que necesita atención en la Super Home (13 oct, Carlos): los mismos seis asuntos de «Necesita tu atención»
// (templates/home-operativo/components/data.ts, ATENCION), ahora con su urgencia, cuándo vence y por qué importa, para
// que se entienda qué pasa si no se atiende. La acción lleva a la pantalla donde se resuelve.
//
// Urgencia: «alta» es lo que ya venció o vence en menos de 48 horas; «media», lo que puede esperar unos días.

export type Prioridad = 'alta' | 'media'

export type AsuntoAtencion = {
  id: string
  prioridad: Prioridad
  modulo: string
  cuando: string
  titulo: string
  impacto: string
  accion: string
  destino: string
}

// Insignias con relleno, no con contorno (13 oct): «destructive-light» ya se lee gracias a src/index.css.
export const PRIORIDADES: { valor: Prioridad; titulo: string; insignia: 'destructive-light' | 'warning-light' }[] = [
  { valor: 'alta', titulo: 'Alta', insignia: 'destructive-light' },
  { valor: 'media', titulo: 'Media', insignia: 'warning-light' },
]

export const ASUNTOS_ATENCION: AsuntoAtencion[] = [
  {
    id: 'evaluaciones',
    prioridad: 'alta',
    modulo: 'Desempeño',
    cuando: 'vencieron el 5 de septiembre',
    titulo: '14 evaluaciones 360 vencidas',
    impacto: 'Mientras sigan abiertas, el ciclo no puede cerrar ni mostrar resultados.',
    accion: 'Revisar evaluaciones',
    destino: 'evaluaciones-360',
  },
  {
    id: 'encuestas',
    prioridad: 'alta',
    modulo: 'Encuestas',
    cuando: 'cierran en 48 horas',
    titulo: '3 encuestas con baja respuesta',
    impacto: 'Van por debajo del 50 % de respuesta: sus resultados no serán representativos.',
    accion: 'Ver encuestas',
    destino: 'encuestas',
  },
  {
    id: 'vacantes',
    prioridad: 'media',
    modulo: 'Selección',
    cuando: 'en tu bandeja',
    titulo: '5 vacantes por aprobar',
    impacto: 'No se publican ni reciben candidatos hasta que las apruebes.',
    accion: 'Aprobar vacantes',
    destino: 'vacantes',
  },
  {
    id: 'certificados',
    prioridad: 'media',
    modulo: 'Certificados',
    cuando: 'vencen este mes',
    titulo: '8 certificados por vencer',
    impacto: 'Esas personas se quedarán sin una certificación vigente si no se renuevan.',
    accion: 'Ver certificados',
    destino: 'descarga-certificados',
  },
  {
    id: 'inactivos',
    prioridad: 'media',
    modulo: 'Plataforma',
    cuando: 'sin sesión este mes',
    titulo: '27 colaboradores inactivos',
    impacto: 'No avanzan en sus rutas ni responden encuestas: bajan la participación de la empresa.',
    accion: 'Ver colaboradores',
    destino: 'gestion-de-usuarios',
  },
  {
    id: 'planes',
    prioridad: 'media',
    modulo: 'Formación',
    cuando: 'más de 15 días así',
    titulo: '2 planes sin asignaciones',
    impacto: 'Están listos, pero nadie los está tomando.',
    accion: 'Asignar planes',
    destino: 'planes',
  },
]
