import { useNavigate, useParams } from 'react-router'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { buscarVacante } from '../components/data'
import { ExpedienteView } from './components/expediente-view'

// Selección › Vacantes › :id › candidatos › :candidatoId: el expediente del candidato.
// Ejemplos: /admin/seleccion/vacantes/analista-de-datos/candidatos/laura-mendez (Serena AI) y
// /admin/seleccion/vacantes/ejecutivo-comercial/candidatos/sebastian-vargas (psicométrica y Roleplay).
export function Component() {
  const { id, candidatoId } = useParams()
  const navigate = useNavigate()
  const vacante = buscarVacante(id)

  if (!vacante || !candidatoId) {
    return (
      <PageShell>
        <PageHeader back={{ label: 'Volver a vacantes', to: '/admin/seleccion/vacantes' }} title="Candidato" />
        <PageContent>
          <PantallaDeError error={registroQueNoExiste('esta vacante', 'Vacantes')} onAccion={() => navigate('/admin/seleccion/vacantes')} />
        </PageContent>
      </PageShell>
    )
  }

  return <ExpedienteView vacante={vacante} candidatoId={candidatoId} />
}

Component.displayName = 'AdminCandidatoExpedientePage'
