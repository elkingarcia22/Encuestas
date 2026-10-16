import { useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Album02Icon,
  ArrowDataTransferVerticalIcon,
  Certificate01Icon,
  Edit02Icon,
  Exchange01Icon,
  Globe02Icon,
  Route01Icon,
  Search01Icon,
  ScaleIcon,
  Task01Icon,
  TextFontIcon,
  UserGroupIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { InputGroup, InputGroupAddon, InputGroupInput, Text, Timeline, TimelineContent, TimelineDate, TimelineHeader, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { fecha, type Resultados } from './datos'

// El historial de cambios de un contenido publicado: quién tocó qué, cuándo.
//
// Un contenido publicado lo edita gente distinta a lo largo de meses, y cuando a alguien se le descuadra el progreso
// —o desaparece un certificado— la primera pregunta es siempre «¿quién cambió esto?». Sin un registro, la respuesta
// vive en la memoria de quien estuviera ese día (Dave, 13-oct).
//
// Lo que se registra es lo que **afecta a quien ya está estudiando**: la estructura, los recursos, las condiciones de
// las evaluaciones y la ficha. Un borrador no tiene historial, porque mientras se crea nada de eso afecta a nadie.

export type TipoCambio =
  | 'nombre'
  | 'ficha'
  | 'portada'
  | 'pagina-nombre'
  | 'pagina-oculta'
  | 'pagina-visible'
  | 'pagina-orden'
  | 'pagina-nueva'
  | 'seccion'
  | 'recurso'
  | 'evaluacion-peso'
  | 'evaluacion-condiciones'
  | 'certificado'
  | 'visibilidad'
  | 'navegacion'
  | 'impacto'
  | 'publicacion'

export const ICONO_CAMBIO: Record<TipoCambio, IconSvgElement> = {
  nombre: TextFontIcon,
  ficha: Edit02Icon,
  portada: Album02Icon,
  'pagina-nombre': TextFontIcon,
  'pagina-oculta': ViewOffSlashIcon,
  'pagina-visible': ViewOffSlashIcon,
  'pagina-orden': ArrowDataTransferVerticalIcon,
  'pagina-nueva': Album02Icon,
  seccion: Route01Icon,
  recurso: Exchange01Icon,
  'evaluacion-peso': ScaleIcon,
  'evaluacion-condiciones': Task01Icon,
  certificado: Certificate01Icon,
  visibilidad: Globe02Icon,
  navegacion: Route01Icon,
  impacto: UserGroupIcon,
  publicacion: Globe02Icon,
}

export type Cambio = {
  id: string
  tipo: TipoCambio
  quien: string
  /** ISO con hora: el historial se ordena por este campo, del más reciente al más antiguo. */
  cuando: string
  /**
   * Qué hizo, **sin el nombre**: la fila lo antepone en negrita. «cambió el peso de «Evaluación 1» a 50%».
   *
   * Es una sola frase y no una frase más una explicación: lo que importa de un historial es el hecho, y una bajada
   * debajo de cada línea lo vuelve ilegible cuando hay treinta (Dave, 13-oct).
   */
  accion: string
}

// Quiénes editan contenidos. Son pocas personas y siempre las mismas: el equipo que mantiene el catálogo.
const EDITORES = ['Mariana Restrepo Ossa', 'Felipe Andrés Cárdenas', 'Lucía Fernanda Pardo', 'Tomás Esteban Rivera']

/** Un momento `dias` días atrás, a una hora de oficina fija: el historial no necesita azar, necesita orden. */
function momento(dias: number, hora: number, minuto: number): string {
  const dia = new Date()
  dia.setDate(dia.getDate() - dias)
  dia.setHours(hora, minuto, 0, 0)
  return dia.toISOString()
}

/**
 * El historial de un contenido.
 *
 * Es el mismo guion para todos los contenidos publicados —los cambios que de verdad se hacen sobre un contenido vivo—,
 * con los nombres repartidos a partir del id para que dos contenidos no cuenten exactamente lo mismo.
 */
export function historialDe(resultados: Resultados): Cambio[] {
  if (resultados.contenido.visibilidad === 'Borrador') return []

  const semilla = [...resultados.contenido.id].reduce((suma, letra) => suma + letra.charCodeAt(0), 0)
  const quien = (paso: number) => EDITORES[(semilla + paso) % EDITORES.length]
  const evaluacion = resultados.datos.evaluaciones[0]?.nombre ?? 'Evaluación'

  const guion: { tipo: TipoCambio; accion: string; dias: number; hora: number; minuto: number }[] = [
    // Dos el mismo día a propósito, y dos más abajo: así se ve cómo se agrupan los días movidos (Dave, 14-oct).
    { tipo: 'pagina-oculta', accion: 'ocultó la página «Evaluación de cierre».', dias: 1, hora: 16, minuto: 42 },
    { tipo: 'ficha', accion: 'cambió el idioma del contenido a Español.', dias: 1, hora: 9, minuto: 14 },
    { tipo: 'recurso', accion: 'reemplazó el video de «Comunicación para desescalar un conflicto».', dias: 2, hora: 16, minuto: 38 },
    { tipo: 'evaluacion-peso', accion: `cambió el peso de «${evaluacion}» de 40% a 50%.`, dias: 4, hora: 11, minuto: 5 },
    { tipo: 'pagina-orden', accion: 'movió «Guía mapa de conflicto» antes de «Evaluación Sección 2».', dias: 7, hora: 15, minuto: 52 },
    { tipo: 'pagina-nombre', accion: 'renombró la página «Guía» a «Guía mapa de conflicto».', dias: 7, hora: 11, minuto: 8 },
    { tipo: 'impacto', accion: 'cambió el impacto en el progreso a «Proteger a quienes ya finalizaron».', dias: 9, hora: 10, minuto: 27 },
    { tipo: 'pagina-nombre', accion: 'renombró la página «Simulador» a «Simulador de conversación difícil».', dias: 12, hora: 14, minuto: 3 },
    { tipo: 'evaluacion-condiciones', accion: `cambió los intentos de «${evaluacion}» de 2 a 3.`, dias: 15, hora: 9, minuto: 41 },
    { tipo: 'navegacion', accion: 'cambió la navegación de libre a lineal.', dias: 18, hora: 17, minuto: 20 },
    { tipo: 'certificado', accion: 'activó el certificado del contenido.', dias: 21, hora: 11, minuto: 58 },
    { tipo: 'ficha', accion: 'cambió la duración estimada de 45 a 30 minutos.', dias: 24, hora: 13, minuto: 9 },
    { tipo: 'seccion', accion: 'renombró la sección «Herramientas» a «Sección 2: Herramientas para resolver conflictos».', dias: 28, hora: 10, minuto: 45 },
    { tipo: 'pagina-nueva', accion: 'añadió la página «Guía mapa de conflicto».', dias: 30, hora: 12, minuto: 15 },
    { tipo: 'portada', accion: 'cambió la portada del contenido.', dias: 31, hora: 9, minuto: 50 },
    { tipo: 'nombre', accion: `cambió el nombre del contenido a «${resultados.contenido.titulo}».`, dias: 33, hora: 16, minuto: 12 },
    { tipo: 'visibilidad', accion: `cambió la visibilidad a ${resultados.contenido.visibilidad}.`, dias: 38, hora: 9, minuto: 30 },
    { tipo: 'publicacion', accion: 'publicó el contenido.', dias: 45, hora: 15, minuto: 0 },
  ]

  return guion.map((paso, indice) => ({
    id: `cambio-${indice}`,
    tipo: paso.tipo,
    accion: paso.accion,
    quien: quien(indice),
    cuando: momento(paso.dias, paso.hora, paso.minuto),
  }))
}

const cuandoLargo = (iso: string) => {
  const momento = new Date(iso)
  return `${fecha(iso.slice(0, 10))} · ${momento.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * El historial, como una línea de tiempo.
 *
 * Es la pieza `Timeline` de la librería: un hilo vertical con el icono de cada cambio enganchado, el nombre de quien
 * lo hizo, lo que hizo y cuándo. Se eligió entre diez formas distintas (lab del 14-oct) porque es la que deja claro de
 * un vistazo que **una cosa pasó después de otra**, que es lo único que un historial tiene que contar.
 *
 * Lleva buscador porque el historial de un contenido vivo pasa de treinta líneas en nada, y entonces la pregunta deja
 * de ser «¿qué ha pasado?» para ser «¿quién tocó las evaluaciones?».
 */
export function HistorialCambios({ resultados }: { resultados: Resultados }) {
  const cambios = useMemo(() => historialDe(resultados), [resultados])
  const [busqueda, setBusqueda] = useState('')

  const texto = busqueda.trim().toLowerCase()
  const visibles = texto ? cambios.filter((cambio) => `${cambio.quien} ${cambio.accion}`.toLowerCase().includes(texto)) : cambios

  if (cambios.length === 0) {
    return <PrimeraVez icono="glass-clock" titulo="Todavía no hay cambios" descripcion="Cuando alguien edite este contenido, aquí quedará qué cambió, quién lo hizo y cuándo." />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* El buscador se queda arriba al desplazarse: en un historial largo, al bajar se pierde de vista justo cuando
          hace falta (Dave, 14-oct). Los márgenes negativos compensan el relleno del panel para que, al pegarse, su
          fondo tape el contenido de lado a lado y no quede una franja por donde se asome el texto. */}
      <div className="bg-background sticky -top-4 z-20 -mx-5 -mt-4 flex flex-col gap-2 px-5 pt-4 pb-3">
        <InputGroup className="bg-background">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput aria-label="Buscar en el historial" placeholder="Buscar por persona o cambio" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
        </InputGroup>
        <Text as="span" size="xs" variant="muted">
          {texto
            ? visibles.length === 0
              ? 'Nada coincide con lo que buscas'
              : `${visibles.length} ${visibles.length === 1 ? 'cambio' : 'cambios'}`
            : `${cambios.length} cambios desde que se publicó`}
        </Text>
      </div>

      <Timeline defaultValue={visibles.length}>
        {visibles.map((cambio, indice) => (
          <TimelineItem key={cambio.id} step={indice + 1} className="group-data-[orientation=vertical]/timeline:ms-10">
            <TimelineHeader>
              {/* El hilo que une un cambio con el siguiente: es lo que dice que una cosa pasó después de otra. */}
              <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem)] group-data-[orientation=vertical]/timeline:translate-y-7" />
              <TimelineDate>{cuandoLargo(cambio.cuando)}</TimelineDate>
              <TimelineTitle className="text-sm">{cambio.quien}</TimelineTitle>
              <TimelineIndicator className="bg-muted group-data-[orientation=vertical]/timeline:-left-7 flex size-6 items-center justify-center border-none">
                <HugeiconsIcon icon={ICONO_CAMBIO[cambio.tipo]} size={13} className="text-muted-foreground" aria-hidden="true" />
              </TimelineIndicator>
            </TimelineHeader>
            <TimelineContent className="text-foreground text-sm">{cambio.accion}</TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  )
}
