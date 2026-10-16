import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  ButtonGroup,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  Separator,
  Switch,
  cn,
} from '@ubits/flux-ui'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { Columna, DOS_COLUMNAS, Rotulo } from './columna'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { buscarPagina, seccionesVisibles, todasLasPaginas, type Borrador, type ErrorRecursos, type Pagina, type Seccion } from './borrador'
import { Indice } from './indice'
import { anadirSeccion } from './operaciones'
import type { AccionesRecurso } from './recursos'
import { VistaPagina } from './vista-pagina'

// Paso 2 · Recursos, en dos columnas como el estudio de la exploración 2: a la izquierda el **índice** —el interruptor de
// secciones y el árbol de secciones y páginas, que se renombra, se arrastra y se ordena—; a la derecha la **vista
// previa** de la página elegida, que antes vivía en una hoja lateral. Elegir una página en el índice la muestra al lado,
// sin tapar la estructura: se ve de dónde sale lo que se está editando.
//
// Nunca nacen páginas en blanco: la página aparece al confirmar su recurso, desde «Añadir página».

type Props = {
  borrador: Borrador
  /** La página elegida en el índice: la que se ve en la columna de la derecha. */
  paginaAbierta: string | null
  problema: ErrorRecursos
  /** Evaluaciones sin preguntas: impiden continuar. */
  sinPreguntas: Pagina[]
  onAbrir: (id: string) => void
  onAnadirPagina: (seccionId?: string) => void
  onAlternarSecciones: (encender: boolean) => void
  onEditarSeccion: (seccion: Seccion) => void
  onEliminarSeccion: (seccion: Seccion) => void
  onEliminarPagina: (pagina: Pagina) => void
  acciones: (pagina: Pagina) => AccionesRecurso
}

export function PasoRecursos({
  borrador,
  paginaAbierta,
  problema,
  sinPreguntas,
  onAbrir,
  onAnadirPagina,
  onAlternarSecciones,
  onEditarSeccion,
  onEliminarSeccion,
  onEliminarPagina,
  acciones,
}: Props) {
  const paginas = todasLasPaginas(borrador)
  const secciones = seccionesVisibles(borrador)
  const encontrada = buscarPagina(borrador, paginaAbierta)
  const pagina = encontrada?.pagina
  const indice = pagina ? paginas.findIndex((p) => p.id === pagina.id) : -1
  // Primero las secciones (si están habilitadas) y después las páginas: de lo general a lo particular.
  const conteo = `${borrador.seccionesHabilitadas ? `${secciones.length.toLocaleString('es-CO')} ${secciones.length === 1 ? 'sección' : 'secciones'} · ` : ''}${paginas.length.toLocaleString('es-CO')} ${paginas.length === 1 ? 'página' : 'páginas'}`
  // Dónde está parada la vista previa. **Cada sección tiene sus propias páginas**, así que el número es el de la
  // página dentro de su sección y reinicia al cambiar: la última de la sección 1 es «Página 3 de 3» y la siguiente,
  // «Sección 2 · Página 1 de 3». Que el número vuelva a 1 no confunde porque el nombre de la sección cambia en el
  // mismo momento. Sin secciones habilitadas no se nombra ninguna y la cuenta es la del contenido entero (Dave, 6-oct).
  const numeroSeccion = encontrada ? secciones.findIndex((x) => x.id === encontrada.seccion.id) + 1 : 0
  const conSecciones = borrador.seccionesHabilitadas && numeroSeccion > 0
  const deLaSeccion = encontrada?.seccion.paginas ?? []
  const posicion = conSecciones ? deLaSeccion.findIndex((x) => x.id === pagina?.id) + 1 : indice + 1
  const total = conSecciones ? deLaSeccion.length : paginas.length
  const ubicacion = `${conSecciones ? `Sección ${numeroSeccion} · ` : ''}Página ${posicion} de ${total}`

  // Sin aviso amarillo arriba del índice: lo que impide continuar lo marcan en rojo sus filas (o su sección) y, en la
  // página abierta, su propia alerta en la vista previa. Dave lo quitó: con eso basta (14-oct).

  return (
    // **El alto lo manda la vista previa**, no la pantalla. Con alto fijo, entrar sin páginas dejaba dos cajones
    // enormes casi vacíos y, con un recurso dentro, lo que no cabía se escondía tras un scroll propio: la experiencia
    // se sentía cortada por los dos lados. Ahora la vista previa mide lo que mida su contenido —el estado vacío es
    // bajito, una página con su recurso y sus complementarios es alta— y el índice **copia ese alto**: en la
    // cuadrícula las dos celdas miden lo mismo, y el índice no aporta altura propia (`h-0 min-h-full`), así que nunca
    // es él quien estira la fila; si su lista es más larga, se desplaza por dentro. Quien hace scroll es la página
    // (Dave, 8-oct).
    <div className={cn('grid items-stretch gap-4', DOS_COLUMNAS)}>
      <Columna titulo="Índice" accion={<Rotulo>{conteo}</Rotulo>} className="lg:h-0 lg:min-h-full">
        {/* El interruptor manda sobre todo el árbol, por eso va arriba y fuera del scroll: sigue a la vista al bajar por
            un índice largo. La frase de qué hace vive en su botón de ayuda para no robarle sitio a la lista. */}
        <div className="flex shrink-0 items-center gap-2 px-4 py-3">
          <Field orientation="horizontal" className="items-center!">
            <Switch id="cc-secciones" size="sm" checked={borrador.seccionesHabilitadas} onCheckedChange={onAlternarSecciones} />
            <FieldLabel htmlFor="cc-secciones" className="font-normal">
              Habilitar el uso de secciones
            </FieldLabel>
          </Field>
          <BotonAyuda etiqueta="Qué hace habilitar las secciones" side="bottom">
            Agrupa las páginas en bloques con su propio título y descripción.
          </BotonAyuda>
        </div>
        <Separator />

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {paginas.length || borrador.seccionesHabilitadas ? (
            <Indice
              borrador={borrador}
              paginaAbierta={paginaAbierta}
              errores={{
                paginas: new Set([...(problema?.paginas ?? []), ...sinPreguntas.map((p) => p.id)]),
                secciones: new Set(problema?.secciones),
              }}
              onActivar={onAbrir}
              onAnadirPagina={onAnadirPagina}
              onAnadirSeccion={anadirSeccion}
              onEditarSeccion={onEditarSeccion}
              onEliminarSeccion={onEliminarSeccion}
              onEliminarPagina={onEliminarPagina}
            />
          ) : (
            // Todavía no hay nada que indexar: aquí solo va la puerta de entrada, y lo que hay que saber se cuenta al
            // lado, en la vista previa, que es la mitad de la pantalla que está vacía.
            <Button variant="outline" className="w-full" onClick={() => onAnadirPagina()}>
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Añadir página
            </Button>
          )}
        </div>
      </Columna>

      {/* Con tope: una página con muchos recursos puede medir metros, y entonces el scroll de la página se vuelve
          interminable y el índice —que copia el alto— se va de la vista. A partir de 1000 px la vista previa se
          queda ahí y lo que sobra se desplaza por dentro (Dave, 8-oct). */}
      <Columna
        titulo="Vista previa"
        className="lg:max-h-[1000px]"
        accion={
          pagina && paginas.length > 1 && indice >= 0 ? (
            <div className="flex items-center gap-2.5">
              {/* «Sección X · Página Y de Z», no un «X de Y» suelto: al lado de las flechas, sin las palabras, no se
                  sabe si cuenta páginas, secciones o recursos (Dave, 6-oct). */}
              <Rotulo>{ubicacion}</Rotulo>
              <ButtonGroup>
                <Button variant="outline" size="icon-xs" aria-label="Página anterior" disabled={indice <= 0} onClick={() => onAbrir(paginas[indice - 1].id)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="Página siguiente"
                  disabled={indice >= paginas.length - 1}
                  onClick={() => onAbrir(paginas[indice + 1].id)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              </ButtonGroup>
            </div>
          ) : null
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {pagina ? (
            <VistaPagina pagina={pagina} acciones={acciones} />
          ) : (
            // Sin páginas no hay nada que previsualizar. Con páginas siempre hay una abierta —el asistente se para en la
            // primera—, así que este vacío solo aparece cuando de verdad no hay ninguna.
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia>
                  <ImagenGlass nombre="glass-paper-plus" tamano={80} />
                </EmptyMedia>
                <EmptyTitle>Aún no hay páginas</EmptyTitle>
                <EmptyDescription>
                  Cada página tiene un recurso principal: un video, un PDF, una evaluación, una presentación… Añade la primera desde el índice y aquí la editas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        {/* **Sin pie con «Eliminar página».** Esa acción vive en el menú de la propia página, en el índice, que es
            donde se gestiona la lista; aquí ocupaba una franja fija de 50 px de los pocos que hay para ver el
            recurso (Dave, 8-oct). */}
      </Columna>
    </div>
  )
}
