import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp01Icon, Calendar03Icon, Clock01Icon, Download04Icon, File02Icon, Tick02Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Badge, Button, Progress, Scrollspy } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { KICKER, WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { PolicyArticle } from './components/policy'
import { SECTIONS } from './components/sections'

const META = [
  { icon: File02Icon, label: 'Versión 3.2' },
  { icon: Calendar03Icon, label: 'Actualizada el 2 sept 2026' },
  { icon: UserIcon, label: 'Sara Gómez · Gestión humana' },
  { icon: Clock01Icon, label: '6 min de lectura' },
]

// Patrón · Documento con índice: lectura larga con un índice que sigue la sección visible.
export function Component() {
  const scrollerRef = useRef<HTMLElement | null>(null)
  const [offsetFix, setOffsetFix] = useState(0)
  const [progress, setProgress] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [current, setCurrent] = useState('')

  // El contenido desplaza dentro del <main> interno del marco (no la ventana).
  useLayoutEffect(() => {
    scrollerRef.current = document.querySelector<HTMLElement>('main main')
  }, [])

  // El índice mide cada sección desde su contenedor posicionado, que no siempre es el que desplaza
  // (p. ej. con la anatomía encendida): se calcula la diferencia para que marque la sección correcta.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const update = () => {
      const first = document.getElementById(SECTIONS[0].id)
      if (first) {
        const real = first.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
        setOffsetFix(Math.round(first.offsetTop - real))
      }
      const max = scroller.scrollHeight - scroller.clientHeight
      setProgress(max > 0 ? Math.round((scroller.scrollTop / max) * 100) : 0)
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    return () => {
      scroller.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  return (
    <CaseFrame title="Documento con índice" hint="Lecturas largas: el índice acompaña y marca la sección que estás leyendo">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Avisos internos', path: '/admin/avisos-internos' }, { label: 'Política de vacaciones 2026' }]}
          kicker="Política · Gestión humana"
          title="Política de vacaciones 2026"
          badge={<Badge variant="success-light">Vigente</Badge>}
          description="Cómo se ganan, se piden y se aprueban las vacaciones en Meta Colombia."
          meta={META.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <HugeiconsIcon icon={item.icon} size={15} />
              {item.label}
            </span>
          ))}
          actions={
            <>
              <Button variant="outline" className={WS} onClick={() => notify('Descargando la política en PDF', undefined, 'info')}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Descargar PDF
              </Button>
              <Button
                className={WS}
                disabled={confirmed}
                onClick={() => {
                  setConfirmed(true)
                  notify('Lectura confirmada · queda en tu historial', undefined, 'success')
                }}
              >
                {confirmed ? <HugeiconsIcon icon={Tick02Icon} size={16} /> : null}
                {confirmed ? 'Lectura confirmada' : 'Confirmar lectura'}
              </Button>
            </>
          }
        />

        <PageContent className="pt-10">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
            <PolicyArticle />

            <aside data-region="Índice" className="sticky top-6 hidden self-start lg:flex lg:flex-col">
              <nav aria-labelledby="doc-toc-title">
                <div id="doc-toc-title" className={KICKER}>
                  En esta página
                </div>
                <Scrollspy targetRef={scrollerRef} offset={offsetFix + 32} history={false} onUpdate={setCurrent} className="mt-3 flex flex-col border-l">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      aria-current={current === section.id ? 'location' : undefined}
                      data-scrollspy-anchor={section.id}
                      className="-ml-px cursor-pointer border-l-2 border-transparent py-1.5 pl-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground data-[active=true]:border-primary data-[active=true]:font-medium data-[active=true]:text-foreground"
                    >
                      {section.short}
                    </button>
                  ))}
                </Scrollspy>
              </nav>
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span id="doc-read-label">Leído</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} aria-labelledby="doc-read-label" className="**:data-[slot=progress-track]:h-1!" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 -ml-2.5 w-fit text-muted-foreground!"
                onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
                Volver arriba
              </Button>
            </aside>
          </div>
        </PageContent>

      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationDocumentPage'
