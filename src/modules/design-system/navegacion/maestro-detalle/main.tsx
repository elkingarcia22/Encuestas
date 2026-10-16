import { useRef, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { REQUESTS, STATUS_LABEL, initials, type RequestStatus } from './components/data'
import { RequestDetail } from './components/request-detail'

type Filter = RequestStatus | 'todas'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
]

// Patrón · Maestro-detalle: lista a la izquierda, registro a la derecha, ancho ajustable.
export function Component() {
  const [items, setItems] = useState(REQUESTS)
  const [filter, setFilter] = useState<Filter>('pendiente')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(REQUESTS[0].id)
  const listRef = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const visible = items.filter(
    (r) => (filter === 'todas' || r.status === filter) && (!q || r.name.toLowerCase().includes(q) || r.area.toLowerCase().includes(q)),
  )
  const selected = items.find((r) => r.id === selectedId)
  const index = visible.findIndex((r) => r.id === selectedId)
  const count = (value: Filter) => (value === 'todas' ? items.length : items.filter((r) => r.status === value).length)

  const select = (id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => {
      const row = listRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)
      row?.scrollIntoView({ block: 'nearest' })
      // Con el teclado, el foco acompaña a la fila elegida.
      if (listRef.current?.contains(document.activeElement)) row?.focus({ preventScroll: true })
    })
  }

  const move = (step: number) => {
    if (!visible.length) return
    const next = index === -1 ? 0 : Math.min(Math.max(index + step, 0), visible.length - 1)
    select(visible[next].id)
  }

  const changeFilter = (next: Filter) => {
    setFilter(next)
    const first = items.find((r) => next === 'todas' || r.status === next)
    if (first) setSelectedId(first.id)
  }

  const respond = (status: 'aprobada' | 'rechazada') => {
    if (!selected) return
    const others = visible.filter((r) => r.status === 'pendiente' && r.id !== selected.id)
    const nextPending = others.find((r) => visible.indexOf(r) > index) ?? others[0]
    setItems((list) => list.map((r) => (r.id === selected.id ? { ...r, status } : r)))
    notify(`${status === 'aprobada' ? 'Aprobaste' : 'Rechazaste'} la solicitud de ${selected.name}`)
    if (nextPending) select(nextPending.id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('input, textarea')) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(event.key === 'ArrowDown' ? 1 : -1)
    }
  }

  return (
    <CaseFrame width="default" title="Maestro-detalle" hint="Revisar muchos registros seguidos sin abrir y cerrar cada uno">
      <PageShell width="default">
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Tareas', path: '/admin/tareas' }, { label: 'Solicitudes de ausencia' }]}
          title="Solicitudes de ausencia"
          description="Revisa y responde las solicitudes de tu equipo sin salir de la lista."
          actions={
            <>
              <Button variant="outline" className={WS} onClick={() => notify('Calendario del equipo')}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                Calendario del equipo
              </Button>
            </>
          }
        />

        <PageContent className="pb-2">
          <div className="h-170 overflow-hidden rounded-xl border bg-card" onKeyDown={onKeyDown}>
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel defaultSize="36" minSize="26" maxSize="55">
                <div data-region="Lista" className="flex h-full flex-col">
                  <div className="flex flex-col gap-3 border-b p-3">
                    <InputGroup>
                      <InputGroupAddon>
                        <HugeiconsIcon icon={Search01Icon} size={16} />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por persona o área"
                        aria-label="Buscar por persona o área"
                      />
                    </InputGroup>
                    <ToggleGroup
                      aria-label="Filtrar por estado"
                      value={[filter]}
                      onValueChange={(value) => value.length && changeFilter(value[0] as Filter)}
                      variant="outline"
                      size="sm"
                      className="flex w-full flex-wrap"
                    >
                      {FILTERS.map((item) => (
                        // `basis-24`: en una columna angosta los filtros pasan a dos renglones en vez de encimarse.
                        <ToggleGroupItem key={item.value} value={item.value} className="flex-1 basis-20 gap-1.5 px-2!">
                          {item.label}
                          <span className="text-muted-foreground tabular-nums">{count(item.value)}</span>
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  {/* Lista de selección única: Tab entra a la solicitud elegida y ↑ ↓ pasan de una a otra (el foco la acompaña). */}
                  <div
                    ref={listRef}
                    role={visible.length ? 'listbox' : undefined}
                    aria-label={visible.length ? 'Solicitudes' : undefined}
                    className="min-h-0 flex-1 overflow-y-auto p-1.5"
                  >
                    {visible.length ? (
                      visible.map((r, position) => {
                        const active = r.id === selectedId
                        return (
                          <Button
                            key={r.id}
                            variant="ghost"
                            role="option"
                            data-id={r.id}
                            aria-selected={active}
                            tabIndex={active || (index === -1 && position === 0) ? 0 : -1}
                            onClick={() => select(r.id)}
                            // El botón de la librería como superficie de la opción: se le quita su alto y su relleno
                            // para que la fila mida lo que pide su contenido.
                            className={cn(
                              'h-auto! w-full items-start! justify-start! gap-3! rounded-lg! border-0! px-3! py-2.5! text-left font-normal! whitespace-normal!',
                              active ? 'bg-primary/8! hover:bg-primary/8!' : 'hover:bg-muted!',
                            )}
                          >
                            <Avatar size="sm" className="mt-0.5">
                              <AvatarFallback>{initials(r.name)}</AvatarFallback>
                            </Avatar>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className={cn('truncate text-sm font-medium', active && 'text-primary')}>{r.name}</span>
                                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{r.requested}</span>
                              </span>
                              <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">
                                  {r.type} · {r.dates}
                                </span>
                                {r.status === 'pendiente' ? (
                                  <>
                                    <span aria-hidden="true" className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />
                                    <span className="sr-only">Pendiente</span>
                                  </>
                                ) : (
                                  <span className="ml-auto shrink-0 text-xs">{STATUS_LABEL[r.status]}</span>
                                )}
                              </span>
                            </span>
                          </Button>
                        )
                      })
                    ) : filter === 'pendiente' && !q ? (
                      // Los vacíos del sistema, con ilustración: sin pendientes no hay nada que responder (no es que un
                      // filtro lo deje fuera); con búsqueda o con otro estado, «Sin resultados» y cómo aflojarlo.
                      <PrimeraVez icono="glass-tick" titulo="Estás al día" descripcion="No quedan solicitudes por responder." />
                    ) : (
                      <SinResultados
                        busqueda={q ? query : undefined}
                        filtrosActivos={filter === 'todas' ? 0 : 1}
                        onLimpiar={() => {
                          setQuery('')
                          changeFilter('todas')
                        }}
                      />
                    )}
                  </div>

                  <div role="status" className="border-t px-4 py-2 text-xs text-muted-foreground tabular-nums">
                    {visible.length} {visible.length === 1 ? 'solicitud' : 'solicitudes'} · {count('pendiente')} por responder
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel minSize="40">
                {selected ? (
                  <RequestDetail
                    request={selected}
                    position={index === -1 ? '' : `${index + 1} de ${visible.length}`}
                    canPrev={index > 0}
                    canNext={index !== -1 && index < visible.length - 1}
                    onPrev={() => move(-1)}
                    onNext={() => move(1)}
                    onRespond={respond}
                    onUndo={() => setItems((list) => list.map((r) => (r.id === selected.id ? { ...r, status: 'pendiente' } : r)))}
                  />
                ) : null}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </PageContent>
      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationMasterDetailPage'
