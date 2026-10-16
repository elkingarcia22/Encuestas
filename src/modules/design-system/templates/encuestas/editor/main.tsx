import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building03Icon,
  Csv01Icon,
  Delete02Icon,
  LogoutSquare01Icon,
  PlusSignIcon,
  Rocket01Icon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
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
  Text,
  Textarea,
  toast,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { PageActionBar } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'

import { DialogoConfirmar, RegistroConfirmar } from '../../../estados/confirmaciones'
import { PantallaDeError } from '../../../estados/errores-sistema'
import { registroQueNoExiste, registroSinEdicion } from '../../../estados/errores-sistema-datos'
import { AdjuntoCsv, type Subida } from '../../../estados/procesos'
import { useTemporizadores } from '../../../estados/temporizadores'
import { GRUPOS } from '../../../formularios/asignacion-datos'
import { SelectorMultiple } from '../../../formularios/asignacion'
import { RangoDeFechas, type Rango } from '../../../formularios/rango-de-fechas'
import { HOY, fechaCorta, plural, textoDeRango } from '../../../patrones/formato'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import {
  PLANTILLAS,
  TIPOS,
  TIPOS_PREGUNTA,
  participantesDe,
  preguntasDe,
  ruta,
  type Alcance,
  type Encuesta,
  type Pregunta,
  type TipoEncuesta,
  type TipoPregunta,
} from '../components/datos'
import { useEncuestas } from '../components/estado'

// Crear o editar una encuesta con el patrón «Formulario por pasos» del design system (Formularios):
// datos generales, preguntas, participantes y revisión. Cada paso valida lo suyo antes de dejar
// avanzar, se puede volver atrás sin perder lo escrito y, al final, se guarda como borrador o se
// activa con una confirmación. Se llega desde «Crear encuesta» (en blanco o con plantilla) y desde
// «Editar» en la lista.

const PASOS = [
  { numero: 1, titulo: 'Datos generales' },
  { numero: 2, titulo: 'Preguntas' },
  { numero: 3, titulo: 'Participantes' },
  { numero: 4, titulo: 'Revisión' },
]

const MAXIMO_DESCRIPCION = 200

const ALCANCES: { valor: Alcance; titulo: string; detalle: string; icono: typeof Building03Icon }[] = [
  { valor: 'empresa', titulo: 'Toda la empresa', detalle: 'Todos los colaboradores con licencia activa.', icono: Building03Icon },
  { valor: 'grupos', titulo: 'Por grupos', detalle: 'Elige uno o varios grupos de colaboradores.', icono: UserGroupIcon },
  { valor: 'archivo', titulo: 'Importar CSV', detalle: 'Sube la lista de participantes en un archivo.', icono: Csv01Icon },
]

type Errores = Partial<Record<'plantilla' | 'nombre' | 'tipo' | 'fechas' | 'preguntas' | 'nuevaPregunta' | 'grupos' | 'archivo', string>>

const aIso = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
const aFecha = (iso: string) => new Date(`${iso}T00:00:00`)

export function Component() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { encuestas } = useEncuestas()
  const editando = id ? encuestas.find((encuesta) => encuesta.id === id) : undefined

  // Solo los borradores y las que no han empezado se editan completas (en progreso, solo el cierre).
  if (id && (!editando || editando.estado === 'Finalizado' || editando.estado === 'En progreso')) {
    return (
      <div className="flex flex-1 flex-col pt-2">
        <PantallaDeError
          error={
            !editando
              ? registroQueNoExiste('esta encuesta', 'Encuestas')
              : registroSinEdicion(
                  'Esta encuesta ya no se puede editar',
                  editando.estado === 'En progreso'
                    ? 'Ya está en curso: el resto queda fijo. Para cambiar su fecha de cierre, usa «Editar» en la lista.'
                    : 'Ya terminó: se pueden consultar sus resultados, pero no cambiarla.',
                  'Encuestas',
                )
          }
          onAccion={() => navigate(ruta())}
        />
      </div>
    )
  }

  return <FormularioEncuesta key={id ?? 'nueva'} editando={editando} conPlantilla={params.get('modo') === 'plantilla'} />
}

Component.displayName = 'EncuestasEditor'

function FormularioEncuesta({ editando, conPlantilla }: { editando?: Encuesta; conPlantilla: boolean }) {
  const navigate = useNavigate()
  const { setEncuestas } = useEncuestas()
  const programar = useTemporizadores()

  const [paso, setPaso] = useState(1)
  const [plantilla, setPlantilla] = useState('')
  const [nombre, setNombre] = useState(editando?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoEncuesta | ''>(editando?.tipo ?? '')
  const [descripcion, setDescripcion] = useState(editando?.descripcion ?? '')
  const [rango, setRango] = useState<Rango>(editando ? { from: aFecha(editando.inicio), to: aFecha(editando.cierre) } : undefined)
  const [preguntas, setPreguntas] = useState<Pregunta[]>(editando ? (editando.preguntas ?? preguntasDe(editando.tipo)) : [])
  const [nueva, setNueva] = useState<{ texto: string; tipo: TipoPregunta }>({ texto: '', tipo: 'Escala del 1 al 5' })
  const [alcance, setAlcance] = useState<Alcance>(editando?.alcance ?? 'empresa')
  const [grupos, setGrupos] = useState<string[]>(editando?.grupos ?? [])
  const [archivo, setArchivo] = useState<Subida>(editando?.alcance === 'archivo' ? 'done' : 'idle')
  const [anonima, setAnonima] = useState(editando?.anonima ?? true)
  const [errores, setErrores] = useState<Errores>({})
  const [tocado, setTocado] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [activando, setActivando] = useState(false)

  const cambiar = () => setTocado(true)
  const limpiar = (...campos: (keyof Errores)[]) =>
    setErrores((previos) => Object.fromEntries(Object.entries(previos).filter(([campo]) => !campos.includes(campo as keyof Errores))))

  const elegida = PLANTILLAS.find((opcion) => opcion.id === plantilla)
  const participantes = participantesDe(alcance, grupos)
  const titulo = editando ? 'Editar encuesta' : conPlantilla ? 'Crear con plantilla' : 'Crear en blanco'

  // Elegir una plantilla (o cambiar el tipo en blanco sin preguntas) trae sus preguntas de base.
  const elegirPlantilla = (valor: string) => {
    const opcion = PLANTILLAS.find((p) => p.id === valor)
    setPlantilla(valor)
    if (opcion) {
      setTipo(opcion.tipo)
      setPreguntas(preguntasDe(opcion.tipo))
    }
    cambiar()
    limpiar('plantilla', 'tipo')
  }

  const elegirTipo = (valor: TipoEncuesta) => {
    setTipo(valor)
    if (!preguntas.length) setPreguntas(preguntasDe(valor))
    cambiar()
    limpiar('tipo')
  }

  const validar = (hasta: number): Errores => {
    const encontrados: Errores = {}
    if (hasta >= 1) {
      if (conPlantilla && !editando && !elegida) encontrados.plantilla = 'Elige una plantilla para seguir.'
      if (!nombre.trim() && !(conPlantilla && elegida)) encontrados.nombre = 'Escribe el nombre: lo verán quienes respondan.'
      if (!tipo) encontrados.tipo = 'Elige el tipo de encuesta.'
      if (!rango?.from || !rango.to) encontrados.fechas = 'Elige la fecha de inicio y la de cierre.'
    }
    if (hasta >= 2 && !preguntas.length) encontrados.preguntas = 'Agrega al menos una pregunta.'
    if (hasta >= 3) {
      if (alcance === 'grupos' && !grupos.length) encontrados.grupos = 'Elige al menos un grupo.'
      if (alcance === 'archivo' && archivo !== 'done') encontrados.archivo = 'Sube el archivo con los participantes.'
    }
    return encontrados
  }

  // Avanza un paso si el actual está completo; atrás siempre se puede ir.
  const irA = (destino: number) => {
    if (destino <= paso) {
      setPaso(destino)
      return
    }
    const encontrados = validar(paso)
    setErrores(encontrados)
    if (!Object.keys(encontrados).length) setPaso(paso + 1)
  }

  const agregarPregunta = () => {
    if (nueva.texto.trim().length < 5) {
      setErrores((previos) => ({ ...previos, nuevaPregunta: 'Escribe la pregunta completa.' }))
      return
    }
    setPreguntas((previas) => [...previas, { id: `p-${previas.length + 1}-${nueva.texto.length}`, texto: nueva.texto.trim(), tipo: nueva.tipo }])
    setNueva({ texto: '', tipo: nueva.tipo })
    cambiar()
    limpiar('nuevaPregunta', 'preguntas')
  }

  const subir = () => {
    setArchivo('uploading')
    limpiar('archivo')
    programar(() => setArchivo('processing'), 900)
    programar(() => setArchivo('done'), 1900)
  }

  const guardar = (activar: boolean) => {
    if (!rango?.from || !rango.to || !tipo) return
    const inicio = aIso(rango.from)
    const datos = {
      nombre: nombre.trim() || elegida?.nombre || 'Encuesta nueva',
      tipo,
      inicio,
      cierre: aIso(rango.to),
      descripcion: descripcion.trim(),
      preguntas,
      alcance,
      grupos,
      anonima,
      participantes: activar ? participantes : null,
      estado: activar ? (aFecha(inicio) <= HOY ? ('En progreso' as const) : ('Por iniciar' as const)) : ('Borrador' as const),
    }
    setEncuestas((todas) =>
      editando
        ? todas.map((encuesta) => (encuesta.id === editando.id ? { ...encuesta, ...datos, tocado: Date.now() } : encuesta))
        : [{ ...datos, id: `s-nueva-${todas.length + 1}`, origen: elegida ? 'UBITS' : 'Propia', respuestas: 0, tocado: Date.now() }, ...todas],
    )
    toast.add({
      type: 'success',
      title: activar ? 'Encuesta activada' : 'Encuesta guardada como borrador',
      description: activar
        ? `Se enviará a ${participantes.toLocaleString('es-CO')} personas el ${fechaCorta(inicio)}.`
        : 'La encontrarás en la lista para terminarla y activarla.',
    })
    navigate(ruta())
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo={titulo}
        descripcion={
          editando
            ? `Ajusta «${editando.nombre}». Mientras no empiece puedes cambiar todo; después, solo la fecha de cierre.`
            : 'Arma la encuesta en cuatro pasos. Queda en borrador hasta que la actives.'
        }
        // Una sola salida, como el asistente de referencia (Crear vacante, 5-oct): «Salir de la creación» a la derecha
        // del título, sin flecha de volver junto a él.
        acciones={<BotonSalirCreacion texto={editando ? 'Salir de la edición' : 'Salir de la creación'} onClick={() => (tocado ? setSaliendo(true) : navigate(ruta()))} />}
        etiqueta={editando ? <Badge variant="secondary">{editando.estado}</Badge> : undefined}
      />

      <Card>
        <CardContent className="flex flex-col gap-8">
          <Stepper value={paso} onValueChange={irA}>
            <StepperNav>
              {PASOS.map((item, indice) => (
                <StepperItem key={item.numero} step={item.numero} completed={paso > item.numero}>
                  <StepperTrigger>
                    <StepperIndicator>
                      {paso > item.numero ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" /> : item.numero}
                    </StepperIndicator>
                    {/* En celular solo caben los números: el nombre queda para lectores de pantalla. */}
                    <StepperTitle className="max-sm:sr-only">{item.titulo}</StepperTitle>
                  </StepperTrigger>
                  {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="pt-6">
              {/* ── 1. Datos generales ── */}
              <StepperContent value={1}>
                <FieldGroup>
                  {conPlantilla && !editando ? (
                    <FieldSet data-invalid={errores.plantilla ? 'true' : undefined}>
                      <FieldLegend>Plantilla</FieldLegend>
                      <RadioGroup value={plantilla} onValueChange={(valor) => elegirPlantilla(String(valor))} className="grid gap-2 md:grid-cols-2">
                        {PLANTILLAS.map((opcion) => (
                          <FieldLabel key={opcion.id} htmlFor={`plantilla-${opcion.id}`}>
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>{opcion.nombre}</FieldTitle>
                                <FieldDescription>{opcion.detalle}</FieldDescription>
                              </FieldContent>
                              <RadioGroupItem value={opcion.id} id={`plantilla-${opcion.id}`} />
                            </Field>
                          </FieldLabel>
                        ))}
                      </RadioGroup>
                      {errores.plantilla ? <FieldError>{errores.plantilla}</FieldError> : null}
                    </FieldSet>
                  ) : null}

                  <div className="grid gap-6 md:grid-cols-2">
                    <Field data-invalid={errores.nombre ? 'true' : undefined}>
                      <FieldLabel htmlFor="encuesta-nombre">
                        Nombre de la encuesta
                        {conPlantilla && !editando ? (
                          <Badge variant="secondary" size="xs">
                            Opcional
                          </Badge>
                        ) : null}
                      </FieldLabel>
                      <Input
                        id="encuesta-nombre"
                        value={nombre}
                        placeholder={conPlantilla && !editando ? (elegida?.nombre ?? 'El de la plantilla') : 'Por ejemplo: Pulso de bienestar octubre'}
                        aria-invalid={errores.nombre ? true : undefined}
                        onChange={(evento) => {
                          setNombre(evento.target.value)
                          cambiar()
                          limpiar('nombre')
                        }}
                      />
                      {errores.nombre ? <FieldError>{errores.nombre}</FieldError> : <FieldDescription>Lo verán quienes respondan.</FieldDescription>}
                    </Field>

                    <Field data-invalid={errores.tipo ? 'true' : undefined}>
                      <FieldLabel htmlFor="encuesta-tipo">Tipo de encuesta</FieldLabel>
                      <Select value={tipo || null} onValueChange={(valor) => valor && elegirTipo(valor as TipoEncuesta)} disabled={Boolean(elegida)}>
                        <SelectTrigger id="encuesta-tipo" className="w-full" aria-invalid={errores.tipo ? true : undefined}>
                          <SelectValue placeholder="Seleccionar…" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS.map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errores.tipo ? (
                        <FieldError>{errores.tipo}</FieldError>
                      ) : (
                        <FieldDescription>{elegida ? 'Lo define la plantilla.' : 'Define con qué otras encuestas se compara.'}</FieldDescription>
                      )}
                    </Field>

                    <Field data-invalid={errores.fechas ? 'true' : undefined}>
                      <FieldLabel htmlFor="encuesta-fechas">Fechas de inicio y cierre</FieldLabel>
                      <RangoDeFechas
                        id="encuesta-fechas"
                        valor={rango}
                        onCambio={(valor) => {
                          setRango(valor)
                          cambiar()
                          limpiar('fechas')
                        }}
                        invalido={Boolean(errores.fechas)}
                        desde={HOY}
                      />
                      {errores.fechas ? <FieldError>{errores.fechas}</FieldError> : <FieldDescription>El inicio debe ser igual o mayor a hoy.</FieldDescription>}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="encuesta-descripcion">
                        Mensaje de invitación
                        <Badge variant="secondary" size="xs">
                          Opcional
                        </Badge>
                      </FieldLabel>
                      <Textarea
                        id="encuesta-descripcion"
                        rows={3}
                        value={descripcion}
                        maxLength={MAXIMO_DESCRIPCION}
                        placeholder="Cuéntales para qué es y cuánto les tomará."
                        onChange={(evento) => {
                          setDescripcion(evento.target.value)
                          cambiar()
                        }}
                      />
                      <FieldDescription>
                        {descripcion.length}/{MAXIMO_DESCRIPCION} caracteres
                      </FieldDescription>
                    </Field>
                  </div>
                </FieldGroup>
              </StepperContent>

              {/* ── 2. Preguntas ── */}
              <StepperContent value={2}>
                <div className="flex flex-col gap-6">
                  <Field data-invalid={errores.preguntas ? 'true' : undefined}>
                    <FieldLabel>
                      Preguntas
                      <Badge variant="secondary" size="xs" radius="full">
                        {preguntas.length}
                      </Badge>
                    </FieldLabel>
                    {preguntas.length ? (
                      <ItemGroup className="gap-2">
                        {preguntas.map((pregunta, indice) => (
                          <Item key={pregunta.id} variant="outline" size="sm">
                            <ItemMedia>
                              <Badge variant="secondary" radius="full">
                                {indice + 1}
                              </Badge>
                            </ItemMedia>
                            <ItemContent className="min-w-0">
                              <ItemTitle className="whitespace-normal">{pregunta.texto}</ItemTitle>
                              <ItemDescription>{pregunta.tipo}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              <BotonIcono
                                aria-label={`Quitar la pregunta ${indice + 1}`}
                                onClick={() => {
                                  setPreguntas((previas) => previas.filter((p) => p.id !== pregunta.id))
                                  cambiar()
                                }}
                              >
                                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                              </BotonIcono>
                            </ItemActions>
                          </Item>
                        ))}
                      </ItemGroup>
                    ) : (
                      // «Primera vez» del sistema, con ilustración (decisión 14 de la auditoría). Sin botón: la salida es
                      // el campo de abajo.
                      <PrimeraVez
                        className="border"
                        icono="glass-document"
                        titulo="Sin preguntas"
                        descripcion="Escribe la primera abajo o vuelve al paso anterior y elige el tipo de encuesta para traer las de base."
                      />
                    )}
                    {errores.preguntas ? <FieldError>{errores.preguntas}</FieldError> : null}
                  </Field>

                  <FieldSet data-invalid={errores.nuevaPregunta ? 'true' : undefined}>
                    <FieldLegend variant="label">Agregar pregunta</FieldLegend>
                    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]">
                      <Field data-invalid={errores.nuevaPregunta ? 'true' : undefined}>
                        <Input
                          aria-label="Texto de la pregunta"
                          value={nueva.texto}
                          placeholder="¿Qué tan claro tienes lo que se espera de ti?"
                          aria-invalid={errores.nuevaPregunta ? true : undefined}
                          onChange={(evento) => {
                            setNueva((previa) => ({ ...previa, texto: evento.target.value }))
                            limpiar('nuevaPregunta')
                          }}
                          onKeyDown={(evento) => {
                            if (evento.key === 'Enter') agregarPregunta()
                          }}
                        />
                        {errores.nuevaPregunta ? <FieldError>{errores.nuevaPregunta}</FieldError> : null}
                      </Field>
                      <Select value={nueva.tipo} onValueChange={(valor) => valor && setNueva((previa) => ({ ...previa, tipo: valor as TipoPregunta }))}>
                        <SelectTrigger className="w-full" aria-label="Tipo de respuesta">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PREGUNTA.map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={agregarPregunta}>
                        <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" data-icon="inline-start" />
                        Agregar
                      </Button>
                    </div>
                  </FieldSet>
                </div>
              </StepperContent>

              {/* ── 3. Participantes ── */}
              <StepperContent value={3}>
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend>¿Quiénes responden?</FieldLegend>
                    <RadioGroup
                      value={alcance}
                      onValueChange={(valor) => {
                        setAlcance(valor as Alcance)
                        cambiar()
                        limpiar('grupos', 'archivo')
                      }}
                      className="grid gap-2 md:grid-cols-3"
                    >
                      {ALCANCES.map((opcion) => (
                        <FieldLabel key={opcion.valor} htmlFor={`alcance-${opcion.valor}`}>
                          <Field orientation="horizontal">
                            <HugeiconsIcon icon={opcion.icono} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                            <FieldContent>
                              <FieldTitle>{opcion.titulo}</FieldTitle>
                              <FieldDescription>{opcion.detalle}</FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value={opcion.valor} id={`alcance-${opcion.valor}`} />
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </FieldSet>

                  {alcance === 'grupos' ? (
                    <Field data-invalid={errores.grupos ? 'true' : undefined}>
                      <FieldLabel htmlFor="encuesta-grupos">Grupos</FieldLabel>
                      <SelectorMultiple
                        id="encuesta-grupos"
                        opciones={GRUPOS}
                        valor={grupos}
                        onCambio={(valor) => {
                          setGrupos(valor)
                          cambiar()
                          limpiar('grupos')
                        }}
                        placeholder="Busca un grupo"
                        invalido={Boolean(errores.grupos)}
                      />
                      {errores.grupos ? (
                        <FieldError>{errores.grupos}</FieldError>
                      ) : (
                        <FieldDescription>
                          {grupos.length} {plural(grupos.length, 'grupo', 'grupos')} · {participantes.toLocaleString('es-CO')} personas
                        </FieldDescription>
                      )}
                    </Field>
                  ) : null}

                  {alcance === 'archivo' ? (
                    <Field data-invalid={errores.archivo ? 'true' : undefined}>
                      <FieldLabel>Archivo de participantes</FieldLabel>
                      <AdjuntoCsv
                        estado={archivo}
                        vacio={{ titulo: 'Elige el CSV con los participantes', descripcion: 'Una columna «username» · hasta 1 MB' }}
                        nombre="participantes-encuesta.csv"
                        descripcion={archivo === 'done' ? `${participantes} usuarios encontrados` : archivo === 'processing' ? 'Buscando a los usuarios…' : 'Subiendo…'}
                        porcentaje={archivo === 'uploading' ? 60 : 100}
                        onElegir={subir}
                        onQuitar={() => setArchivo('idle')}
                      />
                      {errores.archivo ? <FieldError>{errores.archivo}</FieldError> : null}
                    </Field>
                  ) : null}

                  <Separator />

                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Respuestas anónimas</FieldTitle>
                      <FieldDescription>Los resultados se ven por grupo, nunca por persona. Recomendado en clima y riesgo psicosocial.</FieldDescription>
                    </FieldContent>
                    <Switch
                      id="encuesta-anonima"
                      checked={anonima}
                      onCheckedChange={(valor) => {
                        setAnonima(valor)
                        cambiar()
                      }}
                    />
                  </Field>
                </FieldGroup>
              </StepperContent>

              {/* ── 4. Revisión (patrón «Revisar y confirmar») ── */}
              <StepperContent value={4}>
                <div className="flex flex-col gap-3">
                  <Text size="sm" weight="medium">
                    Antes de activarla, revisa
                  </Text>
                  <div className="flex flex-col gap-2">
                    {[
                      ['Nombre', nombre.trim() || elegida?.nombre || 'Encuesta nueva', 1],
                      ['Tipo', tipo, 1],
                      ['Fechas', textoDeRango(rango), 1],
                      ['Preguntas', `${preguntas.length} ${plural(preguntas.length, 'pregunta', 'preguntas')}`, 2],
                      ['Participantes', `${ALCANCES.find((a) => a.valor === alcance)?.titulo} · ${participantes.toLocaleString('es-CO')} personas`, 3],
                      ['Respuestas', anonima ? 'Anónimas' : 'Con nombre', 3],
                    ].map(([etiqueta, valor, pasoDelDato], indice) => (
                      <div key={String(etiqueta)} className="flex flex-col gap-2">
                        {indice > 0 ? <Separator /> : null}
                        <div className="flex items-center justify-between gap-4">
                          <Text variant="muted" size="sm">
                            {etiqueta}
                          </Text>
                          <div className="flex min-w-0 items-center gap-2">
                            <Text size="sm" className="truncate">
                              {valor}
                            </Text>
                            <Button variant="link" size="xs" onClick={() => setPaso(Number(pasoDelDato))}>
                              Cambiar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </StepperContent>
            </StepperPanel>
          </Stepper>
        </CardContent>
      </Card>

      {/* Barra fija abajo, como el patrón Navegación › Pasos: el estado de guardado a la izquierda y los pasos a la
          derecha, a la vista aunque el formulario sea largo. Con un paso corto baja hasta el final de la pantalla. */}
      <PageActionBar className="mt-auto">
        <ChipGuardado estado={tocado ? 'editando' : 'guardado'} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={paso === 1} onClick={() => setPaso((actual) => Math.max(actual - 1, 1))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" data-icon="inline-start" />
            Atrás
          </Button>
          {paso < PASOS.length ? (
            <Button onClick={() => irA(paso + 1)}>
              Siguiente
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => guardar(false)}>
                Guardar como borrador
              </Button>
              <Button onClick={() => setActivando(true)}>
                <HugeiconsIcon icon={Rocket01Icon} aria-hidden="true" data-icon="inline-start" />
                Activar encuesta
              </Button>
            </>
          )}
        </div>
      </PageActionBar>

      {/* Activar avisa a mucha gente: confirmación con lo que va a pasar (escalón 2). */}
      <DialogoConfirmar
        abierto={activando}
        onAbiertoChange={setActivando}
        icono={Rocket01Icon}
        titulo="¿Activar la encuesta?"
        descripcion={`Se enviará a ${participantes.toLocaleString('es-CO')} personas el día de inicio. Después solo podrás cambiar la fecha de cierre.`}
        cancelar="Seguir revisando"
        accion="Sí, activar"
        onConfirmar={() => {
          setActivando(false)
          guardar(true)
        }}
      />

      {/* Salir con cambios es preguntar antes de hacer algo: DialogoConfirmar con sus tres salidas y en su tamaño normal
          (en el chico los tres botones no caben en una fila). El título es fijo; la encuesta va en la tarjeta. */}
      <DialogoConfirmar
        abierto={saliendo}
        onAbiertoChange={setSaliendo}
        icono={LogoutSquare01Icon}
        titulo={editando ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          editando
            ? 'Tienes cambios sin guardar. Si sales ahora, la encuesta queda como estaba.'
            : 'Tienes cambios sin guardar. Si sales ahora, la encuesta no se guarda.'
        }
        cancelar="Seguir editando"
        otra={{
          texto: 'Salir sin guardar',
          onClick: () => {
            setSaliendo(false)
            navigate(ruta())
          },
        }}
        accion="Guardar y salir"
        onConfirmar={() => {
          setSaliendo(false)
          // Guardar como borrador pide al menos las fechas y el tipo: si faltan, se vuelve a los datos generales.
          if (!rango?.from || !rango.to || !tipo) {
            setErrores(validar(1))
            setPaso(1)
            return
          }
          guardar(false)
        }}
      >
        <RegistroConfirmar
          nombre={nombre.trim() || elegida?.nombre || 'Encuesta sin título'}
          detalle={editando ? 'Encuesta · en edición' : 'Encuesta nueva'}
          estado="Cambios sin guardar"
        />
      </DialogoConfirmar>

    </div>
  )
}
