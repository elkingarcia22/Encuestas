import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, PlusSignIcon, Task01Icon, TaskAdd01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'

import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PLANES_INICIALES, TAREAS_INICIALES, type Tarea } from './components/datos'
import { PestanaPlanes } from './components/pestana-planes'
import { PestanaTareas } from './components/pestana-tareas'
import type { PlanConIa } from './components/plan-con-ia'

// Herramientas › Tareas del administrador (/admin/tareas). Seguimiento de toda la empresa
// (HU «Seguimiento HR de tareas y planes») con el patrón maestro-detalle: en pantallas anchas la
// lista queda a la izquierda y el detalle de la fila elegida a la derecha; en angostas el detalle
// se abre en un panel lateral. Cada pestaña guarda su periodo, búsqueda y filtros (RN-02).

type Pestana = 'tareas' | 'planes'

export function Component() {
  // Planes armados con IA desde otra pantalla (el panel de riesgos de Encuestas) o desde «Crear plan»: llegan por el
  // estado de la navegación, se suman a los de siempre y se abre Planes con el elegido ya seleccionado. Las tareas de
  // «Crear tarea» llegan igual (`tareasNuevas`) y quedan arriba, con la primera elegida.
  const llegada = (useLocation().state as { nuevos?: PlanConIa[]; elegido?: string; tareasNuevas?: Tarea[] } | null) ?? {}
  const nuevos = llegada.nuevos ?? []
  const tareasNuevas = llegada.tareasNuevas ?? []
  // «Copiar enlace» de una tarea o un plan deja `?tarea=<id>` o `?plan=<id>` (13-oct, I-117): al abrir esa dirección se
  // elige esa fila y su detalle queda a la vista, en la pestaña que le toca. Un id que no existe se ignora.
  const [consulta] = useSearchParams()
  const idTarea = TAREAS_INICIALES.find((t) => t.id === consulta.get('tarea'))?.id
  const idPlan = PLANES_INICIALES.find((p) => p.id === consulta.get('plan'))?.id
  const [pestana, setPestana] = useState<Pestana>(nuevos.length > 0 || (idPlan && !idTarea) ? 'planes' : 'tareas')
  const [tareas, setTareas] = useState(() => [...tareasNuevas, ...nuevos.flatMap((nuevo) => nuevo.tareas), ...TAREAS_INICIALES])
  const [planes, setPlanes] = useState(() => [...nuevos.map((nuevo) => nuevo.plan), ...PLANES_INICIALES])
  const [tareaElegida, setTareaElegida] = useState<string | undefined>(tareasNuevas[0]?.id ?? idTarea ?? TAREAS_INICIALES[0].id)
  const [planElegido, setPlanElegido] = useState<string | undefined>(llegada.elegido ?? nuevos[0]?.plan.id ?? idPlan ?? PLANES_INICIALES[0].id)
  const [tareaEnPanel, setTareaEnPanel] = useState(Boolean(idTarea) && tareasNuevas.length === 0)
  // Un objeto nuevo reinicia la selección de las tablas sin perder su búsqueda ni sus filtros.
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})
  const limpiar = () => setLimpiarSeleccion({})

  const cambiarPestana = (valor: Pestana) => {
    setPestana(valor)
    limpiar()
  }
  // Desde el detalle de un plan se abre la tarea en su pestaña.
  const verTarea = (tarea: Tarea) => {
    setTareaElegida(tarea.id)
    setTareaEnPanel(true)
    cambiarPestana('tareas')
  }

  return (
    <PageShell>
      <Tabs value={pestana} onValueChange={(valor) => cambiarPestana(valor as Pestana)}>
        <PageHeader
          title="Tareas"
          description="Sigue las tareas y los planes de toda la empresa y actúa sobre lo vencido o pendiente."
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Crear
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
              </DropdownMenuTrigger>
              {/* Crear es una página, no una ventana (decisión 5 de la auditoría): cada opción lleva a la suya. */}
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem render={<Link to="/admin/tareas/crear-tarea" />}>
                  <HugeiconsIcon icon={TaskAdd01Icon} aria-hidden="true" />
                  Crear tarea
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/admin/tareas/crear-plan" />}>
                  <HugeiconsIcon icon={Task01Icon} aria-hidden="true" />
                  Crear plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          tabs={
            <TabsList variant="line">
              <TabsTrigger value="tareas" className="flex-none">
                Tareas
              </TabsTrigger>
              <TabsTrigger value="planes" className="flex-none">
                Planes
              </TabsTrigger>
            </TabsList>
          }
        />

        <PageContent>
          <TabsContent value="tareas" keepMounted>
            <PestanaTareas
              tareas={tareas}
              setTareas={setTareas}
              elegida={tareaElegida}
              setElegida={setTareaElegida}
              enPanel={tareaEnPanel}
              setEnPanel={setTareaEnPanel}
              limpiarSeleccion={limpiarSeleccion}
              onLimpiarSeleccion={limpiar}
            />
          </TabsContent>
          <TabsContent value="planes" keepMounted>
            <PestanaPlanes
              planes={planes}
              setPlanes={setPlanes}
              tareas={tareas}
              elegido={planElegido}
              setElegido={setPlanElegido}
              limpiarSeleccion={limpiarSeleccion}
              onLimpiarSeleccion={limpiar}
              onVerTarea={verTarea}
            />
          </TabsContent>
        </PageContent>
      </Tabs>
    </PageShell>
  )
}

Component.displayName = 'AdminTareasPage'
