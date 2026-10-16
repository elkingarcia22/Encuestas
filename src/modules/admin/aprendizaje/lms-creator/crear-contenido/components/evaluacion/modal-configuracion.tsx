import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PercentIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Switch,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { setBorrador, useBorrador, type ConfigEvaluacion } from '../borrador'

// «Configuración de la evaluación»: una sola para todo el contenido (la comparten todas las páginas de evaluación y la
// cambia también el agente). El borrador se toma al abrir; «Cancelar» o cerrar lo descartan. Es la única ventana del
// sistema (ActionDialog, decisión 4 de la auditoría, 5-oct).

type Props = { abierto: boolean; onCerrar: () => void }

/**
 * Los ajustes del recurso. **Una encuesta ajusta mucho menos que una evaluación**: solo el orden aleatorio de las
 * preguntas y el de las opciones. Lo demás —porcentaje para aprobar, intentos, tiempo límite, cuántas preguntas por
 * intento— es de algo que se califica, y una encuesta no se califica (comprobado en el Creator real, 7-oct).
 */
export function ModalConfiguracion({ abierto, onCerrar, encuesta = false }: Props & { encuesta?: boolean }) {
  // Cada apertura monta un formulario nuevo (lee la configuración vigente); al cerrar se queda montado para que la
  // animación de salida no muestre la ventana vacía.
  const [vez, setVez] = useState(0)
  const [estabaAbierto, setEstabaAbierto] = useState(abierto)
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto)
    if (abierto) setVez((v) => v + 1)
  }

  return (
    <Formulario key={vez} abierto={abierto} onCerrar={onCerrar} encuesta={encuesta} />
  )
}

const numero = (texto: string, minimo: number) => Math.max(minimo, Number(texto) || minimo)

function Formulario({ abierto, onCerrar, encuesta }: Props & { encuesta: boolean }) {
  const id = useId()
  const { configEvaluacion } = useBorrador()
  const [borrador, setBorradorLocal] = useState<ConfigEvaluacion>(configEvaluacion)
  const poner = (cambio: Partial<ConfigEvaluacion>) => setBorradorLocal((previo) => ({ ...previo, ...cambio }))

  const guardar = () => {
    setBorrador({ configEvaluacion: borrador })
    notify('Ajustes guardados.')
    onCerrar()
  }

  const interruptor = (clave: keyof ConfigEvaluacion, etiqueta: string) => (
    <Field orientation="horizontal" className="justify-between">
      <FieldLabel htmlFor={`${id}-${clave}`}>
        {etiqueta}
      </FieldLabel>
      <Switch id={`${id}-${clave}`} checked={Boolean(borrador[clave])} onCheckedChange={(v) => poner({ [clave]: v })} />
    </Field>
  )

  const cifra = (clave: 'intentos' | 'minutos' | 'preguntasPorIntento', etiqueta: string) => (
    <Field className="pl-4">
      <FieldLabel htmlFor={`${id}-${clave}-valor`}>{etiqueta}</FieldLabel>
      <Input
        id={`${id}-${clave}-valor`}
        type="number"
        min={1}
        value={String(borrador[clave])}
        onChange={(e) => poner({ [clave]: numero(e.target.value, 1) })}
        className="sm:max-w-40"
      />
    </Field>
  )

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size="sm"
      title="Configuración de la evaluación"
      footer={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar</Button>
        </>
      }
    >
      <FieldGroup className="gap-4">
        {/* Etiqueta a la izquierda y el campo a la derecha, como las filas de los interruptores. */}
        <Field orientation="horizontal" className={`justify-between ${encuesta ? 'hidden' : ''}`}>
          <FieldLabel htmlFor={`${id}-aprobacion`}>Porcentaje requerido para aprobar</FieldLabel>
          <InputGroup className="w-24 shrink-0">
            <InputGroupInput
              id={`${id}-aprobacion`}
              inputMode="numeric"
              placeholder="70"
              value={String(borrador.aprobacion)}
              onChange={(e) => poner({ aprobacion: Math.min(100, Number(e.target.value.replace(/\D/g, '')) || 0) })}
            />
            <InputGroupAddon align="inline-end">
              <HugeiconsIcon icon={PercentIcon} size={14} aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {interruptor('preguntasAleatorias', 'Preguntas en orden aleatorio')}
        {interruptor('opcionesAleatorias', 'Opciones de respuesta en orden aleatorio')}
        {encuesta ? null : (
          <>
            {interruptor('limitarIntentos', 'Limitar número de intentos')}
            {borrador.limitarIntentos ? cifra('intentos', 'Número máximo de intentos') : null}
            {interruptor('tiempoLimite', 'Tiempo límite para responder')}
            {borrador.tiempoLimite ? cifra('minutos', 'Tiempo límite (minutos)') : null}
            {interruptor('limitarPreguntas', 'Limitar número de preguntas a mostrar por intento')}
            {borrador.limitarPreguntas ? cifra('preguntasPorIntento', 'Preguntas por intento') : null}
          </>
        )}
      </FieldGroup>
    </ActionDialog>
  )
}
