import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, AlertCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
  cn,} from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { BarraEditor } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/barras'
import { DOS_COLUMNAS_RESUMEN } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/columna'
import { RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import {
  CONTENIDOS_CERT,
  ICONO_MODO,
  PERSONAS,
  TIPOS_CONTENIDO,
  TITULO_MODO,
  VENTANA_DUPLICADO_MS,
  certificadosEncontrados,
  contenidoPorId,
  formularioDeEjemplo,
  formularioVacio,
  hashDe,
  huella,
  leerHash,
  personaPorId,
  validar,
  type Errores,
  type Estado,
  type Formulario,
  type Modo,
  type Solicitud,
  type TipoContenidos,
} from './components/logica'
import { ModalSinResultados, ResumenSolicitud } from './components/modales'
import { abrirCorreo } from './components/correo'

// Aprendizaje › Certificados › Descarga (HU-LMS-007). Parte del caso «Revisar y confirmar» de Design system ›
// Formularios y suma lo que tiene el prototipo: correo de destino con confirmación, tipo de contenidos, usuarios
// inactivos, sin resultados, error y el correo que llega. Cada estado tiene su dirección (#contenido-confirmacion…).

/**
 * Qué alcance tiene cada modo, y nada más. **Sin la coletilla del rango de fechas**: el rango se pide igual en los
 * tres y se elige en el campo de abajo, así que decirlo tres veces solo estiraba las tarjetas a lo alto, que es el
 * espacio que escasea aquí (Dave, 13-oct).
 */
const DESCRIPCION_MODO: Record<Modo, string> = {
  global: 'Todos los certificados emitidos en tu empresa.',
  contenido: 'Todos los certificados emitidos para el contenido seleccionado.',
  colaborador: 'Todos los certificados emitidos para el colaborador seleccionado.',
}

type Aviso = 'validacion' | 'duplicada' | 'error' | 'registrada' | null

const etiquetaContenido = (id: string) => {
  const c = contenidoPorId(id)
  return c ? `${c.titulo} · ${c.origen}` : ''
}
const ETIQUETAS_CONTENIDO = CONTENIDOS_CERT.map((c) => etiquetaContenido(c.id))
const NOMBRES = PERSONAS.map((p) => p.nombre)


/** El formulario con el que cada estado de ejemplo se ve como debe (sin resultados de verdad no encuentra nada). */
function formularioParaEstado(modo: Modo, estado: Estado): Formulario {
  if (estado === 'vacio' || estado === 'validacion') return formularioVacio(modo)
  const f = formularioDeEjemplo(modo)
  if (estado !== 'sin-resultados') return f
  if (modo === 'contenido') return { ...f, contenidoId: CONTENIDOS_CERT.find((c) => !c.conCertificado)?.id ?? null }
  if (modo === 'colaborador') return { ...f, personaId: PERSONAS[3]?.id ?? null }
  return { ...f, rango: { from: new Date('2024-01-01T00:00:00'), to: new Date('2024-06-30T00:00:00') } }
}


export function Component() {
  const [f, setF] = useState<Formulario>(() => formularioVacio('global'))
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState<Aviso>(null)
  const [modal, setModal] = useState<'confirmar' | 'sin-resultados' | null>(null)
  // Lo pedido en esta sesión, solo para el anti-duplicado de 48 horas (RN-03); no se muestra en pantalla.
  const [pedidas, setPedidas] = useState<Solicitud[]>([])

  const irA = (modo: Modo, estado: Estado) => window.history.replaceState(null, '', `${window.location.pathname}${hashDe(modo, estado)}`)

  // Llegar a una dirección con estado siembra el ejemplo y abre lo que corresponda.
  useEffect(() => {
    const aplicar = () => {
      const { modo, estado } = leerHash(window.location.hash)
      const nuevo = formularioParaEstado(modo, estado)
      setF(nuevo)
      setModal(estado === 'confirmacion' ? 'confirmar' : estado === 'sin-resultados' ? 'sin-resultados' : null)
      setErrores(estado === 'validacion' ? validar(nuevo) : {})
      setAviso(estado === 'validacion' ? 'validacion' : estado === 'error' ? 'error' : estado === 'duplicada' ? 'duplicada' : estado === 'registrada' ? 'registrada' : null)
      if (estado === 'duplicada' || estado === 'registrada') {
        const solicitud = { huella: huella(nuevo), formulario: nuevo, certificados: certificadosEncontrados(nuevo), hora: Date.now() - 20 * 60 * 1000 }
        setPedidas((previas) => (previas.some((s) => s.huella === solicitud.huella) ? previas : [solicitud, ...previas]))
      }
    }
    aplicar()
    window.addEventListener('hashchange', aplicar)
    return () => window.removeEventListener('hashchange', aplicar)
  }, [])

  // Cambiar un campo limpia su error y los avisos de la solicitud anterior.
  const cambiar = (cambio: Partial<Formulario>, campo?: keyof Errores) => {
    setF((previo) => ({ ...previo, ...cambio }))
    if (campo) setErrores((previos) => ({ ...previos, [campo]: undefined }))
    // Si había un aviso de la solicitud anterior (registrada, duplicada, error), se va y la dirección vuelve a «lleno».
    if (aviso && aviso !== 'validacion') {
      setAviso(null)
      irA(f.modo, 'lleno')
    }
  }

  const cambiarModo = (modo: Modo) => {
    setF({ ...formularioVacio(modo), correo: f.correo, confirmarCorreo: f.confirmarCorreo })
    setErrores({})
    setAviso(null)
    irA(modo, 'vacio')
  }

  const solicitar = () => {
    const encontrados = validar(f)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) {
      setAviso('validacion')
      irA(f.modo, 'validacion')
      return
    }
    // RN-03: la misma solicitud dentro de 48 horas no se acepta.
    const igual = pedidas.find((s) => s.huella === huella(f) && Date.now() - s.hora < VENTANA_DUPLICADO_MS)
    if (igual) {
      setAviso('duplicada')
      irA(f.modo, 'duplicada')
      return
    }
    setAviso(null)
    // Sin resultados no hay nada que pedir, y ahí sí hace falta explicar por qué: esa ventana se queda.
    if (certificadosEncontrados(f) === 0) {
      setModal('sin-resultados')
      irA(f.modo, 'sin-resultados')
      return
    }
    // **Sin ventana de confirmación**: lo que decía está a la vista, en el resumen de la derecha, desde antes de
    // pulsar (Dave, 13-oct).
    confirmar()
  }

  const confirmar = () => {
    const solicitud: Solicitud = { huella: huella(f), formulario: f, certificados: certificadosEncontrados(f), hora: Date.now() }
    setPedidas((previas) => [solicitud, ...previas.filter((s) => s.huella !== solicitud.huella)])
    setModal(null)
    setAviso('registrada')
    irA(f.modo, 'registrada')
    // RN-04: en el producto el correo llega cuando el archivo esté listo; el aviso no trae botón. Solo en el prototipo,
    // al cerrarse el aviso se abre la vista previa de ese correo, para ver cómo le llegará.
    toast.add({ type: 'success', title: 'Solicitud registrada', description: 'Revisa tu correo en unos minutos.', onRemove: () => abrirCorreo(f) })
  }

  const cerrarModal = () => {
    setModal(null)
    irA(f.modo, 'lleno')
  }


  // Tipo de contenidos: por colaborador va junto a la persona; en la descarga global, a la izquierda de las fechas.
  const campoTipo = (
    <Field>
      <FieldLabel htmlFor="cert-tipo">Tipo de contenidos</FieldLabel>
      <Select value={f.tipoContenidos} onValueChange={(valor) => cambiar({ tipoContenidos: (valor ?? 'propios') as TipoContenidos })}>
        <SelectTrigger id="cert-tipo" className="w-full">
          <SelectValue>{(valor) => TIPOS_CONTENIDO.find((t) => t.valor === valor)?.etiqueta ?? 'Selecciona una opción'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TIPOS_CONTENIDO.map((t) => (
            <SelectItem key={t.valor} value={t.valor}>
              {t.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )

  /**
   * **Lo que falta va en el resumen, no en la barra**: es donde se mira lo que se va a pedir, y es donde lo ponen los
   * resúmenes de los asistentes de creación (Dave, 13-oct). Se nombran los datos, no se repite el error del campo:
   * el detalle ya lo dice el propio campo al intentar.
   */
  const pendientes = validar(f)
  const obligatorios = f.modo === 'global' ? 3 : 4
  const faltan = [
    pendientes.filtro ? (f.modo === 'contenido' ? 'Contenido' : 'Colaborador') : null,
    pendientes.fechas ? 'Rango de fechas' : null,
    pendientes.correo ? 'Correo de destino' : null,
    pendientes.confirmarCorreo ? 'Confirmar correo' : null,
  ].filter((x): x is string => x !== null)

  const contenido = contenidoPorId(f.contenidoId)
  const persona = personaPorId(f.personaId)

  return (
    <PageShell width="default">
      {/* Qué se hace aquí, no qué pasa al final: lo del .zip y el correo ya lo dicen el marco «Entrega» y el
          resumen de la derecha, y como bajada repetía el final antes de contar el principio (Dave, 13-oct). */}
      <PageHeader
        title="Descarga"
        description="Solicita la descarga masiva de los certificados que han obtenido tus colaboradores."
      />
      <PageContent>
    {aviso === 'registrada' ? (
          <Alert variant="success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
            <AlertTitle>Solicitud registrada</AlertTitle>
            <AlertDescription>
              Cuando esté lista te enviaremos el enlace a {f.correo.trim()}. Estará disponible durante 2 días.
            </AlertDescription>
          </Alert>
        ) : null}
        {aviso === 'duplicada' ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>Esta solicitud ya está en proceso</AlertTitle>
            <AlertDescription>
              Recibirás el archivo .zip en el correo indicado. Para una nueva solicitud, cambia el rango de fechas o
              los filtros, o inténtalo de nuevo en 48 horas.
            </AlertDescription>
          </Alert>
        ) : null}
        {aviso === 'error' ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
            <AlertTitle>No pudimos procesar la solicitud</AlertTitle>
            <AlertDescription>Inténtalo de nuevo en unos minutos.</AlertDescription>
          </Alert>
        ) : null}
        {aviso === 'validacion' ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
            <AlertTitle>Revisa los campos marcados antes de continuar</AlertTitle>
          </Alert>
        ) : null}

        {/* **El formulario a la izquierda y el resumen al lado**, como un paso de creación: lo que se va a pedir se
            ve mientras se llena, no al final en una ventana. En el teléfono el resumen baja debajo. */}
        <div className={cn('grid items-start gap-4', DOS_COLUMNAS_RESUMEN)}>
        <div className="flex min-w-0 flex-col gap-4">
        {/* Dos marcos: qué se descarga y a dónde llega. El título vive en el gris y no se repite dentro. */}
        <Frame>
          <FrameHeader>
            <FrameTitle>Qué certificados</FrameTitle>
            <FrameDescription>El alcance y el periodo de lo que se va a descargar.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <FieldGroup>
              <FieldSet>
                <RadioGroup value={f.modo} onValueChange={(valor) => cambiarModo(valor as Modo)} className="grid gap-3 md:grid-cols-3">
                  {(['global', 'contenido', 'colaborador'] as Modo[]).map((modo) => (
                    <FieldLabel key={modo} htmlFor={`cert-modo-${modo}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            <HugeiconsIcon icon={ICONO_MODO[modo]} size={16} aria-hidden="true" />
                            {TITULO_MODO[modo]}
                          </FieldTitle>
                          <FieldDescription>{DESCRIPCION_MODO[modo]}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={modo} id={`cert-modo-${modo}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>

              <div className="grid gap-6 md:grid-cols-2">
                {f.modo === 'contenido' ? (
                  <Field data-invalid={errores.filtro ? 'true' : undefined} className="md:col-span-2">
                    <FieldLabel htmlFor="cert-contenido">Buscar contenido</FieldLabel>
                    <Combobox
                      items={ETIQUETAS_CONTENIDO}
                      value={contenido ? etiquetaContenido(contenido.id) : null}
                      onValueChange={(valor) => {
                        const elegido = CONTENIDOS_CERT.find((c) => etiquetaContenido(c.id) === valor)
                        cambiar({ contenidoId: elegido?.id ?? null }, 'filtro')
                      }}
                    >
                      <ComboboxInput id="cert-contenido" placeholder="Buscar contenido…" aria-invalid={errores.filtro ? true : undefined} />
                      <ComboboxContent>
                        <ComboboxEmpty>No encontramos contenidos con ese nombre.</ComboboxEmpty>
                        <ComboboxList>
                          {(opcion: string) => (
                            <ComboboxItem key={opcion} value={opcion}>
                              {opcion}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errores.filtro ? <FieldError>{errores.filtro}</FieldError> : <FieldDescription>Contenidos UBITS y los creados por tu empresa.</FieldDescription>}
                  </Field>
                ) : null}

                {f.modo === 'colaborador' ? (
                  <>
                    <Field data-invalid={errores.filtro ? 'true' : undefined}>
                      <FieldLabel htmlFor="cert-persona">Buscar colaborador</FieldLabel>
                      <Combobox
                        items={NOMBRES}
                        value={persona?.nombre ?? null}
                        onValueChange={(valor) => cambiar({ personaId: PERSONAS.find((p) => p.nombre === valor)?.id ?? null }, 'filtro')}
                      >
                        <ComboboxInput id="cert-persona" placeholder="Buscar colaborador…" aria-invalid={errores.filtro ? true : undefined} />
                        <ComboboxContent>
                          <ComboboxEmpty>No encontramos a nadie con ese nombre.</ComboboxEmpty>
                          <ComboboxList>
                            {(opcion: string) => (
                              <ComboboxItem key={opcion} value={opcion}>
                                {opcion}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {errores.filtro ? <FieldError>{errores.filtro}</FieldError> : <FieldDescription>{persona ? persona.area : 'Incluye todos sus certificados del periodo.'}</FieldDescription>}
                    </Field>
                    {campoTipo}
                  </>
                ) : null}

                {f.modo === 'global' ? campoTipo : null}

                <Field data-invalid={errores.fechas ? 'true' : undefined} className={f.modo === 'global' ? undefined : 'md:col-span-2'}>
                  <FieldLabel htmlFor="cert-fechas">Emitidos entre</FieldLabel>
                  <RangoDeFechas id="cert-fechas" valor={f.rango} invalido={!!errores.fechas} placeholder="Elige la fecha inicial y la final" onCambio={(rango) => cambiar({ rango }, 'fechas')} />
                  {errores.fechas ? <FieldError>{errores.fechas}</FieldError> : <FieldDescription>El rango máximo es de un año.</FieldDescription>}
                </Field>

                <Field orientation="horizontal" className="justify-between md:col-span-2">
                  <FieldContent>
                    <FieldLabel htmlFor="cert-inactivos">Incluir usuarios inactivos</FieldLabel>
                    <FieldDescription>Suma los certificados de quienes ya no están activos en la plataforma.</FieldDescription>
                  </FieldContent>
                  <Switch id="cert-inactivos" checked={f.incluirInactivos} onCheckedChange={(v) => cambiar({ incluirInactivos: v })} />
                </Field>
              </div>
            </FieldGroup>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>Entrega</FrameTitle>
            <FrameDescription>Llega un archivo .zip al correo, y el enlace está disponible durante 2 días.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-2">
                <Field data-invalid={errores.correo ? 'true' : undefined}>
                  <FieldLabel htmlFor="cert-correo">Correo de destino</FieldLabel>
                  <Input
                    id="cert-correo"
                    type="email"
                    placeholder="Escribe el correo"
                    value={f.correo}
                    aria-invalid={errores.correo ? true : undefined}
                    onChange={(e) => cambiar({ correo: e.target.value }, 'correo')}
                  />
                  {errores.correo ? <FieldError>{errores.correo}</FieldError> : null}
                </Field>
                <Field data-invalid={errores.confirmarCorreo ? 'true' : undefined}>
                  <FieldLabel htmlFor="cert-confirmar">Confirmar correo</FieldLabel>
                  <Input
                    id="cert-confirmar"
                    type="email"
                    placeholder="Escribe el correo"
                    value={f.confirmarCorreo}
                    aria-invalid={errores.confirmarCorreo ? true : undefined}
                    onChange={(e) => cambiar({ confirmarCorreo: e.target.value }, 'confirmarCorreo')}
                  />
                  {errores.confirmarCorreo ? <FieldError>{errores.confirmarCorreo}</FieldError> : null}
                </Field>
              </div>
            </FieldGroup>
          </FramePanel>
        </Frame>
        </div>

        {/* Se queda a la vista al bajar por el formulario, como el resumen de los asistentes. */}
        <div className="lg:sticky lg:top-4">
          <ResumenSolicitud formulario={f} certificados={certificadosEncontrados(f)} falta={faltan} obligatorios={obligatorios} />
        </div>
        </div>

      </PageContent>

      {/* **La barra de los pasos de creación**, con «Solicitar certificados». Pedir una descarga *es* crear una
          solicitud, así que se recorre como una creación: el formulario a la izquierda, lo que se va a pedir a la
          derecha y la acción abajo, siempre a la vista (Dave, 13-oct). */}
      <BarraEditor mensaje={null} principal={{ texto: 'Solicitar certificados', onClick: solicitar }} />

      <ModalSinResultados abierto={modal === 'sin-resultados'} formulario={f} onCerrar={cerrarModal} />
    </PageShell>
  )
}

Component.displayName = 'AdminAprendizajeCertificadosDescargaPage'
