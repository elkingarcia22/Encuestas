import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Flowchart01Icon,
  PencilEdit02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
  Separator,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Switch,
  Timeline,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { iconoDeCategoria } from './iconos-etapas'
import { CampoNumero } from './piezas'
import { pendienteEtapa, resumenEtapa, type AjustesCv, type EtapaFlujo } from './etapas'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'

type Props = {
  etapas: EtapaFlujo[]
  onEtapas: (etapas: EtapaFlujo[]) => void
  onConfigurar: (clave: string) => void
  // «Configurar con IA», al final de la fila de cada etapa que se configura en panel; `porIa` es la que está en eso.
  onConfigurarConIa?: (clave: string) => void
  porIa?: string | null
  onRecomendado: () => void
  // Solo para las etapas que creó el equipo: cambiar su nombre o categoría desde la propia tarjeta.
  onEditarPropia: (etapa: EtapaFlujo) => void
  // «Agregar etapa»: va al final de la lista, como el siguiente paso del flujo.
  agregar: ReactNode
  abierta: string | null
  onAbierta: (clave: string | null) => void
  mostrarErrores: boolean
}

// El orden en que el candidato va pasando por las etapas, como una línea de tiempo numerada. Se
// reordena arrastrando (o con las flechas desde el asidero), cada etapa con IA abre su propia
// configuración y al final está «Agregar etapa».
export function FlujoCandidato({ etapas, onEtapas, onConfigurar, onConfigurarConIa, porIa, onRecomendado, onEditarPropia, agregar, abierta, onAbierta, mostrarErrores }: Props) {
  const conIa = etapas.filter((etapa) => etapa.conIa).length

  const mover = (clave: string, salto: number) => {
    const desde = etapas.findIndex((etapa) => etapa.clave === clave)
    const hasta = desde + salto
    if (desde < 0 || hasta < 0 || hasta >= etapas.length) return
    const resto = etapas.filter((_etapa, indice) => indice !== desde)
    onEtapas([...resto.slice(0, hasta), etapas[desde], ...resto.slice(hasta)])
  }

  const cambiar = (clave: string, cambio: Partial<EtapaFlujo>) =>
    onEtapas(etapas.map((etapa) => (etapa.clave === clave ? { ...etapa, ...cambio } : etapa)))

  return (
    <Frame className="min-w-0">
      {/* Cuántas etapas y cuántas con IA, en la frase y no en dos insignias diminutas a la derecha (5 oct, Nicolás: «¿eso
          por qué es tan pequeño?»). Abajo ya no se repite: el pie queda para agregar etapas. */}
      <FrameHeader>
        <FrameTitle>Flujo del candidato</FrameTitle>
        <FrameDescription aria-live="polite">
          {etapas.length === 0
            ? 'Orden en que avanza el candidato.'
            : `Orden en que avanza el candidato: ${etapas.length} ${etapas.length === 1 ? 'etapa' : 'etapas'}${conIa ? `, ${conIa} con IA` : ''}.`}
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        {etapas.length === 0 ? (
          <Empty className="rounded-xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Flowchart01Icon} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>El flujo está vacío</EmptyTitle>
              <EmptyDescription>
                Empieza con el flujo recomendado (cinco etapas, dos con IA) y ajústalo, o arma el tuyo con «Agregar etapa».
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <BotonIaSecundario onClick={onRecomendado}>Usar el flujo recomendado</BotonIaSecundario>
            </EmptyContent>
          </Empty>
        ) : (
          // value={0}: ninguna etapa se pinta como «cumplida»; aquí la línea solo ordena.
          <Timeline value={0} className="pt-1">
            <Sortable value={etapas} onValueChange={onEtapas} getItemValue={(etapa) => etapa.clave} className="flex flex-col">
              {etapas.map((etapa, indice) => (
                // El elemento arrastrable es la propia fila de la línea de tiempo: así el número y la
                // línea se mueven junto con la tarjeta.
                <SortableItem key={etapa.clave} value={etapa.clave} render={<TimelineItem step={indice + 1} />}>
                  <TimelineHeader>
                    {/* La línea arranca bajo el círculo numerado (24px) y termina antes del siguiente. */}
                    <TimelineSeparator className="translate-y-[26px]! h-[calc(100%-28px)]!" />
                    <TimelineIndicator className="flex size-6 items-center justify-center bg-card text-xs font-medium tabular-nums">
                      {indice + 1}
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TarjetaEtapa
                    etapa={etapa}
                    abierta={abierta === etapa.clave}
                    mostrarErrores={mostrarErrores}
                    onAbierta={(valor) => onAbierta(valor ? etapa.clave : null)}
                    onConfigurar={() => onConfigurar(etapa.clave)}
                    onConfigurarConIa={onConfigurarConIa ? () => onConfigurarConIa(etapa.clave) : undefined}
                    configurandoConIa={porIa === etapa.clave}
                    onCambio={(cambio) => cambiar(etapa.clave, cambio)}
                    onQuitar={() => onEtapas(etapas.filter((otra) => otra.clave !== etapa.clave))}
                    onEditar={() => onEditarPropia(etapa)}
                    onMover={(salto) => mover(etapa.clave, salto)}
                  />
                </SortableItem>
              ))}
            </Sortable>
          </Timeline>
        )}
        {/* El pie, como el de «Datos demográficos» en Encuestas: la acción para sumar otra etapa. Cuántas hay ya lo dice
            la cabecera; sin ninguna, aquí se dice cómo empezar. */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {etapas.length === 0 ? (
            <Text as="p" size="sm" variant="muted">
              Todavía no hay etapas: usa el flujo recomendado o agrega una.
            </Text>
          ) : null}
          <div className="ml-auto">{agregar}</div>
        </div>
      </FramePanel>
    </Frame>
  )
}

function TarjetaEtapa({
  etapa,
  abierta,
  onAbierta,
  onConfigurar,
  onConfigurarConIa,
  configurandoConIa,
  onCambio,
  onQuitar,
  onEditar,
  onMover,
  mostrarErrores,
}: {
  etapa: EtapaFlujo
  abierta: boolean
  mostrarErrores: boolean
  onAbierta: (abierta: boolean) => void
  onConfigurar: () => void
  onConfigurarConIa?: () => void
  configurandoConIa: boolean
  onCambio: (cambio: Partial<EtapaFlujo>) => void
  onQuitar: () => void
  onEditar: () => void
  onMover: (salto: number) => void
}) {
  // Si le falta configuración, eso es lo que se lee en la tarjeta en vez del resumen.
  const pendiente = pendienteEtapa(etapa)
  const resumen = pendiente ?? resumenEtapa(etapa)
  const { icono, tono } = iconoDeCategoria(etapa.categoria)
  // La evaluación de CV se ajusta con tres campos: cabe en la propia tarjeta y no necesita panel.
  const enLaTarjeta = etapa.configuracion === 'cv'
  const enPanel = etapa.configuracion === 'pruebas' || etapa.configuracion === 'idiomas' || etapa.configuracion === 'roleplay' || etapa.configuracion === 'entrevista'

  return (
    <Collapsible open={abierta && enLaTarjeta} onOpenChange={onAbierta}>
      <Item variant="outline" className="flex-wrap">
        {/* El asidero va sobre un botón para poder llegar a él con el tabulador: con él enfocado,
            las flechas cambian la etapa de sitio sin usar el ratón. */}
        <SortableItemHandle
          onKeyDown={(evento) => {
            if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return
            const arrastrando = evento.currentTarget.closest('[data-slot="sortable-item"]')?.getAttribute('data-dragging')
            if (arrastrando === 'true') return
            evento.preventDefault()
            onMover(evento.key === 'ArrowUp' ? -1 : 1)
          }}
          render={<BotonIcono aria-label={`Mover ${etapa.nombre}`} className="-ms-2 shrink-0 text-muted-foreground!" />}
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} size={18} aria-hidden="true" />
        </SortableItemHandle>

        <ItemMedia>
          <IconTile variant="soft" size="sm" className={tono}>
            <HugeiconsIcon icon={icono} aria-hidden="true" />
          </IconTile>
        </ItemMedia>

        <ItemContent>
          <ItemTitle className="flex flex-wrap items-center gap-2">
            {etapa.nombre}
            {etapa.conIa ? (
              <EtiquetaIA size="xs">IA</EtiquetaIA>
            ) : null}
            {/* Aviso mientras tanto; al intentar publicar pasa a error. */}
            {pendiente ? (
              <Badge variant={mostrarErrores ? 'destructive-outline' : 'warning-outline'}>
                Falta configurar
              </Badge>
            ) : null}
          </ItemTitle>
          <ItemDescription>
            {etapa.categoria}
            {resumen ? ` · ${resumen}` : ''}
          </ItemDescription>
        </ItemContent>

        <ItemActions className="gap-1">
          {enPanel ? (
            // Con el error a la vista, «Configurar» pasa a ser la acción principal de la tarjeta.
            <Button variant={pendiente && mostrarErrores ? 'default' : 'outline'} size="sm" onClick={onConfigurar}>
              <HugeiconsIcon icon={Settings02Icon} size={16} aria-hidden="true" />
              Configurar
            </Button>
          ) : null}
          {enLaTarjeta ? (
            <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>
              <HugeiconsIcon icon={Settings02Icon} size={16} aria-hidden="true" />
              Ajustes
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" className={cn('transition-transform', abierta && 'rotate-180')} />
            </CollapsibleTrigger>
          ) : null}
          {/* Solo las que creó el equipo se pueden renombrar o cambiar de categoría; las del sistema no se tocan. */}
          {etapa.propia ? (
            <BotonIcono aria-label={`Editar ${etapa.nombre}`} onClick={onEditar}>
              <HugeiconsIcon icon={PencilEdit02Icon} size={18} />
            </BotonIcono>
          ) : null}
          <BotonIcono aria-label={`Quitar ${etapa.nombre} del flujo`} className="text-destructive!" onClick={onQuitar}>
            <HugeiconsIcon icon={Delete02Icon} size={18} />
          </BotonIcono>
          {/* La IA arma esta etapa y abre el configurador ya lleno para revisarlo (29 sep, reunión con Elkin: antes era
              un «Crear con IA» dentro del panel que abría otra pantalla sin vuelta). El botón de IA, el último. */}
          {enPanel && onConfigurarConIa ? (
            <BotonIaSecundario size="sm" disabled={configurandoConIa} onClick={onConfigurarConIa}>
              {configurandoConIa ? 'Configurando…' : 'Configurar con IA'}
            </BotonIaSecundario>
          ) : null}
        </ItemActions>

        {etapa.cv ? (
          <CollapsibleContent render={<ItemFooter className="flex-col items-stretch" />}>
            <Separator className="mb-4" />
            <AjustesEvaluacionCv ajustes={etapa.cv} onCambio={(cv) => onCambio({ cv })} />
          </CollapsibleContent>
        ) : null}
      </Item>
    </Collapsible>
  )
}

// Los ajustes de la evaluación de CV, los tres con la misma forma: una fila con el nombre y para qué sirve a la izquierda
// y el control a la derecha —los dos umbrales con su número (5 oct: antes eran deslizadores) y la pregunta de sí o no
// con su interruptor—.
function AjustesEvaluacionCv({ ajustes, onCambio }: { ajustes: AjustesCv; onCambio: (ajustes: AjustesCv) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <CampoNumero
        id="cv-rango"
        etiqueta="Margen sobre el rango salarial"
        descripcion="Cuánto puede pedir de más sin quedar fuera."
        valor={ajustes.porcentajeRango}
        onCambio={(porcentajeRango) => onCambio({ ...ajustes, porcentajeRango })}
        min={0}
        max={100}
        step={5}
        unidad="% más"
      />
      <CampoNumero
        id="cv-minimo"
        etiqueta="Puntaje mínimo del CV"
        descripcion="Por debajo de este puntaje no pasa de etapa. El máximo es 100."
        valor={ajustes.puntajeMinimo}
        onCambio={(puntajeMinimo) => onCambio({ ...ajustes, puntajeMinimo })}
        min={0}
        max={100}
        step={5}
        unidad="pts"
      />

      <Separator />

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="cv-ex-empleados">Acepta a exempleados</FieldLabel>
          <FieldDescription>Quienes ya trabajaron en la empresa pueden seguir en el proceso.</FieldDescription>
        </FieldContent>
        <Switch
          id="cv-ex-empleados"
          checked={ajustes.exEmpleados}
          onCheckedChange={(exEmpleados) => onCambio({ ...ajustes, exEmpleados })}
        />
      </Field>
    </div>
  )
}
