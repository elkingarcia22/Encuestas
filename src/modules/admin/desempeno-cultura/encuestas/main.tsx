import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileImportIcon, GitCompareIcon, GridViewIcon, PlusSignIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { NO_FILTERS, hasAnyFilter, type SurveyListFilters } from './modelo/surveyListFilters'
import { formatSurveyDate, startOfToday } from './modelo/surveyListDates'
import type { SurveyDraft } from './modelo/surveyBuilderTypes'
import { canPreview } from './modelo/previewModel'
import { createPublishedSurveyDraft } from './modelo/surveyPreviewMocks'
import { fallaEnQA } from './modelo/surveyCasos'
import { fileStamp, saveBlob } from './modelo/descargas/libro'
import type { SurveyListItem } from './modelo/types'
import { PanelRiesgos } from './components/riesgos/panel-riesgos'
import type { Solucion } from './components/riesgos/soluciones'
import type { SurveyRisk } from './modelo/riesgos'
import { AgenteEncuestas } from './components/agente-encuestas'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { useAgente } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { PestanaDemograficos } from './components/demograficos/pestana-demograficos'
import { actualizarEncuesta, duplicarEncuestas, eliminarEncuestas, useEncuestas } from './components/almacen'
import { enlaceDeEncuesta, type AccionEncuesta } from './components/acciones'
import { descargarQrPng } from './modelo/descargas/qr'
import { slugify } from './modelo/descargas/libro'
import type { ModoFecha } from './components/celda-fecha'
import { DialogoEliminar, DialogoFinalizar } from './components/dialogos'
import { CatalogoPlantillas } from './components/plantillas/catalogo-plantillas'
import { CreaAlgoNuevo } from './components/plantillas/crea-algo-nuevo'
import { PulsoEncuestas } from './components/pulso'
import { TablaEncuestas, type EdicionFecha } from './components/tabla-encuestas'
import { VistaPrevia } from './components/vista-previa/vista-previa'
import { AsistenteComparativo, type Preseleccion } from './components/comparar/asistente-comparativo'
import { PanelCarga } from './components/cargar/panel-carga'
import { useCargaHistorica } from './components/cargar/use-carga-historica'

// Desempeño y cultura › Encuestas. De arriba abajo: las tres lecturas
// promedio (participación, favorabilidad y eNPS) y las pestañas Encuestas y Datos demográficos. La
// lista trae las alertas que la filtran, y cada encuesta ofrece en su menú solo lo que su estado
// permite. En el prototipo esto vivía en una barra flotante; aquí va en el encabezado, en la
// cabecera de la tabla (acciones en lote) y en el menú de cada fila.

type Pestana = 'encuestas' | 'demograficos'

// Lo que se construye en las fases siguientes del plan: por ahora avisa, sin fingir que funciona.

const RUTA = '/admin/desempeno-cultura/encuestas'

// Las tres cifras del pulso (en curso, participación promedio, cobertura) quedan ocultas (Elkin, 15-oct): no aportaban
// lo suficiente en el inicio. No se borran: para volver a mostrarlas basta con poner esto en true.
const MOSTRAR_PULSO = false

// Exportar varias encuestas: se prepara un momento y avisa al terminar, con «Descargar» si salió o «Reintentar» si no.
// Falla siempre que en lo exportado vaya la encuesta de prueba que falla (fallaEnQA).
const MS_EXPORTAR = 1500
const celdaCsv = (valor: string) => `"${valor.replace(/"/g, '""')}"`
function exportarEncuestas(encuestas: readonly SurveyListItem[]) {
  const cantidad = `${encuestas.length} ${encuestas.length === 1 ? 'encuesta' : 'encuestas'}`
  notify(`Exportando ${cantidad}`, 'Te avisamos cuando el archivo esté listo.', 'info')
  window.setTimeout(() => {
    if (fallaEnQA(...encuestas.map((encuesta) => encuesta.id))) {
      notifyAction('No se pudo generar el archivo', `${cantidad} sin exportar.`, { label: 'Reintentar', onClick: () => exportarEncuestas(encuestas) }, 'error')
      return
    }
    const nombre = `encuestas-${fileStamp()}.csv`
    const filas = [['Nombre', 'Tipo', 'Estado', 'Inicio', 'Cierre', 'Participantes', 'Avance (%)'], ...encuestas.map((encuesta) => [encuesta.name, encuesta.type, encuesta.status, encuesta.startDate, encuesta.endDate, encuesta.participants, String(encuesta.progress)])]
    const descargar = () => saveBlob(nombre, 'text/csv;charset=utf-8', `\uFEFF${filas.map((fila) => fila.map(celdaCsv).join(',')).join('\n')}`)
    descargar()
    notifyAction('El archivo está listo', `${cantidad} en ${nombre}`, { label: 'Descargar de nuevo', onClick: descargar }, 'success')
  }, MS_EXPORTAR)
}

export function Component() {
  const navigate = useNavigate()
  const todas = useEncuestas()
  const encuestas = todas
  const agente = useAgente()
  const carga = useCargaHistorica(encuestas)
  const [pestana, setPestana] = useState<Pestana>('encuestas')
  const [filtros, setFiltros] = useState<SurveyListFilters>(NO_FILTERS)
  const [edicion, setEdicion] = useState<EdicionFecha | null>(null)
  const [porFinalizar, setPorFinalizar] = useState<SurveyListItem | null>(null)
  const [catalogo, setCatalogo] = useState<{ abierto: boolean; inicial: SurveyDraft | null; estante?: string }>({ abierto: false, inicial: null })
  const [porEliminar, setPorEliminar] = useState<{ encuestas: readonly SurveyListItem[]; limpiar?: () => void }>({ encuestas: [] })
  // La encuesta que se ensaya: el borrador se queda al cerrar para que la ventana salga con su contenido.
  const [comparar, setComparar] = useState<{ abierto: boolean; inicial: Preseleccion | null }>({ abierto: false, inicial: null })
  const [vistaPrevia, setVistaPrevia] = useState<{ abierta: boolean; borrador: SurveyDraft | null }>({ abierta: false, borrador: null })

  const nombreDe = (id: string) => encuestas.find((encuesta) => encuesta.id === id)?.name ?? 'La encuesta'

  const abrirCatalogo = (inicial: SurveyDraft | null = null, estante?: string) => setCatalogo({ abierto: true, inicial, estante })
  const usarPlantilla = (plantilla: SurveyDraft) => {
    setCatalogo((previo) => ({ ...previo, abierto: false }))
    navigate(`${RUTA}/crear`, { state: { plantilla: plantilla.name } })
  }

  const ejecutar = (accion: AccionEncuesta, encuesta: SurveyListItem) => {
    if (accion === 'vistaPrevia') {
      const borrador = encuesta.draft ?? createPublishedSurveyDraft(encuesta)
      return canPreview(borrador) ? setVistaPrevia({ abierta: true, borrador }) : notify('Agrega al menos una pregunta o un dato demográfico visible para ver la vista previa.', undefined, 'warning')
    }
    if (accion === 'resultados') return navigate(`${RUTA}/${encuesta.id}/resultados`)
    if (accion === 'editar') return navigate(`${RUTA}/${encuesta.id}/editar`)
    if (accion === 'editarParticipantes') return navigate(`${RUTA}/${encuesta.id}/editar`, { state: { paso: 'participants' } })
    if (accion === 'duplicar') {
      duplicarEncuestas([encuesta.id])
      return notify(`${encuesta.name} duplicada`, 'La copia quedó justo debajo, como borrador y sin respuestas.', 'success')
    }
    if (accion === 'finalizar') return setPorFinalizar(encuesta)
    if (accion === 'editarFechas') return setEdicion({ id: encuesta.id, modo: 'cierre' })
    if (accion === 'reabrir') return setEdicion({ id: encuesta.id, modo: 'reabrir' })
    if (accion === 'eliminar') return setPorEliminar({ encuestas: [encuesta] })
    if (accion === 'compartirEnlace') {
      if (!navigator.clipboard) return notify('No pudimos copiar el enlace', 'Tu navegador no deja copiar desde aquí. Inténtalo con otro navegador.', 'error')
      return void navigator.clipboard.writeText(enlaceDeEncuesta(encuesta.id)).then(
        () => notify('Enlace copiado', `Pégalo donde quieras compartir ${encuesta.name}.`, 'success'),
        () => notify('No pudimos copiar el enlace', 'Tu navegador no dio permiso para copiar. Inténtalo de nuevo.', 'error'),
      )
    }
    if (accion === 'descargarQr') {
      return void descargarQrPng(enlaceDeEncuesta(encuesta.id), `qr-${slugify(encuesta.name)}.png`).then(
        () => notify('QR descargado', `Imprímelo o compártelo para que respondan ${encuesta.name}.`, 'success'),
        () => notify('No pudimos crear el QR', 'Inténtalo de nuevo en un momento.', 'error'),
      )
    }
    if (accion === 'reintentarCarga' && encuesta.uploadTaskId !== undefined) return carga.reintentar(encuesta.uploadTaskId)
  }

  // Lo que se hizo en el panel lateral de un riesgo: ir a los resultados, una acción de la encuesta, algo de su lista
  // (recordar, canalizar…) o más días de cierre (se guarda en la lista, así la fila y las métricas lo reflejan al instante).
  const resolverRiesgo = (riesgo: SurveyRisk, solucion: Solucion) => {
    if (solucion.tipo === 'resultados') return navigate(`${RUTA}/${riesgo.survey.id}/resultados`, { state: { pestana: solucion.pestana } })
    if (solucion.tipo === 'accion') {
      if (solucion.accion === 'editar' && solucion.paso) return navigate(`${RUTA}/${riesgo.survey.id}/editar`, { state: { paso: solucion.paso } })
      return ejecutar(solucion.accion, riesgo.survey)
    }
    if (solucion.tipo === 'lista') return solucion.aviso ? notify(riesgo.survey.name, solucion.aviso, 'success') : undefined
    if (solucion.tipo === 'planes') return navigate('/admin/tareas', { state: { nuevos: solucion.nuevos, elegido: solucion.elegido } })
    actualizarEncuesta(riesgo.survey.id, { endDate: solucion.nuevoCierre })
    notify(riesgo.survey.name, `Ahora cierra el ${solucion.nuevoCierre}`, 'success')
  }

  // Lo que ya se lanzó abre sus resultados: una medición en campo tiene resultados parciales que
  // vale la pena mirar. Solo un borrador, que aún no tiene nada, abre en el constructor.
  // Una encuesta de la carga histórica que aún se guarda (o que falló) no tiene resultados: abre «Cargas».
  const abrir = (encuesta: SurveyListItem) => (encuesta.status === 'Cargando' || encuesta.status === 'Con error' ? carga.abrir('cargas') : navigate(`${RUTA}/${encuesta.id}/${encuesta.status === 'Borrador' ? 'editar' : 'resultados'}`))

  const guardarFecha = (id: string, modo: ModoFecha, fecha: Date) => {
    const texto = formatSurveyDate(fecha)
    if (modo === 'reabrir') {
      actualizarEncuesta(id, { status: 'En progreso', statusVariant: 'info', endDate: texto })
      notify(`${nombreDe(id)} vuelve a estar en curso hasta el ${texto}`, undefined, 'success')
    } else if (modo === 'inicio') {
      actualizarEncuesta(id, { startDate: texto })
      notify(`${nombreDe(id)} ahora inicia el ${texto}`, undefined, 'success')
    } else {
      actualizarEncuesta(id, { endDate: texto })
      notify(`${nombreDe(id)} ahora cierra el ${texto}`, undefined, 'success')
    }
    setEdicion(null)
  }

  // Al finalizar, el cierre pasa a ser hoy: dejar una fecha futura diría que sigue corriendo.
  const finalizar = (encuesta: SurveyListItem) => {
    actualizarEncuesta(encuesta.id, { status: 'Finalizado', statusVariant: 'positive', progress: 100, endDate: formatSurveyDate(startOfToday()) })
    setPorFinalizar(null)
    notify(`${encuesta.name} finalizada`, undefined, 'success')
  }

  const eliminar = (lista: readonly SurveyListItem[]) => {
    eliminarEncuestas(lista.map((encuesta) => encuesta.id))
    porEliminar.limpiar?.()
    setPorEliminar({ encuestas: [] })
    notify(lista.length === 1 ? `${lista[0].name} eliminada` : `${lista.length} encuestas eliminadas`, undefined, 'success')
  }

  return (
    <PageShell>
      {/* Las pestañas envuelven la página: la tira va en el hueco `tabs` de la cabecera, pegada al título, y cada pestaña
          es un TabsContent dentro de PageContent (decisión 13 de la auditoría; como Tareas o Planes). */}
      <Tabs value={pestana} onValueChange={(valor) => setPestana(valor as Pestana)}>
      <PageHeader
        title="Encuestas"
        description="Aquí creas las encuestas de clima, cultura y eNPS de tu empresa y lees sus resultados."
        actions={
          <>
            {/* El «⋯» es el terciario redondo con tres puntos horizontales, el primero de la fila y con su menú abierto
                hacia el inicio (decisión 15 de la auditoría). */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
              </DropdownMenuTrigger>
              {/* El menú toma el ancho del botón que lo abre; con un botón de icono hay que darle uno propio. */}
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setComparar({ abierto: true, inicial: null })}>
                    <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />
                    Comparar encuestas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => carga.abrir()}>
                    <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
                    Cargar encuestas
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => abrirCatalogo()}>
              <HugeiconsIcon icon={GridViewIcon} aria-hidden="true" />
              Crear con plantilla
            </Button>
            <Button onClick={() => navigate(`${RUTA}/crear`)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear encuesta
            </Button>
            {/* El botón de IA va el último de la fila, como en Planes de formación. Solo en pantallas grandes. */}
            {agente.disponible ? <ReopenAgentButton compact onClick={agente.abrir} /> : null}
          </>
        }
        tabs={
          <TabsList variant="line">
            <TabsTrigger value="encuestas" className="flex-none">
              Encuestas
            </TabsTrigger>
            <TabsTrigger value="demograficos" className="flex-none">
              Datos demográficos
            </TabsTrigger>
          </TabsList>
        }
      />

      <PageContent>
          {/* Los riesgos y las cifras son de las encuestas, así que van dentro de su pestaña, arriba de la lista: lo
              urgente primero. Cada riesgo se resuelve en su panel lateral. */}
          <TabsContent value="encuestas" className="flex flex-col gap-6">
            {/* Las plantillas más pedidas a la vista, como «Crea algo nuevo» de LMS Creator › Contenidos. */}
            <CreaAlgoNuevo onPlantilla={(plantilla) => abrirCatalogo(plantilla)} onEstante={(estante) => abrirCatalogo(null, estante)} />

            <PanelRiesgos encuestas={encuestas} onSolucion={resolverRiesgo} />

            {MOSTRAR_PULSO ? <PulsoEncuestas encuestas={encuestas} /> : null}

            <TablaEncuestas
              encuestas={encuestas}
              titulo={hasAnyFilter(filtros) ? 'Encuestas filtradas' : 'Lista de encuestas creadas'}
              filtros={filtros}
              onFiltros={setFiltros}
              edicion={edicion}
              onEditarFecha={setEdicion}
              onGuardarFecha={guardarFecha}
              onAccion={ejecutar}
              onAbrir={abrir}
              onDuplicarVarias={(ids) => {
                duplicarEncuestas(ids)
                notify(`${ids.length} encuestas duplicadas`, 'Cada copia quedó debajo de su original, como borrador.', 'success')
              }}
              onExportarVarias={(ids) => exportarEncuestas(encuestas.filter((encuesta) => ids.includes(encuesta.id)))}
              onCompararVarias={(ids) => {
                const tipo = encuestas.find((encuesta) => encuesta.id === ids[0])?.type
                if (tipo) setComparar({ abierto: true, inicial: { tipo, ids } })
              }}
              onEliminarVarias={(ids, limpiar) => setPorEliminar({ encuestas: encuestas.filter((encuesta) => ids.includes(encuesta.id)), limpiar })}
            />
          </TabsContent>

          <TabsContent value="demograficos">
            <PestanaDemograficos />
          </TabsContent>
      </PageContent>
      </Tabs>

      {vistaPrevia.borrador ? <VistaPrevia borrador={vistaPrevia.borrador} open={vistaPrevia.abierta} onOpenChange={(abierta) => setVistaPrevia((previa) => ({ ...previa, abierta }))} /> : null}

      <CatalogoPlantillas abierto={catalogo.abierto} onAbiertoChange={(abierto) => setCatalogo((previo) => ({ ...previo, abierto }))} inicial={catalogo.inicial} estante={catalogo.estante} onUsar={usarPlantilla} />
      <PanelCarga carga={carga} />
      <AsistenteComparativo abierto={comparar.abierto} onAbierto={(abierto) => setComparar((previo) => ({ ...previo, abierto }))} encuestas={encuestas} inicial={comparar.inicial} />
      <DialogoFinalizar encuesta={porFinalizar} onCerrar={() => setPorFinalizar(null)} onConfirmar={finalizar} />
      <DialogoEliminar encuestas={porEliminar.encuestas} onCerrar={() => setPorEliminar({ encuestas: [] })} onConfirmar={eliminar} />
      {agente.portal(<AgenteEncuestas encuestas={encuestas} onCrear={(pedido) => navigate(`${RUTA}/crear`, { state: { agente: { pedido } } })} onClose={agente.cerrar} />)}
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaEncuestasPage'
