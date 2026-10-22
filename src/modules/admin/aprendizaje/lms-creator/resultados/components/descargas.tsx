import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Comment01Icon, Download04Icon, File01Icon, Loading03Icon, Table01Icon, Xls01Icon } from '@hugeicons/core-free-icons'
import { Button, Checkbox, Field, FieldContent, FieldLabel, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, IconTile, Progress, RadioGroup, RadioGroupItem, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { notify } from '@/shared/components/notify'
import { publishProcess, removeProcess, updateProcess } from '@/shared/components/process-store'
import { XLS_EXTENSION, XLS_MIME, fileStamp, saveBlob, slugify } from '@/modules/admin/desempeno-cultura/encuestas/modelo/descargas/libro'
import { fechaHora, type Resultados, type TipoReporte } from './datos'
import { libroDe } from './libros'

// El panel de descargas de un contenido.
//
// Dos pestañas a propósito, como en Resultados de encuestas: **Reportes** es configuración —qué archivo quieres— y
// **Descargas** es estado —en qué va lo que ya pediste—. Es lo que hoy no existe: producción manda un correo con
// «Solicitar» y a partir de ahí nadie sabe si salió, si falló o si ya llegó.
//
// Y las descargas viven en la pantalla, no en el panel: cerrarlo **no cancela** un reporte a medio preparar.

type DefinicionReporte = {
  id: TipoReporte
  titulo: string
  descripcion: string
  formato: 'XLSX' | 'PDF'
  icono: IconSvgElement
  /** Cuánto tarda en prepararse, para que la barra no sea igual en todos. */
  segundos: number
}

const REPORTES: readonly DefinicionReporte[] = [
  { id: 'progreso', titulo: 'Progreso por persona', descripcion: 'Una fila por persona: cuándo empezó, en qué va y qué recursos completó', formato: 'XLSX', icono: Xls01Icon, segundos: 4 },
  { id: 'evaluaciones', titulo: 'Resultados de evaluaciones', descripcion: 'El resultado de cada persona en cada evaluación, con su nota final ponderada', formato: 'XLSX', icono: Table01Icon, segundos: 5 },
  { id: 'respuestas', titulo: 'Respuestas de las evaluaciones', descripcion: 'Qué respondió cada persona en cada pregunta, para ver cuál falla más', formato: 'XLSX', icono: File01Icon, segundos: 6 },
  { id: 'encuestas', titulo: 'Respuestas de las encuestas', descripcion: 'Lo que contestaron en las encuestas del contenido, incluidas las abiertas', formato: 'XLSX', icono: Comment01Icon, segundos: 4 },
  { id: 'roleplay', titulo: 'Intentos de roleplay', descripcion: 'Un intento por fila con sus objetivos, y la transcripción de cada conversación', formato: 'XLSX', icono: Comment01Icon, segundos: 5 },
]

export type Pedido = {
  id: string
  nombre: string
  formato: string
  pedido: string
  /** De 0 a 100; a 100 el archivo está listo. */
  avance: number
  /** Qué hace al entregarlo: guardar el libro o abrir el diálogo de impresión. Devuelve `false` si no pudo. */
  entregar: () => boolean
}

/** Qué reportes tiene sentido ofrecer para este contenido: no se ofrece lo que no existe. */
function reportesDe(resultados: Resultados): DefinicionReporte[] {
  const descargas = resultados.datos.descargas ?? []
  const conEvaluacion = resultados.datos.evaluaciones.length > 0
  const conEncuesta = descargas.some((recurso) => recurso.tipo === 'encuesta')
  const conRoleplay = resultados.intentos.length > 0
  return REPORTES.filter((reporte) => {
    if (reporte.id === 'evaluaciones' || reporte.id === 'respuestas') return conEvaluacion
    if (reporte.id === 'encuestas') return conEncuesta
    if (reporte.id === 'roleplay') return conRoleplay
    return true
  })
}

/** Entrega el archivo sin que un error tumbe la pantalla: si algo falla, la fila deja reintentar. */
function entregarSeguro(nombre: string, entregar: () => boolean): boolean {
  try {
    return entregar()
  } catch (error) {
    console.error('No se pudo generar el archivo', nombre, error)
    return false
  }
}

/**
 * El centro de descargas: lo pedido y cómo va.
 *
 * Vive en la pantalla y no en el panel, para que cerrar el panel no mate un reporte a medio preparar. Es el mismo
 * acuerdo de Resultados de encuestas.
 *
 * Mientras se prepara, el archivo también se publica en el **Centro de procesos** (el de las notificaciones), que es
 * donde el administrador mira «¿qué tengo corriendo?» desde cualquier pantalla: un reporte que solo se ve con este
 * panel abierto obliga a quedarse esperando con él abierto.
 */
export function useDescargas(abrirPanel?: () => void) {
  const [pedidos, setPedidos] = useState<readonly Pedido[]>([])
  const relojes = useRef(new Map<string, ReturnType<typeof setInterval>>())

  // Al salir de la pantalla se paran los relojes y se retiran los procesos: si no, siguen corriendo contra una
  // pantalla que ya no existe y el Centro de procesos muestra para siempre algo que nadie está preparando.
  useEffect(() => {
    const activos = relojes.current
    return () => {
      activos.forEach((reloj, id) => {
        clearInterval(reloj)
        removeProcess(id)
      })
      activos.clear()
    }
  }, [])

  const pedir = useCallback(
    (nombre: string, formato: string, segundos: number, entregar: () => boolean) => {
      const id = `descarga-contenido-${Date.now()}`
      const momento = new Date().toISOString()
      setPedidos((previos) => [{ id, nombre, formato, pedido: momento, avance: 0, entregar }, ...previos])
      publishProcess({ id, title: nombre, meta: `Preparando ${formato}`, progress: 0, icon: Download04Icon, cta: 'Ver', onClick: abrirPanel })

      const paso = 100 / (segundos * 4)
      let avance = 0
      const reloj = setInterval(() => {
        avance = Math.min(100, avance + paso)
        const listo = avance >= 100
        // El avance se lleva fuera del actualizador: React puede ejecutarlo dos veces, y avisar ahí dentro
        // duplicaría el aviso y el fin de la cuenta.
        setPedidos((previos) => previos.map((pedido) => (pedido.id === id ? { ...pedido, avance } : pedido)))
        if (!listo) return updateProcess(id, { progress: avance })

        clearInterval(reloj)
        relojes.current.delete(id)
        updateProcess(id, { meta: `${formato} listo`, progress: undefined, done: true, cta: 'Ver' })
        // Pedir el reporte ya es pedir la descarga: el archivo sale solo al terminar, y la fila del panel queda como
        // recibo para volver a bajarlo. Si el navegador lo bloquea, la fila lo dice y deja reintentar.
        if (entregarSeguro(nombre, entregar)) notify('Tu archivo está listo', `${nombre} (${formato})`, 'success')
        else notify('No se pudo generar el archivo', 'Vuelve a intentarlo desde el panel de descargas.', 'error')
      }, 250)
      relojes.current.set(id, reloj)
    },
    [abrirPanel],
  )

  const preparando = pedidos.filter((pedido) => pedido.avance < 100).length
  return { pedidos, pedir, preparando }
}

/**
 * Pide un reporte concreto sin pasar por el panel.
 *
 * Lo usa el análisis con IA: cuando lo que hay que hacer con un hallazgo es llevarse el archivo, el botón lo prepara
 * directo en vez de abrir el panel y obligar a elegirlo otra vez (Dave, 15-oct).
 */
export function pedirReporte(centro: ReturnType<typeof useDescargas>, resultados: Resultados, tipo: TipoReporte, alcance: 'todos' | 'completaron' = 'todos') {
  const definicion = REPORTES.find((uno) => uno.id === tipo)
  if (!definicion) return
  // El periodo entra en el nombre cuando recorta algo: dos archivos del mismo contenido sacados con fechas distintas
  // no se pueden llamar igual, o en la carpeta de descargas uno pisa al otro sin avisar.
  const trozoPeriodo = resultados.periodo.activo ? `-${slugify(resultados.periodo.etiqueta)}` : ''
  const archivo = `${slugify(resultados.contenido.titulo)}-${definicion.id}-${alcance}${trozoPeriodo}-${fileStamp()}.${XLS_EXTENSION}`
  centro.pedir(definicion.titulo, definicion.formato, definicion.segundos, () => {
    saveBlob(archivo, XLS_MIME, libroDe(definicion.id, resultados))
    return true
  })
}

export function PanelDescargas({
  abierto,
  onAbierto,
  resultados,
  centro,
  pestana,
  onPestana,
}: {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  resultados: Resultados
  centro: ReturnType<typeof useDescargas>
  pestana: 'reportes' | 'descargas'
  onPestana: (pestana: 'reportes' | 'descargas') => void
}) {
  const disponibles = useMemo(() => reportesDe(resultados), [resultados])
  const [elegido, setElegido] = useState<TipoReporte>('progreso')
  const [soloCompletaron, setSoloCompletaron] = useState(false)

  const definicion = disponibles.find((reporte) => reporte.id === elegido)

  // A quiénes incluye el archivo, para el nombre y para lo que lleva dentro.
  const alcance = soloCompletaron ? 'completaron' : 'todos'

  const descargar = () => {
    if (definicion) pedirReporte(centro, resultados, definicion.id, alcance)
    // Se salta a «Descargas» al pedir: ahí es donde pasa lo siguiente, y así se ve que el pedido se registró.
    onPestana('descargas')
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbierto}
      title="Descargas"
      description="Elige el archivo que necesitas y sigue aquí su preparación."
      // El icono en la cabecera del panel, igual que el de Resultados de encuestas (Dave, 15-oct).
      icon={Download04Icon}
      size="md"
      footer={
        pestana === 'reportes' ? (
          <Button className="w-full" onClick={descargar}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
            Preparar archivo
          </Button>
        ) : undefined
      }
    >
      {/* Sin pestañas: no hay historial de descargas que enseñar. Los archivos no se guardan en ningún lado —se
          arman con los datos de la pantalla y salen—, así que una lista de «lo que pediste antes» prometía algo que
          no existe (Cristian Niño, 14-oct). Lo que se está preparando se sigue viendo en el Centro de procesos. */}
      <div className="flex flex-col gap-5">
        <Frame>
          <FrameHeader>
            <FrameTitle>Tipo de reporte</FrameTitle>
            <FrameDescription>Elige qué archivo quieres descargar.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <RadioGroup value={elegido} onValueChange={(valor) => setElegido(valor as TipoReporte)} className="grid gap-2" aria-label="Tipo de archivo">
              {disponibles.map((reporte) => (
                <OpcionReporte key={reporte.id} id={reporte.id} titulo={reporte.titulo} descripcion={reporte.descripcion} formato={reporte.formato} icono={reporte.icono} />
              ))}
            </RadioGroup>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>A quiénes incluir</FrameTitle>
            {/* El archivo sale con el periodo de la pantalla puesto, y hay que decirlo aquí: desde el panel ya no se
                ve el filtro, y quien pide el archivo da por hecho que va todo (Dave, 14-oct). */}
            <FrameDescription>
              Por defecto van todas las personas que lo han iniciado.
              {resultados.periodo.activo ? ` Solo en el periodo seleccionado: ${resultados.periodo.etiqueta.toLowerCase()}.` : ''}
            </FrameDescription>
          </FrameHeader>
          <FramePanel>
            {/* Sin la línea de cuántas personas son: la cabecera del marco ya dice a quiénes incluye por defecto, y
                debajo repetía el mismo dato con otras palabras (Dave, 15-oct). */}
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel>Solo quienes completaron el contenido</FieldLabel>
              </FieldContent>
              <Checkbox checked={soloCompletaron} onCheckedChange={(valor) => setSoloCompletaron(valor === true)} aria-label="Solo quienes completaron el contenido" />
            </Field>
          </FramePanel>
        </Frame>

        {/* Lo que se está preparando ahora mismo, para no tener que cerrar el panel para verlo. */}
        {centro.pedidos.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Text as="span" size="xs" weight="semibold" variant="muted">
              Preparando
            </Text>
            {centro.pedidos.map((pedido) => (
              <FilaPedido key={pedido.id} pedido={pedido} />
            ))}
          </div>
        ) : null}
      </div>
    </DrawerShell>
  )
}

function OpcionReporte({ id, titulo, descripcion, formato, icono }: { id: string; titulo: string; descripcion: string; formato: string; icono: IconSvgElement }) {
  return (
    <FieldLabel className="hover:bg-accent/40 has-data-[checked]:border-primary flex cursor-pointer items-start gap-3 rounded-lg border p-3">
      <RadioGroupItem value={id} className="mt-1" />
      <IconTile className="shrink-0">
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <Text as="span" size="sm" weight="semibold">
            {titulo}
          </Text>
          <Badge variant="secondary" size="xs">
            {formato}
          </Badge>
        </span>
        <Text as="span" size="xs" variant="muted">
          {descripcion}
        </Text>
      </span>
    </FieldLabel>
  )
}

function FilaPedido({ pedido }: { pedido: Pedido }) {
  const listo = pedido.avance >= 100
  return (
    // Sin marco: la zona gris de un Frame es para un título y una bajada, y aquí no hay ninguno de los dos. La fila
    // se sostiene sola con su borde (Dave, 14-oct).
    <div className="border-border flex items-center gap-3 rounded-lg border p-3">
        <HugeiconsIcon icon={listo ? CheckmarkCircle02Icon : Loading03Icon} size={20} className={listo ? 'text-success shrink-0' : 'text-muted-foreground shrink-0 animate-spin'} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="span" size="sm" weight="semibold" className="truncate">
            {pedido.nombre}
          </Text>
          <Text as="span" size="xs" variant="muted" className="tabular-nums">
            {pedido.formato} · {fechaHora(pedido.pedido)}
          </Text>
          {listo ? null : <Progress value={pedido.avance} aria-label={`Preparando ${pedido.nombre}`} />}
        </div>
        {listo ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Volver a bajarlo: el archivo se arma de nuevo con los mismos datos, no se guarda en ningún lado.
              if (entregarSeguro(pedido.nombre, pedido.entregar)) notify('Descargando', `${pedido.nombre} (${pedido.formato})`, 'success')
              else notify('No se pudo generar el archivo', 'Puede que el navegador lo haya bloqueado.', 'error')
            }}
          >
            <HugeiconsIcon icon={Download04Icon} aria-hidden="true" />
            Descargar
          </Button>
        ) : (
          <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
            {Math.round(pedido.avance)}%
          </Text>
        )}
    </div>
  )
}
