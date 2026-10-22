import { Badge } from '@/shared/components/Badge'
import { AvanceObligatorios, Aviso, BloqueResumen, Lista, TarjetaResumen } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { Filas } from '@/modules/design-system/patrones/ficha'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { aIso } from './datos-plan'
import { asignacionLista, asignacionVacia, type PasoId } from './pasos-crear'
import { TIPOS, miembrosDe, piezasDe, type Asignacion, type TipoPlan } from './planes-datos'

// «Así va el plan»: el panel de apoyo de Crear plan, a la derecha y siempre a la vista, el mismo «Así va…» de Encuestas
// y Crear vacante (TarjetaResumen y sus piezas). Arriba el nombre y el tipo; desde el paso 2, las fechas y a cuántas
// personas les llega como contexto. El cuerpo cuenta solo lo del paso: lo que falta, lo elegido y, al final, si está listo.
// En el paso 3 no va: ahí el ancho es para ver todas las asignaciones lado a lado.

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

type Props = {
  paso: PasoId
  nombre: string
  descripcion: string
  tipo: TipoPlan
  inicio?: Date
  fin?: Date
  horas: number
  asignaciones: Asignacion[]
  actual?: Asignacion
  totalPersonas: number
}

export function ResumenPlan({ paso, nombre, descripcion, tipo, inicio, fin, horas, asignaciones, actual, totalPersonas }: Props) {
  const fechas = inicio && fin && fin >= inicio ? `${fechaCorta(aIso(inicio))} – ${fechaCorta(aIso(fin))}` : ''
  const contexto = [fechas, totalPersonas ? `${personas(totalPersonas)} en el plan` : ''].filter(Boolean)

  return (
    <TarjetaResumen
      kicker="Así va el plan"
      nombre={nombre}
      sinNombre="Sin nombre todavía"
      descripcion={paso === 'revisar' ? descripcion.trim() : undefined}
      insignias={
        <Badge variant="secondary" size="xs">
          {TIPOS[tipo].singular}
        </Badge>
      }
      contexto={paso !== 'datos' ? contexto : undefined}
    >
      {paso === 'datos' ? (
        <FocoDatos nombre={nombre} descripcion={descripcion} tipo={tipo} inicio={inicio} fin={fin} horas={horas} />
      ) : paso === 'revisar' ? (
        <FocoRevisar tipo={tipo} asignaciones={asignaciones} totalPersonas={totalPersonas} inicio={inicio} />
      ) : actual ? (
        <FocoQuienes asignacion={actual} numero={asignaciones.indexOf(actual) + 1} asignaciones={asignaciones} totalPersonas={totalPersonas} />
      ) : null}
    </TarjetaResumen>
  )
}

// Paso 1: lo obligatorio que falta arriba; lo elegido debajo.
function FocoDatos({ nombre, descripcion, tipo, inicio, fin, horas }: { nombre: string; descripcion: string; tipo: TipoPlan; inicio?: Date; fin?: Date; horas: number }) {
  const obligatorios: [string, boolean][] = [
    ['Nombre del plan', nombre.trim() !== ''],
    ['Fechas del plan', Boolean(inicio && fin && fin >= inicio)],
  ]
  const falta = obligatorios.filter(([, listo]) => !listo).map(([campo]) => campo)
  const filas = [
    { termino: 'Tipo', valor: TIPOS[tipo].singular },
    { termino: 'Empieza', valor: inicio ? fechaCorta(aIso(inicio)) : '' },
    { termino: 'Termina', valor: fin ? fechaCorta(aIso(fin)) : '' },
    { termino: 'Horas por competencia', valor: tipo === 'competencias' ? `${horas} ${plural(horas, 'hora', 'horas')}` : '' },
    { termino: 'Descripción', valor: descripcion.trim() ? 'Escrita' : '' },
  ].filter((fila) => fila.valor)
  return (
    <>
      {falta.length ? <AvanceObligatorios falta={falta} total={obligatorios.length} /> : null}
      <BloqueResumen>
        <Filas filas={filas} />
      </BloqueResumen>
      {falta.length ? null : <AvanceObligatorios falta={falta} total={obligatorios.length} />}
    </>
  )
}

// Paso 2: a cuántos les llega la asignación que se arma y de dónde sale cada parte; debajo, el plan entero.
function FocoQuienes({ asignacion, numero, asignaciones, totalPersonas }: { asignacion: Asignacion; numero: number; asignaciones: Asignacion[]; totalPersonas: number }) {
  const cuantas = miembrosDe(asignacion).length
  const piezas = piezasDe(asignacion)
  const filas = [
    ...piezas.slice(0, 6).map((pieza) => ({ termino: pieza.texto, valor: n(pieza.personas) })),
    ...(piezas.length > 6 ? [{ termino: 'Otras', valor: n(piezas.slice(6).reduce((suma, pieza) => suma + pieza.personas, 0)) }] : []),
    ...((asignacion.fuera?.length ?? 0) ? [{ termino: 'Fuera de esta asignación', valor: n(asignacion.fuera?.length ?? 0) }] : []),
  ]
  return (
    <>
      {cuantas === 0 ? <Aviso tono="warning">{`Elige a quiénes les llega la Asignación ${numero}.`}</Aviso> : null}
      {filas.length ? (
        <BloqueResumen>
          <Filas filas={filas} />
        </BloqueResumen>
      ) : null}
      {asignaciones.length > 1 ? (
        <BloqueResumen>
          <Filas
            filas={[
              { termino: 'Asignaciones', valor: n(asignaciones.length) },
              { termino: 'Personas en el plan', valor: n(totalPersonas) },
            ]}
          />
        </BloqueResumen>
      ) : null}
      {cuantas ? <Aviso tono="success">{`${personas(cuantas)} ${plural(cuantas, 'recibe', 'reciben')} la Asignación ${numero}.`}</Aviso> : null}
    </>
  )
}

// Paso 4: qué falta para guardar y el recuento del plan.
function FocoRevisar({ tipo, asignaciones, totalPersonas, inicio }: { tipo: TipoPlan; asignaciones: Asignacion[]; totalPersonas: number; inicio?: Date }) {
  const textos = TIPOS[tipo]
  const pendientes = asignaciones
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !asignacionVacia(a) && !asignacionLista(a))
    .map(({ a, i }) => `${a.nombre?.trim() || `Asignación ${i + 1}`}: ${miembrosDe(a).length ? `sin ${textos.items}` : 'sin personas'}`)
  const distintos = new Set(asignaciones.flatMap((a) => a.items)).size
  return (
    <>
      {pendientes.length ? (
        <div className="flex flex-col gap-2">
          <Aviso tono="warning">{plural(pendientes.length, 'Falta completar una asignación', `Faltan completar ${pendientes.length} asignaciones`)}</Aviso>
          <Lista items={pendientes} />
        </div>
      ) : null}
      <BloqueResumen>
        <Filas
          filas={[
            { termino: 'Asignaciones', valor: n(asignaciones.filter((a) => !asignacionVacia(a)).length) },
            { termino: 'Personas', valor: n(totalPersonas) },
            { termino: `${textos.items.charAt(0).toUpperCase()}${textos.items.slice(1)} distint${tipo === 'competencias' ? 'as' : 'os'}`, valor: n(distintos) },
            ...(inicio ? [{ termino: 'Les llega el', valor: fechaCorta(aIso(inicio)) }] : []),
          ]}
        />
      </BloqueResumen>
      {pendientes.length ? null : <Aviso tono="success">Listo para guardar.</Aviso>}
    </>
  )
}
