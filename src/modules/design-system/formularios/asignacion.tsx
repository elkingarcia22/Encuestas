import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Csv01Icon,
  MinusSignIcon,
  PlusSignIcon,
  UserGroupIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
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
  Separator,
  Text,
  toast,
  useComboboxAnchor,
} from '@ubits/flux-ui'

import { COLABORADORES } from '../data-grid/data'
import { AdjuntoCsv } from '../estados/procesos'
import { CasoUbits } from '../patrones/piezas'
import { plural } from '../patrones/formato'
import { COMPETENCIAS, CONTENIDOS, GRUPOS, MAXIMO_COMPETENCIAS } from './asignacion-datos'
import { RangoDeFechas, type Rango } from './rango-de-fechas'

// Caso: crear un plan de formación (Aprendizaje › Planes de formación).
// Fuente: HU «Planes de formación (contenidos y competencias)», RN-01 a RN-11.

type TipoPlan = 'contenidos' | 'competencias'
type Alcance = '' | 'empresa' | 'colaboradores' | 'grupos' | 'archivo'
type Errores = Partial<Record<'fechas' | 'horas' | 'alcance' | 'asignados' | 'items', string>>



const PERSONAS = COLABORADORES.map((c) => c.nombre)

const ALCANCES: { id: Exclude<Alcance, ''>; titulo: string; detalle: string; icono: typeof UserGroupIcon }[] = [
  { id: 'empresa', titulo: 'Toda la empresa', detalle: '646 personas', icono: Building03Icon },
  { id: 'colaboradores', titulo: 'Colaboradores', detalle: 'Elige personas una a una', icono: UserMultiple02Icon },
  { id: 'grupos', titulo: 'Grupos', detalle: 'Grupos ya creados', icono: UserGroupIcon },
  { id: 'archivo', titulo: 'Desde archivo', detalle: 'Un CSV con los usuarios', icono: Csv01Icon },
]

// Selector múltiple con buscador: Combobox con fichas. Los textos van en español porque el
// componente no trae ninguno propio. Lo reutiliza el template Planes de formación.
export function SelectorMultiple({
  id,
  opciones,
  valor,
  onCambio,
  placeholder,
  invalido,
}: {
  id: string
  opciones: string[]
  valor: string[]
  onCambio: (valor: string[]) => void
  placeholder: string
  invalido?: boolean
}) {
  const ancla = useComboboxAnchor()

  return (
    <Combobox multiple items={opciones} value={valor} onValueChange={(nuevo) => onCambio(nuevo as string[])}>
      <ComboboxChips ref={ancla} aria-invalid={invalido ? true : undefined}>
        <ComboboxValue>
          {(elegidos: string[]) => (
            <>
              {elegidos.map((elegido) => (
                <ComboboxChip key={elegido}>{elegido}</ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={elegidos.length ? '' : placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={ancla}>
        <ComboboxEmpty>No encontramos nada con ese nombre.</ComboboxEmpty>
        <ComboboxList>
          {(opcion: string) => (
            <ComboboxItem key={opcion} value={opcion}>
              {opcion}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function FormularioAsignacion() {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoPlan>('contenidos')
  const [rango, setRango] = useState<Rango>(undefined)
  const [horas, setHoras] = useState<number | null>(8)
  const [alcance, setAlcance] = useState<Alcance>('')
  const [personas, setPersonas] = useState<string[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [archivo, setArchivo] = useState<'vacio' | 'subiendo' | 'listo'>('vacio')
  const [contenidos, setContenidos] = useState<string[]>([])
  const [competencias, setCompetencias] = useState<string[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [enviado, setEnviado] = useState(false)
  const [guardado, setGuardado] = useState<string | null>(null)

  const limpiarError = (campo: keyof Errores) => setErrores((previos) => ({ ...previos, [campo]: undefined }))

  const validar = (): Errores => {
    const encontrados: Errores = {}
    if (!rango?.from || !rango.to) encontrados.fechas = 'Elige la fecha de inicio y la de cierre.'
    if (tipo === 'competencias' && (horas === null || horas < 1)) encontrados.horas = 'Tiene que ser al menos 1 hora.'
    if (!alcance) encontrados.alcance = 'Elige a quién le asignas el plan.'
    if (alcance === 'colaboradores' && personas.length === 0) encontrados.asignados = 'Elige al menos una persona.'
    if (alcance === 'grupos' && grupos.length === 0) encontrados.asignados = 'Elige al menos un grupo.'
    if (alcance === 'archivo' && archivo !== 'listo') encontrados.asignados = 'Sube el archivo con los usuarios.'
    if (tipo === 'contenidos' && contenidos.length === 0) encontrados.items = 'Agrega al menos un contenido.'
    if (tipo === 'competencias' && competencias.length === 0) encontrados.items = 'Agrega al menos una competencia.'
    return encontrados
  }

  const guardar = () => {
    const encontrados = validar()
    setErrores(encontrados)
    setEnviado(true)
    if (Object.keys(encontrados).length) {
      setGuardado(null)
      return
    }
    // RN-11: sin nombre se guarda como «Plan sin nombre». RN-04: nace en Planeado.
    const final = nombre.trim() || 'Plan sin nombre'
    setGuardado(final)
    toast.add({
      type: 'success',
      title: tipo === 'contenidos' ? 'Plan de contenidos guardado correctamente.' : 'Plan de competencias guardado correctamente.',
    })
  }

  const cantidadErrores = Object.values(errores).filter(Boolean).length

  return (
    <CasoUbits
      rol="Administrador"
      donde={['Aprendizaje', 'Planes de formación', 'Crear plan']}
      titulo="Formulario que cambia según lo que se elige"
      descripcion="Recursos Humanos asigna formación a toda la empresa, a personas, a grupos o desde un archivo. Lo que se pide debajo depende del tipo de plan y de a quién se asigna: cambia las opciones y mira cómo aparecen y desaparecen campos."
      historia="la historia «Planes de formación (contenidos y competencias)»"
      reglas={[
        { titulo: 'Dos tipos de plan', detalle: 'De contenidos o de competencias; el segundo pide horas.' },
        { titulo: 'Horas por competencia, una sola vez', detalle: 'Es un campo del plan (mínimo 1, arranca en 8), no uno por competencia.' },
        { titulo: 'Máximo 8 competencias', detalle: 'Al intentar la novena, no se agrega y aparece el aviso.' },
        { titulo: 'Cuatro formas de asignar', detalle: 'Toda la empresa, colaboradores, grupos o archivo.' },
        { titulo: 'Qué hace falta para guardar', detalle: 'Fechas, a quién y al menos un contenido o una competencia.' },
        { titulo: 'Nace planeado', detalle: 'Sin nombre se guarda como «Plan sin nombre», en estado Planeado.' },
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-6">
          {enviado && cantidadErrores > 0 ? (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
              <AlertTitle>
                {cantidadErrores === 1 ? 'Falta un dato para guardar el plan' : `Faltan ${cantidadErrores} datos para guardar el plan`}
              </AlertTitle>
              <AlertDescription>
                <ul className="ml-4 flex list-disc flex-col gap-1">
                  {Object.values(errores)
                    .filter(Boolean)
                    .map((mensaje) => (
                      <li key={mensaje}>{mensaje}</li>
                    ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {guardado ? (
            <Alert variant="success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
              <AlertTitle>
                «{guardado}» quedó{' '}
                <Badge variant="secondary" size="sm">
                  Planeado
                </Badge>
              </AlertTitle>
              <AlertDescription>Pasa a vigente cuando llegue su fecha de inicio; mientras tanto se puede editar.</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="plan-nombre">
                  Nombre del plan
                  <Badge variant="secondary" size="xs">
                    Opcional
                  </Badge>
                </FieldLabel>
                <Input id="plan-nombre" value={nombre} placeholder="Plan sin nombre" onChange={(e) => setNombre(e.target.value)} />
                <FieldDescription>Si lo dejas vacío se guarda como «Plan sin nombre».</FieldDescription>
              </Field>
              <Field data-invalid={errores.fechas ? 'true' : undefined}>
                <FieldLabel htmlFor="plan-fechas">Vigencia</FieldLabel>
                <RangoDeFechas
                  id="plan-fechas"
                  valor={rango}
                  desde={new Date('2026-09-11T00:00:00')}
                  invalido={!!errores.fechas}
                  onCambio={(nuevo) => {
                    setRango(nuevo)
                    limpiarError('fechas')
                  }}
                />
                {errores.fechas ? <FieldError>{errores.fechas}</FieldError> : <FieldDescription>Desde cuándo y hasta cuándo aplica.</FieldDescription>}
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>Tipo de plan</FieldLegend>
              <RadioGroup
                value={tipo}
                onValueChange={(valor) => {
                  setTipo(valor as TipoPlan)
                  limpiarError('items')
                  limpiarError('horas')
                }}
                className="grid gap-3 sm:grid-cols-2"
              >
                <FieldLabel htmlFor="tipo-contenidos">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Plan de contenidos</FieldTitle>
                      <FieldDescription>Asigna cursos, rutas o eventos concretos.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="contenidos" id="tipo-contenidos" />
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="tipo-competencias">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Plan de competencias</FieldTitle>
                      <FieldDescription>Asigna horas de formación por competencia.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="competencias" id="tipo-competencias" />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </FieldSet>

            {tipo === 'competencias' ? (
              <Field data-invalid={errores.horas ? 'true' : undefined} className="max-w-xs">
                <FieldLabel htmlFor="plan-horas">Horas por competencia</FieldLabel>
                <NumberField
                  id="plan-horas"
                  value={horas}
                  min={0}
                  max={40}
                  onValueChange={(valor) => {
                    setHoras(valor)
                    limpiarError('horas')
                  }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement>
                      <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                    </NumberFieldDecrement>
                    <NumberFieldInput aria-invalid={errores.horas ? true : undefined} />
                    <NumberFieldIncrement>
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberField>
                {errores.horas ? <FieldError>{errores.horas}</FieldError> : <FieldDescription>Vale para todas las competencias del plan.</FieldDescription>}
              </Field>
            ) : null}

            <Separator />

            <FieldSet data-invalid={errores.alcance ? 'true' : undefined}>
              <FieldLegend>Asignar a</FieldLegend>
              <RadioGroup
                value={alcance}
                onValueChange={(valor) => {
                  setAlcance(valor as Alcance)
                  limpiarError('alcance')
                  limpiarError('asignados')
                }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                {ALCANCES.map((opcion) => (
                  <FieldLabel key={opcion.id} htmlFor={`alcance-${opcion.id}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>
                          <HugeiconsIcon icon={opcion.icono} size={16} aria-hidden="true" />
                          {opcion.titulo}
                        </FieldTitle>
                        <FieldDescription>{opcion.detalle}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={opcion.id} id={`alcance-${opcion.id}`} aria-invalid={errores.alcance ? true : undefined} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              {errores.alcance ? <FieldError>{errores.alcance}</FieldError> : null}
            </FieldSet>

            {alcance === 'colaboradores' || alcance === 'grupos' ? (
              <Field data-invalid={errores.asignados ? 'true' : undefined}>
                <FieldLabel htmlFor="plan-asignados">{alcance === 'colaboradores' ? 'Personas' : 'Grupos'}</FieldLabel>
                <SelectorMultiple
                  id="plan-asignados"
                  opciones={alcance === 'colaboradores' ? PERSONAS : GRUPOS}
                  valor={alcance === 'colaboradores' ? personas : grupos}
                  invalido={!!errores.asignados}
                  placeholder={alcance === 'colaboradores' ? 'Busca por nombre…' : 'Busca un grupo…'}
                  onCambio={(nuevo) => {
                    ;(alcance === 'colaboradores' ? setPersonas : setGrupos)(nuevo)
                    limpiarError('asignados')
                  }}
                />
                {errores.asignados ? (
                  <FieldError>{errores.asignados}</FieldError>
                ) : (
                  <FieldDescription>
                    {alcance === 'colaboradores'
                      ? `${personas.length} ${plural(personas.length, 'persona elegida', 'personas elegidas')}.`
                      : `${grupos.length} ${plural(grupos.length, 'grupo elegido', 'grupos elegidos')}.`}
                  </FieldDescription>
                )}
              </Field>
            ) : null}

            {alcance === 'archivo' ? (
              <Field data-invalid={errores.asignados ? 'true' : undefined}>
                <FieldLabel>Archivo de usuarios</FieldLabel>
                <AdjuntoCsv
                  estado={archivo === 'vacio' ? 'idle' : archivo === 'subiendo' ? 'uploading' : 'done'}
                  vacio={{ titulo: 'Elige el CSV con los usuarios', descripcion: 'Una columna «usuario» · hasta 5 MB' }}
                  nombre="asignacion-cohorte-agosto.csv"
                  descripcion={archivo === 'subiendo' ? 'Subiendo…' : '42 usuarios encontrados'}
                  porcentaje={60}
                  onElegir={() => {
                    setArchivo('subiendo')
                    limpiarError('asignados')
                    window.setTimeout(() => setArchivo('listo'), 1400)
                  }}
                  onQuitar={() => setArchivo('vacio')}
                />
                {errores.asignados ? <FieldError>{errores.asignados}</FieldError> : null}
              </Field>
            ) : null}

            <Separator />

            <Field data-invalid={errores.items ? 'true' : undefined}>
              <FieldLabel htmlFor="plan-items">{tipo === 'contenidos' ? 'Contenidos del plan' : 'Competencias del plan'}</FieldLabel>
              <SelectorMultiple
                key={tipo}
                id="plan-items"
                opciones={tipo === 'contenidos' ? CONTENIDOS : COMPETENCIAS}
                valor={tipo === 'contenidos' ? contenidos : competencias}
                invalido={!!errores.items}
                placeholder={tipo === 'contenidos' ? 'Busca un curso, ruta o evento…' : 'Busca una competencia…'}
                onCambio={(nuevo) => {
                  if (tipo === 'competencias') {
                    // RN-03: la novena no entra y se avisa.
                    if (nuevo.length > MAXIMO_COMPETENCIAS) {
                      setErrores((previos) => ({ ...previos, items: 'Máximo 8 competencias por asignación.' }))
                      return
                    }
                    setCompetencias(nuevo)
                  } else {
                    setContenidos(nuevo)
                  }
                  limpiarError('items')
                }}
              />
              {errores.items ? (
                <FieldError>{errores.items}</FieldError>
              ) : (
                <FieldDescription>
                  {tipo === 'contenidos'
                    ? `${contenidos.length} ${plural(contenidos.length, 'contenido', 'contenidos')} en el plan.`
                    : `${competencias.length} de ${MAXIMO_COMPETENCIAS} competencias.`}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={guardar}>Guardar plan</Button>
            <Text variant="muted" size="sm">
              Se guarda en estado Planeado.
            </Text>
          </div>
        </CardContent>
      </Card>
    </CasoUbits>
  )
}
