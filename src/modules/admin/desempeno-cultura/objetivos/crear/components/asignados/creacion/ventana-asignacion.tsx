import { useCallback, useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, Text, cn } from '@ubits/flux-ui'
import { PantallaCompleta } from '@/modules/design-system/marco/pantalla-completa'
import { ANCHO_AGENTE } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import { PageShell } from '@/shared/components/PageShell'
import { Badge } from '@/shared/components/Badge'
import { useCreacionAsignacion, useSesionPedido, type Creacion, type DatosCreacion, type PanelAsignacionProps } from './usar-creacion'

// La creación de una asignación a pantalla completa (21-oct, Elkin: «como cuando uno pone el mapa de alineaciones en pantalla
// completa, el mismo componente»): `PantallaCompleta` del sistema, con su título con divisor, la X en círculo y un pie con la
// pista y los botones. A la izquierda, sin cambios, la lista de objetivos (o, eligiendo destinatarios, el resumen); a la
// derecha el trabajo, centrado en el ancho del sistema (PageShell): 720 px para el formulario del objetivo y el reparto, que
// leídos más anchos se ven raros, y 1.140 px para las listas (destinatarios y banco). Cada columna se desplaza por su
// cuenta. Toda la lógica vive en `usar-creacion`; aquí solo se dibuja.

export function VentanaAsignacion(props: PanelAsignacionProps) {
  const sesion = useSesionPedido(props.pedido)
  if (!sesion.pedido) return null
  return <VentanaTrabajo key={sesion.cuenta} {...props} abierto={props.pedido !== null} pedido={sesion.pedido} />
}

function VentanaTrabajo({ abierto, ...datos }: DatosCreacion & { abierto: boolean }) {
  const c = useCreacionAsignacion(datos)
  // La pantalla completa se suscribe a Escape con esta función: estable, para que no se re-suscriba (ni le quite el foco al
  // campo que se está escribiendo) en cada tecla.
  const cerrar = useRef(c.pedirCerrar)
  cerrar.current = c.pedirCerrar
  const alCerrar = useCallback(() => cerrar.current(), [])
  // Al cambiar de objetivo la vista vuelve a su inicio y, si trae algo por corregir a la vista (en rojo), baja hasta ahí.
  const trabajo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const panel = trabajo.current
    if (!panel) return
    panel.scrollTo({ top: 0 })
    panel.querySelector('[data-con-error]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [c.elegido])
  return (
    <PantallaCompleta
      abierta={abierto}
      onCerrar={alCerrar}
      titulo={c.titulo}
      descripcion={c.descripcion}
      etiquetaCerrar="Cerrar la creación"
      partida
      // Con Orbit acoplado a la derecha (creando con IA) la pantalla se queda a su izquierda y no lo tapa.
      junto={datos.agenteAbierto ? ANCHO_AGENTE : undefined}
      pie={
        <>
          <Text as="span" size="sm" variant="muted" className="mr-auto min-w-0">
            {c.pista}
          </Text>
          {c.pie}
        </>
      }
    >
      <div className={cn('grid h-full min-h-0 lg:grid-rows-[minmax(0,1fr)]', c.lateral ? 'lg:grid-cols-[24rem_minmax(0,1fr)]' : 'lg:grid-cols-[15rem_minmax(0,1fr)]')}>
        <div className="min-h-0 min-w-0 p-5 lg:overflow-y-auto lg:border-e">{c.lateral ?? <ResumenVivo c={c} />}</div>
        <div ref={trabajo} className="min-h-0 min-w-0 p-5 lg:overflow-y-auto">
          <PageShell width={c.fase === 'objetivos' && (c.subpagina === 'lista' || c.subpagina === 'pesos') ? 'narrow' : 'default'} className="gap-4">
            {c.onVolver ? (
              <Button variant="ghost" size="sm" className="-ms-2 self-start" onClick={c.onVolver}>
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                Volver
              </Button>
            ) : null}
            {c.headerExtra}
            {c.cuerpo}
          </PageShell>
        </div>
      </div>
      {c.ventanaSalir}
    </PantallaCompleta>
  )
}

/** Lo que la ventana tiene de más: dónde va la creación y cuánto peso lleva, siempre a la vista. */
function ResumenVivo({ c }: { c: Creacion }) {
  const { resumen, fase, grupal, titular } = c
  const pesoPasado = resumen.total > resumen.cupo
  const pasos = [
    { id: 'destinatarios', numero: 1, titulo: grupal ? 'Para qué grupos' : 'Para quién', hecho: resumen.elegidos > 0, detalle: resumen.elegidos > 0 ? titular : 'Sin elegir todavía' },
    { id: 'objetivos', numero: 2, titulo: 'Objetivos', hecho: resumen.objetivos > 0, detalle: resumen.objetivos > 0 ? `${resumen.objetivos} ${resumen.objetivos === 1 ? 'objetivo' : 'objetivos'}` : 'Ninguno todavía' },
  ] as const
  return (
    <aside aria-label="Resumen de la asignación" className="flex flex-col gap-5">
      <ol className="flex flex-col gap-3">
        {pasos.map((paso) => (
          <li key={paso.id} className="flex items-start gap-3" aria-current={fase === paso.id ? 'step' : undefined}>
            {paso.hecho ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="mt-0.5 shrink-0 text-success" aria-label="Listo" />
            ) : (
              <Badge variant={fase === paso.id ? 'primary-light' : 'secondary'} radius="full" size="sm" className="mt-0.5 shrink-0 tabular-nums">
                {paso.numero}
              </Badge>
            )}
            <div className="flex min-w-0 flex-col">
              <Text as="span" size="sm" weight={fase === paso.id ? 'semibold' : 'medium'}>
                {paso.titulo}
              </Text>
              <Text as="span" size="xs" variant="muted" className="truncate">
                {paso.detalle}
              </Text>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        <Text as="span" size="sm" weight="medium">
          Peso repartido
        </Text>
        <Progress value={Math.min(100, resumen.cupo === 0 ? 0 : (resumen.total / resumen.cupo) * 100)} aria-label="Peso repartido" />
        <Text as="span" size="sm" variant={pesoPasado ? 'destructive' : 'muted'} className="tabular-nums">
          {resumen.total} % de {resumen.cupo} %
        </Text>
        {resumen.alcance > 0 ? (
          <Text as="span" size="xs" variant="muted">
            Llega a {resumen.alcance} {resumen.alcance === 1 ? 'persona' : 'personas'}
          </Text>
        ) : null}
      </div>
    </aside>
  )
}
