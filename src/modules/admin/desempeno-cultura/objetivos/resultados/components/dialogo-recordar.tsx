import { Notification01Icon } from '@hugeicons/core-free-icons'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify } from '@/shared/components/notify'
import type { Ciclo } from '../../modelo/ciclos'
import type { PersonaSeguida } from '../../modelo/resultados/seguimiento'

// «¿Enviar el recordatorio?» a quienes tienen que actualizar su avance (pregunta antes: regla «preguntar-antes»). Se
// monta donde se pidió: desde la tabla de Colaboradores, en la página; desde la ficha de la persona, dentro de su panel,
// para que se abra como vista del mismo panel y no encima (regla «preguntar-dentro-del-panel»).

export function DialogoRecordar({ ciclo, personas, onCerrar, onEnviado }: { ciclo: Ciclo; personas: readonly PersonaSeguida[] | null; onCerrar: () => void; onEnviado?: () => void }) {
  const una = personas && personas.length === 1 ? personas[0] : null
  const cuantas = personas?.length ?? 0
  return (
    <DialogoConfirmar
      abierto={personas !== null}
      onAbiertoChange={(valor) => (valor ? undefined : onCerrar())}
      icono={Notification01Icon}
      titulo="¿Enviar el recordatorio?"
      descripcion={
        una
          ? <>A {una.colaborador.name} le llega un aviso para que actualice el avance de sus objetivos en <strong className="font-semibold">{ciclo.nombre}</strong>.</>
          : <>A {cuantas} colaboradores les llega un aviso para que actualicen el avance de sus objetivos en <strong className="font-semibold">{ciclo.nombre}</strong>.</>
      }
      accion="Enviar recordatorio"
      onConfirmar={() => {
        notify(una ? `Recordamos actualizar su avance a ${una.colaborador.name}` : `Recordamos actualizar su avance a ${cuantas} personas`, ciclo.nombre, 'success')
        onEnviado?.()
        onCerrar()
      }}
    >
      {/* A quién le llega y de qué ciclo, como el recordatorio de «Para atender». */}
      {personas ? <RegistroConfirmar icono={Notification01Icon} nombre={una ? una.colaborador.name : `${cuantas.toLocaleString('es-CO')} colaboradores`} detalle={`${ciclo.nombre} · ${ciclo.estado}`} tono="neutro" /> : null}
    </DialogoConfirmar>
  )
}
