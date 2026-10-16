import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, LeftToRightListBulletIcon } from '@hugeicons/core-free-icons'
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger, Text, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PAGE_WIDTH } from '@/shared/components/page-width'
import ambienteAzul from '@/shared/assets/ambiente-azul.png'
import { buildPreviewOutline, buildPreviewPages, pageQuestionIds, previewSummary, toPreviewQuestion, type PreviewPage } from '../../modelo/previewModel'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import type { Respuesta } from './campo-respuesta'
import { Contenido, type AvancePorPagina } from './contenido'
import { PaginaBienvenida } from './pagina-bienvenida'
import { PaginaCierre } from './pagina-cierre'
import { PaginaPreguntas } from './pagina-preguntas'
import { PanelAvance, Ubicacion } from './panel-avance'

// La vista previa: un ensayo del recorrido, página a página, como lo vería quien responde. Lee el
// borrador en vivo (se cierra, se cambia una pregunta, se abre y el cambio está ahí) y las
// respuestas se tiran al cerrar: cada apertura empieza de cero, en la primera página.
//
// Es un modal de pantalla completa, pero el formulario no se estira: va en la columna de 720 px de
// los formularios y, a su derecha, el panel de avance con el progreso y el índice navegable. Los
// dos se centran juntos; en la bienvenida y el cierre no hay panel y el contenido queda solo en el centro.
// Detrás va el mismo brillo azul que corona el Inicio y el resto del Workspace, pegado a la barra de
// arriba; las páginas son marcos grises con paneles blancos, como las tarjetas del Inicio.
// Abajo, sin línea divisoria, los botones van al ancho del contenido —el formulario y el panel, o solo el
// formulario donde no hay panel—: Anterior a la izquierda y el botón principal a la derecha, que dice «Comenzar encuesta», «Siguiente»,
// «Enviar y finalizar» antes del cierre o «Cerrar vista previa» en la última.
// En pantallas sin espacio para el panel, el índice se abre desde «Contenido» en la barra de arriba.

const MAX_PAGINAS_CON_NUMERO = 14

const contestadas = (valor: Respuesta | undefined) => (Array.isArray(valor) ? (valor.length > 0 ? 1 : 0) : typeof valor === 'string' && valor.trim() !== '' ? 1 : 0)

// Las obligatorias de la página que siguen sin respuesta, en el orden en que aparecen (SEC-116).
const obligatoriasSinResponder = (pagina: PreviewPage | undefined, respuestas: Readonly<Record<string, Respuesta>>): string[] => {
  if (pagina?.kind !== 'section' && pagina?.kind !== 'demographics') return []
  const preguntas = pagina.kind === 'section' ? pagina.questions : pagina.fields.map(toPreviewQuestion)
  return preguntas.filter((pregunta) => pregunta.required && contestadas(respuestas[pregunta.id]) === 0).map((pregunta) => pregunta.id)
}

type Props = { borrador: SurveyDraft; open: boolean; onOpenChange: (open: boolean) => void }

// El formulario y el panel comparten fila en el cuerpo, centrados juntos.
const FILA = 'flex justify-center gap-6'
const FORMULARIO = cn('w-full min-w-0', PAGE_WIDTH.narrow)
const ANCHO_PANEL = 'w-68 shrink-0'
// El ancho de la fila de contenido cuando el panel cabe a la derecha: el formulario (45rem), el hueco (1.5rem) y el panel (17rem).
const ANCHO_CONTENIDO_CON_PANEL = 'xl:max-w-254'

export function VistaPrevia({ borrador, open, onOpenChange }: Props) {
  const paginas = useMemo(() => buildPreviewPages(borrador), [borrador])
  const indice = useMemo(() => buildPreviewOutline(borrador), [borrador])
  const resumen = useMemo(() => previewSummary(borrador, paginas), [borrador, paginas])

  const [activa, setActiva] = useState(0)
  const [respuestas, setRespuestas] = useState<Readonly<Record<string, Respuesta>>>({})
  const [seguimientos, setSeguimientos] = useState<Readonly<Record<string, string>>>({})
  const [conIndice, setConIndice] = useState(false)
  // Las obligatorias que quedaron sin responder al pulsar «Continuar»: se señalan como las verá el colaborador.
  const [senaladas, setSenaladas] = useState<ReadonlySet<string>>(() => new Set())

  // Cada apertura es un recorrido nuevo: se ve la encuesta como quien la encuentra por primera vez.
  const [abiertaAntes, setAbiertaAntes] = useState(open)
  if (open !== abiertaAntes) {
    setAbiertaAntes(open)
    if (open) {
      setActiva(0)
      setRespuestas({})
      setSeguimientos({})
      setConIndice(false)
      setSenaladas(new Set())
    }
  }

  // Editar el borrador puede quitar la página que se estaba viendo.
  const actual = Math.min(activa, Math.max(paginas.length - 1, 0))
  const pagina = paginas[actual]

  const arriba = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    // Al cambiar de página se vuelve arriba del todo, con el margen del panel incluido.
    arriba.current?.parentElement?.scrollTo({ top: 0 })
  }, [actual])

  const ir = (destino: number) => {
    setActiva(Math.min(Math.max(destino, 0), paginas.length - 1))
    setConIndice(false)
    setSenaladas(new Set())
  }
  const irA = (id: string) => {
    const destino = paginas.findIndex((item) => item.id === id)
    if (destino !== -1) ir(destino)
  }

  const avance = useMemo(() => {
    const porPagina: Record<string, { answered: number; total: number }> = {}
    for (const item of paginas) {
      const ids = pageQuestionIds(item)
      if (ids.length === 0) continue
      porPagina[item.id] = { total: ids.length, answered: ids.reduce((suma, id) => suma + contestadas(respuestas[id]), 0) }
    }
    return porPagina as AvancePorPagina
  }, [paginas, respuestas])

  const totales = Object.values(avance).reduce((acc, item) => ({ answered: acc.answered + item.answered, total: acc.total + item.total }), { answered: 0, total: 0 })
  const porcentaje = totales.total === 0 ? 0 : Math.round((totales.answered / totales.total) * 100)

  // «Volver a empezar» es otra prueba desde cero: sin las respuestas de la anterior.
  const reiniciar = () => {
    setRespuestas({})
    setSeguimientos({})
    ir(0)
  }
  const responder = (id: string, valor: Respuesta) => setRespuestas((previas) => ({ ...previas, [id]: valor }))
  const seguir = (id: string, valor: string) => setSeguimientos((previos) => ({ ...previos, [id]: valor }))

  const esUltima = actual === paginas.length - 1
  const antesDelCierre = !esUltima && paginas[actual + 1]?.kind === 'closing'

  // «Continuar» y «Enviar y finalizar» no pasan de página con obligatorias sin responder, igual que en el portal
  // del colaborador: cada una muestra su error debajo y la página baja a la primera.
  const avanzar = () => {
    if (esUltima) return onOpenChange(false)
    const faltan = obligatoriasSinResponder(pagina, respuestas)
    if (faltan.length === 0) return ir(actual + 1)
    setSenaladas(new Set(faltan))
    document.getElementById(`pregunta-${faltan[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Ni la bienvenida ni el cierre llevan panel: son páginas para leer, no para recorrer.
  const conPanel = pagina?.kind !== 'welcome' && pagina?.kind !== 'closing'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex! h-[calc(100svh-2rem)] max-h-[calc(100svh-2rem)] flex-col! gap-0! overflow-hidden rounded-2xl! p-0! sm:max-w-[calc(100%-2rem)]!">
        <DialogTitle className="sr-only">Vista previa · {borrador.name.trim() || 'Encuesta sin título'}</DialogTitle>
        <DialogDescription className="sr-only">Recorrido de la encuesta página a página, como lo vería quien responde.</DialogDescription>

        <img src={ambienteAzul} alt="" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] w-full opacity-25 select-none dark:opacity-30" />

        <div className="relative flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <Ubicacion pagina={pagina} />
          </div>
          <Text as="span" size="xs" variant="muted" weight="semibold" className="hidden tabular-nums sm:inline">
            {paginas.length > MAX_PAGINAS_CON_NUMERO ? `Pág. ${actual + 1} de ${paginas.length}` : `${actual + 1} / ${paginas.length}`}
          </Text>
          <div className="xl:hidden">
            <Popover open={conIndice} onOpenChange={setConIndice}>
              <PopoverTrigger
                render={
                  <Button variant="outline" size="sm">
                    <HugeiconsIcon icon={LeftToRightListBulletIcon} aria-hidden="true" />
                    Contenido
                    <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>Contenido de la encuesta</PopoverTitle>
                </PopoverHeader>
                <div className="max-h-[55vh] overflow-y-auto">
                  <Contenido paginas={paginas} indice={indice} activa={pagina?.id ?? null} avance={avance} onIr={irA} compacto />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <BotonIcono aria-label="Cerrar vista previa" onClick={() => onOpenChange(false)}>
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </BotonIcono>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <span ref={arriba} aria-hidden="true" />
          <div className={cn(FILA, 'px-4 py-6 sm:px-8')}>
            <div className={FORMULARIO}>
              {pagina?.kind === 'welcome' ? (
                <PaginaBienvenida borrador={borrador} resumen={resumen} paginas={paginas} indice={indice} avance={avance} onIr={irA} />
              ) : pagina?.kind === 'section' || pagina?.kind === 'demographics' ? (
                <PaginaPreguntas key={pagina.id} pagina={pagina} respuestas={respuestas} seguimientos={seguimientos} senaladas={senaladas} onResponder={responder} onSeguimiento={seguir} />
              ) : pagina?.kind === 'closing' ? (
                <PaginaCierre mensaje={borrador.closingDescription} resumen={resumen} respondidas={totales.answered} onReiniciar={reiniciar} />
              ) : null}
            </div>
            {conPanel ? (
              <aside aria-label="Avance de la vista previa" className={cn(ANCHO_PANEL, 'sticky top-0 hidden self-start xl:block')}>
                <PanelAvance borrador={borrador} paginas={paginas} activa={pagina} avance={avance} totales={totales} porcentaje={porcentaje} onIr={irA} />
              </aside>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 px-4 py-3 sm:px-8">
          <div className={cn('mx-auto flex w-full items-center justify-between gap-2', PAGE_WIDTH.narrow, conPanel && ANCHO_CONTENIDO_CON_PANEL)}>
            {actual > 0 ? (
              <Button variant="outline" onClick={() => ir(actual - 1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                Volver
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={avanzar}>
              {esUltima ? 'Cerrar vista previa' : antesDelCierre ? 'Enviar y finalizar' : pagina?.kind === 'welcome' ? 'Comenzar encuesta' : 'Continuar'}
              {esUltima || antesDelCierre ? null : <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
