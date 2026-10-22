import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  LockKeyIcon,
  MinusSignIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  Progress,
  ProgressLabel,
  ProgressValue,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'

import { CasoUbits } from '../patrones/piezas'
import { plural, textoDeRango } from '../patrones/formato'
import { RangoDeFechas, type Rango } from './rango-de-fechas'

// Caso: hub de creación de una evaluación 360° (Desempeño y cultura).
// Fuente: HU «Crear evaluación 360°» (RN-01 a RN-06).

type TipoId = 'auto' | 'lider' | 'pares' | 'equipo'
type SeccionId = 'tipo' | 'competencias' | 'evaluados' | 'resultados'

const TIPOS: { id: TipoId; nombre: string; detalle: string }[] = [
  { id: 'auto', nombre: 'Autoevaluación', detalle: 'La persona se evalúa a sí misma' },
  { id: 'lider', nombre: 'Líder', detalle: 'Quien tiene a la persona a cargo' },
  { id: 'pares', nombre: 'Pares', detalle: 'Compañeros del mismo nivel' },
  { id: 'equipo', nombre: 'Colaboradores a cargo', detalle: 'Las personas que le reportan' },
]

// Arranca sumando 90 a propósito: es el caso borde de la historia.
const TIPOS_INICIALES: Record<TipoId, { activo: boolean; peso: number | null }> = {
  auto: { activo: true, peso: 20 },
  lider: { activo: true, peso: 50 },
  pares: { activo: true, peso: 20 },
  equipo: { activo: false, peso: 0 },
}

const ENUNCIADOS = [
  'Comunica con claridad las prioridades del equipo',
  'Da retroalimentación oportuna y concreta',
  'Cumple los compromisos que acuerda',
  'Propone mejoras a la forma de trabajar',
]

const AREAS = ['Producto', 'Ingeniería', 'Personas', 'Comercial', 'Operaciones', 'Marketing']
const GRUPOS = ['Líderes nuevos 2026', 'Cohorte agosto', 'Sucursal Beta', 'Equipo comercial Q3']

const NOMBRES_SECCION: Record<SeccionId, string> = {
  tipo: 'Tipo de evaluación',
  competencias: 'Competencias',
  evaluados: 'Evaluados',
  resultados: 'Resultados',
}

type Estado = 'Bloqueada' | 'Pendiente' | 'Completa'

function EstadoSeccion({ estado }: { estado: Estado }) {
  if (estado === 'Completa') {
    return (
      <Badge variant="success-light" size="sm">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
        Completa
      </Badge>
    )
  }
  if (estado === 'Bloqueada') {
    return (
      <Badge variant="secondary" size="sm">
        <HugeiconsIcon icon={LockKeyIcon} aria-hidden="true" />
        Bloqueada
      </Badge>
    )
  }
  return (
    <Badge variant="warning-light" size="sm">
      Pendiente
    </Badge>
  )
}

export function FormularioPorSecciones() {
  // Datos básicos (RN-01)
  const [nombre, setNombre] = useState('Evaluación de desempeño 2026-II')
  const [rango, setRango] = useState<Rango>(undefined)
  const [basicosListos, setBasicosListos] = useState(false)
  const [erroresBasicos, setErroresBasicos] = useState<{ nombre?: string; fechas?: string }>({})

  // Tipo (RN-02, RN-04)
  const [tipos, setTipos] = useState(TIPOS_INICIALES)
  const [tipoGuardado, setTipoGuardado] = useState(false)
  const [restoDesbloqueado, setRestoDesbloqueado] = useState(false)
  const [errorTipo, setErrorTipo] = useState<string | undefined>(undefined)

  // Competencias (RN-05)
  const [enunciados, setEnunciados] = useState<Record<TipoId, string[]>>({ auto: [], lider: [ENUNCIADOS[0]], pares: [], equipo: [] })
  const [competenciasGuardadas, setCompetenciasGuardadas] = useState(false)
  const [errorCompetencias, setErrorCompetencias] = useState<string | undefined>(undefined)

  // Evaluados y resultados
  const [alcance, setAlcance] = useState('')
  const [area, setArea] = useState('')
  const [grupo, setGrupo] = useState('')
  const [evaluadosGuardados, setEvaluadosGuardados] = useState(false)
  const [errorEvaluados, setErrorEvaluados] = useState<string | undefined>(undefined)
  const [resultadosVisibles, setResultadosVisibles] = useState(true)
  const [cuando, setCuando] = useState('cierre')
  const [resultadosGuardados, setResultadosGuardados] = useState(false)

  const [abierta, setAbierta] = useState<string[]>([])
  const [faltantes, setFaltantes] = useState<SeccionId[]>([])
  const [activada, setActivada] = useState(false)

  const activos = TIPOS.filter((t) => tipos[t.id].activo)
  const suma = activos.reduce((total, t) => total + (tipos[t.id].peso ?? 0), 0)
  const competenciasValidas = activos.length > 0 && activos.every((t) => enunciados[t.id].length > 0)

  const completas: Record<SeccionId, boolean> = {
    tipo: tipoGuardado,
    competencias: competenciasGuardadas && competenciasValidas,
    evaluados: evaluadosGuardados,
    resultados: resultadosGuardados,
  }
  const cuantasCompletas = Object.values(completas).filter(Boolean).length

  const estadoDe = (seccion: SeccionId): Estado => {
    if (completas[seccion]) return 'Completa'
    if (seccion === 'tipo') return basicosListos ? 'Pendiente' : 'Bloqueada'
    return restoDesbloqueado ? 'Pendiente' : 'Bloqueada'
  }

  const abrir = (seccion: SeccionId) => setAbierta([seccion])
  const cerrarYSeguir = (actual: SeccionId) => {
    const orden: SeccionId[] = ['tipo', 'competencias', 'evaluados', 'resultados']
    const siguiente = orden.slice(orden.indexOf(actual) + 1).find((s) => !completas[s] && s !== actual)
    setAbierta(siguiente ? [siguiente] : [])
    setFaltantes((previas) => previas.filter((s) => s !== actual))
  }

  const confirmarBasicos = () => {
    const errores: typeof erroresBasicos = {}
    if (nombre.trim().length < 3) errores.nombre = 'Escribe un nombre de al menos 3 letras.'
    if (!rango?.from || !rango.to) errores.fechas = 'Elige la fecha de inicio y la de cierre.'
    setErroresBasicos(errores)
    if (Object.keys(errores).length) return
    setBasicosListos(true)
    abrir('tipo')
  }

  const cambiarTipo = (id: TipoId, cambio: Partial<{ activo: boolean; peso: number | null }>) => {
    setTipos((previos) => ({ ...previos, [id]: { ...previos[id], ...cambio } }))
    setTipoGuardado(false)
    setErrorTipo(undefined)
  }

  const guardarTipo = () => {
    if (activos.length === 0) return setErrorTipo('Activa al menos un tipo de evaluador.')
    // RN-04: exactamente 100.
    if (suma !== 100) {
      return setErrorTipo(
        suma < 100 ? `Los pesos suman ${suma} %. Te faltan ${100 - suma} para llegar a 100.` : `Los pesos suman ${suma} %. Sobran ${suma - 100}.`,
      )
    }
    setTipoGuardado(true)
    setRestoDesbloqueado(true)
    cerrarYSeguir('tipo')
  }

  const guardarCompetencias = () => {
    const sinEnunciados = activos.filter((t) => enunciados[t.id].length === 0)
    if (sinEnunciados.length) {
      return setErrorCompetencias(
        `Falta al menos un enunciado para ${sinEnunciados.map((t) => t.nombre.toLowerCase()).join(' y ')}.`,
      )
    }
    setErrorCompetencias(undefined)
    setCompetenciasGuardadas(true)
    cerrarYSeguir('competencias')
  }

  const guardarEvaluados = () => {
    if (!alcance) return setErrorEvaluados('Elige a quién se va a evaluar.')
    if (alcance === 'area' && !area) return setErrorEvaluados('Elige el área.')
    if (alcance === 'grupo' && !grupo) return setErrorEvaluados('Elige el grupo.')
    setErrorEvaluados(undefined)
    setEvaluadosGuardados(true)
    cerrarYSeguir('evaluados')
  }

  const activar = () => {
    const pendientes = (Object.keys(completas) as SeccionId[]).filter((s) => !completas[s])
    // RN-03: con secciones incompletas la acción no se ejecuta y se queda en el hub.
    if (!basicosListos || pendientes.length) {
      setFaltantes(pendientes)
      if (pendientes[0] && estadoDe(pendientes[0]) !== 'Bloqueada') abrir(pendientes[0])
      return
    }
    setActivada(true)
    notify('Evaluación 360° creada', 'Ya aparece en el listado como en progreso.', 'success')
  }

  const empezarDeNuevo = () => {
    setNombre('Evaluación de desempeño 2026-II')
    setRango(undefined)
    setBasicosListos(false)
    setTipos(TIPOS_INICIALES)
    setTipoGuardado(false)
    setRestoDesbloqueado(false)
    setEnunciados({ auto: [], lider: [ENUNCIADOS[0]], pares: [], equipo: [] })
    setCompetenciasGuardadas(false)
    setAlcance('')
    setEvaluadosGuardados(false)
    setResultadosGuardados(false)
    setFaltantes([])
    setAbierta([])
    setActivada(false)
  }

  return (
    <CasoUbits
      rol="Administrador"
      donde={['Desempeño y cultura', 'Evaluaciones 360', 'Crear evaluación']}
      titulo="Formulario por secciones que se desbloquean"
      descripcion="Una 360° incompleta se vuelve inviable, así que las secciones se abren en orden y la evaluación solo se activa con las cuatro listas. Los pesos arrancan sumando 90 para que veas el aviso."
      historia="la historia «Crear evaluación 360°»"
      reglas={[
        { titulo: 'Primero nombre y fechas', detalle: 'Hasta confirmarlos, la sección Tipo está bloqueada.' },
        { titulo: 'Tipo abre el resto', detalle: 'Al guardar Tipo se desbloquean Competencias, Evaluados y Resultados.' },
        { titulo: 'Pesos que suman 100', detalle: 'La suma se ve mientras se escribe; no se puede guardar con 90 ni con 110.' },
        { titulo: 'Un enunciado por tipo activo', detalle: 'Competencias no se completa si a un tipo le falta su enunciado.' },
        { titulo: 'Activar con las cuatro', detalle: 'Si falta alguna, no se crea: se dice cuál y se abre.' },
        { titulo: 'El borrador no se guarda', detalle: 'Solo vive mientras dura la creación. Salir pide confirmación (ver Estados).' },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-6">
          {activada ? (
            <Alert variant="success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
              <AlertTitle>«{nombre}» quedó creada</AlertTitle>
              <AlertDescription>En el producto se vuelve al listado con esta confirmación.</AlertDescription>
            </Alert>
          ) : null}

          {faltantes.length > 0 ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
              <AlertTitle>Todavía no se puede activar</AlertTitle>
              <AlertDescription>
                {!basicosListos ? 'Confirma el nombre y las fechas. ' : ''}
                {faltantes.length
                  ? `${plural(faltantes.length, 'Falta la sección', 'Faltan las secciones')} ${faltantes.map((s) => NOMBRES_SECCION[s]).join(', ')}.`
                  : ''}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Datos básicos */}
          {basicosListos ? (
            <Item variant="muted">
              <ItemContent>
                <ItemTitle>{nombre}</ItemTitle>
                <ItemDescription>{textoDeRango(rango)}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="sm" onClick={() => setBasicosListos(false)}>
                  <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                  Editar
                </Button>
              </ItemActions>
            </Item>
          ) : (
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-2">
                <Field data-invalid={erroresBasicos.nombre ? 'true' : undefined}>
                  <FieldLabel htmlFor="e360-nombre">Nombre de la evaluación</FieldLabel>
                  <Input
                    id="e360-nombre"
                    value={nombre}
                    aria-invalid={erroresBasicos.nombre ? true : undefined}
                    onChange={(e) => {
                      setNombre(e.target.value)
                      setErroresBasicos((previos) => ({ ...previos, nombre: undefined }))
                    }}
                  />
                  {erroresBasicos.nombre ? <FieldError>{erroresBasicos.nombre}</FieldError> : <FieldDescription>Así la verán evaluados y evaluadores.</FieldDescription>}
                </Field>
                <Field data-invalid={erroresBasicos.fechas ? 'true' : undefined}>
                  <FieldLabel htmlFor="e360-fechas">Fechas</FieldLabel>
                  <RangoDeFechas
                    id="e360-fechas"
                    valor={rango}
                    desde={new Date('2026-09-11T00:00:00')}
                    invalido={!!erroresBasicos.fechas}
                    onCambio={(nuevo) => {
                      setRango(nuevo)
                      setErroresBasicos((previos) => ({ ...previos, fechas: undefined }))
                    }}
                  />
                  {erroresBasicos.fechas ? <FieldError>{erroresBasicos.fechas}</FieldError> : <FieldDescription>Del primer día para responder al último.</FieldDescription>}
                </Field>
              </div>
              <div>
                <Button onClick={confirmarBasicos}>Confirmar nombre y fechas</Button>
              </div>
            </FieldGroup>
          )}

          <Progress value={cuantasCompletas * 25}>
            <ProgressLabel>
              {cuantasCompletas} de 4 secciones completas
            </ProgressLabel>
            <ProgressValue className="ms-auto" />
          </Progress>

          <Accordion value={abierta} onValueChange={(valor) => setAbierta(valor as string[])}>
            {/* 1 · Tipo */}
            <AccordionItem value="tipo" disabled={estadoDe('tipo') === 'Bloqueada'}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between gap-3 pe-2">
                  <span>1 · {NOMBRES_SECCION.tipo}</span>
                  <EstadoSeccion estado={estadoDe('tipo')} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FieldSet>
                  <FieldLegend>Quién evalúa y cuánto pesa su opinión</FieldLegend>
                  <FieldDescription>Activa los tipos de evaluador. Los pesos de los activos tienen que sumar 100.</FieldDescription>
                  <ItemGroup className="flex flex-col gap-2">
                    {TIPOS.map((tipo) => (
                      <Item key={tipo.id} variant="outline" size="sm">
                        <ItemContent>
                          <Field orientation="horizontal">
                            <Switch
                              id={`tipo-${tipo.id}`}
                              checked={tipos[tipo.id].activo}
                              onCheckedChange={(activo) => cambiarTipo(tipo.id, { activo, peso: activo ? tipos[tipo.id].peso : 0 })}
                            />
                            <FieldContent>
                              <FieldTitle>{tipo.nombre}</FieldTitle>
                              <FieldDescription>{tipo.detalle}</FieldDescription>
                            </FieldContent>
                          </Field>
                        </ItemContent>
                        <ItemActions>
                          <NumberField
                            value={tipos[tipo.id].peso}
                            min={0}
                            max={100}
                            step={5}
                            disabled={!tipos[tipo.id].activo}
                            onValueChange={(peso) => cambiarTipo(tipo.id, { peso })}
                            className="w-32"
                          >
                            <NumberFieldGroup>
                              <NumberFieldDecrement>
                                <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                              </NumberFieldDecrement>
                              <NumberFieldInput aria-label={`Peso de ${tipo.nombre}`} />
                              <NumberFieldIncrement>
                                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                              </NumberFieldIncrement>
                            </NumberFieldGroup>
                          </NumberField>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                  <Field data-invalid={errorTipo ? 'true' : undefined}>
                    <Progress value={Math.min(suma, 100)}>
                      <ProgressLabel>Suma de pesos</ProgressLabel>
                      {/* La barra no pasa de 100, pero el texto dice la suma real (puede ser 110). */}
                      <ProgressValue className="ms-auto">{() => `${suma} de 100 %`}</ProgressValue>
                    </Progress>
                    {errorTipo ? (
                      <FieldError>{errorTipo}</FieldError>
                    ) : (
                      <FieldDescription>
                        {suma === 100 ? 'La suma está bien.' : suma < 100 ? `Te faltan ${100 - suma}.` : `Sobran ${suma - 100}.`}
                      </FieldDescription>
                    )}
                  </Field>
                  <div>
                    <Button onClick={guardarTipo}>Guardar tipo</Button>
                  </div>
                </FieldSet>
              </AccordionContent>
            </AccordionItem>

            {/* 2 · Competencias */}
            <AccordionItem value="competencias" disabled={estadoDe('competencias') === 'Bloqueada'}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between gap-3 pe-2">
                  <span>2 · {NOMBRES_SECCION.competencias}</span>
                  <EstadoSeccion estado={estadoDe('competencias')} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FieldSet>
                  <FieldLegend>Enunciados por tipo de evaluador</FieldLegend>
                  <FieldDescription>Cada tipo activo necesita al menos un enunciado.</FieldDescription>
                  <ItemGroup className="flex flex-col gap-2">
                    {activos.map((tipo) => {
                      const lista = enunciados[tipo.id]
                      return (
                        <Item key={tipo.id} variant="outline" size="sm">
                          <ItemContent>
                            <ItemTitle>
                              {tipo.nombre}
                              <Badge variant={lista.length ? 'success-light' : 'warning-light'} size="xs">
                                {lista.length ? `${lista.length} ${plural(lista.length, 'enunciado', 'enunciados')}` : 'Sin enunciados'}
                              </Badge>
                            </ItemTitle>
                            <ItemDescription>{lista.length ? lista.join(' · ') : 'Agrega el primero para completar la sección.'}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={lista.length >= ENUNCIADOS.length}
                              onClick={() => {
                                setEnunciados((previos) => ({ ...previos, [tipo.id]: [...previos[tipo.id], ENUNCIADOS[previos[tipo.id].length]] }))
                                setCompetenciasGuardadas(false)
                                setErrorCompetencias(undefined)
                              }}
                            >
                              <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                              Agregar enunciado
                            </Button>
                          </ItemActions>
                        </Item>
                      )
                    })}
                  </ItemGroup>
                  {errorCompetencias ? (
                    <Field data-invalid="true">
                      <FieldError>{errorCompetencias}</FieldError>
                    </Field>
                  ) : null}
                  <div>
                    <Button onClick={guardarCompetencias}>Guardar competencias</Button>
                  </div>
                </FieldSet>
              </AccordionContent>
            </AccordionItem>

            {/* 3 · Evaluados */}
            <AccordionItem value="evaluados" disabled={estadoDe('evaluados') === 'Bloqueada'}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between gap-3 pe-2">
                  <span>3 · {NOMBRES_SECCION.evaluados}</span>
                  <EstadoSeccion estado={estadoDe('evaluados')} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FieldSet>
                  <FieldLegend>A quién se evalúa</FieldLegend>
                  <RadioGroup
                    value={alcance}
                    onValueChange={(valor) => {
                      setAlcance(String(valor))
                      setEvaluadosGuardados(false)
                      setErrorEvaluados(undefined)
                    }}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="empresa" id="alcance-empresa" />
                      <FieldContent>
                        <FieldTitle>Toda la empresa</FieldTitle>
                        <FieldDescription>646 personas con licencia activa.</FieldDescription>
                      </FieldContent>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="area" id="alcance-area" />
                      <FieldContent>
                        <FieldTitle>Un área</FieldTitle>
                        <FieldDescription>Todas las personas de esa área.</FieldDescription>
                      </FieldContent>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="grupo" id="alcance-grupo" />
                      <FieldContent>
                        <FieldTitle>Un grupo</FieldTitle>
                        <FieldDescription>Un grupo ya creado en Planes de formación.</FieldDescription>
                      </FieldContent>
                    </Field>
                  </RadioGroup>
                  {alcance === 'area' || alcance === 'grupo' ? (
                    <Field className="max-w-sm">
                      <FieldLabel htmlFor="alcance-cual">{alcance === 'area' ? 'Área' : 'Grupo'}</FieldLabel>
                      <Select
                        value={alcance === 'area' ? area : grupo}
                        onValueChange={(valor) => {
                          ;(alcance === 'area' ? setArea : setGrupo)(String(valor ?? ''))
                          setEvaluadosGuardados(false)
                          setErrorEvaluados(undefined)
                        }}
                      >
                        <SelectTrigger id="alcance-cual" className="w-full">
                          <SelectValue>{(valor) => (valor ? String(valor) : alcance === 'area' ? 'Elige un área' : 'Elige un grupo')}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(alcance === 'area' ? AREAS : GRUPOS).map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}
                  {errorEvaluados ? (
                    <Field data-invalid="true">
                      <FieldError>{errorEvaluados}</FieldError>
                    </Field>
                  ) : null}
                  <div>
                    <Button onClick={guardarEvaluados}>Guardar evaluados</Button>
                  </div>
                </FieldSet>
              </AccordionContent>
            </AccordionItem>

            {/* 4 · Resultados */}
            <AccordionItem value="resultados" disabled={estadoDe('resultados') === 'Bloqueada'}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between gap-3 pe-2">
                  <span>4 · {NOMBRES_SECCION.resultados}</span>
                  <EstadoSeccion estado={estadoDe('resultados')} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Los evaluados ven sus resultados</FieldTitle>
                      <FieldDescription>Si lo apagas, solo Recursos Humanos y los líderes los ven.</FieldDescription>
                    </FieldContent>
                    <Switch
                      checked={resultadosVisibles}
                      onCheckedChange={(valor) => {
                        setResultadosVisibles(valor)
                        setResultadosGuardados(false)
                      }}
                    />
                  </Field>
                  {resultadosVisibles ? (
                    <FieldSet>
                      <FieldLegend>Cuándo los ven</FieldLegend>
                      <RadioGroup
                        value={cuando}
                        onValueChange={(valor) => {
                          setCuando(String(valor))
                          setResultadosGuardados(false)
                        }}
                      >
                        <Field orientation="horizontal">
                          <RadioGroupItem value="cierre" id="cuando-cierre" />
                          <FieldContent>
                            <FieldTitle>Al cerrar la evaluación</FieldTitle>
                          </FieldContent>
                        </Field>
                        <Field orientation="horizontal">
                          <RadioGroupItem value="manual" id="cuando-manual" />
                          <FieldContent>
                            <FieldTitle>Cuando yo los libere</FieldTitle>
                          </FieldContent>
                        </Field>
                      </RadioGroup>
                    </FieldSet>
                  ) : null}
                  <div>
                    <Button
                      onClick={() => {
                        setResultadosGuardados(true)
                        cerrarYSeguir('resultados')
                      }}
                    >
                      Guardar resultados
                    </Button>
                  </div>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text variant="muted" size="sm">
              {cuantasCompletas === 4 && basicosListos
                ? 'Todo listo para activar.'
                : `Activar necesita las 4 secciones completas (van ${cuantasCompletas}).`}
            </Text>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={empezarDeNuevo}>
                Empezar de nuevo
              </Button>
              <Button onClick={activar} disabled={activada}>
                Activar evaluación
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Por qué secciones y no pasos</CardTitle>
          <CardDescription>
            Con pasos se avanza en un solo sentido. Aquí, después de Tipo, las tres secciones restantes se
            llenan en cualquier orden y se ve de un vistazo cuáles faltan. Los pasos sirven cuando cada
            paso depende del anterior, como en «Por pasos».
          </CardDescription>
        </CardHeader>
      </Card>
    </CasoUbits>
  )
}
