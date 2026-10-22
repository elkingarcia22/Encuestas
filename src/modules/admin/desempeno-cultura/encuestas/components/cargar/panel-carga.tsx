import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, FileImportIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Progress, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { DialogoSalir } from '@/modules/design-system/estados/confirmaciones'
import { AiThinking } from '@/shared/components/AiThinking'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PILL } from '@/modules/design-system/drawers/components/drawer-styles'
import { getAnalyzingCopy, type UploadStep } from '../../modelo/carga-historica'
import { PasosDrawer } from '../pasos-drawer'
import { PasoEstructura } from './paso-estructura'
import { PasoArchivos, PasoElegir, PasoGenerales, PasoSiguiente, PestanaCargas, SinSalida } from './pasos-carga'
import type { CargaHistorica } from './use-carga-historica'

// «Cargar encuestas»: el panel de la carga histórica. Es de IA (la IA lee los archivos y arma la encuesta): orbe en la
// cabecera y botones en pastilla. Se arma como «Comparar encuestas»: tres pasos (archivos, datos generales, estructura)
// en la franja bajo la cabecera. «Cargas» (lo que corre y el historial) se abre desde la fila bajo la cabecera del primer
// paso. La carga
// sigue en segundo plano al cerrar: su fila en la tabla muestra el avance y el Centro de procesos del header la lleva.

const PASOS = ['Archivos', 'Datos generales', 'Estructura'] as const

// En qué paso del asistente está cada momento de la carga; los que no son del asistente (lanzada, error) no muestran pasos.
const PASO_DEL_ASISTENTE: Partial<Record<UploadStep, number>> = { dropzone: 1, select: 1, general: 2, summary: 3 }

function Analizando({ carga }: { carga: CargaHistorica }) {
  if (!carga.analisis) return null
  const copia = getAnalyzingCopy(carga.analisis.proposito, carga.analisis.avance, carga.archivos.length, carga.actual)
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AiThinking label={copia.title} size="md" />
      <div className="flex w-full max-w-sm flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Text as="span" size="sm" variant="muted">
            {copia.status}
          </Text>
          <Text as="span" size="sm" weight="semibold" className="tabular-nums">
            {carga.analisis.avance} %
          </Text>
        </div>
        <Progress value={carga.analisis.avance} aria-label="Avance del análisis" />
        <Text size="xs" variant="muted">
          {copia.footer}
        </Text>
      </div>
    </div>
  )
}

function Pie({ carga }: { carga: CargaHistorica }) {
  const { paso } = carga
  if (carga.pestana === 'cargas' || carga.analisis || paso === 'error' || paso === 'empty' || paso === 'next-action') {
    return (
      <Button variant="outline" className={PILL} onClick={() => carga.cambiarAbierto(false)}>
        Cerrar
      </Button>
    )
  }
  // El paso anterior se pide con «← Volver» arriba (PanelCarga, regla «panel-volver-arriba», 13-oct), no desde aquí. El pie
  // lleva como mucho dos botones: «Ver cargas» va arriba, en la fila bajo la cabecera.
  if (paso === 'dropzone')
    return (
      <>
        <Button variant="outline" className={PILL} onClick={() => carga.cambiarAbierto(false)}>
          Cancelar
        </Button>
        <Button className={PILL} disabled={carga.archivos.length === 0} onClick={carga.analizar}>
          Analizar {carga.archivos.length > 1 ? `${carga.archivos.length} archivos` : 'archivo'}
        </Button>
      </>
    )
  if (paso === 'select')
    return (
      <>
        <Button className={PILL} disabled={!carga.elegida} onClick={carga.prepararElegida}>
          Continuar
        </Button>
      </>
    )
  if (paso === 'general')
    return (
      <>
        <Button className={PILL} disabled={!carga.puedeSeguir} onClick={carga.irAEstructura}>
          Continuar
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
        </Button>
      </>
    )
  if (paso === 'summary')
    return (
      <>
        <Button className={PILL} onClick={carga.cargar}>
          <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
          Cargar encuesta
        </Button>
      </>
    )
  return null
}

// Cada carga en el Centro de procesos del header mientras corre, con su avance; al terminar queda como lista o con error,
// y «Ver» abre «Cargas». Al salir de la pantalla solo se quitan las que seguían cargando.
export function PanelCarga({ carga }: { carga: CargaHistorica }) {
  // El Centro de procesos lo lleva la sesión (use-carga-historica.ts): sigue ahí aunque se salga de Encuestas.
  const enCurso = carga.tareas.filter((tarea) => tarea.status === 'loading').length
  const enCargas = carga.pestana === 'cargas'
  const copiaAnalisis = carga.analisis ? getAnalyzingCopy(carga.analisis.proposito, carga.analisis.avance, carga.archivos.length, carga.actual) : null
  const paso = enCargas || carga.analisis ? null : (PASO_DEL_ASISTENTE[carga.paso] ?? null)
  return (
    <>
      {/* Como «Comparar encuestas»: la cabecera no cambia, los pasos van en la franja de abajo y cada paso pone su
          pregunta en el cuerpo. «Cargas» (lo que corre y el historial) se abre desde la fila de arriba del primer paso y vuelve con
          la fila de navegación, como un drawer anidado. */}
      <DrawerShell
        open={carga.abierto}
        onOpenChange={carga.cambiarAbierto}
        size="lg"
        ai
        onVolver={!enCargas && !carga.analisis && ['select', 'general', 'summary'].includes(carga.paso) ? carga.volver : undefined}
        title={enCargas ? 'Cargas de encuestas' : (copiaAnalisis?.title ?? 'Cargar encuestas')}
        description={
          enCargas
            ? 'Lo que se está cargando y lo que cargaste en los últimos días.'
            : copiaAnalisis
              ? 'La IA está leyendo tus archivos.'
              : 'Trae a UBITS encuestas que aplicaste por fuera, una a la vez.'
        }
        navigation={
          enCargas ? (
            <div className="flex items-center border-b px-3 py-1.5">
              {/* text-muted-foreground!: el botón sin borde no trae tono gris (ficha button-ghost-tonos en
                  ai-tools/flux-ui/diferencias.json). */}
              <Button variant="ghost" size="sm" className={`text-muted-foreground! ${PILL}`} onClick={() => carga.setPestana('nueva')}>
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                Volver a cargar encuestas
              </Button>
            </div>
          ) : !carga.analisis && carga.paso === 'dropzone' ? (
            // «Ver cargas» arriba y no en el pie, que lleva como mucho dos botones (regla «panel-volver-arriba», 13-oct).
            <div className="flex items-center border-b px-3 py-1.5">
              {/* text-muted-foreground!: ficha button-ghost-tonos, como «Volver a cargar encuestas». */}
              <Button variant="ghost" size="sm" className={`text-muted-foreground! ${PILL}`} onClick={() => carga.setPestana('cargas')}>
                <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
                Ver cargas
                {enCurso > 0 ? (
                  <Badge variant="primary-light" size="xs" className="tabular-nums">
                    {enCurso}
                  </Badge>
                ) : null}
              </Button>
            </div>
          ) : undefined
        }
        headerExtra={paso ? <PasosDrawer pasos={PASOS} actual={paso} onVolver={(destino) => (destino === paso - 1 ? carga.volver() : carga.volverAArchivos())} /> : undefined}
        footer={<Pie carga={carga} />}
      >
        {enCargas ? (
          <PestanaCargas carga={carga} />
        ) : (
          <div className="flex flex-col gap-5">
            {carga.avisos.length > 0 && !carga.analisis && (carga.paso === 'select' || carga.paso === 'general') ? (
              <Alert variant="warning">
                <AlertTitle>{carga.avisos.length === 1 ? 'Un archivo no se reconoció' : `${carga.avisos.length} archivos no se reconocieron`}</AlertTitle>
                <AlertDescription>{carga.avisos.map((aviso) => aviso.fileName).join(', ')}: {carga.avisos.length === 1 ? 'no tiene el formato de un reporte ni de una base de respuestas, así que quedó fuera.' : 'no tienen el formato de un reporte ni de una base de respuestas, así que quedaron fuera.'}</AlertDescription>
              </Alert>
            ) : null}
            {carga.analisis ? (
              <Analizando carga={carga} />
            ) : carga.paso === 'dropzone' ? (
              <PasoArchivos carga={carga} />
            ) : carga.paso === 'select' ? (
              <PasoElegir carga={carga} />
            ) : carga.paso === 'general' ? (
              <PasoGenerales carga={carga} />
            ) : carga.paso === 'summary' ? (
              <PasoEstructura carga={carga} />
            ) : carga.paso === 'next-action' ? (
              <PasoSiguiente carga={carga} />
            ) : carga.paso === 'error' || carga.paso === 'empty' ? (
              <SinSalida carga={carga} />
            ) : (
              <PestanaCargas carga={carga} />
            )}
          </div>
        )}
      </DrawerShell>
      {/* La ventana de salir del sistema (regla «salir-con-cambios», 13-oct): «Seguir aquí» y la salida en azul. */}
      <DialogoSalir
        abierto={carga.confirmarSalida}
        onAbiertoChange={(abierto) => (abierto ? undefined : carga.cancelarSalida())}
        salida="Salir de la carga"
        descripcion="Se pierde lo que revisaste y corregiste en este paso, y los archivos no se guardan."
        onSalir={carga.cerrarDelTodo}
      />
    </>
  )
}
