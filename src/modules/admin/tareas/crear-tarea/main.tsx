import { useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { LogoutSquare01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@ubits/flux-ui'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { CONTENIDOS } from '@/modules/design-system/formularios/asignacion-datos'
import { SelectorMultiple } from '@/modules/design-system/formularios/asignacion'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import { HOY, plural } from '@/modules/design-system/patrones/formato'
import { HOY_ISO, PERSONAS, PLANES_INICIALES, PRIORIDADES, SIN_PLAN, aFechaIso, type Prioridad, type Tarea, type TipoTarea } from '../components/datos'

// Herramientas › Tareas › Crear tarea (/admin/tareas/crear-tarea). Crear es una página, no una ventana ni un panel
// (decisión 5 de la auditoría): título y descripción fijos, el formulario en secciones y la barra fija abajo con el
// estado del guardado a la izquierda y «Crear tarea» a la derecha. La salida es una sola, «Salir de la creación», junto
// al título (regla de creación, 6-oct), y si ya se escribió algo se pregunta antes de salir, también al irse por el
// menú lateral o con «atrás».
//
// Los campos salen de las HU de Tareas:
// - «Detalle de tarea y subtarea» (HU-TAR-004): «título, descripción, estado, prioridad, plan, tipo (Estándar /
//   Aprendizaje), “Finaliza el:”, asignado». RN-03: «Tipos de tarea: Estándar y Aprendizaje (con contenido ligado
//   opcional)». RN-04: en Aprendizaje la tarea «finalizará al completar el contenido».
// - «Seguimiento HR de tareas y planes» (HU-TAR-003): «Creación desde el botón Crear de esta vista»; RN-04:
//   «Prioridades (solo Tareas): Alta, Media, Baja»; RN-10: solo entran las tareas «grupales / de seguimiento», por eso
//   se asigna a varias personas a la vez. Una tarea nueva nace «Por hacer» (RN-03).

const RUTA_TAREAS = '/admin/tareas'
const NOMBRES = PERSONAS.map((persona) => persona.nombre)
const PLANES = [SIN_PLAN, ...PLANES_INICIALES.map((plan) => plan.nombre)]

type Errores = Partial<Record<'titulo' | 'asignados' | 'finaliza', string>>

export function Component() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<TipoTarea>('Estándar')
  const [contenido, setContenido] = useState('')
  const [asignados, setAsignados] = useState<string[]>([])
  const [prioridad, setPrioridad] = useState<Prioridad>('Media')
  const [plan, setPlan] = useState(SIN_PLAN)
  const [finaliza, setFinaliza] = useState<Date | undefined>(undefined)
  const [errores, setErrores] = useState<Errores>({})
  const [guardado, avisarCambio] = useGuardadoSimulado()
  const [tocado, setTocado] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  // Salida deliberada (confirmada o recién creada): el guardia no vuelve a preguntar.
  const saliendo = useRef(false)

  // El guardia atrapa las salidas que no pasan por el botón: la barra lateral, el «atrás» del navegador, un enlace.
  const bloqueo = useBlocker(({ nextLocation }) => !saliendo.current && tocado && nextLocation.pathname !== window.location.pathname)
  const salidaBloqueada = bloqueo.state === 'blocked' ? bloqueo : null
  const salir = () => {
    saliendo.current = true
    navigate(RUTA_TAREAS)
  }
  const pedirSalir = () => (tocado ? setConfirmarSalida(true) : salir())

  // Cada cambio reinicia el guardado del borrador y borra el error de ese campo.
  const cambio = (campo?: keyof Errores) => {
    setTocado(true)
    avisarCambio()
    if (campo) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  const crear = () => {
    const encontrados: Errores = {}
    if (!titulo.trim()) encontrados.titulo = 'Escribe el título de la tarea.'
    if (!asignados.length) encontrados.asignados = 'Elige al menos una persona.'
    if (!finaliza) encontrados.finaliza = 'Elige cuándo finaliza.'
    setErrores(encontrados)
    if (Object.keys(encontrados).length || !finaliza) return

    // Una tarea por persona: así se ve y se sigue en Seguimiento.
    const marca = Date.now()
    const nuevas: Tarea[] = asignados.map((nombre, indice) => ({
      id: `t-${marca}-${indice}`,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      plan,
      asignado: nombre,
      area: PERSONAS.find((persona) => persona.nombre === nombre)?.area ?? 'Talento Humano',
      prioridad,
      estado: 'Por hacer',
      tipo,
      contenido: tipo === 'Aprendizaje' && contenido ? contenido : undefined,
      finaliza: aFechaIso(finaliza),
      creada: HOY_ISO,
      subtareas: [],
      historial: [],
    }))
    toast.add({
      type: 'success',
      title: 'Tarea creada',
      description: `«${titulo.trim()}» quedó asignada a ${asignados.length} ${plural(asignados.length, 'persona', 'personas')}.`,
    })
    saliendo.current = true
    navigate(RUTA_TAREAS, { state: { tareasNuevas: nuevas } })
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        breadcrumbs={[{ label: 'Tareas', path: RUTA_TAREAS }, { label: 'Crear tarea' }]}
        title="Crear tarea"
        description="Asigna una tarea de seguimiento a una o varias personas y define su prioridad y su fecha de cierre."
        actions={<BotonSalirCreacion onClick={pedirSalir} />}
      />

      <PageContent className="pb-2">
        <Frame>
          <FrameHeader>
            <FrameTitle>La tarea</FrameTitle>
            <FrameDescription>Qué hay que hacer y de qué tipo es.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-5">
            <Field data-invalid={errores.titulo ? 'true' : undefined}>
              <FieldLabel htmlFor="tarea-titulo">Título</FieldLabel>
              <Input
                id="tarea-titulo"
                placeholder="Ej. Preparar kit de bienvenida para nuevos asesores"
                value={titulo}
                aria-invalid={errores.titulo ? true : undefined}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  cambio('titulo')
                }}
              />
              {errores.titulo ? <FieldError>{errores.titulo}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="tarea-descripcion">Descripción</FieldLabel>
              <Textarea
                id="tarea-descripcion"
                rows={4}
                placeholder="Qué se espera y cómo se sabe que está lista"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  cambio()
                }}
              />
            </Field>

            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <RadioGroup
                value={tipo}
                onValueChange={(valor) => {
                  setTipo(valor as TipoTarea)
                  cambio()
                }}
                className="grid gap-3 sm:grid-cols-2"
              >
                <FieldLabel htmlFor="tipo-estandar">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Estándar</FieldTitle>
                      <FieldDescription>Se finaliza a mano cuando está lista.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="Estándar" id="tipo-estandar" />
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="tipo-aprendizaje">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Aprendizaje</FieldTitle>
                      <FieldDescription>Se finaliza sola al completar el contenido.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="Aprendizaje" id="tipo-aprendizaje" />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </Field>

            {tipo === 'Aprendizaje' ? (
              <Field>
                <FieldLabel htmlFor="tarea-contenido">Contenido</FieldLabel>
                <Select
                  value={contenido}
                  onValueChange={(valor) => {
                    setContenido(String(valor ?? ''))
                    cambio()
                  }}
                >
                  <SelectTrigger id="tarea-contenido" className="w-full">
                    <SelectValue placeholder="Elige un curso, ruta o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENIDOS.map((opcion) => (
                      <SelectItem key={opcion} value={opcion}>
                        {opcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Opcional. La tarea finalizará al completar el contenido.</FieldDescription>
              </Field>
            ) : null}
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>Asignación y seguimiento</FrameTitle>
            <FrameDescription>Quiénes la hacen, qué tan urgente es y cuándo vence.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-5">
            <Field data-invalid={errores.asignados ? 'true' : undefined}>
              <FieldLabel htmlFor="tarea-asignados">Asignar a</FieldLabel>
              <SelectorMultiple
                id="tarea-asignados"
                opciones={NOMBRES}
                valor={asignados}
                invalido={!!errores.asignados}
                placeholder="Busca por nombre…"
                onCambio={(nuevo) => {
                  setAsignados(nuevo)
                  cambio('asignados')
                }}
              />
              {errores.asignados ? (
                <FieldError>{errores.asignados}</FieldError>
              ) : (
                <FieldDescription>Cada persona recibe la tarea y la sigues aquí, en Tareas.</FieldDescription>
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tarea-prioridad">Prioridad</FieldLabel>
                <Select
                  value={prioridad}
                  onValueChange={(valor) => {
                    setPrioridad(valor as Prioridad)
                    cambio()
                  }}
                >
                  <SelectTrigger id="tarea-prioridad" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((opcion) => (
                      <SelectItem key={opcion} value={opcion}>
                        {opcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={errores.finaliza ? 'true' : undefined}>
                <FieldLabel htmlFor="tarea-finaliza">Finaliza el</FieldLabel>
                <CampoFecha
                  id="tarea-finaliza"
                  valor={finaliza}
                  desde={HOY}
                  invalido={!!errores.finaliza}
                  onCambio={(fecha) => {
                    setFinaliza(fecha)
                    cambio('finaliza')
                  }}
                />
                {errores.finaliza ? <FieldError>{errores.finaliza}</FieldError> : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="tarea-plan">Plan</FieldLabel>
              <Select
                value={plan}
                onValueChange={(valor) => {
                  setPlan(String(valor ?? SIN_PLAN))
                  cambio()
                }}
              >
                <SelectTrigger id="tarea-plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANES.map((opcion) => (
                    <SelectItem key={opcion} value={opcion}>
                      {opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Opcional. Si es parte de un plan, se ve también en su detalle.</FieldDescription>
            </Field>
          </FramePanel>
        </Frame>

        <PageActionBar className="mb-1">
          {/* El estado del guardado aparece en cuanto hay algo que guardar. */}
          {tocado ? <ChipGuardado estado={guardado} /> : <span />}
          <Button className="ml-auto" onClick={crear}>
            Crear tarea
          </Button>
        </PageActionBar>
      </PageContent>

      {/* Lo que se pierde, en la ventana de confirmar: el título fijo y la tarea en el cuerpo (Carlos, 1-oct). Sirve al
          botón de salir y, con la misma pregunta, a las salidas que no pasan por él. */}
      <DialogoConfirmar
        abierto={confirmarSalida || salidaBloqueada !== null}
        onAbiertoChange={(abierto) => {
          if (abierto) return
          setConfirmarSalida(false)
          salidaBloqueada?.reset()
        }}
        size="sm"
        icono={LogoutSquare01Icon}
        titulo="¿Salir sin guardar?"
        descripcion="Lo que llevas se pierde: la tarea no se guarda al salir."
        cancelar="Seguir editando"
        accion="Salir sin guardar"
        destructiva
        onConfirmar={() => {
          setConfirmarSalida(false)
          if (salidaBloqueada) {
            saliendo.current = true
            salidaBloqueada.proceed()
          } else {
            salir()
          }
        }}
      >
        <RegistroConfirmar nombre={titulo.trim() || 'Tarea sin título'} detalle="Tarea de seguimiento" estado="Sin guardar" />
      </DialogoConfirmar>
    </PageShell>
  )
}

Component.displayName = 'AdminTareasCrearTarea'
