import { useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, LogoutSquare01Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { RangoDeFechas, type Rango } from '@/modules/design-system/formularios/rango-de-fechas'
import { HOY, plural } from '@/modules/design-system/patrones/formato'
import { HOY_ISO, PERSONAS, aFechaIso, type Plan, type Tarea } from '../components/datos'

// Herramientas › Tareas › Crear plan (/admin/tareas/crear-plan). Crear es una página, no una ventana ni un panel
// (decisión 5 de la auditoría): título y descripción fijos, el formulario en secciones y la barra fija abajo con el
// estado del guardado a la izquierda y «Crear plan» a la derecha. La salida es una sola, «Salir de la creación», junto
// al título (regla de creación, 6-oct), y si ya se escribió algo se pregunta antes de salir, también al irse por el
// menú lateral o con «atrás».
//
// Los campos salen de las HU de Tareas:
// - «Planes de formación del colaborador» (HU-TAR-002): el detalle del plan permite «editar nombre/desc/fecha» y
//   tiene «lista de tareas, agregar tarea»; RN-04: «El estado del plan se deriva de avance + fecha».
// - «Seguimiento HR de tareas y planes» (HU-TAR-003): «Creación desde el botón Crear de esta vista»; RN-03: estados
//   de planes «Por hacer, Activo, Finalizado, Vencido». Un plan nuevo nace «Por hacer».
// El responsable y la vigencia (inicio y fin) son los mismos datos que muestra la pestaña Planes.

const RUTA_TAREAS = '/admin/tareas'
const NOMBRES = PERSONAS.map((persona) => persona.nombre)

type Errores = Partial<Record<'nombre' | 'responsable' | 'vigencia', string>>

export function Component() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [vigencia, setVigencia] = useState<Rango>(undefined)
  const [tareas, setTareas] = useState<string[]>([])
  const [nuevaTarea, setNuevaTarea] = useState('')
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

  const agregarTarea = () => {
    const titulo = nuevaTarea.trim()
    if (!titulo || tareas.includes(titulo)) return
    setTareas((previas) => [...previas, titulo])
    setNuevaTarea('')
    cambio()
  }

  const crear = () => {
    const encontrados: Errores = {}
    if (!nombre.trim()) encontrados.nombre = 'Escribe el nombre del plan.'
    if (!responsable) encontrados.responsable = 'Elige quién responde por el plan.'
    if (!vigencia?.from || !vigencia.to) encontrados.vigencia = 'Elige la fecha de inicio y la de finalización.'
    setErrores(encontrados)
    if (Object.keys(encontrados).length || !vigencia?.from || !vigencia.to) return

    const area = PERSONAS.find((persona) => persona.nombre === responsable)?.area ?? 'Talento Humano'
    const fin = aFechaIso(vigencia.to)
    const plan: Plan = {
      id: `p-${Date.now()}`,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      responsable,
      area,
      estado: 'Por hacer',
      inicio: aFechaIso(vigencia.from),
      fin,
      creada: HOY_ISO,
    }
    // Las tareas del plan quedan a cargo del responsable y vencen con el plan; se reasignan desde la lista.
    const nuevas: Tarea[] = tareas.map((titulo, indice) => ({
      id: `${plan.id}-t${indice + 1}`,
      titulo,
      descripcion: '',
      plan: plan.nombre,
      asignado: responsable,
      area,
      prioridad: 'Media',
      estado: 'Por hacer',
      tipo: 'Estándar',
      finaliza: fin,
      creada: HOY_ISO,
      subtareas: [],
      historial: [],
    }))
    toast.add({
      type: 'success',
      title: 'Plan creado',
      description: nuevas.length
        ? `«${plan.nombre}» quedó con ${nuevas.length} ${plural(nuevas.length, 'tarea', 'tareas')}.`
        : `«${plan.nombre}» quedó listo para sumarle tareas.`,
    })
    // La pestaña Planes recibe el plan nuevo ya seleccionado (el mismo camino que usan los planes armados con IA).
    saliendo.current = true
    navigate(RUTA_TAREAS, { state: { nuevos: [{ plan, tareas: nuevas }], elegido: plan.id } })
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        breadcrumbs={[{ label: 'Tareas', path: RUTA_TAREAS }, { label: 'Crear plan' }]}
        title="Crear plan"
        description="Agrupa tareas de seguimiento con un responsable y una vigencia, y míralas avanzar juntas."
        actions={<BotonSalirCreacion onClick={pedirSalir} />}
      />

      <PageContent className="pb-2">
        <Frame>
          <FrameHeader>
            <FrameTitle>El plan</FrameTitle>
            <FrameDescription>Cómo se llama y para qué es.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-5">
            <Field data-invalid={errores.nombre ? 'true' : undefined}>
              <FieldLabel htmlFor="plan-nombre">Nombre</FieldLabel>
              <Input
                id="plan-nombre"
                placeholder="Ej. Onboarding Comercial septiembre"
                value={nombre}
                aria-invalid={errores.nombre ? true : undefined}
                onChange={(e) => {
                  setNombre(e.target.value)
                  cambio('nombre')
                }}
              />
              {errores.nombre ? <FieldError>{errores.nombre}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="plan-descripcion">Descripción</FieldLabel>
              <Textarea
                id="plan-descripcion"
                rows={3}
                placeholder="Qué se quiere lograr con este plan"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  cambio()
                }}
              />
            </Field>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>Responsable y vigencia</FrameTitle>
            <FrameDescription>Quién responde por el plan y entre qué fechas corre. El estado sale del avance y de la fecha.</FrameDescription>
          </FrameHeader>
          <FramePanel className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={errores.responsable ? 'true' : undefined}>
              <FieldLabel htmlFor="plan-responsable">Responsable</FieldLabel>
              <Select
                value={responsable}
                onValueChange={(valor) => {
                  setResponsable(String(valor ?? ''))
                  cambio('responsable')
                }}
              >
                <SelectTrigger id="plan-responsable" className="w-full" aria-invalid={errores.responsable ? true : undefined}>
                  <SelectValue placeholder="Elige una persona" />
                </SelectTrigger>
                <SelectContent>
                  {NOMBRES.map((opcion) => (
                    <SelectItem key={opcion} value={opcion}>
                      {opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errores.responsable ? <FieldError>{errores.responsable}</FieldError> : null}
            </Field>

            <Field data-invalid={errores.vigencia ? 'true' : undefined}>
              <FieldLabel htmlFor="plan-vigencia">Vigencia</FieldLabel>
              <RangoDeFechas
                id="plan-vigencia"
                valor={vigencia}
                desde={HOY}
                invalido={!!errores.vigencia}
                placeholder="Elige inicio y finalización"
                onCambio={(rango) => {
                  setVigencia(rango)
                  cambio('vigencia')
                }}
              />
              {errores.vigencia ? <FieldError>{errores.vigencia}</FieldError> : null}
            </Field>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>Tareas del plan</FrameTitle>
            <FrameDescription>Opcional. También puedes sumarlas después, al crear cada tarea.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="plan-tarea">Nueva tarea</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="plan-tarea"
                  placeholder="Ej. Agendar la inducción con el líder"
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarTarea()
                    }
                  }}
                />
                <Button variant="outline" size="lg" disabled={!nuevaTarea.trim()} onClick={agregarTarea}>
                  <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                  Agregar
                </Button>
              </div>
              <FieldDescription>
                {tareas.length
                  ? `${tareas.length} ${plural(tareas.length, 'tarea', 'tareas')}: quedan a cargo del responsable y vencen con el plan.`
                  : 'Quedan a cargo del responsable y vencen con el plan; después puedes reasignarlas.'}
              </FieldDescription>
            </Field>

            {tareas.length ? (
              <ItemGroup className="flex flex-col gap-2">
                {tareas.map((titulo) => (
                  <Item key={titulo} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle>{titulo}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <BotonIcono
                        aria-label={`Quitar «${titulo}»`}
                        onClick={() => {
                          setTareas((previas) => previas.filter((t) => t !== titulo))
                          cambio()
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                      </BotonIcono>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : null}
          </FramePanel>
        </Frame>

        <PageActionBar className="mb-1">
          {/* El estado del guardado aparece en cuanto hay algo que guardar. */}
          {tocado ? <ChipGuardado estado={guardado} /> : <span />}
          <Button className="ml-auto" onClick={crear}>
            Crear plan
          </Button>
        </PageActionBar>
      </PageContent>

      {/* Lo que se pierde, en la ventana de confirmar: el título fijo y el plan en el cuerpo (Carlos, 1-oct). Sirve al
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
        descripcion="Lo que llevas se pierde: el plan no se guarda al salir."
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
        <RegistroConfirmar nombre={nombre.trim() || 'Plan sin nombre'} detalle="Plan de formación" estado="Sin guardar" />
      </DialogoConfirmar>
    </PageShell>
  )
}

Component.displayName = 'AdminTareasCrearPlan'
