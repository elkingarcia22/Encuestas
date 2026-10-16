import { useNavigate, useParams } from 'react-router'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { buscarVacante } from './components/data'
import { VacanteView } from './components/vacante-view'

// Selección › Vacantes › detalle de una vacante (/admin/seleccion/vacantes/:id).
// Ids de ejemplo: analista-de-datos, disenadora-de-producto y coordinador-de-turno.
export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vacante = buscarVacante(id)

  // Una vacante que no existe usa el mismo error de sistema que un plan, un usuario o una encuesta
  // (registroQueNoExiste). Antes era un Empty hecho a mano aquí: el mismo caso se veía de dos maneras
  // según la pantalla.
  if (!vacante) {
    return (
      <PageShell>
        <PageHeader back={{ label: 'Volver a vacantes', to: '/admin/seleccion/vacantes' }} title="Vacante" />
        <PageContent>
          <PantallaDeError
            error={registroQueNoExiste('esta vacante', 'Vacantes')}
            onAccion={() => navigate('/admin/seleccion/vacantes')}
          />
        </PageContent>
      </PageShell>
    )
  }

  // La clave reinicia el estado (candidatos, agente, ficha) al pasar de una vacante a otra.
  return <VacanteView key={vacante.id} vacante={vacante} />
}

Component.displayName = 'AdminVacanteDetallePage'
