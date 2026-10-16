import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileImportIcon, GitCompareIcon, GridViewIcon, MoreHorizontalIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgente } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { formatSurveyDate, startOfToday } from '../encuestas/modelo/surveyListDates'
import type { Ciclo } from './modelo/ciclos'
import { SIN_FILTROS, type FiltrosCiclos } from './modelo/filtros'
import { USUARIOS_SIN_OBJETIVOS } from './modelo/usuarios'
import type { PlantillaCiclo } from './modelo/plantillas'
import { PanelAlertas } from './components/panel-alertas'
import { PulsoObjetivos } from './components/pulso'
import { TablaCiclos, type AccionCiclo, type EdicionFecha } from './components/tabla-ciclos'
import type { ModoFecha } from '../encuestas/components/celda-fecha'
import { TablaUsuarios } from './components/tabla-usuarios'
import { CatalogoPlantillas } from './components/plantillas/catalogo-plantillas'
import { AgenteObjetivos } from './components/agente-objetivos'
import { DialogoEliminar, DialogoFinalizar } from './components/dialogos'
import { PanelCargaObjetivos } from './components/carga/panel-carga'
import { actualizarCiclo, duplicarCiclos, eliminarCiclos, useCiclos } from './components/almacen'

// Desempeño y cultura › Objetivos. Trae el home del prototipo de Objetivos con el armado del home de Encuestas: arriba
// lo que hay que atender, debajo las tres lecturas promedio y luego las pestañas Ciclos de objetivos y Usuarios sin
// objetivos. Lo que en el prototipo vivía en una barra flotante (comparar ciclos, cargar objetivos, agente, crear ciclo)
// va en el encabezado, y la fila de plantillas pasa a «Crear con plantilla», con el catálogo completo del prototipo
// en el mismo panel que el de Encuestas.
//
// Crear, editar, usar una plantilla, editar participantes y añadir objetivos abren el constructor
// (`objetivos/crear`), con el mismo juego de rutas y de estado de navegación que Encuestas. El detalle de un ciclo
// todavía no existe en el playground: esa acción avisa, sin fingir que funciona.

type Pestana = 'ciclos' | 'usuarios'

const PROXIMAMENTE = 'Lo construimos en la siguiente fase.'
const RUTA = '/admin/desempeno-cultura/objetivos'

export function Component() {
  const navigate = useNavigate()
  const agente = useAgente()
  const ciclos = useCiclos()
  const [pestana, setPestana] = useState<Pestana>('ciclos')
  const [filtros, setFiltros] = useState<FiltrosCiclos>(SIN_FILTROS)
  const [catalogo, setCatalogo] = useState(false)
  const [porFinalizar, setPorFinalizar] = useState<Ciclo | null>(null)
  const [porEliminar, setPorEliminar] = useState<{ ciclos: readonly Ciclo[]; limpiar?: () => void }>({ ciclos: [] })
  const [edicion, setEdicion] = useState<EdicionFecha | null>(null)
  const [carga, setCarga] = useState(false)

  const crearCiclo = (plantilla?: PlantillaCiclo) => navigate(`${RUTA}/crear`, plantilla ? { state: { plantilla: plantilla.id } } : undefined)
  // Un ciclo en curso o finalizado abre sus resultados; uno por iniciar todavía no tiene: se abre para editarlo.
  const abrirCiclo = (ciclo: Ciclo) => navigate(ciclo.estado === 'En curso' || ciclo.estado === 'Finalizado' ? `${RUTA}/${ciclo.id}/resultados` : `${RUTA}/${ciclo.id}/editar`)

  const duplicar = (ids: readonly string[]) => duplicarCiclos(ids)

  const ejecutar = (accion: AccionCiclo, ciclo: Ciclo) => {
    if (accion === 'ver') return abrirCiclo(ciclo)
    if (accion === 'editar') return navigate(`${RUTA}/${ciclo.id}/editar`)
    if (accion === 'editarParticipantes') return navigate(`${RUTA}/${ciclo.id}/editar`, { state: { paso: 'participants' } })
    if (accion === 'objetivosGrupos') return navigate(`${RUTA}/${ciclo.id}/editar`, { state: { paso: 'objectives', pestana: 'groups' } })
    if (accion === 'objetivosColaborador') return navigate(`${RUTA}/${ciclo.id}/editar`, { state: { paso: 'objectives', pestana: 'individual' } })
    if (accion === 'editarFechas') return setEdicion({ id: ciclo.id, modo: 'cierre' })
    if (accion === 'compartir') {
      void navigator.clipboard?.writeText(`${window.location.origin}${RUTA}/${ciclo.id}`).catch(() => undefined)
      return notify(`Enlace de ${ciclo.nombre} copiado al portapapeles`, undefined, 'success')
    }
    if (accion === 'finalizar') return setPorFinalizar(ciclo)
    if (accion === 'eliminar') return setPorEliminar({ ciclos: [ciclo] })
    duplicar([ciclo.id])
    notify(`${ciclo.nombre} duplicado`, 'La copia quedó justo debajo, como borrador y sin avance.')
  }

  // «Editar fechas»: se guarda en la lista y la fila lo muestra al instante.
  const guardarFecha = (id: string, modo: ModoFecha, fecha: Date) => {
    const texto = formatSurveyDate(fecha)
    const nombre = ciclos.find((ciclo) => ciclo.id === id)?.nombre ?? 'El ciclo'
    actualizarCiclo(id, modo === 'inicio' ? { inicio: texto } : { cierre: texto })
    setEdicion(null)
    notify(modo === 'inicio' ? `${nombre} ahora inicia el ${texto}` : `${nombre} ahora cierra el ${texto}`, undefined, 'success')
  }

  // Al finalizar, el cierre pasa a ser hoy: dejar una fecha futura diría que sigue corriendo.
  const finalizar = (elegido: Ciclo) => {
    actualizarCiclo(elegido.id, { estado: 'Finalizado', cierre: formatSurveyDate(startOfToday()), draft: elegido.draft ? { ...elegido.draft, status: 'closed' } : undefined })
    setPorFinalizar(null)
    notify(`${elegido.nombre} finalizado`)
  }

  const eliminar = (lista: readonly Ciclo[]) => {
    const ids = lista.map((ciclo) => ciclo.id)
    eliminarCiclos(ids)
    porEliminar.limpiar?.()
    setPorEliminar({ ciclos: [] })
    notify(lista.length === 1 ? `${lista[0].nombre} eliminado` : `${lista.length} ciclos eliminados`)
  }

  const crearObjetivo = (usuarios: { nombre: string }[]) => notify(usuarios.length === 1 ? `Crear objetivo para ${usuarios[0].nombre}` : `Crear objetivo para ${usuarios.length} personas`, PROXIMAMENTE)

  // «Ver en la lista» del panel: la pestaña de ciclos solo con los que tienen algún caso.
  const verEnLista = (ids: readonly string[]) => {
    setFiltros({ ...SIN_FILTROS, soloIds: ids })
    setPestana('ciclos')
  }

  return (
    <PageShell>
      <PageHeader
        title="Objetivos"
        description="Aquí creas los ciclos de objetivos de tu empresa y sigues cómo avanzan."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => notify('Comparar ciclos', PROXIMAMENTE)}>
                    <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />
                    Comparar ciclos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCarga(true)}>
                    <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
                    Cargar objetivos
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setCatalogo(true)}>
              <HugeiconsIcon icon={GridViewIcon} aria-hidden="true" />
              Crear con plantilla
            </Button>
            <Button onClick={() => crearCiclo()}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear ciclo
            </Button>
            {/* El botón de IA va el último de la fila, como en Encuestas. Solo en pantallas grandes. */}
            {agente.disponible ? <ReopenAgentButton compact onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent>
        <PanelAlertas ciclos={ciclos} onRecordar={(alerta) => notify(`Recordatorio enviado a ${alerta.personas} ${alerta.personas === 1 ? 'persona' : 'personas'}`, alerta.ciclo.nombre)} onAbrir={abrirCiclo} onVerEnLista={verEnLista} />

        <PulsoObjetivos ciclos={ciclos} />

        <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
          <TabsList variant="line">
            <TabsTrigger value="ciclos" className="flex-none">
              Ciclos de objetivos
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex-none">
              Usuarios sin objetivos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ciclos" className="flex flex-col gap-4 pt-4">
            <TablaCiclos
              ciclos={ciclos}
              filtros={filtros}
              onFiltros={setFiltros}
              onAccion={ejecutar}
              edicion={edicion}
              onEditarFecha={setEdicion}
              onGuardarFecha={guardarFecha}
              onDuplicarVarios={(ids) => {
                duplicar(ids)
                notify(`${ids.length} ciclos duplicados`, 'Cada copia quedó debajo de su original, como borrador.')
              }}
              onExportarVarios={(ids) => notify(`Exportando ${ids.length} ciclos`)}
              onEliminarVarios={(ids, limpiar) => setPorEliminar({ ciclos: ciclos.filter((ciclo) => ids.includes(ciclo.id)), limpiar })}
              aviso={
                filtros.soloIds ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text as="span" size="sm" variant="muted">
                      Ves solo los ciclos con algo para atender.
                    </Text>
                    <Button variant="ghost" size="sm" onClick={() => setFiltros(SIN_FILTROS)}>
                      Ver todos los ciclos
                    </Button>
                  </div>
                ) : undefined
              }
            />
          </TabsContent>

          <TabsContent value="usuarios" className="pt-4">
            <TablaUsuarios usuarios={USUARIOS_SIN_OBJETIVOS} onCrearObjetivo={crearObjetivo} />
          </TabsContent>
        </Tabs>
      </PageContent>

      <CatalogoPlantillas
        abierto={catalogo}
        onAbiertoChange={setCatalogo}
        onUsar={(plantilla) => {
          setCatalogo(false)
          crearCiclo(plantilla)
        }}
      />
      <PanelCargaObjetivos abierto={carga} onAbiertoChange={setCarga} ciclos={ciclos} />
      <DialogoFinalizar ciclo={porFinalizar} onCerrar={() => setPorFinalizar(null)} onConfirmar={finalizar} />
      <DialogoEliminar ciclos={porEliminar.ciclos} onCerrar={() => setPorEliminar({ ciclos: [] })} onConfirmar={eliminar} />
      {agente.portal(<AgenteObjetivos ciclos={ciclos} onCrear={() => crearCiclo()} onClose={agente.cerrar} />)}
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosPage'
