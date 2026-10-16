import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  CubeIcon,
  MultiplicationSignCircleIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, AlertTitle, Button, Card, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Spinner, Text, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { duracionAviso } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { buscarPagina, getBorrador, setBorrador, type Borrador, type Trabajo } from './borrador'

// Generaciones en segundo plano (Video con IA, Video Avatar IA, Presentación interactiva). El asistente las hace avanzar
// mientras esté abierto, aunque el creador haya salido y vuelto. Al terminar: un solo aviso con «Ver página»
// (HU-LMS-001, RN-09), fijo y en cualquier paso hasta que se cierre: un video puede tardar mucho y el creador ya estar
// en otro paso. Es la regla de Design system › Estados › Procesos («Generar un video con IA»: una alerta, sin aviso
// flotante).

/** Avanza las generaciones pendientes y, al cumplirse su tiempo, monta el resultado en su página. */
export function useTrabajos() {
  useEffect(() => {
    const paso = () => {
      const b = getBorrador()
      const cargando = b.trabajos.filter((t) => t.estado === 'cargando')
      if (!cargando.length) return
      const ahora = Date.now()
      setBorrador((previo) => {
        let secciones = previo.secciones
        const trabajos = previo.trabajos.map((t) => {
          if (t.estado !== 'cargando') return t
          const avance = Math.min(1, (ahora - t.inicio) / t.duracion)
          if (avance < 1) return { ...t, progreso: Math.round(avance * 100) }
          if (!buscarPagina(previo, t.paginaId)) return { ...t, estado: 'error' as const }
          secciones = secciones.map((s) => ({
            ...s,
            paginas: s.paginas.map((p) => (p.id === t.paginaId && p.recurso ? { ...p, recurso: { ...p.recurso, ...t.resultado, generando: false } } : p)),
          }))
          return { ...t, estado: 'listo' as const, progreso: 100, avisado: false }
        })
        return { trabajos, secciones }
      })
    }
    paso()
    const id = window.setInterval(paso, 400)
    return () => window.clearInterval(id)
  }, [])
}

const MENSAJE: Record<Trabajo['tipo'], string> = {
  video: 'Tu video ya está listo.',
  presentacion: 'Tu presentación interactiva ya está lista.',
}

type Props = { borrador: Borrador; onVerPagina: (paginaId: string) => void }

const marcarAvisado = (id: string) => setBorrador((b) => ({ trabajos: b.trabajos.map((t) => (t.id === id ? { ...t, avisado: true } : t)) }))

/**
 * Las generaciones en segundo plano: el panel «Generando / Recursos generados» y, solo si ese panel está cerrado, el
 * aviso de cada una que termina (con el panel abierto el «Listo» ya se ve ahí: dos avisos de lo mismo sobraban).
 */
export function Generaciones({ borrador, onVerPagina, className }: Props & { className?: string }) {
  const [cerrado, setCerrado] = useState(false)

  // Al entrar, se olvidan las generaciones que ya terminaron y ya se avisaron. Sin esto se quedaban para siempre en el
  // borrador y el panel «Recursos generados» volvía a salir **cada vez que el asistente se monta** —o sea, al volver de
  // cualquier modal de recurso—, anunciando un video que se generó hace rato. Solo debe verse mientras algo se genera o
  // cuando algo acaba de terminar.
  useEffect(() => {
    setBorrador((b) => ({ trabajos: b.trabajos.filter((t) => !(t.estado === 'listo' && t.avisado)) }))
  }, [])

  // Con el panel a la vista, lo que termina queda avisado ahí: no salta un aviso después, al cerrarlo.
  useEffect(() => {
    if (cerrado) return
    borrador.trabajos.filter((t) => t.estado === 'listo' && !t.avisado).forEach((t) => marcarAvisado(t.id))
  }, [cerrado, borrador.trabajos])
  return (
    <>
      <PanelGeneracion borrador={borrador} onVerPagina={onVerPagina} className={className} cerrado={cerrado} onCerrado={setCerrado} />
      {cerrado ? <AvisosListos borrador={borrador} onVerPagina={onVerPagina} /> : null}
    </>
  )
}

/** El aviso de cada generación que terminó: arriba, en cualquier paso, hasta que se cierra, se abre la página o pasa su tiempo. */
function AvisosListos({ borrador, onVerPagina }: Props) {
  const listos = borrador.trabajos.filter((t) => t.estado === 'listo' && !t.avisado)
  if (!listos.length) return null
  return (
    // Debajo de la cabecera del flujo (61 px), centrado; los colores suaves del Alert son translúcidos: base de tarjeta.
    <div role="status" aria-live="polite" className="fixed top-19 left-1/2 z-50 flex w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
      {listos.map((t) => {
        const titulo = buscarPagina(borrador, t.paginaId)?.pagina.titulo ?? 'La página'
        return (
          <SeCierraSolo key={t.id} texto={`${MENSAJE[t.tipo]} ${titulo} ya tiene su recurso en Recursos.`} onCerrar={() => marcarAvisado(t.id)}>
            {/* El Alert baja 2 px todos sus iconos cuando lleva título y descripción: la X de cerrar se queda centrada. */}
            <Alert variant="success" className="bg-card shadow-lg [&_button_svg]:translate-y-0!">
              {/* El orbe va en el título: la esquina del Alert solo acomoda iconos de trazo. */}
              <AlertTitle className="flex items-center gap-2">
                <IconoIA />
                {MENSAJE[t.tipo]}
              </AlertTitle>
              <AlertDescription>{titulo} ya tiene su recurso en Recursos.</AlertDescription>
              <AlertAction className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    marcarAvisado(t.id)
                    onVerPagina(t.paginaId)
                  }}
                >
                  Ver página
                </Button>
                <CloseButton label="Cerrar aviso" onClick={() => marcarAvisado(t.id)} />
              </AlertAction>
            </Alert>
          </SeCierraSolo>
        )
      })}
    </div>
  )
}

/**
 * Cierra el aviso solo, con la duración de los avisos del sistema (`duracionAviso`: la regla del referente según el
 * largo del texto). El tiempo se detiene mientras el cursor o el foco están encima, como en los toasts.
 */
function SeCierraSolo({ texto, onCerrar, children }: { texto: string; onCerrar: () => void; children: ReactNode }) {
  const [pausado, setPausado] = useState(false)
  const restante = useRef(duracionAviso(texto))
  const alCerrar = useRef(onCerrar)
  useEffect(() => {
    alCerrar.current = onCerrar
  })
  useEffect(() => {
    if (pausado) return
    const inicio = Date.now()
    const id = window.setTimeout(() => alCerrar.current(), restante.current)
    return () => {
      window.clearTimeout(id)
      restante.current = Math.max(0, restante.current - (Date.now() - inicio))
    }
  }, [pausado])
  return (
    <div onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} onFocus={() => setPausado(true)} onBlur={() => setPausado(false)}>
      {children}
    </div>
  )
}

/** El panel abajo a la izquierda con cada generación y su estado. */
/** `className` sube el panel cuando abajo hay una barra de acciones (el editor): si no, tapa «Cancelar». */
function PanelGeneracion({
  borrador,
  onVerPagina,
  className,
  cerrado,
  onCerrado: setCerrado,
}: Props & { className?: string; cerrado: boolean; onCerrado: (cerrado: boolean) => void }) {
  const [plegado, setPlegado] = useState(false)
  const ultimo = borrador.trabajos.reduce((max, t) => Math.max(max, t.inicio), 0)

  // Un trabajo nuevo vuelve a mostrar el panel.
  useEffect(() => {
    if (ultimo) setCerrado(false)
  }, [ultimo])

  if (!borrador.trabajos.length || cerrado) return null
  const cargando = borrador.trabajos.some((t) => t.estado === 'cargando')

  return (
    <Card className={cn('fixed bottom-6 left-6 z-45 w-[min(320px,calc(100vw-3rem))] gap-0! py-0! shadow-xl', className)}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <IconoIA />
        <Text as="span" size="sm" weight="semibold" className="flex-1">
          {cargando ? 'Generando recursos' : 'Recursos generados'}
        </Text>
        <BotonIcono size="icon-xs" aria-label={plegado ? 'Expandir' : 'Minimizar'} onClick={() => setPlegado((v) => !v)}>
          <HugeiconsIcon icon={plegado ? ArrowUp01Icon : ArrowDown01Icon} size={16} />
        </BotonIcono>
        <CloseButton label="Cerrar" onClick={() => setCerrado(true)} />
      </div>
      {!plegado ? (
        <div className="flex max-h-72 flex-col overflow-auto p-2">
          {borrador.trabajos.map((t) => {
            const pagina = buscarPagina(borrador, t.paginaId)?.pagina
            const listo = t.estado === 'listo'
            const subtitulo =
              t.estado === 'error' ? 'Se eliminó el recurso' : listo ? 'Listo · Haz clic para ver' : t.tipo === 'video' ? `Generando ${t.progreso}%` : 'Generando...'
            return (
              <Item
                key={t.id}
                size="sm"
                className={listo ? 'cursor-pointer' : undefined}
                render={listo ? <a href="#" /> : <div />}
                onClick={(e) => {
                  if (!listo) return
                  e.preventDefault()
                  onVerPagina(t.paginaId)
                }}
              >
                <ItemMedia>
                  <HugeiconsIcon icon={t.tipo === 'video' ? Video01Icon : CubeIcon} size={18} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="truncate">{pagina?.titulo || 'Recurso'}</ItemTitle>
                  <ItemDescription>{subtitulo}</ItemDescription>
                </ItemContent>
                {t.estado === 'cargando' ? (
                  <Spinner className="size-4" />
                ) : (
                  <HugeiconsIcon
                    icon={listo ? CheckmarkCircle02Icon : MultiplicationSignCircleIcon}
                    size={18}
                    aria-hidden="true"
                    className={listo ? 'text-success' : 'text-destructive'}
                  />
                )}
              </Item>
            )
          })}
        </div>
      ) : null}
    </Card>
  )
}
