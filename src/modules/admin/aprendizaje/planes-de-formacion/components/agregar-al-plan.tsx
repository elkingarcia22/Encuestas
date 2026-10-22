import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon } from '@hugeicons/core-free-icons'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle, RadioGroup, RadioGroupItem } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { plural } from '@/modules/design-system/patrones/formato'
import { PanelIntegrantes } from './panel-integrantes'
import { ICONO_ALCANCE } from './agregar-asignacion'
import { SALIDA_PANEL, TIPOS, nombreAsignacion, personasDelPlan, sinQuitados, sumarPersonas, usuarioDelPlan, type Plan } from './planes-datos'
import { nombreCompleto } from './grupos-datos'

// «Agregar personas» al plan que ya corre: el caso de Juan, que acaban de contratar y tiene que recibir lo mismo que los
// demás sin volver a elegir contenidos (la primera pregunta de implementación, war room del 14-oct). Dos preguntas, en
// el orden en que se piensan:
// 1. ¿Qué reciben? Lo mismo que una asignación (por su nombre o sus fichas) o todo el plan. Con una sola asignación no se
//    pregunta: reciben lo de esa.
// 2. ¿Quiénes? La lista de colaboradores de siempre.
// Entran a la asignación elegida: quedan con sus contenidos y, si después cambian, también les cambian.

const TODO = 'todo'

export function AgregarAlPlan({ plan, onCambio, onCerrar }: { plan: Plan; onCambio: (plan: Plan) => void; onCerrar: () => void }) {
  const textos = TIPOS[plan.tipo]
  const unaSola = plan.asignaciones.length === 1
  const [destino, setDestino] = useState<string>(unaSola ? plan.asignaciones[0].id : '')
  const [paso, setPaso] = useState<'que' | 'saliendo' | 'quienes'>(unaSola ? 'quienes' : 'que')

  const elegida = plan.asignaciones.find((a) => a.id === destino)
  const todos = new Set(plan.asignaciones.flatMap((a) => a.items))
  const reciben = destino === TODO ? todos.size : (elegida?.items.length ?? 0)
  const cuantos = (n: number) => `${n} ${plural(n, textos.item, textos.items)}`
  const lista = (items: string[]) => `${items.slice(0, 2).join(', ')}${items.length > 2 ? ` y ${items.length - 2} más` : ''}`

  // Del primer paso al segundo: la ventana se cierra y, cuando terminó de salir, entra el panel (nunca dos a la vez).
  // La ventana avisa que se cerró antes de avisar que se confirmó: se espera un instante para saber si fue cancelar.
  const siguiendo = useRef(false)
  const seguir = () => {
    siguiendo.current = true
    setPaso('saliendo')
    window.setTimeout(() => setPaso('quienes'), SALIDA_PANEL)
  }
  const alCerrarVentana = (abierto: boolean) => {
    if (abierto) return
    window.setTimeout(() => (siguiendo.current ? undefined : onCerrar()), 0)
  }

  const agregar = (usuarios: string[]) => {
    const enElPlan = new Set(personasDelPlan(plan).map((p) => p.usuario))
    const nuevos = usuarios.filter((id) => !enElPlan.has(id))
    const yaEstaban = usuarios.length - nuevos.length
    const asignaciones = plan.asignaciones.map((a) => (destino === TODO || a.id === destino ? sumarPersonas(a, usuarios) : a))
    onCambio(sinQuitados({ ...plan, asignaciones }, usuarios))
    const que = `${cuantos(reciben)}${destino === TODO ? ', todos los del plan' : elegida ? ` de «${nombreAsignacion(elegida)}»` : ''}`
    const quien = (ids: string[]) => (ids.length === 1 ? nombreCompleto(usuarioDelPlan(ids[0])!) : `${ids.length} personas`)
    // Quien ya estaba por otra asignación no «entra»: suma lo de esta.
    const titulo = nuevos.length ? `${quien(nuevos)} ${nuevos.length === 1 ? 'entra' : 'entran'} al plan` : `${quien(usuarios)} ya ${usuarios.length === 1 ? 'estaba' : 'estaban'} en el plan`
    const detalle = `${nuevos.length ? `Con ${que}.` : `Ahora también ${usuarios.length === 1 ? 'recibe' : 'reciben'} ${que}.`}${nuevos.length && yaEstaban ? ` ${yaEstaban} ya ${yaEstaban === 1 ? 'estaba' : 'estaban'} y suman estos.` : ''} Se aplica al guardar.`
    notify(titulo, detalle, 'info')
    onCerrar()
  }

  return (
    <>
      <ActionDialog
        open={paso === 'que'}
        onOpenChange={alCerrarVentana}
        title="Agregar personas al plan"
        sub="¿Qué reciben? Después eliges a quiénes."
        confirmLabel="Elegir personas"
        confirmDisabled={!destino}
        onConfirm={seguir}
      >
        <RadioGroup value={destino} onValueChange={(valor) => setDestino(String(valor))} className="flex flex-col gap-3" aria-label="Qué reciben">
          {plan.asignaciones.map((a) => (
            <FieldLabel key={a.id} htmlFor={`recibe-${a.id}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <HugeiconsIcon icon={ICONO_ALCANCE[a.alcance]} size={16} aria-hidden="true" />
                    Lo mismo que «{nombreAsignacion(a)}»
                  </FieldTitle>
                  <FieldDescription>
                    {cuantos(a.items.length)}: {lista(a.items)}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={a.id} id={`recibe-${a.id}`} />
              </Field>
            </FieldLabel>
          ))}
          <FieldLabel htmlFor="recibe-todo">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  <HugeiconsIcon icon={BookOpen01Icon} size={16} aria-hidden="true" />
                  Todo el plan
                </FieldTitle>
                <FieldDescription>Los {cuantos(todos.size)} del plan. Entran a todas las asignaciones.</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={TODO} id="recibe-todo" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </ActionDialog>

      {paso === 'quienes' ? (
        <PanelIntegrantes
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : onCerrar())}
          titulo="Agregar personas al plan"
          grupo=""
          descripcion={`Reciben ${destino === TODO ? `todo el plan: ${cuantos(reciben)}` : `lo mismo que «${elegida ? nombreAsignacion(elegida) : ''}»: ${cuantos(reciben)}`}. Quien ya está en el plan no se duplica.`}
          elegidos={[]}
          accion="Agregar"
          onGuardar={agregar}
        />
      ) : null}
    </>
  )
}
