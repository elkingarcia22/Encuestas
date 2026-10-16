import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  MinusSignIcon,
  PlusSignIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Switch,
  Tabs,
  TabsContent,
  Text,
  Textarea,
  toast,
} from '@ubits/flux-ui'
import { Demo, EncabezadoPatron, PestanasDePatron, SectionIntro, VerEnAccion } from '../patrones/piezas'
import { FormularioAsignacion, SelectorMultiple } from './asignacion'
import { COMPETENCIAS } from './asignacion-datos'
import { FormularioRevisarConfirmar } from './revisar-confirmar'
import { FormularioPorSecciones } from './secciones-360'
import { CampoFecha, RangoDeFechas, type Rango } from './rango-de-fechas'
import { SelectorColor } from './selector-color'
import { fechaCorta, HOY, plural } from '../patrones/formato'
import {
  AREAS,
  BORRADOR_VACIO,
  ETIQUETAS,
  MAXIMO_DESCRIPCION,
  validarCampo,
  validarTodo,
  type Borrador,
  type Errores,
} from './validacion'

/* -------------------------------------------------------------- anatomía */

function Anatomia() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Cómo se arma un campo"
        description="Etiqueta arriba, campo, y debajo el texto de ayuda o el mensaje de error. Nunca los dos a la vez: cuando hay error, el error reemplaza a la ayuda."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Demo
          title="Las cuatro partes"
          description="Etiqueta, campo, ayuda y error. La ayuda explica qué esperamos; el error dice qué hacer para arreglarlo."
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="anatomia-ok">Nombre del cargo</FieldLabel>
              <Input id="anatomia-ok" defaultValue="Diseñador de producto" />
              <FieldDescription>Así lo verá quien se postule.</FieldDescription>
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="anatomia-error">Correo de contacto</FieldLabel>
              <Input id="anatomia-error" defaultValue="ana@" aria-invalid="true" />
              <FieldError>Revisa el correo: parece que le falta algo.</FieldError>
            </Field>
          </FieldGroup>
        </Demo>

        <Demo
          title="Obligatorio y opcional"
          description="Marca solo lo opcional. Si casi todo es obligatorio, llenar la pantalla de asteriscos no informa de nada."
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="anatomia-req">Nombre del cargo</FieldLabel>
              <Input id="anatomia-req" placeholder="Diseñador de producto" />
            </Field>
            <Field>
              <FieldLabel htmlFor="anatomia-opt">
                Descripción
                <Badge variant="secondary" size="xs">
                  Opcional
                </Badge>
              </FieldLabel>
              <Textarea id="anatomia-opt" placeholder="Cuenta de qué se trata el rol" rows={2} />
            </Field>
          </FieldGroup>
        </Demo>
      </div>

      <Demo
        title="Orientación"
        description="Vertical por defecto. Horizontal solo para interruptores y casillas, donde la etiqueta es corta y el control pequeño."
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="orient-vertical">Vertical (por defecto)</FieldLabel>
            <Input id="orient-vertical" placeholder="La etiqueta va encima" />
            <FieldDescription>Es la que se usa para casi todo.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Publicar en el portal de empleo</FieldTitle>
              <FieldDescription>La vacante será visible para cualquiera.</FieldDescription>
            </FieldContent>
            <Switch id="orient-horizontal" defaultChecked />
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="orient-check" />
            <FieldContent>
              <FieldTitle>Avisarme de cada postulación</FieldTitle>
              <FieldDescription>Un correo por persona, sin resumen diario.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </Demo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Demo
          title="Estados del campo"
          description="Normal, con ayuda, con error, deshabilitado y de solo lectura."
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="estado-normal">Normal</FieldLabel>
              <Input id="estado-normal" placeholder="Escribe aquí" />
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="estado-error">Con error</FieldLabel>
              <Input id="estado-error" defaultValue="ab" aria-invalid="true" />
              <FieldError>Con al menos 3 letras se entiende mejor.</FieldError>
            </Field>
            <Field data-disabled="true">
              <FieldLabel htmlFor="estado-off">Deshabilitado</FieldLabel>
              <Input id="estado-off" defaultValue="No se puede tocar" disabled />
              <FieldDescription>Se habilita al elegir un área.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="estado-lectura">Solo lectura</FieldLabel>
              <Input id="estado-lectura" defaultValue="VAC-2026-0184" readOnly />
              <FieldDescription>Lo genera el sistema, no se edita.</FieldDescription>
            </Field>
          </FieldGroup>
        </Demo>

        <Demo
          title="Agrupar campos"
          description="Cuando varios campos responden a la misma pregunta, van juntos bajo un título."
        >
          <FieldSet>
            <FieldLegend>Cómo quieres recibir las postulaciones</FieldLegend>
            <FieldDescription>Puedes cambiarlo después desde la vacante.</FieldDescription>
            <RadioGroup defaultValue="cada-una">
              <Field orientation="horizontal">
                <RadioGroupItem value="cada-una" id="aviso-cada-una" />
                <FieldContent>
                  <FieldTitle>Una por una</FieldTitle>
                  <FieldDescription>Un correo cada vez que alguien se postula.</FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="resumen" id="aviso-resumen" />
                <FieldContent>
                  <FieldTitle>Resumen diario</FieldTitle>
                  <FieldDescription>Un solo correo cada mañana.</FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="nunca" id="aviso-nunca" />
                <FieldContent>
                  <FieldTitle>No avisarme</FieldTitle>
                  <FieldDescription>Las reviso yo desde el panel.</FieldDescription>
                </FieldContent>
              </Field>
            </RadioGroup>
          </FieldSet>
        </Demo>
      </div>

      <DemoFechas />

      <DemoColor />

      <DemoVarias />
    </div>
  )
}

// Elegir varias opciones: SelectorMultiple (asignacion.tsx), la única versión de la pieza (decisión 21 de la
// auditoría, 5-oct). Es la misma de «Campos que dependen de otros» y de Planes de formación.
function DemoVarias() {
  const [elegidas, setElegidas] = useState<string[]>(['Comunicación efectiva'])
  return (
    <Demo
      title="Elegir varias opciones · SelectorMultiple"
      description="Un buscador con fichas para elegir personas, grupos, contenidos o competencias. Es la pieza de Planes de formación: no se arma otra."
    >
      <Field className="max-w-md">
        <FieldLabel htmlFor="varias-competencias">Competencias del plan</FieldLabel>
        <SelectorMultiple
          id="varias-competencias"
          opciones={COMPETENCIAS}
          valor={elegidas}
          onCambio={setElegidas}
          placeholder="Busca una competencia…"
        />
        <FieldDescription>
          {elegidas.length} {plural(elegidas.length, 'competencia elegida', 'competencias elegidas')}.
        </FieldDescription>
      </Field>
    </Demo>
  )
}

// Color: SelectorColor (selector-color.tsx). La librería no trae selector de color —ni ReUI: los dos usan el del
// navegador—, así que se arma con sus piezas (ficha «selector-color» en diferencias.json). Lo usan el acento del video
// con IA y el de la presentación interactiva (14-oct).
function DemoColor() {
  const [color, setColor] = useState('2f5fe0')
  return (
    <Demo
      title="Color"
      description="SelectorColor en su Field con FieldLabel: el campo muestra el color en un cuadrado y su código, y el botón de restablecer cuando el color cambió; al abrirlo, el área de color (saturación a lo ancho, luz a lo alto, también con las flechas), la barra de tono, el gotero si el navegador lo trae y el código en HEX, RGB o HSL. El valor es siempre un hex de seis dígitos."
    >
      <Field className="max-w-xs">
        <FieldLabel htmlFor="color-demo">Color de acento</FieldLabel>
        <SelectorColor
          id="color-demo"
          valor={color}
          onCambio={setColor}
          etiqueta="Color de acento"
          onRestablecer={color.replace('#', '') !== '2f5fe0' ? () => setColor('2f5fe0') : undefined}
          etiquetaRestablecer="Usar el color de la marca"
        />
      </Field>
    </Demo>
  )
}

// Fechas: las tres formas de la misma pieza (rango-de-fechas.tsx). CampoFecha con `accion` es el «Cambiar fecha» de
// Tareas: allí se usa envuelto como CambiarFecha (en el detalle) y CalendarioFecha (en la ventana de varias filas).
function DemoFechas() {
  const [dia, setDia] = useState<Date | undefined>()
  const [rango, setRango] = useState<Rango>(undefined)
  const [nueva, setNueva] = useState<Date | undefined>()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Demo title="Fechas" description="Un día con CampoFecha y un rango con RangoDeFechas, cada uno en su Field con FieldLabel. El calendario sale en español y no deja elegir antes de hoy; la fecha elegida se escribe con el formato del sistema («1 oct 2026»). Con un rango ya puesto, un clic en otro día empieza un rango nuevo desde ese día.">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fecha-cierre">Fecha de cierre</FieldLabel>
            <CampoFecha id="fecha-cierre" valor={dia} onCambio={setDia} desde={HOY} />
          </Field>
          <Field>
            <FieldLabel htmlFor="fecha-rango">Inicio y cierre</FieldLabel>
            <RangoDeFechas id="fecha-rango" valor={rango} onCambio={setRango} desde={HOY} />
          </Field>
        </FieldGroup>
      </Demo>
      <Demo
        title="Cambiar la fecha desde una acción"
        description="El mismo CampoFecha con accion: se abre desde un botón chico en vez del campo. Es el «Cambiar fecha» de Tareas."
        centrado
      >
        <div className="flex flex-col items-center gap-2">
          <CampoFecha valor={nueva} onCambio={setNueva} desde={HOY} accion={{ etiqueta: 'Cambiar fecha' }} />
          <Text as="span" variant="muted" size="sm">
            {nueva ? `Nueva fecha: ${fechaCorta(nueva.toISOString())}` : 'Sin cambios'}
          </Text>
        </div>
      </Demo>
    </div>
  )
}

/* ------------------------------------------------------------ validación */

function Validacion() {
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO)
  const [tocados, setTocados] = useState<Partial<Record<keyof Borrador, boolean>>>({})
  const [errores, setErrores] = useState<Errores>({})
  const [enviado, setEnviado] = useState(false)
  const [exito, setExito] = useState(false)

  const cambiar = <K extends keyof Borrador>(campo: K, valor: Borrador[K]) => {
    const siguiente = { ...borrador, [campo]: valor }
    setBorrador(siguiente)
    setExito(false)

    // Mientras escribe solo se limpia el error, nunca se añade uno nuevo:
    // corregir a alguien letra por letra es hostil.
    if (errores[campo] && !validarCampo(campo, siguiente)) {
      setErrores((previos) => ({ ...previos, [campo]: undefined }))
    }
  }

  const salirDelCampo = (campo: keyof Borrador) => {
    setTocados((previos) => ({ ...previos, [campo]: true }))
    setErrores((previos) => ({ ...previos, [campo]: validarCampo(campo, borrador) }))
  }

  const enviar = () => {
    const encontrados = validarTodo(borrador)
    setErrores(encontrados)
    setEnviado(true)

    const campos = Object.keys(encontrados) as (keyof Borrador)[]

    if (campos.length === 0) {
      setExito(true)
      toast.add({ type: 'success', title: 'Vacante creada', description: 'Ya está publicada.' })
      return
    }

    setTocados(Object.fromEntries(campos.map((campo) => [campo, true])))
  }

  const limpiar = () => {
    setBorrador(BORRADOR_VACIO)
    setTocados({})
    setErrores({})
    setEnviado(false)
    setExito(false)
  }

  const errorDe = (campo: keyof Borrador) => (tocados[campo] ? errores[campo] : undefined)
  const listaErrores = (Object.keys(errores) as (keyof Borrador)[]).filter((c) => errores[c])
  const restantes = MAXIMO_DESCRIPCION - borrador.descripcion.length

  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Cuándo avisar de un error"
        description="Al salir del campo, no mientras la persona escribe. Y al enviar, con un resumen arriba que lleve a cada problema."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Demo
          title="Mientras escribe"
          description="No se valida. Solo se quita el error si ya lo corrigió."
        >
          <Text variant="muted" size="sm">
            Marcar en rojo a alguien que va por la tercera letra de su correo es corregirle antes de
            que termine de hablar.
          </Text>
        </Demo>
        <Demo
          title="Al salir del campo"
          description="Aquí sí. Ya terminó con ese dato y puede arreglarlo sin perder el hilo."
        >
          <Text variant="muted" size="sm">
            Es el momento en que el aviso llega a tiempo y no interrumpe.
          </Text>
        </Demo>
        <Demo
          title="Al enviar"
          description="Se revisa todo, se resume arriba y el foco va al primer campo con problema."
        >
          <Text variant="muted" size="sm">
            Nadie debería tener que buscar por la pantalla qué salió mal.
          </Text>
        </Demo>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de verdad</CardTitle>
          <CardDescription>
            Envíalo vacío para ver el resumen de errores, o llénalo bien para ver el estado de
            éxito.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {enviado && listaErrores.length > 0 ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
              <AlertTitle>
                {listaErrores.length === 1
                  ? 'Falta un dato para publicar'
                  : `Faltan ${listaErrores.length} datos para publicar`}
              </AlertTitle>
              <AlertDescription>
                <ul className="ml-4 flex list-disc flex-col gap-1">
                  {listaErrores.map((campo) => (
                    <li key={campo}>
                      {ETIQUETAS[campo]}: {errores[campo]}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {exito ? (
            <Alert variant="success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
              <AlertTitle>Vacante publicada</AlertTitle>
              <AlertDescription>
                Ya aparece en el portal de empleo y empezaste a recibir postulaciones.
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field data-invalid={errorDe('titulo') ? 'true' : undefined}>
              <FieldLabel htmlFor="v-titulo">{ETIQUETAS.titulo}</FieldLabel>
              <Input
                id="v-titulo"
                value={borrador.titulo}
                placeholder="Diseñador de producto"
                aria-invalid={errorDe('titulo') ? true : undefined}
                onChange={(event) => cambiar('titulo', event.target.value)}
                onBlur={() => salirDelCampo('titulo')}
              />
              {errorDe('titulo') ? (
                <FieldError>{errorDe('titulo')}</FieldError>
              ) : (
                <FieldDescription>Así lo verá quien se postule.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={errorDe('correo') ? 'true' : undefined}>
              <FieldLabel htmlFor="v-correo">{ETIQUETAS.correo}</FieldLabel>
              <Input
                id="v-correo"
                type="email"
                value={borrador.correo}
                placeholder="nombre@empresa.com"
                aria-invalid={errorDe('correo') ? true : undefined}
                onChange={(event) => cambiar('correo', event.target.value)}
                onBlur={() => salirDelCampo('correo')}
              />
              {errorDe('correo') ? (
                <FieldError>{errorDe('correo')}</FieldError>
              ) : (
                <FieldDescription>Ahí llegan los avisos de postulación.</FieldDescription>
              )}
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={errorDe('area') ? 'true' : undefined}>
                <FieldLabel htmlFor="v-area">{ETIQUETAS.area}</FieldLabel>
                <Select
                  value={borrador.area}
                  onValueChange={(valor) => {
                    cambiar('area', String(valor ?? ''))
                    setTocados((previos) => ({ ...previos, area: true }))
                    setErrores((previos) => ({ ...previos, area: undefined }))
                  }}
                >
                  <SelectTrigger
                    id="v-area"
                    className="w-full"
                    aria-invalid={errorDe('area') ? true : undefined}
                  >
                    <SelectValue>
                      {(valor) => (valor ? AREAS[String(valor)] : 'Elige un área')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREAS).map(([valor, etiqueta]) => (
                      <SelectItem key={valor} value={valor}>
                        {etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errorDe('area') ? <FieldError>{errorDe('area')}</FieldError> : null}
              </Field>

              <Field data-invalid={errorDe('vacantes') ? 'true' : undefined}>
                <FieldLabel htmlFor="v-vacantes">{ETIQUETAS.vacantes}</FieldLabel>
                <NumberField
                  id="v-vacantes"
                  value={borrador.vacantes}
                  min={1}
                  max={50}
                  onValueChange={(valor) => cambiar('vacantes', valor)}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement>
                      <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                    </NumberFieldDecrement>
                    <NumberFieldInput onBlur={() => salirDelCampo('vacantes')} />
                    <NumberFieldIncrement>
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberField>
                {errorDe('vacantes') ? (
                  <FieldError>{errorDe('vacantes')}</FieldError>
                ) : (
                  <FieldDescription>Entre 1 y 50.</FieldDescription>
                )}
              </Field>
            </div>

            <Field data-invalid={errorDe('descripcion') ? 'true' : undefined}>
              <FieldLabel htmlFor="v-descripcion">
                {ETIQUETAS.descripcion}
                <Badge variant="secondary" size="xs">
                  Opcional
                </Badge>
              </FieldLabel>
              <Textarea
                id="v-descripcion"
                rows={3}
                value={borrador.descripcion}
                placeholder="Cuenta de qué se trata el rol"
                aria-invalid={errorDe('descripcion') ? true : undefined}
                onChange={(event) => cambiar('descripcion', event.target.value)}
                onBlur={() => salirDelCampo('descripcion')}
              />
              {errorDe('descripcion') ? (
                <FieldError>{errorDe('descripcion')}</FieldError>
              ) : (
                <FieldDescription>
                  {restantes >= 0
                    ? `Te quedan ${restantes} caracteres.`
                    : `Te pasaste por ${-restantes} caracteres.`}
                </FieldDescription>
              )}
            </Field>

            <Field
              orientation="horizontal"
              data-invalid={errorDe('condiciones') ? 'true' : undefined}
            >
              <Checkbox
                id="v-condiciones"
                checked={borrador.condiciones}
                aria-invalid={errorDe('condiciones') ? true : undefined}
                onCheckedChange={(marcado) => {
                  cambiar('condiciones', marcado === true)
                  setTocados((previos) => ({ ...previos, condiciones: true }))
                  setErrores((previos) => ({ ...previos, condiciones: undefined }))
                }}
              />
              <FieldContent>
                <FieldTitle>Acepto la política de contratación</FieldTitle>
                {errorDe('condiciones') ? (
                  <FieldError>{errorDe('condiciones')}</FieldError>
                ) : (
                  <FieldDescription>
                    Publicar una vacante implica aceptar las reglas internas de selección.
                  </FieldDescription>
                )}
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={limpiar}>
              Empezar de nuevo
            </Button>
            <Button onClick={enviar}>Publicar vacante</Button>
          </div>
        </CardContent>
      </Card>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>Los mensajes dicen qué hacer, no qué falló</AlertTitle>
        <AlertDescription>
          «Revisa el correo: parece que le falta algo» sirve. «Campo inválido» no le dice nada a
          nadie. Y el mensaje va pegado al campo, nunca solo arriba del todo.
        </AlertDescription>
      </Alert>
    </div>
  )
}

/* --------------------------------------------------------------- pasos */

const PASOS = [
  { numero: 1, titulo: 'El cargo' },
  { numero: 2, titulo: 'Requisitos' },
  { numero: 3, titulo: 'Revisión' },
]

function PorPasos() {
  const [paso, setPaso] = useState(1)
  const [cargo, setCargo] = useState('')
  const [experiencia, setExperiencia] = useState('media')
  const [error, setError] = useState<string | undefined>(undefined)

  const avanzar = () => {
    if (paso === 1 && cargo.trim().length < 3) {
      setError('Escribe el nombre del cargo para seguir.')
      return
    }

    setError(undefined)
    setPaso((actual) => Math.min(actual + 1, PASOS.length))
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Formulario por pasos"
        description="Se parte cuando son muchos campos. Cada paso valida lo suyo antes de dejar avanzar, y siempre se puede volver atrás sin perder lo escrito."
      />

      <Card>
        <CardContent className="flex flex-col gap-8">
          <Stepper value={paso} onValueChange={setPaso}>
            <StepperNav>
              {PASOS.map((item, indice) => (
                <StepperItem key={item.numero} step={item.numero} completed={paso > item.numero}>
                  <StepperTrigger>
                    <StepperIndicator>
                      {paso > item.numero ? (
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        item.numero
                      )}
                    </StepperIndicator>
                    <StepperTitle>{item.titulo}</StepperTitle>
                  </StepperTrigger>
                  {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="pt-6">
              <StepperContent value={1}>
                <FieldGroup>
                  <Field data-invalid={error ? 'true' : undefined}>
                    <FieldLabel htmlFor="paso-cargo">Nombre del cargo</FieldLabel>
                    <Input
                      id="paso-cargo"
                      value={cargo}
                      placeholder="Diseñador de producto"
                      aria-invalid={error ? true : undefined}
                      onChange={(event) => {
                        setCargo(event.target.value)
                        if (error) setError(undefined)
                      }}
                    />
                    {error ? (
                      <FieldError>{error}</FieldError>
                    ) : (
                      <FieldDescription>Prueba a seguir sin llenarlo.</FieldDescription>
                    )}
                  </Field>
                </FieldGroup>
              </StepperContent>

              <StepperContent value={2}>
                <FieldSet>
                  <FieldLegend>Experiencia que buscas</FieldLegend>
                  <RadioGroup value={experiencia} onValueChange={(v) => setExperiencia(String(v))}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="junior" id="exp-junior" />
                      <FieldContent>
                        <FieldTitle>Menos de 2 años</FieldTitle>
                      </FieldContent>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="media" id="exp-media" />
                      <FieldContent>
                        <FieldTitle>Entre 2 y 5 años</FieldTitle>
                      </FieldContent>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="senior" id="exp-senior" />
                      <FieldContent>
                        <FieldTitle>Más de 5 años</FieldTitle>
                      </FieldContent>
                    </Field>
                  </RadioGroup>
                </FieldSet>
              </StepperContent>

              <StepperContent value={3}>
                <div className="flex flex-col gap-3">
                  <Text size="sm" weight="medium">
                    Antes de publicar, revisa
                  </Text>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-4">
                      <Text variant="muted" size="sm">
                        Cargo
                      </Text>
                      <Text size="sm">{cargo || 'Sin nombre'}</Text>
                    </div>
                    <Separator />
                    <div className="flex items-baseline justify-between gap-4">
                      <Text variant="muted" size="sm">
                        Experiencia
                      </Text>
                      <Text size="sm">
                        {experiencia === 'junior'
                          ? 'Menos de 2 años'
                          : experiencia === 'media'
                            ? 'Entre 2 y 5 años'
                            : 'Más de 5 años'}
                      </Text>
                    </div>
                  </div>
                </div>
              </StepperContent>
            </StepperPanel>
          </Stepper>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              disabled={paso === 1}
              onClick={() => setPaso((actual) => Math.max(actual - 1, 1))}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
              Atrás
            </Button>
            {paso < PASOS.length ? (
              <Button onClick={avanzar}>
                Siguiente
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={() =>
                  toast.add({
                    type: 'success',
                    title: 'Vacante publicada',
                    description: cargo || 'Sin nombre',
                  })
                }
              >
                Publicar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Texto viejo corregido el 5-oct: el aviso decía que los tres pasos salían del mismo azul. Eso pasaba cuando el
          tema pisaba «accent» con el azul principal (global.css); ya no lo pisa y el indicador usa el gris del tema. */}
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>La barra dice dónde estás</AlertTitle>
        <AlertDescription>
          <p>
            Los pasos que faltan salen en gris con su número; el actual, en azul; y los que ya
            completaste, en azul con el visto. Antes los tres salían del mismo azul porque el tema
            pisaba el gris de la librería con el color principal; eso ya se corrigió, también en la
            opción resaltada de los desplegables.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/* ------------------------------------------------ en pantallas reales */

// Los formularios de los templates del administrador que usan estos patrones (reunión del
// 2026-09-14: «un botón en formularios para ver los elementos reales»).
/* ------------------------------------------------------------------ page */

const PESTANAS = [
  { valor: 'anatomia', etiqueta: 'Anatomía' },
  { valor: 'validacion', etiqueta: 'Validación' },
  { valor: 'pasos', etiqueta: 'Por pasos' },
  { valor: 'secciones', etiqueta: 'Secciones que se desbloquean' },
  { valor: 'asignacion', etiqueta: 'Campos que dependen de otros' },
  { valor: 'confirmar', etiqueta: 'Revisar y confirmar' },
]

export function Component() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <EncabezadoPatron titulo="Formularios" acciones={<VerEnAccion pagina="formularios" />}>
          Cómo se arma un campo, cuándo avisar de un error y cómo organizar formularios largos: por
          pasos, por secciones, con campos que aparecen según lo elegido y con un resumen antes de
          enviar. Los ejemplos funcionan y las tres últimas pestañas son formularios reales de UBITS.
        </EncabezadoPatron>

        <Tabs defaultValue="anatomia">
          <PestanasDePatron items={PESTANAS} />
          <TabsContent value="anatomia" className="pt-6">
            <Anatomia />
          </TabsContent>
          <TabsContent value="validacion" className="pt-6">
            <Validacion />
          </TabsContent>
          <TabsContent value="pasos" className="pt-6">
            <PorPasos />
          </TabsContent>
          <TabsContent value="secciones" className="pt-6">
            <FormularioPorSecciones />
          </TabsContent>
          <TabsContent value="asignacion" className="pt-6">
            <FormularioAsignacion />
          </TabsContent>
          <TabsContent value="confirmar" className="pt-6">
            <FormularioRevisarConfirmar />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

Component.displayName = 'DesignSystemFormulariosPage'
