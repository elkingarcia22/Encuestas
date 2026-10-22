import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileImportIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgente } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { formatSurveyDate, startOfToday } from '../encuestas/modelo/surveyListDates'
import { saveBlob } from '../encuestas/modelo/descargas/libro'
import { formatoAvance, type Ciclo } from './modelo/ciclos'
import { SIN_FILTROS, type FiltrosCiclos } from './modelo/filtros'
import { USUARIOS_SIN_OBJETIVOS } from './modelo/usuarios'
import type { AlertaCiclo } from './modelo/alertas'
import { PanelAlertas } from './components/panel-alertas'
import { PulsoObjetivos } from './components/pulso'
import { TablaCiclos, type AccionCiclo, type EdicionFecha } from './components/tabla-ciclos'
import type { ModoFecha } from '../encuestas/components/celda-fecha'
import { TablaUsuarios } from './components/tabla-usuarios'
import { AgenteObjetivos } from './components/agente-objetivos'
import { DialogoEliminar, DialogoFinalizar } from './components/dialogos'
import { PanelCargaObjetivos } from './components/carga/panel-carga'
import type { DatosCargaCiclo } from './modelo/carga/carga-objetivos'
import { actualizarCiclo, configDe, duplicarCiclos, eliminarCiclos, guardarConfig, useCiclos } from './components/almacen'
import { DrawerConfiguracion } from './components/configuracion/drawer-configuracion'

// Desempeño y cultura › Objetivos. Trae el home del prototipo de Objetivos con el armado del home de Encuestas: arriba
// lo que hay que atender, debajo las tres lecturas promedio y luego las pestañas Ciclos de objetivos y Usuarios sin
// objetivos. Lo que en el prototipo vivía en una barra flotante (comparar ciclos, cargar objetivos, agente, crear ciclo)
// va en el encabezado. Sin plantillas: en Objetivos los ciclos no se crean desde una (21-oct).
//
// Crear, editar, editar participantes y agregar objetivos abren el constructor
// (`objetivos/crear`), con el mismo juego de rutas y de estado de navegación que Encuestas. «Comparar ciclos» no está
// porque esa pantalla todavía no existe (regla «nada-que-finja», 13-oct); «Exportar» descarga de verdad los marcados.

type Pestana = 'ciclos' | 'usuarios'

const RUTA = '/admin/desempeno-cultura/objetivos'

// «Exportar» con ciclos marcados: un CSV con lo que dice la tabla (se abre en Excel), como «Descargar plantilla» de la carga.
const celdaCsv = (valor: string | number) => {
  const texto = String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}
function exportarCiclos(lista: readonly Ciclo[]) {
  const cabecera = ['Ciclo', 'Periodo', 'Inicio', 'Cierre', 'Estado', 'Personas', 'Objetivos', 'Avance', 'Cumplidos', 'Reportando']
  const filas = lista.map((ciclo) => [ciclo.nombre, ciclo.periodo, ciclo.inicio, ciclo.cierre, ciclo.estado, ciclo.personas, ciclo.objetivos, formatoAvance(ciclo.avance), formatoAvance(ciclo.cumplidos), formatoAvance(ciclo.reportando)])
  // El BOM le dice a Excel que el archivo va en UTF-8 (tildes y «ñ»).
  const csv = '\uFEFF' + [cabecera, ...filas].map((fila) => fila.map(celdaCsv).join(',')).join('\n')
  saveBlob(lista.length === 1 ? `ciclo-${lista[0].id}.csv` : 'ciclos-de-objetivos.csv', 'text/csv;charset=utf-8', csv)
  notify(lista.length === 1 ? `${lista[0].nombre} exportado` : `${lista.length} ciclos exportados`, 'El archivo CSV quedó en tus descargas.', 'success')
}

export function Component() {
  const navigate = useNavigate()
  const agente = useAgente()
  const ciclos = useCiclos()
  const [pestana, setPestana] = useState<Pestana>('ciclos')
  const [filtros, setFiltros] = useState<FiltrosCiclos>(SIN_FILTROS)
  const [porFinalizar, setPorFinalizar] = useState<Ciclo | null>(null)
  const [porEliminar, setPorEliminar] = useState<{ ciclos: readonly Ciclo[]; limpiar?: () => void }>({ ciclos: [] })
  const [edicion, setEdicion] = useState<EdicionFecha | null>(null)
  const [carga, setCarga] = useState(false)
  const [configurando, setConfigurando] = useState<Ciclo | null>(null)

  const crearCiclo = (datosCarga?: DatosCargaCiclo) => navigate(`${RUTA}/crear`, datosCarga ? { state: { datosCarga } } : undefined)
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
    if (accion === 'configurar') return setConfigurando(ciclo)
    if (accion === 'eliminar') return setPorEliminar({ ciclos: [ciclo] })
    duplicar([ciclo.id])
    notify(`${ciclo.nombre} duplicado`, 'La copia quedó justo debajo, como borrador y sin avance.', 'success')
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
    notify(`${elegido.nombre} finalizado`, undefined, 'success')
  }

  const eliminar = (lista: readonly Ciclo[]) => {
    const ids = lista.map((ciclo) => ciclo.id)
    eliminarCiclos(ids)
    porEliminar.limpiar?.()
    setPorEliminar({ ciclos: [] })
    notify(lista.length === 1 ? `${lista[0].nombre} eliminado` : `${lista.length} ciclos eliminados`, undefined, 'success')
  }

  // La acción de un caso de «Para atender»: recordar avisa, terminar un borrador lo abre y ver resultados abre el ciclo.
  const atender = (alerta: AlertaCiclo) => {
    if (alerta.accion === 'editar') return navigate(`${RUTA}/${alerta.ciclo.id}/editar`)
    if (alerta.accion === 'resultados') return abrirCiclo(alerta.ciclo)
    notify(`Recordatorio enviado a ${alerta.personas} ${alerta.personas === 1 ? 'persona' : 'personas'}`, alerta.ciclo.nombre, 'success')
  }

  return (
    <PageShell>
      <PageHeader
        title="Objetivos"
        description="Aquí creas los ciclos de objetivos de tu empresa y sigues cómo avanzan."
        actions={
          <>
            <Button variant="outline" onClick={() => setCarga(true)}>
              <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
              Cargar objetivos
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
        <PanelAlertas ciclos={ciclos} onAccion={atender} />

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
                notify(`${ids.length} ciclos duplicados`, 'Cada copia quedó debajo de su original, como borrador.', 'success')
              }}
              onExportarVarios={(ids) => exportarCiclos(ciclos.filter((ciclo) => ids.includes(ciclo.id)))}
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
            <TablaUsuarios usuarios={USUARIOS_SIN_OBJETIVOS} />
          </TabsContent>
        </Tabs>
      </PageContent>

      <PanelCargaObjetivos abierto={carga} onAbiertoChange={setCarga} ciclos={ciclos} onNuevoCiclo={(datos) => crearCiclo(datos)} />
      <DrawerConfiguracion
        ciclo={configurando}
        config={configurando ? configDe(configurando) : null}
        onCerrar={() => setConfigurando(null)}
        onGuardar={(config) => {
          if (configurando) guardarConfig(configurando, config)
          setConfigurando(null)
        }}
      />
      <DialogoFinalizar ciclo={porFinalizar} onCerrar={() => setPorFinalizar(null)} onConfirmar={finalizar} />
      <DialogoEliminar ciclos={porEliminar.ciclos} onCerrar={() => setPorEliminar({ ciclos: [] })} onConfirmar={eliminar} />
      {agente.portal(<AgenteObjetivos ciclos={ciclos} onCrear={() => crearCiclo()} onClose={agente.cerrar} />)}
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosPage'
