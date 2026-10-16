import { Navigate } from 'react-router'
import { BASE_LMS } from '../crear-contenido/components/borrador'

// La dirección vieja del roleplay MVP. Los dos roleplays se fusionaron en uno el 5-oct y el paso a paso vive ahora en
// `/agregar-roleplay`; esto queda para que un enlace compartido no muera.
export function Component() {
  return <Navigate to={`${BASE_LMS}/agregar-roleplay`} replace />
}

Component.displayName = 'LmsAgregarRoleplayMvpPage'
