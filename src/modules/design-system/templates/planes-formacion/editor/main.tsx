import { useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert01Icon,
  Building03Icon,
  Csv01Icon,
  Delete02Icon,
  LogoutSquare01Icon,
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  toast,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { Hint } from '@/shared/components/Hint'
import { PageActionBar } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'

import { DialogoConfirmar, RegistroConfirmar } from '../../../estados/confirmaciones'
import { PantallaDeError } from '../../../estados/errores-sistema'
import { registroQueNoExiste, registroSinEdicion } from '../../../estados/errores-sistema-datos'
import { RangoDeFechas, type Rango } from '../../../formularios/rango-de-fechas'
import { HOY, plural } from '../../../patrones/formato'
import type { Borrador } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import { AgregarAsignacion } from '../components/agregar-asignacion'
import { TIPOS, ruta, totalPersonas, type Alcance, type Asignacion, type EstadoPlan, type Plan, type TipoPlan } from '../components/datos'
import { usePlanes } from '../components/estado'

// «Plan de contenido» de la plataforma (/creator/training-plan/content-plan/form/new) y su edición.
// Nombre, fechas y la lista de asignaciones con su vacío «Sin asignaciones». Guardar sigue la
// RN-11: fechas + al menos una asignación con al menos un ítem (y horas ≥ 1 en competencias).

const ICONO: Record<Alcance, typeof UserGroupIcon> = { empresa: Building03Icon, colaboradores: UserMultiple02Icon, grupos: UserGroupIcon, archivo: Csv01Icon }
const BADGE: Record<EstadoPlan, 'success-light' | 'secondary' | 'outline' | 'info-light'> = { Vigente: 'success-light', Planeado: 'secondary', 'No vigente': 'outline', Procesando: 'info-light' }

type Errores = Partial<Record<'fechas' | 'horas' | 'asignaciones', string>>

const aIso = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
const aFecha = (iso: string) => new Date(`${iso}T00:00:00`)

function tituloDe(asignacion: Asignacion) {
  const n = asignacion.personas.toLocaleString('es-CO')
  if (asignacion.alcance === 'empresa') return `Toda la empresa · ${n} personas`
  if (asignacion.alcance === 'archivo') return `Desde archivo · ${n} personas`
  if (asignacion.alcance === 'grupos') return `${asignacion.destinatarios.join(', ')} · ${n} personas`
  const primeros = asignacion.destinatarios.slice(0, 2).join(', ')
  const resto = asignacion.destinatarios.length - 2
  return `${primeros}${resto > 0 ? ` y ${resto} más` : ''} · ${n} ${plural(asignacion.personas, 'persona', 'personas')}`
}

export function Component() {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navigate = useNavigate()
  const { planes, setPlanes } = usePlanes()
  const editando = id ? planes.find((p) => p.id === id) : undefined
  const tipo: TipoPlan = editando?.tipo ?? (parametros.get('tipo') === 'competencias' ? 'competencias' : 'contenidos')
  const textos = TIPOS[tipo]
  // El borrador que arma Orbit Flow en la lista («Abrir en "Crear plan"») llega ya puesto para revisarlo antes de guardar.
  const borrador = (useLocation().state as { borrador?: Borrador } | null)?.borrador

  const [nombre, setNombre] = useState(editando?.nombre ?? borrador?.nombre ?? '')
  const [rango, setRango] = useState<Rango>(editando ? { from: aFecha(editando.inicio), to: aFecha(editando.fin) } : borrador ? { from: aFecha(borrador.inicio), to: aFecha(borrador.fin) } : undefined)
  const [horas, setHoras] = useState<number | null>(editando?.horas ?? 8)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(editando?.asignaciones ?? borrador?.asignaciones ?? [])
  const [errores, setErrores] = useState<Errores>({})
  const [enviado, setEnviado] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [tocado, setTocado] = useState(false)

  // Un plan que no existe, o uno No vigente (no se edita, RN-07 y RN-10).
  if (id && (!editando || editando.estado === 'No vigente')) {
    return (
      <div className="flex flex-1 flex-col pt-2">
        <PantallaDeError
          error={
            editando
              ? registroSinEdicion(
                  'Este plan ya no se puede editar',
                  'Está No vigente: se puede consultar, pero no cambiar. Para volver a usarlo, duplícalo.',
                  'Planes',
                )
              : registroQueNoExiste('este plan', 'Planes')
          }
          onAccion={() => navigate(ruta())}
        />
      </div>
    )
  }

  const limpiar = (campo: keyof Errores) => setErrores((previos) => ({ ...previos, [campo]: undefined }))

  const validar = (): Errores => {
    const encontrados: Errores = {}
    if (!rango?.from || !rango.to) encontrados.fechas = 'Elige la fecha de inicio y la de finalización.'
    if (tipo === 'competencias' && (horas === null || horas < 1)) encontrados.horas = 'Tiene que ser al menos 1 hora.'
    if (!asignaciones.length) encontrados.asignaciones = `Agrega al menos una asignación con ${tipo === 'competencias' ? 'una competencia' : 'un contenido'}.`
    return encontrados
  }

  const guardar = () => {
    const encontrados = validar()
    setErrores(encontrados)
    setEnviado(true)
    if (Object.keys(encontrados).length || !rango?.from || !rango.to) return

    // RN-11: sin nombre se guarda como «Plan sin nombre». RN-04: el plan nuevo nace Planeado.
    const datos = {
      nombre: nombre.trim() || 'Plan sin nombre',
      inicio: aIso(rango.from),
      fin: aIso(rango.to),
      horas: tipo === 'competencias' ? (horas ?? 8) : undefined,
      asignaciones,
      tocado: Date.now(),
    }
    if (editando) {
      setPlanes((todos) => todos.map((p) => (p.id === editando.id ? { ...p, ...datos } : p)))
    } else {
      const nuevo: Plan = { id: `p-${Date.now()}`, tipo, estado: 'Planeado', ...datos }
      setPlanes((todos) => [nuevo, ...todos])
    }
    toast.add({ type: 'success', title: `${textos.singular} guardado correctamente.` })
    navigate(ruta())
  }

  const quitar = (asignacion: Asignacion) => {
    const indice = asignaciones.indexOf(asignacion)
    setAsignaciones((todas) => todas.filter((a) => a.id !== asignacion.id))
    setTocado(true)
    // Se deshace con un clic: se quita sin preguntar y el aviso trae «Deshacer».
    toast.add({
      type: 'success',
      title: 'Asignación quitada',
      description: tituloDe(asignacion),
      actionProps: {
        children: 'Deshacer',
        onClick: () => setAsignaciones((todas) => [...todas.slice(0, indice), asignacion, ...todas.slice(indice)]),
      },
    })
  }

  const hayCambios = tocado || nombre !== (editando?.nombre ?? '') || (!editando && !!rango)
  const pedirSalir = () => (hayCambios ? setSaliendo(true) : navigate(ruta()))
  const lista = Object.values(errores).filter(Boolean) as string[]

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo={editando ? editando.nombre : tipo === 'competencias' ? 'Plan de competencias' : 'Plan de contenido'}
        etiqueta={
          editando ? (
            <Badge variant={BADGE[editando.estado]}>
              {editando.estado === 'Procesando' ? `Procesando ${editando.procesando ?? 0} %` : editando.estado}
            </Badge>
          ) : null
        }
        descripcion={editando ? `Edita el ${textos.singular.toLowerCase()}. Los cambios llegan a quienes ya lo tienen asignado.` : undefined}
        acciones={<BotonSalirCreacion texto={editando ? 'Salir de la edición' : 'Salir de la creación'} onClick={pedirSalir} />}
      />

      {enviado && lista.length ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
          <AlertTitle>{lista.length === 1 ? 'Falta un dato para guardar el plan' : `Faltan ${lista.length} datos para guardar el plan`}</AlertTitle>
          <AlertDescription>
            <ul className="ml-4 flex list-disc flex-col gap-1">
              {lista.map((mensaje) => (
                <li key={mensaje}>{mensaje}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{editando ? 'Datos del plan' : `Crea un nuevo ${textos.singular.toLowerCase()}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="plan-nombre">
                  Nombre
                  <Badge variant="secondary" size="xs">
                    Opcional
                  </Badge>
                </FieldLabel>
                <Input id="plan-nombre" value={nombre} placeholder="Plan sin nombre" onChange={(e) => setNombre(e.target.value)} />
                <FieldDescription>Si lo dejas vacío se guarda como «Plan sin nombre».</FieldDescription>
              </Field>
              <Field data-invalid={errores.fechas ? 'true' : undefined}>
                <FieldLabel htmlFor="plan-fechas">Fecha de inicio y de finalización</FieldLabel>
                <RangoDeFechas
                  id="plan-fechas"
                  valor={rango}
                  desde={editando ? undefined : HOY}
                  invalido={!!errores.fechas}
                  onCambio={(nuevo) => {
                    setRango(nuevo)
                    setTocado(true)
                    limpiar('fechas')
                  }}
                />
                {errores.fechas ? (
                  <FieldError>{errores.fechas}</FieldError>
                ) : (
                  <FieldDescription>El inicio, igual o mayor a hoy; la finalización, mayor o igual a la fecha de inicio.</FieldDescription>
                )}
              </Field>
            </div>
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
                    setTocado(true)
                    limpiar('horas')
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
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones</CardTitle>
          <CardDescription>
            {asignaciones.length
              ? `${asignaciones.length} ${plural(asignaciones.length, 'asignación', 'asignaciones')} · ${totalPersonas({ asignaciones }).toLocaleString('es-CO')} personas`
              : `A quién le llega el plan y con qué ${textos.items}.`}
          </CardDescription>
          {asignaciones.length ? (
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setAgregando(true)}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Agregar asignación
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {asignaciones.length ? (
            <ItemGroup className="flex flex-col gap-2">
              {asignaciones.map((asignacion) => (
                <Item key={asignacion.id} variant="outline">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={ICONO[asignacion.alcance]} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{tituloDe(asignacion)}</ItemTitle>
                    <ItemDescription>
                      {asignacion.items.length} {plural(asignacion.items.length, textos.item, textos.items)}: {asignacion.items.join(', ')}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Hint label="Quitar asignación" side="top">
                      <BotonIcono aria-label={`Quitar ${tituloDe(asignacion)}`} onClick={() => quitar(asignacion)}>
                        <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                      </BotonIcono>
                    </Hint>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            // El vacío de la plataforma, con su texto: «Sin asignaciones». Es el «Primera vez» del sistema, con
            // ilustración (decisión 14 de la auditoría); el error de guardar va justo debajo.
            <div className="flex flex-col gap-2">
              <PrimeraVez
                className="py-8"
                icono="glass-add"
                titulo="Sin asignaciones"
                descripcion={`Aún no has asignado ${textos.items}. Haz clic en «Agregar asignación» para añadir ${textos.items} al plan.`}
                accion={{ texto: 'Agregar asignación', icono: PlusSignIcon, onClick: () => setAgregando(true) }}
              />
              {errores.asignaciones ? (
                <Field data-invalid="true" className="items-center">
                  <FieldError>{errores.asignaciones}</FieldError>
                </Field>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barra fija abajo, como en todos los flujos de creación: el estado del guardado a la izquierda (informa, no se
          pulsa) y guardar a la derecha. Sin «Cancelar»: la única salida es la de junto al título (regla de creación,
          6-oct). Con un formulario corto baja hasta el final de la pantalla. */}
      <PageActionBar className="mt-auto">
        <ChipGuardado estado={hayCambios ? 'editando' : 'guardado'} />
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </PageActionBar>

      <AgregarAsignacion
        abierto={agregando}
        onAbiertoChange={setAgregando}
        tipo={tipo}
        onAgregar={(asignacion) => {
          setAsignaciones((todas) => [...todas, asignacion])
          setTocado(true)
          limpiar('asignaciones')
        }}
      />

      {/* Salir con cambios es preguntar antes de hacer algo: DialogoConfirmar con sus tres salidas y en su tamaño normal
          (en el chico los tres botones no caben en una fila). El título es fijo; el plan va en la tarjeta. */}
      <DialogoConfirmar
        abierto={saliendo}
        onAbiertoChange={setSaliendo}
        icono={LogoutSquare01Icon}
        titulo={editando ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          editando
            ? 'Tienes cambios sin guardar. Si sales ahora, el plan queda como estaba.'
            : 'Tienes cambios sin guardar. Si sales ahora, el plan no se crea.'
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
          guardar()
        }}
      >
        <RegistroConfirmar
          nombre={nombre.trim() || 'Plan sin nombre'}
          detalle={`${textos.singular} · ${editando ? 'en edición' : 'nuevo'}`}
          estado="Cambios sin guardar"
        />
      </DialogoConfirmar>

    </div>
  )
}

Component.displayName = 'PlanesFormacionEditor'
