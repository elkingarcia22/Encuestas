import { Fragment, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Queue02Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import styles from '@/shared/components/process-center.module.css'
import { useLiveProcesses, useProcessHistory } from '@/shared/components/process-store'
import { PROCESSES } from '@/shared/components/shell-data'

type ProcessCenterProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Solo para el design system: suma tres procesos de ejemplo para enseñar el panel lleno. En el producto el panel
  // muestra únicamente lo que publican las pantallas y, si no hay nada, un estado vacío.
  ejemplos?: boolean
}

// Centro de procesos: tarjeta flotante de 320px bajo el header. Las filas son el Item de la librería (el mismo de REUI).
// Llevaba debajo una barra de acciones oscura (filtrar, estado, exportar, avisar y «Nuevo»); se quitó el 30 sep a pedido
// de diseño: el panel solo lista lo que corre y su acción por fila.
export function ProcessCenter({ open, onOpenChange, ejemplos = false }: ProcessCenterProps) {
  const [collapsed, setCollapsed] = useState(false)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const live = useLiveProcesses()
  const history = useProcessHistory()

  // Al abrir, el foco entra al panel (en «Plegar», su primer botón) y, al cerrar, vuelve a donde estaba (el botón que lo
  // abrió). Antes se quedaba en ese botón y con Tab se seguía de largo: el panel no se alcanzaba con teclado (AA 2.1.1 y 2.4.3).
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    firstButtonRef.current?.focus()
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const close = () => onOpenChange(false)
  const act = (label: string) => {
    notify(label)
    close()
  }
  const openHistory = () => {
    if (!history) return act('Historial de procesos')
    close()
    history()
  }

  // Los procesos que publican las pantallas (p. ej., las hojas de vida que se están leyendo), cada uno con la misma fila;
  // los de ejemplo, solo si el design system los pide. Uno terminado se queda como «procesado» hasta que se recargue. La acción de uno en vivo es opcional y, al tocarla, cierra el panel.
  const rows: { key: string; title: string; meta: string; icon: IconSvgElement; progress?: number; done?: boolean; cta?: string; onClick: () => void }[] = [
    ...live.map((process) => ({
      ...process,
      key: process.id,
      icon: process.icon ?? Queue02Icon,
      onClick: () => {
        close()
        process.onClick?.()
      },
    })),
    ...(ejemplos ? PROCESSES : []).map((process) => ({ ...process, key: process.title, onClick: () => act(process.toast) })),
  ]
  // Lo terminado no está ni en curso ni en espera: no suma en el resumen, que así cabe en una línea.
  const enCurso = rows.filter((process) => process.progress !== undefined).length
  const enEspera = rows.filter((process) => process.progress === undefined && !process.done).length
  const procesados = rows.filter((process) => process.done).length
  const resumen = rows.length === 0 ? 'Nada en proceso' : [`${enCurso} en curso`, `${enEspera} en espera`, ...(procesados ? [`${procesados} ${procesados === 1 ? 'procesado' : 'procesados'}`] : [])].join(' · ')

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={close} />
      <div
        role="dialog"
        aria-label="Centro de procesos"
        // Sin pasarse del ancho de la ventana en móvil (AA 1.4.10): a 320px el panel se cortaba.
        className="fixed top-16 right-4 z-50 flex w-80 max-w-[calc(100vw-1rem)] flex-col max-[28rem]:right-2"
      >
        {/* Mismas esquinas que el panel de notificaciones (12px, las del Popover de la librería): todos los paneles
            que cuelgan del header se ven iguales. */}
        <div className="overflow-hidden rounded-md border bg-card text-card-foreground shadow-lg">
          {/* La cabecera es el mismo Item de las filas, en su tamaño normal: así el aire de arriba y el de la lista riman. */}
          <Item className="rounded-none!">
            <ItemMedia variant="icon">
              {/* El icono de Procesos (el centro no tiene botón propio en el header: se abre desde Notificaciones). */}
              <IconTile variant="solid" className="size-9! rounded-md! bg-muted! text-muted-foreground! [--icon-tile-icon-size:18px] dark:bg-accent!">
                <HugeiconsIcon icon={Queue02Icon} size={18} strokeWidth={1.6} />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              {/* Los 4px del sistema se miden entre cajas; con un título de 16px el interlineado añadía 6px más y el
                  hueco se veía al doble. Con el interlineado ajustado, el nombre y su bajada se leen como un bloque. */}
              <ItemTitle className="text-base! leading-none!">Centro de procesos</ItemTitle>
              {/* El resumen se cuenta solo, a partir de la lista. En insignias el azul sobre fondo oscuro no llegaba
                  al contraste mínimo, así que va como texto. */}
              <ItemDescription className="leading-snug!">
                {resumen}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              {/* Solo plegar/desplegar (pedido de diseño). Se cierra con clic fuera del panel. */}
              <BotonIcono
                ref={firstButtonRef}
                size="icon-xs"
                aria-label={collapsed ? 'Desplegar' : 'Plegar'}
                onClick={() => setCollapsed((c) => !c)}
              >
                <HugeiconsIcon icon={collapsed ? ArrowDown01Icon : ArrowUp01Icon} size={16} />
              </BotonIcono>
            </ItemActions>
          </Item>

          {!collapsed && rows.length === 0 ? (
            <>
              {/* Estado vacío «primera vez» del design system (Estados › Estados vacíos): icono glass, título en positivo y
                  qué va a aparecer aquí. Sin acción: lo que llena el panel lo lanzan otras pantallas. */}
              <PrimeraVez
                className="border-t py-8"
                icono="glass-activity"
                titulo="No hay nada en proceso"
                descripcion="Las importaciones y cargas que lances aparecen aquí con su avance, y se quedan cuando terminan."
              />
              <div className="flex items-center justify-end border-t bg-muted px-3 py-2.5">
                <Button variant="ghost" size="xs" className="-mr-1.5 shrink-0 text-xs!" onClick={openHistory}>
                  Historial
                </Button>
              </div>
            </>
          ) : null}

          {!collapsed && rows.length > 0 ? (
            <>
              <ItemGroup className="gap-0! border-t">
                {rows.map((process, index) => {
                  const running = process.progress !== undefined
                  return (
                    // La lista de la librería se anuncia como lista, así que cada fila va como elemento de lista
                    // (`render` cambia la etiqueta sin tocar el aspecto). Antes eran divs y el lector leía una lista vacía.
                    <Fragment key={process.key}>
                      {index > 0 ? <ItemSeparator className="my-0!" /> : null}
                      <Item size="sm" render={<li />} className="items-start! gap-3! px-3! py-3!">
                        {/* La baldosa dice el estado sin leer: azul tenue si está corriendo, gris si espera turno. */}
                        <ItemMedia variant="icon">
                          <IconTile
                            variant="solid"
                            className={
                              running
                                ? 'size-8! rounded-md! bg-primary/10! text-primary! [--icon-tile-icon-size:16px]'
                                : process.done
                                  ? 'size-8! rounded-md! bg-success/10! text-success! [--icon-tile-icon-size:16px]'
                                  : 'size-8! rounded-md! bg-muted! text-muted-foreground! [--icon-tile-icon-size:16px] dark:bg-accent!'
                            }
                          >
                            <HugeiconsIcon icon={process.done ? CheckmarkCircle02Icon : process.icon} size={16} strokeWidth={1.6} />
                          </IconTile>
                        </ItemMedia>
                        <ItemContent className="min-w-0! gap-1!">
                          <ItemTitle className="w-full!">
                            <span className="truncate">{process.title}</span>
                          </ItemTitle>
                          {running ? (
                            // La barra de la librería con sus dos piezas: el detalle a la izquierda y el porcentaje
                            // a la derecha, y debajo el avance. El azul queda solo aquí: significa progreso, no acción.
                            <Progress value={process.progress ?? null} aria-label={`Avance de ${process.title}`} className={`w-full gap-1.5! ${styles.live}`}>
                              <ProgressLabel className="min-w-0 flex-1 truncate font-normal! text-muted-foreground!">{process.meta}</ProgressLabel>
                              <ProgressValue className="shrink-0 font-medium! text-foreground!" />
                            </Progress>
                          ) : (
                            <ItemDescription className="w-full!">
                              {/* En bloque: si no, el «…» no sale y un texto largo se corta a media letra. */}
                              <span className="block truncate">{process.meta}</span>
                            </ItemDescription>
                          )}
                        </ItemContent>
                        {/* La acción tiene columna propia: el título puede ser largo y truncar sin moverla, y las tres
                            quedan alineadas en el mismo borde. */}
                        {process.cta ? (
                          <ItemActions className="self-center!">
                            <Button variant="outline" size="xs" onClick={process.onClick}>
                              {process.cta}
                            </Button>
                          </ItemActions>
                        ) : null}
                      </Item>
                    </Fragment>
                  )
                })}
              </ItemGroup>
              {/* Una sola línea: a 14px el aviso no cabía junto a «Historial» en los 320px del panel y se partía. */}
              <div className="flex items-center justify-between gap-2 border-t bg-muted px-3 py-2.5">
                <span className="truncate text-xs text-muted-foreground">Siguen corriendo si cierras el chat</span>
                {/* Botón, no enlace azul: en el panel el azul es solo el avance, y en modo oscuro el azul de enlace a
                    12px no llegaba al contraste mínimo. */}
                <Button variant="ghost" size="xs" className="-mr-1.5 shrink-0 text-xs!" onClick={openHistory}>
                  Historial
                </Button>
              </div>
            </>
          ) : null}
        </div>

      </div>
    </>
  )
}
