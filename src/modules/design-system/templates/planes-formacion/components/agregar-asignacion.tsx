import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon, Csv01Icon, InformationCircleIcon, Tick02Icon, UserGroupIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@ubits/flux-ui'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'

import { AdjuntoCsv, type Subida } from '../../../estados/procesos'
import { useTemporizadores } from '../../../estados/temporizadores'
import { SelectorMultiple } from '../../../formularios/asignacion'
import { plural } from '../../../patrones/formato'
import {
  ALCANCES,
  CATALOGO,
  COMPETENCIAS,
  GRUPOS,
  MAXIMO_COMPETENCIAS,
  PERSONAS,
  PERSONAS_EMPRESA,
  TAMANO_GRUPO,
  TIPOS,
  type Alcance,
  type Asignacion,
  type TipoPlan,
} from './datos'

// «Agregar asignación»: el panel de la plataforma en tres pasos (Tipo de asignación →
// Participantes → Contenido). Cada paso valida lo suyo antes de dejar avanzar (patrón «Por
// pasos» de Formularios). En competencias entran máximo 8 por asignación (RN-03).

const ICONO: Record<Alcance, typeof UserGroupIcon> = {
  empresa: Building03Icon,
  colaboradores: UserMultiple02Icon,
  grupos: UserGroupIcon,
  archivo: Csv01Icon,
}

const PASOS = ['Tipo de asignación', 'Participantes', 'Contenido']

export function AgregarAsignacion({
  abierto,
  onAbiertoChange,
  tipo,
  onAgregar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  tipo: TipoPlan
  onAgregar: (asignacion: Asignacion) => void
}) {
  const despues = useTemporizadores()
  const [paso, setPaso] = useState(1)
  const [alcance, setAlcance] = useState<Alcance | ''>('')
  const [personas, setPersonas] = useState<string[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [archivo, setArchivo] = useState<Subida>('idle')
  const [items, setItems] = useState<string[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const textos = TIPOS[tipo]

  const limpiar = () => {
    setPaso(1)
    setAlcance('')
    setPersonas([])
    setGrupos([])
    setArchivo('idle')
    setItems([])
    setError(undefined)
  }

  const hayCambios = alcance !== '' || personas.length > 0 || grupos.length > 0 || archivo !== 'idle' || items.length > 0

  const cuantos =
    alcance === 'empresa'
      ? PERSONAS_EMPRESA
      : alcance === 'colaboradores'
        ? personas.length
        : alcance === 'grupos'
          ? grupos.reduce((n, g) => n + (TAMANO_GRUPO[g] ?? 0), 0)
          : archivo === 'done'
            ? 42
            : 0

  const validar = (numero: number) => {
    if (numero === 1 && !alcance) return 'Elige a quién le asignas el plan.'
    if (numero === 2 && alcance === 'colaboradores' && !personas.length) return 'Elige al menos una persona.'
    if (numero === 2 && alcance === 'grupos' && !grupos.length) return 'Elige al menos un grupo.'
    if (numero === 2 && alcance === 'archivo' && archivo !== 'done') return 'Sube el archivo con los participantes.'
    if (numero === 3 && !items.length) return `Agrega al menos ${tipo === 'competencias' ? 'una competencia' : 'un contenido'}.`
    return undefined
  }

  const siguiente = () => {
    const encontrado = validar(paso)
    setError(encontrado)
    if (encontrado) return
    if (paso < 3) {
      setPaso(paso + 1)
      return
    }
    onAgregar({
      id: `a-${Date.now()}`,
      alcance: alcance as Alcance,
      destinatarios: alcance === 'colaboradores' ? personas.map((p) => p.replace(/ \(.*\)$/, '')) : alcance === 'grupos' ? grupos : alcance === 'archivo' ? ['participantes-plan.csv'] : [],
      personas: cuantos,
      items,
    })
    onAbiertoChange(false)
    limpiar()
  }

  const subir = () => {
    setArchivo('uploading')
    setError(undefined)
    despues(() => setArchivo('processing'), 900)
    despues(() => setArchivo('done'), 1900)
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(siguienteEstado) => {
        onAbiertoChange(siguienteEstado)
        if (!siguienteEstado) limpiar()
      }}
      title="Agregar asignación"
      description={
        cuantos > 0
          ? `${cuantos.toLocaleString('es-CO')} ${plural(cuantos, 'persona', 'personas')} hasta ahora.`
          : 'A quién le llega el plan y con qué ' + textos.items + '.'
      }
      // 13-oct (I-018): con algo elegido, no se cierra al tocar fuera y pregunta «Seguir editando · Descartar».
      conCambios={hayCambios}
      footerClassName="justify-between!"
      footer={
        <>
          {paso > 1 ? (
            <Button
              variant="outline"
              onClick={() => {
                setPaso(paso - 1)
                setError(undefined)
              }}
            >
              Atrás
            </Button>
          ) : (
            // Pasa por la misma pregunta que la X; al descartar, onOpenChange(false) limpia.
            <BotonCancelarPanel
              alCerrar={() => {
                onAbiertoChange(false)
                limpiar()
              }}
            />
          )}
          <Button onClick={siguiente}>{paso < 3 ? 'Siguiente' : 'Agregar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
          <Stepper value={paso} onValueChange={(valor) => (valor < paso ? setPaso(valor) : undefined)}>
            <StepperNav>
              {PASOS.map((titulo, indice) => (
                <StepperItem key={titulo} step={indice + 1} completed={paso > indice + 1} disabled={indice + 1 > paso}>
                  <StepperTrigger>
                    <StepperIndicator>
                      {paso > indice + 1 ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" /> : indice + 1}
                    </StepperIndicator>
                    <StepperTitle>{indice === 2 ? (tipo === 'competencias' ? 'Competencias' : 'Contenido') : titulo}</StepperTitle>
                  </StepperTrigger>
                  {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>

          {paso === 1 ? (
            <Field data-invalid={error ? 'true' : undefined}>
              <RadioGroup
                value={alcance}
                onValueChange={(valor) => {
                  setAlcance(valor as Alcance)
                  setError(undefined)
                }}
                className="grid gap-3"
              >
                {ALCANCES.map((opcion) => (
                  <FieldLabel key={opcion.id} htmlFor={`alcance-${opcion.id}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>
                          <HugeiconsIcon icon={ICONO[opcion.id]} size={16} aria-hidden="true" />
                          {opcion.titulo}
                        </FieldTitle>
                        <FieldDescription>{opcion.detalle}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={opcion.id} id={`alcance-${opcion.id}`} aria-invalid={error ? true : undefined} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          ) : null}

          {paso === 2 && alcance === 'empresa' ? (
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertTitle>Toda la empresa: {PERSONAS_EMPRESA.toLocaleString('es-CO')} personas activas</AlertTitle>
              <AlertDescription>
                <p>No hay que elegir a nadie. Las personas suspendidas no reciben el plan.</p>
              </AlertDescription>
            </Alert>
          ) : null}

          {paso === 2 && (alcance === 'colaboradores' || alcance === 'grupos') ? (
            <Field data-invalid={error ? 'true' : undefined}>
              <FieldLabel htmlFor="asignacion-participantes">{alcance === 'colaboradores' ? 'Colaboradores' : 'Grupos'}</FieldLabel>
              <SelectorMultiple
                id="asignacion-participantes"
                opciones={alcance === 'colaboradores' ? PERSONAS : GRUPOS}
                valor={alcance === 'colaboradores' ? personas : grupos}
                invalido={!!error}
                placeholder={alcance === 'colaboradores' ? 'Busca por nombre o username…' : 'Busca un grupo…'}
                onCambio={(nuevo) => {
                  ;(alcance === 'colaboradores' ? setPersonas : setGrupos)(nuevo)
                  setError(undefined)
                }}
              />
              {error ? (
                <FieldError>{error}</FieldError>
              ) : (
                <FieldDescription>
                  {alcance === 'colaboradores'
                    ? `Seleccionados (${personas.length})`
                    : `${grupos.length} ${plural(grupos.length, 'grupo', 'grupos')} · ${cuantos.toLocaleString('es-CO')} personas`}
                </FieldDescription>
              )}
            </Field>
          ) : null}

          {paso === 2 && alcance === 'archivo' ? (
            <Field data-invalid={error ? 'true' : undefined}>
              <FieldLabel>Archivo de participantes</FieldLabel>
              <AdjuntoCsv
                estado={archivo}
                vacio={{ titulo: 'Elige el CSV con los participantes', descripcion: 'Una columna «username» · hasta 1 MB' }}
                nombre="participantes-plan.csv"
                descripcion={archivo === 'done' ? '42 usuarios encontrados' : archivo === 'processing' ? 'Buscando a los usuarios…' : 'Subiendo…'}
                porcentaje={archivo === 'uploading' ? 60 : 100}
                onElegir={subir}
                onQuitar={() => setArchivo('idle')}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          ) : null}

          {paso === 3 ? (
            <Field data-invalid={error ? 'true' : undefined}>
              <FieldLabel htmlFor="asignacion-items">{tipo === 'competencias' ? 'Competencias' : 'Contenidos'}</FieldLabel>
              <SelectorMultiple
                id="asignacion-items"
                opciones={tipo === 'competencias' ? COMPETENCIAS : CATALOGO}
                valor={items}
                invalido={!!error}
                placeholder={tipo === 'competencias' ? 'Busca una competencia…' : 'Busca un curso, ruta o evento…'}
                onCambio={(nuevo) => {
                  // RN-03: la novena competencia no entra y se avisa con el texto de la historia.
                  if (tipo === 'competencias' && nuevo.length > MAXIMO_COMPETENCIAS) {
                    setError('Máximo 8 competencias por asignación.')
                    return
                  }
                  setItems(nuevo)
                  setError(undefined)
                }}
              />
              {error ? (
                <FieldError>{error}</FieldError>
              ) : (
                <FieldDescription>
                  {tipo === 'competencias'
                    ? `${items.length} de ${MAXIMO_COMPETENCIAS} competencias.`
                    : `${items.length} ${plural(items.length, 'contenido', 'contenidos')} para ${cuantos.toLocaleString('es-CO')} ${plural(cuantos, 'persona', 'personas')}.`}
                </FieldDescription>
              )}
            </Field>
          ) : null}
      </div>
    </DrawerShell>
  )
}
