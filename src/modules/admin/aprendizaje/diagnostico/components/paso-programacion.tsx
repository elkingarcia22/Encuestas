import { FILA_INTERRUPTOR } from '@/shared/components/estilos-propios'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Field,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FieldError,
  FieldLabel,
  Switch,
  Text,
  cn,
} from '@ubits/flux-ui'
import { RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import { diaBloqueado, FECHA_COMPLETA, problemaDe, type Medida } from './programacion'

// Paso 3 · Programación. En producción esto llegaba después de «Crear» —la prueba ya existía cuando se elegían las
// fechas—, el calendario dejaba elegir días que luego no servían y «Activar» sin fechas decía que había funcionado. Aquí
// las dos medidas se programan antes de crear, con fechas sugeridas que ya cumplen las reglas; lo que no se puede
// elegir sale deshabilitado en el calendario, y cada medida dice qué va a pasar y cuándo. También se puede dejar para
// después: la prueba nace inactiva y se activa desde Diagnóstico.

type PropsMedida = {
  id: string
  titulo: string
  cuando: string
  medida: Medida
  minimo: Date
  personas: number
  /** No se puede programar (el plan ya terminó): se explica y no se ofrece. */
  noAplica?: string
  /** Un aviso sobre la medida que no impide programarla. */
  aviso?: string
  mostrarErrores: boolean
  onCambio: (medida: Medida) => void
}

function TarjetaMedida({ id, titulo, cuando, medida, minimo, noAplica, aviso, mostrarErrores, onCambio }: PropsMedida) {
  const problema = medida.programar ? problemaDe(medida.ventana, minimo) : null

  return (
    <Frame>
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <FrameTitle>{titulo}</FrameTitle>
          <FrameDescription>{cuando}</FrameDescription>
        </div>
        <div className="shrink-0">
          {noAplica ? (
            <Badge variant="secondary">No aplica</Badge>
          ) : (
            <FieldLabel htmlFor={`${id}-programar`} className={cn('gap-2', FILA_INTERRUPTOR)}>
              <Text as="span" size="sm">
                Habilitar
              </Text>
              <Switch id={`${id}-programar`} checked={medida.programar} onCheckedChange={(programar) => onCambio({ ...medida, programar })} />
            </FieldLabel>
          )}
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-4">
        {noAplica ? (
          <Text size="sm" variant="muted">
            {noAplica}
          </Text>
        ) : medida.programar ? (
          <>
            <Field data-invalid={mostrarErrores && problema ? true : undefined}>
              <FieldLabel htmlFor={`${id}-fechas`}>Rango de fechas para responderlo</FieldLabel>
              <RangoDeFechas
                id={`${id}-fechas`}
                valor={medida.ventana}
                desde={minimo}
                deshabilitar={diaBloqueado(minimo)}
                invalido={mostrarErrores && Boolean(problema)}
                placeholder="Elige cuándo abre y cuándo cierra"
                onCambio={(ventana) => onCambio({ ...medida, ventana })}
              />
              {mostrarErrores && problema ? <FieldError>{problema}</FieldError> : null}
            </Field>

          </>
        ) : null}
        {aviso && !noAplica ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertDescription>
              <p>{aviso}</p>
            </AlertDescription>
          </Alert>
        ) : null}
      </FramePanel>
    </Frame>
  )
}

type Props = {
  planTermino: boolean
  planEmpezo: boolean
  inicioPlan: Date
  finPlan: Date
  personas: number
  inicial: Medida
  seguimiento: Medida
  minimoInicial: Date
  minimoSeguimiento: Date
  mostrarErrores: boolean
  onInicial: (medida: Medida) => void
  onSeguimiento: (medida: Medida) => void
}

export function PasoProgramacion(props: Props) {
  const { planTermino, planEmpezo, inicioPlan, finPlan, personas, inicial, seguimiento, minimoInicial, minimoSeguimiento, mostrarErrores } = props
  return (
    <div className="flex flex-col gap-4">
      {/* Lo único que hace falta saber para decidir: cuándo corre el plan y dónde cae bien cada assessment. Las fechas
          no están restringidas (30-sep-2026), así que esto es una recomendación, no un límite. */}
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>
          El plan de competencias seleccionado va del {FECHA_COMPLETA.format(inicioPlan)} al {FECHA_COMPLETA.format(finPlan)}
        </AlertTitle>
        <AlertDescription>
          <p>
            Se recomienda hacer el <strong>Assessment inicial antes de la fecha de inicio</strong> y el{' '}
            <strong>Assessment de seguimiento después de la fecha de finalización</strong>; sin embargo, eres libre de elegir otras fechas.
          </p>
        </AlertDescription>
      </Alert>

      {/* Ni el plan empezado ni el terminado bloquean: el inicial se recomienda antes de que arranque —mide el punto
          de partida—, así que llega apagado y con su aviso, pero se puede encender igual. */}
      <TarjetaMedida
        id="as-inicial"
        titulo="Assessment inicial"
        cuando="Conoce el nivel de tus colaboradores antes de estudiar un plan."
        medida={inicial}
        minimo={minimoInicial}
        personas={personas}
        aviso={
          planTermino
            ? 'Este plan ya terminó. El assessment inicial se recomienda solo para planes que no han empezado, porque mide el punto de partida. Puedes activarlo de todas formas.'
            : planEmpezo
              ? 'Este plan ya empezó. El assessment inicial se recomienda solo para planes que no han empezado, porque mide el punto de partida. Puedes activarlo de todas formas.'
              : undefined
        }
        mostrarErrores={mostrarErrores}
        onCambio={props.onInicial}
      />

      <TarjetaMedida
        id="as-seguimiento"
        titulo="Assessment de seguimiento"
        cuando="Conoce el nivel de tus colaboradores después de estudiar un plan."
        medida={seguimiento}
        minimo={minimoSeguimiento}
        personas={personas}
        mostrarErrores={mostrarErrores}
        onCambio={props.onSeguimiento}
      />
    </div>
  )
}
