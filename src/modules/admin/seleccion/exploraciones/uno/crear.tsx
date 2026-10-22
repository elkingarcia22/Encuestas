import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { notify } from '@/shared/components/notify'
import { CreacionVacante } from '../../vacantes/crear/main'
import { agregarVacante, buscarVacanteUI } from '../../propuestas/datos'
import { creacionDesdePlantilla, creacionDesdeVacante, guardarEdicion, vacanteDesdeCreacion } from '../../propuestas/desde-creacion'
import { esperasDe } from '../../propuestas/movimientos'
import { pasoPendiente } from '../../propuestas/publicar'
import { cambiarVacantes } from './inicio/acciones'

// Exploración 1 · crear una vacante (30 sep, Nicolás: «Elkin estuvo trabajando en todo lo que sucede dentro de la
// creación de una vacante, quiero que bajemos esto en nuestra exploración 1»). Es la creación de Vacantes tal cual —sus
// tres pasos, «Crear con IA», la validación antes de publicar y las plantillas propias—, colgada de esta exploración.
// También sirve para crear y editar plantillas propias desde el catálogo.
//
// 1 oct (reunión con Elkin del 29 sep):
// - Publicar lleva a la vacante que se acaba de crear, con «Compartir» abierto (`state.publicada`), y no a la lista.
// - «Editar» una vacante abre esta misma experiencia (`:vacanteId/editar`), en el paso que se pidió (`state.paso`), y al
//   guardar vuelve a donde se estaba (`state.volverA`) con la vacante cambiada en su sitio.
// - Una plantilla del catálogo (`state.plantillaSistema`) arranca con su perfil y sus etapas ya puestas.

const RUTA = '/admin/seleccion/exploraciones/uno'

type Llegada = { plantillaSistema?: string; paso?: number; volverA?: string } | null

export function Component() {
  const { vacanteId } = useParams()
  return vacanteId ? <Editar vacanteId={vacanteId} /> : <Crear />
}

function Crear() {
  const navigate = useNavigate()
  const { plantillaId } = useParams()
  const { pathname, state } = useLocation()
  const esPlantilla = pathname.includes('/plantillas/')
  const aqui = esPlantilla ? (plantillaId ? 'Editar plantilla' : 'Crear plantilla') : 'Crear vacante'
  // Se lee una vez: si la plantilla cambiara a mitad de la creación, se perdería lo escrito.
  const [inicial] = useState(() => {
    const plantilla = (state as Llegada)?.plantillaSistema
    return plantilla && !esPlantilla ? creacionDesdePlantilla(plantilla) : undefined
  })
  return (
    <CreacionVacante
      volverA={RUTA}
      migas={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Vacantes', path: RUTA }, { label: aqui }]}
      inicial={inicial}
      alPublicar={(vacante) => {
        const nueva = agregarVacante(vacanteDesdeCreacion(vacante))
        navigate(`${RUTA}/${nueva.id}`, { state: { publicada: true } })
      }}
      // Salir de la creación deja la vacante en la lista como borrador, que es lo que promete la ventana de salida.
      alSalir={esPlantilla ? undefined : (vacante) => agregarVacante({ ...vacanteDesdeCreacion(vacante), estado: 'Borrador' })}
    />
  )
}

function Editar({ vacanteId }: { vacanteId: string }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const vacante = buscarVacanteUI(vacanteId)
  const [inicial] = useState(() => (vacante ? creacionDesdeVacante(vacante) : undefined))
  if (!vacante || !inicial) return <Navigate to={RUTA} replace />
  const llegada = state as Llegada
  const volverA = llegada?.volverA ?? `${RUTA}/${vacante.id}`
  // Un borrador se termina, no se edita: abre en el paso que le falta y acaba en «Publicar», con «Compartir» abierto
  // en la vacante, igual que una vacante nueva (IN-23).
  if (vacante.estado === 'Borrador')
    return (
      <CreacionVacante
        key={vacante.id}
        inicial={inicial}
        pasoInicial={llegada?.paso ?? pasoPendiente(vacante)}
        volverA={volverA}
        migas={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección' },
          { label: 'Vacantes', path: RUTA },
          { label: vacante.titulo, path: `${RUTA}/${vacante.id}` },
          { label: 'Terminar y publicar' },
        ]}
        alPublicar={(terminada) => {
          guardarEdicion(vacante, terminada)
          // Quien se agregó al borrador en una etapa con IA recibe ahora su invitación: publicar la suelta (VA-45).
          const salieron = esperasDe(vacante.id)
          cambiarVacantes([vacante], { estado: 'Publicada', oculta: false })
          navigate(`${RUTA}/${vacante.id}`, { state: { publicada: true, invitaciones: salieron } })
        }}
        // Salir sin publicar guarda lo cambiado en el mismo borrador.
        alSalir={(cambiada) => guardarEdicion(vacante, cambiada)}
      />
    )
  return (
    <CreacionVacante
      // La clave cambia con la vacante: si se pasa de editar una a editar otra, el formulario arranca de cero.
      key={vacante.id}
      modo="editar"
      inicial={inicial}
      pasoInicial={llegada?.paso}
      volverA={volverA}
      migas={[
        { label: 'Inicio', path: '/admin' },
        { label: 'Selección' },
        { label: 'Vacantes', path: RUTA },
        { label: vacante.titulo, path: `${RUTA}/${vacante.id}` },
        { label: 'Editar' },
      ]}
      alPublicar={(editada) => {
        guardarEdicion(vacante, editada)
        notify(`Guardamos los cambios de «${vacante.titulo}»`, undefined, 'success')
        navigate(volverA, { state: { editada: true } })
      }}
    />
  )
}
