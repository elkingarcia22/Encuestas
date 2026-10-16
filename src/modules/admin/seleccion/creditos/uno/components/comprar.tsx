import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CreditCardIcon, SecurityCheckIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
  Text,
} from '@ubits/flux-ui'
import { notify, notifyAction } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import {
  PAQUETES_SUELTOS,
  PRECIO_PLAN,
  PRECIO_SUELTO,
  creditos,
  dolares,
  registroDeCompras,
  registroDeRecarga,
  useRecarga,
  type Bolsa,
} from '../../../propuestas/creditos'
import { useAccion } from '../../../propuestas/components/carga'
import { noSeGuardo } from '../../../propuestas/simular'

// Comprar créditos sin pasar por el ejecutivo de UBITS (8 oct, VP de producto: «si quieres comprar más créditos los vas
// a comprar un poco más caros porque no están dentro de un paquete de contrato, pero puedes comprar 500 dólares de
// créditos porque solo necesitas salir de algo súper urgente… o sigues pagando con ese auto-reload»).
//
// En el cajón, de arriba abajo: cuántos (cuatro paquetes con su precio), por qué cuestan más que en el plan, la recarga
// automática y cómo se paga. El pago es en la página de Stripe: aquí no se escribe ninguna tarjeta. Lo comprado entra
// sin asignar a la bolsa y desde el aviso se reparte. El paquete grande se sigue hablando con el ejecutivo.

const UMBRALES = [500, 1_000, 2_000]

export function ComprarCreditos({
  open,
  onOpenChange,
  bolsa,
  onReasignar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bolsa: Bolsa
  onReasignar: () => void
}) {
  const recarga = useRecarga()
  const [cantidad, setCantidad] = useState(PAQUETES_SUELTOS[1])
  const [automatica, setAutomatica] = useState(Boolean(recarga))
  const [umbral, setUmbral] = useState(recarga?.umbral ?? UMBRALES[1])
  const accion = useAccion(1600)
  const precio = cantidad * PRECIO_SUELTO
  const enElPlan = cantidad * PRECIO_PLAN

  const pagar = () => {
    // Si el pago no pasa (la tarjeta, la conexión), no se cobra nada: el panel sigue abierto y el aviso deja reintentar.
    if (noSeGuardo(`pago:${cantidad}`, 'No se pudo hacer el pago', () => accion.correr(pagar), 'No se cobró nada. Revisa la tarjeta e inténtalo otra vez.')) return
    // Sin «Deshacer»: una compra pagada no se revierte desde un aviso (se pide a soporte).
    registroDeCompras.comprar(cantidad, `Compra con tarjeta · ${dolares(precio)}, sin contrato`)
    registroDeRecarga.poner(automatica ? { umbral, cantidad } : null)
    onOpenChange(false)
    notifyAction(
      `Entraron ${creditos(cantidad)} créditos`,
      `Pagaste ${dolares(precio)}. Repártelos entre los agentes.`,
      { label: 'Repartir', onClick: onReasignar },
      'success',
    )
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(abrir) => (accion.enCurso && !abrir ? undefined : onOpenChange(abrir))}
      size="md"
      icon={CreditCardIcon}
      title="Comprar créditos"
      description="Entran al momento a tu bolsa, sin contrato. Pagas con tarjeta en la página segura de Stripe."
      footer={
        <div className="flex w-full items-center gap-2">
          <Text as="span" variant="muted" size="sm" role="status" className="min-w-0 flex-1">
            {creditos(cantidad)} créditos · {dolares(precio)}
          </Text>
          <Button variant="outline" disabled={accion.enCurso} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={accion.enCurso} onClick={() => accion.correr(pagar)}>
            {accion.enCurso ? <Spinner /> : null}
            {accion.enCurso ? 'Abriendo el pago…' : `Pagar ${dolares(precio)}`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* 1 · Cuántos. Con lo libre de hoy, para que se vea si alcanza. */}
        <Field>
          <FieldLabel>¿Cuántos créditos?</FieldLabel>
          <FieldDescription>Hoy te quedan {creditos(bolsa.sinAsignar)} sin asignar en la bolsa.</FieldDescription>
          <RadioGroup value={String(cantidad)} onValueChange={(valor) => setCantidad(Number(valor))} className="grid gap-2 sm:grid-cols-2">
            {PAQUETES_SUELTOS.map((paquete) => (
              <FieldLabel key={paquete} htmlFor={`comprar-${paquete}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle className="tabular-nums">{creditos(paquete)} créditos</FieldTitle>
                    <FieldDescription className="tabular-nums">{dolares(paquete * PRECIO_SUELTO)}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={String(paquete)} id={`comprar-${paquete}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </Field>

        {/* 2 · Por qué cuestan más: dicho con la cuenta, no escondido en una nota al pie. */}
        <Alert>
          <HugeiconsIcon icon={CreditCardIcon} size={16} />
          <AlertTitle>Sueltos cuestan más que en tu plan</AlertTitle>
          <AlertDescription>
            Cada crédito sale a {dolares(PRECIO_SUELTO)} y no a {dolares(PRECIO_PLAN)}: estos {creditos(cantidad)} en tu plan costarían{' '}
            {dolares(enElPlan)}. Si compras seguido, en la renovación te conviene un paquete más grande.
          </AlertDescription>
        </Alert>

        {/* 3 · La recarga automática, apagada hasta que se prenda. */}
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="comprar-automatica">Recargar sola cuando se acabe</FieldLabel>
            <FieldDescription>
              Compra {creditos(cantidad)} créditos con la misma tarjeta cuando queden pocos, para que ningún agente se pause. La apagas cuando
              quieras.
            </FieldDescription>
          </FieldContent>
          <Switch id="comprar-automatica" checked={automatica} onCheckedChange={setAutomatica} />
        </Field>
        {automatica ? (
          <Field orientation="horizontal">
            <FieldLabel htmlFor="comprar-umbral" className="flex-1">
              Cuando queden menos de
            </FieldLabel>
            <Select value={String(umbral)} onValueChange={(valor) => setUmbral(Number(valor))}>
              <SelectTrigger id="comprar-umbral" size="sm" className="w-40">
                <SelectValue>{(valor: string) => `${creditos(Number(valor))} créditos`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {UMBRALES.map((uno) => (
                  <SelectItem key={uno} value={String(uno)}>
                    {creditos(uno)} créditos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {/* 4 · Cómo se paga. */}
        <div className="flex items-start gap-2.5">
          <HugeiconsIcon icon={SecurityCheckIcon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Text as="p" variant="muted" size="sm">
            Al pagar te llevamos a Stripe. UBITS no ve ni guarda los datos de tu tarjeta, y la factura llega al correo de facturación de tu
            empresa.
          </Text>
        </div>

        {/* El camino de siempre, para lo grande. */}
        <Button
          variant="link"
          className="h-auto! w-fit p-0!"
          onClick={() => notify('Te contacta tu ejecutivo de UBITS', 'Le avisamos que quieres un paquete más grande.', 'success')}
        >
          ¿Un paquete más grande? Pídeselo a tu ejecutivo
        </Button>
      </div>
    </DrawerShell>
  )
}
