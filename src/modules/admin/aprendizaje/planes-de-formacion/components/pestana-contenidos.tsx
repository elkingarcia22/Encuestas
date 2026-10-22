import { useState } from 'react'
import { ArrowDataTransferHorizontalIcon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { CATALOGO_COMPETENCIAS, CONTENIDOS } from './catalogo'
import { PanelIntegrantes } from './panel-integrantes'
import { TablaItems } from './tabla-items'
import { MAXIMO_COMPETENCIAS, TIPOS, aplicarUsuarios, eliminarItem, itemsDelPlan, reemplazarItem, type Plan } from './planes-datos'

// «Contenidos» (o «Competencias»): el plan visto por lo que se ve, para los cambios que tocan a todos los que tienen un
// mismo contenido, sin importar su asignación. Son las acciones masivas de HU-LMS-015/021: Agregar usuario (quien no está
// en el plan entra con ese contenido), Reemplazar (1→1 en todo el plan) y Eliminar (se quita a todos).

export function PestanaContenidos({ plan, onCambio, soloLectura = false }: { plan: Plan; onCambio: (plan: Plan) => void; soloLectura?: boolean }) {
  const textos = TIPOS[plan.tipo]
  const Item = textos.item.charAt(0).toUpperCase() + textos.item.slice(1)
  const conAvance = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const [agregando, setAgregando] = useState<{ titulo: string; vez: number } | null>(null)
  const [reemplazando, setReemplazando] = useState<{ de: string; a: string } | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const quienes = (titulo: string) => itemsDelPlan(plan).find((i) => i.titulo === titulo)?.personas.map((p) => p.id) ?? []
  const aplicar = (cambios: Pick<Plan, 'asignaciones' | 'itemsPersona' | 'extras'>) => onCambio({ ...plan, ...cambios })

  return (
    <>
      <TablaItems
        plan={plan}
        conAvance={conAvance}
        acciones={
          soloLectura
            ? undefined
            : {
                onAgregarUsuario: (titulo) => setAgregando({ titulo, vez: Date.now() }),
                onReemplazar: (titulo) => setReemplazando({ de: titulo, a: '' }),
                onEliminar: setEliminando,
              }
        }
      />

      {/* RN-04: quienes ya lo tienen salen marcados; desmarcarlos se lo quita. Quien no está en el plan entra con él. */}
      {agregando ? (
        <PanelIntegrantes
          key={agregando.vez}
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : setAgregando(null))}
          titulo="Agregar usuario"
          grupo=""
          descripcion={`Quienes ven «${agregando.titulo}». Quien no está en el plan entra en una asignación nueva con este ${textos.item}.`}
          elegidos={quienes(agregando.titulo)}
          accion="Aplicar"
          onGuardar={(usuarios) => {
            const { bloqueados, ...cambios } = aplicarUsuarios(plan, agregando.titulo, usuarios, plan.tipo === 'competencias' ? MAXIMO_COMPETENCIAS : undefined)
            aplicar(cambios)
            if (bloqueados.length) {
              const quienes = `${bloqueados.slice(0, 3).join(', ')}${bloqueados.length > 3 ? ` y ${bloqueados.length - 3} más` : ''}`
              const detalle = `${quienes} ya ${plural(bloqueados.length, 'tiene', 'tienen')} 8 y no ${plural(bloqueados.length, 'recibió', 'recibieron')} «${agregando.titulo}».`
              notify('Máximo 8 competencias por asignación.', detalle, 'warning')
            } else notify(`«${agregando.titulo}» actualizado`, 'Se aplica al guardar.', 'info')
            setAgregando(null)
          }}
        />
      ) : null}

      {/* RN-06 y RN-07: reemplazar es 1→1, para todas las personas que lo tienen; el ítem actual no se ofrece. */}
      <DialogoConfirmar
        abierto={reemplazando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setReemplazando(null))}
        icono={ArrowDataTransferHorizontalIcon}
        titulo={`Reemplazar ${textos.item}`}
        descripcion={reemplazando ? `«${reemplazando.de}» se cambia por el que elijas en todas las asignaciones y en quien lo tiene ajustado. Quien ya tenía el nuevo no lo recibe dos veces.` : ''}
        accion="Reemplazar"
        deshabilitada={!reemplazando?.a}
        onConfirmar={() => {
          if (!reemplazando?.a) return
          aplicar(reemplazarItem(plan, reemplazando.de, reemplazando.a))
          setReemplazando(null)
        }}
      >
        {reemplazando ? (
          <Field>
            <FieldLabel htmlFor="reemplazo-plan">{`Nuevo ${textos.item}`}</FieldLabel>
            <Select value={reemplazando.a || null} onValueChange={(valor) => setReemplazando({ ...reemplazando, a: String(valor ?? '') })}>
              <SelectTrigger id="reemplazo-plan" className="w-full">
                <SelectValue placeholder={`Elige un ${textos.item}`} />
              </SelectTrigger>
              <SelectContent>
                {(plan.tipo === 'competencias' ? CATALOGO_COMPETENCIAS : CONTENIDOS)
                  .map((c) => c.titulo)
                  .filter((t) => t !== reemplazando.de)
                  .map((titulo) => (
                    <SelectItem key={titulo} value={titulo}>
                      {titulo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </DialogoConfirmar>

      {/* RN-08: eliminar un ítem se confirma; se quita a todas las personas del plan. */}
      <DialogoConfirmar
        abierto={eliminando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando(null))}
        size="sm"
        icono={Delete02Icon}
        titulo={`¿Quitar este ${textos.item} del plan?`}
        descripcion={eliminando ? `«${eliminando}» deja de llegarle a las ${quienes(eliminando).length.toLocaleString('es-CO')} personas que lo ven, en todas las asignaciones. Lo que ya avanzaron se conserva. Se aplica al guardar.` : ''}
        accion={`Quitar ${textos.item}`}
        destructiva
        onConfirmar={() => {
          if (!eliminando) return
          aplicar(eliminarItem(plan, eliminando))
          notify(`${Item} quitado del plan`, 'Se aplica al guardar.', 'info')
          setEliminando(null)
        }}
      />
    </>
  )
}
