import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Frame, FrameHeader, FramePanel, FrameTitle, Progress, Separator, Text } from '@ubits/flux-ui'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { enLista, plural } from '@/modules/design-system/patrones/formato'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import {
  faltanPreguntas,
  nombreSinTitulo,
  minutosDeRuta,
  seccionesVisibles,
  sumaPesos,
  textoPlano,
  todasLasPaginas,
  validarRecursos,
  type Borrador,
  type ItemPeso,
} from './borrador'
import { VISIBILIDAD } from './ajustes'
import { nombreCategoria, nombreIdioma, nombreNivel, nombreTipo, textoDuracion, textoMinutos } from './ficha'

// Panel de apoyo del asistente: «Vista previa». Arriba, la tarjeta del catálogo —la misma pieza que verá el
// colaborador— con lo que se lleva escrito: así se entiende para qué sirve cada dato del formulario. Debajo manda lo que
// falta, como en «Crear vacante»: la barra de avance con la lista de datos obligatorios pendientes y, después, las filas
// que se van sumando por paso (Recursos desde el 2; Certificado, Visibilidad y Navegación desde el 3).

type Fila = { termino: string; valor: string }

/** «1 sección · 3 páginas», o solo las páginas si no hay secciones. */
export function textoRecursos(b: Borrador) {
  const paginas = todasLasPaginas(b).length
  const secciones = seccionesVisibles(b).length
  const p = `${paginas.toLocaleString('es-CO')} ${plural(paginas, 'página', 'páginas')}`
  return b.seccionesHabilitadas ? `${secciones.toLocaleString('es-CO')} ${plural(secciones, 'sección', 'secciones')} · ${p}` : p
}

/** Lo que el resumen cuenta como obligatorio en el paso en que se está, y lo que de eso todavía falta. */
export function pendientesDelResumen(b: Borrador, paso: number, items: ItemPeso[], pesos: Record<string, number>) {
  const { portada, evento, ruta } = b
  const falta: string[] = []
  const cosa = ruta ? 'de la ruta' : evento ? 'del evento' : 'del contenido'
  if (!portada.titulo.trim()) falta.push(`Título ${cosa}`)
  if (!portada.imagen) falta.push('Portada')
  if (!textoPlano(portada.descripcion)) falta.push('Descripción')
  if (!evento && !ruta && !portada.tipo) falta.push('Tipo de contenido')
  if (!portada.nivel) falta.push('Nivel')
  if (!portada.idioma) falta.push('Idioma')
  // Una ruta no escribe su tiempo: lo suma de sus contenidos, así que tampoco es un dato que pueda faltar.
  if (!ruta && (!textoDuracion(portada) || !portada.unidad)) falta.push('Tiempo aproximado')
  let total = ruta ? 5 : evento ? 6 : 7

  if (paso >= 2) {
    total += 1
    if (ruta) {
      // RN-02: una ruta sin contenidos no se puede guardar.
      if (!b.contenidos.length) falta.push('Al menos un contenido')
      if (paso >= 4 && b.visibilidad === 'privado') {
        total += 1
        if (!b.colaboradores.length) falta.push('Colaboradores que la verán')
      }
      return { falta, total }
    }
    const paginas = todasLasPaginas(b)
    const problema = validarRecursos(b)
    const sinPreguntas = paginas.filter(faltanPreguntas)
    if (!paginas.length) falta.push('Al menos una página')
    else if (problema?.paginas.length) falta.push('Páginas con título y recurso')
    else if (problema?.secciones.length) falta.push('Secciones con al menos una página')
    else if (sinPreguntas.length) falta.push(`Preguntas en ${enLista(sinPreguntas.map((p) => `«${nombreSinTitulo(p)}»`))}`)
  }
  if (paso >= 4) {
    const visibles = items.filter((i) => !i.oculta)
    if (visibles.length >= 2) {
      total += 1
      const suma = sumaPesos(items, pesos)
      if (suma !== 100) falta.push(`Pesos que sumen 100% (llevas ${suma.toLocaleString('es-CO')}%)`)
    }
    if (b.visibilidad === 'privado') {
      total += 1
      if (!b.colaboradores.length) falta.push('Colaboradores que lo verán')
    }
  }
  return { falta, total }
}

/** Lo del paso 1 que la tarjeta no muestra. El tipo, el nivel, el idioma, el tiempo y la categoría ya van en ella. */
function filasFicha(portada: Borrador['portada']): Fila[] {
  const filas: Fila[] = []
  if (portada.trailer) filas.push({ termino: 'Tráiler', valor: 'Con tráiler' })
  return filas
}

type Props = {
  borrador: Borrador
  paso: number
  items: ItemPeso[]
  pesos: Record<string, number>
}

export function ResumenContenido({ borrador, paso, items, pesos }: Props) {
  const { portada, evento, ruta } = borrador
  const minutosRuta = minutosDeRuta(borrador)
  const nombre = portada.titulo.trim()
  const { falta, total } = pendientesDelResumen(borrador, paso, items, pesos)
  const listos = Math.max(0, total - falta.length)
  const elegidas = filasFicha(portada)
  const paginas = todasLasPaginas(borrador).length

  const extras: Fila[] = [
    ...(paso >= 2
      ? ruta
        ? [
            {
              termino: 'Contenidos',
              valor: borrador.contenidos.length
                ? `${borrador.contenidos.length.toLocaleString('es-CO')} ${plural(borrador.contenidos.length, 'contenido', 'contenidos')}`
                : 'Sin contenidos todavía',
            },
          ]
        : [{ termino: 'Recursos', valor: paginas ? textoRecursos(borrador) : 'Sin páginas todavía' }]
      : []),
    ...(paso >= 3 ? [{ termino: 'Certificado', valor: borrador.certificado.habilitado ? 'Con certificado' : 'Sin certificado' }] : []),
    ...(paso >= 4
      ? [
          // La visibilidad va en la etiqueta de la tarjeta, no en una fila: es la misma marca que lleva en el
          // catálogo y en el listado. Aquí solo queda a quiénes llega, que la etiqueta no puede decir.
          ...(borrador.visibilidad === 'privado'
            ? [
                {
                  termino: 'Colaboradores',
                  valor: `${borrador.colaboradores.length.toLocaleString('es-CO')} ${plural(borrador.colaboradores.length, 'colaborador', 'colaboradores')}`,
                },
              ]
            : []),
          { termino: 'Navegación', valor: borrador.navegacion === 'lineal' ? 'Lineal' : 'Libre' },
        ]
      : []),
  ]

  return (
    // Estructura de los paneles de Vacantes: marco gris con el título arriba y cada bloque en su tarjeta blanca.
    <Frame>
      <FrameHeader>
        <FrameTitle>Vista previa</FrameTitle>
      </FrameHeader>

          {/* La tarjeta del catálogo, con lo que se lleva escrito. Sin título todavía, el título va apagado para que no
              parezca un contenido que ya se llama así. */}
          <TarjetaContenido
            className={nombre ? undefined : '[&_h3]:text-muted-foreground'}
            titulo={nombre || 'Sin título todavía'}
            imagen={portada.imagen || undefined}
            sinImagen={<ImagenGlass nombre="glass-gallery" tamano={64} className="opacity-45 grayscale" />}
            tipo={ruta ? 'Ruta de aprendizaje' : evento ? 'Evento' : nombreTipo(portada.tipo) || undefined}
            competencia={portada.categoria ? nombreCategoria(portada.categoria) : undefined}
            nivel={nombreNivel(portada.nivel) || undefined}
            duracion={(ruta ? textoMinutos(minutosRuta) : textoDuracion(portada)) || undefined}
            idioma={nombreIdioma(portada.idioma) || undefined}
            visibilidad={paso >= 4 ? VISIBILIDAD[borrador.visibilidad].etiqueta : undefined}
            visibilidadColor={VISIBILIDAD[borrador.visibilidad].badge}
          />

      <FramePanel className="flex flex-col gap-4">
        {/* En el orden de los pasos: primero lo que queda de la ficha (paso 1); después Recursos, Certificado y Ajustes. */}
        {elegidas.length ? <FilasResumen filas={elegidas} /> : null}

        {extras.length ? <FilasResumen filas={extras} /> : null}

        {/* Lo que falta cierra el panel, siempre: primero cómo va quedando y después qué le queda al creador. */}
        {elegidas.length || extras.length ? <Separator /> : null}

        {falta.length ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-warning" aria-hidden="true" />
                <Text as="span" size="sm" weight="medium">
                  {plural(falta.length, 'Falta un dato', `Faltan ${falta.length} datos`)}
                </Text>
              </div>
              <Text as="span" variant="muted" size="xs" className="tabular-nums">
                {listos} de {total}
              </Text>
            </div>
            <Progress value={(listos / total) * 100} aria-label={`${listos} de ${total} datos obligatorios`} />
            <Text as="ul" variant="muted" size="sm" className="ml-6 list-disc">
              {falta.map((campo) => (
                <li key={campo}>{campo}</li>
              ))}
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-success" aria-hidden="true" />
            <Text as="span" size="sm">
              Todo lo obligatorio está listo.
            </Text>
          </div>
        )}
      </FramePanel>
    </Frame>
  )
}

function FilasResumen({ filas }: { filas: Fila[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {filas.map((fila) => (
        <div key={fila.termino} className="flex items-baseline justify-between gap-3">
          <Text as="span" variant="muted" size="sm" className="shrink-0">
            {fila.termino}
          </Text>
          <Text as="span" size="sm" className="min-w-0 text-right">
            {fila.valor}
          </Text>
        </div>
      ))}
    </div>
  )
}
